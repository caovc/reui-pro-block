import test from "node:test";
import assert from "node:assert/strict";
import {
  createFluxQueueSeed,
  createFluxQueueWorkspace,
  emptyFluxQueueFilters,
  filterFluxQueue,
  summarizeFluxQueue,
  groupFluxQueue,
  changeFluxQueueRun,
  editFluxQueueRun,
  nextFluxQueueRun,
  newFluxQueueDraft,
  validateFluxQueueDraft,
  fluxQueueReducer,
  fluxQueueCsv,
  fluxQueueUpdatedAt,
} from "../src/templates/workflow/flux-queue-model.ts";
import { fluxRunHref, readFluxRunRoute } from "../src/templates/workflow/flux-runs-route-model.ts";

const at = "2026-11-23T09:00:00.000Z";
const draftFrom = (row) => ({
  task: row.task,
  agent: row.agent,
  owner: row.owner,
  priority: row.priority,
  totalSteps: row.totalSteps,
  attention: row.attention,
  attentionReason: row.attentionReason,
  notes: row.notes,
});

test("authored queue records own independent history with stable IDs and chronological events", () => {
  const rows = createFluxQueueSeed();
  assert.equal(rows.length, 12);
  assert.equal(new Set(rows.map((row) => row.id)).size, 12);
  for (const row of rows) {
    assert.ok(row.completedSteps >= 0 && row.completedSteps <= row.totalSteps);
    assert.equal(row.pendingSince, null);
    assert.ok(
      row.events.every(
        (event, i) => i === 0 || Date.parse(event.at) >= Date.parse(row.events[i - 1].at),
      ),
    );
    assert.equal(new Set(row.events.map((event) => event.id)).size, row.events.length);
  }
  rows[0].events[0].description = "Changed";
  assert.notEqual(createFluxQueueSeed()[0].events[0].description, "Changed");
});

test("search, status and explicit attention filters intersect records and summary remains truthful", () => {
  const rows = createFluxQueueSeed();
  assert.deepEqual(summarizeFluxQueue(rows), {
    total: 12,
    queued: 4,
    running: 2,
    succeeded: 2,
    failed: 2,
    held: 1,
    attention: 4,
  });
  const filters = { query: "CONTRACT", status: "Failed", attentionOnly: true };
  assert.deepEqual(
    filterFluxQueue(rows, filters).map((row) => row.id),
    ["LOCAL-QUEUE-3105"],
  );
  assert.equal(filterFluxQueue(rows, { ...filters, query: "nothing matches" }).length, 0);
  const reviewed = changeFluxQueueRun(rows[4], "review", at);
  assert.equal(reviewed.status, "Failed");
  assert.equal(reviewed.attention, false);
  assert.equal(filterFluxQueue([reviewed], { ...filters, query: "" }).length, 0);
});

test("Agent/Status/None grouping preserves each visible leaf once and stable group identity", () => {
  const rows = createFluxQueueSeed();
  for (const grouping of ["agent", "status"]) {
    const groups = groupFluxQueue(rows, grouping);
    assert.equal(groups.flatMap((group) => group.children).length, rows.length);
    assert.equal(
      new Set(groups.flatMap((group) => group.children.map((leaf) => leaf.id))).size,
      rows.length,
    );
    assert.deepEqual(
      groups.map((group) => group.id),
      groupFluxQueue(rows, grouping).map((group) => group.id),
    );
    assert.ok(
      groups.every((group) => group.children.every((child) => child.run[grouping] === group.label)),
    );
  }
  assert.deepEqual(
    groupFluxQueue(rows, "none").map((leaf) => leaf.run),
    rows,
  );
  assert.deepEqual(groupFluxQueue([], "agent"), []);
});

