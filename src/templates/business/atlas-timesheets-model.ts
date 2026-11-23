export const atlasTimePeople = [
  { id: 1, name: "Amara Ortiz", role: "Delivery lead", weeklyMinutes: 2400 },
  { id: 2, name: "Theo Mercer", role: "Platform engineer", weeklyMinutes: 2400 },
  { id: 3, name: "Lena Hoffman", role: "Content editor", weeklyMinutes: 1800 },
  { id: 4, name: "Isaac Chen", role: "Product engineer", weeklyMinutes: 2400 },
  { id: 5, name: "Maya Brooks", role: "Customer success", weeklyMinutes: 2400 },
  { id: 6, name: "Noah Reed", role: "Product designer", weeklyMinutes: 2100 },
  { id: 7, name: "Sofia Lane", role: "Operations specialist", weeklyMinutes: 2400 },
  { id: 8, name: "Eli Morgan", role: "Researcher", weeklyMinutes: 1800 },
  { id: 9, name: "Nina Patel", role: "Support engineer", weeklyMinutes: 2400 },
] as const;
export const atlasWorkTypes = ["Client", "Internal", "Support"] as const;
export type AtlasWorkType = (typeof atlasWorkTypes)[number];
export type AtlasTimeEntry = {
  id: string;
  personId: number;
  date: string;
  minutes: number;
  workType: AtlasWorkType;
  billable: boolean;
  note: string;
};
export type AtlasTimeRange = { from: string; to: string };
export type AtlasTimeFilters = { people: string[]; tracked: string[]; billable: string[] };
export const atlasInitialTimeRange: AtlasTimeRange = { from: "2026-11-16", to: "2026-11-22" };

/** Calendar days use local noon so DST changes cannot skip or duplicate a day. */
export function atlasTimeDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}
export function atlasTimeDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function shiftAtlasTimeDate(value: string, days: number): string {
  const date = atlasTimeDate(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return atlasTimeDateKey(date);
}
export function atlasTimeRangeDays(range: AtlasTimeRange): string[] {
  if (!atlasTimeDate(range.from) || !atlasTimeDate(range.to) || range.from > range.to) return [];
  const days: string[] = [];
  for (let day = range.from; day <= range.to && days.length < 32; day = shiftAtlasTimeDate(day, 1))
    days.push(day);
  return days.length > 31 ? [] : days;
}
export function formatAtlasMinutes(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
}

export function createAtlasTimeEntries(): AtlasTimeEntry[] {
  const hours = [
    [6, 7, 4.5, 7.5, 5],
    [8, 8, 7, 8, 8],
    [4, 3.5, 5, 4, 5],
    [7, 8, 8, 7.5, 8],
    [6, 7, 6, 8, 7],
    [6, 7, 6.5, 6, 7],
    [8, 8, 8, 8, 8],
    [3, 4, 3, 4, 3],
    [8, 7.5, 8, 8, 8],
  ];
  return atlasTimePeople.flatMap((person, index) =>
    hours[index].map((value, day) => ({
      id: `atlas-time-${person.id}-${day}`,
      personId: person.id,
      date: shiftAtlasTimeDate(atlasInitialTimeRange.from, day),
      minutes: value * 60,
      workType: (index === 8
        ? "Support"
        : index === 6 || day === 2
          ? "Internal"
          : "Client") as AtlasWorkType,
      billable: index !== 6 && day !== 2,
      note: day === 2 ? "Team planning and documentation" : "Delivery work",
    })),
  );
}

export type AtlasTimeRow = {
  id: number;
  name: string;
  role: string;
  days: { date: string; entries: AtlasTimeEntry[]; minutes: number; workTypes: string[] }[];
  minutes: number;
  billableMinutes: number;
  targetMinutes: number;
};
export function atlasTimeRows(
  entries: AtlasTimeEntry[],
  range: AtlasTimeRange,
  billable: string[],
): AtlasTimeRow[] {
  const days = atlasTimeRangeDays(range);
  const selected = entries.filter(
    (entry) =>
      entry.date >= range.from &&
      entry.date <= range.to &&
      (!billable.length || billable.includes(entry.billable ? "Billable" : "Non-billable")),
  );
  return atlasTimePeople.map((person) => {
    const personEntries = selected.filter((entry) => entry.personId === person.id);
    return {
      ...person,
      days: days.map((date) => {
        const dayEntries = personEntries.filter((entry) => entry.date === date);
        return {
          date,
          entries: dayEntries,
          minutes: dayEntries.reduce((sum, entry) => sum + entry.minutes, 0),
          workTypes: [...new Set(dayEntries.map((entry) => entry.workType))],
        };
      }),
      minutes: personEntries.reduce((sum, entry) => sum + entry.minutes, 0),
      billableMinutes: personEntries
        .filter((entry) => entry.billable)
        .reduce((sum, entry) => sum + entry.minutes, 0),
      targetMinutes:
        days.filter((date) => ![0, 6].includes(atlasTimeDate(date)!.getDay())).length *
        (person.weeklyMinutes / 5),
    };
  });
}
export function atlasTimeRowMatches(row: AtlasTimeRow, filters: AtlasTimeFilters): boolean {
  return (
    (!filters.people.length || filters.people.includes(row.name)) &&
    (!filters.billable.length || row.minutes > 0) &&
    (!filters.tracked.length ||
      filters.tracked.some((value) =>
        value === "Less than 20 hours"
          ? row.minutes < 1200
          : value === "20–40 hours"
            ? row.minutes >= 1200 && row.minutes <= 2400
            : row.minutes > 2400,
      ))
  );
}

/** Validate the entire replacement before changing any displayed time. */
export function saveAtlasTimeEntry(
  entries: AtlasTimeEntry[],
  entry: AtlasTimeEntry,
): { entries: AtlasTimeEntry[]; error: string | null } {
  const fail = (error: string) => ({ entries, error });
  if (!atlasTimePeople.some((person) => person.id === entry.personId))
    return fail("Choose a team member.");
  if (!entry.id || !atlasTimeDate(entry.date)) return fail("Enter a valid date.");
  if (!Number.isInteger(entry.minutes) || entry.minutes <= 0 || entry.minutes > 1440)
    return fail("Enter a duration greater than 0 and no more than 24 hours.");
  if (!atlasWorkTypes.includes(entry.workType)) return fail("Choose a work type.");
  const existingMinutes = entries
    .filter(
      (item) =>
        item.id !== entry.id && item.personId === entry.personId && item.date === entry.date,
    )
    .reduce((sum, item) => sum + item.minutes, 0);
  if (existingMinutes + entry.minutes > 1440)
    return fail("This entry would put the person's daily total over 24 hours.");
  const next = { ...entry, note: entry.note.trim() };
  return {
    entries: entries.some((item) => item.id === entry.id)
      ? entries.map((item) => (item.id === entry.id ? next : item))
      : [...entries, next],
    error: null,
  };
}
