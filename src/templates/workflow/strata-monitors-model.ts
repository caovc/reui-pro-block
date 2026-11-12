import { useCallback, useRef, useState } from "react";
import {
  STRATA_NOW,
  STRATA_NOW_MS,
  STRATA_OWNERS,
  strataOwner,
  strataService,
  type StrataEnvironment,
  type StrataEnvironmentFilter,
} from "./strata-domain.ts";
import { nextStrataRuns } from "./strata-cron.ts";

export type StrataCheckStatus = "Succeeded" | "Failed" | "Timed Out" | "Skipped";
export type StrataMonitorHealth = "Healthy" | "Failing" | "Paused" | "Pending";
export type StrataMonitorFilter = "all" | StrataMonitorHealth;

export interface StrataMonitor {
  id: string;
  name: string;
  target: string;
  serviceId: string;
  kind: "browser" | "http" | "command";
  intervalMinutes: number;
  regions: number;
  enabled: boolean;
  timeoutSeconds: number;
  cron: string;
  timeZone: "UTC";
  region: string;
  environment: StrataEnvironment;
  ownerId: string;
  createdAt: string;
}

export type StrataMonitorDraft = Pick<
  StrataMonitor,
  | "name"
  | "target"
  | "cron"
  | "timeZone"
  | "serviceId"
  | "region"
  | "environment"
  | "ownerId"
  | "enabled"
>;
export type StrataMonitorErrors = Partial<Record<keyof StrataMonitorDraft, string>>;
export type StrataMonitorCreateResult =
  | { ok: true; monitor: StrataMonitor }
  | { ok: false; errors: StrataMonitorErrors };

export interface StrataMonitorCheck {
  id: string;
  monitorId: string;
  startedAt: string;
  status: StrataCheckStatus;
  loadSeconds: number;
  stepsSeconds: number;
  confirmSeconds: number;
  outlier: boolean;
  deployment?: string;
}

export interface StrataMonitorRow {
  id: string;
  monitor: StrataMonitor;
  checks: StrataMonitorCheck[];
  latest: StrataMonitorCheck | null;
  health: StrataMonitorHealth;
  successRate: number | null;
  p50: number | null;
  p95: number | null;
  longestFailureStreak: number;
}

type MonitorSeed = Omit<
  StrataMonitor,
  "cron" | "timeZone" | "region" | "environment" | "ownerId" | "createdAt"
>;
const monitorDefinitions: readonly MonitorSeed[] = [
  {
    id: "checkout",
    name: "Checkout flow",
    target: "api.bricklane.test/checkout",
    serviceId: "checkout-api",
    kind: "browser",
    intervalMinutes: 5,
    regions: 6,
    enabled: true,
    timeoutSeconds: 15,
  },
  {
    id: "payments",
    name: "Payments API",
    target: "api.bricklane.test/v1/payments/health",
    serviceId: "payments-api",
    kind: "http",
    intervalMinutes: 5,
    regions: 1,
    enabled: true,
    timeoutSeconds: 10,
  },
  {
    id: "login",
    name: "Login flow",
    target: "app.bricklane.test/login",
    serviceId: "edge-gateway",
    kind: "browser",
    intervalMinutes: 5,
    regions: 1,
    enabled: true,
    timeoutSeconds: 15,
  },
  {
    id: "search",
    name: "Search API",
    target: "api.bricklane.test/v1/search",
    serviceId: "search-api",
    kind: "http",
    intervalMinutes: 5,
    regions: 1,
    enabled: true,
    timeoutSeconds: 10,
  },
  {
    id: "status",
    name: "Status page",
    target: "status.bricklane.test",
    serviceId: "status-renderer",
    kind: "http",
    intervalMinutes: 5,
    regions: 1,
    enabled: true,
    timeoutSeconds: 10,
  },
  {
    id: "backup",
    name: "Nightly database backup",
    target: "pg_dump --all · 0 2 * * *",
    serviceId: "ledger-worker",
    kind: "command",
    intervalMinutes: 1440,
    regions: 1,
    enabled: true,
    timeoutSeconds: 1500,
  },
  {
    id: "reindex",
    name: "Search reindex",
    target: "reindex search --shards=12 · */30 * * * *",
    serviceId: "search-indexer",
    kind: "command",
    intervalMinutes: 30,
    regions: 1,
    enabled: true,
    timeoutSeconds: 600,
  },
  {
    id: "invoice",
    name: "Invoice export",
    target: "invoices:export --format=pdf · 0 * * * *",
    serviceId: "sandbox-api",
    kind: "command",
    intervalMinutes: 60,
    regions: 1,
    enabled: false,
    timeoutSeconds: 360,
  },
];

