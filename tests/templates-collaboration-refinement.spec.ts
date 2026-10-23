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
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: "Alex Johnson" })
      .getByText("Deactivated", { exact: true }),
  ).toBeVisible();
});
