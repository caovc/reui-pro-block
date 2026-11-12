import test from "node:test";
import assert from "node:assert/strict";
import {
  createStrataSourcesState,
  mergeStrataSourceSelection,
  selectStrataSources,
  setStrataSourceEnabled,
  strataSourceAttention,
  strataSourceHealth,
  strataSourcesMetrics,
  syncStrataSources,
} from "../src/templates/workflow/strata-sources-model.ts";
import {
  STRATA_INCIDENT_ID,
  STRATA_NOW_MS,
  STRATA_OWNERS,
  STRATA_SERVICES,
} from "../src/templates/workflow/strata-domain.ts";
import {
  STRATA_SOURCE_PROVIDERS,
  backStrataSourceSetup,
  continueStrataSourceSetup,
  createStrataSourceSetup,
  searchStrataSourceProviders,
  validateStrataNeonDraft,
} from "../src/templates/workflow/strata-source-providers.ts";

test("the independent initial source ledger conserves health, datasets and captured run totals", () => {
  const state = createStrataSourcesState();
  const metrics = strataSourcesMetrics(state);
  assert.equal(state.sources.length, 13);
  assert.deepEqual(metrics.health, { Healthy: 10, Degraded: 1, Failing: 1, Paused: 1 });
  assert.deepEqual(metrics.datasets, { "in-sync": 32, drifted: 1, unlinked: 16 });
  assert.equal(metrics.linked, 33);
  assert.equal(metrics.totalDatasets, 49);
  assert.equal(metrics.totalRuns, 741);
  assert.equal(metrics.failed, 5);
  assert.equal(metrics.rows, 9_040_000);
  assert.equal(metrics.landedPct.toFixed(1), "99.3");
  assert.equal(
    metrics.hours.reduce((sum, hour) => sum + hour.counts.reduce((total, n) => total + n, 0), 0),
    741,
  );
  assert.equal(
    metrics.hours.reduce((sum, hour) => sum + hour.rows.reduce((total, n) => total + n, 0), 0),
    metrics.rows,
  );
  assert.deepEqual(
    metrics.daily.map((day) => day.failed),
    [0, 1, 0, 0, 2, 1, 0, 1, 0, 3, 2, 0, 2, 5],
  );
  assert.equal(
    metrics.daily.reduce((sum, day) => sum + day.failed, 0),
    17,
  );
  assert.deepEqual(
    ["Databases", "Warehouses", "Apps", "Files"].map(
      (category) => state.sources.filter((source) => source.category === category).length,
    ),
    [5, 1, 5, 2],
  );
  assert.ok(
    state.sources.every((source) => STRATA_OWNERS.some((owner) => owner.id === source.ownerId)),
  );
  assert.ok(
    state.sources.every(
      (source) =>
        source.serviceId === null ||
        STRATA_SERVICES.some((service) => service.id === source.serviceId),
    ),
  );
  for (const source of state.sources) {
    const lastRun = Math.max(
      ...state.runs.filter((run) => run.sourceId === source.id).map((run) => run.atMs),
    );
    assert.equal(lastRun, source.lastAttemptMs, source.name);
  }
});

test("pausing and resuming preserves credential failure, schema drift and historic observations", () => {
  const initial = createStrataSourcesState();
  const paused = setStrataSourceEnabled(initial, "search-db", false);
  assert.equal(strataSourceHealth(paused.sources[0]), "Paused");
  assert.equal(paused.sources[0].connectorHealth, "Failing");
  assert.equal(paused.runs, initial.runs);
  assert.equal(paused.history, initial.history);
  const resumed = setStrataSourceEnabled(paused, "search-db", true);
  assert.equal(strataSourceHealth(resumed.sources[0]), "Failing");
  const drift = resumed.sources.find((source) => source.id === "sre-planning-sheets");
  assert.equal(drift.datasets.filter((dataset) => dataset.state === "drifted").length, 1);
  assert.equal(setStrataSourceEnabled(initial, "missing", false), initial);
  assert.equal(setStrataSourceEnabled(initial, "search-db", true), initial);
});

test("local sync rejects paused and unknown IDs, deduplicates selected IDs and records real failures", () => {
  const initial = createStrataSourcesState();
  assert.equal(syncStrataSources(initial, ["missing", "sre-slack"]), initial);
  const next = syncStrataSources(initial, ["search-db", "search-db", "checkout-db", "sre-slack"]);
  assert.equal(next.runs.length, initial.runs.length + 2);
  const added = next.runs.slice(initial.runs.length);
  assert.deepEqual(
    added.map((run) => run.outcome),
    ["Failed", "Succeeded"],
  );
  assert.equal(added[0].rows, 0);
  assert.equal(added[1].rows, 48_000);
  assert.equal(added[1].incidentId, STRATA_INCIDENT_ID);
  assert.equal(added[1].ownerId, "maya");
  assert.equal(next.sources[0].connectorHealth, "Failing");
  assert.equal(initial.runs.length, 741);
  assert.equal(strataSourcesMetrics(next).totalRuns, 743);
  assert.equal(strataSourcesMetrics(next).failed, 6);
  assert.equal(strataSourcesMetrics(next).rows, 9_088_000);
  const older = syncStrataSources(next, ["checkout-db"], STRATA_NOW_MS - 3_600_000);
  assert.equal(
    older.sources.find((source) => source.id === "checkout-db").lastAttemptMs,
    STRATA_NOW_MS,
  );
  assert.throws(() => syncStrataSources(initial, ["checkout-db"], NaN), RangeError);
});

