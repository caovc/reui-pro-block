import { useId, useMemo, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Ellipsis,
  Filter,
  Minus,
  Play,
  RefreshCw,
  SlidersHorizontal,
  Star,
  Timer,
  Triangle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
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
import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "@/components/reui/color-picker";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReuiDotPattern, ReuiStripePattern } from "@/blocks/data/reui-free-chart-primitives";
import { MiniTrend } from "@/blocks/data/sparkline-primitives";
import { useIsMobile } from "@/hooks/use-mobile";
import { strataCronLabel } from "./strata-cron";
import { StrataMonitorForm } from "./strata-monitor-form";
import { StrataMonitorDetails } from "./strata-monitor-details";
import { strataMonitorDetailId } from "./strata-monitor-details-model";
import { StrataHeaderActions } from "./strata-context";
import { STRATA_NOW_MS, type StrataPageProps } from "./strata-domain";
import {
  formatStrataMonitorDuration,
  selectStrataMonitorRows,
  strataCheckDuration,
  strataMonitorMetrics,
  strataMonitorRow,
  type StrataCheckStatus,
  type StrataMonitorCheck,
  type StrataMonitorFilter,
  type StrataMonitorRow,
  type StrataMonitorsModel,
} from "./strata-monitors-model";
import "./strata-monitors.css";

const statusColors: Record<StrataCheckStatus, string> = {
  Succeeded: "#28b99e",
  Failed: "#f12d3d",
  "Timed Out": "#efb30b",
  Skipped: "#a0a0a0",
};
const statusKey = (status: StrataCheckStatus) => status.toLowerCase().replaceAll(" ", "-");
const changeDirection = (change: number | null) =>
  change === null || Math.abs(change) < 0.05 ? "flat" : change > 0 ? "up" : "down";
const signedDuration = (change: number | null) =>
  change === null
    ? "—"
    : `${change > 0 ? "+" : change < 0 ? "−" : ""}${formatStrataMonitorDuration(Math.abs(change))}`;
