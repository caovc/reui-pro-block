export function seattleDateInput(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(timestamp);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

/** Parse a Seattle wall-clock value without using the host machine's timezone. */
export function parseSeattleInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return NaN;
  const [, year, month, day, hour, minute] = match.map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = desired;
  for (let attempt = 0; attempt < 3; attempt++) {
    const local = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(seattleDateInput(timestamp));
    if (!local) return NaN;
    const [, localYear, localMonth, localDay, localHour, localMinute] = local.map(Number);
    const represented = Date.UTC(localYear, localMonth - 1, localDay, localHour, localMinute);
    timestamp += desired - represented;
  }
  // Reject invalid calendar days and nonexistent local times during a DST transition.
  return seattleDateInput(timestamp) === value ? timestamp : NaN;
}
