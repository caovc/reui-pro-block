// Pure domain draft: no browser fixtures, server, font interception or runtime proof claimed.
import { expect, test } from "@playwright/test";
import {
  createFilterGroup,
  createFilterQuery,
  createFilterRule,
} from "../src/components/reui/filters/filters-query";
import {
  DEFAULT_MONTH_INDEX,
  MARKETS,
  MONTHS,
  createEmptyActuals,
  createInitialScorecard,
  type Kpi,
  type ScorecardState,
} from "../src/blocks/data/grid-advanced-strategy-scorecard-data";
import {
  addKpi,
  buildScorecardRows,
  calculateProgress,
  computeScorecard,
  formatDelta,
  formatValue,
  getScoreStatus,
  matchesScorecardQuery,
  parseActual,
  removeKpi,
  updateKpi,
  validateKpi,
  writeCompanyActual,
  writeKpiWeight,
} from "../src/blocks/data/grid-advanced-strategy-scorecard-model";

function singleKpiState(value: number | null = 50): ScorecardState {
  const initial = createInitialScorecard();
  return {
    perspectives: [{ ...initial.perspectives[0], weight: 100 }],
    objectives: [initial.objectives[0]],
    kpis: [
      {
        ...initial.kpis[0],
        unit: "number",
        direction: "higher",
        baseline: 0,
        target: 100,
        weight: 100,
        ownerId: "",
        actuals: createEmptyActuals(value),
      },
    ],
    thresholds: { onTrack: 70, watch: 45 },
  };
}

function kpiRow(state: ScorecardState, id = state.kpis[0].id) {
  const row = buildScorecardRows(state, DEFAULT_MONTH_INDEX)
    .flatMap((objective) => objective.children)
    .find((entry) => entry.id === id);
  expect(row).toBeDefined();
  return row!;
}

test("original fixture has 30 KPIs, nine objectives, four perspectives and 29 September scores", () => {
  const state = createInitialScorecard();
  const result = computeScorecard(state, DEFAULT_MONTH_INDEX);
  expect(state.kpis).toHaveLength(30);
  expect(state.objectives).toHaveLength(9);
  expect(state.perspectives).toHaveLength(4);
  expect(MARKETS).toHaveLength(10);
  expect(MARKETS.reduce((sum, market) => sum + market.salesWeight, 0)).toBe(100);
  expect(MONTHS.map((month) => month.shortLabel)).toEqual([
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
  ]);
  expect(result.counts).toMatchObject({ total: 30, scored: 29, notScored: 1 });
  expect(result.kpis.filter((entry) => entry.score === null).map((entry) => entry.kpi.id)).toEqual([
    "kpi-handover-evidence",
  ]);
  expect(computeScorecard(state, 7).counts.scored).toBe(30);
  const desktop = buildScorecardRows(state, 8, false);
  const mobile = buildScorecardRows(state, 8, true);
  expect(desktop).toHaveLength(9);
  expect(desktop.every((row) => row.kind === "objective")).toBe(true);
  expect(desktop.flatMap((row) => row.children)).toHaveLength(30);
  expect(mobile).toHaveLength(4);
  expect(mobile.every((row) => row.kind === "perspective")).toBe(true);
  expect(mobile.flatMap((row) => row.children)).toHaveLength(9);
  expect(mobile.flatMap((row) => row.children).flatMap((row) => row.children)).toHaveLength(30);
  for (const objective of desktop) {
    expect(objective.children.every((row) => row.objectiveTitle === objective.title)).toBe(true);
    expect(objective.children.every((row) => row.searchText.includes(objective.title))).toBe(true);
  }
});

test("raw market actuals use declared sales weights rather than equal averaging", () => {
  const state = singleKpiState(0);
  state.kpis[0].actuals.US = MONTHS.map(() => 100);
  const result = computeScorecard(state, 8);
  // US30% *100 plus the other70% *0 gives30; equal market averaging would give10.
  expect(result.kpis[0].actual).toBe(30);
  expect(result.kpis[0].score).toBe(30);
  expect(result.company.score).toBe(30);
  expect(result.kpis[0].actual).not.toBe(10);
});

test("higher/lower baseline-to-target progress clamps and defines a zero target range", () => {
  expect(calculateProgress(150, 100, 200, "higher")).toBe(50);
  expect(calculateProgress(70, 100, 40, "lower")).toBe(50);
  expect(calculateProgress(90, 100, 200, "higher")).toBe(0);
  expect(calculateProgress(250, 100, 200, "higher")).toBe(100);
  expect(calculateProgress(110, 100, 40, "lower")).toBe(0);
  expect(calculateProgress(20, 100, 40, "lower")).toBe(100);
  expect(calculateProgress(50, 50, 50, "higher")).toBe(100);
  expect(calculateProgress(49, 50, 50, "higher")).toBe(0);
  expect(calculateProgress(49, 50, 50, "lower")).toBe(100);
  expect(calculateProgress(null, 0, 100, "higher")).toBeNull();
});

