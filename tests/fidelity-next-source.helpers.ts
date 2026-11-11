// Native-flow adapters extracted from existing Advanced15 and Template settings
// source tests. Actual free CodeBlock/Select/clipboard/download UI remains in control.
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import { createRequire, builtinModules } from "node:module";
import { readFile, writeFile, access, readdir } from "node:fs/promises";
import { basename, posix, resolve } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import ts from "typescript";
import postcss from "postcss";

const require = createRequire(import.meta.url);
const { cssImportTargets } = require("./fidelity-source-css.cjs") as {
  cssImportTargets: (source: string, filename: string, parser: typeof postcss) => string[];
};

export type SourceTarget = {
  id: string;
  kind: "block" | "template";
  name: string;
  family?: "business" | "workflow" | "collaboration";
  route: string;
  defaultPath: string;
  selectedPath: string;
  requiredFiles: readonly string[];
};

export const fileBytes = (filename: string) => readFile(resolve(process.cwd(), filename));
export const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

async function assertOriginalSourceDefault(dialog: Locator, target: SourceTarget) {
  await expect(dialog).toBeVisible();
  if (target.kind === "block") {
    await expect(dialog.getByRole("region", { name: "Block source", exact: true })).toBeVisible();
  }
  await expect(
    dialog.getByRole("combobox", {
      name: target.kind === "block" ? "Source file" : "Template source file",
      exact: true,
    }),
  ).toHaveText(target.defaultPath);
}

export async function openSource(
  page: Page,
  target: SourceTarget,
  purpose: "file" | "archive" = "file",
) {
  await page.goto(target.route, { waitUntil: "networkidle" });
  const opener = page.getByRole("button", {
    name: target.kind === "block" ? "View code" : "View template source",
    exact: true,
  });
  await opener.click();
  const dialog =
    target.kind === "block"
      ? page.getByRole("dialog")
      : page.getByRole("dialog", { name: `${target.name} source`, exact: true });
  const choice = dialog.getByRole("combobox", {
    name: target.kind === "block" ? "Source file" : "Template source file",
    exact: true,
  });
  if (purpose === "file") {
    // Let the first real native action own readiness under the unchanged case
    // budget, then verify the actual popup, close lifecycle and original default.
    await choice.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(listbox).toHaveCount(0);
    await expect(choice).toBeFocused();
    await assertOriginalSourceDefault(dialog, target);
  }
  // Archive callers first use the actual Download button; captureOriginalArchive
  // checks the same original default only after that real download succeeds.
  return { opener, dialog, choice };
}

export async function selectSource(
  page: Page,
  target: SourceTarget,
  dialog: Locator,
  choice: Locator,
) {
  if (target.selectedPath !== target.defaultPath) {
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await choice.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await listbox.getByRole("option", { name: target.selectedPath, exact: true }).click();
    await expect(listbox).toHaveCount(0);
    await expect(choice).toHaveAttribute("aria-expanded", "false");
    await expect(choice).toBeFocused();
  }
  await expect(choice).toHaveText(target.selectedPath);
  const code = target.kind === "block" ? dialog.locator(".source-code") : dialog;
  return code;
}

export async function sourceText(code: Locator, target: SourceTarget) {
  if (target.kind === "template") {
    return (
      (await code
        .locator('code[data-slot="code-block-code"].template-source-code')
        .textContent()) ?? ""
    );
  }
  // Existing Advanced15/Advanced16/source-copy-feedback oracle: real line-content
  // spans exclude toolbar labels and preserve blank/trailing LF source lines.
  return (await code.locator('[data-slot="code-block-line-content"]').allTextContents()).join("\n");
}

export async function captureOriginalArchive(
  page: Page,
  target: SourceTarget,
  dialog: Locator,
  info: TestInfo,
) {
  const pending = page.waitForEvent("download");
  await dialog
    .getByRole("button", {
      name: target.kind === "block" ? "Download starter" : "Download project",
      exact: true,
    })
    .click();
  const download = await pending;
  const archivePath = info.outputPath(`${target.id}-original-project.zip`);
  // Save before asserting or inspecting: preserve the actual first failed download.
  await download.saveAs(archivePath);
  expect(await download.failure()).toBeNull();
  await assertOriginalSourceDefault(dialog, target);
  expect(download.suggestedFilename()).toBe(
    `${target.id}${target.kind === "template" ? "-template" : ""}.zip`,
  );
  const archiveBytes = await readFile(archivePath);
  const files = unzipSync(new Uint8Array(archiveBytes));
  const members = Object.entries(files).map(([path, bytes]) => ({
    path,
    bytes: bytes.length,
    sha256: hash(bytes),
  }));
  await writeFile(
    info.outputPath("original-archive-inventory.json"),
    JSON.stringify(
      {
        archivePath,
        sha256: hash(archiveBytes),
        members,
      },
      null,
      2,
    ) + "\n",
  );
  for (const filename of Object.keys(files)) {
    expect(filename.startsWith("/") || /^[A-Za-z]:/.test(filename), filename).toBe(false);
    expect(filename.includes("\\") || filename.includes("\0"), filename).toBe(false);
    expect(filename.split("/").includes(".."), filename).toBe(false);
  }
  return { archivePath, archiveBytes, files };
}

