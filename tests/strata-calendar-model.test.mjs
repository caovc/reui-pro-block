import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readStrataRoute } from "../src/templates/workflow/strata-routing.ts";
import {
  STRATA_CALENDAR_CATEGORIES,
  STRATA_CALENDAR_OWNERS,
  STRATA_CALENDAR_PRIORITIES,
  STRATA_CALENDAR_WORKSTREAMS,
  STRATA_CALENDAR_DATE,
  createStrataCalendarDraft,
  createStrataCalendarDisplay,
  switchStrataCalendarPreset,
  createStrataCalendarSeed,
  useStrataCalendarModel,
  strataCalendarPresetForRoute,
  filterStrataCalendarEvents,
  makeStrataCalendarEvent,
  setStrataCalendarDraftAllDay,
  strataCalendarDefaultView,
  strataCalendarOwners,
  strataCalendarProgress,
  strataCalendarInputPeriod,
  validStrataCalendarDate,
  toggleStrataCalendarTask,
  updateStrataCalendarPeriod,
  validStrataCalendarPeriod,
  validateStrataCalendarInput,
} from "../src/templates/workflow/strata-calendar-model.ts";
import {
  STRATA_INCIDENT_ID,
  STRATA_NOW,
  STRATA_OWNERS,
  STRATA_SERVICES,
} from "../src/templates/workflow/strata-domain.ts";

const allOwners = STRATA_OWNERS.map((owner) => owner.id);
const localDraft = (changes = {}) => ({
  ...createStrataCalendarDraft(),
  title: "Local planning event",
  ...changes,
});
const serialize = (events) => JSON.stringify(events);

// These tests protect original local records and domain operations. They do not
// assert unobserved reference dropdown alternatives or submission semantics.
test("Calendar starts Monday Oct 19 with responsive Week/Day independent of shared Now", () => {
  assert.equal(new Date(STRATA_CALENDAR_DATE).getUTCDay(), 1);
  assert.equal(STRATA_CALENDAR_DATE.slice(0, 10), "2026-10-19");
  assert.equal(STRATA_NOW.slice(0, 10), "2026-10-22");
  assert.equal(strataCalendarDefaultView(false), "week");
  assert.equal(strataCalendarDefaultView(true), "day");
});

test("Original seed has 14 unique events, three independent all-day events and six categories", () => {
  const events = createStrataCalendarSeed();
  assert.equal(events.length, 14);
  assert.equal(new Set(events.map((event) => event.id)).size, 14);
  assert.equal(events.filter((event) => event.allDay).length, 3);
  assert.equal(events.filter((event) => !event.allDay).length, 11);
  assert.deepEqual(
    [...new Set(events.map((event) => event.data.category))].sort(),
    [...STRATA_CALENDAR_CATEGORIES].sort(),
  );
  assert.equal(strataCalendarOwners(events).length, 6);
  for (const event of events) {
    assert.match(event.id, /^BL-CAL-\d{3}$/);
    assert.ok(STRATA_OWNERS.some((owner) => owner.id === event.data.ownerId));
    assert.ok(validStrataCalendarPeriod(event.start, event.end, !!event.allDay));
    if (event.data.serviceId) {
      const service = STRATA_SERVICES.find((item) => item.id === event.data.serviceId);
      assert.ok(service);
      assert.equal(event.data.environment, service.environment);
    }
  }
});

test("Monday Day contains one all-day and two timed cards; Tuesday overlap retains both events", () => {
  const events = createStrataCalendarSeed();
  const monday = events.filter((event) => event.start.toISOString().startsWith("2026-10-19"));
  assert.equal(monday.length, 3);
  assert.equal(monday.filter((event) => event.allDay).length, 1);
  const tuesday = events.filter((event) => event.start.toISOString().startsWith("2026-10-20"));
  assert.equal(tuesday.length, 2);
  assert.ok(tuesday[0].end > tuesday[1].start);
  assert.notEqual(tuesday[0].id, tuesday[1].id);
});

test("Every all-day interval has UTC midnight boundaries and an exclusive next-day end", () => {
  for (const event of createStrataCalendarSeed().filter((event) => event.allDay)) {
    assert.equal(event.start.toISOString().slice(11), "00:00:00.000Z");
    assert.equal(event.end.toISOString().slice(11), "00:00:00.000Z");
    assert.equal(event.end.getTime() - event.start.getTime(), 86_400_000);
  }
});

