import type { CSSProperties } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ComposedChart,
  Rectangle,
  ReferenceLine,
  Scatter,
  XAxis,
  YAxis,
  type BarShapeProps,
  type ScatterShapeProps,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { STORE_DEMO_POLICY, STORE_MONTHS } from "./grid-advanced-store-kpi-model";

// Adapt actual free ReUI c-chart-4 dotted bars and c-chart-12 horizontal bars.
// ChartContainer/Progress are the same shadcn support primitives used by those
// free examples, not new ReUI APIs. Recharts owns scales and mark positions;
// dot/tick shapes and explicit display policies are Bricklane extensions.
const matrixConfig = {
  value: { label: "Monthly value", color: "var(--matrix-color)" },
} satisfies ChartConfig;
const gapConfig = {
  value: { label: "Difference", color: "var(--store-kpi-gap-positive, #bce8fb)" },
} satisfies ChartConfig;
const returnsConfig = {
  rate: { label: "Return rate", color: "var(--store-kpi-return-healthy, #87c900)" },
} satisfies ChartConfig;

function MonthDotShape(props: BarShapeProps) {
  const x = Number(props.x);
  const y = Number(props.y);
  const width = Number(props.width);
  const height = Number(props.height);
  const levels = Math.max(0, Math.min(9, Math.round(Number(props.value))));
  if (![x, y, width, height, levels].every(Number.isFinite) || !levels || height <= 0) return null;
  const columnStep = width / 3;
  const rowStep = height / levels;
  return (
    <g fill={props.fill} fillOpacity={props.fillOpacity}>
      {Array.from({ length: levels * 3 }, (_, dot) => (
        <circle
          key={dot}
          cx={x + ((dot % 3) + 0.5) * columnStep}
          cy={y + height - (Math.floor(dot / 3) + 0.75) * rowStep}
          r={1.25}
        />
      ))}
    </g>
  );
}

export function MonthMatrix({
  values,
  month,
  onMonthChange,
  label,
  valueText,
  color,
}: {
  values: (number | null)[];
  month: number;
  onMonthChange: (month: number) => void;
  label: string;
  valueText: string;
  color: string;
}) {
  const maximum = Math.max(1, ...values.filter((value): value is number => value !== null));
  const data = values.map((value, index) => ({
    month: index,
    // Preserve original mark quantization: null draws nothing, while numeric
    // zero has one dot level. Underlying values and month state are unchanged.
    levels: value === null ? 0 : Math.max(1, Math.round((value / maximum) * 9)),
    rawValue: value,
  }));
  return (
    <div className="store-kpi-matrix" style={{ "--matrix-color": color } as CSSProperties}>
      <ChartContainer
        config={matrixConfig}
        className="store-kpi-native-chart store-kpi-matrix-chart aspect-auto"
        initialDimension={{ width: 168, height: 40 }}
        aria-hidden="true"
      >
        <BarChart
          data={data}
          accessibilityLayer={false}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap="7.142857%"
        >
          <XAxis dataKey="month" hide padding={{ left: 0, right: 0 }} />
          <YAxis type="number" domain={[0, 10]} hide allowDataOverflow />
          <Bar
            dataKey="levels"
            fill="var(--color-value)"
            shape={MonthDotShape}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.month} fillOpacity={entry.month <= month ? 1 : 0.22} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <Slider
        min={0}
        max={11}
        step={1}
        value={[month]}
        onValueChange={([next]) => onMonthChange(next)}
        aria-label={label}
        aria-valuetext={STORE_MONTHS[month].label + ", " + valueText}
        className="store-kpi-month-slider"
      />
    </div>
  );
}

