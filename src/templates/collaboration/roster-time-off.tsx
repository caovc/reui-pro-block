import { useMemo, useRef, useState } from "react";
import { addDays, addMinutes, differenceInCalendarDays } from "date-fns";
import { Plus } from "lucide-react";
import { EventCalendar } from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import { EventCalendarNav } from "@/components/reui/event-calendar/event-calendar-nav";
import { CalendarSelect } from "@/components/reui/calendar-select";
import { TimePicker, TimePickerContent, TimePickerTrigger } from "@/components/reui/time-picker";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Avatar, Button, Input, Modal, ReferenceSheet } from "./shared";
import { rosterPersonNames } from "./roster-directory-data";
import { rosterCalendarTimeZone } from "./roster-calendar";
import {
  leaveColors,
  leaveDate,
  leaveDateKey,
  leaveDraft,
  leaveFormat,
  type RosterLeaveData,
  type RosterLeaveEvent,
  type RosterTimeOffState,
} from "./roster-time-off-model";
import "./roster-time-off.css";

function LeaveDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-label={label}>
          {leaveFormat(leaveDate(value), "MMMM do, yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="reui-reference w-auto p-2" align="start">
        <CalendarSelect
          mode="single"
          captionLayout="label"
          classNames={{ month_caption: "flex h-8 w-full items-center justify-center px-8" }}
          selected={leaveDate(value)}
          defaultMonth={leaveDate(value)}
          weekStartsOn={1}
          onSelect={(date) => {
            if (date) onChange(leaveDateKey(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// Reuse the installed ReUI free c-combobox-19 chip composition, adapted to
// Roster's original people data; the actual Combobox owns filtering/selection.
function LeavePeople({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const anchor = useComboboxAnchor();
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <Combobox
      multiple
      items={rosterPersonNames}
      value={value}
      onValueChange={onChange}
      open={open}
      onOpenChange={(next) => {
        if (next)
          setContainer(anchor.current?.closest<HTMLElement>('[data-slot="sheet-content"]') || null);
        setOpen(next);
      }}
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(names: string[]) => (
            <>
              {names.map((name) => (
                <ComboboxChip key={name} showRemove>
                  {name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                id="roster-leave-people"
                aria-label="People"
                placeholder="Add guests..."
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor} portalContainer={container} className="reui-reference">
        <ComboboxEmpty>No people found.</ComboboxEmpty>
        <ComboboxList>
          {(name: string) => (
            <ComboboxItem key={name} value={name}>
              <Avatar name={name} />
              {name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function RosterTimeOff({ model }: { model: RosterTimeOffState }) {
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState<RosterLeaveEvent | null>(null);
  const [detail, setDetail] = useState<RosterLeaveEvent | null>(null);
  const [draft, setDraft] = useState(() => leaveDraft(model.date));
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [newType, setNewType] = useState(false);
  const [typeName, setTypeName] = useState("");
  const [typeColor, setTypeColor] = useState(leaveColors[0].value);
  const bookTrigger = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const typeTrigger = useRef<HTMLButtonElement>(null);
  const calendarsTrigger = useRef<HTMLButtonElement>(null);
  const visible = useMemo(
    () => model.events.filter((event) => !model.hidden.includes(event.data!.type)),
    [model.events, model.hidden],
  );
  const upcoming = visible
    .filter((event) => event.end > model.date)
    .toSorted((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 4);
  function create(date = model.date, allDay = false, end?: Date) {
    setEditing(null);
    setError("");
    const next = { ...leaveDraft(date), allDay };
    if (!allDay && end) {
      next.from = leaveFormat(date, "HH:mm");
      next.to = leaveFormat(end, "HH:mm");
      next.end = leaveDateKey(end);
    }
    setDraft(next);
    setEditor(true);
  }
  function edit(event: RosterLeaveEvent) {
    setEditing(event);
    setDraft(leaveDraft(model.date, event));
    setError("");
    setDetail(null);
    setEditor(true);
  }
  function toggle(type: string, checked: boolean) {
    model.setHidden((old) =>
      checked ? old.filter((name) => name !== type) : [...new Set([...old, type])],
    );
  }
  function openNewType() {
    setTypeName("");
    setTypeColor(leaveColors[0].value);
    setError("");
    setNewType(true);
  }
  const detailEnd = detail && (detail.allDay ? addDays(detail.end, -1) : detail.end);
  return (
    <section className="ct-roster-time-off" aria-label="Time off">
      <div className="ct-heading">
        <h1>Time off</h1>
        <p className="ct-roster-leave-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      </div>
      <Frame dense className="ct-roster-leave-frame">
        <FramePanel>
          <EventCalendar<RosterLeaveData>
            className="ct-roster-leave-calendar"
            events={visible}
            date={model.date}
            onDateChange={model.setDate}
            defaultView="month"
            views={["month", "week", "day", "agenda"]}
            weekStartsOn={1}
            fixedWeeks
            timeZone={rosterCalendarTimeZone}
            onEventClick={({ event }) => setDetail(event)}
            onSlotClick={(slot) =>
              create(slot.date, slot.allDay, slot.end || addMinutes(slot.date, 30))
            }
            onEventUpdate={({ event, start, end }) => {
              model.setEvents((old) =>
                old.map((item) => (item.id === event.id ? { ...item, start, end } : item)),
              );
              return true;
            }}
            renderEvent={({ occurrence }) => (
              <>
                <i className="ct-leave-dot" style={{ background: occurrence.event.color }} />
                <span className="min-w-0 truncate">{occurrence.event.title}</span>
                <Avatar name={occurrence.event.data?.person || "Bruno Duarte"} />
              </>
            )}
            maxEventsPerCell={3}
          >
            <div className="ct-roster-leave-toolbar">
              <EventCalendarNav />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={calendarsTrigger}
                    size="sm"
                    variant="outline"
                    className="ct-leave-mobile-calendars"
                  >
                    Calendars
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="reui-reference">
                  {model.types.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type.name}
                      checked={!model.hidden.includes(type.name)}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) => toggle(type.name, checked)}
                    >
                      {type.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={openNewType}>New leave type</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button ref={bookTrigger} size="sm" onClick={() => create()}>
                <Plus />
                Book leave
              </Button>
            </div>
            <div className="ct-roster-leave-body">
              <aside className="ct-roster-leave-aside" aria-label="Leave calendars">
                <CalendarSelect
                  mode="single"
                  captionLayout="label"
                  classNames={{ month_caption: "flex h-8 w-full items-center justify-center px-8" }}
                  weekStartsOn={1}
                  selected={model.date}
                  month={model.date}
                  onMonthChange={model.setDate}
                  onSelect={(date) => date && model.setDate(date)}
                  modifiers={{
                    leave: visible.map((event) => ({
                      from: event.start,
                      to: event.allDay ? addDays(event.end, -1) : event.end,
                    })),
                  }}
                  modifiersClassNames={{ leave: "ct-leave-marked-day" }}
                />
                <h2>Up Next</h2>
                <div className="ct-roster-leave-upcoming">
                  {upcoming.map((event) => (
                    <button key={event.id} type="button" onClick={() => setDetail(event)}>
                      <i className="ct-leave-dot" style={{ background: event.color }} />
                      <span>
                        {event.title}
                        <small>
                          {leaveFormat(event.start, "EEE, MMM d")} ·{" "}
                          {event.allDay ? "All day" : leaveFormat(event.start, "h:mm a")}
                        </small>
                      </span>
                    </button>
                  ))}
                  {upcoming.length === 0 && <p className="ct-muted">No upcoming leave.</p>}
                </div>
                <h2>Leave types</h2>
                <div className="ct-roster-leave-types">
                  {model.types.map((type) => (
                    <label key={type.name}>
                      <Checkbox
                        aria-label={`Show ${type.name} leave`}
                        checked={!model.hidden.includes(type.name)}
                        onCheckedChange={(checked) => toggle(type.name, checked === true)}
                        style={
                          {
                            "--primary": type.color,
                            "--primary-foreground": "white",
                          } as React.CSSProperties
                        }
                      />
                      {type.name}
                    </label>
                  ))}
                  <Button ref={typeTrigger} variant="ghost" size="sm" onClick={openNewType}>
                    <Plus />
                    New leave type
                  </Button>
                </div>
              </aside>
              <EventCalendarContent />
            </div>
          </EventCalendar>
        </FramePanel>
      </Frame>
      <ReferenceSheet
        title={editing ? "Edit leave" : "Book leave"}
        description={editing ? "Update this leave booking." : "Add a new event to your calendar."}
        open={editor}
        onClose={() => setEditor(false)}
        onEscapeKeyDown={(event) => {
          const surface = formRef.current?.closest('[data-slot="sheet-content"]');
          if (surface?.querySelector('[data-slot="combobox-content"][data-open]'))
            event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          bookTrigger.current?.focus();
        }}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditor(false)}>
              Cancel
            </Button>
            <Button type="submit" form="roster-leave-form">
              {editing ? "Save changes" : "Book leave"}
            </Button>
          </>
        }
      >
        <form
          id="roster-leave-form"
          ref={formRef}
          className="ct-roster-leave-form"
          onSubmit={(event) => {
            event.preventDefault();
            const start = leaveDate(draft.start, draft.allDay ? "00:00" : draft.from);
            const end = draft.allDay
              ? addDays(leaveDate(draft.end), 1)
              : leaveDate(draft.end, draft.to);
            if (end <= start) {
              setError("End must be after the start.");
              return;
            }
            if (!draft.reason.trim()) {
              setError("Enter a reason for this leave.");
              return;
            }
            const booking: RosterLeaveEvent = {
              id: editing?.id || `leave-${crypto.randomUUID()}`,
              title:
                editing && editing.title === `${editing.data!.person}: ${editing.data!.type}`
                  ? `${editing.data!.person}: ${draft.type}`
                  : draft.reason.trim(),
              start,
              end,
              allDay: draft.allDay,
              color: model.types.find((type) => type.name === draft.type)?.color,
              data: {
                type: draft.type,
                person: editing?.data?.person || "Bruno Duarte",
                reason: draft.reason.trim(),
                cover: draft.cover.trim(),
                people: draft.people,
                description: draft.description.trim(),
              },
            };
            model.setEvents((old) =>
              editing
                ? old.map((item) => (item.id === editing.id ? booking : item))
                : [...old, booking],
            );
            model.setHidden((old) => old.filter((type) => type !== draft.type));
            model.setDate(start);
            setEditor(false);
            setFeedback(editing ? "Leave updated" : "Leave booked");
          }}
        >
          <label htmlFor="roster-leave-reason">Reason</label>
          <Input
            id="roster-leave-reason"
            placeholder="Annual leave"
            required
            value={draft.reason}
            onChange={(event) => setDraft({ ...draft, reason: event.target.value })}
          />
          <label htmlFor="roster-leave-type">Leave type</label>
          <Select value={draft.type} onValueChange={(type) => setDraft({ ...draft, type })}>
            <SelectTrigger id="roster-leave-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="reui-reference">
              {model.types.map((type) => (
                <SelectItem key={type.name} value={type.name}>
                  <i className="ct-leave-dot" style={{ background: type.color }} />
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ct-roster-leave-all-day">
            <label htmlFor="roster-leave-all-day">All day</label>
            <Switch
              id="roster-leave-all-day"
              checked={draft.allDay}
              onCheckedChange={(allDay) => setDraft({ ...draft, allDay })}
            />
          </div>
          <div className="ct-roster-leave-pair">
            <div>
              <label>Starts</label>
              <LeaveDateField
                label="Leave start date"
                value={draft.start}
                onChange={(start) => setDraft({ ...draft, start })}
              />
            </div>
            <div>
              <label>Ends</label>
              <LeaveDateField
                label="Leave end date"
                value={draft.end}
                onChange={(end) => setDraft({ ...draft, end })}
              />
            </div>
          </div>
          {!draft.allDay && (
            <div className="ct-roster-leave-pair">
              {(["from", "to"] as const).map((key) => (
                <div key={key}>
                  <label>{key === "from" ? "From" : "To"}</label>
                  <TimePicker
                    aria-label={`${key === "from" ? "From" : "To"} time`}
                    value={draft[key]}
                    onValueChange={(value) => value && setDraft({ ...draft, [key]: value })}
                    hourCycle={12}
                    minuteStep={30}
                  >
                    <TimePickerTrigger />
                    <TimePickerContent />
                  </TimePicker>
                </div>
              ))}
            </div>
          )}
          <label htmlFor="roster-leave-cover">Cover</label>
          <Input
            id="roster-leave-cover"
            placeholder="Who is covering"
            value={draft.cover}
            onChange={(event) => setDraft({ ...draft, cover: event.target.value })}
          />
          <label htmlFor="roster-leave-people">People</label>
          <LeavePeople value={draft.people} onChange={(people) => setDraft({ ...draft, people })} />
          <label htmlFor="roster-leave-description">Description</label>
          <Textarea
            id="roster-leave-description"
            placeholder="Add notes or an agenda"
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
        </form>
      </ReferenceSheet>
      <ReferenceSheet
        title={detail?.title || "Leave details"}
        description="Leave details."
        onCloseAutoFocus={(event) => {
          if (editor) event.preventDefault();
        }}
        open={!!detail}
        onClose={() => setDetail(null)}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                if (detail) model.setEvents((old) => old.filter((event) => event.id !== detail.id));
                setDetail(null);
                setFeedback("Leave deleted");
              }}
            >
              Delete
            </Button>
            <Button onClick={() => detail && edit(detail)}>Edit</Button>
          </>
        }
      >
        {detail && detailEnd && (
          <div className="ct-roster-leave-detail">
            <h2>
              {leaveFormat(detail.start, "MMM d")} – {leaveFormat(detailEnd, "MMM d")}
            </h2>
            <p>
              {detail.allDay
                ? "All day"
                : `${leaveFormat(detail.start, "h:mm a")} – ${leaveFormat(detail.end, "h:mm a")}`}
            </p>
            {detail.allDay && (
              <p>
                {differenceInCalendarDays(
                  leaveDate(leaveDateKey(detail.end)),
                  leaveDate(leaveDateKey(detail.start)),
                )}{" "}
                {differenceInCalendarDays(
                  leaveDate(leaveDateKey(detail.end)),
                  leaveDate(leaveDateKey(detail.start)),
                ) === 1
                  ? "day"
                  : "days"}
              </p>
            )}
            <p>
              <i className="ct-leave-dot" style={{ background: detail.color }} />
              {detail.data?.type}
            </p>
            <p>
              {detail.data?.people.length || 0}{" "}
              {(detail.data?.people.length || 0) === 1 ? "guest" : "guests"}
            </p>
            {detail.data?.reason && <p>{detail.data.reason}</p>}
            {detail.data?.cover && <p>Cover: {detail.data.cover}</p>}
            {detail.data?.people.map((name) => (
              <p key={name} className="ct-person">
                <Avatar name={name} />
                {name}
              </p>
            ))}
            {detail.data?.description && <p>{detail.data.description}</p>}
          </div>
        )}
      </ReferenceSheet>
      <Modal
        title="New leave type"
        description="Name your calendar and choose a color."
        open={newType}
        onClose={() => setNewType(false)}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const trigger = typeTrigger.current?.getClientRects().length
            ? typeTrigger.current
            : calendarsTrigger.current;
          trigger?.focus();
        }}
      >
        <form
          className="ct-roster-leave-form"
          onSubmit={(event) => {
            event.preventDefault();
            const name = typeName.trim();
            if (!name) {
              setError("Enter a leave type name.");
              return;
            }
            if (model.types.some((type) => type.name.toLowerCase() === name.toLowerCase())) {
              setError("A leave type with this name already exists.");
              return;
            }
            model.setTypes((old) => [...old, { name, color: typeColor }]);
            setNewType(false);
          }}
        >
          <label htmlFor="roster-leave-type-name">Name</label>
          <Input
            id="roster-leave-type-name"
            placeholder="e.g. Side projects"
            required
            value={typeName}
            onChange={(event) => setTypeName(event.target.value)}
          />
          <span>Color</span>
          <div className="ct-roster-leave-colors" role="group" aria-label="Leave type color">
            {leaveColors.map((color) => (
              <Button
                key={color.name}
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={color.name}
                aria-pressed={typeColor === color.value}
                onClick={() => setTypeColor(color.value)}
              >
                <i style={{ background: color.value }} />
              </Button>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="ct-roster-leave-actions">
            <Button type="button" variant="outline" onClick={() => setNewType(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
