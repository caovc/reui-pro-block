import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  Bookmark,
  Blocks,
  CalendarDays,
  Database,
  Flag,
  KeyRound,
  Monitor,
  Rocket,
  ShieldCheck,
  Box,
  Braces,
  Check,
  CheckCheck,
  ChevronDown,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  GitBranch,
  Globe,
  ListFilter,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Settings2,
  Star,
  Terminal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Filters, type FilterField } from "@/components/reui/filters/filters";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import {
  DomainGridSurface,
  domainSelectionColumn,
  useDomainGrid,
  type DomainColumn,
} from "@/blocks/data/grid-advanced-model-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/template-progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { demoAvatar } from "@/lib/demo-artwork";
import { StrataHeaderActions } from "./strata-context";
import {
  STRATA_OWNERS,
  STRATA_SERVICES,
  strataOwner,
  strataService,
  type StrataPageProps,
} from "./strata-domain";
import {
  createStrataLogExport,
  downloadStrataLogExport,
  strataLogExportRecord,
  strataLogExportRows,
  type StrataLogExportFormat,
} from "./strata-log-export";
import {
  createStrataLogDraft,
  filterStrataLogs,
  scopeStrataLogs,
  strataLogAge,
  strataLogBuckets,
  strataLogTime,
  summarizeStrataLogs,
  validateStrataLogInput,
  STRATA_LOG_CATEGORIES,
  STRATA_LOG_CLUSTERS,
  STRATA_LOG_ENVIRONMENTS,
  STRATA_LOG_RESOURCE_TYPES,
  STRATA_LOG_LEVELS,
  STRATA_LOG_RANGES,
  STRATA_LOG_SOURCES,
  type StrataLogEvent,
  type StrataLogCategory,
  type StrataLogResourceType,
  type StrataLogInput,
  type StrataLogLevel,
  type StrataLogRange,
  type StrataLogsPreset,
  type StrataLogView,
  type useStrataLogsModel,
} from "./strata-logs-model";
import "./strata-logs.css";

type LogsRootModel = ReturnType<typeof useStrataLogsModel>;
type LogsModel = ReturnType<LogsRootModel["forPreset"]>;
type LogsProps = StrataPageProps & { model: LogsRootModel; preset?: StrataLogsPreset };
type LogsPageProps = StrataPageProps & { model: LogsModel };
const levelNames = { info: "Info", warn: "Warn", error: "Error" };
const levelColors = { info: "#10b981", warn: "#f59e0b", error: "#ef4444" };
const rangeNames = {
  "1h": "Last hour",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};
const viewNames = {
  all: "All events",
  warnings: "Warnings",
  errors: "Errors",
  checkout: "Checkout incident",
  "errors-payments": "Errors · payments",
};
const sourceIcons = {
  Console: Monitor,
  OTLP: Braces,
  Kubernetes: Terminal,
  "GitHub Actions": GitBranch,
  Synthetics: Network,
};
const categoryIcons: Record<StrataLogCategory, typeof Box> = {
  Deploy: Rocket,
  Config: Settings2,
  Secret: KeyRound,
  Access: ShieldCheck,
  Infra: Blocks,
};
const resourceIcons: Record<StrataLogResourceType, typeof Box> = {
  Deployment: GitBranch,
  Service: Box,
  Route: Network,
  Database,
  Secret: KeyRound,
  Incident: GitBranch,
  "API key": KeyRound,
  Alert: Flag,
  Job: CalendarDays,
};
const fields: FilterField<string | string[]>[] = [
  {
    id: "category",
    label: "Category",
    type: "select",
    options: STRATA_LOG_CATEGORIES.map((value) => ({ value, label: value })),
  },
  {
    id: "environment",
    label: "Environment",
    type: "select",
    options: STRATA_LOG_ENVIRONMENTS.map((value) => ({ value, label: value })),
  },
  {
    id: "resourceType",
    label: "Resource type",
    type: "select",
    options: STRATA_LOG_RESOURCE_TYPES.map((value) => ({ value, label: value })),
  },
  {
    id: "level",
    label: "Level",
    type: "select",
    options: STRATA_LOG_LEVELS.map((value) => ({ value, label: levelNames[value] })),
  },
  {
    id: "ownerId",
    label: "Owner",
    type: "select",
    options: STRATA_OWNERS.map((owner) => ({ value: owner.id, label: owner.name })),
  },
  {
    id: "serviceId",
    label: "Service",
    type: "select",
    options: STRATA_SERVICES.map((service) => ({ value: service.id, label: service.name })),
  },
  {
    id: "source",
    label: "Source",
    type: "select",
    options: STRATA_LOG_SOURCES.map((value) => ({ value, label: value })),
  },
  { id: "event", label: "Event", type: "text" },
  { id: "resource", label: "Resource", type: "text" },
  { id: "traceId", label: "Trace ID", type: "text" },
];

