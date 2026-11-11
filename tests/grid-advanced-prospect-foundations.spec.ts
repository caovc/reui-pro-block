import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { getUiStyleCss, UI_STYLES } from "../src/foundations/styles/index";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const id = "data-grid-advanced-23";
const route = `data-grid/advanced/${id}`;
const defaultPath = "src/blocks/data/grid-advanced-prospect-database.tsx";
const menuPath = "src/components/ui/dropdown-menu.tsx";

function location(primitive: "radix" | "base", style: string, kind: "block" | "preview") {
  const params = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  return `${primitive === "base" ? "./base/" : "./"}#/${kind}/${route}?${params}`;
}

for (const primitive of ["radix", "base"] as const) {
  for (const style of UI_STYLES) {
    test(`Prospect #23 uses ${primitive} ${style} on desktop and phone`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(location(primitive, style, "preview"));
        const region = page.getByRole("region", { name: "Prospect database", exact: true });
        await expect(region).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
        await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
        const css = getUiStyleCss(style).trim();
        if (css) {
          await expect
            .poll(async () => (await page.locator("#preview-preset").textContent())?.includes(css))
            .toBe(true);
        }
        await expect(region.locator("tbody tr")).toHaveCount(10);
        const frame = await region.locator(".prospect-database-frame").boundingBox();
        expect(frame).toMatchObject(
          width === 390 ? { x: 16, width: 358 } : { x: 112, width: 1216 },
        );
        const add = region.getByRole("button", { name: "Add Company", exact: true });
        await add.press("Enter");
        const editor = page.getByRole("dialog");
        await expect(editor).toContainText("Add Company");
        await page.keyboard.press("Escape");
        await expect(editor).toBeHidden();
        await expect(add).toBeFocused();

        if (width === 390) {
          await region
            .getByRole("button", { name: "Search companies", exact: true })
            .press("Enter");
        }
        const search = region.getByRole("textbox", { name: "Search companies", exact: true });
        if (width === 390) await expect(search).toBeFocused();
        await search.fill("Alderline");
        await expect(region.locator("tbody tr")).toHaveCount(1);
        await expect(region.getByRole("button", { name: "Open Alderline Works" })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await search.clear();
      }
      expect(errors).toEqual([]);
    });
  }

  test(`Prospect #23 exports the active ${primitive} implementation and style`, async ({
    page,
    context,
  }, info) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const style = primitive === "base" ? "maia" : "mira";
    const target: SourceTarget = {
      id,
      name: "Prospect Database",
      kind: "block",
      route: location(primitive, style, "block"),
      defaultPath,
      selectedPath: defaultPath,
      requiredFiles: [
        defaultPath,
        "src/blocks/data/grid-advanced-prospect-database-data.ts",
        "src/blocks/data/grid-advanced-prospect-database-model.ts",
        "src/blocks/data/grid-advanced-prospect-database-panels.tsx",
        "src/blocks/data/grid-advanced-prospect-database.css",
        "src/components/reui/data-grid/data-grid.tsx",
        "src/components/reui/filters/filters.tsx",
        "src/components/ui/input-group.tsx",
        "src/components/reui/REUI-LICENSE.txt",
        "src/blocks/assets/Inter-LICENSE.txt",
        menuPath,
      ],
    };
    const { dialog, choice, opener } = await openSource(page, target, "archive");
    const { files } = await captureOriginalArchive(page, target, dialog, info);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
    for (const filename of target.requiredFiles) expect(files[filename], filename).toBeDefined();
    expect(JSON.parse(Buffer.from(files["components.json"]).toString("utf8")).style).toBe(
      `${primitive}-${style}`,
    );
    expect(Buffer.from(files["src/theme.css"]).toString("utf8")).toContain(
      getUiStyleCss(style).trim(),
    );

    for (const selectedPath of [defaultPath, menuPath]) {
      const sourcePath =
        selectedPath === menuPath && primitive === "base"
          ? "src/foundations/base/ui/dropdown-menu.tsx"
          : selectedPath;
      const expected = await fileBytes(sourcePath);
      expect(Buffer.from(files[selectedPath]), selectedPath).toEqual(expected);
      const selected = { ...target, selectedPath };
      const code = await selectSource(page, selected, dialog, choice);
      const text = expected.toString("utf8");
      await expect.poll(() => sourceText(code, selected)).toBe(text);
      await code.getByRole("button", { name: "Copy", exact: true }).click();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(text);
      const pending = page.waitForEvent("download");
      await code.getByRole("button", { name: "Download source file", exact: true }).click();
      const download = await pending;
      const path = info.outputPath(basename(selectedPath));
      await download.saveAs(path);
      expect(download.suggestedFilename()).toBe(basename(selectedPath));
      expect(await readFile(path)).toEqual(expected);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
}
