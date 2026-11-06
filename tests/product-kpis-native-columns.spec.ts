import { expect, test, type ElementHandle, type Locator, type Page } from "@playwright/test";
import { productKpiRows } from "../src/blocks/data/grid-advanced-seeds";

// Runs against the normal preview after the Product KPIs native-column pilot is integrated.
// No style, synthetic event or focus injection is used; visual values are observations, not goldens.
// The free menu follows actual column schema order. The former handwritten menu listed
// Revenue Trend / Promo Calendar / Profit; this spec does not claim official visual parity.
const route = "./#/preview/data-grid/advanced/data-grid-advanced-8";
const runtimeErrors = new WeakMap<Page, string[]>();
const runtimeWarnings = new WeakMap<Page, string[]>();
const optionalColumns = ["Revenue Trend", "Profit", "Promo Calendar"];
const tableSelector = '[data-slot="data-grid-table"]';

function ids(records: typeof productKpiRows) {
  return records.map((record) => String(record.id));
}

async function expectRowIds(table: Locator, expected: string[]) {
  const rows = table.locator("tbody tr[data-row-id]");
  await expect(rows).toHaveCount(expected.length);
  await expect
    .poll(() => rows.evaluateAll((items) => items.map((row) => row.getAttribute("data-row-id"))))
    .toEqual(expected);
}

async function expectSameTable(original: ElementHandle, table: Locator) {
  expect(await original.evaluate((node) => node.isConnected)).toBe(true);
  expect(await table.evaluate((node, previous) => node === previous, original)).toBe(true);
}

async function expectNoOuterOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    )
    .toBe(false);
}

