import { useId, useMemo, useState } from "react";
import {
  Activity,
  BellOff,
  Database,
  Ellipsis,
  Info,
  PanelLeft,
  Search,
  Server,
  Star,
  Target,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Dot,
  Line,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DomainGridSurface,
  useDomainGrid,
  type DomainColumn,
  type SortingState,
} from "@/blocks/data/grid-advanced-model-grid";
import { StrataHeaderActions } from "./strata-context";
import {
  STRATA_NOW_MS,
  STRATA_OWNERS,
  strataEnvironmentMatches,
  type StrataPageProps,
  type StrataRoute,
} from "./strata-domain";
import {
  SLO_OBJECTIVES,
  formatSloBudget,
  formatSloRunway,
  type SloHealth,
  type SloWindowDays,
} from "./strata-slo-engine";
import {
  selectStrataSloRows,
  matchStrataSloRows,
  strataServicesPresetQuery,
  type StrataSloRow,
  type useStrataServicesModel,
} from "./strata-services-model";
import { StrataSloForm } from "./strata-slo-form";
import "./strata-services.css";

type ServicesModel = ReturnType<typeof useStrataServicesModel>;
type HealthFilter = "all" | "exhausted" | "at-risk" | "healthy";
const healthNames: Record<HealthFilter, string> = {
  all: "All",
  exhausted: "Exhausted",
  "at-risk": "At Risk",
  healthy: "Healthy",
};
const tones: Record<SloHealth, string> = {
  exhausted: "#ef4444",
  "at-risk": "#f4b000",
  healthy: "#08b981",
  "no-data": "var(--muted-foreground)",
};
const chartConfig = { value: { label: "Budget Left" } };

function SloServiceIcon({ row }: { row: StrataSloRow }) {
  const Icon =
    row.indicator === "freshness" ? Database : row.indicator === "latency" ? Activity : Server;
  return <Icon aria-hidden="true" />;
}

