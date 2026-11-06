import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

const modelURL = new URL("../src/templates/business/miro-chair-board-model.ts", import.meta.url);
// Import the real TypeScript module. Only resolve its extensionless runtime
// dependency; Node erases type-only imports without loading the calendar UI.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === modelURL.href && specifier === "./miro-settings-data") {
      return nextResolve(new URL("./miro-settings-data.ts", modelURL).href, context);
    }
    return nextResolve(specifier, context);
  },
});
let model;
try {
  model = await import(modelURL.href);
} finally {
  hooks.deregister();
}
const {
  deriveMiroChairEvents,
  deriveMiroChairProjection,
  deriveMiroChairResources,
  miroChairStatuses,
} = model;

const chairs = Object.freeze([
  Object.freeze({
    id: "chair-visible",
    name: "Dr. Local Visible",
    specialty: "General",
    color: "peacock",
    visible: true,
  }),
  Object.freeze({
    id: "chair-hidden",
    name: "Dr. Local Hidden",
    specialty: "General",
    color: "grape",
    visible: false,
  }),
]);

function booking(overrides = {}) {
  return {
    patient: "Local patient",
    procedure: "General Checkup",
    doctor: chairs[0].name,
    date: "2026-11-09",
    time: "09:10",
    end: "10:05",
    status: "Booked",
    ...overrides,
  };
}

test("unmatched practitioners retain a scheduled Week event while saved hidden chairs stay hidden", () => {
  const appointments = [
    booking({ patient: "Unassigned patient", doctor: "Dr. Unlisted" }),
    booking({ patient: "Hidden patient", doctor: chairs[1].name }),
    booking({ patient: "Visible patient" }),
  ];
  const result = deriveMiroChairProjection(appointments, chairs);
  assert.equal(result.events.length, 2);
  const unassigned = result.events.find((event) => event.data.bookingIndex === 0);
  assert.ok(unassigned, "a valid booking survives without an invented resource assignment");
  assert.equal(unassigned.resourceId, undefined);
  assert.equal(unassigned.start.getTime(), new Date(2026, 10, 9, 9, 10).getTime());
  assert.equal(unassigned.end.getTime(), new Date(2026, 10, 9, 10, 5).getTime());
  assert.equal(
    result.events.some((event) => event.data.bookingIndex === 1),
    false,
  );
  assert.equal(
    result.events.find((event) => event.data.bookingIndex === 2).resourceId,
    chairs[0].id,
  );
  assert.deepEqual(
    result.unassigned.map((item) => item.bookingIndex),
    [0],
  );
  assert.deepEqual(result.unscheduled, []);
  assert.deepEqual(
    deriveMiroChairResources(chairs).map((resource) => resource.id),
    [chairs[0].id],
  );
});

test("invalid scheduling remains accessible through diagnostics without fabricated durations", () => {
  const appointments = [
    booking({ patient: "Invalid date", date: "2026-02-30" }),
    booking({ patient: "End before start", end: "09:00" }),
    booking({
      patient: "Missing duration",
      procedure: "Local procedure without duration",
      end: undefined,
    }),
    booking({ patient: "Invalid start", time: "24:10" }),
  ];
  const result = deriveMiroChairProjection(appointments, chairs);
  assert.deepEqual(result.events, [], "no guessed 30-minute calendar event is created");
  assert.deepEqual(result.unassigned, []);
  assert.deepEqual(
    result.unscheduled.map((item) => item.bookingIndex),
    [0, 1, 2, 3],
  );
  for (const diagnostic of result.unscheduled) {
    assert.ok(diagnostic.reason.trim().length > 0);
    assert.ok(
      appointments[diagnostic.bookingIndex],
      "the UI can access the unchanged owner record",
    );
  }
  assert.deepEqual(deriveMiroChairEvents(appointments, chairs), []);
});

test("projection preserves explicit date, end and original owner indexes without mutating inputs", () => {
  const appointments = Object.freeze([
    Object.freeze(booking({ patient: "Hidden first", doctor: chairs[1].name })),
    Object.freeze(
      booking({ patient: "Later appointment", date: "2026-12-14", time: "13:05", end: "14:40" }),
    ),
    Object.freeze(
      booking({
        patient: "Custom procedure",
        procedure: "Custom source procedure",
        date: "2027-01-04",
        time: "11:20",
        end: "12:35",
      }),
    ),
  ]);
  const beforeAppointments = structuredClone(appointments);
  const beforeChairs = structuredClone(chairs);
  const result = deriveMiroChairProjection(appointments, chairs);
  assert.deepEqual(
    result.events.map((event) => event.data.bookingIndex),
    [1, 2],
  );
  assert.deepEqual(
    result.events.map((event) => event.start.getTime()),
    [new Date(2026, 11, 14, 13, 5).getTime(), new Date(2027, 0, 4, 11, 20).getTime()],
  );
  assert.deepEqual(
    result.events.map((event) => event.end.getTime()),
    [new Date(2026, 11, 14, 14, 40).getTime(), new Date(2027, 0, 4, 12, 35).getTime()],
  );
  for (const event of result.events) {
    assert.equal(event.title, appointments[event.data.bookingIndex].patient);
  }
  assert.deepEqual(result.unscheduled, []);
  assert.deepEqual(appointments, beforeAppointments);
  assert.deepEqual(chairs, beforeChairs);
  deriveMiroChairResources(chairs);
  assert.deepEqual(chairs, beforeChairs);
});

