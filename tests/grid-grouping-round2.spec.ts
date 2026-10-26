import { expect, test } from "@playwright/test";

const route = (entry: number) => `/#/preview/data-grid/grouping/data-grid-grouping-${entry}`;

test("roadmap filtering retains each task's category, date and owners", async ({ page }) => {
  await page.goto(route(1));
  await page.getByLabel("Search roadmap...", { exact: true }).fill("Prototype mobile composer");
  const row = page.locator("tbody tr").filter({ hasText: "Prototype mobile composer" });
  await expect(row).toContainText("Mobile");
  await expect(row).toContainText("27 Apr");
  await expect(row.getByLabel("Mina Rowe", { exact: true })).toBeVisible();
  await expect(page.getByText("1 visible", { exact: true })).toBeVisible();
});

for (const [entry, search] of [
  [1, "Search roadmap..."],
  [2, "Search accounts..."],
  [3, "Search signals"],
] as const) {
  test(`grouping ${entry} uses the official empty row and restores real children`, async ({
    page,
  }) => {
    await page.goto(route(entry));
    const field = page.getByLabel(search, { exact: true });
    await field.fill("__no_matching_grouping_record__");
    await expect(page.locator('[data-slot="data-grid-table-empty"]')).toHaveText(
      "No records match your filters.",
    );
    await expect(
      page.getByRole("button", {
        name: /^(Collapse|Expand) (Backlog|North America|Clinical Fit)$/,
      }),
    ).toHaveCount(0);
    await field.clear();
    await expect(page.locator('[data-slot="data-grid-table-empty"]')).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: /^(Collapse|Expand) (Backlog|North America|Clinical Fit)$/,
      }),
    ).toHaveCount(1);
  });
}

test("region rows align weighted retention and earliest renewal with their data columns", async ({
  page,
}) => {
  await page.goto(route(2));
  const group = page
    .locator("tbody tr")
    .filter({ has: page.getByRole("button", { name: "Collapse North America", exact: true }) });
  await expect(group.locator("td").nth(3)).toContainText("$2,905,000");
  await expect(group.locator("td").nth(4)).toHaveText("115%");
  await expect(group.locator("td").nth(5)).toContainText("Jun 30, 2026");
  await page.getByLabel("Search accounts...", { exact: true }).fill("Northwind");
  await expect(group.locator("td").nth(3)).toContainText("$920,000");
  await expect(group.locator("td").nth(4)).toHaveText("124%");
  await expect(group.locator("td").nth(5)).toContainText("Sep 14, 2026");
});

test("cohort selection changes the records and hold-risk groups", async ({ page }) => {
  await page.goto(route(3));
  await page.getByRole("combobox", { name: "Patient cohort", exact: true }).click();
  await page.getByRole("option", { name: "Cardiology Priority", exact: true }).click();
  await expect(page.getByText("3,566", { exact: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Hold risk", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Collapse Watch list", exact: true }),
  ).toBeVisible();
  await page.getByRole("switch").uncheck();
  await expect(page.getByText("Acute pain and mobility limits", { exact: true })).toHaveCount(0);
});

test("cohort heat cells fill the row and compare their rate to the cohort", async ({ page }) => {
  await page.goto(route(3));
  const firstSignal = page.locator("tbody tr").filter({ hasText: "Needs care this week" });
  const heat = firstSignal.locator('[data-cohort-heat="verified"]');
  const rowBox = await firstSignal.boundingBox();
  const heatBox = await heat.boundingBox();
  expect(heatBox!.height).toBeGreaterThanOrEqual(rowBox!.height - 2);
  await heat.hover();
  await expect(page.getByText("Cohort average 75%", { exact: true })).toBeVisible();
  await expect(page.getByText("+10 pts", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Answers", exact: true }).click();
  await expect(page.locator("[data-cohort-signal]").first()).toContainText("Imaging is ready");
});

test("roadmap selection survives collapse and completion updates its stage mix", async ({
  page,
}) => {
  await page.goto(route(1));
  await page
    .getByRole("checkbox", { name: "Select Prototype mobile composer", exact: true })
    .check();
  await page.getByRole("button", { name: "Collapse To Do", exact: true }).click();
  await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark done", exact: true }).click();
  await expect(page.getByLabel("Stage mix")).toContainText("Done: 4");
  const completed = page.locator("tbody tr").filter({ hasText: "Prototype mobile composer" });
  await expect(completed).toContainText("100%");
  await expect(completed).toContainText("Done");
});

test("region column hiding and compact rows keep the total aligned", async ({ page }) => {
  await page.goto(route(2));
  const firstRow = page.locator("tbody tr").filter({ hasText: "Northwind Trading" });
  const height = (await firstRow.boundingBox())!.height;
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Owner", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Compact rows", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: "Owner", exact: true })).toHaveCount(0);
  const footer = page.locator("tr").filter({ hasText: "All Regions" });
  await expect(footer.locator("td")).toHaveCount(6);
  await expect(footer.locator("td").nth(2)).toContainText("$8,575,000");
  expect((await firstRow.boundingBox())!.height).toBeLessThan(height);
});

test("roadmap signal facets combine and clear against the original task records", async ({
  page,
}) => {
  await page.goto(route(1));
  await page.getByRole("button", { name: "Signals", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Blocked", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "At risk", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText("6 visible", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /^Select / })).toHaveCount(6);
  await page.getByRole("button", { name: /Signals/ }).click();
  await page.getByRole("menuitemcheckbox", { name: "Blocked", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "At risk", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText("19 visible", { exact: true })).toBeVisible();
});

test("roadmap comfortable and compact density preserve the reference row sizes", async ({
  page,
}) => {
  await page.goto(route(1));
  const row = page.locator("tbody tr").filter({ hasText: "Draft first-run board tips" });
  expect((await row.boundingBox())!.height).toBeLessThanOrEqual(42);
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Compact rows", exact: true }).click();
  await page.keyboard.press("Escape");
  expect((await row.boundingBox())!.height).toBeLessThanOrEqual(34);
});
