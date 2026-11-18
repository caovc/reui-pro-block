import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SLO_DAY_MS,
  aggregateSloEvents,
  sloThreeDayBudgetHistory,
} from "../src/templates/workflow/strata-slo-engine.ts";
import {
  createStrataSloState,
  selectStrataSloRows,
} from "../src/templates/workflow/strata-services-model.ts";
import { STRATA_NOW_MS } from "../src/templates/workflow/strata-domain.ts";

const now = 90 * SLO_DAY_MS;
const definition = { id: "test-slo", objectivePct: 99.9 };
const bucket = (startDays, endDays, total, bad, sloId = definition.id) => ({
  sloId,
  startMs: now - startDays * SLO_DAY_MS,
  endMs: now - endDays * SLO_DAY_MS,
  total,
  bad,
});
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7);

test("budget history covers exactly thirty adjoining three-day periods and keeps empty periods unknown", () => {
  const result = sloThreeDayBudgetHistory(definition, [], now);
  assert.equal(result.length, 30);
  assert.equal(result[0].startMs, now - 90 * SLO_DAY_MS);
  assert.equal(result.at(-1).endMs, now);
  for (const [index, period] of result.entries()) {
    assert.equal(period.endMs - period.startMs, 3 * SLO_DAY_MS);
    assert.equal(period.total, 0);
    assert.equal(period.bad, 0);
    assert.equal(period.remainingPct, null);
    if (index) assert.equal(period.startMs, result[index - 1].endMs);
  }
});

test("partial observations retain counts in the correct periods and exclude other SLOs", () => {
  const events = [bucket(4, 2, 200, 2), bucket(3, 0, 10_000, 900, "other-slo")];
  const result = sloThreeDayBudgetHistory(definition, events, now);
  assert.ok(result.slice(0, 28).every((period) => period.remainingPct === null));
  assert.deepEqual(
    result.slice(28).map(({ total, bad }) => ({ total, bad })),
    [
      { total: 100, bad: 1 },
      { total: 100, bad: 1 },
    ],
  );
  for (const period of result.slice(28)) near(period.remainingPct, -900);
});

test("objective changes recompute raw signed budgets without clamping or mutating events", () => {
  const events = [bucket(3, 0, 30_000, 300)];
  const preserved = structuredClone(events);
  near(sloThreeDayBudgetHistory(definition, events, now).at(-1).remainingPct, -900);
  near(sloThreeDayBudgetHistory(definition, events, now, 99).at(-1).remainingPct, 0);
  near(sloThreeDayBudgetHistory(definition, events, now, 99.99).at(-1).remainingPct, -9900);
  assert.deepEqual(events, preserved);
});

test("sparse independent incidents retain the original event counts at every policy-window boundary", () => {
  const state = createStrataSloState();
  const expected = {
    "SLO-101": [
      [7, 5179976, 71069],
      [28, 20719976, 259269],
      [30, 22199976, 277803],
      [90, 66599976, 813781],
    ],
    "SLO-102": [
      [7, 8400000, 8232],
      [28, 33600000, 42000],
      [30, 36000000, 44406],
      [90, 108000000, 123721],
    ],
    "SLO-103": [
      [7, 21700024, 18982],
      [28, 86800024, 94036],
      [30, 93000024, 101184],
      [90, 279000024, 279571],
    ],
  };
  for (const [sloId, windows] of Object.entries(expected)) {
    const own = state.ledger.filter((event) => event.sloId === sloId);
    for (const [days, total, bad] of windows) {
      assert.deepEqual(aggregateSloEvents(own, STRATA_NOW_MS - days * SLO_DAY_MS, STRATA_NOW_MS), {
        total,
        bad,
      });
    }
  }
});

test("the genuine Checkout event history is retained rather than forced into the exhausted-row shape", () => {
  const state = createStrataSloState();
  const own = state.ledger.filter((event) => event.sloId === "SLO-104");
  for (const [days, total, bad] of [
    [3, 7200000, 13741],
    [7, 16800000, 21647],
    [28, 67200000, 63101],
    [30, 72000000, 66849],
    [90, 216000000, 185889],
  ]) {
    assert.deepEqual(aggregateSloEvents(own, STRATA_NOW_MS - days * SLO_DAY_MS, STRATA_NOW_MS), {
      total,
      bad,
    });
  }
  const checkout = selectStrataSloRows(state.definitions, state.ledger)[3];
  assert.equal(checkout.evaluation.alert, "paging");
  assert.equal(checkout.budgetHistory.filter((period) => period.remainingPct < 0).length, 1);
});

test("fixed three-day history remains independent of the selected rolling-budget window", () => {
  const state = createStrataSloState();
  const own = selectStrataSloRows(state.definitions, state.ledger);
  for (const windowDays of [7, 28, 30]) {
    const rows = selectStrataSloRows(state.definitions, state.ledger, { windowDays });
    for (const [index, row] of rows.entries())
      assert.deepEqual(row.budgetHistory, own[index].budgetHistory);
  }
});

test("independent fixtures attain the minimum negative periods required by disjoint aligned aggregate counts", () => {
  const state = createStrataSloState();
  const rows = selectStrataSloRows(state.definitions, state.ledger).slice(0, 3);
  const actual = [];
  for (const row of rows) {
    const own = state.ledger.filter((event) => event.sloId === row.id);
    const ranges = [
      [90, 30],
      [30, 0],
    ].map(([from, through]) =>
      aggregateSloEvents(
        own,
        STRATA_NOW_MS - from * SLO_DAY_MS,
        STRATA_NOW_MS - through * SLO_DAY_MS,
      ),
    );
    const lowerBound = ranges.filter(
      (range) => range.bad > (range.total * (100 - row.objectivePct)) / 100,
    ).length;
    const negative = row.budgetHistory.filter((period) => period.remainingPct < 0).length;
    assert.equal(negative, lowerBound);
    actual.push(negative);
  }
  assert.deepEqual(actual, [2, 2, 1]);
});
