import { test, expect } from "@playwright/test";
const route = (id: number) => `./#/preview/application/card/card-${id}`;
for (const width of [1440, 390])
  test(`cards30–35 use actual free surfaces without overflow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (let id = 30; id <= 35; id++) {
      await page.goto(route(id));
      await expect(page.locator(`[data-card-variant="${id}"]`)).toBeVisible();
      await expect(page.locator('[data-slot="frame"]')).not.toHaveCount(0);
      expect(await page.locator("vite-error-overlay").count()).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `card${id} overflow`,
      ).toBeLessThanOrEqual(width);
    }
    expect(errors).toEqual([]);
  });
test("logistics editing changes one tile and status while preserving its neighbor", async ({
  page,
}) => {
  await page.goto(route(30));
  await page.getByRole("button", { name: "Shipments Today actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await page.getByLabel("Metric label", { exact: true }).fill("Completed Shipments");
  await page.getByLabel("Display value", { exact: true }).fill("2,180");
  await page.getByLabel("Status text", { exact: true }).fill("+2.0% vs yesterday");
  await page.getByRole("button", { name: "Save metric", exact: true }).click();
  const edited = page.locator('[data-metric-id="shipments"]');
  await expect(edited).toContainText("Completed Shipments");
  await expect(edited).toContainText("2,180");
  await expect(edited).toContainText("+2.0% vs yesterday");
  await expect(page.locator('[data-metric-id="on-time"]')).toContainText("96.7%");
});
test("inventory removal can be cancelled and undone without changing neighbor values", async ({
  page,
}) => {
  await page.goto(route(33));
  await page.getByRole("button", { name: "New Order actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator('[data-metric-id="orders"]')).toBeVisible();
  await page.getByRole("button", { name: "New Order actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Remove tile", exact: true }).click();
  await expect(page.locator('[data-metric-id="orders"]')).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("No remote data was changed");
  await page.getByRole("button", { name: "Undo removal", exact: true }).click();
  await expect(page.locator('[data-metric-id="orders"]')).toContainText("143/pkg");
  await expect(page.locator('[data-metric-id="low-stock"]')).toContainText("27/items");
});
test("inventory link opens matching local content and copy includes the metric ID", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(route(33));
  await page.getByRole("button", { name: "Low Stock Alerts", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("27/items");
  await page.getByRole("button", { name: "Back to cards", exact: true }).click();
  await page.getByRole("button", { name: "Low Stock Alerts actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Copy link", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("card-33?metric=low-stock");
});
test("static variants preserve topology and intentionally literal public fixtures", async ({
  page,
}) => {
  await page.goto(route(31));
  await expect(page.locator('[data-slot="frame"]')).toHaveCount(4);
  await expect(page.locator('[data-slot="icon-tile"][data-variant="elevated"]')).toHaveCount(4);
  await expect(page.getByText("102.9k", { exact: true })).toBeVisible();
  await page.goto(route(32));
  await expect(page.getByText("Passing Controls", { exact: true })).toBeVisible();
  await expect(page.getByText("92% - 42", { exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="avatar-group"]')).toHaveCount(1);
  await page.goto(route(34));
  await expect(page.locator('[data-slot="frame"]')).toHaveCount(4);
  await expect(page.getByText("Weekly trend", { exact: true })).toBeVisible();
  await page.goto(route(35));
  await expect(page.getByText("$14,9M", { exact: true })).toBeVisible();
  await expect(page.getByText("Pending Invoices", { exact: true })).toBeVisible();
});
