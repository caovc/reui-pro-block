import { useCallback, useMemo, useRef, useState, type SetStateAction } from "react";
import type {
  CalendarEvent,
  CalendarView,
  EventCalendarProposedUpdate,
  EventCalendarSelection,
  EventCalendarSlotInfo,
} from "../../components/reui/event-calendar/event-calendar-types";
import {
  STRATA_INCIDENT_ID,
  STRATA_NOW,
  STRATA_OWNERS,
  strataService,
  type StrataEnvironment,
  type StrataEnvironmentFilter,
} from "./strata-domain.ts";

/** Six original shared identities map one-to-one to the six observed ownership roles. */
export const STRATA_CALENDAR_OWNERS = ["maya", "owen", "noah", "sofia", "eli", "iris"].map((id) =>
  STRATA_OWNERS.find((owner) => owner.id === id)!,
);
/** Popup choices beyond the observed None are local demo choices, not source evidence. */
export const STRATA_CALENDAR_PRIORITIES = ["none", "low", "normal", "high"] as const;
export const STRATA_CALENDAR_WORKSTREAMS = [
  "none",
  "release",
  "reliability",
  "operations",
] as const;
export type StrataCalendarPriority = (typeof STRATA_CALENDAR_PRIORITIES)[number];
export type StrataCalendarWorkstream = (typeof STRATA_CALENDAR_WORKSTREAMS)[number];
export interface StrataCalendarMetadata {
  reference: string;
  stage: string;
  status: string;
  priority: StrataCalendarPriority;
  obligation: string;
  dueDate: string;
  workstream: StrataCalendarWorkstream;
  room: string;
}
function emptyMetadata(date: string): StrataCalendarMetadata {
  return {
    reference: "",
    stage: "",
    status: "",
    priority: "none",
    obligation: "",
    dueDate: date.slice(0, 10),
    workstream: "none",
    room: "",
  };
}

export const STRATA_CALENDAR_DATE = "2026-10-19T00:00:00.000Z";
export const STRATA_CALENDAR_CATEGORIES = [
  "Release",
  "Task",
  "Maintenance",
  "Meeting",
  "On-call",
  "Comms",
] as const;
export type StrataCalendarCategory = (typeof STRATA_CALENDAR_CATEGORIES)[number];
export const STRATA_CALENDAR_COLORS: Record<StrataCalendarCategory, string> = {
  Release: "var(--color-amber-500)",
  Task: "var(--color-slate-500)",
  Maintenance: "var(--color-indigo-500)",
  Meeting: "var(--color-violet-500)",
  "On-call": "var(--color-sky-500)",
  Comms: "var(--color-emerald-500)",
};
export const STRATA_CALENDAR_VIEWS = ["day", "week", "month", "agenda"] as const;
export type StrataCalendarView = (typeof STRATA_CALENDAR_VIEWS)[number];
export type StrataCalendarProgressKind = "Tasks" | "Pipeline" | "Deliverables";
export interface StrataCalendarTask {
  id: string;
  label: string;
  done: boolean;
}
export interface StrataCalendarData {
  category: StrataCalendarCategory;
  ownerId: string;
  serviceId: string | null;
  environment: StrataEnvironment;
  incidentId: string | null;
  handle: string | null;
  commit: string | null;
  version: string | null;
  showService: boolean;
  description: string;
  metadata: StrataCalendarMetadata;
  progress: { kind: StrataCalendarProgressKind; items: StrataCalendarTask[] } | null;
}
export type StrataCalendarEvent = CalendarEvent<StrataCalendarData> & { data: StrataCalendarData };

