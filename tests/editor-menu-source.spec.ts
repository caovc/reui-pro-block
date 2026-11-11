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
const implementationPaths = [
  "src/blocks/application/rich-text-insert-menu.tsx",
  "src/blocks/application/rich-text-suggestion.ts",
  "src/blocks/application/rich-text-block-actions.tsx",
  "src/blocks/application/editor.css",
  "src/blocks/application/rich-text-collaboration.ts",
  "src/blocks/application/rich-text-discussion.tsx",
] as const;
const requiredFiles = [
  editorEntry,
  ...implementationPaths,
  "src/blocks/application/index.tsx",
  "src/blocks/application/rich-text-engine.ts",
  "src/blocks/application/rich-text-toolbar.tsx",
  "src/blocks/application/rich-text-revisions.ts",
  "src/blocks/application/rich-text-task-item.tsx",
  "src/blocks/application/rich-text-selection.ts",
  "src/blocks/application/rich-text-contents.tsx",
  "src/components/reui/frame.tsx",
  "src/components/reui/color-picker.tsx",
  "src/components/reui/scrollspy.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/button-group.tsx",
  "src/components/ui/command.tsx",
  "src/components/ui/checkbox.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/separator.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/popover.tsx",
  "src/components/ui/tooltip.tsx",
  "src/components/reui/REUI-LICENSE.txt",
] as const;

const collaborativeTarget: SourceTarget = {
  id: "rich-text-editor-4",
  kind: "block",
  name: "Collaborative Editor",
  route: "/#/block/application/rich-text-editor/rich-text-editor-4",
  defaultPath: editorEntry,
  selectedPath: editorEntry,
  requiredFiles,
};

test.setTimeout(30_000);

for (const selectedPath of implementationPaths) {
  const target: SourceTarget = { ...collaborativeTarget, selectedPath };
  test(`Collaborative kind4 source ${basename(selectedPath)}: default view and exact view, Copy and single-file bytes`, async ({
    page,
    context,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const expectedDefault = await fileBytes(editorEntry);
    const expected = await fileBytes(selectedPath);
    const { opener, dialog, choice } = await openSource(page, target, "file");
    const defaultCode = dialog.locator(".source-code");
    await expect.poll(() => sourceText(defaultCode, target)).toBe(expectedDefault.toString("utf8"));
    const defaultView = Buffer.from(await sourceText(defaultCode, target), "utf8");
    expect(defaultView).toEqual(expectedDefault);

    const code = await selectSource(page, target, dialog, choice);
    await expect.poll(() => sourceText(code, target)).toBe(expected.toString("utf8"));
    const viewed = Buffer.from(await sourceText(code, target), "utf8");
    expect(viewed).toEqual(expected);
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected.toString("utf8"));
    const copied = Buffer.from(await page.evaluate(() => navigator.clipboard.readText()), "utf8");
    expect(copied).toEqual(expected);

    const pending = page.waitForEvent("download");
    await code.getByRole("button", { name: "Download source file", exact: true }).click();
    const download = await pending;
    const artifact = info.outputPath(basename(selectedPath));
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(editorEntry)).toEqual(expectedDefault);
    expect(await fileBytes(selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("editor-menu-source-proof.json"),
      JSON.stringify(
        {
          id: target.id,
          defaultPath: editorEntry,
          selectedPath,
          defaultOriginalSHA256: hash(expectedDefault),
          defaultViewSHA256: hash(defaultView),
          originalSHA256: hash(expected),
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
}

test("Collaborative kind4 actual original starter preserves the changed editor modules, native wrapper and licensed closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const frozen = new Map(
    await Promise.all(
      requiredFiles.map(async (filename) => [filename, await fileBytes(filename)] as const),
    ),
  );
  const { dialog } = await openSource(page, collaborativeTarget, "archive");
  const { files, archivePath, archiveBytes } = await captureOriginalArchive(
    page,
    collaborativeTarget,
    dialog,
    info,
  );
  for (const [filename, expected] of frozen) {
    expect(files[filename], filename).toBeDefined();
    expect(Buffer.from(files[filename]!)).toEqual(expected);
    expect(await fileBytes(filename)).toEqual(expected);
  }
  await verifyOriginalClosure(collaborativeTarget, files, info);
  const example = strFromU8(files["src/Example.tsx"]!);
  expect(example).toContain("import ApplicationBlock from '@/blocks/application'");
  expect(example).toContain("<ApplicationBlock block={block} />");
  expect(example).toContain('"id": "rich-text-editor-4"');
  expect(example).toContain('"name": "Collaborative Editor"');
  expect(example).toContain('"index": 3');

  const packageManifest = JSON.parse(strFromU8(files["package.json"]!));
  const currentPackage = JSON.parse((await fileBytes("package.json")).toString("utf8"));
  for (const dependency of [
    "@tiptap/core",
    "@tiptap/react",
    "@tiptap/pm",
    "@tiptap/extension-table",
    "@tiptap/suggestion",
    "@tiptap/extension-collaboration",
    "@tiptap/y-tiptap",
    "yjs",
    "y-protocols",
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

test("Collaborative Base UI starter exposes the selected primitive and includes the Yjs source", async ({
  page,
}, info) => {
  const implementation = "src/blocks/application/rich-text-collaboration.ts";
  const target = {
    ...collaborativeTarget,
    route: `./base${collaborativeTarget.route}`,
    selectedPath: implementation,
  };
  const { dialog, choice } = await openSource(page, target, "archive");
  const { files } = await captureOriginalArchive(page, target, dialog, info);
  const code = await selectSource(page, target, dialog, choice);
  const source = (await fileBytes(implementation)).toString("utf8");
  await expect.poll(() => sourceText(code, target)).toBe(source);
  expect(strFromU8(files[implementation])).toBe(source);
  expect(Buffer.from(files["src/components/ui/switch.tsx"])).toEqual(
    await fileBytes("src/foundations/base/ui/switch.tsx"),
  );
  expect(JSON.parse(strFromU8(files["components.json"])).style).toBe("base-nova");
  const pkg = JSON.parse(strFromU8(files["package.json"]));
  expect(pkg.dependencies.yjs).toBeTruthy();
  expect(pkg.scripts.build).toContain("vite build --mode base-ui");
});