export function GapBar({
  value,
  label = "versus goal",
  emptyLabel = "No goal",
  suffix = "%",
  digits = 1,
}: {
  value: number | null;
  label?: string;
  emptyLabel?: string;
  suffix?: string;
  digits?: number;
}) {
  if (value === null) return <span className="store-kpi-empty">{emptyLabel}</span>;
  // Original display cap: 4% of the plot per unit, capped at48%. This fixed
  // signed native scale leaves the same2% edge; the text retains the raw value.
  const plottedValue = Math.max(-12, Math.min(12, value));
  return (
    <div className="store-kpi-gap" aria-label={value.toFixed(digits) + suffix + " " + label}>
      <span>
        {value > 0 ? "+" : ""}
        {value.toFixed(digits)}
        {suffix}
      </span>
      <ChartContainer
        config={gapConfig}
        className="store-kpi-native-chart store-kpi-gap-plot aspect-auto"
        initialDimension={{ width: 30, height: 24 }}
        aria-hidden="true"
      >
        <BarChart
          layout="vertical"
          data={[{ name: "difference", value: plottedValue }]}
          accessibilityLayer={false}
          margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="number" domain={[-12.5, 12.5]} hide allowDataOverflow />
          <YAxis type="category" dataKey="name" hide />
          <ReferenceLine x={0} stroke="var(--muted-foreground)" strokeOpacity={0.45} />
          <Bar
            dataKey="value"
            radius={0}
            isAnimationActive={false}
            fill={
              value >= 0
                ? "var(--store-kpi-gap-positive, #bce8fb)"
                : "var(--store-kpi-gap-negative, #ffd2a5)"
            }
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function ValueBar({
  value,
  maximum,
  label,
}: {
  value: number | null;
  maximum: number;
  label: string;
}) {
  if (value === null) return <span className="store-kpi-empty">No sales</span>;
  return (
    <div className="store-kpi-value-bar">
      <Progress
        aria-hidden="true"
        value={Math.min(100, Math.max(0, (value / Math.max(1, maximum)) * 100))}
        className="store-kpi-native-progress"
      />
      <span>{label}</span>
    </div>
  );
}

export function ReturnRate({ value }: { value: number | null }) {
  if (value === null) return <span className="store-kpi-empty">No sales</span>;
  const status =
    value > STORE_DEMO_POLICY.returnDangerPercent
      ? "is-danger"
      : value > STORE_DEMO_POLICY.returnWarningPercent
        ? "is-warning"
        : "is-healthy";
  return (
    <span className={"store-kpi-return-rate " + status}>
      <i aria-hidden="true" />
      {value.toFixed(1)}%
    </span>
  );
}

export function KpiUpCount({ value }: { value: number | null }) {
  if (value === null) return <span className="store-kpi-empty">No sales</span>;
  return (
    <div className="store-kpi-up" role="img" aria-label={value + " of 7 KPIs improving"}>
      <Progress
        aria-hidden="true"
        value={Math.min(100, Math.max(0, (value / 7) * 100))}
        className="store-kpi-native-progress"
      />
      <span>{value}</span>
    </div>
  );
}

function ReturnStemShape(props: BarShapeProps) {
  const x = Number(props.x);
  const y = Number(props.y);
  const height = Number(props.height);
  if (![x, y, height].every(Number.isFinite)) return null;
  return <Rectangle x={x} y={y} width={1} height={height} fill="var(--border)" />;
}

function ReturnTickShape(props: ScatterShapeProps & { fill?: string }) {
  const x = Number(props.cx);
  const y = Number(props.cy);
  if (![x, y].every(Number.isFinite)) return null;
  // Native Scatter owns cx/cy. Drawing the2px tick upward keeps a real zero
  // inside the viewport, matching the original bottom-positioned mark.
  return <Rectangle x={x - 3} y={y - 2} width={6} height={2} fill={props.fill} />;
}

export function ReturnsHistory({ values }: { values: (number | null)[] }) {
  if (values.every((value) => value === null)) {
    return <span className="store-kpi-empty">No returns yet</span>;
  }
  const label =
    "Return rate by month: " +
    values.map((value) => (value === null ? "No sales" : value.toFixed(1) + "%")).join(", ");
  const data = values.map((value, index) => ({
    month: index,
    stem: 100,
    // Six original positions and the original95% mark cap; raw pooled rates
    // remain in the accessible label. Missing observations are not zeroes.
    rate: value === null ? null : Math.min(95, value * 8),
    color:
      value !== null && value > STORE_DEMO_POLICY.returnDangerPercent
        ? "var(--store-kpi-return-danger, #ff2556)"
        : value !== null && value > STORE_DEMO_POLICY.returnWarningPercent
          ? "var(--store-kpi-return-warning, #ffa600)"
          : "var(--store-kpi-return-healthy, #87c900)",
  }));
  const observations = data.filter((entry) => entry.rate !== null);
  return (
    <div className="store-kpi-return-history" role="img" aria-label={label}>
      <ChartContainer
        config={returnsConfig}
        className="store-kpi-native-chart store-kpi-history-chart aspect-auto"
        initialDimension={{ width: 66, height: 24 }}
        aria-hidden="true"
      >
        <ComposedChart
          data={data}
          accessibilityLayer={false}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="category" dataKey="month" hide padding={{ left: 0, right: 0 }} />
          <YAxis type="number" dataKey="rate" domain={[0, 100]} hide allowDataOverflow />
          <Bar dataKey="stem" shape={ReturnStemShape} isAnimationActive={false} />
          <Scatter
            data={observations}
            dataKey="rate"
            shape={ReturnTickShape}
            isAnimationActive={false}
          >
            {observations.map((entry) => (
              <Cell key={entry.month} fill={entry.color} />
            ))}
          </Scatter>
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
