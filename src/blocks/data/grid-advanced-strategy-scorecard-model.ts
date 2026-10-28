/**
 * Bricklane original scorecard domain model (MIT).
 * Actual free FilterQuery types are consumed without replacing the Filters editor.
 * No sort, pagination, selection, expansion or table row-model engine lives here.
 */
import type { FilterNode, FilterQuery, FilterRule } from "@/components/reui/filters/filters-types";
import {
  MARKETS,
  MONTHS,
  OWNERS,
  SCORE_STATUS_LABELS,
  type AggregateScore,
  type ComputedScorecard,
  type Kpi,
  type KpiDirection,
  type KpiScore,
  type MarketActuals,
  type MonthScore,
  type ObjectiveScore,
  type PerspectiveScore,
  type ScorecardRow,
  type ScorecardState,
  type ScoreCounts,
  type ScoreStatus,
  type ScoreThresholds,
  type ValueUnit,
} from "./grid-advanced-strategy-scorecard-data";

const VALUE_UNITS = new Set<ValueUnit>([
  "currency-million",
  "currency",
  "percent",
  "number",
  "days",
  "hours",
  "minutes",
  "ratio",
  "kg",
]);

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
}

function assertMonth(monthIndex: number): void {
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex >= MONTHS.length) {
    throw new RangeError("Month must be an integer from 0 (January) to 8 (September).");
  }
}

function assertWeight(weight: number, label: string): void {
  assertFinite(weight, label);
  if (weight < 0 || weight > 100) throw new RangeError(`${label} must be between 0 and 100.`);
}

function cloneActuals(actuals: MarketActuals): MarketActuals {
  return Object.fromEntries(
    MARKETS.map((market) => [market.code, [...actuals[market.code]]]),
  ) as MarketActuals;
}

/** Throws before a mutation commits. IDs and actuals are never silently repaired. */
export function validateKpi(state: ScorecardState, kpi: Kpi): void {
  if (!kpi.id.trim() || !kpi.title.trim()) throw new TypeError("KPI ID and title are required.");
  if (!state.objectives.some((objective) => objective.id === kpi.objectiveId)) {
    throw new RangeError("Choose an existing objective.");
  }
  if (kpi.ownerId !== "" && !OWNERS.some((owner) => owner.id === kpi.ownerId)) {
    throw new RangeError("Choose an existing Bricklane demo owner.");
  }
  if (!VALUE_UNITS.has(kpi.unit)) throw new RangeError("Unknown scorecard unit.");
  if (kpi.direction !== "higher" && kpi.direction !== "lower") {
    throw new RangeError("Direction must be higher or lower.");
  }
  assertWeight(kpi.weight, "KPI weight");
  assertFinite(kpi.baseline, "Baseline");
  assertFinite(kpi.target, "Target");
  const range = kpi.target - kpi.baseline;
  assertFinite(range, "Baseline-to-target range");
  if ((kpi.direction === "higher" && range < 0) || (kpi.direction === "lower" && range > 0)) {
    throw new RangeError("Target must follow the selected scoring direction.");
  }
  for (const market of MARKETS) {
    const values = kpi.actuals?.[market.code];
    if (!Array.isArray(values) || values.length !== MONTHS.length) {
      throw new RangeError(`Provide all nine monthly actuals for ${market.code}.`);
    }
    for (const value of values) {
      if (value !== null) assertFinite(value, `${market.code} actual`);
    }
  }
}

export function validateScorecard(state: ScorecardState): void {
  const ids = new Set<string>();
  for (const entity of [...state.perspectives, ...state.objectives, ...state.kpis]) {
    if (!entity.id.trim() || ids.has(entity.id)) throw new RangeError("Entity IDs must be unique.");
    ids.add(entity.id);
  }
  for (const perspective of state.perspectives) {
    if (!perspective.title.trim()) throw new TypeError("Perspective title is required.");
    assertWeight(perspective.weight, "Perspective weight");
  }
  for (const objective of state.objectives) {
    if (!objective.title.trim()) throw new TypeError("Objective title is required.");
    if (!state.perspectives.some((perspective) => perspective.id === objective.perspectiveId)) {
      throw new RangeError("Every objective needs an existing perspective.");
    }
  }
  const { watch, onTrack } = state.thresholds;
  assertFinite(watch, "Watch threshold");
  assertFinite(onTrack, "On-track threshold");
  if (watch < 0 || watch > onTrack || onTrack > 100) {
    throw new RangeError("Thresholds must satisfy 0 <= Watch <= On Track <= 100.");
  }
  for (const kpi of state.kpis) validateKpi(state, kpi);
}

