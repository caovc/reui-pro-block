import { useMemo, useState } from "react";
import { EventCalendar } from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import { EventCalendarNav } from "@/components/reui/event-calendar/event-calendar-nav";
import type {
  CalendarEvent,
  EventCalendarOccurrence,
  EventCalendarSlotInfo,
} from "@/components/reui/event-calendar/event-calendar-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, Avatar } from "./shared";
import { ChevronDown } from "lucide-react";
import { TZDate } from "@date-fns/tz";

export const rosterCalendarTimeZone = "Asia/Shanghai";
export type RosterCalendarEvent = CalendarEvent<{ notes?: string }>;

export function RosterCalendar({
  events,
  additions,
  onOpen,
  onCreate,
}: {
  events: Record<number, string>;
  additions: RosterCalendarEvent[];
  onOpen: (occurrence: EventCalendarOccurrence<{ notes?: string }>) => void;
  onCreate: (slot: EventCalendarSlotInfo) => void;
}) {
  const [timeOff, setTimeOff] = useState(true);
  const [team, setTeam] = useState(true);
  const [moved, setMoved] = useState<Record<string, { start: Date; end: Date }>>({});
  const calendarEvents = useMemo<RosterCalendarEvent[]>(
    () =>
      Object.entries(events)
        .filter(([, title]) => (title.includes("leave") ? timeOff : team))
        .map<RosterCalendarEvent>(([key, title]) => ({
          id: key,
          title,
          start: moved[key]?.start ?? new TZDate(2026, 6, Number(key) - 1, rosterCalendarTimeZone),
          end:
            moved[key]?.end ??
            new TZDate(
              2026,
              6,
              Number(key) +
                (title.includes("Ingrid")
                  ? 1
                  : title.includes("Priya")
                    ? 2
                    : title.includes("Abena")
                      ? 3
                      : 0),
              rosterCalendarTimeZone,
            ),
          allDay: true,
          color: title.includes("leave") ? "#f59e0b" : "#10b981",
        }))
        .concat(
          timeOff
            ? [
                {
                  id: "marco",
                  title: "Marco Bianchi: annual leave",
                  start: moved.marco?.start ?? new TZDate(2026, 7, 3, rosterCalendarTimeZone),
                  end: moved.marco?.end ?? new TZDate(2026, 7, 7, rosterCalendarTimeZone),
                  allDay: true,
                  color: "#f59e0b",
                },
              ]
            : [],
        )
        .concat(
          team
            ? [
                {
                  id: "checkin",
                  title: "Week 3 check-in",
                  start: moved.checkin?.start ?? new TZDate(2026, 6, 27, rosterCalendarTimeZone),
                  end: moved.checkin?.end ?? new TZDate(2026, 6, 28, rosterCalendarTimeZone),
                  allDay: true,
                  color: "#10b981",
                },
              ]
            : [],
        )
        .concat(
          team
            ? additions.map((event) => ({
                ...event,
                start: moved[event.id]?.start ?? event.start,
                end: moved[event.id]?.end ?? event.end,
              }))
            : [],
        ),
    [events, additions, timeOff, team, moved],
  );
  return (
    <EventCalendar
      className="ct-roster-calendar"
      events={calendarEvents}
      defaultDate={new TZDate(2026, 6, 1, rosterCalendarTimeZone)}
      defaultView="month"
      views={["month", "week", "day", "agenda"]}
      weekStartsOn={1}
      fixedWeeks
      timeZone={rosterCalendarTimeZone}
      onEventClick={onOpen}
      onSlotClick={onCreate}
      onEventUpdate={(update) => {
        setMoved((m) => ({ ...m, [update.event.id]: { start: update.start, end: update.end } }));
        return true;
      }}
      renderEvent={({ occurrence }) => (
        <>
          <span className="ct-event-dot" />
          <span className="truncate font-medium">{occurrence.event.title}</span>
          {occurrence.event.title.includes(":") && (
            <span className="ml-auto">
              <Avatar name={occurrence.event.title.split(":")[0]} />
            </span>
          )}
        </>
      )}
      maxEventsPerCell={2}
    >
      <div className="ct-calendar-toolbar">
        <EventCalendarNav />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <span className="ct-stream-dots" />
              Streams
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={timeOff} onCheckedChange={setTimeOff}>
              Time off
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={team} onCheckedChange={setTeam}>
              Team events
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EventCalendarContent />
    </EventCalendar>
  );
}