test("Checkout release, incident and follow-up share the real domain incident relationship", () => {
  const linked = createStrataCalendarSeed().filter(
    (event) => event.data.incidentId === STRATA_INCIDENT_ID,
  );
  assert.equal(linked.length, 4);
  assert.ok(linked.every((event) => event.data.serviceId === "checkout-api"));
  const release = linked.find((event) => event.data.category === "Release");
  assert.equal(release.data.version, "v3.5.0");
  assert.equal(release.data.commit, "b71c350");
  assert.equal(release.start.toISOString(), "2026-10-22T12:30:00.000Z");
});

test("Tasks, pipeline and deliverables summaries derive from independent real item completion", () => {
  const progress = createStrataCalendarSeed()
    .filter((event) => event.allDay)
    .map((event) => event.data.progress);
  assert.deepEqual(
    progress.map((item) => {
      const summary = strataCalendarProgress(item);
      return [item.kind, summary.complete, summary.total];
    }),
    [
      ["Tasks", 7, 8],
      ["Pipeline", 1, 5],
      ["Deliverables", 4, 9],
    ],
  );
  assert.equal(strataCalendarProgress(progress[0]).percent, 87.5);
  assert.deepEqual(strataCalendarProgress(null), { total: 0, complete: 0, percent: 0 });
  for (const item of progress)
    assert.equal(new Set(item.items.map((task) => task.id)).size, item.items.length);
});

test("Task toggle updates one completion and is reversible without mutating another event", () => {
  const events = createStrataCalendarSeed();
  const before = serialize(events);
  const target = events[0];
  const task = target.data.progress.items.at(-1);
  const changed = toggleStrataCalendarTask(events, target.id, task.id);
  assert.equal(strataCalendarProgress(changed[0].data.progress).complete, 8);
  assert.equal(strataCalendarProgress(changed[0].data.progress).percent, 100);
  assert.equal(changed[1], events[1]);
  assert.equal(serialize(events), before);
  assert.equal(serialize(toggleStrataCalendarTask(changed, target.id, task.id)), before);
});

test("Fresh seeds do not share mutable progress items or Date instances", () => {
  const first = createStrataCalendarSeed(),
    second = createStrataCalendarSeed();
  first[0].data.progress.items[0].done = false;
  first[0].start.setUTCDate(1);
  assert.equal(second[0].data.progress.items[0].done, true);
  assert.equal(second[0].start.getUTCDate(), 19);
});

test("Category, owner and global environment filters intersect and empty selections stay empty", () => {
  const events = createStrataCalendarSeed();
  const before = serialize(events);
  const selected = filterStrataCalendarEvents(events, ["Maintenance"], ["owen"], "Staging");
  assert.equal(selected.length, 1);
  assert.equal(selected[0].data.serviceId, "edge-gateway");
  assert.equal(filterStrataCalendarEvents(events, [], allOwners, "all").length, 0);
  assert.equal(filterStrataCalendarEvents(events, STRATA_CALENDAR_CATEGORIES, [], "all").length, 0);
  assert.equal(
    filterStrataCalendarEvents(events, STRATA_CALENDAR_CATEGORIES, allOwners, "Sandbox").length,
    0,
  );
  assert.equal(
    filterStrataCalendarEvents(events, STRATA_CALENDAR_CATEGORIES, allOwners, "all").length,
    14,
  );
  assert.equal(serialize(events), before);
});

test("Filters retain previous and future weeks for native calendar navigation", () => {
  const events = createStrataCalendarSeed();
  const earlier = makeStrataCalendarEvent(
    localDraft({ startDate: "2026-09-07", endDate: "2026-09-07" }),
    "BL-CAL-015",
  );
  const later = makeStrataCalendarEvent(
    localDraft({ startDate: "2027-01-04", endDate: "2027-01-04" }),
    "BL-CAL-016",
  );
  const filtered = filterStrataCalendarEvents(
    [...events, earlier, later],
    STRATA_CALENDAR_CATEGORIES,
    allOwners,
    "all",
  );
  assert.equal(filtered.length, 16);
  assert.ok(filtered.includes(earlier));
  assert.ok(filtered.includes(later));
});

