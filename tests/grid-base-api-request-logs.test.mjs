import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Same real-module loader pattern as solution-dispatch-map-model.test.mjs.
// Resolve the installed project tools and frozen source from the invoking repository.
const repository = resolve(process.cwd());
const require = createRequire(join(repository, "package.json"));
const ts = require("typescript");
const directory = await mkdtemp(join(tmpdir(), "bricklane-api-request-model-"));
after(() => rm(directory, { recursive: true, force: true }));

const modules = [
  ["src/components/reui/filters/filters-query.tsx", "filters-query"],
  ["src/components/reui/filters/filters-operators.tsx", "filters-operators"],
  ["src/blocks/data/grid-base-api-request-logs-data.ts", "grid-base-api-request-logs-data"],
  ["src/blocks/data/grid-base-api-request-logs-model.ts", "grid-base-api-request-logs-model"],
];
const imports = new Map([
  ["@/components/reui/filters/filters-query", "./filters-query.mjs"],
  ["@/components/reui/filters/filters-operators", "./filters-operators.mjs"],
  ["./grid-base-api-request-logs-data", "./grid-base-api-request-logs-data.mjs"],
]);

for (const [relativePath, name] of modules) {
  const fileName = join(repository, relativePath);
  const source = await readFile(fileName, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName,
    reportDiagnostics: true,
  });
  assert.equal(
    output.diagnostics?.filter((item) => item.category === ts.DiagnosticCategory.Error).length,
    0,
    `The real source module must transpile: ${relativePath}`,
  );
  const javascript = output.outputText.replace(/from (["'])([^"']+)\1/g, (match, _quote, name) => {
    const mapped = imports.get(name);
    if (mapped) return `from "${mapped}"`;
    assert.ok(!name.startsWith("@/") && !name.startsWith("."), `Unmapped real dependency: ${name}`);
    return match;
  });
  await writeFile(join(directory, `${name}.mjs`), javascript);
}

const {
  API_REQUESTS,
  TRAFFIC_BUCKETS,
  REQUEST_NOW,
  REQUEST_BUCKET_MS,
  REQUEST_HOSTS,
  REQUEST_REGIONS,
  REQUEST_RELEASES,
} = await import(pathToFileURL(join(directory, "grid-base-api-request-logs-data.mjs")));
const {
  emptyRequestQuery,
  requestMatches,
  summarizeTraffic,
  formatRequestTime,
  createReplayRequest,
} = await import(pathToFileURL(join(directory, "grid-base-api-request-logs-model.mjs")));

const hour = 60 * 60 * 1000;
const classes = ["2xx", "4xx", "5xx"];
const defaultRange = { start: REQUEST_NOW - 24 * hour, end: REQUEST_NOW };
let filterNodeSequence = 0;
const rule = (field, operator, value, negated = false) => ({
  id: `${field}-${operator}-${++filterNodeSequence}`,
  type: "rule",
  path: [field],
  operator,
  value,
  negated,
});
const group = (rules, combinator = "and") => ({
  id: `group-${combinator}-${++filterNodeSequence}`,
  type: "group",
  combinator,
  rules,
});
const criteria = (patch = {}) => ({
  search: "",
  query: emptyRequestQuery(),
  range: defaultRange,
  classes,
  ...patch,
});
const record = (patch = {}) => ({
  ...structuredClone(API_REQUESTS[0]),
  id: "isolated-request",
  timestamp: REQUEST_NOW - hour,
  host: REQUEST_HOSTS[0],
  method: "GET",
  status: 200,
  path: "/v1/orders/check?draft=true",
  latency: 10,
  ...patch,
});

