import { useMemo, useState } from "react";
import { ReferenceArea, ReferenceDot, ReferenceLine } from "recharts";
import { ChartNoAxesCombined, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChartFrame, ChartStage, PeriodButtons, UpdatedDot, ChangePill } from "./chart-chrome";
import { ReuiTrend, TrendColor, type TrendSeries } from "./trend-foundation";
import {
  TrendActions,
  TrendChoice,
  TrendExpanded,
  TrendLayers,
  TrendStats,
  TrendTitle,
  TrendSplitFrame,
} from "./trend-controls";
import { dates, money, short, usd, sum, change, trendColors as c } from "./trend-data";

export function MetricSwitcher() {
  const [period, setPeriod] = useState("30D"),
    [metric, setMetric] = useState("orders"),
    [revision, setRevision] = useState(0),
    [layers, setLayers] = useState({
      "Previous period": true,
      Events: true,
      "Latest value": true,
      Gridlines: false,
    }),
    [expanded, setExpanded] = useState(false);
  const data = useMemo(() => {
    const n = period === "7D" ? 7 : period === "30D" ? 30 : 90;
    const days = dates(n, "2026-06-30");
    return days.map((name, i) => {
      const bump = Math.exp(-(((i / n - 0.42) / 0.085) ** 2)) * 80;
      const orders = Math.round(120 + bump + Math.sin(i * 2.2) * 16 + revision * 2);
      return {
        name,
        orders,
        revenue: Math.round(orders * (40 + Math.sin(i * 0.4) * 8)),
        users: Math.round(1780 + Math.sin(i * 0.32) * 220 + bump * 3),
        latency: Math.round(158 + Math.sin(i * 0.45) * 24 + bump * 0.2),
      };
    });
  }, [period, revision]);
  const metrics = [
    {
      key: "orders",
      title: "Orders",
      value: sum(data.map((r) => r.orders)),
      prior: (3632 * data.length) / 30,
      color: c.teal,
      format: (v: number) => Math.round(v).toLocaleString(),
      unit: "Orders / day",
    },
    {
      key: "revenue",
      title: "Revenue",
      value: sum(data.map((r) => r.revenue)),
      prior: (172100 * data.length) / 30,
      color: c.purple,
      format: usd,
      unit: "Revenue / day",
    },
    {
      key: "users",
      title: "Active users",
      value: Math.round(sum(data.map((r) => r.users)) / data.length),
      prior: 2058,
      color: c.blue,
      format: (v: number) => Math.round(v).toLocaleString(),
      unit: "Daily active users",
    },
    {
      key: "latency",
      title: "p95 latency",
      value: Math.round(sum(data.map((r) => r.latency)) / data.length),
      prior: 174,
      color: c.orange,
      format: (v: number) => `${Math.round(v)} ms`,
      unit: "p95 latency / day",
    },
  ];
  const selected = metrics.find((m) => m.key === metric)!;
  const rows = data.map((r, i) => ({
    ...r,
    current: r[metric as keyof typeof r] as number,
    previous: Number(r[metric as keyof typeof r]) * (0.9 + Math.sin(i * 0.5) * 0.08),
  }));
  const last = rows.at(-1)!;
  const plot = (large = false) => (
    <div key="plot" className="px-2 pb-2">
      <div className="px-3 py-2 text-xs text-muted-foreground">{selected.unit}</div>
      <ReuiTrend
        label={`${selected.title} over time`}
        data={rows}
        series={[
          { key: "current", label: selected.title, color: selected.color, kind: "area" },
          ...(layers["Previous period"]
            ? [{ key: "previous", label: "Previous period", color: c.gray, dashed: true }]
            : []),
        ]}
        format={selected.format}
        height={large ? 440 : 290}
        domain={[0, metric === "orders" ? 250 : "auto"]}
        grid={layers.Gridlines}
      >
        {layers.Events && (
          <>
            <ReferenceLine
              yAxisId="left"
              x={rows[Math.min(3, rows.length - 1)].name}
              stroke={c.gray}
              strokeDasharray="3 3"
              label={{
                value: "v4.2 release",
                position: "insideTopRight",
                fontSize: 10,
                fill: c.gray,
              }}
            />
            <ReferenceArea
              yAxisId="left"
              x1={rows[Math.floor(rows.length * 0.36)].name}
              x2={rows[Math.floor(rows.length * 0.55)].name}
              fill={selected.color}
              fillOpacity={0.04}
              label={{
                value: "Summer sale",
                position: "insideTop",
                fontSize: 10,
                fill: selected.color,
              }}
            />
          </>
        )}
        {layers["Latest value"] && (
          <ReferenceDot
            yAxisId="left"
            x={last.name}
            y={last.current}
            r={4}
            fill={selected.color}
            stroke="var(--background)"
            label={{
              value: selected.format(last.current),
              position: "top",
              fontSize: 10,
              fill: selected.color,
            }}
          />
        )}
      </ReuiTrend>
    </div>
  );
  return (
    <ChartStage>
      <TrendSplitFrame
        title={<TrendTitle icon={<ChartNoAxesCombined />} title="Platform Metrics" />}
        description="Storefront health, period over period"
        toolbar={
          <>
            <PeriodButtons value={period} onChange={setPeriod} options={["7D", "30D", "90D"]} />
            <TrendLayers
              label={`Display ${Object.values(layers).filter(Boolean).length}/4`}
              layers={layers}
              onChange={(name, v) => setLayers((s) => ({ ...s, [name]: v }))}
            />
            <TrendActions
              title="platform-metrics"
              rows={rows}
              onRefresh={() => {
                setRevision((v) => v + 1);
                toast.success("Platform metrics refreshed");
              }}
              onExpand={() => setExpanded(true)}
            />
          </>
        }
        footer={
          <>
            <UpdatedDot>Production · UTC</UpdatedDot>
            <span>As of Jun 30 · Synced {revision ? "just now" : "2 min ago"}</span>
          </>
        }
        panels={[
          <div
            key="metrics"
            className="grid grid-cols-2 divide-x divide-y border-b sm:grid-cols-4 sm:divide-y-0"
          >
            {metrics.map((m) => (
              <Button
                key={m.key}
                variant="ghost"
                aria-pressed={metric === m.key}
                className="relative h-auto flex-col items-start gap-2 rounded-none px-4 py-4 text-left"
                onClick={() => setMetric(m.key)}
              >
                <span className="text-xs font-normal text-muted-foreground">{m.title}</span>
                <strong className="text-2xl font-semibold tracking-tight">
                  {m.format(m.value)}
                </strong>
                <span className="flex flex-wrap items-center gap-1.5 text-xs font-normal">
                  <ChangePill
                    value={Number(change(m.value, m.prior).toFixed(1))}
                    goodDirection={m.key === "latency" ? "down" : "up"}
                  />
                  <span className="text-muted-foreground">vs {m.format(m.prior)}</span>
                </span>
                {metric === m.key && (
                  <span
                    className="absolute inset-x-4 bottom-0 h-0.5"
                    style={{ background: m.color }}
                  />
                )}
              </Button>
            ))}
          </div>,
          plot(),
        ]}
      />
      <TrendExpanded
        open={expanded}
        onChange={setExpanded}
        title="Platform Metrics"
        description={`${selected.title} · ${period} · Current and previous period`}
      >
        {plot(true)}
      </TrendExpanded>
    </ChartStage>
  );
}