function progress(
  kind: StrataCalendarProgressKind,
  labels: string[],
  complete: number,
): StrataCalendarData["progress"] {
  return {
    kind,
    items: labels.map((label, index) => ({
      id: `step-${index + 1}`,
      label,
      done: index < complete,
    })),
  };
}
const releaseTasks = [
  "Prepare the change",
  "Validate the image",
  "Approve the release",
  "Deploy the canary",
  "Shift traffic",
  "Watch the SLO",
  "Complete post-checks",
  "Close the change",
];
const pipeline = ["Prepare", "Build", "Test", "Deploy", "Verify", "Publish recovery"];
const certificates = [
  "Inventory endpoints",
  "Confirm ownership",
  "Issue certificate",
  "Validate chain",
  "Stage rollout",
  "Rotate key",
  "Deploy certificate",
  "Check expiry",
  "Close change",
];

/** Fourteen original events in the observed week, retaining shared service/incident relationships. */
export function createStrataCalendarSeed(): StrataCalendarEvent[] {
  const make = (
    id: string,
    title: string,
    start: string,
    end: string,
    data: Partial<StrataCalendarData> & Pick<StrataCalendarData, "category" | "ownerId">,
    allDay = false,
  ): StrataCalendarEvent => ({
    id,
    title,
    start: new Date(start),
    end: new Date(end),
    allDay,
    color: STRATA_CALENDAR_COLORS[data.category],
    data: {
      serviceId: null,
      environment: "Production",
      incidentId: null,
      handle: null,
      commit: null,
      version: null,
      showService: false,
      description: title,
      metadata: emptyMetadata(start),
      progress: null,
      ...data,
    },
  });
  return [
    make(
      "BL-CAL-001",
      "search-api v1.14.0 Rollout",
      "2026-10-19T00:00:00Z",
      "2026-10-20T00:00:00Z",
      {
        category: "Release",
        ownerId: "eli",
        serviceId: "search-api",
        handle: "BL-CHG-0140",
        version: "v1.14.0",
        progress: progress("Tasks", releaseTasks, 7),
      },
      true,
    ),
    make(
      "BL-CAL-002",
      "Rotate webhook-worker signing keys",
      "2026-10-21T00:00:00Z",
      "2026-10-22T00:00:00Z",
      {
        category: "Task",
        ownerId: "noah",
        serviceId: "webhook-worker",
        progress: progress("Pipeline", pipeline.slice(0, 5), 1),
      },
      true,
    ),
    make(
      "BL-CAL-003",
      "edge-gateway certificate renewal",
      "2026-10-22T00:00:00Z",
      "2026-10-23T00:00:00Z",
      {
        category: "Maintenance",
        ownerId: "owen",
        serviceId: "edge-gateway",
        environment: "Staging",
        progress: progress("Deliverables", certificates, 4),
      },
      true,
    ),
    make("BL-CAL-004", "Pre-rollout Checks", "2026-10-19T09:00:00Z", "2026-10-19T10:30:00Z", {
      category: "Maintenance",
      ownerId: "eli",
      serviceId: "search-api",
      progress: progress(
        "Deliverables",
        [
          "Check image",
          "Verify config",
          "Confirm owner",
          "Check capacity",
          "Validate rollback",
          "Approve traffic shift",
        ],
        5,
      ),
    }),
    make("BL-CAL-005", "Weekly Ops Review", "2026-10-19T13:00:00Z", "2026-10-19T14:00:00Z", {
      category: "Meeting",
      ownerId: "maya",
    }),
    make("BL-CAL-006", "Payments On-call Handoff", "2026-10-20T10:00:00Z", "2026-10-20T11:00:00Z", {
      category: "On-call",
      ownerId: "maya",
      serviceId: "payments-api",
    }),
    make("BL-CAL-007", "Edge Failover Drill", "2026-10-20T10:30:00Z", "2026-10-20T12:00:00Z", {
      category: "On-call",
      ownerId: "owen",
      serviceId: "edge-gateway",
      environment: "Staging",
      showService: true,
    }),
    make("BL-CAL-008", "Certificate Notice", "2026-10-21T09:00:00Z", "2026-10-21T10:00:00Z", {
      category: "Comms",
      ownerId: "iris",
      serviceId: "edge-gateway",
      environment: "Staging",
    }),
    make("BL-CAL-009", "Search Capacity Call", "2026-10-21T15:00:00Z", "2026-10-21T16:45:00Z", {
      category: "On-call",
      ownerId: "eli",
      serviceId: "search-api",
      showService: true,
    }),
    make(
      "BL-CAL-010",
      "checkout-api v3.5.0 Release",
      "2026-10-22T12:30:00Z",
      "2026-10-22T13:45:00Z",
      {
        category: "Release",
        ownerId: "maya",
        serviceId: "checkout-api",
        incidentId: STRATA_INCIDENT_ID,
        commit: "b71c350",
        version: "v3.5.0",
        progress: progress("Pipeline", pipeline, 5),
      },
    ),
    make(
      "BL-CAL-011",
      "High error rate on checkout-api",
      "2026-10-22T13:45:00Z",
      "2026-10-22T15:30:00Z",
      {
        category: "On-call",
        ownerId: "sofia",
        serviceId: "checkout-api",
        incidentId: STRATA_INCIDENT_ID,
        handle: "BL-INC-350",
        showService: true,
      },
    ),
    make("BL-CAL-012", "BL-INC-350 Postmortem", "2026-10-23T09:00:00Z", "2026-10-23T10:15:00Z", {
      category: "Meeting",
      ownerId: "maya",
      serviceId: "checkout-api",
      incidentId: STRATA_INCIDENT_ID,
      showService: true,
    }),
    make(
      "BL-CAL-013",
      "Customer Incident Summary",
      "2026-10-23T11:30:00Z",
      "2026-10-23T12:45:00Z",
      {
        category: "Comms",
        ownerId: "iris",
        serviceId: "checkout-api",
        incidentId: STRATA_INCIDENT_ID,
        showService: true,
      },
    ),
    make(
      "BL-CAL-014",
      "Payments DB Failover Test",
      "2026-10-23T15:00:00Z",
      "2026-10-23T16:15:00Z",
      {
        category: "Maintenance",
        ownerId: "owen",
        serviceId: "payments-api",
        progress: progress(
          "Deliverables",
          ["Prepare replica", "Validate snapshots", "Promote standby", "Restore primary"],
          2,
        ),
      },
    ),
  ];
}

