import { useId, type CSSProperties, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  type ScatterShapeProps,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type MerchLine, type MerchPromotion } from "./grid-advanced-merch-review-model";
import {
  categoryQuarterHistory,
  readCategoryPeriod,
  readCategoryStock,
} from "./grid-advanced-category-margin-metrics";
import { merchMoney, merchMonthLabel, merchPercent } from "./grid-advanced-merch-review-state";
import "./grid-advanced-category-margin-overview.css";

// Actual free ReUI c-chart-2 stacked Bar/ChartContainer/Tooltip composition.
// Monthly markers extend the native Scatter composition in review-charts;
// the free examples do not provide a multi-promotion month rail.
// MIT (c) Keenthemes; keep components/reui/REUI-LICENSE.txt.
export type CategoryMarginOverviewProps = {
  scopeLabel: string;
  parentLabel: string | null;
  lines: MerchLine[];
  parentLines: MerchLine[];
  months: string[];
  month: string;
  mode?: "months" | "drivers";
  children?: ReactNode;
};

const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const money = (cents: number) => compactMoney.format(cents / 100);
const signedRate = (bps: number | null) =>
  bps === null ? "—" : `${bps > 0 ? "+" : ""}${merchPercent(bps)}`;
const signedBps = (bps: number | null) => (bps === null ? "—" : `${bps > 0 ? "+" : ""}${bps}`);
const discountColor = (bps: number) =>
  bps <= 1200 ? "var(--chart-4)" : bps <= 1400 ? "var(--chart-3)" : "var(--destructive)";

type PromotionPoint = MerchPromotion & {
  lineName: string;
  position: number;
  lane: number;
};
function PromotionDot(props: ScatterShapeProps) {
  const point = props.payload as PromotionPoint;
  if (!point) return null;
  return (
    <circle
      cx={props.cx}
      cy={props.cy}
      r={3.1}
      fill={discountColor(point.discountBps)}
      stroke={discountColor(point.discountBps)}
      strokeWidth={0}
    >
      <title>{`${point.lineName}: ${point.label}, ${merchMonthLabel(point.month)}, ${merchPercent(point.discountBps)} off`}</title>
    </circle>
  );
}

function PeriodPromotions({ lines, months }: { lines: MerchLine[]; months: string[] }) {
  const points: PromotionPoint[] = months.flatMap((month, index) => {
    const offers = lines.flatMap((line) =>
      line.promotions
        .filter((offer) => offer.month === month)
        .map((offer) => ({
          ...offer,
          lineName: line.name,
        })),
    );
    return offers.map((offer, rank) => ({
      ...offer,
      // Small offsets group marks within their recorded month; no day is implied.
      position: index + ((rank % 5) - Math.min(offers.length - 1, 4) / 2) * 0.12,
      lane: 1 + Math.floor(rank / 5),
    }));
  });
  const maximumLane = Math.max(4, ...points.map((point) => Math.abs(point.lane) + 1));
  return (
    <div className="category-margin-overview__promotions">
      <ChartContainer
        config={{ promotion: { label: "Recorded promotion", color: "var(--chart-3)" } }}
        className="category-margin-overview__promotion-chart"
        initialDimension={{ width: Math.max(1, months.length) * 68, height: 70 }}
        role="img"
        aria-label={`${points.length} recorded promotions grouped by month; ${points.length} in the selected scope`}
      >
        <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }} accessibilityLayer={false}>
          <XAxis
            type="number"
            dataKey="position"
            domain={[-0.5, Math.max(0.5, months.length - 0.5)]}
            hide
          />
          <YAxis type="number" dataKey="lane" domain={[-maximumLane * 1.5, maximumLane]} hide />
          <ReferenceLine
            y={0}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.35}
            strokeDasharray="2 2"
          />
          <ChartTooltip
            cursor={false}
            content={(props) => (
              <ChartTooltipContent
                active={props.active}
                payload={props.payload?.slice(0, 1)}
                hideLabel
                formatter={(_value, _name, item) => {
                  const point = item.payload as PromotionPoint;
                  return (
                    <div className="category-margin-overview__promotion-detail">
                      <strong>{point.lineName}</strong>
                      <span>
                        {point.label} · {merchMonthLabel(point.month)}
                      </span>
                      <span>{merchPercent(point.discountBps)} off</span>
                    </div>
                  );
                }}
              />
            )}
          />
          <Scatter
            data={points}
            shape={(props) => <PromotionDot {...props} />}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ChartContainer>
      <ul className="sr-only">
        {points.map((point) => (
          <li key={point.id}>
            {point.lineName}: {point.label}, {merchMonthLabel(point.month)},{" "}
            {merchPercent(point.discountBps)} off
          </li>
        ))}
      </ul>
    </div>
  );
}

