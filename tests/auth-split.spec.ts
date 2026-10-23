import { test, expect } from "@playwright/test";
const preview = (id: number) => `./#/preview/application/auth/auth-${id}`;

test("blue split form keeps password first and completes a local login", async ({ page }) => {
  await page.goto(preview(1));
  const username = page.getByLabel("Email or username", { exact: true });
  await expect(username).toBeVisible();
  const position = (await username.boundingBox())!;
  const provider = (await page.getByRole("button", { name: "Google", exact: true }).boundingBox())!;
  expect(position.y).toBeLessThan(provider.y);
  await username.fill("alex");
  await page.getByLabel("Password", { exact: true }).fill("sample-password");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("status").getByText("You’re signed in to the demo workspace.", { exact: true }),
  ).toBeVisible();
});

test("testimonial split carousel selects stories and password reset returns to login", async ({
  page,
}) => {
  await page.goto(preview(2));
  await page.getByRole("button", { name: "Show story 5", exact: true }).click();
  await expect(page.getByRole("button", { name: "Show story 5", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.locator(".auth-review-current").getByText("Emma Wilson", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
  await page.getByLabel("Work email", { exact: true }).fill("alex@example.com");
  await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("reset link is ready for alex@example.com");
  await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("magic review split sends and resends a local link", async ({ page }) => {
  await page.goto(preview(3));
  await page.getByLabel("Work email", { exact: true }).fill("alex@example.com");
  await page.getByRole("button", { name: "Send magic link", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("magic link is ready for alex@example.com");
  await page.getByRole("button", { name: "Resend link", exact: true }).click();
  await expect(page.getByText("Demo link prepared again", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue with GitHub", exact: true }),
  ).toBeVisible();
});

test("framed password page opens account form and legal information", async ({ page }) => {
  await page.goto(preview(4));
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name", { exact: true }).fill("Alex Preview");
  await dialog.getByLabel("Work email", { exact: true }).fill("alex@example.com");
  await dialog.getByLabel("Password", { exact: true }).fill("sample-password");
  await dialog.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("demo workspace");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Status", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("All demo services are available");
});

test("audited split and framed entries fit narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const id of [1, 2, 3, 4]) {
    await page.goto(preview(id));
    await expect(
      page.getByLabel(id === 3 ? "Work email" : "Email or username", {
        exact: true,
      }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `auth-${id}`,
    ).toBeLessThanOrEqual(391);
  }
  expect(errors).toEqual([]);
});
