import { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  GitCommitHorizontal,
  LayoutGrid,
  ListChecks,
  Package,
  Plus,
  Star,
} from "lucide-react";
import { EventCalendar } from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import {
  EventCalendarNav,
  EventCalendarNavNext,
  EventCalendarNavPrev,
  EventCalendarNavToday,
  EventCalendarTitle,
  EventCalendarViewSwitcher,
} from "@/components/reui/event-calendar/event-calendar-nav";
import type {
  EventCalendarOccurrence,
  EventCalendarSlotInfo,
} from "@/components/reui/event-calendar/event-calendar-types";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { CalendarSelect } from "@/components/reui/calendar-select";
import {
  TimePicker,
  TimePickerContent,
  TimePickerTrigger,
  TimePickerValue,
} from "@/components/reui/time-picker";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/template-progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { StrataHeaderActions } from "./strata-context";
import {
  STRATA_SERVICES,
  STRATA_NOW,
  strataOwner,
  strataService,
  type StrataPageProps,
} from "./strata-domain";
import {
  STRATA_CALENDAR_CATEGORIES,
  STRATA_CALENDAR_COLORS,
  STRATA_CALENDAR_VIEWS,
  STRATA_CALENDAR_OWNERS,
  STRATA_CALENDAR_PRIORITIES,
  STRATA_CALENDAR_WORKSTREAMS,
  createStrataCalendarDraft,
  filterStrataCalendarEvents,
  strataCalendarDefaultView,
  strataCalendarProgress,
  setStrataCalendarDraftAllDay,
  validateStrataCalendarInput,
  type StrataCalendarCategory,
  type StrataCalendarData,
  type StrataCalendarInput,
  type StrataCalendarPreset,
  type StrataCalendarPriority,
  type StrataCalendarWorkstream,
  type useStrataCalendarModel,
} from "./strata-calendar-model";
import "./strata-calendar.css";

type CalendarRootModel = ReturnType<typeof useStrataCalendarModel>;
type CalendarModel = ReturnType<CalendarRootModel["forPreset"]>;
type CalendarProps = StrataPageProps & { model: CalendarRootModel; preset?: StrataCalendarPreset };
type CalendarPageProps = StrataPageProps & { model: CalendarModel };
const progressIcons = { Tasks: ListChecks, Pipeline: LayoutGrid, Deliverables: Package };
const categoryBadgeColors: Record<StrataCalendarCategory, string> = {
  Release: "var(--color-amber-700)",
  Task: "var(--color-slate-700)",
  Maintenance: "var(--color-indigo-700)",
  Meeting: "var(--color-violet-700)",
  "On-call": "var(--color-sky-700)",
  Comms: "var(--color-emerald-700)",
};
const weekdayDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
});
const weekdayOnly = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" });
function calendarDayHeader({ day, view }: { day: Date; view: string }) {
  return (view === "month" ? weekdayOnly : weekdayDate).format(day);
}

const utcTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  hour: "numeric",
  minute: "2-digit",
});
const dayLabel = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

function CalendarCategory({ category }: { category: StrataCalendarCategory }) {
  return (
    <Badge
      className="strata-calendar-category"
      style={{ backgroundColor: categoryBadgeColors[category] }}
    >
      {category}
    </Badge>
  );
}

function EventCard({
  occurrence,
  compact = false,
}: {
  occurrence: EventCalendarOccurrence<StrataCalendarData>;
  compact?: boolean;
}) {
  const data = occurrence.event.data;
  if (!data) return occurrence.event.title;
  if (compact)
    return (
      <>
        <span className="strata-calendar-dot" />
        <span className="truncate">{occurrence.event.title}</span>
      </>
    );
  const progress = strataCalendarProgress(data.progress);
  const Icon = data.progress ? progressIcons[data.progress.kind] : ListChecks;
  const service = data.serviceId ? strataService(data.serviceId) : undefined;
  const duration = Math.round((occurrence.end.getTime() - occurrence.start.getTime()) / 60000);
  return (
    <span className="strata-calendar-event-card">
      <span className="strata-calendar-event-top">
        <span className="strata-calendar-event-meta">
          {data.handle || data.commit ? (
            <>
              <span aria-hidden>#</span> {data.handle ?? data.commit}
            </>
          ) : occurrence.allDay ? (
            <>
              <CalendarDays />
              {dayLabel.format(occurrence.start)}
            </>
          ) : (
            `${utcTime.format(occurrence.start)}, ${duration} min`
          )}
        </span>
        <CalendarCategory category={data.category} />
      </span>
      <span className="strata-calendar-event-title">{occurrence.event.title}</span>
      {data.progress && (
        <span className="strata-calendar-event-summary">
          <Icon />
          <span>{data.progress.kind}</span>
          <span className="ml-auto">
            {progress.complete}/{progress.total}
          </span>
        </span>
      )}
      {data.showService && service && (
        <span className="strata-calendar-event-summary">
          <Building2 />
          <span className="truncate">{service.name}</span>
        </span>
      )}
      {occurrence.allDay && data.progress && (
        <Progress
          className="strata-calendar-event-progress"
          aria-label={`${data.progress.kind} completed`}
          max={progress.total}
          value={progress.complete}
        />
      )}
    </span>
  );
}

