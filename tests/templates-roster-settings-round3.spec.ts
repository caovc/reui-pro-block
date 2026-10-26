import { test, expect, type Page } from "@playwright/test";

async function navigate(page: Page, label: string) {
  if ((page.viewportSize()?.width || 1440) < 760) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  }
  const settings = page
    .getByRole("button", { name: "Settings", exact: true })
    .filter({ visible: true })
    .first();
  if (["Organisation", "Policies", "Approval flows", "Profile", "Preferences"].includes(label)) {
    if (
      !(await page
        .getByRole("button", { name: label, exact: true })
        .filter({ visible: true })
        .first()
        .isVisible())
    ) {
      await settings.click();
    }
  }
  await page
    .getByRole("button", { name: label, exact: true })
    .filter({ visible: true })
    .first()
    .click();
}

async function openSettings(page: Page, tab = "Organisation") {
  await page.goto("/#/template-preview/roster");
  await navigate(page, tab);
  await expect(
    page.locator(".ct-roster-settings").getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
}

function section(page: Page, label: string) {
  return page
    .locator(".ct-settings-section")
    .filter({ has: page.getByText(label, { exact: true }) });
}

test("Roster organisation sections save and discard independently across navigation", async ({
  page,
}) => {
  await openSettings(page);
  const company = section(page, "Company");
  const departments = section(page, "Departments");
  await page.getByRole("textbox", { name: "Legal name", exact: true }).fill("Bricklane People");
  await departments.getByRole("button", { name: "Add department", exact: true }).click();
  await departments.getByPlaceholder("Name is required", { exact: true }).fill("Research");
  await departments.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(company).toContainText("Unsaved changes");
  await expect(departments).toContainText("All changes saved");
  await company.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Legal name", exact: true })).toHaveValue(
    "Roster UK",
  );
  await departments.getByRole("button", { name: "Edit name for Engineering", exact: true }).click();
  await departments
    .getByRole("textbox", { name: "Name for dept-0", exact: true })
    .fill("Platform Engineering");
  await navigate(page, "Dashboard");
  await navigate(page, "Organisation");
  await expect(
    page.getByRole("button", { name: "Edit name for Platform Engineering", exact: true }),
  ).toBeVisible();
  await departments.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(
    departments.getByRole("button", { name: "Edit name for Engineering", exact: true }),
  ).toBeVisible();
  await expect(
    departments.getByRole("button", { name: "Edit name for Research", exact: true }),
  ).toBeVisible();
});

