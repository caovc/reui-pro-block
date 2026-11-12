import test from "node:test";
import assert from "node:assert/strict";
import {
  createStrataLogExport,
  serializeStrataLogsCsv,
  serializeStrataLogsJson,
  strataLogCsvCell,
  strataLogExportRecord,
  strataLogExportRows,
} from "../src/templates/workflow/strata-log-export.ts";
import {
  createStrataLogSeed,
  createStrataLogsDisplay,
  clearStrataLogFilters,
  selectStrataLogView,
  createStrataLogDraft,
  strataLogResourceId,
  STRATA_LOG_CATEGORIES,
  STRATA_LOG_SOURCES,
  STRATA_LOG_ENVIRONMENTS,
  STRATA_LOG_CLUSTERS,
  STRATA_LOG_RESOURCE_TYPES,
  filterStrataLogs,
  makeStrataLogEvent,
  scopeStrataLogs,
  strataLogBuckets,
  summarizeStrataLogs,
  validateStrataLogInput,
} from "../src/templates/workflow/strata-logs-model.ts";
import {
  STRATA_INCIDENT_ID,
  STRATA_NOW,
  STRATA_NOW_MS,
  STRATA_OWNERS,
  STRATA_SERVICES,
} from "../src/templates/workflow/strata-domain.ts";

// Independent RFC4180 reader for the exported bytes, including multiline cells.
function readCsv(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else quoted = !quoted;
    } else if (!quoted && character === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && character === "\r" && text[index + 1] === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      index++;
    } else cell += character;
  }
  assert.equal(quoted, false, "all CSV quotes close");
  assert.equal(cell, "", "CSV has a complete final CRLF");
  return rows;
}

const emptyQuery = () => ({ id: "query", type: "group", combinator: "and", rules: [] });
const rule = (path, operator, value, negated = false) => ({
  id: `${path}-${operator}`,
  type: "rule",
  path: [path],
  operator,
  value,
  negated,
});
const options = (overrides = {}) => ({
  search: "",
  levels: ["info", "warn", "error"],
  view: "all",
  query: emptyQuery(),
  ...overrides,
});
const validInput = () => ({
  ...createStrataLogDraft(),
  event: "deployment.checked",
  resourceName: "checkout-api",
  summary: "Local event.",
});

test("Logs seed has 62 independent stable events, 54/4/4 levels and all nine real owners", () => {
  const events = createStrataLogSeed();
  assert.equal(events.length, 62);
  assert.equal(new Set(events.map((event) => event.id)).size, 62);
  assert.equal(new Set(events.map((event) => event.timestamp)).size, 62);
  const summary = summarizeStrataLogs(events);
  assert.deepEqual(summary.levels, { info: 54, warn: 4, error: 4 });
  assert.equal(summary.owners, 9);
  assert.equal(summary.warningOwners, 4);
  assert.equal(summary.afterRelease, 2);
  assert.equal(summary.unreviewed, 4);
  for (const event of events) {
    assert.ok(STRATA_SERVICES.some((service) => service.id === event.serviceId));
    assert.ok(STRATA_OWNERS.some((owner) => owner.id === event.ownerId));
    assert.ok(Date.parse(event.timestamp) <= STRATA_NOW_MS);
  }
  const fresh = createStrataLogSeed();
  events[0].reviewed = true;
  assert.equal(fresh[0].reviewed, false);
});

test("Checkout release events retain the shared incident, service and chronological relationship", () => {
  const incident = createStrataLogSeed().filter((event) => event.incidentId === STRATA_INCIDENT_ID);
  assert.equal(incident.length, 10);
  assert.ok(incident.every((event) => ["checkout-api", "payments-api"].includes(event.serviceId)));
  const deployment = incident.find((event) => event.event === "deployment.create");
  const failure = incident.find((event) => event.event === "http.request.failed");
  const acknowledged = incident.find((event) => event.event === "incident.acknowledged");
  assert.equal(deployment.version, "v3.5.0");
  assert.ok(deployment.timestamp < failure.timestamp);
  assert.ok(failure.timestamp < acknowledged.timestamp);
});

