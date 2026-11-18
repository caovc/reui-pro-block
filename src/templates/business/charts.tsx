import { ReuiDotPattern, ReuiStripePattern } from "@/blocks/data/reui-free-chart-primitives";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  useChartWidth,
  usePlotArea,
} from "recharts";
const colors = ["#ff508d", "#b485ff", "#9290ff", "#ffb23e", "#49ccbd", "#48caff", "#55cda5"];
// Standard Tailwind 500 category hues; the default shared palette remains unchanged.
const inventoryColors = [
  "oklch(0.645 0.246 16.439)",
  "oklch(0.606 0.25 292.717)",
  "oklch(0.585 0.233 277.117)",
  "oklch(0.769 0.188 70.08)",
  "oklch(0.704 0.14 182.503)",
  "oklch(0.685 0.169 237.323)",
  "oklch(0.696 0.17 162.48)",
];
const businessBarsChartConfig = {
  Units: { label: "Units" },
  Blocked: { label: "Blocked" },
  Watched: { label: "Watched" },
};
// Fill the native chart surface above its category axis using the actual free dot pattern.
function InventoryDotGrid({ fill }: { fill: string }) {
  const width = useChartWidth();
  const plot = usePlotArea();
  if (!width || !plot) return null;
  return (
    <CartesianGrid
      x={0}
      y={0}
      width={width}
      height={plot.y + plot.height}
      horizontal={false}
      vertical={false}
      fill={fill}
      fillOpacity={1}
    />
  );
}

export function BusinessBars({
  labels,
  large = false,
  multi = false,
  responsiveAxis = false,
  inventoryPattern = false,
  inventoryGrid = false,
  values,
}: {
  labels: string[];
  large?: boolean;
  multi?: boolean;
  responsiveAxis?: boolean;
  inventoryPattern?: boolean;
  inventoryGrid?: boolean;
  values?: number[];
}) {
  const uid = useId().replaceAll(":", "");
  const blue = [41, 36, 62, 27, 52, 22, 67, 45, 17],
    cyan = [75, 89, 40, 58, 82, 70, 42, 77, 34],
    single = [48, 88, 92, 84, 72, 76, 68, 81, 43];
  const data = labels.map((name, i) => ({
    name,
    Blocked: blue[i],
    Watched: cyan[i],
    Units: values?.[i] ?? single[i],
  }));
  // Reuse the free 8px diagonal path: this scale gives 5px perpendicular spacing.
  // Rotating the original path retains its geometry; compensating width keeps a 1px stroke.
  const inventoryStripeScale = (5 * Math.SQRT2) / 8;
  const inventoryStripeOffset = Math.SQRT1_2 / 2;
  const stripePaint = inventoryPattern
    ? {
        secondaryStroke: false,
        backgroundOpacity: 0.5,
        strokeOpacity: 1,
        strokeWidth: 1 / inventoryStripeScale,
        patternTransform: `translate(${inventoryStripeOffset},${-inventoryStripeOffset}) rotate(90) scale(${inventoryStripeScale})`,
      }
    : {};
  const chart = (
    <BarChart
      accessibilityLayer
      data={data}
      margin={{ top: 12, right: responsiveAxis ? 16 : 0, left: 0, bottom: 0 }}
      barCategoryGap={large ? "8%" : "12%"}
      barGap={2}
    >
      <defs>
        <ReuiStripePattern id={uid} color="#5277f0" />
        {(inventoryPattern ? inventoryColors : colors).map((color, index) => (
          <ReuiStripePattern
            key={color}
            id={`${uid}color${index}`}
            color={color}
            {...stripePaint}
          />
        ))}
        {inventoryGrid && (
          <ReuiDotPattern
            id={`${uid}grid`}
            color="var(--border)"
            size={10}
            radius={1.1}
            backgroundOpacity={0}
            dotOpacity={0.4}
            patternTransform="translate(-3 -3)"
          />
        )}
      </defs>
      {inventoryGrid ? (
        <InventoryDotGrid fill={`url(#${uid}grid)`} />
      ) : (
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
      )}
      <XAxis
        dataKey="name"
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        interval={responsiveAxis ? "preserveEnd" : 0}
        minTickGap={responsiveAxis ? 8 : undefined}
        height={30}
      />
      {responsiveAxis ? (
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={<ChartTooltipContent hideIndicator />}
        />
      ) : (
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
        />
      )}
      {multi ? (
        <>
          <Bar
            dataKey="Blocked"
            fill={`url(#${uid})`}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          >
            {responsiveAxis
              ? data.map((entry) => (
                  <Cell
                    key={entry.name}
                    role="img"
                    aria-label={`${entry.name}: ${entry.Blocked} Blocked`}
                  />
                ))
              : null}
          </Bar>
          <Bar dataKey="Watched" fill="#83d7ee" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {responsiveAxis
              ? data.map((entry) => (
                  <Cell
                    key={entry.name}
                    role="img"
                    aria-label={`${entry.name}: ${entry.Watched} Watched`}
                  />
                ))
              : null}
          </Bar>
        </>
      ) : (
        <Bar dataKey="Units" radius={[8, 8, 0, 0]} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={large ? `url(#${uid}color${i % 7})` : colors[i % 7]}
              role={responsiveAxis ? "img" : undefined}
              aria-label={responsiveAxis ? `${entry.name}: ${entry.Units} units` : undefined}
            />
          ))}
        </Bar>
      )}
    </BarChart>
  );
  return (
    <div
      className={`bt-rechart bt-chart-bars ${large ? "bt-chart-large" : ""}`}
      data-inventory-grid={inventoryGrid || undefined}
    >
      {responsiveAxis ? (
        // Adapted composition from free ReUI c-chart-2/3, with our existing data and dimensions.
        // MIT (c) 2025 Keenthemes Inc; components/reui/REUI-LICENSE.txt.
        <ChartContainer
          config={businessBarsChartConfig}
          className="h-full w-full aspect-auto"
          data-reui-chart="c-chart-2 c-chart-3"
        >
          {chart}
        </ChartContainer>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      )}
    </div>
  );
}
export function BusinessArea({ mono = false }: { mono?: boolean }) {
  const uid = useId().replaceAll(":", "");
  const values = mono
    ? [184, 183, 187, 185, 189, 189, 190, 190, 194, 198, 194, 198]
    : [28, 41, 34, 49, 36, 61, 48, 69, 52, 39, 51, 61];
  const data = values.map((n, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    Appointments: n,
    Patients: Math.round(n * 0.35),
  }));
  return (
    <div className="bt-rechart bt-area">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 2, left: 2, bottom: 0 }}>
          <defs>
            <ReuiStripePattern id={uid} color="#edb91f" />
            <linearGradient id={uid + "gray"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7e7e86" stopOpacity=".3" />
              <stop offset="1" stopColor="#7e7e86" stopOpacity="0" />
            </linearGradient>
          </defs>
          {!mono && <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />}
          <YAxis hide domain={mono ? ["dataMin - 2", "dataMax + 2"] : [0, "auto"]} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            hide={mono}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="Appointments"
            stroke={mono ? "#8a8a91" : "#edb91f"}
            fill={`url(#${uid + (mono ? "gray" : "")})`}
            strokeWidth={1.2}
            dot={mono ? { r: 2, fill: "#8a8a91" } : false}
            isAnimationActive={false}
          />
          {!mono && (
            <Area
              type="monotone"
              dataKey="Patients"
              stroke="#21b991"
              fill="#21b99110"
              strokeWidth={1.2}
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
