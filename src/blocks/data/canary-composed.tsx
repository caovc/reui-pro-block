import { useEffect, useState } from "react";
import { ReferenceLine } from "recharts";
import { Activity, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/reui/badge";
import { ChartStage, PeriodButtons, UpdatedDot, ChartMore } from "./chart-chrome";
import { ReuiTrend, type TrendSeries } from "./trend-foundation";
import { TrendLayers, TrendStats, TrendTitle, TrendSplitFrame } from "./trend-controls";
import { sum, trendColors as c } from "./trend-data";

const measured = [78, 80, 82, 96, 102, 113, 128, 145, 154, 168, 181, 194, 210];
const baseline = [74, 72, 76, 73, 75, 74, 76, 73, 72, 75, 74, 74, 73];
const percentiles = {
  p50: { baselineRatio: 0.6, regressionSlope: 0.55, limit: 80 },
  p95: { baselineRatio: 1, regressionSlope: 1, limit: 120 },
  p99: { baselineRatio: 1.48, regressionSlope: 1.7, limit: 160 },
};
export default function CanaryRollback() {
  const [percentile, setPercentile] = useState("p95"),
    [cursor, setCursor] = useState(13),
    [playing, setPlaying] = useState(false),
    [layers, setLayers] = useState({
      Baseline: true,
      Regression: true,
      "Over limit": true,
      "Rollout track": true,
    });
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setCursor((value) => {
          if (value >= 13) {
            setPlaying(false);
            return 13;
          }
          return value + 1;
        }),
      220,
    );
    return () => clearInterval(timer);
  }, [playing]);
  const settings = percentiles[percentile as keyof typeof percentiles];
  const all = measured.map((value, i) => {
    const total = Math.round(
        baseline[i] * settings.baselineRatio + (value - baseline[i]) * settings.regressionSlope,
      ),
      base = Math.round(baseline[i] * settings.baselineRatio),
      under = Math.max(0, Math.min(total, settings.limit) - base),
      over = Math.max(0, total - settings.limit);
    return {
      name: `${Math.floor(i / 6)}:${String((i % 6) * 10).padStart(2, "0")}`,
      base,
      under,
      over,
      total,
      limit: settings.limit,
      seconds: i * 10,
    };
  });
  const rows = all.map((row, i) => ({
    ...row,
    base: i < cursor && layers.Baseline ? row.base : null,
    under: i < cursor && layers.Regression ? row.under : null,
    over: i < cursor && layers["Over limit"] ? row.over : null,
  }));
  const peak = Math.max(...all.map((r) => r.total)),
    meanBaseline = Math.round(sum(all.map((r) => r.base)) / all.length),
    breaches = all.filter((r) => r.total > settings.limit),
    firstBreach = breaches[0],
    series: TrendSeries[] = [
      {
        key: "base",
        label: "Baseline",
        color: "#c0c3ca",
        kind: "bar",
        stack: "latency",
        width: 28,
      },
      {
        key: "under",
        label: "Regression",
        color: c.blue,
        kind: "bar",
        stack: "latency",
        width: 28,
      },
      { key: "over", label: "Over limit", color: c.pink, kind: "bar", stack: "latency", width: 28 },
    ];
  return (
    <ChartStage>
      <TrendSplitFrame
        width="max-w-[768px]"
        title={
          <>
            <TrendTitle icon={<Activity />} title="Canary Latency" />
            <Badge variant="destructive-light" className="text-xs">
              Rolled back
            </Badge>
          </>
        }
        description="search-indexer · v2.3.2 vs v2.3.1"
        toolbar={
          <>
            <PeriodButtons
              label="Percentile"
              value={percentile}
              onChange={setPercentile}
              options={["p50", "p95", "p99"]}
            />
            <TrendLayers
              label={`Layers ${Object.values(layers).filter(Boolean).length}/4`}
              layers={layers}
              onChange={(name, value) => setLayers((s) => ({ ...s, [name]: value }))}
            />
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              aria-label={playing ? "Pause replay" : "Replay rollout"}
              onClick={() => {
                if (playing) setPlaying(false);
                else {
                  if (cursor >= 13) setCursor(1);
                  setPlaying(true);
                }
              }}
            >
              {playing ? <Pause /> : <RotateCcw />}
            </Button>
            <ChartMore title="canary-latency" rows={all} />
          </>
        }
        footer={
          <>
            <UpdatedDot>DEP-4116 · prod-us-east-1 · 10s samples</UpdatedDot>
            <span role="status">
              {playing
                ? `Replay sample ${cursor} of 13`
                : `${cursor === 13 ? "Rollback · Oct 14" : `Paused at ${all[cursor - 1].name}`}`}
            </span>
          </>
        }
        panels={[
          <TrendStats
            key="metrics"
            borderless
            prominent
            items={[
              {
                label: `Peak ${percentile}`,
                value: `${peak} ms`,
                detail: `+${Math.round((peak / meanBaseline - 1) * 100)}% vs baseline`,
              },
              { label: "Baseline", value: `${meanBaseline} ms`, detail: "v2.3.1 mean" },
              {
                label: "First breach",
                value: firstBreach?.name ?? "None",
                detail: firstBreach
                  ? `${firstBreach.total} ms vs ${settings.limit} ms limit`
                  : "All samples within limit",
              },
              {
                label: "Over limit",
                value: `${Math.floor((breaches.length * 10) / 60)}m ${(breaches.length * 10) % 60}s`,
                detail: `${breaches.length} of 13 samples`,
              },
            ]}
          />,
          <div key="plot" className="pt-4">
            <p className="px-4 pb-2 text-xs text-muted-foreground">
              {percentile} latency in milliseconds
            </p>
            {layers["Rollout track"] && (
              <div className="relative mx-4 mb-1 mt-5 px-3 pb-4 pt-5">
                <span className="absolute left-0 top-0 text-xs font-medium text-emerald-600">
                  Canary 25%
                </span>
                <span className="absolute right-0 top-0 text-xs font-medium text-rose-600">
                  Rolled back
                </span>
                <Progress
                  aria-label="Rollout replay progress"
                  value={((cursor - 1) / 12) * 100}
                  className="h-0.5 [&_[data-slot=progress-indicator]]:bg-emerald-500"
                />
                <span className="absolute bottom-3.5 left-2 size-1.5 rounded-full bg-emerald-500" />
                <span className="absolute bottom-3.5 right-2 size-1.5 rounded-full bg-rose-500" />
              </div>
            )}
            <ReuiTrend
              label="Canary latency by rollout sample"
              data={rows}
              series={series}
              legend
              format={(v) => `${Math.round(v)} ms`}
              height={290}
              domain={[0, Math.ceil(peak / 50) * 50]}
              tooltipExtra={(row) => (
                <div className="rounded-b-lg border bg-popover px-3 py-2 text-xs">
                  Total {row.total} ms · Limit {row.limit} ms · v2.3.2
                </div>
              )}
            >
              <ReferenceLine
                yAxisId="left"
                y={settings.limit}
                stroke={c.pink}
                strokeDasharray="4 4"
                label={{
                  value: `${percentile} limit ${settings.limit} ms`,
                  position: "insideTopLeft",
                  fontSize: 10,
                  fill: c.pink,
                }}
              />
            </ReuiTrend>
          </div>,
        ]}
      />
    </ChartStage>
  );
}