test("Moving an event applies to the full collection without dropping filtered-out categories", () => {
  const events = createStrataCalendarSeed();
  const before = serialize(events);
  const release = filterStrataCalendarEvents(events, ["Release"], allOwners, "all")[0];
  const moved = updateStrataCalendarPeriod(
    events,
    release.id,
    new Date("2026-10-26T00:00:00Z"),
    new Date("2026-10-27T00:00:00Z"),
    true,
  );
  assert.equal(moved.length, 14);
  assert.equal(moved[0].start.toISOString(), "2026-10-26T00:00:00.000Z");
  assert.equal(moved[1], events[1]);
  assert.equal(moved[0].data, release.data);
  assert.equal(serialize(events), before);
});

test("Invalid periods reject missing, reversed, zero duration and non-midnight all-day ranges", () => {
  const start = new Date("2026-10-19T09:00:00Z"),
    end = new Date("2026-10-19T10:00:00Z");
  assert.equal(validStrataCalendarPeriod(start, end, false), true);
  for (const [first, last, allDay] of [
    [start, start, false],
    [end, start, false],
    [new Date("invalid"), end, false],
    [start, end, true],
  ]) {
    assert.equal(validStrataCalendarPeriod(first, last, allDay), false);
    assert.throws(
      () =>
        updateStrataCalendarPeriod(createStrataCalendarSeed(), "BL-CAL-001", first, last, allDay),
      /Invalid calendar period/,
    );
  }
});

test("Observed slot drafts retain native timed/all-day slot ranges in UTC", () => {
  const timed = createStrataCalendarDraft(undefined, {
    date: new Date("2026-10-20T10:30:00Z"),
    end: new Date("2026-10-20T11:00:00Z"),
    allDay: false,
    view: "week",
  });
  assert.equal(timed.startDate, "2026-10-20");
  assert.equal(timed.from, "10:30");
  assert.equal(timed.to, "11:00");
  const timedPeriod = strataCalendarInputPeriod(timed);
  assert.equal(timedPeriod.start.toISOString(), "2026-10-20T10:30:00.000Z");
  assert.equal(timedPeriod.end.toISOString(), "2026-10-20T11:00:00.000Z");
  const allDay = createStrataCalendarDraft(undefined, {
    date: new Date("2026-10-21T00:00:00Z"),
    allDay: true,
    view: "day",
  });
  assert.equal(allDay.endDate, "2026-10-21");
  assert.equal(strataCalendarInputPeriod(allDay).end.toISOString(), "2026-10-22T00:00:00.000Z");
  assert.equal(allDay.allDay, true);
});

test("All-day conversion preserves input dates/times, produces native boundaries and tolerates incomplete dates", () => {
  const input = localDraft();
  const converted = setStrataCalendarDraftAllDay(input, true);
  const period = strataCalendarInputPeriod(converted);
  assert.equal(period.start.toISOString(), "2026-10-19T00:00:00.000Z");
  assert.equal(period.end.toISOString(), "2026-10-20T00:00:00.000Z");
  assert.equal(validStrataCalendarPeriod(period.start, period.end, true), true);
  assert.equal(input.allDay, false);
  assert.deepEqual(setStrataCalendarDraftAllDay(converted, false), input);
  const partial = setStrataCalendarDraftAllDay(localDraft({ startDate: "", endDate: "" }), true);
  assert.equal(partial.startDate, "");
  assert.ok(validateStrataCalendarInput(partial).endDate);
});

