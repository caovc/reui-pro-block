import { test, expect } from "@playwright/test";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:5212";

test("Pulse contacts keep account details through creation, search and edit", async ({ page }) => {
  await page.goto(`${base}/#/template-preview/pulse`);
  await page.getByRole("button", { name: "Contacts", exact: true }).click();
  await expect(page.getByText(/11 contacts/)).toBeVisible();
  await page.getByRole("button", { name: "Add contact", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Morgan Example");
  await page.getByLabel("Email", { exact: true }).fill("morgan@example.com");
  await page.getByLabel("Account", { exact: true }).fill("Example Studio");
  await page.getByRole("button", { name: "Add contact", exact: true }).last().click();
  await page.getByLabel("Search contacts", { exact: true }).fill("Morgan");
  await expect(page.getByText("Example Studio", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Actions for Morgan Example", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit contact", exact: true }).click();
  await page.getByLabel("Account", { exact: true }).fill("Example Labs");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Example Labs", { exact: true })).toBeVisible();
  await expect(page.getByText("Example Studio", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Contacts", exact: true }).click();
  await expect(page.getByText("Example Labs", { exact: true })).toBeVisible();
});

test("Pulse invitation and activation update the specific member", async ({ page }) => {
  await page.goto(`${base}/#/template-preview/pulse`);
  await page.getByRole("button", { name: "Team", exact: true }).click();
  await page.getByRole("button", { name: "Invite people", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Sam Reviewer");
  await page.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await page.getByLabel("Job title", { exact: true }).fill("Support Agent");
  await page.getByRole("button", { name: "Send invite", exact: true }).click();
  const member = page.getByRole("row").filter({ hasText: "Sam Reviewer" });
  await expect(member.getByText("Invited", { exact: true })).toBeVisible();
  await member.getByRole("button", { name: "Actions for Sam Reviewer", exact: true }).click();
  await page.getByRole("menuitem", { name: "Activate member", exact: true }).click();
  await expect(member.getByText("Active", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Team", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Sam Reviewer" }).getByText("Active", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: "Alex Johnson" })
      .getByText("Deactivated", { exact: true }),
  ).toBeVisible();
});

test("Roster hiring keeps candidate-specific stage and interview states", async ({ page }) => {
  await page.goto(`${base}/#/template-preview/roster`);
  await page.getByRole("button", { name: "Hiring", exact: true }).click();
  await expect(page.locator(".ct-candidate-card")).toHaveCount(12);
  await page.getByLabel("Open candidate Yara Lindholm", { exact: true }).click();
  await page.getByLabel("Candidate stage", { exact: true }).click();
  await page.getByRole("option", { name: "Interview", exact: true }).click();
  await page.getByRole("button", { name: "Schedule interview", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Hiring", exact: true }).click();
  const interview = page.locator('[data-slot="kanban-column"][data-value="Interview"]');
  await expect(
    interview
      .getByLabel("Open candidate Yara Lindholm", { exact: true })
      .getByText("Scheduled", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('[data-slot="kanban-column"][data-value="Sourced"]')
      .getByLabel("Open candidate Halima Ferrand", { exact: true }),
  ).toBeVisible();
});

test("Roster directory expands only the chosen reporting branch", async ({ page }) => {
  await page.goto(`${base}/#/template-preview/roster`);
  await page.getByRole("button", { name: "People", exact: true }).first().click();
  await page.getByRole("button", { name: "Directory", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Daniel Reyes" })).toHaveCount(0);
  await page.getByRole("button", { name: "Expand Amara Okafor", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Daniel Reyes" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Marco Bianchi" })).toHaveCount(0);
  await page.getByRole("button", { name: "Expand Daniel Reyes", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Tomás Silva" })).toBeVisible();
  await page.getByRole("button", { name: "Collapse Amara Okafor", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Tomás Silva" })).toHaveCount(0);
  await expect(page.getByRole("row").filter({ hasText: "Hannah Weber" })).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Rafael Costa" })).toBeVisible();
});

test("Filespace shared view and folder navigation show distinct records", async ({ page }) => {
  await page.goto(`${base}/#/template-preview/filespace`);
  await page.getByRole("treeitem", { name: "Client Deliverables", exact: true }).click();
  await expect(page.getByText("Deliverable Tracker.xlsx", { exact: true })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Hero Cut v12.mp4" })).toHaveCount(0);
  await page.getByRole("button", { name: "Shared With Me", exact: true }).click();
  await expect(page.getByText("Campaign Brief.docx", { exact: true })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(8);
});

test("Filespace inherited permissions follow the parent folder", async ({ page }) => {
  await page.goto(`${base}/#/template-preview/filespace`);
  async function share() {
    await page.getByRole("button", { name: "Actions for Hero Cut v12.mp4", exact: true }).click();
    await page.getByRole("menuitem", { name: "Share", exact: true }).click();
    return page.getByRole("dialog", { name: "Share with people and teams", exact: true });
  }
  let sheet = await share();
  await expect(
    sheet.getByText("Inherits access from Spring Campaign", { exact: true }),
  ).toBeVisible();
  await expect(
    sheet.getByRole("combobox", { name: "Access for Nora Vale", exact: true }),
  ).toBeDisabled();
  await sheet.getByRole("button", { name: "Manage", exact: true }).click();
  await expect(
    sheet.getByRole("combobox", { name: "Access for Nora Vale", exact: true }),
  ).toBeEnabled();
  await sheet.getByRole("combobox", { name: "Access for Nora Vale", exact: true }).click();
  await page.getByRole("option", { name: "Can view", exact: true }).click();
  await sheet.getByRole("button", { name: "Close", exact: true }).click();
  sheet = await share();
  await expect(
    sheet.getByRole("combobox", { name: "Access for Nora Vale", exact: true }),
  ).toContainText("Can view");
});

test("Filespace restore and move update the selected file metadata", async ({ page }) => {
  await page.goto(`${base}/#/template-preview/filespace`);
  async function action(name: string) {
    await page.getByRole("button", { name: "Actions for Hero Cut v12.mp4", exact: true }).click();
    await page.getByRole("menuitem", { name, exact: true }).click();
  }
  await action("Version History");
  const revision = page.locator(".ct-file-history > li").filter({ hasText: "v7" });
  await revision.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(revision.getByText("Current", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await action("Move");
  await page.locator(".ct-move-locations button").filter({ hasText: "Samples" }).click();
  await page.getByRole("button", { name: "Move Here", exact: true }).click();
  await action("Details");
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("My Drive / Samples", { exact: true })).toBeVisible();
  await expect(sheet.getByText("4.46 KB", { exact: true })).toBeVisible();
});

test("Limelight updates every console metric and preserves host navigation", async ({ page }) => {
  await page.goto(`${base}/#/template-preview/limelight`);
  const console = page.locator("#lime-home .ct-console");
  await console.getByRole("button", { name: "Month", exact: true }).click();
  await expect(console.locator(".ct-console-stats strong")).toContainText([
    "251,580",
    "41",
    "221ms",
    "0.11%",
  ]);
  await console.getByRole("button", { name: "Year", exact: true }).click();
  await expect(console.locator(".ct-console-stats strong")).toContainText([
    "2,852,270",
    "44",
    "236ms",
    "0.19%",
  ]);
  await page.getByRole("button", { name: "Pricing", exact: true }).first().click();
  await expect(page.locator("#lime-pricing")).toBeInViewport();
  await expect(page).toHaveURL(/#\/template-preview\/limelight$/);
  await page.getByRole("button", { name: "Yearly", exact: true }).click();
  await expect(page.locator(".ct-lime-price-note")).toContainText("Ten months on the invoice");
  await page.getByRole("button", { name: "FAQ", exact: true }).first().click();
  await page.getByRole("button", { name: "What does the trial include?", exact: true }).click();
  await expect(page.locator('[data-slot="accordion-content"][data-state="open"]')).toContainText(
    "14 day trial",
  );
});

test("Overture validates an email and confirms a local waitlist signup", async ({ page }) => {
  await page.goto(`${base}/#/template-preview/overture`);
  const email = page.getByRole("textbox", { name: "Email Address", exact: true });
  await email.fill("invalid");
  await page.getByRole("button", { name: "Join Waitlist", exact: true }).click();
  await expect(email).toBeVisible();
  await email.fill("preview@example.test");
  await page.getByRole("button", { name: "Join Waitlist", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("You're on the list");
  await expect(page.getByText("2,432", { exact: true })).toBeVisible();
});

test("Mobile templates keep file actions reachable and KPI summaries readable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/#/template-preview/filespace`);
  const action = page.getByRole("button", { name: "Actions for Hero Cut v12.mp4", exact: true });
  await expect(action).toBeInViewport();
  await action.click();
  await page.getByRole("menuitem", { name: "Details", exact: true }).click();
  await expect(page.getByRole("dialog").getByText("4.74 KB", { exact: true })).toBeVisible();
  await page.goto(`${base}/#/template-preview/pulse`);
  const cards = page.locator(".ct-stats > [data-slot='frame']");
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
  await page.goto(`${base}/#/template-preview/roster`);
  await expect(
    page.getByRole("button", { name: "Jul 1, 2026 - Jul 30, 2026", exact: true }),
  ).toBeInViewport();
  await expect(page.locator(".ct-roster-stat")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
