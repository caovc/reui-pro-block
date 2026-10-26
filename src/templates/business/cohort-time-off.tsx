/* eslint-disable react/only-export-components */
import { useState } from "react";
import { Plus } from "lucide-react";
import { addDays, eachDayOfInterval, format } from "date-fns";
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
import { CalendarSelect } from "@/components/reui/calendar-select";
import { TimePicker, TimePickerTrigger, TimePickerContent } from "@/components/reui/time-picker";
import { TinyAvatar } from "@/blocks/data/grid-advanced-shared";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button, Input, toast } from "./shared";
import { Choice } from "./fidelity";
type LeaveData = {
  type: string;
  person: string;
  reason: string;
  cover: string;
  guests: string;
  description: string;
  status: string;
};
type LeaveEvent = CalendarEvent<LeaveData>;
const colors: Record<string, string> = {
  Annual: "#ff9800",
  Sick: "#3282fa",
  Parental: "#8c51ff",
  Unpaid: "#08bd8c",
};
const makeEvent = (person: string, type: string, start: number, end: number): LeaveEvent => ({
  id: person,
  title: `${person}: ${type}`,
  start: new Date(2026, 6, start),
  end: new Date(2026, 6, end),
  allDay: true,
  color: colors[type],
  data: {
    type,
    person,
    reason: `${type} leave`,
    cover: "",
    guests: "",
    description: "",
    status: start >= 27 && start <= 30 ? "Pending" : "Approved",
  },
});
const initialEvents = [
  makeEvent("Aisha Rahman", "Annual", 10, 12),
  makeEvent("Ingrid Larsen", "Annual", 13, 16),
  makeEvent("Abena Mensah", "Parental", 27, 32),
  makeEvent("Priya Nair", "Annual", 29, 33),
  makeEvent("Lucas Moreau", "Sick", 30, 33),
  makeEvent("Marco Bianchi", "Annual", 34, 39),
];
export function useCohortLeaveState() {
  const [events, setEvents] = useState<LeaveEvent[]>(initialEvents);
  const [date, setDate] = useState(new Date(2026, 6, 30, 12));
  return { events, setEvents, date, setDate, reset: () => setEvents(initialEvents) };
}
type LeaveModel = ReturnType<typeof useCohortLeaveState>;
const dateKey = (date: Date) => format(date, "yyyy-MM-dd");
function LeaveDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(`${value}T12:00`);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="justify-start font-normal"
          aria-label={label}
        >
          {format(date, "MMMM do, yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <CalendarSelect
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(selected) => {
            if (!selected) return;
            onChange(dateKey(selected));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
const newDraft = (date: Date) => ({
  reason: "",
  type: "Annual",
  allDay: false,
  start: dateKey(date),
  end: dateKey(date),
  from: "09:00",
  to: "09:30",
  cover: "",
  guests: "",
  description: "",
});
export function CohortTimeOff({
  model,
  leaveTypes,
  onLeaveTypes,
}: {
  model: LeaveModel;
  leaveTypes: string[];
  onLeaveTypes: () => void;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveEvent | null>(null);
  const [draft, setDraft] = useState(newDraft(model.date));
  const types = [...new Set([...Object.keys(colors), ...leaveTypes])];
  function create(date = model.date) {
    setEditing(null);
    setDraft(newDraft(date));
    setOpen(true);
  }
  function edit(event: LeaveEvent) {
    setEditing(event);
    setDraft({
      reason: event.data?.reason || event.title,
      type: event.data?.type || "Annual",
      allDay: !!event.allDay,
      start: dateKey(event.start),
      end: dateKey(event.allDay ? addDays(event.end, -1) : event.end),
      from: format(event.start, "HH:mm"),
      to: format(event.end, "HH:mm"),
      cover: event.data?.cover || "",
      guests: event.data?.guests || "",
      description: event.data?.description || "",
    });
    setOpen(true);
  }
  const upcoming = model.events
    .filter(
      (event) =>
        event.start >= new Date(2026, 6, 27) && !hidden.includes(event.data?.type || "Annual"),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 4);
  const outToday = model.events.filter(
    (event) => event.start <= model.date && event.end > model.date,
  ).length;
  return (
    <div className="bt-cohort-time-off">
      <h1>Time off</h1>
      <p>
        {outToday} out today, {model.events.filter((e) => e.data?.status === "Pending").length}{" "}
        awaiting a decision
      </p>
      <EventCalendar
        className="bt-leave-calendar"
        date={model.date}
        onDateChange={model.setDate}
        defaultView="month"
        weekStartsOn={1}
        fixedWeeks
        events={model.events.filter((e) => !hidden.includes(e.data?.type || "Annual"))}
        onEventsChange={(events) => {
          const visibleIds = new Set(events.map((e) => e.id));
          model.setEvents((old) => [
            ...old.filter(
              (e) => hidden.includes(e.data?.type || "Annual") && !visibleIds.has(e.id),
            ),
            ...events,
          ]);
        }}
        onEventClick={(occurrence) => edit(occurrence.event)}
        onSlotClick={(slot) => create(slot.date)}
        onSelectSlot={(slot) => {
          create(slot.start);
          setDraft({
            ...newDraft(slot.start),
            end: dateKey(slot.allDay ? addDays(slot.end, -1) : slot.end),
            from: slot.allDay ? "09:00" : format(slot.start, "HH:mm"),
            to: slot.allDay ? "09:30" : format(slot.end, "HH:mm"),
            allDay: slot.allDay,
          });
        }}
        renderEvent={({ occurrence }) => (
          <span className="bt-leave-event-label">
            <i style={{ background: occurrence.event.color }} />
            <span>{occurrence.event.title}</span>
            <TinyAvatar name={occurrence.event.data?.person || "Bruno Duarte"} />
          </span>
        )}
        classNames={{
          nav: "bt-leave-nav",
          monthRow: "bt-leave-month-row",
          monthCellContent: "bt-leave-cell-content",
          monthDayNumber: "bt-leave-day-number",
          event: "bt-leave-event",
        }}
      >
        <EventCalendarNav>
          <EventCalendarNavToday />
          <EventCalendarViewSwitcher />
          <EventCalendarNavPrev />
          <EventCalendarNavNext />
          <EventCalendarTitle />
          <div className="grow" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bt-leave-mobile-filter" size="sm" variant="outline">
                Calendars
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Calendars</DropdownMenuLabel>
              {types.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={!hidden.includes(type)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) =>
                    setHidden((old) =>
                      checked ? old.filter((value) => value !== type) : [...old, type],
                    )
                  }
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onLeaveTypes}>New leave type</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bt-leave-book-trigger" size="sm" onClick={() => create()}>
            <Plus size={14} />
            Book leave
          </Button>
        </EventCalendarNav>
        <div className="bt-leave-calendar-body">
          <aside>
            <CalendarSelect
              mode="single"
              selected={model.date}
              month={model.date}
              onMonthChange={model.setDate}
              onSelect={(date) => date && model.setDate(date)}
              captionLayout="label"
              weekStartsOn={1}
              modifiers={{
                leave: model.events.flatMap((event) =>
                  eachDayOfInterval({
                    start: event.start,
                    end: event.allDay ? addDays(event.end, -1) : event.end,
                  }),
                ),
              }}
              modifiersClassNames={{ leave: "bt-leave-marked-day" }}
              classNames={{ month_caption: "flex h-8 w-full items-center justify-center px-8" }}
            />
            <h3>Up Next</h3>
            <div className="bt-leave-upcoming">
              {upcoming.map((event) => (
                <button key={event.id} onClick={() => edit(event)}>
                  <i style={{ background: event.color }} />
                  <span>
                    {event.title}
                    <small>
                      {format(event.start, "EEE, MMM d")} ·{" "}
                      {event.allDay ? "All day" : format(event.start, "h:mm a")}
                    </small>
                  </span>
                </button>
              ))}
            </div>
            <h3>Leave types</h3>
            <div className="bt-leave-types">
              {types.map((type) => (
                <label key={type}>
                  <Checkbox
                    aria-label={`Show ${type} leave`}
                    checked={!hidden.includes(type)}
                    onCheckedChange={(checked) =>
                      setHidden((old) =>
                        checked ? old.filter((value) => value !== type) : [...old, type],
                      )
                    }
                  />
                  {type}
                </label>
              ))}
              <Button size="sm" variant="ghost" onClick={onLeaveTypes}>
                <Plus size={14} />
                New leave type
              </Button>
            </div>
          </aside>
          <EventCalendarContent />
        </div>
      </EventCalendar>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bt-floating-sheet bt-leave-editor">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit leave" : "Book leave"}</SheetTitle>
            <SheetDescription className="sr-only">
              {editing ? "Update this leave booking." : "Add a new event to your calendar."}
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const start = new Date(`${draft.start}T${draft.allDay ? "00:00" : draft.from}`);
              const end = draft.allDay
                ? addDays(new Date(`${draft.end}T00:00`), 1)
                : new Date(`${draft.end}T${draft.to}`);
              if (end <= start) {
                toast.error("End must be after the start");
                return;
              }
              const event: LeaveEvent = {
                id: editing?.id || `leave-${Date.now()}`,
                title: editing ? `${editing.data?.person}: ${draft.type}` : draft.reason,
                start,
                end,
                allDay: draft.allDay,
                color: colors[draft.type] || "#8c51ff",
                data: {
                  type: draft.type,
                  person: editing?.data?.person || "Bruno Duarte",
                  reason: draft.reason,
                  cover: draft.cover,
                  guests: draft.guests,
                  description: draft.description,
                  status: editing?.data?.status || "Pending",
                },
              };
              model.setEvents((old) =>
                editing
                  ? old.map((item) => (item.id === editing.id ? event : item))
                  : [...old, event],
              );
              setOpen(false);
              toast.success(editing ? "Leave updated" : "Leave booked");
            }}
          >
            <div className="bt-leave-form">
              <label>
                Reason
                <Input
                  aria-label="Leave reason"
                  placeholder="Annual leave"
                  required
                  value={draft.reason}
                  onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
                />
              </label>
              <label>
                Leave type
                <Choice
                  label="Leave type"
                  value={draft.type}
                  options={types}
                  onChange={(type) => setDraft({ ...draft, type })}
                />
              </label>
              <label className="bt-leave-all-day">
                All day
                <Switch
                  aria-label="All day leave"
                  checked={draft.allDay}
                  onCheckedChange={(allDay) => setDraft({ ...draft, allDay })}
                />
              </label>
              <div className="bt-leave-date-pair">
                <label>
                  Starts
                  <LeaveDateField
                    label="Leave start date"
                    value={draft.start}
                    onChange={(start) => setDraft({ ...draft, start })}
                  />
                </label>
                <label>
                  Ends
                  <LeaveDateField
                    label="Leave end date"
                    value={draft.end}
                    onChange={(end) => setDraft({ ...draft, end })}
                  />
                </label>
              </div>
              {!draft.allDay && (
                <div className="bt-leave-date-pair">
                  {[
                    ["From", "from"],
                    ["To", "to"],
                  ].map(([label, key]) => (
                    <label key={key}>
                      {label}
                      <TimePicker
                        aria-label={`${label} time`}
                        value={draft[key as "from"]}
                        onValueChange={(value) => value && setDraft({ ...draft, [key]: value })}
                        hourCycle={12}
                        minuteStep={30}
                      >
                        <TimePickerTrigger />
                        <TimePickerContent />
                      </TimePicker>
                    </label>
                  ))}
                </div>
              )}
              <label>
                Cover
                <Input
                  aria-label="Leave cover"
                  placeholder="Who is covering"
                  value={draft.cover}
                  onChange={(e) => setDraft({ ...draft, cover: e.target.value })}
                />
              </label>
              <label>
                People
                <Input
                  aria-label="Leave people"
                  placeholder="Add guests..."
                  value={draft.guests}
                  onChange={(e) => setDraft({ ...draft, guests: e.target.value })}
                />
              </label>
              <label>
                Description
                <textarea
                  aria-label="Leave description"
                  placeholder="Add notes or an agenda"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>
            </div>
            <footer className="bt-dialog-actions">
              {editing && (
                <Button
                  type="button"
                  variant="destructive"
                  className="mr-auto"
                  onClick={() => {
                    model.setEvents((old) => old.filter((event) => event.id !== editing.id));
                    setOpen(false);
                    toast.success("Leave cancelled");
                  }}
                >
                  Cancel leave
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save changes" : "Book leave"}</Button>
            </footer>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
