import { useState } from "react";
import { TZDate } from "@date-fns/tz";
import { addDays, format } from "date-fns";
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types";
import { toZoned } from "@/components/reui/event-calendar/event-calendar-lib";
import { rosterCalendarTimeZone } from "./roster-calendar";

export const leaveColors = [
  { name: "Amber", value: "#f59e0b" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Sky", value: "#0ea5e9" },
];
export type LeaveType = { name: string; color: string };
export type RosterLeaveData = {
  type: string;
  person: string;
  reason: string;
  cover: string;
  people: string[];
  description: string;
};
export type RosterLeaveEvent = CalendarEvent<RosterLeaveData>;
const initialTypes: LeaveType[] = ["Annual", "Sick", "Parental", "Unpaid"].map((name, index) => ({
  name,
  color: leaveColors[index].value,
}));
export function leaveDate(value: string, time = "00:00") {
  const [year, month, day] = value.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new TZDate(year, month - 1, day, hour, minute, rosterCalendarTimeZone);
}
export const leaveDateKey = (date: Date) =>
  format(toZoned(date, rosterCalendarTimeZone), "yyyy-MM-dd");
export const leaveFormat = (date: Date, pattern: string) =>
  format(toZoned(date, rosterCalendarTimeZone), pattern);
const initialEvents: RosterLeaveEvent[] = [
  ["Aisha Rahman", "Annual", "2026-07-10", "2026-07-11"],
  ["Ingrid Larsen", "Annual", "2026-07-13", "2026-07-15"],
  ["Abena Mensah", "Parental", "2026-07-27", "2026-07-31"],
  ["Priya Nair", "Annual", "2026-07-29", "2026-08-01"],
  ["Lucas Moreau", "Sick", "2026-07-30", "2026-08-01"],
  ["Marco Bianchi", "Annual", "2026-08-03", "2026-08-07"],
].map(([person, type, start, end]) => ({
  id: `leave-${person}`,
  title: `${person}: ${type}`,
  start: leaveDate(start),
  end: leaveDate(end),
  allDay: true,
  color: initialTypes.find((item) => item.name === type)?.color,
  data: { person, type, reason: `${type} leave`, cover: "", people: [person], description: "" },
}));
export function useRosterTimeOffState() {
  const [events, setEvents] = useState(initialEvents);
  const [types, setTypes] = useState(initialTypes);
  const [hidden, setHidden] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(() => leaveDate("2026-07-30"));
  return {
    events,
    setEvents,
    types,
    setTypes,
    hidden,
    setHidden,
    date,
    setDate,
    hasChanges: events !== initialEvents || types !== initialTypes,
    reset() {
      setEvents(initialEvents);
      setTypes(initialTypes);
      setHidden([]);
    },
  };
}
export type RosterTimeOffState = ReturnType<typeof useRosterTimeOffState>;
export function leaveDraft(date: Date, event?: RosterLeaveEvent) {
  return {
    reason: event?.data?.reason || "",
    type: event?.data?.type || "Annual",
    allDay: event ? !!event.allDay : false,
    start: leaveDateKey(event?.start || date),
    end: leaveDateKey(event ? (event.allDay ? addDays(event.end, -1) : event.end) : date),
    from: event && !event.allDay ? leaveFormat(event.start, "HH:mm") : "09:00",
    to: event && !event.allDay ? leaveFormat(event.end, "HH:mm") : "09:30",
    cover: event?.data?.cover || "",
    people: event?.data?.people || [],
    description: event?.data?.description || "",
  };
}
