import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
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

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });

const defaultPath = "src/templates/business/commerce.tsx";
const dateSelectorPath = "src/templates/business/surge-free/date-selector.tsx";
const legacySecondaryPaths = [
  "src/templates/business/commerce-account-settings.tsx",
  "src/templates/business/atlas-account-settings.tsx",
  "src/templates/business/commerce-settings-general.tsx",
  "src/templates/business/commerce-settings-domains.tsx",
  "src/templates/business/commerce-settings-team.tsx",
  "src/templates/business/commerce-settings-payments.tsx",
  "src/templates/business/commerce-settings-notifications.tsx",
  "src/templates/business/commerce-settings-billing.tsx",
  "src/templates/business/commerce-settings-finance-dialogs.tsx",
  "src/templates/business/commerce-settings-provider-dialog.tsx",
  "src/templates/business/commerce-settings-records.tsx",
] as const;
const newSecondaryPaths = [
  "src/templates/business/surge-shell-chrome.tsx",
  "src/templates/business/surge-dashboard.tsx",
  "src/templates/business/surge-date-range.tsx",
  "src/templates/business/surge-operations.tsx",
] as const;
const implementationPaths = [
  defaultPath,
  "src/templates/business/shared.tsx",
  "src/templates/business/surge-shell-chrome.tsx",
  "src/templates/business/surge-shell-chrome.css",
  "src/templates/business/surge-dashboard.tsx",
  "src/templates/business/surge-dashboard.css",
  "src/templates/business/surge-date-range.tsx",
  "src/templates/business/surge-reporting-period.ts",
  dateSelectorPath,
  "src/templates/business/surge-route.ts",
  "src/templates/business/surge-route-model.ts",
  "src/templates/business/surge-operations.tsx",
  "src/templates/business/surge-operations.css",
  "src/templates/business/surge-operations-model.ts",
] as const;
const pureTypeScriptPaths = implementationPaths.filter((filename) => filename.endsWith(".ts"));
const archiveTarget: SourceTarget = {
  id: "surge",
  kind: "template",
  name: "Surge",
  family: "business",
  route: "/#/templates/surge",
  defaultPath,
  selectedPath: defaultPath,
  requiredFiles: [
    ...implementationPaths,
    ...legacySecondaryPaths,
    "src/components/reui/sidebar.tsx",
    "src/components/reui/frame.tsx",
    "src/components/ui/sidebar.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/radio-group.tsx",
    "src/components/ui/breadcrumb.tsx",
    "src/components/ui/collapsible.tsx",
    "src/components/ui/popover.tsx",
    "src/components/ui/calendar.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/ui/field.tsx",
    "src/components/reui/data-grid/data-grid.tsx",
    "src/components/reui/filters/filters.tsx",
    "src/blocks/data/grid-advanced-model-grid.tsx",
    "src/components/ui/motion-policy.ts",
    "src/components/site/global-theme-store.ts",
    "src/templates/business/commerce-account-theme.ts",
    "src/templates/business/commerce-account-model.ts",
    "src/templates/business/commerce-account-route.ts",
    "src/templates/business/commerce-settings-route-model.ts",
    "src/templates/business/business.css",
    "src/templates/business/business-layout.css",
  ],
};

for (const selectedPath of implementationPaths) {
  const target: SourceTarget = { ...archiveTarget, selectedPath };
  test(`Surge whole layout source ${basename(selectedPath)}: actual view, Copy and single-file bytes`, async ({
    page,
    context,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const originalDefault = await fileBytes(defaultPath);
    const expected = await fileBytes(selectedPath);
    const { opener, dialog, choice } = await openSource(page, target);
    await expect.poll(() => sourceText(dialog, target)).toBe(originalDefault.toString("utf8"));

    if (selectedPath === defaultPath) {
      await choice.click();
      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      const paths = await listbox.getByRole("option").allTextContents();
      const pinned = [defaultPath, ...legacySecondaryPaths, ...newSecondaryPaths];
      expect(paths.slice(0, pinned.length)).toEqual(pinned);
      for (const filename of implementationPaths) expect(paths).toContain(filename);
      for (const filename of pureTypeScriptPaths) {
        expect(paths, `${filename}: keep the actual .ts source extension`).not.toContain(
          filename.replace(/\.ts$/, ".tsx"),
        );
      }
      await page.keyboard.press("Escape");
      await expect(listbox).toHaveCount(0);
      await expect(choice).toBeFocused();
    }

    const code = await selectSource(page, target, dialog, choice);
    await expect.poll(() => sourceText(code, target)).toBe(expected.toString("utf8"));
    const view = Buffer.from(await sourceText(code, target), "utf8");
    expect(view).toEqual(expected);
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected.toString("utf8"));
    const clipboard = Buffer.from(
      await page.evaluate(() => navigator.clipboard.readText()),
      "utf8",
    );
    expect(clipboard).toEqual(expected);

    const pending = page.waitForEvent("download");
    await code.getByRole("button", { name: "Download template source file", exact: true }).click();
    const download = await pending;
    const artifact = info.outputPath(`surge-${basename(selectedPath)}`);
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(selectedPath));
    expect(extname(download.suggestedFilename())).toBe(extname(selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(defaultPath)).toEqual(originalDefault);
    expect(await fileBytes(selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("surge-whole-layout-source-proof.json"),
      JSON.stringify(
        {
          id: target.id,
          defaultPath,
          selectedPath,
          extension: extname(selectedPath),
          originalSHA256: hash(expected),
          viewSHA256: hash(view),
          clipboardSHA256: hash(clipboard),
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

test("Surge whole layout actual original ZIP preserves .ts models, free DateSelector, CSS and complete licensed closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const { dialog } = await openSource(page, archiveTarget, "archive");
  const { files } = await captureOriginalArchive(page, archiveTarget, dialog, info);
  await verifyOriginalClosure(archiveTarget, files, info);
  for (const filename of pureTypeScriptPaths) {
    expect(files[filename], `${filename}: genuine .ts member`).toBeDefined();
    expect(
      files[filename.replace(/\.ts$/, ".tsx")],
      `${filename}: no fabricated TSX alias`,
    ).toBeUndefined();
  }
  const dateSelector = strFromU8(files[dateSelectorPath]!);
  expect(dateSelector).toContain("https://reui.io/r/radix-nova/date-selector.json");
  expect(dateSelector).toContain("MIT License");
  expect(dateSelector).toContain("Copyright (c) 2025 Keenthemes Inc");
  expect(faults).toEqual([]);
});
