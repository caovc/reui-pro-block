import { expect, test } from "@playwright/test";

const route = "/#/preview/data-grid/advanced/data-grid-advanced-13";
const firstKpi = 'tr[data-row-id="HR-101"]';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "HR Scorecard", exact: true })).toBeVisible();
});

test("HR uses native grouped headers, six real parent rows and a matching totals footer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const grid = page.getByRole("grid").first();
  await expect(grid.locator("thead tr")).toHaveCount(2);
  await expect(grid.locator('tbody tr[data-row-id^="group-"]')).toHaveCount(6);
  await expect(grid.locator("tbody tr[data-depth='1']")).toHaveCount(24);
  await expect(grid.locator('thead th[rowspan="2"]')).not.toHaveCount(0);
  await expect(grid.locator("tfoot")).toContainText("10 of 24 on track");
  await expect(grid.locator("tfoot td")).toHaveCount(await grid.locator("colgroup col").count());
  const footerLabel = grid.locator("tfoot .hr-footer-label");
  await footerLabel.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      footerLabel.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        if (centerX < 0 || centerX >= innerWidth || centerY < 0 || centerY >= innerHeight)
          return false;
        const topmost = document.elementFromPoint(centerX, centerY);
        return topmost !== null && element.contains(topmost);
      }),
    )
    .toBe(true);
});

test("built-in spreadsheet editor applies lower-is-better target 32 → 40 and Ctrl Z restores it", async ({
  page,
}) => {
  const row = page.locator(firstKpi);
  const target = row.locator('td[data-col-id="target"]');
  await expect(target).toHaveText("32.0");
  await target.dblclick();
  const input = page.getByRole("textbox", { name: "Target", exact: true });
  await input.fill("40");
  await input.press("Enter");
  await expect(target).toHaveText("40.0");
  await expect(row.locator('td[data-col-id="attainment"]')).toHaveText("94%");
  await expect(row.locator('td[data-col-id="vsTarget"]')).toHaveText("106");
  await expect(page.locator(".hr-scorecard-summary")).toContainText("11 of 24 on track");
  await page.keyboard.press("Control+z");
  await expect(target).toHaveText("32.0");
  await expect(row.locator('td[data-col-id="vsTarget"]')).toHaveText("85");
});

test("native paste updates target and actual in one batch and one Undo restores both", async ({
  page,
}) => {
  const row = page.locator(firstKpi);
  await row.locator('td[data-col-id="target"]').click();
  await page
    .getByRole("grid")
    .first()
    .evaluate((grid) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", "40\t35");
      grid.dispatchEvent(
        new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData }),
      );
    });
  await expect(row.locator('td[data-col-id="target"]')).toHaveText("40.0");
  await expect(row.locator('td[data-col-id="actual"]')).toHaveText("35.0");
  await page.locator(".hr-scorecard").getByRole("button", { name: "Undo", exact: true }).click();
  await expect(row.locator('td[data-col-id="target"]')).toHaveText("32.0");
  await expect(row.locator('td[data-col-id="actual"]')).toHaveText("37.6");
});

test("Month/YTD switches real rollups and YTD measurements remain read-only", async ({ page }) => {
  const row = page.locator(firstKpi);
  await page.locator('[data-slot="toggle-group-item"]').filter({ hasText: /^YTD$/ }).click();
  await expect(row.locator('td[data-col-id="actual"]')).toHaveText("38.8");
  await row.locator('td[data-col-id="target"]').dblclick();
  await expect(page.getByRole("textbox", { name: "Target", exact: true })).toHaveCount(0);
  await expect(page.getByText("Month only editing.", { exact: false })).toBeVisible();
  await page
    .locator('[data-slot="toggle-group-item"]')
    .filter({ hasText: /^Month$/ })
    .click();
  await expect(row.locator('td[data-col-id="actual"]')).toHaveText("37.6");
});

