import { useCallback, useMemo, useRef, useState, type SetStateAction } from "react";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import type {
  FilterNode,
  FilterQuery,
  FilterRule,
} from "../../components/reui/filters/filters-types";
import {
  STRATA_INCIDENT_ID,
  STRATA_NOW,
  STRATA_NOW_MS,
  STRATA_SERVICES,
  STRATA_OWNERS,
  strataOwner,
  type StrataEnvironment,
  type StrataEnvironmentFilter,
} from "./strata-domain.ts";

export const STRATA_LOG_LEVELS = ["info", "warn", "error"] as const;
export type StrataLogLevel = (typeof STRATA_LOG_LEVELS)[number];
export const STRATA_LOG_CATEGORIES = ["Deploy", "Config", "Secret", "Access", "Infra"] as const;
export type StrataLogCategory = (typeof STRATA_LOG_CATEGORIES)[number];
export const STRATA_LOG_SOURCES = [
  "Console",
  "Kubernetes",
  "OTLP",
  "Synthetics",
  "GitHub Actions",
] as const;
export type StrataLogSource = (typeof STRATA_LOG_SOURCES)[number];
export const STRATA_LOG_ENVIRONMENTS = [
  "Production",
  "Staging",
  "Sandbox",
] as const satisfies readonly StrataEnvironment[];
export const STRATA_LOG_CLUSTERS = [
  "none",
  "prod-eu-central-1",
  "prod-us-east-1",
  "staging-us-east-1",
] as const;
export type StrataLogCluster = (typeof STRATA_LOG_CLUSTERS)[number];
export const STRATA_LOG_RESOURCE_TYPES = [
  "Deployment",
  "Service",
  "Route",
  "Database",
  "Secret",
  "Incident",
  "API key",
  "Alert",
  "Job",
] as const;
export type StrataLogResourceType = (typeof STRATA_LOG_RESOURCE_TYPES)[number];
export const STRATA_LOG_RANGES = ["1h", "24h", "7d", "30d"] as const;
export type StrataLogRange = (typeof STRATA_LOG_RANGES)[number];
export type StrataLogView = "all" | "warnings" | "errors" | "checkout" | "errors-payments";
export type StrataLogsPreset = "default" | "errors-payments";
export type StrataLogQuery = FilterQuery<string | string[]>;

export interface StrataLogEvent {
  id: string;
  timestamp: string;
  ownerId: string;
  serviceId: string | null;
  category: StrataLogCategory;
  environment: StrataEnvironment;
  cluster: Exclude<StrataLogCluster, "none"> | null;
  resourceType: StrataLogResourceType;
  resourceId: string;
  event: string;
  level: StrataLogLevel;
  resource: string;
  source: StrataLogSource;
  podIp: string;
  traceId: string;
  incidentId: string | null;
  message: string;
  version: string | null;
  afterRelease: boolean;
  reviewed: boolean;
}

export interface StrataLogInput {
  event: string;
  category: StrataLogCategory;
  level: StrataLogLevel;
  ownerId: string;
  source: StrataLogSource;
  environment: StrataEnvironment;
  cluster: StrataLogCluster;
  podIp: string;
  resourceType: StrataLogResourceType;
  resourceName: string;
  resourceId: string;
  summary: string;
}

export function createStrataLogDraft(): StrataLogInput {
  return {
    event: "",
    category: "Infra",
    level: "info",
    ownerId: STRATA_OWNERS[0].id,
    source: "OTLP",
    environment: "Production",
    cluster: "prod-eu-central-1",
    podIp: "10.4.0.40",
    resourceType: "Service",
    resourceName: "",
    resourceId: "",
    summary: "",
  };
}

/** Local deterministic name handle; the source's exact generation algorithm was not exercised. */
export function strataLogResourceId(name: string): string {
  const normalized = name.trim().normalize("NFKC").toLocaleLowerCase();
  const slug = normalized.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  if (slug) return slug.slice(0, 128);
  let hash = 2166136261;
  for (const character of normalized) hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  return `resource-${(hash >>> 0).toString(16)}`;
}

const hours: Record<StrataLogRange, number> = { "1h": 1, "24h": 24, "7d": 168, "30d": 720 };
const minute = 60_000;
const emptyQuery = (): StrataLogQuery => ({
  id: "strata-log-filters",
  type: "group",
  combinator: "and",
  rules: [],
});

