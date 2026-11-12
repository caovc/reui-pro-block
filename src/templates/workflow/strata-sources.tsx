import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowRightLeft,
  Database,
  Ellipsis,
  Eye,
  FileStack,
  KeyRound,
  Layers,
  Link2,
  ListFilter,
  Play,
  PlugZap,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Filters, type FilterField } from "@/components/reui/filters/filters";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DomainGridSurface,
  domainSelectionColumn,
  useDomainGrid,
  type DomainColumn,
  type DomainTable,
} from "@/blocks/data/grid-advanced-model-grid";
import { HealthSegments, MiniTrend } from "@/blocks/data/sparkline-primitives";
import { HourColumns } from "@/blocks/data/bar-hour-columns";
import { StrataHeaderActions } from "./strata-context";
import { StrataSourceProviderSetup } from "./strata-source-provider";
import {
  STRATA_NOW_MS,
  STRATA_OWNERS,
  strataOwner,
  type StrataEnvironmentFilter,
  type StrataPageProps,
} from "./strata-domain";
import {
  STRATA_SOURCE_CATEGORIES,
  selectStrataSources,
  strataSourceHealth,
  strataSourcesMetrics,
  type StrataSource,
  type StrataSourceCategory,
  type StrataSourceHealth,
  type useStrataSourcesModel,
} from "./strata-sources-model";
import "./strata-sources.css";

type SourcesModel = ReturnType<typeof useStrataSourcesModel>;
type SourcePanel = { sourceId: string; mode: "overview" | "datasets" } | { mode: "catalog" };
const colors = {
  healthy: "#00bc7d",
  degraded: "#f5b400",
  failing: "#ed0022",
  paused: "#c8c8c8",
  linked: "#8b50ff",
};
const healthColor: Record<StrataSourceHealth, string> = {
  Healthy: colors.healthy,
  Degraded: colors.degraded,
  Failing: colors.failing,
  Paused: colors.paused,
};
const short = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const percentChange = (current: number, previous: number) =>
  previous ? ((current - previous) / previous) * 100 : null;

