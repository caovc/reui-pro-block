import { expect, test, type Locator, type Page } from "@playwright/test";

// Regression coverage for the controlled line-details Sheet.
// Inherit unchanged 30s/5s and Root's W1/R0 policy.
// All focus, menu and deletion changes come from actual native user controls.
const route = "/#/preview/data-grid/advanced/data-grid-advanced-15";
const firstId = "rpo-line-01";
const firstName = "Online storefront";
const firstRow = (table: Locator) => table.locator(`tbody tr[data-row-id="${firstId}"]`);
const sheetForFirstLine = (page: Page) =>
  page.getByRole("dialog", { name: firstName, exact: true });
const removalConfirmation = (page: Page) =>
  page.getByRole("alertdialog", { name: `Remove ${firstName}?`, exact: true });

async function openStatement(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(route);
  const frame = page.locator(".rpo-frame");
  await expect(frame.getByText("P&L Outlook", { exact: true })).toBeVisible();
  const table = frame.locator("table");
  await expect(table).toHaveCount(1);
  await expect(firstRow(table)).toHaveCount(1);
  return { table, search: frame.getByRole("textbox", { name: "Search lines", exact: true }) };
}

async function visibleLineSnapshot(table: Locator) {
  // Read actual mounted line rows only. Aggregate section/profit totals may change on removal.
  return table.locator('tbody tr[data-row-id^="rpo-line-"]').evaluateAll((rows) =>
    rows.map((row) => ({
      id: row.getAttribute("data-row-id"),
      text: row.textContent,
    })),
  );
}

async function expectSheetClosed(page: Page) {
  await expect(sheetForFirstLine(page)).toHaveCount(0);
  await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
}

test("Retail15 Actions Line Details returns native Escape and Close focus to its actual trigger", async ({
  page,
}) => {
  const { table } = await openStatement(page, 1440);
  const actions = firstRow(table).getByRole("button", {
    name: `Actions for ${firstName}`,
    exact: true,
  });
  await expect(actions).toBeVisible();
  for (const method of ["Escape", "Close"] as const) {
    await actions.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("menuitem", { name: "Line Details", exact: true }).click();
    const sheet = sheetForFirstLine(page);
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: firstName, exact: true })).toBeVisible();
    await expect(menu).toHaveCount(0);
    if (method === "Escape") await page.keyboard.press("Escape");
    else await sheet.getByRole("button", { name: "Close", exact: true }).click();
    await expectSheetClosed(page);
    await expect(actions).toBeFocused();
    await expect(firstRow(table)).toHaveCount(1);
  }
});

test("Retail15 native Remove Line cancel preserves the Sheet and confirm restores Search after opener removal", async ({
  page,
}) => {
  const { table, search } = await openStatement(page, 390);
  const before = await visibleLineSnapshot(table);
  expect(before.some((line) => line.id === firstId)).toBe(true);
  const otherLines = before.filter((line) => line.id !== firstId);
  expect(otherLines.length).toBeGreaterThan(0);
  const opener = firstRow(table).getByRole("button", {
    name: `View ${firstName}`,
    exact: true,
  });
  const originalOpener = await opener.elementHandle();
  expect(originalOpener).not.toBeNull();
  if (!originalOpener) throw new Error("The actual first-line View button is missing");
  try {
    await opener.click();
    const sheet = sheetForFirstLine(page);
    await expect(sheet).toBeVisible();
    const remove = sheet.getByRole("button", { name: "Remove Line", exact: true });
    await remove.click();
    const confirmation = removalConfirmation(page);
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(confirmation).toHaveCount(0);
    await expect(page.locator('[data-slot="alert-dialog-overlay"]')).toHaveCount(0);
    await expect(sheet).toBeVisible();
    await expect(firstRow(table)).toHaveCount(1);
    await expect(remove).toBeFocused();
    await expect.poll(() => visibleLineSnapshot(table)).toEqual(before);

    await remove.click();
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Remove Line", exact: true }).click();
    await expect(confirmation).toHaveCount(0);
    await expect(page.locator('[data-slot="alert-dialog-overlay"]')).toHaveCount(0);
    await expectSheetClosed(page);
    await expect(firstRow(table)).toHaveCount(0);
    expect(await originalOpener.evaluate((button) => button.isConnected)).toBe(false);
    await expect(search).toBeFocused();
    await expect.poll(() => visibleLineSnapshot(table)).toEqual(otherLines);
  } finally {
    await originalOpener.dispose();
  }
});
