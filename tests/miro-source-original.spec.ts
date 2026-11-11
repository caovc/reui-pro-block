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
  id: "miro",
  kind: "template",
  name: "Miro",
  family: "business",
  route: "/#/templates/miro",
  defaultPath: "src/templates/business/miro.tsx",
  selectedPath: "src/templates/business/miro.tsx",
  requiredFiles: [
    "src/templates/business/miro.tsx",
    "src/templates/business/miro-dashboard-charts.tsx",
    "src/templates/business/miro-dashboard-charts.css",
    "src/components/ui/chart.tsx",
  ],
};
const selectedPaths = [
  "src/templates/business/miro.tsx",
  "src/templates/business/miro-dashboard-charts.tsx",
  "src/templates/business/miro-dashboard-charts.css",
] as const;
const frozenHashes: Readonly<Record<string, string>> = {
  "src/templates/business/miro.tsx":
    "ae926ed483934f1545a812cfebfe1206709b8745b47bb85287757a6f0e10f4a3",
  "src/templates/business/miro-dashboard-charts.tsx":
    "2bfd359aa946558127c3cf8c41a1f510c103ce33ce9e871753bc5832042e9e31",
  "src/templates/business/miro-dashboard-charts.css":
    "a3f762b673d27c18119708b9274bc7b4c008a1f01636beb7d1d4f60a42cb0c9f",
};
const archiveOnlyHashes: Readonly<Record<string, string>> = {};

test("Miro changed source: actual full default, real view/Copy/single files and original ZIP", async ({
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
    info.outputPath("miro-source-four-way-proof.json"),
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