/** Independent events, with one fixed incident shared with the other Strata leaves. */
export function createStrataLogSeed(): StrataLogEvent[] {
  const critical: Partial<StrataLogEvent>[] = [
    {
      timestamp: "2026-10-22T13:58:40.000Z",
      ownerId: "iris",
      serviceId: "checkout-api",
      event: "statuspage.update.published",
      level: "info",
      resource: "status.bricklane.example",
      source: "Console",
      message: "Published the checkout incident status update.",
    },
    {
      timestamp: "2026-10-22T13:51:20.000Z",
      ownerId: "owen",
      serviceId: "checkout-api",
      event: "monitor.check.failed",
      level: "error",
      resource: "checkout.bricklane.example/health",
      source: "Synthetics",
      message: "Checkout availability probe returned HTTP 503.",
    },
    {
      timestamp: "2026-10-22T13:49:03.000Z",
      ownerId: "maya",
      serviceId: "checkout-api",
      event: "incident.acknowledged",
      level: "info",
      resource: "checkout-api",
      source: "Console",
      message: "Payments on-call acknowledged the checkout release incident.",
    },
    {
      timestamp: "2026-10-22T13:46:12.000Z",
      ownerId: "sofia",
      serviceId: "payments-api",
      event: "alert.fired",
      level: "error",
      resource: "checkout error rate > 5%",
      message: "The checkout error-rate monitor crossed its paging threshold.",
    },
    {
      timestamp: "2026-10-22T13:46:05.000Z",
      ownerId: "maya",
      serviceId: "checkout-api",
      event: "http.request.failed",
      level: "error",
      resource: "POST /v1/checkout",
      traceId: "b71c000000000001",
      message: "Checkout request timed out while acquiring a database connection.",
    },
    {
      timestamp: "2026-10-22T13:45:31.000Z",
      ownerId: "maya",
      serviceId: "checkout-api",
      event: "http.request.failed",
      level: "error",
      resource: "POST /v1/checkout",
      traceId: "b71c000000000002",
      message: "Checkout returned HTTP 503 after the connection pool was exhausted.",
    },
    {
      timestamp: "2026-10-22T13:45:10.000Z",
      ownerId: "sofia",
      serviceId: "payments-api",
      event: "payment.charge.retry",
      level: "warn",
      resource: "provider.charge",
      afterRelease: true,
      message: "A payment charge entered the bounded retry queue after v3.5.0.",
    },
    {
      timestamp: "2026-10-22T13:44:51.000Z",
      ownerId: "maya",
      serviceId: "checkout-api",
      event: "db.pool.saturated",
      level: "warn",
      resource: "checkout-db",
      afterRelease: true,
      message: "All database connections were occupied after the v3.5.0 rollout.",
    },
    {
      timestamp: "2026-10-22T13:40:30.000Z",
      ownerId: "maya",
      serviceId: "checkout-api",
      event: "rollout.step",
      level: "info",
      resource: "checkout-api",
      source: "Kubernetes",
      message: "Advanced checkout v3.5.0 to the second rollout stage.",
    },
    {
      timestamp: "2026-10-22T13:40:02.000Z",
      ownerId: "maya",
      serviceId: "checkout-api",
      event: "deployment.create",
      level: "info",
      resource: "checkout-api",
      source: "GitHub Actions",
      message: "Started the checkout v3.5.0 deployment.",
    },
    {
      timestamp: "2026-10-22T10:00:00.000Z",
      ownerId: "eli",
      serviceId: "search-api",
      event: "cache.miss.high",
      level: "warn",
      resource: "search-cache",
      incidentId: null,
      version: null,
      message: "Search cache misses exceeded the local review threshold.",
    },
    {
      timestamp: "2026-10-21T22:00:00.000Z",
      ownerId: "noah",
      serviceId: "webhook-worker",
      event: "queue.lag.high",
      level: "warn",
      resource: "webhook-deliveries",
      incidentId: null,
      version: null,
      message: "The webhook queue briefly lagged behind incoming work.",
    },
  ];
  const events = critical.map((event, index): StrataLogEvent => ({
    id: `BL-EVT-${String(index + 1).padStart(4, "0")}`,
    timestamp: STRATA_NOW,
    ownerId: "maya",
    serviceId: "checkout-api",
    category: "Infra",
    environment: "Production",
    cluster: "prod-eu-central-1",
    resourceType: "Service",
    resourceId: "",
    event: "incident.updated",
    level: "info",
    resource: "checkout-api",
    source: "OTLP",
    podIp: `192.0.2.${index + 17}`,
    traceId: "",
    incidentId: STRATA_INCIDENT_ID,
    version: "v3.5.0",
    afterRelease: false,
    reviewed: false,
    message: "Checkout release event.",
    ...event,
  }));
  const routine = [
    ["job.run.succeeded", "Scheduled work completed within its time budget."],
    ["cache.refresh.completed", "Refreshed the service cache successfully."],
    ["queue.batch.processed", "Processed a queued work batch without retries."],
    ["deployment.health.checked", "The deployed service passed its health check."],
    ["http.request.completed", "Served the request successfully."],
    ["collector.batch.accepted", "Accepted a telemetry batch for processing."],
  ];
  for (let index = 0; index < 50; index++) {
    const service = STRATA_SERVICES[index % STRATA_SERVICES.length];
    const [event, message] = routine[index % routine.length];
    events.push({
      id: `BL-EVT-${String(index + 13).padStart(4, "0")}`,
      timestamp: new Date(STRATA_NOW_MS - (70 + index * 190) * minute).toISOString(),
      ownerId: service.ownerId,
      serviceId: service.id,
      category: event.startsWith("deployment.") ? "Deploy" : "Infra",
      environment: service.environment,
      cluster:
        service.environment === "Sandbox"
          ? null
          : service.environment === "Staging"
            ? "staging-us-east-1"
            : "prod-eu-central-1",
      resourceType: "Service",
      resourceId: "",
      event,
      level: "info",
      resource: service.name,
      source: index % 4 === 0 ? "Kubernetes" : "OTLP",
      podIp: `198.51.100.${index + 10}`,
      traceId: `b71c${String(index + 100).padStart(12, "0")}`,
      incidentId: null,
      message,
      version: null,
      afterRelease: false,
      reviewed: false,
    });
  }
  return events.map((event) => {
    const resourceType: StrataLogResourceType =
      event.event.startsWith("deployment.") || event.event.startsWith("rollout.")
        ? "Deployment"
        : event.event.startsWith("http.")
          ? "Route"
          : event.event.startsWith("db.")
            ? "Database"
            : event.event.startsWith("incident.")
              ? "Incident"
              : event.event.startsWith("alert.")
                ? "Alert"
                : event.event.startsWith("job.")
                  ? "Job"
                  : "Service";
    return {
      ...event,
      resourceType,
      category:
        resourceType === "Deployment"
          ? "Deploy"
          : event.event.startsWith("statuspage.")
            ? "Config"
            : event.category,
      resourceId:
        resourceType === "Incident" && event.incidentId
          ? event.incidentId
          : strataLogResourceId(event.resource),
    };
  });
}

