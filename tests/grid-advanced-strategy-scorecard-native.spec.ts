import { readFile } from "node:fs/promises";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import {
  DEFAULT_MONTH_INDEX,
  MARKETS,
  MONTHS,
  createInitialScorecard,
  type Kpi,
} from "../src/blocks/data/grid-advanced-strategy-scorecard-data";

// Native Strategy Scorecard regressions exercise the real ReUI grid and consumer UI.
// No timeout/retry overrides, font fixtures, animation overrides or skipped cases.
// One route adapter: use a complete immutable URL via env, or the configured baseURL.
const strategyUrl = () =>
  process.env.BRICKLANE_STRATEGY_URL ?? "./#/preview/data-grid/advanced/data-grid-advanced-14";
const seed = createInitialScorecard();
const first = seed.kpis.find((kpi) => kpi.unit === "currency-million")!;
const objective = seed.objectives.find((entry) => entry.id === first.objectiveId)!;
const root = (page: Page) => page.locator(".ss14-root");
const row = (page: Page, id: string) => root(page).locator(`tbody tr[data-row-id="${id}"]`);
const cell = (page: Page, id: string, column: string) =>
  row(page, id).locator(`td[data-col-id="${column}"]`);

// Independent raw-data oracle: do not call the product's score/format/write model.
function weightedActual(kpi: Kpi, monthIndex = DEFAULT_MONTH_INDEX): number | null {
  const entries = MARKETS.map((market) => ({
    actual: kpi.actuals[market.code][monthIndex],
    weight: market.salesWeight,
  }));
  return entries.some((entry) => entry.actual === null)
    ? null
    : entries.reduce((sum, entry) => sum + (entry.actual! * entry.weight) / 100, 0);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let line: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"' && text[index + 1] === '"' && quoted) {
      value += '"';
      index++;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      line.push(value);
      value = "";
    } else if (char === "\n" && !quoted) {
      line.push(value.replace(/\r$/, ""));
      rows.push(line);
      line = [];
      value = "";
    } else value += char;
  }
  if (value || line.length) {
    line.push(value.replace(/\r$/, ""));
    rows.push(line);
  }
  return rows;
}

async function downloadCsv(page: Page, info: TestInfo, name: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(
    `bricklane-strategy-scorecard-${MONTHS[DEFAULT_MONTH_INDEX].id}.csv`,
  );
  expect(await download.failure()).toBeNull();
  const path = info.outputPath(name);
  await download.saveAs(path);
  return parseCsv(await readFile(path, "utf8"));
}

async function openDetails(page: Page, kpi = first) {
  await row(page, kpi.id).getByRole("button", { name: kpi.title, exact: true }).click();
  const sheet = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: kpi.title, exact: true }) });
  await expect(sheet).toBeVisible();
  return sheet;
}

async function openValueEditor(page: Page, kpi = first) {
  await cell(page, kpi.id, "value").click();
  const editor = root(page).locator('[data-slot="data-grid-cell-editor"]');
  await expect(editor).toBeVisible();
  return editor;
}

async function openScorecard(page: Page) {
  await page.goto(strategyUrl());
  await expect(root(page)).toBeVisible();
  await expect(root(page).getByRole("button", { name: "Add KPI", exact: true })).toBeVisible();
}

