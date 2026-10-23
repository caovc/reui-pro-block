import { test, expect } from "@playwright/test";

test("solution grid fallback uses the same official models for OR facets, selection and CRUD", async ({
  page,
}) => {
  await page.goto("/#/preview/solutions/billing/solution-billing-1");
  await expect(page.locator('[data-slot="data-grid-table"]')).toBeVisible();
  await page.getByRole("button", { name: "Status", exact: true }).first().click();
  await page.getByRole("option", { name: "Paid", exact: true }).click();
  await page.getByRole("option", { name: "Pending", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText("1 - 7 of 16", { exact: true })).toBeVisible();
  await expect(page.locator("tbody")).not.toContainText("Overdue");
  await page.locator("tbody tr").first().getByRole("checkbox").check();
  await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("1 - 7 of 15", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add customer", exact: true }).click();
  await page.getByLabel("Customer", { exact: true }).fill("Native model account");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search records", exact: true })
    .fill("Native model account");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Native model account");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