test("search scopes group and footer while whole-book cards remain unchanged", async ({ page }) => {
  const summary = page.locator(".hr-scorecard-summary");
  const original = await summary.innerText();
  await page.getByRole("textbox", { name: "Search KPIs", exact: true }).fill("Hiring cycle time");
  const grid = page.getByRole("grid").first();
  await expect(grid.locator('tbody tr[data-row-id^="group-"]')).toHaveCount(1);
  await expect(grid.locator("tbody tr[data-depth='1']")).toHaveCount(1);
  await expect(grid.locator("tfoot")).toContainText("0 of 1 on track");
  await expect(summary).toHaveText(original, { useInnerText: true });
});

test("native collapse preserves summary and column visibility preserves footer alignment", async ({
  page,
}) => {
  const grid = page.getByRole("grid").first();
  await page
    .locator('tr[data-row-id="group-Hiring"]')
    .getByRole("button", { name: "Collapse row", exact: true })
    .click();
  await expect(page.locator(firstKpi)).toHaveCount(0);
  await expect(page.locator(".hr-scorecard-summary")).toContainText("10 of 24 on track");
  await page.getByRole("button", { name: "View", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Owner", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(grid.locator('tbody td[data-col-id="owner"]')).toHaveCount(0);
  await expect(grid.locator("tfoot td")).toHaveCount(await grid.locator("colgroup col").count());
});

test("owner reassignment writes the raw KPI and Undo restores its previous owner", async ({
  page,
}) => {
  const owner = page.getByRole("combobox", {
    name: "Owner of Hiring cycle time: Ari Bennett",
    exact: true,
  });
  await expect(owner).toHaveAttribute("data-slot", "select-trigger");
  await owner.click();
  await page.getByRole("option", { name: "Iris Reed", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Owner of Hiring cycle time: Iris Reed", exact: true }),
  ).toBeVisible();
  await page.locator(".hr-scorecard").getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Owner of Hiring cycle time: Ari Bennett", exact: true }),
  ).toBeVisible();
});

test("new unreported KPI stays Pending, can be removed with confirmation and restored", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Add KPI", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Add KPI", exact: true });
  await sheet.getByRole("textbox", { name: "KPI name", exact: true }).fill("Bricklane HR trial");
  await sheet.getByRole("button", { name: "Add KPI", exact: true }).click();
  await expect(page.locator(".hr-scorecard-summary")).toContainText("10 of 25 on track");
  await expect(page.locator(".hr-scorecard-summary")).toContainText("1 Pending");
  await page.getByRole("button", { name: "Actions for Bricklane HR trial", exact: true }).click();
  await page.getByRole("menuitem", { name: "Remove KPI", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remove KPI", exact: true })
    .click();
  await expect(page.locator(".hr-scorecard-summary")).toContainText("10 of 24 on track");
  await page.locator(".hr-scorecard").getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".hr-scorecard-summary")).toContainText("10 of 25 on track");
});

test("mobile scroll keeps native expand/KPI columns fixed without document overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await expect(page.getByRole("textbox", { name: "Search KPIs", exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".hr-scorecard-heading")
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(120);
  const tools = await page.locator(".hr-scorecard-tools").boundingBox();
  const period = await page.locator(".hr-scorecard-period-actions").boundingBox();
  expect(tools).not.toBeNull();
  expect(period).not.toBeNull();
  expect(tools!.y + tools!.height).toBeLessThanOrEqual(period!.y);
  expect(period!.height).toBe(32);
  const viewport = page.locator('.hr-scorecard [data-slot="scroll-area-viewport"]').first();
  const pinned = page.locator(firstKpi).locator('td[data-col-id="label"]');
  const initialX = await pinned.evaluate((element) => element.getBoundingClientRect().x);
  await viewport.evaluate((element) => {
    element.scrollLeft = 600;
  });
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(500);
  await expect
    .poll(() => pinned.evaluate((element) => element.getBoundingClientRect().x))
    .toBeCloseTo(initialX, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(failures).toEqual([]);
});