test.describe("Strategy Scorecard native desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => {
    await openScorecard(page);
  });

  test("default thirty KPIs, nine objectives and normal28px rail cells", async ({ page }) => {
    expect(seed.kpis).toHaveLength(30);
    expect(seed.objectives).toHaveLength(9);
    await expect(root(page).locator('.ss14-tree-label[data-kind="kpi"]')).toHaveCount(30);
    await expect(root(page).locator('.ss14-tree-label[data-kind="objective"]')).toHaveCount(9);
    await expect(root(page).locator('.ss14-tree-label[data-kind="perspective"]')).toHaveCount(0);
    const rail = root(page)
      .locator("td.ss14-rail-cell")
      .filter({ has: page.locator(".ss14-perspective-overlay") })
      .first();
    expect(await rail.evaluate((element) => element.getBoundingClientRect().height)).toBe(28);
    expect(await root(page).locator("tbody td[rowspan]").count()).toBe(0);
    expect(await rail.evaluate((element) => getComputedStyle(element).position)).toBe("sticky");
    const firstPerspective = seed.perspectives[0];
    const objectiveIds = seed.objectives
      .filter((entry) => entry.perspectiveId === firstPerspective.id)
      .map((entry) => entry.id);
    const count =
      objectiveIds.length +
      seed.kpis.filter((kpi) => objectiveIds.includes(kpi.objectiveId)).length;
    expect(
      await rail
        .locator(".ss14-perspective-overlay")
        .evaluate((element) => element.getBoundingClientRect().height),
    ).toBe(count * 28);
    await expect(
      root(page).locator('.ss14-change-chart[data-slot="chart"] .recharts-bar').first(),
    ).toBeAttached();
  });

  test("objective search keeps every child and preserves global summary", async ({ page }) => {
    const summary = await page.getByLabel("Company score summary").innerText();
    const children = seed.kpis.filter((kpi) => kpi.objectiveId === objective.id);
    await page.getByRole("textbox", { name: "Search KPIs" }).fill(objective.title);
    await expect(root(page).locator('.ss14-tree-label[data-kind="objective"]')).toHaveCount(1);
    await expect(root(page).locator('.ss14-tree-label[data-kind="kpi"]')).toHaveCount(
      children.length,
    );
    for (const kpi of children) await expect(row(page, kpi.id)).toBeAttached();
    await expect.poll(() => page.getByLabel("Company score summary").innerText()).toBe(summary);
    await expect(root(page).locator(".ss14-perspective-overlay")).toHaveCount(1);
    expect(
      await root(page)
        .locator(".ss14-perspective-overlay")
        .evaluate((element) => element.getBoundingClientRect().height),
    ).toBe((children.length + 1) * 28);
  });

  test("free advanced Status rule applies through native pickers and clears to all KPIs", async ({
    page,
  }) => {
    // Static path verified in the actual free FiltersAdvancedPanel/FieldPicker/
    // FilterOperatorPopover/OptionEditor: single-select commits on option choice.
    // There is no synthetic Apply button and no query/state injection.
    const summary = await page.getByLabel("Company score summary").innerText();
    const expectedIds = seed.kpis
      .filter((kpi) => {
        const actual = weightedActual(kpi);
        if (actual === null || kpi.target === kpi.baseline) return false;
        // Independent seed oracle: the signed ratio works for both directions.
        return (
          ((actual - kpi.baseline) / (kpi.target - kpi.baseline)) * 100 < seed.thresholds.watch
        );
      })
      .map((kpi) => kpi.id);
    expect(expectedIds.length).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    const advanced = page.getByRole("dialog", { name: "Advanced filter", exact: true });
    await expect(advanced).toBeVisible();
    await expect(advanced.getByText("No filters yet", { exact: true })).toBeVisible();
    await advanced.getByRole("button", { name: "Add filter", exact: true }).click();
    await page.getByRole("option", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: "is", exact: true }).click();
    const offTrack = page.getByRole("option", { name: "Off Track", exact: true });
    await expect(offTrack).toBeVisible();
    await offTrack.click();
    await expect(offTrack).toHaveCount(0);
    await expect(advanced.getByRole("button", { name: "Off Track", exact: true })).toBeVisible();
    // One Escape closes the known remaining advanced panel, then assert closure.
    await page.keyboard.press("Escape");
    await expect(advanced).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Filter", exact: true })).toBeFocused();
    await expect(root(page).locator('.ss14-tree-label[data-kind="kpi"]')).toHaveCount(
      expectedIds.length,
    );
    for (const kpi of seed.kpis)
      await expect(row(page, kpi.id)).toHaveCount(expectedIds.includes(kpi.id) ? 1 : 0);
    await expect.poll(() => page.getByLabel("Company score summary").innerText()).toBe(summary);
    // Clear through the actual free panel action, not a reset or direct setter.
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await expect(advanced).toBeVisible();
    await advanced.getByRole("button", { name: "Clear all", exact: true }).click();
    await expect(advanced.getByText("No filters yet", { exact: true })).toBeVisible();
    await expect(root(page).locator('.ss14-tree-label[data-kind="kpi"]')).toHaveCount(30);
    await expect.poll(() => page.getByLabel("Company score summary").innerText()).toBe(summary);
    await page.keyboard.press("Escape");
    await expect(advanced).toHaveCount(0);
  });

  test("native collapse hides leaves while preserving objective rows and summary", async ({
    page,
  }) => {
    const summary = await page.getByLabel("Company score summary").innerText();
    await page.getByRole("button", { name: "View", exact: true }).click();
    await page.getByRole("menuitem", { name: "Collapse all", exact: true }).click();
    await expect(root(page).locator('.ss14-tree-label[data-kind="kpi"]')).toHaveCount(0);
    await expect(root(page).locator('.ss14-tree-label[data-kind="objective"]')).toHaveCount(9);
    await expect.poll(() => page.getByLabel("Company score summary").innerText()).toBe(summary);
    await page.getByRole("button", { name: "View", exact: true }).click();
    await page.getByRole("menuitem", { name: "Expand all", exact: true }).click();
    await expect(root(page).locator('.ss14-tree-label[data-kind="kpi"]')).toHaveCount(30);
  });

  test("native scaled Value editor Enter commits raw millions and CtrlZ restores", async ({
    page,
  }) => {
    const original = await cell(page, first.id, "value").innerText();
    const editor = await openValueEditor(page);
    expect(Number(await editor.inputValue())).toBeCloseTo(weightedActual(first)!, 10);
    expect(await editor.inputValue()).not.toMatch(/[$M]/);
    await editor.fill("2.25");
    await editor.press("Enter");
    await expect(editor).toHaveCount(0);
    await expect(cell(page, first.id, "value")).toHaveText("$2.25M");
    await page.keyboard.press("Control+z");
    await expect(cell(page, first.id, "value")).toHaveText(original);
  });

  test("real invalid clipboard paste is rejected without a data write", async ({
    page,
    context,
  }, info) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const before = await cell(page, first.id, "value").innerText();
    const editor = await openValueEditor(page);
    await editor.press("Escape");
    await page.evaluate(() => navigator.clipboard.writeText("invalid-observation"));
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("invalid-observation");
    await page.keyboard.press("ControlOrMeta+v");
    await expect(page.getByText(/cells rejected\. Enter a number/i)).toBeVisible();
    await expect(cell(page, first.id, "value")).toHaveText(before);
    const csv = await downloadCsv(page, info, "after-rejected-paste.csv");
    const fields = csv[0];
    const record = csv.find((entry) => entry[fields.indexOf("KPI")] === first.title)!;
    expect(Number(record[fields.indexOf("Value")])).toBeCloseTo(weightedActual(first)!, 10);
  });

  test("Scoring threshold changes domain status and its cell color", async ({ page }) => {
    const candidate = seed.kpis.find((kpi) => {
      const actual = weightedActual(kpi);
      if (actual === null || kpi.target === kpi.baseline) return false;
      const score = ((actual - kpi.baseline) / (kpi.target - kpi.baseline)) * 100;
      return score > 45 && score < 70;
    })!;
    expect(candidate).toBeDefined();
    const progress = cell(page, candidate.id, "progress").locator(".ss14-progress-cell");
    await expect(progress).toHaveAttribute("data-status", "watch");
    const before = await progress.evaluate((element) => getComputedStyle(element).color);
    await page.getByRole("button", { name: "Scoring", exact: true }).click();
    const slider = page.getByRole("slider", { name: "On Track threshold", exact: true });
    await expect(slider).toBeFocused();
    await slider.press("Home");
    await expect(slider).toHaveAttribute("aria-valuenow", "45");
    await slider.press("Escape");
    await expect(progress).toHaveAttribute("data-status", "track");
    await expect
      .poll(() => progress.evaluate((element) => getComputedStyle(element).color))
      .not.toBe(before);
  });

  test("Details native Markets sorted by progress and Months show raw history", async ({
    page,
  }) => {
    const sheet = await openDetails(page);
    await sheet.getByRole("tab", { name: "Markets", exact: true }).click();
    await expect(sheet.getByRole("tabpanel")).toContainText("US 30%");
    await expect(sheet.locator("tbody tr")).toHaveCount(MARKETS.length);
    const statuses = await sheet.locator("tbody tr").evaluateAll((rows) =>
      rows.map((element) => ({
        code: element.querySelector("td")?.textContent?.slice(0, 2),
        progress: element.querySelector("td:last-child > span")?.textContent,
      })),
    );
    const scored = statuses
      .filter((entry) => entry.progress !== "–")
      .map((entry) => Number(entry.progress?.replace("%", "")));
    expect(scored).toEqual([...scored].sort((left, right) => left - right));
    await sheet.getByRole("tab", { name: "Months", exact: true }).click();
    await expect(sheet.locator("tbody tr")).toHaveCount(MONTHS.length);
    await expect(sheet.locator("tbody tr").last()).toContainText(MONTHS[DEFAULT_MONTH_INDEX].label);
    await expect(sheet.locator("tbody tr").last()).toContainText(
      `$${weightedActual(first)!.toFixed(2)}M`,
    );
    await sheet.getByRole("button", { name: "Close", exact: true }).click();
    await expect(sheet).toHaveCount(0);
  });

  test("editor Cancel leaves seed untouched; valid new KPI starts unscored and can be removed", async ({
    page,
  }) => {
    const sheet = await openDetails(page);
    await sheet.getByRole("button", { name: "Edit KPI", exact: true }).click();
    const edit = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("heading", { name: "Edit KPI", exact: true }) });
    await edit.getByRole("textbox", { name: "Name", exact: true }).fill("Cancelled draft title");
    await edit.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(
      row(page, first.id).getByRole("button", { name: first.title, exact: true }),
    ).toBeAttached();
    await expect(root(page).getByText("Cancelled draft title")).toHaveCount(0);
    await page.getByRole("button", { name: "Add KPI", exact: true }).click();
    const create = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("heading", { name: "Add KPI", exact: true }) });
    await create.getByRole("button", { name: "Save KPI", exact: true }).click();
    await expect(create.getByRole("alert")).toHaveText("Enter a KPI name.");
    await expect(root(page).locator('.ss14-tree-label[data-kind="kpi"]')).toHaveCount(30);
    await create
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("Bricklane validation coverage");
    await create.getByRole("textbox", { name: "Weight (%)", exact: true }).fill("15");
    await create.getByRole("textbox", { name: "Baseline", exact: true }).fill("0");
    await create.getByRole("textbox", { name: "Target", exact: true }).fill("10");
    await create.getByRole("button", { name: "Save KPI", exact: true }).click();
    await expect(create).toHaveCount(0);
    const created = root(page)
      .locator("tbody tr")
      .filter({
        has: page.getByRole("button", { name: "Bricklane validation coverage", exact: true }),
      });
    await expect(created).toBeAttached();
    await expect(root(page).locator('.ss14-tree-label[data-kind="kpi"]')).toHaveCount(31);
    await expect(created.locator('td[data-col-id="progress"] .ss14-progress-cell')).toHaveAttribute(
      "data-status",
      "unscored",
    );
    await created
      .getByRole("button", { name: "Bricklane validation coverage", exact: true })
      .click();
    const details = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: "Bricklane validation coverage", exact: true }),
    });
    await details.getByRole("tab", { name: "Months", exact: true }).click();
    await expect(details.locator("tbody tr")).toHaveCount(9);
    for (const month of await details.locator("tbody tr").all())
      await expect(month.locator("td").nth(1)).toHaveText("—");
    await details.getByRole("button", { name: "Remove KPI", exact: true }).click();
    await expect(created).toHaveCount(0);
    await expect(root(page).locator('.ss14-tree-label[data-kind="kpi"]')).toHaveCount(30);
  });

  test("CSV is a real download containing original raw units rather than formatted display", async ({
    page,
  }, info) => {
    const csv = await downloadCsv(page, info, "initial-scorecard.csv");
    const [header, ...records] = csv;
    expect(records).toHaveLength(30);
    const exported = records.find((entry) => entry[header.indexOf("KPI")] === first.title)!;
    expect(Number(exported[header.indexOf("Value")])).toBeCloseTo(weightedActual(first)!, 10);
    expect(exported[header.indexOf("Value")]).not.toMatch(/[$M]/);
    expect(Number(exported[header.indexOf("Baseline")])).toBe(first.baseline);
    expect(Number(exported[header.indexOf("Target")])).toBe(first.target);
  });
});