const checkoutDurations = [8, 7, 8, 7, 8, 8, 7, 8, 8, 8, 8, 7, 8, 8, 7, 8, 11, 12, 15, 15];
const backupDurations = [
  1118, 1124, 1137, 1129, 1145, 1122, 1131, 1140, 1134, 1120, 1142, 1139, 1127, 1141, 1136, 1160,
  1130, 1128, 1138, 1134,
];

export function strataCheckDuration(check: StrataMonitorCheck): number {
  return check.loadSeconds + check.stepsSeconds + check.confirmSeconds;
}

/** Nearest-rank percentiles; a one-check or empty selection stays well-defined. */
export function strataMonitorPercentile(
  values: readonly number[],
  quantile: number,
): number | null {
  if (!values.length) return null;
  const sorted = values.toSorted((left, right) => left - right);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(quantile * sorted.length) - 1));
  return sorted[index];
}

function checkAt(monitor: StrataMonitor, index: number, previous: boolean): StrataMonitorCheck {
  const lastOffset =
    monitor.id === "checkout"
      ? 0
      : monitor.id === "backup"
        ? 720
        : monitor.id === "reindex"
          ? 14
          : monitor.id === "invoice"
            ? 4320
            : monitor.id === "search"
              ? 3
              : monitor.id === "status"
                ? 1
                : 2;
  const ageMinutes =
    lastOffset +
    (19 - index) * monitor.intervalMinutes +
    (previous ? 20 * monitor.intervalMinutes : 0);
  let status: StrataCheckStatus = "Succeeded";
  // One underlying record set deliberately resolves the source's 85%/75% disagreement.
  if (!previous && monitor.id === "checkout" && index >= 17)
    status = index === 17 ? "Failed" : "Timed Out";
  if (!previous && monitor.id === "payments" && [5, 17].includes(index))
    status = index === 5 ? "Failed" : "Timed Out";
  if (!previous && monitor.id === "reindex" && [6, 15].includes(index))
    status = index === 6 ? "Failed" : "Timed Out";
  if (previous && monitor.id === "checkout" && index === 4) status = "Failed";
  let total =
    monitor.id === "checkout"
      ? previous
        ? index >= 18
          ? 8.31
          : 8
        : checkoutDurations[index]
      : monitor.id === "backup"
        ? backupDurations[index]
        : monitor.id === "reindex"
          ? index === 18
            ? 445
            : index === 17
              ? 440
              : 400 + (index % 6) * 4
          : monitor.id === "invoice"
            ? 242 + (index % 7) * 2
            : monitor.id === "login"
              ? 2.4 + (index % 5) * 0.15
              : monitor.id === "status"
                ? 1.4 + (index % 5) * 0.15
                : 0.6 + (index % 5) * 0.1;
  total = status === "Timed Out" ? monitor.timeoutSeconds : Math.round(total * 100) / 100;
  const loadSeconds =
    monitor.id === "checkout"
      ? !previous && index === 16
        ? 4
        : 1
      : Math.round(total * 0.1 * 100) / 100;
  const confirmSeconds =
    status === "Succeeded"
      ? monitor.id === "checkout"
        ? 1
        : Math.round(total * 0.08 * 100) / 100
      : 0;
  return {
    id: previous
      ? `${monitor.id}-prior-${index + 1}`
      : monitor.id === "checkout"
        ? `CHK-${48191 + index}`
        : `${monitor.id}-check-${index + 1}`,
    monitorId: monitor.id,
    startedAt: new Date(STRATA_NOW_MS - ageMinutes * 60_000).toISOString(),
    status,
    loadSeconds,
    stepsSeconds: Math.round((total - loadSeconds - confirmSeconds) * 100) / 100,
    confirmSeconds,
    outlier: !previous && monitor.id === "checkout" && index >= 16,
    ...(!previous && monitor.id === "checkout" && index === 15 ? { deployment: "v3.5.0" } : {}),
  };
}