export function strataCalendarDefaultView(mobile: boolean): StrataCalendarView {
  return mobile ? "day" : "week";
}
export function strataCalendarProgress(progress: StrataCalendarData["progress"]) {
  const total = progress?.items.length ?? 0;
  const complete = progress?.items.filter((item) => item.done).length ?? 0;
  return { total, complete, percent: total ? (complete / total) * 100 : 0 };
}

/** No date-window truncation: EventCalendar owns visible-range segmentation and history navigation. */
export function filterStrataCalendarEvents(
  events: StrataCalendarEvent[],
  categories: readonly StrataCalendarCategory[],
  owners: readonly string[],
  environment: StrataEnvironmentFilter,
) {
  return events.filter(
    (event) =>
      categories.includes(event.data.category) &&
      owners.includes(event.data.ownerId) &&
      (environment === "all" || event.data.environment === environment),
  );
}
export function strataCalendarOwners(events: StrataCalendarEvent[]) {
  const ids = new Set(events.map((event) => event.data.ownerId));
  return STRATA_CALENDAR_OWNERS.filter((owner) => ids.has(owner.id));
}
export function validStrataCalendarPeriod(start: Date, end: Date, allDay: boolean) {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start)
    return false;
  return !allDay || [start, end].every((date) => date.toISOString().slice(11) === "00:00:00.000Z");
}
export function updateStrataCalendarPeriod(
  events: StrataCalendarEvent[],
  id: string,
  start: Date,
  end: Date,
  allDay: boolean,
) {
  if (!validStrataCalendarPeriod(start, end, allDay)) throw new Error("Invalid calendar period");
  return events.map((event) =>
    event.id === id ? { ...event, start: new Date(start), end: new Date(end), allDay } : event,
  );
}

