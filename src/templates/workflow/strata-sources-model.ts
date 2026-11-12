import { useMemo, useState } from "react";
import type { FilterNode, FilterQuery } from "@/components/reui/filters/filters-types";
import {
  STRATA_INCIDENT_ID,
  STRATA_NOW_MS,
  strataOwner,
  type StrataEnvironment,
  type StrataEnvironmentFilter,
} from "./strata-domain.ts";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const STRATA_SOURCE_CATEGORIES = ["Databases", "Warehouses", "Apps", "Files"] as const;
export type StrataSourceCategory = (typeof STRATA_SOURCE_CATEGORIES)[number];
export type StrataSourceHealth = "Healthy" | "Degraded" | "Failing" | "Paused";
export type StrataDatasetState = "in-sync" | "drifted" | "unlinked";
export type StrataSourceQuery = FilterQuery<string | string[]>;

export interface StrataSourceDataset {
  id: string;
  name: string;
  state: StrataDatasetState;
}

export interface StrataSource {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  category: StrataSourceCategory;
  environment: StrataEnvironment;
  ownerId: string;
  serviceId: string | null;
  syncEnabled: boolean;
  connectorHealth: Exclude<StrataSourceHealth, "Paused">;
  tokenExpiring: boolean;
  cadence: string;
  lastAttemptMs: number;
  datasets: StrataSourceDataset[];
  linkedLastWeek: number;
  healthyYesterday: boolean;
}

export interface StrataSourceRun {
  id: string;
  sourceId: string;
  atMs: number;
  outcome: "Succeeded" | "Slow" | "Failed";
  rows: number;
  ownerId: string;
  incidentId: string | null;
  origin: "fixture" | "local";
}

export interface StrataSourceDay {
  sourceId: string;
  atMs: number;
  rows: number;
  failed: number;
}

export interface StrataSourcesState {
  sources: StrataSource[];
  runs: StrataSourceRun[];
  history: StrataSourceDay[];
  sequence: number;
}

type SourceSeed = Omit<StrataSource, "id" | "datasets" | "lastAttemptMs"> & {
  minutesAgo: number;
  datasetNames: string[];
  linked: number;
  drifted?: number;
};

function makeSource(seed: SourceSeed): StrataSource {
  const { minutesAgo, datasetNames, linked, drifted, ...source } = seed;
  return {
    ...source,
    id: source.name,
    lastAttemptMs: STRATA_NOW_MS - minutesAgo * 60_000,
    datasets: datasetNames.map((name, index) => ({
      id: `${source.name}-dataset-${index + 1}`,
      name,
      state: index >= linked ? "unlinked" : index === drifted ? "drifted" : "in-sync",
    })),
  };
}

/** Independent local connector records. Only the first dataset names/counts were visible.
 * Additional dataset names, identities, environments and traffic are demo fixtures.
 */