test("original logs cover the default window and all six regions beside an independent complete 72h feed", () => {
  assert.ok(API_REQUESTS.length > 28);
  assert.equal(new Set(API_REQUESTS.map((entry) => entry.id)).size, API_REQUESTS.length);
  const visible = API_REQUESTS.filter((entry) => requestMatches(entry, criteria()));
  assert.ok(visible.length >= 28, "Default 24h has at least 28 detailed requests");
  assert.ok(API_REQUESTS.some((entry) => entry.timestamp < defaultRange.start));
  assert.deepEqual(
    [...new Set(API_REQUESTS.map((entry) => entry.region))].sort(),
    REQUEST_REGIONS.map((entry) => entry.value).sort(),
  );
  assert.equal(REQUEST_REGIONS.length, 6);
  assert.equal(REQUEST_BUCKET_MS, 30 * 60 * 1000);
  assert.equal(TRAFFIC_BUCKETS.length, (72 * hour) / REQUEST_BUCKET_MS);
  assert.equal(TRAFFIC_BUCKETS[0].timestamp, REQUEST_NOW - 72 * hour);
  assert.equal(TRAFFIC_BUCKETS.at(-1).timestamp + REQUEST_BUCKET_MS, REQUEST_NOW);
  for (let index = 0; index < TRAFFIC_BUCKETS.length; index++) {
    const bucket = TRAFFIC_BUCKETS[index];
    if (index)
      assert.equal(bucket.timestamp - TRAFFIC_BUCKETS[index - 1].timestamp, REQUEST_BUCKET_MS);
    for (const key of classes) assert.ok(Number.isInteger(bucket[key]) && bucket[key] >= 0);
  }
  const aggregate = summarizeTraffic(TRAFFIC_BUCKETS, defaultRange);
  assert.ok(aggregate.total > visible.length, "Aggregate traffic is not the sampled log count");
  const aggregateBefore = structuredClone(aggregate);
  const filtered = API_REQUESTS.filter((entry) =>
    requestMatches(entry, criteria({ search: "no-such-record" })),
  );
  assert.equal(filtered.length, 0);
  assert.deepEqual(summarizeTraffic(TRAFFIC_BUCKETS, defaultRange), aggregateBefore);
  for (const release of REQUEST_RELEASES) {
    assert.ok(release.timestamp >= TRAFFIC_BUCKETS[0].timestamp && release.timestamp < REQUEST_NOW);
    assert.ok(release.label.trim());
  }
});

test("nested OR and negation intersect with the current status mask and time range", () => {
  const query = group([
    group([rule("method", "is", "GET"), rule("status", "gte", 500)], "or"),
    rule("path", "contains", "/v1/orders"),
    rule("host", "is", REQUEST_HOSTS[1], true),
  ]);
  const records = [
    record({ id: "get" }),
    record({ id: "error", method: "POST", status: 503 }),
    record({ id: "other-host", host: REQUEST_HOSTS[1] }),
    record({ id: "other-path", path: "/v1/catalog/items" }),
    record({ id: "outside-time", timestamp: defaultRange.start - 1 }),
    record({ id: "masked-status", status: 404 }),
  ];
  assert.deepEqual(
    records
      .filter((entry) => requestMatches(entry, criteria({ query, classes: ["2xx", "5xx"] })))
      .map((entry) => entry.id),
    ["get", "error"],
  );
  assert.equal(requestMatches(records[0], criteria({ query, classes: ["5xx"] })), false);
  assert.equal(requestMatches(records[1], criteria({ query, classes: ["5xx"] })), true);
  assert.equal(requestMatches(records[0], criteria({ query, search: "catalog" })), false);
});

test("unfinished and empty OR branches do not become true, while numeric zero remains a real condition", () => {
  const entry = record({ latency: 0 });
  const drafts = group(
    [
      rule("method", "is", "DELETE"),
      group([], "or"),
      group([rule("latency", "between", [0, undefined], true)], "or"),
      rule("status", "", undefined),
    ],
    "or",
  );
  assert.equal(requestMatches(entry, criteria({ query: drafts })), false);
  assert.equal(requestMatches(entry, criteria({ query: group([rule("latency", "eq", 0)]) })), true);
  assert.equal(
    requestMatches(entry, criteria({ query: group([rule("latency", "eq", 0, true)]) })),
    false,
  );
  assert.equal(requestMatches(entry, criteria({ query: group([group([], "or")]) })), true);
  assert.equal(
    requestMatches(entry, criteria({ query: group([rule("status", "gte", undefined)]) })),
    true,
  );
});