export function toggleStrataCalendarTask(
  events: StrataCalendarEvent[],
  eventId: string,
  taskId: string,
): StrataCalendarEvent[] {
  return events.map((event) =>
    event.id === eventId && event.data.progress
      ? {
          ...event,
          data: {
            ...event.data,
            progress: {
              ...event.data.progress,
              items: event.data.progress.items.map((item) =>
                item.id === taskId ? { ...item, done: !item.done } : item,
              ),
            },
          },
        }
      : event,
  );
}

/** Visible fields/defaults are observed; validation and mutation are explicitly local behavior. */
export interface StrataCalendarInput extends StrataCalendarMetadata {
  title: string;
  category: StrataCalendarCategory;
  ownerId: string;
  serviceId: string;
  startDate: string;
  endDate: string;
  from: string;
  to: string;
  allDay: boolean;
  note: string;
}
export function createStrataCalendarDraft(
  date = new Date(STRATA_CALENDAR_DATE),
  slot?: EventCalendarSlotInfo,
): StrataCalendarInput {
  const start = new Date(slot?.date ?? date);
  const allDay = slot?.allDay ?? false;
  if (!slot && !allDay) start.setUTCHours(9, 0, 0, 0);
  const end = slot?.end
    ? new Date(slot.end)
    : new Date(start.getTime() + (allDay ? 86_400_000 : 3_600_000));
  // Native EventCalendar uses exclusive all-day ends; the visible Ends field is inclusive locally.
  const endDay = allDay ? new Date(end.getTime() - 86_400_000) : end;
  return {
    ...emptyMetadata(start.toISOString()),
    title: "",
    category: "Task",
    ownerId: STRATA_CALENDAR_OWNERS[0].id,
    serviceId: "all",
    startDate: start.toISOString().slice(0, 10),
    endDate: endDay.toISOString().slice(0, 10),
    from: allDay ? "09:00" : start.toISOString().slice(11, 16),
    to: allDay ? "10:00" : end.toISOString().slice(11, 16),
    allDay,
    note: "",
  };
}
export function validStrataCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function strataCalendarInputPeriod(input: StrataCalendarInput) {
  const validDates =
    validStrataCalendarDate(input.startDate) && validStrataCalendarDate(input.endDate);
  const validTimes =
    /^([01]\d|2[0-3]):[0-5]\d$/.test(input.from) && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.to);
  if (!validDates || (!input.allDay && !validTimes))
    return { start: new Date(NaN), end: new Date(NaN) };
  const start = new Date(`${input.startDate}T${input.allDay ? "00:00" : input.from}:00.000Z`);
  const end = new Date(`${input.endDate}T${input.allDay ? "00:00" : input.to}:00.000Z`);
  if (input.allDay) end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}
