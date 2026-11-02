import { expect, test, type ElementHandle, type Locator, type Page } from "@playwright/test";
import { campaignTargetRows } from "../src/blocks/data/grid-advanced-seeds";

// Runs against the normal preview routes after the GridTabs migration is installed.
// No alternate route or injected focus is used.
const runtimeErrors = new WeakMap<Page, string[]>();
const tableSelector = '[data-slot="data-grid-table"]';
const campaignNames = ["All", "Prospecting", "Retargeting", "Retention"];
const healthNames = ["All", "Exhausted", "At Risk", "Healthy"];

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  runtimeErrors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([]);
});

function namedTab(list: Locator, name: string) {
  // The actual free Tabs example includes the count Badge in the accessible name.
  return list.getByRole("tab", { name: new RegExp(`^${name}(?:\\s*\\d+)?$`) });
}

function campaignIds(segment: string, search = "") {
  return campaignTargetRows
    .filter(
      (row) =>
        (segment === "All" || row.segment === segment) &&
        row.name.toLowerCase().includes(search.toLowerCase()),
    )
    .toSorted((a, b) => b.spend - a.spend)
    .slice(0, 10)
    .map((row) => String(row.id));
}

async function expectRowIds(table: Locator, ids: string[]) {
  await expect
    .poll(() =>
      table
        .locator("tbody tr[data-row-id]")
        .evaluateAll((rows) => rows.map((row) => row.getAttribute("data-row-id"))),
    )
    .toEqual(ids);
}

async function expectSameTable(original: ElementHandle, table: Locator) {
  expect(await original.evaluate((node) => node.isConnected)).toBe(true);
  expect(await table.evaluate((node, previous) => node === previous, original)).toBe(true);
}

async function expectNoOuterOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    )
    .toBe(false);
}

