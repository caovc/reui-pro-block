import assert from "node:assert/strict";
import test from "node:test";
import { STRATA_NOW_MS } from "../src/templates/workflow/strata-domain.ts";
import {
  nextStrataRuns,
  parseStrataCron,
  STRATA_CRON_PRESETS,
  strataCronLabel,
} from "../src/templates/workflow/strata-cron.ts";

test("existing preset labels stay compact by default for shared consumers", () => {
  assert.deepEqual(
    STRATA_CRON_PRESETS.map(({ expression }) => strataCronLabel(expression)),
    ["Every 5 min", "Hourly at :00", "Daily", "Weekdays", "Weekly", "Monthly"],
  );
  assert.deepEqual(
    STRATA_CRON_PRESETS.map(({ expression }) => strataCronLabel(expression, "long")),
    ["Every 5 minutes", "Hourly at :00", "Daily", "Weekdays", "Weekly", "Monthly"],
  );
});

test("observed minute labels agree with future UTC runs, including the next hour", () => {
  for (const interval of [10, 15, 20, 30]) {
    const expression = `*/${interval} * * * *`;
    assert.equal(strataCronLabel(expression, "long"), `Every ${interval} minutes`);
    assert.equal(strataCronLabel(expression), `Every ${interval} min`);
    assert.deepEqual(
      nextStrataRuns(expression, STRATA_NOW_MS),
      [1, 2, 3].map((count) => STRATA_NOW_MS + count * interval * 60_000),
    );
    assert.deepEqual(
      nextStrataRuns(expression, STRATA_NOW_MS + 55 * 60_000),
      [0, 1, 2].map((count) => STRATA_NOW_MS + (60 + count * interval) * 60_000),
    );
  }
});

test("daily time labels retain zero padding and strict next-day execution", () => {
  assert.equal(strataCronLabel("30 3 * * *", "long"), "Daily at 03:30");
  assert.deepEqual(nextStrataRuns("30 3 * * *", STRATA_NOW_MS), [
    Date.parse("2026-10-23T03:30:00Z"),
    Date.parse("2026-10-24T03:30:00Z"),
    Date.parse("2026-10-25T03:30:00Z"),
  ]);
  assert.equal(strataCronLabel("5 0 * * *"), "Daily at 00:05");
  assert.deepEqual(nextStrataRuns("5 0 * * *", STRATA_NOW_MS, 1), [
    Date.parse("2026-10-23T00:05:00Z"),
  ]);
});

test("hourly-at-minute labels preserve the literal cron offset", () => {
  for (const minute of [0, 5, 25, 30, 59]) {
    const expression = `${minute} * * * *`;
    assert.equal(strataCronLabel(expression), `Hourly at :${String(minute).padStart(2, "0")}`);
    const first = STRATA_NOW_MS + (minute || 60) * 60_000;
    assert.deepEqual(nextStrataRuns(expression, STRATA_NOW_MS), [
      first,
      first + 3_600_000,
      first + 7_200_000,
    ]);
  }
});

test("irregular steps, calendar constraints and invalid times stay neutral", () => {
  for (const expression of [
    "*/7 * * * *",
    "0,30 * * * *",
    "30 3 * * 1-5",
    "0 0 29 2 *",
    "*/0 * * * *",
    "*/90 * * * *",
    "60 * * * *",
    "60 3 * * *",
    "30 24 * * *",
    "not cron",
  ])
    assert.equal(strataCronLabel(expression, "long"), "Custom schedule", expression);
  const irregular = nextStrataRuns("*/7 * * * *", STRATA_NOW_MS + 55 * 60_000);
  assert.deepEqual(
    irregular.map((at) => (at - STRATA_NOW_MS) / 60_000),
    [56, 60, 67],
  );
});

test("labels remain read-only and compact output works with the existing detail expansion", () => {
  for (const interval of [5, 10, 15, 20, 30]) {
    const expression = `*/${interval} * * * *`;
    const parsed = parseStrataCron(expression);
    const upcoming = nextStrataRuns(expression, STRATA_NOW_MS);
    assert.equal(
      strataCronLabel(expression).replace(" min", " minutes"),
      `Every ${interval} minutes`,
    );
    strataCronLabel(expression, "long");
    assert.deepEqual(parseStrataCron(expression), parsed);
    assert.deepEqual(nextStrataRuns(expression, STRATA_NOW_MS), upcoming);
  }
});
