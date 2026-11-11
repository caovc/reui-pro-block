export const SCHEDULE_TODAY = "2026-10-27";
export const SCHEDULE_START = "2026-10-19";

export const crew = [
  { id: "bruno", name: "Bruno Santos", role: "Lead carpenter" },
  { id: "dina", name: "Dina Rivers", role: "Site lead" },
  { id: "elise", name: "Elise Park", role: "Cabinet installer" },
  { id: "felix", name: "Felix Mora", role: "Painter" },
  { id: "hana", name: "Hana Duarte", role: "Tile setter" },
  { id: "imani", name: "Imani Gray", role: "Electrician" },
  { id: "jules", name: "Jules Reed", role: "Plumber" },
  { id: "kiran", name: "Kiran Olsen", role: "General carpenter" },
  { id: "liv", name: "Liv Soto", role: "Drywall finisher" },
  { id: "mara", name: "Mara Finch", role: "Site assistant" },
] as const;

export const jobTypes = [
  "Kitchen Remodel",
  "Bath Remodel",
  "Exterior Paint",
  "Basement Finish",
] as const;
export const jobStatuses = ["Late", "On Track", "On Hold", "Not Started", "Complete"] as const;
export const slideReasons = [
  "Rain or weather",
  "Late materials",
  "Inspection delay",
  "Client request",
  "Crew availability",
  "Other",
] as const;
export const dayStates = ["Planned", "Done", "Lost"] as const;

export type JobType = (typeof jobTypes)[number];
export type JobStatus = (typeof jobStatuses)[number];
export type DayState = (typeof dayStates)[number];

export interface Assignment {
  id: string;
  crewId: string;
  task: string;
  hours: number;
}

export interface CrewDay {
  date: string;
  state: DayState;
  tasks: Assignment[];
  reason?: string;
  madeUp?: boolean;
}

export interface Material {
  id: string;
  name: string;
  supplier: string;
  order: string;
  cost: number;
  arrives: string | null;
  needed: string;
  received: boolean;
}

export interface Inspection {
  id: string;
  name: string;
  date: string;
  completed: boolean;
}

export interface HistoryEntry {
  id: string;
  title: string;
  detail: string;
}

export interface JobProfile {
  client: string;
  phone: string;
  street: string;
  town: string;
  type: JobType;
  lead: string;
  start: string;
  due: string;
}

export interface Job extends JobProfile {
  id: string;
  hold: string;
  notes: string;
  days: CrewDay[];
  materials: Material[];
  inspections: Inspection[];
  history: HistoryEntry[];
}

type PlanStep = readonly [offset: number, trade: string | null, task: string, hours: number];

const templates: Record<JobType, readonly PlanStep[]> = {
  "Kitchen Remodel": [
    [0, null, "Protect site and remove cabinets", 7],
    [1, "jules", "Move sink lines", 8],
    [2, "imani", "Run counter circuits", 8],
    [3, null, "Repair the subfloor", 6],
    [5, "elise", "Set base cabinets", 8],
    [6, "elise", "Hang wall cabinets", 7],
    [8, "hana", "Set backsplash tile", 8],
    [10, "jules", "Connect fixtures", 4],
    [11, null, "Walk through the punch list", 4],
  ],
  "Bath Remodel": [
    [0, null, "Protect and strip the room", 8],
    [1, "jules", "Install rough plumbing", 7],
    [3, "liv", "Repair walls", 6],
    [4, "hana", "Waterproof the shower", 8],
    [6, "hana", "Set wall tile", 8],
    [7, "hana", "Grout and seal", 6],
    [9, "jules", "Set the vanity and fixtures", 5],
  ],
  "Exterior Paint": [
    [0, "felix", "Wash siding", 5],
    [2, "felix", "Scrape and prime", 8],
    [4, null, "Repair and caulk trim", 8],
    [5, "felix", "Apply first coat", 8],
    [6, "felix", "Apply second coat", 8],
    [7, "felix", "Paint trim and doors", 7],
    [8, "felix", "Touch up and clean", 4],
  ],
  "Basement Finish": [
    [0, null, "Lay out walls", 7],
    [1, "kiran", "Frame partitions", 8],
    [2, "imani", "Run branch circuits", 8],
    [4, "liv", "Hang drywall", 8],
    [5, "liv", "Tape joints", 6],
    [7, "felix", "Prime and paint", 8],
    [9, null, "Hang doors and finish trim", 8],
  ],
};