/** Progress uses native units, and finite zero is a real observation. */
export function calculateProgress(
  actual: number | null,
  baseline: number,
  target: number,
  direction: KpiDirection,
): number | null {
  if (actual === null || ![actual, baseline, target].every(Number.isFinite)) return null;
  if (direction !== "higher" && direction !== "lower") return null;
  if (target === baseline) {
    return (direction === "higher" ? actual >= target : actual <= target) ? 100 : 0;
  }
  const distance = direction === "higher" ? target - baseline : baseline - target;
  if (distance <= 0 || !Number.isFinite(distance)) return null;
  const travelled = direction === "higher" ? actual - baseline : baseline - actual;
  const progress = (travelled / distance) * 100;
  if (Number.isNaN(progress)) return null;
  return Math.max(0, Math.min(100, progress));
}

export function getScoreStatus(score: number | null, thresholds: ScoreThresholds): ScoreStatus {
  if (score === null || !Number.isFinite(score)) return "not-scored";
  if (score >= thresholds.onTrack) return "on-track";
  if (score >= thresholds.watch) return "watch";
  return "off-track";
}

function companyActual(kpi: Kpi, monthIndex: number): number | null {
  let actual = 0;
  for (const market of MARKETS) {
    const marketActual = kpi.actuals[market.code][monthIndex];
    if (marketActual === null || !Number.isFinite(marketActual)) return null;
    actual += marketActual * (market.salesWeight / 100);
  }
  return Number.isFinite(actual) ? actual : null;
}

function pointsChange(current: number | null, previous: number | null): number | null {
  return current === null || previous === null ? null : current - previous;
}

function weightedScore(entries: { score: number | null; weight: number }[]): number | null {
  let numerator = 0;
  let denominator = 0;
  for (const { score, weight } of entries) {
    if (score === null || weight <= 0) continue;
    numerator += score * weight;
    denominator += weight;
  }
  return denominator > 0 ? numerator / denominator : null;
}

function makeHistory(values: { actual: number | null; score: number | null }[]): MonthScore[] {
  return values.map((value, index) => ({
    ...value,
    monthIndex: index,
    change: index === 0 ? null : pointsChange(value.score, values[index - 1].score),
  }));
}

function aggregate(
  history: MonthScore[],
  monthIndex: number,
  thresholds: ScoreThresholds,
): AggregateScore {
  const current = history[monthIndex];
  return {
    score: current.score,
    change: current.change,
    status: getScoreStatus(current.score, thresholds),
    history,
  };
}

function countScores(kpis: KpiScore[]): ScoreCounts {
  return {
    total: kpis.length,
    scored: kpis.filter((result) => result.score !== null).length,
    onTrack: kpis.filter((result) => result.status === "on-track").length,
    watch: kpis.filter((result) => result.status === "watch").length,
    offTrack: kpis.filter((result) => result.status === "off-track").length,
    notScored: kpis.filter((result) => result.status === "not-scored").length,
  };
}