test("Range and environment scope use real timestamps and services", () => {
  const events = createStrataLogSeed();
  assert.equal(scopeStrataLogs(events, "all", "1h").length, 10);
  assert.equal(scopeStrataLogs(events, "all", "7d").length, 62);
  const staging = scopeStrataLogs(events, "Staging", "7d");
  assert.ok(staging.length > 0);
  assert.ok(staging.every((event) => event.serviceId === "edge-gateway"));
  assert.equal(
    scopeStrataLogs([{ ...events[0], timestamp: "2026-10-22T14:00:01.000Z" }], "all", "7d").length,
    0,
  );
});

test("Chart buckets conserve matching events, including both inclusive time boundaries", () => {
  const seed = createStrataLogSeed();
  const boundaries = [
    { ...seed[0], id: "first", timestamp: new Date(STRATA_NOW_MS - 168 * 3_600_000).toISOString() },
    { ...seed[0], id: "now", timestamp: STRATA_NOW },
  ];
  for (const events of [seed, boundaries]) {
    const buckets = strataLogBuckets(scopeStrataLogs(events, "all", "7d"), "7d");
    assert.equal(
      buckets.reduce((sum, bucket) => sum + bucket.info + bucket.warn + bucket.error, 0),
      events.length,
    );
    assert.ok(buckets.every((bucket) => new Date(bucket.timestamp).getUTCHours() % 6 === 0));
  }
});

test("Search and level/saved filters compose on actual owner, service, trace and incident fields", () => {
  const seed = createStrataLogSeed();
  assert.equal(
    filterStrataLogs(seed, options({ search: "B71C000000000001" }))[0].traceId,
    "b71c000000000001",
  );
  assert.ok(
    filterStrataLogs(
      seed,
      options({ search: "Maya Ellis", view: "checkout", levels: ["error"] }),
    ).every(
      (event) =>
        event.ownerId === "maya" &&
        event.level === "error" &&
        event.incidentId === STRATA_INCIDENT_ID,
    ),
  );
  assert.equal(filterStrataLogs(seed, options({ view: "warnings" })).length, 4);
  assert.equal(filterStrataLogs(seed, options({ levels: [] })).length, 0);
});

test("Generic query honors nested OR, negation and empty optional trace fields", () => {
  const seed = createStrataLogSeed();
  const query = {
    id: "query",
    type: "group",
    combinator: "or",
    rules: [rule("level", "is", "warn"), rule("level", "is", "error")],
  };
  assert.equal(filterStrataLogs(seed, options({ query })).length, 8);
  const empty = { ...emptyQuery(), rules: [rule("traceId", "empty")] };
  const notEmpty = { ...emptyQuery(), rules: [rule("traceId", "empty", undefined, true)] };
  const blank = filterStrataLogs(seed, options({ query: empty }));
  const populated = filterStrataLogs(seed, options({ query: notEmpty }));
  assert.equal(blank.length + populated.length, 62);
  assert.ok(blank.every((event) => !event.traceId));
  assert.ok(populated.every((event) => event.traceId));
});

test("Filtered export includes every matching page and selected export uses its intersection in display order", () => {
  const events = createStrataLogSeed();
  const ids = [events[45].id, events[2].id, events[45].id, "missing"];
  const before = JSON.stringify(events);
  assert.equal(strataLogExportRows(events, ids, "filtered").length, 62);
  assert.deepEqual(
    strataLogExportRows(events, ids, "selected").map((event) => event.id),
    [events[2].id, events[45].id],
  );
  assert.deepEqual(strataLogExportRows(events.slice(10, 20), ids, "selected"), []);
  assert.equal(JSON.stringify(events), before);
});

test("CSV roundtrips commas, double quotes, multiline CRLF and Unicode through independent parsing", () => {
  const event = {
    ...createStrataLogSeed()[0],
    resource: 'queue, "priority"',
    message: 'Māia, “ready”\r\nNext "line"\nDone',
  };
  const rows = readCsv(serializeStrataLogsCsv([event]));
  assert.equal(rows.length, 2);
  assert.equal(rows[0].length, 22);
  assert.equal(rows[1].length, 22);
  const record = Object.fromEntries(rows[0].map((name, index) => [name, rows[1][index]]));
  assert.equal(record.resource, event.resource);
  assert.equal(record.message, event.message);
  assert.equal(record.timestamp, event.timestamp);
});

