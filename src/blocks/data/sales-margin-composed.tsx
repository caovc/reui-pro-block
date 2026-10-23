import { Fragment, useState } from "react";
import { ReferenceArea, ReferenceLine } from "recharts";
import { ChartColumnIncreasing } from "lucide-react";
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
import { money, usd, currencyAxis, sum, trendColors as c } from "./trend-data";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const monthlySales = [
  352400,
  408900,
  471300,
  398600,
  476200,
  512800,
  441700,
  493500,
  568900,
  null,
  null,
  null,
];
const monthlyGoals = [
  380000, 395000, 440000, 425000, 450000, 490000, 455000, 470000, 530000, 545000, 590000, 660000,
];
const priorSales = [
  318200, 341500, 396800, 372400, 401900, 438600, 405300, 419700, 471200, 486500, 529800, 601400,
];

export function SalesVsGoal() {
  const [range, setRange] = useState("Full Year"),
    [color, setColor] = useState(c.teal),
    [revision, setRevision] = useState(0),
    [expanded, setExpanded] = useState(false),
    [layers, setLayers] = useState({
      "Goal Line": true,
      "Prior Year": true,
      "Area Fill": true,
      "Data Points": true,
      Gridlines: true,
      "Quarter Close": true,
    });
  const all = monthNames.map((name, i) => ({
    name,
    sales: monthlySales[i] === null ? null : monthlySales[i]! + revision * 1200,
    goal: monthlyGoals[i],
    prior: priorSales[i],
    ytd: sum(
      monthlySales.slice(0, i + 1).map((value) => (value === null ? 0 : value + revision * 1200)),
    ),
  }));
  const rows =
    range === "Year to Date" ? all.slice(0, 9) : range === "Last 6 Months" ? all.slice(3, 9) : all;
  const closed = rows.filter((r) => r.sales !== null),
    actual = sum(closed.map((r) => r.sales!)),
    goal = sum(closed.map((r) => r.goal)),
    previous = sum(closed.map((r) => r.prior)),
    annualGoal = sum(monthlyGoals),
    attainment = goal ? (actual / goal) * 100 : 0;
  const series: TrendSeries[] = [
    {
      key: "sales",
      label: "Sales",
      color,
      kind: layers["Area Fill"] ? "area" : "line",
      dots: layers["Data Points"],
    },
    ...(layers["Goal Line"] ? [{ key: "goal", label: "Goal", color: c.pink, dashed: true }] : []),
    ...(layers["Prior Year"] ? [{ key: "prior", label: "2025", color: c.gray }] : []),
  ];
  const plot = (large = false) => (
    <ReuiTrend
      label="Monthly sales against goal"
      data={rows}
      series={series}
      height={large ? 430 : 300}
      format={currencyAxis}
      valueFormat={money}
      domain={[0, 800000]}
      grid={layers.Gridlines}
      tooltipExtra={(row) => (
        <div className="space-y-1 rounded-b-lg border bg-popover px-3 py-2 text-xs">
          {row.sales !== null ? (
            <>
              <p>
                {((Number(row.sales) / Number(row.goal)) * 100).toFixed(1)}% of goal ·{" "}
                {money(Number(row.sales) - Number(row.goal))} vs goal
              </p>
              <p>
                {money(Number(row.sales) - Number(row.prior))} vs 2025 · YTD{" "}
                {money(Number(row.ytd))}
              </p>
            </>
          ) : (
            "Not yet closed"
          )}
        </div>
      )}
    >
      {layers["Quarter Close"] && rows.some((r) => r.name === "Sep") && (
        <ReferenceLine
          yAxisId="left"
          x="Sep"
          stroke={c.gray}
          strokeDasharray="3 3"
          label={{ value: "Q3 close", position: "insideTopLeft", fontSize: 10, fill: c.gray }}
        />
      )}
    </ReuiTrend>
  );
  return (
    <ChartStage>
      <ChartFrame
        plain
        title="Sales vs Goal"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ChangePill value={Number((attainment - 100).toFixed(1))} />
            {attainment >= 100 ? "above goal ·" : "below goal ·"}
            {actual ? `${usd(actual)} closed` : "No closed months in this range"}
          </span>
        }
        toolbar={
          <>
            <TrendChoice
              label="Range"
              value={range}
              onChange={setRange}
              options={["Full Year", "Year to Date", "Last 6 Months"]}
            />
            <TrendLayers
              layers={layers}
              onChange={(key, value) => setLayers((s) => ({ ...s, [key]: value }))}
            />
            <TrendColor label="Sales color" color={color} onChange={setColor} />
            <TrendActions
              title="sales-vs-goal"
              rows={rows}
              onRefresh={() => {
                setRevision((v) => v + 1);
                toast.success("Closed sales refreshed");
              }}
              onExpand={() => setExpanded(true)}
            />
          </>
        }
        footer={
          <>
            <div className="flex flex-wrap gap-4">
              {[
                ["Sales", usd(actual), color],
                ["Goal", usd(goal), c.pink],
                ["2025", usd(previous), c.gray],
              ].map(([label, value, tone]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: tone }} />
                  {label}
                  <strong className="text-foreground">{value}</strong>
                </span>
              ))}
            </div>
            <span>
              {(
                (sum(all.filter((r) => r.sales !== null).map((r) => r.sales!)) / annualGoal) *
                100
              ).toFixed(0)}
              % of {usd(annualGoal)} annual goal · Updated {revision ? "just now" : "Oct 1"}
            </span>
          </>
        }
      >
        {plot()}
      </ChartFrame>
      <TrendExpanded
        open={expanded}
        onChange={setExpanded}
        title="Sales vs Goal"
        description={`${range} · Actual closes, target and prior year`}
      >
        {plot(true)}
      </TrendExpanded>
    </ChartStage>
  );
}