function initialSources(): StrataSource[] {
  return [
    {
      name: "search-db",
      provider: "Supabase",
      endpoint: "search-db.demo.internal",
      category: "Databases",
      environment: "Production",
      ownerId: "eli",
      serviceId: "search-indexer",
      syncEnabled: true,
      connectorHealth: "Failing",
      tokenExpiring: false,
      cadence: "Every 15m",
      minutesAgo: 9,
      datasetNames: [
        "public.query_stats",
        "public.documents",
        "public.index_runs",
        "public.search_errors",
      ],
      linked: 3,
      linkedLastWeek: 3,
      healthyYesterday: false,
    },
    {
      name: "checkout-db",
      provider: "Neon",
      endpoint: "checkout.demo.internal",
      category: "Databases",
      environment: "Production",
      ownerId: "maya",
      serviceId: "checkout-api",
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Every 15m",
      minutesAgo: 9,
      datasetNames: [
        "public.orders",
        "public.line_items",
        "public.sessions",
        "public.refunds",
        "public.carts",
        "public.discounts",
      ],
      linked: 4,
      linkedLastWeek: 4,
      healthyYesterday: true,
    },
    {
      name: "checkout-db-staging",
      provider: "Neon",
      endpoint: "checkout-staging.demo.internal",
      category: "Databases",
      environment: "Staging",
      ownerId: "maya",
      serviceId: "checkout-api",
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Hourly",
      minutesAgo: 47,
      datasetNames: ["public.orders", "public.sessions", "public.line_items"],
      linked: 2,
      linkedLastWeek: 2,
      healthyYesterday: true,
    },
    {
      name: "edge-rate-limits",
      provider: "Redis",
      endpoint: "edge-ratelimit.demo.internal:6380",
      category: "Databases",
      environment: "Production",
      ownerId: "owen",
      serviceId: "otel-collector",
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Streaming",
      minutesAgo: 4,
      datasetNames: ["ratelimit:*", "edge:quotas", "edge:blocks"],
      linked: 2,
      linkedLastWeek: 2,
      healthyYesterday: true,
    },
    {
      name: "identity-db",
      provider: "PlanetScale",
      endpoint: "identity.demo.internal",
      category: "Databases",
      environment: "Production",
      ownerId: "noah",
      serviceId: null,
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Hourly",
      minutesAgo: 49,
      datasetNames: ["tenants", "users", "memberships", "sessions"],
      linked: 3,
      linkedLastWeek: 3,
      healthyYesterday: true,
    },
    {
      name: "telemetry-warehouse",
      provider: "BigQuery",
      endpoint: "bricklane-telemetry",
      category: "Warehouses",
      environment: "Production",
      ownerId: "luca",
      serviceId: "warehouse-sync",
      syncEnabled: true,
      connectorHealth: "Degraded",
      tokenExpiring: false,
      cadence: "Every 6h",
      minutesAgo: 179,
      datasetNames: [
        "strata.service_rollups_daily",
        "strata.traces",
        "strata.request_totals",
        "strata.costs",
        "strata.deployments",
      ],
      linked: 3,
      linkedLastWeek: 2,
      healthyYesterday: true,
    },
    {
      name: "sre-slack",
      provider: "Slack",
      endpoint: "bricklane-demo.slack.com",
      category: "Apps",
      environment: "Production",
      ownerId: "owen",
      serviceId: null,
      syncEnabled: false,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Every 15m",
      minutesAgo: 1209,
      datasetNames: ["channels", "messages"],
      linked: 2,
      linkedLastWeek: 2,
      healthyYesterday: true,
    },
    {
      name: "acme-github",
      provider: "GitHub",
      endpoint: "github.com/bricklane-demo",
      category: "Apps",
      environment: "Production",
      ownerId: "noah",
      serviceId: null,
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Every 15m",
      minutesAgo: 9,
      datasetNames: ["deployments", "pull_requests", "workflow_runs", "repositories"],
      linked: 3,
      linkedLastWeek: 2,
      healthyYesterday: true,
    },
    {
      name: "incident-tracker",
      provider: "Linear",
      endpoint: "linear.app/bricklane-demo",
      category: "Apps",
      environment: "Production",
      ownerId: "owen",
      serviceId: null,
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: true,
      cadence: "Hourly",
      minutesAgo: 44,
      datasetNames: ["issues", "projects", "cycles"],
      linked: 1,
      linkedLastWeek: 1,
      healthyYesterday: true,
    },
    {
      name: "stripe-live",
      provider: "Stripe",
      endpoint: "bricklane_payments (demo)",
      category: "Apps",
      environment: "Production",
      ownerId: "sofia",
      serviceId: "payments-api",
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Hourly",
      minutesAgo: 54,
      datasetNames: [
        "balance_transactions",
        "charges",
        "refunds",
        "payouts",
        "disputes",
        "customers",
      ],
      linked: 4,
      linkedLastWeek: 4,
      healthyYesterday: true,
    },
    {
      name: "stripe-sandbox",
      provider: "Stripe",
      endpoint: "bricklane_payments (test mode)",
      category: "Apps",
      environment: "Sandbox",
      ownerId: "sofia",
      serviceId: "sandbox-api",
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Hourly",
      minutesAgo: 51,
      datasetNames: ["charges", "refunds", "customers"],
      linked: 2,
      linkedLastWeek: 2,
      healthyYesterday: true,
    },
    {
      name: "cdn-log-exports",
      provider: "Dropbox",
      endpoint: "/Bricklane Edge/CDN logs",
      category: "Files",
      environment: "Production",
      ownerId: "iris",
      serviceId: "status-renderer",
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Hourly",
      minutesAgo: 57,
      datasetNames: ["/cdn-logs/frankfurt", "/cdn-logs/dublin", "/cdn-logs/archive"],
      linked: 2,
      linkedLastWeek: 2,
      healthyYesterday: true,
    },
    {
      name: "sre-planning-sheets",
      provider: "Google Drive",
      endpoint: "SRE Planning",
      category: "Files",
      environment: "Production",
      ownerId: "leila",
      serviceId: "warehouse-sync",
      syncEnabled: true,
      connectorHealth: "Healthy",
      tokenExpiring: false,
      cadence: "Daily",
      minutesAgo: 779,
      datasetNames: ["Capacity plan 2026-Q4", "On-call coverage", "Migration checklist"],
      linked: 2,
      drifted: 0,
      linkedLastWeek: 2,
      healthyYesterday: true,
    },
  ].map((seed) => makeSource(seed as SourceSeed));
}

