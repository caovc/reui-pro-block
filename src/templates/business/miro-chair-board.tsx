import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import {
  EventCalendar,
  useEventCalendarSelector,
  type EventCalendarInstance,
} from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import {
  EventCalendarNav,
  EventCalendarNavToday,
  EventCalendarNavPrev,
  EventCalendarNavNext,
  EventCalendarToolbar,
} from "@/components/reui/event-calendar/event-calendar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import type { MiroChair, MiroChairColor } from "./miro-settings-data";
import {
  deriveMiroChairProjection,
  miroChairColor,
  miroChairStatuses,
  type MiroChairBooking,
  type MiroChairEventData,
} from "./miro-chair-board-model";
import "./miro-chair-board.css";

function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
}

export interface MiroChairBoardProps {
  calendar: EventCalendarInstance<MiroChairEventData>;
  appointments: readonly MiroChairBooking[];
  chairs: readonly MiroChair[];
  query?: string;
  onQueryChange?: (query: string) => void;
  statuses?: readonly string[];
  onStatusesChange?: (statuses: string[]) => void;
  onChairChange?: (id: string, patch: { visible?: boolean; color?: MiroChairColor }) => void;
  onCreate: () => void;
  onCheckIn: (booking: MiroChairBooking, index: number) => void;
}
export function MiroChairBoard({
  calendar,
  appointments,
  chairs,
  onCreate,
  onCheckIn,
  query = "",
  onQueryChange,
  statuses,
  onStatusesChange,
  onChairChange,
}: MiroChairBoardProps) {
  const [diagnosticOpen, setDiagnosticOpen] = useState<"unassigned" | "unscheduled" | null>(null);
  const date = useEventCalendarSelector((state) => state.date, { calendar });
  const view = useEventCalendarSelector((state) => state.view, { calendar });
  const events = useEventCalendarSelector((state) => state.events, { calendar });
  const selectedKey = useEventCalendarSelector((state) => state.selection.eventKeys[0] ?? null, {
    calendar,
  });
  const selectedEvent = events.find((event) => selectedKey?.startsWith(`${event.id}::`));
  const bookingIndex = selectedEvent?.data?.bookingIndex;
  const booking = bookingIndex === undefined ? undefined : appointments[bookingIndex];
  const chair = booking ? chairs.find((item) => item.name === booking.doctor) : undefined;
  const visibleChairs = chairs.filter((item) => item.visible);
  const diagnostics = useMemo(
    () => deriveMiroChairProjection(appointments, chairs, query, statuses),
    [appointments, chairs, query, statuses],
  );
  return (
    <>
      <EventCalendar
        calendar={calendar}
        className="miro-chair-calendar"
        scrollMode="contained"
        scrollbars="native"
        scrollToHour={calendar.settings.dayStartHour}
        interval={60}
        renderResourceHeader={({ resource }) => {
          const resourceChair = chairs.find((item) => item.id === resource.id);
          const count = events.filter(
            (event) => event.resourceId === resource.id && isSameDay(event.start, date),
          ).length;
          return (
            <div className="miro-chair-resource">
              <Avatar>
                <AvatarFallback
                  style={{
                    background: `color-mix(in srgb, ${resource.color ?? "var(--muted-foreground)"} 14%, var(--background))`,
                    color: resource.color,
                    border: `1px solid ${resource.color ?? "var(--border)"}`,
                  }}
                >
                  {initials(resource.title)}
                </AvatarFallback>
              </Avatar>
              <span>
                <strong>{resource.title}</strong>
                <small>
                  {count} {count === 1 ? "patient" : "patients"}
                  {resourceChair?.specialty ? ` · ${resourceChair.specialty}` : ""}
                </small>
              </span>
            </div>
          );
        }}
        renderEvent={({ occurrence }) => {
          const index = occurrence.event.data?.bookingIndex;
          const item = index === undefined ? undefined : appointments[index];
          if (!item) return occurrence.event.title;
          return (
            <span className="miro-chair-event-content">
              <span className="miro-chair-event-title">
                <span className="miro-chair-patient-initials" aria-hidden>
                  {initials(item.patient)}
                </span>
                <strong>{item.patient}</strong>
                <span className="miro-chair-status">{item.status}</span>
              </span>
              <span className="miro-chair-event-description">
                {format(occurrence.start, "h:mm a")} · {item.procedure}
              </span>
            </span>
          );
        }}
      >
        <EventCalendarNav className="miro-chair-nav">
          <EventCalendarToolbar>
            <EventCalendarNavToday />
            <EventCalendarNavPrev />
            <EventCalendarNavNext />
          </EventCalendarToolbar>
          <EventCalendarToolbar>
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(next) => {
                if (next === "resource" || next === "week") calendar.api.setView(next);
              }}
              variant="outline"
              spacing={0}
              aria-label="Chair calendar view"
            >
              <ToggleGroupItem value="resource">Day</ToggleGroupItem>
              <ToggleGroupItem value="week">Week</ToggleGroupItem>
            </ToggleGroup>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Choose chairs">
                  Choose chairs
                  <Badge variant="secondary" size="sm">
                    {visibleChairs.length}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="reui-reference miro-chair-controls" align="end">
                <p>Choose chairs</p>
                {chairs.map((item) => (
                  <label key={item.id} className="miro-chair-control-option">
                    <Checkbox
                      checked={item.visible}
                      disabled={!onChairChange}
                      onCheckedChange={(checked) =>
                        onChairChange?.(item.id, { visible: checked === true })
                      }
                    />
                    <span
                      className="miro-chair-control-swatch"
                      style={{ backgroundColor: miroChairColor(item) }}
                      aria-hidden
                    />
                    <span>{item.name}</span>
                  </label>
                ))}
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Filters">
                  Filters
                  <Badge variant="secondary" size="sm">
                    {statuses?.length ?? miroChairStatuses.length}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="reui-reference miro-chair-controls" align="end">
                <label htmlFor="miro-chair-search">Search appointments</label>
                <Input
                  id="miro-chair-search"
                  value={query}
                  readOnly={!onQueryChange}
                  onChange={(event) => onQueryChange?.(event.target.value)}
                  placeholder="Search patient, practitioner or procedure"
                />
                <p>Appointment status</p>
                {miroChairStatuses.map((status) => (
                  <label key={status} className="miro-chair-control-option">
                    <Checkbox
                      checked={!statuses || statuses.includes(status)}
                      disabled={!onStatusesChange}
                      onCheckedChange={(checked) => {
                        const current = statuses ?? miroChairStatuses;
                        onStatusesChange?.(
                          checked === true
                            ? [...current.filter((item) => item !== status), status]
                            : current.filter((item) => item !== status),
                        );
                      }}
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </PopoverContent>
            </Popover>
            {(
              [
                ["unassigned", "Unassigned bookings"],
                ["unscheduled", "Unscheduled bookings"],
              ] as const
            ).map(
              ([kind, label]) =>
                diagnostics[kind].length > 0 && (
                  <Popover
                    key={kind}
                    open={diagnosticOpen === kind}
                    onOpenChange={(open) => setDiagnosticOpen(open ? kind : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        {label}
                        <Badge variant="secondary" size="sm">
                          {diagnostics[kind].length}
                        </Badge>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="reui-reference miro-chair-diagnostics"
                      align="end"
                      aria-label={label}
                    >
                      <p>
                        {kind === "unassigned"
                          ? "These appointments have no matching chair. Their scheduled times are available in Week view."
                          : "These appointments need valid scheduling details before they can appear on the calendar."}
                      </p>
                      <ItemGroup>
                        {diagnostics[kind].map(({ bookingIndex: index, reason }) => {
                          const item = appointments[index];
                          const event = diagnostics.events.find(
                            (candidate) => candidate.data?.bookingIndex === index,
                          );
                          return (
                            <Item key={`booking-${index}`} variant="outline">
                              <ItemContent>
                                <ItemTitle>{item.patient}</ItemTitle>
                                <ItemDescription>
                                  {item.procedure} · {item.doctor || "Practitioner not assigned"}
                                  <br />
                                  {item.date ?? "2026-10-22"} · {item.time || "Start time missing"}
                                  {item.end ? ` – ${item.end}` : ""}
                                  <br />
                                  {item.status}
                                  <br />
                                  {reason}
                                </ItemDescription>
                              </ItemContent>
                              {event && (
                                <ItemActions>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      calendar.api.goTo(event.start);
                                      calendar.api.setView("week");
                                      setDiagnosticOpen(null);
                                    }}
                                  >
                                    View in Week
                                  </Button>
                                </ItemActions>
                              )}
                            </Item>
                          );
                        })}
                      </ItemGroup>
                    </PopoverContent>
                  </Popover>
                ),
            )}
          </EventCalendarToolbar>
        </EventCalendarNav>
        <EventCalendarContent />
      </EventCalendar>
      <Sheet
        open={Boolean(booking)}
        onOpenChange={(open) => {
          if (!open) calendar.api.clearSelection();
        }}
      >
        <SheetContent
          className="reui-reference miro-chair-preview"
          aria-describedby="miro-chair-preview-description"
        >
          <SheetHeader>
            <SheetTitle>{booking?.patient ?? "Appointment"}</SheetTitle>
            <SheetDescription id="miro-chair-preview-description">
              {booking?.procedure ?? "Appointment details"}
            </SheetDescription>
          </SheetHeader>
          {booking && selectedEvent && (
            <div className="miro-chair-preview-body">
              <Badge variant="secondary">{booking.status}</Badge>
              <dl>
                <dt>Practitioner</dt>
                <dd>{booking.doctor}</dd>
                <dt>Specialty</dt>
                <dd>{chair?.specialty ?? "—"}</dd>
                <dt>Date</dt>
                <dd>{format(selectedEvent.start, "EEEE, MMMM d, yyyy")}</dd>
                <dt>Time</dt>
                <dd>
                  {format(selectedEvent.start, "h:mm a")} – {format(selectedEvent.end, "h:mm a")}
                </dd>
                <dt>Duration</dt>
                <dd>
                  {Math.round(
                    (selectedEvent.end.getTime() - selectedEvent.start.getTime()) / 60_000,
                  )}{" "}
                  minutes
                </dd>
                <dt>Room</dt>
                <dd>{booking.room || "—"}</dd>
              </dl>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => calendar.api.clearSelection()}>
              Close
            </Button>
            {booking && bookingIndex !== undefined && (
              <Button
                onClick={() => {
                  onCheckIn(booking, bookingIndex);
                  calendar.api.clearSelection();
                }}
              >
                Check in
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {!visibleChairs.length && (
        <div className="miro-chair-no-resources">
          <p>No visible chairs. Choose a chair in the sidebar to display its appointments.</p>
          <Button variant="outline" onClick={onCreate}>
            New Booking
          </Button>
        </div>
      )}
    </>
  );
}