/** All summaries are computed before any native table search/filter row model runs. */
export function computeScorecard(state: ScorecardState, monthIndex: number): ComputedScorecard {
  assertMonth(monthIndex);
  validateScorecard(state);
  const kpis: KpiScore[] = state.kpis.map((kpi) => {
    const history = makeHistory(
      MONTHS.map((_, index) => {
        const actual = companyActual(kpi, index);
        return {
          actual,
          score: calculateProgress(actual, kpi.baseline, kpi.target, kpi.direction),
        };
      }),
    );
    const current = history[monthIndex];
    const markets = MARKETS.map((market) => {
      const actual = kpi.actuals[market.code][monthIndex];
      const score = calculateProgress(actual, kpi.baseline, kpi.target, kpi.direction);
      const previous =
        monthIndex === 0
          ? null
          : calculateProgress(
              kpi.actuals[market.code][monthIndex - 1],
              kpi.baseline,
              kpi.target,
              kpi.direction,
            );
      return {
        market,
        actual,
        score,
        status: getScoreStatus(score, state.thresholds),
        change: pointsChange(score, previous),
      };
    });
    let laggingMarket: KpiScore["laggingMarket"] = null;
    for (const market of markets) {
      if (
        market.score !== null &&
        (laggingMarket === null || market.score < laggingMarket.score!)
      ) {
        laggingMarket = market;
      }
    }
    return {
      ...aggregate(history, monthIndex, state.thresholds),
      kpi,
      owner: OWNERS.find((owner) => owner.id === kpi.ownerId) ?? null,
      actual: current.actual,
      toGo:
        current.actual === null
          ? null
          : Math.max(
              0,
              kpi.direction === "higher"
                ? kpi.target - current.actual
                : current.actual - kpi.target,
            ),
      markets,
      laggingMarket,
      offTrackMarkets: markets.filter((market) => market.status === "off-track").length,
    };
  });
  const objectives: ObjectiveScore[] = state.objectives.map((objective) => {
    const children = kpis.filter((result) => result.kpi.objectiveId === objective.id);
    const history = makeHistory(
      MONTHS.map((_, index) => ({
        actual: null,
        score: weightedScore(
          children.map((result) => ({
            score: result.history[index].score,
            weight: result.kpi.weight,
          })),
        ),
      })),
    );
    const kpiWeightTotal = children.reduce((sum, result) => sum + result.kpi.weight, 0);
    return {
      ...aggregate(history, monthIndex, state.thresholds),
      objective,
      counts: countScores(children),
      kpiWeightTotal,
      scoredWeightTotal: children.reduce(
        (sum, result) => sum + (result.score !== null ? result.kpi.weight : 0),
        0,
      ),
      weightWarning: Math.abs(kpiWeightTotal - 100) > 1e-8,
    };
  });
  const perspectives: PerspectiveScore[] = state.perspectives.map((perspective) => {
    const children = objectives.filter(
      (result) => result.objective.perspectiveId === perspective.id,
    );
    const history = makeHistory(
      MONTHS.map((_, index) => ({
        actual: null,
        score: weightedScore(
          children.map((result) => ({ score: result.history[index].score, weight: 1 })),
        ),
      })),
    );
    const childIds = new Set(children.map((result) => result.objective.id));
    return {
      ...aggregate(history, monthIndex, state.thresholds),
      perspective,
      counts: countScores(kpis.filter((result) => childIds.has(result.kpi.objectiveId))),
      objectiveCount: children.length,
    };
  });
  const history = makeHistory(
    MONTHS.map((_, index) => ({
      actual: null,
      score: weightedScore(
        perspectives.map((result) => ({
          score: result.history[index].score,
          weight: result.perspective.weight,
        })),
      ),
    })),
  );
  // Original footer market rollup: same hierarchy as the company score, applied
  // independently to each market's already-scored KPI values. Never sum units.
  const companyMarkets = MARKETS.map((market) => {
    const scoreAt = (previous: boolean): number | null =>
      weightedScore(
        state.perspectives.map((perspective) => ({
          weight: perspective.weight,
          score: weightedScore(
            state.objectives
              .filter((objective) => objective.perspectiveId === perspective.id)
              .map((objective) => ({
                weight: 1,
                score: weightedScore(
                  kpis
                    .filter((result) => result.kpi.objectiveId === objective.id)
                    .map((result) => {
                      const value = result.markets.find(
                        (entry) => entry.market.code === market.code,
                      );
                      const score = value?.score ?? null;
                      const change = value?.change ?? null;
                      return {
                        weight: result.kpi.weight,
                        score: previous
                          ? score === null || change === null
                            ? null
                            : score - change
                          : score,
                      };
                    }),
                ),
              })),
          ),
        })),
      );
    const score = scoreAt(false);
    return {
      market,
      actual: null,
      score,
      status: getScoreStatus(score, state.thresholds),
      change: pointsChange(score, scoreAt(true)),
    };
  });
  let weakestPerspective: PerspectiveScore | null = null;
  for (const perspective of perspectives) {
    if (
      perspective.score !== null &&
      (weakestPerspective === null || perspective.score < weakestPerspective.score!)
    ) {
      weakestPerspective = perspective;
    }
  }
  return {
    monthIndex,
    company: aggregate(history, monthIndex, state.thresholds),
    companyMarkets,
    offTrackMarkets: companyMarkets.filter((market) => market.status === "off-track").length,
    perspectives,
    objectives,
    kpis,
    counts: countScores(kpis),
    weakestPerspective,
    perspectiveWeightTotal: state.perspectives.reduce(
      (sum, perspective) => sum + perspective.weight,
      0,
    ),
  };
}

