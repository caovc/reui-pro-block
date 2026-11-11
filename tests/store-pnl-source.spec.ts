import { expect, test } from "@playwright/test";
import { basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
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

// Each file gets its own natural UI flow, and the final case captures one real original ZIP.
const baseTarget: SourceTarget = {
  id: "data-grid-advanced-2",
  kind: "block",
  name: "Store P&L",
  route: "./#/block/data-grid/advanced/data-grid-advanced-2",
  defaultPath: "src/blocks/data/grid-advanced.tsx",
  selectedPath: "src/blocks/data/grid-advanced.tsx",
  requiredFiles: [
    "src/blocks/data/grid-advanced.tsx",
    "src/blocks/data/grid-advanced-model-grid.tsx",
    "src/components/reui/data-grid/data-grid-column-visibility.tsx",
    "src/components/reui/data-grid/data-grid.tsx",
    "src/components/reui/data-grid/data-grid-table.tsx",
    "src/components/reui/data-grid/data-grid-pagination.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/input-group.tsx",
  ],
};

for (const selectedPath of [
  "src/blocks/data/grid-advanced.tsx",
  "src/blocks/data/grid-advanced-model-grid.tsx",
  "src/components/ui/input-group.tsx",
]) {
  const target: SourceTarget = { ...baseTarget, selectedPath };
  test(`${target.id} ${basename(target.selectedPath)} changed source: actual default, view, clipboard and single-file bytes`, async ({
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
    const viewBytes = Buffer.from(await sourceText(code, target), "utf8");
    expect(viewBytes).toEqual(expected);
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected.toString("utf8"));
    const copied = Buffer.from(await page.evaluate(() => navigator.clipboard.readText()), "utf8");
    expect(copied).toEqual(expected);
    const pending = page.waitForEvent("download");
    await code
      .getByRole("button", {
        name: target.kind === "block" ? "Download source file" : "Download template source file",
        exact: true,
      })
      .click();
    const download = await pending;
    const artifact = info.outputPath(`${target.id}-${basename(target.selectedPath)}`);
    await download.saveAs(artifact);
    expect(download.suggestedFilename()).toBe(basename(target.selectedPath));
    expect(await download.failure()).toBeNull();
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(target.selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("changed-source-proof.json"),
      JSON.stringify(
        {
          id: target.id,
          defaultPath: target.defaultPath,
          selectedPath: target.selectedPath,
          originalSHA256: hash(expected),
          viewSHA256: hash(viewBytes),
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

const target = baseTarget;
test(`${target.id} actual original ZIP: changed sources, free dependencies, local closure and licenses`, async ({
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
    expect(Buffer.from(files[filename]!)).toEqual(expected);
    expect(await fileBytes(filename)).toEqual(expected);
  }
  await verifyOriginalClosure(target, files, info);
  expect(await readFile(archivePath)).toEqual(archiveBytes);
  expect(faults).toEqual([]);
});
