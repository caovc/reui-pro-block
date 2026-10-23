import { test, expect } from "@playwright/test";

test("free carousel owns story keyboard, dragging and dot selection", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./#/preview/application/auth/auth-2");
  const carousel = page.getByRole("region", {
    name: "Customer stories",
    exact: true,
  });
  await expect(carousel.locator('[data-slot="carousel-item"]')).toHaveCount(6);
  await expect(carousel.getByRole("button", { name: "Show story 3", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(carousel.getByRole("button", { name: "Show story 4", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const viewport = (await carousel.locator('[data-slot="carousel-content"]').boundingBox())!;
  await page.mouse.move(viewport.x + viewport.width * 0.8, viewport.y + viewport.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(viewport.x + viewport.width * 0.2, viewport.y + viewport.height * 0.5, {
    steps: 16,
  });
  await page.mouse.up();
  await expect(carousel.getByRole("button", { name: "Show story 4", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await carousel.getByRole("button", { name: "Show story 1", exact: true }).click();
  await expect(carousel.locator(".auth-review-current")).toContainText("Sarah Chen");
  await expect(carousel.locator('.auth-review-current [data-slot="avatar-image"]')).toBeVisible();
});

test("free autoplay respects reduced motion and stops on user selection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#/preview/application/auth/auth-2");
  const third = page.getByRole("button", { name: "Show story 3", exact: true });
  await expect(third).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await page.clock.install();
  await page.clock.runFor(7000);
  await expect(third).toHaveAttribute("aria-pressed", "true");
  // emulateMedia resolves before Chromium dispatches the MediaQueryList change.
  // Register first and await delivery before advancing the plugin's timer.
  const preference = await page.evaluateHandle(() => ({
    changed: new Promise<void>((resolve) => {
      matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => resolve(), {
        once: true,
      });
    }),
  }));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await preference.evaluate(async (preference) => preference.changed);
  await preference.dispose();
  await page.clock.runFor(6600);
  await expect(page.getByRole("button", { name: "Show story 4", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Show story 6", exact: true }).click();
  await page.clock.runFor(14000);
  await expect(page.getByRole("button", { name: "Show story 6", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("review rating consumes the actual free REUI star implementation", async ({ page }) => {
  await page.goto("./#/preview/application/auth/auth-3");
  const rating = page.getByRole("img", {
    name: "5 out of 5 stars",
    exact: true,
  });
  await expect(rating).toHaveAttribute("data-slot", "rating");
  await expect(rating.locator('[data-slot="rating-star-filled"]')).toHaveCount(5);
  await expect(rating.locator('[data-slot="rating-star-empty"]')).toHaveCount(5);
  const colors = await rating
    .locator('[data-slot="rating-star-filled"]')
    .evaluateAll((stars) => stars.map((star) => getComputedStyle(star).fill));
  expect(new Set(colors).size).toBe(1);
});
