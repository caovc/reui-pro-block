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
  await sheet.getByRole("combobox", { name: "Reports to", exact: true }).click();
  await page.getByRole("option", { name: "Hannah Weber", exact: true }).click();
  await sheet
    .getByRole("textbox", { name: "Person notes", exact: true })
    .fill("Accessibility programme owner");
  await sheet.getByRole("button", { name: "Add person", exact: true }).click();
  await expect(sheet).toBeHidden();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await directory(page);
  await page.getByRole("button", { name: "Expand Hannah Weber", exact: true }).click();
  await page.getByRole("button", { name: "Marina Cruz", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Marina Cruz", exact: true });
  await expect(editor.getByLabel("Person notes", { exact: true })).toHaveValue(
    "Accessibility programme owner",
  );
  await editor.getByRole("combobox", { name: "Reports to", exact: true }).click();
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