test("CSV neutralizes spreadsheet formulas while JSON retains the exact original string", () => {
  for (const value of [
    '=HYPERLINK("https://example.test")',
    "+SUM(1,2)",
    "-1+1",
    "@SUM(A1)",
    "  =A1",
    "\t=A1",
    "\r=A1",
  ]) {
    const event = { ...createStrataLogSeed()[0], message: value };
    const [header, row] = readCsv(serializeStrataLogsCsv([event]));
    assert.equal(row[header.indexOf("message")], `'${value}`);
    assert.equal(JSON.parse(serializeStrataLogsJson([event]))[0].message, value);
  }
  assert.equal(strataLogCsvCell('plain "text"'), '"plain ""text"""');
});

test("Export service association and explicit Origin are not fabricated from a resource label", () => {
  const event = {
    ...createStrataLogSeed()[0],
    serviceId: "edge-gateway",
    environment: "Staging",
    resource: "checkout-api",
  };
  const record = strataLogExportRecord(event);
  assert.equal(record.service, "edge-gateway");
  assert.equal(record.serviceId, "edge-gateway");
  assert.equal(record.environment, "Staging");
  assert.equal(record.owner, "Iris Chen");
  const unknown = strataLogExportRecord({ ...event, serviceId: "unknown-service" });
  assert.equal(unknown.service, "unknown-service");
  assert.equal(unknown.environment, "Staging");
  assert.equal(
    strataLogExportRecord({ ...event, serviceId: "unknown-service", environment: undefined })
      .environment,
    "",
  );
});

test("CSV and JSON retain stable extended fields, booleans and incident links for all 62 records", () => {
  const events = createStrataLogSeed();
  const [header, ...csv] = readCsv(serializeStrataLogsCsv(events));
  const json = JSON.parse(serializeStrataLogsJson(events));
  assert.deepEqual(header, Object.keys(json[0]));
  assert.equal(csv.length, 62);
  assert.equal(json.length, 62);
  assert.deepEqual(
    csv.map((row) => row[header.indexOf("id")]),
    json.map((record) => record.id),
  );
  assert.equal(json[0].incidentId, STRATA_INCIDENT_ID);
  assert.equal(typeof json[0].reviewed, "boolean");
  assert.equal(json.at(-1).incidentId, null);
  assert.equal(csv.at(-1)[header.indexOf("incidentId")], "");
});

test("Empty filtered exports are valid header-only CSV and empty-array JSON", () => {
  assert.equal(readCsv(serializeStrataLogsCsv([])).length, 1);
  assert.deepEqual(JSON.parse(serializeStrataLogsJson([])), []);
  const csv = createStrataLogExport([], "csv", "filtered");
  assert.equal(csv.filename, "bricklane-events-filtered-2026-10-22.csv");
  assert.equal(csv.mimeType, "text/csv;charset=utf-8");
  const json = createStrataLogExport([], "json", "selected");
  assert.equal(json.filename, "bricklane-events-selected-2026-10-22.json");
  assert.equal(json.mimeType, "application/json;charset=utf-8");
});

test("Observed Add event defaults and every menu order are preserved in typed draft data", () => {
  const draft = createStrataLogDraft();
  assert.deepEqual(STRATA_LOG_CATEGORIES, ["Deploy", "Config", "Secret", "Access", "Infra"]);
  assert.deepEqual(STRATA_LOG_SOURCES, [
    "Console",
    "Kubernetes",
    "OTLP",
    "Synthetics",
    "GitHub Actions",
  ]);
  assert.deepEqual(STRATA_LOG_ENVIRONMENTS, ["Production", "Staging", "Sandbox"]);
  assert.deepEqual(STRATA_LOG_CLUSTERS, [
    "none",
    "prod-eu-central-1",
    "prod-us-east-1",
    "staging-us-east-1",
  ]);
  assert.deepEqual(STRATA_LOG_RESOURCE_TYPES, [
    "Deployment",
    "Service",
    "Route",
    "Database",
    "Secret",
    "Incident",
    "API key",
    "Alert",
    "Job",
  ]);
  assert.equal(draft.category, "Infra");
  assert.equal(draft.ownerId, "maya");
  assert.equal(draft.source, "OTLP");
  assert.equal(draft.environment, "Production");
  assert.equal(draft.cluster, "prod-eu-central-1");
  assert.equal(draft.resourceType, "Service");
  for (const removed of ["timestamp", "traceId", "serviceId"])
    assert.equal(Object.hasOwn(draft, removed), false);
});

