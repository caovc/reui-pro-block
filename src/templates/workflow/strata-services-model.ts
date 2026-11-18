import { useCallback, useMemo, useRef, useState } from "react";
import {
  STRATA_NOW_MS,
  STRATA_OWNERS,
  STRATA_SERVICES,
  strataOwner,
  strataService,
} from "./strata-domain.ts";
import {
  SLO_DAY_MS,
  aggregateSloEvents,
  evaluateSlo,
  sloDailyHistory,
  sloThreeDayBudgetHistory,
  validateSloDraft,
  type SloEventBucket,
  type SloEvaluation,
  type SloBudgetHistoryPeriod,
  type SloIndicator,
  type SloWindowDays,
  type StrataSloDefinition,
  type StrataSloDraft,
} from "./strata-slo-engine.ts";

interface SloSeed {
  definition: StrataSloDefinition;
  initialBudgetPct: number;
  estimatedRunwayDays: number;
}

export interface StrataSloRow extends StrataSloDefinition {
  evaluation: SloEvaluation;
  history: (number | null)[];
  budgetHistory: SloBudgetHistoryPeriod[];
  serviceName: string;
  team: string;
  ownerName: string;
  environment: string;
}

const dailyTraffic: Record<string, number> = {
  "checkout-api": 2_400_000,
  "payments-api": 1_650_000,
  "search-indexer": 740_000,
  "webhook-worker": 1_200_000,
  "otel-collector": 3_100_000,
  "status-renderer": 430_000,
  "email-sender": 610_000,
  "search-api": 1_800_000,
  "ledger-worker": 520_000,
  "warehouse-sync": 360_000,
  "edge-gateway": 2_800_000,
  "sandbox-api": 270_000,
};

export function strataSloDailyRequests(serviceId: string): number {
  return dailyTraffic[serviceId] ?? 0;
}

function seed(
  index: number,
  name: string,
  serviceId: string,
  indicator: SloIndicator,
  objectivePct: number,
  windowDays: SloWindowDays,
  initialBudgetPct: number,
  estimatedRunwayDays: number,
  muted = false,
): SloSeed {
  return {
    definition: {
      id: `SLO-${101 + index}`,
      name,
      serviceId,
      ownerId: strataService(serviceId)?.ownerId ?? STRATA_OWNERS[0].id,
      indicator,
      goodEvent:
        indicator === "availability"
          ? "Requests answered without a server error."
          : indicator === "latency"
            ? "Requests completed below the service latency target."
            : "Samples received before their freshness deadline.",
      objectivePct,
      windowDays,
      alertsEnabled: true,
      fastBurnEnabled: true,
      slowBurnEnabled: true,
      muted,
    },
    initialBudgetPct,
    estimatedRunwayDays,
  };
}

/** Independently authored services share the integrator's real service/owner IDs. */
function initialSeeds(): SloSeed[] {
  return [
    seed(0, "Search index freshness", "search-indexer", "freshness", 99, 7, -37.2, 0),
    seed(1, "Webhook delivery success", "webhook-worker", "availability", 99.9, 28, -25, 0),
    seed(2, "Ingest collector availability", "otel-collector", "availability", 99.9, 30, -8.8, 0),
    seed(3, "Checkout availability", "checkout-api", "availability", 99.9, 28, 6.1, 1),
    seed(4, "Checkout p95 latency", "checkout-api", "latency", 99, 28, 11.6, 4),
    seed(5, "Payment authorization success", "payments-api", "availability", 99.95, 30, 18, 6),
    seed(6, "Status page render latency", "status-renderer", "latency", 99, 28, 22.3, 7),
    seed(7, "Email sender success", "email-sender", "availability", 99.5, 28, 36.4, 15, true),
    seed(8, "Search query latency", "search-api", "latency", 99, 28, 47.2, 29),
    seed(9, "Ledger worker freshness", "ledger-worker", "freshness", 99, 7, 52.7, 8),
    seed(10, "Warehouse pipeline freshness", "warehouse-sync", "freshness", 98, 7, 54, 8, true),
    seed(11, "Webhook dispatch latency", "webhook-worker", "latency", 99.5, 28, 56.2, 49),
    seed(12, "Telemetry query latency", "otel-collector", "latency", 99, 28, 60.6, 38),
    seed(13, "Sandbox authentication success", "sandbox-api", "availability", 99.99, 30, 64.5, 53),
    seed(14, "Edge gateway availability", "edge-gateway", "availability", 99.99, 28, 70.5, 82),
    seed(15, "Edge cache availability", "edge-gateway", "availability", 99.95, 30, 77.6, 108),
    seed(16, "Sandbox API availability", "sandbox-api", "availability", 99.9, 30, 83.2, 166),
    seed(17, "Ledger schedule freshness", "ledger-worker", "freshness", 99.9, 7, 90.1, 63),
  ];
}

