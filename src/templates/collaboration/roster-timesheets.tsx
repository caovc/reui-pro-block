import { useRef, useState, type CSSProperties } from "react";
import { TZDate } from "@date-fns/tz";
import { addDays, format, startOfWeek } from "date-fns";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CornerUpLeft,
  X,
} from "lucide-react";
import { DomainRecordGrid, type DomainField } from "@/blocks/data/grid-advanced-model-grid";
import { Frame, FrameDescription, FrameHeader, FrameTitle } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { CalendarSelect } from "@/components/reui/calendar-select";
import { toZoned } from "@/components/reui/event-calendar/event-calendar-lib";
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import { Progress } from "@/components/ui/progress";
import { ButtonGroup } from "@/components/ui/button-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { demoAvatar } from "@/lib/demo-artwork";
import { Button, Modal, ReferenceSheet } from "./shared";
import { organization, type Person } from "./roster-directory-data";
import { rosterCalendarTimeZone } from "./roster-calendar";
import "./roster-timesheets.css";

type WorkKind = "Project" | "Internal" | "Support" | "Off";
type Review = "Awaiting" | "Signed off" | "Sent back";
type TimesheetPerson = {
  id: string;
  name: string;
  role: string;
  department: string;
  minutes: number[];
  kinds: WorkKind[];
};
const contracted = 2250;
const initialWeek = () => new TZDate(2026, 6, 20, 12, 0, 0, rosterCalendarTimeZone);
const dateText = (date: Date, pattern: string) =>
  format(toZoned(date, rosterCalendarTimeZone), pattern);
