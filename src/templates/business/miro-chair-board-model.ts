import type {
  CalendarEvent,
  EventCalendarResource,
} from "@/components/reui/event-calendar/event-calendar-types";
import { miroChairColors, miroProcedures, type MiroChair } from "./miro-settings-data";

export interface MiroChairBooking {
  patient: string;
  procedure: string;
  doctor: string;
  time: string;
  status: string;
  date?: string;
  end?: string;
  room?: string;
}
export interface MiroChairEventData {
  bookingIndex: number;
}

export function miroChairInitialDate() {
  return new Date(2026, 9, 22);
}

function localBookingTime(date: string | undefined, time: string): Date | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? "2026-10-22");
  const clock = /^(\d{1,2}):(\d{2})(?: (AM|PM))?$/.exec(time);
  if (!day || !clock) return null;
  const [year, month, dateNumber] = day.slice(1).map(Number);
  const sourceHour = Number(clock[1]);
  const minute = Number(clock[2]);
  const meridiem = clock[3];
  if (minute > 59 || (meridiem ? sourceHour < 1 || sourceHour > 12 : sourceHour > 23)) return null;
  const hour = meridiem ? (sourceHour % 12) + (meridiem === "PM" ? 12 : 0) : sourceHour;
  const result = new Date(year, month - 1, dateNumber, hour, minute);
  return result.getFullYear() === year &&
    result.getMonth() === month - 1 &&
    result.getDate() === dateNumber
    ? result
    : null;
}
export function miroChairColor(chair: Pick<MiroChair, "color">) {
  return (
    miroChairColors.find((item) => item.id === chair.color)?.color ?? "var(--muted-foreground)"
  );
}
export function deriveMiroChairResources(chairs: readonly MiroChair[]): EventCalendarResource[] {
  return chairs
    .filter((chair) => chair.visible)
    .map((chair) => ({ id: chair.id, title: chair.name, color: miroChairColor(chair) }));
}
const statusColors: Record<string, string> = {
  Completed: "#10b981",
  "In Chair": "#8b5cf6",
  Arrived: "#38bdf8",
  Booked: "#64748b",
  Unpaid: "#f59e0b",
  Cancelled: "#ef4444",
};
export const miroChairStatuses = Object.keys(statusColors);
export interface MiroChairDiagnostic {
  bookingIndex: number;
  reason: string;
}
export interface MiroChairProjection {
  events: CalendarEvent<MiroChairEventData>[];
  unassigned: MiroChairDiagnostic[];
  unscheduled: MiroChairDiagnostic[];
}

/** Owner records stay intact. Unmatched resources remain visible in Week and
 * invalid scheduling inputs remain visible through diagnostic projections. */
export function deriveMiroChairProjection(
  appointments: readonly MiroChairBooking[],
  chairs: readonly MiroChair[],
  query = "",
  statuses?: readonly string[],
): MiroChairProjection {
  const search = query.trim().toLowerCase();
  const result: MiroChairProjection = { events: [], unassigned: [], unscheduled: [] };
  appointments.forEach((booking, bookingIndex) => {
    const chair = chairs.find((item) => item.name === booking.doctor);
    if (chair && !chair.visible) return;
    if (statuses && !statuses.includes(booking.status)) return;
    if (
      search &&
      !`${booking.patient} ${booking.procedure} ${booking.doctor} ${booking.status}`
        .toLowerCase()
        .includes(search)
    )
      return;
    const start = localBookingTime(booking.date, booking.time);
    const minutes = miroProcedures.find(
      (procedure) => procedure.name === booking.procedure,
    )?.minutes;
    const end = booking.end
      ? localBookingTime(booking.date, booking.end)
      : start && minutes
        ? new Date(start.getTime() + minutes * 60_000)
        : null;
    if (!start || !end || end <= start) {
      result.unscheduled.push({
        bookingIndex,
        reason: !start
          ? "Date or start time needs attention"
          : !booking.end && !minutes
            ? "End time or procedure duration is missing"
            : "End time needs attention",
      });
      return;
    }
    result.events.push({
      id: `booking-${bookingIndex}`,
      title: booking.patient,
      start,
      end,
      resourceId: chair?.id,
      color: statusColors[booking.status] ?? "#64748b",
      draggable: false,
      resizable: false,
      data: { bookingIndex },
    });
    if (!chair)
      result.unassigned.push({ bookingIndex, reason: "Practitioner has no matching chair" });
  });
  return result;
}

export function deriveMiroChairEvents(
  appointments: readonly MiroChairBooking[],
  chairs: readonly MiroChair[],
  query = "",
  statuses?: readonly string[],
): CalendarEvent<MiroChairEventData>[] {
  return deriveMiroChairProjection(appointments, chairs, query, statuses).events;
}