/** Independent authored daily bad-event counts, oldest first: days90 through4.
 * Generated and checked against the exact7/28/30/90-day aggregate counts in QA.
 * Hourly observations and every other SLO keep their original fixture generation.
 */
const STRATA_AUTHORED_DAILY_BAD_COUNTS: Readonly<Partial<Record<string, readonly number[]>>> = {
  "SLO-101": [
    3195, 3283, 3363, 3430, 3484, 3523, 3546, 3552, 3541, 3513, 3469, 3410, 3338, 3256, 3165, 3068,
    2968, 2868, 2770, 2678, 2594, 2521, 2460, 2413, 2383, 2369, 2372, 2392, 2428, 2480, 356029,
    2623, 2710, 2805, 2904, 3004, 3103, 3199, 3287, 3366, 3433, 3486, 3524, 3547, 3552, 3540, 3511,
    3467, 3407, 3335, 3253, 3161, 3064, 2964, 2864, 2766, 2675, 2591, 2518, 2458, 9086, 9448, 2369,
    2372, 2393, 2430, 2482, 2549, 2627, 2714, 2809, 2908, 3008, 3107, 3202, 3290, 3369, 3435, 3488,
    3526, 3547, 3552, 129023, 49780, 3464, 3405, 3332,
  ],
  "SLO-102": [
    452, 468, 485, 501, 516, 531, 544, 555, 564, 571, 575, 576, 574, 570, 563, 554, 543, 530, 515,
    499, 483, 467, 451, 436, 422, 410, 400, 392, 387, 384, 384, 387, 393, 401, 411, 424, 438, 453,
    469, 485, 501, 517, 531, 544, 555, 564, 571, 575, 576, 574, 570, 563, 554, 542, 529, 514, 499,
    483, 466, 49924, 1182, 1224, 25761, 400, 392, 387, 384, 385, 388, 393, 401, 412, 424, 438, 454,
    470, 486, 502, 518, 532, 545, 48, 48, 3216, 1072, 1072, 1072,
  ],
  "SLO-103": [
    3178, 3166, 2567, 3194, 3148, 2569, 3225, 3136, 2564, 3240, 3117, 2565, 3250, 3081, 2573, 3264,
    3062, 2576, 3273, 3049, 2603, 3286, 3029, 2609, 3308, 3015, 2595, 3319, 2996, 2619, 3325, 2957,
    2626, 3334, 2937, 2637, 3340, 2924, 2661, 3347, 2904, 2674, 3359, 2891, 2684, 3364, 2871, 2698,
    3366, 2834, 2709, 3369, 2816, 2724, 3371, 2803, 2756, 3372, 2785, 2773, 3574, 3574, 55365, 1168,
    1129, 1093, 1062, 1035, 1014, 1000, 993, 993, 1000, 1014, 1034, 1061, 1092, 1128, 1167, 1208,
    1250, 124, 124, 7151, 2383, 2383, 2385,
  ],
};