test("successful local sync does not silently resolve drift or a latency warning", () => {
  const state = createStrataSourcesState();
  const next = syncStrataSources(state, ["telemetry-warehouse", "sre-planning-sheets"]);
  assert.deepEqual(
    next.runs.slice(-2).map((run) => run.outcome),
    ["Slow", "Succeeded"],
  );
  const metrics = strataSourcesMetrics(next);
  assert.equal(metrics.health.Degraded, 1);
  assert.equal(metrics.datasets.drifted, 1);
  assert.equal(metrics.attention.length, 5);
  const repeated = syncStrataSources(next, ["telemetry-warehouse"]);
  assert.notEqual(next.runs.at(-2).id, repeated.runs.at(-1).id);
});

test("environment selection scopes source and run totals without including another environment's records", () => {
  const state = createStrataSourcesState();
  const all = strataSourcesMetrics(state);
  const parts = ["Production", "Staging", "Sandbox"].map((environment) =>
    strataSourcesMetrics(state, environment),
  );
  assert.equal(
    parts.reduce((sum, part) => sum + part.sources.length, 0),
    13,
  );
  assert.equal(
    parts.reduce((sum, part) => sum + part.totalDatasets, 0),
    49,
  );
  assert.equal(
    parts.reduce((sum, part) => sum + part.totalRuns, 0),
    all.totalRuns,
  );
  assert.equal(
    parts.reduce((sum, part) => sum + part.rows, 0),
    all.rows,
  );
  assert.deepEqual(
    parts[1].sources.map((source) => source.id),
    ["checkout-db-staging"],
  );
  assert.deepEqual(
    parts[2].sources.map((source) => source.id),
    ["stripe-sandbox"],
  );
});

test("the 24-hour ledger excludes old and future runs and retains the current boundary", () => {
  const state = createStrataSourcesState();
  const sample = state.runs[0];
  const boundaryState = {
    ...state,
    runs: [
      { ...sample, id: "old", atMs: STRATA_NOW_MS - 86_400_000, rows: 100 },
      { ...sample, id: "current", atMs: STRATA_NOW_MS, rows: 10, outcome: "Succeeded" },
      { ...sample, id: "future", atMs: STRATA_NOW_MS + 1, rows: 1_000 },
    ],
  };
  const metrics = strataSourcesMetrics(boundaryState);
  assert.equal(metrics.totalRuns, 1);
  assert.equal(metrics.rows, 10);
  assert.equal(metrics.hours.at(-1).counts[0], 1);
  const empty = strataSourcesMetrics({ ...state, runs: [] });
  assert.equal(empty.landedPct, null);
});

test("search includes full dataset names and categories compose with the unhealthy subset", () => {
  const { sources } = createStrataSourcesState();
  assert.deepEqual(
    selectStrataSources(sources, { search: "  PUBLIC.QUERY_STATS  " }).map((source) => source.id),
    ["search-db"],
  );
  assert.deepEqual(
    selectStrataSources(sources, { unhealthy: true }).map((source) => source.id),
    ["search-db", "telemetry-warehouse"],
  );
  assert.deepEqual(selectStrataSources(sources, { unhealthy: true, categories: ["Apps"] }), []);
  assert.deepEqual(selectStrataSources(sources, { categories: [] }), []);
  assert.deepEqual(
    selectStrataSources(sources, { environment: "Sandbox", search: "Stripe" }).map(
      (source) => source.id,
    ),
    ["stripe-sandbox"],
  );
});

test("real filter query groups preserve OR, negation and status/owner intersections", () => {
  const { sources } = createStrataSourcesState();
  const rule = (id, path, operator, value, negated = false) => ({
    id,
    type: "rule",
    path: [path],
    operator,
    value,
    negated,
  });
  const query = {
    id: "root",
    type: "group",
    combinator: "and",
    rules: [
      {
        id: "status",
        type: "group",
        combinator: "or",
        rules: [rule("f", "health", "is", "Failing"), rule("d", "health", "is", "Degraded")],
      },
      rule("owner", "ownerId", "is_any_of", ["eli"]),
      rule("not-stage", "environment", "is", "Staging", true),
    ],
  };
  assert.deepEqual(
    selectStrataSources(sources, { query }).map((source) => source.id),
    ["search-db"],
  );
  const unknown = { ...query, rules: [rule("unknown", "missing", "is_not", "anything", true)] };
  assert.deepEqual(selectStrataSources(sources, { query: unknown }), []);
  const invalidOperator = {
    ...query,
    rules: [rule("bad-op", "health", "unknown_operator", "Healthy", true)],
  };
  assert.deepEqual(selectStrataSources(sources, { query: invalidOperator }), []);
});

