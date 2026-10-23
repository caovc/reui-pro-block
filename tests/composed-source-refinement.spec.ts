import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const cases = [
  [19, "treasury-composed", "LiquidityFlows", "Liquidity Flows"],
  [20, "sales-margin-composed", "SalesVsGoal", "Sales vs Goal"],
  [21, "treasury-composed", "CashflowTrend", "Cashflow Trend"],
  [36, "sales-margin-composed", "OperatingMargin", "Operating Margin"],
  [37, "canary-composed", "CanaryRollback", "Canary Rollback"],
] as const;

test("all five composed code drawers default to the actual implementation and copy full source", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const [id, module, component, title] of cases) {
    await page.goto(`./#/block/chart/composed-chart/chart-${id}`);
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

test("composed starter ZIP contains the real five-entry router, modules and official free dependencies", async ({
  page,
}) => {
  await page.goto("./#/block/chart/composed-chart/chart-19");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const file = await download;
  const entries = unzipSync(new Uint8Array(await readFile((await file.path())!)));
  for (const filename of [
    "src/blocks/data/composed-charts.tsx",
    "src/blocks/data/treasury-composed.tsx",
    "src/blocks/data/sales-margin-composed.tsx",
    "src/blocks/data/canary-composed.tsx",
    "src/blocks/data/trend-foundation.tsx",
    "src/blocks/data/reui-free-chart-primitives.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/color-picker.tsx",
    "src/components/reui/REUI-LICENSE.txt",
  ]) {
    expect(entries[filename], filename).toBeTruthy();
    expect(strFromU8(entries[filename]), filename).toBe(await readFile(filename, "utf8"));
  }
  expect(strFromU8(entries["src/Example.tsx"])).toContain("DataBlock");
});
