import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  type SourceTarget,
} from "./fidelity-next-source.helpers";
import { createScaleupCompanies } from "../src/blocks/data/grid-advanced-scaleup-index-model";

const id = "data-grid-advanced-20";
const destination = "/data-grid/advanced/" + id;
const source = "src/blocks/data/grid-advanced-scaleup-index";
const reui = "src/components/reui/";
const menu = "src/components/ui/dropdown-menu.tsx";
const fixture = createScaleupCompanies().find(({ name }) => name === "Canopy Mobility")!;
const valueName = "Canopy Mobility, Recurring";

for (const library of ["radix", "base"] as const) {
  const entry = library === "base" ? "./base/" : "./";
  const style = library === "base" ? "sera" : "nova";
  const preset = new URLSearchParams({ preset: JSON.stringify({ primitive: library, style }) });
  const preview = entry + "#/preview" + destination + "?" + preset;

  test(
    library + " Scale-up Index applies year and province filters and downloads visible data",
    async ({ page }, info) => {
      await page.setViewportSize({ width: 1440, height: 950 });
      await page.goto(preview);
      const register = page.getByRole("region", { name: "Scale-up Index" });
      await expect(
        register.getByRole("heading", { name: "Scale-up Index", exact: true }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", library);
      await expect(register.getByText("16 of 16 companies", { exact: true })).toBeVisible();
      const sales = register
        .getByText("Combined sales", { exact: true })
        .locator("..")
        .locator("dd");
      const initialSales = await sales.textContent();
      await register.getByRole("combobox", { name: "Index year", exact: true }).click();
      await page.getByRole("option", { name: "2024", exact: true }).click();
      await expect(sales).not.toHaveText(initialSales!);

      const map = register.getByRole("group", { name: "Schematic province map" });
      await expect(map.getByRole("button")).toHaveCount(12);
      const province = map.getByRole("button", { name: "Show companies in Zeeland", exact: true });
      await province.click();
      await expect(province).toHaveAttribute("aria-pressed", "true");
      await expect(map.locator("..").getByText("1 company", { exact: true })).toBeVisible();
      await expect(register.getByText("1 of 16 companies", { exact: true })).toBeVisible();
      const company = register.getByRole("button", { name: fixture.name, exact: true });
      await company.press("Enter");
      const profile = page.getByRole("dialog", { name: fixture.name, exact: true });
      await expect(
        profile.getByRole("heading", { name: "Reporting history", exact: true }),
      ).toBeVisible();
      await expect(profile.getByText("Index year").locator("..")).toContainText("2024");
      await page.keyboard.press("Escape");
      await expect(profile).toBeHidden();
      await expect(company).toBeFocused();

      const waiting = page.waitForEvent("download");
      await register.getByRole("button", { name: "Export CSV", exact: true }).click();
      const download = await waiting;
      expect(download.suggestedFilename()).toBe("scale-up-index-2024.csv");
      const receipt = info.outputPath(download.suggestedFilename());
      await download.saveAs(receipt);
      const csv = await readFile(receipt, "utf8");
      expect(csv.split("\r\n")).toHaveLength(2);
      expect(csv).toContain('"Canopy Mobility","Zeeland","2024"');
      expect(csv).toContain(
        String((fixture.facts.find((fact) => fact.year === 2024)!.revenueCents / 100).toFixed(2)),
      );
      await province.click();
      await expect(register.getByText("16 of 16 companies", { exact: true })).toBeVisible();
      await page.screenshot({
        path: info.outputPath("scale-up-desktop.png"),
        animations: "disabled",
      });
    },
  );

  test(
    library + " Scale-up Index edits native screening cells and restores them at phone width",
    async ({ page }, info) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(preview);
      const register = page.getByRole("region", { name: "Scale-up Index" });
      const search = register.getByRole("searchbox", { name: "Search companies" });
      await search.fill(fixture.name);
      await register.getByRole("checkbox", { name: "Ranked only", exact: true }).check();
      await expect(register.getByText("1 of 16 companies", { exact: true })).toBeVisible();
      expect(await page.locator("html").evaluate((node) => node.scrollWidth)).toBe(390);
      const cell = register.getByRole("button", { name: valueName + ": Yes", exact: true });
      await cell.press("ArrowDown");
      const popup = page.getByRole("menu");
      await expect(popup).toBeVisible();
      if (library === "base") await expect(popup).toHaveAttribute("data-open", "");
      else await expect(popup).toHaveAttribute("data-state", "open");
      await popup.getByRole("menuitemradio", { name: "N/A", exact: true }).click();
      const neutral = register.getByRole("button", { name: valueName + ": N/A", exact: true });
      await expect(neutral).toBeFocused();
      await expect(register.getByText("1 of 16 companies", { exact: true })).toBeVisible();
      await neutral.press("ArrowDown");
      await popup.getByRole("menuitemradio", { name: "No", exact: true }).click();
      await expect(
        register.getByText("No records match your filters.", { exact: true }),
      ).toBeVisible();
      await expect(search).toBeFocused();
      await register.getByRole("button", { name: "Undo check", exact: true }).click();
      await expect(neutral).toBeVisible();
      await expect(register.getByText("1 of 16 companies", { exact: true })).toBeVisible();
      await page.screenshot({
        path: info.outputPath("scale-up-phone.png"),
        animations: "disabled",
      });
    },
  );

  test(
    library + " Scale-up Index exports its implementation and selected native menu",
    async ({ page, context }, info) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const route = entry + "#/block" + destination + "?" + preset;
      await page.goto(route);
      const frame = page.frameLocator('iframe[title="Scale-up Index live preview"]');
      await expect(
        frame.getByRole("heading", { name: "Scale-up Index", exact: true }),
      ).toBeVisible();
      await expect(frame.locator("html")).toHaveAttribute("data-ui-primitive", library);
      await expect(frame.locator("html")).toHaveAttribute("data-ui-style", style);
      const target: SourceTarget = {
        kind: "block",
        id,
        name: "Scale-up Index",
        route,
        defaultPath: source + ".tsx",
        selectedPath: source + "-model.ts",
        requiredFiles: [
          source + ".tsx",
          source + "-model.ts",
          source + ".css",
          reui + "data-grid/data-grid.tsx",
          reui + "frame.tsx",
          menu,
          reui + "REUI-LICENSE.txt",
          "src/blocks/assets/Inter-LICENSE.txt",
        ],
      };
      const { dialog, choice, opener } = await openSource(page, target, "archive");
      const { files } = await captureOriginalArchive(page, target, dialog, info);
      for (const filename of target.requiredFiles) {
        const native =
          library === "base" && filename === menu
            ? "src/foundations/base/ui/dropdown-menu.tsx"
            : filename;
        expect(Buffer.from(files[filename]), filename).toEqual(await fileBytes(native));
      }
      const viewer = await selectSource(page, target, dialog, choice);
      const expected = (await fileBytes(target.selectedPath)).toString("utf8");
      await expect.poll(() => sourceText(viewer, target)).toBe(expected);
      await viewer.getByRole("button", { name: "Copy", exact: true }).click();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
      const pending = page.waitForEvent("download");
      await viewer.getByRole("button", { name: "Download source file", exact: true }).click();
      const downloaded = await pending;
      expect(downloaded.suggestedFilename()).toBe("grid-advanced-scaleup-index-model.ts");
      expect((await readFile((await downloaded.path())!)).toString("utf8")).toBe(expected);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    },
  );
}
