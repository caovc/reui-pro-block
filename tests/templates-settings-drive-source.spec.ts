import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { join, posix } from "node:path";
import { createHash } from "node:crypto";
import { unzipSync, strFromU8 } from "fflate";
import ts from "typescript";

function imports(filename: string, source: string): string[] {
  if (filename.endsWith(".css")) {
    return [...source.matchAll(/(?:url\(\s*|@import\s*)["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
  }
  const targets: string[] = [];
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    )
      targets.push(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    )
      targets.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return targets;
}

for (const id of ["tempo", "mesh", "filespace", "filebox"]) {
  test(`${id} actual source choices, Copy, single file and project download match the native Settings/layout`, async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/templates/${id}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "View template source", exact: true }).click();
    const workflow = id === "tempo" || id === "mesh";
    const modules = workflow
      ? [
          "src/templates/workflow/workflow-account-settings.tsx",
          "src/templates/workflow/workflow-account-menu.tsx",
        ]
      : ["src/templates/collaboration/drive-layout.tsx"];
    const selected = new Map<string, string>();
    for (const path of modules) {
      const choice = page.getByRole("combobox", { name: "Template source file", exact: true });
      await choice.click();
      await page.getByRole("option", { name: path, exact: true }).click();
      const expected = await readFile(join(process.cwd(), path), "utf8");
      expect(await page.locator(".template-source-code").textContent()).toBe(expected);
      await page.getByRole("button", { name: "Copy", exact: true }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
      const singlePending = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download template source file", exact: true })
        .click();
      const single = await singlePending;
      expect(await readFile((await single.path())!, "utf8")).toBe(expected);
      await single.saveAs(testInfo.outputPath(`${id}-${path.split("/").at(-1)}`));
      selected.set(path, expected);
    }
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download project", exact: true }).click();
    const download = await pending;
    const bytes = await readFile((await download.path())!);
    const files = unzipSync(new Uint8Array(bytes));
    const required = [
      "src/components/reui/sidebar.tsx",
      "src/components/ui/sidebar.tsx",
      "src/components/reui/layout.tsx",
      "src/blocks/reference.css",
      ...(workflow
        ? [
            "src/templates/workflow/workflow-shell.tsx",
            "src/templates/workflow/workflow-account-settings-data.ts",
            "src/templates/workflow/workflow-account-settings.css",
            "src/templates/workflow/workflow-account-menu.css",
            "src/templates/workflow/shared.tsx",
            "src/templates/workflow/controls.tsx",
            "src/blocks/application/dialog-variants/workspace/settings-panel.tsx",
            "src/blocks/application/dialog-variants/workspace/free/avatar-upload.tsx",
            "src/components/ui/chart.tsx",
          ]
        : [
            "src/templates/collaboration/drive.tsx",
            "src/templates/collaboration/drive-native-layout.css",
            "src/components/ui/toggle-group.tsx",
            "src/components/ui/item.tsx",
          ]),
    ];
    for (const [path, expected] of selected) expect(strFromU8(files[path]), path).toBe(expected);
    for (const path of required)
      expect(strFromU8(files[path]), path).toBe(await readFile(join(process.cwd(), path), "utf8"));
    for (const license of [
      "src/components/reui/REUI-LICENSE.txt",
      "src/blocks/assets/Inter-LICENSE.txt",
    ])
      expect(files[license], license).toBeTruthy();
    expect(Object.keys(files).some((path) => path.endsWith(".woff2"))).toBe(true);
    const missing: string[] = [];
    for (const [filename, content] of Object.entries(files)) {
      if (!/\.(?:tsx?|css)$/.test(filename)) continue;
      for (const target of imports(filename, strFromU8(content))) {
        if (!target.startsWith("@/") && !target.startsWith(".")) continue;
        const path = target.startsWith("@/")
          ? `src/${target.slice(2)}`
          : posix.normalize(posix.join(posix.dirname(filename), target));
        if (
          ![
            path,
            `${path}.tsx`,
            `${path}.ts`,
            `${path}.css`,
            `${path}.json`,
            `${path}/index.tsx`,
            `${path}/index.ts`,
          ].some((file) => files[file])
        )
          missing.push(`${filename} imports ${target}`);
      }
    }
    expect(missing).toEqual([]);
    const archive = testInfo.outputPath(`${id}-settings-drive.zip`);
    await download.saveAs(archive);
    await writeFile(
      testInfo.outputPath("source-proof.json"),
      JSON.stringify(
        {
          id,
          archive,
          fileCount: Object.keys(files).length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          selected: [...selected.keys()],
          required,
          missingLocalImports: missing,
        },
        null,
        2,
      ),
    );
  });
}
