/**
 * Adapted from the official free ReUI c-chart-2 composition (KeenThemes, MIT):
 * https://reui.io/r/radix-nova/c-chart-2.json
 * ChartContainer / accessible BarChart / axes / native tooltip / multi-series Bar.
 * Stacking, request-window selection and release lines are Bricklane extensions.
 * Preserve the ReUI, shadcn and Recharts MIT notices in source exports.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ComponentProps, KeyboardEvent } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ReuiStripePattern } from "./reui-free-chart-primitives";
import { REQUEST_BUCKET_MS, REQUEST_RELEASES } from "./grid-base-api-request-logs-data";
import type {
  RequestStatusClass,
  RequestTimeRange,
  TrafficBucket,
} from "./grid-base-api-request-logs-types";

const STATUS_CLASSES: RequestStatusClass[] = ["2xx", "4xx", "5xx"];
const trafficConfig = {
  "2xx": { label: "2xx", color: "var(--color-emerald-400)" },
  "4xx": { label: "4xx", color: "var(--color-amber-400)" },
  "5xx": { label: "5xx", color: "var(--color-rose-400)" },
} satisfies ChartConfig;

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/** UTC-aligned display ticks; the data domain and half-hour buckets stay unchanged. */
function trafficTickValues({ start, end }: RequestTimeRange): number[] {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const hour = 3_600_000;
  const hours = (end - start) / hour;
  const step = (hours <= 6 ? 1 : hours <= 24 ? 4 : 12) * hour;
  // Omit the opening boundary; include the closing boundary when UTC aligned.
  const first = (Math.floor(start / step) + 1) * step;
  const count = Math.max(0, Math.floor((end - first) / step) + 1);
  return Array.from({ length: count }, (_, index) => first + index * step);
}

type ChartEvent = Parameters<NonNullable<ComponentProps<typeof BarChart>["onMouseMove"]>>[0];

interface RequestTrafficChartProps {
  buckets: TrafficBucket[];
  range: RequestTimeRange;
  selection: RequestTimeRange | null;
  classes: RequestStatusClass[];
  onSelectionChange: (range: RequestTimeRange | null) => void;
}

