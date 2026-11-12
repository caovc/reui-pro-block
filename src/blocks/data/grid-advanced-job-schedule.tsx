import { Badge } from "@/components/reui/badge";
import { Filters, createFilterQuery, flattenFilterRules } from "@/components/reui/filters/filters";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  CloudRain,
  ListFilter,
  Package,
  Plus,
  Search,
  Settings2,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { JobDetails, type JobTab } from "./grid-advanced-job-schedule-details";
import { JobScheduleDirectFilters } from "./grid-advanced-job-schedule-filters";
import {
  CrewDayForm,
  createJobSheetClassName,
  HoldForm,
  JobProfileForm,
  SlideForm,
} from "./grid-advanced-job-schedule-forms";
import { ScheduleGrid, type JobAction } from "./grid-advanced-job-schedule-grid";
import {
  addCrewDay,
  createJob,
  createScheduleSeed,
  crew,
  crewMember,
  jobDate,
  jobName,
  jobProgress,
  jobScheduleFilterFields,
  logJob,
  nextCrewDate,
  scheduleWindow,
  summarizeJobFilters,
  taskHours,
  type Job,
} from "./grid-advanced-job-schedule-model";

type JobEditor =
  | { kind: "edit" }
  | { kind: "crew"; date: string }
  | { kind: "slide"; makeUpDate?: string }
  | { kind: "hold" };

type Panel =
  | { kind: "new" }
  | { kind: "details"; jobId: string; tab: JobTab }
  | (JobEditor & { jobId: string; returnTab?: JobTab });

function AttentionCards({
  jobs,
  onOpen,
  onMakeUp,
}: {
  jobs: Job[];
  onOpen: (job: Job, tab: JobTab, opener?: HTMLElement) => void;
  onMakeUp: (job: Job, date: string, opener: HTMLElement) => void;
}) {
  const lateJobs = jobs
    .flatMap((job) => {
      const progress = jobProgress(job);
      return progress.status === "Late" ? [{ job, days: progress.late, left: progress.left }] : [];
    })
    .sort((a, b) => b.days - a.days)
    .slice(0, 2);
  const lost = jobs
    .flatMap((job) =>
      job.hold
        ? []
        : job.days
            .filter((day) => day.state === "Lost" && !day.madeUp)
            .map((day) => ({ job, day })),
    )
    .at(0);
  const missing = jobs
    .flatMap((job) =>
      job.materials
        .filter((material) => !material.received && !material.arrives)
        .map((material) => ({ job, material })),
    )
    .at(0);
  const cards = [
    ...lateJobs.map(({ job, days, left }) => ({
      key: job.id,
      job,
      icon: CircleAlert,
      label: `${days} workdays past due`,
      detail: `${left}h left`,
      detailIcon: Clock,
      action: "View",
      variant: "destructive-light" as const,
      run: (opener: HTMLElement) => onOpen(job, "overview", opener),
    })),
    ...(lost
      ? [
          {
            key: `lost-${lost.job.id}`,
            job: lost.job,
            icon: CloudRain,
            label: /rain|weather/i.test(lost.day.reason ?? "")
              ? "Rain day to make up"
              : "Lost crew day to make up",
            detail: `${taskHours(lost.day)}h`,
            detailIcon: Clock,
            action: "Make Up",
            variant: "warning-light" as const,
            run: (opener: HTMLElement) => onMakeUp(lost.job, lost.day.date, opener),
          },
        ]
      : []),
    ...(missing
      ? [
          {
            key: `material-${missing.job.id}`,
            job: missing.job,
            icon: Package,
            label: "No delivery date",
            detail: missing.material.name,
            detailIcon: Package,
            action: "Set Date",
            variant: "info-light" as const,
            run: (opener: HTMLElement) => onOpen(missing.job, "materials", opener),
          },
        ]
      : []),
  ];
  if (!cards.length) return null;

  return (
    <div
      aria-label="Schedule attention"
      role="region"
      className="flex min-w-0 snap-x scroll-px-3 gap-2 overflow-x-auto p-3"
    >
      {cards.map(
        ({ key, job, icon: Icon, label, detail, detailIcon: DetailIcon, action, variant, run }) => (
          <Card
            size="sm"
            key={key}
            role="article"
            aria-label={`${jobName(job)}: ${label}`}
            className="min-w-[274px] grow basis-0 snap-start"
          >
            <CardHeader className="gap-x-1.5 has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto]">
              <CardTitle role="heading" aria-level={3} className="min-w-0 truncate" title={label}>
                {label}
              </CardTitle>
              <CardDescription className="flex min-w-0 flex-col gap-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Badge variant={variant} size="sm" className="size-5 shrink-0 p-0">
                    <Icon aria-hidden="true" />
                  </Badge>
                  <span className="truncate" title={jobName(job)}>
                    {jobName(job)}
                  </span>
                </span>
                <span className="flex min-w-0 items-center gap-1.5" title={detail}>
                  <DetailIcon aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="truncate">{detail}</span>
                </span>
              </CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`${action} ${jobName(job)}`}
                  onClick={(event) => run(event.currentTarget)}
                >
                  {action}
                  <ArrowRight className="hidden size-3 sm:block" />
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        ),
      )}
    </div>
  );
}

