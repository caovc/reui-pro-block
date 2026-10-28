import type { ApiRequest, RequestMethod, TrafficBucket } from "./grid-base-api-request-logs-types";

/** The original Bricklane demo's fixed, exclusive time-window endpoint. */
export const REQUEST_NOW = 1793188800000;
export const REQUEST_BUCKET_MS = 30 * 60 * 1000;

export const REQUEST_HOSTS = [
  "api.bricklane.test",
  "identity.bricklane.test",
  "events.bricklane.test",
];

export const REQUEST_REGIONS = [
  { value: "fra1", label: "Frankfurt, Germany" },
  { value: "iad1", label: "Ashburn, United States" },
  { value: "sin1", label: "Singapore" },
  { value: "syd1", label: "Sydney, Australia" },
  { value: "yul1", label: "Montreal, Canada" },
  { value: "gru1", label: "São Paulo, Brazil" },
];

export const REQUEST_RELEASES: { timestamp: number; label: string }[] = [
  { timestamp: REQUEST_NOW - 63 * 60 * 60 * 1000, label: "Catalog release 1.4" },
  { timestamp: REQUEST_NOW - 31 * 60 * 60 * 1000, label: "Checkout release 2.8" },
  { timestamp: REQUEST_NOW - 7 * 60 * 60 * 1000, label: "Identity release 3.2" },
];

const requestTemplates: {
  method: RequestMethod;
  host: number;
  path: string;
  status: number;
}[] = [
  { method: "GET", host: 0, path: "/v1/catalog/items?limit=24", status: 200 },
  { method: "POST", host: 0, path: "/v1/checkouts", status: 201 },
  { method: "GET", host: 1, path: "/v1/sessions/current", status: 401 },
  { method: "POST", host: 2, path: "/v1/events/batch", status: 202 },
  { method: "PATCH", host: 0, path: "/v1/orders/order-demo-42", status: 200 },
  { method: "GET", host: 0, path: "/v1/inventory/warehouse-demo-3", status: 503 },
  { method: "PUT", host: 1, path: "/v1/profiles/profile-demo-8", status: 200 },
  { method: "DELETE", host: 0, path: "/v1/carts/cart-demo-12", status: 204 },
  { method: "POST", host: 1, path: "/v1/tokens/refresh", status: 429 },
  { method: "GET", host: 2, path: "/v1/deliveries/delivery-demo-5", status: 502 },
  { method: "GET", host: 0, path: "/v1/catalog/items/item-demo-404", status: 404 },
  { method: "POST", host: 0, path: "/v1/quotes", status: 422 },
];

const clients = ["Bricklane Web/2.4", "Workshop CLI/0.9", "Checkout Worker/1.7"];

/** Synthetic request details, generated independently from aggregate traffic. */
function originalRequest(index: number, timestamp: number): ApiRequest {
  const template = requestTemplates[index % requestTemplates.length]!;
  const region = REQUEST_REGIONS[index % REQUEST_REGIONS.length]!;
  const id = `req-demo-${String(index + 1).padStart(3, "0")}`;
  const failed = template.status >= 400;
  const server = failed ? 72 + ((index * 53) % 580) : 12 + ((index * 29) % 148);
  const transfer = 5 + ((index * 11) % 37);
  const requestBody = ["POST", "PUT", "PATCH"].includes(template.method)
    ? JSON.stringify(
        { demo: true, reference: `workshop-${100 + index}`, quantity: 1 + (index % 4) },
        null,
        2,
      )
    : "";
  const responseBody =
    template.status === 204
      ? ""
      : JSON.stringify(
          failed
            ? {
                demo: true,
                error:
                  template.status >= 500 ? "demo_upstream_unavailable" : "demo_request_rejected",
                requestId: id,
              }
            : { demo: true, requestId: id, accepted: true },
          null,
          2,
        );
  return {
    id,
    timestamp,
    method: template.method,
    host: REQUEST_HOSTS[template.host]!,
    path: template.path,
    status: template.status,
    latency: server + transfer,
    region: region.value,
    regionName: region.label,
    client: clients[index % clients.length]!,
    ip: `${index % 2 ? "198.51.100" : "192.0.2"}.${11 + index}`,
    size: new TextEncoder().encode(responseBody).length,
    server,
    transfer,
    requestHeaders: {
      accept: "application/json",
      "content-type": "application/json",
      "x-bricklane-demo": "true",
      "x-request-id": id,
    },
    responseHeaders: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-bricklane-demo": "true",
      "x-request-id": id,
    },
    requestBody,
    responseBody,
  };
}

/** Twenty-eight recent records, plus twelve older records across the 72h scope. */
export const API_REQUESTS: ApiRequest[] = [
  ...Array.from({ length: 28 }, (_, index) =>
    originalRequest(index, REQUEST_NOW - (3 + index * 47) * 60 * 1000),
  ),
  ...Array.from({ length: 12 }, (_, index) =>
    originalRequest(
      index + 28,
      REQUEST_NOW - (25 + index * 4) * 60 * 60 * 1000 - index * 7 * 60 * 1000,
    ),
  ),
];

/**
 * Complete independent aggregate feed: 144 half-hour buckets in [NOW-72h,NOW).
 * These counts describe synthetic traffic, not a count of the sampled detail rows.
 */
export const TRAFFIC_BUCKETS: TrafficBucket[] = Array.from({ length: 144 }, (_, index) => {
  const timestamp = REQUEST_NOW - 72 * 60 * 60 * 1000 + index * REQUEST_BUCKET_MS;
  const hour = new Date(timestamp).getUTCHours();
  const daytime = hour >= 7 && hour < 20;
  const incident = index >= 111 && index <= 116;
  return {
    timestamp,
    "2xx": (daytime ? 12 : 5) + ((index * 7 + 3) % 19),
    "4xx": index % 11 === 0 ? 5 : (index * 3) % 4,
    "5xx": incident ? 3 + (index % 4) : index % 17 === 0 ? 1 : 0,
  };
});
