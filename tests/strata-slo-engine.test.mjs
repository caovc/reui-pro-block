import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SLO_DAY_MS,
  aggregateSloEvents,
  calculateSloBudget,
  evaluateSlo,
  formatSloBudget,
  sloOutageAllowanceSeconds,
  sloRequestAllowance,
  sloDailyHistory,
  validateSloDraft,
} from "../src/templates/workflow/strata-slo-engine.ts";
import {
  createStrataSloState,
  selectStrataSloRows,
  matchStrataSloRows,
  strataServicesPresetQuery,
} from "../src/templates/workflow/strata-services-model.ts";
import { STRATA_OWNERS, STRATA_SERVICES } from "../src/templates/workflow/strata-domain.ts";

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} ≠ ${expected}`);
const now = 40 * SLO_DAY_MS;
const definition = {
  id: "slo-test",
  name: "Request availability",
  serviceId: "checkout-api",
  ownerId: "maya",
  indicator: "availability",
  goodEvent: "Successful requests",
  objectivePct: 99.9,
  windowDays: 28,
  alertsEnabled: true,
  fastBurnEnabled: true,
  slowBurnEnabled: true,
  muted: false,
};
const bin = (startMs, endMs, total, bad) => ({ sloId: definition.id, startMs, endMs, total, bad });

test("the checkout pin is an editable two-row search over the complete unchanged SLO index", () => {
  const state = createStrataSloState();
  const rows = selectStrataSloRows(state.definitions, state.ledger);
  const query = strataServicesPresetQuery("checkout-api");
  assert.equal(query, "checkout-api");
  const pinned = matchStrataSloRows(rows, query);
  assert.deepEqual(
    pinned.map((row) => row.name),
    ["Checkout availability", "Checkout p95 latency"],
  );
  assert.equal(pinned.filter((row) => row.evaluation.health === "at-risk").length, 2);
  assert.equal(formatSloBudget(pinned[0].evaluation.remainingPct), "+6.1%");
  assert.equal(formatSloBudget(pinned[1].evaluation.remainingPct), "+11.6%");
  assert.equal(rows.length, 18);
  assert.equal(rows.filter((row) => row.evaluation.health === "exhausted").length, 3);
  assert.equal(rows.filter((row) => row.evaluation.alert === "paging").length, 1);
  assert.equal(matchStrataSloRows(rows, "").length, 18);
  assert.equal(strataServicesPresetQuery(), "");
  assert.equal(strataServicesPresetQuery("unknown-service"), "");
  assert.deepEqual(matchStrataSloRows(rows, query, "Unknown team"), []);
});

test("SLO allowance uses the selected objective, window and actual request volume", () => {
  near(sloOutageAllowanceSeconds(99.9, 28), 2419.2);
  near(sloRequestAllowance(99.9, 28, 2_400_000), 67_200);
  near(sloRequestAllowance(99, 7, 2_400_000), 168_000);
  near(sloRequestAllowance(99.99, 30, 2_400_000), 7_200);
});

test("exhausted SLO budgets retain deficits beyond minus one hundred percent", () => {
  const budget = calculateSloBudget(99.9, 1_000_000, 5_000);
  near(budget.allowedBad, 1_000);
  near(budget.remainingBad, -4_000);
  near(budget.remainingPct, -400);
  near(budget.burnRate, 5);
  assert.equal(formatSloBudget(budget.remainingPct), "-400.0%");
  assert.equal(formatSloBudget(null), "—");
});

test("empty event windows are unknown rather than a fabricated clean budget", () => {
  const result = evaluateSlo(definition, [], now);
  assert.equal(result.remainingPct, null);
  assert.equal(result.observedGoodPct, null);
  assert.equal(result.burn1h, null);
  assert.equal(result.runwayDays, null);
  assert.equal(result.health, "no-data");
  assert.equal(result.alert, "quiet");
});

test("missing observation days stay null and preserve their positions in SLI history", () => {
  assert.deepEqual(sloDailyHistory(definition, [], now, 3), [null, null, null]);
  const observedMiddleDay = [bin(now - 2 * SLO_DAY_MS, now - SLO_DAY_MS, 100, 1)];
  assert.deepEqual(sloDailyHistory(definition, observedMiddleDay, now, 3), [null, 99, null]);
  const state = createStrataSloState();
  const fresh = { ...definition, id: "new-empty-slo" };
  const row = selectStrataSloRows([fresh], state.ledger)[0];
  assert.equal(row.evaluation.health, "no-data");
  assert.ok(row.history.every((value) => value === null));
});

test("windowed counts exclude non-overlapping events and prorate partial bins", () => {
  const data = [bin(0, SLO_DAY_MS, 2400, 24), bin(2 * SLO_DAY_MS, 3 * SLO_DAY_MS, 9999, 100)];
  assert.deepEqual(aggregateSloEvents(data, SLO_DAY_MS / 4, (SLO_DAY_MS * 3) / 4), {
    total: 1200,
    bad: 12,
  });
  assert.deepEqual(aggregateSloEvents(data, SLO_DAY_MS, 2 * SLO_DAY_MS), { total: 0, bad: 0 });
});

test("objective and rolling-window changes re-evaluate ledger counts without mutating policy", () => {
  const data = [
    bin(now - 28 * SLO_DAY_MS, now - 7 * SLO_DAY_MS, 210_000, 21),
    bin(now - 7 * SLO_DAY_MS, now, 70_000, 140),
  ];
  const own = evaluateSlo(definition, data, now);
  const short = evaluateSlo(definition, data, now, { windowDays: 7 });
  const relaxed = evaluateSlo(definition, data, now, { windowDays: 7, objectivePct: 99.5 });
  near(own.remainingPct, 42.5);
  near(short.remainingPct, -100);
  near(relaxed.remainingPct, 60);
  assert.equal(definition.objectivePct, 99.9);
  assert.equal(definition.windowDays, 28);
});

test("fast and slow burn policies honor their independent switches and mute state", () => {
  const fast = [bin(now - SLO_DAY_MS, now, 100_000, 1500)];
  assert.equal(evaluateSlo(definition, fast, now).alert, "paging");
  assert.equal(evaluateSlo({ ...definition, fastBurnEnabled: false }, fast, now).alert, "ticket");
  assert.equal(
    evaluateSlo({ ...definition, fastBurnEnabled: false, slowBurnEnabled: false }, fast, now).alert,
    "quiet",
  );
  const muted = evaluateSlo({ ...definition, muted: true }, fast, now);
  assert.equal(muted.alert, "muted");
  assert.ok(muted.remainingPct < 0, "muting notification must not erase the budget deficit");
  assert.equal(evaluateSlo({ ...definition, alertsEnabled: false }, fast, now).alert, "quiet");
});

test("the six-hour fast-burn alternative and strict over-threshold wording are retained", () => {
  const sixHours = [bin(now - SLO_DAY_MS / 4, now, 100_000, 610)];
  assert.equal(evaluateSlo(definition, sixHours, now).alert, "paging");
  const exact = [
    bin(now - SLO_DAY_MS / 4, now - SLO_DAY_MS / 24, 500_000, 0),
    bin(now - SLO_DAY_MS / 24, now, 100_000, 14_400),
  ];
  const atBoundary = evaluateSlo(
    { ...definition, objectivePct: 99, slowBurnEnabled: false },
    exact,
    now,
  );
  assert.equal(atBoundary.alert, "quiet");
  const above = exact.map((bucket, index) => (index === 1 ? { ...bucket, bad: 14_401 } : bucket));
  assert.equal(evaluateSlo({ ...definition, objectivePct: 99 }, above, now).alert, "paging");
});

test("invalid counts or impossible objectives are rejected instead of clamped", () => {
  for (const objective of [0, 100, Infinity, NaN]) {
    assert.throws(() => calculateSloBudget(objective, 10, 1), RangeError);
  }
  for (const [total, bad] of [
    [-1, 0],
    [10, -1],
    [10, 11],
    [Infinity, 0],
  ]) {
    assert.throws(() => calculateSloBudget(99.9, total, bad), RangeError);
  }
  assert.throws(() => aggregateSloEvents([bin(3, 2, 1, 0)], 0, 10), RangeError);
  assert.throws(() => sloOutageAllowanceSeconds(99.9, 14), RangeError);
  assert.throws(() => sloRequestAllowance(99.9, 0, 1000), RangeError);
});

test("independent initial SLOs derive the captured health distribution and share valid service/owner IDs", () => {
  const state = createStrataSloState();
  const rows = selectStrataSloRows(state.definitions, state.ledger);
  assert.equal(rows.length, 18);
  assert.equal(rows.filter((row) => row.evaluation.health === "exhausted").length, 3);
  assert.equal(rows.filter((row) => row.evaluation.health === "at-risk").length, 4);
  assert.equal(rows.filter((row) => row.evaluation.health === "healthy").length, 11);
  assert.equal(rows.filter((row) => row.evaluation.alert === "paging").length, 1);
  assert.equal(rows.filter((row) => row.muted).length, 2);
  for (const row of rows) {
    assert.ok(STRATA_SERVICES.some((service) => service.id === row.serviceId));
    assert.ok(STRATA_OWNERS.some((owner) => owner.id === row.ownerId));
    assert.equal(row.history.length, 90);
  }
  assert.deepEqual(
    rows.slice(0, 4).map((row) => formatSloBudget(row.evaluation.remainingPct)),
    ["-37.2%", "-25.0%", "-8.8%", "+6.1%"],
  );
});

test("new SLO validation checks real domain references and the captured creation choices", () => {
  const { id: _id, muted: _muted, ...draft } = definition;
  const services = STRATA_SERVICES.map((service) => service.id);
  const owners = STRATA_OWNERS.map((owner) => owner.id);
  assert.deepEqual(validateSloDraft(draft, services, owners), {});
  const errors = validateSloDraft(
    { ...draft, name: " ", serviceId: "unknown", ownerId: "unknown", objectivePct: 98 },
    services,
    owners,
  );
  assert.equal(Object.keys(errors).length, 4);
  near(calculateSloBudget(98, 1000, 10).remainingPct, 50);
});
