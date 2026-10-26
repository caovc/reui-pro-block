import { test, expect, type Page } from "@playwright/test";

async function openCohort(page: Page) {
  await page.goto("/#/template-preview/cohort");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".bt-cohort")).toBeVisible();
}
async function directory(page: Page) {
  const link = page.getByRole("button", { name: "Directory", exact: true });
  if (!(await link.isVisible()))
    await page.getByRole("button", { name: "People", exact: true }).first().click();
  await link.click();
}
async function settings(page: Page, name: string) {
  const link = page.locator(".bt-sidebar").getByRole("button", { name, exact: true });
  if (!(await link.isVisible()))
    await page.getByRole("button", { name: "Settings", exact: true }).first().click();
  await link.click();
}

test("Cohort reporting tree expands, filters and changes only the selected person's status", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCohort(page);
  await directory(page);
  const grid = page.getByRole("region", { name: "Reporting Lines" });
  await expect(grid.getByRole("row")).toHaveCount(9);
  await grid.getByRole("button", { name: "Set tree depth All", exact: true }).click();
  await expect(grid.getByRole("row")).toHaveCount(22);
  await grid
    .getByRole("button", { name: "Change status for Amara Okafor, currently Active", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "On leave", exact: true }).click();
  await expect(grid.getByRole("row").filter({ hasText: "Amara Okafor" })).toContainText("On leave");
  await expect(grid.getByRole("row").filter({ hasText: "Hannah Weber" })).toContainText("Active");
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await directory(page);
  await expect(grid.getByRole("row").filter({ hasText: "Amara Okafor" })).toContainText("On leave");
  await grid.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("menuitem", { name: "Engineering", exact: true }).click();
  await expect(grid).toContainText("Daniel Reyes");
  await expect(grid).not.toContainText("Hannah Weber");
  await grid.getByRole("button", { name: "Clear", exact: true }).click();
  await grid.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Location", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(grid.getByRole("columnheader", { name: "Location", exact: true })).toHaveCount(0);
});