function CalendarFilters({ model }: { model: CalendarModel }) {
  const toggleCategory = (category: StrataCalendarCategory, checked: boolean) =>
    model.setCategories((current) =>
      checked ? [...current, category] : current.filter((value) => value !== category),
    );
  const toggleOwner = (id: string, checked: boolean) =>
    model.setOwners((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  return (
    <div className="strata-calendar-filters">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Category <span className="text-muted-foreground">{model.categories.length}</span>
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="strata-calendar-menu">
          <DropdownMenuLabel>Category</DropdownMenuLabel>
          <DropdownMenuGroup>
            {STRATA_CALENDAR_CATEGORIES.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={model.categories.includes(category)}
                onCheckedChange={(checked) => toggleCategory(category, checked)}
                onSelect={(event) => event.preventDefault()}
              >
                <span
                  className="strata-calendar-dot"
                  style={{ background: STRATA_CALENDAR_COLORS[category] }}
                />
                {category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => model.setCategories([...STRATA_CALENDAR_CATEGORIES])}>
            Select all categories
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => model.setCategories([])}>
            Clear categories
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Ownership <span className="text-muted-foreground">{model.owners.length}</span>
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="strata-calendar-menu">
          <DropdownMenuLabel>Ownership</DropdownMenuLabel>
          <DropdownMenuGroup>
            {model.ownerOptions.map((owner) => (
              <DropdownMenuCheckboxItem
                key={owner.id}
                checked={model.owners.includes(owner.id)}
                onCheckedChange={(checked) => toggleOwner(owner.id, checked)}
                onSelect={(event) => event.preventDefault()}
              >
                {owner.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const localPriorityLabels = { none: "None", low: "Low", normal: "Normal", high: "High" };
const localWorkstreamLabels = {
  none: "None",
  release: "Release",
  reliability: "Reliability",
  operations: "Operations",
};
const timePickerI18n = {
  functions: {
    formatSegment: (value: number, unit: string) =>
      unit === "hour" ? String(value) : String(value).padStart(2, "0"),
  },
};

function CalendarDateField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = new TZDate(`${value}T12:00:00.000Z`, "UTC");
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="strata-calendar-date-trigger"
            aria-label={label}
            aria-invalid={!!error}
          >
            {format(date, "MMMM do, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="strata-calendar-date-popover w-auto p-2">
          <CalendarSelect
            mode="single"
            selected={date}
            defaultMonth={date}
            timeZone="UTC"
            today={new TZDate(STRATA_NOW, "UTC")}
            onSelect={(selected) => {
              if (selected) {
                onChange(selected.toISOString().slice(0, 10));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

function CalendarFormSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/** Captured field/default schema; popup alternatives and local submission rules remain demo adapters. */
function CalendarEventForm({
  initial,
  onCreate,
}: {
  initial: StrataCalendarInput;
  onCreate: (input: StrataCalendarInput) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validateStrataCalendarInput(draft) : {};
  const id = useId();
  const change = <K extends keyof StrataCalendarInput>(key: K, value: StrataCalendarInput[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const textField = (
    key: "title" | "reference" | "stage" | "status" | "obligation" | "room",
    label: string,
    placeholder: string,
  ) => (
    <Field data-invalid={!!errors[key]}>
      <FieldLabel htmlFor={`${id}-${key}`}>{label}</FieldLabel>
      <Input
        id={`${id}-${key}`}
        value={draft[key]}
        placeholder={placeholder}
        onChange={(event) => change(key, event.target.value)}
        aria-invalid={!!errors[key]}
        maxLength={120}
        autoComplete="off"
      />
      {errors[key] && <FieldError>{errors[key]}</FieldError>}
    </Field>
  );
  const timeField = (key: "from" | "to", label: string) => (
    <Field data-disabled={draft.allDay}>
      <FieldLabel htmlFor={`${id}-${key}`}>{label}</FieldLabel>
      <TimePicker
        id={`${id}-${key}`}
        aria-label={label}
        value={draft[key]}
        onValueChange={(value) => change(key, value ?? "")}
        hourCycle={12}
        minuteStep={15}
        disabled={draft.allDay}
        i18n={timePickerI18n}
      >
        <TimePickerTrigger role="combobox" className="strata-calendar-time-trigger">
          <TimePickerValue />
          <ChevronDown className="size-4 text-muted-foreground" />
        </TimePickerTrigger>
        <TimePickerContent />
      </TimePicker>
    </Field>
  );
  return (
    <form
      className="strata-calendar-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!Object.keys(validateStrataCalendarInput(draft)).length) onCreate(draft);
      }}
    >
      <FieldGroup className="strata-calendar-form-body">
        {textField("title", "Title", "On-call Handoff")}
        <div className="strata-calendar-form-grid">
          <CalendarFormSelect
            id={`${id}-category`}
            label="Category"
            value={draft.category}
            onChange={(value) => change("category", value as StrataCalendarCategory)}
            options={STRATA_CALENDAR_CATEGORIES.map((value) => ({ value, label: value }))}
          />
          <CalendarFormSelect
            id={`${id}-owner`}
            label="Owner"
            value={draft.ownerId}
            onChange={(value) => change("ownerId", value)}
            options={STRATA_CALENDAR_OWNERS.map((owner) => ({
              value: owner.id,
              label: owner.name,
            }))}
          />
        </div>
        <CalendarFormSelect
          id={`${id}-service`}
          label="Service"
          value={draft.serviceId}
          onChange={(value) => change("serviceId", value)}
          options={[
            { value: "all", label: "All services" },
            ...STRATA_SERVICES.map((service) => ({ value: service.id, label: service.name })),
          ]}
        />
        <Field orientation="horizontal" className="strata-calendar-all-day">
          <FieldLabel htmlFor={`${id}-all-day`}>All day</FieldLabel>
          <Switch
            id={`${id}-all-day`}
            checked={draft.allDay}
            onCheckedChange={(checked) =>
              setDraft((current) => setStrataCalendarDraftAllDay(current, checked))
            }
          />
        </Field>
        <div className="strata-calendar-form-grid">
          <CalendarDateField
            id={`${id}-start`}
            label="Starts"
            value={draft.startDate}
            onChange={(value) => change("startDate", value)}
            error={errors.startDate}
          />
          <CalendarDateField
            id={`${id}-end`}
            label="Ends"
            value={draft.endDate}
            onChange={(value) => change("endDate", value)}
            error={errors.endDate}
          />
        </div>
        <div className="strata-calendar-form-grid">
          {timeField("from", "From")}
          {timeField("to", "To")}
        </div>
        <Separator />
        <div className="strata-calendar-form-grid">
          {textField("reference", "Reference", "BL-CHG-0140")}
          {textField("stage", "Stage", "1 - Build")}
        </div>
        <div className="strata-calendar-form-grid strata-calendar-status-grid">
          {textField("status", "Status", "Initiated")}
          <CalendarFormSelect
            id={`${id}-priority`}
            label="Priority"
            value={draft.priority}
            onChange={(value) => change("priority", value as StrataCalendarPriority)}
            options={STRATA_CALENDAR_PRIORITIES.map((value) => ({
              value,
              label: localPriorityLabels[value],
            }))}
          />
        </div>
        <div className="strata-calendar-form-grid">
          {textField("obligation", "Obligation", "Change Approval")}
          <CalendarDateField
            id={`${id}-due`}
            label="Due"
            value={draft.dueDate}
            onChange={(value) => change("dueDate", value)}
            error={errors.dueDate}
          />
        </div>
        <div className="strata-calendar-form-grid">
          <CalendarFormSelect
            id={`${id}-workstream`}
            label="Workstream"
            value={draft.workstream}
            onChange={(value) => change("workstream", value as StrataCalendarWorkstream)}
            options={STRATA_CALENDAR_WORKSTREAMS.map((value) => ({
              value,
              label: localWorkstreamLabels[value],
            }))}
          />
          {textField("room", "Room", "Room 4")}
        </div>
        <Field data-invalid={!!errors.note}>
          <FieldLabel htmlFor={`${id}-note`}>Note</FieldLabel>
          <Textarea
            id={`${id}-note`}
            value={draft.note}
            placeholder="Context for the on-call team"
            onChange={(event) => change("note", event.target.value)}
            maxLength={2000}
          />
          {errors.note && <FieldError>{errors.note}</FieldError>}
        </Field>
      </FieldGroup>
      <SheetFooter className="strata-calendar-form-footer">
        <SheetClose asChild>
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit">Create event</Button>
      </SheetFooter>
    </form>
  );
}

function CalendarPage({
  model,
  environment,
  onNavigate,
  pinnedRoutes,
  onTogglePin,
}: CalendarPageProps) {
  const mobile = useIsMobile();
  const view = model.view ?? strataCalendarDefaultView(mobile);
  const events = useMemo(
    () => filterStrataCalendarEvents(model.events, model.categories, model.owners, environment),
    [model.events, model.categories, model.owners, environment],
  );
  const [panel, setPanel] = useState<
    { kind: "new"; draft: StrataCalendarInput } | { kind: "event"; id: string } | null
  >(null);
  const pinRoute = model.preset === "on-call-payments" ? "/calendar/on-call-payments" : "/calendar";
  const addButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const activeEvent =
    panel?.kind === "event" ? model.events.find((event) => event.id === panel.id) : undefined;
  const openNew = useCallback(
    (slot?: EventCalendarSlotInfo, source?: HTMLElement) => {
      opener.current = source ?? addButton.current;
      setPanel({ kind: "new", draft: createStrataCalendarDraft(model.date, slot) });
    },
    [model.date],
  );
  const renderEvent = useCallback(
    ({
      occurrence,
      view: eventView,
    }: {
      occurrence: EventCalendarOccurrence<StrataCalendarData>;
      view: string;
    }) => <EventCard occurrence={occurrence} compact={eventView === "month"} />,
    [],
  );
  const owner = activeEvent ? strataOwner(activeEvent.data.ownerId) : undefined;
  const service = activeEvent?.data.serviceId
    ? strataService(activeEvent.data.serviceId)
    : undefined;
  const progress = strataCalendarProgress(activeEvent?.data.progress ?? null);
  return (
    <div className="strata-calendar-page" data-default-view={mobile ? "day" : "week"}>
      <StrataHeaderActions>
        <Button
          variant="outline"
          size={mobile ? "icon" : "default"}
          aria-label={pinnedRoutes.includes(pinRoute) ? "Unpin Calendar" : "Pin Calendar"}
          aria-pressed={pinnedRoutes.includes(pinRoute)}
          onClick={() => onTogglePin(pinRoute)}
        >
          <Star fill={pinnedRoutes.includes(pinRoute) ? "currentColor" : "none"} />
          <span className="hidden md:inline">Pin</span>
        </Button>
        <Button ref={addButton} onClick={(event) => openNew(undefined, event.currentTarget)}>
          <Plus />
          New event
        </Button>
      </StrataHeaderActions>
      <EventCalendar<StrataCalendarData>
        className="strata-calendar"
        events={events}
        date={model.date}
        view={view}
        views={[...STRATA_CALENDAR_VIEWS]}
        onDateChange={model.setDate}
        onViewChange={model.setView}
        selection={model.selection}
        onSelectionChange={model.setSelection}
        timeZone="UTC"
        weekStartsOn={1}
        dayStartHour={8}
        dayEndHour={21}
        interval={60}
        scrollToHour={10}
        nowIndicator={false}
        scrollbars="native"
        navButtonSize="default"
        navTooltips={false}
        maxEventsPerCell={3}
        onEventUpdate={model.updateEvent}
        onEventClick={(occurrence, event) => {
          opener.current = event.currentTarget as HTMLElement;
          setPanel({ kind: "event", id: occurrence.eventId });
        }}
        onSlotClick={(slot, event) => openNew(slot, event.currentTarget as HTMLElement)}
        renderEvent={renderEvent}
        renderDayHeader={calendarDayHeader}
        classNames={{ event: "strata-calendar-event", title: "strata-calendar-title" }}
      >
        <EventCalendarNav className="strata-calendar-nav">
          <div className="strata-calendar-navigation">
            <EventCalendarNavToday onClick={model.today} />
            <EventCalendarViewSwitcher />
            <div className="strata-calendar-step">
              <EventCalendarNavPrev />
              <EventCalendarNavNext />
            </div>
            <EventCalendarTitle />
          </div>
          <CalendarFilters model={model} />
        </EventCalendarNav>
        <EventCalendarContent />
      </EventCalendar>
      <Sheet
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent
          className={
            panel?.kind === "new"
              ? "strata-calendar-sheet strata-calendar-create-sheet gap-0"
              : "strata-calendar-sheet gap-0"
          }
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = opener.current?.isConnected ? opener.current : addButton.current;
            target?.focus({ preventScroll: true });
          }}
        >
          {panel?.kind === "new" ? (
            <>
              <SheetHeader>
                <SheetTitle>New Event</SheetTitle>
                <SheetDescription className="sr-only">
                  Add an event to the calendar.
                </SheetDescription>
              </SheetHeader>
              <CalendarEventForm
                initial={panel.draft}
                onCreate={(input) => {
                  model.addEvent(input);
                  setPanel(null);
                }}
              />
            </>
          ) : activeEvent ? (
            <>
              <SheetHeader>
                <SheetTitle>{activeEvent.title}</SheetTitle>
                <SheetDescription>
                  {activeEvent.allDay
                    ? `${dayLabel.format(activeEvent.start)} · All day`
                    : `${dayLabel.format(activeEvent.start)} · ${utcTime.format(activeEvent.start)} – ${utcTime.format(activeEvent.end)} UTC`}
                </SheetDescription>
              </SheetHeader>
              <div className="strata-calendar-detail">
                <CalendarCategory category={activeEvent.data.category} />
                <p>{activeEvent.data.description}</p>
                <dl>
                  <div>
                    <dt>Owner</dt>
                    <dd>{owner?.name ?? "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt>Environment</dt>
                    <dd>{activeEvent.data.environment}</dd>
                  </div>
                  {activeEvent.data.handle && (
                    <div>
                      <dt>Reference</dt>
                      <dd>{activeEvent.data.handle}</dd>
                    </div>
                  )}
                  {activeEvent.data.commit && (
                    <div>
                      <dt>Commit</dt>
                      <dd className="strata-calendar-commit">
                        <GitCommitHorizontal />
                        {activeEvent.data.commit}
                      </dd>
                    </div>
                  )}
                  {Object.entries(activeEvent.data.metadata)
                    .filter(([key, value]) => key !== "reference" && value && value !== "none")
                    .map(([key, value]) => (
                      <div key={key}>
                        <dt>
                          {
                            (
                              {
                                stage: "Stage",
                                status: "Status",
                                priority: "Priority",
                                obligation: "Obligation",
                                dueDate: "Due",
                                workstream: "Workstream",
                                room: "Room",
                              } as Record<string, string>
                            )[key]
                          }
                        </dt>
                        <dd>
                          {key === "priority"
                            ? localPriorityLabels[value as StrataCalendarPriority]
                            : key === "workstream"
                              ? localWorkstreamLabels[value as StrataCalendarWorkstream]
                              : value}
                        </dd>
                      </div>
                    ))}
                </dl>
                {service && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPanel(null);
                      onNavigate(
                        service.id === "checkout-api" ? "/services/checkout-api" : "/services",
                      );
                    }}
                  >
                    <Building2 />
                    {service.name}
                  </Button>
                )}
                {activeEvent.data.incidentId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPanel(null);
                      onNavigate("/logs/errors-payments");
                    }}
                  >
                    Open checkout incident logs
                  </Button>
                )}
                {activeEvent.data.progress && (
                  <section
                    className="strata-calendar-checklist"
                    aria-label={activeEvent.data.progress.kind}
                  >
                    <h3>
                      {activeEvent.data.progress.kind}
                      <span>
                        {progress.complete}/{progress.total}
                      </span>
                    </h3>
                    <Progress
                      value={progress.complete}
                      max={progress.total}
                      aria-label={`${activeEvent.data.progress.kind} completed`}
                    />
                    {activeEvent.data.progress.items.map((item) => (
                      <label key={item.id}>
                        <Checkbox
                          checked={item.done}
                          onCheckedChange={() => model.toggleTask(activeEvent.id, item.id)}
                        />
                        {item.label}
                      </label>
                    ))}
                  </section>
                )}
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Route-local overlays reset on a preset change; the hoisted domain model persists. */
export function StrataCalendar({ model, preset = model.preset, ...props }: CalendarProps) {
  return <CalendarPage key={preset} {...props} model={model.forPreset(preset)} />;
}
