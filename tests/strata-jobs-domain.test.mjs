import assert from "node:assert/strict";
import test from "node:test";
import {
  STRATA_NOW_MS,
  STRATA_OWNERS,
  STRATA_SERVICES,
} from "../src/templates/workflow/strata-domain.ts";
import { nextStrataRuns, parseStrataCron } from "../src/templates/workflow/strata-cron.ts";
import {
  createStrataJobsFixture,
  strataJobHealth,
  strataJobHistory,
  strataJobsMetrics,
  validateStrataJob,
} from "../src/templates/workflow/strata-jobs-model.ts";

test("cron presets produce strict future UTC runs across calendar boundaries", () => {
  assert.deepEqual(
    nextStrataRuns("*/5 * * * *", STRATA_NOW_MS),
    [5, 10, 15].map((minutes) => STRATA_NOW_MS + minutes * 60000),
  );
  assert.deepEqual(
    nextStrataRuns("0 * * * *", STRATA_NOW_MS),
    [1, 2, 3].map((hours) => STRATA_NOW_MS + hours * 3600000),
  );
  assert.deepEqual(nextStrataRuns("0 9 * * 1-5", Date.parse("2026-10-23T10:00:00Z"), 1), [
    Date.parse("2026-10-26T09:00:00Z"),
  ]);
  assert.deepEqual(nextStrataRuns("0 9 1 * *", Date.parse("2026-12-31T23:59:00Z"), 1), [
    Date.parse("2027-01-01T09:00:00Z"),
  ]);
});

test("cron lists/ranges/steps and Sunday aliases retain calendar meaning", () => {
  const cron = parseStrataCron("0,15,30 9-11/2 * * 7");
  assert.deepEqual(cron.minutes, [0, 15, 30]);
  assert.deepEqual(cron.hours, [9, 11]);
  assert.deepEqual(nextStrataRuns("0 0 * * 7", Date.parse("2026-10-23T00:00:00Z"), 1), [
    Date.parse("2026-10-25T00:00:00Z"),
  ]);
  assert.deepEqual(nextStrataRuns("0 0 1 * 1", STRATA_NOW_MS, 1), [
    Date.parse("2026-10-26T00:00:00Z"),
  ]);
});

test("impossible dates terminate and leap-day schedules remain possible", () => {
  assert.deepEqual(nextStrataRuns("0 0 31 2 *", STRATA_NOW_MS), []);
  assert.deepEqual(nextStrataRuns("0 0 29 2 *", STRATA_NOW_MS, 1), [
    Date.parse("2028-02-29T00:00:00Z"),
  ]);
  assert.deepEqual(
    nextStrataRuns("0 0 29 2 *", STRATA_NOW_MS),
    [2028, 2032, 2036].map((year) => Date.parse(`${year}-02-29T00:00:00Z`)),
  );
  for (const expression of [
    "",
    "* * * *",
    "60 * * * *",
    "0 24 * * *",
    "*/0 * * * *",
    "0 0 * 13 *",
    "0 0 1-0 * *",
    "0,,1 * * * *",
    "0 0 * * 8",
  ])
    assert.throws(() => parseStrataCron(expression), expression);
});

test("independent fixture references actual shared services and owners", () => {
  const { jobs, runs } = createStrataJobsFixture();
  assert.equal(jobs.length, 32);
  assert.equal(new Set(jobs.map((job) => job.id)).size, 32);
  assert.equal(new Set(runs.map((run) => run.id)).size, runs.length);
  for (const job of jobs) {
    assert.ok(STRATA_SERVICES.some((service) => service.id === job.serviceId));
    assert.ok(STRATA_OWNERS.some((owner) => owner.id === job.ownerId));
    assert.equal(strataJobHistory(job.id, runs).length, 20);
    assert.ok(nextStrataRuns(job.cron, STRATA_NOW_MS, 1).length);
  }
});

test("cards, hourly plot and next-run totals derive from the same records", () => {
  const { jobs, runs } = createStrataJobsFixture();
  const metrics = strataJobsMetrics(jobs, runs);
  assert.deepEqual(
    [metrics.active, metrics.healthy, metrics.failing, metrics.paused],
    [27, 24, 3, 5],
  );
  assert.deepEqual(
    [metrics.runs, metrics.succeeded, metrics.failed, metrics.timedOut, metrics.failedJobs],
    [989, 980, 7, 2, 5],
  );
  assert.equal(metrics.worst.job.id, "job-2");
  assert.equal(metrics.worst.count, 4);
  assert.deepEqual(metrics.secondsByOutcome, [51180, 4800, 1212]);
  assert.equal(metrics.priorSeconds, 60842);
  assert.equal(Math.round((57192 / metrics.priorSeconds - 1) * 100), -6);
  const plotSeconds =
    metrics.hours.reduce((sum, hour) => sum + hour.segments.reduce((a, b) => a + b, 0), 0) * 60;
  assert.ok(Math.abs(plotSeconds - 57192) < 0.0001);
  assert.deepEqual([metrics.hoursInSlo, metrics.measuredHours], [17, 23]);
  assert.equal(metrics.upcoming.length, 42);
  assert.equal(metrics.upcoming[0].at, STRATA_NOW_MS + 300000);
});

test("pausing changes health and workload without deleting history", () => {
  const { jobs, runs } = createStrataJobsFixture();
  const paused = jobs.map((job) => (job.id === "job-1" ? { ...job, enabled: false } : job));
  assert.equal(strataJobHealth(paused[0], runs), "Paused");
  const metrics = strataJobsMetrics(paused, runs);
  assert.deepEqual(
    [metrics.active, metrics.failing, metrics.paused, metrics.upcoming.length],
    [26, 2, 6, 30],
  );
  assert.equal(metrics.runs, 989);
});

test("new-job validation rejects never-firing schedules and foreign references", () => {
  const { jobs } = createStrataJobsFixture();
  const { id: _id, createdAt: _createdAt, ...valid } = jobs[0];
  assert.deepEqual(validateStrataJob(valid), {});
  const errors = validateStrataJob({
    ...valid,
    name: " ",
    command: "",
    cron: "0 0 31 2 *",
    serviceId: "missing",
    ownerId: "missing",
  });
  assert.deepEqual(Object.keys(errors).sort(), ["command", "cron", "name", "ownerId", "serviceId"]);
  assert.ok(validateStrataJob({ ...valid, timeZone: "Europe/London" }).timeZone);
});

test("empty filters yield truthful metrics without NaN or stale rows", () => {
  const metrics = strataJobsMetrics([], []);
  assert.equal(metrics.successRate, null);
  assert.equal(metrics.worst, undefined);
  assert.deepEqual(metrics.upcoming, []);
  assert.equal(
    metrics.hours.reduce((sum, hour) => sum + hour.segments.reduce((a, b) => a + b, 0), 0),
    0,
  );
});