function ago(atMs: number) {
  const minutes = Math.max(0, Math.floor((STRATA_NOW_MS - atMs) / 60_000));
  return minutes === 0
    ? "Just now"
    : minutes < 60
      ? `${minutes}m ago`
      : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""} ago`;
}

/** Original monograms. No reference integration SVG or brand artwork is embedded. */
function SourceMark({ source }: { source: StrataSource }) {
  return (
    <span className="strata-source-mark" aria-hidden="true" data-category={source.category}>
      {source.provider.replace(/[^A-Z]/g, "").slice(0, 2) || source.provider.slice(0, 2)}
    </span>
  );
}

function SourceStatus({ source }: { source: StrataSource }) {
  const health = strataSourceHealth(source);
  return (
    <Badge
      size="sm"
      variant={
        health === "Failing"
          ? "destructive-light"
          : health === "Degraded"
            ? "warning-light"
            : health === "Paused"
              ? "outline"
              : "success-light"
      }
    >
      {health}
    </Badge>
  );
}

function Change({
  current,
  previous,
  goodUp = true,
}: {
  current: number;
  previous: number;
  goodUp?: boolean;
}) {
  const change = percentChange(current, previous);
  if (change === null) return <span className="strata-source-change">—</span>;
  const up = change >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="strata-source-change" data-good={up === goodUp}>
      <Icon />
      <span>{Math.abs(change).toFixed(1).replace(/\.0$/, "")}%</span>
      <span className="sr-only">{up ? "up" : "down"} against previous period</span>
    </span>
  );
}

function SourceMetric({
  title,
  period,
  icon,
  value,
  change,
  note,
  children,
  footer,
  onInspect,
}: {
  title: string;
  period: string;
  icon: ReactNode;
  value: ReactNode;
  change: ReactNode;
  note: string;
  children: ReactNode;
  footer: string;
  onInspect: () => void;
}) {
  return (
    <Frame dense className="strata-source-metric">
      <FramePanel>
        <div className="strata-source-metric-heading">
          <span>
            {icon}
            {title}
          </span>
          <span>{period}</span>
        </div>
        <div className="strata-source-metric-value">
          {value}
          {change}
        </div>
        <p className="strata-source-metric-note">{note}</p>
        <div className="strata-source-metric-chart">{children}</div>
      </FramePanel>
      <FrameFooter>
        <Button variant="ghost" onClick={onInspect}>
          {footer}
          <ArrowRight />
        </Button>
      </FrameFooter>
    </Frame>
  );
}

function SourceLegend({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <dl className="strata-source-legend">
      {items.map((item) => (
        <div key={item.label}>
          <dt>
            <i style={{ background: item.color }} />
            {item.label}
          </dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const fields: FilterField<string | string[]>[] = [
  {
    id: "health",
    label: "Status",
    type: "select",
    options: ["Healthy", "Degraded", "Failing", "Paused"].map((value) => ({ value, label: value })),
  },
  {
    id: "ownerId",
    label: "Owner",
    type: "select",
    options: STRATA_OWNERS.map((owner) => ({ value: owner.id, label: owner.name })),
  },
  {
    id: "environment",
    label: "Environment",
    type: "select",
    options: ["Production", "Staging", "Sandbox"].map((value) => ({ value, label: value })),
  },
  {
    id: "provider",
    label: "Provider",
    type: "select",
    options: [
      "Supabase",
      "Neon",
      "Redis",
      "PlanetScale",
      "BigQuery",
      "Slack",
      "GitHub",
      "Linear",
      "Stripe",
      "Dropbox",
      "Google Drive",
    ].map((value) => ({ value, label: value })),
  },
  { id: "name", label: "Source name", type: "text" },
];

function SourceActions({
  source,
  model,
  onOpen,
}: {
  source: StrataSource;
  model: SourcesModel;
  onOpen: (source: StrataSource, mode: "overview" | "datasets", opener: HTMLElement | null) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const opensPanel = useRef(false);
  const inspect = (mode: "overview" | "datasets") => {
    opensPanel.current = true;
    onOpen(source, mode, trigger.current);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${source.name}`}
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event) => {
          if (opensPanel.current) {
            event.preventDefault();
            opensPanel.current = false;
          }
        }}
      >
        <DropdownMenuItem onSelect={() => inspect("overview")}>
          <Eye />
          View source
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => inspect("datasets")}>
          <Database />
          View datasets
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!source.syncEnabled}
          onSelect={() => {
            model.sync([source.id]);
            toast.message("Local sync recorded", {
              description:
                source.connectorHealth === "Failing"
                  ? "The connector is still failing; no external credentials were changed."
                  : source.name,
            });
          }}
        >
          <RefreshCw />
          Run local sync
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => model.setEnabled(source.id, !source.syncEnabled)}>
          {source.syncEnabled ? "Pause syncs" : "Resume syncs"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SourceToolbar({
  table,
  model,
}: {
  table: DomainTable<StrataSource>;
  model: SourcesModel;
}) {
  return (
    <div className="strata-source-toolbar">
      <InputGroup className="strata-source-search">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search sources"
          placeholder="Search sources or datasets..."
          value={model.search}
          onChange={(event) => model.setSearch(event.target.value)}
        />
      </InputGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            aria-label="Categories"
            className="strata-source-toolbar-button"
          >
            <Layers />
            <span>Categories</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Source categories</DropdownMenuLabel>
          {STRATA_SOURCE_CATEGORIES.map((category) => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={model.categories.includes(category)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) =>
                model.setCategories((current) =>
                  checked
                    ? [...new Set([...current, category])]
                    : current.filter((value) => value !== category),
                )
              }
            >
              {category}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Filters
        fields={fields}
        query={model.query}
        onQueryChange={model.setQuery}
        showClear
        size="sm"
        className="strata-source-filters"
        trigger={
          <Button variant="outline" aria-label="Filter" className="strata-source-toolbar-button">
            <ListFilter />
            <span>Filter</span>
          </Button>
        }
      />
      <DataGridColumnVisibility
        table={table}
        trigger={
          <Button variant="outline" aria-label="Display" className="strata-source-toolbar-button">
            <SlidersHorizontal />
            <span>Display</span>
          </Button>
        }
      />
    </div>
  );
}

function SourceGroup({
  category,
  rows,
  model,
  first,
  onOpen,
}: {
  category: StrataSourceCategory;
  rows: StrataSource[];
  model: SourcesModel;
  first: boolean;
  onOpen: (source: StrataSource, mode: "overview" | "datasets", opener: HTMLElement | null) => void;
}) {
  const columns = useMemo<DomainColumn<StrataSource>[]>(
    () => [
      { ...domainSelectionColumn<StrataSource>((source) => source.name), size: 32 },
      {
        id: "name",
        accessorFn: (source) => source.name,
        header: "Source",
        size: 268,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="strata-source-name">
            <SourceMark source={row.original} />
            <div>
              <button
                aria-label={`Open ${row.original.name}`}
                onClick={(event) => onOpen(row.original, "overview", event.currentTarget)}
              >
                {row.original.name}
              </button>
              <p>
                <span>{row.original.provider}</span>
                <span aria-hidden="true"> · </span>
                <code>{row.original.endpoint}</code>
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "health",
        accessorFn: strataSourceHealth,
        header: "Status",
        size: 114,
        cell: ({ row }) => <SourceStatus source={row.original} />,
      },
      {
        id: "datasets",
        accessorFn: (source) =>
          source.datasets.filter((dataset) => dataset.state !== "unlinked").length,
        header: "Datasets",
        size: 199,
        cell: ({ row }) => {
          const source = row.original;
          const linked = source.datasets.filter((dataset) => dataset.state !== "unlinked");
          return (
            <button
              className="strata-source-datasets"
              aria-label={`${source.name}: ${linked.length} of ${source.datasets.length} datasets linked, open datasets`}
              onClick={(event) => onOpen(source, "datasets", event.currentTarget)}
            >
              <code>{linked[0]?.name ?? "No linked datasets"}</code>
              {linked.length > 1 && <span>+{linked.length - 1}</span>}
            </button>
          );
        },
      },
      {
        id: "linked",
        accessorFn: (source) =>
          source.datasets.filter((dataset) => dataset.state !== "unlinked").length /
          source.datasets.length,
        header: "Linked",
        size: 150,
        cell: ({ row }) => {
          const source = row.original;
          const count = source.datasets.filter((dataset) => dataset.state !== "unlinked").length;
          return (
            <div className="strata-source-linked">
              <HealthSegments
                height={6}
                label={`${count} of ${source.datasets.length} datasets linked`}
                parts={source.datasets.map((dataset) => ({
                  label: dataset.name,
                  value: 1,
                  color: dataset.state === "unlinked" ? "var(--muted)" : colors.linked,
                }))}
              />
              <span>
                {count}/{source.datasets.length}
              </span>
            </div>
          );
        },
      },
      {
        id: "lastAttemptMs",
        accessorFn: (source) => source.lastAttemptMs,
        header: "Last Sync",
        size: 126,
        cell: ({ row }) => (
          <div className="strata-source-last">
            <span data-failed={row.original.connectorHealth === "Failing"}>
              {row.original.connectorHealth === "Failing" && "Failed "}
              {ago(row.original.lastAttemptMs)}
            </span>
            <small>{row.original.cadence}</small>
          </div>
        ),
      },
      {
        id: "ownerId",
        accessorFn: (source) => strataOwner(source.ownerId)?.name,
        header: "Owner",
        size: 155,
        cell: ({ row }) => {
          const owner = strataOwner(row.original.ownerId);
          return (
            <span className="strata-source-owner">
              <Avatar>
                <AvatarFallback>
                  {owner?.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span>{owner?.name}</span>
            </span>
          );
        },
      },
      {
        id: "syncEnabled",
        accessorFn: (source) => source.syncEnabled,
        header: "Sync",
        size: 64,
        enableSorting: false,
        cell: ({ row }) => (
          <Switch
            aria-label={`Syncs for ${row.original.name}`}
            checked={row.original.syncEnabled}
            onCheckedChange={(checked) => model.setEnabled(row.original.id, checked)}
          />
        ),
      },
      {
        id: "actions",
        size: 44,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => <SourceActions source={row.original} model={model} onOpen={onOpen} />,
      },
    ],
    [model, onOpen],
  );
  const visibleIds = rows.map((source) => source.id);
  const table = useDomainGrid({
    data: rows,
    columns,
    getRowId: (source) => source.id,
    selection: model.selection.filter((id) => visibleIds.includes(id)),
    onSelectionChange: (ids) => model.setSelection(visibleIds, ids),
    hidden: model.hiddenColumns,
    onHiddenChange: model.setHiddenColumns,
  });
  const total = rows.reduce((sum, source) => sum + source.datasets.length, 0);
  const linked = rows.reduce(
    (sum, source) => sum + source.datasets.filter((dataset) => dataset.state !== "unlinked").length,
    0,
  );
  const failing = rows.filter((source) => strataSourceHealth(source) === "Failing").length;
  return (
    <DomainGridSurface
      table={table}
      scrollArea="horizontal"
      className="strata-source-table"
      layout={{ width: "fixed" }}
      renderFrame={(content, actualTable) => (
        <>
          {first && <SourceToolbar table={actualTable} model={model} />}
          <section aria-label={category} className="strata-source-group">
            <div className="strata-source-group-heading">
              <span>
                {category === "Databases" ? (
                  <Database />
                ) : category === "Warehouses" ? (
                  <Layers />
                ) : category === "Files" ? (
                  <FileStack />
                ) : (
                  <PlugZap />
                )}
                {category}
                <Badge variant="outline" size="sm">
                  {rows.length}
                </Badge>
              </span>
              <small>
                {failing > 0 && <strong>{failing} failing, </strong>}
                {linked} of {total} datasets linked
              </small>
            </div>
            {content}
          </section>
        </>
      )}
    />
  );
}

function SourceInspector({
  panel,
  source,
  model,
  onNavigate,
}: {
  panel: SourcePanel | null;
  source: StrataSource | undefined;
  model: SourcesModel;
  onNavigate: StrataPageProps["onNavigate"];
}) {
  if (panel?.mode === "catalog") {
    return <StrataSourceProviderSetup />;
  }
  if (!source) return null;
  const owner = strataOwner(source.ownerId);
  const runs = model.state.runs
    .filter((run) => run.sourceId === source.id)
    .sort((a, b) => b.atMs - a.atMs);
  return (
    <>
      <SheetHeader>
        <SheetTitle>{source.name}</SheetTitle>
        <SheetDescription>
          {panel?.mode === "datasets"
            ? "Linked datasets and their local sync state."
            : "Local connector overview, ownership and recent run history."}
        </SheetDescription>
      </SheetHeader>
      <div className="strata-source-inspector-scroll">
        <div className="strata-source-inspector-title">
          <SourceMark source={source} />
          <div>
            <strong>{source.provider}</strong>
            <p>{source.endpoint}</p>
          </div>
          <SourceStatus source={source} />
        </div>
        <dl className="strata-source-facts">
          <div>
            <dt>Environment</dt>
            <dd>{source.environment}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{owner?.name}</dd>
          </div>
          <div>
            <dt>Schedule</dt>
            <dd>{source.cadence}</dd>
          </div>
          <div>
            <dt>Last sync</dt>
            <dd>{ago(source.lastAttemptMs)}</dd>
          </div>
        </dl>
        {source.connectorHealth === "Failing" && (
          <p className="strata-source-issue">
            <KeyRound />
            The sample connector's credential is invalid. Local syncs retain this failure; no
            credential is sent or rotated.
          </p>
        )}
        {source.connectorHealth === "Degraded" && (
          <p className="strata-source-issue">
            <TriangleAlert />
            This sample connector is delayed. A local run does not clear its existing latency
            warning.
          </p>
        )}
        {source.tokenExpiring && (
          <p className="strata-source-issue">
            <KeyRound />
            The sample token is nearing expiration. External account renewal is unavailable in this
            local demo.
          </p>
        )}
        <div className="strata-source-inspector-actions">
          <Button
            variant="outline"
            disabled={!source.syncEnabled}
            onClick={() => model.sync([source.id])}
          >
            <RefreshCw />
            Run local sync
          </Button>
          <Button
            variant="outline"
            onClick={() => model.setEnabled(source.id, !source.syncEnabled)}
          >
            {source.syncEnabled ? "Pause syncs" : "Resume syncs"}
          </Button>
          {source.serviceId === "checkout-api" && (
            <Button variant="outline" onClick={() => onNavigate("/services/checkout-api")}>
              Open service
              <ArrowRight />
            </Button>
          )}
        </div>
        <h3>
          Datasets <span>{source.datasets.length}</span>
        </h3>
        <ul className="strata-source-dataset-list">
          {source.datasets.map((dataset) => (
            <li key={dataset.id}>
              <Database />
              <code>{dataset.name}</code>
              <Badge
                size="sm"
                variant={
                  dataset.state === "drifted"
                    ? "warning-light"
                    : dataset.state === "unlinked"
                      ? "outline"
                      : "success-light"
                }
              >
                {dataset.state === "in-sync"
                  ? "In sync"
                  : dataset.state === "drifted"
                    ? "Drifted"
                    : "Unlinked"}
              </Badge>
            </li>
          ))}
        </ul>
        <h3>Recent runs</h3>
        <ul className="strata-source-run-list">
          {runs.slice(0, 6).map((run) => (
            <li key={run.id}>
              <span>{ago(run.atMs)}</span>
              <span>{run.outcome}</span>
              <span>{short(run.rows)} rows</span>
            </li>
          ))}
        </ul>
        <p className="strata-source-demo-note">
          Connector endpoints, dataset extensions and run records are local demo fixtures. No
          external synchronization is performed.
        </p>
      </div>
    </>
  );
}

export function StrataSources({
  environment,
  onEnvironmentChange,
  onNavigate,
  model,
}: StrataPageProps & { model: SourcesModel }) {
  const [activity, setActivity] = useState("Runs");
  const [panel, setPanel] = useState<SourcePanel | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const metrics = useMemo(
    () => strataSourcesMetrics(model.state, environment),
    [model.state, environment],
  );
  const filtered = useMemo(
    () =>
      selectStrataSources(model.state.sources, {
        environment,
        search: model.search,
        categories: model.categories,
        unhealthy: model.unhealthy,
        query: model.query,
      }),
    [
      model.state.sources,
      environment,
      model.search,
      model.categories,
      model.unhealthy,
      model.query,
    ],
  );
  const groupNames = STRATA_SOURCE_CATEGORIES.filter((category) =>
    filtered.some((source) => source.category === category),
  );
  const groups = groupNames.length ? groupNames : [model.categories[0] ?? "Databases"];
  const currentSource =
    panel && "sourceId" in panel
      ? model.state.sources.find((source) => source.id === panel.sourceId)
      : undefined;
  const open = (
    source: StrataSource,
    mode: "overview" | "datasets",
    opener: HTMLElement | null,
  ) => {
    returnFocus.current = opener;
    setPanel({ sourceId: source.id, mode });
  };
  const inspectName = (name: string, mode: "overview" | "datasets" = "overview") => {
    const source = model.state.sources.find((item) => item.name === name);
    if (source)
      open(
        source,
        mode,
        document.activeElement instanceof HTMLElement ? document.activeElement : null,
      );
  };
  const healthParts = (["Healthy", "Degraded", "Failing", "Paused"] as const).map((label) => ({
    label,
    value: metrics.health[label],
    color: healthColor[label],
  }));
  const datasetParts = [
    { label: "In sync", value: metrics.datasets["in-sync"], color: colors.linked },
    { label: "Drifted", value: metrics.datasets.drifted, color: colors.degraded },
    { label: "Unlinked", value: metrics.datasets.unlinked, color: "#d4d4d4" },
  ];
  const activityData = metrics.hours.map((hour) => ({
    label: hour.label,
    segments: activity === "Runs" ? hour.counts : hour.rows,
  }));
  const max =
    activity === "Runs"
      ? Math.max(
          45,
          Math.ceil(
            Math.max(
              ...activityData.map((hour) => hour.segments.reduce((sum, count) => sum + count, 0)),
            ) / 15,
          ) * 15,
        )
      : Math.max(
          1,
          Math.ceil(
            Math.max(
              ...activityData.map((hour) => hour.segments.reduce((sum, count) => sum + count, 0)),
            ) / 100_000,
          ) * 100_000,
        );
  const selected = model.state.sources.filter((source) => model.selection.includes(source.id));
  return (
    <div className="strata-sources">
      <h1 className="sr-only">Sources</h1>
      <StrataHeaderActions>
        <Select
          value={environment}
          onValueChange={(value) => onEnvironmentChange(value as StrataEnvironmentFilter)}
        >
          <SelectTrigger className="strata-sources-environment" aria-label="Environment">
            <SelectValue>
              <span className="strata-source-env-wide">
                {environment === "all" ? "All Environments" : environment}
              </span>
              <span className="strata-source-env-narrow">
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
          onClick={(event) => {
            returnFocus.current = event.currentTarget;
            setPanel({ mode: "catalog" });
          }}
        >
          <Plus />
          New Source
        </Button>
      </StrataHeaderActions>
      <div className="strata-source-metrics">
        <SourceMetric
          title="Source Health"
          period="Now"
          icon={<PlugZap />}
          value={
            <strong>
              {metrics.health.Healthy}
              <small>/{metrics.sources.length}</small>
            </strong>
          }
          change={<Change current={metrics.health.Healthy} previous={metrics.healthyYesterday} />}
          note={`${metrics.healthyYesterday} healthy yesterday`}
          footer="View search-db"
          onInspect={() => inspectName("search-db")}
        >
          <HealthSegments
            height={8}
            parts={healthParts}
            label={`Sources by health: ${metrics.health.Healthy} healthy, ${metrics.health.Degraded} degraded, ${metrics.health.Failing} failing, ${metrics.health.Paused} paused`}
          />
          <SourceLegend items={healthParts} />
        </SourceMetric>
        <SourceMetric
          title="Linked Datasets"
          period="Now"
          icon={<Link2 />}
          value={
            <strong>
              {metrics.linked}
              <small>/{metrics.totalDatasets}</small>
            </strong>
          }
          change={<Change current={metrics.linked} previous={metrics.linkedLastWeek} />}
          note={`${metrics.linkedLastWeek} linked last week`}
          footer="Review schema drift"
          onInspect={() => inspectName("sre-planning-sheets", "datasets")}
        >
          <HealthSegments
            height={8}
            parts={datasetParts}
            label={`Datasets by sync state: ${metrics.datasets["in-sync"]} in sync, ${metrics.datasets.drifted} drifted, ${metrics.datasets.unlinked} unlinked`}
          />
          <SourceLegend items={datasetParts} />
        </SourceMetric>
        <SourceMetric
          title="Rows Synced"
          period="14 days"
          icon={<ArrowRightLeft />}
          value={<strong>{short(metrics.rows)}</strong>}
          change={<Change current={metrics.rows} previous={metrics.daily.at(-2)?.rows ?? 0} />}
          note={`${short(metrics.daily.at(-2)?.rows ?? 0)} yesterday`}
          footer="View telemetry-warehouse"
          onInspect={() => inspectName("telemetry-warehouse")}
        >
          <MiniTrend
            label={`Rows synced per day, last 14 days, today ${short(metrics.rows)}`}
            values={metrics.daily.map((day) => day.rows)}
            height={60}
            area
            color={colors.healthy}
            tooltips
            format={short}
          />
        </SourceMetric>
        <SourceMetric
          title="Failed Syncs"
          period="14 days"
          icon={<TriangleAlert />}
          value={<strong>{metrics.failed}</strong>}
          change={
            <Change
              current={metrics.failed}
              previous={metrics.daily.at(-2)?.failed ?? 0}
              goodUp={false}
            />
          }
          note={`${metrics.daily.at(-2)?.failed ?? 0} yesterday, ${metrics.daily.reduce((sum, day) => sum + day.failed, 0)} in 14 days`}
          footer="View search-db"
          onInspect={() => inspectName("search-db")}
        >
          <MiniTrend
            label={`Failed runs per day, last 14 days: ${metrics.daily.map((day) => day.failed).join(", ")}`}
            values={metrics.daily.map((day) => day.failed)}
            height={60}
            bars
            colors={metrics.daily.map((_, index) => (index === 13 ? colors.failing : "#f08a98"))}
            color={colors.failing}
            tooltips
            domain={[0, Math.max(5, metrics.failed)]}
          />
        </SourceMetric>
      </div>
      <div className="strata-source-middle">
        <Frame dense className="strata-source-activity">
          <FrameHeader>
            <div>
              <FrameTitle>Sync Activity</FrameTitle>
              <FrameDescription>
                {metrics.totalRuns} runs in 24 hours,{" "}
                {metrics.landedPct === null ? "—" : `${metrics.landedPct.toFixed(1)}%`} landed
              </FrameDescription>
            </div>
            <div className="strata-source-activity-options">
              <ul className="strata-source-outcomes">
                {["Succeeded", "Slow", "Failed"].map((name, index) => (
                  <li key={name}>
                    <i
                      style={{
                        background: [colors.healthy, colors.degraded, colors.failing][index],
                      }}
                    />
                    {name}
                  </li>
                ))}
              </ul>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                value={activity}
                onValueChange={(value) => value && setActivity(value)}
                aria-label="Activity shown"
              >
                <ToggleGroupItem value="Runs">Runs</ToggleGroupItem>
                <ToggleGroupItem value="Rows">Rows</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </FrameHeader>
          <FramePanel>
            <HourColumns
              label={`Source sync activity in ${activity.toLowerCase()}, last 24 hours`}
              data={activityData}
              colors={[colors.healthy, colors.degraded, colors.failing]}
              seriesNames={["Succeeded", "Slow", "Failed"]}
              max={max}
              ghost
              pattern
              grid={false}
              format={activity === "Rows" ? short : (value) => String(Math.round(value))}
            />
          </FramePanel>
        </Frame>
        <Frame dense className="strata-source-attention">
          <FrameHeader>
            <div>
              <FrameTitle>Needs Attention</FrameTitle>
              <FrameDescription>{metrics.attention.length} items, worst first</FrameDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Attention actions">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    model.resetFilters();
                    model.setUnhealthy(true);
                  }}
                >
                  Show unhealthy sources
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={model.resetFilters}>
                  Clear source filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </FrameHeader>
          <FramePanel>
            <ul>
              {metrics.attention.map((item) => (
                <li key={item.source.id}>
                  <SourceMark source={item.source} />
                  <button onClick={(event) => open(item.source, "overview", event.currentTarget)}>
                    {item.source.name}
                  </button>
                  <Badge
                    size="sm"
                    variant={
                      item.label === "Failing"
                        ? "destructive-light"
                        : item.label === "Paused"
                          ? "outline"
                          : "warning-light"
                    }
                  >
                    {item.label}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`${item.action} ${item.source.name}`}
                        onClick={(event) => {
                          if (item.label === "Paused") model.setEnabled(item.source.id, true);
                          else
                            open(
                              item.source,
                              item.label === "Schema Drift" ? "datasets" : "overview",
                              event.currentTarget,
                            );
                        }}
                      >
                        {item.action === "Rotate" ? (
                          <KeyRound />
                        ) : item.action === "Resume" ? (
                          <Play />
                        ) : item.action === "Renew" ? (
                          <RefreshCw />
                        ) : (
                          <Eye />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {item.action === "Resume" ? "Resume local syncs" : "Inspect sample source"}
                    </TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ul>
            {!metrics.attention.length && (
              <p className="strata-source-no-attention">No sources need attention.</p>
            )}
          </FramePanel>
        </Frame>
      </div>
      <Frame dense className="strata-source-all">
        <FrameHeader>
          <div>
            <FrameTitle>All Sources</FrameTitle>
            <FrameDescription role="status">Grouped by category, worst first</FrameDescription>
          </div>
          <div className="strata-source-counts">
            <Button
              variant="ghost"
              aria-pressed={!model.unhealthy}
              onClick={() => model.setUnhealthy(false)}
            >
              Sources
              <Badge variant="outline" size="sm">
                {metrics.sources.length}
              </Badge>
            </Button>
            <span />
            <Button
              variant="ghost"
              aria-pressed={model.unhealthy}
              onClick={() => model.setUnhealthy((value) => !value)}
            >
              Unhealthy
              <Badge variant="warning-light" size="sm">
                {metrics.health.Degraded + metrics.health.Failing}
              </Badge>
            </Button>
          </div>
        </FrameHeader>
        <FramePanel>
          {selected.length > 0 && (
            <div className="strata-source-selection" role="status">
              <span>{selected.length} selected</span>
              <Button
                size="sm"
                variant="outline"
                disabled={!selected.some((source) => source.syncEnabled)}
                onClick={() => {
                  model.sync(model.selection);
                  toast.message("Local syncs recorded for enabled sources");
                }}
              >
                Sync selected
              </Button>
              <Button size="sm" variant="ghost" onClick={model.clearSelection}>
                Clear selection
              </Button>
            </div>
          )}
          {groups.map((category, index) => (
            <SourceGroup
              key={category}
              category={category}
              rows={filtered.filter((source) => source.category === category)}
              model={model}
              first={index === 0}
              onOpen={open}
            />
          ))}
        </FramePanel>
      </Frame>
      <Sheet open={panel !== null} onOpenChange={(isOpen) => !isOpen && setPanel(null)}>
        <SheetContent
          className={`strata-source-sheet${panel?.mode === "catalog" ? " strata-source-provider-sheet" : ""}`}
          onCloseAutoFocus={(event) => {
            if (returnFocus.current?.isConnected) {
              event.preventDefault();
              returnFocus.current.focus({ preventScroll: true });
            }
          }}
        >
          <SourceInspector
            panel={panel}
            source={currentSource}
            model={model}
            onNavigate={onNavigate}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
