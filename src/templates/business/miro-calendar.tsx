import { miroChairColors } from "./miro-settings-data";
import type { MiroCalendarChairs, MiroCalendarHours } from "./miro-settings-integration";
import { EventCalendar } from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import { EventCalendarNav } from "@/components/reui/event-calendar/event-calendar-nav";
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types";
import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./shared";
import { Tone } from "./fidelity";
const appointmentEvents = [
  {
    day: 0,
    time: "9:00 AM",
    top: 0,
    length: 90,
    title: "Consent Forms Review",
    category: "Insurance",
    detail: "Paperwork",
    color: "amber",
  },
  {
    day: 0,
    time: "1:00 PM",
    top: 240,
    length: 60,
    title: "Weekly Clinical Standup",
    category: "Meeting",
    detail: "",
    color: "blue",
  },
  {
    day: 1,
    time: "10:00 AM",
    top: 60,
    length: 60,
    title: "Introductory Call",
    category: "Call",
    detail: "",
    color: "green",
  },
  {
    day: 1,
    time: "10:30 AM",
    top: 90,
    length: 90,
    title: "Katherine Chen Plan Review",
    category: "Call",
    detail: "Katherine Chen",
    color: "green",
  },
  {
    day: 2,
    time: "9:00 AM",
    top: 0,
    length: 60,
    title: "Certificate Chase",
    category: "Recall",
    detail: "",
    color: "violet",
  },
  {
    day: 2,
    time: "3:00 PM",
    top: 360,
    length: 105,
    title: "Case Review Debrief",
    category: "Call",
    detail: "Katherine Chen",
    color: "green",
  },
  {
    day: 3,
    time: "10:00 AM",
    top: 60,
    length: 75,
    title: "Watchlist Prep",
    category: "Task",
    detail: "Tasks　3/6",
    color: "neutral",
  },
  {
    day: 3,
    time: "1:30 PM",
    top: 270,
    length: 120,
    title: "Caseload Review",
    category: "Meeting",
    detail: "Internal",
    color: "blue",
  },
  {
    day: 4,
    time: "9:00 AM",
    top: 0,
    length: 75,
    title: "Camila Rosenthal Kickoff",
    category: "Meeting",
    detail: "Camila Rosenthal",
    color: "blue",
  },
  {
    day: 4,
    time: "11:30 AM",
    top: 150,
    length: 105,
    title: "Consent Docs Follow Up",
    category: "Recall",
    detail: "Oliver Lindqvist",
    color: "violet",
  },
  {
    day: 4,
    time: "3:00 PM",
    top: 360,
    length: 75,
    title: "Aftercare Handover",
    category: "Insurance",
    detail: "Paperwork　2/4",
    color: "amber",
  },
];
type Booking = {
  patient: string;
  procedure: string;
  doctor: string;
  time: string;
  end?: string;
  date?: string;
  status: string;
};
export function Agenda({
  onCreate,
  bookings = [],
}: {
  onCreate: () => void;
  bookings?: Booking[];
}) {
  return (
    <>
      <div className="bt-row">
        <strong>Agenda</strong>
        <CalendarDays size={16} />
      </div>
      {["MONDAY, OCT 19", "TUESDAY, OCT 20", "WEDNESDAY, OCT 21", "TODAY", "TOMORROW"].map(
        (day, i) => (
          <section className="bt-agenda-group" key={day}>
            <h3>{day}</h3>
            {appointmentEvents
              .filter((e) => e.day === i)
              .map((e) => (
                <div key={e.title}>
                  <strong>{e.title}</strong>
                  <small>
                    {e.time} · {e.length} min
                  </small>
                  <span>
                    <Tone tone={e.color}>{e.category}</Tone>　3 attendees
                  </span>
                </div>
              ))}
          </section>
        ),
      )}
      {bookings.length > 0 && (
        <section className="bt-agenda-group">
          <h3>NEW BOOKINGS</h3>
          {bookings.map((b, i) => (
            <div key={i}>
              <strong>
                {b.patient} ({b.procedure})
              </strong>
              <small>
                {b.date} · {b.time}
              </small>
              <Tone tone="green">{b.status}</Tone>
            </div>
          ))}
        </section>
      )}
      <Button onClick={onCreate}>
        <Plus />
        New Appointment
      </Button>
    </>
  );
}
export function AppointmentCalendar({
  onCreate,
  bookings = [],
  hours,
  chairs,
}: {
  onCreate: () => void;
  bookings?: Booking[];
  hours?: MiroCalendarHours;
  chairs?: MiroCalendarChairs;
}) {
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(() => [
    ...appointmentEvents.map((e, i) => ({
      id: String(i),
      title: e.title,
      start: new Date(2026, 9, 19 + e.day, 9, e.top),
      end: new Date(2026, 9, 19 + e.day, 9, e.top + e.length),
      color: {
        amber: "#edb44a",
        blue: "#5897ef",
        green: "#21b884",
        violet: "#a478e5",
        neutral: "#8b8b93",
      }[e.color],
      data: e,
    })),
    ...[
      "Harriet Pemberton (Implant Fitting)",
      "",
      "Send pre-op notes to Camila",
      "Amara Mitchell insurance certificates",
    ].flatMap((title, i) =>
      title
        ? [
            {
              id: "all-" + i,
              title,
              start: new Date(2026, 9, 19 + i),
              end: new Date(2026, 9, 20 + i),
              allDay: true,
              color: i === 0 ? "#5897ef" : i === 2 ? "#8b8b93" : "#edb44a",
            },
          ]
        : [],
    ),
  ]);
  const [editedBookings, setEditedBookings] = useState<Record<string, CalendarEvent>>({});
  const bookingEvents: CalendarEvent[] = bookings.map((b, i) => {
    const id = "booking-" + i;
    const toDate = (time: string) => {
      const [hm, ampm] = time.split(" ");
      let [h, m] = hm.split(":").map(Number);
      if (ampm) {
        h = (h % 12) + (ampm === "PM" ? 12 : 0);
      }
      const d = new Date((b.date ?? "2026-10-22") + "T00:00:00");
      d.setHours(h, m, 0, 0);
      return d;
    };
    return (
      editedBookings[id] ?? {
        id,
        title: b.patient + " (" + b.procedure + ")",
        start: toDate(b.time),
        end: toDate(b.end ?? "08:30 AM"),
        color: "#5897ef",
        data: b,
      }
    );
  });
  function eventChair(event: CalendarEvent) {
    const data = event.data;
    if (!data || typeof data !== "object" || !("doctor" in data) || typeof data.doctor !== "string")
      return undefined;
    const doctor = data.doctor;
    return chairs?.find((chair) => chair.name === doctor);
  }
  const visibleEvents = [...events, ...bookingEvents].flatMap((event) => {
    const chair = eventChair(event);
    if (chair && !chair.visible) return [];
    const color = chair && miroChairColors.find((item) => item.id === chair.color)?.color;
    return [color ? { ...event, color } : event];
  });
  return (
    <>
      <div className="flex justify-end">
        <Button onClick={onCreate}>
          <Plus />
          New Appointment
        </Button>
      </div>
      <EventCalendar
        className="bt-miro-week"
        events={visibleEvents}
        onEventsChange={(next) => {
          setEvents(next.filter((e) => !e.id.startsWith("booking-")));
          const edited = Object.fromEntries(
            next.filter((e) => e.id.startsWith("booking-")).map((e) => [e.id, e]),
          );
          setEditedBookings((current) => (chairs ? { ...current, ...edited } : edited));
        }}
        defaultDate={new Date(2026, 9, 22)}
        defaultView="week"
        weekStartsOn={1}
        dayStartHour={
          hours?.opens ?? (bookings.some((b) => Number(b.time.split(":")[0]) < 9) ? 8 : 9)
        }
        dayEndHour={hours?.closes ?? 19}
        onEventClick={(o) => setSelected(o.event)}
        onSelectSlot={onCreate}
      >
        <EventCalendarNav />
        <EventCalendarContent />
      </EventCalendar>
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.start.toLocaleString("en-US", {
                weekday: "long",
                hour: "numeric",
                minute: "2-digit",
              })}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
