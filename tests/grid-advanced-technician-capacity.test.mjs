import test from "node:test";
import assert from "node:assert/strict";
import {
  CAPACITY_TODAY,
  addCapacityDays,
  capacityDateLabel,
  capacityDay,
  capacityTotals,
  capacityWindow,
  commitCapacityHistory,
  createCapacitySeed,
  isCapacityDate,
  matchesCapacityPerson,
  nextCapacitySlot,
  redoCapacityHistory,
  removeCapacityPeople,
  saveCapacityBooking,
  saveCapacityPerson,
  saveCapacityTimeOff,
  undoCapacityHistory,
  validateCapacityStore,
} from "../src/blocks/data/grid-advanced-technician-capacity-data.ts";

function workshop() {
  return {
    people: [
      { id: "a", name: "Robin Vale", role: "Mechanic", team: "Mechanical", shift: "Mon to Fri" },
      { id: "b", name: "Alex Stone", role: "Mechanic", team: "Mechanical", shift: "Tue to Sat" },
      {
        id: "c",
        name: "Casey Brook",
        role: "Body Technician",
        team: "Body Shop",
        shift: "Mon to Fri",
      },
    ],
    bookings: [],
    timeOff: [],
    holidays: { "2026-10-12": "Training closure" },
  };
}
function booking(patch = {}) {
  return {
    id: "job",
    personId: "a",
    day: "2026-10-13",
    customer: "Taylor Moss",
    phone: "020 7946 1000",
    vehicle: "Electric estate",
    plate: "bl1 xyz",
    service: "Maintenance",
    hours: 2,
    status: "Scheduled",
    ...patch,
  };
}
function resultOf(result) {
  assert.equal(result.ok, true, result.error);
  return result.store;
}
function leave(patch = {}) {
  return {
    id: "off",
    personIds: ["a"],
    from: "2026-10-13",
    to: "2026-10-13",
    hours: 8,
    reason: "Annual leave",
    ...patch,
  };
}

test("UTC six-day windows cross month and DST boundaries without Sundays or duplicate keys", () => {
  assert.deepEqual(capacityWindow(0), [
    "2026-10-12",
    "2026-10-13",
    "2026-10-14",
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
  ]);
  for (const offset of [-20, 0, 2, 30]) {
    const days = capacityWindow(offset);
    assert.equal(new Set(days).size, 12);
    assert.equal(
      days.some((day) => new Date(`${day}T12:00:00Z`).getUTCDay() === 0),
      false,
    );
  }
  assert.equal(addCapacityDays("2026-10-31", 1), "2026-11-01");
  assert.equal(capacityDateLabel("2026-10-12"), "Mon 12");
  assert.equal(isCapacityDate("2026-02-30"), false);
  assert.equal(isCapacityDate(""), false);
  assert.equal(isCapacityDate("2028-02-29"), true);
});

test("original deterministic demo covers all five day states and validates as one store", () => {
  const store = createCapacitySeed();
  assert.deepEqual(store, createCapacitySeed());
  assert.equal(store.people.length, 12);
  assert.equal(store.people[0].name, "Maya Chen");
  assert.equal(validateCapacityStore(store), null);
  const kinds = new Set(
    store.people.flatMap((person) =>
      capacityWindow(0).map((day) => capacityDay(store, person, day).kind),
    ),
  );
  assert.deepEqual(kinds, new Set(["Holiday", "Available", "Booked", "Overtime", "Away"]));
  assert.equal(capacityDay(store, store.people[0], CAPACITY_TODAY).free, 2);
});

test("holiday and off-shift days have zero capacity; unavailable utilization is null", () => {
  const store = workshop();
  assert.deepEqual(capacityTotals(store, [store.people[0]], ["2026-10-12"]), {
    booked: 0,
    capacity: 0,
    free: 0,
    utilization: null,
  });
  assert.equal(capacityDay(store, store.people[0], "2026-10-12").kind, "Holiday");
  assert.equal(capacityDay(store, store.people[0], "2026-10-17").kind, "Away");
  assert.equal(capacityDay(store, store.people[1], "2026-10-17").capacity, 8);
});

