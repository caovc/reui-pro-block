import { expect, test, type Page } from "@playwright/test";
import { createFreightBook, freightTerminals } from "../src/blocks/data/grid-advanced-freight-data";
import { freightFigures } from "../src/blocks/data/grid-advanced-freight-math";

// Integration owner runs these after the explicit advanced-12 route is registered.
// This file has not been executed by the leaf owner: no browser server is authorized.
const route = "./#/preview/data-grid/advanced/data-grid-advanced-12";
const network = (page: Page) =>
  page.getByRole("region", { name: "Freight & Cargo Services", exact: true });
const originRow = (page: Page, city: string) =>
  network(page)
    .getByRole("row")
    .filter({
      has: page.getByRole("checkbox", { name: `Select ${city}`, exact: true }),
    });

async function actions(page: Page, name: string, item: string) {
  await page.getByRole("button", { name: `Actions for ${name}`, exact: true }).click();
  await page.getByRole("menuitem", { name: item, exact: true }).click();
}

test("Freight filters native lane records, conserves inbound loads and resets an empty result", async ({
  page,
}) => {
  await page.goto(route);
  await expect(network(page).locator("tbody tr[data-row-id]")).toHaveCount(12);
  await expect
    .poll(() =>
      network(page)
        .locator("tbody tr[data-row-id]")
        .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height)),
    )
    .toEqual([...Array(11).fill(41), 40]);
  const search = page.getByRole("textbox", { name: "Search terminals and shippers", exact: true });
  await search.fill("Valencia");
  const matching = createFreightBook().lanes.filter(
    (lane) => lane.origin === "VLC" || lane.destination === "VLC",
  );
  const origins = new Set(matching.map((lane) => lane.origin));
  await expect(network(page).locator("tbody tr[data-row-id]")).toHaveCount(origins.size);
  const outColumnIndex = await network(page)
    .getByRole("columnheader", { name: "Out", exact: true })
    .evaluate((header) => (header as HTMLTableCellElement).cellIndex);
  for (const origin of origins) {
    const terminal = freightTerminals.find((candidate) => candidate.id === origin)!;
    const loads = matching
      .filter((lane) => lane.origin === origin)
      .reduce((sum, lane) => sum + lane.loads, 0);
    await expect(originRow(page, terminal.city).locator("td").nth(outColumnIndex)).toHaveText(
      loads.toLocaleString("en-GB"),
    );
  }
  await expect(
    network(page).locator("tfoot tr").last().locator("td").nth(outColumnIndex),
  ).toHaveText(matching.reduce((sum, lane) => sum + lane.loads, 0).toLocaleString("en-GB"));
  await search.fill("does-not-exist-bricklane");
  await expect(
    network(page).getByText("No lanes match this search or filter.", { exact: true }),
  ).toBeVisible();
  await network(page).getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(network(page).locator("tbody tr[data-row-id]")).toHaveCount(12);
});