export function createStrataMonitorsFixture() {
  const monitors: StrataMonitor[] = monitorDefinitions.map((monitor) => {
    const service = strataService(monitor.serviceId)!;
    return {
      ...monitor,
      cron:
        monitor.id === "backup"
          ? "0 2 * * *"
          : monitor.id === "invoice"
            ? "0 * * * *"
            : monitor.id === "reindex"
              ? "*/30 * * * *"
              : "*/5 * * * *",
      timeZone: "UTC",
      region: monitor.regions === 6 ? "all" : service.cluster,
      environment: service.environment,
      ownerId: service.ownerId,
      createdAt: "2026-09-01T09:00:00.000Z",
    };
  });
  return {
    monitors,
    checks: monitors.flatMap((monitor) =>
      Array.from({ length: 20 }, (_, index) => checkAt(monitor, index, false)),
    ),
    previousChecks: monitors.flatMap((monitor) =>
      Array.from({ length: 20 }, (_, index) => checkAt(monitor, index, true)),
    ),
  };
}

export function strataMonitorRow(
  monitor: StrataMonitor,
  allChecks: readonly StrataMonitorCheck[],
): StrataMonitorRow {
  const checks = allChecks
    .filter((check) => check.monitorId === monitor.id)
    .toSorted((left, right) => left.startedAt.localeCompare(right.startedAt));
  const latest = checks.at(-1) ?? null;
  let streak = 0;
  let longestFailureStreak = 0;
  for (const check of checks) {
    streak = check.status === "Failed" || check.status === "Timed Out" ? streak + 1 : 0;
    longestFailureStreak = Math.max(longestFailureStreak, streak);
  }
  const durations = checks.filter((check) => check.status !== "Skipped").map(strataCheckDuration);
  return {
    id: monitor.id,
    monitor,
    checks,
    latest,
    health: !monitor.enabled
      ? "Paused"
      : !latest
        ? "Pending"
        : ["Failed", "Timed Out"].includes(latest.status)
          ? "Failing"
          : "Healthy",
    successRate: checks.length
      ? (checks.filter((check) => check.status === "Succeeded").length / checks.length) * 100
      : null,
    p50: strataMonitorPercentile(durations, 0.5),
    p95: strataMonitorPercentile(durations, 0.95),
    longestFailureStreak,
  };
}

export function selectStrataMonitorRows(
  monitors: readonly StrataMonitor[],
  checks: readonly StrataMonitorCheck[],
  environment: StrataEnvironmentFilter = "all",
  filter: StrataMonitorFilter = "all",
) {
  return monitors
    .filter((monitor) => environment === "all" || monitor.environment === environment)
    .map((monitor) => strataMonitorRow(monitor, checks))
    .filter((row) => filter === "all" || row.health === filter);
}

export function strataMonitorMetrics(rows: readonly StrataMonitorRow[]) {
  const checks = rows.flatMap((row) => row.checks);
  const succeeded = checks.filter((check) => check.status === "Succeeded").length;
  const failed = checks.filter((check) => check.status === "Failed").length;
  const timedOut = checks.filter((check) => check.status === "Timed Out").length;
  const skipped = checks.filter((check) => check.status === "Skipped").length;
  return {
    total: checks.length,
    succeeded,
    failed,
    timedOut,
    skipped,
    successRate: checks.length ? (succeeded / checks.length) * 100 : null,
    failing: rows.filter((row) => row.health === "Failing").length,
    longestFailureStreak: Math.max(0, ...rows.map((row) => row.longestFailureStreak)),
    slowest:
      rows.filter((row) => row.p95 !== null).toSorted((left, right) => right.p95! - left.p95!)[0] ??
      null,
  };
}

export function formatStrataMonitorDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const rounded = Math.round(seconds);
  return rounded < 60
    ? `${rounded}s`
    : `${Math.floor(rounded / 60)}m ${String(rounded % 60).padStart(2, "0")}s`;
}

export function emptyStrataMonitorDraft(): StrataMonitorDraft {
  const service = strataService("checkout-api")!;
  return {
    name: "",
    target: "",
    cron: "*/5 * * * *",
    timeZone: "UTC",
    serviceId: service.id,
    region: "all",
    environment: service.environment,
    ownerId: STRATA_OWNERS[0].id,
    enabled: true,
  };
}