test("Roster policies validate rows and retain independent yearly entitlements", async ({
  page,
}) => {
  await openSettings(page, "Policies");
  const leave = section(page, "Leave types");
  await leave.getByRole("button", { name: "Add leave type", exact: true }).click();
  await leave.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByText("Every row needs a name before saving", { exact: true }),
  ).toBeVisible();
  await leave.getByPlaceholder("Name is required", { exact: true }).fill("Study");
  await leave.getByRole("textbox", { name: "Days per year for Study", exact: true }).fill("12");
  await leave.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(leave.getByRole("row").filter({ hasText: "Study" })).toContainText("12");
  await page.getByRole("tab", { name: "Organisation", exact: true }).click();
  await page.getByRole("button", { name: "Monday", exact: true }).click();
  await section(page, "Working week")
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await navigate(page, "Dashboard");
  await navigate(page, "Policies");
  await expect(leave.getByRole("row").filter({ hasText: "Study" })).toContainText("12");
  await page.getByRole("tab", { name: "Organisation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Monday", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("Roster saved approval roles affect requests and clearing decisions keeps those roles", async ({
  page,
}) => {
  await openSettings(page, "Approval flows");
  await page.getByRole("combobox", { name: "Expense approver", exact: true }).click();
  await page.getByRole("option", { name: "Manager", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await navigate(page, "Approvals");
  const request = page.getByRole("row").filter({ hasText: "Campaign shoot: £4,200" });
  await expect(request.getByRole("cell", { name: "Manager", exact: true })).toBeVisible();
  await request
    .getByRole("button", { name: "Approve: Campaign shoot: £4,200", exact: true })
    .click();
  await navigate(page, "Preferences");
  await page.getByRole("button", { name: "Clear approval decisions", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Clear approval decisions", exact: true }),
  ).toBeDisabled();
  await navigate(page, "Approvals");
  await expect(request.getByText("Pending", { exact: true })).toBeVisible();
  await expect(request.getByRole("cell", { name: "Manager", exact: true })).toBeVisible();
});

test("Roster preference resets restore actual new people and hiring changes", async ({ page }) => {
  await page.goto("/#/template-preview/roster");
  await page.getByRole("button", { name: "People", exact: true }).first().click();
  await page.getByRole("button", { name: "Directory", exact: true }).click();
  await page.getByRole("button", { name: "Add person", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Full name", exact: true })
    .fill("Roster Settings Person");
  await page.getByRole("button", { name: "Add to workspace", exact: true }).click();
  await navigate(page, "Hiring");
  await page
    .getByRole("button", { name: "Open candidate Yara Lindholm", exact: true })
    .last()
    .click();
  await page.getByRole("combobox", { name: "Candidate stage", exact: true }).click();
  await page.getByRole("option", { name: "Offer", exact: true }).click();
  await page.keyboard.press("Escape");
  await navigate(page, "Preferences");
  for (const name of ["Clear people you added", "Clear hiring pipeline"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeEnabled();
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("button", { name, exact: true })).toBeDisabled();
  }
  await navigate(page, "Directory");
  await page.getByPlaceholder("Search people…", { exact: true }).fill("Roster Settings Person");
  await expect(page.locator(".ct-reporting-lines")).not.toContainText("Roster Settings Person");
  await navigate(page, "Hiring");
  await expect(
    page.locator('[data-slot="kanban-column"]').filter({ hasText: "Sourced" }),
  ).toContainText("Yara Lindholm");
});

test("Roster profile saves real local uploads and restores the saved draft", async ({ page }) => {
  await openSettings(page, "Profile");
  await expect(page.getByRole("textbox", { name: "Location", exact: true })).toHaveValue("Lisbon");
  await page.getByRole("textbox", { name: "Full Name", exact: true }).fill("Taylor Morgan");
  await page.getByRole("textbox", { name: "Job Title", exact: true }).fill("People Lead");
  await page.getByLabel("Upload profile photo", { exact: true }).setInputFiles({
    name: "profile.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#6d28d9"/></svg>',
    ),
  });
  await expect(page.getByRole("img", { name: "Your profile", exact: true })).toHaveAttribute(
    "src",
    /^data:image\/svg\+xml/,
  );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".ct-sidebar .ct-profile")).toContainText("Taylor Morgan");
  await expect(page.locator(".ct-sidebar .ct-profile img")).toHaveAttribute(
    "src",
    /^data:image\/svg\+xml/,
  );
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("textbox", { name: "Full Name", exact: true }).fill("Unsaved");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Full Name", exact: true })).toHaveValue(
    "Taylor Morgan",
  );
  await expect(page.getByRole("img", { name: "Your profile", exact: true })).toBeVisible();
  await navigate(page, "Dashboard");
  await navigate(page, "Profile");
  await expect(page.getByRole("textbox", { name: "Job Title", exact: true })).toHaveValue(
    "People Lead",
  );
});

test("Roster settings mobile navigation and tabs fit and preserve working controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSettings(page);
  for (const name of ["Policies", "Approval flows", "Profile", "Preferences"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  }
  await page.getByRole("button", { name: "Change appearance", exact: true }).click();
  await expect(page.getByText("Appearance: light", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Change appearance", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Change appearance", exact: true }).click();
  await expect(page.getByText("Appearance: system", { exact: true })).toBeVisible();
  await navigate(page, "Organisation");
  await expect(page.getByRole("textbox", { name: "Legal name", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Roster settings delete drafts, validate duplicate names and restore organisation defaults", async ({
  page,
}) => {
  await openSettings(page);
  const departments = section(page, "Departments");
  await departments.getByRole("button", { name: "Actions for Engineering", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await expect(
    departments.getByRole("button", { name: "Edit name for Engineering", exact: true }),
  ).toHaveCount(0);
  await departments.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(
    departments.getByRole("button", { name: "Edit name for Engineering", exact: true }),
  ).toBeVisible();
  await departments.getByRole("button", { name: "Add department", exact: true }).click();
  await departments.getByPlaceholder("Name is required", { exact: true }).fill(" engineering ");
  await departments.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByText("Names must be unique within this section", { exact: true }),
  ).toBeVisible();
  await departments.getByRole("button", { name: "Discard", exact: true }).click();
  await page.getByRole("textbox", { name: "Legal name", exact: true }).fill("Example Organisation");
  await section(page, "Company").getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".ct-sidebar .ct-profile")).toContainText("Example Organisation");
  await page.getByRole("tab", { name: "Preferences", exact: true }).click();
  await page.getByRole("button", { name: "Restore organisation settings", exact: true }).click();
  await page.getByRole("tab", { name: "Organisation", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Legal name", exact: true })).toHaveValue(
    "Roster UK",
  );
  await expect(page.locator(".ct-sidebar .ct-profile")).toContainText("Roster UK");
});

test("Pulse shared mobile navigation continues opening real leaf pages", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/template-preview/pulse");
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".ct-report-scorecard")).toBeVisible();
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Help desk name", exact: true })).toBeVisible();
});
