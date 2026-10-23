import { test, expect } from "@playwright/test";

test("Bricklane identity persists across navigation and explains the independent recreation", async ({
  page,
  request,
}) => {
  await page.goto("./");
  await expect(page).toHaveTitle("Bricklane — Blocks & Templates");
  const brand = page.getByRole("link", { name: "Bricklane home", exact: true });
  await expect(brand).toContainText("Bricklane");
  await expect(brand.locator("svg rect")).toHaveCount(4);
  const favicon = await request.get("./favicon.svg");
  expect(favicon.ok()).toBe(true);
  expect(await favicon.text()).toContain('fill="#d57755"');

  await page.getByRole("button", { name: "Documentation", exact: true }).click();
  const about = page.getByRole("dialog");
  await expect(about).toContainText("ReUI Pro Blocks and Templates");
  await expect(about).toContainText("not affiliated with or endorsed by ReUI or KeenThemes");
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Templates 18", exact: true })
    .click();
  await expect(page).toHaveTitle("Templates — Bricklane");
  await brand.click();
  await expect(page).toHaveTitle("Bricklane — Blocks & Templates");
  await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(brand.locator("svg")).toBeVisible();
});

test("the original wordmark fits the mobile header", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.getByRole("link", { name: "Bricklane home" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Build it, brick by brick.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Browse categories" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
