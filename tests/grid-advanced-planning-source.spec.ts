import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { strFromU8 } from "fflate";
import { defaultTheme, themeCSS } from "../src/components/site/preview-theme";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  verifyOriginalClosure,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const cases = [
  { id: 29, name: "Family Budget", module: "family-budget" },
  { id: 30, name: "Inventory Manager", module: "inventory-manager" },
  { id: 31, name: "Vendor SLA Scorecard", module: "vendor-sla" },
];
for (const primitive of ["radix", "base"] as const) {
  for (const block of cases) {
    test(`${block.name} delivers original leaf, models, native foundation and styled starter in ${primitive}`, async ({
      page,
      context,
    }, info) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const style = primitive === "radix" ? "maia" : "sera";
      const theme = { ...defaultTheme, primitive, style, mode: "dark", accent: "emerald" };
      const leaf = `src/blocks/data/grid-advanced-${block.module}.tsx`;
      const model = `src/blocks/data/grid-advanced-${block.module}-model.ts`;
      const controls = "src/blocks/data/grid-advanced-planning-controls.tsx";
      const target: SourceTarget = {
        id: `data-grid-advanced-${block.id}`,
        name: block.name,
        kind: "block",
        route: `${primitive === "base" ? "./base/" : "./"}#/block/data-grid/advanced/data-grid-advanced-${block.id}?${new URLSearchParams({ preset: JSON.stringify(theme) })}`,
        defaultPath: leaf,
        selectedPath: leaf,
        requiredFiles: [
          leaf,
          model,
          controls,
          "src/blocks/data/grid-advanced-planning-common.ts",
          "src/blocks/data/grid-advanced-model-grid.tsx",
          "src/blocks/data/trend-foundation.tsx",
          "src/components/reui/data-grid/data-grid.tsx",
          "src/components/reui/data-grid/data-grid-table.tsx",
          "src/components/reui/frame.tsx",
          "src/components/reui/number-field.tsx",
          "src/components/reui/filters/filters.tsx",
          "src/components/ui/dialog.tsx",
          "src/components/ui/select.tsx",
          "src/components/ui/chart.tsx",
        ],
      };
      const { opener, dialog, choice } = await openSource(page, target, "archive");
      const { files } = await captureOriginalArchive(page, target, dialog, info);
      await verifyOriginalClosure(target, files, info, primitive);
      const member = (path: string) => strFromU8(files[path]!);
      expect(JSON.parse(member("components.json")).style).toBe(`${primitive}-${style}`);
      expect(member("index.html")).toContain(
        `data-ui-primitive="${primitive}" data-ui-style="${style}"`,
      );
      expect(member("index.html")).toContain('class="dark"');
      expect(member("src/theme.css").endsWith(themeCSS(theme))).toBe(true);
      expect(member("src/Example.tsx")).toContain("setInheritedPreviewTheme(exportedTheme, true)");
      expect(member("src/Example.tsx")).toContain(target.id);
      for (const path of [leaf, model, "src/components/ui/select.tsx"]) {
        const selected = { ...target, selectedPath: path };
        const code = await selectSource(page, selected, dialog, choice);
        const expected = member(path);
        await expect.poll(() => sourceText(code, selected)).toBe(expected);
        await code.getByRole("button", { name: "Copy", exact: true }).click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
        const pending = page.waitForEvent("download");
        await code.getByRole("button", { name: "Download source file", exact: true }).click();
        const download = await pending;
        expect(download.suggestedFilename()).toBe(basename(path));
        expect(await readFile((await download.path())!)).toEqual(Buffer.from(files[path]!));
      }
      expect(Buffer.from(files[leaf]!)).toEqual(await fileBytes(leaf));
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    });
  }
}
