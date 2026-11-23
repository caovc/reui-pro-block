import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allocateForecastYear,
  createCategoryForecast,
  filterForecastLines,
  forecastMetrics,
  saveForecastLine,
  setForecastGrowth,
} from "../src/blocks/data/grid-advanced-category-forecast-model.ts";

test("annual allocation preserves every cent, including tiny and maximum-safe totals", () => {
  const equal = Array.from({ length: 12 }, () => 1);
  assert.deepEqual(allocateForecastYear(5, equal), [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]);
  for (const total of [0, 10001, Number.MAX_SAFE_INTEGER]) {
    const values = allocateForecastYear(total, [8, 7, 8, 8, 8, 9, 6, 7, 8, 9, 10, 12]);
    assert.equal(
      values.reduce((sum, value) => sum + value, 0),
      total,
    );
    assert.ok(values.every((value) => Number.isSafeInteger(value) && value >= 0));
  }
  assert.deepEqual(
    allocateForecastYear(
      7,
      Array.from({ length: 12 }, () => 0),
    ),
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  );
  assert.deepEqual(allocateForecastYear(100, [-1, ...equal.slice(1)]), []);
});

test("department growth changes real monthly and annual forecast totals", () => {
  const state = createCategoryForecast();
  const line = {
    ...state.lines[0],
    priorYearCents: Array.from({ length: 12 }, () => 100),
    planCents: Array.from({ length: 12 }, () => 120),
  };
  const growth = { ...state.growthBasisPoints, Technology: 1000 };
  const result = forecastMetrics([line], growth);
  assert.equal(result.months[0].forecastCents, 110);
  assert.equal(result.forecastCents, 1320);
  assert.equal(result.planCents, 1440);
  assert.equal(result.varianceCents, -120);
  const next = setForecastGrowth({ ...state, growthBasisPoints: growth }, "Technology", 2000);
  assert.equal(next.error, null);
  assert.equal(forecastMetrics([line], next.state.growthBasisPoints).forecastCents, 1440);
  assert.equal(growth.Technology, 1000);
  assert.equal(next.state.growthBasisPoints.Home, growth.Home);
});

test("plan attainment uses additive money totals and never invents a missing plan", () => {
  const state = createCategoryForecast();
  const line = state.lines[0];
  const first = {
    ...line,
    priorYearCents: [1000, ...Array(11).fill(0)],
    planCents: [1000, ...Array(11).fill(0)],
  };
  const second = {
    ...first,
    id: "second",
    priorYearCents: [5000, ...Array(11).fill(0)],
    planCents: [10000, ...Array(11).fill(0)],
  };
  const growth = { ...state.growthBasisPoints, Technology: 0 };
  assert.equal(forecastMetrics([first, second], growth).attainment, (6000 / 11000) * 100);
  const noPlan = { ...first, id: "no-plan", planCents: Array(12).fill(0) };
  assert.equal(forecastMetrics([noPlan], growth).attainment, null);
  assert.deepEqual(
    filterForecastLines({ lines: [first, noPlan], growthBasisPoints: growth }, "", [], "No plan"),
    [noPlan],
  );
});

test("invalid slider values leave the planning state unchanged", () => {
  const state = createCategoryForecast();
  for (const value of [-2001, 4001, 0.5, NaN]) {
    const result = setForecastGrowth(state, "Technology", value);
    assert.ok(result.error);
    assert.equal(result.state, state);
  }
});

test("new and edited product lines preserve prior records and reject invalid months", () => {
  const state = createCategoryForecast();
  const snapshot = structuredClone(state);
  const created = saveForecastLine(state, {
    ...state.lines[0],
    id: "new-line",
    name: "  Workshop equipment  ",
  });
  assert.equal(created.error, null);
  assert.equal(created.state.lines.length, state.lines.length + 1);
  assert.equal(created.state.lines.at(-1).name, "Workshop equipment");
  assert.deepEqual(state, snapshot);
  const rejected = saveForecastLine(state, { ...state.lines[0], planCents: [1] });
  assert.ok(rejected.error);
  assert.equal(rejected.state, state);
});