/** Native useTable consumes children via getSubRows; this only projects domain entities. */
export function buildScorecardRows(
  state: ScorecardState,
  monthIndex: number,
  compact = false,
): ScorecardRow[] {
  const computed = computeScorecard(state, monthIndex);
  const perspectiveRows = computed.perspectives.map((result): ScorecardRow => {
    const perspective = result.perspective;
    const objectiveRows = computed.objectives
      .filter((entry) => entry.objective.perspectiveId === perspective.id)
      .map((objectiveResult): ScorecardRow => {
        const objective = objectiveResult.objective;
        const kpiRows = computed.kpis
          .filter((entry) => entry.kpi.objectiveId === objective.id)
          .map((entry): ScorecardRow => {
            const kpi = entry.kpi;
            return {
              id: kpi.id,
              kind: "kpi",
              title: kpi.title,
              description: kpi.description,
              perspectiveId: perspective.id,
              perspectiveTitle: perspective.title,
              objectiveId: objective.id,
              objectiveTitle: objective.title,
              kpiId: kpi.id,
              owner: entry.owner,
              weight: kpi.weight,
              baseline: kpi.baseline,
              value: entry.actual,
              target: kpi.target,
              toGo: entry.toGo,
              score: entry.score,
              status: entry.status,
              change: entry.change,
              unit: kpi.unit,
              direction: kpi.direction,
              kpiCount: 1,
              scoredCount: entry.score === null ? 0 : 1,
              offTrackCount: entry.status === "off-track" ? 1 : 0,
              weightTotal: objectiveResult.kpiWeightTotal,
              weightWarning: objectiveResult.weightWarning,
              markets: entry.markets,
              months: entry.history,
              searchText: [
                kpi.title,
                kpi.description,
                objective.title,
                perspective.title,
                entry.owner?.name ?? "",
                SCORE_STATUS_LABELS[entry.status],
              ].join(" "),
              children: [],
            };
          });
        return {
          id: objective.id,
          kind: "objective",
          title: objective.title,
          description: objective.description,
          perspectiveId: perspective.id,
          perspectiveTitle: perspective.title,
          objectiveId: objective.id,
          objectiveTitle: objective.title,
          kpiId: null,
          owner: null,
          weight: null,
          baseline: null,
          value: null,
          target: null,
          toGo: null,
          score: objectiveResult.score,
          status: objectiveResult.status,
          change: objectiveResult.change,
          unit: null,
          direction: null,
          kpiCount: objectiveResult.counts.total,
          scoredCount: objectiveResult.counts.scored,
          offTrackCount: objectiveResult.counts.offTrack,
          weightTotal: objectiveResult.kpiWeightTotal,
          weightWarning: objectiveResult.weightWarning,
          markets: [],
          months: objectiveResult.history,
          searchText: [objective.title, objective.description, perspective.title].join(" "),
          children: kpiRows,
        };
      });
    return {
      id: perspective.id,
      kind: "perspective",
      title: perspective.title,
      description: perspective.description,
      perspectiveId: perspective.id,
      perspectiveTitle: perspective.title,
      objectiveId: null,
      objectiveTitle: "",
      kpiId: null,
      owner: null,
      weight: perspective.weight,
      baseline: null,
      value: null,
      target: null,
      toGo: null,
      score: result.score,
      status: result.status,
      change: result.change,
      unit: null,
      direction: null,
      kpiCount: result.counts.total,
      scoredCount: result.counts.scored,
      offTrackCount: result.counts.offTrack,
      weightTotal: computed.perspectiveWeightTotal,
      weightWarning: Math.abs(computed.perspectiveWeightTotal - 100) > 1e-8,
      markets: [],
      months: result.history,
      searchText: [perspective.title, perspective.description].join(" "),
      children: objectiveRows,
    };
  });
  return compact ? perspectiveRows : perspectiveRows.flatMap((row) => row.children);
}

function rowFilterValue(row: ScorecardRow, path: string[]): { known: boolean; value: unknown } {
  const values: Record<string, unknown> = {
    title: row.title,
    kpi: row.title,
    perspective: row.perspectiveId,
    perspectiveId: row.perspectiveId,
    perspectiveTitle: row.perspectiveTitle,
    objective: row.objectiveId,
    objectiveId: row.objectiveId,
    objectiveTitle: row.objectiveTitle,
    owner: row.owner?.id ?? null,
    ownerId: row.owner?.id ?? null,
    "owner.name": row.owner?.name ?? null,
    status: row.status,
    direction: row.direction,
    unit: row.unit,
    weight: row.weight,
    baseline: row.baseline,
    value: row.value,
    actual: row.value,
    target: row.target,
    toGo: row.toGo,
    progress: row.score,
    score: row.score,
    change: row.change,
    laggingMarket:
      row.markets.reduce<ScorecardRow["markets"][number] | null>(
        (lowest, market) =>
          market.score !== null && (lowest === null || market.score < lowest.score!)
            ? market
            : lowest,
        null,
      )?.market.code ?? null,
    offTrackMarkets: row.markets.filter((market) => market.status === "off-track").length,
  };
  const key = path.join(".");
  return { known: Object.prototype.hasOwnProperty.call(values, key), value: values[key] };
}

