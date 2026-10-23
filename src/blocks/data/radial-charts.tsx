import { ReuiBudgetRings } from "./reui-free-chart-primitives";
import { useState } from "react";
import {
  Banknote,
  CreditCard,
  RefreshCw,
  SlidersHorizontal,
  Store,
  TrendingUp,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ChartFrame,
  ChartMore,
  ChartStage,
  ChangePill,
  PeriodButtons,
  UpdatedDot,
} from "./chart-chrome";
import { arcPath, money, polar } from "./chart-math";
function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-7 w-36 text-[13px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
const objectiveNames = ["Availability", "Latency", "Error rate", "Freshness"];
const ringColors = ["#7561eb", "#38a5e7", "#35b2a0", "#ed881e"];
function ErrorBudgets() {
  const [service, setService] = useState("Checkout API");
  const [period, setPeriod] = useState("28D");
  const [focus, setFocus] = useState<number | null>(null);
  const budgets = [40, 31, 24, 82].map((v) =>
    Math.max(
      0,
      Math.min(
        100,
        v +
          (service === "Auth Service" ? 18 : service === "Data Pipeline" ? -15 : 0) +
          (period === "7D" ? 8 : period === "90D" ? -6 : 0),
      ),
    ),
  );
  const healthy = budgets.filter((v) => v > 35).length;
  return (
    <ChartStage>
      <ChartFrame
        title="Error Budgets"
        description={`${service}, rolling ${period.slice(0, -1)} days`}
        width="max-w-[1024px]"
        toolbar={
          <>
            <Picker
              label="Service"
              value={service}
              onChange={setService}
              options={["Checkout API", "Auth Service", "Data Pipeline"]}
            />
            <PeriodButtons
              label="Window"
              value={period}
              onChange={setPeriod}
              options={["7D", "28D", "90D"]}
            />
            <ChartMore
              title="Error budgets"
              rows={objectiveNames.map((objective, i) => ({
                objective,
                service,
                budgetLeft: budgets[i],
                burn: [0.3, 1.4, 1.6, 0.1][i],
              }))}
            />
          </>
        }
        footer={
          <>
            <UpdatedDot>Updated 1 min ago · Burn over the last 24 hours</UpdatedDot>
            <span>Budget is 100% minus the target</span>
          </>
        }
      >
        <div className="grid md:grid-cols-[330px_1fr]">
          <div className="flex items-center justify-center border-b p-3 md:border-b-0 md:border-r">
            <ReuiBudgetRings
              label={`Error budget left, ${service}`}
              rows={objectiveNames.map((name, i) => ({
                name,
                value: budgets[i],
                color: ringColors[i],
              }))}
              focus={focus}
              onFocus={setFocus}
              healthy={healthy}
            />
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Objective", "Target", "Attained", "Budget left", "Burn", "Status"].map((s) => (
                    <TableHead key={s} className="text-[13px]">
                      {s}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {objectiveNames.map((n, i) => (
                  <TableRow
                    key={n}
                    className="h-12"
                    onPointerEnter={() => setFocus(i)}
                    onPointerLeave={() => setFocus(null)}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-0 text-[13px] font-normal"
                        aria-pressed={focus === i}
                        onClick={() => setFocus((f) => (f === i ? null : i))}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: ringColors[i] }}
                        />
                        {n}
                      </Button>
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {[99.9, 99, 99.5, 99][i]}%
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {[99.94, 99.31, 99.62, 99.82][i]}%
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-1 w-16 rounded bg-muted"
                          role="progressbar"
                          aria-label={`${n} budget left`}
                          aria-valuenow={budgets[i]}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full rounded"
                            style={{ width: `${budgets[i]}%`, background: ringColors[i] }}
                          />
                        </div>
                        <span className="text-[13px] font-medium">{budgets[i]}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {[0.3, 1.4, 1.6, 0.1][i]}x
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-1 text-[11px] font-normal",
                          budgets[i] > 35
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                            : "bg-amber-500/10 text-amber-800 dark:text-amber-300",
                        )}
                      >
                        {budgets[i] > 35 ? "Healthy" : "At risk"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20">
                  <TableCell colSpan={3} className="text-[13px]">
                    Overall <span className="ml-1 text-muted-foreground">4 objectives</span>
                  </TableCell>
                  <TableCell className="text-[13px]">
                    Lowest <strong>{Math.min(...budgets)}%</strong>
                  </TableCell>
                  <TableCell className="text-[13px]">
                    Peak <strong>1.6x</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="px-1 text-[11px]">
                      {healthy}/4 on track
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </ChartFrame>
    </ChartStage>
  );
}
function TickGauge({ value, watch = false }: { value: number; watch?: boolean }) {
  return (
    <svg
      viewBox="0 0 90 90"
      className="size-20 shrink-0"
      role="img"
      aria-label={`${value}% of limit used`}
    >
      {Array.from({ length: 32 }, (_, i) => {
        const a = polar(45, 45, 32, i * 11.25),
          b = polar(45, 45, 39, i * 11.25);
        return (
          <line
            key={i}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={
              i < Math.round((value / 100) * 32) ? (watch ? "#d3ac00" : "#42af88") : "var(--border)"
            }
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity={i < Math.round((value / 100) * 32) ? 1 : 0.6}
          />
        );
      })}
      <text x="45" y="50" textAnchor="middle" fill="currentColor" fontWeight="600" fontSize="15">
        {value}%
      </text>
    </svg>
  );
}
function ApiHealth() {
  const [region, setRegion] = useState("US East");
  const [period, setPeriod] = useState("24H");
  const [revision, setRevision] = useState(0);
  const panels = [
    {
      name: "Availability",
      value: "99.97",
      unit: "%",
      used: 30,
      change: -0.01,
      slo: "SLO 99.9% budget",
      facts: [
        ["Latest", "99.98%"],
        ["Lowest", "23:00 · 99.86%"],
        ["Below SLO", "1 h"],
      ],
    },
    {
      name: "p95 Latency",
      value: String(252 + revision * 3),
      unit: "ms",
      used: 84,
      change: 9,
      slo: "SLO 300 ms",
      facts: [
        ["Latest", "121 ms"],
        ["Peak", "22:00 · 286 ms"],
        ["Over SLO", "None"],
      ],
    },
    {
      name: "Error Rate",
      value: "0.33",
      unit: "%",
      used: 33,
      change: -7,
      slo: "SLO 1%",
      facts: [
        ["Latest", "0.27%"],
        ["Peak", "23:00 · 1.38%"],
        ["Over SLO", "1 h"],
      ],
    },
    {
      name: "Throughput",
      value: region === "US East" ? "4.1K" : "3.8K",
      unit: "req/s",
      used: 51,
      change: 6,
      slo: "Capacity 8K",
      facts: [
        ["Latest", "2.6K req/s"],
        ["Peak", "22:00 · 5.5K req/s"],
        ["Over Capacity", "None"],
      ],
    },
  ];
  return (
    <ChartStage>
      <ChartFrame
        title={
          <>
            API Health
            <Badge variant="outline" className="bg-amber-500/10 px-1 text-[11px] font-normal">
              1 to Watch
            </Badge>
          </>
        }
        description={`Production Gateway · Updated ${revision ? "just now" : "12:00 UTC"}`}
        width="max-w-[1024px]"
        toolbar={
          <>
            <Picker
              label="Region"
              value={region}
              onChange={setRegion}
              options={["US East", "US West", "EU Central", "Asia Pacific"]}
            />
            <PeriodButtons
              label="Window"
              value={period}
              onChange={setPeriod}
              options={["1H", "24H", "7D"]}
            />
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              aria-label="Refresh metrics"
              onClick={() => {
                setRevision((r) => r + 1);
                toast.success("Metrics refreshed");
              }}
            >
              <RefreshCw />
            </Button>
            <ChartMore
              title="API health"
              rows={panels.map((p) => ({ metric: p.name, value: p.value, region, window: period }))}
            />
          </>
        }
      >
        <div className="grid divide-y sm:grid-cols-2 md:grid-cols-4 md:divide-x md:divide-y-0">
          {panels.map((p, i) => (
            <div key={p.name} className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <h3>{p.name}</h3>
                {i === 1 && (
                  <Badge variant="outline" className="bg-amber-500/10 px-1 text-[11px] font-normal">
                    Watch
                  </Badge>
                )}
              </div>
              <div className="my-4 flex items-center gap-3">
                <TickGauge
                  value={p.used + (period === "1H" ? -4 : period === "7D" ? 3 : 0)}
                  watch={i === 1}
                />
                <div>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-2xl font-semibold tracking-tight">{p.value}</strong>
                    <span className="text-xs text-muted-foreground">{p.unit}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className={p.change > 0 && i === 1 ? "text-destructive" : ""}>
                      {p.change > 0 ? "↗" : "↘"} {Math.abs(p.change)}%
                    </span>{" "}
                    vs prior
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{p.slo}</p>
                </div>
              </div>
              <dl className="flex flex-col gap-2 border-t pt-4">
                {p.facts.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 text-xs">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className={v === "1 h" ? "text-destructive" : ""}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </ChartFrame>
    </ChartStage>
  );
}
function CashInflows() {
  const [period, setPeriod] = useState("This month");
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [prior, setPrior] = useState(true);
  const [transit, setTransit] = useState(true);
  const [pace, setPace] = useState(true);
  const [source, setSource] = useState<number | null>(null);
  const [cardHover, setCardHover] = useState<number | null>(null);
  const colors = ["#319a8b", "#7564e8", "#eaaa00", "#e46a82"];
  const inflows = [9400000, 5100000, 4600000, 553700];
  const names = ["Card payments", "Bank transfers", "Marketplace payouts", "Treasury yield"];
  const selected = source ?? cardHover;
  const total =
    (source === null ? 19653700 : inflows[source]) *
      (period === "Last month" ? 0.96 : period === "This quarter" ? 2.9 : 1) +
    revision * 28700;
  const progress = (total / 40000000) * 100;
  const icon = [CreditCard, Banknote, Store, TrendingUp];
  return (
    <ChartStage>
      <ChartFrame
        title="Cash Inflows"
        description={`${source === null ? "All sources" : names[source]}, ${period.toLowerCase()}`}
        toolbar={
          <>
            <Picker
              label="Period"
              value={period}
              onChange={setPeriod}
              options={["This month", "Last month", "This quarter"]}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  aria-label="Display options"
                >
                  <SlidersHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuCheckboxItem checked={prior} onCheckedChange={setPrior}>
                    Last month
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={transit} onCheckedChange={setTransit}>
                    In transit
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={pace} onCheckedChange={setPace}>
                    Pace marker
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              aria-label="Refresh inflows"
              onClick={() => {
                setRevision((r) => r + 1);
                toast.success("Cash inflows refreshed");
              }}
            >
              <RefreshCw />
            </Button>
            <ChartMore
              title="Cash inflows"
              rows={names.map((name, i) => ({ source: name, inflows: inflows[i] }))}
            />
          </>
        }
        footer={
          <>
            <UpdatedDot>Updated {revision ? "just now" : "2 min ago"} · 16 of 31 days</UpdatedDot>
            <span>Amounts in USD</span>
          </>
        }
      >
        <div className="grid md:grid-cols-[430px_1fr]">
          <div className="p-3">
            <div
              tabIndex={0}
              role="application"
              aria-label="Cash inflows day clock. Arrow keys move between days."
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.preventDefault();
                  setActiveDay((d) =>
                    Math.max(0, Math.min(30, (d ?? 15) + (e.key === "ArrowRight" ? 1 : -1))),
                  );
                } else if (e.key === "Escape") setActiveDay(null);
              }}
            >
              <svg
                viewBox="0 0 420 420"
                className="w-full"
                role="img"
                aria-label={`${money(total)} inflows against $40M target`}
              >
                <circle
                  cx="210"
                  cy="210"
                  r="180"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="1.5"
                />
                <circle cx="210" cy="210" r="88" fill="none" stroke="var(--border)" />
                {[1, 8, 15, 22, 29].map((d) => {
                  const p = polar(210, 210, 199, ((d - 1) / 31) * 360);
                  return (
                    <text
                      key={d}
                      x={p[0]}
                      y={p[1] + 3}
                      textAnchor="middle"
                      fill="var(--muted-foreground)"
                      fontSize="12"
                    >
                      {d}
                    </text>
                  );
                })}
                {Array.from({ length: 31 }, (_, d) => {
                  const a = (d / 31) * 360 + 5;
                  const base = polar(210, 210, 109, a);
                  const length = 20 + (Math.sin(d * 2.8) + 1) * 16;
                  const ghost = polar(210, 210, 109 + length + 7, a);
                  const segments = [length * 0.48, length * 0.26, length * 0.23, length * 0.03];
                  let radius = 109;
                  return (
                    <g
                      key={d}
                      onPointerEnter={() => setActiveDay(d)}
                      onPointerLeave={() => setActiveDay(null)}
                      style={{ cursor: "crosshair" }}
                      opacity={activeDay === null || activeDay === d ? 1 : 0.3}
                    >
                      {prior && (
                        <line
                          x1={base[0]}
                          y1={base[1]}
                          x2={ghost[0]}
                          y2={ghost[1]}
                          stroke="var(--border)"
                          strokeWidth="11"
                          strokeLinecap="round"
                          opacity=".55"
                        />
                      )}
                      {d < 16 ? (
                        segments.map((l, i) => {
                          const start = polar(210, 210, radius, a);
                          radius += l;
                          const end = polar(210, 210, radius, a);
                          return (
                            <line
                              key={i}
                              x1={start[0]}
                              y1={start[1]}
                              x2={end[0]}
                              y2={end[1]}
                              stroke={
                                selected === null || selected === i ? colors[i] : "var(--border)"
                              }
                              strokeWidth="11"
                              strokeLinecap="round"
                            />
                          );
                        })
                      ) : (
                        <line
                          x1={base[0]}
                          y1={base[1]}
                          x2={ghost[0]}
                          y2={ghost[1]}
                          stroke="var(--border)"
                          strokeWidth="11"
                          strokeLinecap="round"
                          opacity=".25"
                        />
                      )}
                      {transit && d < 16 && d % 4 === 1 && (
                        <circle cx={ghost[0]} cy={ghost[1]} r="5.5" fill="var(--border)" />
                      )}
                    </g>
                  );
                })}
                {[0.48, 0.26, 0.23, 0.03].map((share, i) => {
                  const start = [0, 0.48, 0.74, 0.97][i] * Math.min(360, progress * 3.6);
                  return (
                    <path
                      key={i}
                      d={arcPath(
                        210,
                        210,
                        180,
                        start + 2,
                        start + share * Math.min(360, progress * 3.6) - 1,
                      )}
                      fill="none"
                      stroke={colors[i]}
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  );
                })}
                {pace &&
                  (() => {
                    const p = polar(210, 210, 180, 181);
                    return (
                      <circle
                        cx={p[0]}
                        cy={p[1]}
                        r="5.5"
                        fill="var(--background)"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    );
                  })()}
                <text
                  x="210"
                  y="172"
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize="12"
                >
                  {activeDay === null ? "Inflows" : `Day ${activeDay + 1}`}
                </text>
                <text
                  x="210"
                  y="210"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="31"
                  fontWeight="600"
                >
                  {activeDay === null
                    ? money(total)
                    : money(730000 + (Math.sin(activeDay * 2.8) + 1) * 340000)}
                </text>
                <text
                  x="210"
                  y="233"
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize="12"
                >
                  {Math.round(progress)}% of $40M
                </text>
                <rect
                  x="169"
                  y="250"
                  width="82"
                  height="20"
                  rx="4"
                  fill="#eaaa00"
                  fillOpacity=".12"
                />
                <text x="210" y="264" textAnchor="middle" fill="var(--foreground)" fontSize="11">
                  Behind pace
                </text>
              </svg>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-3 pb-3 text-xs text-muted-foreground">
              <span>━ Settled $18M</span>
              {transit && <span>━ In transit $1.7M</span>}
              {pace && <span>○ Pace $20.1M, −$479.9K</span>}
              {prior && <span>╵ Last month</span>}
            </div>
          </div>
          <div className="p-4">
            <dl className="mb-7 grid grid-cols-3 divide-x">
              {[
                ["Forecast", "$39M", "98% of target"],
                ["Per Day Needed", "$1.32M", "$1.26M so far"],
                ["In Transit", transit ? "$1.7M" : "$0", "Within 3 days"],
              ].map(([k, v, d]) => (
                <div key={k} className="px-3 first:pl-0">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-2 text-xl font-semibold">{v}</dd>
                  <dd className="mt-2 text-xs text-muted-foreground">{d}</dd>
                </div>
              ))}
            </dl>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Source</span>
              <span>Inflows vs last month</span>
            </div>
            {names.map((n, i) => {
              const I = icon[i];
              return (
                <Button
                  key={n}
                  variant="ghost"
                  className={cn(
                    "h-[74px] w-full justify-start rounded-none border-b px-0 font-normal",
                    source === i ? "bg-muted/50" : "",
                  )}
                  onClick={() => setSource((s) => (s === i ? null : i))}
                  onPointerEnter={() => setCardHover(i)}
                  onPointerLeave={() => setCardHover(null)}
                >
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/20"
                    style={{ color: colors[i] }}
                  >
                    <I />
                  </span>
                  <span className="flex flex-1 flex-col gap-2 text-left">
                    <span className="text-[13px]">{n}</span>
                    <span className="text-xs text-muted-foreground">
                      {[48, 26, 23, 3][i]}% ·{" "}
                      {i < 3
                        ? `${money([379100, 601400, 675300][i])} in transit`
                        : "1st business day"}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-medium">{money(inflows[i])}</span>
                    <ChangePill value={[-1.4, -5.6, 5.1, -3.2][i]} />
                  </span>
                </Button>
              );
            })}
            <div className="mt-3 flex justify-between text-[13px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-0 text-[13px]"
                onClick={() => setSource(null)}
              >
                All sources
              </Button>
              <span className="flex items-center gap-3 font-medium">
                {money(total)}
                <ChangePill value={-1.1} />
              </span>
            </div>
          </div>
        </div>
      </ChartFrame>
    </ChartStage>
  );
}
export default function RadialChartBlock({ block }: BlockProps) {
  return block.id === "chart-7" ? (
    <ErrorBudgets />
  ) : block.id === "chart-8" ? (
    <ApiHealth />
  ) : (
    <CashInflows />
  );
}