test("booked, free and overtime figures share one numeric capacity rule", () => {
  const store = workshop();
  for (const [hours, kind, free] of [
    [6, "Available", 2],
    [8, "Booked", 0],
    [10, "Overtime", -2],
  ]) {
    const first = resultOf(saveCapacityBooking(store, booking({ hours: Math.min(8, hours) })));
    const next =
      hours > 8
        ? resultOf(saveCapacityBooking(first, booking({ id: "extra", hours: hours - 8 })))
        : first;
    const value = capacityDay(next, next.people[0], "2026-10-13");
    assert.deepEqual([value.kind, value.free, value.booked], [kind, free, hours]);
    assert.equal(
      capacityTotals(next, [next.people[0]], ["2026-10-13"]).utilization,
      Math.round((hours / 8) * 100),
    );
  }
});

test("editing or moving an appointment changes both technicians without duplicate bookings", () => {
  const initial = workshop();
  const booked = resultOf(saveCapacityBooking(initial, booking({ hours: 6 })));
  const moved = resultOf(
    saveCapacityBooking(booked, booking({ personId: "b", day: "2026-10-14", hours: 3 })),
  );
  assert.equal(initial.bookings.length, 0);
  assert.equal(booked.bookings[0].personId, "a");
  assert.equal(moved.bookings.length, 1);
  assert.equal(capacityDay(moved, moved.people[0], "2026-10-13").booked, 0);
  assert.equal(capacityDay(moved, moved.people[1], "2026-10-14").booked, 3);
  assert.equal(moved.bookings[0].plate, "BL1 XYZ");
});

test("booking validation rejects unknown people, impossible dates, closed shop days and incompatible service", () => {
  const store = workshop();
  for (const patch of [
    { personId: "missing" },
    { day: "2026-02-30" },
    { day: "2026-10-12" },
    { day: "2026-10-18" },
    { personId: "c" },
    { customer: " " },
    { vehicle: "" },
    { plate: "" },
  ]) {
    assert.equal(saveCapacityBooking(store, booking(patch)).ok, false, JSON.stringify(patch));
  }
  assert.equal(store.bookings.length, 0);
});

test("single appointments use public 1–8 whole-hour bounds; total overtime is retained without an invented daily cap", () => {
  const store = workshop();
  for (const hours of [null, NaN, Infinity, -1, 0, 0.5, 8.5, 9])
    assert.equal(saveCapacityBooking(store, booking({ hours })).ok, false);
  assert.equal(saveCapacityBooking(store, booking({ hours: 1 })).ok, true);
  const first = resultOf(saveCapacityBooking(store, booking({ hours: 8 })));
  const second = resultOf(saveCapacityBooking(first, booking({ id: "second", hours: 8 })));
  const third = resultOf(saveCapacityBooking(second, booking({ id: "third", hours: 8 })));
  assert.equal(third.bookings.length, 3);
  const day = capacityDay(third, third.people[0], "2026-10-13");
  assert.deepEqual([day.booked, day.capacity, day.free, day.kind], [24, 8, -16, "Overtime"]);
});

test("partial leave reduces actual capacity and updates free hours without erasing bookings", () => {
  const booked = resultOf(saveCapacityBooking(workshop(), booking({ hours: 2 })));
  const off = resultOf(saveCapacityTimeOff(booked, leave({ hours: 4 })));
  const value = capacityDay(off, off.people[0], "2026-10-13");
  assert.deepEqual([value.capacity, value.booked, value.free, value.kind], [4, 2, 2, "Available"]);
  assert.equal(off.bookings.length, 1);
  assert.equal(capacityDay(booked, booked.people[0], "2026-10-13").capacity, 8);
});

