import { test, expect } from "@playwright/test";

test("night magic form sends and resends while its customer panel remains", async ({ page }) => {
  await page.goto("./#/preview/application/auth/auth-10");
  await page.getByLabel("Work email", { exact: true }).fill("demo@example.com");
  await page.getByRole("button", { name: "Send magic link", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("magic link is ready for demo@example.com");
  await expect(page.getByRole("img", { name: "5 out of 5 stars", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Resend link", exact: true }).click();
  await expect(page.getByText("Demo link prepared again", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue with Google", exact: true }),
  ).toBeVisible();
});

for (const id of [11, 18]) {
  test(`Auth${id} uses the password form with two providers`, async ({ page }) => {
    await page.goto(`./#/preview/application/auth/auth-${id}`);
    await expect(page.getByRole("button", { name: "GitHub", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
    await page.getByLabel("Work email", { exact: true }).fill("demo@example.com");
    await page.getByRole("button", { name: "Send reset link", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
      "reset link is ready for demo@example.com",
    );
    await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
    await page.getByRole("button", { name: "Sign up", exact: true }).click();
    await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  });
}

for (const theme of ["light", "dark"])
  for (const width of [1280, 390]) {
    test(`review layouts retain independent panels at ${width}px in ${theme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const id of [10, 11, 18]) {
        await page.goto(`./#/preview/application/auth/auth-${id}?theme=${theme}`);
        await expect(page.locator(`main.auth-night-${id}`)).toBeVisible();
        expect(
          await page
            .locator("main.auth-night-review")
            .evaluate((main) => getComputedStyle(main).backgroundColor),
        ).toBe(
          await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor),
        );
        const review = page.locator(".night-customer-review");
        if (width === 390) await expect(review).toBeHidden();
        else {
          await expect(review).toBeVisible();
          await expect(review.locator('[data-slot="rating-star-filled"]')).toHaveCount(5);
          const ratingColor = await review
            .locator('[data-slot="rating"]')
            .evaluate((rating) => getComputedStyle(rating).color);
          expect(
            await review
              .locator('[data-slot="rating-star-filled"]')
              .first()
              .evaluate((star) => getComputedStyle(star).color),
          ).toBe(ratingColor);
          if (id === 18) {
            const quote = review.locator("blockquote");
            expect(
              await quote.evaluate((node) => {
                const range = document.createRange();
                range.selectNodeContents(node);
                return range.getClientRects().length;
              }),
            ).toBe(2);
            expect((await review.boundingBox())!.x).toBeLessThan(
              (await page.locator(".night-login-form").boundingBox())!.x,
            );
          }
        }
        if (id !== 18) await expect(page.locator('[data-slot="frame"]')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
      expect(errors).toEqual([]);
    });
  }