export function strataLogInRange(event: StrataLogEvent, range: StrataLogRange): boolean {
  const time = Date.parse(event.timestamp);
  return time <= STRATA_NOW_MS && time >= STRATA_NOW_MS - hours[range] * 60 * minute;
}

export function scopeStrataLogs(
  events: StrataLogEvent[],
  environment: StrataEnvironmentFilter,
  range: StrataLogRange,
) {
  return events.filter(
    (event) =>
      (environment === "all" || event.environment === environment) &&
      strataLogInRange(event, range),
  );
}

function matchRule(event: StrataLogEvent, rule: FilterRule<string | string[]>): boolean {
  const key = rule.path[0];
  const value = event[key as keyof StrataLogEvent];
  const text = String(value ?? "").toLocaleLowerCase();
  const expected = (Array.isArray(rule.value) ? rule.value : [rule.value])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.toLocaleLowerCase());
  let matches = true;
  switch (rule.operator) {
    case "empty":
      matches = !text;
      break;
    case "not_empty":
      matches = !!text;
      break;
    case "is":
    case "is_any_of":
      matches = !expected.length || expected.includes(text);
      break;
    case "is_not":
    case "is_none_of":
      matches = !expected.length || !expected.includes(text);
      break;
    case "contains":
      matches = !expected.length || expected.some((item) => text.includes(item));
      break;
    case "not_contains":
      matches = !expected.length || !expected.some((item) => text.includes(item));
      break;
    case "starts_with":
      matches = !expected.length || expected.some((item) => text.startsWith(item));
      break;
    case "ends_with":
      matches = !expected.length || expected.some((item) => text.endsWith(item));
      break;
  }
  return rule.negated ? !matches : matches;
}