const weekKey = (date: Date) => dateText(date, "yyyy-MM-dd");
function weekText(date: Date) {
  const end = addDays(date, 6);
  const startPattern =
    dateText(date, "yyyy") !== dateText(end, "yyyy")
      ? "d MMM yyyy"
      : dateText(date, "MMM") !== dateText(end, "MMM")
        ? "d MMM"
        : "d";
  return `${dateText(date, startPattern)}–${dateText(end, startPattern === "d MMM yyyy" ? "d MMM yyyy" : "d MMM")}`;
}
function hours(minutes: number) {
  if (!minutes) return "—";
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}
const total = (person: TimesheetPerson) => person.minutes.reduce((sum, value) => sum + value, 0);
const targetBand = (person: TimesheetPerson) => {
  const ratio = total(person) / contracted;
  return ratio < 0.85 ? "Under target" : ratio > 1.05 ? "Over target" : "On target";
};
const workBand = (person: TimesheetPerson) => {
  const project = person.minutes.reduce(
    (sum, value, index) => sum + (person.kinds[index] === "Project" ? value : 0),
    0,
  );
  return !project ? "Internal only" : project / total(person) >= 0.6 ? "Mostly project" : "Mixed";
};
const workColors: Record<WorkKind, string> = {
  Project: "var(--color-emerald-400)",
  Internal: "var(--color-sky-400)",
  Support: "var(--color-amber-400)",
  Off: "var(--muted-foreground)",
};
function flatten(person: Person): Person[] {
  return [person, ...(person.children || []).flatMap(flatten)];
}
const people = flatten(organization);
// First-page hours match the observed weekly view. Remaining people use independent local fixtures.
const observed: [string, number[], WorkKind[]][] = [
  [
    "Amara Okafor",
    [390, 450, 390, 420, 420],
    ["Internal", "Project", "Project", "Internal", "Internal"],
  ],
  [
    "Daniel Reyes",
    [390, 450, 450, 390, 420],
    ["Internal", "Project", "Internal", "Project", "Project"],
  ],
  [
    "Priya Nair",
    [420, 420, 450, 420, 450],
    ["Project", "Project", "Project", "Support", "Internal"],
  ],
  [
    "Tomás Silva",
    [390, 450, 480, 450, 420],
    ["Project", "Project", "Project", "Internal", "Project"],
  ],
  [
    "Hannah Weber",
    [270, 330, 270, 360, 300],
    ["Project", "Internal", "Internal", "Project", "Internal"],
  ],
  [
    "Marco Bianchi",
    [540, 540, 420, 510, 570],
    ["Internal", "Internal", "Project", "Internal", "Internal"],
  ],
  [
    "Sofia Lindqvist",
    [570, 450, 630, 510, 450],
    ["Project", "Project", "Internal", "Internal", "Internal"],
  ],
  [
    "Abena Mensah",
    [360, 420, 420, 390, 450],
    ["Project", "Project", "Project", "Internal", "Project"],
  ],
  [
    "Elena Petrova",
    [270, 360, 390, 330, 360],
    ["Support", "Internal", "Project", "Internal", "Project"],
  ],
  [
    "James Whitfield",
    [420, 420, 360, 420, 480],
    ["Project", "Project", "Project", "Project", "Internal"],
  ],
];
const ordered = [
  ...observed.map(([name]) => people.find((person) => person.values[0] === name)!),
  ...people.filter((person) => !observed.some(([name]) => name === person.values[0])),
];
const timesheets: TimesheetPerson[] = ordered.map((person, index) => {
  const sample = observed.find(([name]) => name === person.values[0]);
  return {
    id: `p-${String(index + 1).padStart(3, "0")}`,
    name: person.values[0],
    role: person.values[1],
    department: person.values[2],
    minutes: [...(sample?.[1] || [420, 450, 390, 450, 420]), 0, 0],
    kinds: [
      ...(sample?.[2] ||
        (index % 3 === 0
          ? ["Internal", "Internal", "Internal", "Internal", "Internal"]
          : ["Project", "Project", "Internal", "Project", "Internal"])),
      "Off",
      "Off",
    ] as WorkKind[],
  };
});
const departments = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Customer Success",
  "People",
  "Finance",
];
const notes: Record<Exclude<WorkKind, "Off">, string[]> = {
  Project: [
    "Delivery planning",
    "Rate limiter rollout",
    "Webhook retry queue",
    "Project delivery",
    "Release preparation",
  ],
  Internal: [
    "Sprint planning",
    "Team coordination",
    "Knowledge sharing",
    "Backlog grooming",
    "Design review",
  ],
  Support: [
    "Customer follow-up",
    "Support rotation",
    "Incident review",
    "Customer support",
    "Weekly handover",
  ],
};
function dayNote(person: TimesheetPerson, index: number) {
  const kind = person.kinds[index];
  return kind === "Off" ? "Empty" : notes[kind][index % 5];
}

export function useRosterTimesheetsState() {
  const [week, setWeek] = useState<Date>(initialWeek);
  const [department, setDepartment] = useState("All");
  const [tracked, setTracked] = useState("All");
  const [work, setWork] = useState("All");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const review = (id: string): Review => reviews[`${weekKey(week)}:${id}`] || "Awaiting";
  return {
    week,
    setWeek,
    department,
    setDepartment,
    tracked,
    setTracked,
    work,
    setWork,
    pagination,
    setPagination,
    review,
    decide(ids: string[], decision: Review) {
      setReviews((current) => ({
        ...current,
        ...Object.fromEntries(ids.map((id) => [`${weekKey(week)}:${id}`, decision])),
      }));
    },
    hasChanges: Object.keys(reviews).length > 0,
    reset() {
      setReviews({});
      setWeek(initialWeek());
      setDepartment("All");
      setTracked("All");
      setWork("All");
      setPagination({ pageIndex: 0, pageSize: 10 });
    },
  };
}
export type RosterTimesheetsState = ReturnType<typeof useRosterTimesheetsState>;

