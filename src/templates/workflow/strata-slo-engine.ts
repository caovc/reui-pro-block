/** Pure event-budget math for the independent Bricklane observability demo. */
export const SLO_DAY_MS = 86_400_000;
export const SLO_OBJECTIVES = [99, 99.5, 99.9, 99.95, 99.99] as const;
export const SLO_WINDOWS = [7, 28, 30] as const;
export type SloWindowDays = (typeof SLO_WINDOWS)[number];
export type SloIndicator = "availability" | "latency" | "freshness";
export type SloHealth = "exhausted" | "at-risk" | "healthy" | "no-data";
export type SloAlert = "paging" | "ticket" | "quiet" | "muted";

export interface StrataSloDefinition {
  id: string;
  name: string;
  serviceId: string;
  ownerId: string;
  indicator: SloIndicator;
  goodEvent: string;
  objectivePct: number;
  windowDays: SloWindowDays;
  alertsEnabled: boolean;
  fastBurnEnabled: boolean;
  slowBurnEnabled: boolean;
  muted: boolean;
}

export type StrataSloDraft = Omit<StrataSloDefinition, "id" | "muted">;

/** Counts cover [startMs, endMs). Partial-bin queries assume uniform traffic. */
export interface SloEventBucket {
  sloId: string;
  startMs: number;
  endMs: number;
  total: number;
  bad: number;
}

export interface SloBudget {
  total: number;
  bad: number;
  allowedBad: number;
  remainingBad: number;
  observedGoodPct: number | null;
  remainingPct: number | null;
  burnRate: number | null;
}

export interface SloEvaluation extends SloBudget {
  objectivePct: number;
  windowDays: SloWindowDays;
  health: SloHealth;
  alert: SloAlert;
  burn1h: number | null;
  burn6h: number | null;
  burn3d: number | null;
  runwayDays: number | null;
}

function validObjective(objectivePct: number): number {
  if (!Number.isFinite(objectivePct) || objectivePct <= 0 || objectivePct >= 100) {
    throw new RangeError("An SLO objective must be above 0 and below 100 percent.");
  }
  return (100 - objectivePct) / 100;
}

function validCounts(total: number, bad: number): void {
  if (!Number.isFinite(total) || !Number.isFinite(bad) || total < 0 || bad < 0 || bad > total) {
    throw new RangeError("Event counts must be finite and satisfy 0 ≤ bad ≤ total.");
  }
}

function validWindow(windowDays: SloWindowDays): SloWindowDays {
  if (!SLO_WINDOWS.includes(windowDays))
    throw new RangeError("An SLO window must be 7, 28 or 30 days.");
  return windowDays;
}

export function calculateSloBudget(objectivePct: number, total: number, bad: number): SloBudget {
  const errorFraction = validObjective(objectivePct);
  validCounts(total, bad);
  const allowedBad = total * errorFraction;
  const remainingBad = allowedBad - bad;
  return {
    total,
    bad,
    allowedBad,
    remainingBad,
    observedGoodPct: total ? ((total - bad) / total) * 100 : null,
    // A spent budget may be below -100%. It is never clamped for presentation.
    remainingPct: allowedBad ? (remainingBad / allowedBad) * 100 : null,
    burnRate: total ? bad / total / errorFraction : null,
  };
}

export function aggregateSloEvents(
  buckets: readonly SloEventBucket[],
  startMs: number,
  endMs: number,
): { total: number; bad: number } {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new RangeError("An event window must have finite, increasing endpoints.");
  }
  let total = 0;
  let bad = 0;
  for (const bucket of buckets) {
    validCounts(bucket.total, bucket.bad);
    if (
      !Number.isFinite(bucket.startMs) ||
      !Number.isFinite(bucket.endMs) ||
      bucket.endMs <= bucket.startMs
    ) {
      throw new RangeError("Event buckets need finite, increasing endpoints.");
    }
    const overlap = Math.min(endMs, bucket.endMs) - Math.max(startMs, bucket.startMs);
    if (overlap <= 0) continue;
    const fraction = overlap / (bucket.endMs - bucket.startMs);
    total += bucket.total * fraction;
    bad += bucket.bad * fraction;
  }
  return { total, bad };
}

export function sloOutageAllowanceSeconds(objectivePct: number, windowDays: SloWindowDays): number {
  return (SLO_DAY_MS / 1000) * validWindow(windowDays) * validObjective(objectivePct);
}

export function sloRequestAllowance(
  objectivePct: number,
  windowDays: SloWindowDays,
  requestsPerDay: number,
): number {
  if (!Number.isFinite(requestsPerDay) || requestsPerDay < 0) {
    throw new RangeError("Estimated daily requests must be finite and nonnegative.");
  }
  return requestsPerDay * validWindow(windowDays) * validObjective(objectivePct);
}

