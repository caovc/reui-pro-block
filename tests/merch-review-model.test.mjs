import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateMerchCents,
  createMerchBook,
  matchesMerchQuery,
  merchCsv,
  merchMetrics,
  merchNet,
  merchQuarters,
  merchRangeSeries,
  merchStanding,
  merchTargetBps,
  readMerchLines,
  removeMerchBrand,
  reviewMonths,
  saveMerchBrand,
  saveMerchLine,
} from "../src/blocks/data/grid-advanced-merch-review-model.ts";

const sum = (values) => values.reduce((total, value) => total + value, 0);
function record(month, grossCents, costCents, weeks) {
  return {
    month,
    grossCents,
    discountCents: 0,
    returnedCents: 0,
    costCents,
    units: 100,
    returnedUnits: 0,
    closingUnits: 120,
    planCents: grossCents,
    weeklyNetCents: weeks ?? allocateMerchCents(grossCents, [1, 1, 1, 1]),
  };
}
function line(id, target, records) {
  return {
    id,
    name: id,
    department: "Home",
    brandId: "northfork",
    targetMarginBps: target,
    call: "Maintain",
    months: records,
    promotions: [],
  };
}

test("original fixtures keep 24 chronological months, unique identities and exact cash allocations", () => {
  const book = createMerchBook();
  assert.equal(reviewMonths.length, 24);
  assert.equal(new Set(reviewMonths).size, 24);
  assert.equal(book.brands.length, 4);
  assert.equal(book.lines.length, 12);
  assert.equal(new Set(book.lines.map((item) => item.id)).size, 12);
  for (const item of book.lines) {
    assert.ok(book.brands.some((brand) => brand.id === item.brandId));
    assert.deepEqual(
      item.months.map((month) => month.month),
      reviewMonths,
    );
    for (const month of item.months) {
      assert.equal(sum(month.weeklyNetCents), merchNet(month));
      assert.ok(month.returnedUnits <= month.units);
      assert.ok(month.returnedCents + month.discountCents <= month.grossCents);
    }
  }
  const overall = readMerchLines(book.lines, "2026-10");
  assert.equal(overall.netCents, 25_231_620);
  assert.equal(overall.profitCents, 12_381_240);
  assert.equal(overall.marginBps, 4907);
  const departments = ["Home", "Field", "Studio"].map((name) =>
    readMerchLines(
      book.lines.filter((item) => item.department === name),
      "2026-10",
    ),
  );
  assert.equal(sum(departments.map((reading) => reading.netCents)), overall.netCents);
  assert.equal(sum(departments.map((reading) => reading.profitCents)), overall.profitCents);
});

test("weighted rates, targets and basis-point moves do not average percentages", () => {
  const small = line("small", 5000, [
    record("2026-10", 10_000, 5000),
    record("2026-09", 10_000, 8000),
    record("2025-10", 10_000, 9000),
  ]);
  const large = line("large", 2000, [
    record("2026-10", 90_000, 81000),
    record("2026-09", 90_000, 72000),
    record("2025-10", 90_000, 81000),
  ]);
  const current = readMerchLines([small, large], "2026-10");
  assert.equal(current.marginBps, 1400);
  assert.notEqual(current.marginBps, 3000);
  assert.equal(current.monthMoveBps, -600);
  assert.equal(current.yearMoveBps, 400);
  assert.equal(merchTargetBps([small, large], "2026-10"), 2300);
  const missing = readMerchLines([small], "2024-10");
  assert.equal(missing.observed, false);
  assert.equal(missing.marginBps, null);
  assert.equal(missing.monthMoveBps, null);
});

test("quarter margins use combined revenue and ranges pair the same weeks before aggregating", () => {
  const varied = line("varied", 4500, [record("2026-04", 100, 0), record("2026-05", 900, 900)]);
  assert.equal(merchQuarters([varied], ["2026-04", "2026-05"])[0].marginBps, 1000);
  const a = line("a", 4000, [record("2026-10", 100, 50, [90, 10, 0, 0])]);
  const b = line("b", 4000, [record("2026-10", 100, 50, [0, 0, 10, 90])]);
  const combined = merchRangeSeries([a, b], ["2026-10", "2026-09"]);
  assert.deepEqual(combined[0].weeks, [90, 10, 10, 90]);
  assert.deepEqual(combined[0].range, [10, 90]);
  assert.equal(combined[1].range, undefined);
});

