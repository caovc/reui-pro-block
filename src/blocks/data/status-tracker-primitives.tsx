/** Adapted official FREE REUI c-chart-1, c-progress-8, c-tooltip-6 and c-hover-card-4.
 * Copyright (c) 2025 Keenthemes Inc. MIT; see components/reui/REUI-LICENSE.txt.
 */
import type { CSSProperties, ReactNode } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ArrowDownToLine, Copy, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv } from "./data-utils";
import {
  duration,
  stageNames,
  trackerColors,
  type CronRun,
  type DeployRun,
  type RunStatus,
} from "./status-tracker-data";

export function RunBadge({ status }: { status: RunStatus }) {
  return (
    <Badge
      size="sm"
      variant={
        status === "Succeeded"
          ? "success-light"
          : status === "Failed"
            ? "destructive-light"
            : status === "Timed Out" || status === "Waiting"
              ? "warning-light"
              : "secondary"
      }
    >
      {status}
    </Badge>
  );
}
export function TrackerPicker({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {values.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
export function TrackerExports({ name, rows }: { name: string; rows: Record<string, unknown>[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" aria-label="More actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => downloadCsv(name, rows)}>
            <ArrowDownToLine />
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
              );
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `${name}.json`;
              anchor.click();
              URL.revokeObjectURL(url);
              toast.success("JSON exported");
            }}
          >
            <ArrowDownToLine />
            Export JSON
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void navigator.clipboard
                .writeText(JSON.stringify(rows, null, 2))
                .then(() => toast.success("Data copied"));
            }}
          >
            <Copy />
            Copy data
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
/** Actual c-tooltip-6 status-row panel composition, adapted inside HoverCard. */
export function StatusDetails({ title, children }: { title: string; children: ReactNode }) {
  return (
    <HoverCardContent className="w-72 max-w-[calc(100vw-2rem)] p-3">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium">{title}</p>
        {children}
      </div>
    </HoverCardContent>
  );
}
export function RunCapsules({ runs, name }: { runs: CronRun[]; name: string }) {
  return (
    <ChartContainer
      config={{ seconds: { label: "Duration", color: trackerColors.Succeeded } }}
      className="h-12 w-full aspect-auto"
      role="group"
      aria-label={`${name}, last ${runs.length} runs, oldest first`}
      data-reui-chart="c-chart-1"
    >
      <BarChart data={runs} accessibilityLayer margin={{ top: 3, bottom: 3, left: 1, right: 1 }}>
        <XAxis dataKey="number" hide />
        <YAxis hide domain={[0, Math.max(...runs.map((r) => r.seconds), 1) * 1.05]} />
        <Bar
          dataKey="seconds"
          barSize={8}
          minPointSize={5}
          radius={8}
          isAnimationActive={false}
          shape={(props: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
            payload?: CronRun;
          }) => {
            const run = props.payload;
            if (!run) return <g />;
            return (
              <HoverCard openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <rect
                    x={props.x}
                    y={props.y}
                    width={props.width}
                    height={Math.max(5, props.height ?? 5)}
                    rx={4}
                    fill={trackerColors[run.status]}
                    role="button"
                    tabIndex={0}
                    aria-label={`${name}, run ${run.number}, ${run.status}, ${duration(run.seconds)}`}
                    className="cursor-help outline-offset-2 focus:stroke-foreground"
                  />
                </HoverCardTrigger>
                <StatusDetails title={`${name} · Run ${run.number}`}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs">Outcome</span>
                    <RunBadge status={run.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(run.at).toLocaleString("en-GB", { timeZone: "UTC" })} UTC
                  </p>
                  <p className="text-xs">Duration {duration(run.seconds)}</p>
                </StatusDetails>
              </HoverCard>
            );
          }}
        />
      </BarChart>
    </ChartContainer>
  );
}
/** c-progress-8's actual independently coloured Progress composition becomes six stages.
 * Domains and stage sequencing are application extensions; no free segmented pipeline exists.
 */
export function StageMeter({ run }: { run: DeployRun }) {
  const stages = stageNames(run.strategy),
    passed = Math.floor(run.progress);
  const description =
    run.status === "Succeeded"
      ? "Rollout complete, 6 of 6 stages passed"
      : run.status === "Waiting"
        ? "Waiting for Promote at Canary 50%"
        : `${run.status} at ${stages[Math.min(5, passed)]}, ${passed} of 6 stages passed`;
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={description}
          className="flex w-full min-w-0 items-center gap-2 rounded outline-offset-4"
        >
          <span className="grid min-w-0 flex-1 grid-cols-6 gap-1">
            {stages.map((stage, i) => {
              const waiting = run.status === "Waiting" && i === 5;
              const value = waiting ? 100 : Math.max(0, Math.min(100, (run.progress - i) * 100));
              const failed =
                (run.status === "Failed" || run.status === "Rolled back") && i === passed;
              const color = waiting
                ? trackerColors.Waiting
                : failed
                  ? trackerColors.Failed
                  : value === 100
                    ? trackerColors.Succeeded
                    : "var(--foreground)";
              return (
                <Progress
                  key={stage}
                  aria-label={`${stage}: ${waiting ? "Waiting" : failed ? "Failed" : value === 100 ? "Passed" : value ? "Running" : "Queued"}`}
                  value={value}
                  className="h-1.5 **:data-[slot=progress-indicator]:bg-[var(--stage-color)]"
                  style={{ "--stage-color": color } as CSSProperties}
                />
              );
            })}
          </span>
          <span className="shrink-0 text-[10px] tabular-nums text-foreground">{passed}/6</span>
        </button>
      </HoverCardTrigger>
      <StatusDetails title={`${run.service} · ${run.version}`}>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs">{run.environment}</span>
          <RunBadge status={run.status} />
        </div>
        {stages.map((stage, i) => (
          <div key={stage} className="flex items-center justify-between gap-4 text-xs">
            <span>{stage}</span>
            <span className="text-muted-foreground">
              {i < passed ? "Passed" : i === passed ? run.status : "Queued"}
            </span>
          </div>
        ))}
      </StatusDetails>
    </HoverCard>
  );
}
