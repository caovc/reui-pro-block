import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryQuarterHistory,
  readCategoryPeriod,
  readCategoryStock,
} from "../src/blocks/data/grid-advanced-category-margin-metrics.ts";

function record(month, grossCents = 100, costCents = 30, overrides = {}) {
  return {
    month,
    grossCents,
    discountCents: 0,
    returnedCents: 0,
    costCents,
    units: 100,
    returnedUnits: 0,
    closingUnits: 20,
    planCents: grossCents,
    weeklyNetCents: [grossCents, 0, 0, 0],
    ...overrides,
  };
}
function line(id, targetMarginBps, months) {
  return {
    id,
    name: id,
    department: "Home",
    brandId: "northfork",
    targetMarginBps,
    call: "Maintain",
    months,
    promotions: [],
  };
}
const monthsOf = (year) =>
  Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);

test("planned profit sums each different target in whole cents before weighting the rate", () => {
  const lines = [
    line("small", 3333, [record("2026-10", 10_001, 6000, { planCents: 101 })]),
    line("large", 6667, [record("2026-10", 90_003, 85_503, { planCents: 103 })]),
  ];
  const original = structuredClone(lines);
  const reading = readCategoryPeriod(lines, ["2026-10", "2026-10"]);
  assert.deepEqual(reading.months, ["2026-10"]);
  assert.equal(reading.planCents, 204);
  // 101 at 33.33% is 34 cents; 103 at 66.67% is 69 cents.
  // Rounding the combined fractional result would incorrectly give 102.
  assert.equal(reading.plannedProfitCents, 103);
  assert.equal(reading.plannedMarginBps, 5049);
  assert.notEqual(reading.plannedMarginBps, 5000);
  assert.equal(reading.netCents, 100_004);
  assert.equal(reading.profitCents, 8501);
  assert.equal(reading.profitVarianceCents, 8398);
  assert.equal(reading.marginBps, 850);
  assert.equal(reading.rateVarianceBps, -4199);
  assert.equal(reading.complete, true);
  assert.deepEqual(lines, original);
});

test("twelve-month YoY requires complete paired history for every participating line", () => {
  const current = monthsOf(2026);
  const history = [
    ...monthsOf(2025).map((month) => record(month, 1000, 600)),
    ...current.map((month) => record(month, 2000, 1000)),
  ];
  const full = line("established", 4500, history);
  const reading = readCategoryPeriod([full], current.toReversed());
  assert.equal(reading.complete, true);
  assert.equal(reading.priorComplete, true);
  assert.equal(reading.startMonth, "2026-01");
  assert.equal(reading.endMonth, "2026-12");
  assert.equal(reading.netCents, 24_000);
  assert.equal(reading.priorNetCents, 12_000);
  assert.equal(reading.netYoYBps, 10_000);
  assert.equal(reading.yearMoveBps, 1000);

  const partialPrior = line(
    "partial",
    4500,
    history.filter((item) => item.month !== "2025-06"),
  );
  const partial = readCategoryPeriod([partialPrior], current);
  assert.equal(partial.complete, true);
  assert.equal(partial.priorComplete, false);
  assert.equal(partial.priorNetCents, 11_000);
  assert.equal(partial.netYoYBps, null);
  assert.equal(partial.yearMoveBps, null);

  const newLine = line(
    "new",
    4500,
    history.filter((item) => item.month.startsWith("2026-")),
  );
  const missingPrior = readCategoryPeriod([newLine], current);
  assert.equal(missingPrior.priorNetCents, null);
  assert.equal(missingPrior.priorComplete, false);
  assert.equal(missingPrior.netYoYBps, null);
  assert.equal(missingPrior.yearMoveBps, null);
  const mixed = readCategoryPeriod([full, newLine], current);
  assert.equal(mixed.complete, true);
  assert.equal(mixed.priorComplete, false);
  assert.equal(mixed.netYoYBps, null);
  assert.equal(mixed.yearMoveBps, null);

  const partialCurrent = line(
    "missing-current",
    4500,
    history.filter((item) => item.month !== "2026-08"),
  );
  const incomplete = readCategoryPeriod([full, partialCurrent], current);
  assert.equal(incomplete.complete, false);
  assert.equal(incomplete.priorComplete, true);
  assert.equal(incomplete.netYoYBps, null);
  assert.equal(incomplete.yearMoveBps, null);
});

