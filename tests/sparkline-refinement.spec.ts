import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  failures.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => expect(failures.get(page)).toEqual([]));
const open = (page: Page, id: number) => page.goto(`./#/preview/chart/sparkline/chart-${id}`);

test("inventory period tabs change all metrics and the analytics action opens current data", async ({
  page,
}) => {
  await open(page, 1);
  await expect(page.getByText("8,420", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Month", exact: true }).click();
  await expect(page.getByText("32.8k", { exact: true })).toBeVisible();
  await expect(page.getByText(/42,420 SKUs/)).toBeVisible();
  await page.getByRole("tab", { name: "Year", exact: true }).click();
  await expect(page.getByText("392k", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show full analytics", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Catalog analytics · Year");
  await expect(dialog).toContainText("58.4k");
});

test("distance periods change both headline and the actual free chart series", async ({ page }) => {
  await open(page, 11);
  await expect(page.getByText("1,562", { exact: false })).toBeVisible();
  const initial = await page.locator(".recharts-line-curve").getAttribute("d");
  await page.getByRole("tab", { name: "Month", exact: true }).click();
  await expect(page.getByText("6,248", { exact: false })).toBeVisible();
  expect(await page.locator(".recharts-line-curve").getAttribute("d")).not.toBe(initial);
  await page.getByRole("tab", { name: "Year", exact: true }).click();
  await expect(page.getByText("74,891", { exact: false })).toBeVisible();
});

test("KPI, wealth and trend cards expose real formatted hover readouts", async ({ page }) => {
  for (const [id, label, currency] of [
    [2, "Total Orders trend", false],
    [5, "Net worth trend", false],
    [15, "Revenue daily trend", true],
  ] as const) {
    await open(page, id);
    const chart = page.getByRole("img", { name: label, exact: true });
    await chart.hover();
    const tooltip = page.locator(".recharts-tooltip-wrapper").filter({ visible: true });
    await expect(tooltip).toBeVisible();
    if (currency) await expect(tooltip).toContainText("$");
    else await expect(tooltip).toContainText(/\d/);
  }
  await open(page, 2);
  const smallCurrencyTrend = page.getByRole("img", { name: "Account Balance trend", exact: true });
  const span = await smallCurrencyTrend.locator(".recharts-line-curve").evaluate((line) => {
    const box = (line as SVGGraphicsElement).getBBox();
    return box.height;
  });
  expect(span).toBeGreaterThan(15);
});

test("wallets and order lists retain distinct static surfaces and independent line trends", async ({
  page,
}) => {
  await open(page, 3);
  await expect(page.getByText("Main Wallet (USD)", { exact: true })).toBeVisible();
  await expect(page.getByText("Reserve Fund (USD)", { exact: true })).toBeVisible();
  await expect(page.locator(".recharts-line-curve")).toHaveCount(3);
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await open(page, 25);
  await expect(page.getByRole("list").locator("li")).toHaveCount(5);
  await expect(page.getByText("Avg. Monthly Income", { exact: true })).toBeVisible();
  await expect(page.locator(".recharts-line-curve")).toHaveCount(5);
  await expect(page.getByRole("button")).toHaveCount(0);
});

test("Cron and connections keep real outcome bars and keyboard telemetry readouts", async ({
  page,
}) => {
  await open(page, 31);
  const jobs = page.getByRole("img", {
    name: "32 jobs: 24 healthy, 3 failing, 5 paused",
    exact: true,
  });
  await expect(jobs.locator(".recharts-bar-rectangle")).toHaveCount(32);
  const rate = page.getByRole("group", {
    name: "Success rate by hour. Arrow keys inspect points.",
    exact: true,
  });
  await rate.focus();
  await page.keyboard.press("Home");
  await expect(rate.getByRole("status")).toContainText("0:00 UTC · 100.0%");
  await open(page, 46);
  const failed = page.getByRole("group", {
    name: "Failed runs per day, last 14 days. Arrow keys inspect points.",
    exact: true,
  });
  await failed.focus();
  await page.keyboard.press("End");
  await expect(failed.getByRole("status")).toContainText("7 failed syncs");
  await expect(
    page.getByRole("img", {
      name: "Datasets by sync state: 32 in sync, 1 drifted, 16 unlinked",
      exact: true,
    }),
  ).toBeVisible();
});

test("fleet lollipop selection changes its subject footer and Escape restores summary", async ({
  page,
}) => {
  await open(page, 41);
  const chart = page.getByRole("group", {
    name: "Hourly peak burn. Arrow keys inspect points.",
    exact: true,
  });
  await chart.focus();
  await page.keyboard.press("End");
  await expect(page.getByText("23:00 UTC peak", { exact: true })).toBeVisible();
  await expect(chart.getByRole("status")).toContainText("18.0×");
  await page.keyboard.press("Escape");
  await expect(page.getByText("Hottest", { exact: true })).toBeVisible();
});

test("SLO attention filter, native hover card, creation math, sort and JSON/CSV exports agree", async ({
  page,
}) => {
  await open(page, 44);
  await page.getByRole("radio", { name: "Needs attention 4", exact: true }).click();
  await expect(page.getByRole("list").locator("li")).toHaveCount(4);
  await page.getByRole("button", { name: /^Rolling budget 42%/ }).hover();
  await expect(page.locator('[data-slot="hover-card-content"]')).toContainText(
    "Ledger write success",
  );
  await page.mouse.move(0, 0);
  await page.getByRole("button", { name: "New SLO", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Ledger checkpoint latency");
  await dialog.getByRole("radio", { name: "99.99%", exact: true }).click();
  await dialog.getByRole("radio", { name: "7 days", exact: true }).click();
  await expect(dialog).toContainText("50% over budget");
  await dialog.getByRole("button", { name: "Create SLO", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("list").locator("li")).toHaveCount(5);
  await page.getByRole("combobox", { name: "Sort SLOs", exact: true }).click();
  await page.getByRole("option", { name: "Name", exact: true }).click();
  await expect(page.getByRole("list").locator("li").first()).toContainText("Index freshness");
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export JSON", exact: true }).click();
  const json = JSON.parse(await readFile((await (await jsonDownload).path())!, "utf8"));
  expect(json).toHaveLength(5);
  expect(
    json.find((row: { name: string }) => row.name === "Ledger checkpoint latency"),
  ).toMatchObject({ target: 99.99, window: 7, left: -50 });
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const csvDownload = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const csv = await readFile((await (await csvDownload).path())!, "utf8");
  expect(csv.trim().split("\n")).toHaveLength(6);
  expect(csv).toContain("Ledger checkpoint latency");
});

test("all eleven independent sparkline layouts fit 390px without clipping their charts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 850 });
  for (const id of [1, 2, 3, 5, 11, 15, 25, 31, 41, 44, 46]) {
    await open(page, id);
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `chart-${id}`,
    ).toBe(true);
  }
});
