import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceDot,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import type { DomainField } from "./grid-advanced-model-grid";
import {
  categoryQuarterHistory,
  readCategoryPeriod,
  readCategoryStock,
  type CategoryPeriod,
  type CategoryQuarter,
} from "./grid-advanced-category-margin-metrics";
import type { MerchLine } from "./grid-advanced-merch-review-model";
import { merchMoney, merchMonthLabel, merchPercent } from "./grid-advanced-merch-review-state";
import "./grid-advanced-category-margin-drivers.css";

// Extend the installed MIT ReUI c-chart-12 range/horizontal-bar composition
// and c-chart-13 Area/ChartContainer pattern. Native Recharts Scatter symbols
// encode real quarter totals; no proprietary SVG shape or fixture is reused.
export interface CategoryMarginDriverRow {
  id: string;
  label: string;
  lines: MerchLine[];
  scope?: boolean;
  children?: CategoryMarginDriverRow[];
}

const up = "var(--category-margin-driver-up)",
  down = "var(--category-margin-driver-down)",
  level = "var(--category-margin-driver-level)",
  fresh = "var(--category-margin-driver-new)";
const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const compactMoney = (cents: number) => compactCurrency.format(cents / 100);
const signedMoney = (cents: number) => `${cents > 0 ? "+" : ""}${merchMoney(cents)}`;
const signedRate = (bps: number) => `${bps > 0 ? "+" : ""}${merchPercent(bps)}`;
const periodName = (months: string[]) =>
  months.length
    ? `${merchMonthLabel(months[0])} to ${merchMonthLabel(months.at(-1)!)}`
    : "no selected months";
const quarterName = (quarter: string) => quarter.replace(/^(\d{4}) Q(\d)$/, "Q$2 $1");
function quarterCoverage(quarter: CategoryQuarter, lines: MerchLine[], endMonth: string) {
  const [year, quarterNumber] = quarter.quarter.split(" Q").map(Number);
  const calendar = [0, 1, 2].map(
    (index) => `${year}-${String((quarterNumber - 1) * 3 + index + 1).padStart(2, "0")}`,
  );
  const expected = calendar.filter((month) => month <= endMonth);
  return {
    calendarPartial: calendar.at(-1)! > endMonth,
    missingHistory: lines.some((line) =>
      expected.some((month) => !line.months.some((record) => record.month === month)),
    ),
  };
}
const salesColor = (period: CategoryPeriod, scope = false) =>
  scope
    ? fresh
    : period.netYoYBps === null
      ? fresh
      : period.netYoYBps > 0
        ? up
        : period.netYoYBps < 0
          ? down
          : level;

type SalesRange = { start: number; end: number; domain: [number, number] };

