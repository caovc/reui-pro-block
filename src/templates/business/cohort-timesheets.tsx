/* eslint-disable react/only-export-components */
import { format } from "date-fns";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Settings2,
  Undo2,
  X,
} from "lucide-react";
import { DomainRecordGrid } from "@/blocks/data/grid-advanced-model-grid";
import { GridFrame, NumericField } from "@/blocks/data/grid-advanced-shared";
import { Identity } from "@/blocks/data/grid-base-common";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarSelect } from "@/components/reui/calendar-select";
import { Progress } from "@/components/ui/progress";
import {
  Timeline,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
} from "@/components/reui/timeline";
import { Choice, Tone } from "./fidelity";
import { Button, toast } from "./shared";
import { timesheetSeed } from "./cohort-timesheet-data";
import type { CohortPerson } from "./cohort-people";
type DayLog = { hours: number; kind: string; note: string };
type Timesheet = { id: string; name: string; title: string; days: DayLog[]; decision: string };
export function useCohortTimesheetState() {
  const [weeks, setWeeks] = useState<Record<string, Record<string, Timesheet>>>({});
  return {
    weeks,
    setWeeks,
    reset: () =>
      setWeeks((previous) =>
        Object.fromEntries(
          Object.entries(previous).map(([week, people]) => [
            week,
            Object.fromEntries(
              Object.entries(people).map(([id, person]) => [
                id,
                { ...person, decision: "Awaiting" },
              ]),
            ),
          ]),
        ),
      ),
  };
}
type TimesheetModel = ReturnType<typeof useCohortTimesheetState>;
const formatHours = (hours: number) => {
  if (!hours) return "—";
  const minutes = Math.round(hours * 60);
  const wholeHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${wholeHours ? `${wholeHours}h` : ""}${wholeHours && remainingMinutes ? " " : ""}${remainingMinutes ? `${remainingMinutes}m` : ""}`;
};
function weekStart(date: Date) {
  const value = new Date(date);
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return value;
}
const dayLabel = (date: Date) => format(date, "EEEE, d MMM");
export function CohortTimesheets({
  model,
  people,
}: {
  model: TimesheetModel;
  people: CohortPerson[];
}) {
  const [week, setWeek] = useState(new Date(2026, 6, 20, 12));
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const key = `${week.getFullYear()}-${week.getMonth() + 1}-${week.getDate()}`;
  const [department, setDepartment] = useState("Department");
  const [tracked, setTracked] = useState("Tracked time");
  const [work, setWork] = useState("Work type");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selected, setSelected] = useState<{ id: string; day: number } | null>(null);
  const [dayDraft, setDayDraft] = useState<DayLog>({ hours: 0, kind: "Project", note: "" });
  const days = Array.from(
    { length: 7 },
    (_, i) => new Date(week.getFullYear(), week.getMonth(), week.getDate() + i, 12),
  );
  const seeded: Timesheet[] = timesheetSeed.map((person) => ({ ...person, decision: "Awaiting" }));
  const rows = seeded.map((person) => model.weeks[key]?.[person.id] || person);
  const total = (person: Timesheet) => person.days.reduce((n, day) => n + day.hours, 0);
  const target = (person: Timesheet) =>
    person.id === "p-013" ? 22.5 : person.id === "p-019" ? 30 : 37.5;
  const workType = (person: Timesheet) => {
    const logged = person.days.filter((day) => day.hours > 0);
    if (logged.length && logged.every((day) => day.kind === "Internal")) return "Internal only";
    const projectHours = logged
      .filter((day) => day.kind === "Project")
      .reduce((sum, day) => sum + day.hours, 0);
    return projectHours / total(person) >= 0.75 ? "Mostly project" : "Mixed";
  };
  const shown = rows.filter(
    (person) =>
      (department === "Department" ||
        department === people.find((p) => p.name === person.name)?.department) &&
      (tracked === "Tracked time" ||
        (tracked === "Under target"
          ? total(person) < target(person) * 0.85
          : tracked === "Over target"
            ? total(person) > target(person) * 1.05
            : total(person) >= target(person) * 0.85 && total(person) <= target(person) * 1.05)) &&
      (work === "Work type" || work === workType(person)),
  );
  function save(person: Timesheet) {
    model.setWeeks((old) => ({ ...old, [key]: { ...old[key], [person.id]: person } }));
  }
  function decide(person: Timesheet, decision: string) {
    save({ ...person, decision });
    toast.success(decision === "Signed off" ? "Signed off" : "Sent back", {
      description: `${person.name}, ${week.getDate()} - ${days[6].getDate()} ${week.toLocaleDateString("en-GB", { month: "short" })}.`,
    });
  }
  const current = rows.find((p) => p.id === selected?.id);
  function inspect(person: Timesheet, day: number) {
    setSelected({ id: person.id, day });
    setDayDraft({ ...person.days[day] });
  }
  const pending = shown.filter((p) => p.decision === "Awaiting");
  return (
    <div className="bt-cohort-timesheets">
      <h1>Timesheets</h1>
      <GridFrame
        title="Timesheets"
        description="Hours against each person's contracted week."
        className="bt-timesheet-frame"
        actions={
          <Button
            size="sm"
            disabled={!pending.length}
            onClick={() => {
              model.setWeeks((old) => ({
                ...old,
                [key]: {
                  ...old[key],
                  ...Object.fromEntries(
                    pending.map((p) => [p.id, { ...p, decision: "Signed off" }]),
                  ),
                },
              }));
              toast.success(`${pending.length} timesheets signed off`);
            }}
          >
            Sign off {pending.length}
          </Button>
        }
      >
        <div className="bt-timesheet-toolbar">
          <div className="bt-timesheet-facet">
            <Choice
              label="Department"
              options={["Department", ...new Set(people.map((p) => p.department))]}
              value={department}
              onChange={(value) => {
                setDepartment(value);
                setPagination({ ...pagination, pageIndex: 0 });
              }}
            />
          </div>
          <div className="bt-timesheet-facet">
            <Choice
              label="Tracked time"
              options={["Tracked time", "Under target", "On target", "Over target"]}
              value={tracked}
              onChange={(value) => {
                setTracked(value);
                setPagination({ ...pagination, pageIndex: 0 });
              }}
            />
          </div>
          <div className="bt-timesheet-facet">
            <Choice
              label="Work type"
              options={["Work type", "Mostly project", "Mixed", "Internal only"]}
              value={work}
              onChange={(value) => {
                setWork(value);
                setPagination({ ...pagination, pageIndex: 0 });
              }}
            />
          </div>
          <div className="bt-timesheet-week">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Previous week"
              onClick={() =>
                setWeek(new Date(week.getFullYear(), week.getMonth(), week.getDate() - 7, 12))
              }
            >
              <ChevronLeft size={14} />
            </Button>
            <Popover open={weekPickerOpen} onOpenChange={setWeekPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  {week.getDate()} - {days[6].getDate()}{" "}
                  {week.toLocaleDateString("en-GB", { month: "short" })}
                  <CalendarDays size={14} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <CalendarSelect
                  mode="single"
                  selected={week}
                  defaultMonth={week}
                  onSelect={(date) => {
                    if (!date) return;
                    setWeek(weekStart(date));
                    setWeekPickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Next week"
              onClick={() =>
                setWeek(new Date(week.getFullYear(), week.getMonth(), week.getDate() + 7, 12))
              }
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
        <DomainRecordGrid
          data={shown}
          getRowId={(p) => p.id}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationControls={{ noun: "people", sizes: [10, 20, 50] }}
          layout={{ cellBorder: true }}
          className="bt-timesheet-grid"
          fields={[
            {
              id: "name",
              title: "People",
              value: (p) => p.name,
              size: 240,
              render: (p) => <Identity name={p.name} detail={p.title} />,
            },
            ...days.map((date, i) => ({
              id: `day-${i}`,
              title: date.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              }),
              header: () => (
                <span>
                  {date.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              ),
              value: (p: Timesheet) => p.days[i].hours,
              size: 112,
              render: (p: Timesheet) => {
                const day = p.days[i];
                return (
                  <button
                    className="bt-timesheet-day"
                    aria-label={`${dayLabel(date)}: ${p.name}, ${formatHours(day.hours)}, ${day.kind}`}
                    onClick={() => inspect(p, i)}
                  >
                    <strong>{formatHours(day.hours)}</strong>
                    {/* Official free c-progress-8 independently coloured Progress composition.
                        Adapted colours and controlled values represent logged working time.
                        https://reui.io/r/radix-nova/c-progress-8.json (MIT; REUI-LICENSE.txt). */}
                    <Progress
                      value={Math.min(100, (day.hours / 8) * 100)}
                      aria-label={`${p.name} ${dayLabel(date)} logged time`}
                      className={
                        day.kind === "Internal"
                          ? "bt-timesheet-meter bt-timesheet-internal"
                          : day.kind === "Support"
                            ? "bt-timesheet-meter bt-timesheet-support"
                            : "bt-timesheet-meter"
                      }
                    />
                    <small>{day.kind}</small>
                  </button>
                );
              },
            })),
            {
              id: "total",
              title: "Total",
              value: (p) => total(p),
              size: 118,
              render: (p) => (
                <div className="bt-timesheet-total">
                  <b>{formatHours(total(p))}</b>
                  <small
                    className={
                      total(p) > target(p) * 1.05
                        ? "over"
                        : total(p) < target(p) * 0.85
                          ? "under"
                          : ""
                    }
                  >
                    {Math.round((total(p) / target(p)) * 100)}%
                  </small>
                </div>
              ),
            },
            {
              id: "decision",
              title: "Status",
              value: (p) => p.decision,
              size: 100,
              render: (p) => (
                <Tone
                  tone={
                    p.decision === "Signed off"
                      ? "green"
                      : p.decision === "Sent back"
                        ? "red"
                        : "neutral"
                  }
                >
                  {p.decision}
                </Tone>
              ),
            },
            {
              id: "actions",
              title: "",
              value: (p) => p.id,
              size: 80,
              render: (p) => (
                <div className="flex gap-1">
                  {p.decision !== "Awaiting" ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Undo decision: ${p.name}`}
                      onClick={() => save({ ...p, decision: "Awaiting" })}
                    >
                      <Undo2 size={15} />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Sign off: ${p.name}`}
                        onClick={() => decide(p, "Signed off")}
                      >
                        <Check size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Send back: ${p.name}`}
                        onClick={() => decide(p, "Sent back")}
                      >
                        <X size={15} />
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </GridFrame>
      <Sheet open={!!current} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="bt-floating-sheet bt-timesheet-detail">
          <SheetHeader>
            <div className="bt-timesheet-detail-id">
              <Clock3 size={13} /> {current?.id}
            </div>
            <div className="flex items-center justify-between gap-2">
              <SheetTitle>{current?.name}</SheetTitle>
              {current && (
                <Tone
                  tone={
                    total(current) < target(current) * 0.85
                      ? "amber"
                      : total(current) > target(current) * 1.05
                        ? "violet"
                        : "green"
                  }
                >
                  {total(current) < target(current) * 0.85
                    ? "Under target"
                    : total(current) > target(current) * 1.05
                      ? "Over target"
                      : "On target"}
                </Tone>
              )}
            </div>
            <SheetDescription>
              {current?.title}, {week.getDate()} - {days[6].getDate()}{" "}
              {week.toLocaleDateString("en-GB", { month: "short" })}
            </SheetDescription>
          </SheetHeader>
          {current && selected && (
            <div className="bt-timesheet-detail-body">
              <div className="bt-timesheet-detail-total">
                <strong>{formatHours(total(current))}</strong>
                <span>
                  {total(current) === target(current) ? (
                    "On target"
                  ) : (
                    <>
                      {total(current) > target(current) ? "+" : ""}
                      {formatHours(Math.abs(total(current) - target(current)))}{" "}
                      {total(current) < target(current) ? "under" : "over"} target
                    </>
                  )}
                </span>
                <small>{formatHours(target(current))} contracted</small>
              </div>
              <Progress
                aria-label="Contracted week progress"
                value={Math.min(100, (total(current) / target(current)) * 100)}
                className="bt-timesheet-target-meter"
              />
              <div className="bt-timesheet-target-caption">
                <span>Target {formatHours(target(current))}</span>
                <span>{Math.round((total(current) / target(current)) * 100)}% of the week</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave counts as time, so an approved day off reads as a full one.
              </p>
              <div className="bt-timesheet-hours-breakdown">
                <h3>Where the hours went</h3>
                <div>
                  Project
                  <strong>
                    {formatHours(
                      current.days
                        .filter((d) => d.kind === "Project")
                        .reduce((n, d) => n + d.hours, 0),
                    )}
                  </strong>
                </div>
                <div>
                  Everything else
                  <strong>
                    {formatHours(
                      current.days
                        .filter((d) => d.kind !== "Project")
                        .reduce((n, d) => n + d.hours, 0),
                    )}
                  </strong>
                </div>
                <div>
                  Days logged<strong>{current.days.filter((d) => d.hours).length} of 7</strong>
                </div>
              </div>
              <h3>Log {dayLabel(days[selected.day])}</h3>
              <div className="bt-timesheet-log">
                <label>
                  Hours
                  <NumericField
                    value={dayDraft.hours}
                    min={0}
                    max={24}
                    step={0.5}
                    label="Logged hours"
                    onValueChange={(hours) => setDayDraft({ ...dayDraft, hours })}
                  />
                </label>
                <label>
                  Type
                  <Choice
                    label="Logged work type"
                    value={dayDraft.kind}
                    options={["Project", "Internal", "Support", "Leave", "Off"]}
                    onChange={(kind) => setDayDraft({ ...dayDraft, kind })}
                  />
                </label>
                <label className="bt-log-note">
                  Note
                  <textarea
                    aria-label="Timesheet note"
                    value={dayDraft.note}
                    onChange={(e) => setDayDraft({ ...dayDraft, note: e.target.value })}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    save({
                      ...current,
                      days: current.days.map((d, i) => (i === selected.day ? { ...dayDraft } : d)),
                      decision: "Awaiting",
                    });
                    toast.success("Day saved");
                  }}
                >
                  Save day
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const empty = { hours: 0, kind: "Off", note: "" };
                    setDayDraft(empty);
                    save({
                      ...current,
                      days: current.days.map((d, i) => (i === selected.day ? empty : d)),
                      decision: "Awaiting",
                    });
                  }}
                >
                  Clear
                </Button>
              </div>
              <h3>The week, day by day</h3>
              <Timeline value={0} className="bt-timesheet-days">
                {days.map((date, i) => (
                  <TimelineItem key={i} step={i + 1}>
                    <TimelineSeparator />
                    <TimelineIndicator
                      className={selected.day === i ? "bt-timesheet-active-day" : ""}
                    >
                      {selected.day === i ? <Settings2 size={12} /> : <Clock3 size={12} />}
                    </TimelineIndicator>
                    <TimelineContent>
                      <button
                        aria-label={`Inspect ${dayLabel(date)}`}
                        aria-pressed={selected.day === i}
                        onClick={() => inspect(current, i)}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <b>{dayLabel(date)}</b>
                          <span>{formatHours(current.days[i].hours)}</span>
                        </span>
                        <span className="mt-1 block">{current.days[i].note || "Empty"}</span>
                        {current.days[i].hours > 0 && (
                          <small>
                            {current.days[i].kind}
                            {selected.day === i && <Tone tone="neutral">The cell you opened</Tone>}
                          </small>
                        )}
                      </button>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
