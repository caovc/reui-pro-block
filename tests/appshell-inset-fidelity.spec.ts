import { test, expect } from "@playwright/test";

const preview = (n: number) => `/#/preview/application/app-shell/app-shell-${n}`;

for (const n of [3, 6, 9, 10]) {
  test(`AppShell ${n} retains its real header and dark/light usage frame`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(preview(n));
    const panel = page.locator('[data-slot="sidebar-container"]').first();
    const expanded = (await panel.boundingBox())!;
    expect(expanded.width).toBe(n === 6 || n === 9 ? 250 : 256);
    const card = panel.locator(".shell-usage-card");
    const cardPanel = card.locator('[data-slot="frame-panel"]');
    if (n === 6 || n === 9) {
      expect(await cardPanel.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        "rgb(23, 23, 23)",
      );
    }
    const button =
      n === 3
        ? page.getByRole("button", { name: "Toggle Sidebar", exact: true })
        : page.getByRole("button", { name: "Collapse sidebar", exact: true });
    await button.click();
    await expect
      .poll(async () => (await panel.boundingBox())?.width)
      .toBe(n === 6 ? 48 : n === 9 ? 68 : 66);
    const brand = (await panel.locator('[data-slot="sidebar-header"] svg').first().boundingBox())!;
    const inner = (await panel.locator('[data-slot="sidebar-inner"]').boundingBox())!;
    expect(brand.x).toBeGreaterThanOrEqual(inner.x);
    expect(brand.x + brand.width).toBeLessThanOrEqual(inner.x + inner.width);
    await expect(panel.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();
    await expect(card).toHaveCount(0);
    if (n === 3) {
      await expect(button).toBeVisible();
      await button.focus();
      await button.press("Enter");
    } else {
      await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
    }
    await expect.poll(async () => (await panel.boundingBox())?.width).toBe(expanded.width);
    await expect(card).toBeVisible();
    await page
      .getByRole("button", {
        name: `Dismiss ${n === 9 ? "AI Credits" : "Spending Limit"}`,
        exact: true,
      })
      .focus();
    await page.keyboard.press("Enter");
    await expect(card).toHaveCount(0);
  });
}
