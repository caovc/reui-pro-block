import { test, expect } from "@playwright/test";

test("founder login preserves the form while opening its story and policies", async ({ page }) => {
  await page.goto("./#/preview/application/auth/auth-6");
  const email = page.getByLabel("Email or username", { exact: true });
  await email.fill("demo@example.com");
  await page.getByRole("button", { name: "Read more", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("A sample customer story");
  await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
  await expect(email).toHaveValue("demo@example.com");
  await page.getByRole("button", { name: "Privacy Policy", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Privacy Policy");
  await page.keyboard.press("Escape");
  await page.getByLabel("Password", { exact: true }).fill("preview-password");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Demo sign-in complete");
  await expect(page.locator('[data-slot="alert"]')).toBeVisible();
});

test("photo login reset and header signup use separate form state", async ({ page }) => {
  await page.goto("./#/preview/application/auth/auth-8");
  await page.getByLabel("Email or username", { exact: true }).fill("demo@example.com");
  await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
  await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("reset link is ready for demo@example.com");
  await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
  await page.getByRole("button", { name: "Need an account? Sign up", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Full name", { exact: true })).toBeVisible();
  await dialog.getByLabel("Full name", { exact: true }).fill("Alex Maker");
  await dialog.getByLabel("Work email", { exact: true }).fill("new@example.com");
  await dialog.getByLabel("Password", { exact: true }).fill("preview-password");
  await dialog.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("Demo sign-in complete");
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Email or username", { exact: true })).toHaveValue(
    "demo@example.com",
  );
});

for (const width of [1280, 390]) {
  test(`editorial compositions retain their own layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const id of [6, 8]) {
      await page.goto(`./#/preview/application/auth/auth-${id}`);
      await expect(page.locator("main.auth-editorial")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Sign in to ReUI", exact: true }),
      ).toBeVisible();
      if (id === 6) {
        await expect(page.locator('[data-slot="aspect-ratio"]')).toHaveCount(1);
        if (width === 390) await expect(page.locator(".auth-founder-story")).toBeHidden();
        else
          await expect(
            page.getByRole("list", { name: "Customer brands", exact: true }),
          ).toBeVisible();
      } else {
        await expect(page.locator('[data-slot="frame-panel"]')).toHaveCount(1);
        await expect(
          page.getByRole("button", { name: "Continue with Google", exact: true }),
        ).toBeVisible();
        expect(
          (await page
            .getByRole("button", { name: "Continue with Google", exact: true })
            .boundingBox())!.y,
        ).toBeGreaterThan((await page.getByLabel("Password", { exact: true }).boundingBox())!.y);
      }
      await page.waitForFunction(() => [...document.images].every((image) => image.complete));
      expect(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
          ),
      ).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    expect(errors).toEqual([]);
  });
}