function fold(value: unknown): string {
  return String(value ?? "").toLocaleLowerCase("en");
}

function empty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function numericOperand(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = parseActual(value);
  return parsed.ok ? parsed.value : null;
}

/** undefined is an unfinished editor condition, not a false OR operand. */
function matchRule(row: ScorecardRow, rule: FilterRule): boolean | undefined {
  if (rule.operator === "" || rule.path.length === 0) return undefined;
  const resolved = rowFilterValue(row, rule.path);
  if (!resolved.known) return false;
  const actual = resolved.value;
  const expected = rule.value;
  let matched: boolean;
  if (rule.operator === "empty" || rule.operator === "not_empty") {
    matched = rule.operator === "empty" ? empty(actual) : !empty(actual);
  } else {
    if (expected === undefined || expected === null) return undefined;
    const values = Array.isArray(expected) ? expected : [expected];
    switch (rule.operator) {
      case "is":
        matched = fold(actual) === fold(expected);
        break;
      case "is_not":
        matched = fold(actual) !== fold(expected);
        break;
      case "is_any_of":
      case "in":
        matched = values.some((value) => fold(actual) === fold(value));
        break;
      case "is_none_of":
      case "not_in":
      case "notin":
        matched = values.every((value) => fold(actual) !== fold(value));
        break;
      case "contains":
        matched = fold(actual).includes(fold(expected));
        break;
      case "not_contains":
        matched = !fold(actual).includes(fold(expected));
        break;
      case "starts_with":
        matched = fold(actual).startsWith(fold(expected));
        break;
      case "ends_with":
        matched = fold(actual).endsWith(fold(expected));
        break;
      case "eq":
      case "neq":
      case "gt":
      case "gte":
      case "lt":
      case "lte":
      case "between":
      case "not_between": {
        const left = numericOperand(actual);
        const first = numericOperand(values[0]);
        const last = numericOperand(values[1]);
        if (
          first === null ||
          ((rule.operator === "between" || rule.operator === "not_between") && last === null)
        )
          return undefined;
        if (left === null) {
          matched = false;
          break;
        }
        switch (rule.operator) {
          case "eq":
            matched = left === first;
            break;
          case "neq":
            matched = left !== first;
            break;
          case "gt":
            matched = left > first;
            break;
          case "gte":
            matched = left >= first;
            break;
          case "lt":
            matched = left < first;
            break;
          case "lte":
            matched = left <= first;
            break;
          case "between":
            matched = left >= Math.min(first, last!) && left <= Math.max(first, last!);
            break;
          default:
            matched = left < Math.min(first, last!) || left > Math.max(first, last!);
        }
        break;
      }
      default:
        // Unsupported schema/operator is fail-closed, even when marked negated.
        return false;
    }
  }
  return rule.negated ? !matched : matched;
}

/** A domain predicate for the native free tree, never a replacement filtered-row engine. */
export function matchesScorecardQuery(row: ScorecardRow, query: FilterQuery): boolean {
  const visit = (node: FilterNode): boolean | undefined => {
    if (node.type === "rule") return matchRule(row, node);
    const results = node.rules.map(visit).filter((value): value is boolean => value !== undefined);
    if (results.length === 0) return undefined;
    return node.combinator === "or" ? results.some(Boolean) : results.every(Boolean);
  };
  return visit(query) ?? true;
}

function requireKpi(state: ScorecardState, kpiId: string): Kpi {
  const kpi = state.kpis.find((entry) => entry.id === kpiId);
  if (!kpi) throw new RangeError(`Unknown KPI: ${kpiId}`);
  return kpi;
}

export type KpiPatch = Partial<Omit<Kpi, "id">>;

export function updateKpi(state: ScorecardState, kpiId: string, patch: KpiPatch): ScorecardState {
  const current = requireKpi(state, kpiId);
  const next: Kpi = {
    ...current,
    ...patch,
    id: current.id,
    title: patch.title === undefined ? current.title : patch.title.trim(),
    actuals: cloneActuals(patch.actuals ?? current.actuals),
  };
  validateKpi(state, next);
  return { ...state, kpis: state.kpis.map((kpi) => (kpi.id === kpiId ? next : kpi)) };
}