export function RosterTimesheets({ model }: { model: RosterTimesheetsState }) {
  const [dateOpen, setDateOpen] = useState(false);
  const [detail, setDetail] = useState<{ person: TimesheetPerson; day: number } | null>(null);
  const [sendBack, setSendBack] = useState<TimesheetPerson | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const opener = useRef<HTMLButtonElement | null>(null);
  const fallback = useRef<HTMLButtonElement | null>(null);
  const weekButton = useRef<HTMLButtonElement | null>(null);
  const data = timesheets.filter(
    (person) =>
      (model.department === "All" || person.department === model.department) &&
      (model.tracked === "All" || targetBand(person) === model.tracked) &&
      (model.work === "All" || workBand(person) === model.work),
  );
  const awaiting = data.filter((person) => model.review(person.id) === "Awaiting");
  function restoreFocus(event: Event) {
    event.preventDefault();
    queueMicrotask(() => {
      const target =
        opener.current?.isConnected && !opener.current.disabled
          ? opener.current
          : fallback.current?.isConnected
            ? fallback.current
            : weekButton.current;
      target?.focus();
    });
  }
  function remember(button: HTMLButtonElement) {
    opener.current = button;
    fallback.current =
      button.closest("tr")?.querySelector<HTMLButtonElement>("[data-timesheet-day]") || null;
  }
  function decide(ids: string[], decision: Review) {
    model.decide(ids, decision);
    setAnnouncement(
      `${ids.length} ${ids.length === 1 ? "timesheet" : "timesheets"} ${decision.toLowerCase()}.`,
    );
  }
  function changeWeek(date: Date) {
    model.setWeek(startOfWeek(date, { weekStartsOn: 1 }));
    model.setPagination({ ...model.pagination, pageIndex: 0 });
  }
  const fields: DomainField<TimesheetPerson>[] = [
    {
      id: "person",
      title: "People",
      header: () => <div className="ct-timesheet-person-heading">People</div>,
      size: 240,
      className: "ct-timesheet-person-cell",
      value: (person) => person.name,
      render: (person) => (
        <span className="ct-person ct-timesheet-person">
          <Avatar>
            <AvatarImage src={demoAvatar(person.name)} alt="" />
            <AvatarFallback aria-hidden="true">
              {person.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span>
            <span className="ct-timesheet-person-name">{person.name}</span>
            <small>{person.role}</small>
          </span>
        </span>
      ),
    },
    ...Array.from({ length: 7 }, (_, day): DomainField<TimesheetPerson> => ({
      id: `day-${day}`,
      title: dateText(addDays(model.week, day), "EEE, d MMM"),
      header: () => (
        <div className="ct-timesheet-day-heading">
          {dateText(addDays(model.week, day), "EEE, d MMM")}
        </div>
      ),
      size: 112,
      value: (person) => person.minutes[day],
      render: (person) => (
        <Button
          type="button"
          variant="ghost"
          data-timesheet-day=""
          className="ct-timesheet-day"
          aria-label={`${person.name}, ${dateText(addDays(model.week, day), "EEEE d MMMM")}: ${hours(person.minutes[day])}, ${person.kinds[day]}. ${dayNote(person, day)}`}
          onClick={(event) => {
            remember(event.currentTarget);
            setDetail({ person, day });
          }}
          style={{ "--timesheet-work-color": workColors[person.kinds[day]] } as CSSProperties}
        >
          <span>{hours(person.minutes[day])}</span>
          <Progress aria-hidden="true" value={Math.min(100, person.minutes[day] / 4.5)} />
          <small>{person.kinds[day]}</small>
        </Button>
      ),
    })),
    {
      id: "total",
      title: "Total",
      header: () => <span>Total</span>,
      size: 110,
      value: total,
      render: (person) => (
        <span className="ct-timesheet-total">
          {hours(total(person))}
          <small>{Math.round((total(person) / contracted) * 100)}% of target</small>
        </span>
      ),
    },
    {
      id: "status",
      title: "Status",
      header: () => <span>Status</span>,
      size: 110,
      value: (person) => model.review(person.id),
      render: (person) => (
        <Badge
          variant={
            model.review(person.id) === "Signed off"
              ? "success-light"
              : model.review(person.id) === "Sent back"
                ? "destructive-light"
                : "warning-light"
          }
        >
          {model.review(person.id)}
        </Badge>
      ),
    },
    {
      id: "actions",
      title: "Actions",
      header: () => <span className="sr-only">Actions</span>,
      size: 90,
      value: (person) => person.id,
      render: (person) => (
        <div className="ct-timesheet-actions">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Sign off: ${person.name}`}
            disabled={model.review(person.id) === "Signed off"}
            onClick={() => decide([person.id], "Signed off")}
          >
            <Check aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Send back: ${person.name}`}
            disabled={model.review(person.id) === "Sent back"}
            onClick={(event) => {
              remember(event.currentTarget);
              setSendBack(person);
            }}
          >
            <CornerUpLeft aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];
  const selected = detail?.person;
  const selectedTotal = selected ? total(selected) : 0;
  const projectMinutes =
    selected?.minutes.reduce(
      (sum, value, day) => sum + (selected.kinds[day] === "Project" ? value : 0),
      0,
    ) || 0;
  return (
    <>
      <div className="ct-heading">
        <h1>Timesheets</h1>
      </div>
      <Frame dense className="ct-timesheets">
        <FrameHeader>
          <div>
            <FrameTitle>Timesheets</FrameTitle>
            <FrameDescription>Hours against each person’s contracted week.</FrameDescription>
          </div>
          <Button
            type="button"
            disabled={!awaiting.length}
            onClick={() =>
              decide(
                awaiting.map((person) => person.id),
                "Signed off",
              )
            }
          >
            Sign off {awaiting.length}
          </Button>
        </FrameHeader>
        <div className="ct-timesheets-toolbar">
          {(
            [
              ["Department", model.department, model.setDepartment, departments],
              [
                "Tracked time",
                model.tracked,
                model.setTracked,
                ["Under target", "On target", "Over target"],
              ],
              [
                "Work type",
                model.work,
                model.setWork,
                ["Mostly project", "Mixed", "Internal only"],
              ],
            ] as const
          ).map(([label, value, change, options]) => (
            <Select
              key={label}
              value={value}
              onValueChange={(value) => {
                change(value);
                model.setPagination({ ...model.pagination, pageIndex: 0 });
              }}
            >
              <SelectTrigger aria-label={label}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{label}</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          <ButtonGroup className="ct-timesheet-week" aria-label="Timesheet week">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous week"
              onClick={() => changeWeek(addDays(model.week, -7))}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  ref={weekButton}
                  type="button"
                  variant="outline"
                  className="ct-timesheet-week-date"
                  aria-label={`Choose timesheet week, ${weekText(model.week)}`}
                >
                  <span className="min-w-0 truncate">
                    {weekText(model.week).replace("–", " - ")}
                  </span>
                  <CalendarDays
                    aria-hidden="true"
                    data-icon="inline-end"
                    className="text-muted-foreground"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="reui-reference w-auto p-2" align="end">
                <CalendarSelect
                  mode="single"
                  captionLayout="label"
                  weekStartsOn={1}
                  selected={model.week}
                  defaultMonth={model.week}
                  onSelect={(date) => {
                    if (date) {
                      changeWeek(date);
                      setDateOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next week"
              onClick={() => changeWeek(addDays(model.week, 7))}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </ButtonGroup>
        </div>
        <DomainRecordGrid
          data={data}
          fields={fields}
          getRowId={(person) => person.id}
          pagination={model.pagination}
          onPaginationChange={model.setPagination}
          paginationControls={{ noun: "people", sizes: [10, 20, 50] }}
          scrollArea="horizontal"
          className="ct-timesheets-grid"
          layout={{ cellBorder: true, rowBorder: true, headerBorder: true, width: "fixed" }}
        />
      </Frame>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      <ReferenceSheet
        title={selected?.name || "Timesheet detail"}
        open={!!detail}
        onClose={() => setDetail(null)}
        onCloseAutoFocus={restoreFocus}
        header={
          <div className="ct-timesheet-sheet-header">
            <small>
              <Clock3 size={13} aria-hidden="true" />
              {selected?.id}
            </small>
            <div>
              <SheetTitle>{selected?.name || "Timesheet detail"}</SheetTitle>
              {selected && (
                <Badge
                  variant={targetBand(selected) === "On target" ? "success-light" : "warning-light"}
                >
                  {targetBand(selected)}
                </Badge>
              )}
            </div>
          </div>
        }
        description={selected ? `${selected.role}, ${weekText(model.week)}` : undefined}
        closeButton={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ct-timesheet-sheet-close"
            aria-label="Close timesheet detail"
            onClick={() => setDetail(null)}
          >
            <X aria-hidden="true" />
          </Button>
        }
      >
        {selected && (
          <div className="ct-timesheet-detail">
            <section className="ct-timesheet-summary">
              <div>
                <strong>{hours(selectedTotal)}</strong>
                <Badge variant={selectedTotal > contracted ? "warning-light" : "success-light"}>
                  {selectedTotal < contracted ? "-" : "+"}
                  {hours(Math.abs(selectedTotal - contracted)) === "—"
                    ? "0h"
                    : hours(Math.abs(selectedTotal - contracted))}
                </Badge>
                <small>{hours(contracted)} contracted</small>
              </div>
              <Progress
                aria-label="Contracted week completed"
                value={Math.min(100, (selectedTotal / contracted) * 100)}
              />
              <div className="ct-timesheet-target">
                <span>Target {hours(contracted)}</span>
                <span>{Math.round((selectedTotal / contracted) * 100)}% of the week</span>
              </div>
              <p>Leave counts as time, so an approved day off reads as a full one.</p>
            </section>
            <section className="ct-timesheet-breakdown">
              <h3>Where the hours went</h3>
              <dl>
                <dt>Project</dt>
                <dd>{hours(projectMinutes)}</dd>
                <dt>Everything else</dt>
                <dd>{hours(selectedTotal - projectMinutes)}</dd>
                <dt>Days logged</dt>
                <dd>{selected.minutes.filter(Boolean).length} of 7</dd>
              </dl>
            </section>
            <section className="ct-timesheet-daily">
              <h3>The week, day by day</h3>
              <Timeline value={0}>
                {selected.minutes.map((minutes, day) => (
                  <TimelineItem key={day} step={day + 1}>
                    <TimelineSeparator />
                    <TimelineIndicator
                      className="ct-timesheet-timeline-dot"
                      style={{ background: workColors[selected.kinds[day]] }}
                    />
                    <TimelineHeader>
                      <TimelineTitle>
                        <span>{dateText(addDays(model.week, day), "EEEE, d MMM")}</span>
                        <small>{hours(minutes)}</small>
                      </TimelineTitle>
                    </TimelineHeader>
                    <TimelineContent>
                      <p>{dayNote(selected, day)}</p>
                      <small>
                        {minutes ? selected.kinds[day] : ""}
                        {detail?.day === day && (
                          <Badge variant="secondary">The cell you opened</Badge>
                        )}
                      </small>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </section>
          </div>
        )}
      </ReferenceSheet>
      <Modal
        title="Send this week back?"
        description={
          sendBack
            ? `${sendBack.name}, ${weekText(model.week)}. They will need to correct it and resubmit.`
            : undefined
        }
        open={!!sendBack}
        onClose={() => setSendBack(null)}
        onCloseAutoFocus={restoreFocus}
      >
        <div className="ct-timesheet-confirm-actions">
          <Button type="button" variant="outline" onClick={() => setSendBack(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (sendBack) decide([sendBack.id], "Sent back");
              setSendBack(null);
            }}
          >
            Send back
          </Button>
        </div>
      </Modal>
    </>
  );
}
