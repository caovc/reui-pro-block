import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import {
  captureOriginalArchive,
  openSource,
  selectSource,
  sourceText,
  verifyOriginalClosure,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const documentRoute = "/#/block/application/rich-text-editor/rich-text-editor-1";
const editorEntry = "src/blocks/application/editor.tsx";
const supporting = [
  "src/blocks/application/rich-text-toolbar.tsx",
  "src/blocks/application/rich-text-task-item.tsx",
];
const closure = [
  editorEntry,
  ...supporting,
  "src/blocks/application/editor.css",
  "src/blocks/application/rich-text-engine.ts",
  "src/blocks/application/rich-text-selection.ts",
  "src/blocks/application/rich-text-contents.tsx",
  "src/blocks/application/rich-text-suggestion.ts",
  "src/components/reui/frame.tsx",
  "src/components/reui/color-picker.tsx",
  "src/components/reui/scrollspy.tsx",
  "src/components/ui/checkbox.tsx",
  "src/components/reui/REUI-LICENSE.txt",
];
const documentTarget: SourceTarget = {
  id: "rich-text-editor-1",
  kind: "block",
  name: "Document Editor",
  route: documentRoute,
  defaultPath: editorEntry,
  selectedPath: editorEntry,
  requiredFiles: closure,
};

for (const primitive of ["radix", "base"] as const) {
  test(`AI Writing Assistant exposes and downloads its implementation for ${primitive}`, async ({
    page,
  }, info) => {
    const implementation = "src/blocks/application/rich-text-assistant.tsx";
    const plan = "src/blocks/application/rich-text-assistant-plan.ts";
    const target: SourceTarget = {
      ...documentTarget,
      id: "rich-text-editor-5",
      name: "AI Writing Assistant",
      route: `./${primitive === "base" ? "base/" : ""}#/block/application/rich-text-editor/rich-text-editor-5`,
      selectedPath: implementation,
      requiredFiles: [...closure, implementation, plan],
    };
    const { dialog, choice } = await openSource(page, target, "archive");
    const { files } = await captureOriginalArchive(page, target, dialog, info);
    const code = await selectSource(page, target, dialog, choice);
    const assistant = await readFile(implementation, "utf8");
    await expect.poll(() => sourceText(code, target)).toBe(assistant);
    expect(strFromU8(files[implementation])).toBe(assistant);
    expect(strFromU8(files[plan])).toBe(await readFile(plan, "utf8"));
    expect(JSON.parse(strFromU8(files["components.json"])).style).toBe(`${primitive}-nova`);
  });
}

const meshTarget: SourceTarget = {
  id: "mesh",
  kind: "template",
  name: "Mesh",
  family: "workflow",
  route: "/#/templates/mesh",
  defaultPath: "src/templates/workflow/mesh.tsx",
  selectedPath: "src/templates/workflow/mesh.tsx",
  requiredFiles: closure,
};

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

async function openDocumentSource(page: Page, purpose: "file" | "archive" = "file") {
  const { dialog } = await openSource(page, documentTarget, purpose);
  if (purpose === "file") {
    await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      editorEntry,
    );
  }
  return dialog;
}