test("Local event creation trims title, validates real service/owner and keeps unknown relationships empty", () => {
  const event = makeStrataCalendarEvent(
    localDraft({ title: "  Planned drill  ", serviceId: "sandbox-api", category: "Maintenance" }),
    "BL-CAL-015",
  );
  assert.equal(event.title, "Planned drill");
  assert.equal(event.data.serviceId, "sandbox-api");
  assert.equal(event.data.environment, "Sandbox");
  assert.equal(event.data.ownerId, "maya");
  assert.equal(event.data.incidentId, null);
  assert.equal(event.data.commit, null);
  assert.equal(event.data.progress, null);
  assert.ok(event.start instanceof Date);
  assert.equal(event.start.toISOString(), "2026-10-19T09:00:00.000Z");
  for (const input of [
    localDraft({ title: " " }),
    localDraft({ category: "Invalid" }),
    localDraft({ ownerId: "missing" }),
    localDraft({ serviceId: "missing" }),
    localDraft({ endDate: "bad date" }),
    localDraft({ note: "x".repeat(2001) }),
  ]) {
    assert.ok(Object.keys(validateStrataCalendarInput(input)).length > 0);
    assert.throws(() => makeStrataCalendarEvent(input, "BL-CAL-999"), /Invalid calendar event/);
  }
});

test("Observed New Event defaults are Task, original first owner, All services, same date09–10 and empty metadata", () => {
  const draft = createStrataCalendarDraft();
  assert.equal(draft.title, "");
  assert.equal(draft.category, "Task");
  assert.equal(draft.ownerId, STRATA_CALENDAR_OWNERS[0].id);
  assert.equal(draft.serviceId, "all");
  assert.equal(draft.allDay, false);
  assert.equal(draft.startDate, "2026-10-19");
  assert.equal(draft.endDate, "2026-10-19");
  assert.equal(draft.from, "09:00");
  assert.equal(draft.to, "10:00");
  assert.equal(draft.dueDate, "2026-10-19");
  assert.equal(draft.priority, "none");
  assert.equal(draft.workstream, "none");
  for (const key of ["reference", "stage", "status", "obligation", "room", "note"])
    assert.equal(draft[key], "", `${key} placeholder must not become a value`);
  assert.deepEqual(validateStrataCalendarInput(draft), {
    title: "Enter a title of up to 120 characters.",
  });
});

test("Separated UTC dates and times validate overnight ranges and reject calendar rollover dates", () => {
  const input = localDraft({ from: "23:45", to: "00:15", endDate: "2026-10-20" });
  const event = makeStrataCalendarEvent(input, "BL-CAL-015");
  assert.equal(event.end - event.start, 30 * 60_000);
  assert.equal(validStrataCalendarDate("2028-02-29"), true);
  assert.equal(validStrataCalendarDate("2026-02-29"), false);
  for (const changes of [
    { startDate: "2026-02-30" },
    { endDate: "2026-10-18" },
    { from: "25:00" },
    { to: "09:00" },
    { dueDate: "2026-02-30" },
  ])
    assert.ok(Object.keys(validateStrataCalendarInput(localDraft(changes))).length);
});

test("Local inclusive all-day end date becomes the engine's exclusive end over multiple days", () => {
  const input = localDraft({
    allDay: true,
    startDate: "2026-10-19",
    endDate: "2026-10-21",
    from: "",
    to: "",
  });
  assert.deepEqual(validateStrataCalendarInput(input), {});
  const event = makeStrataCalendarEvent(input, "BL-CAL-015");
  assert.equal(event.start.toISOString(), "2026-10-19T00:00:00.000Z");
  assert.equal(event.end.toISOString(), "2026-10-22T00:00:00.000Z");
  assert.equal(event.end - event.start, 3 * 86_400_000);
});

test("Observed metadata fields are preserved by local creation without fabricating incident/progress", () => {
  const input = localDraft({
    reference: "  BL-CHG-0200  ",
    stage: "2 - Verify",
    status: "Ready",
    priority: "high",
    obligation: "Approval",
    dueDate: "2026-10-21",
    workstream: "reliability",
    room: "Room 7",
    note: "  Keep rollback ready.  ",
  });
  const event = makeStrataCalendarEvent(input, "BL-CAL-015");
  assert.equal(event.data.handle, "BL-CHG-0200");
  assert.deepEqual(event.data.metadata, {
    reference: "BL-CHG-0200",
    stage: "2 - Verify",
    status: "Ready",
    priority: "high",
    obligation: "Approval",
    dueDate: "2026-10-21",
    workstream: "reliability",
    room: "Room 7",
  });
  assert.equal(event.data.description, "Keep rollback ready.");
  assert.equal(event.data.serviceId, null);
  assert.equal(event.data.incidentId, null);
  assert.equal(event.data.progress, null);
  // Only None was observed. These additional accepted choices belong to the local adapter.
  assert.ok(STRATA_CALENDAR_PRIORITIES.includes(input.priority));
  assert.ok(STRATA_CALENDAR_WORKSTREAMS.includes(input.workstream));
  assert.ok(validateStrataCalendarInput(localDraft({ priority: "unknown" })).priority);
  assert.ok(validateStrataCalendarInput(localDraft({ workstream: "unknown" })).workstream);
});