test("Local validation uses the observed schema and accepts resources outside shared services", () => {
  assert.deepEqual(validateStrataLogInput(validInput()), {});
  for (const [field, value] of [
    ["event", " "],
    ["ownerId", "missing"],
    ["category", "unknown"],
    ["level", "fatal"],
    ["source", "unknown"],
    ["environment", "Development"],
    ["cluster", "missing"],
    ["resourceType", "unknown"],
    ["resourceName", " "],
    ["podIp", "999.1.1.1"],
    ["summary", "a".repeat(2001)],
  ]) {
    assert.ok(validateStrataLogInput({ ...validInput(), [field]: value })[field], field);
  }
  const input = { ...validInput(), resourceName: " satellite-inventory ", podIp: "" };
  const created = makeStrataLogEvent(input, "BL-EVT-0063");
  assert.equal(created.resource, "satellite-inventory");
  assert.equal(created.serviceId, null);
  assert.equal(created.timestamp, STRATA_NOW);
  assert.equal(created.traceId, "");
  assert.equal(created.incidentId, null);
  assert.equal(created.reviewed, false);
  assert.throws(
    () => makeStrataLogEvent({ ...input, ownerId: "missing" }, "bad"),
    /Invalid local event/,
  );
});

test("Blank resource IDs are name-derived, explicit handles survive, and resource IDs need not be event-unique", () => {
  const input = { ...validInput(), resourceName: "Payments / Checkout" };
  const first = makeStrataLogEvent(input, "first");
  const second = makeStrataLogEvent(input, "second");
  assert.equal(first.resourceId, "payments-checkout");
  assert.equal(second.resourceId, first.resourceId);
  assert.equal(
    makeStrataLogEvent({ ...input, resourceId: "BL-INC-350" }, "third").resourceId,
    "BL-INC-350",
  );
  assert.equal(strataLogResourceId("結算服務"), "結算服務");
  assert.equal(strataLogResourceId("💳"), strataLogResourceId("💳"));
  assert.ok(strataLogResourceId("💳").length > 0);
});

test("Origin Staging stays authoritative even when the Service resource links to a Production service", () => {
  const event = makeStrataLogEvent(
    { ...validInput(), environment: "Staging", cluster: "staging-us-east-1" },
    "staging-event",
  );
  assert.equal(event.serviceId, "checkout-api");
  assert.equal(
    STRATA_SERVICES.find((service) => service.id === event.serviceId).environment,
    "Production",
  );
  assert.equal(strataLogExportRecord(event).environment, "Staging");
  assert.equal(strataLogExportRecord(event).cluster, "staging-us-east-1");
  assert.deepEqual(scopeStrataLogs([event], "Production", "7d"), []);
  assert.deepEqual(
    scopeStrataLogs([event], "Staging", "7d").map((record) => record.id),
    [event.id],
  );
});

test("Sandbox is preserved without a Development alias and None cluster is a real empty value", () => {
  const event = makeStrataLogEvent(
    {
      ...validInput(),
      environment: "Sandbox",
      cluster: "none",
      resourceType: "Route",
      resourceName: "POST /sandbox/check",
    },
    "sandbox-event",
  );
  const exported = strataLogExportRecord(event);
  assert.equal(event.serviceId, null);
  assert.equal(exported.environment, "Sandbox");
  assert.equal(exported.cluster, null);
  assert.equal(exported.service, null);
  assert.equal(scopeStrataLogs([event], "Sandbox", "7d").length, 1);
  assert.equal(scopeStrataLogs([event], "Development", "7d").length, 0);
  const query = { ...emptyQuery(), rules: [rule("environment", "is", "Sandbox")] };
  assert.equal(filterStrataLogs([event], options({ query })).length, 1);
});