export function setStrataCalendarDraftAllDay(
  input: StrataCalendarInput,
  allDay: boolean,
): StrataCalendarInput {
  // Preserve date/time inputs so toggling back is lossless, including incomplete drafts.
  return { ...input, allDay };
}
export function validateStrataCalendarInput(input: StrataCalendarInput) {
  const errors: Partial<Record<keyof StrataCalendarInput, string>> = {};
  if (!input.title.trim() || input.title.trim().length > 120)
    errors.title = "Enter a title of up to 120 characters.";
  if (!STRATA_CALENDAR_CATEGORIES.includes(input.category)) errors.category = "Choose a category.";
  if (!STRATA_CALENDAR_OWNERS.some((owner) => owner.id === input.ownerId))
    errors.ownerId = "Choose an owner.";
  if (input.serviceId !== "all" && !strataService(input.serviceId))
    errors.serviceId = "Choose a service or All services.";
  if (!validStrataCalendarDate(input.startDate)) errors.startDate = "Choose a valid start date.";
  const { start, end } = strataCalendarInputPeriod(input);
  if (!validStrataCalendarPeriod(start, end, input.allDay))
    errors.endDate = input.allDay
      ? "Ends must be on or after Starts."
      : "End must be after a valid start time.";
  if (!validStrataCalendarDate(input.dueDate)) errors.dueDate = "Choose a valid due date.";
  if (!STRATA_CALENDAR_PRIORITIES.includes(input.priority)) errors.priority = "Choose a priority.";
  if (!STRATA_CALENDAR_WORKSTREAMS.includes(input.workstream))
    errors.workstream = "Choose a workstream.";
  for (const field of ["reference", "stage", "status", "obligation", "room"] as const) {
    if (input[field].length > 120) errors[field] = "Use up to 120 characters.";
  }
  if (input.note.length > 2000) errors.note = "Use up to 2,000 characters.";
  return errors;
}
export function makeStrataCalendarEvent(
  input: StrataCalendarInput,
  id: string,
): StrataCalendarEvent {
  if (Object.keys(validateStrataCalendarInput(input)).length)
    throw new Error("Invalid calendar event");
  const service = strataService(input.serviceId);
  const { start, end } = strataCalendarInputPeriod(input);
  return {
    id,
    title: input.title.trim(),
    start,
    end,
    allDay: input.allDay,
    color: STRATA_CALENDAR_COLORS[input.category],
    data: {
      category: input.category,
      ownerId: input.ownerId,
      serviceId: service?.id ?? null,
      environment: service?.environment ?? "Production",
      incidentId: null,
      handle: input.reference.trim() || null,
      commit: null,
      version: null,
      showService: !!service,
      description: input.note.trim(),
      metadata: {
        reference: input.reference.trim(),
        stage: input.stage.trim(),
        status: input.status.trim(),
        priority: input.priority,
        obligation: input.obligation.trim(),
        dueDate: input.dueDate,
        workstream: input.workstream,
        room: input.room.trim(),
      },
      progress: null,
    },
  };
}

export type StrataCalendarPreset = "default" | "on-call-payments";
export interface StrataCalendarDisplay {
  date: Date;
  view: StrataCalendarView | null;
  categories: StrataCalendarCategory[];
  owners: string[];
  selection: EventCalendarSelection;
}
export function createStrataCalendarDisplay(preset: StrataCalendarPreset): StrataCalendarDisplay {
  return {
    date: new Date(STRATA_CALENDAR_DATE),
    view: null,
    categories: preset === "on-call-payments" ? ["On-call"] : [...STRATA_CALENDAR_CATEGORIES],
    owners:
      preset === "on-call-payments"
        ? ["maya", "sofia"]
        : STRATA_CALENDAR_OWNERS.map((owner) => owner.id),
    selection: { eventKeys: [], slot: null },
  };
}
function copyCalendarDisplay(display: StrataCalendarDisplay): StrataCalendarDisplay {
  return {
    ...display,
    date: new Date(display.date),
    categories: [...display.categories],
    owners: [...display.owners],
    selection: {
      eventKeys: [...display.selection.eventKeys],
      slot: display.selection.slot ? { ...display.selection.slot } : null,
    },
  };
}
/** Independent route snapshots preserve normal Calendar state without leaking pinned filters. */
export function switchStrataCalendarPreset(
  current: StrataCalendarDisplay,
  from: StrataCalendarPreset,
  to: StrataCalendarPreset,
  cache: Partial<Record<StrataCalendarPreset, StrataCalendarDisplay>>,
) {
  return {
    cache: { ...cache, [from]: copyCalendarDisplay(current) },
    display: copyCalendarDisplay(cache[to] ?? createStrataCalendarDisplay(to)),
  };
}

/** Root passes its canonical URL-derived route on initial mount, hash/pop and navigation. */
export function strataCalendarPresetForRoute(route: string): StrataCalendarPreset {
  return route === "/calendar/on-call-payments" ? "on-call-payments" : "default";
}

