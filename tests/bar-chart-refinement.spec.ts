import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const ids = [
  "chart-9",
  "chart-10",
  "chart-29",
  "chart-30",
  "chart-32",
  "chart-33",
  "chart-35",
  "chart-40",
  "chart-42",
  "chart-43",
  "chart-45",
  "chart-47",
];
const errors = new WeakMap<Page, string[]>();
async function open(page: Page, id: string) {
  await page.goto(`./#/preview/chart/bar-chart/${id}`);
  await expect(page.locator(".isolated-preview")).not.toBeEmpty();
}
async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  const found: string[] = [];
  errors.set(page, found);
  page.on("pageerror", (e) => found.push(e.message));
  await page.setViewportSize({ width: 1200, height: 850 });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test("fund prisms isolate a fund, select a year and switch to totals", async ({ page }) => {
  await open(page, "chart-9");
  await expect(page.getByRole("radio", { name: "2025: $14.3M", exact: true })).toBeChecked();
  await choose(page, "Fund shown", "WaveMark Capital");
  await expect(page.getByRole("radio", { name: "2025: $7.9M", exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "2024: $6.5M", exact: true }).click();
  await expect(page.getByText("2024 Inflows", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Prism display", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Total", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Fund shown", exact: true })).toBeDisabled();
  await expect(page.getByText("All 6 funds combined", { exact: true })).toBeVisible();
});

test("training metric, keyboard week, plan comparison and expansion work", async ({ page }) => {
  await open(page, "chart-10");
  await page.getByRole("radio", { name: "Distance", exact: true }).click();
  await expect(page.getByText("40.1 km", { exact: true })).toBeVisible();
  const plot = page.getByRole("application", {
    name: "Weekly running distance. Arrow keys move between weeks.",
    exact: true,
  });
  await plot.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("Training week 11", { exact: true })).toBeVisible();
  await expect(page.getByText("54.2 km", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Compare against", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Training Plan", exact: true }).click();
  await expect(
    page.locator('[data-slot="card-footer"],[data-slot="frame-panel-footer"]'),
  ).toContainText("Training Plan");
  await page.getByRole("button", { name: "Expand chart", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Training Volume", exact: true })).toContainText(
    "W11",
  );
});

test("inventory warehouse totals, category sorting and readouts respond", async ({ page }) => {
  await open(page, "chart-29");
  await page.getByRole("button", { name: "Warehouses", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Reno DC", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.locator('[data-slot="card-footer"],[data-slot="frame-panel-footer"]'),
  ).toContainText("2 of 3 warehouses");
  await page.getByRole("button", { name: "Sort categories", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Highest velocity", exact: true }).click();
  const chart = page.getByRole("img", { name: "Inventory velocity by category", exact: true });
  await expect(chart.getByRole("button").first()).toHaveAttribute("aria-label", /^Automotive:/);
  await chart.getByRole("button").first().click();
  await expect(page.getByRole("status")).toContainText("Automotive");
  await expect(page.getByRole("status")).toContainText("Columbus DC, Savannah DC");
});

test("transit P90 and sort change lane gaps and order", async ({ page }) => {
  await open(page, "chart-30");
  await page.getByRole("radio", { name: "P90", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Africa: road +3.5 d, rail +4.2 d", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("P90 door-to-door days against target", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sort regions", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Most Ahead", exact: true }).click();
  await expect(
    page
      .getByRole("img", { name: "P90 road and rail gaps against target", exact: true })
      .getByRole("button")
      .first(),
  ).toHaveAttribute("aria-label", /^Europe:/);
});

test("runner window, job and failure-only preset change plotted runner time", async ({ page }) => {
  await open(page, "chart-32");
  const chart = page.getByRole("img", {
    name: "Runner Time per hour. Arrow keys move between hours.",
    exact: true,
  });
  await expect(chart.getByRole("button")).toHaveCount(24);
  await choose(page, "Time window", "Last 6 Hours");
  await expect(chart.getByRole("button")).toHaveCount(6);
  await choose(page, "Jobs", "Daily settlement export");
  await expect(
    page.locator('[data-slot="card-footer"],[data-slot="frame-panel-footer"]'),
  ).toContainText("Daily settlement export");
  await page.getByRole("button", { name: "Outcomes", exact: true }).click();
  await page.getByRole("menuitem", { name: "Failures only", exact: true }).click();
  await expect(page.getByRole("button", { name: "Outcomes", exact: true })).toContainText("2/3");
  await expect(page.getByText("Succeeded", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Display options", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Gridlines", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(chart.locator(".recharts-cartesian-grid")).toHaveCount(0);
});

test("cron run now appends a run and keyboard opens its execution log", async ({ page }) => {
  await open(page, "chart-33");
  await page.getByRole("button", { name: "Run now", exact: true }).click();
  await expect(page.getByText("RUN-58421", { exact: true })).toBeVisible();
  const plot = page.getByRole("application", {
    name: "Run durations. Arrow keys move, Enter opens a run.",
    exact: true,
  });
  await plot.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("execution log");
  await expect(sheet).toContainText("worker acquired");
  await sheet.getByRole("button", { name: "Retry run", exact: true }).click();
  await expect(
    page.locator(".isolated-preview").getByText("RUN-58422", { exact: true }),
  ).toBeVisible();
});

test("audit keyboard range sums outcomes and Escape clears selection", async ({ page }) => {
  await open(page, "chart-35");
  await expect(page.getByText("1,372", { exact: true })).toBeVisible();
  const plot = page.getByRole("application", {
    name: "Audit event buckets. Arrow keys move, Enter selects, Shift+Enter extends, Escape clears.",
    exact: true,
  });
  await plot.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+Enter");
  await expect(page.getByText(/Selected 3 buckets · \d+ events/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Clear selection", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Denied", exact: true }).click();
  await expect(page.getByText(/Denial markers hidden/)).toBeVisible();
});

test("firewall hour selection exposes incident details and traffic filtering responds", async ({
  page,
}) => {
  await open(page, "chart-40");
  await page.getByRole("button", { name: /03:00: 54,050 requests, Credential stuffing/ }).click();
  await expect(page.getByRole("status")).toContainText("Credential stuffing on /oauth/token");
  await choose(page, "Traffic shown", "Blocked");
  await expect(page.getByRole("combobox", { name: "Traffic shown", exact: true })).toHaveText(
    "Blocked",
  );
  await choose(page, "Time range", "6 Hours");
  await expect(
    page.getByRole("group", { name: "Requests per hour", exact: true }).getByRole("button"),
  ).toHaveCount(6);
});

test("error budget selects a keyboard range and changes SLO health", async ({ page }) => {
  await open(page, "chart-42");
  await expect(page.getByText("Exhausted", { exact: true })).toBeVisible();
  const plot = page.getByRole("application", {
    name: "Daily error budget. Arrow keys move, Enter selects a day, Shift+Enter extends, Escape clears.",
    exact: true,
  });
  await plot.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Shift+Enter");
  await expect(page.getByText(/Days 27–29 · .* budget spent/)).toBeVisible();
  await page.keyboard.press("Escape");
  await choose(page, "SLO", "Fraud score latency");
  await expect(page.getByText("Healthy", { exact: true })).toBeVisible();
  await expect(page.getByText("Tracking within the monthly budget", { exact: true })).toBeVisible();
});

test("SLO burn mute confirms, unmutes and range changes actual hourly points", async ({ page }) => {
  await open(page, "chart-43");
  await page.getByRole("button", { name: "Mute", exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "Mute Alerts?", exact: true });
  await expect(dialog).toContainText("#sre-oncall");
  await dialog.getByRole("button", { name: "Mute", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unmute", exact: true })).toBeVisible();
  await expect(page.getByText("Firing", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Unmute", exact: true }).click();
  await expect(page.getByText("Firing", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "24h", exact: true }).click();
  await expect(
    page
      .getByRole("img", { name: "Log scale burn rates for the last 24 hours", exact: true })
      .getByRole("button"),
  ).toHaveCount(24);
});

test("sync activity rows metric and source filters change values", async ({ page }) => {
  await open(page, "chart-45");
  await page.getByRole("radio", { name: "Rows", exact: true }).click();
  await expect(
    page.getByRole("application", {
      name: "Rows synced per hour by outcome. Arrow keys move between hours.",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sources", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Google Drive", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Sources", exact: true })).toContainText("3/4");
  await expect(page.getByText("6.1M", { exact: true })).toBeVisible();
  await expect(
    page.locator('[data-slot="card-footer"],[data-slot="frame-panel-footer"]'),
  ).toContainText("9 of 13 connections active");
});

test("sync history issues filter, retry and manual sync create visible successful runs", async ({
  page,
}) => {
  await open(page, "chart-47");
  await page.getByRole("radio", { name: "Issues", exact: true }).click();
  await expect(page.getByText("RUN-48303", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("E_LIST_TIMEOUT Folder listing timed out after 120s", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Actions for RUN-48297", exact: true }).click();
  await page.getByRole("menuitem", { name: "Retry run", exact: true }).click();
  await page.getByRole("radio", { name: "All", exact: true }).click();
  await expect(page.getByText("RUN-48304", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sync Now", exact: true }).click();
  await expect(page.getByText("RUN-48305", { exact: true })).toBeVisible();
});

test("bar CSV export downloads current warehouse data", async ({ page }) => {
  await open(page, "chart-29");
  await page.getByRole("button", { name: "Warehouses", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Reno DC", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Warehouses", exact: true })).toContainText("2/3");
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("inventory-velocity.csv");
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("category,unitsPerDay,daysOfSupply");
  expect(csv).toContain('"Electronics","222","52"');
});

test("audit pointer drag selects an actual bucket span", async ({ page }) => {
  await open(page, "chart-35");
  const svg = page.getByRole("img", {
    name: "Audit event buckets. Arrow keys move, Enter selects, Shift+Enter extends, Escape clears.",
    exact: true,
  });
  const box = (await svg.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.48, box.y + box.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Clear selection", exact: true })).toBeVisible();
  await expect(page.getByText(/Selected \d+ buckets · \d+ events/)).toBeVisible();
});

test("all twelve bar previews fit mobile and inventory switches to horizontal pills", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 850 });
  for (const id of ids) {
    await test.step(id, async () => {
      await open(page, id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(
        page.locator(
          '.isolated-preview [data-slot="card-title"],.isolated-preview [data-slot="frame-panel-title"]',
        ),
      ).not.toBeEmpty();
    });
  }
  await open(page, "chart-29");
  await expect(
    page.getByRole("button", {
      name: "Electronics: 342 units per day, 52 days of supply",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Inventory velocity by category", exact: true }),
  ).toHaveCount(0);
});

test("cron status filter preserves the selected execution and can restore all bars", async ({
  page,
}) => {
  await open(page, "chart-33");
  await choose(page, "Statuses", "Timed Out");
  const plot = page.getByRole("img", {
    name: "Run durations. Arrow keys move, Enter opens a run.",
    exact: true,
  });
  await expect(plot.getByRole("button")).toHaveCount(1);
  await plot.getByRole("button").click();
  const log = page.getByRole("dialog");
  await expect(log.getByRole("heading", { name: "RUN-58413", exact: true })).toBeVisible();
  await expect(log).toContainText("E_TIMEOUT timeout exceeded");
  await page.keyboard.press("Escape");
  await choose(page, "Statuses", "All Statuses");
  await expect(plot.getByRole("button")).toHaveCount(20);
});
