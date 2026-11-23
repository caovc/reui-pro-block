import { expect, test } from "@playwright/test";
import { UI_STYLES } from "../src/foundations/styles";

const radius = { nova: 10, vega: 8, maia: 26, lyra: 0, mira: 8, luma: 22, sera: 0, rhea: 18 };
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
const cases = [
  { id: 29, name: "Family budget", input: "Plan Groceries", chart: "Household cash flow forecast" },
  {
    id: 30,
    name: "Inventory manager",
    input: "Count Refill bottle 500ml",
    chart: "Warehouse stock movements",
  },
  {
    id: 31,
    name: "Vendor SLA scorecard",
    input: "Actual North Pier Orders on time",
    chart: "Vendor service credits by month",
  },
];
for (const primitive of ["radix", "base"] as const) {
  for (const style of UI_STYLES) {
    for (const block of cases) {
      test(`${block.name} keeps actual free controls and charts in ${primitive} ${style}`, async ({
        page,
      }) => {
        const faults: string[] = [];
        page.on("pageerror", (error) => faults.push(error.message));
        const preset = new URLSearchParams({
          preset: JSON.stringify({ primitive, style, accent: "emerald", mode: "dark" }),
        });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(
          `${primitive === "base" ? "./base/" : "./"}#/preview/data-grid/advanced/data-grid-advanced-${block.id}?${preset}`,
        );
        const html = page.locator("html");
        await expect(html).toHaveAttribute("data-ui-primitive", primitive);
        await expect(html).toHaveAttribute("data-ui-style", style);
        await expect(html).toHaveClass(/dark/);
        await expect(html).toHaveCSS("--primary", "#047857");
        const region = page.getByRole("region", { name: block.name, exact: true });
        const frame = region.locator('[data-slot="frame"]').first();
        await expect(frame).toBeVisible();
        await expect(frame).toHaveCSS("border-top-left-radius", `${frameRadius[style]}px`);
        const input = region.getByLabel(block.input, { exact: true });
        const group = input.locator("..");
        await expect(group).toHaveAttribute("data-slot", "number-field-group");
        await expect(group).toHaveCSS("height", "28px");
        await expect(group).toHaveCSS("border-top-left-radius", `${radius[style]}px`);
        await expect(region.locator('[data-slot="data-grid"]')).not.toHaveCount(0);
        await expect(
          region.getByRole("group", {
            name: `${block.chart}. Arrow keys move between points.`,
            exact: true,
          }),
        ).toBeVisible();
        const month = region.getByLabel("Planning month", { exact: true });
        await month.press("ArrowDown");
        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();
        await expect(page.locator('[data-slot="select-content"]')).toHaveAttribute(
          primitive === "base" ? "data-open" : "data-state",
          primitive === "base" ? "" : "open",
        );
        await page.keyboard.press("Escape");
        await expect(listbox).toHaveCount(0);
        await expect(month).toBeFocused();
        expect(faults).toEqual([]);
      });
    }
  }
}