test("Run Queue owns all-runs and retained Run tree owns /runs for every mount with opaque bytes intact", () => {
  for (const mount of ["/templates/flux", "/template-preview/flux", ""]) {
    const query = "?opaque=a%2Fb+z&preset=%7B%22primitive%22%3A%22base%22%7D";
    const origin = `#${mount}${query}`;
    assert.equal(fluxRunHref(origin, "All runs"), `#${mount}/runs/all-runs${query}`);
    assert.equal(fluxRunHref(origin, "Run tree"), `#${mount}/runs${query}`);
    assert.equal(readFluxRunRoute(`#${mount}/runs/${query}`).view, "Run tree");
    assert.equal(readFluxRunRoute(`#${mount}/runs/all-runs${query}`).view, "All runs");
    assert.equal(readFluxRunRoute(`#${mount}/runs/failures${query}`).view, "Failures");
  }
  assert.equal(readFluxRunRoute("#/templates/other/runs").view, null);
});

test("next run follows priority then FIFO and excludes flagged, held and already running records", () => {
  const rows = createFluxQueueSeed();
  assert.equal(nextFluxQueueRun(rows).id, "LOCAL-QUEUE-3101");
  const first = rows[0];
  const started = changeFluxQueueRun(first, "start", at);
  const next = rows.map((row) => (row === first ? started : row));
  assert.equal(nextFluxQueueRun(next).id, "LOCAL-QUEUE-3106");
  assert.equal(changeFluxQueueRun(rows[2], "start", at), rows[2]);
  assert.equal(changeFluxQueueRun(started, "start", at), started);
  assert.equal(changeFluxQueueRun(first, "start", "invalid"), first);
});

test("start next respects active filters and settles only user-started simulations", () => {
  let state = createFluxQueueWorkspace();
  state = fluxQueueReducer(state, {
    type: "filter",
    filters: { ...emptyFluxQueueFilters, query: "MEADOW" },
  });
  state = fluxQueueReducer(state, { type: "start-next", at });
  assert.equal(state.rows.find((row) => row.id === "LOCAL-QUEUE-3109").status, "Running");
  assert.equal(state.rows[0].status, "Queued");
  assert.equal(fluxQueueReducer(state, { type: "settle", at: "2026-11-23T09:00:00.900Z" }), state);
  const done = fluxQueueReducer(state, { type: "settle", at: "2026-11-23T09:00:01.500Z" });
  const row = done.rows.find((run) => run.id === "LOCAL-QUEUE-3109");
  assert.equal(row.status, "Succeeded");
  assert.equal(row.completedSteps, row.totalSteps);
  assert.equal(row.finishedAt, fluxQueueUpdatedAt(row));
  assert.equal(done.rows[1], state.rows[1]);
  assert.equal(done.filters, state.filters);
});

test("failed local simulation preserves newer metadata and creates a truthful attention flag", () => {
  let state = createFluxQueueWorkspace();
  const before = state.rows[0];
  const started = changeFluxQueueRun(
    { ...before, previewOutcome: "Failed", totalSteps: 1 },
    "start",
    at,
  );
  state = fluxQueueReducer(state, { type: "replace", before, after: started });
  const edited = editFluxQueueRun(
    started,
    { ...draftFrom(started), notes: "Keep this triage note" },
    "2026-11-23T09:00:00.500Z",
  );
  state = fluxQueueReducer(state, { type: "replace", before: started, after: edited });
  state = fluxQueueReducer(state, { type: "settle", at: "2026-11-23T09:00:01.500Z" });
  assert.equal(state.rows[0].status, "Failed");
  assert.equal(state.rows[0].completedSteps, 0);
  assert.equal(state.rows[0].attention, true);
  assert.equal(state.rows[0].notes, "Keep this triage note");
});

test("cancel stops pending simulation and revision-safe Undo cannot replace a newer edit", () => {
  let state = createFluxQueueWorkspace();
  const before = state.rows[0];
  const started = changeFluxQueueRun(before, "start", at);
  state = fluxQueueReducer(state, { type: "replace", before, after: started });
  const cancelled = changeFluxQueueRun(started, "cancel", "2026-11-23T09:00:00.500Z");
  state = fluxQueueReducer(state, { type: "replace", before: started, after: cancelled });
  assert.equal(cancelled.pendingSince, null);
  assert.equal(fluxQueueReducer(state, { type: "settle", at: "2026-11-23T09:00:05Z" }), state);
  const edited = editFluxQueueRun(
    cancelled,
    { ...draftFrom(cancelled), task: "A newer queue title" },
    "2026-11-23T09:00:02Z",
  );
  state = fluxQueueReducer(state, { type: "replace", before: cancelled, after: edited });
  assert.equal(
    fluxQueueReducer(state, { type: "replace", before: cancelled, after: started }),
    state,
  );
  assert.equal(state.rows[0].task, "A newer queue title");
});