async function closeColumns(page: Page, trigger: Locator) {
  await page.keyboard.press("Escape");
  // Native close-focus runs with the actual popup lifecycle, including exit animation.
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

async function attachPopupEvidence(page: Page, trigger: Locator, menu: Locator, width: number) {
  // Read the real opening animation's completion instead of sleeping for an assumed duration.
  await menu.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  const measure = (locator: Locator) =>
    locator.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight,
        borderRadius: style.borderRadius,
        padding: style.padding,
        textTransform: style.textTransform,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        fontsStatus: document.fonts.status,
      };
    });
  const [triggerStyle, popupStyle, firstItemStyle] = await Promise.all([
    measure(trigger),
    measure(menu),
    measure(menu.getByRole("menuitemcheckbox", { name: "Revenue Trend", exact: true })),
  ]);
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(popupStyle.bounds.x).toBeGreaterThanOrEqual(0);
  expect(popupStyle.bounds.y).toBeGreaterThanOrEqual(0);
  expect(popupStyle.bounds.x + popupStyle.bounds.width).toBeLessThanOrEqual(viewport!.width);
  expect(popupStyle.bounds.y + popupStyle.bounds.height).toBeLessThanOrEqual(viewport!.height);
  await test.info().attach(`product-columns-${width}px-computed-style`, {
    body: JSON.stringify(
      {
        url: page.url(),
        title: await page.title(),
        viewport,
        trigger: triggerStyle,
        popup: popupStyle,
        firstItem: firstItemStyle,
        limit:
          "Recorded for official menu comparison; no unobserved font or geometry parity claim.",
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await test.info().attach(`product-columns-${width}px-open`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  runtimeErrors.set(page, errors);
  runtimeWarnings.set(page, warnings);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
    if (message.type() === "warning") warnings.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  await test.info().attach("product-columns-console", {
    body: JSON.stringify(
      { errors: runtimeErrors.get(page) ?? [], warnings: runtimeWarnings.get(page) ?? [] },
      null,
      2,
    ),
    contentType: "application/json",
  });
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});

function revenueText(record: (typeof productKpiRows)[number], factor: number) {
  return `$${((record.revenue * factor) / 1000).toFixed(1)}K`;
}

function profitText(record: (typeof productKpiRows)[number], factor: number) {
  return `${record.profit < 0 ? "-" : ""}$${((Math.abs(record.profit) * factor) / 1000).toFixed(1)}K`;
}

async function expectOptionalHeader(table: Locator, name: string, present: boolean) {
  // A native modal menu aria-hides its background. This is a read-only query of the
  // real background header, never a workaround for clicking an unavailable control.
  await expect(
    table.getByRole("columnheader", { name, exact: true, includeHidden: true }),
  ).toHaveCount(present ? 1 : 0);
}

async function expectMenuState(menu: Locator, checked: boolean[]) {
  const items = menu.getByRole("menuitemcheckbox");
  await expect(items).toHaveCount(optionalColumns.length);
  await expect
    .poll(async () => (await items.allTextContents()).map((value) => value.trim()))
    .toEqual(optionalColumns);
  for (const [index, name] of optionalColumns.entries()) {
    await expect(menu.getByRole("menuitemcheckbox", { name, exact: true })).toHaveAttribute(
      "aria-checked",
      String(checked[index]),
    );
  }
}

for (const width of [1440, 390]) {
  test(`Product KPIs native column menu preserves real grid state at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(route);
    await expect(page).toHaveURL(/#\/preview\/data-grid\/advanced\/data-grid-advanced-8$/);
    // includeHidden permits observation while the real modal portal aria-hides its
    // background. Every interaction below uses ordinary visible native controls.
    const frame = page.getByRole("region", {
      name: "Product KPIs",
      exact: true,
      includeHidden: true,
    });
    const table = frame.locator(tableSelector);
    await expect(frame).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(1);
    await expect(table).toBeVisible();
    const original = await table.elementHandle();
    if (!original) throw new Error("Product KPIs must render its actual native DataGrid table.");
    await expectRowIds(table, ids(productKpiRows.slice(0, 10)));
    const originalHeaderCount = await table.getByRole("columnheader").count();

    // Revenue's actual numeric accessor sorts raw fixture values times the positive
    // period factor. Sorting and pagination expectations do not import a UI predicate.
    const revenueSort = table.getByRole("button", { name: "Revenue", exact: true });
    await revenueSort.click();
    await revenueSort.click();
    const descending = productKpiRows.toSorted((a, b) => b.revenue - a.revenue);
    await expectRowIds(table, ids(descending.slice(0, 10)));
    await frame.getByRole("button", { name: "Go to page 2", exact: true }).click();
    const pageTwo = descending.slice(10, 20);
    await expectRowIds(table, ids(pageTwo));
    const pageTwoButton = frame.getByRole("button", { name: "Go to page 2", exact: true });
    await expect(pageTwoButton).toHaveAttribute("aria-current", "page");

    await frame.getByRole("button", { name: "4W", exact: true }).click();
    await expect(frame.getByRole("button", { name: "4W", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expectRowIds(table, ids(pageTwo));
    const sample = pageTwo[0];
    expect(sample.revenue).toBeGreaterThan(0);
    expect(sample.profit).not.toBe(0);
    const sampleRow = table.locator(`tbody tr[data-row-id="${sample.id}"]`);
    await expect(sampleRow.getByRole("cell").nth(1)).toContainText(revenueText(sample, 4 / 13));
    await expect(sampleRow.getByRole("cell").nth(3)).toHaveText(profitText(sample, 4 / 13));

    const trigger = frame.getByRole("button", {
      name: "Display",
      exact: true,
      includeHidden: true,
    });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByText("Toggle Columns", { exact: true })).toBeVisible();
    await expectMenuState(menu, [true, true, true]);
    await attachPopupEvidence(page, trigger, menu, width);

    const trend = menu.getByRole("menuitemcheckbox", { name: "Revenue Trend", exact: true });
    await trend.click();
    await expectMenuState(menu, [false, true, true]);
    await expect(menu).toBeVisible();
    await expectOptionalHeader(table, "Revenue Trend", false);
    await expect(trend).toBeFocused();
    await page.keyboard.press("Space");
    await expectMenuState(menu, [true, true, true]);
    await expectOptionalHeader(table, "Revenue Trend", true);

    for (const name of ["Profit", "Promo Calendar"]) {
      await menu.getByRole("menuitemcheckbox", { name, exact: true }).click();
      await expectOptionalHeader(table, name, false);
      await expect(menu).toBeVisible();
    }
    await expectMenuState(menu, [true, false, false]);
    await expect(table.getByRole("columnheader", { includeHidden: true })).toHaveCount(
      originalHeaderCount - 2,
    );
    await expectRowIds(table, ids(pageTwo));
    await expectSameTable(original, table);
    await closeColumns(page, trigger);
    await expect(pageTwoButton).toHaveAttribute("aria-current", "page");
    await expect(frame.getByRole("button", { name: "4W", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(sampleRow.getByRole("cell").nth(1)).toContainText(revenueText(sample, 4 / 13));

    const search = frame.getByRole("textbox", { name: "Search products...", exact: true });
    await search.fill(sample.name);
    await expect(search).toHaveValue(sample.name);
    await expectRowIds(table, [String(sample.id)]);
    await expectOptionalHeader(table, "Profit", false);
    await expectOptionalHeader(table, "Promo Calendar", false);
    await trigger.click();
    await expectMenuState(menu, [true, false, false]);
    await expectRowIds(table, [String(sample.id)]);
    await closeColumns(page, trigger);
    await expect(search).toHaveValue(sample.name);
    await expect(frame.getByRole("button", { name: "4W", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(sampleRow.getByRole("cell").nth(1)).toContainText(revenueText(sample, 4 / 13));
    await search.fill("");
    await expectRowIds(table, ids(descending.slice(0, 10)));
    await expect(frame.getByRole("button", { name: "Go to page 1", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await frame.getByRole("button", { name: "13W", exact: true }).click();
    await expect(frame.getByRole("button", { name: "13W", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expectRowIds(table, ids(descending.slice(0, 10)));
    const first = descending[0];
    const firstRow = table.locator(`tbody tr[data-row-id="${first.id}"]`);
    await expect(firstRow.getByRole("cell").nth(1)).toContainText(revenueText(first, 1));
    await trigger.click();
    await expectMenuState(menu, [true, false, false]);
    await menu.getByRole("menuitemcheckbox", { name: "Profit", exact: true }).click();
    await expectMenuState(menu, [true, true, false]);
    await expectOptionalHeader(table, "Profit", true);
    await closeColumns(page, trigger);
    await expect(firstRow.getByRole("cell").nth(3)).toHaveText(profitText(first, 1));
    await expectSameTable(original, table);
    await expect(page.getByRole("table")).toHaveCount(1);
    await expectNoOuterOverflow(page);
  });
}