function useStrataCalendarDisplay(
  preset: StrataCalendarPreset,
  createEvent: (input: StrataCalendarInput) => StrataCalendarEvent,
) {
  const [display, setDisplay] = useState(() => createStrataCalendarDisplay(preset));
  const update = useCallback(
    <K extends keyof StrataCalendarDisplay>(
      key: K,
      value: SetStateAction<StrataCalendarDisplay[K]>,
    ) => {
      setDisplay((current) => ({
        ...current,
        [key]:
          typeof value === "function"
            ? (value as (previous: StrataCalendarDisplay[K]) => StrataCalendarDisplay[K])(
                current[key],
              )
            : value,
      }));
    },
    [],
  );
  const setters = useMemo(
    () => ({
      setDate: (value: SetStateAction<Date>) => update("date", value),
      setView: (value: CalendarView) => {
        if (STRATA_CALENDAR_VIEWS.includes(value as StrataCalendarView))
          update("view", value as StrataCalendarView);
      },
      setCategories: (value: SetStateAction<StrataCalendarCategory[]>) =>
        update("categories", value),
      setOwners: (value: SetStateAction<string[]>) => update("owners", value),
      setSelection: (value: SetStateAction<EventCalendarSelection>) => update("selection", value),
      today: () => update("date", new Date(STRATA_NOW)),
    }),
    [update],
  );
  const resetDisplay = useCallback(() => setDisplay(createStrataCalendarDisplay(preset)), [preset]);
  const addEvent = useCallback(
    (input: StrataCalendarInput) => {
      const event = createEvent(input);
      setDisplay((current) => ({
        ...current,
        date: new Date(event.start),
        categories: current.categories.includes(event.data.category)
          ? current.categories
          : [...current.categories, event.data.category],
        owners: current.owners.includes(event.data.ownerId)
          ? current.owners
          : [...current.owners, event.data.ownerId],
      }));
      return event;
    },
    [createEvent],
  );
  return { ...display, ...setters, preset, addEvent, resetDisplay };
}

export function useStrataCalendarModel(initialPreset: StrataCalendarPreset = "default") {
  const [events, setEvents] = useState(createStrataCalendarSeed);
  const [preset, applyPreset] = useState<StrataCalendarPreset>(initialPreset);
  const sequence = useRef(15);
  const createEvent = useCallback((input: StrataCalendarInput) => {
    const event = makeStrataCalendarEvent(
      input,
      `BL-CAL-${String(sequence.current).padStart(3, "0")}`,
    );
    sequence.current++;
    setEvents((current) => [...current, event]);
    return event;
  }, []);
  // Both fixed hook slots exist on the initial render. Selecting one never writes state.
  const normal = useStrataCalendarDisplay("default", createEvent);
  const payments = useStrataCalendarDisplay("on-call-payments", createEvent);
  const updateEvent = useCallback(
    (update: EventCalendarProposedUpdate<StrataCalendarData>) => {
      if (
        !events.some((event) => event.id === update.event.id) ||
        !validStrataCalendarPeriod(update.start, update.end, update.allDay)
      )
        return false;
      setEvents((current) =>
        updateStrataCalendarPeriod(
          current,
          update.event.id,
          update.start,
          update.end,
          update.allDay,
        ),
      );
      return true;
    },
    [events],
  );
  const toggleTask = useCallback(
    (eventId: string, taskId: string) =>
      setEvents((current) => toggleStrataCalendarTask(current, eventId, taskId)),
    [],
  );
  const { resetDisplay: resetNormal } = normal;
  const { resetDisplay: resetPayments } = payments;
  const reset = useCallback(() => {
    sequence.current = 15;
    setEvents(createStrataCalendarSeed());
    resetNormal();
    resetPayments();
    applyPreset("default");
  }, [resetNormal, resetPayments]);
  const forPreset = (selectedPreset: StrataCalendarPreset) => ({
    ...(selectedPreset === "on-call-payments" ? payments : normal),
    events,
    ownerOptions: STRATA_CALENDAR_OWNERS,
    updateEvent,
    toggleTask,
    reset,
  });
  return { ...forPreset(preset), applyPreset, forPreset };
}