export function isWorkday(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    date.getUTCDay() % 6 !== 0
  );
}

export function shiftWorkday(value: string, offset: number): string {
  const date = new Date(`${value}T12:00:00Z`);
  const direction = Math.sign(offset);
  for (let remaining = Math.abs(offset); remaining > 0;) {
    date.setUTCDate(date.getUTCDate() + direction);
    if (date.getUTCDay() % 6 !== 0) remaining--;
  }
  return date.toISOString().slice(0, 10);
}

export function workdayDistance(from: string, until: string): number {
  if (until < from) return -workdayDistance(until, from);
  if (from === until) return 0;
  const elapsed = Math.round((Date.parse(until) - Date.parse(from)) / 86_400_000);
  const weeks = Math.floor(elapsed / 7);
  let days = weeks * 5;
  const cursor = new Date(Date.parse(from) + weeks * 7 * 86_400_000);
  while (cursor.toISOString().slice(0, 10) < until) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (cursor.getUTCDay() % 6 !== 0) days++;
  }
  return days;
}

export function scheduleWindow(week: number) {
  const start = shiftWorkday(SCHEDULE_START, week * 5);
  return Array.from({ length: 20 }, (_, index) => shiftWorkday(start, index));
}

export function jobDate(value: string, weekday = false) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
    ...(weekday ? { weekday: "short" } : {}),
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function calendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function calendarKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function jobName(job: JobProfile) {
  const suffix = {
    "Kitchen Remodel": "Kitchen",
    "Bath Remodel": "Bath",
    "Exterior Paint": "Exterior",
    "Basement Finish": "Basement",
  };
  return `${job.client.trim().split(/\s+/).at(-1) ?? ""} ${suffix[job.type]}`;
}

export function crewMember(id: string) {
  return crew.find((member) => member.id === id);
}

export function taskHours(day: CrewDay) {
  return day.tasks.reduce((total, task) => total + task.hours, 0);
}

export function plannedDays(type: JobType, start: string, lead: string): CrewDay[] {
  return templates[type].map(([offset, trade, task, hours]) => ({
    date: shiftWorkday(start, offset),
    state: "Planned",
    tasks: [{ id: `plan-${offset}`, crewId: trade ?? lead, task, hours }],
  }));
}

export function plannedFinish(type: JobType, start: string) {
  return shiftWorkday(start, templates[type].at(-1)?.[0] ?? 0);
}

export function jobProgress(job: Job) {
  const activeDays = job.days.filter((day) => day.state !== "Lost");
  const worked = activeDays
    .filter((day) => day.state === "Done")
    .reduce((total, day) => total + taskHours(day), 0);
  const left = activeDays
    .filter((day) => day.state === "Planned")
    .reduce((total, day) => total + taskHours(day), 0);
  const finish = activeDays.at(-1)?.date ?? job.start;
  const late = Math.max(0, workdayDistance(job.due, finish));
  const status: JobStatus = job.hold
    ? "On Hold"
    : left === 0 && worked > 0
      ? "Complete"
      : late > 0
        ? "Late"
        : worked > 0
          ? "On Track"
          : "Not Started";
  return {
    worked,
    left,
    finish,
    late,
    status,
    next: activeDays.find((day) => day.state === "Planned"),
  };
}

export function logJob(job: Job, title: string, detail: string): Job {
  return {
    ...job,
    history: [{ id: crypto.randomUUID(), title, detail }, ...job.history],
  };
}

export function nextCrewDate(job: Job): string {
  const booked = new Set(job.days.map((day) => day.date));
  let date = job.start > SCHEDULE_TODAY ? job.start : SCHEDULE_TODAY;
  while (booked.has(date)) date = shiftWorkday(date, 1);
  return date;
}

export function addCrewDay(job: Job, day: CrewDay, previousDate: string | null): Job | null {
  if (!isWorkday(day.date) || !day.tasks.length) return null;
  if (job.days.some((existing) => existing.date === day.date && existing.date !== previousDate))
    return null;
  return logJob(
    {
      ...job,
      days: [...job.days.filter((existing) => existing.date !== previousDate), day].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    },
    previousDate ? "Crew day updated" : "Crew day added",
    `${jobDate(day.date)} · ${day.state.toLowerCase()} · ${taskHours(day)}h`,
  );
}

