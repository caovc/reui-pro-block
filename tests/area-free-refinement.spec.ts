import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  failures.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
});
test.afterEach(async ({ page }) => expect(failures.get(page)).toEqual([]));
const open = (page: Page, id: number) => page.goto(`./#/preview/chart/area-chart/chart-${id}`);

test("Generation 2D uses free area geometry, baseline selection, hour keys and JSON download", async ({
  page,
}) => {
  await open(page, 16);
  await expect(page.getByText("698.3", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "2D", exact: true }).click();
  const chart = page.getByRole("group", {
    name: "Generation mix in 2D. Arrow keys move between points.",
    exact: true,
  });
  await expect(chart.locator(".recharts-area")).toHaveCount(6);
  await chart.focus();
  await page.keyboard.press("End");
  await expect(chart.getByRole("status")).toContainText("23:00");
  await page.getByRole("button", { name: "Compare against", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Day-Ahead Forecast", exact: true }).click();
  await expect(page.getByText("vs day-ahead forecast", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export JSON", exact: true }).click();
  const file = await download;
  const data = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(data).toHaveLength(24);
  expect(data[0].hour).toBe("00:00");
  expect(data[23].Wind).toBeGreaterThan(0);
  await page.getByRole("radio", { name: "3D", exact: true }).click();
  await expect(chart).toHaveCount(0);
});

test("Campaign filters recompute totals and actual official ColorPicker edits the series", async ({
  page,
}) => {
  await open(page, 17);
  const total = page.locator("dl > div").first().locator("dd").first();
  const original = await total.innerText();
  await page.getByRole("button", { name: "Channels 4/4", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Social", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(total).not.toHaveText(original);
  await expect(page.locator("[data-slot=frame-panel-footer]")).toContainText("3 of 4 channels");
  await page.getByRole("button", { name: "Series color", exact: true }).click();
  const picker = page.getByRole("dialog", { name: "Series color", exact: true });
  await expect(picker).toBeVisible();
  const swatches = picker.locator('[data-slot="color-picker-swatch-item"]');
  await expect(swatches).toHaveCount(6);
  await swatches.nth(2).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".recharts-area-curve").last()).toHaveAttribute("stroke", /3b91cf/i);
  await page.getByRole("button", { name: "Last 30 days", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Last 7 days", exact: true }).click();
  await expect(page.getByRole("button", { name: "Last 7 days", exact: true })).toBeVisible();
  const chart = page.getByRole("group", {
    name: "Campaign impressions by period. Arrow keys move between points.",
    exact: true,
  });
  await chart.focus();
  await page.keyboard.press("Home");
  await expect(chart.getByRole("status")).toContainText("Sep 15");
});

test("Orders metric, Year period and curve control change plotted data and exported values", async ({
  page,
}) => {
  await open(page, 18);
  await page.getByRole("tab", { name: /^Orders / }).click();
  await page.getByRole("button", { name: "Period: Day", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Year", exact: true }).click();
  await expect(page.getByRole("button", { name: "Period: Year", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Step", exact: true }).click();
  const chart = page.getByRole("group", {
    name: "Orders overview by period. Arrow keys move between points.",
    exact: true,
  });
  await expect(chart.locator("pattern path")).toHaveAttribute("d", "M0,6 L6,0");
  await chart.focus();
  await page.keyboard.press("End");
  await expect(chart.getByRole("status")).toContainText("Dec");
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const file = await download;
  const csv = await readFile((await file.path())!, "utf8");
  expect(csv).toContain("Jan");
  expect(csv).toContain("Dec");
  expect(csv.split("\n")).toHaveLength(13);
  await page.getByRole("tab", { name: /^Avg. Order / }).click();
  await chart.focus();
  await page.keyboard.press("Home");
  await expect(chart.getByRole("status")).toContainText("$62");
});

test("Inbound quarter aggregate, fitted trend and refresh retain keyboard readout", async ({
  page,
}) => {
  await open(page, 52);
  await page.getByRole("radio", { name: "By quarter", exact: true }).click();
  const chart = page.getByRole("group", {
    name: "Inbound leads comparison. Arrow keys move between points.",
    exact: true,
  });
  await chart.focus();
  await page.keyboard.press("Home");
  await expect(chart.getByRole("status")).toContainText("Q1");
  await expect(chart.getByRole("status")).toContainText("1,335");
  await page.getByRole("button", { name: "Trend line: Linear Trend", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "3-Point Average", exact: true }).click();
  await expect(chart.locator(".recharts-line")).toHaveCount(1);
  await page.getByRole("button", { name: "Refresh data", exact: true }).click();
  await expect(chart.getByRole("status")).toContainText("1,344");
  await page.getByRole("button", { name: "Expand chart", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("2025 and 2024 · quarter view");
});

test("all four area layouts retain visible controls and fit 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  for (const id of [16, 17, 18, 52]) {
    await open(page, id);
    await expect(page.getByRole("button", { name: "More actions", exact: true })).toBeVisible();
    await expect(
      page.locator("svg.recharts-surface").first().or(page.locator('svg[viewBox="0 0 380 370"]')),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `chart-${id}`,
    ).toBe(true);
    if (id === 16) {
      const battery = await page.getByRole("button", { name: /^Battery / }).boundingBox();
      expect(battery!.x + battery!.width).toBeLessThanOrEqual(390);
    }
  }
});
