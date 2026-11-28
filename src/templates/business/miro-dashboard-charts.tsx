// Miro consumers adapted from official free ReUI c-chart-2 and c-chart-13.
// https://reui.io/r/radix-nova/c-chart-2.json
// https://reui.io/r/radix-nova/c-chart-13.json
// MIT (c) 2025 Keenthemes Inc; full notice: components/reui/REUI-LICENSE.txt.
// Existing BusinessBars/BusinessArea fixtures, geometry and actual free stripe
// pattern are retained. ChartConfig and the actual free tooltip own series labels.
import { useId } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ReuiStripePattern } from "@/blocks/data/reui-free-chart-primitives";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import "./miro-dashboard-charts.css";

const miroProcedureChartConfig = {
  Completed: { label: "Completed", color: "#5277f0" },
  Scheduled: { label: "Scheduled", color: "#83d7ee" },
} satisfies ChartConfig;
const volumeChartConfig = {
  Appointments: { label: "Appointments", color: "#edb91f" },
  Patients: { label: "Patients", color: "#21b991" },
} satisfies ChartConfig;
const procedurePatternColors = [
  "#ff508d",
  "#b485ff",
  "#9290ff",
  "#ffb23e",
  "#49ccbd",
  "#48caff",
  "#55cda5",
];

function procedureSeriesColor(dataKey: unknown) {
  return dataKey === "Completed" || dataKey === "Scheduled"
    ? miroProcedureChartConfig[dataKey].color
    : undefined;
}

export function MiroProcedureMixChart({
  labels,
  legendPortal,
}: {
  labels: string[];
  legendPortal?: HTMLElement | null;
}) {
  const uid = useId().replaceAll(":", "");
  const blue = [41, 36, 62, 27, 52, 22, 67, 45, 17],
    cyan = [75, 89, 40, 58, 82, 70, 42, 77, 34],
    single = [48, 88, 92, 84, 72, 76, 68, 81, 43];
  const data = labels.map((name, i) => ({
    name,
    Completed: blue[i],
    Scheduled: cyan[i],
    Units: single[i],
  }));
  return (
    <div className="bt-rechart bt-chart-bars">
      <ChartContainer config={miroProcedureChartConfig} className="miro-dashboard-chart">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 12, right: 12, left: 12, bottom: 0 }}
          barCategoryGap="12%"
          barGap={2}
        >
          <defs>
            <ReuiStripePattern id={uid} color="var(--color-Completed)" />
            {procedurePatternColors.map((color, index) => (
              <ReuiStripePattern key={color} id={`${uid}color${index}`} color={color} />
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            interval="preserveStartEnd"
            minTickGap={8}
            height={30}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={(props) => (
              <ChartTooltipContent
                active={props.active}
                label={props.label}
                payload={props.payload?.map((entry) => ({
                  ...entry,
                  color: procedureSeriesColor(entry.dataKey) ?? entry.color,
                  payload: {
                    ...entry.payload,
                    fill: procedureSeriesColor(entry.dataKey) ?? entry.payload?.fill,
                  },
                }))}
                indicator="dot"
                className="miro-dashboard-chart-tooltip [&_.shrink-0]:size-2 [&_.shrink-0]:rounded-full"
              />
            )}
          />
          {legendPortal && (
            <ChartLegend
              portal={legendPortal}
              content={(props) => (
                <ChartLegendContent
                  payload={props.payload?.map((entry) => ({
                    ...entry,
                    color: procedureSeriesColor(entry.dataKey) ?? entry.color,
                  }))}
                  className="p-0 text-xs [&>div>div]:rounded-full"
                />
              )}
            />
          )}
          <Bar
            dataKey="Completed"
            name={miroProcedureChartConfig.Completed.label}
            fill={`url(#${uid})`}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="Scheduled"
            name={miroProcedureChartConfig.Scheduled.label}
            fill="var(--color-Scheduled)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function MiroPatientVolumeChart() {
  const uid = useId().replaceAll(":", "");
  const values = [28, 41, 34, 49, 36, 61, 48, 69, 52, 39, 51, 61];
  const data = values.map((n, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    Appointments: n,
    Patients: Math.round(n * 0.35),
  }));
  return (
    <div className="bt-rechart bt-area">
      <ChartContainer config={volumeChartConfig} className="miro-dashboard-chart">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{ top: 12, right: 2, left: 2, bottom: 0 }}
        >
          <defs>
            <ReuiStripePattern id={uid} color="var(--color-Appointments)" />
            <linearGradient id={uid + "gray"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7e7e86" stopOpacity=".3" />
              <stop offset="1" stopColor="#7e7e86" stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
          <YAxis hide domain={[0, "auto"]} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            hide={false}
          />
          <ChartTooltip
            content={<ChartTooltipContent hideIndicator className="miro-dashboard-chart-tooltip" />}
          />
          <Area
            type="monotone"
            dataKey="Appointments"
            stroke="var(--color-Appointments)"
            fill={`url(#${uid})`}
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="Patients"
            stroke="var(--color-Patients)"
            fill="#21b99110"
            strokeWidth={1.2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
