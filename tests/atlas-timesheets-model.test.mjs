import assert from "node:assert/strict";
import { test } from "node:test";
import {
  atlasInitialTimeRange,
  atlasTimeDate,
  atlasTimeRangeDays,
  atlasTimeRowMatches,
  atlasTimeRows,
  createAtlasTimeEntries,
  formatAtlasMinutes,
  saveAtlasTimeEntry,
  shiftAtlasTimeDate,
} from "../src/templates/business/atlas-timesheets-model.ts";

test("calendar ranges cross month, year and DST boundaries without changing their length", () => {
  assert.equal(shiftAtlasTimeDate("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftAtlasTimeDate("2028-03-01", -1), "2028-02-29");
  assert.equal(atlasTimeDate("2026-02-29"), null);
  assert.equal(atlasTimeDate("2026-11-31"), null);
  assert.deepEqual(atlasTimeRangeDays({ from: "2026-03-07", to: "2026-03-09" }), [
    "2026-03-07",
    "2026-03-08",
    "2026-03-09",
  ]);
  assert.deepEqual(atlasTimeRangeDays({ from: "2026-11-22", to: "2026-11-16" }), []);
  assert.deepEqual(atlasTimeRangeDays({ from: "2026-11-01", to: "2026-12-02" }), []);
  assert.equal(atlasTimeRangeDays({ from: "2026-11-01", to: "2026-12-01" }).length, 31);
});

test("daily cells, range totals and billable filtering use actual dated entries", () => {
  const entries = createAtlasTimeEntries();
  const row = atlasTimeRows(entries, atlasInitialTimeRange, [])[0];
  assert.equal(row.days.length, 7);
  assert.equal(row.minutes, 1800);
  assert.equal(row.billableMinutes, 1530);
  assert.equal(row.targetMinutes, 2400);
  assert.equal(row.days[2].minutes, 270);
  assert.deepEqual(row.days[2].workTypes, ["Internal"]);
  assert.equal(row.days[5].minutes, 0);
  const billable = atlasTimeRows(entries, atlasInitialTimeRange, ["Billable"])[0];
  assert.equal(billable.minutes, 1530);
  assert.equal(billable.days[2].minutes, 0);
  const internal = atlasTimeRows(entries, atlasInitialTimeRange, ["Non-billable"])[6];
  assert.equal(internal.minutes, 2400);
  assert.equal(internal.billableMinutes, 0);
  assert.equal(atlasTimeRows(entries, { from: "2026-11-23", to: "2026-11-29" }, [])[0].minutes, 0);
  assert.equal(formatAtlasMinutes(135), "2h 15m");
});

test("multi-select tracked buckets form a union and combine with person and billable filters", () => {
  const rows = atlasTimeRows(createAtlasTimeEntries(), atlasInitialTimeRange, []);
  const filters = {
    people: [],
    tracked: ["Less than 20 hours", "More than 40 hours"],
    billable: [],
  };
  assert.deepEqual(
    rows.filter((row) => atlasTimeRowMatches(row, filters)).map((row) => row.name),
    ["Eli Morgan"],
  );
  const withOvertime = rows.map((row) => (row.id === 1 ? { ...row, minutes: 2460 } : row));
  assert.deepEqual(
    withOvertime.filter((row) => atlasTimeRowMatches(row, filters)).map((row) => row.name),
    ["Amara Ortiz", "Eli Morgan"],
  );
  const amara = { ...filters, people: ["Amara Ortiz"], tracked: ["20–40 hours"] };
  assert.deepEqual(
    rows.filter((row) => atlasTimeRowMatches(row, amara)).map((row) => row.name),
    ["Amara Ortiz"],
  );
  assert.equal(
    atlasTimeRowMatches(
      { ...rows[0], minutes: 0 },
      { people: [], tracked: [], billable: ["Billable"] },
    ),
    false,
  );
  assert.equal(
    atlasTimeRowMatches(
      { ...rows[0], minutes: 2400 },
      { people: [], tracked: ["20–40 hours"], billable: [] },
    ),
    true,
  );
});

test("creating and editing entries updates only the selected person and date", () => {
  const original = createAtlasTimeEntries();
  const snapshot = structuredClone(original);
  const entry = {
    id: "created",
    personId: 1,
    date: "2026-11-16",
    minutes: 90,
    workType: "Client",
    billable: true,
    note: "  Delivery follow-up  ",
  };
  const created = saveAtlasTimeEntry(original, entry);
  assert.equal(created.error, null);
  assert.equal(created.entries.length, original.length + 1);
  assert.equal(created.entries.at(-1).note, "Delivery follow-up");
  assert.equal(atlasTimeRows(created.entries, atlasInitialTimeRange, [])[0].minutes, 1890);
  assert.equal(
    atlasTimeRows(created.entries, atlasInitialTimeRange, [])[1].minutes,
    atlasTimeRows(original, atlasInitialTimeRange, [])[1].minutes,
  );
  const edited = saveAtlasTimeEntry(created.entries, {
    ...entry,
    date: "2026-11-23",
    personId: 2,
    minutes: 120,
    billable: false,
  });
  assert.equal(edited.error, null);
  assert.equal(edited.entries.length, created.entries.length);
  assert.equal(atlasTimeRows(edited.entries, atlasInitialTimeRange, [])[0].minutes, 1800);
  const next = atlasTimeRows(edited.entries, { from: "2026-11-23", to: "2026-11-29" }, [])[1];
  assert.equal(next.minutes, 120);
  assert.equal(next.billableMinutes, 0);
  assert.deepEqual(original, snapshot);
});

test("invalid dates, durations and overfull days preserve the original array", () => {
  const entries = createAtlasTimeEntries();
  const valid = {
    id: "created",
    personId: 1,
    date: "2026-11-16",
    minutes: 60,
    workType: "Client",
    billable: true,
    note: "",
  };
  for (const patch of [
    { date: "2026-11-31" },
    { personId: 999 },
    { minutes: 0 },
    { minutes: NaN },
    { minutes: 15.5 },
    { minutes: 1441 },
    { minutes: 1200 },
  ]) {
    const result = saveAtlasTimeEntry(entries, { ...valid, ...patch });
    assert.ok(result.error);
    assert.equal(result.entries, entries);
  }
  const existing = entries[0];
  assert.equal(saveAtlasTimeEntry(entries, { ...existing, minutes: 1440 }).error, null);
});