test("Cohort person creation, manager reassignment and removal retain valid reporting lines", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCohort(page);
  await directory(page);
  await page.getByRole("button", { name: "Add person", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Add a person", exact: true });
  await sheet.getByLabel("Full name", { exact: true }).fill("Marina Cruz");
  await sheet.getByLabel("Job title", { exact: true }).fill("Staff Designer");
  await sheet.getByRole("combobox", { name: "Manager", exact: true }).click();
  await page.getByRole("option", { name: "Hannah Weber", exact: true }).click();
  await sheet.getByRole("button", { name: "Add person", exact: true }).click();
  await expect(sheet).toBeHidden();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await directory(page);
  await page.getByRole("button", { name: "Expand Hannah Weber", exact: true }).click();
  await page.getByRole("button", { name: "Actions for Marina Cruz", exact: true }).click();
  await page.getByRole("menuitem", { name: "View profile", exact: true }).click();
  const profile = page.getByRole("dialog", { name: "Marina Cruz", exact: true });
  await profile
    .getByRole("textbox", { name: "Internal note for Marina Cruz", exact: true })
    .fill("Accessibility programme owner");
  await profile.getByRole("button", { name: "Save note", exact: true }).click();
  await profile
    .locator(".cohort-profile-footer")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByRole("button", { name: "Actions for Marina Cruz", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit person", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Edit Marina Cruz", exact: true });
  await editor.getByRole("combobox", { name: "Manager", exact: true }).click();
  await page.getByRole("option", { name: "Amara Okafor", exact: true }).click();
  await editor.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Set tree depth All", exact: true }).click();
  await page.getByRole("button", { name: "Actions for Marina Cruz", exact: true }).click();
  await page.getByRole("menuitem", { name: "Remove person", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Remove Marina Cruz?", exact: true })
    .getByRole("button", { name: "Remove person", exact: true })
    .click();
  await expect(page.getByRole("region", { name: "Reporting Lines" })).not.toContainText(
    "Marina Cruz",
  );
  await expect(page.getByRole("region", { name: "Reporting Lines" })).toContainText("21 people");
});

test("Cohort settings save independently, discard drafts and retain new policies across pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCohort(page);
  await settings(page, "Organisation");
  const company = page.getByRole("region", { name: "Company", exact: true });
  await company.getByLabel("Legal name", { exact: true }).fill("Bricklane UK");
  await company.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(company.getByLabel("Legal name", { exact: true })).toHaveValue("Cohort UK");
  await company.getByLabel("Legal name", { exact: true }).fill("Bricklane UK");
  await company.getByRole("button", { name: "Save changes", exact: true }).click();
  const departments = page.getByRole("region", { name: "Departments", exact: true });
  await departments.getByRole("button", { name: "Add department", exact: true }).click();
  await departments.getByLabel("Departments name", { exact: true }).fill("Research");
  await departments.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .locator(".bt-settings-tabs")
    .getByRole("button", { name: "Policies", exact: true })
    .click();
  const leave = page.getByRole("region", { name: "Leave types", exact: true });
  await leave.getByRole("textbox", { name: "Days per year for Annual", exact: true }).fill("28");
  await leave.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(
    leave.getByRole("textbox", { name: "Days per year for Annual", exact: true }),
  ).toHaveValue("25");
  await leave.getByRole("button", { name: "Add leave type", exact: true }).click();
  await leave.getByLabel("Leave types name", { exact: true }).fill("Wellbeing");
  await leave.getByRole("textbox", { name: "Days per year for Wellbeing", exact: true }).fill("3");
  await leave.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .locator(".bt-settings-tabs")
    .getByRole("button", { name: "Approval flows", exact: true })
    .click();
  await page.getByLabel("Approver for Expense", { exact: true }).fill("Finance director");
  await page
    .getByRole("region", { name: "Sign-off", exact: true })
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await settings(page, "Policies");
  await expect(
    leave.getByRole("textbox", { name: "Days per year for Wellbeing", exact: true }),
  ).toHaveValue("3");
  await page
    .locator(".bt-settings-tabs")
    .getByRole("button", { name: "Approval flows", exact: true })
    .click();
  await expect(page.getByLabel("Approver for Expense", { exact: true })).toHaveValue(
    "Finance director",
  );
  await page
    .locator(".bt-settings-tabs")
    .getByRole("button", { name: "Organisation", exact: true })
    .click();
  await expect(company.getByLabel("Legal name", { exact: true })).toHaveValue("Bricklane UK");
  await expect(departments).toContainText("Research");
  await directory(page);
  await page.getByRole("button", { name: "Add person", exact: true }).click();
  await page.getByRole("combobox", { name: "Person department", exact: true }).click();
  await expect(page.getByRole("option", { name: "Research", exact: true })).toBeVisible();
});

test("Cohort mobile settings save profile and apply appearance without losing navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openCohort(page);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Cohort", exact: true });
  await menu.getByRole("button", { name: "Settings", exact: true }).click();
  await menu.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(menu).toBeHidden();
  await page
    .locator(".bt-settings-tabs")
    .getByRole("button", { name: "Policies", exact: true })
    .click();
  const leave = page.getByRole("region", { name: "Leave types", exact: true });
  const add = leave.getByRole("button", { name: "Add leave type", exact: true });
  await expect(add).toBeInViewport();
  await add.click();
  await leave.getByLabel("Leave types name", { exact: true }).fill("Family day");
  const save = leave.getByRole("button", { name: "Save changes", exact: true });
  await expect(save).toBeInViewport();
  await save.click();
  await page
    .locator(".bt-settings-tabs")
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await page.getByLabel("Full Name", { exact: true }).fill("Robin Vale");
  await page
    .getByRole("region", { name: "Profile", exact: true })
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await page
    .locator(".bt-settings-tabs")
    .getByRole("button", { name: "Preferences", exact: true })
    .click();
  await page.getByRole("combobox", { name: "Appearance", exact: true }).click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("combobox", { name: "Appearance", exact: true }).click();
  await page.getByRole("option", { name: "Light", exact: true }).click();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await menu.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await menu.getByRole("button", { name: "Settings", exact: true }).click();
  await menu.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue("Robin Vale");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  expect(errors).toEqual([]);
});

async function timePage(page: Page, name: string) {
  const link = page.locator(".bt-sidebar").getByRole("button", { name, exact: true });
  if (!(await link.isVisible()))
    await page.getByRole("button", { name: "Time", exact: true }).first().click();
  await link.click();
}

