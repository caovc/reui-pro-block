/**
 * Actual free ReUI c-chart-12 horizontal bars and their ChartContainer are
 * extended with a plan marker. Lot positioning uses native Recharts Scatter;
 * none of the reviewed free c-chart-1..25 examples supplies a lot swarm.
 * Copyright 2025 Keenthemes Inc. MIT notice: components/reui/REUI-LICENSE.txt.
 */
import {
  Bar,
  BarChart,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  type ScatterShapeProps,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { InspectionLot } from "./grid-advanced-supplier-quality-model";

const LOT_COLORS = {
  Accepted: "var(--chart-1)",
  Review: "var(--chart-3)",
  Rejected: "var(--destructive)",
};
const lotConfig = {
  score: { label: "Quality score", color: "var(--chart-1)" },
} satisfies ChartConfig;
const planConfig = { value: { label: "Forecast", color: "var(--chart-1)" } } satisfies ChartConfig;
type LotPoint = InspectionLot & { lane: number };

export function LotDispositionKey() {
  return (
    <ul className="review-disposition-key" aria-label="Inspection disposition key">
      {Object.entries(LOT_COLORS).map(([label, color]) => (
        <li key={label}>
          <span aria-hidden="true" style={{ backgroundColor: color }} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function LotDot({
  onOpen,
  ...props
}: ScatterShapeProps & { onOpen: (lot: InspectionLot, opener: SVGCircleElement) => void }) {
  const lot = props.payload as LotPoint;
  if (!lot) return null;
  return (
    <circle
      cx={props.cx}
      cy={props.cy}
      r={Math.max(3.5, Math.min(8.5, Math.sqrt(Number(props.size ?? 60) / Math.PI)))}
      fill={LOT_COLORS[lot.disposition]}
      fillOpacity={0.8}
      stroke="var(--background)"
      strokeWidth={1}
      tabIndex={0}
      role="button"
      aria-label={`Review ${lot.id}: score ${lot.score}, ${lot.units} units, ${lot.disposition}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(lot, event.currentTarget);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onOpen(lot, event.currentTarget);
        }
      }}
    >
      <title>{`${lot.id} · ${lot.score}/100 · ${lot.units} units · ${lot.disposition}`}</title>
    </circle>
  );
}

export function LotSwarm({
  lots,
  onOpen,
}: {
  lots: InspectionLot[];
  onOpen: (lot: InspectionLot, opener: SVGCircleElement) => void;
}) {
  if (!lots.length) return <span className="review-muted">No inspected lots</span>;
  const points: LotPoint[] = lots.map((lot, index) => ({ ...lot, lane: ((index * 3) % 5) - 2 }));
  return (
    <ChartContainer
      config={lotConfig}
      className="review-lot-chart aspect-auto"
      initialDimension={{ width: 260, height: 64 }}
    >
      <ScatterChart
        margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
        accessibilityLayer={false}
      >
        <XAxis type="number" dataKey="score" domain={[0, 100]} hide />
        <YAxis type="number" dataKey="lane" domain={[-3, 3]} hide />
        <ZAxis type="number" dataKey="units" range={[40, 180]} />
        <ReferenceLine x={80} stroke="var(--border)" strokeDasharray="3 3" />
        <Scatter
          data={points}
          isAnimationActive={false}
          shape={(props: ScatterShapeProps) => <LotDot {...props} onOpen={onOpen} />}
        />
      </ScatterChart>
    </ChartContainer>
  );
}

export function PlanBullet({
  actual,
  target,
  label,
}: {
  actual: number;
  target: number;
  label: string;
}) {
  const maximum = Math.max(1, actual, target) * 1.1;
  return (
    <div role="img" aria-label={label}>
      <ChartContainer
        config={planConfig}
        className="review-plan-chart aspect-auto"
        initialDimension={{ width: 150, height: 28 }}
        aria-hidden="true"
      >
        <BarChart
          data={[{ name: "Forecast", value: actual }]}
          layout="vertical"
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
          accessibilityLayer={false}
        >
          <XAxis type="number" domain={[0, maximum]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Bar
            dataKey="value"
            fill="var(--chart-1)"
            radius={3}
            barSize={10}
            isAnimationActive={false}
          />
          {target > 0 && <ReferenceLine x={target} stroke="var(--foreground)" strokeWidth={2} />}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