function OwnerAvatar({ ownerId }: { ownerId: string }) {
  const owner = strataOwner(ownerId);
  return (
    <Avatar className="size-5 shrink-0">
      <AvatarImage src={demoAvatar(owner?.name ?? ownerId)} alt="" />
      <AvatarFallback>
        {owner?.name
          .split(" ")
          .map((part) => part[0])
          .join("") ?? "?"}
      </AvatarFallback>
    </Avatar>
  );
}

function LevelBadge({ level }: { level: StrataLogLevel }) {
  return (
    <Badge
      size="sm"
      variant={
        level === "error"
          ? "destructive-light"
          : level === "warn"
            ? "warning-light"
            : "success-light"
      }
    >
      {levelNames[level]}
    </Badge>
  );
}

function LogActions({
  event,
  onOpen,
}: {
  event: StrataLogEvent;
  onOpen: (event: StrataLogEvent, opener: HTMLElement | null) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const opensPanel = useRef(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={trigger} size="icon-xs" variant="ghost" aria-label={`Actions for ${event.id}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(native) => {
          if (opensPanel.current) {
            native.preventDefault();
            opensPanel.current = false;
          }
        }}
      >
        <DropdownMenuItem
          onSelect={() => {
            opensPanel.current = true;
            onOpen(event, trigger.current);
          }}
        >
          View event
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            navigator.clipboard.writeText(event.id).then(
              () => toast.success("Event ID copied"),
              () => toast.error("Unable to copy event ID"),
            );
          }}
        >
          <Copy /> Copy event ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LogRange({ model }: { model: LogsModel }) {
  return (
    <>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={model.range}
        aria-label="Log time range"
        className="strata-log-ranges"
        onValueChange={(value) => {
          if (value) model.setRange(value as StrataLogRange);
        }}
      >
        {STRATA_LOG_RANGES.map((range) => (
          <ToggleGroupItem key={range} value={range} aria-label={rangeNames[range]}>
            {range}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="strata-log-range-select">
        <Select
          value={model.range}
          onValueChange={(value) => model.setRange(value as StrataLogRange)}
        >
          <SelectTrigger aria-label={`Time range, ${rangeNames[model.range]}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {STRATA_LOG_RANGES.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function EventVolume({ events, model }: { events: StrataLogEvent[]; model: LogsModel }) {
  const summary = useMemo(() => summarizeStrataLogs(events), [events]);
  const visible = useMemo(
    () => events.filter((event) => model.levels.includes(event.level)),
    [events, model.levels],
  );
  const buckets = useMemo(() => strataLogBuckets(visible, model.range), [visible, model.range]);
  const average = visible.length / buckets.length;
  const tick = (time: number) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      ...(model.range === "1h" || model.range === "24h"
        ? { hour: "2-digit" as const, minute: "2-digit" as const, hour12: false }
        : { month: "short" as const, day: "numeric" as const }),
    }).format(new Date(time));
  return (
    <Frame dense className="strata-log-volume">
      <FrameHeader className="strata-log-frame-header">
        <div>
          <FrameTitle>
            <h2>Event Volume</h2>
          </FrameTitle>
          <FrameDescription>
            {model.range === "1h"
              ? "5-minute"
              : model.range === "24h"
                ? "Hourly"
                : model.range === "7d"
                  ? "6-hour"
                  : "Daily"}{" "}
            buckets, UTC
          </FrameDescription>
        </div>
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          value={model.levels}
          onValueChange={(value) => model.setLevels(value as StrataLogLevel[])}
          aria-label="Event levels"
          className="strata-log-levels"
        >
          {STRATA_LOG_LEVELS.map((level) => (
            <ToggleGroupItem
              key={level}
              value={level}
              aria-label={`${levelNames[level]}, ${summary.levels[level]} events`}
            >
              <span className={`strata-log-dot strata-log-${level}`} />
              {levelNames[level]}
              <span className="tabular-nums">{summary.levels[level]}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FrameHeader>
      <FramePanel className="strata-log-volume-body">
        <div className="strata-log-total">
          <strong>{visible.length}</strong>
          <span>events</span>
        </div>
        <p className="strata-log-volume-note">
          {summary.warningPercent.toFixed(1)}% warn<span>·</span>
          {rangeNames[model.range]}
        </p>
        <ChartContainer
          className="strata-log-chart"
          config={{
            info: { label: "Info", color: levelColors.info },
            warn: { label: "Warn", color: levelColors.warn },
            error: { label: "Error", color: levelColors.error },
          }}
          aria-label={`Event volume: ${visible.length} events in ${rangeNames[model.range].toLowerCase()}`}
        >
          <BarChart
            data={buckets}
            margin={{ top: 20, right: 40, left: -22, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={tick}
              tickLine={false}
              axisLine={false}
              minTickGap={26}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(time) =>
                    new Date(Number(time)).toLocaleString("en-US", { timeZone: "UTC" })
                  }
                />
              }
            />
            <ReferenceLine
              y={average}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 4"
              label={{
                value: `Avg ${average.toFixed(1)}`,
                position: "right",
                fontSize: 11,
                fill: "var(--muted-foreground)",
              }}
            />
            {STRATA_LOG_LEVELS.map((level) => (
              <Bar
                key={level}
                dataKey={level}
                stackId="events"
                fill={`var(--color-${level})`}
                fillOpacity={0.55}
                radius={level === "error" ? [2, 2, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </FramePanel>
    </Frame>
  );
}

function WarningReview({
  events,
  model,
  onOpen,
}: {
  events: StrataLogEvent[];
  model: LogsModel;
  onOpen: (event: StrataLogEvent, opener: HTMLElement | null) => void;
}) {
  const summary = useMemo(() => summarizeStrataLogs(events), [events]);
  const oldest = summary.warnings.at(-1);
  return (
    <Frame dense className="strata-log-warning-frame">
      <FrameHeader className="strata-log-frame-header">
        <div>
          <FrameTitle>
            <h2>Warnings to review</h2>
          </FrameTitle>
          <FrameDescription>
            Newest first{oldest ? `, oldest ${strataLogAge(oldest.timestamp)}` : ""}
          </FrameDescription>
        </div>
        <Button
          variant="outline"
          disabled={!summary.unreviewed}
          onClick={() => model.review(summary.warnings.map((event) => event.id))}
        >
          Review all
          <ArrowRight />
        </Button>
      </FrameHeader>
      <FramePanel className="strata-log-warnings">
        <div className="strata-log-review-count">
          <strong>{summary.unreviewed}</strong>
          <span>to review</span>
          <small>
            {summary.warningOwners} owners<span>·</span>
            <Globe className="size-3.5 text-amber-500" />
            {summary.afterRelease} after v3.5.0 deploy
          </small>
        </div>
        <Progress
          className="strata-log-review-progress"
          aria-label="Warning review"
          max={summary.warnings.length || 1}
          value={summary.reviewed}
        >
          <span>
            {summary.reviewed} of {summary.warnings.length} reviewed
          </span>
        </Progress>
        <div className="strata-log-warning-list">
          {summary.warnings.map((event) => (
            <div key={event.id} className="strata-log-warning-row" data-reviewed={event.reviewed}>
              <Button
                variant="ghost"
                className="strata-log-warning-main"
                onClick={(native) => onOpen(event, native.currentTarget)}
              >
                <OwnerAvatar ownerId={event.ownerId} />
                <span>
                  <span className="strata-log-warning-owner">
                    {strataOwner(event.ownerId)?.name}
                    {event.afterRelease && (
                      <Globe aria-label="After v3.5.0 deploy" className="size-3.5 text-amber-500" />
                    )}
                  </span>
                  <span className="strata-log-warning-event">
                    {event.event}
                    <span>·</span>
                    {event.resource}
                  </span>
                </span>
                <time dateTime={event.timestamp}>{strataLogAge(event.timestamp)}</time>
              </Button>
              <Button
                size="icon-xs"
                variant={event.reviewed ? "secondary" : "ghost"}
                className="strata-log-review-control"
                aria-label={`Mark ${event.id} ${event.reviewed ? "unreviewed" : "reviewed"}`}
                onClick={() => model.review([event.id], !event.reviewed)}
              >
                <Check />
              </Button>
            </div>
          ))}
          {!summary.warnings.length && (
            <p className="strata-log-no-warnings">
              <CheckCheck />
              No warnings in this time range.
            </p>
          )}
        </div>
      </FramePanel>
    </Frame>
  );
}

function EventForm({ onCreate }: { onCreate: (input: StrataLogInput) => void }) {
  const id = useId();
  const [input, setInput] = useState<StrataLogInput>(createStrataLogDraft);
  const [errors, setErrors] = useState<ReturnType<typeof validateStrataLogInput>>({});
  const change = <K extends keyof StrataLogInput>(key: K, value: StrataLogInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const textField = (
    key: "event" | "resourceName" | "resourceId" | "podIp",
    label: string,
    placeholder: string,
    mono = false,
  ) => (
    <Field data-invalid={!!errors[key]}>
      <FieldLabel htmlFor={`${id}-${key}`}>{label}</FieldLabel>
      <Input
        id={`${id}-${key}`}
        name={key}
        className={mono ? "font-mono" : undefined}
        value={input[key]}
        placeholder={placeholder}
        aria-invalid={!!errors[key]}
        onChange={(native) => change(key, native.target.value)}
      />
      {key === "resourceId" && (
        <FieldDescription>
          A handle shows beside the name. Leave empty to generate one from the name.
        </FieldDescription>
      )}
      {errors[key] && <FieldError>{errors[key]}</FieldError>}
    </Field>
  );
  type SelectKey = "category" | "ownerId" | "source" | "cluster" | "resourceType";
  type Option = {
    value: string;
    label: string;
    Icon?: typeof Box;
    ownerId?: string;
    mono?: boolean;
  };
  const choices: Record<SelectKey, readonly Option[]> = {
    category: STRATA_LOG_CATEGORIES.map((value) => ({
      value,
      label: value,
      Icon: categoryIcons[value],
    })),
    ownerId: STRATA_OWNERS.map((owner) => ({
      value: owner.id,
      label: owner.name,
      ownerId: owner.id,
    })),
    source: STRATA_LOG_SOURCES.map((value) => ({ value, label: value, Icon: sourceIcons[value] })),
    cluster: STRATA_LOG_CLUSTERS.map((value) => ({
      value,
      label: value === "none" ? "None" : value,
      mono: value !== "none",
    })),
    resourceType: STRATA_LOG_RESOURCE_TYPES.map((value) => ({
      value,
      label: value,
      Icon: resourceIcons[value],
    })),
  };
  const selectField = <K extends SelectKey>(key: K, label: string) => (
    <Field data-invalid={!!errors[key]}>
      <FieldLabel>{label}</FieldLabel>
      <Select value={input[key]} onValueChange={(value) => change(key, value as StrataLogInput[K])}>
        <SelectTrigger aria-label={label} className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {choices[key].map((option) => (
            <SelectItem key={option.value} value={option.value} textValue={option.label}>
              <span className={`strata-log-option-label ${option.mono ? "strata-log-mono" : ""}`}>
                {option.ownerId ? (
                  <OwnerAvatar ownerId={option.ownerId} />
                ) : option.Icon ? (
                  <option.Icon />
                ) : null}
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors[key] && <FieldError>{errors[key]}</FieldError>}
    </Field>
  );
  return (
    <form
      className="strata-log-form"
      noValidate
      onSubmit={(native) => {
        native.preventDefault();
        const next = validateStrataLogInput(input);
        setErrors(next);
        const first = Object.keys(next)[0];
        if (first) {
          (native.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
          return;
        }
        onCreate(input);
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">Event</FieldLegend>
          <div className="strata-log-form-columns">
            {textField("event", "Event", "http.request.failed", true)}
            {selectField("category", "Category")}
          </div>
          <Field>
            <FieldLabel>Level</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              className="strata-log-form-segmented"
              aria-label="Level"
              value={input.level}
              onValueChange={(value) => {
                if (value) change("level", value as StrataLogLevel);
              }}
            >
              {STRATA_LOG_LEVELS.map((level) => (
                <ToggleGroupItem key={level} value={level}>
                  <span className={`strata-log-dot strata-log-${level}`} />
                  {levelNames[level]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
        </FieldSet>
        <FieldSet>
          <FieldLegend variant="label">Origin</FieldLegend>
          <div className="strata-log-form-columns">
            {selectField("ownerId", "Owner")}
            {selectField("source", "Source")}
          </div>
          <Field>
            <FieldLabel>Environment</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              className="strata-log-form-segmented"
              aria-label="Environment"
              value={input.environment}
              onValueChange={(value) => {
                if (value) change("environment", value as StrataLogInput["environment"]);
              }}
            >
              {STRATA_LOG_ENVIRONMENTS.map((value) => (
                <ToggleGroupItem key={value} value={value}>
                  {value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <div className="strata-log-form-columns">
            {selectField("cluster", "Cluster")}
            {textField("podIp", "Pod IP", "", true)}
          </div>
        </FieldSet>
        <FieldSet>
          <FieldLegend variant="label">Resource</FieldLegend>
          <div className="strata-log-form-columns">
            {selectField("resourceType", "Type")}
            {textField("resourceName", "Name", "POST /v1/checkout")}
          </div>
          {textField("resourceId", "ID", "4f9ac21e", true)}
        </FieldSet>
        <FieldSet>
          <FieldLegend variant="label">Message</FieldLegend>
          <Field data-invalid={!!errors.summary}>
            <FieldLabel htmlFor={`${id}-summary`}>Summary</FieldLabel>
            <Textarea
              id={`${id}-summary`}
              name="summary"
              value={input.summary}
              placeholder="POST /v1/checkout returned 503 in 2.4 s."
              rows={2}
              maxLength={2000}
              aria-invalid={!!errors.summary}
              onChange={(native) => change("summary", native.target.value)}
            />
            {errors.summary && <FieldError>{errors.summary}</FieldError>}
          </Field>
        </FieldSet>
      </FieldGroup>
      <SheetFooter className="strata-log-form-footer">
        <SheetClose asChild>
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit">
          <Plus />
          Add event
        </Button>
      </SheetFooter>
    </form>
  );
}

function LogsPage({
  model,
  environment,
  onEnvironmentChange,
  onNavigate,
  pinnedRoutes,
  onTogglePin,
}: LogsPageProps) {
  const [panel, setPanel] = useState<"new" | string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const add = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const { setPagination, search: searchText, levels, view, query } = model;
  const lastEnvironment = useRef(environment);
  useEffect(() => {
    if (lastEnvironment.current !== environment) {
      lastEnvironment.current = environment;
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    }
  }, [environment, setPagination]);
  const scoped = useMemo(
    () => scopeStrataLogs(model.events, environment, model.range),
    [model.events, environment, model.range],
  );
  const queryFiltered = useMemo(
    () => filterStrataLogs(scoped, { search: searchText, levels: STRATA_LOG_LEVELS, view, query }),
    [scoped, searchText, view, query],
  );
  const filtered = useMemo(
    () => queryFiltered.filter((event) => levels.includes(event.level)),
    [queryFiltered, levels],
  );
  const pinRoute = model.preset === "errors-payments" ? "/logs/errors-payments" : "/logs";
  const pageTitle = model.preset === "errors-payments" ? "Errors · payments" : "Logs";
  const summary = useMemo(() => summarizeStrataLogs(filtered), [filtered]);
  const openEvent = useCallback((event: StrataLogEvent, target: HTMLElement | null) => {
    toast.dismiss("strata-log-change");
    opener.current = target;
    setPanel(event.id);
  }, []);
  const detail = model.events.find((event) => event.id === panel);
  const columns = useMemo<DomainColumn<StrataLogEvent>[]>(
    () => [
      { ...domainSelectionColumn<StrataLogEvent>((event) => event.id), size: 34 },
      {
        id: "timestamp",
        header: "Time",
        accessorFn: (event) => Date.parse(event.timestamp),
        size: 140,
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            variant="link"
            className="strata-log-time"
            aria-label={`${strataLogTime(row.original.timestamp)}, open ${row.original.id}`}
            onClick={(native) => openEvent(row.original, native.currentTarget)}
          >
            {strataLogTime(row.original.timestamp)}
          </Button>
        ),
      },
      {
        id: "owner",
        header: "Owner",
        accessorFn: (event) => strataOwner(event.ownerId)?.name ?? event.ownerId,
        size: 180,
        cell: ({ row }) => (
          <span className="strata-log-owner">
            <OwnerAvatar ownerId={row.original.ownerId} />
            <span>{strataOwner(row.original.ownerId)?.name}</span>
          </span>
        ),
      },
      {
        id: "event",
        header: "Event",
        accessorKey: "event",
        size: 205,
        cell: ({ row }) => (
          <span className="strata-log-mono strata-log-truncate" title={row.original.event}>
            {row.original.event}
          </span>
        ),
      },
      {
        id: "level",
        header: "Level",
        accessorKey: "level",
        size: 110,
        cell: ({ row }) => <LevelBadge level={row.original.level} />,
      },
      {
        id: "resource",
        header: "Resource",
        accessorKey: "resource",
        size: 205,
        cell: ({ row }) => {
          const Icon = resourceIcons[row.original.resourceType];
          return (
            <span className="strata-log-resource" title={row.original.resource}>
              <Icon />
              <span>{row.original.resource}</span>
              {row.original.resourceId !== row.original.resource && (
                <small className="strata-log-resource-handle" title={row.original.resourceId}>
                  {row.original.resourceId}
                </small>
              )}
            </span>
          );
        },
      },
      {
        id: "source",
        header: "Source",
        accessorKey: "source",
        size: 140,
        cell: ({ row }) => {
          const Icon = sourceIcons[row.original.source];
          return (
            <span className="strata-log-source">
              <Icon />
              {row.original.source}
            </span>
          );
        },
      },
      {
        id: "podIp",
        header: "Pod IP",
        accessorKey: "podIp",
        size: 116,
        cell: ({ row }) => (
          <span className="strata-log-mono strata-log-muted">{row.original.podIp || "—"}</span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        size: 36,
        enableSorting: false,
        enableHiding: false,
        meta: { cellClassName: "p-0 text-center" },
        cell: ({ row }) => <LogActions event={row.original} onOpen={openEvent} />,
      },
    ],
    [openEvent],
  );
  const table = useDomainGrid({
    data: filtered,
    columns,
    sorting: model.sorting,
    onSortingChange: model.setSorting,
    pagination: model.pagination,
    onPaginationChange: model.setPagination,
    selection: model.selection,
    onSelectionChange: model.setSelection,
    hidden: model.hidden,
    onHiddenChange: model.setHidden,
    getRowId: (event) => event.id,
  });
  const exportable = table.getSortedRowModel().rows.map((row) => row.original);
  const selected = strataLogExportRows(exportable, model.selection, "selected");
  const download = (format: StrataLogExportFormat) => {
    const events = strataLogExportRows(exportable, model.selection, model.exportScope);
    if (model.exportScope === "selected" && !events.length) return;
    downloadStrataLogExport(createStrataLogExport(events, format, model.exportScope));
  };
  return (
    <section
      className="strata-logs"
      aria-label={pageTitle}
      data-density={model.compact ? "compact" : "comfortable"}
    >
      <h1 className="sr-only">{pageTitle}</h1>
      <StrataHeaderActions>
        <div className="strata-logs-header-controls">
          <Button
            variant="outline"
            size="icon"
            className="gap-1.5 sm:w-auto sm:px-2.5"
            aria-label={`${pinnedRoutes.includes(pinRoute) ? "Unpin" : "Pin"} ${pageTitle}`}
            aria-pressed={pinnedRoutes.includes(pinRoute)}
            onClick={() => onTogglePin(pinRoute)}
          >
            <Star fill={pinnedRoutes.includes(pinRoute) ? "currentColor" : "none"} />
            <span className="hidden sm:inline">Pin</span>
          </Button>
          <LogRange model={model} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download />
                <span>Export</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Scope</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={model.exportScope}
                onValueChange={(value) => model.setExportScope(value as "filtered" | "selected")}
              >
                <DropdownMenuRadioItem value="filtered">
                  Filtered events
                  <span className="ml-auto text-xs text-muted-foreground">{filtered.length}</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="selected" disabled={!selected.length}>
                  Selected events
                  <span className="ml-auto text-xs text-muted-foreground">{selected.length}</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Format</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={model.exportScope === "selected" && !selected.length}
                  onSelect={() => download("csv")}
                >
                  <FileSpreadsheet />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={model.exportScope === "selected" && !selected.length}
                  onSelect={() => download("json")}
                >
                  <FileJson />
                  Download JSON
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </StrataHeaderActions>
      <div className="strata-logs-summary">
        <EventVolume events={queryFiltered} model={model} />
        <WarningReview events={scoped} model={model} onOpen={openEvent} />
      </div>
      <DomainGridSurface
        table={table}
        scrollArea="horizontal"
        paginationControls={{ noun: "events", sizes: [10, 25, 50] }}
        className="strata-logs-grid"
        layout={{ dense: true, width: "fixed" }}
        renderFrame={(content) => (
          <Frame dense>
            <FrameHeader className="strata-log-frame-header strata-log-events-header">
              <div>
                <FrameTitle>
                  <h2>Events</h2>
                </FrameTitle>
                <FrameDescription>
                  {filtered.length} events<span className="mx-1">·</span>
                  {summary.owners} {summary.owners === 1 ? "owner" : "owners"}
                </FrameDescription>
              </div>
              <div className="strata-log-table-actions">
                <Button
                  ref={add}
                  onClick={(native) => {
                    toast.dismiss("strata-log-change");
                    opener.current = native.currentTarget;
                    setPanel("new");
                  }}
                >
                  <Plus />
                  Add event
                </Button>
                <Select
                  value={model.view}
                  onValueChange={(value) => model.setView(value as StrataLogView)}
                >
                  <SelectTrigger aria-label={`View, ${viewNames[model.view]}`}>
                    <Bookmark />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(viewNames).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DataGridColumnVisibility
                  table={table}
                  trigger={
                    <Button variant="outline" aria-label="Display settings">
                      <Settings2 />
                      <span>Settings</span>
                    </Button>
                  }
                >
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={model.compact}
                    onCheckedChange={model.setCompact}
                    onSelect={(native) => native.preventDefault()}
                  >
                    Compact rows
                  </DropdownMenuCheckboxItem>
                </DataGridColumnVisibility>
              </div>
            </FrameHeader>
            <FramePanel className="strata-log-events-panel">
              <div className="strata-log-table-toolbar">
                <InputGroup className="strata-log-search">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    ref={search}
                    aria-label="Search events"
                    placeholder="Search events, services, traces…"
                    value={model.search}
                    onChange={(native) => model.setSearch(native.target.value)}
                  />
                  {model.search && (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label="Clear event search"
                        onClick={() => {
                          model.setSearch("");
                          search.current?.focus();
                        }}
                      >
                        <X />
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                </InputGroup>
                <Filters
                  fields={fields}
                  query={model.query}
                  onQueryChange={model.setQuery}
                  showClear
                  trigger={
                    <Button variant="outline" aria-label="Filter">
                      <ListFilter />
                      Filter
                    </Button>
                  }
                />
                {selected.length > 0 && (
                  <span className="strata-log-selection">{selected.length} selected</span>
                )}
                {filtered.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={scoped.length ? model.clearFilters : () => model.setRange("7d")}
                  >
                    {scoped.length ? "Clear filters" : "Reset time range"}
                  </Button>
                )}
              </div>
              {content}
            </FramePanel>
          </Frame>
        )}
      />
      <Sheet
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent
          className={
            panel === "new"
              ? "strata-log-sheet strata-log-create-sheet gap-0"
              : "strata-log-sheet w-full gap-0 sm:max-w-[480px]"
          }
          onCloseAutoFocus={(native) => {
            native.preventDefault();
            const target = opener.current?.isConnected ? opener.current : add.current;
            target?.focus({ preventScroll: true });
          }}
        >
          {panel === "new" ? (
            <>
              <SheetHeader>
                <SheetTitle>Add event</SheetTitle>
                <SheetDescription>
                  Log an event for a Bricklane resource, stamped now.
                </SheetDescription>
              </SheetHeader>
              <EventForm
                onCreate={(input) => {
                  const created = model.addEvent(input);
                  if (environment !== "all" && created.environment !== environment)
                    onEnvironmentChange(created.environment);
                  setPanel(null);
                  toast.success(`${created.id} added`, { id: "strata-log-change" });
                }}
              />
            </>
          ) : detail ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.event}</SheetTitle>
                <SheetDescription>
                  {detail.id}
                  <span className="mx-1">·</span>
                  {strataLogTime(detail.timestamp)} UTC
                </SheetDescription>
              </SheetHeader>
              <Tabs defaultValue="details" className="strata-log-details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="payload">Payload</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <dl>
                    {[
                      ["Level", <LevelBadge key="level" level={detail.level} />],
                      ["Owner", strataOwner(detail.ownerId)?.name],
                      ["Service", strataService(detail.serviceId ?? "")?.name],
                      ["Category", detail.category],
                      ["Environment", detail.environment],
                      ["Cluster", detail.cluster ?? "None"],
                      ["Resource type", detail.resourceType],
                      ["Resource ID", detail.resourceId],
                      ["Resource", detail.resource],
                      ["Source", detail.source],
                      ["Pod IP", detail.podIp || "—"],
                      ["Trace ID", detail.traceId || "—"],
                      ["Incident", detail.incidentId || "—"],
                      ["Version", detail.version || "—"],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="strata-log-detail-message">
                    {detail.message || "No message provided."}
                  </p>
                  {detail.serviceId && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        onNavigate(
                          detail.serviceId === "checkout-api"
                            ? "/services/checkout-api"
                            : "/services",
                        )
                      }
                    >
                      View service
                      <ArrowRight />
                    </Button>
                  )}
                </TabsContent>
                <TabsContent value="payload">
                  <pre>{JSON.stringify(strataLogExportRecord(detail), null, 2)}</pre>
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}

/** Each route keeps its own actual filter state while sharing the event/review collection. */
export function StrataLogs({ model, preset = model.preset, ...props }: LogsProps) {
  return <LogsPage key={preset} {...props} model={model.forPreset(preset)} />;
}
