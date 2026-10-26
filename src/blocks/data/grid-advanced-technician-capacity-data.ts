/** Original Bricklane workshop fixtures and domain rules. No upstream Pro data. */
export const CAPACITY_TODAY = "2026-10-16";
export const CAPACITY_FIRST_MONDAY = "2026-10-12";
export const CAPACITY_TEAMS = ["Mechanical", "Electrical", "Tire Bay", "Body Shop"] as const;
export const CAPACITY_ROLES = [
  "Mechanic",
  "Auto Electrician",
  "Diagnostic Tech",
  "Tire Specialist",
  "Body Technician",
] as const;
export const CAPACITY_SERVICES = [
  "Maintenance",
  "Electrical",
  "Diagnostics",
  "Tires",
  "Bodywork",
] as const;
export const CAPACITY_SHIFTS = {
  "Mon to Fri": [1, 2, 3, 4, 5],
  "Tue to Sat": [2, 3, 4, 5, 6],
  "Mon to Thu": [1, 2, 3, 4],
} as const;
export type CapacityShift = keyof typeof CAPACITY_SHIFTS;
export type CapacityService = (typeof CAPACITY_SERVICES)[number];
export type CapacityDayKind = "Booked" | "Available" | "Overtime" | "Away" | "Holiday";
export type BookingStatus = "Scheduled" | "In Progress" | "Done";
export interface CapacityPerson {
  id: string;
  name: string;
  role: (typeof CAPACITY_ROLES)[number];
  team: (typeof CAPACITY_TEAMS)[number];
  shift: CapacityShift;
}
export interface CapacityBooking {
  id: string;
  personId: string;
  day: string;
  customer: string;
  phone: string;
  vehicle: string;
  plate: string;
  service: CapacityService;
  hours: number;
  status: BookingStatus;
}
export interface CapacityTimeOff {
  id: string;
  personIds: string[];
  from: string;
  to: string;
  hours: number;
  reason: string;
}
export interface CapacityStore {
  people: CapacityPerson[];
  bookings: CapacityBooking[];
  timeOff: CapacityTimeOff[];
  holidays: Record<string, string>;
}
export interface CapacityDay {
  kind: CapacityDayKind;
  capacity: number;
  booked: number;
  free: number;
  holiday: string | null;
  bookings: CapacityBooking[];
  timeOff: CapacityTimeOff[];
}
export type CapacityResult = { ok: true; store: CapacityStore } | { ok: false; error: string };
export interface CapacityHistory {
  present: CapacityStore;
  past: CapacityStore[];
  future: CapacityStore[];
}
export function addCapacityDays(day: string, amount: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function isCapacityDate(day: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(Date.parse(`${day}T12:00:00Z`)) &&
    new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day
  );
}
export function capacityWindow(weekOffset: number): string[] {
  const monday = addCapacityDays(CAPACITY_FIRST_MONDAY, weekOffset * 7);
  return Array.from({ length: 12 }, (_, index) =>
    addCapacityDays(monday, index + (index >= 6 ? 1 : 0)),
  );
}
export function capacityDateLabel(day: string, full = false): string {
  const date = new Date(`${day}T12:00:00Z`);
  if (full)
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(
    date,
  );
  return `${weekday} ${date.getUTCDate()}`;
}
export function personSupportsService(person: CapacityPerson, service: string): boolean {
  if (!service || service === "All Services") return true;
  const skills: Record<CapacityPerson["role"], readonly CapacityService[]> = {
    Mechanic: ["Maintenance", "Diagnostics"],
    "Auto Electrician": ["Electrical", "Diagnostics"],
    "Diagnostic Tech": ["Diagnostics", "Maintenance"],
    "Tire Specialist": ["Tires", "Maintenance"],
    "Body Technician": ["Bodywork"],
  };
  return skills[person.role].includes(service as CapacityService);
}
export function capacityDay(
  store: CapacityStore,
  person: CapacityPerson,
  day: string,
): CapacityDay {
  const holiday = store.holidays[day] ?? null;
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  const scheduled = (CAPACITY_SHIFTS[person.shift] as readonly number[]).includes(weekday) ? 8 : 0;
  const timeOff = store.timeOff.filter(
    (off) => off.personIds.includes(person.id) && off.from <= day && day <= off.to,
  );
  const capacity = holiday
    ? 0
    : Math.max(0, scheduled - timeOff.reduce((sum, off) => sum + off.hours, 0));
  const bookings = store.bookings.filter(
    (booking) => booking.personId === person.id && booking.day === day,
  );
  const booked = bookings.reduce((sum, booking) => sum + booking.hours, 0);
  const free = capacity - booked;
  const kind: CapacityDayKind = holiday
    ? "Holiday"
    : free < 0
      ? "Overtime"
      : capacity === 0
        ? "Away"
        : free > 0
          ? "Available"
          : "Booked";
  return { kind, capacity, booked, free, holiday, bookings, timeOff };
}
export function capacityTotals(store: CapacityStore, people: CapacityPerson[], days: string[]) {
  let booked = 0;
  let capacity = 0;
  let free = 0;
  for (const person of people) {
    for (const day of days) {
      const value = capacityDay(store, person, day);
      booked += value.booked;
      capacity += value.capacity;
      free += Math.max(0, value.free);
    }
  }
  return {
    booked,
    capacity,
    free,
    utilization: capacity > 0 ? Math.round((booked / capacity) * 100) : null,
  };
}
export function nextCapacitySlot(
  store: CapacityStore,
  person: CapacityPerson,
  after = CAPACITY_TODAY,
) {
  for (let offset = 0; offset < 42; offset += 1) {
    const day = addCapacityDays(after, offset);
    const value = capacityDay(store, person, day);
    if (value.free >= 1) return { day, hours: value.free };
  }
  return null;
}
export function matchesCapacityPerson(
  store: CapacityStore,
  person: CapacityPerson,
  filter: { query: string; team: string; service: string; kind: string },
  days: string[],
): boolean {
  if (filter.team !== "All Teams" && person.team !== filter.team) return false;
  if (!personSupportsService(person, filter.service)) return false;
  if (
    filter.kind !== "All Days" &&
    !days.some((day) => capacityDay(store, person, day).kind === filter.kind)
  )
    return false;
  const query = filter.query.trim().toLocaleLowerCase();
  if (!query) return true;
  const bookings = store.bookings.filter((booking) => booking.personId === person.id);
  return [
    person.name,
    person.role,
    person.team,
    ...bookings.flatMap((booking) => [
      booking.customer,
      booking.phone,
      booking.vehicle,
      booking.plate,
      booking.service,
    ]),
  ].some((value) => value.toLocaleLowerCase().includes(query));
}
export function saveCapacityBooking(
  store: CapacityStore,
  booking: CapacityBooking,
): CapacityResult {
  const person = store.people.find((item) => item.id === booking.personId);
  if (!person) return { ok: false, error: "Choose a technician." };
  if (!isCapacityDate(booking.day)) return { ok: false, error: "Choose a valid day." };
  if (!booking.customer.trim() || !booking.vehicle.trim() || !booking.plate.trim())
    return { ok: false, error: "Customer, vehicle and plate are required." };
  if (!personSupportsService(person, booking.service))
    return {
      ok: false,
      error: `${person.name} does not perform ${booking.service.toLowerCase()}.`,
    };
  if (
    !Number.isFinite(booking.hours) ||
    booking.hours < 1 ||
    booking.hours > 8 ||
    !Number.isInteger(booking.hours)
  )
    return { ok: false, error: "Hours must be 1 to 8 in whole-hour steps." };
  if (!["Scheduled", "In Progress", "Done"].includes(booking.status))
    return { ok: false, error: "Choose a booking status." };
  const day = capacityDay(store, person, booking.day);
  if (day.holiday)
    return { ok: false, error: `${booking.day} is ${day.holiday}. Choose an open shop day.` };
  if (new Date(`${booking.day}T12:00:00Z`).getUTCDay() === 0)
    return { ok: false, error: "The workshop is closed on Sundays." };
  // An off-shift technician remains selectable: assigned work is retained as overtime.
  const normalized = {
    ...booking,
    customer: booking.customer.trim(),
    vehicle: booking.vehicle.trim(),
    plate: booking.plate.trim().toUpperCase(),
  };
  return {
    ok: true,
    store: {
      ...store,
      bookings: [...store.bookings.filter((item) => item.id !== booking.id), normalized],
    },
  };
}
export function saveCapacityPerson(store: CapacityStore, person: CapacityPerson): CapacityResult {
  if (!person.name.trim()) return { ok: false, error: "A technician name is required." };
  if (
    !CAPACITY_ROLES.includes(person.role) ||
    !CAPACITY_TEAMS.includes(person.team) ||
    !Object.hasOwn(CAPACITY_SHIFTS, person.shift)
  )
    return { ok: false, error: "Choose a valid role, team and shift." };
  const next = {
    ...store,
    people: store.people.some((item) => item.id === person.id)
      ? store.people.map((item) =>
          item.id === person.id ? { ...person, name: person.name.trim() } : item,
        )
      : [...store.people, { ...person, name: person.name.trim() }],
  };
  for (const booking of store.bookings.filter((item) => item.personId === person.id)) {
    if (!personSupportsService(person, booking.service))
      return {
        ok: false,
        error: "Move or remove this technician's affected bookings before changing their role.",
      };
  }
  return { ok: true, store: next };
}
export function saveCapacityTimeOff(store: CapacityStore, off: CapacityTimeOff): CapacityResult {
  if (
    !off.personIds.length ||
    off.personIds.some((id) => !store.people.some((person) => person.id === id))
  )
    return { ok: false, error: "Choose at least one technician." };
  if (!isCapacityDate(off.from) || !isCapacityDate(off.to) || off.to < off.from)
    return { ok: false, error: "Choose a valid date range." };
  if (!Number.isFinite(off.hours) || off.hours < 0.5 || off.hours > 8 || off.hours % 0.5 !== 0)
    return { ok: false, error: "Time off must be 0.5 to 8 hours per day." };
  if (!off.reason.trim()) return { ok: false, error: "Add a reason for the time off." };
  const normalized = { ...off, personIds: [...new Set(off.personIds)], reason: off.reason.trim() };
  const next = {
    ...store,
    timeOff: [...store.timeOff.filter((item) => item.id !== off.id), normalized],
  };
  // Existing work remains assigned. Reduced capacity exposes overtime until it is moved.
  return { ok: true, store: next };
}
export function removeCapacityPeople(store: CapacityStore, ids: string[]): CapacityStore {
  const selected = new Set(ids);
  return {
    ...store,
    people: store.people.filter((person) => !selected.has(person.id)),
    bookings: store.bookings.filter((booking) => !selected.has(booking.personId)),
    timeOff: store.timeOff
      .map((off) => ({ ...off, personIds: off.personIds.filter((id) => !selected.has(id)) }))
      .filter((off) => off.personIds.length),
  };
}
export function commitCapacityHistory(
  history: CapacityHistory,
  next: CapacityStore,
): CapacityHistory {
  return { present: next, past: [...history.past.slice(-29), history.present], future: [] };
}
export function undoCapacityHistory(history: CapacityHistory): CapacityHistory {
  const previous = history.past.at(-1);
  return previous
    ? {
        present: previous,
        past: history.past.slice(0, -1),
        future: [history.present, ...history.future],
      }
    : history;
}
export function redoCapacityHistory(history: CapacityHistory): CapacityHistory {
  const next = history.future[0];
  return next
    ? { present: next, past: [...history.past, history.present], future: history.future.slice(1) }
    : history;
}
export function createCapacitySeed(): CapacityStore {
  const definitions: Array<
    [string, CapacityPerson["role"], CapacityPerson["team"], CapacityShift]
  > = [
    ["Maya Chen", "Mechanic", "Mechanical", "Mon to Fri"],
    ["Oliver Reed", "Mechanic", "Mechanical", "Tue to Sat"],
    ["Priya Desai", "Mechanic", "Mechanical", "Mon to Thu"],
    ["Jonah Brooks", "Mechanic", "Mechanical", "Mon to Fri"],
    ["Amina Yusuf", "Auto Electrician", "Electrical", "Mon to Fri"],
    ["Evan Park", "Auto Electrician", "Electrical", "Tue to Sat"],
    ["Clara Silva", "Diagnostic Tech", "Electrical", "Mon to Fri"],
    ["Felix Martin", "Diagnostic Tech", "Mechanical", "Mon to Thu"],
    ["Imani Cole", "Tire Specialist", "Tire Bay", "Mon to Fri"],
    ["Theo Bell", "Tire Specialist", "Tire Bay", "Tue to Sat"],
    ["Lina Haddad", "Body Technician", "Body Shop", "Mon to Fri"],
    ["Ruben Costa", "Body Technician", "Body Shop", "Tue to Sat"],
  ];
  const people = definitions.map(([name, role, team, shift], index) => ({
    id: `tech-${index + 1}`,
    name,
    role,
    team,
    shift,
  }));
  const store: CapacityStore = {
    people,
    bookings: [],
    timeOff: [],
    holidays: { "2026-10-12": "Workshop training holiday" },
  };
  const vehicles = [
    "Volvo V60",
    "Mazda CX-5",
    "Kia Niro",
    "Skoda Octavia",
    "Hyundai Ioniq",
    "Subaru Outback",
  ];
  const customers = [
    "Ada Mercer",
    "Nico Wells",
    "June Patel",
    "Sam Ellis",
    "Rory Blake",
    "Zoe Lin",
  ];
  for (const [personIndex, person] of people.entries()) {
    for (let offset = -7; offset < 35; offset += 1) {
      const day = addCapacityDays(CAPACITY_FIRST_MONDAY, offset);
      if (capacityDay(store, person, day).capacity === 0) continue;
      const pattern = (personIndex * 3 + offset + 49) % 9;
      const hours =
        personIndex === 0 && day === CAPACITY_TODAY ? 6 : [8, 6, 8, 4, 10, 8, 2, 9, 0][pattern];
      const primaryService: Record<CapacityPerson["role"], CapacityService> = {
        Mechanic: "Maintenance",
        "Auto Electrician": "Electrical",
        "Diagnostic Tech": "Diagnostics",
        "Tire Specialist": "Tires",
        "Body Technician": "Bodywork",
      };
      const service = primaryService[person.role];
      if (hours) {
        const firstHours = Math.min(2, hours);
        for (const [part, bookingHours] of [firstHours, hours - firstHours].entries()) {
          if (!bookingHours) continue;
          const sample = (personIndex + offset + part + 49) % vehicles.length;
          store.bookings.push({
            id: `job-${personIndex}-${offset}-${part}`,
            personId: person.id,
            day,
            customer: customers[sample],
            phone: `020 7946 ${String(1000 + personIndex * 13 + offset + part + 7).padStart(4, "0")}`,
            vehicle: vehicles[sample],
            plate: `BL${String(personIndex + 1).padStart(2, "0")} ${String(offset + 107)}${part ? "S" : "R"}`,
            service,
            hours: bookingHours,
            status:
              day < CAPACITY_TODAY
                ? "Done"
                : day === CAPACITY_TODAY && part === 0
                  ? "In Progress"
                  : "Scheduled",
          });
        }
      }
    }
  }
  // Original leave example is on a genuinely empty shift day, never a hidden cancelled booking.
  const leave = people
    .flatMap((person) => capacityWindow(0).map((day) => ({ person, day })))
    .find(
      ({ person, day }) =>
        capacityDay(store, person, day).capacity > 0 &&
        capacityDay(store, person, day).booked === 0,
    );
  if (leave)
    store.timeOff.push({
      id: "leave-seed",
      personIds: [leave.person.id],
      from: leave.day,
      to: leave.day,
      hours: 8,
      reason: "Annual leave",
    });
  return store;
}