function matchNode(event: StrataLogEvent, node: FilterNode<string | string[]>): boolean {
  if (node.type === "rule") return matchRule(event, node);
  const matches =
    node.combinator === "or"
      ? !node.rules.length || node.rules.some((rule) => matchNode(event, rule))
      : node.rules.every((rule) => matchNode(event, rule));
  return matches;
}

export function filterStrataLogs(
  events: StrataLogEvent[],
  options: {
    search: string;
    levels: readonly StrataLogLevel[];
    view: StrataLogView;
    query: StrataLogQuery;
  },
) {
  const search = options.search.trim().toLocaleLowerCase();
  return events.filter((event) => {
    if (!options.levels.includes(event.level)) return false;
    if (options.view === "warnings" && event.level !== "warn") return false;
    if (options.view === "errors" && event.level !== "error") return false;
    if (options.view === "checkout" && event.incidentId !== STRATA_INCIDENT_ID) return false;
    if (
      search &&
      ![
        event.id,
        event.event,
        event.resource,
        event.serviceId,
        event.traceId,
        event.incidentId,
        event.message,
        event.podIp,
        event.source,
        event.category,
        event.environment,
        event.cluster,
        event.resourceType,
        event.resourceId,
        strataOwner(event.ownerId)?.name,
      ].some((value) => value?.toLocaleLowerCase().includes(search))
    )
      return false;
    return matchNode(event, options.query);
  });
}

export function summarizeStrataLogs(events: readonly StrataLogEvent[]) {
  const levels: Record<StrataLogLevel, number> = { info: 0, warn: 0, error: 0 };
  const owners = new Set<string>();
  for (const event of events) {
    levels[event.level]++;
    owners.add(event.ownerId);
  }
  const warnings = events
    .filter((event) => event.level === "warn")
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return {
    total: events.length,
    levels,
    owners: owners.size,
    warnings,
    warningOwners: new Set(warnings.map((event) => event.ownerId)).size,
    unreviewed: warnings.filter((event) => !event.reviewed).length,
    reviewed: warnings.filter((event) => event.reviewed).length,
    afterRelease: warnings.filter((event) => event.afterRelease).length,
    warningPercent: events.length ? (levels.warn / events.length) * 100 : 0,
  };
}

export function strataLogBuckets(events: readonly StrataLogEvent[], range: StrataLogRange) {
  const interval =
    range === "1h"
      ? 5 * minute
      : range === "24h"
        ? 60 * minute
        : range === "7d"
          ? 360 * minute
          : 1440 * minute;
  const end = Math.floor(STRATA_NOW_MS / interval) * interval + interval;
  const start = Math.floor((STRATA_NOW_MS - hours[range] * 60 * minute) / interval) * interval;
  const count = (end - start) / interval;
  const buckets = Array.from({ length: count }, (_, index) => ({
    timestamp: start + index * interval,
    info: 0,
    warn: 0,
    error: 0,
  }));
  for (const event of events) {
    const index = Math.floor((Date.parse(event.timestamp) - start) / interval);
    if (index >= 0 && index < buckets.length) buckets[index][event.level]++;
  }
  return buckets;
}

export function strataLogTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

export function strataLogAge(timestamp: string) {
  const minutes = Math.max(0, Math.floor((STRATA_NOW_MS - Date.parse(timestamp)) / minute));
  return minutes < 60
    ? `${minutes}m ago`
    : minutes < 1440
      ? `${Math.floor(minutes / 60)}h ago`
      : `${Math.floor(minutes / 1440)}d ago`;
}

