import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  failures.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => expect(failures.get(page)).toEqual([]));
const open = (page: Page, id: number) => page.goto(`./#/preview/chart/composed-chart/chart-${id}`);
async function exportedRows(page: Page) {
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const file = await download;
  return (await readFile((await file.path())!, "utf8"))
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((cell) => cell.replaceAll('"', "")));
}

test("Liquidity uses the same daily ledger aggregated into 13 weeks and 12 months, exporting selected assets", async ({
  page,
}) => {
  await open(page, 19);
  await expect(page.getByText("$2.48B", { exact: true }).first()).toBeVisible();
  await page.getByRole("radio", { name: "90D", exact: true }).click();
  const chart = page.getByRole("group", {
    name: "Pool supplies and withdrawals. Arrow keys move between points.",
    exact: true,
  });
  await expect(
    chart.locator(".recharts-bar").first().locator(".recharts-bar-rectangle"),
  ).toHaveCount(13);
  await page.getByRole("button", { name: "Assets: All assets", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "ETH", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(chart.locator(".recharts-bar")).toHaveCount(4);
  const csv = await exportedRows(page);
  expect(csv).toHaveLength(14);
  expect(csv[0]).toContain("USDC");
  expect(csv[0]).not.toContain("ETH");
  await page.getByRole("radio", { name: "1Y", exact: true }).click();
  await expect(
    chart.locator(".recharts-bar").first().locator(".recharts-bar-rectangle"),
  ).toHaveCount(12);
  await chart.focus();
  await page.keyboard.press("End");
  await expect(chart.getByRole("status")).toContainText("Sep");
});

test("Sales against goal isolates the last six closed months, changes real layers and exports closed source values", async ({
  page,
}) => {
  await open(page, 20);
  const chart = page.getByRole("group", {
    name: "Monthly sales against goal. Arrow keys move between points.",
    exact: true,
  });
  await page.getByRole("button", { name: "Range: Full Year", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Last 6 Months", exact: true }).click();
  await chart.focus();
  await page.keyboard.press("End");
  await expect(chart.getByRole("status")).toContainText("Sep");
  await expect(chart.getByRole("status")).toContainText("$568,900.00");
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Prior Year", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(chart.locator(".recharts-line")).toHaveCount(1);
  const csv = await exportedRows(page);
  expect(csv).toHaveLength(7);
  expect(csv[1][0]).toBe("Apr");
  expect(Number(csv[1][csv[0].indexOf("sales")])).toBe(398600);
  expect(Number(csv[1][csv[0].indexOf("ytd")])).toBe(1631200);
});

test("Cashflow quarter grouping preserves closing cash and waterfall bridge uses floating net changes", async ({
  page,
}) => {
  await open(page, 21);
  await page.getByRole("button", { name: "Granularity: Monthly", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Quarterly", exact: true }).click();
  const flows = page.getByRole("group", {
    name: "Operating cash inflows and outflows. Arrow keys move between points.",
    exact: true,
  });
  await expect(
    flows.locator(".recharts-bar").first().locator(".recharts-bar-rectangle"),
  ).toHaveCount(4);
  await page.getByRole("button", { name: "Chart view: Flows", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Waterfall", exact: true }).click();
  await expect(
    page.getByRole("group", {
      name: "Closing cash balance. Arrow keys move between points.",
      exact: true,
    }),
  ).toHaveCount(0);
  const bridge = page.getByRole("group", {
    name: "Cash balance waterfall bridge. Arrow keys move between points.",
    exact: true,
  });
  await expect(bridge.locator(".recharts-bar-rectangle")).toHaveCount(5);
  await bridge.focus();
  await page.keyboard.press("End");
  await expect(bridge.getByRole("status")).toContainText("Close");
  await expect(bridge.getByRole("status")).toContainText("$2,005,000.00");
  await page.getByRole("button", { name: "Range: 12 months", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "6 months", exact: true }).click();
  const csv = await exportedRows(page);
  expect(csv).toHaveLength(3);
  expect(Number(csv[2][csv[0].indexOf("balance")])).toBe(2005000);
  const net = csv.slice(1).reduce((total, row) => total + Number(row[csv[0].indexOf("net")]), 0);
  expect(net).toBe(235000);
});

test("Operating Margin uses official forecast stripe bars and recomputes weighted quarterly margins", async ({
  page,
}) => {
  await open(page, 36);
  const chart = page.getByRole("group", {
    name: "Revenue and operating expenses. Arrow keys move between points.",
    exact: true,
  });
  await expect(chart.locator('pattern[data-reui-chart="c-chart-3"]')).toHaveCount(4);
  await expect(
    chart.locator(".recharts-bar").nth(1).locator(".recharts-bar-rectangle"),
  ).toHaveCount(3);
  await page.getByRole("radio", { name: "Quarter", exact: true }).click();
  await expect(
    chart.locator(".recharts-bar").nth(1).locator(".recharts-bar-rectangle"),
  ).toHaveCount(1);
  const csv = await exportedRows(page);
  expect(csv).toHaveLength(5);
  const row = csv[1],
    revenue = Number(row[csv[0].indexOf("revenue")]),
    expenses = Number(row[csv[0].indexOf("expenses")]);
  expect(revenue).toBe(5830000);
  expect(Number(row[csv[0].indexOf("margin")])).toBeCloseTo(
    ((revenue - expenses) / revenue) * 100,
    8,
  );
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Forecast", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    chart.locator(".recharts-bar").nth(1).locator(".recharts-bar-rectangle"),
  ).toHaveCount(0);
});

test("Canary percentile, stack layers and replay pause/resume affect the rollout samples", async ({
  page,
}) => {
  await open(page, 37);
  await expect(page.getByText("210 ms", { exact: true })).toBeVisible();
  await expect(page.getByText("1m 10s", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Replay rollout", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /Replay sample/ })).toContainText(
    /Replay sample [2-9]/,
  );
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  const status = page.getByRole("status").filter({ hasText: /Paused at/ });
  const paused = await status.innerText();
  await page.waitForTimeout(500);
  await expect(status).toHaveText(paused);
  await page.getByRole("button", { name: "Replay rollout", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: /Rollback/ })).toBeVisible();
  await page.getByRole("radio", { name: "p50", exact: true }).click();
  await expect(page.getByText("119 ms", { exact: true })).toBeVisible();
  await expect(page.getByText("83 ms vs 80 ms limit", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "p99", exact: true }).click();
  await expect(page.getByText("341 ms", { exact: true })).toBeVisible();
  await expect(page.getByText("176 ms vs 160 ms limit", { exact: true })).toBeVisible();
  const chart = page.getByRole("group", {
    name: "Canary latency by rollout sample. Arrow keys move between points.",
    exact: true,
  });
  await page.getByRole("button", { name: /^Layers / }).click();
  await page.getByRole("menuitemcheckbox", { name: "Baseline", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    chart.locator(".recharts-bar").first().locator(".recharts-bar-rectangle"),
  ).toHaveCount(0);
  await chart.focus();
  await page.keyboard.press("End");
  await expect(chart.getByRole("status")).toContainText("2:00");
});

test("all five composed previews fit 390px and expose their actual chart controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 850 });
  for (const id of [19, 20, 21, 36, 37]) {
    await open(page, id);
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "More actions", exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `chart-${id}`,
    ).toBe(true);
    if (id === 21) {
      const cells = page.locator("dl").first().locator(":scope > div");
      const first = await cells.nth(0).boundingBox();
      const second = await cells.nth(1).boundingBox();
      expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
    }
  }
});
