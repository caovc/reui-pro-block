/** Adapted from official free REUI c-chart-1 / c-chart-12.
 * Copyright (c) 2025 Keenthemes Inc. MIT (src/components/reui/REUI-LICENSE.txt).
 * Retains accessible native BarChart, ChartContainer, axes, Bar category layout
 * and the free tooltip composition. Floating ranges, log domains, lollipop
 * shapes, forecast markers and controlled selection extend those examples.
 */
import { useId } from "react";
import {
  Bar,
  BarChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
  usePlotArea,
  type BarShapeProps,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { barColors, useBarNarrow } from "./bar-chart-utils";

type BurnPoint = { index: number; value: number; span: [number, number] };
const burnColor = (value: number) =>
  value > 14.4 ? barColors.red : value > 1 ? barColors.yellow : "var(--muted-foreground)";
const budgetColor = (value: number) =>
  value < 0 ? barColors.red : value < 25 ? barColors.yellow : "#6cbea2";

function BurnReadout({
  cx,
  cy,
  width,
  text,
  budget,
}: {
  cx: number;
  cy: number;
  width: number;
  text: string;
  budget: boolean;
}) {
  const area = usePlotArea();
  const left = area?.x ?? 0;
  const x = Math.max(left, Math.min(left + (area?.width ?? width) - width, cx - width / 2));
  const y = cy - (budget ? 30 : 34);
  return (
    <g aria-label={text}>
      <rect x={x} y={y} width={width} height={26} rx={13} fill="var(--foreground)" />
      <text x={x + width / 2} y={y + 17} textAnchor="middle" fontSize={11} fill="var(--background)">
        {text}
      </text>
    </g>
  );
}

export function BurnPlot({
  values,
  mode,
  active,
  onActive,
  selected,
  even = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  label,
}: {
  values: number[];
  mode: "budget" | "rate";
  active: number;
  onActive: (index: number) => void;
  selected?: number[] | null;
  even?: boolean;
  onDragStart?: (index: number) => void;
  onDragMove?: (index: number) => void;
  onDragEnd?: () => void;
  label: string;
}) {
  const id = useId().replaceAll(":", "");
  const narrow = useBarNarrow();
  const budget = mode === "budget";
  const rows: BurnPoint[] = values.map((value, index) => ({
    index,
    value,
    span: [budget ? 0 : 1, budget ? value : Math.max(1, value)],
  }));
  const color = budget ? budgetColor : burnColor;
  const ticks = budget
    ? narrow
      ? [0, 14, 20, 28, 35]
      : [0, 7, 14, 20, 21, 25, 28, 35]
    : [0, Math.floor((values.length - 1) / 2), values.length - 1];
  const current = values[active];
  const readout = budget
    ? `${Math.abs(Math.round(current))}% ${current < 0 ? "over" : "left"} · ${active === 28 ? "Today" : `Day ${active + 1}`}`
    : `${current >= 1 ? current.toFixed(1) : current.toFixed(2)}×${active === values.length - 1 ? " · Now" : ""}`;
  return (
    <div
      role="img"
      aria-label={label}
      data-reui-chart="c-chart-1"
      data-burn-scale={budget ? "signed" : "log"}
      className={budget ? "h-[300px] w-full" : "h-[285px] w-full"}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      onPointerLeave={onDragEnd}
    >
      <ChartContainer
        config={{
          span: { label: budget ? "Budget remaining" : "Burn rate", color: barColors.red },
        }}
        className="size-full aspect-auto"
      >
        <BarChart
          accessibilityLayer
          data={rows}
          margin={{ top: 44, right: 18, left: 18, bottom: 8 }}
          onMouseMove={(state) => {
            if (state.activeTooltipIndex === undefined || state.activeTooltipIndex === null) return;
            const index = Number(state.activeTooltipIndex);
            if (!Number.isFinite(index) || (!values[index] && values[index] !== 0)) return;
            onActive(index);
            onDragMove?.(index);
          }}
          onMouseUp={onDragEnd}
        >
          <defs>
            <linearGradient id={`${id}-over`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barColors.red} stopOpacity={0.06} />
              <stop offset="100%" stopColor={barColors.red} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="index"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            ticks={ticks.filter((index) => index < values.length)}
            tick={{ fontSize: 11 }}
            tickFormatter={(index) =>
              budget
                ? index === 0
                  ? "Sep 1"
                  : index === 35
                    ? "Oct 6"
                    : String(index + 1)
                : index === 0
                  ? values.length === 72
                    ? "Sep 27"
                    : "Sep 29"
                  : index === values.length - 1
                    ? "Now"
                    : "28"
            }
          />
          <YAxis
            hide
            type="number"
            domain={budget ? [-100, 125] : [1, 100]}
            scale={budget ? "linear" : "log"}
            allowDataOverflow
          />
          {budget && <ReferenceArea y1={-100} y2={0} fill={`url(#${id}-over)`} fillOpacity={1} />}
          {selected && (
            <ReferenceArea
              x1={selected[0]}
              x2={selected[1]}
              fill="var(--primary)"
              fillOpacity={0.07}
            />
          )}
          <ReferenceLine
            y={budget ? 0 : 1}
            stroke="var(--border)"
            label={{
              value: budget ? "Over budget" : "Pace 1×",
              position: budget ? "insideTopLeft" : "insideBottomLeft",
              fill: budget ? barColors.red : "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          <ReferenceLine
            y={budget ? 25 : 14.4}
            stroke={budget ? barColors.yellow : barColors.red}
            strokeDasharray="3 4"
            label={{
              value: budget ? "Warn 25%" : "Page 14.4×",
              position: "insideBottomLeft",
              fill: budget ? "#8e732d" : barColors.red,
              fontSize: 11,
            }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="dot"
                className="min-w-40 gap-2.5"
                labelFormatter={(value) => `${budget ? "Day" : "Hour"} ${Number(value) + 1}`}
                formatter={(_, __, item) => {
                  const point = item.payload as BurnPoint;
                  return (
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {budget ? "Budget remaining" : "Burn rate"}
                      </span>
                      <span className="font-semibold">
                        {point.value.toFixed(budget ? 0 : 2)}
                        {budget ? "%" : "×"}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Bar
            dataKey="span"
            radius={4}
            barSize={budget ? 22 : 10}
            isAnimationActive={false}
            shape={(props: BarShapeProps) => {
              const point = props.payload as BurnPoint;
              const x = Number(props.x),
                y = Number(props.y),
                width = Number(props.width),
                height = Number(props.height);
              // Recharts provides y at the value endpoint and a signed height to its baseline.
              const tip = y;
              const cx = x + width / 2;
              const forecast = budget && point.index > 28;
              return (
                <g
                  role="button"
                  tabIndex={-1}
                  aria-label={
                    budget
                      ? `Day ${point.index + 1}: ${Math.round(point.value)}% remaining${forecast ? ", forecast" : ""}`
                      : `Hour ${point.index + 1}: ${point.value.toFixed(2)} times burn`
                  }
                  onPointerEnter={() => {
                    onActive(point.index);
                    onDragMove?.(point.index);
                  }}
                  onPointerDown={() => {
                    onActive(point.index);
                    onDragStart?.(point.index);
                  }}
                  style={{ cursor: budget ? "crosshair" : "default" }}
                >
                  <rect
                    x={x}
                    y={Math.min(y, y + height) - 8}
                    width={width}
                    height={Math.abs(height) + 16}
                    fill="transparent"
                  />
                  {budget && active === point.index && (
                    <rect
                      x={x}
                      y={Math.min(y, y + height) - 8}
                      width={width}
                      height={Math.abs(height) + 16}
                      rx={11}
                      fill="var(--muted)"
                      opacity={0.7}
                    />
                  )}
                  <line
                    x1={cx}
                    x2={cx}
                    y1={y}
                    y2={y + height}
                    stroke="var(--muted-foreground)"
                    strokeOpacity={0.3}
                    strokeDasharray={forecast ? "2 3" : undefined}
                  />
                  <circle
                    cx={cx}
                    cy={tip}
                    r={budget || point.value >= 1 ? 4 : 1.5}
                    fill={forecast ? "var(--background)" : color(point.value)}
                    stroke={color(point.value)}
                    strokeWidth={budget ? 1.3 : 0}
                    opacity={budget || point.value >= 1 ? 1 : 0.4}
                  />
                  {(budget ? [20, 25].includes(point.index) : active === point.index) && (
                    <circle
                      cx={cx}
                      cy={tip}
                      r={7}
                      fill="none"
                      stroke={budget ? barColors.red : color(point.value)}
                      opacity={0.4}
                    />
                  )}
                </g>
              );
            }}
          />
          {budget &&
            even &&
            rows.map((row) => (
              <ReferenceDot
                key={row.index}
                x={row.index}
                y={100 - (row.index * 100) / 30}
                r={0}
                shape={(props) => (
                  <path
                    d={`M${Number(props.cx) - 4} ${props.cy}h8`}
                    stroke="var(--muted-foreground)"
                    strokeOpacity={0.5}
                  />
                )}
              />
            ))}
          <ReferenceDot
            x={active}
            y={budget ? 125 : Math.max(1, current)}
            r={0}
            shape={(props) => (
              <BurnReadout
                cx={Number(props.cx)}
                cy={Number(props.cy)}
                width={budget ? 135 : 90}
                text={readout}
                budget={budget}
              />
            )}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

/** c-chart-12 horizontal native bar/axes, extended to a logarithmic window dot. */
export function BurnWindowMeter({ label, value }: { label: string; value: number }) {
  return (
    <div
      role="img"
      aria-label={`${label}: ${value} times burn rate`}
      data-reui-chart="c-chart-12"
      className="h-4 flex-1"
    >
      <ChartContainer
        config={{ span: { label, color: burnColor(value) } }}
        className="size-full aspect-auto"
      >
        <BarChart
          accessibilityLayer
          data={[{ name: label, span: [0.1, value] }]}
          layout="vertical"
          margin={{ top: 2, bottom: 2, left: 4, right: 4 }}
          barCategoryGap="30%"
        >
          <YAxis type="category" dataKey="name" hide tickLine={false} axisLine={false} />
          <XAxis
            type="number"
            domain={[0.1, 100]}
            scale="log"
            hide
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine x={1} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
          <Bar
            dataKey="span"
            fill="var(--muted)"
            background={{ fill: "var(--muted)", opacity: 0.5 }}
            radius={2}
            barSize={4}
            isAnimationActive={false}
          />
          <ReferenceDot
            x={value}
            y={label}
            r={4}
            fill={burnColor(value)}
            stroke="var(--background)"
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
