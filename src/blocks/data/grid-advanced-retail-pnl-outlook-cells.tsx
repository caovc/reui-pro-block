// Composes installed free ReUI ChartContainer, Select, Badge, IconTile and Button.
// ReUI free component MIT notices remain with their actual imported sources.
// All fixtures and confidence-category marks are original Bricklane demo content.
import type { CSSProperties } from "react";
import { Building2, CircleAlert, Layers3, Megaphone, Package, Truck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  pnlMonths,
  pnlSections,
  type PnlConfidence,
  type PnlRow,
  type PnlSectionId,
  type PnlVariance,
} from "./grid-advanced-retail-pnl-outlook-data";
import {
  formatPnlCompact,
  formatPnlNumber,
  formatPnlPercent,
} from "./grid-advanced-retail-pnl-outlook-model";

const seriesConfig = {
  actual: { label: "Closed actual", color: "var(--rpo-actual)" },
  forecast: { label: "Forecast", color: "var(--rpo-forecast)" },
  baseline: { label: "Comparison", color: "var(--rpo-baseline)" },
} satisfies ChartConfig;

const confidenceLabels: Record<PnlConfidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

// Decorative category signatures, not recorded time series or probabilities.
const confidenceMarks: Record<PnlConfidence, readonly number[]> = {
  high: [3, 3, 4, 4, 5, 5, 6, 7],
  medium: [4, 3, 4, 3, 4, 5, 6, 7],
  low: [5, 4, 5, 3, 4, 4, 5, 6],
};

function signedPercent(value: number | null, digits: number) {
  if (value === null) return "—";
  const formatted = formatPnlPercent(value, digits);
  return value > 0 && !formatted.startsWith("+") ? `+${formatted}` : formatted;
}

function signedCompact(value: number) {
  const formatted = formatPnlCompact(value);
  return value > 0 && !formatted.startsWith("+") ? `+${formatted}` : formatted;
}

function monthDomain(row: PnlRow): [number, number] {
  const values = [...row.values, ...row.baseline].filter(Number.isFinite);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  return [minimum, maximum === minimum ? minimum + 1 : maximum];
}

export function PnlAmount({
  value,
  strong = false,
  forecast = false,
}: {
  value: number;
  strong?: boolean;
  forecast?: boolean;
}) {
  return (
    <span
      className="rpo-amount"
      data-strong={strong || undefined}
      data-forecast={forecast || undefined}
      data-negative={value < 0 || undefined}
    >
      {formatPnlNumber(value)}
    </span>
  );
}

export function PnlVarianceCell({
  variance,
  compact = false,
  showDelta = false,
}: {
  variance: PnlVariance;
  compact?: boolean;
  showDelta?: boolean;
}) {
  return (
    <span className="rpo-variance-cell" data-status={variance.status}>
      <span className="rpo-variance-percent">
        {!compact && variance.status === "adverse" && <CircleAlert aria-hidden="true" />}
        {signedPercent(variance.percent, compact ? 0 : 1)}
      </span>
      {showDelta && <span className="rpo-variance-delta">{signedCompact(variance.delta)}</span>}
    </span>
  );
}

