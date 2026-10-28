import { ChevronDown, ChevronRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";

// Independent Bricklane consumer composition of the existing ReUI free primitives.
// Keep their MIT attribution in components/reui/REUI-LICENSE.txt and project notices.
// Free reference: registry-reui/bases/base/components/chart/c-chart-2.tsx.
// Its grouped-bar composition is adapted here to a single signed series; the free
// example does not implement scorecard rules, a zero reference, or perspective rails.

export type ScorecardCellStatus = "track" | "watch" | "off" | "unscored";

const statusLabels: Record<ScorecardCellStatus, string> = {
  track: "On Track",
  watch: "Watch",
  off: "Off Track",
  unscored: "Not scored",
};

const changeConfig = {
  value: { label: "Progress change", color: "var(--ss14-positive, var(--color-emerald-600))" },
} satisfies ChartConfig;

function finite(value: number | null): number | null {
  return value !== null && Number.isFinite(value) ? value : null;
}

function points(value: number): string {
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function changeTone(value: number | null): "positive" | "negative" | "neutral" | "unscored" {
  return value === null ? "unscored" : value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
}

export type ScorecardChangeCellProps = {
  /** Signed monthly changes in progress points, in chronological order; null is missing. */
  values: readonly (number | null)[];
  change: number | null;
  label: string;
};

export function ScorecardChangeCell({ values, change, label }: ScorecardChangeCellProps) {
  const current = finite(change);
  const data = values.map((value, index) => ({ month: index + 1, value: finite(value) }));
  const measured = data.flatMap(({ value }) => (value === null ? [] : [value]));
  const low = Math.min(0, ...measured);
  const high = Math.max(0, ...measured);
  // Only an entirely zero/missing series needs an artificial non-degenerate extent.
  // Mixed signs retain their true relative scale rather than a symmetric 50/50 split.
  const domain: [number, number] = low === high ? [-1, 1] : [low, high];
  const tone = changeTone(current);
  const Trend = current === null || current === 0 ? Minus : current > 0 ? TrendingUp : TrendingDown;
  const summary = data
    .map(
      ({ month, value }) =>
        `Month ${month}: ${value === null ? "no observation" : `${points(value)} pts`}`,
    )
    .join("; ");

  return (
    <div
      className="ss14-change-cell inline-flex items-center gap-1 whitespace-nowrap"
      data-tone={tone}
      role="group"
      aria-label={`${label}. ${current === null ? "No current change" : `${points(current)} points since last month`}. ${summary}`}
    >
      <ChartContainer
        config={changeConfig}
        className="ss14-change-chart aspect-auto shrink-0"
        style={{ width: 34, height: 16 }}
        initialDimension={{ width: 34, height: 16 }}
      >
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 1, right: 0, bottom: 1, left: 0 }}
          barCategoryGap={0}
        >
          <XAxis dataKey="month" hide padding={{ left: 0, right: 0 }} />
          <YAxis type="number" domain={domain} hide allowDataOverflow />
          <ReferenceLine y={0} stroke="var(--ss14-zero-axis, var(--border))" strokeWidth={0.5} />
          <ChartTooltip
            cursor={false}
            allowEscapeViewBox={{ x: true, y: true }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => `Month ${payload[0]?.payload?.month ?? ""}`}
                formatter={(value) => <span>{points(Number(value))} pts</span>}
              />
            }
          />
          <Bar dataKey="value" barSize={2} minPointSize={1} radius={0.5}>
            {data.map(({ month, value }) => (
              <Cell
                key={month}
                fill={
                  value === null
                    ? "transparent"
                    : value > 0
                      ? "var(--ss14-positive, var(--color-emerald-600))"
                      : value < 0
                        ? "var(--ss14-negative, var(--color-red-500))"
                        : "var(--ss14-neutral, var(--color-amber-500))"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <Trend className="ss14-change-icon size-3.5 shrink-0" aria-hidden="true" />
      <span className="ss14-change-value tabular-nums">
        {current === null ? "–" : points(current)}
      </span>
    </div>
  );
}

export type ScorecardProgressCellProps = {
  score: number | null;
  status: ScorecardCellStatus;
};

export function ScorecardProgressCell({ score, status }: ScorecardProgressCellProps) {
  const value = finite(score);
  const tone = value === null ? "unscored" : status;

  return (
    <span
      className="ss14-progress-cell tabular-nums"
      data-status={tone}
      aria-label={value === null ? "Not scored" : `${Math.round(value)}%, ${statusLabels[tone]}`}
    >
      {value === null ? "–" : `${Math.round(value)}%`}
    </span>
  );
}

export type ScorecardPerspectiveRailProps = {
  title: string;
  score: number | null;
  status: ScorecardCellStatus;
  /** Percentage points of company score, not a fraction between zero and one. */
  weight: number;
  kpiCount: number;
  offTrackCount: number;
  description: string;
  /** Actual visible native table rows in this perspective, after filtering/expansion. */
  rowCount: number;
  collapsed: boolean;
  onToggle: () => void;
};

export function ScorecardPerspectiveRail({
  title,
  score,
  status,
  weight,
  kpiCount,
  offTrackCount,
  description,
  rowCount,
  collapsed,
  onToggle,
}: ScorecardPerspectiveRailProps) {
  const value = finite(score);
  const visibleRows = Number.isFinite(rowCount) ? Math.max(0, Math.floor(rowCount)) : 0;
  const ToggleIcon = collapsed ? ChevronRight : ChevronDown;

  return (
    <div
      className="ss14-perspective-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: visibleRows * 28,
      }}
      data-status={status}
    >
      <section
        className="ss14-perspective-rail space-y-2.5 px-3 py-2.5"
        style={{ position: "sticky", top: 28 }}
        aria-label={`${title} perspective`}
      >
        <div className="ss14-perspective-heading flex min-w-0 items-center gap-1">
          <span className="min-w-0 flex-1 text-sm font-medium">{title}</span>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="ss14-perspective-toggle"
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
            onClick={onToggle}
          >
            <ToggleIcon aria-hidden="true" />
          </Button>
        </div>
        <div className="ss14-perspective-score flex items-center justify-between gap-1">
          <ScorecardProgressCell score={value} status={status} />
          <span className="text-xs text-muted-foreground tabular-nums">{weight}% of score</span>
        </div>
        <Progress
          className="ss14-perspective-progress h-1"
          value={value === null ? null : Math.min(100, Math.max(0, value))}
          aria-label={`${title} progress`}
          aria-valuetext={
            value === null ? "Not scored" : `${Math.round(value)}%, ${statusLabels[status]}`
          }
        />
        <div className="ss14-perspective-counts flex items-center gap-1 text-xs">
          <Badge
            variant={offTrackCount > 0 ? "destructive" : "secondary"}
            className="ss14-perspective-off-track h-auto rounded-sm px-1 py-0"
          >
            {offTrackCount} off track
          </Badge>
          <span className="text-muted-foreground">of {kpiCount}</span>
        </div>
        <p className="ss14-perspective-description text-xs leading-4 text-muted-foreground">
          {description}
        </p>
      </section>
    </div>
  );
}