export default function JobSchedule() {
  const [schedule, setSchedule] = useState<{ jobs: Job[]; undo: Job[][] }>(() => ({
    jobs: createScheduleSeed(),
    undo: [],
  }));
  const [panel, setPanel] = useState<Panel | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const [week, setWeek] = useState(0);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState(() => createFilterQuery<string | string[]>());
  const [compact, setCompact] = useState(true);
  const [gridlines, setGridlines] = useState(true);
  const addButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement>(null);
  const deletionOpener = useRef<HTMLElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const settingsId = useId();
  const jobs = schedule.jobs;
  const dates = useMemo(() => scheduleWindow(week), [week]);
  const filterSummary = useMemo(() => summarizeJobFilters(jobs), [jobs]);
  const visible = useMemo(() => {
    const rules = flattenFilterRules(query);
    const text = search.trim().toLocaleLowerCase();
    return jobs.filter((job) => {
      if (
        text &&
        ![jobName(job), job.client, job.street, job.town, crewMember(job.lead)?.name].some(
          (value) => value?.toLocaleLowerCase().includes(text),
        )
      )
        return false;
      return rules.every((rule) => {
        if (rule.path[0] === "attention") {
          const flags = filterSummary.attentionByJob[job.id];
          const hasRisk = Object.values(flags).some(Boolean);
          if (rule.operator === "empty") return !hasRisk !== !!rule.negated;
          if (rule.operator === "not_empty") return hasRisk !== !!rule.negated;
          if (!rule.value?.length) return true;
          const values = typeof rule.value === "string" ? [rule.value] : rule.value;
          const match = values.some((value) => flags[value as keyof typeof flags] ?? false);
          const invert = rule.operator === "is_not" || rule.operator === "is_none_of";
          return match !== (invert !== !!rule.negated);
        }
        if (rule.operator === "empty") return false;
        if (rule.operator === "not_empty") return true;
        if (!rule.value?.length) return true;
        const value = rule.path[0] === "type" ? job.type : jobProgress(job).status;
        const values = typeof rule.value === "string" ? [rule.value] : rule.value;
        const match = values.includes(value);
        const invert = rule.operator === "is_not" || rule.operator === "is_none_of";
        return match !== (invert !== !!rule.negated);
      });
    });
  }, [jobs, query, search, filterSummary]);

  const rememberOpener = useCallback((target: HTMLElement) => {
    opener.current = target;
  }, []);

  function restoreFocus(target = opener.current) {
    if (target?.isConnected && target.getClientRects().length)
      target.focus({ preventScroll: true });
    if (!target || document.activeElement !== target)
      addButton.current?.focus({ preventScroll: true });
  }

  const openPanel = useCallback(
    (next: Panel, target?: HTMLElement) => {
      toast.dismiss("schedule-change");
      if (target) rememberOpener(target);
      setPanel(next);
    },
    [rememberOpener],
  );

  const openDetails = useCallback<Parameters<typeof ScheduleGrid>[0]["onOpen"]>(
    (job, tab, target) => {
      openPanel({ kind: "details", jobId: job.id, tab }, target);
    },
    [openPanel],
  );

  const openCrew = useCallback<Parameters<typeof ScheduleGrid>[0]["onCrew"]>(
    (job, date, target) => {
      openPanel(
        {
          kind: "crew",
          jobId: job.id,
          date: date ?? nextCrewDate(job),
        },
        target,
      );
    },
    [openPanel],
  );

  const undo = useCallback(() => {
    setSchedule((current) => {
      const jobs = current.undo.at(-1);
      return jobs ? { jobs, undo: current.undo.slice(0, -1) } : current;
    });
    toast.dismiss("schedule-change");
  }, []);

  const commit = useCallback(
    (change: (jobs: Job[]) => Job[], message: string) => {
      setSchedule((current) => ({
        jobs: change(current.jobs),
        undo: [...current.undo, current.jobs].slice(-20),
      }));
      toast.success(message, { id: "schedule-change", action: { label: "Undo", onClick: undo } });
    },
    [undo],
  );

  const patchJob = useCallback(
    (jobId: string, change: (job: Job) => Job, message: string) => {
      commit((jobs) => jobs.map((job) => (job.id === jobId ? change(job) : job)), message);
    },
    [commit],
  );

  const rowAction = useCallback(
    (job: Job, action: JobAction) => {
      switch (action) {
        case "view":
          openDetails(job, "overview");
          break;
        case "crew":
          openCrew(job);
          break;
        case "slide":
        case "edit":
          openPanel({ kind: action, jobId: job.id });
          break;
        case "hold":
          if (job.hold) {
            patchJob(
              job.id,
              (job) => logJob({ ...job, hold: "" }, "Job resumed", job.hold),
              "Job resumed",
            );
          } else {
            openPanel({ kind: "hold", jobId: job.id });
          }
          break;
        case "delete":
          deletionOpener.current = opener.current;
          setDeleting(job);
          break;
      }
    },
    [openCrew, openDetails, openPanel, patchJob],
  );

  const active =
    panel && panel.kind !== "new" ? jobs.find((job) => job.id === panel.jobId) : undefined;
  const returnFocus = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!returnFocus.current) return;
    returnFocus.current = false;
    panelRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
  }, [panel]);

  function closeEditor() {
    if (panel && "returnTab" in panel && panel.returnTab) {
      returnFocus.current = true;
      setPanel({ kind: "details", jobId: panel.jobId, tab: panel.returnTab });
    } else {
      setPanel(null);
    }
  }

  function renderPanel() {
    if (!panel) return null;
    if (panel.kind === "new") {
      return (
        <JobProfileForm
          key="new"
          onCancel={closeEditor}
          onSave={(profile) => {
            const job = createJob(profile);
            commit((jobs) => [job, ...jobs], "Job added");
            setSearch("");
            setQuery(createFilterQuery());
            closeEditor();
          }}
        />
      );
    }
    if (!active) return null;

    if (panel.kind === "details") {
      const openEditor = (editor: JobEditor) =>
        setPanel({ ...editor, jobId: active.id, returnTab: panel.tab });
      return (
        <JobDetails
          job={active}
          tab={panel.tab}
          onTab={(tab) => setPanel({ ...panel, tab })}
          onEdit={() => openEditor({ kind: "edit" })}
          onDelete={() => {
            deletionOpener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            setDeleting(active);
          }}
          onCrewDay={(date) =>
            openEditor({
              kind: "crew",
              date: date ?? nextCrewDate(active),
            })
          }
          onSlide={() => openEditor({ kind: "slide" })}
          onHold={() => {
            if (active.hold) rowAction(active, "hold");
            else openEditor({ kind: "hold" });
          }}
          onNotes={(notes) =>
            patchJob(
              active.id,
              (job) =>
                logJob(
                  { ...job, notes },
                  "Job notes updated",
                  notes ? "Notes saved" : "Notes cleared",
                ),
              "Notes saved",
            )
          }
          onMaterial={(id, change) =>
            patchJob(
              active.id,
              (job) => {
                const material = job.materials.find((entry) => entry.id === id);
                const materials = job.materials.map((entry) =>
                  entry.id === id ? { ...entry, ...change } : entry,
                );
                const title = change.arrives
                  ? "Material date set"
                  : change.received
                    ? "Material received"
                    : "Material receipt reopened";
                return logJob({ ...job, materials }, title, material?.name ?? "Material");
              },
              "Material updated",
            )
          }
          onInspection={(id, completed) =>
            patchJob(
              active.id,
              (job) => {
                const inspection = job.inspections.find((entry) => entry.id === id);
                const inspections = job.inspections.map((entry) =>
                  entry.id === id ? { ...entry, completed } : entry,
                );
                return logJob(
                  { ...job, inspections },
                  completed ? "Inspection signed off" : "Inspection reopened",
                  inspection?.name ?? "Inspection",
                );
              },
              "Inspection updated",
            )
          }
        />
      );
    }
    if (panel.kind === "edit") {
      return (
        <JobProfileForm
          key={active.id}
          job={active}
          onCancel={closeEditor}
          onSave={(profile) => {
            patchJob(
              active.id,
              (job) => logJob({ ...job, ...profile }, "Job updated", jobName(profile)),
              "Job updated",
            );
            closeEditor();
          }}
        />
      );
    }
    if (panel.kind === "crew") {
      return (
        <CrewDayForm
          key={`${active.id}-${panel.date}`}
          job={active}
          jobs={jobs}
          date={panel.date}
          onCancel={closeEditor}
          onSave={(day, previous) => {
            const next = addCrewDay(active, day, previous);
            if (!next) return false;
            patchJob(active.id, () => next, previous ? "Crew day updated" : "Crew day added");
            closeEditor();
            return true;
          }}
          onRemove={(date) => {
            patchJob(
              active.id,
              (job) =>
                logJob(
                  { ...job, days: job.days.filter((day) => day.date !== date) },
                  "Crew day removed",
                  jobDate(date),
                ),
              "Crew day removed",
            );
            closeEditor();
          }}
        />
      );
    }
    if (panel.kind === "slide") {
      return (
        <SlideForm
          key={`${active.id}-${panel.makeUpDate ?? "slide"}`}
          job={active}
          jobs={jobs}
          makeUpDate={panel.makeUpDate}
          onCancel={closeEditor}
          onSave={(days, detail) => {
            patchJob(
              active.id,
              (job) =>
                logJob(
                  { ...job, days },
                  panel.makeUpDate ? "Lost day made up" : "Schedule moved",
                  detail,
                ),
              "Schedule updated",
            );
            closeEditor();
          }}
        />
      );
    }
    return (
      <HoldForm
        key={active.id}
        job={active}
        onCancel={closeEditor}
        onSave={(reason) => {
          patchJob(
            active.id,
            (job) => logJob({ ...job, hold: reason }, "Job put on hold", reason),
            "Job put on hold",
          );
          closeEditor();
        }}
      />
    );
  }

  return (
    <section aria-label="Job schedule" className="mx-auto w-full min-w-0 max-w-[1216px]">
      <Frame dense>
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-3 p-3 sm:px-4">
          <div className="min-w-0">
            <FrameTitle>
              <h1>Job Schedule</h1>
            </FrameTitle>
            <FrameDescription className="flex flex-wrap items-center gap-x-1.5 tabular-nums">
              <CalendarDays className="size-3.5" />
              {jobDate(dates[0])} – {jobDate(dates[dates.length - 1])}
              <span aria-hidden="true">·</span>
              {jobs.length} jobs
              <span aria-hidden="true">·</span>
              <span>{crew.length} crew members</span>
            </FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonGroup aria-label="Schedule dates">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous week"
                onClick={() => setWeek((current) => current - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeek(0)}>
                Today
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next week"
                onClick={() => setWeek((current) => current + 1)}
              >
                <ChevronRight />
              </Button>
            </ButtonGroup>
            {schedule.undo.length > 0 && (
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Undo last schedule change"
                onClick={undo}
              >
                <Undo2 />
              </Button>
            )}
            <Button
              ref={addButton}
              size="sm"
              onClick={(event) => openPanel({ kind: "new" }, event.currentTarget)}
            >
              <Plus /> Add Job
            </Button>
          </div>
        </FrameHeader>

        <AttentionCards
          jobs={jobs}
          onOpen={openDetails}
          onMakeUp={(job, date, target) => {
            openPanel({ kind: "slide", jobId: job.id, makeUpDate: date }, target);
          }}
        />

        <FramePanel className="min-w-0 p-0">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
            <JobScheduleDirectFilters
              query={query}
              onQueryChange={setQuery}
              summary={filterSummary}
              typeTriggerRef={filterTrigger}
            />
            <Filters
              fields={jobScheduleFilterFields}
              query={query}
              onQueryChange={setQuery}
              showClear
              size="sm"
              className="order-last min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-auto"
              trigger={
                <Button variant="outline" size="sm">
                  <ListFilter /> Filter
                </Button>
              }
            />
            <Button
              ref={searchButton}
              variant={searchOpen ? "secondary" : "outline"}
              size="icon-sm"
              className="sm:hidden"
              aria-label={searchOpen ? "Hide job search" : "Show job search"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((value) => !value)}
            >
              <Search />
            </Button>
            <InputGroup
              className={cn(
                "order-last h-8 w-full sm:order-none sm:flex sm:w-48",
                !searchOpen && "hidden",
              )}
            >
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchInput}
                aria-label="Search jobs"
                placeholder="Search jobs..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && searchOpen) {
                    setSearchOpen(false);
                    searchButton.current?.focus();
                  }
                }}
              />
              {search && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="Clear job search"
                    onClick={() => {
                      setSearch("");
                      searchInput.current?.focus();
                    }}
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Schedule settings">
                  <Settings2 />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="grid w-52 gap-3">
                <Field orientation="horizontal" className="justify-between">
                  <FieldLabel htmlFor={`${settingsId}-compact`}>Compact rows</FieldLabel>
                  <Switch
                    id={`${settingsId}-compact`}
                    checked={compact}
                    onCheckedChange={setCompact}
                  />
                </Field>
                <Field orientation="horizontal" className="justify-between">
                  <FieldLabel htmlFor={`${settingsId}-gridlines`}>Grid lines</FieldLabel>
                  <Switch
                    id={`${settingsId}-gridlines`}
                    checked={gridlines}
                    onCheckedChange={setGridlines}
                  />
                </Field>
              </PopoverContent>
            </Popover>
          </div>
          <ScheduleGrid
            jobs={jobs}
            visible={visible}
            dates={dates}
            compact={compact}
            gridlines={gridlines}
            onOpen={openDetails}
            onCrew={openCrew}
            onAction={rowAction}
            onOpener={rememberOpener}
            onClearFilters={() => {
              setQuery(createFilterQuery());
              setSearch("");
              filterTrigger.current?.focus({ preventScroll: true });
            }}
          />
        </FramePanel>
      </Frame>

      <Sheet
        open={!!panel}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent
          ref={panelRef}
          className={cn(
            "gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[512px]",
            panel?.kind === "new" && createJobSheetClassName,
          )}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
        >
          {renderPanel()}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus(deletionOpener.current);
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {deleting ? jobName(deleting) : "this job"} and its schedule. You can undo the
              deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                commit((jobs) => jobs.filter((job) => job.id !== deleting.id), "Job deleted");
                setDeleting(null);
                setPanel(null);
              }}
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