test("Freight origin selection remains native, and draft filters leave records visible", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("button", { name: "Add group", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(network(page).locator("tbody tr[data-row-id]")).toHaveCount(12);
  await page.getByRole("checkbox", { name: "Select Porto", exact: true }).click();
  await page.getByRole("checkbox", { name: "Select Valencia", exact: true }).click();
  await expect(network(page).getByRole("status")).toContainText("2 origins selected");
  await page.getByRole("checkbox", { name: "Select Porto", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Select Valencia", exact: true })).toBeChecked();
  await expect(network(page).getByRole("status")).toContainText("1 origin selected");
  await network(page).getByRole("button", { name: "Clear", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Select Valencia", exact: true }),
  ).not.toBeChecked();
});

test("Freight repricing writes real history and Undo restores it", async ({ page }) => {
  await page.goto(route);
  await actions(page, "Porto", "Reprice Lanes");
  const sheet = page.getByRole("dialog", { name: "Reprice Lanes", exact: true });
  const losing = createFreightBook().lanes.filter(
    (lane) => lane.origin === "OPO" && freightFigures(lane).profitCents < 0,
  );
  await expect(
    sheet.getByText(`${losing.length} lanes of 11 change`, { exact: true }),
  ).toBeVisible();
  await sheet.getByLabel("Reason", { exact: true }).fill("Freight browser audit");
  await sheet.getByRole("button", { name: "Apply Rates", exact: true }).click();
  await expect(sheet).toBeHidden();
  await actions(page, "Porto", "Rate History");
  await expect(
    page.getByRole("dialog").getByText("Freight browser audit", { exact: true }),
  ).toHaveCount(losing.length);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Actions for Porto", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Undo last change", exact: true }).click();
  await actions(page, "Porto", "Rate History");
  await expect(
    page.getByRole("dialog").getByText("Freight browser audit", { exact: true }),
  ).toHaveCount(0);
});

test("Freight closing a directed lane changes totals and Undo reopens it", async ({ page }) => {
  await page.goto(route);
  await page.getByRole("button", { name: /^Porto to Valencia,/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Close Lane", exact: true }).click();
  const confirmation = page.getByRole("alertdialog", {
    name: "Close Porto to Valencia?",
    exact: true,
  });
  await confirmation.getByRole("button", { name: "Keep Lane", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Edit Lane", exact: true }),
  ).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Close Lane", exact: true }).click();
  await confirmation.getByRole("button", { name: "Close Lane", exact: true }).click();
  await expect(
    network(page)
      .getByText(/97 lanes/, { exact: false })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Porto to Valencia, no lane/ })).toBeVisible();
  await page.getByRole("button", { name: "Undo last change", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Porto to Valencia, (?!no lane)/ })).toBeVisible();
});

test("Freight phone retains native pinned columns while the matrix scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const origin = originRow(page, "Porto").locator('td[data-pinned="start"][data-last-col="start"]');
  await expect
    .poll(() => originRow(page, "Porto").evaluate((row) => row.getBoundingClientRect().height))
    .toBe(41);
  const before = await origin.boundingBox();
  const viewport = network(page)
    .locator('[data-slot="scroll-area-viewport"]')
    .filter({ has: page.locator("table") })
    .first();
  await viewport.hover();
  await page.mouse.wheel(600, 0);
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  const after = await origin.boundingBox();
  expect(after!.x).toBeCloseTo(before!.x, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("Freight multiple margin bands filter native lanes with keyboard support and mobile replacement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
  const lanes = createFreightBook().lanes.filter((lane) => lane.active);
  // Per-kilometre prices determine the sign and ratio; loads and distance cancel.
  const losing = lanes.filter((lane) => lane.rateCents < lane.costCents);
  const deep = losing.filter(
    (lane) => (lane.rateCents - lane.costCents) * 100 < -8 * lane.rateCents,
  );
  const thin = lanes.filter(
    (lane) =>
      lane.rateCents >= lane.costCents &&
      (lane.rateCents - lane.costCents) * 100 < 6 * lane.rateCents,
  );
  const outColumnIndex = await network(page)
    .getByRole("columnheader", { name: "Out", exact: true })
    .evaluate((header) => (header as HTMLTableCellElement).cellIndex);
  const expectNativeLoads = async (expected: typeof lanes) => {
    const origins = new Set(expected.map((lane) => lane.origin));
    await expect(network(page).locator("tbody tr[data-row-id]")).toHaveCount(origins.size);
    for (const origin of origins) {
      const terminal = freightTerminals.find((candidate) => candidate.id === origin)!;
      const loads = expected
        .filter((lane) => lane.origin === origin)
        .reduce((sum, lane) => sum + lane.loads, 0);
      await expect(originRow(page, terminal.city).locator("td").nth(outColumnIndex)).toHaveText(
        loads.toLocaleString("en-GB"),
      );
    }
    await expect(
      network(page).locator("tfoot tr").last().locator("td").nth(outColumnIndex),
    ).toHaveText(expected.reduce((sum, lane) => sum + lane.loads, 0).toLocaleString("en-GB"));
  };
  const group = network(page).getByRole("toolbar", { name: "Margin bands", exact: true });
  const deepToggle = group.getByRole("button", { name: "Deep Loss", exact: true });
  const lossToggle = group.getByRole("button", { name: "Loss", exact: true });
  const thinToggle = group.getByRole("button", { name: "Thin", exact: true });
  expect(deep.length).toBeGreaterThan(0);
  expect(thin.length).toBeGreaterThan(0);

  await expectNativeLoads(lanes);
  await deepToggle.click();
  await expect(deepToggle).toHaveAttribute("aria-pressed", "true");
  await expectNativeLoads(deep);
  await deepToggle.focus();
  await deepToggle.press("ArrowRight");
  await expect(lossToggle).toBeFocused();
  await lossToggle.press("ArrowRight");
  await expect(thinToggle).toBeFocused();
  await thinToggle.press("Space");
  await expect(deepToggle).toHaveAttribute("aria-pressed", "true");
  await expect(thinToggle).toHaveAttribute("aria-pressed", "true");
  await expect(group.locator('[aria-pressed="true"]')).toHaveCount(2);
  await expectNativeLoads([...deep, ...thin]);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileBand = network(page).getByRole("combobox", { name: "Margin bands", exact: true });
  await expect(mobileBand).toHaveText("2 Bands");
  await mobileBand.click();
  await page.getByRole("option", { name: "Thin", exact: true }).click();
  await expect(mobileBand).toHaveText("Thin");
  await expectNativeLoads(thin);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(deepToggle).toHaveAttribute("aria-pressed", "false");
  await expect(lossToggle).toHaveAttribute("aria-pressed", "false");
  await expect(thinToggle).toHaveAttribute("aria-pressed", "true");
  await thinToggle.focus();
  await thinToggle.press("Space");
  await expect(group.locator('[aria-pressed="true"]')).toHaveCount(0);
  await expectNativeLoads(lanes);
  await expect(
    network(page).locator('[data-slot="frame-panel-footer"]').getByText("Network", { exact: true }),
  ).toBeVisible();
});