function buildLedger(item: SloSeed, index: number): SloEventBucket[] {
  const { definition, initialBudgetPct, estimatedRunwayDays } = item;
  const errorFraction = (100 - definition.objectivePct) / 100;
  const consumedRatio = 1 - initialBudgetPct / 100;
  const baselineBadRate = errorFraction * consumedRatio;
  const recentBurn =
    estimatedRunwayDays > 0
      ? ((initialBudgetPct / 100) * definition.windowDays) / estimatedRunwayDays
      : 0.5;
  const buckets: SloEventBucket[] = [];
  const append = (startMs: number, endMs: number, age: number, recent: boolean) => {
    const durationDays = (endMs - startMs) / SLO_DAY_MS;
    const total = Math.round(strataSloDailyRequests(definition.serviceId) * durationDays);
    const burn =
      recent && index === 3 && endMs > STRATA_NOW_MS - SLO_DAY_MS / 24
        ? 16
        : recent
          ? recentBurn
          : consumedRatio * (0.88 + 0.12 * Math.sin(age * 0.31 + index));
    buckets.push({
      sloId: definition.id,
      startMs,
      endMs,
      total,
      bad: Math.round(
        total * (recent ? errorFraction * burn : (baselineBadRate * burn) / consumedRatio),
      ),
    });
  };
  for (let day = 90; day > 3; day--) {
    append(STRATA_NOW_MS - day * SLO_DAY_MS, STRATA_NOW_MS - (day - 1) * SLO_DAY_MS, day, false);
  }
  for (let hour = 72; hour > 0; hour--) {
    append(
      STRATA_NOW_MS - (hour * SLO_DAY_MS) / 24,
      STRATA_NOW_MS - ((hour - 1) * SLO_DAY_MS) / 24,
      hour / 24,
      true,
    );
  }
  const authoredDailyBad = STRATA_AUTHORED_DAILY_BAD_COUNTS[definition.id];
  if (authoredDailyBad) {
    for (const [position, bad] of authoredDailyBad.entries()) buckets[position].bad = bad;
    return buckets;
  }
  // Calibrate the independent historical ledger once. All view-time numbers
  // are subsequently derived from real windowed counts, never scalar factors.
  const start = STRATA_NOW_MS - definition.windowDays * SLO_DAY_MS;
  const total = aggregateSloEvents(buckets, start, STRATA_NOW_MS).total;
  const recent = aggregateSloEvents(buckets, STRATA_NOW_MS - 3 * SLO_DAY_MS, STRATA_NOW_MS).bad;
  const adjustable = buckets.filter(
    (bucket) => bucket.startMs >= start && bucket.endMs <= STRATA_NOW_MS - 3 * SLO_DAY_MS,
  );
  const adjustableTotal = adjustable.reduce((sum, bucket) => sum + bucket.total, 0);
  let remaining = Math.round(total * baselineBadRate) - recent;
  for (const [position, bucket] of adjustable.entries()) {
    const bad =
      position === adjustable.length - 1
        ? remaining
        : Math.round(
            ((Math.round(total * baselineBadRate) - recent) * bucket.total) / adjustableTotal,
          );
    if (bad < 0 || bad > bucket.total) throw new RangeError("Invalid independent SLO fixture.");
    bucket.bad = bad;
    remaining -= bad;
  }
  return buckets;
}

export function createStrataSloState(): {
  definitions: StrataSloDefinition[];
  ledger: SloEventBucket[];
} {
  const seeds = initialSeeds();
  return {
    definitions: seeds.map((item) => item.definition),
    ledger: seeds.flatMap(buildLedger),
  };
}

export function selectStrataSloRows(
  definitions: readonly StrataSloDefinition[],
  ledger: readonly SloEventBucket[],
  overrides: { objectivePct?: number; windowDays?: SloWindowDays } = {},
): StrataSloRow[] {
  return definitions.map((definition) => {
    const service = strataService(definition.serviceId);
    const owner = strataOwner(definition.ownerId);
    return {
      ...definition,
      serviceName: service?.name ?? definition.serviceId,
      environment: service?.environment ?? "Production",
      team: owner?.team ?? "Unassigned",
      ownerName: owner?.name ?? "Unassigned",
      evaluation: evaluateSlo(definition, ledger, STRATA_NOW_MS, overrides),
      history: sloDailyHistory(definition, ledger, STRATA_NOW_MS),
      budgetHistory: sloThreeDayBudgetHistory(
        definition,
        ledger,
        STRATA_NOW_MS,
        overrides.objectivePct,
      ),
    };
  });
}

/** The pinned checkout entry supplies a visible, editable search query only. */
export function strataServicesPresetQuery(serviceId?: string): string {
  return serviceId ? (strataService(serviceId)?.name ?? "") : "";
}

export function matchStrataSloRows(
  rows: readonly StrataSloRow[],
  query = "",
  team = "all",
): StrataSloRow[] {
  const needle = query.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (team === "all" || row.team === team) &&
      (!needle ||
        [row.name, row.serviceName, row.ownerName, row.team].some((value) =>
          value.toLowerCase().includes(needle),
        )),
  );
}

export function useStrataServicesModel() {
  const [state, setState] = useState(createStrataSloState);
  const sequence = useRef(119);
  const createSlo = useCallback((draft: StrataSloDraft) => {
    const errors = validateSloDraft(
      draft,
      STRATA_SERVICES.map((service) => service.id),
      STRATA_OWNERS.map((owner) => owner.id),
    );
    if (Object.keys(errors).length) return { ok: false as const, errors };
    const definition: StrataSloDefinition = {
      ...draft,
      id: `SLO-${sequence.current++}`,
      name: draft.name.trim(),
      goodEvent: draft.goodEvent.trim(),
      muted: false,
    };
    setState((current) => ({ ...current, definitions: [...current.definitions, definition] }));
    return { ok: true as const, definition };
  }, []);
  const setMuted = useCallback((id: string, muted: boolean) => {
    setState((current) => ({
      ...current,
      definitions: current.definitions.map((definition) =>
        definition.id === id ? { ...definition, muted } : definition,
      ),
    }));
  }, []);
  const rows = useMemo(() => selectStrataSloRows(state.definitions, state.ledger), [state]);
  return { ...state, rows, createSlo, setMuted };
}
