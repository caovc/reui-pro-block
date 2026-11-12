import { STRATA_NOW_MS } from "./strata-domain.ts";
import { nextStrataRuns } from "./strata-cron.ts";
import {
  strataCheckDuration,
  strataMonitorRow,
  type StrataMonitor,
  type StrataMonitorCheck,
} from "./strata-monitors-model.ts";

export function strataMonitorDetailId(monitors: readonly StrataMonitor[], preset?: "api-acme-com") {
  return preset === "api-acme-com"
    ? (monitors.find((monitor) => monitor.id === "checkout")?.id ?? null)
    : null;
}

export function adjacentStrataMonitorId(
  monitors: readonly StrataMonitor[],
  id: string,
  direction: -1 | 1,
): string | null {
  const index = monitors.findIndex((monitor) => monitor.id === id);
  return index < 0 ? null : (monitors[index + direction]?.id ?? null);
}

/** Human-readable Bricklane alias; the original local ledger key remains monitor.id. */
export function strataMonitorDisplayId(monitors: readonly StrataMonitor[], id: string): string {
  const index = monitors.findIndex((monitor) => monitor.id === id);
  return index < 0 ? id : `BL-MON-${101 + index}`;
}

export function strataMonitorOverview(
  monitors: readonly StrataMonitor[],
  checks: readonly StrataMonitorCheck[],
  id: string,
  now = STRATA_NOW_MS,
) {
  const monitor = monitors.find((item) => item.id === id);
  if (!monitor) return null;
  const row = strataMonitorRow(monitor, checks);
  const trailing: StrataMonitorCheck[] = [];
  for (let index = row.checks.length - 1; index >= 0; index--) {
    const check = row.checks[index];
    if (!["Failed", "Timed Out"].includes(check.status)) break;
    trailing.unshift(check);
  }
  let nextChecks: number[] = [];
  let scheduleError: string | null = null;
  try {
    if (monitor.enabled) nextChecks = nextStrataRuns(monitor.cron, now, 5);
  } catch (error) {
    scheduleError = error instanceof Error ? error.message : "Invalid schedule";
  }
  const fields = monitor.cron.trim().split(/\s+/);
  const request =
    monitor.kind === "command"
      ? monitor.target
      : `GET ${/^https?:\/\//i.test(monitor.target) ? monitor.target : `https://${monitor.target}`}`;
  return {
    row,
    displayId: strataMonitorDisplayId(monitors, id),
    index: monitors.findIndex((item) => item.id === id),
    nextChecks,
    scheduleError,
    fields: fields.length === 5 ? fields : [],
    trailingFailures: trailing.length,
    failureSince: trailing[0]?.startedAt ?? null,
    request,
    durations: row.checks.map((check) => ({
      name: new Date(check.startedAt).toISOString().slice(5, 16).replace("T", " "),
      load: check.loadSeconds,
      steps: check.stepsSeconds,
      confirm: check.confirmSeconds,
      total: strataCheckDuration(check),
    })),
  };
}