test("last eight real quarters honor the through month and retain an incomplete latest quarter", () => {
  const history = [2024, 2025, 2026].flatMap((year) =>
    monthsOf(year).map((month) => record(month)),
  );
  history.find((month) => month.month === "2026-11").grossCents = 1_000_000;
  history.find((month) => month.month === "2026-12").grossCents = 1_000_000;
  const lines = [line("observed", 4500, history.toReversed())];
  const quarters = categoryQuarterHistory(lines, ["2026-09", "2026-10"]);
  assert.deepEqual(
    quarters.map((quarter) => quarter.quarter),
    ["2025 Q1", "2025 Q2", "2025 Q3", "2025 Q4", "2026 Q1", "2026 Q2", "2026 Q3", "2026 Q4"],
  );
  assert.deepEqual(quarters.at(-1), {
    quarter: "2026 Q4",
    months: 1,
    netCents: 100,
    profitCents: 70,
    marginBps: 7000,
    startMonth: "2026-10",
    endMonth: "2026-10",
    complete: false,
  });
  assert.equal(quarters.at(-2).months, 3);
  assert.equal(quarters.at(-2).complete, true);
  assert.equal(quarters.at(-2).netCents, 300);
  const earlier = categoryQuarterHistory(lines, ["2026-05"]);
  assert.equal(earlier.length, 8);
  assert.equal(earlier[0].quarter, "2024 Q3");
  assert.equal(earlier.at(-1).endMonth, "2026-05");
  assert.equal(earlier.at(-1).months, 2);
  assert.equal(earlier.at(-1).netCents, 200);
  assert.equal(earlier.at(-1).complete, false);

  const gap = line(
    "gap",
    4500,
    history.filter((month) => !["2025-04", "2025-05", "2025-06"].includes(month.month)),
  );
  assert.deepEqual(
    categoryQuarterHistory([gap], ["2026-10"]).map((quarter) => quarter.quarter),
    ["2024 Q4", "2025 Q1", "2025 Q3", "2025 Q4", "2026 Q1", "2026 Q2", "2026 Q3", "2026 Q4"],
  );
});

test("quarter coverage does not invent records for an empty scope or a partially observed line", () => {
  const full = line("full", 4500, [record("2026-07"), record("2026-08"), record("2026-09")]);
  const partial = line("partial", 4500, [record("2026-07"), record("2026-09")]);
  const [quarter] = categoryQuarterHistory([full, partial], ["2026-09"]);
  assert.equal(quarter.months, 3);
  assert.equal(quarter.netCents, 500);
  assert.equal(quarter.complete, false);
  assert.deepEqual(categoryQuarterHistory([], ["2026-10"]), []);
  assert.deepEqual(categoryQuarterHistory([full], []), []);
  assert.deepEqual(categoryQuarterHistory([full], ["2025-12"]), []);
  const empty = readCategoryPeriod([], ["2026-10"]);
  assert.equal(empty.observed, false);
  assert.equal(empty.complete, false);
  assert.equal(empty.priorComplete, false);
  assert.equal(empty.marginBps, null);
  assert.equal(empty.plannedMarginBps, null);
  assert.equal(empty.netYoYBps, null);
  assert.equal(empty.yearMoveBps, null);
});

test("stock rates use only the latest selected observation and weight sold units with closing stock", () => {
  const lines = [
    line("first", 4500, [
      record("2026-01", 100, 30, { units: 10_000, closingUnits: 0 }),
      record("2026-10", 100, 30, { units: 120, returnedUnits: 20, closingUnits: 20 }),
      record("2026-11", 100, 30, { units: 1_000_000, closingUnits: 0 }),
    ]),
    line("second", 4500, [
      record("2026-01", 100, 30, { units: 10_000, closingUnits: 0 }),
      record("2026-10", 100, 30, { units: 60, returnedUnits: 10, closingUnits: 130 }),
    ]),
  ];
  const original = structuredClone(lines);
  const latest = readCategoryStock(lines, ["2026-10", "2026-01", "2026-10"]);
  assert.equal(latest.month, "2026-10");
  assert.equal(latest.observed, true);
  assert.equal(latest.complete, true);
  assert.equal(latest.soldUnits, 150);
  assert.equal(latest.closingUnits, 150);
  assert.equal(latest.sellThroughBps, 5000);
  assert.equal(latest.coverWeeks, 4.345);
  assert.deepEqual(lines, original);
});

test("missing latest stock remains incomplete without borrowing history or inventing cover", () => {
  const first = line("first", 4500, [record("2026-10", 100, 30, { units: 100, closingUnits: 20 })]);
  const earlierOnly = line("earlier", 4500, [
    record("2026-09", 100, 30, { units: 1000, closingUnits: 0 }),
  ]);
  const partial = readCategoryStock([first, earlierOnly], ["2026-10"]);
  assert.equal(partial.complete, false);
  assert.equal(partial.observed, true);
  assert.equal(partial.soldUnits, 100);
  assert.equal(partial.sellThroughBps, 8333);
  assert.equal(partial.coverWeeks, 0.869);
  const absent = readCategoryStock([first, earlierOnly], ["2026-09", "2026-11"]);
  assert.equal(absent.observed, false);
  assert.equal(absent.complete, false);
  assert.equal(absent.sellThroughBps, null);
  assert.equal(absent.coverWeeks, null);
  assert.equal(readCategoryStock([first], []), null);
  const noScope = readCategoryStock([], ["2026-10"]);
  assert.equal(noScope.observed, false);
  assert.equal(noScope.complete, false);
  assert.equal(noScope.sellThroughBps, null);
  assert.equal(noScope.coverWeeks, null);
  const noSales = readCategoryStock(
    [line("returned", 4500, [record("2026-10", 100, 30, { returnedUnits: 100 })])],
    ["2026-10"],
  );
  assert.equal(noSales.soldUnits, 0);
  assert.equal(noSales.sellThroughBps, 0);
  assert.equal(noSales.coverWeeks, null);
});
