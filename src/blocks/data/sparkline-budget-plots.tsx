/**
 * FREE REUI c-chart-12 horizontal BarChart composition, extended with a signed
 * domain and reference dot for the budget pin. MIT, Keenthemes Inc. (2025).
 */
import { Bar, BarChart, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { sparkTones as c } from "./sparkline-data";

export function BudgetPin({ value }: { value: number }) {
  const color = value < 0 ? c.red : value < 25 ? c.amber : c.green;
  return (
    <ChartContainer
      config={{ value: { label: "Budget left", color } }}
      className="aspect-auto w-full"
      style={{ height: 24 }}
      role="img"
      aria-label={`Budget ${Math.abs(value)}% ${value < 0 ? "over" : "left"}`}
      data-reui-chart="c-chart-12"
    >
      <BarChart
        data={[{ name: "Budget", value }]}
        layout="vertical"
        margin={{ left: 4, right: 4, top: 0, bottom: 0 }}
        accessibilityLayer
      >
        <XAxis type="number" hide domain={[-50, 100]} />
        <YAxis type="category" hide dataKey="name" />
        <ReferenceLine
          segment={[
            { x: -50, y: "Budget" },
            { x: 100, y: "Budget" },
          ]}
          stroke="var(--muted)"
          strokeWidth={2}
        />
        <ReferenceLine x={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
        <ReferenceLine x={25} stroke={c.amber} strokeOpacity={0.6} />
        <Bar
          dataKey="value"
          fill={color}
          fillOpacity={0.15}
          barSize={2}
          isAnimationActive={false}
        />
        <ReferenceDot
          x={Math.max(-50, Math.min(100, value))}
          y="Budget"
          r={3.7}
          fill={color}
          stroke="var(--background)"
          strokeWidth={1.5}
        />
      </BarChart>
    </ChartContainer>
  );
}