export function strataSourceHealth(source: StrataSource): StrataSourceHealth {
  return source.syncEnabled ? source.connectorHealth : "Paused";
}

export function createStrataSourcesState(): StrataSourcesState {
  const sources = initialSources();
  const counts = [
    35, 35, 34, 36, 30, 30, 30, 29, 30, 30, 31, 29, 31, 30, 30, 30, 31, 30, 30, 30, 31, 30, 30, 29,
  ];
  const runs: StrataSourceRun[] = [];
  const append = (source: StrataSource, atMs: number, outcome: StrataSourceRun["outcome"]) => {
    runs.push({
      id: `source-run-${runs.length + 1}`,
      sourceId: source.id,
      atMs,
      outcome,
      rows: 0,
      ownerId: source.ownerId,
      incidentId: source.serviceId === "checkout-api" ? STRATA_INCIDENT_ID : null,
      origin: "fixture",
    });
  };
  for (const source of sources)
    append(
      source,
      source.lastAttemptMs,
      source.connectorHealth === "Failing"
        ? "Failed"
        : source.connectorHealth === "Degraded"
          ? "Slow"
          : "Succeeded",
    );
  let extraIndex = 0;
  for (let hour = 0; hour < 24; hour++) {
    const start = STRATA_NOW_MS - DAY + hour * HOUR;
    const seeds = runs.filter((run) => run.atMs >= start && run.atMs < start + HOUR).length;
    for (let index = 0; index < counts[hour] - seeds; index++, extraIndex++) {
      const atMs = start + Math.floor(((index + 1) / (counts[hour] + 1)) * HOUR);
      const candidates = sources.filter((source) => source.lastAttemptMs > atMs);
      const failed = [55, 130, 280, 460].includes(extraIndex);
      const source = failed ? sources[0] : candidates[(extraIndex + hour) % candidates.length];
      append(source, atMs, failed ? "Failed" : extraIndex % 100 === 70 ? "Slow" : "Succeeded");
    }
  }
  const landed = runs.filter((run) => run.outcome !== "Failed");
  const weight = (run: StrataSourceRun) => {
    const source = sources.find((item) => item.id === run.sourceId)!;
    return source.category === "Warehouses"
      ? 12
      : source.category === "Databases"
        ? 9
        : source.category === "Files"
          ? 4
          : 1;
  };
  const totalWeight = landed.reduce((sum, run) => sum + weight(run), 0);
  for (const run of landed) run.rows = Math.floor((9_040_000 * weight(run)) / totalWeight);
  const remainder = 9_040_000 - landed.reduce((sum, run) => sum + run.rows, 0);
  for (let index = 0; index < remainder; index++) landed[index].rows++;
  const rowDays = [
    5_300_000, 5_600_000, 5_100_000, 5_900_000, 6_200_000, 4_900_000, 4_700_000, 6_400_000,
    6_800_000, 6_700_000, 7_100_000, 7_800_000, 8_064_228,
  ];
  const failedDays = [0, 1, 0, 0, 2, 1, 0, 1, 0, 3, 2, 0, 2];
  const history: StrataSourceDay[] = [];
  for (let day = 0; day < 13; day++) {
    let assigned = 0;
    sources.forEach((source, index) => {
      const currentRows = runs
        .filter((run) => run.sourceId === source.id)
        .reduce((sum, run) => sum + run.rows, 0);
      const rows =
        index === sources.length - 1
          ? rowDays[day] - assigned
          : Math.floor((rowDays[day] * currentRows) / 9_040_000);
      assigned += rows;
      history.push({
        sourceId: source.id,
        atMs: STRATA_NOW_MS - (13 - day) * DAY,
        rows,
        failed: index === 0 ? failedDays[day] : 0,
      });
    });
  }
  return { sources, runs, history, sequence: runs.length + 1 };
}

