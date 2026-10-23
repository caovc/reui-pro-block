import { expect, test } from "@playwright/test";

test("Flowly agent creation survives a return through Dashboard", async ({ page }) => {
  await page.goto("/#/template-preview/flowly");
  await page.getByRole("button", { name: "Agents", exact: true }).click();
  await page.getByRole("button", { name: "New agent", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Persistent operations agent");
  await page.getByRole("button", { name: "Create Agent", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Agents", exact: true }).click();
  await page.getByLabel("Search agents", { exact: true }).fill("Persistent operations agent");
  await expect(
    page.getByRole("button", { name: "Persistent operations agent", exact: true }),
  ).toBeVisible();
});

test("Echo task edits and pause survive New Chat navigation", async ({ page }) => {
  await page.goto("/#/template-preview/echo");
  await page
    .getByRole("button", { name: /Scheduled/ })
    .first()
    .click();
  await page.getByRole("switch", { name: "Enable Rate limit review", exact: true }).click();
  await page.getByRole("button", { name: /^Rate limit review/ }).click();
  await page.getByLabel("Name", { exact: true }).fill("Persistent rate limit review");
  await page.getByRole("button", { name: "Save Task", exact: true }).click();
  await page.getByRole("button", { name: "New Chat", exact: true }).click();
  await page
    .getByRole("button", { name: /Scheduled/ })
    .first()
    .click();
  await expect(
    page.getByRole("switch", { name: "Enable Persistent rate limit review", exact: true }),
  ).not.toBeChecked();
});

test("Flux independent flag toggle survives Overview navigation", async ({ page }) => {
  await page.goto("/#/template-preview/flux");
  await page.getByRole("button", { name: "Flags", exact: true }).click();
  await page
    .getByRole("switch", { name: "Enable Risk summary prompt canary", exact: true })
    .click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Flags", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Enable Risk summary prompt canary", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Enable Provider fallback router", exact: true }),
  ).toBeChecked();
});

test("Tempo saved cohort survives Home and Reports navigation", async ({ page }) => {
  await page.goto("/#/template-preview/tempo");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page.getByRole("button", { name: "New segment", exact: true }).click();
  await page.getByLabel("Segment name", { exact: true }).fill("Persistent activation cohort");
  await page.getByRole("button", { name: "Create segment", exact: true }).click();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page.getByRole("combobox", { name: "Filter segments", exact: true }).click();
  await page.getByRole("option", { name: "Persistent activation cohort", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Persistent activation cohort", exact: true }),
  ).toBeVisible();
});

test("Lucent policies, connected service and webhook survive leaving their pages", async ({
  page,
}) => {
  await page.goto("/#/template-preview/lucent");
  await page.getByRole("button", { name: "Security", exact: true }).click();
  await page
    .getByRole("switch", { name: "Enforce two-factor authentication", exact: true })
    .click();
  await page.getByRole("button", { name: "Integrations", exact: true }).click();
  await page.getByRole("button", { name: "Connect Stripe", exact: true }).click();
  await page.getByRole("button", { name: "Add webhook", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Persistent deployment hook");
  await page.getByLabel("Endpoint URL", { exact: true }).fill("https://example.com/events");
  await page.getByRole("button", { name: "Create webhook", exact: true }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Security", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Enforce two-factor authentication", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Integrations", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Stripe connection", exact: true })).toBeChecked();
  await expect(page.getByText("Persistent deployment hook", { exact: true })).toBeVisible();
});
