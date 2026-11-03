import { expect, test } from "@playwright/test";
import { basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
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

const target: SourceTarget = {
  id: "flow-2",
  kind: "block",
  name: "AI Agent Builder",
  route: "./#/block/application/flow/flow-2",
  defaultPath: "src/blocks/application/flow-gantt-flow.tsx",
  selectedPath: "src/blocks/application/flow-gantt-flow.tsx",
  requiredFiles: [
    "src/blocks/application/flow-gantt-flow.tsx",
    "src/blocks/application/planning.tsx",
    "src/blocks/application/flow-fidelity-node.tsx",
    "src/blocks/application/flow-inspector-fields.tsx",
    "src/blocks/application/flow-gantt-avatars.tsx",
    "src/blocks/application/assets/flow-gantt/README.md",
    "src/lib/demo-artwork.ts",
    "src/components/ui/sonner.tsx",
    "src/components/ui/sheet.tsx",
    "src/components/ui/dropdown-menu.tsx",
  ],
};

test("Flow2 actual changed leaf: default, view, Copy and single-file bytes", async ({
  page,
  context,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const expected = await fileBytes(target.selectedPath);
  const { opener, dialog, choice } = await openSource(page, target);
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
  const artifact = info.outputPath(`${target.id}-${basename(target.selectedPath)}`);
  await download.saveAs(artifact);
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe(basename(target.selectedPath));
  const downloaded = await readFile(artifact);
  expect(downloaded).toEqual(expected);
  expect(await fileBytes(target.selectedPath)).toEqual(expected);

  await writeFile(
    info.outputPath("flow2-changed-source-proof.json"),
    JSON.stringify(
      {
        id: target.id,
        defaultPath: target.defaultPath,
        selectedPath: target.selectedPath,
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

test("Flow2 actual original ZIP: native source, catalog wrapper, dependencies and licensed closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const frozen = new Map(
    await Promise.all(
      target.requiredFiles.map(async (filename) => [filename, await fileBytes(filename)] as const),
    ),
  );
  const { dialog } = await openSource(page, target, "archive");
  const { files, archivePath, archiveBytes } = await captureOriginalArchive(
    page,
    target,
    dialog,
    info,
  );
  for (const [filename, expected] of frozen) {
    expect(files[filename], filename).toBeDefined();
    expect(Buffer.from(files[filename]!), filename).toEqual(expected);
    expect(await fileBytes(filename), filename).toEqual(expected);
  }
  await verifyOriginalClosure(target, files, info);

  // The original native wrapper must keep catalog Flow2 index1, not a repaired test-only entry.
  const catalog: { blocks: { id: string; index: number; [key: string]: unknown }[] }[] = JSON.parse(
    (await fileBytes("src/data/catalog.json")).toString("utf8"),
  );
  const catalogBlock = catalog
    .flatMap((category) => category.blocks)
    .find((block) => block.id === target.id);
  expect(catalogBlock).toBeDefined();
  expect(catalogBlock?.index).toBe(1);
  const example = strFromU8(files["src/Example.tsx"]!);
  expect(example).toContain("import ApplicationBlock from '@/blocks/application'");
  expect(example).toContain("<ApplicationBlock block={block} />");
  const wrapperMatch = example.match(/const block = ([\s\S]*?)\n\nexport default function Example/);
  expect(
    wrapperMatch,
    "Actual generated wrapper contains original catalog metadata",
  ).not.toBeNull();
  if (!wrapperMatch) throw new Error("Original Flow2 wrapper metadata missing");
  expect(JSON.parse(wrapperMatch[1])).toEqual(catalogBlock);

  const originalPackage = JSON.parse((await fileBytes("package.json")).toString("utf8"));
  const packageManifest = JSON.parse(strFromU8(files["package.json"]!));
  for (const dependency of ["sonner", "@xyflow/react"]) {
    expect(packageManifest.dependencies[dependency], dependency).toBe(
      originalPackage.dependencies[dependency],
    );
  }
  const postinstall = packageManifest.scripts.postinstall;
  if (postinstall !== undefined) {
    expect(postinstall).toBe("node scripts/copy-excalidraw-assets.mjs");
    const script = "scripts/copy-excalidraw-assets.mjs";
    expect(files[script], "Actual original package postinstall script").toBeDefined();
    expect(Buffer.from(files[script]!)).toEqual(await fileBytes(script));
  }
  expect(await readFile(archivePath)).toEqual(archiveBytes);
  await writeFile(
    info.outputPath("flow2-original-entry-proof.json"),
    JSON.stringify(
      {
        id: target.id,
        catalogIndex: catalogBlock?.index,
        actualWrapperMetadata: JSON.parse(wrapperMatch[1]),
        exampleSHA256: hash(files["src/Example.tsx"]!),
        archiveSHA256: hash(archiveBytes),
        nativeDependencies: {
          sonner: packageManifest.dependencies.sonner,
          reactFlow: packageManifest.dependencies["@xyflow/react"],
        },
        originalScripts: packageManifest.scripts,
        postinstallPresent: postinstall !== undefined,
        originalEntryPackageOrConfigModified: false,
        normalInstallPostinstallExecuted: false,
        originalStrictBuildOrRuntimeVerified: false,
      },
      null,
      2,
    ) + "\n",
  );
  expect(faults).toEqual([]);
});