async function expectActiveTab(frame: Locator, list: Locator, names: string[], name: string) {
  const active = namedTab(list, name);
  await expect(active).toBeFocused();
  await expect(active).toHaveAttribute("aria-selected", "true");
  await expect(active).toHaveAttribute("tabindex", "0");
  await expect(list.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
  for (const other of names.filter((item) => item !== name)) {
    await expect(namedTab(list, other)).toHaveAttribute("aria-selected", "false");
    await expect(namedTab(list, other)).toHaveAttribute("tabindex", "-1");
  }
  const panel = frame.getByRole("tabpanel");
  await expect(panel).toHaveCount(1);
  await expect(panel).toBeVisible();
  const panelId = await panel.getAttribute("id");
  const triggerId = await active.getAttribute("id");
  expect(panelId).toBeTruthy();
  expect(triggerId).toBeTruthy();
  await expect(active).toHaveAttribute("aria-controls", panelId!);
  await expect(panel).toHaveAttribute("aria-labelledby", triggerId!);
  for (const item of names) {
    await expect(namedTab(list, item)).toHaveAttribute("aria-controls", panelId!);
  }
  await expect(panel.locator(tableSelector)).toHaveCount(1);
}

async function enterPanel(page: Page, frame: Locator, firstControl: Locator) {
  await page.keyboard.press("Tab");
  await expect(frame.getByRole("tabpanel")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(firstControl).toBeFocused();
}

for (const width of [1440, 390]) {
  test(`Campaign Targets tabs use native keys and retain grid state at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("./#/preview/data-grid/advanced/data-grid-advanced-3");
    const frame = page.getByRole("region", { name: "Campaign Targets", exact: true });
    const list = frame.getByRole("tablist", { name: "Campaign segments", exact: true });
    const table = frame.locator(tableSelector);
    await expect(table).toBeVisible();
    const original = await table.elementHandle();
    if (!original) throw new Error("Campaign Targets must render its real DataGrid table.");
    await expect(list.getByRole("tab")).toHaveCount(4);

    await namedTab(list, "All").click();
    await expectActiveTab(frame, list, campaignNames, "All");
    await expectRowIds(table, campaignIds("All"));
    for (const [key, name] of [
      ["ArrowRight", "Prospecting"],
      ["ArrowRight", "Retargeting"],
      ["ArrowLeft", "Prospecting"],
      ["End", "Retention"],
      ["Home", "All"],
    ]) {
      await page.keyboard.press(key);
      await expectActiveTab(frame, list, campaignNames, name);
      await expectRowIds(table, campaignIds(name));
      await expectSameTable(original, table);
    }

    const search = frame.getByRole("textbox", {
      name: "Search campaign, ID, market...",
      exact: true,
    });
    await enterPanel(page, frame, search);
    await search.fill("Glacier");
    const nameFilter = frame.getByRole("textbox", { name: "Filter campaign names", exact: true });
    await nameFilter.fill("Glacier");
    await expectRowIds(table, campaignIds("All", "Glacier"));
    await expect(table.getByRole("columnheader", { name: "Channel", exact: true })).toHaveCount(1);
    await frame.getByRole("button", { name: "Columns", exact: true }).click();
    const channel = page.getByRole("menuitemcheckbox", { name: "Channel", exact: true });
    await expect(channel).toHaveAttribute("aria-checked", "true");
    await channel.click();
    await expect(channel).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(table.getByRole("columnheader", { name: "Channel", exact: true })).toHaveCount(0);

    await namedTab(list, "All").click();
    for (const [key, name] of [
      ["End", "Retention"],
      ["Home", "All"],
    ]) {
      await page.keyboard.press(key);
      await expectActiveTab(frame, list, campaignNames, name);
      await expect(search).toHaveValue("Glacier");
      await expect(nameFilter).toHaveValue("Glacier");
      await expectRowIds(table, campaignIds(name, "Glacier"));
      await expect(table.getByRole("columnheader", { name: "Channel", exact: true })).toHaveCount(
        0,
      );
      await expectSameTable(original, table);
    }
    await expectNoOuterOverflow(page);
    await test.info().attach(`tabs-${width}px`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  test(`Reliability tabs use native keys and retain filters at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("./#/preview/data-grid/advanced/data-grid-advanced-4");
    const frame = page.getByRole("region", { name: "Reliability Index", exact: true });
    const list = frame.getByRole("tablist", { name: "Service health", exact: true });
    const table = frame.locator(tableSelector);
    await expect(table).toBeVisible();
    const original = await table.elementHandle();
    if (!original) throw new Error("Reliability must render its real DataGrid table.");
    await expect(list.getByRole("tab")).toHaveCount(4);
    const ids: Record<string, string[]> = {
      All: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      Exhausted: ["1", "2", "3", "4", "5"],
      "At Risk": ["6", "7", "8"],
      Healthy: ["9", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
    };
    await namedTab(list, "All").click();
    await expectActiveTab(frame, list, healthNames, "All");
    await expectRowIds(table, ids.All);
    for (const [key, name] of [
      ["ArrowRight", "Exhausted"],
      ["ArrowRight", "At Risk"],
      ["ArrowLeft", "Exhausted"],
      ["End", "Healthy"],
      ["Home", "All"],
    ]) {
      await page.keyboard.press(key);
      await expectActiveTab(frame, list, healthNames, name);
      await expectRowIds(table, ids[name]);
      await expectSameTable(original, table);
    }

    const search = frame.getByRole("textbox", { name: "Search SLOs...", exact: true });
    await enterPanel(page, frame, search);
    await search.fill("API");
    await expectRowIds(table, ["7", "8", "12"]);
    await frame.getByRole("combobox", { name: "Team", exact: true }).click();
    await page.getByRole("option", { name: "Payments", exact: true }).click();
    await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
    await expectRowIds(table, ["7"]);

    await namedTab(list, "All").click();
    for (const [key, name, expected] of [
      ["End", "Healthy", []],
      ["ArrowLeft", "At Risk", ["7"]],
      ["Home", "All", ["7"]],
    ] as const) {
      await page.keyboard.press(key);
      await expectActiveTab(frame, list, healthNames, name);
      await expect(search).toHaveValue("API");
      await expect(frame.getByRole("combobox", { name: "Team", exact: true })).toHaveText(
        "Payments",
      );
      await expectRowIds(table, [...expected]);
      await expectSameTable(original, table);
    }
    await expectNoOuterOverflow(page);
    await test.info().attach(`tabs-${width}px`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}
