import { test, expect, type Page } from "@playwright/test";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const observed: string[] = [];
  errors.set(page, observed);
  page.on("pageerror", (error) => observed.push(error.message));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("Browser pie sector opens its version view and supports back navigation", async ({ page }) => {
  await page.goto("./#/preview/chart/pie-chart/chart-27");
  const pie = page.getByRole("img", { name: "Visitors by browser", exact: true });
  await pie.locator(".recharts-pie-sector").nth(1).locator(".recharts-sector").click();
  await expect(page.getByText("Safari visitors by version", { exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: /^26 / })).toContainText("52.0%");
  await page
    .getByRole("button", { name: "Safari versions, back to all browsers", exact: true })
    .click();
  await expect(page.getByRole("row", { name: /Safari 42,960 20.9%/ })).toBeVisible();
});

test("Cloud rose overspend wedge opens its actual service breakdown", async ({ page }) => {
  await page.goto("./#/preview/chart/pie-chart/chart-54");
  const rose = page.getByRole("img", { name: "Budget use by category", exact: true });
  await rose.locator(".recharts-pie-sector").nth(3).locator(".recharts-sector").click();
  await expect(page.getByText("AI and ML cost by service", { exact: true })).toBeVisible();
  await expect(page.getByText("GPU Training", { exact: true })).toBeVisible();
  await expect(page.getByText("$48.4K", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "AI and ML services, back to all categories", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Open Compute", exact: true })).toBeVisible();
});

test("Training actual column hover changes the selected week and readout", async ({ page }) => {
  await page.goto("./#/preview/chart/bar-chart/chart-10");
  const columns = page
    .getByRole("img", { name: "Time by training week", exact: true })
    .locator(".recharts-bar")
    .last();
  await columns.locator(".recharts-bar-rectangle").nth(9).hover();
  await expect(page.getByText("Training week 10", { exact: true })).toBeVisible();
  await expect(page.locator("strong").filter({ hasText: "8h 07m" })).toBeVisible();
});

test("narrow Inventory free horizontal bars expose named keyboard selection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto("./#/preview/chart/bar-chart/chart-29");
  const category = page.getByRole("button", {
    name: "Electronics: 342 units per day, 52 days of supply",
    exact: true,
  });
  await category.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText(
    "Electronics · 342 units per day · 52 days of supply",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("narrow budget rose retains both outer utilization labels inside the chart", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto("./#/preview/chart/pie-chart/chart-54");
  const rose = page.getByRole("img", { name: "Budget use by category", exact: true });
  await expect(rose.getByText("121%", { exact: true })).toBeVisible();
  const box = (await rose.boundingBox())!;
  for (const text of ["121%", "86%"]) {
    const label = (await rose.getByText(text, { exact: true }).boundingBox())!;
    expect(label.x).toBeGreaterThanOrEqual(box.x);
    expect(label.x + label.width).toBeLessThanOrEqual(box.x + box.width);
  }
});
