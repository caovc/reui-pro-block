import test from "node:test";
import assert from "node:assert/strict";
import {
  createFluxFailureSeed,
  emptyFluxFailureFilters,
  filterFluxFailures,
  summarizeFluxFailures,
  updateFluxFailureStatus,
  createFluxFailureWorkspace,
  fluxFailureReducer,
  newFluxFailureDraft,
  validateFluxFailureDraft,
  parseFluxFailurePayload,
  dismissFluxFailure,
  cancelInactiveFluxFailureRetry,
} from "../src/templates/workflow/flux-runs-model.ts";
import { readFluxRunRoute, fluxRunHref } from "../src/templates/workflow/flux-runs-route-model.ts";

test("authored failures have stable distinct IDs, independent nested state and truthful attempt timestamps", () => {
  const rows = createFluxFailureSeed();
  assert.equal(rows.length, 8);
  assert.equal(new Set(rows.map((row) => row.id)).size, 8);
  for (const row of rows) {
    assert.equal(row.attempts.at(-1).at, row.lastAttempt);
    assert.ok(row.attempts.every((a) => Date.parse(a.at) <= Date.parse(row.lastAttempt)));
    assert.ok(Number.isInteger(row.refundCents) && row.refundCents >= 0);
  }
  rows[0].payload.account = "changed";
  rows[0].attempts[0].result = "changed";
  assert.equal(createFluxFailureSeed()[0].payload.account, "northstar-labs");
  assert.equal(createFluxFailureSeed()[0].attempts[0].result, "409 refund_conflict");
});

test("status, error, agent and text filters intersect actual records", () => {
  const rows = createFluxFailureSeed();
  const filters = {
    ...emptyFluxFailureFilters,
    status: "Failed",
    error: "Gateway",
    agent: "Invoice Reconciler",
    query: "CEDAR",
  };
  assert.deepEqual(
    filterFluxFailures(rows, filters).map((row) => row.id),
    ["LOCAL-RUN-2106"],
  );
  assert.equal(filterFluxFailures(rows, { ...filters, query: "no matching record" }).length, 0);
  assert.equal(filterFluxFailures(rows, emptyFluxFailureFilters).length, 8);
});

test("summary derives active exposure, actual owners and ready payloads from the ledger", () => {
  const rows = createFluxFailureSeed();
  assert.deepEqual(summarizeFluxFailures(rows), {
    total: 8,
    failed: 6,
    active: 7,
    exposureCents: 28000,
    backoff: 5,
    owners: 6,
    payloadReady: 2,
  });
  const changed = updateFluxFailureStatus(rows, "LOCAL-RUN-2108", "Dismissed");
  assert.equal(rows[0].status, "Failed");
  assert.equal(summarizeFluxFailures(changed).exposureCents, 9750);
  assert.equal(summarizeFluxFailures(changed).failed, 5);
  assert.equal(changed[1], rows[1]);
  assert.deepEqual(updateFluxFailureStatus(rows, "missing", "Retrying"), rows);
});

test("both public mount kinds retain opaque query bytes and exact child route identity", () => {
  const query = "?preset=%7B%22primitive%22%3A%22base%22%7D&opaque=a%2Fb+z";
  for (const mount of ["/templates/flux", "/template-preview/flux"]) {
    const hash = `#${mount}${query}`;
    assert.equal(fluxRunHref(hash, "Failures"), `#${mount}/runs/failures${query}`);
    assert.equal(readFluxRunRoute(`#${mount}/runs/all-runs/${query}`).view, "All runs");
    assert.equal(readFluxRunRoute(`#${mount}/runs/failures${query}`).view, "Failures");
    assert.equal(fluxRunHref(`#${mount}/runs/failures${query}`, "Overview"), hash);
  }
});

test("standalone run routes work and foreign hosts and unknown sibling paths stay untouched", () => {
  assert.equal(fluxRunHref("#/", "Failures"), "#/runs/failures");
  assert.equal(readFluxRunRoute("#/runs/all-runs").view, "All runs");
  for (const hash of [
    "#/templates/echo/runs/failures",
    "#/template-preview/flux-other",
    "#/not-a-flux-route",
    "#https://foreign.example/runs/failures",
  ]) {
    assert.equal(readFluxRunRoute(hash).view, null);
    assert.equal(fluxRunHref(hash, "Failures"), hash);
  }
  assert.equal(readFluxRunRoute("#/templates/flux/runs/failures-extra").view, null);
});

test("create validates errors, creates unique records, and reveals them by clearing stale filters", () => {
  let state = createFluxFailureWorkspace();
  const draft = newFluxFailureDraft(state.rows);
  assert.deepEqual(Object.keys(validateFluxFailureDraft(draft)), [
    "task",
    "errorMessage",
    "failedStep",
  ]);
  const invalid = fluxFailureReducer(state, { type: "create", draft, at: "2026-11-23T09:00:00Z" });
  assert.equal(invalid, state);
  const valid = {
    ...draft,
    task: "  Review imported renewal  ",
    errorMessage: "Provider rejected request",
    failedStep: "orders.read",
    step: 3,
    totalSteps: 2,
  };
  assert.equal(validateFluxFailureDraft(valid).step, "The failed step must be within the run.");
  valid.totalSteps = 4;
  state = fluxFailureReducer(state, {
    type: "filter",
    filters: { ...emptyFluxFailureFilters, query: "nothing" },
  });
  state = fluxFailureReducer(state, { type: "create", draft: valid, at: "2026-11-23T09:00:00Z" });
  assert.equal(state.rows[0].task, "Review imported renewal");
  assert.equal(state.rows[0].id, "LOCAL-RUN-2109");
  assert.equal(state.rows[0].attempts.at(-1).at, state.rows[0].lastAttempt);
  assert.equal(filterFluxFailures(state.rows, state.filters).length, 9);
  state = fluxFailureReducer(state, { type: "create", draft: valid, at: "2026-11-23T09:00:01Z" });
  assert.equal(state.rows[0].id, "LOCAL-RUN-2110");
});

