import { expect, test } from "@playwright/test";
import { basename } from "node:path";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { strFromU8 } from "fflate";
import {
  captureOriginalArchive,
  fileBytes,
  hash,
  openSource,
  selectSource,
  sourceText,
  verifyOriginalClosure,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const editorEntry = "src/blocks/application/editor.tsx";
const toolbar = "src/blocks/application/rich-text-toolbar.tsx";
const requiredFiles = [
  editorEntry,
  toolbar,
  "src/blocks/application/editor.css",
  "src/blocks/application/rich-text-engine.ts",
  "src/blocks/application/rich-text-block-actions.tsx",
  "src/blocks/application/rich-text-task-item.tsx",
  "src/blocks/application/rich-text-selection.ts",
  "src/blocks/application/rich-text-contents.tsx",
  "src/blocks/application/rich-text-suggestion.ts",
  "src/components/reui/frame.tsx",
  "src/components/reui/color-picker.tsx",
  "src/components/reui/scrollspy.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/button-group.tsx",
  "src/components/ui/checkbox.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/separator.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/popover.tsx",
  "src/components/ui/tooltip.tsx",
  "src/components/reui/REUI-LICENSE.txt",
] as const;

const documentTarget: SourceTarget = {
  id: "rich-text-editor-1",
  kind: "block",
  name: "Document Editor",
  route: "/#/block/application/rich-text-editor/rich-text-editor-1",
  defaultPath: editorEntry,
  selectedPath: toolbar,
  requiredFiles,
};

// Keep both cases within the existing 30s budget; runner owns workers and retries.
test.setTimeout(30_000);

test("Document defaults to editor.tsx and exposes exact toolbar view, Copy and single-file bytes", async ({
  page,
  context,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const expectedDefault = await fileBytes(editorEntry);
  const expectedToolbar = await fileBytes(toolbar);
  const { opener, dialog, choice } = await openSource(page, documentTarget, "file");
  const defaultCode = dialog.locator(".source-code");
  await expect
    .poll(() => sourceText(defaultCode, documentTarget))
    .toBe(expectedDefault.toString("utf8"));
  const defaultView = Buffer.from(await sourceText(defaultCode, documentTarget), "utf8");
  expect(defaultView).toEqual(expectedDefault);

  const code = await selectSource(page, documentTarget, dialog, choice);
  await expect.poll(() => sourceText(code, documentTarget)).toBe(expectedToolbar.toString("utf8"));
  const viewed = Buffer.from(await sourceText(code, documentTarget), "utf8");
  expect(viewed).toEqual(expectedToolbar);
  await code.getByRole("button", { name: "Copy", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(expectedToolbar.toString("utf8"));
  const copied = Buffer.from(await page.evaluate(() => navigator.clipboard.readText()), "utf8");
  expect(copied).toEqual(expectedToolbar);

  const pending = page.waitForEvent("download");
  await code.getByRole("button", { name: "Download source file", exact: true }).click();
  const download = await pending;
  const artifact = info.outputPath(basename(toolbar));
  await download.saveAs(artifact);
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe(basename(toolbar));
  const downloaded = await readFile(artifact);
  expect(downloaded).toEqual(expectedToolbar);
  expect(await fileBytes(editorEntry)).toEqual(expectedDefault);
  expect(await fileBytes(toolbar)).toEqual(expectedToolbar);
  await writeFile(
    info.outputPath("changed-source-proof.json"),
    JSON.stringify(
      {
        id: documentTarget.id,
        defaultPath: editorEntry,
        selectedPath: toolbar,
        defaultOriginalSHA256: hash(expectedDefault),
        defaultViewSHA256: hash(defaultView),
        originalSHA256: hash(expectedToolbar),
        viewSHA256: hash(viewed),
        clipboardSHA256: hash(copied),
        singleFileSHA256: hash(downloaded),
        artifact,
      },
      null,
      2,
    ) + "\n",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(faults).toEqual([]);
});

test("Document actual original starter retains its current toolbar, native closure and licenses", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const frozen = new Map(
    await Promise.all(
      requiredFiles.map(async (filename) => [filename, await fileBytes(filename)] as const),
    ),
  );
  const { dialog } = await openSource(page, documentTarget, "archive");
  const { files, archivePath, archiveBytes } = await captureOriginalArchive(
    page,
    documentTarget,
    dialog,
    info,
  );
  for (const [filename, expected] of frozen) {
    expect(files[filename], filename).toBeDefined();
    expect(Buffer.from(files[filename]!)).toEqual(expected);
    expect(await fileBytes(filename)).toEqual(expected);
  }
  await verifyOriginalClosure(documentTarget, files, info);
  const packageManifest = JSON.parse(strFromU8(files["package.json"]!));
  const currentPackage = JSON.parse((await fileBytes("package.json")).toString("utf8"));
  for (const dependency of [
    "@tiptap/core",
    "@tiptap/react",
    "@tiptap/pm",
    "@tiptap/extension-table",
  ]) {
    expect(currentPackage.dependencies[dependency]).toBeTruthy();
    expect(packageManifest.dependencies[dependency]).toBe(currentPackage.dependencies[dependency]);
  }
  if (files["src/blocks/application/whiteboard-engine.tsx"]) {
    expect(packageManifest.scripts.postinstall).toBe("node scripts/copy-excalidraw-assets.mjs");
  }
  if (packageManifest.scripts.postinstall) {
    expect(packageManifest.scripts.postinstall).toBe("node scripts/copy-excalidraw-assets.mjs");
    const script = "scripts/copy-excalidraw-assets.mjs";
    expect(files[script]).toBeDefined();
    expect(Buffer.from(files[script]!)).toEqual(await fileBytes(script));
    const directory = "src/blocks/application/assets/excalidraw";
    const notices = (await readdir(directory)).filter((filename) => /\.(?:md|txt)$/.test(filename));
    expect(notices.length).toBeGreaterThan(0);
    for (const filename of notices) {
      const source = `${directory}/${filename}`;
      expect(files[source], source).toBeDefined();
      expect(Buffer.from(files[source]!)).toEqual(await fileBytes(source));
    }
  }
  expect(await readFile(archivePath)).toEqual(archiveBytes);
  expect(faults).toEqual([]);
});
