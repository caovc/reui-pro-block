import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const cases = [
  [1, "sparkline-business", "InventoryHealth", "Inventory Health"],
  [2, "sparkline-business", "KpiStrip", "KPI Strip"],
  [3, "sparkline-finance", "WalletBalances", "Wallet Balances"],
  [5, "sparkline-finance", "WealthOverview", "Wealth Overview"],
  [11, "sparkline-finance", "DistanceTracker", "Distance Tracker"],
  [15, "sparkline-business", "KpiTrendCards", "KPI Trend Cards"],
  [25, "sparkline-business", "OrderMetrics", "Order Metrics"],
  [31, "sparkline-operations", "CronJobHealth", "Cron Job Health"],
  [41, "sparkline-operations", "SloFleetHealth", "SLO Fleet Health"],
  [44, "sparkline-budgets", "SloBudgets", "SLO Budgets"],
  [46, "sparkline-operations", "ConnectionHealth", "Connection Health"],
] as const;

test("all eleven sparkline code drawers default to the actual implementation and copy full source", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const [id, module, component, title] of cases) {
    await page.goto(`./#/block/chart/sparkline/chart-${id}`);
    await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const filename = `src/blocks/data/${module}.tsx`;
    const selector = dialog.getByRole("combobox", { name: "Source file" });
    await selector.waitFor({ state: "visible" });
    await expect(selector).toHaveText(filename);
    const code = dialog.locator(".source-code");
    await expect(code).toContainText(`function ${component}`);
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(await readFile(filename, "utf8"));
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  }
});

test("sparkline starter ZIP contains all eleven routes and actual free dependencies", async ({
  page,
}) => {
  await page.goto("./#/block/chart/sparkline/chart-44");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const file = await download;
  const entries = unzipSync(new Uint8Array(await readFile((await file.path())!)));
  for (const filename of [
    "src/blocks/data/sparkline-charts.tsx",
    "src/blocks/data/sparkline-business.tsx",
    "src/blocks/data/sparkline-finance.tsx",
    "src/blocks/data/sparkline-operations.tsx",
    "src/blocks/data/sparkline-budgets.tsx",
    "src/blocks/data/sparkline-budget-plots.tsx",
    "src/blocks/data/sparkline-primitives.tsx",
    "src/blocks/data/sparkline-data.ts",
    "src/blocks/data/reui-free-chart-primitives.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/icon-tile.tsx",
    "src/components/ui/hover-card.tsx",
    "src/components/reui/REUI-LICENSE.txt",
  ]) {
    expect(entries[filename], filename).toBeTruthy();
    expect(strFromU8(entries[filename]), filename).toBe(await readFile(filename, "utf8"));
  }
  expect(strFromU8(entries["src/Example.tsx"])).toContain("DataBlock");
});
