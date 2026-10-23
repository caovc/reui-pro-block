import { useState } from "react";
import {
  Activity,
  BellOff,
  CircleCheck,
  FileText,
  Link2,
  MoreHorizontal,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ChartFrame,
  ChartMore,
  ChartStage,
  ChangePill,
  PeriodButtons,
  UpdatedDot,
} from "./chart-chrome";
import {
  BarChoiceMenu,
  BarFilterMenu,
  BarIconButton,
  BarLegend,
  BarPicker,
  BarStats,
  ToneBadge,
} from "./bar-primitives";
import { barColors, clockHour, duration } from "./bar-chart-utils";
import { HourColumns, type HourColumn } from "./bar-hour-columns";
import { BurnPlot, BurnWindowMeter } from "./bar-burn-plots";
function MuteBurn({
  muted,
  onChange,
  title,
}: {
  muted: boolean;
  onChange: (v: boolean) => void;
  title: string;
}) {
  return muted ? (
    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onChange(false)}>
      <BellOff />
      Unmute
    </Button>
  ) : (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <BellOff />
          Mute
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mute Alerts?</AlertDialogTitle>
          <AlertDialogDescription>
            {title} stops paging and ticketing #sre-oncall until you unmute it. This changes the
            local demo only.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onChange(true)}>Mute</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