test("bulk time off retains every booking and consistently exposes zero-capacity overtime", () => {
  const booked = resultOf(saveCapacityBooking(workshop(), booking({ personId: "b", hours: 6 })));
  const off = resultOf(saveCapacityTimeOff(booked, leave({ personIds: ["a", "b"], hours: 8 })));
  assert.equal(off.bookings, booked.bookings);
  assert.equal(off.timeOff.length, 1);
  assert.equal(capacityDay(off, off.people[0], "2026-10-13").kind, "Away");
  const busy = capacityDay(off, off.people[1], "2026-10-13");
  assert.deepEqual([busy.capacity, busy.booked, busy.free, busy.kind], [0, 6, -6, "Overtime"]);
  assert.deepEqual(capacityTotals(off, [off.people[1]], ["2026-10-13"]), {
    booked: 6,
    capacity: 0,
    free: 0,
    utilization: null,
  });
  const edited = resultOf(saveCapacityBooking(off, { ...off.bookings[0], hours: 8 }));
  assert.equal(capacityDay(edited, edited.people[1], "2026-10-13").booked, 8);
  const restored = undoCapacityHistory(
    commitCapacityHistory({ present: booked, past: [], future: [] }, off),
  );
  assert.equal(restored.present, booked);
  assert.equal(capacityDay(booked, booked.people[1], "2026-10-13").capacity, 8);
});

test("time-off editing reopens the old day; full-day leave and removal restore consistent kinds", () => {
  const original = workshop();
  const off = resultOf(saveCapacityTimeOff(original, leave()));
  assert.equal(capacityDay(off, off.people[0], "2026-10-13").kind, "Away");
  const moved = resultOf(saveCapacityTimeOff(off, leave({ from: "2026-10-14", to: "2026-10-14" })));
  assert.equal(moved.timeOff.length, 1);
  assert.equal(capacityDay(moved, moved.people[0], "2026-10-13").capacity, 8);
  const removed = { ...moved, timeOff: [] };
  assert.equal(capacityDay(removed, removed.people[0], "2026-10-14").kind, "Available");
});

test("leave validation rejects invalid ranges, partial data and invalid capacities", () => {
  const store = workshop();
  for (const patch of [
    { personIds: [] },
    { personIds: ["missing"] },
    { from: "2026-10-14", to: "2026-10-13" },
    { from: "bad" },
    { hours: NaN },
    { hours: 0 },
    { hours: 8.5 },
    { hours: 0.25 },
    { reason: "" },
  ]) {
    assert.equal(saveCapacityTimeOff(store, leave(patch)).ok, false, JSON.stringify(patch));
  }
});

test("shift changes retain bookings as overtime; role validation and identity/order remain consistent", () => {
  const store = resultOf(saveCapacityBooking(workshop(), booking({ day: "2026-10-16" })));
  const shifted = resultOf(saveCapacityPerson(store, { ...store.people[0], shift: "Mon to Thu" }));
  assert.equal(shifted.bookings, store.bookings);
  assert.equal(capacityDay(shifted, shifted.people[0], "2026-10-16").kind, "Overtime");
  assert.equal(
    saveCapacityPerson(store, { ...store.people[0], role: "Body Technician" }).ok,
    false,
  );
  const renamed = resultOf(
    saveCapacityPerson(store, { ...store.people[0], name: "Robin Vale II" }),
  );
  assert.deepEqual(
    renamed.people.map((person) => person.id),
    ["a", "b", "c"],
  );
  assert.equal(renamed.people[0].name, "Robin Vale II");
  const added = resultOf(
    saveCapacityPerson(store, { ...store.people[0], id: "new", name: "Jamie Moss" }),
  );
  assert.equal(added.people.length, 4);
  assert.equal(added.bookings.length, 1);
});

test("cascading technician removal keeps other people's leave and work intact", () => {
  const first = resultOf(saveCapacityBooking(workshop(), booking()));
  const second = resultOf(saveCapacityBooking(first, booking({ id: "second", personId: "b" })));
  const withLeave = resultOf(
    saveCapacityTimeOff(
      second,
      leave({ from: "2026-10-14", to: "2026-10-14", personIds: ["a", "b"] }),
    ),
  );
  const removed = removeCapacityPeople(withLeave, ["a"]);
  assert.deepEqual(
    removed.people.map((person) => person.id),
    ["b", "c"],
  );
  assert.deepEqual(
    removed.bookings.map((item) => item.personId),
    ["b"],
  );
  assert.deepEqual(removed.timeOff[0].personIds, ["b"]);
  assert.deepEqual(withLeave.timeOff[0].personIds, ["a", "b"]);
});