test.describe("Strategy Scorecard native phone", () => {
  test.use({ viewport: { width: 390, height: 900 } });
  test("native depth2, column hiding and horizontal wheel preserve pinned titles", async ({
    page,
  }) => {
    await openScorecard(page);
    await expect(root(page)).toHaveAttribute("data-compact", "true");
    await expect(root(page).locator('.ss14-tree-label[data-kind="perspective"]')).toHaveCount(4);
    await expect(row(page, first.id)).toHaveAttribute("data-depth", "2");
    await expect(root(page).locator('td[data-col-id="perspective"]')).toHaveCount(0);
    const viewport = root(page).locator('.ss14-scroll-area [data-slot="scroll-area-viewport"]');
    expect(await viewport.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
      true,
    );
    const title = cell(page, first.id, "title");
    const before = await title.boundingBox();
    await viewport.hover();
    await page.mouse.wheel(600, 0);
    await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    expect((await title.boundingBox())?.x).toBe(before?.x);
    await page.getByRole("button", { name: "View", exact: true }).click();
    const owner = page.getByRole("menuitemcheckbox", { name: "Owner", exact: true });
    await expect(owner).toHaveAttribute("aria-checked", "true");
    await owner.click();
    await expect(owner).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Escape");
    await expect(root(page).locator('td[data-col-id="owner"]')).toHaveCount(0);
    await expect(row(page, first.id)).toHaveAttribute("data-depth", "2");
  });
});