export function RevenueTrend() {
  const [previousVisible, setPreviousVisible] = useState(true);
  const [period, setPeriod] = useState("30D"),
    [comparison, setComparison] = useState("Previous period"),
    [mode, setMode] = useState("Daily"),
    [enabled, setEnabled] = useState(["Net revenue", "Subscriptions", "One-time"]),
    [revision, setRevision] = useState(0),
    [expanded, setExpanded] = useState(false);
  const raw = useMemo(() => {
    const count = period === "7D" ? 7 : period === "30D" ? 30 : period === "90D" ? 90 : 12;
    const names =
      period === "12M"
        ? ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]
        : dates(count, "2025-10-16");
    return names.map((name, i) => {
      const subscriptions = Math.round(
          (12000 + Math.sin(i * 0.7) * 1300 + (i % 13 === 1 ? 8500 : 0) + revision * 32) *
            (period === "12M" ? 30 : 1),
        ),
        oneTime = Math.round(
          (4200 + Math.sin(i * 1.7) * 2500 + (i % 11 === 5 ? 6500 : 0)) *
            (period === "12M" ? 30 : 1),
        );
      return {
        name,
        subscriptions,
        oneTime,
        net: subscriptions + oneTime,
        previous: Math.round(
          (subscriptions + oneTime) / (comparison === "Last year" ? 1.18 : 1.068),
        ),
        orders: Math.round((subscriptions + oneTime) / 348),
      };
    });
  }, [period, comparison, revision]);
  const rows =
    mode === "Daily"
      ? raw
      : raw.map((r, i) => ({
          ...r,
          subscriptions: sum(raw.slice(0, i + 1).map((v) => v.subscriptions)),
          oneTime: sum(raw.slice(0, i + 1).map((v) => v.oneTime)),
          net: sum(raw.slice(0, i + 1).map((v) => v.net)),
          previous: sum(raw.slice(0, i + 1).map((v) => v.previous)),
        }));
  const net = sum(raw.map((r) => r.net)),
    subscriptions = sum(raw.map((r) => r.subscriptions)),
    oneTime = sum(raw.map((r) => r.oneTime)),
    orders = sum(raw.map((r) => r.orders)),
    previous = sum(raw.map((r) => r.previous));
  const definitions = [
    { key: "net", label: "Net revenue", color: c.purple },
    { key: "subscriptions", label: "Subscriptions", color: c.teal },
    { key: "oneTime", label: "One-time", color: c.orange },
  ];
  const series: TrendSeries[] = [
    ...definitions
      .filter((d) => enabled.includes(d.label))
      .map((d) => ({ ...d, curve: "natural" as const })),
    ...(comparison !== "None" && previousVisible
      ? [{ key: "previous", label: comparison, color: c.gray, dashed: true }]
      : []),
  ];
  const plot = (large = false) => (
    <ReuiTrend
      label="Net revenue and revenue sources"
      data={rows}
      series={series}
      format={usd}
      valueFormat={money}
      domain={[0, "auto"]}
      height={large ? 450 : 300}
    />
  );
  return (
    <ChartStage>
      <ChartFrame
        width="max-w-[1024px]"
        title="Revenue Trend"
        description={`All plans · Last ${period.toLowerCase()}`}
        toolbar={
          <>
            <PeriodButtons
              value={period}
              onChange={setPeriod}
              options={["7D", "30D", "90D", "12M"]}
            />
            <TrendChoice
              label="Compare with"
              value={comparison}
              onChange={setComparison}
              options={["Previous period", "Last year", "None"]}
            />
            <TrendActions
              title="revenue-trend"
              rows={rows}
              onRefresh={() => {
                setRevision((v) => v + 1);
                toast.success("Revenue refreshed");
              }}
              onExpand={() => setExpanded(true)}
            />
          </>
        }
        footer={
          <>
            <UpdatedDot>
              Updated {revision ? "just now" : "2 min ago"} · Today until 14:20
            </UpdatedDot>
            <span>USD · Net of refunds</span>
          </>
        }
      >
        <TrendStats
          prominent
          items={[
            {
              label: "Net revenue",
              value: usd(net),
              detail: (
                <>
                  <ChangePill value={Number(change(net, previous).toFixed(1))} /> from{" "}
                  {usd(previous)}
                </>
              ),
            },
            {
              label: "Subscriptions",
              value: usd(subscriptions),
              detail: `${((subscriptions / net) * 100).toFixed(0)}% of net revenue`,
            },
            {
              label: "One-time",
              value: usd(oneTime),
              detail: `Peak ${usd(Math.max(...raw.map((r) => r.oneTime)))}`,
            },
            {
              label: "Orders",
              value: orders.toLocaleString(),
              detail: `${money(net / orders)} per order`,
            },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-1 pt-4">
          <div className="flex flex-wrap gap-3">
            {definitions.map((d) => (
              <Button
                key={d.key}
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 bg-muted/25 px-2 text-xs"
                aria-pressed={enabled.includes(d.label)}
                onClick={() =>
                  setEnabled((s) =>
                    s.includes(d.label) ? s.filter((v) => v !== d.label) : [...s, d.label],
                  )
                }
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: d.color, opacity: enabled.includes(d.label) ? 1 : 0.25 }}
                />
                {d.label}
              </Button>
            ))}
            {comparison !== "None" && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 gap-1.5 bg-muted/25 px-2 text-xs"
                aria-pressed={previousVisible}
                onClick={() => setPreviousVisible((v) => !v)}
              >
                <span className="w-3 border-t border-dashed" />
                {comparison}
              </Button>
            )}
          </div>
          <PeriodButtons
            label="Value mode"
            value={mode}
            onChange={setMode}
            options={["Daily", "Cumulative"]}
          />
        </div>
        {plot()}
      </ChartFrame>
      <TrendExpanded
        open={expanded}
        onChange={setExpanded}
        title="Revenue Trend"
        description={`${period} · ${mode.toLowerCase()} · ${comparison.toLowerCase()}`}
      >
        {plot(true)}
      </TrendExpanded>
    </ChartStage>
  );
}