/** Reject malformed or contradictory loaded schedules before they can enter the table. */
export function validateCapacityStore(store: CapacityStore): string | null {
  if (
    !store ||
    !Array.isArray(store.people) ||
    !Array.isArray(store.bookings) ||
    !Array.isArray(store.timeOff) ||
    !store.holidays ||
    typeof store.holidays !== "object"
  )
    return "The capacity response is incomplete.";
  const ids = (records: { id: string }[]) =>
    records.every((record) => record && typeof record.id === "string" && record.id.trim()) &&
    new Set(records.map((record) => record.id)).size === records.length;
  if (!ids(store.people) || !ids(store.bookings) || !ids(store.timeOff))
    return "Schedule IDs must be present and unique.";
  if (
    Object.entries(store.holidays).some(
      ([day, reason]) => !isCapacityDate(day) || typeof reason !== "string" || !reason.trim(),
    )
  )
    return "A holiday has an invalid day or description.";
  if (
    store.people.some(
      (person) =>
        typeof person.name !== "string" ||
        !person.name.trim() ||
        !CAPACITY_ROLES.includes(person.role) ||
        !CAPACITY_TEAMS.includes(person.team) ||
        !Object.hasOwn(CAPACITY_SHIFTS, person.shift),
    )
  )
    return "A technician has an invalid name, role, team or shift.";
  if (
    store.timeOff.some(
      (off) =>
        !Array.isArray(off.personIds) ||
        !off.personIds.length ||
        off.personIds.some((id) => !store.people.some((person) => person.id === id)) ||
        !isCapacityDate(off.from) ||
        !isCapacityDate(off.to) ||
        off.to < off.from ||
        !Number.isFinite(off.hours) ||
        off.hours < 0.5 ||
        off.hours > 8 ||
        off.hours % 0.5 !== 0 ||
        typeof off.reason !== "string" ||
        !off.reason.trim(),
    )
  )
    return "A time-off record is invalid.";
  for (const booking of store.bookings) {
    if (
      typeof booking.customer !== "string" ||
      typeof booking.vehicle !== "string" ||
      typeof booking.plate !== "string" ||
      typeof booking.phone !== "string"
    )
      return "A booking has invalid customer or vehicle details.";
    const result = saveCapacityBooking(store, booking);
    if (!result.ok) return result.error;
  }
  return null;
}
