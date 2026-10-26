import { expect, test, type Page } from "@playwright/test";

// First parent production run: 6/8 passed. The two menu/focus corrections below
// await the parent's next run; this file starts no server or separate browser.
const route = "./#/preview/data-grid/advanced/data-grid-advanced-10";
const searchName = "Search technicians, customers, cars and plates";
const runtimeErrors = new WeakMap<Page, string[]>();
const workshop = (page: Page) =>
  page.getByRole("region", { name: "Technician Capacity", exact: true });
const rows = (page: Page) => workshop(page).locator("tbody tr[data-row-id]");
const technician = (page: Page, name: string) =>
  rows(page).filter({ has: page.getByRole("button", { name, exact: true }) });
const mayaFriday = (page: Page, state: string) =>
  workshop(page).getByRole("button", {
    name: `Maya Chen, Fri, Oct 16, ${state}`,
    exact: true,
  });

async function choose(page: Page, label: string, option: string) {
  await workshop(page).getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function mayaAction(page: Page, action: string) {
  await workshop(page).getByRole("button", { name: "Actions for Maya Chen", exact: true }).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? [], "console and uncaught runtime errors").toEqual([]);
});

test("capacity uses native pagination, name sorting and numeric utilization sorting", async ({
  page,
}) => {
  await page.goto(route);
  await expect(rows(page)).toHaveCount(10);
  await expect
    .poll(() =>
      rows(page)
        .first()
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(45);
  await page.getByRole("button", { name: "Go to page 2", exact: true }).click();
  await expect(rows(page)).toHaveCount(2);
  await expect(technician(page, "Lina Haddad")).toBeVisible();
  await page.getByRole("button", { name: "Go to page 1", exact: true }).click();
  await page.getByRole("button", { name: "Technician", exact: true }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(workshop(page).locator('th[data-col-id="technician"]')).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect(rows(page).first()).toContainText("Amina Yusuf");
  await page.getByRole("button", { name: "Utilization", exact: true }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(workshop(page).locator('th[data-col-id="utilization"]')).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  const percentages = await rows(page).locator('[data-col-id="utilization"]').allTextContents();
  const numeric = percentages.map((text) => Number(text.match(/(\d+)%/)?.[1]));
  expect(numeric.every(Number.isFinite)).toBe(true);
  expect(numeric).toEqual([...numeric].sort((a, b) => a - b));
  await workshop(page).getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("combobox", { name: "Density", exact: true }).click();
  await page.getByRole("option", { name: "Comfortable", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect
    .poll(() =>
      rows(page)
        .first()
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(49);
  await workshop(page).getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("combobox", { name: "Density", exact: true }).click();
  await page.getByRole("option", { name: "Compact", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect
    .poll(() =>
      rows(page)
        .first()
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(45);
});

test("team and service filters compose with search and both clear actions reset native results", async ({
  page,
}) => {
  await page.goto(route);
  await choose(page, "Team", "Mechanical");
  await expect(rows(page)).toHaveCount(5);
  await choose(page, "Service", "Bodywork");
  await expect(workshop(page).getByText("Nobody Matches", { exact: true })).toBeVisible();
  await workshop(page).getByRole("button", { name: "Clear", exact: true }).click();
  await expect(rows(page)).toHaveCount(10);
  await expect(workshop(page).getByRole("combobox", { name: "Team", exact: true })).toHaveText(
    "All Teams",
  );
  await expect(workshop(page).getByRole("combobox", { name: "Service", exact: true })).toHaveText(
    "All Services",
  );
  const search = workshop(page).getByRole("textbox", { name: searchName, exact: true });
  await search.fill("Maya Chen");
  await expect(rows(page)).toHaveCount(1);
  await expect(mayaFriday(page, "Available, 6h of 8h booked")).toBeVisible();
  await search.fill("no-such-bricklane-technician");
  await expect(workshop(page).getByText("Nobody Matches", { exact: true })).toBeVisible();
  await workshop(page)
    .getByRole("button", { name: "Clear search and filters", exact: true })
    .click();
  await expect(search).toHaveValue("");
  await expect(rows(page)).toHaveCount(10);
});

test("native technician selection persists across pages and Clear deselects the same rows", async ({
  page,
}) => {
  await page.goto(route);
  await technician(page, "Maya Chen").getByRole("checkbox").check();
  await technician(page, "Oliver Reed").getByRole("checkbox").check();
  await expect(workshop(page).getByText("2 technicians selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Go to page 2", exact: true }).click();
  await workshop(page).locator("thead").getByRole("checkbox").check();
  await expect(workshop(page).getByText("4 technicians selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Go to page 1", exact: true }).click();
  await expect(technician(page, "Maya Chen").getByRole("checkbox")).toBeChecked();
  await expect(technician(page, "Oliver Reed").getByRole("checkbox")).toBeChecked();
  await workshop(page).getByRole("button", { name: "Clear", exact: true }).click();
  await expect(technician(page, "Maya Chen").getByRole("checkbox")).not.toBeChecked();
  await expect(technician(page, "Oliver Reed").getByRole("checkbox")).not.toBeChecked();
  await expect(
    workshop(page).getByRole("textbox", { name: searchName, exact: true }),
  ).toBeVisible();
});

test("booking NumberField permits daily overtime and Undo restores the original day", async ({
  page,
}) => {
  await page.goto(route);
  await mayaAction(page, "Book Service");
  const sheet = page.getByRole("dialog", { name: "Book Service", exact: true });
  await sheet.getByRole("textbox", { name: "Customer", exact: true }).fill("Morgan Lake");
  await sheet.getByRole("textbox", { name: "Vehicle", exact: true }).fill("Bricklane Estate");
  await sheet.getByRole("textbox", { name: "Plate", exact: true }).fill("BL26 QA1");
  const hours = sheet.getByRole("textbox", { name: "Hours", exact: true });
  await hours.fill("7");
  await hours.press("Tab");
  await sheet.getByRole("button", { name: "Increase hours", exact: true }).click();
  await expect(hours).toHaveValue("8");
  await expect(sheet.getByRole("button", { name: "Increase hours", exact: true })).toBeDisabled();
  await expect(sheet).toContainText("14h of 8h · 6h booked, plus 8h");
  await expect(sheet).toContainText("Save anyway and it shows as overtime");
  await sheet.getByRole("button", { name: "Book Service", exact: true }).click();
  await expect(sheet).toBeHidden();
  const overtime = mayaFriday(page, "Overtime, 14h of 8h booked");
  await expect(overtime).toHaveText("-6h");
  await overtime.click();
  await expect(
    page.locator(".capacity-day-popover").getByRole("button", { name: /Bricklane Estate/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await workshop(page).getByRole("button", { name: "Undo", exact: true }).click();
  await expect(mayaFriday(page, "Available, 6h of 8h booked")).toHaveText("+2h");
  await mayaFriday(page, "Available, 6h of 8h booked").click();
  await expect(page.locator(".capacity-day-popover")).not.toContainText("Bricklane Estate");
});

test("time off retains booked services as zero-capacity overtime and is one reversible change", async ({
  page,
}) => {
  await page.goto(route);
  await technician(page, "Maya Chen").getByRole("checkbox").check();
  await workshop(page).getByRole("button", { name: "Time Off", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Add Time Off", exact: true });
  await expect(sheet.getByRole("checkbox", { name: "Maya Chen", exact: true })).toBeChecked();
  await expect(sheet.getByRole("combobox", { name: "From", exact: true })).toHaveText(
    "Fri, Oct 16",
  );
  await expect(sheet.getByRole("combobox", { name: "Through", exact: true })).toHaveText(
    "Fri, Oct 16",
  );
  await sheet.getByRole("textbox", { name: "Reason", exact: true }).fill("Workshop certification");
  await expect(sheet).toContainText("Maya Chen has 2 services booked. 6h");
  await sheet.getByRole("button", { name: "Add Time Off", exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(mayaFriday(page, "Overtime, 6h of 0h booked")).toHaveText("-6h");
  await mayaFriday(page, "Overtime, 6h of 0h booked").click();
  const popup = page.locator(".capacity-day-popover");
  await expect(popup.getByRole("button", { name: /Subaru Outback/ })).toBeVisible();
  await expect(popup.getByRole("button", { name: /Volvo V60/ })).toBeVisible();
  await expect(
    popup.getByRole("button", { name: "Workshop certification", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await workshop(page).getByRole("button", { name: "Undo", exact: true }).click();
  await expect(mayaFriday(page, "Available, 6h of 8h booked")).toHaveText("+2h");
  await mayaFriday(page, "Available, 6h of 8h booked").click();
  await expect(popup).not.toContainText("Workshop certification");
  await expect(popup.getByRole("button", { name: /Subaru Outback/ })).toBeVisible();
  await expect(popup.getByRole("button", { name: /Volvo V60/ })).toBeVisible();
});

test("editing a stored booking recalculates the day and grid keyboard Undo restores raw hours", async ({
  page,
}) => {
  await page.goto(route);
  await mayaFriday(page, "Available, 6h of 8h booked").click();
  await page
    .locator(".capacity-day-popover")
    .getByRole("button", { name: /Subaru Outback/ })
    .click();
  const sheet = page.getByRole("dialog", { name: "Edit Booking", exact: true });
  const hours = sheet.getByRole("textbox", { name: "Hours", exact: true });
  await expect(hours).toHaveValue("2");
  await hours.fill("8");
  await hours.press("Tab");
  await expect(sheet).toContainText("12h of 8h · 4h booked, plus 8h");
  await sheet.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(sheet).toBeHidden();
  const overtime = mayaFriday(page, "Overtime, 12h of 8h booked");
  await expect(overtime).toHaveText("-4h");
  await overtime.focus();
  await page.keyboard.press("ControlOrMeta+z");
  await expect(mayaFriday(page, "Available, 6h of 8h booked")).toHaveText("+2h");
  await mayaFriday(page, "Available, 6h of 8h booked").focus();
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(mayaFriday(page, "Overtime, 12h of 8h booked")).toHaveText("-4h");
});

test("booking day is a keyboard-operated shop-day Select and Escape cancels the Sheet", async ({
  page,
}) => {
  await page.goto(route);
  await workshop(page).getByRole("button", { name: "Book Service", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Book Service", exact: true });
  await expect(sheet.locator('input[type="date"]')).toHaveCount(0);
  const day = sheet.getByRole("combobox", { name: "Day", exact: true });
  await day.focus();
  await day.press("ArrowDown");
  await expect(page.getByRole("option")).toHaveCount(26);
  await expect(page.getByRole("option", { name: /^Sun,/ })).toHaveCount(0);
  const friday = page.getByRole("option", { name: "Fri, Oct 16", exact: true });
  const saturday = page.getByRole("option", { name: "Sat, Oct 17", exact: true });
  await expect(friday).toBeFocused();
  await page.keyboard.press("Home");
  // The free Select defers roving focus; observe each move before the next key.
  await expect(friday).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(saturday).toBeFocused();
  await saturday.press("Enter");
  await expect(day).toHaveText("Sat, Oct 17");
  await day.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(day).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(mayaFriday(page, "Available, 6h of 8h booked")).toHaveText("+2h");
});

test("390px search expands and native horizontal scrolling keeps the technician column pinned", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await expect(rows(page)).toHaveCount(10);
  await expect
    .poll(() =>
      rows(page)
        .first()
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(41);
  const search = workshop(page).getByRole("textbox", { name: searchName, exact: true });
  await expect(search).toBeHidden();
  await workshop(page).getByRole("button", { name: searchName, exact: true }).click();
  await expect(search).toBeFocused();
  await search.fill("Maya Chen");
  await expect(rows(page)).toHaveCount(1);
  await workshop(page)
    .getByRole("button", { name: "Clear search and filters", exact: true })
    .click();
  await expect(rows(page)).toHaveCount(10);
  const viewport = workshop(page).locator('[data-slot="scroll-area-viewport"]');
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  const pinned = workshop(page).locator('th[data-col-id="technician"]');
  const moving = workshop(page).locator('th[data-col-id="day-2026-10-16"]');
  const pinnedBefore = await pinned.boundingBox();
  const movingBefore = await moving.boundingBox();
  expect(pinnedBefore).not.toBeNull();
  expect(movingBefore).not.toBeNull();
  await viewport.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  const pinnedAfter = await pinned.boundingBox();
  const movingAfter = await moving.boundingBox();
  expect(pinnedAfter).not.toBeNull();
  expect(movingAfter).not.toBeNull();
  expect(Math.abs(pinnedAfter!.x - pinnedBefore!.x)).toBeLessThanOrEqual(1);
  expect(movingAfter!.x).toBeLessThan(movingBefore!.x - 100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(
    technician(page, "Maya Chen").getByRole("button", { name: "Maya Chen", exact: true }),
  ).toBeVisible();
});
