import {
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  type ScatterShapeProps,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MerchRangeBand } from "./grid-advanced-merch-review-ui";
import { type MerchLine } from "./grid-advanced-merch-review-model";
import { merchMoney, merchPercent } from "./grid-advanced-merch-review-state";

// Retains the actual free ReUI c-chart-2-based MerchRangeBand. Additional
// distributions extend the existing free ChartContainer/native Scatter pattern.
// Free c-tooltip-1 portals each actual point’s active tooltip past grid clipping.
// MIT (c) Keenthemes; keep components/reui/REUI-LICENSE.txt.
export type BrandPlotMetric = "weekly-net" | "net" | "margin" | "discount";
export type BrandPlotMode = "months" | "styles";
export type BrandPlotPoint = { id: string; label: string; value: number; x: number };
function BrandDot({
  formatValue,
  ...props
}: ScatterShapeProps & { formatValue: (value: number) => string }) {
  const point = props.payload as BrandPlotPoint;
  if (!point) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild tabIndex={-1}>
        <circle
          cx={props.cx}
          cy={props.cy}
          r={3.5}
          data-point-id={point.id}
          fill={point.value < 0 ? "var(--destructive)" : "var(--chart-2)"}
          fillOpacity={0.3}
          stroke={point.value < 0 ? "var(--destructive)" : "var(--chart-2)"}
        >
          <title>{point.label}</title>
        </circle>
      </TooltipTrigger>
      <TooltipContent
        className="brand-scorecard-point-tooltip"
        data-point-id={point.id}
        sideOffset={4}
        collisionPadding={8}
      >
        <strong>{point.label}</strong>
        <span>{formatValue(point.value)}</span>
      </TooltipContent>
    </Tooltip>
  );
}
export function BrandScorecardPlot({
  lines,
  months,
  mode,
  metric,
  label,
  domain,
  points,
  metricLabel,
}: {
  lines: MerchLine[];
  months: string[];
  mode: BrandPlotMode;
  metric: BrandPlotMetric;
  label: string;
  domain: [number, number];
  points: BrandPlotPoint[];
  metricLabel: string;
}) {
  if (mode === "months" && metric === "weekly-net")
    return <MerchRangeBand lines={lines} months={months} label={`${label} trading range`} />;
  const format = (value: number) =>
    mode === "months" && ["margin", "discount"].includes(metric)
      ? merchPercent(value)
      : merchMoney(value);
  const title = mode === "styles" ? "Recorded gross profit by product line" : metricLabel;
  return (
    <div
      className="brand-scorecard-plot"
      role="img"
      aria-label={`${label}: ${title}. ${points.length ? points.map((point) => `${point.label}: ${format(point.value)}`).join("; ") : "No recorded data"}`}
    >
      <ChartContainer
        className="brand-scorecard-plot__chart"
        initialDimension={{ width: 78, height: 140 }}
        config={{ value: { label: title, color: "var(--chart-2)" } }}
        aria-hidden="true"
      >
        <ScatterChart margin={{ top: 8, right: 0, bottom: 8, left: 0 }} accessibilityLayer={false}>
          <XAxis type="number" dataKey="x" domain={[0, 1]} hide />
          <YAxis type="number" dataKey="value" domain={domain} hide />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Scatter
            data={points}
            shape={(props) => <BrandDot {...props} formatValue={format} />}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ChartContainer>
      {!points.length && <span className="brand-scorecard-plot__empty">No recorded data</span>}
    </div>
  );
}