const signedPoints = (change: number | null) =>
  change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)} pts`;
const checkTime = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});
const axisTime = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});
const formatTime = (value: string | number) => `${checkTime.format(new Date(value))} UTC`;
const percent = (value: number | null, decimals = 1) =>
  value === null ? "—" : `${value.toFixed(decimals)}%`;
const relativeTime = (value: string) => {
  const minutes = Math.max(0, Math.round((STRATA_NOW_MS - Date.parse(value)) / 60000));
  return minutes === 0
    ? "Just now"
    : minutes >= 1440
      ? `${Math.floor(minutes / 1440)}d ago`
      : minutes >= 60
        ? `${Math.floor(minutes / 60)}h ago`
        : `${minutes}m ago`;
};

function CheckBadge({ status }: { status: StrataCheckStatus }) {
  return (
    <Badge
      variant={
        status === "Succeeded"
          ? "success-light"
          : status === "Failed"
            ? "destructive-light"
            : status === "Timed Out"
              ? "warning-light"
              : "secondary"
      }
    >
      {status === "Timed Out" && <Timer />}
      {status === "Succeeded" ? "Up" : status === "Failed" ? "Down" : status}
    </Badge>
  );
}

function CheckHistory({
  row,
  selectedId,
  onSelect,
}: {
  row: StrataMonitorRow;
  selectedId: string;
  onSelect: (check: StrataMonitorCheck) => void;
}) {
  const maximum = Math.max(1, ...row.checks.map(strataCheckDuration));
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const activeId = row.checks.some((check) => check.id === focusedId)
    ? focusedId
    : row.checks.some((check) => check.id === selectedId)
      ? selectedId
      : row.checks.at(-1)?.id;
  const move = (index: number, key: string, parent: HTMLElement | null) => {
    const next =
      key === "Home"
        ? 0
        : key === "End"
          ? row.checks.length - 1
          : Math.max(0, Math.min(row.checks.length - 1, index + (key === "ArrowLeft" ? -1 : 1)));
    const check = row.checks[next];
    setFocusedId(check.id);
    parent?.querySelector<HTMLButtonElement>(`[data-check-index="${next}"]`)?.focus();
  };
  if (!row.checks.length) return <span className="strata-monitor-no-history">No checks yet</span>;
  return (
    <div
      className="strata-monitor-history"
      role="group"
      aria-label={`${row.monitor.name}, last ${row.checks.length} checks, oldest first: ${percent(row.successRate, 0)} succeeded`}
    >
      {row.checks.map((check, index) => (
        <Tooltip key={check.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              type="button"
              tabIndex={check.id === activeId ? 0 : -1}
              data-check-index={index}
              data-status={check.status}
              data-selected={selectedId === check.id || undefined}
              aria-label={`${formatTime(check.startedAt)}, ${check.status}, ${formatStrataMonitorDuration(strataCheckDuration(check))}`}
              aria-pressed={selectedId === check.id}
              onFocus={() => setFocusedId(check.id)}
              onClick={() => onSelect(check)}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  move(index, event.key, event.currentTarget.parentElement);
                }
              }}
            >
              <span
                style={{
                  height: `${Math.max(20, (strataCheckDuration(check) / maximum) * 100)}%`,
                  backgroundColor: statusColors[check.status],
                }}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {formatTime(check.startedAt)} · {check.status} ·{" "}
            {formatStrataMonitorDuration(strataCheckDuration(check))}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function DurationChart({
  row,
  checks,
  selected,
  prior,
  color,
  layers,
  onSelect,
  onHover,
}: {
  row: StrataMonitorRow;
  checks: StrataMonitorCheck[];
  selected: StrataMonitorCheck | null;
  prior: StrataMonitorRow;
  color: string;
  layers: string[];
  onSelect: (check: StrataMonitorCheck) => void;
  onHover: (id: string | null) => void;
}) {
  const uid = useId().replaceAll(":", "");
  const deployment = checks.find((check) => check.deployment);
  const maximum = Math.max(row.monitor.timeoutSeconds, ...checks.map(strataCheckDuration));
  const ticks = checks
    .filter((_, index) => index === 1 || index === 7 || index === 13 || index === checks.length - 1)
    .map((check) => check.id);
  const shade = (status: StrataCheckStatus) =>
    status === "Succeeded" ? color : statusColors[status];
  const stepsLabel = row.id === "checkout" ? "Checkout steps" : "Check steps";
  const config = {
    loadSeconds: { label: "Load", color },
    stepsSeconds: { label: stepsLabel, color },
    confirmSeconds: { label: "Confirm", color },
  };
  return (
    <ChartContainer
      className="strata-monitor-chart"
      config={config}
      aria-label={`Run durations for ${row.monitor.target}`}
      data-reui-chart="c-chart-3 c-chart-4"
    >
      <BarChart
        data={checks}
        accessibilityLayer
        barCategoryGap="50%"
        margin={{ top: 22, right: 24, left: 0, bottom: 8 }}
        onMouseLeave={() => onHover(null)}
      >
        <defs>
          {(["Succeeded", "Failed", "Timed Out", "Skipped"] as const).map((status) => (
            <g key={status}>
              <ReuiDotPattern id={`${uid}-${statusKey(status)}-load`} color={shade(status)} />
              <ReuiStripePattern id={`${uid}-${statusKey(status)}-steps`} color={shade(status)} />
              <pattern
                id={`${uid}-${statusKey(status)}-confirm`}
                width="4"
                height="3"
                patternUnits="userSpaceOnUse"
              >
                <rect width="4" height="3" fill={shade(status)} opacity={0.12} />
                <path d="M0 1H4" stroke={shade(status)} opacity={0.8} />
              </pattern>
            </g>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="id"
          ticks={ticks}
          minTickGap={20}
          interval="preserveStartEnd"
          axisLine={false}
          tickLine={false}
          height={28}
          tick={{ fontSize: 12 }}
          tickFormatter={(id: string) => {
            const check = checks.find((entry) => entry.id === id);
            return check ? axisTime.format(new Date(check.startedAt)) : "";
          }}
        />
        <YAxis
          domain={[0, maximum * 1.1]}
          width={34}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          tickFormatter={(value: number) =>
            value === 0 ? "0" : formatStrataMonitorDuration(value)
          }
        />
        {layers.includes("range") && prior.p50 !== null && prior.p95 !== null && (
          <ReferenceArea
            y1={prior.p50}
            y2={prior.p95}
            fill="var(--muted-foreground)"
            fillOpacity={0.12}
            stroke="none"
          />
        )}
        {layers.includes("timeout") && (
          <ReferenceLine y={row.monitor.timeoutSeconds} stroke="#efb30b" strokeDasharray="3 4" />
        )}
        {layers.includes("deploy") && deployment && (
          <ReferenceLine
            x={deployment.id}
            stroke="var(--muted-foreground)"
            strokeDasharray="1 3"
            label={{
              value: deployment.deployment,
              position: "insideTopLeft",
              fill: "var(--foreground)",
              fontSize: 12,
            }}
          />
        )}
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) => {
                const check = payload?.[0]?.payload as StrataMonitorCheck | undefined;
                return check ? `${check.id} · ${formatTime(check.startedAt)}` : "Check";
              }}
              formatter={(value, name) => (
                <span className="strata-monitor-tooltip-value">
                  {config[name as keyof typeof config]?.label ?? name}
                  <strong>{formatStrataMonitorDuration(Number(value))}</strong>
                </span>
              )}
            />
          }
        />
        {(["loadSeconds", "stepsSeconds", "confirmSeconds"] as const).map((phase) => (
          <Bar
            key={phase}
            dataKey={phase}
            stackId="check"
            isAnimationActive={false}
            onClick={(event) => {
              const check = checks.find(
                (candidate) =>
                  candidate.id === (event.payload as StrataMonitorCheck | undefined)?.id,
              );
              if (check) onSelect(check);
            }}
          >
            {checks.map((check) => (
              <Cell
                key={check.id}
                fill={`url(#${uid}-${statusKey(check.status)}-${phase === "loadSeconds" ? "load" : phase === "stepsSeconds" ? "steps" : "confirm"})`}
                opacity={selected && selected.id !== check.id ? 0.85 : 1}
                role="img"
                aria-label={`${check.id}: ${config[phase].label} ${formatStrataMonitorDuration(check[phase])}, ${check.status}`}
                onMouseEnter={() => onHover(check.id)}
              />
            ))}
          </Bar>
        ))}
        {layers.includes("outliers") &&
          checks
            .filter((check) => check.outlier)
            .map((check) => (
              <ReferenceDot
                key={check.id}
                x={check.id}
                y={strataCheckDuration(check) + maximum * 0.025}
                shape={(props) => {
                  const { cx, cy } = props as { cx?: number; cy?: number };
                  return cx === undefined || cy === undefined ? (
                    <g />
                  ) : (
                    <path
                      d={`M${cx - 3.5} ${cy - 2}h7l-3.5 5z`}
                      fill="var(--foreground)"
                      role="img"
                      aria-label={`${check.id} is an outlier: ${formatStrataMonitorDuration(strataCheckDuration(check))}`}
                    />
                  );
                }}
              />
            ))}
      </BarChart>
    </ChartContainer>
  );
}