export function validateStrataLogInput(input: StrataLogInput) {
  const errors: Partial<Record<keyof StrataLogInput, string>> = {};
  if (!input.event.trim() || input.event.trim().length > 120)
    errors.event = "Enter an event of up to 120 characters.";
  if (!STRATA_LOG_CATEGORIES.includes(input.category)) errors.category = "Choose a category.";
  if (!strataOwner(input.ownerId)) errors.ownerId = "Choose an owner.";
  if (!STRATA_LOG_LEVELS.includes(input.level)) errors.level = "Choose a level.";
  if (!STRATA_LOG_SOURCES.includes(input.source)) errors.source = "Choose a source.";
  if (!STRATA_LOG_ENVIRONMENTS.includes(input.environment))
    errors.environment = "Choose an environment.";
  if (!STRATA_LOG_CLUSTERS.includes(input.cluster)) errors.cluster = "Choose a cluster or None.";
  if (!STRATA_LOG_RESOURCE_TYPES.includes(input.resourceType))
    errors.resourceType = "Choose a resource type.";
  if (!input.resourceName.trim() || input.resourceName.trim().length > 160)
    errors.resourceName = "Enter a resource name of up to 160 characters.";
  if (input.resourceId.trim().length > 128) errors.resourceId = "Use up to 128 characters.";
  if (
    input.podIp.trim() &&
    (!/^\d{1,3}(\.\d{1,3}){3}$/.test(input.podIp.trim()) ||
      input.podIp
        .trim()
        .split(".")
        .some((part) => Number(part) > 255))
  )
    errors.podIp = "Enter an IPv4 address or leave this blank.";
  if (input.summary.length > 2000) errors.summary = "Use up to 2,000 characters.";
  return errors;
}

export function makeStrataLogEvent(input: StrataLogInput, id: string): StrataLogEvent {
  if (Object.keys(validateStrataLogInput(input)).length) throw new Error("Invalid local event");
  const resource = input.resourceName.trim();
  const resourceId = input.resourceId.trim() || strataLogResourceId(resource);
  const service =
    input.resourceType === "Service"
      ? STRATA_SERVICES.find(
          (service) =>
            service.id === resourceId ||
            service.name.toLocaleLowerCase() === resource.toLocaleLowerCase(),
        )
      : undefined;
  return {
    id,
    timestamp: STRATA_NOW,
    ownerId: input.ownerId,
    serviceId: service?.id ?? null,
    event: input.event.trim(),
    category: input.category,
    level: input.level,
    environment: input.environment,
    cluster: input.cluster === "none" ? null : input.cluster,
    resource,
    resourceType: input.resourceType,
    resourceId,
    source: input.source,
    podIp: input.podIp.trim(),
    traceId: "",
    message: input.summary,
    reviewed: false,
    incidentId:
      input.resourceType === "Incident" && resourceId === STRATA_INCIDENT_ID
        ? STRATA_INCIDENT_ID
        : null,
    version: null,
    afterRelease: false,
  };
}

/** Root calls this once; route mounts consume the returned state rather than reseeding. */
export interface StrataLogsDisplay {
  range: StrataLogRange;
  levels: StrataLogLevel[];
  search: string;
  query: StrataLogQuery;
  view: StrataLogView;
  sorting: SortingState;
  selection: string[];
  pagination: PaginationState;
  hidden: string[];
  compact: boolean;
  exportScope: "filtered" | "selected";
}

/** Observed Level/Owner predicates, mapped to original demo identities rather than source people. */
export function createStrataLogsDisplay(preset: StrataLogsPreset): StrataLogsDisplay {
  const query = emptyQuery();
  if (preset === "errors-payments")
    query.rules = [
      { id: "payments-level", type: "rule", path: ["level"], operator: "is", value: "error" },
      {
        id: "payments-owners",
        type: "rule",
        path: ["ownerId"],
        operator: "is_any_of",
        value: ["maya", "leila"],
      },
    ];
  return {
    range: "7d",
    levels: [...STRATA_LOG_LEVELS],
    search: "",
    query,
    view: preset === "errors-payments" ? "errors-payments" : "all",
    sorting: [{ id: "timestamp", desc: true }],
    selection: [],
    pagination: { pageIndex: 0, pageSize: 10 },
    hidden: [],
    compact: true,
    exportScope: "filtered",
  };
}
export function clearStrataLogFilters(display: StrataLogsDisplay): StrataLogsDisplay {
  return {
    ...display,
    search: "",
    query: emptyQuery(),
    view: "all",
    levels: [...STRATA_LOG_LEVELS],
    pagination: { ...display.pagination, pageIndex: 0 },
  };
}
export function selectStrataLogView(
  display: StrataLogsDisplay,
  view: StrataLogView,
): StrataLogsDisplay {
  if (view !== "errors-payments")
    return { ...display, view, pagination: { ...display.pagination, pageIndex: 0 } };
  const saved = createStrataLogsDisplay("errors-payments");
  return {
    ...display,
    range: saved.range,
    levels: saved.levels,
    search: saved.search,
    query: saved.query,
    view,
    pagination: { ...display.pagination, pageIndex: 0 },
  };
}

