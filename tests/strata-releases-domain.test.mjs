import assert from "node:assert/strict";
import test from "node:test";
import {
  STRATA_INCIDENT_ID,
  STRATA_NOW_MS,
  strataOwner,
  strataService,
} from "../src/templates/workflow/strata-domain.ts";
import {
  createStrataReleasesFixture,
  nextStrataDeployWindow,
  selectStrataBoard,
  selectStrataReleases,
  selectStrataMerges,
  strataBoardStatusLabel,
  strataReleaseAge,
  strataReleaseDuration,
  strataReleaseTime,
  summarizeStrataReleases,
  summarizeStrataMerges,
} from "../src/templates/workflow/strata-releases-model.ts";

test("independent release history and board use real shared identities without synthetic filler rows", () => {
  const { history, board, merges } = createStrataReleasesFixture();
  assert.equal(history.length, 23);
  assert.equal(board.length, 12);
  assert.equal(new Set(history.map((row) => row.id)).size, history.length);
  assert.equal(new Set(board.map((row) => row.id)).size, board.length);
  assert.equal(new Set(history.map((row) => row.serviceId)).size, 8);
  assert.equal(merges.length, 7);
  assert.equal(new Set(merges.map((row) => row.id)).size, merges.length);
  for (const row of merges) assert.ok(strataService(row.serviceId), row.serviceId);
  for (const row of [...history, ...board]) {
    assert.ok(strataService(row.serviceId), row.serviceId);
    assert.notEqual(row.version, row.previousVersion);
  }
  for (const row of history) {
    assert.ok(strataOwner(row.authorId));
    assert.equal(row.authorId, strataService(row.serviceId).ownerId);
    assert.ok(row.startedAt < STRATA_NOW_MS);
    assert.ok(row.durationSeconds > 0);
    assert.ok(row.completedStages >= 0 && row.completedStages <= 6);
  }
});

test("history tab counts come from actual records and respond to changed scope", () => {
  const { history } = createStrataReleasesFixture();
  assert.deepEqual(summarizeStrataReleases(history), {
    all: 23,
    live: 1,
    failed: 2,
    "rolled-back": 2,
  });
  assert.deepEqual(summarizeStrataReleases(history.filter((row) => row.status !== "running")), {
    all: 22,
    live: 0,
    failed: 2,
    "rolled-back": 2,
  });
  for (const tab of ["live", "failed", "rolled-back"])
    assert.equal(
      selectStrataReleases(history, { tab }).length,
      summarizeStrataReleases(history)[tab],
    );
});

test("deployment target environment is independent of a service's catalog home", () => {
  const { history } = createStrataReleasesFixture();
  assert.equal(strataService("webhook-worker").environment, "Production");
  const staging = selectStrataReleases(history, { environment: "Staging" });
  assert.ok(staging.some((row) => row.serviceId === "webhook-worker"));
  assert.ok(staging.every((row) => row.environment === "Staging"));
  assert.equal(summarizeStrataReleases(staging).failed, 2);
  assert.equal(
    summarizeStrataReleases(selectStrataReleases(history, { environment: "Production" })).failed,
    0,
  );
});

test("query composes with status and environment without changing the tab ledger", () => {
  const { history } = createStrataReleasesFixture();
  const before = summarizeStrataReleases(history);
  const target = history.find((row) => row.status === "failed");
  assert.deepEqual(
    selectStrataReleases(history, {
      query: `  ${target.commit.toUpperCase()}  `,
      environment: target.environment,
      tab: "failed",
    }).map((row) => row.id),
    [target.id],
  );
  assert.deepEqual(selectStrataReleases(history, { query: target.commit, tab: "live" }), []);
  assert.ok(
    selectStrataReleases(history, { query: strataOwner(target.authorId).name }).some(
      (row) => row.id === target.id,
    ),
  );
  assert.deepEqual(summarizeStrataReleases(history), before);
});

test("board local and shell environments intersect rather than overriding one another", () => {
  const { board } = createStrataReleasesFixture();
  assert.deepEqual(
    selectStrataBoard(board, { environment: "Production", boardEnvironment: "Staging" }),
    [],
  );
  const production = selectStrataBoard(board, {
    environment: "Production",
    boardEnvironment: "all",
  });
  assert.ok(production.length > 0 && production.length < board.length);
  assert.ok(production.every((row) => row.environment === "Production"));
  const sandbox = selectStrataBoard(board, {
    environment: "all",
    boardEnvironment: "Sandbox",
    query: "WEBHOOK",
  });
  assert.equal(sandbox.length, 1);
  assert.equal(sandbox[0].environment, "Sandbox");
});

test("board status labels retain real progress and clock-derived scheduling", () => {
  const { board } = createStrataReleasesFixture();
  assert.equal(new Set(board.map((row) => row.status)).size, 8);
  assert.equal(strataBoardStatusLabel(board.find((row) => row.status === "checks")), "Checks 6/9");
  assert.equal(
    strataBoardStatusLabel(board.find((row) => row.status === "rolling")),
    "Rolling out 5%",
  );
  assert.equal(
    strataBoardStatusLabel(board.find((row) => row.status === "deployed")),
    "Deployed 13:54",
  );
  const queued = board.find((row) => row.status === "queued");
  assert.equal(strataBoardStatusLabel(queued), "Queued 14:20");
  assert.equal(strataBoardStatusLabel(queued, STRATA_NOW_MS + 20 * 60000), "Queued 14:40");
});

