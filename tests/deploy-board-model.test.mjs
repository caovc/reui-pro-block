import assert from "node:assert/strict";
import test from "node:test";
import {
  createDeployRecords,
  DEPLOY_REFERENCE,
  DEPLOY_MERGES,
} from "../src/blocks/data/solution-dev-ops-variants/deploy-board-data.ts";
import {
  createDeployBoardState,
  deployBoardReducer,
  filterDeployRecords,
  filterDeployMerges,
} from "../src/blocks/data/solution-dev-ops-variants/deploy-board-model.ts";

const initial = () => createDeployBoardState(createDeployRecords(), DEPLOY_REFERENCE);
const record = (state, id) => state.records.find((item) => item.id === id);

test("an unapproved production release misses its window without receiving traffic", () => {
  const state = deployBoardReducer(initial(), { type: "tick", seconds: 1200 });
  const release = record(state, "BLD-2050");
  assert.equal(release.phase, "Needs approval");
  assert.equal(release.actual, 0);
  assert.equal(release.approvals.filter((approval) => approval.approvedAt !== null).length, 1);
  assert.ok(release.windowAt > state.now);
});

test("second approval schedules exactly that release and the window starts its canary", () => {
  const approved = deployBoardReducer(initial(), { type: "approve", id: "BLD-2050" });
  assert.equal(record(approved, "BLD-2050").phase, "Scheduled");
  assert.equal(record(approved, "BLD-2050").target, 0);
  assert.equal(
    record(approved, "BLD-2050").approvals.filter((entry) => entry.approvedAt !== null).length,
    2,
  );
  const before = deployBoardReducer(approved, { type: "tick", seconds: 1190 });
  assert.equal(record(before, "BLD-2050").phase, "Scheduled");
  const opened = deployBoardReducer(before, { type: "tick", seconds: 10 });
  assert.equal(record(opened, "BLD-2050").phase, "Rolling out");
  assert.equal(record(opened, "BLD-2050").target, 5);
});

test("manual traffic targets change immediately while actual traffic converges", () => {
  const changed = deployBoardReducer(initial(), { type: "traffic", id: "BLD-2048", value: 50 });
  assert.equal(record(changed, "BLD-2048").target, 50);
  assert.equal(record(changed, "BLD-2048").actual, 5);
  const moved = deployBoardReducer(changed, { type: "tick", seconds: 10 });
  assert.ok(record(moved, "BLD-2048").actual > 5);
  assert.ok(record(moved, "BLD-2048").actual < 50);
});

test("invalid or zero traffic cannot bypass rollback confirmation", () => {
  const state = initial();
  for (const value of [0, -5, 17, 101, Number.NaN]) {
    assert.equal(deployBoardReducer(state, { type: "traffic", id: "BLD-2048", value }), state);
  }
});

test("two failed analyses roll the unhealthy canary back and lock traffic", () => {
  const raised = deployBoardReducer(initial(), { type: "traffic", id: "BLD-2047", value: 25 });
  const first = deployBoardReducer(raised, { type: "tick", seconds: 60 });
  assert.equal(record(first, "BLD-2047").phase, "Rolling out");
  assert.equal(record(first, "BLD-2047").failedAnalyses, 1);
  const second = deployBoardReducer(first, { type: "tick", seconds: 60 });
  assert.equal(record(second, "BLD-2047").phase, "Rolled back");
  assert.equal(record(second, "BLD-2047").actual, 0);
  assert.equal(second.notice.kind, "automatic");
  assert.equal(deployBoardReducer(second, { type: "traffic", id: "BLD-2047", value: 100 }), second);
});

test("rollback changes the record and Undo restores it without rewinding other releases or time", () => {
  const base = initial();
  const rolled = deployBoardReducer(base, { type: "rollback", id: "BLD-2048" });
  assert.equal(record(rolled, "BLD-2048").phase, "Rolled back");
  const ticked = deployBoardReducer(rolled, { type: "tick", seconds: 30 });
  const other = structuredClone(record(ticked, "BLD-2044"));
  const restored = deployBoardReducer(ticked, { type: "undo", token: rolled.undo.token });
  assert.deepEqual(record(restored, "BLD-2048"), record(base, "BLD-2048"));
  assert.deepEqual(record(restored, "BLD-2044"), other);
  assert.equal(restored.now, DEPLOY_REFERENCE + 30_000);
});

test("a stale Undo token cannot overwrite a newer operator decision", () => {
  const first = deployBoardReducer(initial(), { type: "retry", id: "BLD-2041" });
  const second = deployBoardReducer(first, { type: "approve", id: "BLD-2050" });
  assert.equal(deployBoardReducer(second, { type: "undo", token: first.undo.token }), second);
});

test("Retry clears the failure, restarts checks, and can be undone", () => {
  const base = initial();
  const retried = deployBoardReducer(base, { type: "retry", id: "BLD-2041" });
  assert.equal(record(retried, "BLD-2041").checks, 0);
  assert.equal(record(retried, "BLD-2041").failure, null);
  assert.equal(record(retried, "BLD-2041").attempts, 2);
  const progressed = deployBoardReducer(retried, { type: "tick", seconds: 30 });
  assert.equal(record(progressed, "BLD-2041").checks, 3);
  const restored = deployBoardReducer(progressed, { type: "undo", token: retried.undo.token });
  assert.equal(record(restored, "BLD-2041").phase, "Failed");
  assert.equal(record(restored, "BLD-2041").attempts, 1);
});

test("search and environment filters compose across deploy and merge data", () => {
  const state = initial();
  assert.equal(filterDeployRecords(state.records, "checkout", "Production").length, 3);
  assert.equal(filterDeployRecords(state.records, "nothing-matches", "All envs").length, 0);
  assert.equal(
    filterDeployMerges(DEPLOY_MERGES, state.records, "idempotency", "Production").length,
    1,
  );
  assert.equal(
    filterDeployMerges(DEPLOY_MERGES, state.records, "idempotency", "Staging").length,
    0,
  );
});

test("the reducer never mutates supplied state or fixtures", () => {
  const seeds = createDeployRecords();
  const snapshot = structuredClone(seeds);
  const state = createDeployBoardState(seeds, DEPLOY_REFERENCE);
  const original = structuredClone(state);
  deployBoardReducer(state, { type: "approve", id: "BLD-2050" });
  deployBoardReducer(state, { type: "tick", seconds: 1200 });
  assert.deepEqual(seeds, snapshot);
  assert.deepEqual(state, original);
});