export function SalesVsTraffic() {
  const [period, setPeriod] = useState("30D"),
    [compare, setCompare] = useState(false),
    [salesColor, setSalesColor] = useState(c.purple),
    [viewsColor, setViewsColor] = useState(c.orange),
    [revision, setRevision] = useState(0),
    [expanded, setExpanded] = useState(false),
    [layers, setLayers] = useState({
      Gridlines: true,
      "Average sales": false,
      "Peak marker": true,
      "Data points": false,
    });
  const data = useMemo(() => {
    const count = period === "30D" ? 30 : period === "90D" ? 13 : 12;
    const labels =
      period === "12M"
        ? ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
        : period === "90D"
          ? dates(91, "2025-09-30").filter((_, i) => i % 7 === 0)
          : dates(count, "2025-09-30");
    return labels.map((name, i) => {
      const sales = Math.round(
          (8000 + Math.sin(i * 0.8) * 900 + Math.sin(i * 1.4) * 400 + revision * 32) *
            (period === "12M" ? 30 : period === "90D" ? 7 : 1),
        ),
        views = Math.round(
          (4800 + Math.sin(i * 0.8 + 0.4) * 550 + Math.sin(i * 1.6) * 160) *
            (period === "12M" ? 30 : period === "90D" ? 7 : 1),
        );
      return {
        name,
        sales,
        views,
        priorSales: Math.round(sales / 1.092),
        priorViews: Math.round(views / 1.086),
        orders: Math.round(sales / 63.89),
      };
    });
  }, [period, revision]);
  const sales = sum(data.map((r) => r.sales)),
    views = sum(data.map((r) => r.views)),
    orders = sum(data.map((r) => r.orders)),
    peak = Math.max(...data.map((r) => r.sales)),
    peakRow = data.find((r) => r.sales === peak)!;
  const pounds = (v: number) => `£${v.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
  const series: TrendSeries[] = [
    { key: "sales", label: "Sales", color: salesColor, dots: layers["Data points"] },
    {
      key: "views",
      label: "Views",
      color: viewsColor,
      axis: "right",
      dashed: true,
      dots: layers["Data points"],
    },
    ...(compare
      ? [
          {
            key: "priorSales",
            label: "Prior sales",
            color: salesColor,
            dashed: true,
            opacity: 0.35,
          },
          {
            key: "priorViews",
            label: "Prior views",
            color: viewsColor,
            axis: "right" as const,
            dashed: true,
            opacity: 0.35,
          },
        ]
      : []),
  ];
  const plot = (large = false) => (
    <ReuiTrend
      label="Sales and page views by day"
      data={data}
      series={series}
      format={(v) => `£${short(v)}`}
      valueFormat={pounds}
      rightFormat={short}
      height={large ? 450 : 300}
      grid={layers.Gridlines}
    >
      {layers["Average sales"] && (
        <ReferenceLine
          yAxisId="left"
          y={sales / data.length}
          stroke={salesColor}
          strokeDasharray="3 3"
          label={{ value: "Avg sales", position: "insideTopLeft", fontSize: 10, fill: salesColor }}
        />
      )}
      {layers["Peak marker"] && (
        <ReferenceDot
          yAxisId="left"
          x={peakRow.name}
          y={peak}
          r={4}
          fill={salesColor}
          stroke="var(--background)"
          label={{ value: `Peak ${pounds(peak)}`, position: "top", fontSize: 10, fill: salesColor }}
        />
      )}
    </ReuiTrend>
  );
  return (
    <ChartStage>
      <ChartFrame
        plain
        width="max-w-[1024px]"
        title="Sales vs Traffic"
        description={
          <span className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-emerald-600" />
            <span className="text-emerald-600">+9.2%</span> sales vs previous {period.toLowerCase()}
          </span>
        }
        toolbar={
          <>
            <PeriodButtons value={period} onChange={setPeriod} options={["30D", "90D", "12M"]} />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              aria-pressed={compare}
              onClick={() => setCompare((v) => !v)}
            >
              Compare
            </Button>
            <TrendLayers
              layers={layers}
              onChange={(name, v) => setLayers((s) => ({ ...s, [name]: v }))}
            />
            <TrendColor label="Sales color" color={salesColor} onChange={setSalesColor} />
            <TrendColor label="Views color" color={viewsColor} onChange={setViewsColor} />
            <TrendActions
              title="sales-vs-traffic"
              rows={data}
              onRefresh={() => {
                setRevision((v) => v + 1);
                toast.success("Traffic synced");
              }}
              onExpand={() => setExpanded(true)}
            />
          </>
        }
        footer={
          <>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: salesColor }} />
                Sales <strong className="text-foreground">{pounds(sales)}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: viewsColor }} />
                Views <strong className="text-foreground">{views.toLocaleString()}</strong>
              </span>
            </div>
            <span>
              {period === "12M" ? "Monthly" : period === "90D" ? "Weekly" : "Daily"} ·{" "}
              {data[0].name}–{data.at(-1)!.name} ·{" "}
              {revision ? "Updated just now" : "Updated 2 min ago"}
            </span>
          </>
        }
      >
        <TrendStats
          prominent
          borderless
          items={[
            { label: "Sales", value: pounds(sales), detail: <ChangePill value={9.2} /> },
            { label: "Views", value: views.toLocaleString(), detail: <ChangePill value={8.6} /> },
            {
              label: "Conversion",
              value: `${((orders / views) * 100).toFixed(2)}%`,
              detail: "Orders / page views",
            },
            { label: "Avg. order", value: pounds(sales / orders), detail: "Sales / placed orders" },
          ]}
        />
        {plot()}
      </ChartFrame>
      <TrendExpanded
        open={expanded}
        onChange={setExpanded}
        title="Sales vs Traffic"
        description="Separate scales for sales in GBP and page views"
      >
        {plot(true)}
      </TrendExpanded>
    </ChartStage>
  );
}
