import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const styles = ["nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"];
const boards = [
  {
    id: "data-grid-advanced-18",
    title: "Supplier Quality Board",
    add: "Add supplier",
    field: "Supplier name",
  },
  {
    id: "data-grid-advanced-19",
    title: "Category Forecast",
    add: "Add product line",
    field: "Product line",
  },
];

for (const library of ["radix", "base"])
  for (const style of styles)
    for (const width of [320, 1440])
      for (const board of boards)
        test(`${library} ${style} ${width} ${board.title} keeps real controls usable`, async ({
          page,
        }, info) => {
          const errors: string[] = [];
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("console", (message) => {
            if (["warning", "error"].includes(message.type())) errors.push(message.text());
          });
          await page.setViewportSize({ width, height: width === 320 ? 844 : 1000 });
          const preset = new URLSearchParams({
            preset: JSON.stringify({ primitive: library, style }),
          });
          await page.goto(
            `${library === "base" ? "./base/" : "./"}#/preview/data-grid/advanced/${board.id}?${preset}`,
          );
          const region = page.getByRole("region", { name: board.title, exact: true });
          await expect(
            region.getByRole("heading", { name: board.title, exact: true }),
          ).toBeVisible();
          await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", library);
          await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
          await page.evaluate(() => document.fonts.ready);
          const toolbar = region.locator(".review-toolbar");
          const bounds = await toolbar.locator("button,input").evaluateAll((controls) =>
            controls.map((control) => {
              const rect = control.getBoundingClientRect();
              return {
                label: control.getAttribute("aria-label") || control.textContent?.trim(),
                left: rect.left,
                right: rect.right,
                width: rect.width,
                viewport: innerWidth,
              };
            }),
          );
          for (const value of bounds) {
            expect(value.left, JSON.stringify(value)).toBeGreaterThanOrEqual(0);
            expect(value.right, JSON.stringify(value)).toBeLessThanOrEqual(value.viewport);
            expect(value.width, JSON.stringify(value)).toBeGreaterThan(0);
          }
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          await page.screenshot({ path: info.outputPath("board.png"), animations: "disabled" });
          if (board.id.endsWith("19")) {
            await expect(region.getByRole("slider")).toHaveCount(4);
            await expect(
              region.getByRole("slider", { name: "Technology growth on 2025", exact: true }),
            ).toHaveCount(1);
          }
          const add = region.getByRole("button", { name: board.add, exact: true });
          await add.press("Enter");
          const editor = page.getByRole("dialog", { name: board.add, exact: true });
          await expect(
            editor.getByRole("textbox", { name: board.field, exact: true }),
          ).toBeFocused();
          await page.keyboard.press("Escape");
          await expect(editor).toBeHidden();
          await expect(add).toBeFocused();
          await writeFile(
            info.outputPath("style-health.json"),
            JSON.stringify({ library, style, width, board: board.id, bounds, errors }, null, 2),
          );
          expect(errors).toEqual([]);
        });
