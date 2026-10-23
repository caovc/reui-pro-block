import { useMemo, useState } from "react";
import { EventCalendar } from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import {
  EventCalendarNav,
  EventCalendarNavToday,
  EventCalendarViewSwitcher,
  EventCalendarNavPrev,
  EventCalendarNavNext,
  EventCalendarTitle,
} from "@/components/reui/event-calendar/event-calendar-nav";
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types";
import { Choice } from "./fidelity";
const leave = [
  ["Aisha Rahman: annual leave", 10, 11],
  ["Ingrid Larsen: annual leave", 13, 15],
  ["Abena Mensah: parental leave", 27, 31],
  ["Priya Nair: annual leave", 29, 32],
  ["Marco Bianchi: annual leave", 34, 38],
] as const;
const meetings = [
  ["Weekly leads sync", 20],
  ["Screening: Senior Engineer", 21],
  ["Weekly 1:1", 22],
  ["Panel: Support Engineer", 23],
  ["Week 3 check-in", 27],
  ["H2 calibration: Engineering", 28],
  ["First day: Joon-ho Park", 34],
  ["Assessment debrief: Senior Engineer", 35],
  ["Screening: Product Manager", 36],
] as const;
export default function CohortCalendar({
  onEvent,
  extraEvents = [],
}: {
  onEvent: (title: string) => void;
  extraEvents?: string[];
}) {
  const [stream, setStream] = useState("Streams");
  const seed = useMemo<CalendarEvent[]>(
    () => [
      ...leave.map(([title, start, end], i) => ({
        id: "leave-" + i,
        title,
        start: new Date(2026, 6, start),
        end: new Date(2026, 6, end),
        allDay: true,
        color: "#ed9854",
      })),
      ...meetings.map(([title, day], i) => ({
        id: "work-" + i,
        title,
        start: new Date(2026, 6, day, 9),
        end: new Date(2026, 6, day, 10),
        color: "#24b884",
      })),
      ...extraEvents.map((title, i) => ({
        id: "new-" + i,
        title,
        start: new Date(2026, 6, 24, 10),
        end: new Date(2026, 6, 24, 11),
        color: "#24b884",
      })),
    ],
    [extraEvents],
  );
  const [updated, setUpdated] = useState<CalendarEvent[] | null>(null);
  return (
    <EventCalendar
      className="bt-official-calendar"
      defaultDate={new Date(2026, 6, 18)}
      defaultView="month"
      weekStartsOn={1}
      fixedWeeks
      events={(updated ?? seed).filter(
        (e) => stream === "Streams" || (stream === "Time off" ? e.allDay : !e.allDay),
      )}
      onEventsChange={setUpdated}
      onEventClick={(o) => onEvent(o.event.title)}
      renderEvent={({ occurrence }) => (
        <span className="truncate font-normal">{occurrence.event.title}</span>
      )}
      classNames={{ monthRow: "min-h-[106px]", monthDayNumber: "text-xs", nav: "px-4 py-2" }}
    >
      <EventCalendarNav>
        <EventCalendarNavToday />
        <EventCalendarViewSwitcher />
        <EventCalendarNavPrev />
        <EventCalendarNavNext />
        <EventCalendarTitle className="ml-3" />
        <div className="grow" />
        <Choice
          label="Streams"
          value={stream}
          onChange={setStream}
          options={["Streams", "Time off", "Meetings"]}
        />
      </EventCalendarNav>
      <EventCalendarContent />
    </EventCalendar>
  );
}
