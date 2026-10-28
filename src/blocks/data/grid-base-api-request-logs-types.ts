export type RequestStatusClass = "2xx" | "4xx" | "5xx";
export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export interface ApiRequest {
  id: string;
  timestamp: number;
  method: RequestMethod;
  host: string;
  path: string;
  status: number;
  latency: number;
  region: string;
  regionName: string;
  client: string;
  ip: string;
  size: number;
  server: number;
  transfer: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody: string;
  responseBody: string;
}
export interface TrafficBucket {
  timestamp: number;
  "2xx": number;
  "4xx": number;
  "5xx": number;
}
/** Inclusive start, exclusive end, in UTC epoch milliseconds. */
export interface RequestTimeRange {
  start: number;
  end: number;
}
export interface TrafficSummary {
  total: number;
  errors: number;
  availability: number;
  counts: Record<RequestStatusClass, number>;
}
export interface ReplayDraft {
  method: RequestMethod;
  host: string;
  path: string;
  region: string;
}