export function writeKpiWeight(
  state: ScorecardState,
  kpiId: string,
  weight: number,
): ScorecardState {
  assertWeight(weight, "KPI weight");
  return updateKpi(state, kpiId, { weight });
}

/** Selected-month company editing preserves market gaps when the month is complete. */
export function writeCompanyActual(
  state: ScorecardState,
  kpiId: string,
  monthIndex: number,
  value: number | null,
): ScorecardState {
  assertMonth(monthIndex);
  if (value !== null) assertFinite(value, "Company actual");
  const current = requireKpi(state, kpiId);
  validateKpi(state, current);
  const before = companyActual(current, monthIndex);
  const delta = value === null || before === null ? null : value - before;
  if (delta !== null) assertFinite(delta, "Company actual change");
  const actuals = cloneActuals(current.actuals);
  for (const market of MARKETS) {
    const next =
      value === null ? null : delta === null ? value : actuals[market.code][monthIndex]! + delta;
    if (next !== null) assertFinite(next, `${market.code} actual`);
    actuals[market.code][monthIndex] = next;
  }
  return updateKpi(state, kpiId, { actuals });
}

export function addKpi(state: ScorecardState, kpi: Kpi): ScorecardState {
  if (
    [...state.perspectives, ...state.objectives, ...state.kpis].some((entry) => entry.id === kpi.id)
  ) {
    throw new RangeError("The new KPI needs a unique ID.");
  }
  const next = { ...kpi, title: kpi.title.trim(), actuals: cloneActuals(kpi.actuals) };
  validateKpi(state, next);
  return { ...state, kpis: [...state.kpis, next] };
}

export function removeKpi(state: ScorecardState, kpiId: string): ScorecardState {
  requireKpi(state, kpiId);
  // Empty objectives remain explicit, unscored domain entities.
  return { ...state, kpis: state.kpis.filter((kpi) => kpi.id !== kpiId) };
}

export type ParseActualResult = { ok: true; value: number | null } | { ok: false; error: string };

/** Parsing never turns blank/invalid input into zero; symbols require an explicit unit. */
export function parseActual(raw: string, unit?: ValueUnit): ParseActualResult {
  let text = raw.trim();
  if (text === "" || text === "—") return { ok: true, value: null };
  if (unit === "currency" || unit === "currency-million") {
    text = text.replace(/^([+-])\$\s*/, "$1").replace(/^\$\s*/, "");
  }
  const suffix: Partial<Record<ValueUnit, RegExp>> = {
    "currency-million": /\s*m$/i,
    percent: /\s*%$/,
    days: /\s*d$/i,
    hours: /\s*h$/i,
    minutes: /\s*min$/i,
    ratio: /\s*[x×]$/i,
    kg: /\s*kg$/i,
  };
  if (unit && suffix[unit]) text = text.replace(suffix[unit]!, "").trim();
  if (!/^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)$/.test(text)) {
    return {
      ok: false,
      error: "Enter a finite number in the KPI's displayed unit, or leave it blank.",
    };
  }
  const value = Number(text.replaceAll(",", ""));
  return Number.isFinite(value)
    ? { ok: true, value: Object.is(value, -0) ? 0 : value }
    : { ok: false, error: "The actual must be a finite number." };
}

export function formatValue(
  value: number | null,
  unit: ValueUnit,
  options: { compact?: boolean; digits?: number } = {},
): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const defaultDigits =
    unit === "currency-million" || unit === "currency" || unit === "ratio" || unit === "kg" ? 2 : 1;
  const digits =
    Number.isInteger(options.digits) && options.digits! >= 0 && options.digits! <= 8
      ? options.digits!
      : defaultDigits;
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  if (unit === "currency-million") return `$${number}M`;
  if (unit === "currency")
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: options.compact ? "compact" : "standard",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  const suffixes: Record<Exclude<ValueUnit, "currency" | "currency-million">, string> = {
    percent: "%",
    number: "",
    days: " d",
    hours: " h",
    minutes: " min",
    ratio: "×",
    kg: " kg",
  };
  return `${number}${suffixes[unit]}`;
}

/** Delta is progress points, with one display decimal; it is never percent growth. */
export function formatDelta(points: number | null): string {
  if (points === null || !Number.isFinite(points)) return "—";
  const rounded = Math.round(points * 10) / 10;
  const value = Object.is(rounded, -0) ? 0 : rounded;
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)} pts`;
}