test("changing one visible group's selection preserves hidden selections and removes invalid IDs", () => {
  assert.deepEqual(
    mergeStrataSourceSelection(
      ["search-db", "sre-slack", "stale-id"],
      ["search-db", "checkout-db"],
      ["checkout-db", "not-visible"],
      ["search-db", "checkout-db", "sre-slack"],
    ),
    ["sre-slack", "checkout-db"],
  );
  assert.deepEqual(
    mergeStrataSourceSelection(
      ["sre-slack"],
      ["search-db"],
      ["search-db", "search-db"],
      ["search-db", "sre-slack"],
    ),
    ["sre-slack", "search-db"],
  );
});

test("attention represents distinct operational reasons in observed priority order", () => {
  const { sources } = createStrataSourcesState();
  const attention = strataSourceAttention(sources);
  assert.deepEqual(
    attention.map((item) => [item.source.id, item.label]),
    [
      ["search-db", "Failing"],
      ["telemetry-warehouse", "Degraded"],
      ["incident-tracker", "Token Expiring"],
      ["sre-planning-sheets", "Schema Drift"],
      ["sre-slack", "Paused"],
    ],
  );
  const resumed = sources.map((source) =>
    source.id === "sre-slack" ? { ...source, syncEnabled: true } : source,
  );
  assert.equal(strataSourceAttention(resumed).length, 4);
});

test("the provider picker preserves the captured eleven cards and searches technologies independently of existing sources", () => {
  assert.deepEqual(
    STRATA_SOURCE_PROVIDERS.map((provider) => `${provider.name}/${provider.technology}`),
    [
      "Neon/Postgres",
      "PlanetScale/MySQL",
      "Supabase/Postgres",
      "Redis/Redis 7",
      "BigQuery/Google Cloud",
      "Stripe/REST API",
      "GitHub/REST API",
      "Linear/GraphQL API",
      "Slack/Web API",
      "Google Drive/Sheets API",
      "Dropbox/Files API",
    ],
  );
  assert.equal(new Set(STRATA_SOURCE_PROVIDERS.map((provider) => provider.id)).size, 11);
  assert.deepEqual(
    searchStrataSourceProviders("  POSTGRES ").map((provider) => provider.id),
    ["neon", "supabase"],
  );
  assert.deepEqual(
    searchStrataSourceProviders("rest api").map((provider) => provider.id),
    ["stripe", "github"],
  );
  assert.deepEqual(searchStrataSourceProviders("not-an-integration"), []);
});

test("only the observed Neon Configure step advances, and Back retains its native field values", () => {
  const empty = createStrataSourceSetup();
  assert.equal(continueStrataSourceSetup(empty), empty);
  const unknownSchema = { ...empty, providerId: "stripe" };
  assert.equal(continueStrataSourceSetup(unknownSchema), unknownSchema);
  const selected = { ...empty, providerId: "neon" };
  const configure = continueStrataSourceSetup(selected);
  assert.equal(configure.step, 2);
  assert.equal(configure.neon.environment, "Production");
  assert.equal(configure.neon.frequency, "every-15m");
  assert.equal(configure.neon.alertOnFailure, true);
  const edited = {
    ...configure,
    neon: {
      ...configure.neon,
      name: "demo-checkout",
      host: "ep-sample.demo.internal",
      password: "local-only-sample",
      environment: "Staging",
      alertOnFailure: false,
    },
  };
  const back = backStrataSourceSetup(edited);
  assert.equal(back.step, 1);
  assert.equal(back.neon, edited.neon);
  assert.equal(continueStrataSourceSetup(back).neon, edited.neon);
  assert.equal(continueStrataSourceSetup(edited), edited);
  assert.notEqual(createStrataSourceSetup().neon, edited.neon);
  assert.equal(createStrataSourceSetup().neon.password, "");
});

test("local Neon validation rejects incomplete fields and URL credentials without claiming a network test", () => {
  const draft = createStrataSourceSetup().neon;
  assert.deepEqual(Object.keys(validateStrataNeonDraft(draft)).sort(), [
    "host",
    "name",
    "password",
  ]);
  const valid = {
    ...draft,
    name: "demo-checkout",
    host: "ep-sample.demo.internal",
    password: "local-only-sample",
  };
  assert.deepEqual(validateStrataNeonDraft(valid), {});
  for (const host of [
    "https://host.example",
    "user:password@host.example",
    "host.example:5432",
    "host..example",
    "-bad.example",
    "host.example/path",
  ]) {
    assert.ok(validateStrataNeonDraft({ ...valid, host }).host, host);
  }
  assert.ok(validateStrataNeonDraft({ ...valid, ownerId: "unknown" }).ownerId);
  assert.ok(validateStrataNeonDraft({ ...valid, environment: "Unknown" }).environment);
  assert.ok(validateStrataNeonDraft({ ...valid, frequency: "unknown" }).frequency);
});