function DriverSummaries({ lines, months }: { lines: MerchLine[]; months: string[] }) {
  const descriptionId = useId();
  const period = readCategoryPeriod(lines, months);
  const quarters = categoryQuarterHistory(lines, months);
  const latest = quarters.at(-1);
  const stock = readCategoryStock(lines, months);
  return (
    <div className="category-margin-overview__drivers">
      <section
        className="category-margin-overview__driver category-margin-overview__driver--sales"
        aria-label="Selected-period net sales"
      >
        <div className="category-margin-overview__caption">Net Sales, {months.length} Months</div>
        <div className="category-margin-overview__driver-value">
          <strong>{period.observed ? money(period.netCents) : "—"}</strong>
          <span
            className="category-margin-overview__change"
            data-negative={(period.netYoYBps !== null && period.netYoYBps < 0) || undefined}
            data-positive={(period.netYoYBps !== null && period.netYoYBps > 0) || undefined}
          >
            {signedRate(period.netYoYBps)}
          </span>
        </div>
        {period.netYoYBps === null && (
          <span className="sr-only">Prior-year period unavailable</span>
        )}
        <ul className="category-margin-overview__driver-key" aria-label="Year-over-year sales key">
          {["Up", "Level", "Down", "New"].map((label) => (
            <li key={label}>
              <span data-tone={label.toLowerCase()} />
              {label}
            </li>
          ))}
        </ul>
      </section>
      <section
        className="category-margin-overview__driver category-margin-overview__driver--quarter"
        aria-label="Recorded quarterly sales"
      >
        <div className="category-margin-overview__caption">
          Sales, {latest?.quarter ?? "No quarter"}
        </div>
        <div className="category-margin-overview__driver-value">
          <strong>{latest ? money(latest.netCents) : "—"}</strong>
          {latest && !latest.complete && (
            <span className="category-margin-overview__driver-note">
              {latest.months < 3
                ? `${latest.months} recorded ${latest.months === 1 ? "month" : "months"}`
                : "Partial line history"}
            </span>
          )}
        </div>
        <div className="category-margin-overview__driver-foot">
          {quarters.length ? `${quarters[0].quarter} to ${latest!.quarter}` : "No recorded history"}
        </div>
      </section>
      <section
        className="category-margin-overview__driver category-margin-overview__driver--stock"
        aria-label="Selected final-month stock"
      >
        <div className="category-margin-overview__caption">
          Stock, {stock ? merchMonthLabel(stock.month) : "No month"}
        </div>
        <div className="category-margin-overview__driver-value">
          <strong>
            {stock?.coverWeeks === null || !stock?.observed
              ? "—"
              : `${stock.coverWeeks.toFixed(1)} wk`}
          </strong>
          <span>
            {merchPercent(stock?.sellThroughBps ?? null)}{" "}
            <span className="category-margin-overview__caption">sell-through</span>
          </span>
        </div>
        <ul className="category-margin-overview__driver-key">
          <li>
            <span data-tone="new" />
            Cover
          </li>
          <li>
            <span data-tone="up" />
            Sell-through
          </li>
        </ul>
      </section>
      <section
        className="category-margin-overview__driver category-margin-overview__driver--plan"
        aria-label="Gross margin versus derived plan"
        aria-describedby={descriptionId}
      >
        <div className="category-margin-overview__caption">Margin vs Plan</div>
        <div className="category-margin-overview__driver-value">
          <strong>{period.observed ? money(period.profitVarianceCents) : "—"}</strong>
          <span
            className="category-margin-overview__change"
            data-negative={
              (period.rateVarianceBps !== null && period.rateVarianceBps < 0) || undefined
            }
            data-positive={
              (period.rateVarianceBps !== null && period.rateVarianceBps > 0) || undefined
            }
          >
            {signedBps(period.rateVarianceBps)}{" "}
            <span className="category-margin-overview__caption">bps on rate</span>
          </span>
        </div>
        <p id={descriptionId} className="sr-only">
          Planned gross profit is each recorded net-sales plan multiplied by its line's target
          margin rate, rounded to cents. Variance compares recorded gross profit with that derived
          plan.
        </p>
        <ul className="category-margin-overview__driver-key">
          <li>
            <span data-tone="up" />
            Over
          </li>
          <li>
            <span data-tone="down" />
            Under
          </li>
          <li>│ Month</li>
        </ul>
      </section>
    </div>
  );
}