function useStrataLogsDisplay(
  preset: StrataLogsPreset,
  createEvent: (input: StrataLogInput) => StrataLogEvent,
) {
  const [display, setDisplay] = useState(() => createStrataLogsDisplay(preset));
  const update = useCallback(
    <K extends keyof StrataLogsDisplay>(
      key: K,
      value: SetStateAction<StrataLogsDisplay[K]>,
      resetPage = false,
    ) => {
      setDisplay((current) => {
        const next =
          typeof value === "function"
            ? (value as (previous: StrataLogsDisplay[K]) => StrataLogsDisplay[K])(current[key])
            : value;
        const changed = { ...current, [key]: next };
        return resetPage
          ? { ...changed, pagination: { ...current.pagination, pageIndex: 0 } }
          : changed;
      });
    },
    [],
  );
  const clearFilters = useCallback(() => setDisplay(clearStrataLogFilters), []);
  const resetDisplay = useCallback(() => setDisplay(createStrataLogsDisplay(preset)), [preset]);
  const setters = useMemo(
    () => ({
      setRange: (value: StrataLogRange) => update("range", value, true),
      setLevels: (value: StrataLogLevel[]) => update("levels", value, true),
      setSearch: (value: string) => update("search", value, true),
      setQuery: (value: StrataLogQuery) => update("query", value, true),
      setView: (value: StrataLogView) =>
        setDisplay((current) => selectStrataLogView(current, value)),
      setSorting: (value: SortingState) => update("sorting", value, true),
      setSelection: (value: SetStateAction<string[]>) => update("selection", value),
      setPagination: (value: SetStateAction<PaginationState>) => update("pagination", value),
      setHidden: (value: SetStateAction<string[]>) => update("hidden", value),
      setCompact: (value: SetStateAction<boolean>) => update("compact", value),
      setExportScope: (value: "filtered" | "selected") => update("exportScope", value),
    }),
    [update],
  );
  const addEvent = useCallback(
    (input: StrataLogInput) => {
      const event = createEvent(input);
      setDisplay((current) => ({
        ...clearStrataLogFilters(current),
        range: "7d",
        sorting: [{ id: "timestamp", desc: true }],
      }));
      return event;
    },
    [createEvent],
  );
  return { ...display, ...setters, preset, clearFilters, resetDisplay, addEvent };
}

export function useStrataLogsModel(initialPreset: StrataLogsPreset = "default") {
  const [events, setEvents] = useState(createStrataLogSeed);
  const [preset, applyPreset] = useState<StrataLogsPreset>(initialPreset);
  const sequence = useRef(63);
  const createEvent = useCallback((input: StrataLogInput) => {
    const event = makeStrataLogEvent(input, `BL-EVT-${String(sequence.current).padStart(4, "0")}`);
    sequence.current++;
    setEvents((current) => [event, ...current]);
    return event;
  }, []);
  // Separate hook slots retain both route states; changing a prop never writes during render.
  const normal = useStrataLogsDisplay("default", createEvent);
  const payments = useStrataLogsDisplay("errors-payments", createEvent);
  const review = useCallback((ids: readonly string[], reviewed = true) => {
    const matching = new Set(ids);
    setEvents((current) =>
      current.map((event) =>
        matching.has(event.id) && event.level === "warn" ? { ...event, reviewed } : event,
      ),
    );
  }, []);
  const { resetDisplay: resetNormal } = normal;
  const { resetDisplay: resetPayments } = payments;
  const reset = useCallback(() => {
    sequence.current = 63;
    setEvents(createStrataLogSeed());
    resetNormal();
    resetPayments();
    applyPreset("default");
  }, [resetNormal, resetPayments]);
  const forPreset = (selectedPreset: StrataLogsPreset) => ({
    ...(selectedPreset === "errors-payments" ? payments : normal),
    events,
    review,
    reset,
  });
  return { ...forPreset(preset), applyPreset, forPreset };
}
