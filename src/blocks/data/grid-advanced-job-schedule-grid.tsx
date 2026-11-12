import { Badge } from "@/components/reui/badge";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
  DataGridTableRowExpand,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { FrameFooter } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  CalendarClock,
  CalendarPlus,
  ClipboardCheck,
  Ellipsis,
  Eye,
  PackageCheck,
  Pause,
  Pencil,
  Play,
  Plus,
  SearchX,
  Trash2,
} from "lucide-react";
import { createContext, useContext, useMemo } from "react";
import {
  JobAtGlance,
  JobAvatar,
  JobStatusBadge,
  type JobTab,
} from "./grid-advanced-job-schedule-details";
import {
  SCHEDULE_TODAY,
  calendarDate,
  crewLoad,
  crewMember,
  jobDate,
  jobName,
  jobProgress,
  taskHours,
  type Job,
} from "./grid-advanced-job-schedule-model";

type OpenJob = (job: Job, tab: JobTab, opener?: HTMLElement) => void;
type OpenCrew = (job: Job, date?: string, opener?: HTMLElement) => void;
export type JobAction = "crew" | "slide" | "hold" | "view" | "edit" | "delete";

function JobMenu({
  job,
  onAction,
  onOpener,
}: {
  job: Job;
  onAction: (job: Job, action: JobAction) => void;
  onOpener: (opener: HTMLElement) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${jobName(job)}`}
          onFocus={(event) => onOpener(event.currentTarget)}
          onPointerDown={(event) => onOpener(event.currentTarget)}
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onAction(job, "crew")}>
            <CalendarPlus />
            Add Crew Day
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction(job, "slide")}>
            <CalendarClock />
            Slide Schedule
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction(job, "hold")}>
            {job.hold ? <Play /> : <Pause />}
            {job.hold ? "Resume Job" : "Hold Job"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onAction(job, "view")}>
            <Eye />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction(job, "edit")}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => onAction(job, "delete")}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const CrewLoadContext = createContext<Record<string, ReturnType<typeof crewLoad>>>({});

function DayHeader({ date }: { date: string }) {
  const load = useContext(CrewLoadContext)[date];
  const day = calendarDate(date);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-10 w-full flex-col gap-0 px-0 text-xs leading-4 tabular-nums",
            date === SCHEDULE_TODAY && "text-primary",
          )}
          aria-label={`Crew load for ${jobDate(date, true)}`}
          aria-current={date === SCHEDULE_TODAY ? "date" : undefined}
        >
          <span className="text-[10px] font-normal">
            {["Su", "M", "Tu", "W", "Th", "F", "Sa"][day.getDay()]}
          </span>
          {day.getDate()}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-64">
        <h3 className="text-sm font-semibold">{jobDate(date, true)}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {load.people} crew · {load.hours}h scheduled
        </p>
        {load.assignments.length > 0 && (
          <ul className="mt-2 max-h-56 divide-y overflow-y-auto text-xs">
            {load.assignments.map((task) => (
              <li key={`${task.jobId}-${task.id}`} className="py-2">
                <p className="font-medium">
                  {crewMember(task.crewId)?.name ?? task.crewId} · {task.hours}h
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {task.job} · {task.task}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DayCell({
  job,
  date,
  onOpen,
  onCrew,
}: {
  job: Job;
  date: string;
  onOpen: OpenJob;
  onCrew: OpenCrew;
}) {
  const day = job.days.find((entry) => entry.date === date);
  const material = job.materials.find((entry) => entry.arrives === date);
  const inspection = job.inspections.find((entry) => entry.date === date);
  const appointment = [material?.name, inspection?.name].filter(Boolean).join(", ");
  const label = `${jobName(job)}, ${jobDate(date, true)}`;

  if (day) {
    const variant = {
      Done: "secondary",
      Planned: "primary-light",
      Lost: "destructive-light",
    } as const;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="relative h-8 w-full p-0"
        aria-label={`Edit Crew Day, ${label}, ${day.state}, ${taskHours(day)} hours${appointment ? `, ${appointment}` : ""}`}
        title={[day.reason, appointment].filter(Boolean).join(" · ") || undefined}
        onClick={(event) => onCrew(job, date, event.currentTarget)}
      >
        <Badge
          variant={variant[day.state]}
          size="sm"
          className={cn(
            "min-w-6 px-0.5 font-normal tabular-nums",
            day.state === "Planned" && "bg-violet-500/10 text-violet-700 dark:text-violet-300",
          )}
        >
          {taskHours(day)}h
        </Badge>
        {appointment && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute end-0 top-1 size-1.5 rounded-full",
              material ? "bg-blue-500" : "bg-emerald-500",
            )}
          />
        )}
      </Button>
    );
  }

  if (material || inspection) {
    const Icon = material ? PackageCheck : ClipboardCheck;
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className={
          material ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"
        }
        aria-label={`${appointment}, ${label}`}
        onClick={(event) => onOpen(job, material ? "materials" : "overview", event.currentTarget)}
      >
        <Icon />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground [&>svg]:opacity-0 hover:[&>svg]:opacity-100 focus-visible:[&>svg]:opacity-100"
      aria-label={`${date < SCHEDULE_TODAY ? "Log" : "Add"} Crew Day, ${label}`}
      onClick={(event) => onCrew(job, date, event.currentTarget)}
    >
      <Plus />
    </Button>
  );
}

export function ScheduleGrid({
  jobs,
  visible,
  dates,
  compact,
  gridlines,
  onOpen,
  onCrew,
  onAction,
  onOpener,
  onClearFilters,
}: {
  jobs: Job[];
  visible: Job[];
  dates: string[];
  compact: boolean;
  gridlines: boolean;
  onOpen: OpenJob;
  onCrew: OpenCrew;
  onAction: (job: Job, action: JobAction) => void;
  onOpener: (opener: HTMLElement) => void;
  onClearFilters: () => void;
}) {
  const loads = useMemo(
    () => Object.fromEntries(dates.map((date) => [date, crewLoad(jobs, date)])),
    [jobs, dates],
  );
  const columns = useMemo<ColumnDef<DataGridFeatures, Job>[]>(
    () => [
      {
        id: "select",
        size: 42,
        enableSorting: false,
        header: DataGridTableRowSelectAll,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        meta: { headerClassName: "p-0 text-center", cellClassName: "p-0 text-center" },
      },
      {
        id: "job",
        accessorFn: jobName,
        size: 190,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Job" />,
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="flex min-w-0 items-center gap-1">
              <DataGridTableRowExpand row={row} />
              <JobAvatar name={job.client} className="size-7 shrink-0" />
              <div className="min-w-0">
                <Button
                  variant="link"
                  size="sm"
                  className="block h-auto max-w-full truncate p-0 text-left font-medium text-foreground"
                  onClick={(event) => onOpen(job, "overview", event.currentTarget)}
                >
                  {jobName(job)}
                </Button>
                <JobStatusBadge status={jobProgress(job).status} />
              </div>
            </div>
          );
        },
        meta: {
          cellClassName: "px-1 py-0",
          expandedContent: (job) => <JobAtGlance job={job} />,
        },
      },
      ...dates.map((date, index): ColumnDef<DataGridFeatures, Job> => {
        const boundary = index % 5 === 0 && index > 0;
        const tint = date === SCHEDULE_TODAY ? "bg-primary/6" : boundary ? "border-s" : "";
        return {
          id: date,
          size: 37,
          enableSorting: false,
          header: () => <DayHeader date={date} />,
          cell: ({ row }) => (
            <DayCell job={row.original} date={date} onOpen={onOpen} onCrew={onCrew} />
          ),
          meta: { headerClassName: cn("p-0", tint), cellClassName: cn("p-0 text-center", tint) },
        };
      }),
      {
        id: "finish",
        accessorFn: (job) => jobProgress(job).finish,
        size: 96,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Finish" />,
        cell: ({ row }) => {
          const { finish, late } = jobProgress(row.original);
          return (
            <div className="whitespace-nowrap text-xs tabular-nums">
              <div className={cn("font-medium", late > 0 && "text-destructive")}>
                {jobDate(finish)}
              </div>
              <div className="text-muted-foreground">Due {jobDate(row.original.due)}</div>
            </div>
          );
        },
      },
      {
        id: "actions",
        size: 41,
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <JobMenu job={row.original} onAction={onAction} onOpener={onOpener} />,
        meta: { headerClassName: "p-0", cellClassName: "p-0 text-center" },
      },
    ],
    [dates, onOpen, onCrew, onAction, onOpener],
  );
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: visible,
    getRowId: (job) => job.id,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      columnPinning: { start: ["select", "job"], end: [] },
    },
  });

  return (
    <CrewLoadContext.Provider value={loads}>
      <DataGrid
        table={table}
        recordCount={visible.length}
        emptyMessage={
          <Empty className="min-h-52">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>No Matching Jobs</EmptyTitle>
              <EmptyDescription>Pick another filter or clear the search.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear Filters
              </Button>
            </EmptyContent>
          </Empty>
        }
        tableLayout={{
          dense: compact,
          width: "fixed",
          columnsPinnable: true,
          cellBorder: gridlines,
        }}
        tableClassNames={{ base: "min-w-[1109px]", bodyRow: compact ? "h-12" : "h-[57px]" }}
      >
        <DataGridContainer>
          <DataGridScrollArea orientation="horizontal">
            <DataGridTable
              footerContent={
                visible.length > 0 ? (
                  <DataGridTableFootRow>
                    <DataGridTableFootRowCell
                      colSpan={2}
                      className="sticky start-0 z-30 bg-card px-3"
                    >
                      <span className="text-xs font-medium">Crew Load</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">People · Hours</span>
                    </DataGridTableFootRowCell>
                    {dates.map((date) => {
                      const { people, hours } = loads[date];
                      return (
                        <DataGridTableFootRowCell
                          key={date}
                          className={cn(
                            "px-0 text-center",
                            date === SCHEDULE_TODAY && "bg-primary/6",
                          )}
                        >
                          <span
                            aria-label={`${people} people, ${hours} hours on ${jobDate(date)}`}
                            role="img"
                          >
                            <span
                              aria-hidden="true"
                              className="mx-auto flex min-h-2 max-w-5 flex-wrap justify-center gap-0.5"
                            >
                              {Array.from({ length: Math.min(people, 6) }, (_, dot) => (
                                <span
                                  key={dot}
                                  className={cn(
                                    "size-1 rounded-full",
                                    people > 5 ? "bg-amber-500" : "bg-primary/65",
                                  )}
                                />
                              ))}
                            </span>
                            <span
                              aria-hidden="true"
                              className="text-[10px] tabular-nums text-muted-foreground"
                            >
                              {hours ? `${hours}h` : "—"}
                            </span>
                          </span>
                        </DataGridTableFootRowCell>
                      );
                    })}
                    <DataGridTableFootRowCell colSpan={2} />
                  </DataGridTableFootRow>
                ) : undefined
              }
            />
          </DataGridScrollArea>
        </DataGridContainer>
        <FrameFooter className="border-t">
          <DataGridPagination sizes={[10, 20, 50]} info="{from} - {to} of {count} jobs" />
        </FrameFooter>
      </DataGrid>
    </CrewLoadContext.Provider>
  );
}