export function createJob(profile: JobProfile): Job {
  return {
    ...profile,
    id: crypto.randomUUID(),
    hold: "",
    notes: "",
    days: plannedDays(profile.type, profile.start, profile.lead),
    materials: [],
    inspections: [],
    history: [
      { id: "created", title: "Job created", detail: `Starts ${jobDate(profile.start, true)}` },
    ],
  };
}

export interface CrewConflict {
  date: string;
  member: string;
  otherJob: string;
}

export function crewConflicts(jobId: string, days: CrewDay[], jobs: readonly Job[]) {
  const conflicts = new Map<string, CrewConflict>();
  for (const day of days) {
    if (day.state === "Lost") continue;
    for (const task of day.tasks) {
      for (const other of jobs) {
        if (other.id === jobId) continue;
        const booked = other.days.some(
          (otherDay) =>
            otherDay.date === day.date &&
            otherDay.state !== "Lost" &&
            otherDay.tasks.some((otherTask) => otherTask.crewId === task.crewId),
        );
        if (booked) {
          conflicts.set(`${day.date}:${task.crewId}:${other.id}`, {
            date: day.date,
            member: crewMember(task.crewId)?.name ?? task.crewId,
            otherJob: jobName(other),
          });
        }
      }
    }
  }
  return [...conflicts.values()];
}

export function slidePlan(
  job: Job,
  from: string,
  offset: number,
  jobs: readonly Job[],
  makeUpDate?: string,
) {
  const invalid = (message: string) => ({ days: null, conflicts: [], error: message, moved: 0 });
  if (!isWorkday(from)) return invalid("Choose a workday.");
  if (!Number.isInteger(offset) || !offset || Math.abs(offset) > 30)
    return invalid("Enter between one and thirty workdays in either direction.");
  const eligible = job.days.filter((day) => day.state === "Planned" && day.date >= from);
  const lost = makeUpDate
    ? job.days.find((day) => day.date === makeUpDate && day.state === "Lost" && !day.madeUp)
    : undefined;
  if (!eligible.length && !lost) return invalid("There are no planned workdays from this date.");
  const shifted = eligible.map((day) => ({ ...day, date: shiftWorkday(day.date, offset) }));
  const stationary = job.days.filter((day) => !eligible.includes(day));
  if (lost) {
    const reserved = new Set([...stationary, ...shifted].map((day) => day.date));
    let date = from;
    while (reserved.has(date)) date = shiftWorkday(date, 1);
    shifted.push({
      date,
      state: "Planned",
      tasks: lost.tasks.map((task) => ({ ...task, id: `makeup-${task.id}` })),
    });
  }
  const days = [
    ...stationary.map((day) => (day === lost ? { ...day, madeUp: true } : day)),
    ...shifted,
  ].sort((a, b) => a.date.localeCompare(b.date));
  if (new Set(days.map((day) => day.date)).size !== days.length) {
    return invalid(
      "The slide would overlap an existing day on this job. Choose a different date or offset.",
    );
  }
  return {
    days,
    conflicts: crewConflicts(job.id, shifted, jobs),
    error: "",
    moved: shifted.length,
  };
}

export function crewLoad(jobs: readonly Job[], date: string) {
  const assignments = jobs.flatMap((job) =>
    job.days
      .filter((day) => day.date === date && day.state !== "Lost")
      .flatMap((day) => day.tasks.map((task) => ({ ...task, jobId: job.id, job: jobName(job) }))),
  );
  const members = new Set(assignments.map((task) => task.crewId));
  return {
    people: members.size,
    hours: assignments.reduce((sum, task) => sum + task.hours, 0),
    assignments,
  };
}

const clients = [
  "Rowan Bennett",
  "Pia Campos",
  "Emil Dawson",
  "Lila Emery",
  "Noel Farrow",
  "Nia Garner",
  "Seren Hayes",
  "Diego Ivers",
  "Eden Kessler",
  "Uma Lawson",
  "Omar Melton",
  "Leah Nolan",
  "Pavel Owens",
  "Jana Pike",
  "Avery Quinn",
  "Iris Ramos",
  "Kenji Stone",
  "Tess Turner",
  "Amara Voss",
  "Ravi Walsh",
  "Esme Wynn",
  "Milo Young",
];

