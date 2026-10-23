import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  failures.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
});
test.afterEach(async ({ page }) => expect(failures.get(page)).toEqual([]));
const open = (page: Page, id: number) => page.goto(`./#/preview/chart/line-chart/chart-${id}`);

test("Balance compares benchmark, changes real trading window and reads last quote by keyboard", async ({
  page,
}) => {
  await open(page, 4);
  await expect(page.getByText("$24,847.83", { exact: true }).first()).toBeVisible();
  const chart = page.getByRole("group", {
    name: "Portfolio balance by trading day. Arrow keys move between points.",
    exact: true,
  });
  await expect(chart.locator(".recharts-line")).toHaveCount(1);
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(chart.locator(".recharts-line")).toHaveCount(2);
  await page.getByRole("radio", { name: "1M", exact: true }).click();
  await expect(page.getByText("22 trading days", { exact: true })).toBeVisible();
  await chart.focus();
  await page.keyboard.press("End");
  await expect(chart.getByRole("status")).toContainText("Oct 16");
  await expect(chart.getByRole("status")).toContainText("$24,847.83");
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Average Line", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(chart.locator(".recharts-reference-line")).toHaveCount(1);
});

test("Metric tiles change actual series, events and previous layer can be removed", async ({
  page,
}) => {
  await open(page, 6);
  await page.getByRole("button", { name: /^Revenue \$/ }).click();
  const chart = page.getByRole("group", {
    name: "Revenue over time. Arrow keys move between points.",
    exact: true,
  });
  await expect(chart).toBeVisible();
  await expect(chart.locator(".recharts-area")).toHaveCount(1);
  await page.getByRole("radio", { name: "7D", exact: true }).click();
  await chart.focus();
  await page.keyboard.press("Home");
  await expect(chart.getByRole("status")).toContainText("Jun 24");
  await page.getByRole("button", { name: /^Display / }).click();
  await page.getByRole("menuitemcheckbox", { name: "Events", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(chart.locator(".recharts-reference-area")).toHaveCount(0);
  await page.getByRole("button", { name: /^Display / }).click();
  await page.getByRole("menuitemcheckbox", { name: "Previous period", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(chart.locator(".recharts-line")).toHaveCount(0);
});

test("Revenue cumulative mode aggregates exported rows and source visibility", async ({ page }) => {
  await open(page, 22);
  const chart = page.getByRole("group", {
    name: "Net revenue and revenue sources. Arrow keys move between points.",
    exact: true,
  });
  await expect(chart.locator(".recharts-line")).toHaveCount(4);
  await page.getByRole("radio", { name: "Cumulative", exact: true }).click();
  await chart.focus();
  await page.keyboard.press("End");
  await expect(chart.getByRole("status")).toContainText("Net revenue $");
  await page.getByRole("button", { name: "Compare with: Previous period", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "None", exact: true }).click();
  await expect(chart.locator(".recharts-line")).toHaveCount(3);
  await page.getByRole("button", { name: "Subscriptions", exact: true }).click();
  await expect(chart.locator(".recharts-line")).toHaveCount(2);
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const file = await download;
  const csv = await readFile((await file.path())!, "utf8");
  const rows = csv.trim().split("\n");
  expect(rows).toHaveLength(31);
  expect(rows[0]).toContain("net");
  expect(rows.at(-1)).toContain("Oct 16");
  const cells = (line: string) => line.split(",").map((v) => v.replaceAll('"', ""));
  const header = cells(rows[0]),
    first = cells(rows[1]),
    last = cells(rows.at(-1)!);
  expect(Number(last[header.indexOf("net")])).toBeGreaterThan(
    Number(first[header.indexOf("net")]) * 15,
  );
  expect(Number(last[header.indexOf("net")])).toBe(
    Number(last[header.indexOf("subscriptions")]) + Number(last[header.indexOf("oneTime")]),
  );
});

test("Social content and metric change table totals and selected channel lines", async ({
  page,
}) => {
  await open(page, 23);
  const table = page.getByRole("table", { name: "Social channel breakdown", exact: true });
  await expect(table.getByRole("row", { name: /Facebook 17 / })).toBeVisible();
  await page.getByRole("button", { name: "Content: All content", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Video", exact: true }).click();
  await expect(table.getByRole("row", { name: /Facebook 6 / })).toBeVisible();
  await page.getByRole("button", { name: "Metric: Engagement rate", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Impressions", exact: true }).click();
  const chart = page.getByRole("group", {
    name: "Social channel performance. Arrow keys move between points.",
    exact: true,
  });
  await chart.focus();
  await page.keyboard.press("End");
  await expect(chart.getByRole("status")).toContainText("Instagram");
  await page.getByRole("button", { name: "Instagram", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await expect(chart.locator(".recharts-line")).toHaveCount(2);
  await page.getByRole("button", { name: "Facebook", exact: true }).click();
  await page.getByRole("button", { name: "LinkedIn", exact: true }).click();
  await expect(page.getByText("No channels selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show all channels", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(3);
});

test("Sales and traffic retain dual axes, compare ghosts and independently editable official colors", async ({
  page,
}) => {
  await open(page, 24);
  const chart = page.getByRole("group", {
    name: "Sales and page views by day. Arrow keys move between points.",
    exact: true,
  });
  await expect(chart.locator(".recharts-yAxis")).toHaveCount(2);
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(chart.locator(".recharts-line")).toHaveCount(4);
  await page.getByRole("button", { name: "Views color", exact: true }).click();
  const picker = page.getByRole("dialog", { name: "Views color", exact: true });
  await picker.getByRole("textbox", { name: "Hex", exact: true }).fill("319D8F");
  await picker.getByRole("textbox", { name: "Hex", exact: true }).press("Tab");
  await page.keyboard.press("Escape");
  await expect(chart.locator(".recharts-line-curve").nth(1)).toHaveAttribute("stroke", /319d8f/i);
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Average sales", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(chart.locator(".recharts-reference-line")).toHaveCount(1);
});

test("Floor alert uses official NumberField, edits visible threshold and changes price window", async ({
  page,
}) => {
  await open(page, 26);
  await page.getByRole("button", { name: "Floor alert armed", exact: true }).click();
  const field = page.getByLabel("Alert threshold in ETH", { exact: true });
  await field.fill("2.50");
  await field.press("ArrowUp");
  await field.press("Tab");
  await page.getByRole("button", { name: "Save alert", exact: true }).click();
  await expect(page.getByText("Alert 2.51 ETH", { exact: true })).toBeVisible();
  const chart = page.getByRole("group", {
    name: "Floor and top bid by day. Arrow keys move between points.",
    exact: true,
  });
  await expect(chart.getByText("Alert 2.51", { exact: true })).toBeVisible();
  await expect(chart.locator(".recharts-area")).toHaveCount(1);
  await page.getByRole("radio", { name: "7D", exact: true }).click();
  await chart.focus();
  await page.keyboard.press("Home");
  await expect(chart.getByRole("status")).toContainText("Oct 10");
  await page.getByRole("button", { name: "Floor alert armed", exact: true }).click();
  await page.getByRole("switch", { name: "Alert enabled", exact: true }).click();
  await page.getByRole("button", { name: "Save alert", exact: true }).click();
  await expect(chart.locator(".recharts-reference-line")).toHaveCount(0);
});

test("all six independent line previews fit mobile with the channel table condensed to three columns", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 850 });
  for (const id of [4, 6, 22, 23, 24, 26]) {
    await open(page, id);
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `chart-${id}`,
    ).toBe(true);
    if (id === 4) {
      const low = (await page.getByText(/^Low \$/).boundingBox())!;
      expect(low.x).toBeGreaterThanOrEqual(12);
    }
    if (id === 26) {
      const menu = (await page
        .getByRole("button", { name: "More actions", exact: true })
        .boundingBox())!;
      expect(menu.x + menu.width).toBeLessThanOrEqual(390);
    }
    if (id === 23) await expect(page.getByRole("table").getByRole("columnheader")).toHaveCount(3);
  }
});
