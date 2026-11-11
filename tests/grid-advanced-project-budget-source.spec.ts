import { expect, test, type Locator, type Page } from "@playwright/test";
import { strFromU8 } from "fflate";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  type SourceTarget,
} from "./fidelity-next-source.helpers";
import { UI_STYLES } from "../src/foundations/styles";
import { defaultTheme, themeCSS } from "../src/components/site/preview-theme";

const leaf = "src/blocks/data/grid-advanced-project-budget.tsx";
const menu = "src/components/ui/dropdown-menu.tsx";
const themeFile = "src/theme.css";
const route = "#/block/data-grid/advanced/data-grid-advanced-27";
const frameRadius = {
  nova: 14,
  vega: 14,
  maia: 18,
  lyra: 0,
  mira: 10,
  luma: 26,
  sera: 0,
  rhea: 24,
};
const target: SourceTarget = {
  id: "data-grid-advanced-27",
  kind: "block",
  name: "Project Budget",
  route,
  defaultPath: leaf,
  selectedPath: leaf,
  requiredFiles: [
    leaf,
    "src/blocks/data/grid-advanced-project-budget-model.ts",
    "src/blocks/data/grid-advanced-project-budget-panels.tsx",
    "src/blocks/data/grid-advanced-finance-controls.tsx",
    "src/blocks/data/grid-advanced-finance.css",
    "src/blocks/data/grid-advanced-model-grid.tsx",
    "src/components/reui/data-grid/data-grid.tsx",
    "src/components/reui/data-grid/data-grid-column-visibility.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/icon-tile.tsx",
    "src/components/reui/number-field.tsx",
    "src/components/ui/chart.tsx",
    "src/components/ui/progress.tsx",
    "src/components/ui/sheet.tsx",
    "src/components/reui/REUI-LICENSE.txt",
    "src/blocks/assets/Inter-LICENSE.txt",
    "THIRD_PARTY_NOTICES.md",
  ],
};

async function verifySourceDelivery(
  page: Page,
  dialog: Locator,
  choice: Locator,
  selected: SourceTarget,
  bytes: Uint8Array,
) {
  const code = await selectSource(page, selected, dialog, choice);
  const text = strFromU8(bytes);
  await expect.poll(() => sourceText(code, selected)).toBe(text);
  await code.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(text);

  const pending = page.waitForEvent("download");
  await code.getByRole("button", { name: "Download source file", exact: true }).click();
  const file = await pending;
  expect(file.suggestedFilename()).toBe(basename(selected.selectedPath));
  expect(await readFile((await file.path())!)).toEqual(Buffer.from(bytes));
}

for (const primitive of ["radix", "base"] as const) {
  for (const style of UI_STYLES) {
    test(`Project Budget preview and source agree in ${primitive} ${style}`, async ({
      page,
      context,
    }, info) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      const theme = { ...defaultTheme, primitive, style, accent: "emerald" };
      const query = new URLSearchParams({ preset: JSON.stringify(theme) });
      const entry = primitive === "base" ? "./base/" : "./";
      const selected = { ...target, route: `${entry}${route}?${query}` };
      await page.goto(selected.route);

      const preview = page.frameLocator('iframe[title="Project Budget live preview"]');
      const html = preview.locator("html");
      await expect(html).toHaveAttribute("data-ui-primitive", primitive);
      await expect(html).toHaveAttribute("data-ui-style", style);
      await expect(html).toHaveCSS("--primary", "#047857");
      const frame = preview
        .getByRole("region", { name: "Project budget" })
        .locator('[data-slot="frame"]');
      await expect(frame).toHaveCSS("border-top-left-radius", `${frameRadius[style]}px`);

      const { opener, dialog, choice } = await openSource(page, selected, "archive");
      const { files } = await captureOriginalArchive(page, selected, dialog, info);
      const archive = (name: string) => strFromU8(files[name]!);
      const sourceMenuPath =
        primitive === "base" ? "src/foundations/base/ui/dropdown-menu.tsx" : menu;
      for (const path of selected.requiredFiles) expect(files[path], path).toBeDefined();
      expect(Buffer.from(files[leaf]!)).toEqual(await fileBytes(leaf));
      expect(Buffer.from(files[menu]!)).toEqual(await fileBytes(sourceMenuPath));
      expect(archive("src/components/reui/REUI-LICENSE.txt")).toContain("MIT License");
      expect(archive("src/blocks/assets/Inter-LICENSE.txt")).toContain("SIL OPEN FONT LICENSE");
      expect(JSON.parse(archive("components.json")).style).toBe(`${primitive}-${style}`);
      expect(archive("index.html")).toContain(
        `data-ui-primitive="${primitive}" data-ui-style="${style}"`,
      );
      expect(archive(themeFile)).toContain(themeCSS(theme).trim());
      expect(archive("src/Example.tsx")).toContain(selected.id);

      for (const path of [leaf, menu, themeFile]) {
        await verifySourceDelivery(
          page,
          dialog,
          choice,
          { ...selected, selectedPath: path },
          files[path]!,
        );
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
      expect(faults).toEqual([]);
    });
  }
}