export function createScheduleSeed(): Job[] {
  const special: Partial<
    Record<number, { type: JobType; start: string; due: string; hold?: string }>
  > = {
    0: {
      type: "Exterior Paint",
      start: "2026-11-02",
      due: "2026-11-16",
      hold: "Waiting on client approval",
    },
    1: { type: "Kitchen Remodel", start: "2026-11-06", due: "2026-12-04" },
    2: { type: "Exterior Paint", start: "2026-10-20", due: "2026-11-06" },
    3: { type: "Bath Remodel", start: "2026-10-26", due: "2026-11-12" },
    4: { type: "Kitchen Remodel", start: "2026-10-19", due: "2026-10-29" },
    7: { type: "Exterior Paint", start: "2026-10-07", due: "2026-10-22" },
    13: { type: "Kitchen Remodel", start: "2026-10-20", due: "2026-11-02" },
    15: { type: "Kitchen Remodel", start: "2026-10-28", due: "2026-11-13" },
  };

  return clients.map((client, index) => {
    const type = special[index]?.type ?? jobTypes[index % jobTypes.length];
    const start = special[index]?.start ?? shiftWorkday(SCHEDULE_START, index - 4);
    const lead = crew[(index * 3) % crew.length].id;
    const due = special[index]?.due ?? shiftWorkday(plannedFinish(type, start), 2);
    const days = plannedDays(type, start, lead).map((day) => {
      if (index === 2 && day.date === "2026-10-26")
        return { ...day, state: "Lost" as const, reason: "Rain made the site unsafe" };
      if (day.date < SCHEDULE_TODAY) return { ...day, state: "Done" as const };
      return day;
    });
    const baseMaterial = {
      "Kitchen Remodel": "Quartz countertop",
      "Bath Remodel": "Porcelain wall tile",
      "Exterior Paint": "Exterior primer",
      "Basement Finish": "Fire-rated drywall",
    }[type];
    const order = 21430 + index * 3;
    const materials = [
      {
        id: "material-main",
        name: baseMaterial,
        supplier: "Harbor Supply",
        order: `PO-${order}`,
        cost: 410 + index * 31,
        arrives: index === 15 ? null : start,
        needed: shiftWorkday(start, 2),
        received: start < SCHEDULE_TODAY && index !== 15,
      },
      {
        id: "material-trim",
        name: type === "Exterior Paint" ? "Trim paint" : "Finish hardware",
        supplier: "Juniper Trade Co.",
        order: `PO-${order + 1}`,
        cost: 260 + index * 13,
        arrives: shiftWorkday(start, 4),
        needed: shiftWorkday(start, 6),
        received: false,
      },
      {
        id: "material-finishes",
        name: type === "Exterior Paint" ? "Siding paint" : "Surface protection",
        supplier: "Harbor Supply",
        order: `PO-${order + 2}`,
        cost: 330 + index * 11,
        arrives: shiftWorkday(start, 2),
        needed: shiftWorkday(start, 4),
        received: false,
      },
    ];
    const inspections =
      type === "Exterior Paint"
        ? []
        : [
            {
              id: "inspection-rough",
              name: type === "Basement Finish" ? "Framing inspection" : "Rough-in inspection",
              date: shiftWorkday(start, 3),
              completed: shiftWorkday(start, 3) < SCHEDULE_TODAY,
            },
            {
              id: "inspection-final",
              name: "Final inspection",
              date: shiftWorkday(start, 10),
              completed: false,
            },
          ];
    return {
      id: `job-${index + 1}`,
      client,
      phone: `(312) 555-01${String(index + 31).padStart(2, "0")}`,
      street: `${28 + index * 17} ${["Juniper Walk", "Alder Row", "Maple Court", "Birch Terrace"][index % 4]}`,
      town: ["Cedar Grove", "Willow Point", "Northfield"][index % 3],
      type,
      lead,
      start,
      due,
      hold: special[index]?.hold ?? "",
      notes: index === 3 ? "Park on the east side. The client will leave the side gate open." : "",
      days,
      materials,
      inspections,
      history: [
        { id: "initial-plan", title: "Schedule planned", detail: `Starts ${jobDate(start, true)}` },
      ],
    };
  });
}
