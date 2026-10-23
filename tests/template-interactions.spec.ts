import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, id: string) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/#/template-preview/${id}`);
  await expect(page.locator(".template-surface")).toBeVisible();
}

test("Flowly creates a workflow from the right sheet and shows its chosen trigger", async ({
  page,
}) => {
  await open(page, "flowly");
  await page.getByRole("button", { name: "Add Workflow", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "New Workflow" });
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  expect(box!.x).toBeGreaterThan(800);
  await sheet.getByPlaceholder("Refund Requests").fill("Billing handoff");
  await sheet.getByPlaceholder("On new ticket").fill("On invoice approval");
  await sheet.getByRole("combobox", { name: "Trigger", exact: true }).click();
  await page.getByRole("option", { name: "Webhook", exact: true }).click();
  await sheet.getByRole("button", { name: "Create Workflow", exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("heading", { name: "Billing handoff", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Workflows", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "Billing handoff" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Webhook");
});

test("Mesh uses the launch board and shares a link in a popover", async ({ page }) => {
  await open(page, "mesh");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.locator('[data-slot="kanban-column"]')).toHaveCount(5);
  await expect(page.locator('[data-slot="kanban-item"]').first()).toBeVisible();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.locator('[data-slot="popover-content"]')).toContainText(
    "Anyone at Nimbus Fleet",
  );
  await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
});

test("Atlas invites a person with a role and retains the invitation", async ({ page }) => {
  await open(page, "atlas");
  await page.getByRole("button", { name: "Users", exact: true }).click();
  await page.getByRole("button", { name: "All Users", exact: true }).click();
  await page.getByRole("button", { name: "Invite people", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Invite people" });
  await dialog.getByPlaceholder("teammate@company.com").fill("reviewer@example.com");
  await dialog.getByRole("combobox", { name: "Role", exact: true }).click();
  await page.getByRole("option", { name: "Editor", exact: true }).click();
  await dialog.getByRole("button", { name: "Send invite", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "reviewer@example.com" });
  await expect(row).toContainText("Editor");
  await expect(row).toContainText("Pending");
});

for (const id of ["surge", "manifest"]) {
  test(`${id}: product creation is a full page and saves variant inventory`, async ({ page }) => {
    await open(page, id);
    if (id === "manifest") await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.getByRole("button", { name: "New product", exact: true }).click();
    await expect(page.getByRole("heading", { name: "New product", exact: true })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("textbox", { name: "Title", exact: true }).fill("Reference review jacket");
    await page.getByRole("button", { name: "Add variant", exact: true }).click();
    await page.getByRole("textbox", { name: "Variant 1 color" }).fill("Navy");
    await page.getByRole("spinbutton", { name: "Variant 1 price" }).fill("149");
    await page.getByRole("spinbutton", { name: "Variant 1 inventory" }).fill("7");
    await page.getByRole("button", { name: "Create product", exact: true }).click();
    const row = page.getByRole("row").filter({ hasText: "Reference review jacket" });
    await expect(row).toContainText("7 in stock");
    await expect(row).toContainText("$149");
  });
}

test("Miro booking sheet preserves the reference fields and saves a booking", async ({ page }) => {
  await open(page, "miro");
  await page.getByRole("button", { name: "+ Book the first open slot", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "New Booking" });
  await expect(sheet.getByRole("combobox", { name: "Procedure", exact: true })).toBeVisible();
  await expect(sheet.getByRole("combobox", { name: "Practitioner", exact: true })).toBeVisible();
  await expect(sheet.getByRole("textbox", { name: "Date", exact: true })).toBeVisible();
  await sheet.getByRole("combobox", { name: "Patient", exact: true }).click();
  await page.getByRole("option", { name: "Harriet Pemberton", exact: true }).click();
  await sheet.getByRole("button", { name: "Save", exact: true }).click();
  await expect(sheet).toBeHidden();
  await page.getByRole("button", { name: "Appointments", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Harriet Pemberton.*Implant Fitting/ }),
  ).toBeVisible();
});

test("Filespace stores access changes per file after reopening the share sheet", async ({
  page,
}) => {
  await open(page, "filespace");
  async function share() {
    await page
      .getByRole("button", { name: "Actions for Client Deliverables", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Share", exact: true }).click();
    return page.getByRole("dialog", { name: "Share with people and teams" });
  }
  let sheet = await share();
  await sheet.getByRole("combobox", { name: "Access for Nora Vale" }).click();
  await page.getByRole("option", { name: "Can view", exact: true }).click();
  await sheet.getByRole("combobox", { name: "Access for Theo Park" }).click();
  await page.getByRole("option", { name: "Remove access", exact: true }).click();
  await expect(sheet.getByText("theo.park@reui.io")).toHaveCount(0);
  await sheet.getByRole("button", { name: "Close", exact: true }).click();
  sheet = await share();
  await expect(sheet.getByRole("combobox", { name: "Access for Nora Vale" })).toContainText(
    "Can view",
  );
  await expect(sheet.getByText("theo.park@reui.io")).toHaveCount(0);
});

test("Pulse ticket details open on the right and editing updates the selected ticket", async ({
  page,
}) => {
  await open(page, "pulse");
  await page.getByText("TCK-4863", { exact: true }).click();
  const detail = page.getByRole("dialog", { name: "TCK-4863" });
  await expect(detail).toContainText("Quanta Devices");
  expect((await detail.boundingBox())!.x).toBeGreaterThan(800);
  await detail.getByRole("button", { name: "Edit", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Edit escalation" });
  await editor
    .getByRole("textbox", { name: "What is blocking it" })
    .fill("Invoice reconciliation is awaiting a reply.");
  await editor.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByText("TCK-4863", { exact: true }).click();
  await expect(detail).toContainText("Invoice reconciliation is awaiting a reply.");
});

test("Filebox password reset returns to the sign-in and opens its drive", async ({ page }) => {
  await open(page, "filebox");
  await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
  await expect(page.getByRole("button", { name: "Back to sign in", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Suggested Folders", exact: true })).toBeVisible();
});

test("Limelight trial CTA scrolls to pricing without replacing the host route", async ({
  page,
}) => {
  await open(page, "limelight");
  await page.getByRole("button", { name: "Start free", exact: true }).click();
  await expect
    .poll(() => page.locator("#lime-pricing").evaluate((el) => el.getBoundingClientRect().top))
    .toBeLessThan(150);
  await expect(page).toHaveURL(/#\/template-preview\/limelight$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Yearly", exact: true }).click();
  await expect(page.locator("#lime-pricing")).toContainText("year");
});

test("Roster uses the official calendar to switch date views and open events", async ({ page }) => {
  await open(page, "roster");
  await expect(page.locator('[data-slot="event-calendar"]')).toBeVisible();
  await page.locator('[data-slot="event-calendar-view-switcher"]').click();
  await page.getByRole("menuitem", { name: /^Week(?: W)?$/ }).click();
  await expect(page.locator('[data-slot="event-calendar-content"]')).toHaveAttribute(
    "data-view",
    "week",
  );
});

test("Echo creates and renames a project in the Projects workspace", async ({ page }) => {
  await open(page, "echo");
  await page.getByRole("button", { name: /^Projects \d+$/ }).click();
  await page.getByRole("button", { name: "New Project", exact: true }).click();
  await page.getByPlaceholder("e.g. Billing reliability").fill("Fidelity review");
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await page.getByRole("button", { name: "Actions Fidelity review", exact: true }).click();
  await page.getByRole("menuitem", { name: "Rename project", exact: true }).click();
  await page.getByPlaceholder("e.g. Billing reliability").fill("Reference audit");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Actions Reference audit", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Actions Fidelity review", exact: true }),
  ).toHaveCount(0);
});

test("Lucent saves a deployment release and retains it on reopening", async ({ page }) => {
  await open(page, "lucent");
  await page.getByRole("button", { name: "Delivery", exact: true }).click();
  await page.getByRole("button", { name: /^DEP-2026-0148/ }).click();
  const sheet = page.getByRole("dialog", { name: "Deployment details" });
  await sheet.getByRole("textbox", { name: "Release", exact: true }).fill("v2.14.1");
  await sheet.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "DEP-2026-0148" })).toContainText("v2.14.1");
  await page.getByRole("button", { name: /^DEP-2026-0148/ }).click();
  await expect(sheet.getByRole("textbox", { name: "Release", exact: true })).toHaveValue("v2.14.1");
});

test("Flux approval updates the selected request without changing its neighbor", async ({
  page,
}) => {
  await open(page, "flux");
  await page.getByRole("button", { name: /^Approvals/ }).click();
  await page.getByRole("button", { name: "Review APR-7421", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("Above the $500 finance threshold");
  await sheet.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "APR-7421" })).toContainText("Approved");
  await expect(page.getByRole("row").filter({ hasText: "APR-7429" })).toContainText("Pending");
});

test("Tempo displays all 24 tasks in the five-column official Kanban", async ({ page }) => {
  await open(page, "tempo");
  await page.getByRole("button", { name: /^Active sprint/ }).click();
  await expect(page.locator('[data-slot="kanban-column"]')).toHaveCount(5);
  await expect(page.locator('[data-slot="kanban-item"]')).toHaveCount(24);
  await page.getByRole("button", { name: "Calendar", exact: true }).click();
  await expect(page.locator('[data-slot="event-calendar"]')).toBeVisible();
  await page.locator('[data-slot="event-calendar-view-switcher"]').click();
  await page.getByRole("menuitem", { name: /^Week(?: W)?$/ }).click();
  await expect(page.locator('[data-slot="event-calendar-content"]')).toHaveAttribute(
    "data-view",
    "week",
  );
});

test("Verve schedules a meeting in Today and keeps the Create menu destinations", async ({
  page,
}) => {
  await open(page, "verve");
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: "New meeting", exact: true }).click();
  await page.getByLabel("Meeting", { exact: true }).fill("Reference handoff");
  await page.getByRole("button", { name: "Schedule meeting", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Reference handoff", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "+ Create", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "New Deal", exact: true })).toBeVisible();
});

test("Cohort opens a calendar event and rejects an individual approval", async ({ page }) => {
  await open(page, "cohort");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByText("Aisha Rahman: annual leave", { exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Aisha Rahman");
  await page.getByRole("button", { name: "Close", exact: true }).first().click();
  await page.getByRole("button", { name: "Approvals", exact: true }).click();
  await page
    .getByRole("button", { name: "Reject: Promotion to Staff Engineer", exact: true })
    .click();
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reject: Promotion to Staff Engineer", exact: true }),
  ).toHaveCount(0);
});

test("Overture validates email before showing the local waitlist confirmation", async ({
  page,
}) => {
  await open(page, "overture");
  await page.getByRole("button", { name: "Join Waitlist", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Email Address" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email Address" }).fill("review@example.com");
  await page.getByRole("button", { name: "Join Waitlist", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("You're on the list");
  await expect(
    page.getByText("Your early access discount is reserved for review@example.com"),
  ).toBeVisible();
});