test("Six original ownership choices partition real events and filter independently", () => {
  const events = createStrataCalendarSeed();
  assert.equal(STRATA_CALENDAR_OWNERS.length, 6);
  assert.equal(new Set(STRATA_CALENDAR_OWNERS.map((owner) => owner.id)).size, 6);
  const partitions = STRATA_CALENDAR_OWNERS.map((owner) =>
    filterStrataCalendarEvents(events, STRATA_CALENDAR_CATEGORIES, [owner.id], "all"),
  );
  assert.ok(partitions.every((partition) => partition.length > 0));
  assert.deepEqual(
    partitions
      .flat()
      .map((event) => event.id)
      .sort(),
    events.map((event) => event.id).sort(),
  );
  assert.ok(
    validateStrataCalendarInput(localDraft({ ownerId: "leila" })).ownerId,
    "another shared owner is not silently added to observed six choices",
  );
});

test("Observed on-call payments preset selects one category, two real owners and exactly two native events", () => {
  const display = createStrataCalendarDisplay("on-call-payments");
  assert.deepEqual(display.categories, ["On-call"]);
  assert.deepEqual(display.owners, ["maya", "sofia"]);
  assert.equal(display.date.toISOString(), STRATA_CALENDAR_DATE);
  assert.equal(
    display.view,
    null,
    "responsive Week desktop/Day phone remains an independent default",
  );
  assert.deepEqual(display.selection, { eventKeys: [], slot: null });
  const events = filterStrataCalendarEvents(
    createStrataCalendarSeed(),
    display.categories,
    display.owners,
    "all",
  );
  assert.deepEqual(
    events.map((event) => event.id),
    ["BL-CAL-006", "BL-CAL-011"],
  );
  assert.equal(new Set(events.map((event) => event.data.ownerId)).size, 2);
  assert.deepEqual(
    events.map((event) => event.start.toISOString()),
    ["2026-10-20T10:00:00.000Z", "2026-10-22T13:45:00.000Z"],
  );
});

test("Normal Calendar and pinned filter/date snapshots restore independently without hidden filter leakage", () => {
  const normal = createStrataCalendarDisplay("default");
  normal.date = new Date("2026-11-02T00:00:00Z");
  normal.view = "month";
  normal.categories = ["Task", "Release"];
  const pin = switchStrataCalendarPreset(normal, "default", "on-call-payments", {});
  assert.deepEqual(pin.display.categories, ["On-call"]);
  pin.display.date = new Date("2026-10-26T00:00:00Z");
  const back = switchStrataCalendarPreset(pin.display, "on-call-payments", "default", pin.cache);
  assert.deepEqual(back.display, normal);
  assert.notEqual(back.display.categories, normal.categories);
  assert.deepEqual(
    back.display.owners,
    STRATA_CALENDAR_OWNERS.map((owner) => owner.id),
  );
  const again = switchStrataCalendarPreset(back.display, "default", "on-call-payments", back.cache);
  assert.equal(again.display.date.toISOString(), "2026-10-26T00:00:00.000Z");
  assert.deepEqual(again.display.categories, ["On-call"]);
  assert.deepEqual(normal.categories, ["Task", "Release"]);
});