// Native editor lifecycle regressions use actual UI and the chart's normal animation.
// The original eleven case bodies and titles remain unchanged, including early Value editing.
async function downloadRegressionMonthCsv(
  page: Page,
  info: TestInfo,
  monthIndex: number,
  artifactName: string,
) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(
    `bricklane-strategy-scorecard-${MONTHS[monthIndex].id}.csv`,
  );
  expect(await download.failure()).toBeNull();
  const path = info.outputPath(artifactName);
  await download.saveAs(path);
  const [header, ...records] = parseCsv(await readFile(path, "utf8"));
  expect(records).toHaveLength(seed.kpis.length);
  const record = records.find((entry) => entry[header.indexOf("KPI")] === first.title);
  expect(record).toBeDefined();
  expect(record![header.indexOf("Value")]).not.toMatch(/[$M]/);
  return Number(record![header.indexOf("Value")]);
}

test.describe("Strategy Scorecard editor lifecycle", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => {
    await openScorecard(page);
  });

  test("month switch then immediate Value edit commits current raw units and Undo restores", async ({
    page,
  }, info) => {
    const monthIndex = DEFAULT_MONTH_INDEX - 1;
    const expectedRaw = weightedActual(first, monthIndex)!;
    expect(monthIndex).toBeGreaterThanOrEqual(0);
    expect(expectedRaw).not.toBeNull();
    expect(expectedRaw).not.toBe(weightedActual(first));
    expect(expectedRaw).not.toBe(2.25);

    await page.getByRole("combobox", { name: "Month", exact: true }).click();
    await page.getByRole("option", { name: MONTHS[monthIndex].label, exact: true }).click();
    // No chart polling, animation delay, second opening or retry after the real month change.
    const editor = await openValueEditor(page);
    expect(Number(await editor.inputValue())).toBeCloseTo(expectedRaw, 10);
    expect(await editor.inputValue()).not.toMatch(/[$M]/);
    await editor.fill("2.25");
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue("2.25");
    await editor.press("Enter");
    await expect(editor).toHaveCount(0);
    await expect(cell(page, first.id, "value")).toHaveText("$2.25M");
    expect(await downloadRegressionMonthCsv(page, info, monthIndex, "month-after-commit.csv")).toBe(
      2.25,
    );

    await page.keyboard.press("Control+z");
    await expect(cell(page, first.id, "value")).toHaveText(`$${expectedRaw.toFixed(2)}M`);
    expect(
      await downloadRegressionMonthCsv(page, info, monthIndex, "month-after-undo.csv"),
    ).toBeCloseTo(expectedRaw, 10);
  });

  test("real responsive tree and column reflow cancels a dirty Value without writing", async ({
    page,
  }, info) => {
    const viewport = root(page).locator('.ss14-scroll-area [data-slot="scroll-area-viewport"]');
    const beforeCell = await cell(page, first.id, "value").boundingBox();
    const beforeViewport = await viewport.boundingBox();
    const beforeScroll = await viewport.evaluate((element) => ({
      left: element.scrollLeft,
      top: element.scrollTop,
    }));
    expect(beforeCell).not.toBeNull();
    expect(beforeViewport).not.toBeNull();
    const editor = await openValueEditor(page);
    expect(Number(await editor.inputValue())).toBeCloseTo(weightedActual(first)!, 10);
    await editor.fill("9.25");
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue("9.25");

    // A real browser resize invokes the consumer's existing matchMedia branch.
    // No toolbar click is used: clicking one would blur/commit before its action.
    await page.setViewportSize({ width: 390, height: 900 });
    await expect(root(page)).toHaveAttribute("data-compact", "true");
    await expect(row(page, first.id)).toHaveAttribute("data-depth", "2");
    await expect(root(page).locator('td[data-col-id="perspective"]')).toHaveCount(0);
    await expect(editor).toHaveCount(0);
    const afterCell = await cell(page, first.id, "value").boundingBox();
    const afterViewport = await viewport.boundingBox();
    const afterScroll = await viewport.evaluate((element) => ({
      left: element.scrollLeft,
      top: element.scrollTop,
    }));
    expect(afterCell).not.toBeNull();
    expect(afterViewport).not.toBeNull();
    expect({
      left: afterCell!.x - afterViewport!.x + afterScroll.left,
      top: afterCell!.y - afterViewport!.y + afterScroll.top,
      width: afterCell!.width,
      height: afterCell!.height,
    }).not.toEqual({
      left: beforeCell!.x - beforeViewport!.x + beforeScroll.left,
      top: beforeCell!.y - beforeViewport!.y + beforeScroll.top,
      width: beforeCell!.width,
      height: beforeCell!.height,
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(root(page)).not.toHaveAttribute("data-compact", "true");
    await expect(editor).toHaveCount(0);
    await expect(cell(page, first.id, "value")).toHaveText(
      `$${weightedActual(first)!.toFixed(2)}M`,
    );
    await page.getByRole("button", { name: "View", exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "Undo", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    expect(
      await downloadRegressionMonthCsv(page, info, DEFAULT_MONTH_INDEX, "reflow-without-write.csv"),
    ).toBeCloseTo(weightedActual(first)!, 10);
  });
});