test("merge status counts derive from seven real records without flip ghosts or blank padding", () => {
  const { merges } = createStrataReleasesFixture();
  assert.deepEqual(summarizeStrataMerges(merges), { all: 7, merged: 5, merging: 1, blocked: 1 });
  assert.deepEqual(summarizeStrataMerges(merges.slice(1)), {
    all: 6,
    merged: 4,
    merging: 1,
    blocked: 1,
  });
  assert.deepEqual(
    merges.map((row) => row.pullRequest),
    [2841, 1187, 964, 745, 388, 1097, 458],
  );
});

test("completed merges link coherent deploy identities while pending work cannot inflate deploy count", () => {
  const { board, merges } = createStrataReleasesFixture();
  for (const merge of merges.filter((row) => row.status === "merged")) {
    const deploy = board.find((row) => row.id === merge.deployId);
    assert.ok(deploy, merge.deployId);
    assert.equal(deploy.serviceId, merge.serviceId);
    assert.equal(deploy.version, merge.version);
    assert.equal(deploy.environment, merge.environment);
    assert.ok(merge.scheduledAt <= STRATA_NOW_MS);
  }
  const pending = merges.find((row) => row.status === "merging");
  assert.equal(pending.deployId, "DEP-4137");
  assert.equal(
    board.some((row) => row.id === pending.deployId),
    false,
  );
  assert.equal(board.length, 12);
  const checkout = merges.find((row) => row.serviceId === "checkout-api");
  assert.equal(checkout.incidentId, STRATA_INCIDENT_ID);
  assert.equal(checkout.version, "3.5.0");
});

test("blocked merge has no scheduled time and retains the reason instead of a fake epoch", () => {
  const { merges } = createStrataReleasesFixture();
  const blocked = merges.find((row) => row.status === "blocked");
  assert.equal(blocked.scheduledAt, null);
  assert.match(blocked.blockedReason, /validation checks/i);
  assert.equal(blocked.deployId, "DEP-4124");
  assert.equal(merges.filter((row) => row.scheduledAt === null).length, 1);
});

test("merge searches cover PR, branch and target deploy while environment scopes intersect", () => {
  const { merges } = createStrataReleasesFixture();
  assert.deepEqual(
    selectStrataMerges(merges, { query: "  #2841  " }).map((row) => row.pullRequest),
    [2841],
  );
  const pending = merges.find((row) => row.status === "merging");
  assert.deepEqual(
    selectStrataMerges(merges, { query: pending.branch.toUpperCase() }).map((row) => row.id),
    [pending.id],
  );
  assert.deepEqual(
    selectStrataMerges(merges, { query: pending.deployId }).map((row) => row.id),
    [pending.id],
  );
  assert.deepEqual(
    selectStrataMerges(merges, { environment: "Production", boardEnvironment: "Staging" }),
    [],
  );
  assert.deepEqual(summarizeStrataMerges(selectStrataMerges(merges, { environment: "Staging" })), {
    all: 3,
    merged: 2,
    merging: 0,
    blocked: 1,
  });
});

test("the next deploy window is strictly future UTC across cadence and day boundaries", () => {
  assert.equal(strataReleaseTime(STRATA_NOW_MS), "14:00");
  assert.equal(nextStrataDeployWindow(), Date.parse("2026-10-22T14:20:00Z"));
  assert.equal(
    nextStrataDeployWindow(Date.parse("2026-10-22T14:19:59Z")),
    Date.parse("2026-10-22T14:20:00Z"),
  );
  assert.equal(
    nextStrataDeployWindow(Date.parse("2026-10-22T23:59:59Z")),
    Date.parse("2026-10-23T00:00:00Z"),
  );
});

test("relative age and elapsed duration keep minute/hour/day boundaries", () => {
  assert.equal(strataReleaseAge(STRATA_NOW_MS), "0m ago");
  assert.equal(strataReleaseAge(STRATA_NOW_MS + 60000), "0m ago");
  assert.equal(strataReleaseAge(STRATA_NOW_MS - 59 * 60000), "59m ago");
  assert.equal(strataReleaseAge(STRATA_NOW_MS - 60 * 60000), "1h ago");
  assert.equal(strataReleaseAge(STRATA_NOW_MS - 24 * 3600000), "1d ago");
  assert.equal(strataReleaseDuration(332), "5:32");
  assert.equal(strataReleaseDuration(3600), "60:00");
});

test("checkout release identity and version align across history and board", () => {
  const { history, board } = createStrataReleasesFixture();
  for (const list of [history, board]) {
    const checkout = list.filter((row) => row.serviceId === "checkout-api");
    assert.ok(checkout.length > 0);
    for (const row of checkout) {
      assert.equal(row.incidentId, STRATA_INCIDENT_ID);
      assert.equal(row.version, "3.5.0");
      assert.equal(row.previousVersion, "3.4.2");
    }
  }
});

test("selectors and separate model instances cannot mutate the fixture ledger", () => {
  const fixture = createStrataReleasesFixture();
  const before = JSON.stringify(fixture);
  selectStrataReleases(fixture.history, { environment: "Staging", tab: "failed", query: "cache" });
  selectStrataBoard(fixture.board, { boardEnvironment: "Sandbox", query: "webhook" });
  selectStrataMerges(fixture.merges, { environment: "Staging", query: "#458" });
  assert.equal(JSON.stringify(fixture), before);
  const separate = createStrataReleasesFixture();
  separate.history[0].status = "failed";
  separate.board[0].status = "scheduled";
  separate.merges[0].status = "blocked";
  assert.equal(JSON.stringify(fixture), before);
});
