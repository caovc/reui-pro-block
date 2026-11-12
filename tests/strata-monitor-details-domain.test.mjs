import test from "node:test";
import assert from "node:assert/strict";
import {
  createStrataMonitorsFixture,
  setStrataMonitorEnabled,
} from "../src/templates/workflow/strata-monitors-model.ts";
import {
  adjacentStrataMonitorId,
  strataMonitorDetailId,
  strataMonitorDisplayId,
  strataMonitorOverview,
} from "../src/templates/workflow/strata-monitor-details-model.ts";

test("the api pin opens checkout only, while an ordinary monitor entry has no automatic detail", () => {
  const { monitors } = createStrataMonitorsFixture();
  assert.equal(strataMonitorDetailId(monitors, "api-acme-com"), "checkout");
  assert.equal(strataMonitorDetailId(monitors), null);
  assert.equal(strataMonitorDetailId([], "api-acme-com"), null);
  assert.equal(
    strataMonitorDetailId(
      monitors.filter((monitor) => monitor.id !== "checkout"),
      "api-acme-com",
    ),
    null,
  );
  assert.equal(strataMonitorDisplayId(monitors, "checkout"), "BL-MON-101");
  assert.equal(strataMonitorDisplayId(monitors, "invoice"), "BL-MON-108");
  assert.equal(monitors[0].id, "checkout");
});

test("previous and next monitor actions retain the eight-record ordering without wrapping", () => {
  const { monitors } = createStrataMonitorsFixture();
  assert.equal(adjacentStrataMonitorId(monitors, "checkout", -1), null);
  assert.equal(adjacentStrataMonitorId(monitors, "checkout", 1), "payments");
  assert.equal(adjacentStrataMonitorId(monitors, "payments", -1), "checkout");
  assert.equal(adjacentStrataMonitorId(monitors, "invoice", 1), null);
  assert.equal(adjacentStrataMonitorId(monitors, "missing", 1), null);
});

test("Overview uses the existing twenty checks, three trailing failures and exact cron next-five times", () => {
  const fixture = createStrataMonitorsFixture();
  const input = JSON.stringify(fixture);
  const details = strataMonitorOverview(fixture.monitors, fixture.checks, "checkout");
  assert.equal(details.row.checks.length, 20);
  assert.equal(details.row.p95, 15);
  assert.equal(details.trailingFailures, 3);
  assert.equal(details.failureSince, "2026-10-22T13:50:00.000Z");
  assert.equal(details.row.latest.status, "Timed Out");
  assert.deepEqual(
    details.nextChecks.map((at) => new Date(at).toISOString()),
    [
      "2026-10-22T14:05:00.000Z",
      "2026-10-22T14:10:00.000Z",
      "2026-10-22T14:15:00.000Z",
      "2026-10-22T14:20:00.000Z",
      "2026-10-22T14:25:00.000Z",
    ],
  );
  assert.deepEqual(details.fields, ["*/5", "*", "*", "*", "*"]);
  assert.equal(details.durations.length, 20);
  assert.equal(details.durations.at(-1).total, 15);
  assert.equal(details.request, "GET https://api.bricklane.test/checkout");
  assert.equal(JSON.stringify(fixture), input);
  assert.equal(strataMonitorOverview(fixture.monitors, fixture.checks, "missing"), null);
});

test("local Pause and Resume preserve all old checks and cannot repair failure health", () => {
  const fixture = createStrataMonitorsFixture();
  const history = JSON.stringify(fixture.checks);
  const paused = setStrataMonitorEnabled(fixture.monitors, "checkout", false);
  assert.notEqual(paused, fixture.monitors);
  const details = strataMonitorOverview(paused, fixture.checks, "checkout");
  assert.equal(details.row.health, "Paused");
  assert.equal(details.trailingFailures, 3);
  assert.equal(details.row.p95, 15);
  assert.deepEqual(details.nextChecks, []);
  assert.equal(details.durations.length, 20);
  const resumed = setStrataMonitorEnabled(paused, "checkout", true);
  const resumedDetails = strataMonitorOverview(resumed, fixture.checks, "checkout");
  assert.equal(resumedDetails.row.health, "Failing");
  assert.equal(resumedDetails.nextChecks.length, 5);
  assert.equal(JSON.stringify(fixture.checks), history);
  assert.equal(setStrataMonitorEnabled(fixture.monitors, "unknown", false), fixture.monitors);
  assert.equal(setStrataMonitorEnabled(fixture.monitors, "checkout", true), fixture.monitors);
});

test("a new monitor with no observations remains Pending rather than fabricating duration or success", () => {
  const fixture = createStrataMonitorsFixture();
  const newMonitor = { ...fixture.monitors[0], id: "new-empty", name: "New empty monitor" };
  const details = strataMonitorOverview(
    [...fixture.monitors, newMonitor],
    fixture.checks,
    newMonitor.id,
  );
  assert.equal(details.row.health, "Pending");
  assert.equal(details.row.p95, null);
  assert.equal(details.row.successRate, null);
  assert.deepEqual(details.durations, []);
  assert.equal(details.trailingFailures, 0);
  assert.equal(details.nextChecks.length, 5);
});

test("command schedules derive calendar occurrences, and request text remains an inert local string", () => {
  const fixture = createStrataMonitorsFixture();
  const details = strataMonitorOverview(fixture.monitors, fixture.checks, "backup");
  assert.equal(new Date(details.nextChecks[0]).toISOString(), "2026-10-23T02:00:00.000Z");
  assert.equal(new Date(details.nextChecks[4]).toISOString(), "2026-10-27T02:00:00.000Z");
  assert.equal(details.request, fixture.monitors.find((monitor) => monitor.id === "backup").target);
  const invalid = fixture.monitors.map((monitor) =>
    monitor.id === "backup" ? { ...monitor, cron: "not a cron" } : monitor,
  );
  const invalidDetails = strataMonitorOverview(invalid, fixture.checks, "backup");
  assert.deepEqual(invalidDetails.nextChecks, []);
  assert.ok(invalidDetails.scheduleError);
});

test("a successful latest observation ends the current alert streak without removing earlier failures", () => {
  const fixture = createStrataMonitorsFixture();
  const checks = fixture.checks.map((check) =>
    check.id === "CHK-48210" ? { ...check, status: "Succeeded" } : check,
  );
  const details = strataMonitorOverview(fixture.monitors, checks, "checkout");
  assert.equal(details.trailingFailures, 0);
  assert.equal(details.failureSince, null);
  assert.equal(details.row.health, "Healthy");
  assert.equal(details.row.longestFailureStreak, 2);
  assert.equal(details.row.checks.length, 20);
});