test("zero is scored; a single missing market makes the company actual unscored", () => {
  const zero = singleKpiState(0);
  expect(computeScorecard(zero, 8).kpis[0]).toMatchObject({
    actual: 0,
    score: 0,
    status: "off-track",
  });
  const missing = singleKpiState(0);
  missing.kpis[0].actuals.US[8] = null;
  const result = computeScorecard(missing, 8);
  expect(result.kpis[0]).toMatchObject({ actual: null, score: null, status: "not-scored" });
  expect(result.kpis[0].markets.filter((market) => market.score !== null)).toHaveLength(9);
  expect(result.counts).toMatchObject({ scored: 0, notScored: 1 });
});

test("a 90 weight set is visibly warned and normalized by90 rather than100", () => {
  const state = singleKpiState(100);
  state.kpis[0].weight = 60;
  state.kpis.push({
    ...state.kpis[0],
    id: "kpi-check-second",
    weight: 30,
    actuals: createEmptyActuals(0),
  });
  const result = computeScorecard(state, 8);
  expect(result.objectives[0]).toMatchObject({
    kpiWeightTotal: 90,
    scoredWeightTotal: 90,
    weightWarning: true,
  });
  expect(result.objectives[0].score).toBeCloseTo(200 / 3, 10);
  expect(result.company.score).toBeCloseTo(200 / 3, 10);
  expect(result.objectives[0].score).not.toBe(60);
  const unscored = updateKpi(state, "kpi-check-second", { actuals: createEmptyActuals(null) });
  expect(computeScorecard(unscored, 8).objectives[0]).toMatchObject({
    score: 100,
    kpiWeightTotal: 90,
    scoredWeightTotal: 60,
  });
});

test("objective means and company perspective weights are independent aggregation levels", () => {
  const original = createInitialScorecard();
  const state = singleKpiState(20);
  const firstPerspective = state.perspectives[0];
  const secondPerspective = { ...original.perspectives[1], weight: 70 };
  state.perspectives = [{ ...firstPerspective, weight: 30 }, secondPerspective];
  const objectiveA = state.objectives[0];
  const objectiveB = { ...original.objectives[1], perspectiveId: firstPerspective.id };
  const objectiveC = { ...original.objectives[3], perspectiveId: secondPerspective.id };
  state.objectives = [objectiveA, objectiveB, objectiveC];
  state.kpis.push(
    {
      ...state.kpis[0],
      id: "kpi-check-objective-b",
      objectiveId: objectiveB.id,
      actuals: createEmptyActuals(80),
    },
    {
      ...state.kpis[0],
      id: "kpi-check-objective-c",
      objectiveId: objectiveC.id,
      actuals: createEmptyActuals(100),
    },
  );
  const result = computeScorecard(state, 8);
  // First perspective=(20+80)/2=50; company=50*.30+100*.70=85.
  expect(result.perspectives[0].score).toBeCloseTo(50, 10);
  expect(result.company.score).toBeCloseTo(85, 10);
  expect(result.weakestPerspective?.perspective.id).toBe(firstPerspective.id);
});

test("threshold edits change status/counts without changing actuals or progress", () => {
  const state = singleKpiState(60);
  expect(computeScorecard(state, 8).kpis[0].status).toBe("watch");
  const next = { ...state, thresholds: { onTrack: 55, watch: 30 } };
  const result = computeScorecard(next, 8);
  expect(result.kpis[0].status).toBe("on-track");
  expect(result.kpis[0].actual).toBeCloseTo(60, 10);
  expect(result.kpis[0].score).toBeCloseTo(60, 10);
  expect(result.counts).toMatchObject({ onTrack: 1, watch: 0 });
  expect(getScoreStatus(70, state.thresholds)).toBe("on-track");
  expect(getScoreStatus(45, state.thresholds)).toBe("watch");
  expect(getScoreStatus(44.999, state.thresholds)).toBe("off-track");
});

test("monthly changes are progress-point differences, including missing earlier months", () => {
  const state = singleKpiState();
  for (const market of MARKETS)
    state.kpis[0].actuals[market.code] = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const result = computeScorecard(state, 8);
  expect(result.kpis[0].change).toBeCloseTo(10, 10);
  expect(result.kpis[0].change).not.toBeCloseTo(12.5, 3);
  expect(result.kpis[0].history[0].change).toBeNull();
  expect(formatDelta(2)).toBe("+2 pts");
  expect(formatDelta(null)).toBe("—");
});