test("undo and redo restore a complete atomic batch, and a new edit invalidates redo", () => {
  const original = createCapacitySeed();
  const history = { present: original, past: [], future: [] };
  const changed = commitCapacityHistory(
    history,
    removeCapacityPeople(original, ["tech-1", "tech-2"]),
  );
  const undone = undoCapacityHistory(changed);
  assert.deepEqual(undone.present, original);
  assert.equal(undone.present, original);
  assert.deepEqual(redoCapacityHistory(undone).present, changed.present);
  const branch = commitCapacityHistory(undone, removeCapacityPeople(original, ["tech-3"]));
  assert.equal(branch.future.length, 0);
  assert.equal(undoCapacityHistory(history), history);
});

test("search includes raw booking metadata and capability/team/day facets compose", () => {
  const store = resultOf(
    saveCapacityBooking(workshop(), booking({ plate: "UNIQUE-42", customer: "Distinct Customer" })),
  );
  const all = { query: "unique-42", team: "All Teams", service: "All Services", kind: "All Days" };
  assert.equal(matchesCapacityPerson(store, store.people[0], all, capacityWindow(0)), true);
  assert.equal(matchesCapacityPerson(store, store.people[1], all, capacityWindow(0)), false);
  assert.equal(
    matchesCapacityPerson(
      store,
      store.people[0],
      { ...all, query: "distinct customer" },
      capacityWindow(0),
    ),
    true,
  );
  assert.equal(
    matchesCapacityPerson(
      store,
      store.people[0],
      { ...all, team: "Electrical" },
      capacityWindow(0),
    ),
    false,
  );
  assert.equal(
    matchesCapacityPerson(
      store,
      store.people[0],
      { ...all, service: "Bodywork" },
      capacityWindow(0),
    ),
    false,
  );
  assert.equal(
    matchesCapacityPerson(store, store.people[0], { ...all, kind: "Overtime" }, capacityWindow(0)),
    false,
  );
});

test("next-free and aggregate capacity read the same changed raw store", () => {
  const store = workshop();
  const off = resultOf(
    saveCapacityTimeOff(store, leave({ from: CAPACITY_TODAY, to: CAPACITY_TODAY })),
  );
  assert.deepEqual(nextCapacitySlot(off, off.people[0]), { day: "2026-10-19", hours: 8 });
  const seed = createCapacitySeed();
  const days = capacityWindow(0);
  const all = capacityTotals(seed, seed.people, days);
  const individual = seed.people.map((person) => capacityTotals(seed, [person], days));
  assert.equal(
    all.booked,
    individual.reduce((sum, row) => sum + row.booked, 0),
  );
  assert.equal(
    all.capacity,
    individual.reduce((sum, row) => sum + row.capacity, 0),
  );
  assert.equal(
    all.free,
    individual.reduce((sum, row) => sum + row.free, 0),
  );
});

test("loader validation rejects malformed, duplicate, orphan and contradictory schedules", () => {
  const store = workshop();
  assert.match(validateCapacityStore({ ...store, people: null }), /incomplete/);
  assert.match(
    validateCapacityStore({ ...store, people: [store.people[0], store.people[0]] }),
    /unique/,
  );
  assert.match(
    validateCapacityStore({ ...store, bookings: [booking({ personId: "missing" })] }),
    /technician/,
  );
  assert.match(
    validateCapacityStore({ ...store, bookings: [booking({ day: "2026-10-12" })] }),
    /closure/,
  );
  assert.match(validateCapacityStore({ ...store, bookings: [booking({ hours: null })] }), /Hours/);
  assert.equal(validateCapacityStore(store), null);
});
