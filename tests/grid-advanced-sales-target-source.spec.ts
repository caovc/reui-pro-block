import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
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

const prefix = "src/blocks/data/grid-advanced-sales-target";
const implementationPaths = [
  prefix + ".tsx",
  prefix + "-cells.tsx",
  prefix + "-panels.tsx",
  prefix + "-model.ts",
  prefix + "-view-model.ts",
  prefix + ".css",
];
const requiredFiles = [
  ...implementationPaths,
  "src/components/reui/data-grid/data-grid.tsx",
  "src/components/reui/data-grid/data-grid-table.tsx",
  "src/components/reui/data-grid/data-grid-scroll-area.tsx",
  "src/components/reui/data-grid/data-grid-column-header.tsx",
  "src/components/reui/data-grid/data-grid-column-visibility.tsx",
  "src/components/reui/filters/filters.tsx",
  "src/components/reui/number-field.tsx",
  "src/components/reui/frame.tsx",
  "src/components/reui/badge.tsx",
  "src/components/ui/chart.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/reui/REUI-LICENSE.txt",
  "src/blocks/assets/Inter-LICENSE.txt",
];

for (const library of ["radix", "base"] as const) {
  const entry = library === "base" ? "./base/" : "./";
  const preset = new URLSearchParams({
    preset: JSON.stringify({
      primitive: library,
      style: library === "base" ? "sera" : "nova",
      mode: "light",
    }),
  });
  const target: SourceTarget = {
    id: "data-grid-advanced-21",
    kind: "block",
    name: "Sales to Target",
    route: `${entry}#/block/data-grid/advanced/data-grid-advanced-21?${preset}`,
    defaultPath: prefix + ".tsx",
    selectedPath: prefix + ".tsx",
    requiredFiles,
  };

  for (const selectedPath of implementationPaths) {
    test(`${library} Sales to Target source ${basename(selectedPath)}: native DOM, clipboard and single-file bytes`, async ({
      page,
      context,
    }, info) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      const chosen = { ...target, selectedPath };
      const expected = await fileBytes(selectedPath);
      const { opener, dialog, choice } = await openSource(page, chosen);
      await expect
        .poll(() => sourceText(dialog.locator(".source-code"), chosen))
        .toBe((await fileBytes(target.defaultPath)).toString("utf8"));
      const viewer = await selectSource(page, chosen, dialog, choice);
      await expect.poll(() => sourceText(viewer, chosen)).toBe(expected.toString("utf8"));
      await viewer.getByRole("button", { name: "Copy", exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(expected.toString("utf8"));
      const pending = page.waitForEvent("download");
      await viewer.getByRole("button", { name: "Download source file", exact: true }).click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe(basename(selectedPath));
      const path = info.outputPath(basename(selectedPath));
      await download.saveAs(path);
      expect(await readFile(path)).toEqual(expected);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
      await writeFile(
        info.outputPath("source-chain.json"),
        JSON.stringify(
          { selectedPath, bytes: expected.length, sha256: hash(expected), faults },
          null,
          2,
        ),
      );
      expect(faults).toEqual([]);
    });
  }

  test(`${library} Sales to Target original starter contains exact licensed native source closure`, async ({
    page,
  }, info) => {
    const { opener, dialog } = await openSource(page, target, "archive");
    const { files } = await captureOriginalArchive(page, target, dialog, info);
    await verifyOriginalClosure(target, files, info, library);
    for (const path of implementationPaths)
      expect(Buffer.from(files[path]), path).toEqual(await fileBytes(path));
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
}