function SalesCell({
  row,
  period,
  range,
}: {
  row: CategoryMarginDriverRow;
  period: CategoryPeriod;
  range: SalesRange;
}) {
  if (!period.observed) return <span className="category-driver-empty">No recorded sales</span>;
  return (
    <div
      className="category-driver-cell"
      role="img"
      aria-label={`${row.label}: net sales ${merchMoney(period.netCents)}, ${periodName(period.months)}${period.complete ? "" : "; partial recorded history"}.`}
    >
      <ChartContainer
        className="category-driver-sales-plot aspect-auto"
        initialDimension={{ width: 266, height: 32 }}
        config={{ sales: { label: "Net sales", color: salesColor(period, row.scope) } }}
        aria-hidden="true"
        data-reui-chart="c-chart-12"
      >
        <BarChart
          data={[{ label: row.label, sales: [range.start, range.end], netCents: period.netCents }]}
          layout="vertical"
          accessibilityLayer={false}
          margin={{ top: 3, right: 54, bottom: 3, left: 0 }}
        >
          <XAxis type="number" domain={range.domain} hide allowDataOverflow />
          <YAxis type="category" dataKey="label" hide />
          <Bar dataKey="sales" fill="var(--color-sales)" barSize={16} isAnimationActive={false}>
            <LabelList
              dataKey="netCents"
              position="right"
              offset={5}
              formatter={(value) => compactMoney(Number(value))}
              fontSize={10}
              fill="var(--foreground)"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function YearCell({
  row,
  period,
  maximum,
}: {
  row: CategoryMarginDriverRow;
  period: CategoryPeriod;
  maximum: number;
}) {
  const value = period.netYoYBps;
  if (value === null) {
    const knownNew =
      period.complete && period.priorComplete && period.priorNetCents === 0 && period.netCents > 0;
    return (
      <span
        className="category-driver-empty"
        aria-label={`${row.label}: ${knownNew ? "no prior-year sales" : "comparable prior-year sales unavailable"}`}
      >
        {knownNew ? "New" : "—"}
      </span>
    );
  }
  return (
    <div
      className="category-driver-year"
      role="img"
      aria-label={`${row.label}: net sales ${signedRate(value)} versus the same months last year.`}
    >
      <span>{signedRate(value)}</span>
      <ChartContainer
        className="category-driver-year-plot aspect-auto"
        initialDimension={{ width: 28, height: 28 }}
        config={{ change: { label: "Net sales versus last year", color: salesColor(period) } }}
        aria-hidden="true"
        data-reui-chart="c-chart-12"
      >
        <BarChart
          data={[{ label: row.label, change: value }]}
          layout="vertical"
          accessibilityLayer={false}
          margin={{ top: 3, right: 1, bottom: 3, left: 1 }}
        >
          <XAxis type="number" domain={[-maximum, maximum]} hide allowDataOverflow />
          <YAxis type="category" dataKey="label" hide />
          <ReferenceLine x={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
          <Bar dataKey="change" fill="var(--color-change)" barSize={18} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function QuarterCell({
  row,
  axis,
  quarters,
  endMonth,
}: {
  row: CategoryMarginDriverRow;
  axis: CategoryQuarter[];
  quarters: CategoryQuarter[];
  endMonth: string | null;
}) {
  const lookup = new Map(quarters.map((quarter) => [quarter.quarter, quarter]));
  const points = axis.flatMap((slot, index) => {
    const quarter = lookup.get(slot.quarter);
    return quarter ? [{ ...quarter, index, lane: 0, magnitude: Math.abs(quarter.netCents) }] : [];
  });
  if (!points.length) return <span className="category-driver-empty">No recorded quarters</span>;
  const last = points.at(-1)!;
  const maximum = Math.max(1, ...points.map((point) => point.magnitude));
  const partial = points.filter((point) => !point.complete);
  const latestPartial = partial.at(-1);
  const latestCoverage = latestPartial
    ? quarterCoverage(latestPartial, row.lines, endMonth ?? latestPartial.endMonth)
    : null;
  const label = axis
    .map((slot) => {
      const quarter = lookup.get(slot.quarter);
      const coverage = quarter
        ? quarterCoverage(quarter, row.lines, endMonth ?? quarter.endMonth)
        : null;
      return quarter
        ? `${quarterName(quarter.quarter)} ${merchMoney(quarter.netCents)}${coverage?.calendarPartial ? `, partial quarter (${quarter.months} of 3 calendar months recorded)` : ""}${coverage?.missingHistory ? `, incomplete recorded line history (${quarter.months} of 3 calendar months recorded)` : ""}`
        : `${quarterName(slot.quarter)} unavailable`;
    })
    .join("; ");
  return (
    <div
      className="category-driver-quarters"
      role="img"
      aria-label={`${row.label}: net sales by recorded quarter. ${label}.`}
    >
      <ChartContainer
        className="category-driver-quarter-plot aspect-auto"
        initialDimension={{ width: 138, height: 28 }}
        config={{ sales: { label: "Quarterly net sales", color: level } }}
        aria-hidden="true"
      >
        <ScatterChart accessibilityLayer={false} margin={{ top: 3, right: 8, bottom: 3, left: 8 }}>
          <XAxis
            type="number"
            dataKey="index"
            domain={axis.length === 1 ? [-0.5, 0.5] : [0, axis.length - 1]}
            hide
          />
          <YAxis type="number" dataKey="lane" domain={[-1, 1]} hide />
          <ZAxis type="number" dataKey="magnitude" domain={[0, maximum]} range={[0, 130]} />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Scatter
            data={points.slice(0, -1)}
            shape="diamond"
            isAnimationActive={false}
            fill={level}
          >
            {points.slice(0, -1).map((point) => (
              <Cell key={point.quarter} fill={point.netCents < 0 ? down : level} />
            ))}
          </Scatter>
          <Scatter
            data={[last]}
            shape="circle"
            fill="var(--muted-foreground)"
            fillOpacity={0.7}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ChartContainer>
      {latestPartial && (
        <small className="category-driver-quarter-note">
          {latestCoverage?.calendarPartial ? "Partial" : "Incomplete"}:{" "}
          {quarterName(latestPartial.quarter)} ({latestPartial.months}/3)
          {partial.length > 1 ? ` · +${partial.length - 1}` : ""}
        </small>
      )}
    </div>
  );
}

function StockCell({
  row,
  months,
  maximumCover,
  cover,
}: {
  row: CategoryMarginDriverRow;
  months: string[];
  maximumCover: number;
  cover: boolean;
}) {
  const stock = readCategoryStock(row.lines, months);
  const value = cover ? stock?.coverWeeks : stock?.sellThroughBps;
  if (value === null || value === undefined || !stock?.observed)
    return <span className="category-driver-empty">—</span>;
  const text = cover
    ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: value < 10 ? 1 : 0, notation: value >= 1000 ? "compact" : "standard" }).format(value)} wk`
    : `${Math.round(value / 100)}%`;
  return (
    <div
      className={`category-driver-stock ${cover ? "category-driver-cover" : "category-driver-sell-through"}`}
      role="img"
      aria-label={`${row.label}: ${cover ? `stock cover ${value.toFixed(1)} weeks` : `sell-through ${merchPercent(value)}`}, ${merchMonthLabel(stock.month)}${stock.complete ? "" : "; partial recorded history"}.`}
    >
      <Progress
        value={Math.max(0, Math.min(100, cover ? (value / maximumCover) * 100 : value / 100))}
        className="category-driver-stock-progress"
        aria-hidden="true"
      />
      <span>{text}</span>
    </div>
  );
}

function PlanCell({ row, months }: { row: CategoryMarginDriverRow; months: string[] }) {
  const id = useId().replaceAll(":", "");
  const total = readCategoryPeriod(row.lines, months);
  const values = months.map((month) => {
    const period = readCategoryPeriod(row.lines, [month]);
    return { month, value: period.observed ? period.profitVarianceCents : null };
  });
  const measured = values.flatMap((point) => (point.value === null ? [] : [point.value]));
  if (!measured.length) return <span className="category-driver-empty">No recorded plan</span>;
  const low = Math.min(0, ...measured),
    high = Math.max(0, ...measured);
  const zero = high === low ? 0.5 : high / (high - low);
  const extrema = [Math.max(...measured), Math.min(...measured)]
    .filter((value, index, all) => value !== 0 && all.indexOf(value) === index)
    .map((value) => ({
      value,
      index: values.findIndex((point) => point.value === value),
      maximum: value === Math.max(...measured),
    }));
  return (
    <div
      className="category-driver-cell"
      role="img"
      aria-label={`${row.label}: gross profit versus target-margin sales plan, total ${signedMoney(total.profitVarianceCents)}; ${values.map((point) => `${merchMonthLabel(point.month)} ${point.value === null ? "unavailable" : signedMoney(point.value)}`).join("; ")}.`}
    >
      <ChartContainer
        className="category-driver-plan-plot aspect-auto"
        initialDimension={{ width: 192, height: 42 }}
        config={{ value: { label: "Gross profit versus plan", color: up } }}
        aria-hidden="true"
        data-reui-chart="c-chart-13"
      >
        <AreaChart
          data={values}
          accessibilityLayer={false}
          margin={{ top: 12, right: 8, bottom: 12, left: 8 }}
        >
          <defs>
            <linearGradient id={`${id}-plan`} x1="0" y1="0" x2="0" y2="1">
              <stop offset={zero} stopColor={up} />
              <stop offset={zero} stopColor={down} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" hide />
          <YAxis domain={low === high ? [-1, 1] : [low, high]} hide allowDataOverflow />
          <ReferenceLine
            y={0}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.5}
            label={
              low === high ? { value: "$0", position: "insideTopRight", fontSize: 10 } : undefined
            }
          />
          <Area
            type="linear"
            dataKey="value"
            baseValue={0}
            stroke={`url(#${id}-plan)`}
            fill={`url(#${id}-plan)`}
            fillOpacity={0.3}
            strokeWidth={1.2}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          {extrema.map((point) => (
            <ReferenceDot
              key={point.value}
              x={values[point.index].month}
              y={point.value}
              r={0}
              label={{
                value: `${point.value > 0 ? "+" : ""}${compactMoney(point.value)}`,
                position:
                  point.index === 0
                    ? point.maximum
                      ? "insideTopLeft"
                      : "insideBottomLeft"
                    : point.index === values.length - 1
                      ? point.maximum
                        ? "insideTopRight"
                        : "insideBottomRight"
                      : point.maximum
                        ? "top"
                        : "bottom",
                fontSize: 10,
                fill: "var(--muted-foreground)",
              }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

export function createCategoryMarginDriverFields<T extends CategoryMarginDriverRow>({
  rows,
  scopeLines,
  months,
  mobile,
}: {
  rows: T[];
  scopeLines: MerchLine[];
  months: string[];
  month: string;
  mobile: boolean;
}): DomainField<T>[] {
  const periods = new Map<string, CategoryPeriod>();
  const ranges = new Map<string, SalesRange>();
  const allRows: CategoryMarginDriverRow[] = [];
  const periodFor = (row: CategoryMarginDriverRow) => {
    let value = periods.get(row.id);
    if (!value) {
      value = readCategoryPeriod(row.lines, months);
      periods.set(row.id, value);
    }
    return value;
  };
  function visit(siblings: CategoryMarginDriverRow[]) {
    const contributions = siblings.filter((row) => !row.scope);
    let offset = 0;
    const spans = contributions.map((row) => {
      const start = offset;
      offset += periodFor(row).netCents;
      return { row, start, end: offset };
    });
    const domain: [number, number] = [
      Math.min(0, ...spans.flatMap((span) => [span.start, span.end])),
      Math.max(1, ...spans.flatMap((span) => [span.start, span.end])),
    ];
    for (const span of spans) ranges.set(span.row.id, { ...span, domain });
    for (const row of siblings) {
      allRows.push(row);
      if (row.scope) ranges.set(row.id, { start: 0, end: periodFor(row).netCents, domain });
      if (row.children?.length) visit(row.children);
    }
  }
  visit(rows);
  const maximumYear = Math.max(1, ...allRows.map((row) => Math.abs(periodFor(row).netYoYBps ?? 0)));
  const maximumCover = Math.max(
    1,
    ...allRows.map((row) => readCategoryStock(row.lines, months)?.coverWeeks ?? 0),
  );
  const quarterAxis = categoryQuarterHistory(scopeLines, months);
  const endMonth = readCategoryPeriod(scopeLines, months).endMonth;
  return [
    {
      id: "driver-net-sales",
      title: "Net Sales",
      size: mobile ? 240 : 282,
      value: (row) => (periodFor(row).observed ? periodFor(row).netCents : null),
      render: (row) => (
        <SalesCell
          row={row}
          period={periodFor(row)}
          range={
            ranges.get(row.id) ?? {
              start: 0,
              end: periodFor(row).netCents,
              domain: [0, Math.max(1, periodFor(row).netCents)],
            }
          }
        />
      ),
    },
    {
      id: "driver-vs-ly",
      title: "vs LY",
      size: 92,
      value: (row) => periodFor(row).netYoYBps,
      render: (row) => <YearCell row={row} period={periodFor(row)} maximum={maximumYear} />,
    },
    {
      id: "driver-by-quarter",
      title: "By Quarter",
      size: mobile ? 136 : 154,
      value: (row) =>
        categoryQuarterHistory(row.lines, months).find(
          (quarter) => quarter.quarter === quarterAxis.at(-1)?.quarter,
        )?.netCents ?? null,
      render: (row) => (
        <QuarterCell
          row={row}
          axis={quarterAxis}
          quarters={categoryQuarterHistory(row.lines, months)}
          endMonth={endMonth}
        />
      ),
    },
    {
      id: "driver-cover",
      title: "Cover",
      size: 86,
      value: (row) => readCategoryStock(row.lines, months)?.coverWeeks ?? null,
      render: (row) => <StockCell row={row} months={months} maximumCover={maximumCover} cover />,
    },
    {
      id: "driver-sell-through",
      title: "Sell-through",
      size: 87,
      value: (row) => readCategoryStock(row.lines, months)?.sellThroughBps ?? null,
      render: (row) => (
        <StockCell row={row} months={months} maximumCover={maximumCover} cover={false} />
      ),
    },
    {
      id: "driver-vs-plan",
      title: "vs Plan",
      size: mobile ? 176 : 208,
      value: (row) => (periodFor(row).observed ? periodFor(row).profitVarianceCents : null),
      render: (row) => <PlanCell row={row} months={months} />,
    },
  ];
}