export function CategoryMarginOverview({
  scopeLabel,
  parentLabel,
  lines,
  parentLines,
  months,
  month,
  mode = "months",
  children,
}: CategoryMarginOverviewProps) {
  const selected = readCategoryPeriod(lines, months);
  const parent = readCategoryPeriod(parentLines, months);
  const scopedMonths = new Set(months);
  const promotions = lines.flatMap((line) =>
    line.promotions.filter((offer) => scopedMonths.has(offer.month)),
  );
  const discounts = [...new Set(promotions.map((offer) => offer.discountBps))].sort(
    (a, b) => a - b,
  );
  const groups = new Map<string, { label: string; lines: MerchLine[] }>();
  const byDepartment =
    parentLabel === null && new Set(lines.map((line) => line.department)).size > 1;
  for (const line of lines) {
    const key = byDepartment ? line.department : line.id;
    const group = groups.get(key) ?? {
      label: byDepartment ? line.department : line.name,
      lines: [],
    };
    group.lines.push(line);
    groups.set(key, group);
  }
  const mix = [...groups]
    .map(([id, group]) => ({
      id,
      label: group.label,
      netCents: readCategoryPeriod(group.lines, months).netCents,
    }))
    .filter((group) => group.netCents > 0)
    .sort((a, b) => b.netCents - a.netCents);
  const leading = mix[0];
  const mixConfig = Object.fromEntries(
    mix.map((group, index) => [
      group.id,
      {
        label: group.label,
        color:
          index === 0
            ? "color-mix(in oklch, var(--foreground) 70%, transparent)"
            : "color-mix(in oklch, var(--foreground) 15%, transparent)",
      },
    ]),
  );
  const years = months.reduce<{ year: string; count: number }[]>((groups, month) => {
    const year = month.slice(0, 4);
    if (groups.at(-1)?.year === year) groups.at(-1)!.count++;
    else groups.push({ year, count: 1 });
    return groups;
  }, []);
  const share =
    parent.netCents > 0 ? Math.round((selected.netCents / parent.netCents) * 10000) : null;
  return (
    <div
      className="category-margin-overview"
      data-mode={mode}
      data-review-month={month}
      style={{ "--category-overview-months": months.length } as CSSProperties}
      aria-label={`${scopeLabel}, ${months.length}-month category margin overview`}
    >
      <section className="category-margin-overview__scope" aria-label="Current scope and sales mix">
        <div>
          <h2 className="category-margin-overview__scope-title">
            <span>{scopeLabel}</span>
            <span title={merchMoney(selected.netCents)}>
              {selected.observed ? money(selected.netCents) : "—"}
            </span>
          </h2>
          <p className="category-margin-overview__scope-detail">
            {parentLabel && (
              <span
                className="category-margin-overview__scope-share"
                data-compact-parent={parentLabel === "All departments" || undefined}
              >
                <span className="category-margin-overview__scope-parent">
                  {merchPercent(share)} of {parentLabel}
                </span>
                {parentLabel === "All departments" && (
                  <span className="category-margin-overview__scope-total" aria-hidden="true">
                    {merchPercent(share)} of total
                  </span>
                )}
              </span>
            )}
            <span className="category-margin-overview__scope-line-count">
              {lines.length} {lines.length === 1 ? "line" : "lines"}
            </span>
            <span>Net sales</span>
          </p>
          <div className="category-margin-overview__scope-navigation">{children}</div>
        </div>
        <div className="category-margin-overview__mix">
          <div className="category-margin-overview__caption">Sales Mix</div>
          <div className="category-margin-overview__mix-leader">
            {leading ? (
              <>
                <strong>{leading.label}</strong>
                <span>
                  {merchPercent(Math.round((leading.netCents / selected.netCents) * 10000))}
                  <span className="category-margin-overview__mix-meaning"> of sales</span>
                </span>
              </>
            ) : (
              <span>No net sales in this period</span>
            )}
          </div>
          <ChartContainer
            config={mixConfig}
            className="category-margin-overview__mix-chart"
            initialDimension={{ width: 320, height: 8 }}
          >
            <BarChart
              accessibilityLayer
              data={[Object.fromEntries(mix.map((group) => [group.id, group.netCents]))]}
              layout="vertical"
              margin={{ top: 1, right: 0, bottom: 1, left: 0 }}
            >
              <XAxis type="number" domain={[0, Math.max(1, selected.netCents)]} hide />
              <YAxis type="category" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => (
                      <>
                        <span>{mixConfig[String(name)]?.label ?? name}</span>
                        <strong>{merchMoney(Number(value))}</strong>
                      </>
                    )}
                  />
                }
              />
              {mix.map((group) => (
                <Bar
                  key={group.id}
                  dataKey={group.id}
                  stackId="mix"
                  barSize={6}
                  fill={`var(--color-${group.id})`}
                  stroke="var(--background)"
                  strokeWidth={1}
                  radius={2}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ChartContainer>
          <ul className="sr-only">
            {mix.map((group) => (
              <li key={group.id}>
                {group.label}: {merchMoney(group.netCents)},{" "}
                {merchPercent(Math.round((group.netCents / selected.netCents) * 10000))} of sales
              </li>
            ))}
          </ul>
        </div>
      </section>
      {mode === "drivers" ? (
        <DriverSummaries lines={lines} months={months} />
      ) : (
        <section
          className="category-margin-overview__period"
          aria-label="Period margin and recorded promotions"
        >
          <header className="category-margin-overview__period-header">
            <div>
              <div className="category-margin-overview__caption">
                Gross Margin Rate, {months.length} Months
              </div>
              <div className="category-margin-overview__margin">
                <strong>{merchPercent(selected.marginBps)}</strong>
                <span
                  className="category-margin-overview__change"
                  data-negative={
                    (selected.yearMoveBps !== null && selected.yearMoveBps < 0) || undefined
                  }
                  data-positive={
                    (selected.yearMoveBps !== null && selected.yearMoveBps > 0) || undefined
                  }
                >
                  {signedBps(selected.yearMoveBps)}
                </span>
                <span className="category-margin-overview__caption">
                  {selected.yearMoveBps === null
                    ? "Prior-year period unavailable"
                    : "bps vs last year"}
                </span>
              </div>
            </div>
            <div className="category-margin-overview__promotion-total">
              <div className="category-margin-overview__caption">Promotions</div>
              <strong>{promotions.length}</strong>
              <span className="category-margin-overview__caption">
                {" "}
                {promotions.length} in {scopeLabel}
              </span>
            </div>
          </header>
          <div className="category-margin-overview__years">
            {years.map((group) => (
              <span key={group.year} style={{ flex: group.count }}>
                {group.year}
              </span>
            ))}
          </div>
          <PeriodPromotions lines={lines} months={months} />
          <div className="category-margin-overview__legend">
            <ul className="category-margin-overview__discount-key" aria-label="Promotion scope key">
              <li>
                <span className="category-margin-overview__scope-dot" />
                {scopeLabel}
              </li>
            </ul>
            <ul
              className="category-margin-overview__discount-key"
              aria-label="Recorded promotion discounts"
            >
              <li>% Off</li>
              {discounts.map((discount) => (
                <li key={discount}>
                  <span style={{ backgroundColor: discountColor(discount) }} />
                  {discount / 100}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