export function setStrataSourceEnabled(
  state: StrataSourcesState,
  sourceId: string,
  enabled: boolean,
): StrataSourcesState {
  if (!state.sources.some((source) => source.id === sourceId && source.syncEnabled !== enabled))
    return state;
  return {
    ...state,
    sources: state.sources.map((source) =>
      source.id === sourceId ? { ...source, syncEnabled: enabled } : source,
    ),
  };
}

/** Local ledger action. A failed credential remains failed; schema drift is not repaired. */
export function syncStrataSources(
  state: StrataSourcesState,
  ids: readonly string[],
  now = STRATA_NOW_MS,
): StrataSourcesState {
  if (!Number.isFinite(now)) throw new RangeError("Sync time must be finite");
  const selected = new Set(ids);
  const eligible = state.sources.filter((source) => selected.has(source.id) && source.syncEnabled);
  if (!eligible.length) return state;
  const added: StrataSourceRun[] = eligible.map((source, index) => ({
    id: `source-local-${state.sequence + index}`,
    sourceId: source.id,
    atMs: now,
    outcome:
      source.connectorHealth === "Failing"
        ? "Failed"
        : source.connectorHealth === "Degraded"
          ? "Slow"
          : "Succeeded",
    rows:
      source.connectorHealth === "Failing"
        ? 0
        : source.datasets.filter((dataset) => dataset.state !== "unlinked").length * 12_000,
    ownerId: source.ownerId,
    incidentId: source.serviceId === "checkout-api" ? STRATA_INCIDENT_ID : null,
    origin: "local",
  }));
  return {
    ...state,
    sequence: state.sequence + added.length,
    runs: [...state.runs, ...added],
    sources: state.sources.map((source) =>
      eligible.includes(source)
        ? { ...source, lastAttemptMs: Math.max(source.lastAttemptMs, now) }
        : source,
    ),
  };
}

export function strataSourceAttention(sources: readonly StrataSource[]) {
  return sources
    .flatMap((source) => {
      const health = strataSourceHealth(source);
      const issue =
        health === "Failing"
          ? { label: "Failing", action: "Rotate", priority: 0 }
          : health === "Degraded"
            ? { label: "Degraded", action: "Review", priority: 1 }
            : source.tokenExpiring
              ? { label: "Token Expiring", action: "Renew", priority: 2 }
              : source.datasets.some((dataset) => dataset.state === "drifted")
                ? { label: "Schema Drift", action: "Review", priority: 3 }
                : health === "Paused"
                  ? { label: "Paused", action: "Resume", priority: 4 }
                  : null;
      return issue ? [{ ...issue, source }] : [];
    })
    .sort((a, b) => a.priority - b.priority || a.source.name.localeCompare(b.source.name));
}