test("line edits replace only the chosen month and keep history, promotions and exact cents", () => {
  const book = createMerchBook();
  const original = structuredClone(book);
  const old = book.lines[0];
  const draft = {
    ...old,
    targetMarginBps: 6000,
    current: { ...record("2026-10", 1_000_001, 500_000) },
  };
  delete draft.current.weeklyNetCents;
  const next = saveMerchLine(book, old.id, draft);
  const changed = next.lines[0];
  assert.deepEqual(book, original);
  assert.deepEqual(
    changed.months.filter((month) => month.month !== "2026-10"),
    old.months.filter((month) => month.month !== "2026-10"),
  );
  assert.deepEqual(changed.promotions, old.promotions);
  assert.equal(readMerchLines([changed], "2026-10").profitCents, 500_001);
  assert.equal(
    sum(changed.months.find((month) => month.month === "2026-10").weeklyNetCents),
    1_000_001,
  );
  assert.equal(merchTargetBps([changed], "2026-10"), 6000);
  assert.throws(
    () =>
      saveMerchLine(book, old.id, {
        ...draft,
        current: { ...draft.current, returnedCents: 2_000_000 },
      }),
    /cannot exceed gross/,
  );
  assert.throws(
    () =>
      saveMerchLine(book, old.id, { ...draft, current: { ...draft.current, returnedUnits: 101 } }),
    /cannot exceed units/,
  );
});

test("new brands start without invented history; deleting a brand removes only its product records", () => {
  const original = createMerchBook();
  const next = saveMerchBrand(original, null, {
    name: "Pine Reach",
    initials: "pr",
    targetMarginBps: 5500,
    call: "Review",
  });
  const brand = next.brands.at(-1);
  assert.equal(brand.initials, "PR");
  assert.equal(
    readMerchLines(
      next.lines.filter((item) => item.brandId === brand.id),
      "2026-10",
    ).observed,
    false,
  );
  const month = record("2026-10", 1_000_000, 400_000);
  delete month.weeklyNetCents;
  const seeded = saveMerchLine(next, null, {
    name: "Pine tote",
    brandId: brand.id,
    department: "Field",
    targetMarginBps: 5500,
    call: "Invest",
    current: month,
  });
  assert.equal(seeded.lines.at(-1).months.length, 1);
  assert.equal(readMerchLines([seeded.lines.at(-1)], "2026-10").marginBps, 6000);
  const removed = removeMerchBrand(seeded, brand.id);
  assert.deepEqual(removed, original);
});

test("nested and incomplete native filter queries retain boolean and negation semantics", () => {
  const item = { name: "Table linen", department: "Home", call: "Review", margin: 55.9 };
  const rule = (path, operator, value, negated = false) => ({
    id: path,
    type: "rule",
    path: [path],
    operator,
    value,
    negated,
  });
  const query = {
    id: "root",
    type: "group",
    combinator: "and",
    rules: [
      rule("department", "is", "Home"),
      {
        id: "nested",
        type: "group",
        combinator: "or",
        rules: [rule("margin", "gt", 60), rule("call", "is", "Review")],
      },
      rule("name", "contains", undefined),
    ],
  };
  assert.equal(matchesMerchQuery(item, query), true);
  assert.equal(matchesMerchQuery(item, rule("department", "is", "Home", true)), false);
  assert.equal(matchesMerchQuery(item, rule("margin", "lt", 55.9)), false);
  assert.equal(matchesMerchQuery(item, rule("unknown", "neq", 1)), undefined);
});

test("spread direction treats lower returns as favourable and stock cover as neutral context", () => {
  assert.equal(
    merchStanding(
      merchMetrics.find((metric) => metric.id === "returnBps"),
      200,
      300,
    ),
    "positive",
  );
  assert.equal(
    merchStanding(
      merchMetrics.find((metric) => metric.id === "marginBps"),
      4000,
      5000,
    ),
    "negative",
  );
  assert.equal(
    merchStanding(
      merchMetrics.find((metric) => metric.id === "coverWeeks"),
      3,
      6,
    ),
    "neutral",
  );
  assert.equal(merchStanding(merchMetrics[0], null, 100), "neutral");
});

test("exported data is quoted exactly and preserves negative numbers without executable formulas", () => {
  assert.equal(
    merchCsv(
      ["Name", "Value"],
      [
        ["=SUM(A1:A2)", -10],
        ['A, "B"', null],
      ],
    ),
    '"Name","Value"\r\n"\'=SUM(A1:A2)","-10"\r\n"A, ""B""",""',
  );
  assert.deepEqual(allocateMerchCents(101, [1, 1, 1]), [34, 34, 33]);
  assert.throws(() => allocateMerchCents(1, [0, 0]), /positive/);
});
