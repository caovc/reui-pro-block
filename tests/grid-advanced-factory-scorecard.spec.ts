import { expect, test } from "@playwright/test";

const route = "/#/preview/data-grid/advanced/data-grid-advanced-11";

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Factory Scorecard", exact: true })).toBeVisible();
});

test("native rows page and sort by numeric quarterly spend", async ({ page }) => {
  await expect
    .poll(() =>
      page
        .locator(".factory-scorecard-footer")
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(44);
  const rows = page.getByRole("table").first().locator("tbody tr");
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText("Cedar Loom Works");
  await expect(page.getByText("1 - 10 of 26 factories", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "FOB Spend", exact: true }).click();
  await page.getByRole("button", { name: "FOB Spend", exact: true }).click();
  await expect(rows.first()).toContainText("Hearthline Goods");
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(page.getByText("11 - 20 of 26 factories", { exact: true })).toBeVisible();
});

test("quarter comparison keeps current spend stable while updating its baseline", async ({
  page,
}) => {
  const first = page.getByRole("table").first().locator("tbody tr").first();
  await expect(first).toContainText("$3.31M");
  await page.getByRole("button", { name: "vs Q2 2026", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Q1 2026", exact: true }).click();
  await expect(first).toContainText("$3.31M");
  await expect(first.locator('[title^="Q1 2026:"]')).toBeVisible();
});

test("lenses derive their counts from the full native filtered model", async ({ page }) => {
  await page.getByRole("button", { name: "11 Climbers", exact: true }).click();
  await expect(page.getByText("1 - 10 of 11 factories", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "3 New", exact: true }).click();
  await expect(page.getByRole("table").first().locator("tbody tr")).toHaveCount(3);
  await expect(page.getByText("1 - 3 of 3 factories", { exact: true })).toBeVisible();
});

test("manual next buy and Undo preserve independently computed suggestions", async ({ page }) => {
  await page
    .getByRole("button", { name: "Next buy for Cedar Loom Works: Grow", exact: true })
    .click();
  await page.getByRole("menuitemradio", { name: "Hold", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Next buy for Cedar Loom Works: Hold", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Next buy for Cedar Loom Works: Grow", exact: true }),
  ).toBeVisible();
});

test("advanced Filters and native Cascader are actual keyboard reachable components", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page.getByText("No filters yet", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add group", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  // Let the native Filter close animation and focus restoration finish before moving focus.
  await expect(
    page.locator('[data-slot="popover-content"][aria-label="Advanced filter"]'),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Filter", exact: true })).toBeFocused();
  const columns = page.getByRole("combobox", { name: "Columns", exact: true });
  await columns.focus();
  await expect(columns).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Factory columns", exact: true })).toBeVisible();
  // The free Cascader reveals the selected Spend column's parent on open.
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("option", { name: /^Scorecard/ }).click();
  await page.getByRole("option", { name: /FOB Spend/ }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: "FOB Spend", exact: true })).toHaveCount(0);
});

test("all five detail tabs show live metrics and notes CRUD persists to the record", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Open Cedar Loom Works", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Cedar Loom Works", exact: true });
  await sheet.getByRole("tab", { name: "Quarters", exact: true }).click();
  await expect(sheet.getByRole("table").locator("tbody tr")).toHaveCount(8);
  await sheet.getByRole("tab", { name: "Rank Path", exact: true }).click();
  await expect(sheet.getByRole("table").locator("tbody tr")).toHaveCount(8);
  await sheet.getByRole("tab", { name: "Quality", exact: true }).click();
  await expect(
    sheet.getByRole("heading", { name: "Quality & inspection history", exact: true }),
  ).toBeVisible();
  await sheet.getByRole("tab", { name: "Notes", exact: true }).click();
  await sheet
    .getByRole("textbox", { name: "Add a note", exact: true })
    .fill("Reserve autumn capacity.");
  await sheet.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(sheet.getByText("Reserve autumn capacity.", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open Cedar Loom Works", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Cedar Loom Works", exact: true })
    .getByRole("tab", { name: "Notes", exact: true })
    .click();
  await expect(page.getByText("Reserve autumn capacity.", { exact: true })).toBeVisible();
});