test("query and status filters respect visible chairs and an empty status selection means no bookings", () => {
  const appointments = [
    booking({ patient: "Mira Blue", status: "Booked" }),
    booking({ patient: "Mira Green", status: "Arrived" }),
    booking({ patient: "Mira Hidden", doctor: chairs[1].name, status: "Booked" }),
    booking({ patient: "Different patient", status: "Booked" }),
    booking({ patient: "Mira Unscheduled", time: "invalid", status: "Booked" }),
  ];
  const filtered = deriveMiroChairProjection(appointments, chairs, "  MIRA  ", ["Booked"]);
  assert.deepEqual(
    filtered.events.map((event) => event.data.bookingIndex),
    [0],
  );
  assert.deepEqual(
    filtered.unscheduled.map((item) => item.bookingIndex),
    [4],
  );
  const resourceIds = new Set(deriveMiroChairResources(chairs).map((resource) => resource.id));
  assert.ok(filtered.events.every((event) => resourceIds.has(event.resourceId)));
  assert.deepEqual(
    deriveMiroChairEvents(appointments, chairs, "mira", ["Booked"]),
    filtered.events,
  );
  assert.deepEqual(deriveMiroChairProjection(appointments, chairs, "mira", []), {
    events: [],
    unassigned: [],
    unscheduled: [],
  });
  assert.deepEqual(deriveMiroChairEvents(appointments, chairs, "", []), []);
  assert.deepEqual(
    deriveMiroChairEvents(appointments, chairs, "", miroChairStatuses),
    deriveMiroChairEvents(appointments, chairs),
  );
});

test("the real BookingSheet AM/PM payload retains its date and explicit end alongside 24-hour seeds", () => {
  const savedBooking = Object.freeze({
    patient: "Local form patient",
    doctor: chairs[0].name,
    procedure: "General Checkup",
    time: "08:00 AM",
    end: "08:30 AM",
    date: "2026-10-22",
    status: "Booked",
  });
  const seedBooking = Object.freeze({ ...savedBooking, time: "8:00", end: "08:30" });
  const appointments = Object.freeze([savedBooking, seedBooking]);
  const before = structuredClone(appointments);
  const result = deriveMiroChairProjection(appointments, chairs);
  assert.equal(result.events.length, 2, "saved form bookings stay scheduled rather than diagnosed");
  assert.deepEqual(result.unscheduled, []);
  assert.deepEqual(
    result.events.map((event) => event.data.bookingIndex),
    [0, 1],
  );
  for (const event of result.events) {
    assert.equal(event.start.getTime(), new Date(2026, 9, 22, 8).getTime());
    assert.equal(event.end.getTime(), new Date(2026, 9, 22, 8, 30).getTime());
  }
  assert.deepEqual(appointments, before, "parsing does not normalize or overwrite owner strings");
});

test("12 AM and 12 PM map to midnight and noon, with equivalent mixed clock formats", () => {
  const appointments = [
    booking({ time: "12:00 AM", end: "00:30" }),
    booking({ time: "00:00", end: "12:30 AM" }),
    booking({ time: "12:00 PM", end: "12:30" }),
    booking({ time: "12:00", end: "12:30 PM" }),
    booking({ time: "1:05 PM", end: "13:45" }),
    booking({ time: "13:05", end: "1:45 PM" }),
  ];
  const result = deriveMiroChairProjection(appointments, chairs);
  assert.deepEqual(result.unscheduled, []);
  assert.equal(result.events.length, appointments.length);
  for (const [firstIndex, hour, minute, endMinute] of [
    [0, 0, 0, 30],
    [2, 12, 0, 30],
    [4, 13, 5, 45],
  ]) {
    const first = result.events[firstIndex];
    const second = result.events[firstIndex + 1];
    assert.equal(first.start.getTime(), new Date(2026, 10, 9, hour, minute).getTime());
    assert.equal(first.end.getTime(), new Date(2026, 10, 9, hour, endMinute).getTime());
    assert.equal(first.start.getTime(), second.start.getTime());
    assert.equal(first.end.getTime(), second.end.getTime());
  }
});

test("invalid AM/PM ranges, invalid minutes and same-date reversed ends remain diagnostics", () => {
  const appointments = [
    booking({ time: "13:00 AM" }),
    booking({ time: "00:00 AM" }),
    booking({ time: "24:00" }),
    booking({ time: "08:60 AM" }),
    booking({ time: "08:00 AM", end: "08:60" }),
    booking({ time: "08:00 AM", end: "13:30 PM" }),
    booking({ time: "08:00 AM", end: "00:30 PM" }),
    booking({ time: "08:00 AM", end: "24:00" }),
    booking({ date: "2026-02-30", time: "08:00 AM", end: "08:30 AM" }),
    booking({ time: "11:30 PM", end: "12:00 AM" }),
    booking({ time: "08:00 AM", end: "8:00" }),
  ];
  const before = structuredClone(appointments);
  const result = deriveMiroChairProjection(appointments, chairs);
  assert.deepEqual(result.events, [], "invalid times never roll over or gain an invented next day");
  assert.deepEqual(
    result.unscheduled.map((item) => item.bookingIndex),
    appointments.map((_, index) => index),
  );
  assert.ok(result.unscheduled.every((item) => item.reason.trim().length > 0));
  assert.deepEqual(appointments, before);
});
