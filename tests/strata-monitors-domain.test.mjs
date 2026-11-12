import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STRATA_NOW,
  STRATA_NOW_MS,
  strataService,
} from "../src/templates/workflow/strata-domain.ts";
import { nextStrataRuns } from "../src/templates/workflow/strata-cron.ts";
import {
  createStrataMonitor,
  createStrataMonitorsFixture,
  emptyStrataMonitorDraft,
  formatStrataMonitorDuration,
  selectStrataMonitorRows,
  strataCheckDuration,
  strataMonitorMetrics,
  strataMonitorPercentile,
  strataMonitorRow,
  validateStrataMonitor,
} from "../src/templates/workflow/strata-monitors-model.ts";

test("all 160 checks have stable independent identities, shared services and valid phases", () => {
  const fixture = createStrataMonitorsFixture();
  assert.equal(fixture.monitors.length, 8);
  assert.equal(fixture.checks.length, 160);
  assert.equal(new Set(fixture.checks.map((check) => check.id)).size, 160);
  for (const monitor of fixture.monitors) {
    assert.ok(strataService(monitor.serviceId));
    const row = strataMonitorRow(monitor, fixture.checks);
    assert.equal(row.checks.length, 20);
    for (const [index, check] of row.checks.entries()) {
      assert.equal(check.monitorId, monitor.id);
      assert.ok(Date.parse(check.startedAt) <= STRATA_NOW_MS);
      assert.ok(check.loadSeconds >= 0 && check.stepsSeconds >= 0 && check.confirmSeconds >= 0);
      assert.ok(Number.isFinite(strataCheckDuration(check)));
      if (check.status === "Timed Out")
        assert.ok(Math.abs(strataCheckDuration(check) - monitor.timeoutSeconds) < 0.001);
      if (index) assert.ok(check.startedAt > row.checks[index - 1].startedAt);
    }
  }
  assert.deepEqual(createStrataMonitorsFixture(), fixture);
  fixture.monitors[0].name = "Mutated locally";
  assert.equal(createStrataMonitorsFixture().monitors[0].name, "Checkout flow");
});

test("summary and both Checkout views use exactly the same outcome records", () => {
  const { monitors, checks } = createStrataMonitorsFixture();
  const rows = selectStrataMonitorRows(monitors, checks);
  const metrics = strataMonitorMetrics(rows);
  assert.equal(metrics.succeeded, 153);
  assert.equal(metrics.failed, 3);
  assert.equal(metrics.timedOut, 4);
  assert.equal(metrics.skipped, 0);
  assert.equal(metrics.total, 160);
  assert.equal(metrics.successRate.toFixed(1), "95.6");
  assert.equal(metrics.failing, 1);
  assert.equal(metrics.longestFailureStreak, 3);
  assert.equal(metrics.slowest.monitor.id, "backup");
  assert.equal(metrics.slowest.p95, 1145);
  const checkout = rows.find((row) => row.id === "checkout");
  assert.equal(checkout.successRate, 85);
  assert.equal(checkout.p50, 8);
  assert.equal(checkout.p95, 15);
  assert.equal(checkout.latest.status, "Timed Out");
  assert.equal(checkout.checks.filter((check) => check.outlier).length, 4);
  assert.equal(
    checkout.checks.find((check) => check.deployment)?.startedAt,
    "2026-10-22T13:40:00.000Z",
  );
});

test("prior period is a real bounded comparison and yields a possible success percentage", () => {
  const { monitors, checks, previousChecks } = createStrataMonitorsFixture();
  const previous = strataMonitorMetrics(selectStrataMonitorRows(monitors, previousChecks));
  const current = strataMonitorMetrics(selectStrataMonitorRows(monitors, checks));
  assert.equal(previous.succeeded, 159);
  assert.equal(previous.total, 160);
  assert.ok(previous.successRate <= 100);
  assert.equal((current.successRate - previous.successRate).toFixed(1), "-3.8");
  const checkout = monitors.find((monitor) => monitor.id === "checkout");
  const priorCheckout = strataMonitorRow(checkout, previousChecks);
  // The chart's observed expected-range layer needs a real percentile interval.
  assert.ok(priorCheckout.p95 > priorCheckout.p50);
  assert.ok(priorCheckout.p95 < checkout.timeoutSeconds);
  for (const monitor of monitors) {
    const latestPrior = strataMonitorRow(monitor, previousChecks).latest;
    const earliestCurrent = strataMonitorRow(monitor, checks).checks[0];
    assert.ok(latestPrior.startedAt < earliestCurrent.startedAt);
  }
});

test("environment and health filters share the same monitor domain without losing paused history", () => {
  const { monitors, checks } = createStrataMonitorsFixture();
  assert.equal(selectStrataMonitorRows(monitors, checks, "all", "Failing")[0].id, "checkout");
  assert.equal(selectStrataMonitorRows(monitors, checks, "Staging")[0].id, "login");
  const paused = selectStrataMonitorRows(monitors, checks, "Sandbox", "Paused");
  assert.equal(paused.length, 1);
  assert.equal(paused[0].id, "invoice");
  assert.equal(paused[0].checks.length, 20);
  assert.equal(paused[0].successRate, 100);
  assert.deepEqual(selectStrataMonitorRows(monitors, checks, "Staging", "Failing"), []);
});