async function retainArchive(
  page: Page,
  info: TestInfo,
  trigger: string,
  filename: string,
  target: SourceTarget,
) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: trigger, exact: true }).click();
  const download = await pending;
  const archive = info.outputPath(filename);
  await download.saveAs(archive);
  expect(await download.failure()).toBeNull();
  await expect(
    page.getByRole("dialog").getByRole("combobox", {
      name: target.kind === "block" ? "Source file" : "Template source file",
      exact: true,
    }),
  ).toHaveText(target.defaultPath);
  const zip = unzipSync(new Uint8Array(await readFile(archive)));
  const members = Object.fromEntries(
    Object.entries(zip).map(([path, bytes]) => [
      path,
      {
        bytes: bytes.length,
        sha256: sha256(bytes),
      },
    ]),
  );
  await writeFile(info.outputPath(`${filename}.members.json`), JSON.stringify(members, null, 2));
  for (const path of closure) {
    expect(zip[path], path).toBeTruthy();
    expect(strFromU8(zip[path]), path).toBe(await readFile(join(process.cwd(), path), "utf8"));
  }
  await verifyOriginalClosure(target, zip, info);
  const pkg = JSON.parse(strFromU8(zip["package.json"]));
  expect(pkg.dependencies["@tiptap/react"]).toBeTruthy();
  expect(pkg.dependencies["@tiptap/extension-table"]).toBeTruthy();
  expect(pkg.scripts.build).toContain("tsc");
  expect(pkg.scripts.build).toContain("vite build");
  if (zip["src/blocks/application/whiteboard-engine.tsx"]) {
    expect(pkg.scripts.postinstall).toBe("node scripts/copy-excalidraw-assets.mjs");
    expect(strFromU8(zip["scripts/copy-excalidraw-assets.mjs"])).toBe(
      await readFile("scripts/copy-excalidraw-assets.mjs", "utf8"),
    );
  }
  return zip;
}

test("Document default implementation, clipboard and single-file download agree", async ({
  page,
  context,
}, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const dialog = await openDocumentSource(page);
  const expected = await readFile(editorEntry, "utf8");
  const source = dialog.locator(".source-code");
  await source
    .locator('[data-slot="code-block-line-content"]')
    .first()
    .waitFor({ state: "attached" });
  await expect.poll(() => sourceText(source, documentTarget)).toBe(expected);
  await source.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  const pending = page.waitForEvent("download");
  await source.getByRole("button", { name: "Download source file", exact: true }).click();
  const download = await pending;
  const savedFile = info.outputPath("editor-source.tsx");
  await download.saveAs(savedFile);
  expect(await download.failure()).toBeNull();
  expect(await readFile(savedFile, "utf8")).toBe(expected);
});

test("Document toolbar and task view source choices expose their full implementations", async ({
  page,
  context,
}, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const dialog = await openDocumentSource(page);
  for (const path of supporting) {
    await dialog.getByRole("combobox", { name: "Source file", exact: true }).click();
    await page.getByRole("option", { name: path, exact: true }).click();
    const source = dialog.locator(".source-code");
    const expected = await readFile(path, "utf8");
    await source
      .locator('[data-slot="code-block-line-content"]')
      .first()
      .waitFor({ state: "attached" });
    await expect.poll(() => sourceText(source, documentTarget)).toBe(expected);
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const pending = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    const download = await pending;
    const savedFile = info.outputPath(path.split("/").at(-1)!);
    await download.saveAs(savedFile);
    expect(await download.failure()).toBeNull();
    expect(await readFile(savedFile, "utf8")).toBe(expected);
  }
});

test("actual Document starter retains the native editor and free ReUI closure", async ({
  page,
}, info) => {
  await openDocumentSource(page, "archive");
  const zip = await retainArchive(
    page,
    info,
    "Download starter",
    "document-original.zip",
    documentTarget,
  );
  expect(strFromU8(zip["src/Example.tsx"])).toContain("rich-text-editor-1");
});

test("actual Mesh project retains the final editor source and drawing asset preparation", async ({
  page,
}, info) => {
  await openSource(page, meshTarget, "archive");
  const zip = await retainArchive(page, info, "Download project", "mesh-original.zip", meshTarget);
  await expect(
    page.getByRole("combobox", { name: "Template source file", exact: true }),
  ).toHaveText("src/templates/workflow/mesh.tsx");
  for (const path of [
    "src/templates/workflow/mesh.tsx",
    "src/templates/workflow/mesh-documents.tsx",
    "src/templates/workflow/mesh-canvas.tsx",
    "src/blocks/application/whiteboard-engine.tsx",
  ])
    expect(strFromU8(zip[path]), path).toBe(await readFile(path, "utf8"));
});