function ConfidenceValue({ value }: { value: PnlConfidence }) {
  const points = confidenceMarks[value].map((height, index) => ({ index, height }));
  return (
    <span className="rpo-confidence-value" data-confidence={value}>
      <ChartContainer
        className="rpo-confidence-chart"
        config={{ height: { label: "Confidence category mark", color: "currentColor" } }}
        initialDimension={{ width: 32, height: 16 }}
        aria-hidden="true"
      >
        <BarChart
          data={points}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          accessibilityLayer={false}
          barCategoryGap={1}
        >
          <XAxis dataKey="index" hide />
          <YAxis hide domain={[0, 8]} />
          <Bar dataKey="height" barSize={2} isAnimationActive={false}>
            {points.map((point) => (
              <Cell
                key={point.index}
                fill={point.index < 4 ? "var(--rpo-confidence-muted)" : "currentColor"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <Badge variant="outline" size="xs" className="rpo-confidence-label">
        {confidenceLabels[value]}
      </Badge>
    </span>
  );
}

export function PnlConfidenceCell({
  value,
  onChange,
  label,
}: {
  value: PnlConfidence;
  onChange?: (value: PnlConfidence) => void;
  label: string;
}) {
  if (!onChange) {
    return (
      <span className="rpo-confidence-cell" aria-label={`${label}: ${confidenceLabels[value]}`}>
        <ConfidenceValue value={value} />
      </span>
    );
  }
  return (
    <Select value={value} onValueChange={(next) => onChange(next as PnlConfidence)}>
      <SelectTrigger size="sm" className="rpo-confidence-trigger" aria-label={label}>
        <SelectValue>
          <ConfidenceValue value={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="reui-reference rpo-confidence-menu" align="start">
        {(["high", "medium", "low"] as const).map((confidence) => (
          <SelectItem key={confidence} value={confidence}>
            {confidenceLabels[confidence]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const sectionIcons = {
  revenue: Layers3,
  cogs: Package,
  fulfilment: Truck,
  marketing: Megaphone,
  operating: Building2,
};

export function PnlSectionMark({ section }: { section: PnlSectionId }) {
  const Icon = sectionIcons[section];
  return (
    <IconTile size="xs" variant="outline" className="rpo-section-mark" data-section={section}>
      <Icon aria-hidden="true" />
    </IconTile>
  );
}

export function PnlChartLegend({ name, compareLabel }: { name: string; compareLabel: string }) {
  return (
    <div className="rpo-chart-legend">
      <span>
        <span className="rpo-chart-legend-name">{name}</span>
        <span className="rpo-series-dot" data-series="actual" aria-hidden="true" />
      </span>
      <span>
        Forecast <span className="rpo-series-dot" data-series="forecast" aria-hidden="true" />
      </span>
      <span>
        {compareLabel} <span className="rpo-series-dot" data-series="baseline" aria-hidden="true" />
      </span>
    </div>
  );
}

export function PnlMonthChartCell({
  row,
  monthIndex,
  compareLabel,
  selected,
  onSelect,
}: {
  row: PnlRow;
  monthIndex: number;
  compareLabel: string;
  selected: boolean;
  onSelect: (monthIndex: number) => void;
}) {
  const month = pnlMonths[monthIndex];
  const value = row.values[monthIndex] ?? 0;
  const baseline = row.baseline[monthIndex] ?? 0;
  const domain = monthDomain(row);
  return (
    <Button
      type="button"
      variant="ghost"
      className="rpo-month-chart-button"
      aria-pressed={selected}
      aria-label={`${month.name} ${row.name}: ${formatPnlNumber(value)} thousand dollars; ${compareLabel} ${formatPnlNumber(baseline)}`}
      onClick={() => onSelect(monthIndex)}
    >
      <ChartContainer
        className="rpo-month-chart"
        config={{ ...seriesConfig, baseline: { ...seriesConfig.baseline, label: compareLabel } }}
        initialDimension={{ width: 52, height: 144 }}
        aria-hidden="true"
      >
        <BarChart
          data={[{ month: month.short, value, baseline }]}
          margin={{ top: 22, right: 0, bottom: 0, left: 0 }}
          accessibilityLayer={false}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
          <XAxis xAxisId="baseline" hide dataKey="month" />
          <XAxis xAxisId="value" hide dataKey="month" />
          <YAxis hide domain={domain} allowDataOverflow />
          <Bar
            xAxisId="baseline"
            dataKey="baseline"
            fill="var(--color-baseline)"
            barSize={28}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            xAxisId="value"
            dataKey="value"
            fill={month.forecast ? "var(--color-forecast)" : "var(--color-actual)"}
            barSize={12}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </Button>
  );
}

export function PnlOutlookChart({ row, compareLabel }: { row: PnlRow; compareLabel: string }) {
  const forecast = row.outlook - row.closed;
  const positive = Math.max(0, row.closed) + Math.max(0, forecast);
  const negative = Math.min(0, row.closed) + Math.min(0, forecast);
  const domain: [number, number] = [
    Math.min(0, negative, row.baselineTotal),
    Math.max(1, positive, row.baselineTotal),
  ];
  return (
    <ChartContainer
      className="rpo-outlook-chart"
      config={{ ...seriesConfig, baseline: { ...seriesConfig.baseline, label: compareLabel } }}
      initialDimension={{ width: 92, height: 144 }}
      role="img"
      aria-label={`Outlook ${formatPnlCompact(row.outlook)}; ${compareLabel} ${formatPnlCompact(row.baselineTotal)}; closed actual ${formatPnlCompact(row.closed)}`}
    >
      <BarChart
        data={[{ name: "Outlook", actual: row.closed, forecast, baseline: row.baselineTotal }]}
        margin={{ top: 22, right: 0, bottom: 0, left: 0 }}
        accessibilityLayer={false}
        stackOffset="sign"
      >
        <XAxis xAxisId="baseline" hide dataKey="name" />
        <XAxis xAxisId="outlook" hide dataKey="name" />
        <YAxis hide domain={domain} allowDataOverflow />
        <Bar
          xAxisId="baseline"
          dataKey="baseline"
          fill="var(--color-baseline)"
          barSize={40}
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        />
        <Bar
          xAxisId="outlook"
          dataKey="actual"
          stackId="outlook"
          fill="var(--color-actual)"
          barSize={16}
          isAnimationActive={false}
        />
        <Bar
          xAxisId="outlook"
          dataKey="forecast"
          stackId="outlook"
          fill="var(--color-forecast)"
          barSize={16}
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function PnlVarianceGauge({ row, compareLabel }: { row: PnlRow; compareLabel: string }) {
  const direction = pnlSections.find((section) => section.id === row.section)?.read ?? "higher";
  const percent = row.variance.percent;
  const pointer =
    percent === null ? null : ((Math.max(-15, Math.min(15, percent)) + 15) / 30) * 100;
  return (
    <div className="rpo-variance-gauge" data-status={row.variance.status}>
      <span className="rpo-variance-gauge-label">
        {row.name} vs {compareLabel}
      </span>
      <span className="rpo-variance-gauge-value">
        <strong>{signedPercent(percent, 1)}</strong>
        <span>{signedCompact(row.variance.delta)}</span>
      </span>
      <div
        className="rpo-variance-scale"
        style={pointer === null ? undefined : ({ "--rpo-pointer": `${pointer}%` } as CSSProperties)}
      >
        <ChartContainer
          className="rpo-variance-scale-chart"
          config={{ value: { label: "Variance scale" } }}
          initialDimension={{ width: 174, height: 8 }}
          aria-hidden="true"
        >
          <BarChart
            layout="vertical"
            data={[{ name: "Scale", negative: 10, centre: 10, positive: 10 }]}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            accessibilityLayer={false}
          >
            <XAxis type="number" hide domain={[0, 30]} />
            <YAxis type="category" hide dataKey="name" />
            <Bar
              dataKey="negative"
              stackId="scale"
              fill={direction === "higher" ? "var(--destructive)" : "var(--success)"}
              radius={4}
              isAnimationActive={false}
            />
            <Bar dataKey="centre" stackId="scale" fill="var(--muted)" isAnimationActive={false} />
            <Bar
              dataKey="positive"
              stackId="scale"
              fill={direction === "higher" ? "var(--success)" : "var(--destructive)"}
              radius={4}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        {pointer !== null && <span className="rpo-variance-pointer" aria-hidden="true" />}
      </div>
      <span className="rpo-variance-scale-labels" aria-hidden="true">
        <span>-15%</span>
        <span>-5%</span>
        <span>+5%</span>
        <span>+15%</span>
      </span>
    </div>
  );
}