// Render a pure read-only report from the actual hook. No browser, effects or render-time capture.
function renderCalendarModel(initialPreset) {
  function Probe() {
    const model = useStrataCalendarModel(initialPreset);
    const normal = model.forPreset("default"),
      pinned = model.forPreset("on-call-payments");
    const normalAgain = model.forPreset("default"),
      pinnedAgain = model.forPreset("on-call-payments");
    const snapshot = (scope) => ({
      preset: scope.preset,
      date: scope.date.toISOString(),
      view: scope.view,
      categories: scope.categories,
      owners: scope.owners,
      selection: scope.selection,
      ids: filterStrataCalendarEvents(scope.events, scope.categories, scope.owners, "all").map(
        (event) => event.id,
      ),
    });
    const hashes = [
      "#/template-preview/strata/calendar?preset=original",
      "#/template-preview/strata/calendar/on-call-payments?preset=original",
      "#/template-preview/strata/calendar?preset=original",
      "#/template-preview/strata/calendar/on-call-payments?preset=original",
    ];
    const routes = hashes.map((hash) => {
      const parsed = readStrataRoute(hash);
      return {
        query: parsed.query,
        ...snapshot(model.forPreset(strataCalendarPresetForRoute(parsed.route))),
      };
    });
    return createElement(
      "pre",
      null,
      JSON.stringify({
        active: snapshot(model),
        normal: snapshot(normal),
        pinned: snapshot(pinned),
        legacyAPI: typeof model.applyPreset,
        identities: {
          normalStored: normal.categories === normalAgain.categories,
          pinnedStored: pinned.categories === pinnedAgain.categories,
          separateCategories: normal.categories !== pinned.categories,
          separateOwners: normal.owners !== pinned.owners,
          separateSelection: normal.selection !== pinned.selection,
          separateDate: normal.date !== pinned.date,
          separateSetDate: normal.setDate !== pinned.setDate,
          separateSetView: normal.setView !== pinned.setView,
          sharedEvents: normal.events === pinned.events,
          sharedUpdate: normal.updateEvent === pinned.updateEvent,
          sharedTasks: normal.toggleTask === pinned.toggleTask,
        },
        routes,
      }),
    );
  }
  const html = renderToStaticMarkup(createElement(Probe));
  const text = html
    .slice("<pre>".length, -"</pre>".length)
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
  return JSON.parse(text);
}

test("Actual hook constructs a direct pinned initial state with two events before any navigation effect", () => {
  const report = renderCalendarModel("on-call-payments");
  assert.equal(report.active.preset, "on-call-payments");
  assert.equal(report.active.date, STRATA_CALENDAR_DATE);
  assert.equal(report.active.view, null);
  assert.deepEqual(report.active.categories, ["On-call"]);
  assert.deepEqual(report.active.owners, ["maya", "sofia"]);
  assert.deepEqual(report.active.selection, { eventKeys: [], slot: null });
  assert.deepEqual(report.active.ids, ["BL-CAL-006", "BL-CAL-011"]);
  assert.equal(report.legacyAPI, "function", "legacy event-handler API remains available");
});

test("Pure forPreset reads stored independent hook scopes without changing the active normal state", () => {
  const report = renderCalendarModel("default");
  assert.equal(report.active.preset, "default");
  assert.equal(report.active.categories.length, 6);
  assert.equal(report.active.owners.length, 6);
  for (const [name, result] of Object.entries(report.identities)) assert.equal(result, true, name);
  assert.equal(report.normal.preset, "default");
  assert.equal(report.pinned.preset, "on-call-payments");
});

test("Canonical initial/hash/back-forward routes select normal or pinned data without leaking filters", () => {
  const report = renderCalendarModel("default");
  assert.deepEqual(
    report.routes.map((route) => route.query),
    Array(4).fill("?preset=original"),
  );
  assert.deepEqual(
    report.routes.map((route) => route.preset),
    ["default", "on-call-payments", "default", "on-call-payments"],
  );
  assert.deepEqual(
    report.routes.map((route) => route.categories.length),
    [6, 1, 6, 1],
  );
  assert.deepEqual(
    report.routes.map((route) => route.owners.length),
    [6, 2, 6, 2],
  );
  assert.deepEqual(
    report.routes.map((route) => route.ids.length),
    [14, 2, 14, 2],
  );
  assert.deepEqual(
    report.routes.map((route) => route.view),
    [null, null, null, null],
  );
  assert.deepEqual(
    report.routes.map((route) => route.date),
    Array(4).fill(STRATA_CALENDAR_DATE),
  );
  assert.equal(
    report.active.preset,
    "default",
    "URL-derived reads are pure and do not set React state",
  );
});
