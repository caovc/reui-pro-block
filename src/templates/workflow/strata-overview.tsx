import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  CalendarClock,
  CircleX,
  Database,
  Ellipsis,
  Layers,
  ListFilter,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { ReferenceLine } from "recharts";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import {
  Filters,
  createFilterQuery,
  flattenFilterRules,
  type FilterField,
} from "@/components/reui/filters/filters";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DomainGridSurface,
  domainSelectionColumn,
  useDomainGrid,
  type DomainColumn,
} from "@/blocks/data/grid-advanced-model-grid";
import { MiniTrend, HealthSegments } from "@/blocks/data/sparkline-primitives";
import { HourColumns } from "@/blocks/data/bar-hour-columns";
import {
  STRATA_NOW_MS,
  STRATA_OWNERS,
  STRATA_SERVICES,
  strataOwner,
  strataService,
  type StrataEnvironmentFilter,
  type StrataPageProps,
} from "./strata-domain";
import { StrataHeaderActions } from "./strata-context";
import { StrataJobForm } from "./strata-job-form";
import { strataCronLabel } from "./strata-cron";
import {
  strataJobHealth,
  strataJobHistory,
  strataJobsMetrics,
  type StrataJob,
  type StrataJobRun,
  type StrataJobOutcome,
  type useStrataJobsModel,
} from "./strata-jobs-model";
import "./strata-overview.css";

const tones = { healthy: "#00bc7d", failing: "#ef4444", paused: "#8b5cf6", timeout: "#f5b400" };
const outcomeNames: StrataJobOutcome[] = ["Succeeded", "Timed Out", "Failed"];
const outcomeColors = [tones.healthy, tones.timeout, tones.failing];
const tabs = ["All", "Healthy", "Failing", "Paused"] as const;
type TableJob = StrataJob & {
  health: string;
  lastRun?: StrataJobRun;
  history: StrataJobRun[];
  service: string;
  owner: string;
};

