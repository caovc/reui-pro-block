import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const implementations = [
  ["application/auth/auth-6", "src/blocks/application/auth-editorial.tsx", "FounderStoryLogin"],
  ["application/auth/auth-8", "src/blocks/application/auth-editorial.tsx", "PhotoBackdropLogin"],
  ["chart/line-chart/chart-4", "src/blocks/data/balance-floor-lines.tsx", "BalanceTracker"],
  [
    "ecommerce/receipt/receipt-2",
    "src/blocks/commerce/receipt-documents.tsx",
    "TrackingTimelineReceipt",
  ],
] as const;

for (const [route, filename, component] of implementations) {
  test(`${route} opens and copies its actual implementation`, async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/${route}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const sourceFile = dialog.getByRole("combobox", { name: "Source file" });
    await sourceFile.waitFor({ state: "visible" });
    await expect(sourceFile).toHaveText(filename);
    const code = dialog.locator(".source-code");
    await expect(code).toContainText(`function ${component}`);
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(await readFile(filename, "utf8"));
  });
}