test("factory creation writes measurements into the native numeric ranking", async ({ page }) => {
  await page.getByRole("button", { name: "Add Factory", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Add Factory", exact: true });
  await sheet
    .getByRole("textbox", { name: "Factory name", exact: true })
    .fill("Bricklane Original Test Mill");
  await sheet.getByRole("textbox", { name: "FOB Spend ($)", exact: true }).fill("5500000");
  await sheet.getByRole("button", { name: "Add Factory", exact: true }).click();
  const first = page.getByRole("table").first().locator("tbody tr").first();
  await expect(first).toContainText("Bricklane Original Test Mill");
  await expect(first).toContainText("$5.5M");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open Bricklane Original Test Mill", exact: true }),
  ).toHaveCount(0);
});

test("free Calendar date fields navigate, persist ISO days and return focus without closing the Sheet", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Add Factory", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Add Factory", exact: true });
  const since = sheet.getByRole("button", { name: "Partner since", exact: true });
  await expect(since).toHaveText("Oct 1, 2026");
  await since.click();
  const calendar = page.getByRole("dialog", { name: "Partner since calendar", exact: true });
  await expect(calendar.getByRole("grid", { name: "October 2026", exact: true })).toBeVisible();
  await expect(calendar.getByRole("button", { name: /October 16th, 2026/ })).toBeDisabled();
  await calendar.getByRole("button", { name: "Go to the Previous Month", exact: true }).click();
  await expect(calendar.getByRole("grid", { name: "September 2026", exact: true })).toBeVisible();
  await calendar.getByRole("combobox", { name: "Choose the Month", exact: true }).selectOption("9");
  await calendar.getByRole("button", { name: /October 14th, 2026/ }).click();
  await expect(calendar).toBeHidden();
  await expect(since).toHaveText("Oct 14, 2026");
  await expect(since).toBeFocused();
  await since.click();
  await expect(calendar).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(calendar).toBeHidden();
  await expect(since).toBeFocused();
  await expect(sheet).toBeVisible();

  const audit = sheet.getByRole("button", { name: "Last audit", exact: true });
  await audit.click();
  const auditCalendar = page.getByRole("dialog", { name: "Last audit calendar", exact: true });
  await auditCalendar
    .getByRole("combobox", { name: "Choose the Month", exact: true })
    .selectOption("8");
  await auditCalendar.getByRole("button", { name: /September 9th, 2026/ }).click();
  await expect(audit).toHaveText("Sep 9, 2026");
  await sheet
    .getByRole("textbox", { name: "Factory name", exact: true })
    .fill("Bricklane Calendar Mill");
  await sheet.getByRole("button", { name: "Add Factory", exact: true }).click();
  await page.getByRole("button", { name: "Search factories", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search factory records", exact: true })
    .fill("Bricklane Calendar Mill");
  await page.getByRole("button", { name: "Open Bricklane Calendar Mill", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Bricklane Calendar Mill", exact: true });
  await expect(details.getByText("2026-10-14", { exact: true })).toBeVisible();
  await expect(details.getByText("2026-09-09", { exact: true })).toBeVisible();
});

test("search empty state clears the native filter and selection remains tied to raw IDs", async ({
  page,
}) => {
  const first = page.getByRole("table").first().locator("tbody tr").first();
  await first.getByRole("checkbox").check();
  await expect(page.getByText("1 factories selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Search factories", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search factory records", exact: true })
    .fill("no such mill");
  await expect(
    page.getByRole("heading", { name: "No Matching Factories", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear Filters", exact: true }).click();
  await expect(first.getByRole("checkbox")).toBeChecked();
});

test("mobile uses a lens dropdown, genuine horizontal scrolling and no pinned factory columns", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(
    page.getByRole("button", { name: "Scorecard lens, All 26", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".factory-scorecard-heading")
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(80);
  // The public 152px measurement applies only to the default 26-record, three-page state.
  await expect
    .poll(() =>
      page
        .locator(".factory-scorecard-footer")
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(152);
  const pager = page.locator(".factory-scorecard-pager");
  const pageButton = await pager.locator('button[aria-current="page"]').boundingBox();
  const results = await pager.getByText("1 - 10 of 26 factories", { exact: true }).boundingBox();
  const pageSize = await pager.getByRole("combobox").boundingBox();
  expect(pageButton).not.toBeNull();
  expect(results).not.toBeNull();
  expect(pageSize).not.toBeNull();
  expect(pageButton!.y + pageButton!.height).toBeLessThanOrEqual(results!.y);
  expect(results!.y + results!.height).toBeLessThanOrEqual(pageSize!.y);
  const viewport = page.locator('.factory-scorecard [data-slot="scroll-area-viewport"]').first();
  await viewport.evaluate((element) => {
    element.scrollLeft = 450;
  });
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(400);
  await expect
    .poll(() =>
      page
        .getByRole("columnheader", { name: "Rank", exact: true })
        .evaluate((element) => element.getBoundingClientRect().x),
    )
    .toBeLessThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
