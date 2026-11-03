import { expect as baseExpect, test, type Locator, type Page } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 5000 });
const route = "/#/preview/data-grid/advanced/data-grid-advanced-15";

test.describe.configure({ timeout: 30000, retries: 0 });

async function amount(cell: Locator) {
  const text = await cell.innerText();
  const match = text.match(/\(?-?\d[\d,]*(?:\.\d+)?\)?/);
  if (!match) throw new Error(`No displayed amount in ${text}`);
  const value = Number(match[0].replaceAll(",", "").replace(/[()]/g, ""));
  return match[0].startsWith("(") ? -value : value;
}

function compactAmount(text: string) {
  const match = text.match(/^\$?(\(?)([\d,]+(?:\.\d+)?)([MK])(\)?)$/);
  if (!match) throw new Error(`No compact dollar amount in ${text}`);
  const scale = match[3] === "M" ? 1000 : 1;
  const value = Number(match[2].replaceAll(",", "")) * scale;
  return {
    value: match[1] ? -value : value,
    // Displayed inputs are $ thousands, with at most one compact decimal.
    rounding: scale / 20,
  };
}

async function openLine(page: Page, opener: Locator) {
  const name = (await opener.getAttribute("aria-label"))?.replace(/^View /, "");
  if (!name) throw new Error("Expected the real line View accessible name");
  await opener.click();
  const sheet = page.getByRole("dialog", { name, exact: true });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(sheet.getByRole("tab", { name: "Overview", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  return sheet;
}

async function monthsTab(sheet: Locator) {
  const tabs = sheet.getByRole("tablist", { name: "Line details", exact: true });
  const overview = tabs.getByRole("tab", { name: "Overview", exact: true });
  const months = tabs.getByRole("tab", { name: "Months", exact: true });
  await overview.click();
  await expect(overview).toBeFocused();
  await overview.press("ArrowRight");
  await expect(months).toBeFocused();
  await expect(months).toHaveAttribute("aria-selected", "true");
  return sheet.getByRole("tabpanel", { name: "Months", exact: true });
}

async function notesTab(sheet: Locator) {
  await monthsTab(sheet);
  const months = sheet.getByRole("tab", { name: "Months", exact: true });
  await months.press("ArrowRight");
  const notes = sheet.getByRole("tab", { name: /^Notes\s+\d+$/ });
  await expect(notes).toBeFocused();
  await expect(notes).toHaveAttribute("aria-selected", "true");
  const panel = sheet.getByRole("tabpanel", { name: /^Notes\s+\d+$/ });
  await expect(panel).toBeVisible();
  return { tab: notes, panel };
}

async function noteCount(tab: Locator) {
  const text = await tab.innerText();
  const match = text.match(/^Notes\s+(\d+)$/);
  if (!match) throw new Error(`No Notes badge count in ${text}`);
  return Number(match[1]);
}

async function closeLine(page: Page, sheet: Locator, opener: Locator, escape = false) {
  if (escape) await page.keyboard.press("Escape");
  else await sheet.getByRole("button", { name: "Close", exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
  await expect(opener).toBeFocused();
}

function monthItem(panel: Locator, name: string) {
  return panel
    .locator('[data-slot="item"]')
    .filter({ has: panel.page().getByText(name, { exact: true }) });
}

async function assertOverview(sheet: Locator, annual: number) {
  const panel = sheet.getByRole("tabpanel", { name: "Overview", exact: true });
  const card = panel.getByText("Outlook", { exact: true }).locator("..");
  const summary = card.getByText(/^\$\(?[\d,.]+[MK]\)?$/);
  await expect(summary).toBeVisible();
  const text = (await summary.innerText()).trim();
  const compact = compactAmount(text);
  expect(Math.abs(compact.value - annual)).toBeLessThanOrEqual(compact.rounding);
  const chart = panel.getByRole("img", { name: /^Outlook / });
  await expect(chart).toHaveCount(1);
  const label = await chart.getAttribute("aria-label");
  expect(label?.split(";")[0]).toBe(`Outlook ${text.replace(/^\$/, "")}`);
  await expect(panel.getByText(`Outlook ${text}`, { exact: true })).toBeVisible();
  return text;
}

test("retail15-sheet-months-overview-sync-1440", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
  const frame = page.locator(".rpo-frame");
  await expect(frame.getByText("P&L Outlook", { exact: true })).toBeVisible();
  const table = frame.locator("table");
  await expect(table).toHaveCount(1);
  const line = table.locator('tbody tr[data-row-id="rpo-line-01"]');
  const opener = line.getByRole("button", { name: /^View / });
  const october = line.locator('td[data-col-id="month-9"]');
  const annual = line.locator('td[data-col-id="outlook"]');
  const originalOctober = await amount(october);
  const originalAnnual = await amount(annual);
  const january = await amount(line.locator('td[data-col-id="month-0"]'));

  const sheet = await openLine(page, opener);
  const originalSummary = await assertOverview(sheet, originalAnnual);
  const months = await monthsTab(sheet);
  await expect(months.locator('[data-slot="item"]')).toHaveCount(12);
  await expect(months.getByText("Closed", { exact: true })).toHaveCount(9);
  await expect(months.getByText("Forecast", { exact: true })).toHaveCount(3);
  await expect
    .poll(() => amount(monthItem(months, "October").locator(":scope > span").first()))
    .toBe(originalOctober);
  await closeLine(page, sheet, opener, true);

  await october.dblclick();
  const editor = page.getByRole("textbox", { name: "October", exact: true });
  await expect(editor).toBeVisible();
  await editor.fill(String(originalOctober + 1000));
  await editor.press("Enter");
  await expect(editor).toHaveCount(0);
  await expect.poll(() => amount(october)).toBe(originalOctober + 1000);
  await expect.poll(() => amount(annual)).toBe(originalAnnual + 1000);

  const reopened = await openLine(page, opener);
  const updatedSummary = await assertOverview(reopened, originalAnnual + 1000);
  expect(updatedSummary).not.toBe(originalSummary);
  const updatedMonths = await monthsTab(reopened);
  await expect
    .poll(() => amount(monthItem(updatedMonths, "October").locator(":scope > span").first()))
    .toBe(originalOctober + 1000);
  await expect
    .poll(() => amount(monthItem(updatedMonths, "January").locator(":scope > span").first()))
    .toBe(january);
  await page.screenshot({ path: info.outputPath("retail-sheet-months-1440.png") });
  await closeLine(page, reopened, opener);
});

test("retail15-sheet-notes-tabs-isolation-390", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const frame = page.locator(".rpo-frame");
  await expect(frame.getByText("P&L Outlook", { exact: true })).toBeVisible();
  const table = frame.locator("table");
  await expect(table).toHaveCount(1);
  const first = table.locator('tbody tr[data-row-id="rpo-line-01"]');
  const second = table.locator('tbody tr[data-row-id="rpo-line-02"]');
  const opener = first.getByRole("button", { name: /^View / });
  const secondOpener = second.getByRole("button", { name: /^View / });
  const secondBadge = second.locator(".rpo-note-count");
  const originalSecondCount = (await secondBadge.count()) ? await amount(secondBadge) : 0;
  const sheet = await openLine(page, opener);
  const notes = await notesTab(sheet);
  const originalCount = await noteCount(notes.tab);
  const input = notes.panel.getByRole("textbox", { name: "Add Note", exact: true });
  const submit = notes.panel.getByRole("button", { name: "Add Note", exact: true });
  await expect(input).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await input.fill("   \n  ");
  await expect(submit).toBeDisabled();
  const marker = `Retail15 note ${info.testId}`;
  const text = `${marker}\nNative line isolation`;
  await expect(notes.panel.locator('[data-slot="item"] p').filter({ hasText: marker })).toHaveCount(
    0,
  );
  await input.fill(`  ${text}  `);
  await expect(submit).toBeEnabled();
  await submit.click();
  const saved = notes.panel.locator('[data-slot="item"] p').filter({ hasText: marker });
  await expect(saved).toHaveCount(1);
  await expect.poll(() => saved.textContent()).toBe(text);
  await expect(saved).toHaveCSS("white-space", "pre-wrap");
  await expect.poll(() => noteCount(notes.tab)).toBe(originalCount + 1);
  await expect(input).toHaveValue("");
  await expect(submit).toBeDisabled();
  await closeLine(page, sheet, opener, true);

  const reopened = await openLine(page, opener);
  const persisted = await notesTab(reopened);
  const persistedNote = persisted.panel.locator('[data-slot="item"] p').filter({ hasText: marker });
  await expect(persistedNote).toHaveCount(1);
  await expect.poll(() => persistedNote.textContent()).toBe(text);
  await expect.poll(() => noteCount(persisted.tab)).toBe(originalCount + 1);
  await expect(persisted.panel.getByRole("textbox", { name: "Add Note", exact: true })).toHaveValue(
    "",
  );
  await expect(
    persisted.panel.getByRole("button", { name: "Add Note", exact: true }),
  ).toBeDisabled();
  await page.screenshot({ path: info.outputPath("retail-sheet-notes-390.png") });
  await closeLine(page, reopened, opener);

  const other = await openLine(page, secondOpener);
  const isolated = await notesTab(other);
  await expect(
    isolated.panel.locator('[data-slot="item"] p').filter({ hasText: marker }),
  ).toHaveCount(0);
  await expect.poll(() => noteCount(isolated.tab)).toBe(originalSecondCount);
  await closeLine(page, other, secondOpener);
});
