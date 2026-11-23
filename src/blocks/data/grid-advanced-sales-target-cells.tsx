import type { CSSProperties } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/reui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  salesTargetSeries,
  salesPercent,
  salesCurrency,
} from "./grid-advanced-sales-target-view-model";
import type { SalesTargetMetrics, SalesTargetStore } from "./grid-advanced-sales-target-model";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const chartConfig = {
  actual: { label: "Actual", color: "var(--st-actual)" },
  target: { label: "Target", color: "var(--st-target)" },
};
export function SalesAttainment({ metrics }: { metrics: SalesTargetMetrics }) {
  return (
    <Badge
      className="st-attainment"
      data-pace={
        metrics.attainment === null ? "none" : metrics.attainment >= 100 ? "above" : "below"
      }
      style={
        {
          "--st-attainment-fill": `${Math.max(0, Math.min(100, metrics.attainment ?? 0))}%`,
        } as CSSProperties
      }
      size="xs"
      variant={
        metrics.attainment === null
          ? "secondary"
          : metrics.attainment >= 100
            ? "success-light"
            : "warning-light"
      }
    >
      {salesPercent(metrics.attainment)}
    </Badge>
  );
}

export function SalesMonthChart({
  stores,
  year,
  month,
  small = false,
}: {
  stores: SalesTargetStore[];
  year: number;
  month: string;
  small?: boolean;
}) {
  const points = salesTargetSeries(stores, year);
  const text = points
    .map(
      (point) =>
        `${point.label}: actual ${salesCurrency.format(point.actual)}, target ${salesCurrency.format(point.target)}`,
    )
    .join("; ");
  return (
    <div className={small ? "st-month-strip" : "st-year-chart"} data-selected-month={month}>
      <span className="sr-only">
        {year} monthly sales. {text}
      </span>
      <ChartContainer
        config={chartConfig}
        initialDimension={{ width: small ? 208 : 900, height: small ? 36 : 140 }}
        className={small ? "h-9 w-full" : "h-36 w-full"}
        aria-hidden={small || undefined}
      >
        <BarChart
          data={points}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          accessibilityLayer={!small}
          barCategoryGap={small ? 2 : "25%"}
        >
          {!small && <CartesianGrid vertical={false} strokeDasharray="3 3" />}
          <XAxis dataKey="label" hide={small} tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis
            hide={small}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => compact.format(value)}
          />
          {!small && <ChartTooltip content={<ChartTooltipContent />} />}
          <Bar
            dataKey="target"
            fill="var(--st-target)"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="actual"
            fill="var(--st-actual)"
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          >
            {points.map((point) => (
              <Cell
                key={point.month}
                fill={point.month === month ? "var(--primary)" : "var(--st-actual)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
