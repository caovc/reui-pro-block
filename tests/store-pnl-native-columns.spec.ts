import { expect, test, type ElementHandle, type Locator, type Page } from "@playwright/test";
import { storePnlRows } from "../src/blocks/data/grid-advanced-seeds";

// Runs against the normal preview after the single-provider Store P&L pilot is integrated.
// No style, synthetic event or focus injection is used; visual values are observations, not goldens.
const route = "./#/preview/data-grid/advanced/data-grid-advanced-2";
const runtimeErrors = new WeakMap<Page, string[]>();
const runtimeWarnings = new WeakMap<Page, string[]>();
const optionalColumns = ["YoY", "Profit vs FY25", "Margin"];
const tableSelector = '[data-slot="data-grid-table"]';

function ids(records: typeof storePnlRows) {
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
    measure(menu.getByRole("menuitemcheckbox", { name: "YoY", exact: true })),
  ]);
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(popupStyle.bounds.x).toBeGreaterThanOrEqual(0);
  expect(popupStyle.bounds.y).toBeGreaterThanOrEqual(0);
  expect(popupStyle.bounds.x + popupStyle.bounds.width).toBeLessThanOrEqual(viewport!.width);
  expect(popupStyle.bounds.y + popupStyle.bounds.height).toBeLessThanOrEqual(viewport!.height);
  await test.info().attach(`store-columns-${width}px-computed-style`, {
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
  await test.info().attach(`store-columns-${width}px-open`, {
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
  await test.info().attach("store-columns-console", {
    body: JSON.stringify(
      { errors: runtimeErrors.get(page) ?? [], warnings: runtimeWarnings.get(page) ?? [] },
      null,
      2,
    ),
    contentType: "application/json",
  });
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`Store P&L native column menu preserves real grid state at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(route);
    await expect(page).toHaveURL(/#\/preview\/data-grid\/advanced\/data-grid-advanced-2$/);
    // A native modal menu hides the background from the accessibility tree.
    // Include it only for DOM observations; native actionability and focus checks remain.
    const frame = page.getByRole("region", { name: "Store P&L", exact: true, includeHidden: true });
    const table = frame.locator(tableSelector);
    await expect(frame).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(1);
    await expect(table).toBeVisible();
    const original = await table.elementHandle();
    if (!original) throw new Error("Store P&L must render its actual native DataGrid table.");
    await expectRowIds(table, ids(storePnlRows.slice(0, 10)));
    const originalHeaderCount = await table
      .getByRole("columnheader", { includeHidden: true })
      .count();

    const selected = storePnlRows[0];
    const selectedName = `Select ${selected.name} ${selected.id}`;
    await table.getByRole("checkbox", { name: selectedName, exact: true }).check();
    await expect(table.getByRole("checkbox", { name: selectedName, exact: true })).toBeChecked();

    // This is the actual numeric rank column, not the separate legacy export sort helper.
    const rankSort = table.getByRole("button", { name: "Sales #", exact: true });
    await rankSort.click();
    await rankSort.click();
    const descending = storePnlRows.toSorted((a, b) => b.id - a.id);
    await expectRowIds(table, ids(descending.slice(0, 10)));
    await frame.getByRole("button", { name: "Go to page 2", exact: true }).click();
    await expectRowIds(table, ids(descending.slice(10, 20)));
    await expect(frame.getByRole("button", { name: "Go to page 2", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const trigger = frame.getByRole("button", {
      name: "Columns",
      exact: true,
      includeHidden: true,
    });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByText("Toggle Columns", { exact: true })).toBeVisible();
    await expect(menu.getByRole("menuitemcheckbox")).toHaveCount(3);
    for (const name of optionalColumns) {
      await expect(menu.getByRole("menuitemcheckbox", { name, exact: true })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    }
    await attachPopupEvidence(page, trigger, menu, width);

    const yoy = menu.getByRole("menuitemcheckbox", { name: "YoY", exact: true });
    await yoy.click();
    await expect(yoy).toHaveAttribute("aria-checked", "false");
    await expect(menu).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "YoY", exact: true, includeHidden: true }),
    ).toHaveCount(0);
    await expect(yoy).toBeFocused();
    await page.keyboard.press("Space");
    await expect(yoy).toHaveAttribute("aria-checked", "true");
    await expect(
      table.getByRole("columnheader", { name: "YoY", exact: true, includeHidden: true }),
    ).toHaveCount(1);

    for (const name of ["Profit vs FY25", "Margin"]) {
      await menu.getByRole("menuitemcheckbox", { name, exact: true }).click();
      await expect(menu.getByRole("menuitemcheckbox", { name, exact: true })).toHaveAttribute(
        "aria-checked",
        "false",
      );
      await expect(
        table.getByRole("columnheader", { name, exact: true, includeHidden: true }),
      ).toHaveCount(0);
      await expect(menu).toBeVisible();
    }
    await expect(table.getByRole("columnheader", { includeHidden: true })).toHaveCount(
      originalHeaderCount - 2,
    );
    await expectRowIds(table, ids(descending.slice(10, 20)));
    await closeColumns(page, trigger);
    await expectSameTable(original, table);

    const search = frame.getByRole("textbox", { name: "Search stores...", exact: true });
    await search.fill(selected.name);
    await expectRowIds(table, [String(selected.id)]);
    await expect(table.getByRole("checkbox", { name: selectedName, exact: true })).toBeChecked();
    for (const name of ["Profit vs FY25", "Margin"]) {
      await expect(
        table.getByRole("columnheader", { name, exact: true, includeHidden: true }),
      ).toHaveCount(0);
    }
    await trigger.click();
    for (const name of ["Profit vs FY25", "Margin"]) {
      await expect(menu.getByRole("menuitemcheckbox", { name, exact: true })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    }
    await closeColumns(page, trigger);
    await search.fill("");
    await expectRowIds(table, ids(descending.slice(0, 10)));
    await expectSameTable(original, table);
    await expect(page.getByRole("table")).toHaveCount(1);
    await expectNoOuterOverflow(page);
  });
}
