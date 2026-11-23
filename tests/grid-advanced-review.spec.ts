import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  verifyOriginalClosure,
  type SourceTarget,
} from "./fidelity-next-source.helpers";
import {
  createCategoryForecast,
  forecastMetrics,
} from "../src/blocks/data/grid-advanced-category-forecast-model";

const supplier = {
  id: "data-grid-advanced-18",
  title: "Supplier Quality Board",
  module: "grid-advanced-supplier-quality",
  editor: "editors",
};
const forecast = {
  id: "data-grid-advanced-19",
  title: "Category Forecast",
  module: "grid-advanced-category-forecast",
  editor: "editor",
};
const fixture = createCategoryForecast();
const health = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  health.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) errors.push(message.text());
  });
});

test.afterEach(async ({ page }, info) => {
  const errors = health.get(page) ?? [];
  await writeFile(info.outputPath("health.json"), JSON.stringify(errors, null, 2));
  expect(errors).toEqual([]);
});

function summary(region: Locator, label: string) {
  return region
    .locator(".review-summary")
    .getByText(label, { exact: true })
    .locator("..")
    .locator("dd");
}

async function choose(page: Page, region: Locator, label: string, option: string) {
  const trigger = region.getByRole("combobox", { name: label, exact: true });
  await trigger.click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

async function enterNumber(dialog: Locator, label: string, value: string) {
  const input = dialog.getByRole("textbox", { name: label, exact: true });
  await input.fill(value);
  await input.press("Tab");
}

for (const library of ["radix", "base"] as const) {
  const entry = library === "base" ? "./base/" : "./";
  const style = library === "base" ? "sera" : "nova";
  const preset = new URLSearchParams({ preset: JSON.stringify({ primitive: library, style }) });
  const route = (id: string, kind = "preview") =>
    entry + `#/${kind}/data-grid/advanced/${id}?` + preset;

  test(`${library} Supplier18 reviews actual lots, validates units and exports the filtered result`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route(supplier.id));
    const region = page.getByRole("region", { name: supplier.title, exact: true });
    await expect(region.getByRole("heading", { name: supplier.title, exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", library);
    await expect(
      region.getByRole("list", { name: "Inspection disposition key" }).locator("li"),
    ).toContainText(["Accepted", "Review", "Rejected"]);
    const aster = region
      .locator("tbody tr")
      .filter({ has: page.getByRole("button", { name: "Aster Circuit Works", exact: true }) });
    await expect(aster).toContainText("22.2%");
    const lot = region.getByRole("button", {
      name: "Review lot-1-1: score 58, 120 units, Rejected",
      exact: true,
    });
    await lot.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Review inspection", exact: true });
    await expect(dialog).toBeVisible();
    await enterNumber(dialog, "Inspected units", "0");
    await dialog.getByRole("button", { name: "Save review", exact: true }).click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Enter a positive whole number of inspected units.",
    );
    await enterNumber(dialog, "Inspected units", "200");
    await enterNumber(dialog, "Quality score", "92");
    await choose(page, dialog, "Disposition", "Accepted");
    await dialog
      .getByRole("textbox", { name: "Inspection note", exact: true })
      .fill("Reinspection accepted after adjustment.");
    await dialog.getByRole("button", { name: "Save review", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(aster).toContainText("33.3%");
    await expect(
      region.getByRole("button", {
        name: "Review lot-1-1: score 92, 200 units, Accepted",
        exact: true,
      }),
    ).toHaveCount(1);
    await expect(region.getByRole("button", { name: "Undo", exact: true })).toBeEnabled();
    await region.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(aster).toContainText("22.2%");
    await expect(lot).toHaveCount(1);
    await region.getByRole("textbox", { name: "Search suppliers", exact: true }).fill("Aster");
    await choose(page, region, "Inspection period", "Last 30 days");
    await expect(summary(region, "Inspected lots")).toHaveText("4");
    await expect(summary(region, "Accepted lots")).toHaveText("25.0%");
    const pending = page.waitForEvent("download");
    await region.getByRole("button", { name: "Export", exact: true }).click();
    const downloaded = await pending;
    await downloaded.saveAs(info.outputPath(downloaded.suggestedFilename()));
    const csv = await readFile((await downloaded.path())!, "utf8");
    expect(csv).toContain('"Aster Circuit Works","Electronics","Strategic","4","1","25"');
    expect(csv).not.toContain("Copperleaf");
    await page.screenshot({
      path: info.outputPath("supplier-review-filtered.png"),
      animations: "disabled",
    });
  });

  test(`${library} Supplier18 creates a supplier at phone width and reverses the spend change`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route(supplier.id));
    const region = page.getByRole("region", { name: supplier.title, exact: true });
    const add = region.getByRole("button", { name: "Add supplier", exact: true });
    await add.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Add supplier", exact: true });
    await dialog
      .getByRole("textbox", { name: "Supplier name", exact: true })
      .fill("Orchard Components");
    await dialog.getByRole("textbox", { name: "Review owner", exact: true }).fill("Maya Stone");
    await enterNumber(dialog, "November spend (USD)", "1234.56");
    await dialog.getByRole("button", { name: "Add supplier", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(add).toBeFocused();
    await expect(summary(region, "Suppliers")).toHaveText("4");
    const created = region.getByRole("button", { name: "Orchard Components", exact: true });
    await expect(created).toBeVisible();
    await created.press("Enter");
    const editor = page.getByRole("dialog", { name: "Edit supplier", exact: true });
    await expect(
      editor.getByRole("textbox", { name: "November spend (USD)", exact: true }),
    ).toHaveValue("$1,234.56");
    await page.keyboard.press("Escape");
    await expect(editor).toBeHidden();
    await expect(created).toBeFocused();
    const action = region.getByRole("button", {
      name: "Actions for Orchard Components",
      exact: true,
    });
    await action.scrollIntoViewIfNeeded();
    const geometry = await action.evaluate((button) => {
      const cell = button.closest("td");
      if (!cell) throw new Error("Supplier action is missing its native table cell");
      const cellRect = cell.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const style = getComputedStyle(cell);
      return {
        cellWidth: cellRect.width,
        availableContentWidth:
          cellRect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        buttonWidth: buttonRect.width,
        cellClientWidth: cell.clientWidth,
        cellScrollWidth: cell.scrollWidth,
      };
    });
    await writeFile(
      info.outputPath("supplier-action-cell-geometry.json"),
      JSON.stringify(geometry, null, 2),
    );
    expect(geometry.availableContentWidth).toBeGreaterThanOrEqual(geometry.buttonWidth);
    await page.screenshot({
      path: info.outputPath("supplier-action-cell.png"),
      animations: "disabled",
    });
    await action.click();
    await page.getByRole("menuitem", { name: "Add inspection", exact: true }).click();
    const inspection = page.getByRole("dialog", { name: "Add inspection", exact: true });
    await expect(
      inspection.getByRole("textbox", { name: "Quality score", exact: true }),
    ).toHaveValue("85");
    await inspection.getByRole("button", { name: "Add inspection", exact: true }).click();
    await expect(inspection).toBeHidden();
    await expect(summary(region, "Inspected lots")).toHaveText("28");
    await region.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(summary(region, "Inspected lots")).toHaveText("27");
    await expect(created).toHaveCount(1);
    await region.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(created).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("supplier-phone.png"), animations: "disabled" });
  });

  test(`${library} Forecast19 uses named native growth thumbs, monthly details and reversible totals`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route(forecast.id));
    const region = page.getByRole("region", { name: forecast.title, exact: true });
    await expect(region.getByRole("heading", { name: forecast.title, exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", library);
    const growth = region.getByRole("slider", { name: "Technology growth on 2025", exact: true });
    const initial = fixture.growthBasisPoints.Technology / 100;
    await expect(growth).toHaveAttribute("aria-valuenow", String(initial));
    const before = await summary(region, "2026 forecast").textContent();
    await growth.focus();
    await growth.press("ArrowRight");
    await expect(growth).toHaveAttribute("aria-valuenow", String(initial + 1));
    const changedMonth = region.getByRole("button", {
      name: "Inspect Connected audio, Jan 2026",
      exact: true,
    });
    await changedMonth.press("Enter");
    const changedDetails = page.getByRole("dialog", { name: "Jan 2026 forecast", exact: true });
    const changedMetrics = forecastMetrics([fixture.lines[0]], {
      ...fixture.growthBasisPoints,
      Technology: (initial + 1) * 100,
    });
    await expect(summary(changedDetails, "2026 forecast")).toHaveText(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(changedMetrics.months[0].forecastCents / 100),
    );
    await page.keyboard.press("Escape");
    await expect(changedDetails).toBeHidden();
    await expect(changedMonth).toBeFocused();
    await region.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(growth).toHaveAttribute("aria-valuenow", String(initial));
    await expect(summary(region, "2026 forecast")).toHaveText(before!);
    await expect(region.getByText("Share of visible forecast", { exact: true })).toHaveCount(4);
    const month = region.getByRole("button", {
      name: "Inspect Connected audio, Jan 2026",
      exact: true,
    });
    await month.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Jan 2026 forecast", exact: true });
    await expect(dialog).toContainText("Connected audio");
    const expected = forecastMetrics([fixture.lines[0]], fixture.growthBasisPoints).months[0];
    await expect(summary(dialog, "2026 forecast")).toHaveText(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(expected.forecastCents / 100),
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(month).toBeFocused();
    await region
      .getByRole("textbox", { name: "Search product lines", exact: true })
      .fill("Connected audio");
    await expect(summary(region, "Product lines")).toHaveText("1");
    await expect(
      region
        .getByRole("row")
        .filter({ has: page.getByText("Share of visible forecast", { exact: true }) }),
    ).toContainText("100.0%");
    const pending = page.waitForEvent("download");
    await region.getByRole("button", { name: "Export", exact: true }).click();
    const downloaded = await pending;
    await downloaded.saveAs(info.outputPath(downloaded.suggestedFilename()));
    const csv = await readFile((await downloaded.path())!, "utf8");
    expect(csv).toContain('"Connected audio","Technology"');
    expect(csv).toContain(
      String(forecastMetrics([fixture.lines[0]], fixture.growthBasisPoints).forecastCents / 100),
    );
    expect(csv).not.toContain("Desk essentials");
    await page.screenshot({
      path: info.outputPath("forecast-monthly.png"),
      animations: "disabled",
    });
  });

  test(`${library} Forecast19 creates exact annual allocations and edits the plan at phone width`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route(forecast.id));
    const region = page.getByRole("region", { name: forecast.title, exact: true });
    const add = region.getByRole("button", { name: "Add product line", exact: true });
    await add.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Add product line", exact: true });
    await dialog
      .getByRole("textbox", { name: "Product line", exact: true })
      .fill("Workshop equipment");
    await enterNumber(dialog, "2025 sales (USD)", "10000.01");
    await enterNumber(dialog, "2026 plan (USD)", "12000.07");
    await dialog.getByRole("button", { name: "Add product line", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(add).toBeFocused();
    await region
      .getByRole("textbox", { name: "Search product lines", exact: true })
      .fill("Workshop equipment");
    await expect(summary(region, "Product lines")).toHaveText("1");
    const line = region.getByRole("button", { name: "Workshop equipment", exact: true });
    await line.press("Enter");
    const editor = page.getByRole("dialog", { name: "Edit product line", exact: true });
    await expect(
      editor.getByRole("textbox", { name: "2025 sales (USD)", exact: true }),
    ).toHaveValue("$10,000.01");
    await expect(editor.getByRole("textbox", { name: "2026 plan (USD)", exact: true })).toHaveValue(
      "$12,000.07",
    );
    await enterNumber(editor, "2026 plan (USD)", "14000.09");
    await editor.getByRole("button", { name: "Save product line", exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(line).toBeFocused();
    await expect(summary(region, "Annual plan")).toHaveText("$14K");
    await region.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(summary(region, "Annual plan")).toHaveText("$12K");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("forecast-phone.png"), animations: "disabled" });
  });

  for (const board of [supplier, forecast])
    test(`${library} ${board.title} registered route and actual source, clipboard, file and original ZIP agree`, async ({
      page,
      context,
    }, info) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const source = "src/blocks/data/" + board.module;
      const target: SourceTarget = {
        id: board.id,
        name: board.title,
        kind: "block",
        route: route(board.id, "block"),
        defaultPath: source + ".tsx",
        selectedPath: source + "-model.ts",
        requiredFiles: [
          source + ".tsx",
          source + "-" + board.editor + ".tsx",
          source + "-model.ts",
          "src/blocks/data/grid-advanced-review-ui.tsx",
          "src/blocks/data/grid-advanced-review-charts.tsx",
          "src/blocks/data/grid-advanced-review.css",
          "src/components/reui/data-grid/data-grid.tsx",
          "src/components/reui/number-field.tsx",
          "src/components/reui/frame.tsx",
          "src/components/reui/REUI-LICENSE.txt",
          "src/blocks/assets/Inter-LICENSE.txt",
        ],
      };
      await page.goto(target.route);
      const frame = page.frameLocator("iframe");
      await expect(frame.getByRole("heading", { name: board.title, exact: true })).toBeVisible();
      await expect(frame.locator("html")).toHaveAttribute("data-ui-primitive", library);
      const { dialog, choice, opener } = await openSource(page, target, "archive");
      const { files } = await captureOriginalArchive(page, target, dialog, info);
      await verifyOriginalClosure(target, files, info, library);
      for (const filename of target.requiredFiles)
        expect(Buffer.from(files[filename]), filename).toEqual(await fileBytes(filename));
      const viewer = await selectSource(page, target, dialog, choice);
      const expected = (await fileBytes(target.selectedPath)).toString("utf8");
      await expect.poll(() => sourceText(viewer, target)).toBe(expected);
      await viewer.getByRole("button", { name: "Copy", exact: true }).click();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
      const pending = page.waitForEvent("download");
      await viewer.getByRole("button", { name: "Download source file", exact: true }).click();
      const downloaded = await pending;
      expect(downloaded.suggestedFilename()).toBe(board.module + "-model.ts");
      expect(await readFile((await downloaded.path())!, "utf8")).toBe(expected);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
      await writeFile(
        info.outputPath("source-byte-chain.json"),
        JSON.stringify(
          {
            library,
            id: board.id,
            selectedPath: target.selectedPath,
            source: true,
            clipboard: true,
            singleFile: true,
            originalZip: true,
          },
          null,
          2,
        ),
      );
    });
}