const revenueMillions = [1.84, 1.92, 2.07, 2.02, 2.16, 2.28, 2.22, 2.39, 2.51, 2.58, 2.66, 2.74];
const expenseMillions = [1.72, 1.77, 1.82, 1.81, 1.83, 1.85, 1.84, 1.91, 1.94, 2.01, 2.06, 2.12];
export function OperatingMargin() {
  const [granularity, setGranularity] = useState("Month"),
    [revision, setRevision] = useState(0),
    [expanded, setExpanded] = useState(false),
    [layers, setLayers] = useState({
      Revenue: true,
      Expenses: true,
      Margin: true,
      Target: true,
      Forecast: true,
      Gridlines: true,
    });
  const monthly = monthNames.map((name, i) => ({
    name,
    revenue: Math.round(revenueMillions[i] * 1e6 + revision * 11000),
    expenses: Math.round(expenseMillions[i] * 1e6),
    closed: i < 9,
  }));
  const buckets =
    granularity === "Month"
      ? monthly
      : Array.from({ length: 4 }, (_, i) => ({
          name: `Q${i + 1}`,
          revenue: sum(monthly.slice(i * 3, i * 3 + 3).map((r) => r.revenue)),
          expenses: sum(monthly.slice(i * 3, i * 3 + 3).map((r) => r.expenses)),
          closed: i < 3,
        }));
  const rows = buckets.map((r) => ({
    name: r.name,
    revenue: r.closed ? r.revenue : null,
    expenses: r.closed ? r.expenses : null,
    forecastRevenue: !r.closed && layers.Forecast ? r.revenue : null,
    forecastExpenses: !r.closed && layers.Forecast ? r.expenses : null,
    margin: r.closed ? ((r.revenue - r.expenses) / r.revenue) * 100 : null,
    forecastMargin:
      !r.closed && layers.Forecast ? ((r.revenue - r.expenses) / r.revenue) * 100 : null,
  }));
  const closed = monthly.filter((r) => r.closed),
    revenue = sum(closed.map((r) => r.revenue)),
    expenses = sum(closed.map((r) => r.expenses)),
    income = revenue - expenses,
    margin = (income / revenue) * 100,
    fyRevenue = sum(monthly.map((r) => r.revenue)),
    fyExpenses = sum(monthly.map((r) => r.expenses)),
    fyMargin = ((fyRevenue - fyExpenses) / fyRevenue) * 100;
  const barSeries: TrendSeries[] = [
    ...(layers.Revenue
      ? [
          {
            key: "revenue",
            label: "Revenue",
            color: c.purple,
            kind: "bar" as const,
            stack: "revenue",
            width: granularity === "Month" ? 22 : 50,
          },
          {
            key: "forecastRevenue",
            label: "Revenue forecast",
            color: c.purple,
            kind: "bar" as const,
            stack: "revenue",
            pattern: true,
            width: granularity === "Month" ? 22 : 50,
          },
        ]
      : []),
    ...(layers.Expenses
      ? [
          {
            key: "expenses",
            label: "Expenses",
            color: "#b3b6c0",
            kind: "bar" as const,
            stack: "expense",
            width: granularity === "Month" ? 22 : 50,
          },
          {
            key: "forecastExpenses",
            label: "Expense forecast",
            color: "#a5a8b2",
            kind: "bar" as const,
            stack: "expense",
            pattern: true,
            width: granularity === "Month" ? 22 : 50,
          },
        ]
      : []),
  ];
  const firstForecast = granularity === "Month" ? "Oct" : "Q4";
  const marginRows = rows.map((r, i) => ({
    ...r,
    forecastMargin:
      i === (granularity === "Month" ? 8 : 2) && layers.Forecast ? r.margin : r.forecastMargin,
  }));
  const plot = (large = false) => (
    <div>
      <div className="flex flex-wrap justify-between gap-2 px-4 pt-4 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-0.5 w-3" style={{ background: c.teal }} />
          Operating margin
        </span>
        <span className="text-muted-foreground">18% target · Oct–Dec forecast</span>
      </div>
      <ReuiTrend
        label="Operating margin over time"
        data={marginRows}
        series={
          layers.Margin
            ? [
                { key: "margin", label: "Margin", color: c.teal, dots: true },
                {
                  key: "forecastMargin",
                  label: "Forecast margin",
                  color: c.teal,
                  dashed: true,
                  dots: true,
                },
              ]
            : []
        }
        format={(v) => `${Math.round(v)}%`}
        domain={[0, 35]}
        hideXAxis
        height={large ? 150 : 110}
        grid={false}
      >
        {layers.Target && (
          <ReferenceLine
            yAxisId="left"
            y={18}
            stroke={c.teal}
            strokeDasharray="3 3"
            label={{ value: "18%", position: "insideTopLeft", fontSize: 10, fill: c.teal }}
          />
        )}
      </ReuiTrend>
      <ReuiTrend
        label="Revenue and operating expenses"
        data={rows}
        series={barSeries}
        format={currencyAxis}
        valueFormat={money}
        domain={[0, granularity === "Month" ? 3000000 : 9000000]}
        height={large ? 340 : 260}
        grid={layers.Gridlines}
      >
        {layers.Forecast && (
          <ReferenceArea
            yAxisId="left"
            x1={firstForecast}
            x2={rows.at(-1)!.name}
            fill={c.gray}
            fillOpacity={0.04}
          />
        )}
        <ReferenceLine
          yAxisId="left"
          x={firstForecast}
          stroke={c.gray}
          strokeDasharray="3 3"
          label={{ value: "Forecast", position: "insideTopRight", fontSize: 10, fill: c.gray }}
        />
      </ReuiTrend>
    </div>
  );
  return (
    <ChartStage>
      <TrendSplitFrame
        title={<TrendTitle icon={<ChartColumnIncreasing />} title="Operating Margin" />}
        description="FY2026 · Revenue and operating costs"
        toolbar={
          <>
            <PeriodButtons
              label="Granularity"
              value={granularity}
              onChange={setGranularity}
              options={["Month", "Quarter"]}
            />
            <TrendLayers
              layers={layers}
              onChange={(name, value) => setLayers((s) => ({ ...s, [name]: value }))}
            />
            <TrendActions
              title="operating-margin"
              rows={rows}
              onRefresh={() => {
                setRevision((v) => v + 1);
                toast.success("Finance close refreshed");
              }}
              onExpand={() => setExpanded(true)}
            />
          </>
        }
        footer={
          <>
            <UpdatedDot>Jan–Sep closed · Oct–Dec forecast</UpdatedDot>
            <span>USD · As of Oct 1</span>
          </>
        }
        panels={[
          <Fragment key="chart">
            <div className="px-4 pt-5">
              <p className="text-xs text-muted-foreground">Operating income YTD</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{usd(income)}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <ChangePill value={65.9} />
                vs Jan–Sep 2025
              </p>
            </div>
            {plot()}
          </Fragment>,
          <TrendStats
            key="stats"
            borderless
            items={[
              { label: "Revenue YTD", value: usd(revenue), detail: "+18.5% vs prior year" },
              { label: "Expenses YTD", value: usd(expenses), detail: "+12.8% vs prior year" },
              {
                label: "Margin YTD",
                value: `${margin.toFixed(1)}%`,
                detail: "+4.3 pts vs prior year",
              },
              {
                label: "FY outlook",
                value: `${fyMargin.toFixed(1)}%`,
                detail: `${(fyMargin - 18).toFixed(1)} pts vs target`,
              },
            ]}
          />,
        ]}
      />
      <TrendExpanded
        open={expanded}
        onChange={setExpanded}
        title="Operating Margin"
        description={`${granularity} view · Weighted margin recomputed from revenue and expenses`}
      >
        {plot(true)}
      </TrendExpanded>
    </ChartStage>
  );
}
