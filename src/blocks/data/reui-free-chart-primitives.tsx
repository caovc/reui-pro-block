import { arcPath, money, polar } from "./chart-math";
/**
 * Adapted from REUI's public, free Radix Nova chart examples c-chart-3, 4, 8,
 * 19, 20, 21, 22 and 25. Copyright (c) 2025 Keenthemes Inc. MIT.
 * Exact upstream URLs and adaptation notes: docs/data-implementation.md.
 * Data, IDs, dimensions and controlled selection are application extensions.
 */
import { useId, type ReactNode } from "react";
import {
  Cell,
  Label,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Sector,
  type PieSectorDataItem,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// c-chart-8 True3DBar: retained four faces, projection, face opacities and corners.
// Props narrowed from the upstream SVGProps/any signature to the coordinates used here.
export function ReuiIsometricBar({
  fill,
  x,
  y,
  width,
  height,
}: {
  fill: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const depth = Math.min(width * 0.3, 15);
  return (
    <g data-reui-chart="c-chart-8">
      <rect
        x={x + depth}
        y={y - depth}
        width={width}
        height={height}
        fill={fill}
        opacity="0.6"
        rx="3"
      />
      <polygon
        points={`${x + width + 3},${y - 3} ${x + width + depth - 3},${y - depth + 3} ${x + width + depth - 3},${y + height - depth - 3} ${x + width + 3},${y + height - 3}`}
        fill={fill}
        opacity="0.7"
      />
      <polygon
        points={`${x + 3},${y - 3} ${x + width - 3},${y - 3} ${x + width + depth - 3},${y - depth + 3} ${x + depth + 3},${y - depth + 3}`}
        fill={fill}
        opacity="0.8"
      />
      <rect x={x} y={y} width={width} height={height} fill={fill} rx="3" />
    </g>
  );
}
// c-chart-3: original seamless double diagonal paths + translucent base.
export function ReuiStripePattern({
  id,
  color,
  opacity = 1,
}: {
  id: string;
  color: string;
  opacity?: number;
}) {
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width="8" height="8" data-reui-chart="c-chart-3">
      <rect width="8" height="8" fill={color} opacity={0.1 * opacity} />
      <path
        d="M0,8 L8,0 M4,12 L12,4 M-4,4 L4,-4"
        stroke={color}
        strokeWidth="1.5"
        opacity={0.6 * opacity}
      />
      <path
        d="M2,10 L10,2 M6,14 L14,6 M-2,6 L6,-2"
        stroke={color}
        strokeWidth="1"
        opacity={0.3 * opacity}
      />
    </pattern>
  );
}
// c-chart-4: original five-pixel dot cell, used for queued run phases.
export function ReuiDotPattern({
  id,
  color,
  opacity = 1,
}: {
  id: string;
  color: string;
  opacity?: number;
}) {
  return (
    <pattern
      id={id}
      x="0"
      y="0"
      width="5"
      height="5"
      patternUnits="userSpaceOnUse"
      data-reui-chart="c-chart-4"
    >
      <rect width="5" height="5" fill={color} opacity={0.1 * opacity} />
      <circle cx="5" cy="5" r="1.4" fill={color} opacity={0.6 * opacity} />
    </pattern>
  );
}
// c-chart-20/22: actual ChartContainer/PieChart/Pie/Cell/Label implementation,
// corner+padding geometry, center label and tooltip. c-chart-22's expanded Sector
// is also applied to externally hovered table rows, preserving linked interactions.
export function ReuiDonut({
  label,
  rows,
  innerRadius = 55,
  outerRadius = 95,
  active,
  onActive,
  onSelect,
  center,
  children,
  pattern = false,
  className = "h-64 w-full",
}: {
  label: string;
  rows: { name: string; value: number; color: string }[];
  innerRadius?: number;
  outerRadius?: number;
  active: number | null;
  onActive: (i: number | null) => void;
  onSelect?: (i: number) => void;
  center: ReactNode;
  children?: ReactNode;
  pattern?: boolean | number[];
  className?: string;
}) {
  const id = useId().replaceAll(":", "");
  const config = Object.fromEntries(
    rows.map((r, i) => [`series${i}`, { label: r.name, color: r.color }]),
  ) satisfies ChartConfig;
  const data = rows.map((r, i) => ({ ...r, key: `series${i}`, fill: r.color }));
  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      data-reui-chart="c-chart-20 c-chart-21 c-chart-22"
    >
      <ChartContainer config={config} className="size-full aspect-auto">
        <PieChart accessibilityLayer>
          <defs>
            {rows.map((r, i) => (
              <ReuiStripePattern key={r.name} id={`${id}-${i}`} color={r.color} />
            ))}
          </defs>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                className="min-w-40 gap-2.5"
                nameKey="name"
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-semibold tabular-nums">
                      {Number(value).toLocaleString()}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            cornerRadius={5}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
            stroke="var(--background)"
            strokeWidth={3}
            isAnimationActive={false}
            onMouseEnter={(_, i) => onActive(i)}
            onMouseLeave={() => onActive(null)}
            onClick={(_, i) => onSelect?.(i)}
            shape={(props: PieSectorDataItem) => {
              const index = data.findIndex((r) => r.name === props.name);
              return (
                <Sector
                  {...props}
                  outerRadius={(props.outerRadius ?? outerRadius) + (active === index ? 5 : 0)}
                  opacity={active === null || active === index ? 1 : 0.4}
                />
              );
            }}
          >
            {data.map((r, i) => (
              <Cell
                key={r.name}
                fill={
                  pattern === true || (Array.isArray(pattern) && pattern.includes(i))
                    ? `url(#${id}-${i})`
                    : r.fill
                }
                cursor={onSelect ? "pointer" : undefined}
              />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox && "cy" in viewBox ? (
                  <g transform={`translate(${viewBox.cx},${viewBox.cy})`}>{center}</g>
                ) : null
              }
            />
          </Pie>
          {children}
        </PieChart>
      </ChartContainer>
    </div>
  );
}

// c-chart-25 Lighthouse radial: original RadialBarChart + PolarAngleAxis,
// 0..100 domain, background tracks, rounded ends and per-series gradients.
// Extended to a partial 270° sweep and controlled table-row highlighting.
export function ReuiBudgetRings({
  rows,
  focus,
  onFocus,
  healthy,
  label,
}: {
  rows: { name: string; value: number; color: string }[];
  focus: number | null;
  onFocus: (i: number | null) => void;
  healthy: number;
  label: string;
}) {
  const id = useId().replaceAll(":", "");
  const data = rows
    .map((r, index) => ({ ...r, score: r.value, index, fill: `url(#${id}-${index})` }))
    .reverse();
  const config = Object.fromEntries(
    rows.map((r) => [r.name, { label: r.name, color: r.color }]),
  ) satisfies ChartConfig;
  return (
    <div className="h-64 w-full" role="img" aria-label={label} data-reui-chart="c-chart-25">
      <ChartContainer config={config} className="size-full aspect-auto">
        <RadialBarChart
          data={data}
          innerRadius={62}
          outerRadius={115}
          barSize={9}
          startAngle={90}
          endAngle={-180}
          cy="52%"
        >
          <defs>
            {rows.map((r, i) => (
              <linearGradient key={r.name} id={`${id}-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={r.color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={r.color} stopOpacity={1} />
              </linearGradient>
            ))}
          </defs>
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="min-w-40 gap-2.5"
                nameKey="name"
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-semibold tabular-nums">{Number(value)}% budget left</span>
                  </div>
                )}
              />
            }
          />
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            dataKey="score"
            background={{ fill: "var(--muted)" }}
            cornerRadius={10}
            isAnimationActive={false}
            onMouseEnter={(_, i) => onFocus(data[i].index)}
            onMouseLeave={() => onFocus(null)}
          >
            {data.map((r) => (
              <Cell key={r.name} opacity={focus === null || focus === r.index ? 1 : 0.2} />
            ))}
          </RadialBar>
          <circle
            cx="50%"
            cy="52%"
            r={51}
            fill="none"
            stroke="var(--border)"
            strokeDasharray="2 4"
          />
          <text x="50%" y="43%" textAnchor="middle" fill="var(--muted-foreground)" fontSize={11}>
            {focus === null ? "On track" : rows[focus].name}
          </text>
          <text
            x="50%"
            y="56%"
            textAnchor="middle"
            fill="currentColor"
            fontSize={25}
            fontWeight={600}
          >
            {focus === null ? `${healthy}/4` : `${rows[focus].value}%`}
          </text>
          <text x="50%" y="66%" textAnchor="middle" fill="var(--muted-foreground)" fontSize={11}>
            {focus === null ? "objectives" : "budget left"}
          </text>
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
}

// c-chart-21/22 Pie + Cell + Sector extended into a budget rose. Angular values
// remain budget allocations; only the Sector radius is extended by spend/budget.
export function ReuiBudgetRose({
  rows,
  selected,
  hover,
  onSelect,
  onHover,
  spend,
  cap,
}: {
  rows: { name: string; budget: number; spent: number; color: string }[];
  selected: number | null;
  hover: number | null;
  onSelect: (i: number) => void;
  onHover: (i: number | null) => void;
  spend: number;
  cap: number;
}) {
  const id = useId().replaceAll(":", "");
  const config = Object.fromEntries(
    rows.map((r) => [r.name, { label: r.name, color: r.color }]),
  ) satisfies ChartConfig;
  return (
    <div
      className="h-[390px] w-full"
      role="img"
      aria-label="Budget use by category"
      data-reui-chart="c-chart-19 c-chart-21 c-chart-22"
    >
      <ChartContainer config={config} className="size-full aspect-auto">
        <PieChart accessibilityLayer>
          <defs>
            {rows.map((r, i) => (
              <linearGradient key={r.name} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={r.color} stopOpacity={1} />
                <stop offset="100%" stopColor={r.color} stopOpacity={0.8} />
              </linearGradient>
            ))}
          </defs>
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="min-w-40 gap-2.5"
                nameKey="name"
                formatter={(_, name, item) => (
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-semibold">
                      {Math.round(
                        ((item.payload as { spent: number; budget: number }).spent /
                          (item.payload as { spent: number; budget: number }).budget) *
                          100,
                      )}
                      % used
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={rows}
            dataKey="budget"
            nameKey="name"
            innerRadius={80}
            outerRadius={151}
            cornerRadius={4}
            paddingAngle={1}
            stroke="var(--background)"
            strokeWidth={3}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
            onMouseEnter={(_, i) => onHover(i)}
            onMouseLeave={() => onHover(null)}
            onClick={(_, i) => onSelect(i)}
            shape={(props: PieSectorDataItem) => {
              const index = rows.findIndex((r) => r.name === props.name),
                row = rows[index];
              if (!row) return <Sector {...props} />;
              const ratio = row.spent / row.budget,
                cx = Number(props.cx),
                cy = Number(props.cy),
                available = Math.min(cx, cy),
                scale = available < 185 ? (available - 18) / 181 : 1,
                outer = (80 + 71 * ratio) * scale,
                start = 90 - Number(props.startAngle),
                end = 90 - Number(props.endAngle),
                point = polar(cx, cy, 181 * scale, (start + end) / 2);
              return (
                <g
                  opacity={
                    selected !== null && selected !== index
                      ? 0.2
                      : hover !== null && hover !== index
                        ? 0.45
                        : 1
                  }
                  style={{ cursor: "pointer" }}
                >
                  {index === 0 && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={151 * scale}
                      fill="var(--muted)"
                      opacity={0.35}
                      stroke="var(--muted-foreground)"
                      strokeOpacity={0.3}
                      strokeDasharray="2 4"
                    />
                  )}
                  <Sector {...props} innerRadius={80 * scale} outerRadius={outer} />
                  {ratio >= 0.9 && (
                    <path
                      d={arcPath(
                        cx,
                        cy,
                        Math.max(155 * scale, outer + 6 * scale),
                        start + 1,
                        end - 1,
                      )}
                      fill="none"
                      stroke={ratio > 1 ? "#d33232" : "#d3ab14"}
                      strokeWidth={ratio > 1 ? 5 : 3}
                      strokeLinecap="round"
                    />
                  )}
                  <text
                    x={point[0]}
                    y={point[1]}
                    textAnchor="middle"
                    fill={ratio > 1 ? "#d33232" : "var(--muted-foreground)"}
                    fontSize={12}
                  >
                    {Math.round(ratio * 100)}%
                  </text>
                </g>
              );
            }}
          >
            {rows.map((row, i) => (
              <Cell key={row.name} fill={`url(#${id}-${i})`} />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox && "cy" in viewBox ? (
                  <g transform={`translate(${viewBox.cx},${viewBox.cy})`}>
                    <text y={-30} textAnchor="middle" fill="var(--muted-foreground)" fontSize={12}>
                      Budget Use
                    </text>
                    <text
                      y={11}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize={34}
                      fontWeight={600}
                    >
                      {Math.round((spend / cap) * 100)}
                      <tspan fontSize={17}>%</tspan>
                    </text>
                    <path d="M-16 29H16" stroke="var(--border)" />
                    <text y={50} textAnchor="middle" fill="var(--muted-foreground)" fontSize={11}>
                      {money(Math.abs(cap - spend))} {spend > cap ? "over" : "left"}
                    </text>
                  </g>
                ) : null
              }
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
}