test("company edits preserve market gaps and past months without mutating an Undo snapshot", () => {
  const state = singleKpiState(11);
  state.kpis[0].actuals.US[8] = 30;
  state.kpis[0].actuals.GB[8] = 22;
  const before = structuredClone(state);
  // 30*.30 +22*.14 +11*.56 =18.24; the requested23.24 adds5 in every market.
  const next = writeCompanyActual(state, state.kpis[0].id, 8, 23.24);
  for (const market of MARKETS) {
    expect(next.kpis[0].actuals[market.code][8]).toBeCloseTo(
      before.kpis[0].actuals[market.code][8]! + 5,
      10,
    );
    expect(next.kpis[0].actuals[market.code].slice(0, 8)).toEqual(
      before.kpis[0].actuals[market.code].slice(0, 8),
    );
    expect(next.kpis[0].actuals[market.code]).not.toBe(state.kpis[0].actuals[market.code]);
  }
  expect(computeScorecard(next, 8).kpis[0].actual).toBeCloseTo(23.24, 10);
  expect(state).toEqual(before);
  const batch = writeKpiWeight(
    writeCompanyActual(next, state.kpis[0].id, 7, 0),
    state.kpis[0].id,
    0,
  );
  expect(computeScorecard(batch, 7).kpis[0].actual).toBeCloseTo(0, 10);
  expect(batch.kpis[0].weight).toBe(0);
  expect(next.kpis[0].weight).toBe(100);
  expect(state).toEqual(before);
  expect(() => writeCompanyActual(state, state.kpis[0].id, 8, Number.NaN)).toThrow();
  expect(state).toEqual(before);
});

test("null company editing clears only that month and filling an incomplete month initializes all markets", () => {
  const state = singleKpiState(12);
  const cleared = writeCompanyActual(state, state.kpis[0].id, 8, null);
  for (const market of MARKETS) {
    expect(cleared.kpis[0].actuals[market.code][8]).toBeNull();
    expect(cleared.kpis[0].actuals[market.code][7]).toBe(12);
  }
  const filled = writeCompanyActual(cleared, state.kpis[0].id, 8, 0);
  expect(computeScorecard(filled, 8).kpis[0]).toMatchObject({ actual: 0, score: 0 });
  for (const market of MARKETS) expect(filled.kpis[0].actuals[market.code][8]).toBe(0);
});

test("native FilterQuery preserves nested OR/AND, negation, membership and unary empty semantics", () => {
  const state = singleKpiState(65);
  const row = kpiRow(state);
  const rule = createFilterRule;
  const query = createFilterQuery([
    createFilterGroup({
      id: "either",
      combinator: "or",
      rules: [
        rule({ id: "status", path: ["status"], operator: "is_any_of", value: ["on-track"] }),
        rule({ id: "progress", path: ["progress"], operator: "gte", value: 60 }),
      ],
    }),
    rule({ id: "unassigned", path: ["owner"], operator: "empty" }),
    rule({ id: "not-lower", path: ["direction"], operator: "is", value: "lower", negated: true }),
  ]);
  expect(matchesScorecardQuery(row, query)).toBe(true);
  expect(
    matchesScorecardQuery(
      row,
      createFilterQuery([
        rule({ id: "exclude-watch", path: ["status"], operator: "is_none_of", value: ["watch"] }),
      ]),
    ),
  ).toBe(false);
  expect(
    matchesScorecardQuery(
      row,
      createFilterQuery([
        rule({ id: "range", path: ["progress"], operator: "between", value: [60, 70] }),
      ]),
    ),
  ).toBe(true);
  expect(
    matchesScorecardQuery(
      row,
      createFilterQuery([
        rule({ id: "outside", path: ["progress"], operator: "not_between", value: [60, 70] }),
      ]),
    ),
  ).toBe(false);
  const zeroRow = kpiRow(singleKpiState(0));
  expect(
    matchesScorecardQuery(
      zeroRow,
      createFilterQuery([
        rule({ id: "zero-not-empty", path: ["value"], operator: "not_empty" }),
        rule({ id: "zero-eq", path: ["value"], operator: "eq", value: 0 }),
      ]),
    ),
  ).toBe(true);
  const missingRow = kpiRow(singleKpiState(null));
  expect(
    matchesScorecardQuery(
      missingRow,
      createFilterQuery([rule({ id: "missing", path: ["value"], operator: "empty" })]),
    ),
  ).toBe(true);
});