function ago(at: number) {
  const minutes = Math.max(0, Math.floor((STRATA_NOW_MS - at) / 60000));
  return minutes < 1
    ? "Just now"
    : minutes < 60
      ? `${minutes}m ago`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""} ago`
        : `${Math.floor(minutes / 1440)}d ago`;
}
function duration(seconds: number) {
  return seconds < 60
    ? `${Math.round(seconds)}s`
    : seconds < 3600
      ? `${Math.floor(seconds / 60)}m${seconds % 60 ? ` ${Math.round(seconds % 60)}s` : ""}`
      : `${Math.floor(seconds / 3600)}h ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m`;
}
function future(at: number) {
  const minutes = Math.round((at - STRATA_NOW_MS) / 60000);
  return minutes < 60 ? `in ${minutes}m` : `in ${Math.floor(minutes / 60)}h`;
}
function Owner({ id }: { id: string }) {
  const owner = strataOwner(id);
  return (
    <span className="strata-job-owner">
      <Avatar className="size-5">
        <AvatarFallback className="text-[8px]">
          {owner?.name
            .split(" ")
            .map((part) => part[0])
            .join("") ?? "?"}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{owner?.name ?? "Unassigned"}</span>
    </span>
  );
}
function Outcome({ value }: { value: StrataJobOutcome }) {
  return (
    <Badge
      variant={
        value === "Succeeded"
          ? "success-light"
          : value === "Failed"
            ? "destructive-light"
            : "warning-light"
      }
      size="sm"
    >
      {value}
    </Badge>
  );
}
function Legend({ items }: { items: { name: string; value: number; color: string }[] }) {
  return (
    <dl className="strata-job-legend">
      {items.map((item) => (
        <div key={item.name}>
          <span style={{ backgroundColor: item.color }} />
          <dt>
            <strong>{item.value}</strong> {item.name}
          </dt>
        </div>
      ))}
    </dl>
  );
}
function Metric({
  title,
  detail,
  icon,
  children,
  footer,
}: {
  title: string;
  detail: string;
  icon: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Frame className="strata-job-metric" spacing="sm">
      <FramePanel>
        <div className="strata-job-metric-title">
          <IconTile variant="frame" size="sm">
            {icon}
          </IconTile>
          <div>
            <h2>{title}</h2>
            <p>{detail}</p>
          </div>
        </div>
        {children}
      </FramePanel>
      <FrameFooter>{footer}</FrameFooter>
    </Frame>
  );
}

const filterFields: FilterField<string | string[]>[] = [
  {
    id: "health",
    label: "Status",
    type: "select",
    options: tabs.slice(1).map((value) => ({ value, label: value })),
  },
  {
    id: "serviceId",
    label: "Service",
    type: "select",
    options: STRATA_SERVICES.map((service) => ({ value: service.id, label: service.name })),
  },
  {
    id: "ownerId",
    label: "Owner",
    type: "select",
    options: STRATA_OWNERS.map((owner) => ({ value: owner.id, label: owner.name })),
  },
];

export function StrataOverview({
  model,
  environment,
  onEnvironmentChange,
  onNavigate,
}: StrataPageProps & { model: ReturnType<typeof useStrataJobsModel> }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const createTrigger = useRef<HTMLButtonElement>(null);
  const { setEnabled } = model;
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [query, setQuery] = useState(() => createFilterQuery<string | string[]>());
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selection, setSelection] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>(outcomeNames);
  const [announcement, setAnnouncement] = useState("");
  const jobs = useMemo(
    () => model.jobs.filter((job) => environment === "all" || job.environment === environment),
    [model.jobs, environment],
  );
  const metrics = useMemo(() => strataJobsMetrics(jobs, model.runs), [jobs, model.runs]);
  const rows = useMemo<TableJob[]>(
    () =>
      jobs.map((job) => ({
        ...job,
        health: strataJobHealth(job, model.runs),
        lastRun: strataJobHistory(job.id, model.runs, 1)[0],
        history: strataJobHistory(job.id, model.runs),
        service: strataService(job.serviceId)?.name ?? job.serviceId,
        owner: strataOwner(job.ownerId)?.name ?? job.ownerId,
      })),
    [jobs, model.runs],
  );
  const rules = useMemo(() => flattenFilterRules(query), [query]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (tab === "All" || row.health === tab) &&
          rules.every((rule) => {
            if (
              rule.value == null ||
              rule.value === "" ||
              (Array.isArray(rule.value) && !rule.value.length)
            )
              return true;
            const value = row[rule.path[0] as "health" | "serviceId" | "ownerId"];
            const included = Array.isArray(rule.value)
              ? rule.value.includes(value)
              : rule.value === value;
            const positive = !["is_not", "is_none_of"].includes(rule.operator);
            return rule.negated ? included !== positive : included === positive;
          }),
      ),
    [rows, tab, rules],
  );
  const columns = useMemo<DomainColumn<TableJob>[]>(
    () => [
      domainSelectionColumn<TableJob>((row) => row.name),
      {
        id: "name",
        accessorKey: "name",
        header: "Job",
        size: 232,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="strata-job-name">
            <span>{row.original.name}</span>
            <code>{row.original.command}</code>
          </div>
        ),
      },
      {
        id: "cron",
        accessorKey: "cron",
        header: "Schedule",
        size: 142,
        cell: ({ row }) => (
          <div className="strata-job-name">
            <span>{strataCronLabel(row.original.cron)}</span>
            <code>{row.original.cron}</code>
          </div>
        ),
      },
      {
        id: "enabled",
        accessorKey: "enabled",
        header: "Enabled",
        size: 82,
        cell: ({ row }) => (
          <Switch
            aria-label={`Enable ${row.original.name}`}
            checked={row.original.enabled}
            onCheckedChange={(checked) => setEnabled(row.original.id, checked)}
          />
        ),
      },
      {
        id: "lastRun",
        accessorFn: (row) => row.lastRun?.at ?? 0,
        header: "Last Run",
        size: 154,
        cell: ({ row }) =>
          row.original.lastRun ? (
            <div>
              <Outcome value={row.original.lastRun.outcome} />
              <p className="strata-job-muted">
                {ago(row.original.lastRun.at)} · {duration(row.original.lastRun.durationSeconds)}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground">Not run yet</span>
          ),
      },
      {
        id: "history",
        header: "Last 20 Runs",
        size: 142,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.history.length ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="strata-job-history"
                  aria-label={`${row.original.name}: ${row.original.history.filter((run) => run.outcome === "Succeeded").length} of ${row.original.history.length} recent runs succeeded`}
                >
                  <MiniTrend
                    label="Recent run outcomes"
                    values={[...row.original.history].reverse().map(() => 1)}
                    bars
                    height={24}
                    domain={[0, 1]}
                    colors={[...row.original.history]
                      .reverse()
                      .map((run) =>
                        run.outcome === "Succeeded"
                          ? tones.healthy
                          : run.outcome === "Failed"
                            ? tones.failing
                            : tones.timeout,
                      )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {row.original.history.filter((run) => run.outcome === "Succeeded").length} of{" "}
                {row.original.history.length} recent runs succeeded
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="strata-job-muted">No history</span>
          ),
      },
      {
        id: "service",
        accessorKey: "service",
        header: "Target",
        size: 157,
        cell: ({ row }) => (
          <button
            type="button"
            className="strata-job-target"
            onClick={() =>
              onNavigate(
                row.original.serviceId === "checkout-api" ? "/services/checkout-api" : "/services",
              )
            }
          >
            <span>
              <Database />
              {row.original.service}
            </span>
            <code>{row.original.cluster}</code>
          </button>
        ),
      },
      {
        id: "owner",
        accessorKey: "owner",
        header: "Owner",
        size: 165,
        cell: ({ row }) => <Owner id={row.original.ownerId} />,
      },
      {
        id: "actions",
        size: 36,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${row.original.name}`}
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEnabled(row.original.id, !row.original.enabled)}>
                {row.original.enabled ? "Pause job" : "Resume job"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setSearch(row.original.name);
                  setPagination((current) => ({ ...current, pageIndex: 0 }));
                }}
              >
                Show this job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [setEnabled, onNavigate],
  );
  const table = useDomainGrid({
    data: filtered,
    columns,
    search,
    pagination,
    onPaginationChange: setPagination,
    selection,
    onSelectionChange: setSelection,
    globalFilterFn: (row, value) =>
      `${row.name} ${row.command} ${row.service} ${row.owner} ${row.cluster}`
        .toLowerCase()
        .includes(value.toLowerCase()),
  });
  const next = metrics.upcoming[0];
  const nextHistory = next ? strataJobHistory(next.job.id, model.runs, 1)[0] : undefined;
  const uniqueUpcoming = metrics.upcoming.filter(
    (item, index, all) =>
      item.at <= STRATA_NOW_MS + 1800000 &&
      all.findIndex((other) => other.job.id === item.job.id) === index,
  );
  const plotted = metrics.hours.map((hour) => ({
    label: hour.label,
    segments: hour.segments.map((value, index) =>
      outcomes.includes(outcomeNames[index]) ? value : 0,
    ),
  }));
  const totalSeconds = metrics.secondsByOutcome.reduce(
    (sum, seconds, index) => sum + (outcomes.includes(outcomeNames[index]) ? seconds : 0),
    0,
  );
  const maximum = Math.max(
    30,
    Math.ceil(
      Math.max(...plotted.map((hour) => hour.segments.reduce((sum, value) => sum + value, 0))) / 30,
    ) * 30,
  );
  const averageMinutes = totalSeconds / 60 / 24;
  const rates = metrics.hours.filter((hour) => hour.successRate !== null);
  const showJob = (job: StrataJob) => {
    setTab("All");
    setSearch(job.name);
    setQuery(createFilterQuery());
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    document
      .getElementById("strata-jobs-heading")
      ?.scrollIntoView({ block: "start", behavior: "instant" });
  };
  return (
    <div className="strata-overview">
      <h1 className="sr-only">Overview</h1>
      <StrataHeaderActions>
        <Select
          value={environment}
          onValueChange={(value) => {
            onEnvironmentChange(value as StrataEnvironmentFilter);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="strata-jobs-environment" aria-label="Environment">
            <SelectValue>
              <span className="strata-env-desktop">
                {environment === "all" ? "All Environments" : environment}
              </span>
              <span className="strata-env-phone">
                {environment === "all" ? "All" : environment}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {["all", "Production", "Staging", "Sandbox"].map((value) => (
              <SelectItem key={value} value={value}>
                {value === "all" ? "All Environments" : value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          ref={createTrigger}
          onClick={() => {
            setFormVersion((version) => version + 1);
            setCreateOpen(true);
          }}
        >
          <Plus />
          New Job
        </Button>
      </StrataHeaderActions>
      <div className="strata-jobs-metrics">
        <Metric
          title="Active Jobs"
          detail={`${metrics.paused} paused`}
          icon={<Layers />}
          footer={
            <Legend
              items={[
                { name: "Healthy", value: metrics.healthy, color: tones.healthy },
                { name: "Failing", value: metrics.failing, color: tones.failing },
                { name: "Paused", value: metrics.paused, color: tones.paused },
              ]}
            />
          }
        >
          <p className="strata-job-value">
            {metrics.active}
            <small>of {jobs.length}</small>
          </p>
          <div className="strata-job-subline">
            <span>Paused</span>
            <strong>{jobs.find((job) => !job.enabled)?.name ?? "No paused jobs"}</strong>
          </div>
          {jobs.length > 0 && (
            <MiniTrend
              label={`${metrics.healthy} healthy, ${metrics.failing} failing, ${metrics.paused} paused jobs`}
              values={jobs.map(() => 1)}
              bars
              height={24}
              domain={[0, 1]}
              colors={[
                ...Array.from({ length: metrics.healthy }, () => tones.healthy),
                ...Array.from({ length: metrics.failing }, () => tones.failing),
                ...Array.from({ length: metrics.paused }, () => tones.paused),
              ]}
            />
          )}
        </Metric>
        <Metric
          title="Success Rate"
          detail={`${metrics.succeeded} of ${metrics.runs} runs`}
          icon={<Activity />}
          footer={
            <Legend
              items={[
                {
                  name: `of ${metrics.measuredHours} hours in SLO`,
                  value: metrics.hoursInSlo,
                  color: tones.healthy,
                },
                {
                  name: "below",
                  value: metrics.measuredHours - metrics.hoursInSlo,
                  color: tones.timeout,
                },
              ]}
            />
          }
        >
          <p className="strata-job-value">
            {metrics.successRate === null ? "—" : `${metrics.successRate.toFixed(1)}%`}
            {metrics.successRate !== null && metrics.successRate < 99.5 && (
              <Badge variant="warning-light" size="sm">
                Below SLO
              </Badge>
            )}
          </p>
          {rates.length > 0 ? (
            <MiniTrend
              label="Hourly job success rate"
              values={rates.map((hour) => hour.successRate!)}
              names={rates.map((hour) => `${hour.label} UTC`)}
              area
              color={tones.healthy}
              threshold={99.5}
              height={54}
              domain={[Math.min(95, ...rates.map((hour) => hour.successRate!)) - 1, 100.5]}
              keyboard
              tooltips
              format={(value) => `${value.toFixed(1)}%`}
            />
          ) : (
            <p className="strata-job-muted">No runs in this environment.</p>
          )}
        </Metric>
        <Metric
          title="Failed Runs"
          detail={`across ${metrics.failedJobs} jobs`}
          icon={<CircleX />}
          footer={
            <Legend
              items={[
                { name: "Failed", value: metrics.failed, color: tones.failing },
                { name: "Timed Out", value: metrics.timedOut, color: tones.timeout },
              ]}
            />
          }
        >
          <p className="strata-job-value">{metrics.failed + metrics.timedOut}</p>
          <div className="strata-job-subline">
            <span>Worst</span>
            <strong>{metrics.worst?.job.name ?? "No failed runs"}</strong>
            <span>
              {metrics.worst
                ? `${metrics.worst.count} of ${metrics.failed + metrics.timedOut}`
                : ""}
            </span>
          </div>
          {metrics.failed + metrics.timedOut > 0 && (
            <HealthSegments
              label="Failed and timed-out runs"
              height={6}
              parts={[
                { label: "Failed", value: metrics.failed, color: tones.failing },
                { label: "Timed Out", value: metrics.timedOut, color: tones.timeout },
              ]}
            />
          )}
        </Metric>
        <Metric
          title="Next Run"
          detail={`${metrics.upcoming.length} runs in the next hour`}
          icon={<CalendarClock />}
          footer={
            <div className="strata-job-next-foot">
              <span>
                {nextHistory
                  ? `${new Date(nextHistory.at).toISOString().slice(11, 16)} ${nextHistory.outcome}`
                  : "No recent run"}
              </span>
              <span>{next ? new Date(next.at).toISOString().slice(11, 16) : "—"}</span>
            </div>
          }
        >
          <p className="strata-job-value">
            {next ? future(next.at) : "No runs"}
            <small>
              {next ? `${new Date(next.at).toISOString().slice(11, 16)} UTC` : "scheduled"}
            </small>
          </p>
          <div className="strata-job-subline">
            <strong>{next?.job.name ?? "Enable a job to schedule its next run."}</strong>
            {next && strataJobHealth(next.job, model.runs) === "Failing" && (
              <Badge variant="destructive-light" size="sm">
                Failing
              </Badge>
            )}
          </div>
          <Progress
            value={
              next && nextHistory
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      ((STRATA_NOW_MS - nextHistory.at) / (next.at - nextHistory.at)) * 100,
                    ),
                  )
                : 0
            }
            aria-label="Time elapsed before the next scheduled run"
            className="h-1.5"
          />
        </Metric>
      </div>
      <DomainGridSurface
        table={table}
        scrollArea="horizontal"
        className="strata-jobs-table"
        paginationControls={{ noun: "jobs", sizes: [10, 20, 50] }}
        renderFrame={(content) => (
          <Frame dense className="strata-jobs-frame">
            <FrameHeader className="strata-jobs-frame-header">
              <div>
                <FrameTitle id="strata-jobs-heading">Jobs</FrameTitle>
                <FrameDescription>
                  {jobs.length} jobs · {metrics.failing} failing
                  {selection.length ? ` · ${selection.length} selected` : ""}
                </FrameDescription>
              </div>
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    className="sm:w-auto sm:px-2.5"
                    aria-label="Display columns"
                  >
                    <SlidersHorizontal />
                    <span className="hidden sm:inline">Display</span>
                  </Button>
                }
              />
            </FrameHeader>
            <FramePanel className="p-0">
              <Tabs
                value={tab}
                onValueChange={(value) => {
                  setTab(value as typeof tab);
                  setPagination((current) => ({ ...current, pageIndex: 0 }));
                }}
              >
                <TabsList variant="line" className="strata-job-tabs">
                  {tabs.map((name) => (
                    <TabsTrigger key={name} value={name}>
                      {name}
                      <span>
                        {name === "All"
                          ? jobs.length
                          : rows.filter((row) => row.health === name).length}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value={tab} className="m-0">
                  <div className="strata-jobs-toolbar">
                    <InputGroup className="strata-jobs-search">
                      <InputGroupAddon>
                        <Search />
                      </InputGroupAddon>
                      <InputGroupInput
                        aria-label="Search jobs"
                        placeholder="Search jobs or commands..."
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setPagination((current) => ({ ...current, pageIndex: 0 }));
                        }}
                      />
                    </InputGroup>
                    <Filters
                      fields={filterFields}
                      query={query}
                      onQueryChange={(value) => {
                        setQuery(value);
                        setPagination((current) => ({ ...current, pageIndex: 0 }));
                      }}
                      size="sm"
                      showClear
                      trigger={
                        <Button variant="outline" aria-label="Filter jobs">
                          <ListFilter />
                          <span className="hidden sm:inline">Filter</span>
                        </Button>
                      }
                    />
                  </div>
                  {content}
                </TabsContent>
              </Tabs>
            </FramePanel>
          </Frame>
        )}
      />
      <div className="strata-jobs-bottom">
        <Frame dense>
          <FrameHeader className="strata-jobs-runtime-header">
            <div>
              <FrameTitle>Run Time</FrameTitle>
              <FrameDescription>Runner time by start hour, UTC</FrameDescription>
            </div>
            <ToggleGroup
              type="multiple"
              value={outcomes}
              onValueChange={setOutcomes}
              variant="outline"
              size="sm"
              className="strata-job-outcomes"
              aria-label="Run time outcomes"
            >
              {outcomeNames.map((name, index) => (
                <ToggleGroupItem key={name} value={name}>
                  <span style={{ backgroundColor: outcomeColors[index] }} />
                  {name}
                  <strong>{duration(metrics.secondsByOutcome[index])}</strong>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FrameHeader>
          <FramePanel>
            <div className="strata-runtime-summary">
              <strong>{duration(totalSeconds)}</strong>
              <span>runner time</span>
              {outcomes.length === 3 && metrics.priorSeconds > 0 && (
                <span>
                  {Math.round((totalSeconds / metrics.priorSeconds - 1) * 100)}% vs prior 24h
                </span>
              )}
              <span>
                {metrics.runs
                  ? `${(
                      ((metrics.secondsByOutcome[1] + metrics.secondsByOutcome[2]) /
                        Math.max(
                          1,
                          metrics.secondsByOutcome.reduce((a, b) => a + b, 0),
                        )) *
                      100
                    ).toFixed(1)}% on failed or timed out runs`
                  : "No recent runs"}
              </span>
            </div>
            <HourColumns
              label="Job runner time by UTC start hour"
              data={plotted}
              colors={outcomeColors}
              seriesNames={outcomeNames}
              max={maximum}
              tickValues={[0, maximum / 3, (maximum * 2) / 3, maximum]}
              format={(value) => `${Math.round(value)}m`}
              chartLayers={
                <ReferenceLine
                  y={averageMinutes}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="3 3"
                  label={{
                    value: `Avg ${Math.round(averageMinutes)}m`,
                    position: "insideTopRight",
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />
              }
            />
          </FramePanel>
        </Frame>
        <Frame dense>
          <FrameHeader>
            <FrameTitle>Up Next</FrameTitle>
            <FrameDescription>Next 30 minutes</FrameDescription>
          </FrameHeader>
          <FramePanel className="strata-jobs-up-next">
            {uniqueUpcoming.length ? (
              uniqueUpcoming.map(({ job, at }) => (
                <Button
                  key={job.id}
                  variant="ghost"
                  className="strata-upcoming-job"
                  onClick={() => showJob(job)}
                  aria-label={`Show ${job.name} in jobs`}
                >
                  <Database />
                  <span>{job.name}</span>
                  {strataJobHealth(job, model.runs) === "Failing" && (
                    <Badge variant="destructive-light" size="sm">
                      Failing
                    </Badge>
                  )}
                  <time dateTime={new Date(at).toISOString()}>{future(at)}</time>
                </Button>
              ))
            ) : (
              <p className="strata-job-muted">No jobs scheduled in the next 30 minutes.</p>
            )}
          </FramePanel>
        </Frame>
      </div>
      <StrataJobForm
        key={formVersion}
        open={createOpen}
        onOpenChange={setCreateOpen}
        opener={createTrigger}
        onCreate={(draft) => {
          const result = model.createJob(draft);
          if (result.ok) {
            onEnvironmentChange("all");
            setSearch("");
            setTab("All");
            setQuery(createFilterQuery());
            setPagination((current) => ({ ...current, pageIndex: 0 }));
            setAnnouncement(`Created ${result.job.name}.`);
          }
          return result;
        }}
      />
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