test("request and aggregate ranges include the start and exclude the end", () => {
  const start = REQUEST_NOW - 4 * REQUEST_BUCKET_MS;
  const range = { start, end: start + 2 * REQUEST_BUCKET_MS };
  const records = [
    record({ id: "before", timestamp: start - 1 }),
    record({ id: "start", timestamp: start }),
    record({ id: "inside", timestamp: range.end - 1 }),
    record({ id: "end", timestamp: range.end }),
  ];
  assert.deepEqual(
    records.filter((entry) => requestMatches(entry, criteria({ range }))).map((entry) => entry.id),
    ["start", "inside"],
  );
  const buckets = [
    { timestamp: start - REQUEST_BUCKET_MS, "2xx": 999, "4xx": 999, "5xx": 999 },
    { timestamp: start, "2xx": 2, "4xx": 0, "5xx": 1 },
    { timestamp: start + REQUEST_BUCKET_MS, "2xx": 1, "4xx": 2, "5xx": 0 },
    { timestamp: range.end, "2xx": 999, "4xx": 999, "5xx": 999 },
  ];
  const summary = summarizeTraffic(buckets, range);
  assert.equal(summary.total, 6);
  assert.deepEqual(summary.counts, { "2xx": 3, "4xx": 2, "5xx": 1 });
  assert.equal(summary.errors, 50, "Errors is a percentage including 4xx and 5xx");
  assert.ok(
    Math.abs(summary.availability - 83.33333333333333) < 1e-10,
    "4xx does not lower availability",
  );
});

test("empty or disjoint traffic has zero denominators without invented perfect availability", () => {
  const empty = { total: 0, errors: 0, availability: 0, counts: { "2xx": 0, "4xx": 0, "5xx": 0 } };
  assert.deepEqual(summarizeTraffic([], defaultRange), empty);
  assert.deepEqual(
    summarizeTraffic(TRAFFIC_BUCKETS, { start: REQUEST_NOW, end: REQUEST_NOW + hour }),
    empty,
  );
  assert.deepEqual(
    summarizeTraffic(TRAFFIC_BUCKETS, { start: REQUEST_NOW, end: REQUEST_NOW }),
    empty,
  );
});

test("local replay generates unique records, keeps exact payload and clones headers without a network call", () => {
  const original = record({
    requestBody: '  {"reference":"keep whitespace","value":0}\n',
    requestHeaders: { "content-type": "application/json", "x-original": "retained" },
  });
  const before = structuredClone(original);
  Object.freeze(original.requestHeaders);
  Object.freeze(original.responseHeaders);
  Object.freeze(original);
  const draft = {
    method: "POST",
    host: REQUEST_HOSTS[1],
    path: "/v1/replay/check?retain=1",
    region: REQUEST_REGIONS[1].value,
  };
  const previousFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = () => {
    fetchCalls++;
    throw new Error("A local replay must not call fetch");
  };
  let first;
  let second;
  let defaultTimeReplay;
  try {
    first = createReplayRequest(draft, original, REQUEST_NOW - 1);
    second = createReplayRequest(draft, original, REQUEST_NOW - 1);
    defaultTimeReplay = createReplayRequest(draft, original);
  } finally {
    globalThis.fetch = previousFetch;
  }
  assert.equal(fetchCalls, 0);
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.id, original.id);
  assert.equal(first.timestamp, REQUEST_NOW - 1);
  assert.equal(first.requestBody, before.requestBody);
  assert.deepEqual(first.requestHeaders, before.requestHeaders);
  assert.notEqual(first.requestHeaders, original.requestHeaders);
  assert.notEqual(first.requestHeaders, second.requestHeaders);
  assert.deepEqual(original, before);
  assert.equal(first.host, draft.host);
  assert.equal(first.path, draft.path);
  assert.equal(first.method, draft.method);
  assert.equal(first.region, draft.region);
  assert.equal(JSON.parse(first.responseBody).localDemo, true);
  first.requestHeaders["x-original"] = "changed on replay";
  assert.equal(original.requestHeaders["x-original"], "retained");
  assert.equal(second.requestHeaders["x-original"], "retained");
  assert.equal(requestMatches(defaultTimeReplay, criteria()), true);
});

test("time formatting keeps cross-day context in UTC without duplicating the UI timezone suffix", () => {
  assert.equal(formatRequestTime(Date.UTC(2026, 9, 26, 14, 59, 5)), "Oct 26, 14:59:05");
  assert.equal(formatRequestTime(Date.UTC(2026, 9, 27, 0, 0, 0)), "Oct 27, 00:00:00");
  assert.equal(formatRequestTime(Number.NaN), "—");
});