test("retry records an attempt, rejects duplicate submissions, and settles against the latest edited record", () => {
  const original = createFluxFailureWorkspace();
  const at = "2026-11-23T09:00:00Z";
  const state = fluxFailureReducer(original, { type: "retry", row: original.rows[0], at });
  assert.equal(original.rows[0].status, "Failed");
  assert.equal(state.rows[0].status, "Retrying");
  assert.equal(state.rows[0].attempts.length, original.rows[0].attempts.length + 1);
  assert.equal(state.rows[0].attempts.at(-1).outcome, "Queued");
  assert.equal(fluxFailureReducer(state, { type: "retry", row: state.rows[0], at }), state);
  assert.equal(
    fluxFailureReducer(state, { type: "settle-retries", at: "2026-11-23T09:00:00.900Z" }),
    state,
  );
  const edited = fluxFailureReducer(state, {
    type: "replace",
    before: state.rows[0],
    after: { ...state.rows[0], notes: "Newer triage note" },
  });
  const done = fluxFailureReducer(edited, {
    type: "settle-retries",
    at: "2026-11-23T09:00:01.200Z",
  });
  assert.equal(done.rows[0].status, "Failed");
  assert.equal(done.rows[0].notes, "Newer triage note");
  assert.equal(done.rows[0].attempts.at(-1).result, done.rows[0].errorCode);
  assert.equal(done.rows[0].attempts.at(-1).durationMs, 1200);
  assert.equal(done.rows[0].attempts.at(-1).at, done.rows[0].lastAttempt);
  assert.equal(done.rows[1], original.rows[1]);
});

test("dismiss cancels pending retry and revision-safe undo preserves later edits", () => {
  let state = createFluxFailureWorkspace();
  state = fluxFailureReducer(state, {
    type: "retry",
    row: state.rows[0],
    at: "2026-11-23T09:00:00Z",
  });
  const pending = state.rows[0];
  const dismissed = dismissFluxFailure(pending);
  state = fluxFailureReducer(state, { type: "replace", before: pending, after: dismissed });
  assert.equal(state.rows[0].attempts.at(-1).outcome, "Cancelled");
  assert.equal(
    fluxFailureReducer(state, { type: "settle-retries", at: "2026-11-23T09:00:05Z" }),
    state,
  );
  const updated = { ...dismissed, notes: "Keep this newer note" };
  state = fluxFailureReducer(state, { type: "replace", before: dismissed, after: updated });
  assert.equal(
    fluxFailureReducer(state, { type: "replace", before: dismissed, after: pending }),
    state,
  );
  assert.equal(state.rows[0].notes, "Keep this newer note");
});

test("saving a nonretrying status cancels the attempt and keeps its exact undo revision", () => {
  let state = createFluxFailureWorkspace();
  state = fluxFailureReducer(state, {
    type: "retry",
    row: state.rows[0],
    at: "2026-11-23T09:00:00Z",
  });
  const pending = state.rows[0];
  assert.equal(cancelInactiveFluxFailureRetry(pending), pending);
  const prepared = cancelInactiveFluxFailureRetry({ ...pending, status: "Failed" });
  assert.equal(prepared.status, "Failed");
  assert.equal(prepared.attempts.at(-1).outcome, "Cancelled");
  state = fluxFailureReducer(state, { type: "replace", before: pending, after: prepared });
  assert.equal(
    fluxFailureReducer(state, { type: "settle-retries", at: "2026-11-23T09:00:05Z" }),
    state,
  );
  state = fluxFailureReducer(state, { type: "replace", before: prepared, after: pending });
  assert.equal(state.rows[0], pending);
  assert.equal(state.rows[0].attempts.at(-1).outcome, "Queued");
  state = fluxFailureReducer(state, {
    type: "settle-retries",
    at: "2026-11-23T09:00:05Z",
  });
  assert.equal(state.rows[0].attempts.at(-1).outcome, "Failed");
});

test("removal fits pagination and restore is idempotent without replacing the active filters", () => {
  let state = createFluxFailureWorkspace();
  state = fluxFailureReducer(state, { type: "page", value: { pageIndex: 1, pageSize: 6 } });
  const removed = state.rows.slice(6);
  for (const row of removed) state = fluxFailureReducer(state, { type: "remove", row });
  assert.equal(state.pagination.pageIndex, 0);
  state = fluxFailureReducer(state, {
    type: "filter",
    filters: { ...emptyFluxFailureFilters, query: "Grove" },
  });
  state = fluxFailureReducer(state, { type: "restore", row: removed[0], index: 6 });
  assert.equal(filterFluxFailures(state.rows, state.filters).length, 1);
  assert.equal(fluxFailureReducer(state, { type: "restore", row: removed[0], index: 6 }), state);
  assert.equal(
    fluxFailureReducer(state, { type: "page", value: { pageIndex: -1, pageSize: 6 } }),
    state,
  );
});

test("payload editor accepts objects and empty values, and rejects malformed or nonobject JSON", () => {
  assert.deepEqual(parseFluxFailurePayload('{"account":"demo","items":[1,2]}'), {
    payload: { account: "demo", items: [1, 2] },
  });
  assert.deepEqual(parseFluxFailurePayload("  "), { payload: null });
  for (const value of ["{bad}", "[]", "null", '"text"', "42"])
    assert.ok(parseFluxFailurePayload(value).error);
});
