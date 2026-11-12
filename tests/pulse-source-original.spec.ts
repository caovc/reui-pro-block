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
  id: "pulse",
  kind: "template",
  name: "Pulse",
  family: "collaboration",
  route: "/#/templates/pulse",
  defaultPath: "src/templates/collaboration/pulse.tsx",
  selectedPath: "src/templates/collaboration/pulse.tsx",
  requiredFiles: [
    "src/templates/collaboration/pulse.tsx",
    "src/templates/collaboration/pulse-board.tsx",
    "src/templates/collaboration/shared.tsx",
    "src/templates/collaboration/pulse-ticket-model.ts",
    "src/templates/collaboration/pulse-ticket-data.ts",
    "src/templates/collaboration/pulse-ticket-create.tsx",
    "src/templates/collaboration/pulse-ticket-detail.tsx",
    "src/templates/collaboration/pulse-ticket-detail.css",
    "src/templates/collaboration/pulse-ticket-overlay.css",
    "src/templates/collaboration/assets/SOURCES.md",
    "src/components/reui/frame.tsx",
    "src/components/reui/kanban.tsx",
    "src/components/ui/field.tsx",
    "src/components/ui/item.tsx",
  ],
};
const selectedPaths = [
  "src/templates/collaboration/pulse.tsx",
  "src/templates/collaboration/pulse-board.tsx",
  "src/templates/collaboration/shared.tsx",
  "src/templates/collaboration/pulse-ticket-model.ts",
  "src/templates/collaboration/pulse-ticket-data.ts",
  "src/templates/collaboration/pulse-ticket-create.tsx",
  "src/templates/collaboration/pulse-ticket-detail.tsx",
  "src/templates/collaboration/pulse-ticket-detail.css",
  "src/templates/collaboration/pulse-ticket-overlay.css",
] as const;
const frozenHashes: Readonly<Record<string, string>> = {
  "src/templates/collaboration/pulse.tsx":
    "d7ff39ab2bd7ec247ca9255e7d13b67b24e627fd33401c135cea37d3600a55f9",
  "src/templates/collaboration/pulse-board.tsx":
    "7a40fbffe45f51eaa2a904af760c9a7c104fba9764028774c2a338f8b7075cbe",
  "src/templates/collaboration/shared.tsx":
    "91e173fb8b2312f6212b37d3db1c8c3c34041f6eaf700c440d8d207542b88dd2",
  "src/templates/collaboration/pulse-ticket-model.ts":
    "8cf66bdf88091ffc5ea3bfbe694d42a97d8e6399c22d54d8f21375b224277da3",
  "src/templates/collaboration/pulse-ticket-data.ts":
    "c5aa1a7f71d73345b3c78ab6b6e97ad56308555cd786d22d3bd15069de10e1e1",
  "src/templates/collaboration/pulse-ticket-create.tsx":
    "f75e2c28ec2b5b58f1c520eb6cf938efb1262b6b99a9014fdd1f55f2b9570339",
  "src/templates/collaboration/pulse-ticket-detail.tsx":
    "9f33bf5aeaa9e832713036886c3740dd8c1a226f22a40f6978786a94941f9dae",
  "src/templates/collaboration/pulse-ticket-detail.css":
    "0895141704fb37b6847798dafe169ce74840b7c20c76eb461c9c895b7757d256",
  "src/templates/collaboration/pulse-ticket-overlay.css":
    "389226ca7964953e1580670eb0b8da72c814375b9f0216ae1c910af35b0ecc22",
};
const archiveOnlyHashes: Readonly<Record<string, string>> = {
  "src/templates/collaboration/assets/SOURCES.md":
    "e44eb9107fa3253035d9577147b8c722a60c07ffe69fede7616660c33929dd22",
};

test("Pulse changed source: actual full default, real view/Copy/single files and original ZIP", async ({
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

  const expectedArchiveOnly: Record<string, Buffer> = {};
  for (const [filename, digest] of Object.entries(archiveOnlyHashes)) {
    const bytes = await fileBytes(filename);
    expect(hash(bytes), `${filename}: frozen Root document`).toBe(digest);
    expectedArchiveOnly[filename] = bytes;
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
  for (const [filename, bytes] of Object.entries(expectedArchiveOnly)) {
    expect(files[filename], `${filename}: actual original ZIP Root document`).toBeDefined();
    expect(Buffer.from(files[filename]!)).toEqual(bytes);
    expect(await fileBytes(filename)).toEqual(bytes);
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
    info.outputPath("pulse-source-four-way-proof.json"),
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
        archiveOnlyZIPMembers: Object.fromEntries(
          Object.keys(archiveOnlyHashes).map((filename) => [filename, hash(files[filename]!)]),
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