export function strataSourcesMetrics(
  state: StrataSourcesState,
  environment: StrataEnvironmentFilter = "all",
  now = STRATA_NOW_MS,
) {
  const sources = state.sources.filter(
    (source) => environment === "all" || source.environment === environment,
  );
  const ids = new Set(sources.map((source) => source.id));
  const runs = state.runs.filter(
    (run) => ids.has(run.sourceId) && run.atMs > now - DAY && run.atMs <= now,
  );
  const health = { Healthy: 0, Degraded: 0, Failing: 0, Paused: 0 };
  const datasets = { "in-sync": 0, drifted: 0, unlinked: 0 };
  sources.forEach((source) => {
    health[strataSourceHealth(source)]++;
    source.datasets.forEach((dataset) => datasets[dataset.state]++);
  });
  const rows = runs.reduce((sum, run) => sum + run.rows, 0);
  const failed = runs.filter((run) => run.outcome === "Failed").length;
  const daily = Array.from({ length: 13 }, (_, index) => {
    const atMs = STRATA_NOW_MS - (13 - index) * DAY;
    const items = state.history.filter((day) => ids.has(day.sourceId) && day.atMs === atMs);
    return {
      rows: items.reduce((sum, day) => sum + day.rows, 0),
      failed: items.reduce((sum, day) => sum + day.failed, 0),
    };
  });
  daily.push({ rows, failed });
  const hours = Array.from({ length: 24 }, (_, index) => {
    const from = now - DAY + index * HOUR;
    const items = runs.filter((run) => run.atMs > from && run.atMs <= from + HOUR);
    const end = from + HOUR;
    const byOutcome = ["Succeeded", "Slow", "Failed"] as const;
    return {
      label: index === 23 ? "Now" : new Date(end).toISOString().slice(11, 16),
      counts: byOutcome.map((outcome) => items.filter((run) => run.outcome === outcome).length),
      rows: byOutcome.map((outcome) =>
        items.filter((run) => run.outcome === outcome).reduce((sum, run) => sum + run.rows, 0),
      ),
    };
  });
  return {
    sources,
    health,
    datasets,
    rows,
    failed,
    daily,
    hours,
    linked: datasets["in-sync"] + datasets.drifted,
    totalDatasets: Object.values(datasets).reduce((sum, count) => sum + count, 0),
    totalRuns: runs.length,
    landedPct: runs.length ? ((runs.length - failed) / runs.length) * 100 : null,
    healthyYesterday: sources.filter((source) => source.healthyYesterday).length,
    linkedLastWeek: sources.reduce((sum, source) => sum + source.linkedLastWeek, 0),
    attention: strataSourceAttention(sources),
  };
}

export function matchesStrataSourceQuery(
  source: StrataSource,
  node: FilterNode<string | string[]>,
): boolean {
  if (node.type === "group") {
    if (!node.rules.length) return true;
    return node.combinator === "or"
      ? node.rules.some((rule) => matchesStrataSourceQuery(source, rule))
      : node.rules.every((rule) => matchesStrataSourceQuery(source, rule));
  }
  const field = node.path[0];
  if (
    ![
      "empty",
      "not_empty",
      "is",
      "is_any_of",
      "is_not",
      "is_none_of",
      "contains",
      "not_contains",
      "starts_with",
      "ends_with",
    ].includes(node.operator)
  )
    return false;
  const raw =
    field === "health"
      ? strataSourceHealth(source)
      : field === "ownerId"
        ? source.ownerId
        : field === "provider"
          ? source.provider
          : field === "environment"
            ? source.environment
            : field === "name"
              ? source.name
              : undefined;
  if (raw === undefined) return false;
  const content = raw.toLowerCase();
  const values = (Array.isArray(node.value) ? node.value : [node.value])
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());
  const value = values[0] ?? "";
  const result =
    node.operator === "empty"
      ? !content
      : node.operator === "not_empty"
        ? !!content
        : !values.length
          ? true
          : node.operator === "is" || node.operator === "is_any_of"
            ? values.includes(content)
            : node.operator === "is_not" || node.operator === "is_none_of"
              ? !values.includes(content)
              : node.operator === "contains"
                ? content.includes(value)
                : node.operator === "not_contains"
                  ? !content.includes(value)
                  : node.operator === "starts_with"
                    ? content.startsWith(value)
                    : node.operator === "ends_with"
                      ? content.endsWith(value)
                      : false;
  return node.negated ? !result : result;
}

