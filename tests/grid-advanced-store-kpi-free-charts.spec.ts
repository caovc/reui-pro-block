import { writeFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { createStoreFixtures } from "../src/blocks/data/grid-advanced-store-kpi-data";

// Unrun draft for the new chart/layout input. Existing default30s/expect5s,
// one worker and zero retries remain the intended native validation protocol.
const route = () =>
  process.env.BRICKLANE_STORE_KPI_URL ?? "./#/preview/data-grid/advanced/data-grid-advanced-16";
const board = (page: Page) => page.getByRole("region", { name: "Store sales KPIs", exact: true });
const records = createStoreFixtures();
const focusStore = records.find(
  (record) => record.market === "US" && record.format === "Flagship" && record.status === "Trading",
)!;
const health = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  health.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
  });
});

test.afterEach(async ({ page }, info) => {
  await writeFile(info.outputPath("native-health.json"), JSON.stringify(health.get(page), null, 2));
  expect(health.get(page)).toEqual([]);
});

test("compact signed charts keep each visible bar on its displayed side of zero", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route());
  await expect(page).toHaveTitle("Store KPI Board — Preview");
  await expect(board(page).getByRole("slider")).toHaveCount(5);
  await expect(board(page).locator(".store-kpi-matrix-chart svg.recharts-surface")).toHaveCount(5);
  await expect(board(page).locator(".store-kpi-native-progress").first()).toBeVisible();
  const plot = board(page).locator(".store-kpi-gap-plot svg.recharts-surface").first();
  await expect(plot).toBeVisible();
  await expect(
    board(page).locator(".store-kpi-history-chart .recharts-scatter").first(),
  ).toBeVisible();

  const geometry = await board(page)
    .locator(".store-kpi-gap")
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        const value = Number.parseFloat(element.querySelector("span")?.textContent ?? "");
        const zero = element.querySelector(".recharts-reference-line line");
        const mark = element.querySelector(".recharts-bar .recharts-rectangle");
        if (!Number.isFinite(value) || value === 0 || !zero || !mark) return [];
        const z = zero.getBoundingClientRect();
        const b = mark.getBoundingClientRect();
        return [{ value, zeroX: z.x, left: b.left, right: b.right, width: b.width }];
      }),
    );
  await writeFile(
    info.outputPath("signed-native-geometry.json"),
    JSON.stringify(geometry, null, 2),
  );
  expect(geometry.length).toBeGreaterThan(0);
  for (const mark of geometry) {
    expect(mark.width).toBeGreaterThan(0);
    if (mark.value > 0) expect(mark.left).toBeGreaterThanOrEqual(mark.zeroX - 1);
    else expect(mark.right).toBeLessThanOrEqual(mark.zeroX + 1);
  }
  await page.screenshot({ path: info.outputPath("desktop-native-charts.png"), fullPage: false });
});

test("phone search keeps full gutters and month keys update five real sliders without country padding", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route());
  await expect(page).toHaveTitle("Store KPI Board — Preview");
  await page.evaluate(() => document.fonts.ready);
  const slider = board(page).getByRole("slider", { name: "Goal pace month", exact: true });
  await slider.press("Home");
  await slider.press("ArrowRight");
  for (const name of [
    "Goal pace month",
    "Net Sales month",
    "Orders month",
    "KPIs up month",
    "Return Rate month",
  ]) {
    await expect(board(page).getByRole("slider", { name, exact: true })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    await expect(board(page).getByRole("slider", { name, exact: true })).toHaveAttribute(
      "aria-valuetext",
      /^Dec 2025,/,
    );
  }
  await board(page)
    .getByRole("textbox", { name: "Search stores", exact: true })
    .fill(focusStore.name);
  await expect(
    board(page).locator('tbody[data-slot="data-grid-table-body"] > tr[data-row-id]'),
  ).toHaveCount(2);
  await expect(board(page).locator(".store-kpi-country-rail")).toHaveCount(0);
  await expect(board(page).locator("tr[data-store-kpi-padding]")).toHaveCount(0);
  const bounds = await board(page).locator(".store-kpi-frame").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeCloseTo(16, 0);
  expect(bounds!.width).toBeCloseTo(358, 0);
  const documentWidth = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(documentWidth.document).toBeLessThanOrEqual(documentWidth.viewport);
  await writeFile(
    info.outputPath("phone-native-geometry.json"),
    JSON.stringify({ bounds, documentWidth }, null, 2),
  );
  await page.screenshot({ path: info.outputPath("phone-native-charts.png"), fullPage: false });
});