type MonitorsProps = StrataPageProps & { model: StrataMonitorsModel; preset?: "api-acme-com" };

export function StrataMonitors(props: MonitorsProps) {
  return <StrataMonitorsIndex key={props.preset ?? "all-monitors"} {...props} />;
}

function StrataMonitorsIndex({
  model,
  environment,
  onEnvironmentChange,
  pinnedRoutes,
  onTogglePin,
  onNavigate,
  preset,
}: MonitorsProps) {
  const isMobile = useIsMobile();
  const [detailId, setDetailId] = useState(() => strataMonitorDetailId(model.monitors, preset));
  const detailsOpener = useRef<HTMLElement | null>(null);
  const detailsFallback = useRef<HTMLButtonElement | null>(null);
  const [historyFilter, setHistoryFilter] = useState<StrataMonitorFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StrataCheckStatus>("all");
  const [color, setColor] = useState("#28b99e");
  const [layers, setLayers] = useState(["range", "outliers", "deploy", "timeout"]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showLastCheck, setShowLastCheck] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);
  const heading = useRef<HTMLDivElement>(null);
  const rows = useMemo(
    () => selectStrataMonitorRows(model.monitors, model.checks, environment, historyFilter),
    [model.monitors, model.checks, environment, historyFilter],
  );
  const environmentRows = useMemo(
    () => selectStrataMonitorRows(model.monitors, model.checks, environment),
    [model.monitors, model.checks, environment],
  );
  const current =
    environmentRows.find((row) => row.id === model.selectedId) ?? environmentRows[0] ?? null;
  const prior = current ? strataMonitorRow(current.monitor, model.previousChecks) : null;
  const checks =
    current?.checks.filter((check) => statusFilter === "all" || check.status === statusFilter) ??
    [];
  const selected =
    checks.find((check) => check.id === hoveredId) ??
    checks.find((check) => check.id === model.selectedCheckId) ??
    checks.at(-1) ??
    null;
  const metrics = strataMonitorMetrics(rows);
  const previousMetrics = strataMonitorMetrics(
    selectStrataMonitorRows(
      rows.map((row) => row.monitor),
      model.previousChecks,
    ),
  );
  const delta =
    metrics.successRate !== null && previousMetrics.successRate !== null
      ? metrics.successRate - previousMetrics.successRate
      : null;
  const choose = (row: StrataMonitorRow, check?: StrataMonitorCheck) => {
    model.selectCheck(row.id, check?.id);
    setHoveredId(null);
    setStatusFilter("all");
  };
  const chooseFromHistory = (row: StrataMonitorRow, check?: StrataMonitorCheck) => {
    choose(row, check);
    heading.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const pinRoute = preset === "api-acme-com" ? "/monitors/api-acme-com" : "/monitors";
  const pinned = pinnedRoutes.includes(pinRoute);
  const successChange =
    current && prior && current.successRate !== null && prior.successRate !== null
      ? current.successRate - prior.successRate
      : null;
  const p50Change =
    current && prior && current.p50 !== null && prior.p50 !== null ? current.p50 - prior.p50 : null;
  const p95Change =
    current && prior && current.p95 !== null && prior.p95 !== null ? current.p95 - prior.p95 : null;
  const timeoutChange =
    current?.latest && prior?.latest
      ? ((strataCheckDuration(current.latest) - strataCheckDuration(prior.latest)) /
          current.monitor.timeoutSeconds) *
        100
      : null;
  const topCards =
    current && prior
      ? [
          {
            title: "Success Rate",
            value: percent(current.successRate),
            delta: signedPoints(successChange),
            direction: changeDirection(successChange),
            worsened: successChange !== null && successChange < 0,
            values: current.checks.map(
              (_, index) =>
                (current.checks.slice(0, index + 1).filter((check) => check.status === "Succeeded")
                  .length /
                  (index + 1)) *
                100,
            ),
          },
          {
            title: "p50 response",
            value: formatStrataMonitorDuration(current.p50),
            delta: signedDuration(p50Change),
            direction: changeDirection(p50Change),
            worsened: p50Change !== null && p50Change > 0,
            values: current.checks.map(strataCheckDuration),
          },
          {
            title: "p95 response",
            value: formatStrataMonitorDuration(current.p95),
            delta: signedDuration(p95Change),
            direction: changeDirection(p95Change),
            worsened: p95Change !== null && p95Change > 0,
            values: current.checks.map(strataCheckDuration),
          },
          {
            title: "Timeout Budget",
            value: current.latest
              ? percent(
                  (strataCheckDuration(current.latest) / current.monitor.timeoutSeconds) * 100,
                )
              : "—",
            delta: signedPoints(timeoutChange),
            direction: changeDirection(timeoutChange),
            worsened: timeoutChange !== null && timeoutChange > 0,
            values: current.checks.map(
              (check) => (strataCheckDuration(check) / current.monitor.timeoutSeconds) * 100,
            ),
          },
        ]
      : [];
  return (
    <div className="strata-monitors" data-strata-page="monitors">
      <h1 className="sr-only">Monitors</h1>
      <StrataHeaderActions>
        <Button
          ref={detailsFallback}
          variant="outline"
          size={isMobile ? "icon" : "default"}
          aria-label={pinned ? "Unpin Monitors" : "Pin Monitors"}
          aria-pressed={pinned}
          className="strata-monitors-pin"
          onClick={() => onTogglePin(pinRoute)}
        >
          <Star fill={pinned ? "currentColor" : "none"} />
          <span>{pinned ? "Unpin" : "Pin"}</span>
        </Button>
        <StrataMonitorForm
          model={model}
          onCreated={() => {
            setHistoryFilter("all");
            setStatusFilter("all");
            setHoveredId(null);
            onEnvironmentChange("all");
          }}
        />
      </StrataHeaderActions>
      <Frame dense className="strata-monitor-frame">
        <FrameHeader className="strata-monitor-frame-header" ref={heading}>
          <div>
            <FrameTitle>{current?.monitor.name ?? "No monitors"}</FrameTitle>
            <FrameDescription>
              {current ? (
                <>
                  <span>{current.monitor.target}</span>
                  <span className="strata-monitor-description-dot"> · </span>
                  <span>
                    {strataCronLabel(current.monitor.cron)} from {current.monitor.regions}{" "}
                    {current.monitor.regions === 1 ? "region" : "regions"}
                  </span>
                </>
              ) : (
                "No monitors in this environment."
              )}
            </FrameDescription>
          </div>
          <div className="strata-monitor-toolbar">
            <ButtonGroup aria-label="View">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    aria-label={`Statuses shown: ${statusFilter === "all" ? "All Statuses" : statusFilter}`}
                  >
                    <Filter />
                    {statusFilter === "all" ? "All Statuses" : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
                  >
                    {(["all", "Succeeded", "Failed", "Timed Out", "Skipped"] as const).map(
                      (status) => (
                        <DropdownMenuRadioItem key={status} value={status}>
                          {status === "all" ? "All Statuses" : status}
                        </DropdownMenuRadioItem>
                      ),
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Chart display options">
                    <SlidersHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Chart layers</DropdownMenuLabel>
                  {[
                    ["range", "p50 to p95"],
                    ["outliers", "Outliers"],
                    ["deploy", "Deployments"],
                    ["timeout", "Timeout threshold"],
                  ].map(([key, label]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={layers.includes(key)}
                      onCheckedChange={(checked) =>
                        setLayers((currentLayers) =>
                          checked
                            ? [...currentLayers, key]
                            : currentLayers.filter((value) => value !== key),
                        )
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <ColorPicker
                value={color}
                onValueChange={(value) => {
                  if (value) setColor(value);
                }}
                aria-label="Chart color"
              >
                <ColorPickerTrigger size="icon" aria-label="Chart color">
                  <ColorPickerSwatch shape="circle" />
                </ColorPickerTrigger>
                <ColorPickerContent align="end" />
              </ColorPicker>
            </ButtonGroup>
            <ButtonGroup aria-label="Monitor actions">
              <Button
                variant="outline"
                size="icon"
                aria-label="Refresh checks"
                onClick={() => {
                  if (current) choose(current);
                }}
              >
                <RefreshCw />
              </Button>
              <Button variant="outline" size="icon" aria-label="Run now" disabled>
                <Play />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More monitor actions">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setStatusFilter("all");
                      setLayers(["range", "outliers", "deploy", "timeout"]);
                      setColor("#28b99e");
                    }}
                  >
                    Reset chart view
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </div>
        </FrameHeader>
        <FramePanel className="strata-monitor-panel">
          <dl className="strata-monitor-kpis">
            {topCards.map((card) => (
              <div key={card.title}>
                <dt>{card.title}</dt>
                <dd>{card.value}</dd>
                <div className="strata-monitor-kpi-bottom">
                  <span data-direction={card.direction} data-worsened={card.worsened || undefined}>
                    {card.direction === "flat" ? (
                      <Minus />
                    ) : card.direction === "down" ? (
                      <ArrowDownRight />
                    ) : (
                      <ArrowUpRight />
                    )}
                    {card.delta}
                  </span>
                  {card.values.length ? (
                    <MiniTrend
                      values={card.values}
                      label={`${card.title} over the last checks`}
                      color="var(--muted-foreground)"
                      height={28}
                      curve="linear"
                    />
                  ) : (
                    <span className="strata-monitor-no-history">No checks yet</span>
                  )}
                </div>
              </div>
            ))}
          </dl>
          <div className="strata-monitor-selection" aria-live="polite">
            {selected ? (
              <>
                <CheckBadge status={selected.status} />
                <code>{selected.id}</code>
                <span className="strata-monitor-dot">·</span>
                <span>{formatTime(selected.startedAt)}</span>
                {selected.outlier && (
                  <>
                    <span className="strata-monitor-dot">·</span>
                    <span className="strata-monitor-outlier">
                      <Triangle fill="currentColor" /> Outlier
                    </span>
                  </>
                )}
                <div className="strata-monitor-selected-phases">
                  <span>
                    <i className="strata-monitor-load" />
                    {formatStrataMonitorDuration(selected.loadSeconds)}
                  </span>
                  <span>
                    <i className="strata-monitor-steps" />
                    {formatStrataMonitorDuration(selected.stepsSeconds)}
                  </span>
                  <strong>{formatStrataMonitorDuration(strataCheckDuration(selected))}</strong>
                </div>
              </>
            ) : (
              <span>No checks match this view.</span>
            )}
          </div>
          {current && prior && checks.length ? (
            <DurationChart
              row={current}
              checks={checks}
              selected={selected}
              prior={prior}
              color={color}
              layers={layers}
              onSelect={(check) => {
                model.selectCheck(current.id, check.id);
                setHoveredId(null);
              }}
              onHover={setHoveredId}
            />
          ) : (
            <div className="strata-monitor-empty">
              {current?.checks.length ? "No checks match this view." : "No checks recorded yet."}
            </div>
          )}
        </FramePanel>
        <FrameFooter className="strata-monitor-legend">
          <div>
            <span>
              <i className="strata-monitor-load" />
              Load
            </span>
            <span>
              <i className="strata-monitor-steps" />
              {current?.id === "checkout" ? "Checkout steps" : "Check steps"}
            </span>
            <span>
              <i className="strata-monitor-confirm" />
              Confirm
            </span>
          </div>
          <div className="strata-monitor-layer-legend">
            <span>
              <i className="strata-monitor-range" />
              p50 to p95
            </span>
            <span>▾ Outlier</span>
            <span>⋮ Deploy</span>
            <span>⋯ Timeout</span>
          </div>
        </FrameFooter>
      </Frame>
      <Frame dense className="strata-monitor-frame">
        <FrameHeader className="strata-monitor-frame-header">
          <div>
            <FrameTitle>Check history</FrameTitle>
            <FrameDescription>
              {rows.length} monitors <span aria-hidden="true">·</span> As of{" "}
              {formatTime(STRATA_NOW_MS)}
            </FrameDescription>
          </div>
          <div className="strata-monitor-toolbar">
            <Select
              value={historyFilter}
              onValueChange={(value) => setHistoryFilter(value as StrataMonitorFilter)}
            >
              <SelectTrigger aria-label="Show monitors" className="strata-monitor-filter">
                <Filter />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["all", "Healthy", "Failing", "Paused", "Pending"] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value === "all" ? "All monitors" : `${value} monitors`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ButtonGroup aria-label="List menus">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="History display options">
                    <SlidersHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={showLastCheck}
                    onCheckedChange={(value) => setShowLastCheck(Boolean(value))}
                  >
                    Last check
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={showSuccess}
                    onCheckedChange={(value) => setShowSuccess(Boolean(value))}
                  >
                    Success rate
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More history actions">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setHistoryFilter("all")}>
                    Show all monitors
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setShowLastCheck(true);
                      setShowSuccess(true);
                    }}
                  >
                    Reset display
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </div>
        </FrameHeader>
        <FramePanel className="strata-monitor-panel">
          <dl className="strata-monitor-summary">
            <div>
              <dt>Success Rate</dt>
              <dd>{percent(metrics.successRate)}</dd>
              <span className="strata-monitor-summary-delta">
                <ArrowDownRight />
                {delta === null ? "—" : `${Math.abs(delta).toFixed(1)} pts`}
                <span>vs older checks</span>
              </span>
            </div>
            <div>
              <dt>Checks</dt>
              <dd>{metrics.total}</dd>
              <div className="strata-monitor-total">
                <span
                  role="img"
                  aria-label={`${metrics.succeeded} succeeded, ${metrics.failed} failed, ${metrics.timedOut} timed out, ${metrics.skipped} skipped`}
                >
                  {(["Succeeded", "Failed", "Timed Out", "Skipped"] as const).map((status) => (
                    <i
                      key={status}
                      style={{
                        flex:
                          status === "Succeeded"
                            ? metrics.succeeded
                            : status === "Failed"
                              ? metrics.failed
                              : status === "Timed Out"
                                ? metrics.timedOut
                                : metrics.skipped,
                        backgroundColor: statusColors[status],
                      }}
                    />
                  ))}
                </span>
                <span>{metrics.failed + metrics.timedOut} failed</span>
              </div>
            </div>
            <div>
              <dt>Failing monitors</dt>
              <dd>
                {metrics.failing}
                <small>of {rows.length}</small>
              </dd>
              <span>Longest streak {metrics.longestFailureStreak} checks</span>
            </div>
            <div>
              <dt>Slowest p95</dt>
              <dd>{formatStrataMonitorDuration(metrics.slowest?.p95 ?? null)}</dd>
              <span>{metrics.slowest?.monitor.name ?? "No check data"}</span>
            </div>
          </dl>
          <div className="strata-monitor-history-header" aria-hidden="true">
            <span>Monitor</span>
            <span>{showLastCheck && "Last check"}</span>
            <span>
              Last 20 checks <span>Oldest to newest</span>
            </span>
            <span>{showSuccess && "Success"}</span>
          </div>
          <ul className="strata-monitor-list" aria-label="Monitors">
            {rows.map((row) => (
              <li key={row.id} data-current={current?.id === row.id || undefined}>
                <div className="strata-monitor-name">
                  <Button
                    variant="link"
                    onClick={(event) => {
                      choose(row);
                      detailsOpener.current = event.currentTarget;
                      setDetailId(row.id);
                    }}
                  >
                    {row.monitor.name}
                  </Button>
                  {!row.monitor.enabled && (
                    <Badge variant="secondary" size="sm">
                      Paused
                    </Badge>
                  )}
                  <code>
                    {row.monitor.target}
                    {row.monitor.regions > 1 ? ` · ${row.monitor.regions} regions` : ""}
                  </code>
                </div>
                <div className="strata-monitor-last">
                  {showLastCheck && row.latest && (
                    <>
                      <CheckBadge status={row.latest.status} />
                      <span>
                        {relativeTime(row.latest.startedAt)} ·{" "}
                        {formatStrataMonitorDuration(strataCheckDuration(row.latest))}
                      </span>
                    </>
                  )}
                </div>
                <CheckHistory
                  row={row}
                  selectedId={model.selectedCheckId}
                  onSelect={(check) => chooseFromHistory(row, check)}
                />
                <div className="strata-monitor-success">
                  {showSuccess && (
                    <>
                      <strong>{percent(row.successRate, 0)}</strong>
                      <span>p95 {formatStrataMonitorDuration(row.p95)}</span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {!rows.length && (
            <div className="strata-monitor-empty">
              No monitors match this environment and status.
            </div>
          )}
        </FramePanel>
        <FrameFooter className="strata-monitor-legend">
          <div>
            {(["Succeeded", "Failed", "Timed Out", "Skipped"] as const).map((status) => (
              <span key={status}>
                <i style={{ backgroundColor: statusColors[status] }} />
                {status === "Succeeded" ? "Up" : status === "Failed" ? "Down" : status}
              </span>
            ))}
          </div>
          <span>Bar height is check duration</span>
        </FrameFooter>
      </Frame>
      <StrataMonitorDetails
        model={model}
        monitorId={detailId}
        onSelect={(id) => {
          model.selectCheck(id);
          setDetailId(id);
        }}
        onClose={() => setDetailId(null)}
        returnFocus={detailsOpener}
        fallbackFocus={detailsFallback}
        onNavigate={onNavigate}
      />
    </div>
  );
}