export function selectStrataSources(
  sources: readonly StrataSource[],
  options: {
    environment?: StrataEnvironmentFilter;
    search?: string;
    categories?: readonly StrataSourceCategory[];
    unhealthy?: boolean;
    query?: StrataSourceQuery;
  } = {},
) {
  const search = options.search?.trim().toLowerCase() ?? "";
  const rank = { Failing: 0, Degraded: 1, Paused: 2, Healthy: 3 };
  return sources
    .filter((source) => {
      if (
        options.environment &&
        options.environment !== "all" &&
        source.environment !== options.environment
      )
        return false;
      if (options.categories && !options.categories.includes(source.category)) return false;
      if (options.unhealthy && !["Failing", "Degraded"].includes(strataSourceHealth(source)))
        return false;
      if (options.query && !matchesStrataSourceQuery(source, options.query)) return false;
      return (
        !search ||
        [
          source.name,
          source.provider,
          source.endpoint,
          strataOwner(source.ownerId)?.name,
          ...source.datasets.map((dataset) => dataset.name),
        ].some((value) => value?.toLowerCase().includes(search))
      );
    })
    .sort(
      (a, b) =>
        STRATA_SOURCE_CATEGORIES.indexOf(a.category) -
          STRATA_SOURCE_CATEGORIES.indexOf(b.category) ||
        rank[strataSourceHealth(a)] - rank[strataSourceHealth(b)] ||
        a.name.localeCompare(b.name),
    );
}

export function mergeStrataSourceSelection(
  previous: readonly string[],
  visibleIds: readonly string[],
  selectedIds: readonly string[],
  validIds: readonly string[],
) {
  const visible = new Set(visibleIds);
  const valid = new Set(validIds);
  return [
    ...new Set([
      ...previous.filter((id) => !visible.has(id)),
      ...selectedIds.filter((id) => visible.has(id)),
    ]),
  ].filter((id) => valid.has(id));
}

export function useStrataSourcesModel() {
  const [state, setState] = useState(createStrataSourcesState);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<StrataSourceCategory[]>([
    ...STRATA_SOURCE_CATEGORIES,
  ]);
  const [query, setQuery] = useState<StrataSourceQuery>({
    id: "source-filters",
    type: "group",
    combinator: "and",
    rules: [],
  });
  const [unhealthy, setUnhealthy] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const metrics = useMemo(() => strataSourcesMetrics(state), [state]);
  return {
    state,
    metrics,
    search,
    setSearch,
    categories,
    setCategories,
    query,
    setQuery,
    unhealthy,
    setUnhealthy,
    selection,
    hiddenColumns,
    setHiddenColumns,
    setSelection: (visibleIds: string[], selectedIds: string[]) =>
      setSelection((previous) =>
        mergeStrataSourceSelection(
          previous,
          visibleIds,
          selectedIds,
          state.sources.map((source) => source.id),
        ),
      ),
    clearSelection: () => setSelection([]),
    setEnabled: (id: string, enabled: boolean) =>
      setState((current) => setStrataSourceEnabled(current, id, enabled)),
    sync: (ids: readonly string[]) => setState((current) => syncStrataSources(current, ids)),
    resetFilters: () => {
      setSearch("");
      setCategories([...STRATA_SOURCE_CATEGORIES]);
      setUnhealthy(false);
      setQuery({ id: "source-filters", type: "group", combinator: "and", rules: [] });
    },
  };
}
