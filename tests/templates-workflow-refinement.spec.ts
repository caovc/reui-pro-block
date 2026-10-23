import { expect, test } from "@playwright/test";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:5212";

test("Flowly agent registry filters and creates an agent before opening the shared graph editor", async ({
  page,
}) => {
  await page.goto(`${base}/#/template-preview/flowly`);
  await page.getByRole("button", { name: "Agents", exact: true }).click();
  await expect(page.getByText("Contract Reviewer", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Drafts", exact: true }).click();
  await expect(page.getByText("Support Triage Agent", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "New agent", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("QA operations agent");
  await page.getByRole("button", { name: "Create Agent", exact: true }).click();
  await expect(page.getByText("QA operations agent", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View QA operations agent", exact: true }).click();
  await expect(page.locator(".react-flow")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run test", exact: true })).toBeVisible();
});

test("Echo scheduled tasks pause, edit and add suggested task using a real schedule form", async ({
  page,
}) => {
  await page.goto(`${base}/#/template-preview/echo`);
  await page
    .getByRole("button", { name: /Scheduled/ })
    .first()
    .click();
  const toggle = page.getByRole("switch", { name: "Enable Rate limit review", exact: true });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await page.getByRole("button", { name: /^Rate limit review/ }).click();
  await page.getByLabel("Name", { exact: true }).fill("Rate limit review updated");
  await page.getByRole("button", { name: "Save Task", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Rate limit review updated/ })).toBeVisible();
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Incident recap");
  await page.getByRole("button", { name: "Add Task", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Enable Incident recap", exact: true }),
  ).toBeVisible();
});

test("Lucent security policies and integration connections retain distinct local state", async ({
  page,
}) => {
  await page.goto(`${base}/#/template-preview/lucent`);
  await page.getByRole("button", { name: "Security", exact: true }).click();
  const toggle = page.getByRole("switch", {
    name: "Enforce two-factor authentication",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(page.getByText("Login Methods", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Integrations", exact: true }).click();
  await page.getByRole("button", { name: "Connect Stripe", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Stripe connection", exact: true })).toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Zoom connection", exact: true }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "Add webhook", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Release events");
  await page.getByLabel("Endpoint URL", { exact: true }).fill("https://example.com/hooks/releases");
  await page.getByRole("button", { name: "Create webhook", exact: true }).click();
  await expect(page.getByText("Release events", { exact: true })).toBeVisible();
});