test("Fixed Now and empty trace cannot be spoofed through removed legacy input fields", () => {
  const event = makeStrataLogEvent(
    {
      ...validInput(),
      timestamp: "2000-01-01T00:00:00Z",
      traceId: "guessed-input",
      serviceId: "fake-input",
    },
    "event",
  );
  assert.equal(event.timestamp, STRATA_NOW);
  assert.equal(event.traceId, "");
  assert.equal(event.serviceId, "checkout-api");
});

test("New editable Resource ID and Summary are safe CSV cells while JSON keeps their exact stored strings", () => {
  const event = makeStrataLogEvent(
    {
      ...validInput(),
      resourceName: "=custom-resource",
      resourceId: "+custom-id",
      summary: "  =SUM(1,2)\r\n“原值”",
    },
    "metadata-event",
  );
  const [header, row] = readCsv(serializeStrataLogsCsv([event]));
  const json = JSON.parse(serializeStrataLogsJson([event]))[0];
  assert.deepEqual(header, Object.keys(json));
  for (const key of ["resource", "resourceId", "message"])
    assert.equal(row[header.indexOf(key)], `'${json[key]}`);
  assert.equal(json.message, "  =SUM(1,2)\r\n“原值”");
  assert.equal(json.resource, "=custom-resource");
  assert.equal(json.resourceId, "+custom-id");
  assert.equal(json.category, "Infra");
  assert.equal(json.resourceType, "Service");
  assert.equal(json.environment, "Production");
  assert.equal(json.serviceId, null);
});

test("Observed Errors payments preset uses real Level/Owner rules,7d and all chart-level toggles", () => {
  const display = createStrataLogsDisplay("errors-payments");
  assert.equal(display.range, "7d");
  assert.deepEqual(display.levels, ["info", "warn", "error"]);
  assert.equal(display.search, "");
  assert.equal(display.view, "errors-payments");
  assert.equal(display.query.combinator, "and");
  assert.equal(display.query.rules.length, 2);
  const [level, owner] = display.query.rules;
  assert.deepEqual([level.path, level.operator, level.value], [["level"], "is", "error"]);
  assert.deepEqual(
    [owner.path, owner.operator, owner.value],
    [["ownerId"], "is_any_of", ["maya", "leila"]],
  );
  assert.ok(owner.value.every((id) => STRATA_OWNERS.some((item) => item.id === id)));
  const scoped = scopeStrataLogs(createStrataLogSeed(), "all", display.range);
  const filtered = filterStrataLogs(scoped, display);
  assert.deepEqual(
    filtered.map((event) => event.id),
    ["BL-EVT-0005", "BL-EVT-0006"],
  );
  assert.equal(summarizeStrataLogs(filtered).owners, 1);
  assert.ok(
    filtered.every(
      (event) =>
        event.level === "error" &&
        event.ownerId === "maya" &&
        event.incidentId === STRATA_INCIDENT_ID,
    ),
  );
});

test("Pinned chart buckets derive0Info/0Warn/2Error while independent review still derives four warnings", () => {
  const display = createStrataLogsDisplay("errors-payments");
  const scoped = scopeStrataLogs(createStrataLogSeed(), "all", display.range);
  const filtered = filterStrataLogs(scoped, display);
  assert.deepEqual(summarizeStrataLogs(filtered).levels, { info: 0, warn: 0, error: 2 });
  const total = strataLogBuckets(filtered, display.range).reduce(
    (sum, bucket) => ({
      info: sum.info + bucket.info,
      warn: sum.warn + bucket.warn,
      error: sum.error + bucket.error,
    }),
    { info: 0, warn: 0, error: 0 },
  );
  assert.deepEqual(total, { info: 0, warn: 0, error: 2 });
  const review = summarizeStrataLogs(scoped);
  assert.equal(review.warnings.length, 4);
  assert.equal(review.warningOwners, 4);
  assert.equal(review.unreviewed, 4);
  assert.equal(review.reviewed, 0);
});

