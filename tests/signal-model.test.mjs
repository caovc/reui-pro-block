import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accountHandover,
  campaignStatus,
  canLinkSignal,
  initialAccounts,
  initialGoals,
  initialSignalEdges,
  initialTeam,
  overlapsSignalReview,
  retentionCohorts,
  retentionSeries,
  signalCsv,
  sourceFixtures,
  validFunnel,
  weightedProgress,
} from "../src/templates/workflow/signal-model.ts";

test("funnel stages decrease and chart CSV quotes text", () => {
  assert.equal(validFunnel([200, 40, 40, 1]), true);
  for (const values of [
    [200, 40, 41, 1],
    [5, -1],
    [1, 0.2],
    [4, NaN],
  ]) {
    assert.equal(validFunnel(values), false);
  }
  assert.equal(
    signalCsv([{ name: 'Q1, "new"', value: 30 }], "People"),
    'Period,"People"\r\n"Q1, ""new""",30',
  );
});

test("a source outage changes only the campaigns using that source", () => {
  assert.deepEqual(
    campaignStatus(sourceFixtures).map(({ syncing }) => syncing),
    [true, false, false],
  );
  const restored = sourceFixtures.map((source) =>
    source.id === "social" ? { ...source, healthy: true } : source,
  );
  assert.deepEqual(
    campaignStatus(restored).map(({ syncing }) => syncing),
    [true, true, true],
  );
  assert.equal(sourceFixtures[2].healthy, false);
});

test("retention window and participant edits determine the actual exported data", () => {
  const cohort = retentionCohorts[0];
  const full = retentionSeries(cohort, 16);
  assert.equal(full.length, 16);
  assert.deepEqual(full.slice(0, 4), retentionSeries(cohort, 4));
  assert.ok(full[15].value < full[0].value);
  assert.equal(retentionSeries({ ...cohort, start: 200 }, 4)[0].value, 200);
});

test("metric links reject cycles, self-links and duplicate edges", () => {
  assert.ok(canLinkSignal(initialSignalEdges, "setup", "team"));
  const edges = [...initialSignalEdges, { source: "setup", target: "team" }];
  assert.ok(!canLinkSignal(edges, "team", "setup"));
  assert.ok(!canLinkSignal(edges, "setup", "setup"));
  assert.ok(!canLinkSignal(edges, "setup", "team"));
});

test("scorecard shows changed weights and uses their actual normalized contribution", () => {
  assert.equal(
    initialGoals.reduce((total, { metrics }) => total + metrics.length, 0),
    30,
  );
  assert.deepEqual(
    weightedProgress([
      { weight: 75, actual: 50, target: 100 },
      { weight: 25, actual: 100, target: 100 },
    ]),
    { weight: 100, progress: 63 },
  );
  assert.equal(weightedProgress([{ weight: 10, actual: 10, target: 20 }]).weight, 10);
});

test("workload is recalculated and roadmap boundaries are half-open", () => {
  assert.equal(accountHandover(initialAccounts, initialTeam, "rina").id, "lea");
  const transferred = initialAccounts.map((account) =>
    account.id === "north" ? { ...account, owner: "lea" } : account,
  );
  assert.equal(accountHandover(transferred, initialTeam, "lea").id, "rina");
  const review = { start: new Date("2026-10-05"), end: new Date("2026-10-09") };
  assert.equal(overlapsSignalReview(new Date("2026-10-02"), review.start, review), false);
  assert.equal(overlapsSignalReview(new Date("2026-10-02"), new Date("2026-10-06"), review), true);
});
