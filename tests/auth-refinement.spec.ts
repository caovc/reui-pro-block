import { test, expect } from "@playwright/test";
const preview = (id: number) => `./#/preview/application/auth/auth-${id}`;

test("password card keeps its provider row and supports password visibility", async ({ page }) => {
  await page.goto(preview(20));
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toHaveCSS(
    "font-size",
    "20px",
  );
  const google = (await page.getByRole("button", { name: "Google", exact: true }).boundingBox())!;
  const apple = (await page.getByRole("button", { name: "Apple", exact: true }).boundingBox())!;
  expect(Math.abs(google.y - apple.y)).toBeLessThan(2);
  await page.getByLabel("Email or username", { exact: true }).fill("alex");
  await page.getByLabel("Password", { exact: true }).fill("demo-password");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("You’re signed in to the demo workspace.", { exact: true }),
  ).toBeVisible();
});

test("method picker reveals email and provides local SAML and backup flows", async ({ page }) => {
  await page.goto(preview(17));
  await page.getByRole("button", { name: "Continue with email", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "What's your email address?",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to login", exact: true }).click();
  await page.getByRole("button", { name: "Continue with SAML SSO", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Work email", { exact: true }).fill("alex@example.com");
  await dialog.getByRole("button", { name: "Continue with SSO", exact: true }).click();
  await expect(dialog.getByText("Demo verification complete", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Use backup code", exact: true }).click();
  await dialog.getByLabel("Backup code", { exact: true }).fill("DEMO-1234");
  await dialog.getByRole("button", { name: "Verify backup code", exact: true }).click();
  await expect(dialog.getByText("Demo verification complete", { exact: true })).toBeVisible();
});

test("work email page keeps its header, trust strip and confirmation", async ({ page }) => {
  await page.goto(preview(16));
  await page.getByRole("button", { name: "Create a workspace", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Workspace name", { exact: true }).fill("Preview Team");
  await dialog.getByLabel("Work email", { exact: true }).fill("alex@example.com");
  await dialog.getByRole("button", { name: "Create workspace", exact: true }).click();
  await expect(dialog.getByText("Your demo workspace is ready", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByLabel("Work email", { exact: true }).fill("alex@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox", exact: true })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Customers building with ReUI", exact: true }).locator("li"),
  ).toHaveCount(5);
});

test("invite-only page records a local invite request and email confirmation", async ({ page }) => {
  await page.goto(preview(19));
  await page.getByRole("button", { name: "Request invite", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Work email", { exact: true }).fill("alex@example.com");
  await dialog.getByRole("button", { name: "Request invite", exact: true }).click();
  await expect(dialog.getByText("Access request recorded", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByLabel("Work email", { exact: true }).fill("alex@example.com");
  await page.getByRole("button", { name: "Continue with email", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox", exact: true })).toBeVisible();
});

test("audited centered authentication entries fit a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const id of [15, 16, 17, 19, 20]) {
    await page.goto(preview(id));
    await expect(page.getByRole("heading").first()).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll, `auth-${id}`).toBeLessThanOrEqual(dimensions.width + 1);
  }
  expect(errors).toEqual([]);
});
