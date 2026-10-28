import { createFilterQuery } from "@/components/reui/filters/filters-query";
import { resolveFilterOperators } from "@/components/reui/filters/filters-operators";
import type {
  FilterField,
  FilterNode,
  FilterQuery,
  FilterRule,
} from "@/components/reui/filters/filters-types";
import { REQUEST_HOSTS, REQUEST_NOW, REQUEST_REGIONS } from "./grid-base-api-request-logs-data";
import type {
  ApiRequest,
  ReplayDraft,
  RequestMethod,
  RequestStatusClass,
  RequestTimeRange,
  TrafficBucket,
  TrafficSummary,
} from "./grid-base-api-request-logs-types";

export function emptyRequestQuery(): FilterQuery {
  return createFilterQuery();
}

export const REQUEST_FILTER_FIELDS: FilterField[] = [
  { id: "status", label: "Status Code", type: "number" },
  {
    id: "method",
    label: "Method",
    type: "select",
    options: ["GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => ({ value, label: value })),
  },
  {
    id: "host",
    label: "Host",
    type: "select",
    options: REQUEST_HOSTS.map((value) => ({ value, label: value })),
  },
  { id: "path", label: "Path", description: "Includes query string", type: "text" },
  { id: "latency", label: "Latency (ms)", type: "number" },
  { id: "region", label: "Region", type: "select", options: REQUEST_REGIONS },
];

const fieldsById = new Map(REQUEST_FILTER_FIELDS.map((field) => [field.id, field]));
const requestMethods: RequestMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function statusClass(status: number): RequestStatusClass {
  if (Number.isInteger(status)) {
    if (status >= 200 && status < 300) return "2xx";
    if (status >= 400 && status < 500) return "4xx";
    if (status >= 500 && status < 600) return "5xx";
  }
  throw new RangeError("This local request demo supports 2xx, 4xx and 5xx status codes.");
}

function fieldValue(request: ApiRequest, id: string): string | number | undefined {
  switch (id) {
    case "status":
      return request.status;
    case "method":
      return request.method;
    case "host":
      return request.host;
    case "path":
      return request.path;
    case "latency":
      return request.latency;
    case "region":
      return request.region;
    default:
      return undefined;
  }
}

const supplied = (value: unknown) =>
  value !== undefined && value !== null && (typeof value !== "string" || value.trim() !== "");
const text = (value: unknown) => String(value ?? "").toLocaleLowerCase("en-US");

/** Only the six declared log fields are interpreted; Filters owns their UI/arity. */
function requestRuleMatches(request: ApiRequest, rule: FilterRule): boolean | undefined {
  if (rule.path.length !== 1) return undefined;
  const field = fieldsById.get(rule.path[0]!);
  if (!field || !rule.operator) return undefined;
  const operator = resolveFilterOperators(field).find((item) => item.value === rule.operator);
  if (!operator) return undefined;
  const raw = fieldValue(request, field.id);
  if (raw === undefined) return undefined;
  const values = Array.isArray(rule.value) ? rule.value : [rule.value];
  const arity = operator.arity ?? "one";
  if (arity !== "none") {
    if (!values.length || !values.every(supplied)) return undefined;
    if (arity === "one" && values.length !== 1) return undefined;
    if (arity === "range" && values.length !== 2) return undefined;
    if (
      field.type === "number" &&
      values.some(
        (value) =>
          (typeof value !== "string" && typeof value !== "number") ||
          !Number.isFinite(Number(value)),
      )
    )
      return undefined;
  }
  const expected = values[0];
  const equals = (value: unknown) =>
    field.type === "number" ? Number(raw) === Number(value) : text(raw) === text(value);
  let result: boolean;
  switch (rule.operator) {
    case "empty":
      result = raw === "";
      break;
    case "not_empty":
      result = raw !== "";
      break;
    case "is":
    case "eq":
      result = equals(expected);
      break;
    case "is_not":
    case "neq":
      result = !equals(expected);
      break;
    case "is_any_of":
      result = values.some(equals);
      break;
    case "is_none_of":
      result = !values.some(equals);
      break;
    case "contains":
      result = text(raw).includes(text(expected));
      break;
    case "not_contains":
      result = !text(raw).includes(text(expected));
      break;
    case "starts_with":
      result = text(raw).startsWith(text(expected));
      break;
    case "ends_with":
      result = text(raw).endsWith(text(expected));
      break;
    case "gt":
      result = Number(raw) > Number(expected);
      break;
    case "gte":
      result = Number(raw) >= Number(expected);
      break;
    case "lt":
      result = Number(raw) < Number(expected);
      break;
    case "lte":
      result = Number(raw) <= Number(expected);
      break;
    case "between":
      result = Number(raw) >= Number(values[0]) && Number(raw) <= Number(values[1]);
      break;
    case "not_between":
      result = !(Number(raw) >= Number(values[0]) && Number(raw) <= Number(values[1]));
      break;
    default:
      return undefined;
  }
  return rule.negated ? !result : result;
}

/** Same mature tri-state fold as the existing Prospect/Freight domain adapters. */
function requestNodeMatches(request: ApiRequest, node: FilterNode): boolean | undefined {
  if (node.type === "rule") return requestRuleMatches(request, node);
  const completed = node.rules
    .map((child) => requestNodeMatches(request, child))
    .filter((value): value is boolean => value !== undefined);
  if (!completed.length) return undefined;
  return node.combinator === "and" ? completed.every(Boolean) : completed.some(Boolean);
}

export function requestMatches(
  request: ApiRequest,
  criteria: {
    search: string;
    query: FilterQuery;
    range: RequestTimeRange;
    classes: RequestStatusClass[];
  },
): boolean {
  const { range } = criteria;
  if (
    !Number.isFinite(range.start) ||
    !Number.isFinite(range.end) ||
    !Number.isFinite(request.timestamp) ||
    range.start >= range.end ||
    request.timestamp < range.start ||
    request.timestamp >= range.end ||
    !criteria.classes.includes(statusClass(request.status))
  )
    return false;
  const search = criteria.search.trim().toLocaleLowerCase("en-US");
  if (
    search &&
    ![
      request.id,
      request.method,
      request.host,
      request.path,
      String(request.status),
      request.region,
      request.regionName,
      request.client,
      request.ip,
    ].some((value) => text(value).includes(search))
  )
    return false;
  return requestNodeMatches(request, criteria.query) ?? true;
}

export function summarizeTraffic(
  buckets: readonly TrafficBucket[],
  range: RequestTimeRange,
): TrafficSummary {
  const counts: Record<RequestStatusClass, number> = { "2xx": 0, "4xx": 0, "5xx": 0 };
  if (Number.isFinite(range.start) && Number.isFinite(range.end) && range.start < range.end) {
    for (const bucket of buckets) {
      if (bucket.timestamp < range.start || bucket.timestamp >= range.end) continue;
      counts["2xx"] += bucket["2xx"];
      counts["4xx"] += bucket["4xx"];
      counts["5xx"] += bucket["5xx"];
    }
  }
  const total = counts["2xx"] + counts["4xx"] + counts["5xx"];
  return {
    total,
    counts,
    errors: total ? ((counts["4xx"] + counts["5xx"]) / total) * 100 : 0,
    availability: total ? ((total - counts["5xx"]) / total) * 100 : 0,
  };
}

const requestTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
export function formatRequestTime(timestamp: number): string {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? requestTime.format(date) : "—";
}

let replaySequence = 0;

/** Records a synthetic local replay. It never sends HTTP or predicts an API result. */
export function createReplayRequest(
  draft: ReplayDraft,
  original?: ApiRequest,
  now = REQUEST_NOW - 1,
): ApiRequest {
  if (!requestMethods.includes(draft.method)) throw new Error("Choose a supported request method.");
  const host = draft.host.trim().toLowerCase();
  if (!REQUEST_HOSTS.includes(host)) throw new Error("Choose a Bricklane demo host.");
  const path = draft.path.trim();
  const invalidPathCharacter = [...path].some(
    (character) =>
      character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127 || character === "#",
  );
  if (!path.startsWith("/") || path.startsWith("//") || invalidPathCharacter)
    throw new Error("Enter an absolute request path without spaces or a fragment.");
  const region = REQUEST_REGIONS.find((item) => item.value === draft.region);
  if (!region) throw new Error("Choose a supported demo region.");
  if (!Number.isFinite(now) || !Number.isFinite(new Date(now).getTime()))
    throw new Error("Choose a valid replay time.");
  const id = `req-local-replay-${Math.trunc(now).toString(36)}-${++replaySequence}`;
  const responseBody = JSON.stringify(
    {
      localDemo: true,
      message: "Replay recorded locally. No HTTP request was sent.",
      replayedFrom: original?.id ?? null,
    },
    null,
    2,
  );
  return {
    id,
    timestamp: now,
    method: draft.method,
    host,
    path,
    status: 200,
    latency: 0,
    region: region.value,
    regionName: region.label,
    client: "Bricklane local replay",
    ip: original?.ip ?? "192.0.2.1",
    size: new TextEncoder().encode(responseBody).length,
    server: 0,
    transfer: 0,
    requestHeaders: { ...(original?.requestHeaders ?? {}) },
    responseHeaders: { "content-type": "application/json", "x-bricklane-local-demo": "true" },
    requestBody: original?.requestBody ?? "",
    responseBody,
  };
}
