// Private static candidate; no runner/build/browser acceptance claimed.
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

const defaultPath = "src/templates/business/commerce.tsx";
const changedConsumers = [
  "src/templates/business/atlas-account-settings.tsx",
  "src/templates/business/commerce-account-model.ts",
  "src/templates/business/commerce-account-route.ts",
  "src/templates/business/commerce-account-settings.css",
  "src/templates/business/commerce-account-settings.tsx",
  "src/templates/business/commerce-account-theme.ts",
  "src/components/ui/motion-policy.ts",
] as const;
// Twenty runtime-owned paths; source-targets.ts is site-only registry metadata.
const requiredFiles = [
  "src/blocks/application/shells/chrome.tsx",
  "src/components/reui/sidebar.tsx",
  "src/components/ui/alert-dialog.tsx",
  "src/components/ui/combobox.tsx",
  "src/components/ui/dialog.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/motion-policy.ts",
  "src/components/ui/popover.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/ui/tooltip.tsx",
  "src/templates/business/atlas-account-settings.tsx",
  "src/templates/business/commerce-account-model.ts",
  "src/templates/business/commerce-account-route.ts",
  "src/templates/business/commerce-account-settings.css",
  "src/templates/business/commerce-account-settings.tsx",
  "src/templates/business/commerce-account-theme.ts",
  "src/templates/business/commerce-settings-header.css",
  "src/templates/business/commerce.tsx",
  "src/templates/business/shared.tsx",
  "src/templates/business/atlas-account-settings-model.ts",
  "src/templates/business/atlas-account-settings-data.ts",
  "src/blocks/application/dialog-variants/workspace/settings-panel.tsx",
  "src/components/reui/frame.tsx",
  "src/components/ui/field.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/ui/input-group.tsx",
  "src/templates/collaboration/drive-settings-free/phone-input.tsx",
  "src/templates/collaboration/drive-settings-components.tsx",
] as const;

const templates = [
  { id: "surge", name: "Surge" },
  { id: "manifest", name: "Manifest" },
] as const;

for (const template of templates) {
  const baseTarget: SourceTarget = {
    ...template,
    kind: "template",
    family: "business",
    route: `./#/templates/${template.id}`,
    defaultPath,
    selectedPath: defaultPath,
    requiredFiles,
  };

  // Each changed consumer has its own real default-to-file lifecycle and budget.
  // The separate project case below downloads exactly one original ZIP per template.
  for (const selectedPath of changedConsumers) {
    const target: SourceTarget = { ...baseTarget, selectedPath };
    test(`${target.id} Account source ${basename(selectedPath)}: actual default, view, clipboard and single-file bytes`, async ({
      page,
      context,
    }, info) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const originalDefault = await fileBytes(target.defaultPath);
      const expected = await fileBytes(target.selectedPath);
      const { opener, dialog, choice } = await openSource(page, target);
      await expect.poll(() => sourceText(dialog, target)).toBe(originalDefault.toString("utf8"));
      const defaultView = Buffer.from(await sourceText(dialog, target), "utf8");
      expect(defaultView).toEqual(originalDefault);

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
        .getByRole("button", { name: "Download template source file", exact: true })
        .click();
      const download = await pending;
      const artifact = info.outputPath(`${target.id}-${basename(target.selectedPath)}`);
      await download.saveAs(artifact);
      expect(download.suggestedFilename()).toBe(basename(target.selectedPath));
      expect(await download.failure()).toBeNull();
      const downloaded = await readFile(artifact);
      expect(downloaded).toEqual(expected);
      expect(await fileBytes(target.defaultPath)).toEqual(originalDefault);
      expect(await fileBytes(target.selectedPath)).toEqual(expected);
      await writeFile(
        info.outputPath("changed-source-proof.json"),
        JSON.stringify(
          {
            id: target.id,
            defaultPath: target.defaultPath,
            selectedPath: target.selectedPath,
            defaultOriginalSHA256: hash(originalDefault),
            defaultViewSHA256: hash(defaultView),
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

  test(`${baseTarget.id} actual original Account ZIP: twenty runtime paths, motion helper, native closure and licenses`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    const frozen = new Map(
      await Promise.all(
        baseTarget.requiredFiles.map(
          async (filename) => [filename, await fileBytes(filename)] as const,
        ),
      ),
    );
    const { dialog } = await openSource(page, baseTarget, "archive");
    const { files, archivePath, archiveBytes } = await captureOriginalArchive(
      page,
      baseTarget,
      dialog,
      info,
    );
    for (const [filename, expected] of frozen) {
      expect(files[filename], filename).toBeDefined();
      expect(Buffer.from(files[filename]!)).toEqual(expected);
      expect(await fileBytes(filename)).toEqual(expected);
    }
    await verifyOriginalClosure(baseTarget, files, info);
    expect(await readFile(archivePath)).toEqual(archiveBytes);
    expect(faults).toEqual([]);
  });
}
