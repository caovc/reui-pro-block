// Node 24 tests for the original local P&L accounting and forecast policies.
import assert from "node:assert/strict";
import test from "node:test";
import {
  createPnlLines,
  pnlClosedMonths,
  pnlMonths,
  pnlSections,
  pnlYear,
} from "../src/blocks/data/grid-advanced-retail-pnl-outlook-data.ts";
import {
  applyPnlWrites,
  computePnl,
  formatPnlCompact,
  formatPnlNumber,
  formatPnlPercent,
  parsePnlAmount,
  pnlVariance,
} from "../src/blocks/data/grid-advanced-retail-pnl-outlook-model.ts";

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} differs from ${expected}`);
const projected = (lines, compare = "budget") => computePnl(lines, compare, 5);
const at = (projection, id) =>
  id === "operating-profit" ? projection.profit : projection.flatRows.find((row) => row.id === id);

// Core algebra/cutoff/cascade assertions reflect the authorized contract. Formatting,
// signed input and threshold equality tests below document original-demo policies.
test("original fixtures have eighteen independent lines, five ordered groups and twelve FY2026 months", () => {
  const first = createPnlLines();
  const second = createPnlLines();
  assert.equal(pnlYear, 2026);
  assert.equal(pnlClosedMonths, 9);
  assert.equal(first.length, 18);
  assert.equal(new Set(first.map((line) => line.id)).size, 18);
  assert.deepEqual(
    pnlSections.map((section) => first.filter((line) => line.section === section.id).length),
    [3, 3, 4, 4, 4],
  );
  assert.deepEqual(
    pnlMonths.map((month) => month.id),
    Array.from({ length: 12 }, (_, index) => `month-${index}`),
  );
  assert.deepEqual(
    pnlMonths.map((month) => month.forecast),
    Array.from({ length: 12 }, (_, index) => index >= 9),
  );
  for (const [index, line] of first.entries()) {
    for (const key of ["budget", "prior", "actual", "forecast"]) {
      assert.equal(line[key].length, 12);
      assert.ok(line[key].every(Number.isFinite));
      assert.notEqual(line[key], second[index][key]);
    }
    assert.notEqual(line.notes, second[index].notes);
  }
  first[0].forecast[9] += 1;
  first[0].notes[0].text = "Changed in the first book only";
  assert.notEqual(first[0].forecast[9], second[0].forecast[9]);
  assert.notEqual(first[0].notes[0].text, second[0].notes[0].text);
});

test("full statement uses the actual/forecast cutoff and keeps body/footer identities separate", () => {
  const line = createPnlLines()[0];
  const raw = [
    { ...line, actual: Array(12).fill(2), forecast: Array(12).fill(7), budget: Array(12).fill(4) },
  ];
  const before = JSON.stringify(raw);
  const result = projected(raw);
  const revenue = at(result, "section-revenue");
  assert.deepEqual(revenue.values, [...Array(9).fill(2), ...Array(3).fill(7)]);
  assert.equal(revenue.outlook, 39);
  assert.equal(revenue.closed, 18);
  close(revenue.closedShare, (18 / 39) * 100);
  assert.equal(revenue.baselineTotal, 48);
  assert.equal(result.profit.outlook, 39);
  assert.equal(result.profit.marginPercent, 100);
  assert.deepEqual(
    result.rows.map((row) => row.id),
    [
      "section-revenue",
      "section-cogs",
      "gross-margin",
      "section-fulfilment",
      "section-marketing",
      "contribution",
      "section-operating",
    ],
  );
  assert.ok(!result.flatRows.some((row) => row.id === "operating-profit"));
  assert.equal(JSON.stringify(raw), before);
});

test("independent two-line book proves signed raw sums and margin denominators", () => {
  const seeds = createPnlLines();
  const book = [
    {
      ...seeds[0],
      actual: Array(12).fill(100),
      forecast: Array(12).fill(100),
      budget: Array(12).fill(80),
    },
    {
      ...seeds[3],
      actual: Array(12).fill(30),
      forecast: Array(12).fill(30),
      budget: Array(12).fill(25),
    },
  ];
  const result = projected(book);
  assert.equal(at(result, "section-revenue").outlook, 1200);
  assert.equal(at(result, "section-cogs").outlook, 360);
  assert.equal(at(result, "gross-margin").outlook, 840);
  assert.equal(at(result, "contribution").outlook, 840);
  assert.equal(result.profit.outlook, 840);
  assert.equal(result.profit.baselineTotal, 660);
  assert.equal(result.profit.marginPercent, 70);
  assert.equal(result.profit.closedShare, 75);
});

test("forecast revenue plus75 cascades through the full statement without changing closed periods or comparison", () => {
  const book = createPnlLines();
  const before = projected(book);
  const line = book[0];
  const originalOctober = line.forecast[9];
  const result = applyPnlWrites(book, [
    { rowId: line.id, columnId: "month-9", value: line.forecast[9] + 75 },
  ]);
  assert.equal(result.accepted, 1);
  assert.equal(result.rejected, 0);
  const after = projected(result.lines);
  for (const id of ["section-revenue", "gross-margin", "contribution", "operating-profit"]) {
    close(at(after, id).values[9] - at(before, id).values[9], 75);
    close(at(after, id).outlook - at(before, id).outlook, 75);
    assert.equal(at(after, id).closed, at(before, id).closed);
    assert.deepEqual(at(after, id).baseline, at(before, id).baseline);
  }
  assert.deepEqual(at(after, "section-cogs"), at(before, "section-cogs"));
  assert.equal(book[0].forecast[9], originalOctober);
  assert.notEqual(result.lines, book);
  assert.notEqual(result.lines[0].forecast, book[0].forecast);
});

test("expense increase flows down the right subtotal and is adverse rather than favourable", () => {
  const book = createPnlLines();
  const cost = book.find((line) => line.section === "cogs");
  const before = projected(book);
  const result = applyPnlWrites(book, [
    { rowId: cost.id, columnId: "month-10", value: cost.forecast[10] + 75 },
  ]);
  const after = projected(result.lines);
  close(at(after, "section-cogs").outlook - at(before, "section-cogs").outlook, 75);
  for (const id of ["gross-margin", "contribution", "operating-profit"]) {
    close(at(after, id).outlook - at(before, id).outlook, -75);
  }
  assert.equal(pnlVariance(140, 100, "lower", 5).status, "adverse");
  assert.equal(pnlVariance(60, 100, "lower", 5).status, "favourable");
  assert.equal(pnlVariance(140, 100, "higher", 5).status, "favourable");
});

test("budget/prior comparison changes only baseline projections; a visible subset cannot overwrite whole-book totals", () => {
  const book = createPnlLines();
  const before = JSON.stringify(book);
  const budget = projected(book, "budget");
  const prior = projected(book, "prior");
  assert.deepEqual(budget.profit.values, prior.profit.values);
  assert.notEqual(budget.profit.baselineTotal, prior.profit.baselineTotal);
  const displayed = budget.flatRows.filter((row) => row.name.toLowerCase().includes("online"));
  assert.equal(displayed.length, 1);
  assert.equal(projected(book).profit.outlook, budget.profit.outlook);
  assert.equal(JSON.stringify(book), before);
});

test("all-source typed writes reject closed, summary, missing, malformed and null/string/nonfinite values", () => {
  const book = createPnlLines();
  const snapshot = JSON.stringify(book);
  const id = book[0].id;
  const rejected = [
    { rowId: id, columnId: "month-0", value: 42 },
    { rowId: id, columnId: "month-8", value: 42 },
    { rowId: id, columnId: "month-09", value: 42 },
    { rowId: id, columnId: "month-12", value: 42 },
    { rowId: id, columnId: "outlook", value: 42 },
    { rowId: "section-revenue", columnId: "month-9", value: 42 },
    { rowId: "gross-margin", columnId: "month-9", value: 42 },
    { rowId: "operating-profit", columnId: "month-9", value: 42 },
    { rowId: "missing", columnId: "month-9", value: 42 },
    ...[null, undefined, "42", "", false, NaN, Infinity, -Infinity].map((value) => ({
      rowId: id,
      columnId: "month-9",
      value,
    })),
  ];
  const result = applyPnlWrites(book, rejected);
  assert.equal(result.accepted, 0);
  assert.equal(result.rejected, rejected.length);
  assert.equal(result.lines, book);
  assert.equal(JSON.stringify(book), snapshot);
});

test("mixed native batches retain accepted zero/signed writes, do not mutate input, and apply duplicate targets in order", () => {
  const book = createPnlLines();
  const snapshot = JSON.stringify(book);
  const id = book[0].id;
  const result = applyPnlWrites(book, [
    { rowId: id, columnId: "month-9", value: 0 },
    { rowId: id, columnId: "month-0", value: 100 },
    { rowId: id, columnId: "month-10", value: -25.5 },
    { rowId: id, columnId: "month-9", value: 25 },
    { rowId: id, columnId: "month-11", value: null },
  ]);
  assert.equal(result.accepted, 3);
  assert.equal(result.rejected, 2);
  assert.deepEqual(result.lines[0].forecast.slice(9), [25, -25.5, book[0].forecast[11]]);
  assert.equal(JSON.stringify(book), snapshot);
  const noOp = applyPnlWrites(book, [
    { rowId: id, columnId: "month-9", value: book[0].forecast[9] },
  ]);
  assert.equal(noOp.accepted, 1);
  assert.equal(noOp.lines, book);
});

test("zero denominators are explicit null values rather than NaN or Infinity", () => {
  const book = createPnlLines().map((line) => ({
    ...line,
    budget: Array(12).fill(0),
    actual: Array(12).fill(0),
    forecast: Array(12).fill(0),
    prior: Array(12).fill(0),
  }));
  const result = projected(book);
  for (const row of [...result.flatRows, result.profit]) {
    assert.equal(row.outlook, 0);
    assert.equal(row.closedShare, null);
    assert.equal(row.variance.percent, null);
    assert.equal(row.variance.status, "in-line");
  }
  assert.equal(result.profit.marginPercent, null);
});

test("original demo parse and threshold-equality policies are explicit and consistent", () => {
  for (const [text, value] of [
    ["0", 0],
    ["+75", 75],
    ["-25.5", -25.5],
    [" .5 ", 0.5],
  ])
    assert.equal(parsePnlAmount(text), value);
  for (const text of ["", " ", "abc", "1,000", "$50", "(50)", "1e3", "Infinity", "0x10"])
    assert.equal(parsePnlAmount(text), undefined);
  assert.equal(pnlVariance(115, 100, "higher", 5).status, "in-line");
  assert.equal(pnlVariance(2100, 2000, "higher", 5).status, "in-line");
  assert.deepEqual(pnlVariance(60, 0, "higher", 5), {
    delta: 60,
    percent: null,
    status: "favourable",
  });
  assert.equal(formatPnlNumber(-1234.4), "(1,234)");
  assert.equal(formatPnlCompact(1250), "1.3M");
  assert.equal(formatPnlCompact(-75), "(75K)");
  assert.equal(formatPnlPercent(null), "—");
  assert.equal(formatPnlPercent(5), "5.0%");
});
