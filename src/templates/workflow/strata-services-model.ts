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
  validateSloDraft,
  type SloEventBucket,
  type SloEvaluation,
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
