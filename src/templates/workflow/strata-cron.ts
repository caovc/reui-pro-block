/** Independent five-field UTC cron evaluator for the local Strata demo. */
export interface ParsedCron {
  minutes: number[];
  hours: number[];
  days: number[];
  months: number[];
  weekdays: number[];
  anyDay: boolean;
  anyWeekday: boolean;
}

function parseField(field: string, minimum: number, maximum: number): number[] {
  const values = new Set<number>();
  for (const item of field.split(",")) {
    const pieces = item.split("/");
    if (pieces.length > 2 || !pieces[0]) throw new Error("Use valid cron lists, ranges and steps.");
    const step = pieces.length === 2 ? Number(pieces[1]) : 1;
    if (!/^\d+$/.test(pieces[1] ?? "1") || !Number.isInteger(step) || step < 1)
      throw new Error("Cron steps must be positive whole numbers.");
    const range = pieces[0] === "*" ? [minimum, maximum] : pieces[0].split("-").map(Number);
    if (!/^(\*|\d+(?:-\d+)?)$/.test(pieces[0]) || range.length > 2)
      throw new Error("Use numbers, *, comma lists, ranges or /steps in cron fields.");
    const start = range[0];
    const end = range[1] ?? (pieces.length === 2 ? maximum : start);
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < minimum ||
      end > maximum ||
      start > end
    )
      throw new Error(`Cron field values must be between ${minimum} and ${maximum}.`);
    for (let value = start; value <= end; value += step) values.add(value);
  }
  return [...values].sort((a, b) => a - b);
}

export function parseStrataCron(expression: string): ParsedCron {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5)
    throw new Error("Enter five cron fields: minute, hour, day, month and weekday.");
  return {
    minutes: parseField(fields[0], 0, 59),
    hours: parseField(fields[1], 0, 23),
    days: parseField(fields[2], 1, 31),
    months: parseField(fields[3], 1, 12),
    weekdays: [...new Set(parseField(fields[4], 0, 7).map((day) => (day === 7 ? 0 : day)))],
    anyDay: fields[2].startsWith("*"),
    anyWeekday: fields[4].startsWith("*"),
  };
}

export function nextStrataRuns(expression: string, after: number, count = 3): number[] {
  if (!Number.isFinite(after) || !Number.isInteger(count) || count < 1 || count > 512)
    throw new Error("Choose a valid time and between one and 512 future runs.");
  const cron = parseStrataCron(expression);
  const day = new Date(after);
  day.setUTCHours(0, 0, 0, 0);
  const output: number[] = [];
  // Allow leap-day gaps for every requested result, while impossible dates terminate.
  for (let offset = 0; offset < 366 * Math.max(8, count * 8) && output.length < count; offset++) {
    const current = new Date(day.getTime() + offset * 86400000);
    if (!cron.months.includes(current.getUTCMonth() + 1)) continue;
    const dayMatch = cron.days.includes(current.getUTCDate());
    const weekMatch = cron.weekdays.includes(current.getUTCDay());
    const matches = cron.anyDay || cron.anyWeekday ? dayMatch && weekMatch : dayMatch || weekMatch;
    if (!matches) continue;
    for (const hour of cron.hours) {
      for (const minute of cron.minutes) {
        const instant = current.getTime() + hour * 3600000 + minute * 60000;
        if (instant > after) output.push(instant);
        if (output.length === count) return output;
      }
    }
  }
  return output;
}

export const STRATA_CRON_PRESETS = [
  { label: "Every 5 min", expression: "*/5 * * * *" },
  { label: "Hourly", expression: "0 * * * *" },
  { label: "Daily", expression: "0 9 * * *" },
  { label: "Weekdays", expression: "0 9 * * 1-5" },
  { label: "Weekly", expression: "0 9 * * 1" },
  { label: "Monthly", expression: "0 9 1 * *" },
] as const;

export function strataCronLabel(
  expression: string,
  minuteUnit: "short" | "long" = "short",
): string {
  const preset = STRATA_CRON_PRESETS.find((item) => item.expression === expression);
  if (preset) {
    const label = preset.label === "Hourly" ? "Hourly at :00" : preset.label;
    return minuteUnit === "long" ? label.replace(/ min$/, " minutes") : label;
  }
  const interval = Number(expression.match(/^\*\/(\d+) \* \* \* \*$/)?.[1]);
  if (interval >= 1 && interval < 60 && 60 % interval === 0) {
    const unit = minuteUnit === "long" ? (interval === 1 ? "minute" : "minutes") : "min";
    return `Every ${interval} ${unit}`;
  }
  const daily = expression.match(/^(\d+) (\d+) \* \* \*$/);
  if (daily && Number(daily[1]) < 60 && Number(daily[2]) < 24)
    return `Daily at ${daily[2].padStart(2, "0")}:${daily[1].padStart(2, "0")}`;
  const minute = expression.match(/^(\d+) \* \* \* \*$/)?.[1];
  return minute && Number(minute) < 60
    ? `Hourly at :${minute.padStart(2, "0")}`
    : "Custom schedule";
}