function OwnerAvatar({ name }: { name: string }) {
  return (
    <Avatar className="strata-services-avatar" title={name} aria-label={name}>
      <AvatarFallback>
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
}

function BudgetValue({ row }: { row: StrataSloRow }) {
  return (
    <span
      className="strata-slo-budget"
      data-negative={(row.evaluation.remainingPct ?? 0) < 0}
      data-empty={row.evaluation.remainingPct === null}
    >
      {formatSloBudget(row.evaluation.remainingPct)}
    </span>
  );
}

function SloAlertBadge({ row }: { row: StrataSloRow }) {
  if (row.evaluation.alert === "paging")
    return (
      <Badge variant="destructive-light" className="strata-slo-alert">
        Paging
      </Badge>
    );
  if (row.evaluation.alert === "ticket")
    return (
      <Badge variant="warning-light" className="strata-slo-alert">
        Ticket
      </Badge>
    );
  if (row.evaluation.alert === "muted")
    return (
      <Badge variant="outline" className="strata-slo-alert">
        <BellOff />
        Muted
      </Badge>
    );
  return <span className="strata-slo-quiet">Quiet</span>;
}

/** Free c-chart-13/17 Area composition from MiniTrend, with nullable SLI history.
 * MIT (c) 2025 Keenthemes Inc.; components/reui/REUI-LICENSE.txt.
 * MiniTrend accepts number[] only. ReuiTrend supports nulls but reserves 28px
 * of vertical margins, exceeding this 24px row chart. Keep the free container,
 * hidden axes, Area and gradient; extend only gaps, domain and compact margins.
 */
function SloHistory({ row }: { row: StrataSloRow }) {
  const gradient = `strata-slo-history-${useId().replaceAll(":", "")}`;
  const observed = row.history.filter((value): value is number => value !== null);
  if (!observed.length)
    return (
      <span
        className="strata-slo-quiet"
        aria-label={`${row.name}: no observations in the last 90 days`}
      >
        No data
      </span>
    );
  const minimum = Math.min(...observed);
  return (
    <ChartContainer
      config={{ value: { label: "Good events", color: "#08b981" } }}
      className="strata-slo-spark"
      data-reui-chart="c-chart-13 c-chart-17"
      role="img"
      aria-label={`${row.name}: 90-day good-event history. ${row.history.length - observed.length} days without observations.`}
    >
      <ComposedChart
        accessibilityLayer={false}
        data={row.history.map((value, index) => ({ name: `Day ${index + 1}`, value }))}
        margin={{ top: 2, bottom: 0, left: 0, right: 0 }}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#08b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#08b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" hide />
        <YAxis domain={[minimum - Math.max(0.01, (100 - minimum) * 0.1), 100]} hide />
        <Area
          dataKey="value"
          type="linear"
          stroke="#08b981"
          strokeWidth={1}
          fill={`url(#${gradient})`}
          connectNulls={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

function SloDetails({
  row,
  model,
  onNavigate,
}: {
  row: StrataSloRow;
  model: ServicesModel;
  onNavigate: StrataPageProps["onNavigate"];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <PanelLeft />
          Details
        </Button>
      </SheetTrigger>
      <SheetContent className="strata-slo-sheet strata-slo-details-sheet">
        <SheetHeader>
          <SheetTitle>{row.name}</SheetTitle>
          <SheetDescription>
            {row.serviceName} · {row.evaluation.objectivePct}% over {row.evaluation.windowDays} days
          </SheetDescription>
        </SheetHeader>
        <div className="strata-slo-details-body">
          <h3>Event budget</h3>
          <dl className="strata-slo-details-grid">
            <dt>Budget left</dt>
            <dd>
              <BudgetValue row={row} />
            </dd>
            <dt>Allowed bad events</dt>
            <dd>{Math.round(row.evaluation.allowedBad).toLocaleString()}</dd>
            <dt>Observed bad events</dt>
            <dd>{Math.round(row.evaluation.bad).toLocaleString()}</dd>
            <dt>Observed total</dt>
            <dd>{Math.round(row.evaluation.total).toLocaleString()}</dd>
            <dt>Runs out</dt>
            <dd>{formatSloRunway(row.evaluation)}</dd>
            <dt>Owner</dt>
            <dd>
              {row.ownerName} · {row.team}
            </dd>
          </dl>
          <h3>Good event</h3>
          <p>{row.goodEvent || "No event description was added."}</p>
          <h3>Burn rates</h3>
          <dl className="strata-slo-details-grid">
            {(
              [
                ["1 hour", row.evaluation.burn1h],
                ["6 hours", row.evaluation.burn6h],
                ["3 days", row.evaluation.burn3d],
              ] as const
            ).map(([label, rate]) => (
              <div key={label} className="strata-slo-detail-pair">
                <dt>{label}</dt>
                <dd>{rate === null ? "No data" : `${rate.toFixed(2)}×`}</dd>
              </div>
            ))}
          </dl>
          <Button variant="outline" onClick={() => model.setMuted(row.id, !row.muted)}>
            {row.muted ? "Unmute alerts" : "Mute alerts"}
          </Button>
          {row.serviceId === "checkout-api" && (
            <Button variant="outline" onClick={() => onNavigate("/services/checkout-api")}>
              Open checkout-api
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Actual free c-chart-17 composition; native reference segments add signed lollipop stems. */
function BudgetIndex({
  rows,
  current,
  onSelect,
  model,
  onNavigate,
}: {
  rows: StrataSloRow[];
  current?: StrataSloRow;
  onSelect: (id: string) => void;
  model: ServicesModel;
  onNavigate: StrataPageProps["onNavigate"];
}) {
  const points = rows.map((row) => ({ id: row.id, value: row.evaluation.remainingPct, row }));
  const lowest = Math.min(-100, ...points.map((point) => point.value ?? 0));
  const lowerBound = Math.floor(lowest / 50) * 50;
  const ticks = Array.from(
    { length: 5 },
    (_, index) => lowerBound + ((100 - lowerBound) * index) / 4,
  );
  const counts = (health: SloHealth) =>
    rows.filter((row) => row.evaluation.health === health).length;
  return (
    <section className="strata-budget-index" aria-labelledby="strata-budget-index-title">
      <header>
        <div>
          <h2 id="strata-budget-index-title">Budget Index</h2>
          <p>
            {current ? (
              <>
                {current.name} <span aria-hidden="true">·</span> <BudgetValue row={current} />
                <span className="strata-slo-measure-description">
                  {" "}
                  <span aria-hidden="true">·</span> {current.evaluation.objectivePct}% over{" "}
                  {current.evaluation.windowDays}d
                </span>
              </>
            ) : (
              "No SLOs match this view."
            )}
          </p>
        </div>
        {current && <SloDetails row={current} model={model} onNavigate={onNavigate} />}
      </header>
      {current && (
        <div className="strata-budget-selection" aria-live="polite">
          <strong>{formatSloBudget(current.evaluation.remainingPct)}</strong>
          <span aria-hidden="true">•</span>
          {current.name}
        </div>
      )}
      {points.some((point) => point.value !== null) ? (
        <ChartContainer
          config={chartConfig}
          className="strata-budget-chart"
          data-reui-chart="c-chart-17"
          aria-label="SLO budget index. Negative budgets remain below zero."
        >
          <ComposedChart
            accessibilityLayer
            data={points}
            margin={{ top: 12, right: 10, left: 0, bottom: 8 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
            <XAxis dataKey="id" hide />
            <YAxis
              domain={[lowerBound, 100]}
              ticks={ticks}
              axisLine={false}
              tickLine={false}
              width={lowerBound < -1000 ? 84 : lowerBound < -100 ? 60 : 46}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              tickFormatter={(value: number) =>
                `${value > 0 ? "+" : ""}${Math.round(value).toLocaleString()}%`
              }
            />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
            {points
              .filter((point) => point.value !== null)
              .map((point) => (
                <ReferenceLine
                  key={point.id}
                  segment={[
                    { x: point.id, y: 0 },
                    { x: point.id, y: point.value! },
                  ]}
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                />
              ))}
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_label, payload) =>
                    (payload?.[0]?.payload as { row?: StrataSloRow })?.row?.name ?? "SLO"
                  }
                  formatter={(value) => (
                    <span className="strata-budget-tooltip">
                      {formatSloBudget(typeof value === "number" ? value : Number(value))} budget
                      left
                    </span>
                  )}
                />
              }
            />
            <Line
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
              activeDot={false}
              dot={(props) => {
                const point = props as {
                  cx?: number;
                  cy?: number;
                  payload?: { row: StrataSloRow };
                };
                if (point.cx === undefined || point.cy === undefined || !point.payload)
                  return <g />;
                const row = point.payload.row;
                return (
                  <Dot
                    key={row.id}
                    cx={point.cx}
                    cy={point.cy}
                    r={5}
                    fill={tones[row.evaluation.health]}
                    stroke="var(--background)"
                    strokeWidth={2}
                    role="img"
                    aria-label={`${row.name}: ${formatSloBudget(row.evaluation.remainingPct)} budget left`}
                    onClick={() => onSelect(row.id)}
                    className="strata-budget-dot"
                  />
                );
              }}
            />
            {current?.evaluation.remainingPct !== null && current && (
              <ReferenceDot
                x={current.id}
                y={current.evaluation.remainingPct!}
                r={8}
                fill="none"
                stroke={tones[current.evaluation.health]}
                strokeOpacity={0.3}
                strokeWidth={3}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      ) : (
        <div className="strata-budget-empty">No observed events in this view.</div>
      )}
      <div className="strata-budget-legend">
        {(
          [
            ["healthy", "Healthy"],
            ["at-risk", "At Risk"],
            ["exhausted", "Exhausted"],
          ] as const
        )
          .filter(([health]) => counts(health) > 0)
          .map(([health, label]) => (
            <span key={health}>
              <i style={{ backgroundColor: tones[health] }} aria-hidden="true" />
              {label}
              <strong>{counts(health)}</strong>
            </span>
          ))}
      </div>
    </section>
  );
}

type ServicesProps = StrataPageProps & { model: ServicesModel; presetServiceId?: string };

/** A route entry changes the index's visible defaults, never the persisted SLO model. */
export function StrataServices(props: ServicesProps) {
  return <StrataServicesIndex key={props.presetServiceId ?? "all-services"} {...props} />;
}

function StrataServicesIndex({
  model,
  environment,
  onNavigate,
  pinnedRoutes,
  onTogglePin,
  presetServiceId,
}: ServicesProps) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState(() => strataServicesPresetQuery(presetServiceId));
  const [health, setHealth] = useState<HealthFilter>("all");
  const [objective, setObjective] = useState("own");
  const [window, setWindow] = useState("own");
  const [team, setTeam] = useState("all");
  const [selectedId, setSelectedId] = useState(model.definitions[0]?.id ?? "");
  const [sorting, setSorting] = useState<SortingState>([{ id: "budget", desc: false }]);
  const allRows = useMemo(
    () =>
      selectStrataSloRows(model.definitions, model.ledger, {
        objectivePct: objective === "own" ? undefined : Number(objective),
        windowDays: window === "own" ? undefined : (Number(window) as SloWindowDays),
      }).filter((row) => strataEnvironmentMatches(row.serviceId, environment)),
    [model.definitions, model.ledger, objective, window, environment],
  );
  const matchingRows = useMemo(
    () => matchStrataSloRows(allRows, query, team),
    [allRows, query, team],
  );
  const filtered = useMemo(
    () => matchingRows.filter((row) => health === "all" || row.evaluation.health === health),
    [matchingRows, health],
  );
  const indexRows = useMemo(
    () =>
      [...filtered].sort(
        (left, right) =>
          (left.evaluation.remainingPct ?? Infinity) - (right.evaluation.remainingPct ?? Infinity),
      ),
    [filtered],
  );
  const current = filtered.find((row) => row.id === selectedId) ?? indexRows[0];
  const columns = useMemo<DomainColumn<StrataSloRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.name,
        header: "SLO",
        size: isMobile ? 236 : 208,
        minSize: 160,
        meta: { autoSize: true },
        cell: ({ row }) => (
          <div className="strata-slo-name-cell">
            <button type="button" onClick={() => setSelectedId(row.original.id)}>
              {row.original.name}
            </button>
            <div>
              <SloServiceIcon row={row.original} />
              <span>{row.original.serviceName}</span>
              <span aria-hidden="true">•</span>
              {row.original.evaluation.objectivePct}%<span aria-hidden="true">•</span>
              {row.original.evaluation.windowDays}d
            </div>
          </div>
        ),
      },
      {
        id: "owner",
        accessorFn: (row) => row.ownerName,
        header: "Owner",
        size: 64,
        enableSorting: false,
        cell: ({ row }) => <OwnerAvatar name={row.original.ownerName} />,
      },
      {
        id: "history",
        accessorFn: (row) => row.evaluation.observedGoodPct,
        header: "90 Days",
        size: 96,
        enableSorting: false,
        cell: ({ row }) => <SloHistory row={row.original} />,
      },
      {
        id: "budget",
        accessorFn: (row) => row.evaluation.remainingPct ?? Infinity,
        header: "Budget Left",
        size: 112,
        cell: ({ row }) => <BudgetValue row={row.original} />,
      },
      {
        id: "runway",
        accessorFn: (row) => row.evaluation.runwayDays ?? Infinity,
        header: "Runs Out",
        size: 92,
        cell: ({ row }) => (
          <span
            className={
              row.original.evaluation.health === "exhausted" ? "strata-slo-spent" : undefined
            }
          >
            {formatSloRunway(row.original.evaluation)}
          </span>
        ),
      },
      {
        id: "alert",
        accessorFn: (row) => row.evaluation.alert,
        header: "Alert",
        size: 84,
        cell: ({ row }) => <SloAlertBadge row={row.original} />,
      },
    ],
    [isMobile],
  );
  const table = useDomainGrid({
    data: filtered,
    columns,
    sorting,
    onSortingChange: setSorting,
    alwaysHidden: isMobile ? ["owner", "history", "runway", "alert"] : [],
  });
  const count = (value: HealthFilter) =>
    value === "all"
      ? matchingRows.length
      : matchingRows.filter((row) => row.evaluation.health === value).length;
  const pinRoute: StrataRoute =
    presetServiceId === "checkout-api" ? "/services/checkout-api" : "/services";
  const reset = () => {
    setQuery("");
    setHealth("all");
    setObjective("own");
    setWindow("own");
    setTeam("all");
  };
  const teams = [...new Set(STRATA_OWNERS.map((owner) => owner.team))];
  const evaluated = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(STRATA_NOW_MS);
  return (
    <div className="strata-services" data-strata-page="services">
      <StrataHeaderActions>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={pinnedRoutes.includes(pinRoute)}
          onClick={() => onTogglePin(pinRoute)}
          className="strata-services-pin"
        >
          <Star fill={pinnedRoutes.includes(pinRoute) ? "currentColor" : "none"} />
          <span>{pinnedRoutes.includes(pinRoute) ? "Unpin" : "Pin"}</span>
        </Button>
        <StrataSloForm
          model={model}
          onCreated={(id) => {
            reset();
            setSelectedId(id);
          }}
        />
      </StrataHeaderActions>
      <Frame dense spacing="default" className="strata-services-frame">
        <FrameHeader className="strata-services-frame-header">
          <div>
            <FrameTitle>Service reliability</FrameTitle>
            <FrameDescription>
              {allRows.length} SLOs <span aria-hidden="true">•</span>{" "}
              {allRows.filter((row) => row.evaluation.health === "exhausted").length} exhausted{" "}
              <span aria-hidden="true">•</span>{" "}
              {allRows.filter((row) => row.evaluation.alert === "paging").length} paging
            </FrameDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="More index actions">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={reset}>Reset filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </FrameHeader>
        <FramePanel className="strata-services-panel">
          <Tabs
            value={health}
            onValueChange={(value) => setHealth(value as HealthFilter)}
            className="strata-services-tabs"
          >
            <div className="strata-services-tabs-viewport">
              <TabsList variant="line" aria-label="Service reliability status">
                {(["all", "exhausted", "at-risk", "healthy"] as const).map((value) => (
                  <TabsTrigger key={value} value={value}>
                    {healthNames[value]}
                    <span className="strata-slo-tab-count">{count(value)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value={health} className="min-w-0">
              <div className="strata-services-filters">
                <InputGroup className="strata-services-search">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label="Search SLOs"
                    placeholder="Search services or SLOs…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  {query && (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <X />
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                </InputGroup>
                {(query ||
                  health !== "all" ||
                  objective !== "own" ||
                  window !== "own" ||
                  team !== "all") && (
                  <Button variant="outline" onClick={reset}>
                    Reset
                  </Button>
                )}
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger
                    aria-label="Measure at objective"
                    className="strata-services-objective"
                  >
                    <Target />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Own objective</SelectItem>
                    {SLO_OBJECTIVES.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  spacing={0}
                  value={window}
                  onValueChange={(value) => value && setWindow(value)}
                  aria-label="Measure over rolling window"
                  className="strata-services-window"
                >
                  {["own", "7", "28", "30"].map((value) => (
                    <ToggleGroupItem key={value} value={value}>
                      {value === "own" ? "Own" : `${value}D`}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Select value={team} onValueChange={setTeam}>
                  <SelectTrigger aria-label="Team" className="strata-services-team">
                    <Users />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All teams</SelectItem>
                    {teams.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="strata-services-content">
                <div className="strata-services-table-wrap">
                  <DomainGridSurface
                    table={table}
                    scrollArea="vertical"
                    layout={{ headerSticky: true }}
                    onRowClick={(row) => setSelectedId(row.id)}
                    className="strata-services-table"
                  />
                </div>
                <BudgetIndex
                  rows={indexRows}
                  current={current}
                  onSelect={setSelectedId}
                  model={model}
                  onNavigate={onNavigate}
                />
              </div>
            </TabsContent>
          </Tabs>
        </FramePanel>
        <FrameFooter className="strata-services-footer">
          <span>
            Showing {filtered.length} of {allRows.length} SLOs <span aria-hidden="true">•</span>{" "}
            {allRows.filter((row) => row.muted).length} muted
          </span>
          <span>
            <Info aria-hidden="true" />
            <span className="strata-services-measured">
              Measured at {objective === "own" ? "own objective" : `${objective}%`}{" "}
              <span aria-hidden="true">•</span>{" "}
            </span>
            Evaluated {evaluated} UTC
          </span>
        </FrameFooter>
      </Frame>
    </div>
  );
}