test("Cohort timesheet day edits and sign-offs are person and week specific across navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCohort(page);
  await timePage(page, "Timesheets");
  const grid = page.getByRole("region", { name: "Timesheets", exact: true });
  const amara = grid.getByRole("row").filter({ hasText: "Amara Okafor" });
  await amara
    .getByRole("button", { name: "Monday, 20 Jul: Amara Okafor, 6h 30m, Internal", exact: true })
    .click();
  const sheet = page.getByRole("dialog", { name: "Amara Okafor", exact: true });
  const targetMeter = sheet
    .getByRole("progressbar", { name: "Contracted week progress", exact: true })
    .locator('[data-slot="progress-indicator"]');
  await expect(targetMeter).toHaveCSS("background-color", "rgb(6, 191, 140)");
  await expect.poll(async () => (await targetMeter.boundingBox())?.height || 0).toBeGreaterThan(3);
  await sheet.getByRole("textbox", { name: "Logged hours", exact: true }).fill("8");
  await sheet
    .getByRole("textbox", { name: "Timesheet note", exact: true })
    .fill("Release readiness");
  await sheet.getByRole("button", { name: "Save day", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(amara).toContainText("36h");
  await expect(grid.getByRole("row").filter({ hasText: "Daniel Reyes" })).toContainText("35h");
  await amara.getByRole("button", { name: "Sign off: Amara Okafor", exact: true }).click();
  await expect(amara).toContainText("Signed off");
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(amara).toContainText("Awaiting");
  await page.getByRole("button", { name: "Previous week", exact: true }).click();
  await expect(amara).toContainText("Signed off");
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await timePage(page, "Timesheets");
  await expect(amara).toContainText("36h");
  await expect(amara).toContainText("Signed off");
  await amara
    .getByRole("button", { name: "Monday, 20 Jul: Amara Okafor, 8h, Internal", exact: true })
    .click();
  await expect(sheet.getByRole("textbox", { name: "Timesheet note", exact: true })).toHaveValue(
    "Release readiness",
  );
  await page.keyboard.press("Escape");
  await settings(page, "Preferences");
  await page
    .locator(".bt-setting-row")
    .filter({ hasText: "Timesheet sign-offs" })
    .getByRole("button", { name: "Clear", exact: true })
    .click();
  await timePage(page, "Timesheets");
  await expect(amara).toContainText("Awaiting");
  await expect(amara).toContainText("36h");
});

test("Cohort leave booking validates dates, survives navigation and can be edited or cancelled independently", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCohort(page);
  await timePage(page, "Time off");
  await page.getByRole("button", { name: "Book leave", exact: true }).click();
  const book = page.getByRole("dialog", { name: "Book leave", exact: true });
  await book.getByLabel("Leave reason", { exact: true }).fill("Recovery day");
  await book.getByRole("switch", { name: "All day leave", exact: true }).click();
  await book.getByRole("button", { name: "Leave end date", exact: true }).click();
  await page.locator('[data-slot="popover-content"] [data-day="7/29/2026"]').click();
  await book.getByRole("button", { name: "Book leave", exact: true }).click();
  await expect(page.getByText("End must be after the start", { exact: true })).toBeVisible();
  await book.getByRole("button", { name: "Leave end date", exact: true }).click();
  await page.locator('[data-slot="popover-content"] [data-day="7/31/2026"]').click();
  await book.getByLabel("Leave cover", { exact: true }).fill("Omar Haddad");
  await book.getByLabel("Leave description", { exact: true }).fill("Handover completed");
  await book.getByRole("button", { name: "Book leave", exact: true }).click();
  await expect(book).toBeHidden();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await timePage(page, "Time off");
  await page
    .locator('[data-slot="event-calendar-event"]')
    .filter({ hasText: "Recovery day" })
    .first()
    .click();
  const edit = page.getByRole("dialog", { name: "Edit leave", exact: true });
  await expect(edit.getByLabel("Leave cover", { exact: true })).toHaveValue("Omar Haddad");
  await expect(edit.getByLabel("Leave description", { exact: true })).toHaveValue(
    "Handover completed",
  );
  await edit.getByLabel("Leave description", { exact: true }).fill("Updated handover");
  await edit.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(edit).toBeHidden();
  await page
    .locator('[data-slot="event-calendar-event"]')
    .filter({ hasText: "Bruno Duarte: Annual" })
    .first()
    .click();
  await expect(edit.getByLabel("Leave description", { exact: true })).toHaveValue(
    "Updated handover",
  );
  await edit.getByRole("button", { name: "Cancel leave", exact: true }).click();
  await expect(edit).toBeHidden();
  await expect(
    page.locator('[data-slot="event-calendar-event"]').filter({ hasText: "Bruno Duarte: Annual" }),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-slot="event-calendar-event"]').filter({ hasText: "Priya Nair: Annual" }),
  ).toHaveCount(1);
});