/** Local policy: under 30% is at risk. The source's exact cutoff was not probed. */
export function classifySloBudget(remainingPct: number | null): SloHealth {
  if (remainingPct === null) return "no-data";
  if (remainingPct <= 0) return "exhausted";
  return remainingPct < 30 ? "at-risk" : "healthy";
}

export function evaluateSlo(
  definition: StrataSloDefinition,
  buckets: readonly SloEventBucket[],
  nowMs: number,
  overrides: { objectivePct?: number; windowDays?: SloWindowDays } = {},
): SloEvaluation {
  const objectivePct = overrides.objectivePct ?? definition.objectivePct;
  const windowDays = validWindow(overrides.windowDays ?? definition.windowDays);
  const ownBuckets = buckets.filter((bucket) => bucket.sloId === definition.id);
  const window = aggregateSloEvents(ownBuckets, nowMs - windowDays * SLO_DAY_MS, nowMs);
  const budget = calculateSloBudget(objectivePct, window.total, window.bad);
  const burn = (milliseconds: number) => {
    const events = aggregateSloEvents(ownBuckets, nowMs - milliseconds, nowMs);
    return calculateSloBudget(objectivePct, events.total, events.bad).burnRate;
  };
  const burn1h = burn(SLO_DAY_MS / 24);
  const burn6h = burn(SLO_DAY_MS / 4);
  const burn3d = burn(SLO_DAY_MS * 3);
  const recent = aggregateSloEvents(ownBuckets, nowMs - SLO_DAY_MS, nowMs);
  const badPerDay = recent.bad;
  const runwayDays =
    budget.remainingPct === null
      ? null
      : budget.remainingBad <= 0
        ? 0
        : badPerDay > 0
          ? budget.remainingBad / badPerDay
          : null;
  const paging = definition.fastBurnEnabled && ((burn1h ?? 0) > 14.4 || (burn6h ?? 0) > 6);
  const ticket = definition.slowBurnEnabled && (burn3d ?? 0) > 1;
  const alert: SloAlert = definition.muted
    ? "muted"
    : !definition.alertsEnabled
      ? "quiet"
      : paging
        ? "paging"
        : ticket
          ? "ticket"
          : "quiet";
  return {
    ...budget,
    objectivePct,
    windowDays,
    health: classifySloBudget(budget.remainingPct),
    alert,
    burn1h,
    burn6h,
    burn3d,
    runwayDays,
  };
}

export function sloDailyHistory(
  definition: StrataSloDefinition,
  buckets: readonly SloEventBucket[],
  nowMs: number,
  days = 90,
): (number | null)[] {
  const ownBuckets = buckets.filter((bucket) => bucket.sloId === definition.id);
  return Array.from({ length: days }, (_, index) => {
    const end = nowMs - (days - index - 1) * SLO_DAY_MS;
    const counts = aggregateSloEvents(ownBuckets, end - SLO_DAY_MS, end);
    return counts.total ? ((counts.total - counts.bad) / counts.total) * 100 : null;
  });
}

export function validateSloDraft(
  draft: StrataSloDraft,
  serviceIds: readonly string[],
  ownerIds: readonly string[],
): Partial<Record<keyof StrataSloDraft, string>> {
  const errors: Partial<Record<keyof StrataSloDraft, string>> = {};
  if (!draft.name.trim()) errors.name = "Enter an SLO name.";
  if (!serviceIds.includes(draft.serviceId)) errors.serviceId = "Choose an existing service.";
  if (!ownerIds.includes(draft.ownerId)) errors.ownerId = "Choose an owner.";
  if (!SLO_OBJECTIVES.some((value) => value === draft.objectivePct)) {
    errors.objectivePct = "Choose one of the available objectives.";
  }
  if (!SLO_WINDOWS.includes(draft.windowDays)) errors.windowDays = "Choose 7, 28 or 30 days.";
  if (!["availability", "latency", "freshness"].includes(draft.indicator)) {
    errors.indicator = "Choose an indicator.";
  }
  return errors;
}

export function formatSloBudget(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatSloRunway(
  evaluation: Pick<SloEvaluation, "remainingPct" | "runwayDays">,
): string {
  if (evaluation.remainingPct !== null && evaluation.remainingPct <= 0) return "Spent";
  if (evaluation.runwayDays === null) return "—";
  const days = Math.max(1, Math.round(evaluation.runwayDays));
  return `${days} ${days === 1 ? "day" : "days"}`;
}
