/**
 * Compact adapters of official FREE REUI c-chart-1/12/13/16/17.
 * Copyright (c) 2025 Keenthemes Inc. MIT; see components/reui/REUI-LICENSE.txt.
 * Keeps native chart layout, natural curves, gradient stops, tooltip and dot
 * composition; hidden axes and responsive compact dimensions extend the examples.
 */
import { useId, useState, type ReactNode } from "react";
import { Area, Bar, Cell, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/reui/badge";
import { ReuiDotPattern } from "./reui-free-chart-primitives";
import { cn } from "@/lib/utils";
import { sparkTones } from "./sparkline-data";

export function SparkDelta({
  children,
  direction = "up",
}: {
  children: ReactNode;
  direction?: "up" | "down" | "flat";
}) {
  return (
    <Badge
      variant={
        direction === "down"
          ? "destructive-light"
          : direction === "flat"
            ? "warning-light"
            : "success-light"
      }
      className="gap-1 px-1.5 py-0 text-[10px]"
    >
      {direction === "up" ? "↗" : direction === "down" ? "↘" : "→"} {children}
    </Badge>
  );
}

export function DotBed({ className }: { className?: string }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-muted-foreground/30 [mask-image:linear-gradient(transparent,black)]",
        className,
      )}
    >
      <defs>
        <ReuiDotPattern id={`${id}-bed`} color="currentColor" />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-bed)`} />
    </svg>
  );
}

export function MiniTrend({
  values,
  label,
  color = sparkTones.green,
  height = 58,
  area = false,
  dotted = false,
  grid = false,
  tooltips = false,
  keyboard = false,
  curve = "natural",
  format = (v: number) => v.toLocaleString(),
  names,
  threshold,
  bars = false,
  pins = false,
  beads = false,
  domain,
  colors,
  onPoint,
}: {
  values: number[];
  label: string;
  color?: string;
  height?: number;
  area?: boolean;
  dotted?: boolean;
  grid?: boolean;
  tooltips?: boolean;
  keyboard?: boolean;
  curve?: "natural" | "linear";
  format?: (v: number) => string;
  names?: string[];
  threshold?: number;
  bars?: boolean;
  pins?: boolean;
  beads?: boolean;
  domain?: [number | string, number | string];
  colors?: string[];
  onPoint?: (index: number | null) => void;
}) {
  const id = useId().replaceAll(":", ""),
    [point, setPoint] = useState<number | null>(null);
  const rows = values.map((value, i) => ({ name: names?.[i] ?? `Day ${i + 1}`, value }));
  const minimum = Math.min(...values),
    maximum = Math.max(...values),
    padding = Math.max((maximum - minimum) * 0.12, Math.abs(maximum) * 0.01, 0.0001);
  const choose = (next: number) => {
    const p = Math.max(0, Math.min(values.length - 1, next));
    setPoint(p);
    onPoint?.(p);
  };
  return (
    <div
      className="relative min-w-0"
      role={keyboard ? "group" : "img"}
      aria-label={keyboard ? `${label}. Arrow keys inspect points.` : label}
      tabIndex={keyboard ? 0 : undefined}
      onKeyDown={
        keyboard
          ? (event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                choose(
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? rows.length - 1
                      : (point ?? 0) + (event.key === "ArrowLeft" ? -1 : 1),
                );
              } else if (event.key === "Escape") {
                setPoint(null);
                onPoint?.(null);
              }
            }
          : undefined
      }
    >
      {dotted && <DotBed />}
      {grid && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:12px_12px] [mask-image:linear-gradient(transparent,black,transparent)]"
        />
      )}
      <ChartContainer
        config={{ value: { label, color } }}
        className="aspect-auto w-full"
        style={{ height }}
        data-reui-chart="c-chart-1 c-chart-13 c-chart-16 c-chart-17"
      >
        <ComposedChart
          data={rows}
          accessibilityLayer
          margin={{ top: 6, bottom: 3, left: 2, right: 2 }}
          onMouseMove={(event) => {
            const next = Number(event.activeTooltipIndex);
            if (Number.isFinite(next) && next >= 0 && next < rows.length) onPoint?.(next);
          }}
          onMouseLeave={() => onPoint?.(null)}
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <filter id={`${id}-dot-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <XAxis dataKey="name" hide />
          <YAxis
            hide
            domain={
              domain ?? (bars || area ? [0, "dataMax"] : [minimum - padding, maximum + padding])
            }
          />
          {threshold !== undefined && (
            <ReferenceLine
              y={threshold}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.5}
              strokeDasharray="3 3"
            />
          )}
          {tooltips && (
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value) => (
                    <span className="font-medium">{format(Number(value))}</span>
                  )}
                />
              }
            />
          )}
          {pins && (
            <Bar dataKey="value" fill={color} barSize={1.4} isAnimationActive={false}>
              {values.map((_, i) => (
                <Cell key={i} fill={colors?.[i] ?? color} />
              ))}
            </Bar>
          )}
          {pins || beads ? (
            <Line
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
              activeDot={false}
              dot={({ cx, cy, index }) => (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={2.8}
                  stroke="var(--background)"
                  strokeWidth={1.2}
                  fill={colors?.[index ?? 0] ?? color}
                  filter={point === index ? `url(#${id}-dot-glow)` : undefined}
                />
              )}
            />
          ) : bars ? (
            <Bar dataKey="value" fill={color} radius={3} isAnimationActive={false}>
              {values.map((_, i) => (
                <Cell key={i} fill={colors?.[i] ?? color} />
              ))}
            </Bar>
          ) : area ? (
            <Area
              dataKey="value"
              type={curve}
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${id}-fill)`}
              isAnimationActive={false}
              activeDot={tooltips ? { r: 3, fill: color } : false}
            />
          ) : (
            <Line
              dataKey="value"
              type={curve}
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={tooltips ? { r: 3 } : false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ChartContainer>
      {keyboard && point !== null && (
        <span
          role="status"
          className="absolute bottom-0 left-1 z-10 rounded border bg-popover px-1.5 py-0.5 text-[10px]"
        >
          {rows[point].name} · {format(rows[point].value)}
        </span>
      )}
    </div>
  );
}

/** Actual free c-chart-12 horizontal bars, extended to one stacked status lane. */
export function HealthSegments({
  parts,
  label,
  height = 12,
}: {
  parts: { label: string; value: number; color: string }[];
  label: string;
  height?: number;
}) {
  const row = Object.fromEntries([
    ["name", "Health"],
    ...parts.map((p, i) => [`part${i}`, p.value]),
  ]);
  const config = Object.fromEntries(
    parts.map((p, i) => [`part${i}`, { label: p.label, color: p.color }]),
  );
  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
      role="img"
      aria-label={label}
      data-reui-chart="c-chart-12"
    >
      <ComposedChart
        layout="vertical"
        data={[row]}
        margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        accessibilityLayer
      >
        <XAxis type="number" domain={[0, parts.reduce((n, p) => n + p.value, 0)]} hide />
        <YAxis type="category" dataKey="name" hide />
        {parts.map((part, i) => (
          <Bar
            key={part.label}
            dataKey={`part${i}`}
            stackId="health"
            fill={part.color}
            radius={3}
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ChartContainer>
  );
}
