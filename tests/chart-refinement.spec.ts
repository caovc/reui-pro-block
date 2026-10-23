import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import catalog from "../src/data/catalog.json" with { type: "json" };

const blocks = catalog.flatMap((category) => category.blocks);
const refinedIds = [
  "chart-13",
  "chart-27",
  "chart-54",
  "chart-7",
  "chart-8",
  "chart-12",
  "chart-50",
  "chart-51",
  "chart-48",
  "chart-49",
  "chart-53",
];
const errors = new WeakMap<Page, string[]>();
function route(id: string) {
  const block = blocks.find((item) => item.id === id)!;
  return `./#/preview/${block.group}/${block.category}/${block.id}`;
}
async function openChart(page: Page, id: string) {
  await page.goto(route(id));
  await expect(page.locator(".isolated-preview svg").first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  const observed: string[] = [];
  errors.set(page, observed);
  page.on("pageerror", (error) => observed.push(error.message));
  await page.setViewportSize({ width: 1200, height: 850 });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
  await expect(page.getByText("This preview could not be loaded.")).toHaveCount(0);
});

test("capital inflows period changes total and source amounts", async ({ page }) => {
  await openChart(page, "chart-13");
  await expect(page.getByText("$12.4M", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Month", exact: true }).click();
  await expect(page.getByText("$49.8M", { exact: true })).toBeVisible();
  await expect(page.getByText("$18.5M", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Week", exact: true }).click();
  await expect(page.getByText("$12.4M", { exact: true })).toBeVisible();
});

test("browser usage drills into versions and restores all browsers", async ({ page }) => {
  await openChart(page, "chart-27");
  await expect(page.getByRole("row", { name: /Chrome 121,380 59.1%/ })).toBeVisible();
  await page.getByRole("button", { name: "Open Chrome versions", exact: true }).click();
  await expect(page.getByText("Chrome visitors by version", { exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: /^156 / })).toContainText("52.0%");
  await expect(page.getByRole("button", { name: "Compare", exact: true })).toBeDisabled();
  await page
    .getByRole("button", { name: "Chrome versions, back to all browsers", exact: true })
    .click();
  await expect(page.getByRole("row", { name: /Chrome 121,380 59.1%/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Compare", exact: true })).toBeEnabled();
});

test("cloud spend category drilldown exposes its services and restores categories", async ({
  page,
}) => {
  await openChart(page, "chart-54");
  await page.getByRole("button", { name: "Open AI and ML", exact: true }).click();
  await expect(page.getByText("AI and ML cost by service", { exact: true })).toBeVisible();
  await expect(page.getByText("GPU Training", { exact: true })).toBeVisible();
  await expect(page.getByText("Model Inference", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "AI and ML services, back to all categories", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Open Compute", exact: true })).toBeVisible();
});

test("error budget service and rolling window update objective budget bars", async ({ page }) => {
  await openChart(page, "chart-7");
  const availability = page.getByRole("progressbar", {
    name: "Availability budget left",
    exact: true,
  });
  await expect(availability).toHaveAttribute("aria-valuenow", "40");
  await page.getByRole("combobox", { name: "Service", exact: true }).click();
  await page.getByRole("option", { name: "Auth Service", exact: true }).click();
  await expect(availability).toHaveAttribute("aria-valuenow", "58");
  await page.getByRole("radio", { name: "7D", exact: true }).click();
  await expect(availability).toHaveAttribute("aria-valuenow", "66");
  await expect(page.getByText("Auth Service, rolling 7 days", { exact: true })).toBeVisible();
});

test("API region and refresh update throughput and latency readings", async ({ page }) => {
  await openChart(page, "chart-8");
  await expect(page.getByText("4.1K", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Region", exact: true }).click();
  await page.getByRole("option", { name: "EU Central", exact: true }).click();
  await expect(page.getByText("3.8K", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Refresh metrics", exact: true }).click();
  await expect(page.getByText("255", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Production Gateway · Updated just now", { exact: true }),
  ).toBeVisible();
});

test("cash clock keyboard selects days and Escape restores total", async ({ page }) => {
  await openChart(page, "chart-12");
  const clock = page.getByRole("application", {
    name: "Cash inflows day clock. Arrow keys move between days.",
    exact: true,
  });
  await clock.focus();
  await page.keyboard.press("ArrowRight");
  await expect(clock.getByText("Day 17", { exact: true })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(clock.getByText("Day 16", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(clock.getByText("Inflows", { exact: true })).toBeVisible();
  await expect(clock.getByText("$19.7M", { exact: true })).toBeVisible();
});

test("error runway baseline reranks services and permits keyboard focus", async ({ page }) => {
  await openChart(page, "chart-50");
  await expect(
    page.getByRole("button", { name: "billing-api: 2.0d error budget remaining", exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "Baseline", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "billing-api: 4.7d error budget remaining", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "Baseline", exact: true })).toBeChecked();
  const service = page.getByRole("button", {
    name: "auth: 24d error budget remaining",
    exact: true,
  });
  await service.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.locator('[data-slot="card-footer"],[data-slot="frame-panel-footer"]'),
  ).toContainText("auth");
});

test("retention slider supports named keyboard control and play/pause advances the day", async ({
  page,
}) => {
  await openChart(page, "chart-51");
  const slider = page.getByRole("slider", { name: "Days since signup", exact: true });
  await expect(slider).toHaveAttribute("aria-valuenow", "30");
  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "29");
  await expect(page.getByRole("img", { name: /Acquisition channels/ })).toContainText(
    "Kept at Day 29",
  );
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect.poll(() => slider.getAttribute("aria-valuenow")).not.toBe("29");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("revenue flow changes quarter, focuses profit and traces a selected node", async ({
  page,
}) => {
  await openChart(page, "chart-48");
  await page.getByRole("combobox", { name: "Quarter", exact: true }).click();
  await page.getByRole("option", { name: "Q2 FY2026", exact: true }).click();
  await expect(page.getByRole("button", { name: "Revenue, $596M", exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Profit", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Profit", exact: true })).toBeChecked();
  const net = page.getByRole("button", { name: "Net Income, $102M", exact: true });
  await net.click();
  await page.mouse.move(0, 0);
  await expect(page.getByText("Click the node again to clear", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cost of Revenue, $161M", exact: true }),
  ).toHaveAttribute("opacity", "0.25");
  await net.click();
  await expect(page.getByText("Click a node to trace its flow", { exact: true })).toBeVisible();
});

test("trial journey pause stops SVG pulses and replay restarts them", async ({ page }) => {
  await openChart(page, "chart-49");
  await page.getByRole("button", { name: "Pause flow", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume flow", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("animateMotion")).toHaveCount(0);
  await page.getByRole("button", { name: "Replay animation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause flow", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect.poll(() => page.locator("animateMotion").count()).toBeGreaterThan(0);
  await page.getByRole("radio", { name: "7D", exact: true }).click();
  await expect(page.getByText("4,896 trials", { exact: true })).toBeVisible();
});

test("pipeline source filter responds and CSV contains the selected period counts", async ({
  page,
}) => {
  await openChart(page, "chart-53");
  await page.getByRole("radio", { name: "Inbound", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Inbound", exact: true })).toBeChecked();
  await page.getByRole("radio", { name: "30D", exact: true }).click();
  await expect(page.getByText("1,231", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("pipeline-leakage.csv");
  expect(await download.failure()).toBeNull();
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("stage,deals");
  expect(csv).toMatch(/"?Leads"?,"?1231"?/);
  expect(csv).toMatch(/"?Won"?,"?60"?/);
});

test("all eleven dedicated chart previews fit a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  for (const id of refinedIds) {
    await test.step(id, async () => {
      await openChart(page, id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator(".isolated-preview")).not.toBeEmpty();
    });
  }
});
