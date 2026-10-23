/**
 * Adapted from REUI's FREE c-chart-13/16/17 chart implementations.
 * Copyright (c) 2025 Keenthemes Inc. MIT, see components/reui/REUI-LICENSE.txt.
 * Retains the source's ChartContainer/ComposedChart, natural curves, gradient
 * stops, glow filter, axes/grid and ChartTooltipContent formatter composition.
 * Signed bars/dual axes, controlled selections and domain references extend it.
 */
import { useId, useState, type ReactNode } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "@/components/reui/color-picker";
import { cn } from "@/lib/utils";
export type TrendRow = { name: string; [key: string]: number | string | null | [number, number] };
export type TrendSeries = {
  key: string;
  label: string;
  color: string;
  kind?: "line" | "area" | "bar";
  axis?: "left" | "right";
  dashed?: boolean;
  dots?: boolean;
  pattern?: boolean;
  glow?: boolean;
  stack?: string;
  curve?: "linear" | "natural" | "monotone" | "stepAfter";
  opacity?: number;
  fill?: string;
  stroke?: string;
  cellColors?: string[];
  width?: number;
};
const trendSwatches = ["#7561e9", "#319d8f", "#3b91cf", "#e78324", "#e14f78", "#6b7280"];
export function TrendColor({
  label = "Line color",
  color,
  onChange,
}: {
  label?: string;
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <ColorPicker
      value={color}
      onValueChange={(value) => value && onChange(value)}
      swatches={trendSwatches}
      aria-label={label}
    >
      <ColorPickerTrigger aria-label={label} size="icon" className="size-7">
        <ColorPickerSwatch className="size-4 rounded-full" />
      </ColorPickerTrigger>
      <ColorPickerContent align="end" />
    </ColorPicker>
  );
}
export function ReuiTrend({
  label,
  data,
  series,
  format = (v: number) => v.toLocaleString(),
  rightFormat,
  domain = ["auto", "auto"],
  rightDomain = ["auto", "auto"],
  grid = true,
  verticalGrid = false,
  height = 300,
  children,
  onPoint,
  tooltipExtra,
  compact = false,
}: {
  label: string;
  data: TrendRow[];
  series: TrendSeries[];
  format?: (v: number) => string;
  rightFormat?: (v: number) => string;
  domain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
  rightDomain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
  grid?: boolean;
  verticalGrid?: boolean;
  height?: number;
  children?: ReactNode;
  onPoint?: (index: number) => void;
  tooltipExtra?: (row: TrendRow) => ReactNode;
  compact?: boolean;
}) {
  const id = useId().replaceAll(":", ""),
    [point, setPoint] = useState<number | null>(null);
  const config = Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }]));
  const choose = (index: number) => {
    const i = Math.max(0, Math.min(data.length - 1, index));
    setPoint(i);
    onPoint?.(i);
  };
  const active = point === null ? null : data[Math.min(point, data.length - 1)];
  const first = series.find((s) => s.kind !== "bar" && active && typeof active[s.key] === "number");
  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`${label}. Arrow keys move between points.`}
      className="min-w-0 outline-offset-[-2px]"
      data-reui-chart="c-chart-13 c-chart-16 c-chart-17"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          choose((point ?? 0) + (event.key === "ArrowRight" ? 1 : -1));
        } else if (event.key === "Home") {
          event.preventDefault();
          choose(0);
        } else if (event.key === "End") {
          event.preventDefault();
          choose(data.length - 1);
        } else if (event.key === "Escape") setPoint(null);
      }}
    >
      <ChartContainer
        config={config}
        className={cn(
          "w-full aspect-auto",
          compact ? "[&_.recharts-cartesian-axis-tick_text]:text-[10px]" : "",
        )}
        style={{ height }}
      >
        <ComposedChart
          accessibilityLayer
          data={data}
          margin={{ top: 24, right: rightFormat ? 8 : 18, bottom: 4, left: 0 }}
          onMouseMove={(event) => {
            const i = Number(event.activeTooltipIndex);
            if (Number.isFinite(i) && i >= 0 && i < data.length) onPoint?.(i);
          }}
        >
          <defs>
            {series.map((s) => (
              <g key={s.key}>
                <linearGradient id={`${id}-${s.key}-gradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={s.glow ? 0.35 : 0.5} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={s.glow ? 0 : 0.05} />
                </linearGradient>
                <pattern
                  id={`${id}-${s.key}-stripe`}
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                >
                  <rect width="6" height="6" fill={s.color} opacity=".04" />
                  <path d="M0,6 L6,0" stroke={s.color} strokeWidth=".8" opacity=".15" />
                </pattern>
              </g>
            ))}
            <filter id={`${id}-dot-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {grid && (
            <CartesianGrid
              vertical={verticalGrid}
              horizontal={!verticalGrid}
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
          )}
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} />
          <YAxis
            yAxisId="left"
            domain={domain}
            tickLine={false}
            axisLine={false}
            width={compact ? 42 : 54}
            tickFormatter={format}
            tickCount={5}
          />
          {rightFormat && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={rightDomain}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={rightFormat}
              tickCount={5}
            />
          )}
          <ChartTooltip
            cursor={false}
            content={(props) => (
              <div>
                <ChartTooltipContent
                  active={props.active}
                  payload={props.payload}
                  label={props.label}
                  className="min-w-40 gap-2.5"
                  indicator="dot"
                  formatter={(value, name) => {
                    const s = series.find((s) => s.key === name);
                    return (
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span
                            className="size-2 shrink-0 rounded-xs"
                            style={{ background: s?.color }}
                          />
                          {s?.label ?? name}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {Array.isArray(value)
                            ? value
                                .map(Number)
                                .map(s?.axis === "right" && rightFormat ? rightFormat : format)
                                .join(" – ")
                            : (s?.axis === "right" && rightFormat ? rightFormat : format)(
                                Number(value),
                              )}
                        </span>
                      </div>
                    );
                  }}
                />
                {props.active && props.payload?.length && tooltipExtra?.(props.payload[0].payload)}
              </div>
            )}
          />
          {children}
          {series.map((s) =>
            s.kind === "bar" ? (
              <Bar
                key={s.key}
                yAxisId={s.axis ?? "left"}
                dataKey={s.key}
                stackId={s.stack}
                fill={s.fill ?? s.color}
                radius={3}
                barSize={s.width ?? 18}
                isAnimationActive={false}
              >
                {s.cellColors?.map((color, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Bar>
            ) : s.kind === "area" ? (
              <Area
                key={s.key}
                yAxisId={s.axis ?? "left"}
                dataKey={s.key}
                stackId={s.stack}
                type={s.curve ?? "natural"}
                fill={s.fill ?? `url(#${id}-${s.key}-${s.pattern ? "stripe" : "gradient"})`}
                fillOpacity={s.opacity ?? 1}
                stroke={s.stroke ?? s.color}
                strokeWidth={1.8}
                strokeDasharray={s.dashed ? "4 4" : undefined}
                isAnimationActive={false}
                dot={
                  s.dots
                    ? {
                        r: 3,
                        fill: s.color,
                        stroke: "var(--background)",
                        strokeWidth: 1.5,
                        filter: s.glow ? `url(#${id}-dot-glow)` : undefined,
                      }
                    : false
                }
                activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
              />
            ) : (
              <Line
                key={s.key}
                yAxisId={s.axis ?? "left"}
                type={s.curve ?? "natural"}
                dataKey={s.key}
                stroke={s.stroke ?? s.color}
                strokeWidth={1.8}
                strokeOpacity={s.opacity ?? 1}
                strokeDasharray={s.dashed ? "4 4" : undefined}
                isAnimationActive={false}
                dot={s.dots ? { r: 2.5, fill: s.color } : false}
                connectNulls={false}
              />
            ),
          )}
          {active && first && (
            <ReferenceDot
              yAxisId={first.axis ?? "left"}
              x={active.name}
              y={Number(active[first.key])}
              r={4}
              fill={first.color}
              stroke="var(--background)"
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </ChartContainer>
      {active && (
        <div role="status" className="flex flex-wrap gap-3 border-t px-4 py-2 text-xs">
          <strong className="font-medium">{active.name}</strong>
          {series
            .filter((s) => active[s.key] !== null && typeof active[s.key] === "number")
            .map((s) => (
              <span key={s.key} className="text-muted-foreground">
                {s.label}{" "}
                <span className="text-foreground">
                  {(s.axis === "right" && rightFormat ? rightFormat : format)(
                    Number(active[s.key]),
                  )}
                </span>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