/** Local validation and record creation; targets are stored, never executed. */
export function validateStrataMonitor(draft: StrataMonitorDraft): StrataMonitorErrors {
  const errors: StrataMonitorErrors = {};
  if (!draft.name.trim()) errors.name = "Enter a monitor name.";
  const target = draft.target.trim();
  if (!target) errors.target = "Enter a URL or scheduled command.";
  else if (Array.from(target).some((character) => character.charCodeAt(0) < 32))
    errors.target = "Use a single-line target.";
  else if (
    /^(?:javascript|data|vbscript):/i.test(target) ||
    (/^[a-z][a-z\d+.-]*:\/\//i.test(target) && !/^https?:\/\//i.test(target))
  )
    errors.target = "Use an HTTP(S) URL or command text.";
  else if (/^https?:\/\//i.test(target)) {
    try {
      if (!new URL(target).hostname) errors.target = "Enter a valid HTTP(S) URL.";
    } catch {
      errors.target = "Enter a valid HTTP(S) URL.";
    }
  }
  if (!strataService(draft.serviceId)) errors.serviceId = "Choose a service in this workspace.";
  if (!strataOwner(draft.ownerId)) errors.ownerId = "Choose an owner in this workspace.";
  if (!["Production", "Staging", "Sandbox"].includes(draft.environment))
    errors.environment = "Choose a workspace environment.";
  if (draft.region !== "all") errors.region = "Choose All 6 regions.";
  if (draft.timeZone !== "UTC") errors.timeZone = "This preview supports UTC schedules.";
  if (typeof draft.enabled !== "boolean")
    errors.enabled = "Choose whether the monitor starts enabled.";
  try {
    if (!nextStrataRuns(draft.cron, STRATA_NOW_MS, 3).length)
      errors.cron = "Choose a schedule with a future check.";
  } catch (error) {
    errors.cron = error instanceof Error ? error.message : "Enter a valid cron expression.";
  }
  return errors;
}

export function createStrataMonitor(
  draft: StrataMonitorDraft,
  id: string,
): StrataMonitorCreateResult {
  const errors = validateStrataMonitor(draft);
  if (Object.keys(errors).length) return { ok: false, errors };
  const target = draft.target.trim();
  const kind =
    /^(?:https?:\/\/|localhost(?::\d+)?(?:\/|$)|[a-z\d.-]+\.[a-z]{2,}(?::\d+)?(?:\/|$))/i.test(
      target,
    )
      ? "http"
      : "command";
  const upcoming = nextStrataRuns(draft.cron, STRATA_NOW_MS, 2);
  return {
    ok: true,
    monitor: {
      ...draft,
      id,
      name: draft.name.trim(),
      target,
      cron: draft.cron.trim().replace(/\s+/g, " "),
      kind,
      regions: 6,
      intervalMinutes: Math.max(1, (upcoming[1] - upcoming[0]) / 60000),
      timeoutSeconds: kind === "command" ? 300 : 15,
      createdAt: STRATA_NOW,
    },
  };
}

export function useStrataMonitorsModel() {
  const [fixture, setFixture] = useState(createStrataMonitorsFixture);
  const nextId = useRef(9);
  const [selectedId, setSelectedId] = useState("checkout");
  const [selectedCheckId, setSelectedCheckId] = useState("CHK-48210");
  const selectCheck = useCallback(
    (monitorId: string, checkId?: string) => {
      if (!fixture.monitors.some((monitor) => monitor.id === monitorId)) return;
      const checks = fixture.checks.filter((check) => check.monitorId === monitorId);
      const check = checks.find((candidate) => candidate.id === checkId) ?? checks.at(-1);
      setSelectedId(monitorId);
      setSelectedCheckId(check?.id ?? "");
    },
    [fixture],
  );
  const createMonitor = useCallback((draft: StrataMonitorDraft) => {
    const result = createStrataMonitor(draft, `monitor-${nextId.current}`);
    if (result.ok) {
      nextId.current += 1;
      setFixture((current) => ({ ...current, monitors: [...current.monitors, result.monitor] }));
      setSelectedId(result.monitor.id);
      setSelectedCheckId("");
    }
    return result;
  }, []);
  const setEnabled = useCallback((id: string, enabled: boolean) => {
    setFixture((current) => {
      const monitors = setStrataMonitorEnabled(current.monitors, id, enabled);
      return monitors === current.monitors ? current : { ...current, monitors };
    });
  }, []);
  return { ...fixture, selectedId, selectedCheckId, selectCheck, createMonitor, setEnabled };
}

/** Local scheduling state only; no check is executed, invented or removed. */
export function setStrataMonitorEnabled(
  monitors: StrataMonitor[],
  id: string,
  enabled: boolean,
): StrataMonitor[] {
  if (!monitors.some((monitor) => monitor.id === id && monitor.enabled !== enabled))
    return monitors;
  return monitors.map((monitor) => (monitor.id === id ? { ...monitor, enabled } : monitor));
}

export type StrataMonitorsModel = ReturnType<typeof useStrataMonitorsModel>;
