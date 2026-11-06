import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
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

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });
test.use({ actionTimeout: 5_000 });

const target: SourceTarget = {
  id: "roster",
  kind: "template",
  name: "Roster",
  family: "collaboration",
  route: "/#/templates/roster",
  defaultPath: "src/templates/collaboration/roster.tsx",
  selectedPath: "src/templates/collaboration/roster.tsx",
  requiredFiles: [
    "src/templates/collaboration/roster.tsx",
    "src/templates/collaboration/roster-directory.tsx",
    "src/templates/collaboration/roster-directory-data.ts",
    "src/templates/workflow/free/flowly-progress.tsx",
    "src/templates/workflow/free/flowly-toggle-group.tsx",
    "src/blocks/data/sparkline-primitives.tsx",
    "src/components/reui/frame.tsx",
    "src/components/ui/progress.tsx",
    "src/components/ui/toggle-group.tsx",
  ],
};
const selectedPaths = ["src/templates/collaboration/roster.tsx"] as const;
const frozenHashes: Readonly<Record<string, string>> = {
  "src/templates/collaboration/roster.tsx":
    "2ebca6c6a2e0514e1a84888d7fd68723cf732cbc8e126e1017f8f1e113de41d6",
};

test("Roster changed source: actual full default, real view/Copy/single files and original ZIP", async ({
  page,
  context,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const expected: Record<string, Buffer> = {};
  for (const filename of selectedPaths) {
    const bytes = await fileBytes(filename);
    expect(hash(bytes), `${filename}: frozen actual implementation`).toBe(frozenHashes[filename]);
    expected[filename] = bytes;
  }

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const { opener, dialog, choice } = await openSource(page, target);
  await expect
    .poll(() => sourceText(dialog, target))
    .toBe(expected[target.defaultPath].toString("utf8"));
  expect(Buffer.from(await sourceText(dialog, target), "utf8")).toEqual(
    expected[target.defaultPath],
  );

  await choice.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  const options = await listbox.getByRole("option").allTextContents();
  expect(options[0], "actual implementation opens before generated usage").toBe(target.defaultPath);
  for (const filename of selectedPaths) expect(options).toContain(filename);
  // Roster changes the existing full consumer; no synthetic secondary is added.
  await page.keyboard.press("Escape");
  await expect(listbox).toHaveCount(0);
  await expect(choice).toBeFocused();

  const sources: {
    path: string;
    originalSHA256: string;
    viewSHA256: string;
    realClipboardSHA256: string;
    singleFileSHA256: string;
    artifact: string;
  }[] = [];
  for (const filename of selectedPaths) {
    const selected: SourceTarget = { ...target, selectedPath: filename };
    const code = await selectSource(page, selected, dialog, choice);
    await expect.poll(() => sourceText(code, selected)).toBe(expected[filename].toString("utf8"));
    const viewed = Buffer.from(await sourceText(code, selected), "utf8");
    expect(viewed, "complete actual DOM source including blank lines and trailing LF").toEqual(
      expected[filename],
    );

    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected[filename].toString("utf8"));
    const clipboard = Buffer.from(
      await page.evaluate(() => navigator.clipboard.readText()),
      "utf8",
    );
    expect(clipboard).toEqual(expected[filename]);

    const pending = page.waitForEvent("download");
    await code.getByRole("button", { name: "Download template source file", exact: true }).click();
    const download = await pending;
    const artifact = info.outputPath(basename(filename));
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(filename));
    expect(extname(download.suggestedFilename())).toBe(extname(filename));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected[filename]);
    expect(await fileBytes(filename)).toEqual(expected[filename]);
    sources.push({
      path: filename,
      originalSHA256: hash(expected[filename]),
      viewSHA256: hash(viewed),
      realClipboardSHA256: hash(clipboard),
      singleFileSHA256: hash(downloaded),
      artifact,
    });
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();

  // Capture the real first UI archive unchanged; never replace/repack its entries.
  const original = await openSource(page, target, "archive");
  const { files, archivePath, archiveBytes } = await captureOriginalArchive(
    page,
    target,
    original.dialog,
    info,
  );
  await verifyOriginalClosure(target, files, info);
  await expect
    .poll(() => sourceText(original.dialog, target))
    .toBe(expected[target.defaultPath].toString("utf8"));
  for (const filename of selectedPaths) {
    expect(files[filename], `${filename}: actual original ZIP member`).toBeDefined();
    expect(Buffer.from(files[filename]!)).toEqual(expected[filename]);
    expect(await fileBytes(filename)).toEqual(expected[filename]);
  }
  for (const filename of [
    "src/main.tsx",
    "src/Example.tsx",
    "index.html",
    "vite.config.ts",
    "tsconfig.json",
    "package.json",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "src/components/reui/REUI-LICENSE.txt",
    "src/blocks/assets/Inter-LICENSE.txt",
  ]) {
    expect(files[filename], `${filename}: original runnable and licensed closure`).toBeDefined();
  }
  const manifest = JSON.parse(Buffer.from(files["package.json"]!).toString("utf8"));
  const config = JSON.parse(Buffer.from(files["tsconfig.json"]!).toString("utf8"));
  expect(manifest.scripts.build).toBe("tsc --noEmit && vite build");
  expect(config.compilerOptions.strict).toBe(true);
  if (manifest.scripts.postinstall) {
    expect(manifest.scripts.postinstall).toBe("node scripts/copy-excalidraw-assets.mjs");
    expect(files["scripts/copy-excalidraw-assets.mjs"]).toBeDefined();
  }
  await page.keyboard.press("Escape");
  await expect(original.dialog).toHaveCount(0);
  await expect(original.opener).toBeFocused();
  expect(faults).toEqual([]);

  await writeFile(
    info.outputPath("roster-source-four-way-proof.json"),
    JSON.stringify(
      {
        id: target.id,
        defaultPath: target.defaultPath,
        selectedPaths,
        sources,
        originalArchivePath: archivePath,
        originalArchiveSHA256: hash(archiveBytes),
        originalMembers: Object.keys(files).length,
        selectedZIPMembers: Object.fromEntries(
          selectedPaths.map((filename) => [filename, hash(files[filename]!)]),
        ),
        actualClipboardAndDownloadAPIs: true,
        originalEntryConfigOrPackageModified: false,
        standaloneInstallBuildOrNativeVerified: false,
        budgets: { test: 30000, assertion: 5000, action: 5000, workers: 1, retries: 0 },
        pageErrors: faults,
      },
      null,
      2,
    ) + "\n",
  );
});