test("domain mutations allow Unassigned, reject invalid patches and keep IDs stable", () => {
  const state = singleKpiState();
  const original = structuredClone(state);
  expect(() => validateKpi(state, state.kpis[0])).not.toThrow();
  const edited = updateKpi(state, state.kpis[0].id, {
    ownerId: "",
    title: "  Original revised metric  ",
  });
  expect(edited.kpis[0]).toMatchObject({
    id: state.kpis[0].id,
    ownerId: "",
    title: "Original revised metric",
  });
  expect(() => updateKpi(state, state.kpis[0].id, { ownerId: "unknown-owner" })).toThrow();
  expect(() => writeKpiWeight(state, state.kpis[0].id, -1)).toThrow();
  expect(() => writeKpiWeight(state, state.kpis[0].id, 101)).toThrow();
  expect(() => updateKpi(state, state.kpis[0].id, { target: -1 })).toThrow();
  const addition: Kpi = {
    ...state.kpis[0],
    id: "kpi-new-original",
    actuals: createEmptyActuals(null),
  };
  const added = addKpi(state, addition);
  expect(added.kpis).toHaveLength(2);
  expect(() => addKpi(added, addition)).toThrow();
  expect(removeKpi(added, addition.id)).toEqual(state);
  expect(state).toEqual(original);
});

test("unit parsing preserves million-dollar edit magnitudes, missing values and finite zero", () => {
  expect(formatValue(1.88, "currency-million")).toBe("$1.88M");
  expect(parseActual("$1.88M", "currency-million")).toEqual({ ok: true, value: 1.88 });
  expect(parseActual("1.88M", "currency").ok).toBe(false);
  expect(parseActual("64.2%", "percent")).toEqual({ ok: true, value: 64.2 });
  expect(parseActual("0")).toEqual({ ok: true, value: 0 });
  expect(parseActual("-0")).toEqual({ ok: true, value: 0 });
  expect(parseActual(" ")).toEqual({ ok: true, value: null });
  expect(parseActual("1,234.50")).toEqual({ ok: true, value: 1234.5 });
  for (const text of ["1,23", "Infinity", "NaN", "1e3", "12oops"])
    expect(parseActual(text).ok).toBe(false);
});

test("company market footer uses the full hierarchy with an independent mixed-unit numeric oracle", () => {
  const original = createInitialScorecard();
  const state = singleKpiState(50);
  state.perspectives = [
    { ...state.perspectives[0], weight: 25 },
    { ...original.perspectives[1], weight: 75 },
  ];
  const objectiveA = state.objectives[0];
  const objectiveB = { ...original.objectives[1], perspectiveId: state.perspectives[0].id };
  const objectiveC = { ...original.objectives[3], perspectiveId: state.perspectives[1].id };
  state.objectives = [objectiveA, objectiveB, objectiveC];
  const template = state.kpis[0];
  const metric = (
    id: string,
    objectiveId: string,
    weight: number,
    unit: Kpi["unit"],
    currentUS: number,
    previousUS: number,
    lower = false,
  ): Kpi => {
    const actuals = createEmptyActuals(50);
    actuals.US[8] = currentUS;
    actuals.US[7] = previousUS;
    actuals.GB[8] = lower ? 100 : 0;
    actuals.GB[7] = lower ? 100 : 0;
    return {
      ...template,
      id,
      objectiveId,
      weight,
      unit,
      direction: lower ? "lower" : "higher",
      baseline: lower ? 100 : 0,
      target: lower ? 0 : 100,
      actuals,
    };
  };
  state.kpis = [
    metric("kpi-market-oracle-a", objectiveA.id, 60, "currency-million", 80, 60),
    metric("kpi-market-oracle-b", objectiveA.id, 30, "percent", 20, 0),
    metric("kpi-market-oracle-c", objectiveB.id, 100, "hours", 60, 80, true),
    metric("kpi-market-oracle-d", objectiveC.id, 100, "number", 90, 70),
  ];
  const result = computeScorecard(state, 8);
  const us = result.companyMarkets.find((market) => market.market.code === "US")!;
  const gb = result.companyMarkets.find((market) => market.market.code === "GB")!;
  // US objectiveA=(80*60+20*30)/90=60, objectiveB lower=40.
  // US perspectiveA=(60+40)/2=50; company=50*.25+90*.75=80.
  // Previous US: objectiveA40, objectiveB20 =>30*.25+70*.75=60.
  expect(us.score).toBeCloseTo(80, 10);
  expect(us.change).toBeCloseTo(20, 10);
  expect(us).toMatchObject({ actual: null, status: "on-track" });
  expect(gb).toMatchObject({ actual: null, score: 0, change: 0, status: "off-track" });
  expect(result.companyMarkets.map((market) => market.market.code)).toEqual(
    MARKETS.map((market) => market.code),
  );
  expect(result.companyMarkets.every((market) => market.actual === null)).toBe(true);
  expect(result.offTrackMarkets).toBe(1);
  // Existing company summary remains sales weighted:80*.30+0*.14+50*.56=52.
  expect(result.company.score).toBeCloseTo(52, 10);
  expect(result.company.change).toBeCloseTo(6, 10);
  expect(computeScorecard(state, 0).companyMarkets.every((market) => market.change === null)).toBe(
    true,
  );
});