test("hold, resume and review do not silently clear attention or rewrite terminal history", () => {
  const rows = createFluxQueueSeed();
  const held = changeFluxQueueRun(rows[0], "hold", at);
  assert.equal(held.status, "Held");
  assert.equal(changeFluxQueueRun(held, "start", at), held);
  const returned = changeFluxQueueRun(held, "requeue", "2026-11-23T09:01:00Z");
  assert.equal(returned.status, "Queued");
  assert.equal(returned.queuedAt, "2026-11-23T09:01:00Z");
  const requeuedFailure = changeFluxQueueRun(rows[4], "requeue", at);
  assert.equal(requeuedFailure.attention, true);
  assert.equal(changeFluxQueueRun(rows[3], "cancel", at), rows[3]);
  assert.equal(editFluxQueueRun(rows[3], { ...draftFrom(rows[3]), totalSteps: 12 }, at), rows[3]);
});

test("queue creation validates details, reveals the new run and never reuses an ID", () => {
  const original = createFluxQueueWorkspace();
  const draft = newFluxQueueDraft();
  assert.deepEqual(Object.keys(validateFluxQueueDraft(draft)), ["task"]);
  assert.equal(fluxQueueReducer(original, { type: "create", draft, at }), original);
  assert.equal(
    validateFluxQueueDraft({ ...draft, task: "New job", attention: true }).attentionReason,
    "Explain what needs review.",
  );
  assert.ok(validateFluxQueueDraft({ ...draft, task: "New job", totalSteps: 0 }).totalSteps);
  let state = fluxQueueReducer(original, {
    type: "filter",
    filters: { query: "nothing", status: "Failed", attentionOnly: true },
  });
  state = fluxQueueReducer(state, { type: "expand", value: {} });
  const valid = { ...draft, task: "  Inspect a local fixture  " };
  state = fluxQueueReducer(state, { type: "create", draft: valid, at });
  assert.equal(state.rows[0].id, "LOCAL-QUEUE-3113");
  assert.equal(state.rows[0].task, "Inspect a local fixture");
  assert.deepEqual(state.filters, emptyFluxQueueFilters);
  assert.equal(state.expanded, true);
  state = fluxQueueReducer(state, { type: "create", draft: valid, at });
  assert.equal(state.rows[0].id, "LOCAL-QUEUE-3114");
});

test("group expansion state supports native updater callbacks and grouping resets it explicitly", () => {
  let state = createFluxQueueWorkspace();
  state = fluxQueueReducer(state, { type: "expand", value: { "agent-a": true } });
  state = fluxQueueReducer(state, {
    type: "expand",
    value: (previous) => ({ ...previous, "agent-b": false }),
  });
  assert.deepEqual(state.expanded, { "agent-a": true, "agent-b": false });
  state = fluxQueueReducer(state, { type: "group", grouping: "status" });
  assert.equal(state.expanded, true);
});

test("CSV serializes exactly the filtered leaf records with quotes and newlines preserved", () => {
  const rows = createFluxQueueSeed();
  const filtered = filterFluxQueue(rows, { ...emptyFluxQueueFilters, query: "FINCH" });
  const csv = fluxQueueCsv([{ ...filtered[0], task: 'Review "quoted" task\nwith a second line' }]);
  assert.equal(csv.split("\r\n").length, 2);
  assert.ok(csv.includes('"LOCAL-QUEUE-3105","Review ""quoted"" task\nwith a second line"'));
  assert.ok(csv.includes('"Needs attention"'));
  assert.equal(fluxQueueCsv([]).split("\r\n").length, 1);
});
