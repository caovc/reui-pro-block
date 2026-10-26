import { expect, test } from "@playwright/test";

test("Flowly uses reference column proportions and all three health pages retain independent actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/flowly");
  const table = page.locator(".wf-health-table");
  const name = table.getByRole("button", { name: "Churn Risk Digest", exact: true });
  const title = await name.boundingBox();
  expect(title).not.toBeNull();
  expect(Math.abs(title!.x - 393)).toBeLessThan(3);
  const header = await table
    .getByRole("columnheader", { name: "Workflow", exact: true })
    .boundingBox();
  expect(header!.height).toBe(32);
  await expect(table).toContainText("1 - 5 of 12");
  await table.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(table.getByRole("button", { name: "Invoice Reminders", exact: true })).toBeVisible();
  await expect(table).toContainText("6 - 10 of 12");
  await table.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(table.getByRole("button", { name: "Support Triage", exact: true })).toBeVisible();
  await table.getByRole("button", { name: "Actions Support Triage", exact: true }).click();
  await page.getByRole("menuitem", { name: "Activate", exact: true }).click();
  await expect(table.getByRole("row").filter({ hasText: "Support Triage" })).toContainText(
    "Active",
  );
  await expect(table.getByRole("row").filter({ hasText: "Social Mentions Alert" })).toContainText(
    "Failing",
  );
  await page.getByRole("button", { name: "Agents", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("textbox", { name: "Search workflows", exact: true }).fill("Support Triage");
  await expect(table.getByRole("row").filter({ hasText: "Support Triage" })).toContainText(
    "Active",
  );
});

test("Flowly health grid stays inside its own scroll viewport on a phone", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/template-preview/flowly");
  await expect(page.getByRole("columnheader", { name: "Workflow", exact: true })).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});