test("percentiles and empty selections remain truthful at domain boundaries", () => {
  assert.equal(strataMonitorPercentile([], 0.95), null);
  assert.equal(strataMonitorPercentile([6], 0.95), 6);
  assert.equal(strataMonitorPercentile([5, 1, 3, 2, 4], 0.5), 3);
  assert.equal(strataMonitorPercentile([5, 1, 3, 2, 4], 0.95), 5);
  const empty = strataMonitorMetrics([]);
  assert.equal(empty.successRate, null);
  assert.equal(empty.total, 0);
  assert.equal(empty.slowest, null);
  assert.equal(empty.longestFailureStreak, 0);
  assert.equal(formatStrataMonitorDuration(1145), "19m 05s");
  assert.equal(formatStrataMonitorDuration(null), "—");
});

test("New Monitor starts with empty inputs and the observed five-minute UTC schedule", () => {
  const draft = emptyStrataMonitorDraft();
  assert.equal(draft.name, "");
  assert.equal(draft.target, "");
  assert.equal(draft.cron, "*/5 * * * *");
  assert.equal(draft.timeZone, "UTC");
  assert.equal(draft.region, "all");
  assert.equal(draft.serviceId, "checkout-api");
  assert.equal(draft.environment, "Production");
  assert.equal(draft.enabled, true);
  assert.deepEqual(nextStrataRuns(draft.cron, STRATA_NOW_MS), [
    Date.parse("2026-10-22T14:05:00.000Z"),
    Date.parse("2026-10-22T14:10:00.000Z"),
    Date.parse("2026-10-22T14:15:00.000Z"),
  ]);
  assert.deepEqual(Object.keys(validateStrataMonitor(draft)).sort(), ["name", "target"]);
});

test("creation stores a monitor without inventing checks or a successful health state", () => {
  const fixture = createStrataMonitorsFixture();
  const original = structuredClone(fixture);
  const result = createStrataMonitor(
    {
      ...emptyStrataMonitorDraft(),
      name: "  Staging checkout  ",
      target: "  https://api.bricklane.test/health  ",
      environment: "Staging",
      cron: " */5  * * * * ",
    },
    "monitor-9",
  );
  assert.equal(result.ok, true);
  assert.equal(result.monitor.name, "Staging checkout");
  assert.equal(result.monitor.target, "https://api.bricklane.test/health");
  assert.equal(result.monitor.cron, "*/5 * * * *");
  assert.equal(result.monitor.kind, "http");
  assert.equal(result.monitor.createdAt, STRATA_NOW);
  assert.equal(result.monitor.intervalMinutes, 5);
  const monitors = [...fixture.monitors, result.monitor];
  const row = strataMonitorRow(result.monitor, fixture.checks);
  assert.equal(row.health, "Pending");
  assert.equal(row.latest, null);
  assert.deepEqual(row.checks, []);
  assert.equal(row.successRate, null);
  assert.equal(row.p50, null);
  assert.equal(row.p95, null);
  assert.equal(
    selectStrataMonitorRows(monitors, fixture.checks, "Staging", "Pending")[0].id,
    "monitor-9",
  );
  assert.ok(
    !selectStrataMonitorRows(monitors, fixture.checks, "Production").some(
      (item) => item.id === "monitor-9",
    ),
  );
  assert.equal(strataMonitorMetrics(selectStrataMonitorRows(monitors, fixture.checks)).total, 160);
  assert.deepEqual(fixture, original);
});

test("a paused command is recorded as metadata with no synthetic execution history", () => {
  const result = createStrataMonitor(
    {
      ...emptyStrataMonitorDraft(),
      name: "Ledger archive",
      target: "pg_dump --all",
      cron: "0 2 * * *",
      enabled: false,
    },
    "monitor-10",
  );
  assert.equal(result.ok, true);
  assert.equal(result.monitor.kind, "command");
  assert.equal(result.monitor.enabled, false);
  assert.equal(strataMonitorRow(result.monitor, []).health, "Paused");
  assert.equal(
    nextStrataRuns(result.monitor.cron, STRATA_NOW_MS)[0],
    Date.parse("2026-10-23T02:00:00.000Z"),
  );
});

test("creation rejects invalid schedules, unsupported choices and foreign relationships", () => {
  const result = createStrataMonitor(
    {
      ...emptyStrataMonitorDraft(),
      name: "Invalid monitor",
      target: "ftp://api.bricklane.test/health",
      cron: "0 0 30 2 *",
      timeZone: "America/New_York",
      region: "unknown-region",
      ownerId: "unknown-owner",
      serviceId: "unknown-service",
      environment: "Unknown",
    },
    "monitor-11",
  );
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    "cron",
    "environment",
    "ownerId",
    "region",
    "serviceId",
    "target",
    "timeZone",
  ]);
  assert.ok(
    validateStrataMonitor({ ...emptyStrataMonitorDraft(), name: "Invalid URL", target: "https://" })
      .target,
  );
  assert.ok(
    validateStrataMonitor({
      ...emptyStrataMonitorDraft(),
      name: "Multiline",
      target: "first\nsecond",
    }).target,
  );
});