test("Each visible pinned rule is effective and clearing rules reveals data without a hidden route predicate", () => {
  const display = createStrataLogsDisplay("errors-payments");
  const events = createStrataLogSeed();
  const [level, owner] = display.query.rules;
  const levelOnly = filterStrataLogs(events, {
    ...display,
    query: { ...display.query, rules: [level] },
  });
  assert.equal(levelOnly.length, 4);
  const ownerOnly = filterStrataLogs(events, {
    ...display,
    query: { ...display.query, rules: [owner] },
  });
  assert.ok(ownerOnly.length > 2);
  assert.ok(ownerOnly.some((event) => event.level !== "error"));
  assert.equal(filterStrataLogs(events, { ...display, query: emptyQuery() }).length, 62);
  const cleared = clearStrataLogFilters({
    ...display,
    search: "missing",
    levels: ["warn"],
    pagination: { pageIndex: 3, pageSize: 25 },
  });
  assert.equal(filterStrataLogs(events, cleared).length, 62);
  assert.equal(cleared.pagination.pageIndex, 0);
  assert.equal(cleared.pagination.pageSize, 25);
  assert.equal(
    display.query.rules.length,
    2,
    "clear operation does not mutate a saved factory state",
  );
});

test("Pinned query accepts a real new matching event instead of slicing two fixture rows", () => {
  const display = createStrataLogsDisplay("errors-payments");
  const events = createStrataLogSeed();
  const added = makeStrataLogEvent(
    { ...validInput(), ownerId: "leila", level: "error", resourceName: "local-payments-edge" },
    "BL-EVT-0063",
  );
  const filtered = filterStrataLogs(
    scopeStrataLogs([added, ...events], "all", display.range),
    display,
  );
  assert.equal(filtered.length, 3);
  assert.ok(filtered.some((event) => event.id === added.id));
  assert.equal(summarizeStrataLogs(filtered).owners, 2);
  assert.equal(added.incidentId, null, "the source preset has no invented incident filter");
  assert.equal(
    filterStrataLogs([added, ...events], { ...display, search: "local-payments-edge" }).length,
    1,
  );
  assert.equal(
    filterStrataLogs(scopeStrataLogs([added, ...events], "Staging", display.range), display).length,
    0,
  );
});

test("Normal and pinned display factories isolate filters, pagination, selections and export preferences", () => {
  const normal = createStrataLogsDisplay("default"),
    pinned = createStrataLogsDisplay("errors-payments");
  normal.search = "checkout";
  normal.range = "24h";
  normal.pagination.pageIndex = 2;
  normal.selection.push("BL-EVT-0001");
  pinned.query.rules[1].value.push("owen");
  pinned.hidden.push("podIp");
  pinned.exportScope = "selected";
  assert.equal(normal.query.rules.length, 0);
  assert.deepEqual(normal.hidden, []);
  assert.equal(normal.exportScope, "filtered");
  assert.equal(pinned.search, "");
  assert.equal(pinned.range, "7d");
  assert.equal(pinned.pagination.pageIndex, 0);
  assert.deepEqual(pinned.selection, []);
  assert.deepEqual(createStrataLogsDisplay("errors-payments").query.rules[1].value, [
    "maya",
    "leila",
  ]);
  const loaded = selectStrataLogView(normal, "errors-payments");
  assert.equal(loaded.search, "");
  assert.equal(loaded.range, "7d");
  assert.equal(loaded.query.rules.length, 2);
  assert.equal(loaded.pagination.pageIndex, 0);
  assert.equal(normal.search, "checkout");
});

test("Filtered and selected exports use the actual pinned predicates and current intersection", () => {
  const display = createStrataLogsDisplay("errors-payments");
  const filtered = filterStrataLogs(createStrataLogSeed(), display);
  const selected = strataLogExportRows(filtered, ["BL-EVT-0001", "BL-EVT-0005"], "selected");
  assert.equal(selected.length, 1);
  assert.equal(selected[0].id, "BL-EVT-0005");
  const payload = createStrataLogExport(filtered, "json", "filtered");
  const json = JSON.parse(payload.text);
  assert.equal(json.length, 2);
  assert.ok(json.every((event) => event.owner === "Maya Ellis" && event.level === "error"));
  assert.equal(readCsv(createStrataLogExport(selected, "csv", "selected").text).length, 2);
});
