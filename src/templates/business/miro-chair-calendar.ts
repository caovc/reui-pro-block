import { useMemo } from "react";
import { useEventCalendarState } from "@/components/reui/event-calendar/event-calendar";
import type { MiroChair } from "./miro-settings-data";
import {
  deriveMiroChairEvents,
  deriveMiroChairResources,
  miroChairInitialDate,
  type MiroChairBooking,
  type MiroChairEventData,
} from "./miro-chair-board-model";

// These public options are stable: the free store compares them by reference.
const chairViews: Array<"resource" | "week"> = ["resource", "week"];
const chairInteractions = { drag: false, resize: false, selectSlot: false };
const chairI18n = { viewNames: { resource: "Day" } };

export function useMiroChairCalendar({
  appointments,
  chairs,
  hours,
  query = "",
  statuses,
  onCreate,
}: {
  appointments: readonly MiroChairBooking[];
  chairs: readonly MiroChair[];
  hours: { opens: number; closes: number };
  query?: string;
  statuses?: readonly string[];
  onCreate?: () => void;
}) {
  const events = useMemo(
    () => deriveMiroChairEvents(appointments, chairs, query, statuses),
    [appointments, chairs, query, statuses],
  );
  const resources = useMemo(() => deriveMiroChairResources(chairs), [chairs]);
  const initialDate = useMemo(() => miroChairInitialDate(), []);
  return useEventCalendarState<MiroChairEventData>({
    events,
    resources,
    defaultDate: initialDate,
    defaultView: "resource",
    views: chairViews,
    weekStartsOn: 0,
    dayStartHour: hours.opens,
    dayEndHour: hours.closes,
    slotDuration: 15,
    interactions: chairInteractions,
    onSlotClick: onCreate ? () => onCreate() : undefined,
    i18n: chairI18n,
  });
}