function imports(filename: string, source: string) {
  if (filename.endsWith(".css")) return cssImportTargets(source, filename, postcss);
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const parseDiagnostics = (tree as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
    .parseDiagnostics;
  expect(parseDiagnostics, filename).toEqual([]);
  const targets: string[] = [];
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      targets.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      targets.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return targets;
}

export async function verifyOriginalClosure(
  target: SourceTarget,
  files: Record<string, Uint8Array>,
  info: TestInfo,
  primitive: "base" | "radix" = "radix",
) {
  async function expectedBytes(filename: string) {
    const ui = "src/components/ui/";
    if (primitive === "base" && filename.startsWith(ui)) {
      const basePath = `src/foundations/base/ui/${filename.slice(ui.length)}`;
      if (
        await access(resolve(process.cwd(), basePath)).then(
          () => true,
          () => false,
        )
      ) {
        return fileBytes(basePath);
      }
    }
    return fileBytes(filename);
  }
  const generated = new Set(["src/Example.tsx", "src/main.tsx", "src/theme.css"]);
  const verified: { path: string; sha256: string }[] = [];
  for (const [filename, bytes] of Object.entries(files)) {
    if (
      !filename.startsWith("src/") ||
      generated.has(filename) ||
      !/\.(?:[cm]?[jt]sx?|css|json)$/.test(filename)
    )
      continue;
    expect(Buffer.from(bytes), `${filename}: actual native/family source bytes`).toEqual(
      await expectedBytes(filename),
    );
    verified.push({ path: filename, sha256: hash(bytes) });
  }
  for (const filename of target.requiredFiles) {
    expect(files[filename], `${filename}: changed/default/native implementation`).toBeDefined();
    expect(Buffer.from(files[filename]!), filename).toEqual(await expectedBytes(filename));
  }
  const notices = [
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "src/components/reui/REUI-LICENSE.txt",
    "src/blocks/assets/Inter-LICENSE.txt",
    "src/blocks/assets/inter-latin-variable.woff2",
  ];
  if (files["src/templates/collaboration/drive-settings-free/phone-input.tsx"]) {
    notices.push("src/templates/collaboration/assets/drive-phone-LICENSES.txt");
  }
  for (const filename of notices) {
    expect(files[filename], `${filename}: actual original notice/font`).toBeDefined();
    expect(Buffer.from(files[filename]!), filename).toEqual(await fileBytes(filename));
  }
  expect(strFromU8(files["src/components/reui/REUI-LICENSE.txt"]!)).toContain("MIT License");
  expect(strFromU8(files["src/blocks/assets/Inter-LICENSE.txt"]!)).toContain(
    "SIL OPEN FONT LICENSE",
  );
  // Existing authored media notices are retained; no blanket JPEG prohibition.
  const attributionFiles = Object.keys(files).filter((name) =>
    /(?:ATTRIBUTION|LICENSES?|NOTICES|provenance).*\.(?:md|txt)$/i.test(basename(name)),
  );
  for (const filename of attributionFiles) {
    expect(Buffer.from(files[filename]!), `${filename}: original attribution bytes`).toEqual(
      await fileBytes(filename),
    );
  }
  const mediaFiles = Object.keys(files).filter((name) =>
    /\.(?:jpe?g|png|webp|svg|woff2?)$/i.test(name),
  );
  const mediaNotes = new Set<string>();
  for (const filename of mediaFiles) {
    // Vite may serialize SVG XML differently; original ZIP asset SHA is inventoried
    // for root's separate received-project audit. Other original binary media stay raw.
    if (!filename.endsWith(".svg")) {
      expect(Buffer.from(files[filename]!), `${filename}: original binary media bytes`).toEqual(
        await fileBytes(filename),
      );
    }
    const note = `${posix.dirname(filename)}/ATTRIBUTION.md`;
    const exists = await access(resolve(process.cwd(), note)).then(
      () => true,
      () => false,
    );
    if (exists) {
      expect(files[note], `${filename}: existing media attribution retained`).toBeDefined();
      expect(Buffer.from(files[note]!), note).toEqual(await fileBytes(note));
      mediaNotes.add(note);
    }
  }
  const originalPackage = JSON.parse((await fileBytes("package.json")).toString("utf8"));
  const packageManifest = JSON.parse(strFromU8(files["package.json"]!));
  expect(packageManifest.dependencies).toEqual(originalPackage.dependencies);
  expect(packageManifest.overrides).toEqual(originalPackage.overrides);
  const devNames = [
    "vite",
    "@vitejs/plugin-react",
    "@types/node",
    "typescript",
    "@types/react",
    "@types/react-dom",
  ];
  expect(packageManifest.devDependencies).toEqual(
    target.kind === "template"
      ? originalPackage.devDependencies
      : Object.fromEntries(devNames.map((name) => [name, originalPackage.devDependencies[name]])),
  );
  if (target.id === "mesh") {
    expect(packageManifest.scripts.postinstall).toBe("node scripts/copy-excalidraw-assets.mjs");
    const script = "scripts/copy-excalidraw-assets.mjs";
    expect(files[script], "Mesh original normal-install asset preparation script").toBeDefined();
    expect(Buffer.from(files[script]!)).toEqual(await fileBytes(script));
    const noticeDirectory = "src/blocks/application/assets/excalidraw";
    const engineNotices = (await readdir(resolve(process.cwd(), noticeDirectory))).filter((name) =>
      /\.(?:md|txt)$/.test(name),
    );
    expect(engineNotices.length).toBeGreaterThan(0);
    for (const filename of engineNotices) {
      const full = `${noticeDirectory}/${filename}`;
      expect(
        files[full],
        `${full}: original engine/font license needed by postinstall`,
      ).toBeDefined();
      expect(Buffer.from(files[full]!)).toEqual(await fileBytes(full));
    }
    expect(packageManifest.dependencies["@excalidraw/excalidraw"]).toBe(
      originalPackage.dependencies["@excalidraw/excalidraw"],
    );
  }
  const mode = primitive === "base" ? " --mode base-ui" : "";
  expect(packageManifest.scripts.build).toBe(`tsc --noEmit && vite build${mode}`);
  const config = JSON.parse(strFromU8(files["tsconfig.json"]!));
  expect(config.compilerOptions.strict).toBe(true);
  expect(config.compilerOptions.moduleResolution).toBe("bundler");
  if (target.kind === "block") {
    expect(config.compilerOptions.allowImportingTsExtensions).toBe(true);
    expect(config.compilerOptions.noEmit).toBe(true);
  }
  const example = strFromU8(files["src/Example.tsx"]!);
  expect(example).toContain(target.id);
  if (target.kind === "template") {
    expect(example).toContain(`import Template from '@/templates/${target.family}'`);
    expect(example).toContain(`<TemplateSurface id="${target.id}">`);
    expect(example).toContain(`<Template id="${target.id}" />`);
  }
  const names = new Set(Object.keys(files));
  const builtin = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
  const declared = new Set([
    ...Object.keys(packageManifest.dependencies),
    ...Object.keys(packageManifest.devDependencies),
  ]);
  const missing: string[] = [];
  const undeclared: string[] = [];
  let localEdges = 0;
  for (const [filename, bytes] of Object.entries(files)) {
    if (!/\.(?:[cm]?[jt]sx?|css)$/.test(filename)) continue;
    for (const dependency of imports(filename, strFromU8(bytes))) {
      if (/^(?:https?:|data:|#)/.test(dependency)) continue;
      if (!dependency.startsWith("@/") && !dependency.startsWith(".")) {
        const name = dependency.startsWith("@")
          ? dependency.split("/").slice(0, 2).join("/")
          : dependency.split("/")[0];
        if (!declared.has(name) && !builtin.has(dependency))
          undeclared.push(`${filename}: ${dependency}`);
        continue;
      }
      const clean = dependency.split(/[?#]/, 1)[0];
      const base = clean.startsWith("@/")
        ? `src/${clean.slice(2)}`
        : posix.normalize(posix.join(posix.dirname(filename), clean));
      const found = [
        base,
        `${base}.tsx`,
        `${base}.ts`,
        `${base}.css`,
        `${base}.json`,
        `${base}/index.tsx`,
        `${base}/index.ts`,
      ].some((name) => names.has(name));
      if (!found) missing.push(`${filename}: ${dependency}`);
      else localEdges += 1;
    }
  }
  expect(missing, "actual ZIP complete local import/asset closure").toEqual([]);
  expect(undeclared, "actual ZIP complete declared package closure").toEqual([]);
  await writeFile(
    info.outputPath("source-closure-proof.json"),
    JSON.stringify(
      {
        id: target.id,
        defaultPath: target.defaultPath,
        selectedPath: target.selectedPath,
        verified,
        localEdges,
        missing,
        undeclared,
        notices,
        attributionFiles,
        mediaFiles,
        mediaNotes: [...mediaNotes],
        originalEntryModified: false,
        originalStrictBuildOrRuntimeVerified: false,
      },
      null,
      2,
    ) + "\n",
  );
}