test("Cohort mobile Time pages expose calendar filters and a visible bulk sign-off", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCohort(page);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  let menu = page.getByRole("dialog", { name: "Cohort", exact: true });
  await menu.getByRole("button", { name: "Time", exact: true }).click();
  await menu.getByRole("button", { name: "Time off", exact: true }).click();
  await page.getByRole("button", { name: "Calendars", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Annual", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.locator('[data-slot="event-calendar-event"]').filter({ hasText: "Aisha Rahman: Annual" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Book leave", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Book leave", exact: true }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Book leave", exact: true })
      .getByRole("button", { name: "Book leave", exact: true }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  menu = page.getByRole("dialog", { name: "Cohort", exact: true });
  const timesheetsLink = menu.getByRole("button", { name: "Timesheets", exact: true });
  if (!(await timesheetsLink.isVisible()))
    await menu.getByRole("button", { name: "Time", exact: true }).click();
  await timesheetsLink.click();
  const signoff = page.getByRole("button", { name: "Sign off 21", exact: true });
  await expect(signoff).toBeInViewport();
  await signoff.click();
  await expect(page.getByRole("button", { name: "Sign off 0", exact: true })).toBeDisabled();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
});

test("Cohort timesheet filters match the reference buckets and decisions can be undone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCohort(page);
  await timePage(page, "Timesheets");
  const grid = page.getByRole("region", { name: "Timesheets", exact: true });
  await grid.getByRole("combobox", { name: "Work type", exact: true }).click();
  await page.getByRole("option", { name: "Mostly project", exact: true }).click();
  await expect(grid.getByRole("row")).toHaveCount(6);
  await expect(grid).toContainText("Lucas Moreau");
  await expect(grid.getByRole("row").filter({ hasText: "Lucas Moreau" })).toContainText("71%");
  await expect(page.getByRole("button", { name: "Sign off 5", exact: true })).toBeVisible();
  await grid.getByRole("button", { name: "Send back: Tomás Silva", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign off 4", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign off 4", exact: true }).click();
  await expect(grid.getByRole("row").filter({ hasText: "Tomás Silva" })).toContainText("Sent back");
  await expect(grid.getByRole("row").filter({ hasText: "Abena Mensah" })).toContainText(
    "Signed off",
  );
  await grid.getByRole("button", { name: "Undo decision: Tomás Silva", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign off 1", exact: true })).toBeVisible();
  await grid.getByRole("combobox", { name: "Work type", exact: true }).click();
  await page.getByRole("option", { name: "Internal only", exact: true }).click();
  await expect(grid.getByRole("row")).toHaveCount(4);
  await expect(grid).toContainText("Bruno Duarte");
  await expect(grid).not.toContainText("Amara Okafor");
  await grid.getByRole("combobox", { name: "Work type", exact: true }).click();
  await page.getByRole("option", { name: "Work type", exact: true }).click();
  await grid.getByRole("combobox", { name: "Tracked time", exact: true }).click();
  await page.getByRole("option", { name: "Under target", exact: true }).click();
  await expect(grid.getByRole("row")).toHaveCount(7);
  await expect(grid).toContainText("Hannah Weber");
  await expect(grid).not.toContainText("Amara Okafor");
  await grid.getByRole("combobox", { name: "Tracked time", exact: true }).click();
  await page.getByRole("option", { name: "Over target", exact: true }).click();
  await expect(grid.getByRole("row")).toHaveCount(5);
  await expect(grid).toContainText("Yuki Tanaka");
  await page.getByRole("button", { name: "20 - 26 Jul", exact: true }).click();
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(grid.getByRole("columnheader", { name: /Mon,? 20 Jul/ })).toBeVisible();
  await page.locator('[data-slot="popover-content"] button[data-day="8/10/2026"]').click();
  await expect(grid.getByRole("columnheader", { name: /Mon,? 10 Aug/ })).toBeVisible();
});
