import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { posix } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import ts from "typescript";

const examples = [
  {
    id: "flowly",
    implementation: "src/templates/workflow/flowly.tsx",
    reused: "src/blocks/application/flow-gantt-flow.tsx",
  },
  {
    id: "atlas",
    implementation: "src/templates/business/atlas.tsx",
    reused: "src/blocks/data/reui-free-chart-primitives.tsx",
  },
  {
    id: "pulse",
    implementation: "src/templates/collaboration/pulse.tsx",
    reused: "src/blocks/data/grid-advanced-model-grid.tsx",
  },
];

function localImports(filename: string, source: string): string[] {
  if (filename.endsWith(".css")) {
    return [...source.matchAll(/(?:url\(\s*|@import\s*)["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
  }
  const imports: string[] = [];
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      imports.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return imports;
}

for (const example of examples) {
  test(`${example.id} source export includes reused Pro Blocks and their complete local dependencies`, async ({
    page,
  }) => {
    await page.goto(`/#/templates/${example.id}`);
    await page.getByRole("button", { name: "View template source" }).click();
    await expect(page.getByRole("combobox", { name: "Template source file" })).toContainText(
      example.implementation,
    );
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download project", exact: true }).click();
    const download = await pending;
    const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
    expect(
      files[example.reused],
      "the reused implementation must ship in the actual ZIP",
    ).toBeTruthy();
    expect(files["src/components/reui/REUI-LICENSE.txt"]).toBeTruthy();

    const missing: string[] = [];
    for (const [filename, bytes] of Object.entries(files)) {
      if (!/\.(?:tsx?|css)$/.test(filename)) continue;
      for (const target of localImports(filename, strFromU8(bytes))) {
        if (!target.startsWith("@/") && !target.startsWith(".")) continue;
        const path = target.startsWith("@/")
          ? `src/${target.slice(2)}`
          : posix.normalize(posix.join(posix.dirname(filename), target));
        const candidates = [
          path,
          `${path}.tsx`,
          `${path}.ts`,
          `${path}.css`,
          `${path}.json`,
          `${path}/index.tsx`,
          `${path}/index.ts`,
        ];
        if (!candidates.some((candidate) => files[candidate])) {
          missing.push(`${filename} imports ${target}`);
        }
      }
    }
    expect(
      missing,
      "each real local dependency must resolve inside the downloaded project",
    ).toEqual([]);
  });
}
