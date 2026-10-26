import assert from "node:assert/strict";
import test from "node:test";
import {
  computeHrMetric,
  createHrKpis,
  defaultMonth,
  defaultThresholds,
  directionScore,
  formatHrValue,
  hrBookIssue,
  hrReducer,
  hrRows,
  hrStatus,
  hrSummary,
  initialHrStore,
  matchesHrQuery,
  monthLabel,
  newHrKpi,
  parseHrNumber,
  shiftHrMonth,
} from "../src/blocks/data/grid-advanced-hr-data.ts";

const root = (rules, combinator = "and") => ({ id: "root", type: "group", combinator, rules });
const rule = (field, operator, value, negated = false) => ({
  id: `${field}-${operator}`,
  type: "rule",
  path: [field],
  operator,
  value,
  negated,
});
const metric = (kpi, ytd = false, month = defaultMonth) =>
  computeHrMetric(kpi, month, ytd, defaultThresholds);
const rows = (records) => hrRows(records, defaultMonth, false, defaultThresholds);
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} differs from ${expected}`);

test("writing a previously absent month preserves zero, keeps the sibling unreported and supports atomic Undo", () => {
  const initial = initialHrStore();
  const id = initial.records[0].id;
  const month = "2026-10";
  assert.equal(initial.records[0].series[month], undefined);
  const zeroTarget = hrReducer(initial, {
    type: "write",
    changes: [{ id, month, field: "target", value: 0 }],
  });
  assert.deepEqual(zeroTarget.records[0].series[month], { target: 0, actual: null });
  const actual = hrReducer(zeroTarget, {
    type: "write",
    changes: [{ id, month, field: "actual", value: 0 }],
  });
  assert.deepEqual(actual.records[0].series[month], { target: 0, actual: 0 });
  const cleared = hrReducer(actual, {
    type: "write",
    changes: [{ id, month, field: "actual", value: null }],
  });
  assert.deepEqual(cleared.records[0].series[month], { target: 0, actual: null });
  assert.deepEqual(hrReducer(cleared, { type: "undo" }).records[0].series[month], {
    target: 0,
    actual: 0,
  });
  assert.equal(initial.records[0].series[month], undefined);
});

test("original book has 24 stable KPI definitions, six groups and 21 independent monthly samples", () => {
  const book = createHrKpis();
  assert.equal(book.length, 24);
  assert.equal(new Set(book.map((kpi) => kpi.id)).size, 24);
  assert.deepEqual(
    rows(book).map((row) => row.children.length),
    [5, 4, 4, 4, 4, 3],
  );
  assert.ok(book.every((kpi) => Object.keys(kpi.series).length === 21));
  assert.equal(hrBookIssue(book), null);
  assert.equal(hrSummary(rows(book)).onTrack, 10);
});

test("lower-is-better target 32 → 40 → undo changes raw attainment and directional score separately", () => {
  const before = initialHrStore();
  const original = metric(before.records[0]);
  assert.equal(original.actual, 37.6);
  assert.equal(original.target, 32);
  close(original.attainment, 117.5);
  close(original.vsTarget, (32 / 37.6) * 100);
  assert.equal(original.status, "Off Track");
  const after = hrReducer(before, {
    type: "write",
    changes: [{ id: "HR-101", month: defaultMonth, field: "target", value: 40 }],
  });
  const changed = metric(after.records[0]);
  close(changed.variance, -2.4);
  close(changed.attainment, 94);
  close(changed.vsTarget, (40 / 37.6) * 100);
  assert.equal(changed.status, "On Track");
  assert.equal(hrSummary(rows(after.records)).onTrack, 11);
  assert.equal(Math.round(hrSummary(rows(after.records)).index), 96);
  const restored = hrReducer(after, { type: "undo" });
  assert.equal(restored.records, before.records);
  assert.deepEqual(metric(restored.records[0]), original);
  assert.equal(before.records[0].series[defaultMonth].target, 32);
});

test("paste batches across multiple KPI/month fields undo and redo as one immutable transaction", () => {
  const initial = initialHrStore();
  const changed = hrReducer(initial, {
    type: "write",
    changes: [
      { id: "HR-101", month: defaultMonth, field: "target", value: 40 },
      { id: "HR-102", month: defaultMonth, field: "actual", value: 91 },
    ],
  });
  assert.equal(changed.history.length, 1);
  assert.equal(changed.records[1].series[defaultMonth].actual, 91);
  assert.equal(changed.records[0].series["2026-08"], initial.records[0].series["2026-08"]);
  const restored = hrReducer(changed, { type: "undo" });
  assert.equal(restored.records, initial.records);
  assert.equal(hrReducer(restored, { type: "redo" }).records, changed.records);
  assert.equal(initial.records[1].series[defaultMonth].actual, 88.4);
});

test("YTD average/sum skip only missing values, preserve zero and compare corresponding prior-year months", () => {
  const base = newHrKpi("HR-TEST");
  base.series = {
    "2026-01": { target: 10, actual: 0 },
    "2026-02": { target: 10, actual: null },
    "2026-03": { target: 10, actual: 20 },
    "2025-01": { target: 8, actual: 4 },
    "2025-02": { target: 8, actual: 8 },
    "2025-03": { target: 8, actual: 12 },
  };
  const average = metric(base, true, "2026-03");
  assert.equal(average.actual, 10);
  assert.equal(average.target, 10);
  assert.equal(average.priorYear, 8);
  assert.equal(average.priorMonth, null);
  const sum = metric({ ...base, rollup: "sum" }, true, "2026-03");
  assert.equal(sum.actual, 20);
  assert.equal(sum.target, 30);
  assert.equal(sum.priorYear, 24);
  assert.equal(metric({ ...base, series: {} }, true, "2026-03").actual, null);
});

test("12 month trend is month-keyed, independent of Month/YTD and never copies the final sample", () => {
  const first = createHrKpis()[0];
  const september = metric(first);
  assert.equal(september.trend.length, 12);
  assert.deepEqual(september.trend, metric(first, true).trend);
  assert.equal(september.trend.at(-1), 37.6);
  assert.ok(new Set(september.trend).size > 5);
  const august = metric(first, false, "2026-08");
  assert.deepEqual(september.trend.slice(0, -1), august.trend.slice(1));
});

test("zero and null have distinct direction scores, status and formatting", () => {
  assert.equal(directionScore(null, 10, "higher"), null);
  assert.equal(directionScore(0, 0, "lower"), 100);
  assert.equal(directionScore(0, 10, "lower"), 200);
  assert.equal(directionScore(10, 0, "lower"), 0);
  assert.equal(directionScore(10, 0, "higher"), 200);
  assert.equal(directionScore(Infinity, 10, "higher"), null);
  assert.equal(hrStatus(null, defaultThresholds), "Pending");
  assert.equal(formatHrValue(0, "Count"), "0");
  assert.equal(formatHrValue(null, "Count"), "—");
  const safety = metric(createHrKpis().at(-1));
  assert.equal(safety.actual, 0);
  assert.equal(safety.attainment, 100);
  assert.equal(safety.status, "On Track");
});

test("full-book summary and filtered footer have different deliberate scopes", () => {
  const book = rows(createHrKpis());
  const whole = hrSummary(book);
  const one = hrSummary([book[0].children[0]]);
  assert.equal(whole.count, 24);
  assert.equal(whole.onTrack, 10);
  assert.equal(one.count, 1);
  assert.equal(one.onTrack, 0);
  assert.equal(Math.round(one.index), 85);
  assert.deepEqual(hrSummary(book), whole);
  assert.equal(hrSummary([]).index, null);
});

test("owner, unit, notes, duplicate, delete and reset persist in the same reversible raw store", () => {
  const initial = initialHrStore();
  const edited = {
    ...initial.records[0],
    owner: "Iris Reed",
    unit: "Hours",
    notes: "Definition approved",
  };
  let store = hrReducer(initial, { type: "put", kpi: edited });
  assert.equal(store.records[0].owner, "Iris Reed");
  assert.equal(store.records[0].notes, "Definition approved");
  const duplicate = {
    ...structuredClone(edited),
    id: "HR-COPY",
    label: "Hiring cycle time (copy)",
  };
  store = hrReducer(store, { type: "put", kpi: duplicate });
  assert.equal(store.records.length, 25);
  store = hrReducer(store, { type: "remove", id: duplicate.id });
  assert.equal(store.records.length, 24);
  store = hrReducer(store, { type: "undo" });
  assert.equal(store.records.find((kpi) => kpi.id === duplicate.id).notes, "Definition approved");
  store = hrReducer(store, { type: "reset" });
  assert.equal(store.records[0].owner, initial.records[0].owner);
  assert.equal(hrReducer(store, { type: "undo" }).records.length, 25);
});

test("threshold changes recalculate measured status, validate bounds and support undo", () => {
  const initial = initialHrStore();
  const changed = hrReducer(initial, {
    type: "thresholds",
    value: { ...defaultThresholds, onTrack: 90, watch: 80, headcount: 1440, hrStaff: 18 },
  });
  assert.ok(
    hrSummary(hrRows(changed.records, defaultMonth, false, changed.thresholds)).onTrack > 10,
  );
  assert.equal(changed.thresholds.headcount / changed.thresholds.hrStaff, 80);
  for (const values of [{ watch: 110 }, { hrStaff: 0 }, { headcount: NaN }, { onTrack: 201 }]) {
    assert.equal(
      hrReducer(initial, { type: "thresholds", value: { ...defaultThresholds, ...values } }),
      initial,
    );
  }
  assert.deepEqual(hrReducer(changed, { type: "undo" }).thresholds, defaultThresholds);
});

test("nested AND/OR with negated rule and incomplete OR children retains exact semantics", () => {
  const leaves = rows(createHrKpis()).flatMap((row) => row.children);
  const query = root([
    root([rule("group", "is", "Hiring"), rule("group", "is", "Retention")], "or"),
    rule("status", "is", "On Track", true),
  ]);
  assert.deepEqual(
    leaves.filter((row) => matchesHrQuery(row, query)).map((row) => row.id),
    leaves
      .filter((row) => ["Hiring", "Retention"].includes(row.group) && row.status !== "On Track")
      .map((row) => row.id),
  );
  const draft = root(
    [root([], "or"), rule("group", "is", "Learning"), rule("vsTarget", "gt", "", true)],
    "or",
  );
  assert.equal(leaves.filter((row) => matchesHrQuery(row, draft)).length, 4);
});

test("numeric/range/multi-value Filters skip drafts while allowing zero and null emptiness", () => {
  const first = rows(createHrKpis())[0].children[0];
  assert.equal(matchesHrQuery(first, root([rule("vsTarget", "gte", 0)])), true);
  assert.equal(matchesHrQuery(first, root([rule("vsTarget", "between", [80, 90])])), true);
  assert.equal(matchesHrQuery(first, root([rule("vsTarget", "between", [90, 80])])), true);
  assert.equal(
    matchesHrQuery(first, root([rule("group", "is_any_of", ["Hiring", "Learning"])])),
    true,
  );
  const pending = { ...first, vsTarget: null };
  assert.equal(matchesHrQuery(pending, root([rule("vsTarget", "empty")])), true);
  assert.equal(matchesHrQuery(pending, root([rule("vsTarget", "gte", 0)])), false);
  assert.equal(matchesHrQuery(first, root([rule("owner", "is_any_of", [])])), true);
});

test("spreadsheet numeric parsing separates clearing from invalid writes and preserves raw zero", () => {
  assert.equal(parseHrNumber(""), null);
  assert.equal(parseHrNumber(" "), null);
  assert.equal(parseHrNumber("0"), 0);
  assert.equal(parseHrNumber("$1,234.5"), 1234.5);
  assert.equal(parseHrNumber("92%"), 92);
  assert.equal(parseHrNumber("-1"), undefined);
  assert.equal(parseHrNumber("NaN"), undefined);
  assert.equal(parseHrNumber("$%"), undefined);
  const initial = initialHrStore();
  assert.equal(
    hrReducer(initial, {
      type: "write",
      changes: [{ id: "HR-101", month: defaultMonth, field: "target", value: -1 }],
    }),
    initial,
  );
});

test("blank actual creates Pending and loading replaces raw data while clearing stale undo", () => {
  const initial = initialHrStore();
  const added = { ...newHrKpi("HR-NEW"), label: "Original trial measure" };
  const store = hrReducer(initial, { type: "put", kpi: added });
  const summary = hrSummary(rows(store.records));
  assert.equal(summary.count, 25);
  assert.equal(summary.measured, 24);
  assert.equal(summary.pending, 1);
  const loaded = hrReducer(store, { type: "load", records: [] });
  assert.equal(loaded.history.length, 0);
  assert.equal(hrReducer(loaded, { type: "undo" }), loaded);
});

test("adapter validation rejects duplicate IDs and invalid samples without treating null/zero as missing", () => {
  const valid = createHrKpis();
  assert.equal(hrBookIssue(valid), null);
  assert.match(hrBookIssue([valid[0], valid[0]]), /unique/);
  assert.match(
    hrBookIssue([{ ...valid[0], series: { "2026-13": { target: 1, actual: 2 } } }]),
    /Invalid measurements/,
  );
  assert.match(
    hrBookIssue([{ ...valid[0], series: { "2026-09": { target: 1, actual: Infinity } } }]),
    /Invalid measurements/,
  );
  assert.equal(
    hrBookIssue([{ ...valid[0], series: { "2026-09": { target: 0, actual: null } } }]),
    null,
  );
});

test("month offsets are UTC and correctly cross year boundaries", () => {
  assert.equal(shiftHrMonth("2026-01", -1), "2025-12");
  assert.equal(shiftHrMonth("2026-09", -12), "2025-09");
  assert.equal(monthLabel("2026-09"), "Sep 2026");
});