const sloNames = [
  "Ledger write success",
  "Webhook delivery success",
  "Index freshness",
  "Payout batch on time",
  "Fraud score latency",
  "Charge API availability",
  "Charge API latency",
  "Ledger posting freshness",
  "Search query latency",
  "Webhook delivery latency",
  "Push delivery latency",
  "Payout API availability",
  "Recon report freshness",
  "Email send success",
  "Refund API availability",
  "Fraud model availability",
];
export function BudgetBurn() {
  const [slo, setSlo] = useState(sloNames[0]),
    [muted, setMuted] = useState(false),
    [frozen, setFrozen] = useState(true),
    [forecast, setForecast] = useState(true),
    [even, setEven] = useState(true),
    [day, setDay] = useState(28),
    [range, setRange] = useState<[number, number] | null>(null),
    [drag, setDrag] = useState<number | null>(null),
    [incident, setIncident] = useState(false);
  const index = sloNames.indexOf(slo),
    healthy = index >= 4;
  const remaining = Array.from({ length: forecast ? 36 : 29 }, (_, i) =>
    healthy
      ? 100 - i * 1.25
      : index === 0
        ? i < 20
          ? 100 - i * 1.1
          : i < 25
            ? 4 - (i - 20) * 1.15
            : i === 25
              ? -38
              : i === 26
                ? -39
                : i === 27
                  ? -41
                  : i === 28
                    ? -42
                    : -42 - (i - 28) * 6
        : i < 20
          ? 100 - i * 1.7
          : 66 - (i - 20) * 5,
  );
  const pick = (i: number, extend = false) => {
    setDay(i);
    if (extend) setRange([range?.[0] ?? day, i]);
  };
  const selected = range ? [Math.min(...range), Math.max(...range)] : null;
  return (
    <ChartStage>
      <ChartFrame
        title={
          <>
            <Activity className="size-4" />
            Error Budget
            <ToneBadge tone={healthy ? "green" : index === 0 ? "red" : "yellow"}>
              {healthy ? "Healthy" : index === 0 ? "Exhausted" : "At Risk"}
            </ToneBadge>
            {frozen && <ToneBadge tone="muted">Deploys Frozen</ToneBadge>}
          </>
        }
        description={`${healthy ? "99.9%" : "99.99%"} over 30 days`}
        width="max-w-[1152px]"
        toolbar={
          <>
            <BarPicker
              label="SLO"
              value={slo}
              onChange={(v) => {
                setSlo(v);
                setRange(null);
              }}
              options={sloNames}
            />
            <MuteBurn muted={muted} onChange={setMuted} title={slo} />
            <ChartMore
              title="Error budget burn"
              rows={remaining.map((v, i) => ({
                day: i + 1,
                remainingPercent: v,
                forecast: i > 28,
                slo,
              }))}
            >
              <DropdownMenuCheckboxItem checked={frozen} onCheckedChange={setFrozen}>
                Freeze deploys
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={forecast}
                onCheckedChange={(v) => {
                  setForecast(v);
                  setDay((d) => Math.min(d, 28));
                  setRange(null);
                }}
              >
                Forecast
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={even} onCheckedChange={setEven}>
                Even burn
              </DropdownMenuCheckboxItem>
              <DropdownMenuItem
                onSelect={() => {
                  setIncident(true);
                  toast.success("Demo incident declared");
                }}
              >
                Declare incident
              </DropdownMenuItem>
            </ChartMore>
          </>
        }
        footer={
          <>
            <span>
              − Even burn　○ Forecast　<span style={{ color: barColors.red }}>◯ Incident</span>
            </span>
            <span>Drag across days to sum spend</span>
          </>
        }
      >
        <BarStats
          className="[&>div:first-child]:col-span-2 md:[&>div:first-child]:col-span-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] [&>div]:py-3"
          items={[
            {
              label: "Budget",
              value: (
                <span style={{ color: healthy ? undefined : barColors.red }}>
                  {Math.abs(Math.round(remaining[28]))}%{" "}
                  <span className="text-sm font-normal">{remaining[28] < 0 ? "over" : "left"}</span>
                </span>
              ),
              detail: healthy
                ? "Tracking within the monthly budget"
                : "Two incidents spent 112% in six days.",
            },
            {
              label: "Attained",
              value: healthy ? "99.972%" : "99.986%",
              detail: `Target ${healthy ? "99.9%" : "99.99%"}`,
            },
            { label: "Burn 1h", value: "0.26×", detail: "0.32× over 6h" },
            { label: "Daily pace", value: healthy ? "1.3%" : "6.5%", detail: "Even pace 3.3%" },
            {
              label: healthy ? "Forecast" : "Ran out",
              value: healthy ? "Oct 6" : "Sep 25",
              detail: muted ? "Alerts muted" : "4 days ago",
            },
          ]}
        />
        <div
          role="application"
          aria-label="Daily error budget. Arrow keys move, Enter selects a day, Shift+Enter extends, Escape clears."
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              pick(
                Math.max(
                  0,
                  Math.min(remaining.length - 1, day + (e.key === "ArrowRight" ? 1 : -1)),
                ),
              );
            } else if (e.key === "Enter") {
              e.preventDefault();
              setRange(e.shiftKey ? [range?.[0] ?? day, day] : [day, day]);
            } else if (e.key === "Escape") setRange(null);
          }}
          className="px-3 pt-6"
        >
          <BurnPlot
            values={remaining}
            mode="budget"
            active={day}
            onActive={setDay}
            selected={selected}
            even={even}
            label={`${slo} daily budget remaining`}
            onDragStart={(i) => {
              setDrag(i);
              setRange([i, i]);
            }}
            onDragMove={(i) => {
              if (drag !== null) setRange([drag, i]);
            }}
            onDragEnd={() => setDrag(null)}
          />
          {selected && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
            >
              <span>
                Days {selected[0] + 1}–{selected[1] + 1} ·{" "}
                {Math.abs(remaining[Math.max(0, selected[0] - 1)] - remaining[selected[1]]).toFixed(
                  1,
                )}
                % budget spent
              </span>
              <Button variant="ghost" size="sm" onClick={() => setRange(null)}>
                Clear selection
              </Button>
            </div>
          )}
          {incident && (
            <p role="status" className="pb-3 text-xs text-muted-foreground">
              INC-2210 declared · Demo incident timeline updated
            </p>
          )}
        </div>
      </ChartFrame>
    </ChartStage>
  );
}
export function SloBurnRate() {
  const [range, setRange] = useState("72h"),
    [muted, setMuted] = useState(false),
    [hour, setHour] = useState(71);
  const count = range === "72h" ? 72 : 24;
  const rates = Array.from({ length: 72 }, (_, i) =>
    i === 71
      ? 18
      : i === 17
        ? 4.4
        : i === 18
          ? 1.7
          : i >= 35 && i <= 38
            ? 1.8 + (i % 2) * 0.2
            : i === 53
              ? 3.1
              : i === 54
                ? 0.98
                : 0.16 + (Math.sin(i * 1.7) + 1) * 0.14,
  ).slice(72 - count);
  const active = Math.min(hour, count - 1);
  return (
    <ChartStage>
      <ChartFrame
        title={
          <>
            <Activity className="size-4" />
            Webhook delivery success
            <ToneBadge tone={muted ? "muted" : "red"}>{muted ? "Muted" : "Paging"}</ToneBadge>
          </>
        }
        description="99.9% target over 28 days"
        width="max-w-[1152px]"
        toolbar={
          <>
            <PeriodButtons
              label="Chart range"
              value={range}
              onChange={(v) => {
                setRange(v);
                setHour(v === "72h" ? 71 : 23);
              }}
              options={["24h", "72h"]}
            />
            <MuteBurn title="Webhook delivery success" muted={muted} onChange={setMuted} />
            <ChartMore
              title="SLO burn rate"
              rows={rates.map((v, i) => ({ hour: i + 1, burnRate: v }))}
            />
          </>
        }
        footer={
          <>
            <span>
              <span style={{ color: barColors.red }}>● Over page</span>　
              <span style={{ color: barColors.yellow }}>● Over pace</span>　● Under pace　┄ Page
              line
            </span>
            <span>Sep 29, 14:20 · INC-2209 Webhook retry storm · 2.7% of budget</span>
          </>
        }
      >
        <div className="grid divide-y border-b md:grid-cols-[1fr_1.5fr_2fr] md:divide-x md:divide-y-0">
          <div className="flex flex-col justify-between gap-6 p-4">
            <div>
              <h3 className="text-xs text-muted-foreground">Last Hour</h3>
              <p
                className="mt-3 text-4xl font-semibold tracking-tight"
                style={{ color: barColors.red }}
              >
                18×
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Over the page line this hour.</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 border-t pt-3 text-xs">
              <div>
                <dt className="text-muted-foreground">Budget left</dt>
                <dd className="mt-1 font-medium">74%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Runs out in</dt>
                <dd className="mt-1 font-medium">1d 2h</dd>
              </div>
            </dl>
          </div>
          <div className="p-4">
            <div className="mb-4 flex justify-between gap-2 text-xs text-muted-foreground">
              <h3>Windows</h3>
              <span>Log scale, 0.1× to 100×</span>
            </div>
            <div className="flex flex-col gap-4">
              {[
                ["5m", 29],
                ["30m", 25],
                ["1h", 18],
                ["6h", 3.4],
                ["3d", 0.7],
              ].map(([name, value]) => (
                <div key={name} className="flex items-center gap-3 text-xs">
                  <span className="w-6 text-muted-foreground">{name}</span>
                  <BurnWindowMeter label={String(name)} value={Number(value)} />
                  <span className="w-10 text-right font-medium">
                    {Number(value) < 1 ? Number(value).toFixed(2) : value}×
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3 flex justify-between text-xs text-muted-foreground">
              <h3>Alert Rules</h3>
              <span>Notifies #sre-oncall</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                ["Fast Burn", "Pages when 1h and 5m pass 14.4×", "spends 2.1% in 1h"],
                ["Medium Burn", "Pages when 6h and 30m pass 6×", "spends 5.4% in 6h"],
                ["Slow Burn", "Tickets when 3d and 6h pass 1×", "spends 11% in 3d"],
              ].map(([name, desc, detail], i) => (
                <div key={name} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{name}</p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {desc}
                      <span className="hidden xl:inline"> · {detail}</span>
                    </p>
                  </div>
                  <span className="ml-auto shrink-0">
                    <ToneBadge tone={muted ? "muted" : i === 0 ? "red" : "green"}>
                      {muted ? "Muted" : i === 0 ? "Firing" : "Clear"}
                    </ToneBadge>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-2 p-4 text-xs">
          <h3>Hourly Burn</h3>
          <span className="text-muted-foreground">
            Last {range === "72h" ? 72 : 24} hours · 1 hour over the page line
          </span>
        </div>
        <div
          role="application"
          tabIndex={0}
          aria-label="Hourly burn rate. Arrow keys move by hour."
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              setHour(
                (v) => (Math.min(v, count - 1) + (e.key === "ArrowRight" ? 1 : count - 1)) % count,
              );
            }
          }}
          className="px-3"
        >
          <BurnPlot
            values={rates}
            mode="rate"
            active={active}
            onActive={setHour}
            label={`Log scale burn rates for the last ${count} hours`}
          />
        </div>
      </ChartFrame>
    </ChartStage>
  );
}
const syncSources = ["PostgreSQL", "Google Drive", "Stripe", "Salesforce"];
const syncRuns = [
  34, 34, 34, 35, 30, 30, 30, 30, 30, 31, 30, 31, 30, 30, 30, 31, 30, 30, 30, 30, 30, 31, 30, 16,
];
const syncedRows = [
  231700, 238400, 227000, 1400000, 200700, 205700, 240100, 188100, 224100, 1100000, 209300, 226300,
  223300, 205200, 206300, 770700, 224700, 214700, 205700, 210000, 204300, 760400, 135300, 68900,
];
export function SyncActivity() {
  const [metric, setMetric] = useState("Runs"),
    [sources, setSources] = useState(syncSources),
    [revision, setRevision] = useState(0);
  const factor = sources.length / 4;
  const data: HourColumn[] = syncRuns.map((v, i) => {
    const failed = i === 7 ? 1 : i === 22 ? 4 : i === 23 ? 2 : 0,
      slow = i === 11 ? 3 : i === 17 ? 2 : i === 22 ? 1 : 0;
    return {
      label: clockHour(i),
      segments:
        metric === "Runs"
          ? [v - failed - slow, slow, failed].map((n) => Math.round(n * factor) + revision)
          : [Math.round(syncedRows[i] * factor) + revision * 320, 0, 0],
      note: failed
        ? "risk-feature-store · Failed · PostgreSQL"
        : slow
          ? "bank-settlement-files · Slow · Google Drive"
          : `${sources.join(", ") || "No sources"} · Succeeded`,
    };
  });
  return (
    <ChartStage>
      <ChartFrame
        title="Sync Activity"
        description="Harbor Ops connections, last 24 hours"
        width="max-w-[768px]"
        toolbar={
          <>
            <PeriodButtons
              label="Columns measure"
              value={metric}
              onChange={setMetric}
              options={["Runs", "Rows"]}
            />
            <BarFilterMenu
              label="Sources"
              names={syncSources}
              selected={sources}
              onChange={setSources}
            />
            <BarIconButton label="Refresh runs" onClick={() => setRevision((r) => r + 1)} />
            <ChartMore
              title="Data sync activity"
              rows={data.map((d) => ({
                hour: d.label,
                measure: metric,
                value: d.segments.reduce((s, n) => s + n, 0),
                sources: sources.join(";"),
              }))}
            />
          </>
        }
        footer={
          <>
            <UpdatedDot>
              Synced {revision ? "just now" : "2 min ago"} · {Math.round(12 * factor)} of 13
              connections active
            </UpdatedDot>
            <span>Times in UTC</span>
          </>
        }
      >
        <BarStats
          items={[
            {
              label: "Runs",
              value: Math.round(727 * factor) + revision * 24,
              detail: "31 an hour on average",
            },
            {
              label: "Landed",
              value: sources.length ? "99.0%" : "0%",
              detail: `${Math.round(720 * factor)} of ${Math.round(727 * factor)}, 6 slow`,
            },
            {
              label: "Failed",
              value: Math.round(7 * factor),
              detail: sources.length ? "risk-feature-store +1" : "No sources selected",
            },
            {
              label: "Rows Synced",
              value: `${(8.1 * factor).toFixed(1)}M`,
              detail: "Peak 1.4M at 18:00",
            },
          ]}
        />
        <div className="flex justify-end">
          <BarLegend
            items={
              metric === "Rows"
                ? [{ name: "Rows synced", color: barColors.green }]
                : [
                    { name: "Succeeded", color: barColors.green },
                    { name: "Slow", color: barColors.yellow },
                    { name: "Failed", color: barColors.red },
                  ]
            }
          />
        </div>
        <HourColumns
          label={`${metric === "Rows" ? "Rows synced" : "Runs"} per hour by outcome. Arrow keys move between hours.`}
          data={data}
          colors={[barColors.green, barColors.yellow, barColors.red]}
          seriesNames={
            metric === "Rows" ? ["Rows synced", "Slow", "Failed"] : ["Succeeded", "Slow", "Failed"]
          }
          max={metric === "Rows" ? 1500000 : 40}
          tickValues={metric === "Rows" ? [0, 500000, 1000000, 1500000] : [0, 10, 20, 30, 40]}
          format={(v) =>
            metric === "Rows"
              ? v >= 1000000
                ? `${+(v / 1e6).toFixed(1)}M`
                : v >= 1000
                  ? `${Math.round(v / 1000)}K`
                  : "0"
              : String(Math.round(v))
          }
          ghost
        />
      </ChartFrame>
    </ChartStage>
  );
}
type SyncRun = {
  id: string;
  status: "Succeeded" | "Partial" | "Failed";
  kind: string;
  ago: string;
  rows: number;
  seconds: number;
  error?: string;
};
const initialHistory: SyncRun[] = [
  {
    id: "RUN-48303",
    status: "Succeeded",
    kind: "Scheduled",
    ago: "2m ago",
    rows: 2886,
    seconds: 47,
  },
  {
    id: "RUN-48302",
    status: "Succeeded",
    kind: "Scheduled",
    ago: "17m ago",
    rows: 3745,
    seconds: 55,
  },
  { id: "RUN-48301", status: "Succeeded", kind: "Manual", ago: "24m ago", rows: 1210, seconds: 27 },
  {
    id: "RUN-48300",
    status: "Partial",
    kind: "Scheduled",
    ago: "32m ago",
    rows: 1788,
    seconds: 76,
    error: "W_RATE_LIMIT HTTP 429, 3 files deferred",
  },
  {
    id: "RUN-48299",
    status: "Succeeded",
    kind: "Scheduled",
    ago: "47m ago",
    rows: 3309,
    seconds: 49,
  },
  {
    id: "RUN-48297",
    status: "Failed",
    kind: "Scheduled",
    ago: "1h ago",
    rows: 0,
    seconds: 120,
    error: "E_LIST_TIMEOUT Folder listing timed out after 120s",
  },
  {
    id: "RUN-48278",
    status: "Partial",
    kind: "Scheduled",
    ago: "5h ago",
    rows: 1484,
    seconds: 70,
    error: "W_RATE_LIMIT HTTP 429, 3 files deferred",
  },
  {
    id: "RUN-48277",
    status: "Partial",
    kind: "Scheduled",
    ago: "6h ago",
    rows: 1823,
    seconds: 77,
    error: "W_RATE_LIMIT HTTP 429, 3 files deferred",
  },
  {
    id: "RUN-48237",
    status: "Failed",
    kind: "Scheduled",
    ago: "17h ago",
    rows: 0,
    seconds: 7,
    error: "E_SCHEMA_HEADER Header row missing in BARC_2100.csv",
  },
];
export function SyncHistory() {
  const [metric, setMetric] = useState("Rows"),
    [filter, setFilter] = useState("All"),
    [compare, setCompare] = useState("No Comparison"),
    [paused, setPaused] = useState(false),
    [history, setHistory] = useState(initialHistory),
    [opened, setOpened] = useState<SyncRun | null>(null);
  const startRun = (retried?: SyncRun) => {
    const run: SyncRun = {
      id: `RUN-${48304 + history.length - initialHistory.length}`,
      status: "Succeeded",
      kind: retried ? "Retry" : "Manual",
      ago: "Just now",
      rows: 3120,
      seconds: 43,
    };
    setHistory((v) => [run, ...v]);
    toast.success(retried ? `${retried.id} retried successfully` : "Manual sync completed");
  };
  const extra = history.length - initialHistory.length;
  const rowSeed = Array.from({ length: 24 }, (_, i) =>
    i === 10 ? 0 : [6, 22].includes(i) ? 180 : Math.round(6000 + (Math.sin(i * 1.6) + 1) * 4000),
  );
  const seedTotal = rowSeed.reduce((sum, n) => sum + n, 0);
  const scaled = rowSeed.map((n) => Math.round((n / seedTotal) * 189100));
  scaled[23] += 189100 - scaled.reduce((sum, n) => sum + n, 0) + extra * 3120;
  const data = Array.from({ length: 24 }, (_, i) => {
    const failed = [6, 22].includes(i),
      partial = [11, 19].includes(i),
      isPaused = i === 10;
    const n = metric === "Rows" ? scaled[i] : 4 + (i === 23 ? extra : 0);
    const failedCount = i === 22 ? 2 : 1;
    return {
      label: clockHour(i),
      segments: isPaused
        ? [0, 0, 0, 0]
        : failed
          ? metric === "Rows"
            ? [0, 0, n, 0]
            : [n - failedCount, 0, failedCount, 0]
          : partial
            ? [n * 0.7, n * 0.3, 0, 0]
            : [n, 0, 0, 0],
      note: isPaused
        ? "Paused"
        : failed
          ? "Failed · E_LIST_TIMEOUT"
          : partial
            ? "Partial · W_RATE_LIMIT"
            : "Succeeded",
    };
  });
  const visible = history.filter((r) => filter === "All" || r.status !== "Succeeded").slice(0, 5);
  return (
    <ChartStage>
      <ChartFrame
        title={
          <>
            <Link2 className="size-4" />
            bank-settlement-files
            <ToneBadge tone={paused ? "yellow" : "green"}>
              {paused ? "Paused" : "Healthy"}
            </ToneBadge>
          </>
        }
        description="Google Drive API v3 · Production"
        width="max-w-[768px]"
        toolbar={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={paused}
              onClick={() => startRun()}
            >
              <RefreshCw />
              Sync Now
            </Button>
            <ChartMore title="Sync run history" rows={history.map((r) => ({ ...r }))}>
              <DropdownMenuCheckboxItem checked={paused} onCheckedChange={setPaused}>
                Pause connection
              </DropdownMenuCheckboxItem>
            </ChartMore>
          </>
        }
      >
        <div className="grid gap-6 p-4 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
            <p className="mt-4 flex items-center gap-2">
              <strong className="text-2xl font-semibold">
                {(((89 + extra) / (92 + extra)) * 100).toFixed(1)}%
              </strong>
              <ChangePill value={2.2} unit=" pts" />
              <span className="text-xs text-muted-foreground">vs prior 24h</span>
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {89 + extra} of {92 + extra} runs in 24h completed
            </p>
          </div>
          <dl className="flex flex-col gap-2 text-xs">
            {[
              ["Rows Synced", `${((189100 + extra * 3120) / 1000).toFixed(1)}K`],
              ["p50 Duration", "33s"],
              ["Freshness", history[0].ago === "Just now" ? "Just now" : "1m within 30m SLO"],
              ["Next Sync", paused ? "Paused" : "14:32 in 12m"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-2 px-4 pb-3">
          <h3 className="text-sm font-medium">Last 24 Hours</h3>
          <div className="flex gap-2">
            <PeriodButtons
              label="Plotted metric"
              value={metric}
              onChange={setMetric}
              options={["Rows", "Runs"]}
            />
            <BarChoiceMenu
              label="Compare against"
              value={compare}
              onChange={setCompare}
              options={["No Comparison", "Prior 24 Hours"]}
            />
          </div>
        </div>
        <HourColumns
          label={`Hourly ${metric.toLowerCase()} for bank-settlement-files. Arrow keys move between hours.`}
          data={data}
          colors={[barColors.green, barColors.yellow, barColors.red, "var(--muted-foreground)"]}
          seriesNames={["Succeeded", "Partial", "Failed", "Paused"]}
          max={metric === "Rows" ? 16000 : 4}
          tickValues={metric === "Rows" ? [0, 4000, 8000, 12000, 16000] : [0, 1, 2, 3, 4]}
          format={(v) => (metric === "Rows" ? `${Math.round(v / 1000)}K` : String(Math.round(v)))}
          ghost
          pattern
          underlay={
            compare === "Prior 24 Hours" ? (
              <path
                d="M52 240L90 200 130 140 170 160 210 180 250 220 290 210 330 200 370 230 410 250 450 220 490 180 530 210 570 250 610 220 650 180 690 170 730 120 770 90 810 80 850 140 890 200 930 210 976 240"
                stroke="var(--muted-foreground)"
                strokeDasharray="3 4"
                fill="none"
                opacity=".5"
              />
            ) : undefined
          }
        />
        <BarLegend
          items={[
            { name: "Succeeded", color: barColors.green },
            { name: "Partial", color: barColors.yellow },
            { name: "Failed", color: barColors.red },
            { name: "Paused", color: "var(--muted-foreground)" },
          ]}
        />
        <div className="border-t p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent Runs</h3>
            <PeriodButtons
              label="Runs shown"
              value={filter}
              onChange={setFilter}
              options={["All", "Issues"]}
            />
          </div>
          <ul>
            {visible.map((run) => (
              <li key={run.id} className="border-b py-3 last:border-0">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    style={{
                      color:
                        run.status === "Failed"
                          ? barColors.red
                          : run.status === "Partial"
                            ? barColors.yellow
                            : barColors.green,
                    }}
                  >
                    {run.status === "Succeeded" ? (
                      <CircleCheck className="size-3.5" />
                    ) : (
                      <TriangleAlert className="size-3.5" />
                    )}
                  </span>
                  <button className="font-medium hover:underline" onClick={() => setOpened(run)}>
                    {run.id}
                  </button>
                  <span className="text-muted-foreground">
                    {run.kind} · {run.ago}
                  </span>
                  <span className="ml-auto hidden text-muted-foreground sm:block">
                    {run.status === "Failed"
                      ? "Failed after"
                      : `${run.rows.toLocaleString()} rows in`}{" "}
                    {duration(run.seconds)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        aria-label={`Actions for ${run.id}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => setOpened(run)}>
                          <FileText />
                          View log
                        </DropdownMenuItem>
                        {run.status !== "Succeeded" && (
                          <DropdownMenuItem onSelect={() => startRun(run)}>
                            <RefreshCw />
                            Retry run
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {run.error && (
                  <p className="mt-2 pl-5 font-mono text-[11px] text-muted-foreground">
                    {run.error}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
        <Sheet open={!!opened} onOpenChange={(v) => !v && setOpened(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{opened?.id}</SheetTitle>
              <SheetDescription>bank-settlement-files · {opened?.status}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4">
              <p className="text-sm">
                {opened?.rows.toLocaleString()} rows · {duration(opened?.seconds ?? 0)}
              </p>
              <pre className="whitespace-pre-wrap rounded border bg-muted p-3 text-xs">
                {opened?.error ??
                  "Connection established\n3 files read\nRows committed successfully"}
              </pre>
              {opened?.status !== "Succeeded" && (
                <Button
                  onClick={() => {
                    if (opened) startRun(opened);
                    setOpened(null);
                  }}
                >
                  Retry run
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </ChartFrame>
    </ChartStage>
  );
}
