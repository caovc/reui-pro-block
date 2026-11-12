import { STRATA_NOW, strataOwner, strataService } from "./strata-domain.ts";
import type { StrataLogEvent } from "./strata-logs-model.ts";

export type StrataLogExportScope = "filtered" | "selected";
export type StrataLogExportFormat = "csv" | "json";

/** Selection is restricted to the current matching result, across every page. */
export function strataLogExportRows(
  filtered: readonly StrataLogEvent[],
  selectedIds: readonly string[],
  scope: StrataLogExportScope,
): StrataLogEvent[] {
  const selected = new Set(selectedIds);
  return filtered.filter((event) => scope === "filtered" || selected.has(event.id));
}

export function strataLogExportRecord(event: StrataLogEvent) {
  const service = strataService(event.serviceId ?? "");
  return {
    id: event.id,
    timestamp: event.timestamp,
    level: event.level,
    event: event.event,
    category: event.category,
    owner: strataOwner(event.ownerId)?.name ?? event.ownerId,
    ownerId: event.ownerId,
    service: service?.name ?? event.serviceId,
    serviceId: event.serviceId,
    environment: event.environment ?? "",
    cluster: event.cluster,
    resource: event.resource,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    source: event.source,
    podIp: event.podIp,
    traceId: event.traceId,
    incidentId: event.incidentId,
    message: event.message,
    version: event.version,
    afterRelease: event.afterRelease,
    reviewed: event.reviewed,
  };
}

/** RFC4180 quoting plus spreadsheet formula protection for editable string cells. */
export function strataLogCsvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^\s*[=+\-@]/u.test(text) || /^[\t\r]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeStrataLogsCsv(events: readonly StrataLogEvent[]): string {
  const header = [
    "id",
    "timestamp",
    "level",
    "event",
    "category",
    "owner",
    "ownerId",
    "service",
    "serviceId",
    "environment",
    "cluster",
    "resource",
    "resourceType",
    "resourceId",
    "source",
    "podIp",
    "traceId",
    "incidentId",
    "message",
    "version",
    "afterRelease",
    "reviewed",
  ] as const satisfies readonly (keyof ReturnType<typeof strataLogExportRecord>)[];
  const rows = events.map((event) => {
    const record = strataLogExportRecord(event);
    return header.map((key) => record[key]);
  });
  return [header, ...rows].map((row) => row.map(strataLogCsvCell).join(",")).join("\r\n") + "\r\n";
}

export function serializeStrataLogsJson(events: readonly StrataLogEvent[]): string {
  return JSON.stringify(events.map(strataLogExportRecord), null, 2) + "\n";
}

export function createStrataLogExport(
  events: readonly StrataLogEvent[],
  format: StrataLogExportFormat,
  scope: StrataLogExportScope,
) {
  return {
    filename: `bricklane-events-${scope}-${STRATA_NOW.slice(0, 10)}.${format}`,
    mimeType: format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8",
    text: format === "csv" ? serializeStrataLogsCsv(events) : serializeStrataLogsJson(events),
  };
}

export function downloadStrataLogExport(exported: ReturnType<typeof createStrataLogExport>) {
  const blob = new Blob([exported.text], { type: exported.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exported.filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
