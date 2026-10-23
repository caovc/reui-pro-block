import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
  FrameFooter,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemGroup } from "@/components/ui/item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartStage } from "./chart-chrome";
import { HealthSegments } from "./sparkline-primitives";
import { RunBadge, RunCapsules, TrackerExports, TrackerPicker } from "./status-tracker-primitives";
import { cronJobs, duration, p95, successRate, trackerColors } from "./status-tracker-data";

export default function CronRunHistory() {
  const [filter, setFilter] = useState("All Jobs"),
    [window, setWindow] = useState("20"),
    [sort, setSort] = useState("Needs Attention");
  const count = Number(window),
    allRuns = cronJobs.flatMap((job) => job.runs.slice(-count));
  const rate = successRate(allRuns),
    half = count / 2;
  const newer = cronJobs.flatMap((job) => job.runs.slice(-half)),
    older = cronJobs.flatMap((job) => job.runs.slice(-count, -half));
  const delta = successRate(newer) - successRate(older);
  const outcomes = ["Succeeded", "Failed", "Timed Out", "Skipped"] as const;
  const failing = cronJobs.filter((job) =>
    ["Failed", "Timed Out"].includes(job.runs.at(-1)!.status),
  );
  const slowest = [...cronJobs].sort(
    (a, b) => p95(b.runs.slice(-count)) - p95(a.runs.slice(-count)),
  )[0];
  const jobs = cronJobs
    .filter(
      (job) =>
        filter === "All Jobs" ||
        (filter === "Paused"
          ? job.paused
          : filter === "Failing"
            ? failing.includes(job)
            : !job.paused && !failing.includes(job)),
    )
    .sort((a, b) =>
      sort === "Name"
        ? a.name.localeCompare(b.name)
        : sort === "Last Run"
          ? a.age - b.age
          : sort === "Success Rate"
            ? successRate(a.runs.slice(-count)) - successRate(b.runs.slice(-count))
            : Number(failing.includes(b)) - Number(failing.includes(a)) ||
              successRate(a.runs.slice(-count)) - successRate(b.runs.slice(-count)) ||
              a.age - b.age,
    );
  const exported = jobs.flatMap((job) =>
    job.runs.slice(-count).map((run) => ({
      job: job.name,
      command: job.command,
      status: run.status,
      durationSeconds: run.seconds,
      timeUTC: run.at,
      paused: job.paused,
    })),
  );
  return (
    <ChartStage>
      <Frame className="w-full max-w-[1150px]">
        <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <FrameTitle role="heading" aria-level={2}>
              Run History
            </FrameTitle>
            <FrameDescription className="mt-1 text-xs">
              7 cron jobs · As of Sep 29, 14:20 UTC
            </FrameDescription>
          </div>
          <div className="flex items-center gap-2">
            <TrackerPicker
              label="Show jobs"
              value={filter}
              values={["All Jobs", "Failing", "Healthy", "Paused"]}
              onChange={setFilter}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Display options"
                  variant="outline"
                  size="icon"
                  className="size-8"
                >
                  <SlidersHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Run Window</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={window} onValueChange={setWindow}>
                  {["10", "20"].map((v) => (
                    <DropdownMenuRadioItem key={v} value={v}>
                      Last {v} Runs
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                  {["Needs Attention", "Success Rate", "Last Run", "Name"].map((v) => (
                    <DropdownMenuRadioItem key={v} value={v}>
                      {v}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <TrackerExports name="cron-run-history" rows={exported} />
          </div>
        </FrameHeader>
        <FramePanel className="grid grid-cols-2 gap-px overflow-hidden bg-border p-0 md:grid-cols-4">
          <section className="flex flex-col gap-2 bg-background p-4">
            <h3 className="text-xs text-muted-foreground">Success Rate</h3>
            <p className="text-2xl font-semibold tabular-nums">{rate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">
              <span className={delta < 0 ? "text-destructive" : "text-emerald-600"}>
                {delta < 0 ? "↘" : "↗"} {Math.abs(delta).toFixed(1)} pts
              </span>{" "}
              vs older runs
            </p>
          </section>
          <section className="flex flex-col gap-2 bg-background p-4">
            <h3 className="text-xs text-muted-foreground">Runs</h3>
            <p className="text-2xl font-semibold">{allRuns.length}</p>
            <div className="mt-auto flex items-center gap-2">
              <HealthSegments
                label={outcomes
                  .map((s) => `${allRuns.filter((r) => r.status === s).length} ${s}`)
                  .join(", ")}
                parts={outcomes.map((status) => ({
                  label: status,
                  value: allRuns.filter((run) => run.status === status).length,
                  color: trackerColors[status],
                }))}
                height={6}
              />
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {allRuns.filter((r) => r.status === "Failed" || r.status === "Timed Out").length}{" "}
                failed
              </span>
            </div>
          </section>
          <section className="flex flex-col gap-2 bg-background p-4">
            <h3 className="text-xs text-muted-foreground">Failing Jobs</h3>
            <p className="text-2xl font-semibold">
              {failing.length}
              <span className="ml-1 text-xs font-normal text-muted-foreground">of 7</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Longest streak 4 runs</p>
          </section>
          <section className="flex flex-col gap-2 bg-background p-4">
            <h3 className="text-xs text-muted-foreground">Slowest p95</h3>
            <p className="text-2xl font-semibold">{duration(p95(slowest.runs.slice(-count)))}</p>
            <p className="truncate text-[10px] text-muted-foreground" title={slowest.name}>
              {slowest.name}
            </p>
          </section>
        </FramePanel>
        <FramePanel className="p-0">
          <div className="hidden grid-cols-[minmax(190px,1.4fr)_130px_minmax(0,3fr)_85px] gap-4 border-b px-4 py-3 text-xs text-muted-foreground md:grid">
            <span>Job</span>
            <span>Last Run</span>
            <span className="flex justify-between">
              Last {count} Runs<span>Oldest to newest</span>
            </span>
            <span className="text-right">Success</span>
          </div>
          <ItemGroup role="list" aria-label="Cron jobs" className="gap-0">
            {jobs.map((job) => {
              const runs = job.runs.slice(-count),
                last = runs.at(-1)!;
              return (
                <Item
                  key={job.name}
                  role="listitem"
                  className="grid grid-cols-[minmax(0,1fr)_75px] gap-x-4 gap-y-2 rounded-none px-4 py-2 md:grid-cols-[minmax(190px,1.4fr)_130px_minmax(0,3fr)_85px]"
                >
                  <div className="min-w-0">
                    <h3 className="flex min-w-0 items-center gap-2 text-xs font-medium">
                      <span className="truncate" title={job.name}>
                        {job.name}
                      </span>
                      {job.paused && (
                        <Badge size="sm" variant="outline">
                          Paused
                        </Badge>
                      )}
                    </h3>
                    <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground">
                      {job.command}
                    </p>
                  </div>
                  <div className="hidden flex-col gap-1 md:flex">
                    <RunBadge status={last.status} />
                    <p className="text-[10px] text-muted-foreground">
                      {job.age < 60
                        ? `${job.age}m`
                        : job.age < 1440
                          ? `${Math.floor(job.age / 60)}h`
                          : `${Math.floor(job.age / 1440)}d`}{" "}
                      ago · {duration(last.seconds)}
                    </p>
                  </div>
                  <div className="col-span-2 row-start-2 min-w-0 md:col-auto md:row-auto">
                    <RunCapsules runs={runs} name={job.name} />
                  </div>
                  <div className="col-start-2 row-start-1 text-right md:col-auto md:row-auto">
                    <p className="text-xs font-semibold">{successRate(runs).toFixed(0)}%</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      p95 {duration(p95(runs))}
                    </p>
                  </div>
                </Item>
              );
            })}
          </ItemGroup>
        </FramePanel>
        <FrameFooter className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-3 text-[10px] text-muted-foreground">
          <div className="flex flex-wrap gap-3">
            {outcomes.map((status) => (
              <span key={status} className="flex items-center gap-1">
                <i
                  className="size-1.5 rounded-full"
                  style={{ background: trackerColors[status] }}
                />
                {status}
              </span>
            ))}
          </div>
          <span>Bar height is run duration</span>
        </FrameFooter>
      </Frame>
    </ChartStage>
  );
}