/** Every bucket is [timestamp, timestamp + 30 minutes), in UTC milliseconds. */
export function RequestTrafficChart({
  buckets,
  range,
  selection,
  classes,
  onSelectionChange,
}: RequestTrafficChartProps) {
  const id = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ start: number; end: number } | null>(null);
  const [draft, setDraft] = useState<RequestTimeRange | null>(null);
  const [activeTimestamp, setActiveTimestamp] = useState<number | null>(null);
  const visibleClasses = STATUS_CLASSES.filter((status) => classes.includes(status));
  const rows = useMemo(
    () =>
      buckets
        .filter(
          (bucket) =>
            bucket.timestamp < range.end && bucket.timestamp + REQUEST_BUCKET_MS > range.start,
        )
        .map((bucket) => ({
          ...bucket,
          // The bar occupies its interval; references use the same numeric UTC axis.
          midpoint: bucket.timestamp + REQUEST_BUCKET_MS / 2,
        }))
        .sort((a, b) => a.timestamp - b.timestamp),
    [buckets, range.start, range.end],
  );

  const intervalFor = useCallback(
    (first: number, last: number): RequestTimeRange => ({
      start: Math.max(range.start, Math.min(first, last)),
      end: Math.min(range.end, Math.max(first, last) + REQUEST_BUCKET_MS),
    }),
    [range.start, range.end],
  );

  const cancelDrag = useCallback(() => {
    dragRef.current = null;
    setDraft(null);
  }, []);

  const finishDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDraft(null);
    const next = intervalFor(drag.start, drag.end);
    if (next.start < next.end) onSelectionChange(next);
  }, [intervalFor, onSelectionChange]);

  // A release outside the chart still commits the last native hit bucket.
  // No page-pixel -> bucket coordinate conversion is used.
  useEffect(() => {
    window.addEventListener("mouseup", finishDrag);
    window.addEventListener("touchend", finishDrag);
    window.addEventListener("pointercancel", cancelDrag);
    window.addEventListener("blur", cancelDrag);
    return () => {
      window.removeEventListener("mouseup", finishDrag);
      window.removeEventListener("touchend", finishDrag);
      window.removeEventListener("pointercancel", cancelDrag);
      window.removeEventListener("blur", cancelDrag);
    };
  }, [finishDrag, cancelDrag]);

  const bucketForEvent = (state: ChartEvent) => {
    if (state.activeTooltipIndex === undefined || state.activeTooltipIndex === null) return;
    const index = Number(state.activeTooltipIndex);
    return Number.isInteger(index) ? rows[index] : undefined;
  };

  const startDrag = (state: ChartEvent) => {
    const bucket = bucketForEvent(state);
    if (!bucket) return;
    containerRef.current?.focus({ preventScroll: true });
    dragRef.current = { start: bucket.timestamp, end: bucket.timestamp };
    setActiveTimestamp(bucket.timestamp);
    setDraft(intervalFor(bucket.timestamp, bucket.timestamp));
  };

  const moveDrag = (state: ChartEvent) => {
    const bucket = bucketForEvent(state);
    if (!bucket) return;
    setActiveTimestamp(bucket.timestamp);
    const drag = dragRef.current;
    if (!drag) return;
    drag.end = bucket.timestamp;
    setDraft(intervalFor(drag.start, drag.end));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    cancelDrag();

    if (event.key === "Escape") {
      setActiveTimestamp(null);
      onSelectionChange(null);
      return;
    }
    if (!rows.length) return;
    const currentIndex = rows.findIndex((row) => row.timestamp === activeTimestamp);
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const nextIndex =
        currentIndex < 0
          ? event.key === "ArrowRight"
            ? 0
            : rows.length - 1
          : Math.max(
              0,
              Math.min(rows.length - 1, currentIndex + (event.key === "ArrowRight" ? 1 : -1)),
            );
      const next = rows[nextIndex];
      if (next) setActiveTimestamp(next.timestamp);
      return;
    }
    const bucket = rows[currentIndex] ?? rows.at(-1);
    if (bucket) {
      setActiveTimestamp(bucket.timestamp);
      onSelectionChange(intervalFor(bucket.timestamp, bucket.timestamp));
    }
  };

  const selected = draft ?? selection;
  const selectedStart = selected ? Math.max(range.start, selected.start) : 0;
  const selectedEnd = selected ? Math.min(range.end, selected.end) : 0;
  const activeBucket = rows.find((row) => row.timestamp === activeTimestamp);
  const releases = REQUEST_RELEASES.filter(
    (release) => release.timestamp >= range.start && release.timestamp < range.end,
  );

  return (
    <div
      ref={containerRef}
      role="region"
      tabIndex={0}
      aria-label="Request traffic"
      aria-describedby={`${id}-instructions ${id}-readout`}
      data-slot="request-traffic-chart"
      className="relative h-32 min-w-0 w-full select-none rounded-sm text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{ touchAction: "pan-y" }}
      onKeyDownCapture={handleKeyDown}
      onPointerCancel={cancelDrag}
    >
      <p id={`${id}-instructions`} className="sr-only">
        Request counts by thirty-minute UTC interval. Drag across bars to filter requests. Use left
        and right arrows to move, Enter to select one half hour, and Escape to reset the selection.
      </p>
      <p id={`${id}-readout`} className="sr-only" aria-live="polite" aria-atomic="true">
        {activeBucket
          ? `${timeFormat.format(activeBucket.timestamp)} UTC: ${visibleClasses
              .map((status) => `${status} ${activeBucket[status]}`)
              .join(", ")}.`
          : rows.length
            ? `${rows.length} time intervals. ${visibleClasses.join(", ")} traffic.`
            : "No request traffic in this time window."}
        {selection
          ? ` Selected ${timeFormat.format(selection.start)} to ${timeFormat.format(selection.end)} UTC.`
          : " No interval selected."}
      </p>
      <ChartContainer
        config={trafficConfig}
        initialDimension={{ width: 324, height: 128 }}
        className="h-full w-full aspect-auto text-[13px]"
      >
        <BarChart
          accessibilityLayer
          tabIndex={-1}
          data={rows}
          margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
          barCategoryGap="30%"
          maxBarSize={9}
          onMouseDown={(state, event) => {
            if (event.button === 0) {
              event.preventDefault();
              startDrag(state);
            }
          }}
          onMouseMove={moveDrag}
          onMouseUp={finishDrag}
          onTouchStart={startDrag}
          onTouchMove={moveDrag}
          onTouchEnd={finishDrag}
        >
          <defs>
            {STATUS_CLASSES.map((status) => (
              <ReuiStripePattern
                key={status}
                id={`${id}-${status}`}
                color={trafficConfig[status].color}
                opacity={0.8}
              />
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="midpoint"
            type="number"
            scale="time"
            domain={[range.start, range.end]}
            allowDataOverflow
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            height={24}
            ticks={trafficTickValues(range)}
            minTickGap={28}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => timeFormat.format(Number(value))}
          />
          <YAxis
            width={24}
            allowDecimals={false}
            domain={[0, "auto"]}
            tickCount={3}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12 }}
          />
          <ChartTooltip
            cursor={false}
            isAnimationActive={false}
            content={
              <ChartTooltipContent
                indicator="dot"
                className="min-w-36 text-xs"
                labelFormatter={(_, payload) => {
                  const timestamp = payload?.[0]?.payload?.timestamp;
                  return typeof timestamp === "number"
                    ? `${timeFormat.format(timestamp)}–${timeFormat.format(timestamp + REQUEST_BUCKET_MS)} UTC`
                    : "Request traffic";
                }}
                formatter={(value, name) => {
                  const status = STATUS_CLASSES.find((item) => item === name);
                  if (!status) return null;
                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="size-2 rounded-[2px]"
                          style={{ backgroundColor: trafficConfig[status].color }}
                        />
                        {status}
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        {Number(value).toLocaleString("en-GB")}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          {visibleClasses.map((status) => (
            <Bar
              key={status}
              dataKey={status}
              stackId="request-status"
              fill={`url(#${id}-${status})`}
              stroke={trafficConfig[status].color}
              strokeWidth={0.5}
              radius={0}
              isAnimationActive={false}
            />
          ))}
          {selected && selectedStart < selectedEnd && (
            <ReferenceArea
              x1={selectedStart}
              x2={selectedEnd}
              fill="var(--primary)"
              fillOpacity={0.08}
              stroke="var(--primary)"
              strokeOpacity={0.25}
              ifOverflow="hidden"
            />
          )}
          {releases.map((release) => (
            <ReferenceLine
              key={`${release.timestamp}-${release.label}`}
              x={release.timestamp}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
              label={{
                value: release.label,
                position: "insideTopLeft",
                fontSize: 10,
                fill: "var(--muted-foreground)",
              }}
            />
          ))}
          {activeBucket && (
            <ReferenceLine x={activeBucket.midpoint} stroke="var(--primary)" strokeOpacity={0.4} />
          )}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
