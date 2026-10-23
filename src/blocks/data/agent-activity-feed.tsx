/** Actual official free REUI c-marker-2/3/4 and c-trace-2 compositions.
 * https://reui.io/r/radix-nova/c-marker-2.json
 * https://reui.io/r/radix-nova/c-trace-2.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 * Reused: tool Marker rows, phase separators, timed/streamed progression,
 * controlled live-open Trace rows, and stable Stop/Rerun controls.
 * Original fixtures and local transcript actions extend these free examples.
 */
import { Fragment, useEffect, useState } from "react";
import {
  Check,
  CircleDashed,
  Code2,
  Copy,
  Database,
  Download,
  Ellipsis,
  ExternalLink,
  FileText,
  Link,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Terminal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/reui/badge";
import { CodeBlock } from "@/components/reui/code-block/code-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import {
  FEED_STEPS,
  advanceFeed,
  createFeedRun,
  feedTranscript,
  stopFeed,
  type FeedStep,
} from "./agent-activity-model";

function ToolIcon({ tool }: { tool: string }) {
  switch (tool) {
    case "read_file":
      return <FileText />;
    case "edit_file":
      return <Pencil />;
    case "search":
      return <Code2 />;
    case "reason":
      return <Sparkles />;
    case "query":
      return <Database />;
    case "create_issue":
      return <Link />;
    default:
      return <Terminal />;
  }
}
function openLabel(step: FeedStep) {
  return step.file
    ? "Open file"
    : step.tool === "create_issue"
      ? "Open in tracker"
      : step.tool === "query"
        ? "Open query"
        : "Open in console";
}

export default function LiveRunFeed() {
  const [run, setRun] = useState(createFeedRun);
  const [view, setView] = useState("summary");
  const [openById, setOpenById] = useState<Record<string, boolean>>({});
  const running = run.cutFrom === null && run.at < FEED_STEPS.length;
  const live = running ? FEED_STEPS[run.at] : undefined;
  const shown = running ? FEED_STEPS.slice(0, run.at + 1) : FEED_STEPS;
  const transcript = feedTranscript(run, FEED_STEPS);
  const elapsed =
    FEED_STEPS.slice(0, run.at).reduce((sum, entry) => sum + entry.durationMs, 0) / 1000;
  const files = new Set(
    FEED_STEPS.filter((entry, index) => entry.changedFile && index < run.at).map(
      (entry) => entry.target,
    ),
  ).size;
  const tools = FEED_STEPS.filter((entry, index) => entry.countsAsTool && index < run.at).length;

  // Actual free c-trace-2 effect: stream 3 chars per tick, then resolve the
  // current row, with cleanup on pause/stop. Replay all steps exposes reasoning;
  // ordinary Rerun preserves the reference's two already-completed steps.
  useEffect(() => {
    if (!live || run.paused) return;
    const text = live.reasoning;
    const streaming = text && run.chars < text.length;
    const timer = window.setTimeout(
      () => {
        setRun((current) =>
          streaming
            ? { ...current, chars: Math.min(text.length, current.chars + 3) }
            : advanceFeed(current, FEED_STEPS),
        );
      },
      streaming ? 24 : live.durationMs,
    );
    return () => window.clearTimeout(timer);
  }, [live, run.chars, run.paused]);

  function restart(fromStart = false) {
    setRun({ ...createFeedRun(), at: fromStart ? 0 : 2 });
    setOpenById({});
    toast.success(
      fromStart ? "Replaying every step" : "Run restarted from the first unfinished step",
    );
  }
  function status(index: number) {
    if (run.cutFrom !== null && index >= run.cutFrom) return "Cancelled";
    if (index < run.at) return "Done";
    return run.paused ? "Paused" : "Running";
  }
  function rowIcon(step: FeedStep, index: number) {
    return status(index) === "Cancelled" ? (
      <X />
    ) : index < run.at ? (
      <ToolIcon tool={step.tool} />
    ) : run.paused ? (
      <CircleDashed />
    ) : (
      <Spinner className="size-4" />
    );
  }
  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard unavailable. Download the log instead.");
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([transcript], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "run-log.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function open(step: FeedStep) {
    toast.info(`${step.target} · local demo`);
  }

  return (
    <div className="min-h-svh w-full px-6 py-16" data-agent-activity="live-feed">
      <Card className="mx-auto w-full max-w-xl gap-0 overflow-hidden py-0 shadow-none">
        <CardHeader className="gap-0 px-3 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-900"
              >
                JL
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <CardTitle className="min-w-0 truncate text-sm">Fix Workspace Limits</CardTitle>
                  <Badge
                    size="sm"
                    variant={
                      run.cutFrom !== null
                        ? "warning-light"
                        : running
                          ? "info-light"
                          : "success-light"
                    }
                  >
                    {run.cutFrom !== null
                      ? "Stopped"
                      : run.paused
                        ? "Paused"
                        : running
                          ? "Working"
                          : "Done"}
                  </Badge>
                </div>
                <CardDescription className="mt-0.5 truncate text-xs">
                  Jamie Lee <span className="px-0.5">·</span> Started 10:42
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Run actions">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>View</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={view} onValueChange={setView}>
                  <DropdownMenuRadioItem value="summary">Summary</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="detailed">Detailed</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="raw">Raw</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => copyText(transcript, "Run transcript")}>
                  <Copy />
                  Copy Transcript
                </DropdownMenuItem>
                <DropdownMenuItem onClick={download}>
                  <Download />
                  Download Log
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => restart()}>
                  <RotateCcw />
                  Rerun
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => restart(true)}>
                  <Play />
                  Replay all steps
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 border-t px-3 py-5">
          {view === "raw" ? (
            <CodeBlock code={transcript} language="text" wrap className="max-w-full text-xs" />
          ) : view === "summary" ? (
            <div className="flex min-w-0 flex-col gap-3.5" aria-label="Run steps">
              {shown.map((step, index) => (
                <Marker
                  key={step.id}
                  className="group/step min-w-0 gap-2"
                  role={index === run.at && running ? "status" : undefined}
                >
                  <MarkerIcon>{rowIcon(step, index)}</MarkerIcon>
                  <MarkerContent
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[13px] leading-5",
                      status(index) === "Cancelled" && "line-through opacity-60",
                    )}
                  >
                    <span className="sr-only">{status(index)}: </span>
                    <span className="max-w-full shrink-0 truncate text-foreground">
                      {index < run.at
                        ? step.summary
                        : status(index) === "Cancelled"
                          ? step.title
                          : `${status(index)}: ${step.title}`}
                    </span>
                    <code
                      title={step.target}
                      className="min-w-0 truncate font-mono text-[11px] text-muted-foreground"
                    >
                      {step.target}
                    </code>
                  </MarkerContent>
                  <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:group-hover/step:opacity-100 sm:group-focus-within/step:opacity-100">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="size-5"
                      aria-label={`Copy ${step.title}`}
                      onClick={() => copyText(step.raw, "Step output")}
                    >
                      <Copy className="size-3" />
                    </Button>
                    {step.tool !== "reason" &&
                      step.tool !== "search" &&
                      step.tool !== "run_command" && (
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="size-5"
                          aria-label={`${openLabel(step)}: ${step.title}`}
                          onClick={() => open(step)}
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                      )}
                  </div>
                  <span className="w-10 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                    {index < run.at ? `${(step.durationMs / 1000).toFixed(1)}s` : "—"}
                  </span>
                </Marker>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Array.from(new Set(shown.map((step) => step.phase))).map((phase) => (
                <Fragment key={phase}>
                  <Marker variant="separator">
                    <MarkerContent className="text-xs">{phase}</MarkerContent>
                  </Marker>
                  <Trace>
                    {shown
                      .filter((step) => step.phase === phase)
                      .map((step) => {
                        const index = FEED_STEPS.indexOf(step);
                        const isLive = index === run.at && running;
                        const cancelled = status(index) === "Cancelled";
                        const line = (
                          <TraceLine
                            status={
                              cancelled ? "pending" : isLive && !run.paused ? "running" : undefined
                            }
                          >
                            <TraceIcon>{rowIcon(step, index)}</TraceIcon>
                            <TraceTitle className={cn(cancelled && "line-through")}>
                              {status(index)}: {step.title}
                            </TraceTitle>
                            <TraceDescription>
                              {index < run.at ? `${(step.durationMs / 1000).toFixed(1)}s` : ""}
                            </TraceDescription>
                          </TraceLine>
                        );
                        return cancelled ? (
                          <Fragment key={step.id}>{line}</Fragment>
                        ) : (
                          <TraceCollapsible
                            key={step.id}
                            open={openById[step.id] ?? isLive}
                            onOpenChange={(open) =>
                              setOpenById((current) => ({ ...current, [step.id]: open }))
                            }
                          >
                            <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
                            <TraceCollapsibleContent>
                              {step.reasoning ? (
                                <p>{step.reasoning.slice(0, isLive ? run.chars : undefined)}</p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="font-mono text-xs break-all">{step.raw}</p>
                                  <Button size="sm" variant="outline" onClick={() => open(step)}>
                                    {openLabel(step)}
                                  </Button>
                                </div>
                              )}
                            </TraceCollapsibleContent>
                          </TraceCollapsible>
                        );
                      })}
                  </Trace>
                </Fragment>
              ))}
            </div>
          )}
          {!running && run.cutFrom === null && view !== "raw" && (
            <Marker>
              <MarkerIcon>
                <Check />
              </MarkerIcon>
              <MarkerContent className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-[13px] leading-5">
                <span className="text-foreground">Run complete</span>
                <span className="text-[11px] text-muted-foreground">
                  8 steps <span aria-hidden="true">·</span> {elapsed.toFixed(1)}s
                </span>
              </MarkerContent>
            </Marker>
          )}
        </CardContent>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-3 py-3">
          <p className="text-[11px] text-muted-foreground">
            {files} files touched <span aria-hidden="true">·</span> {tools} tools called
          </p>
          <p role="status" className="sr-only">
            {run.cutFrom !== null
              ? `${run.at} steps completed · remaining steps cancelled`
              : running
                ? `${Math.min(run.at + 1, FEED_STEPS.length)} of ${FEED_STEPS.length} steps${run.paused ? " · paused" : ""}`
                : "All steps completed"}
          </p>
          <div className="flex gap-1">
            {running && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setRun((current) => ({ ...current, paused: !current.paused }))}
              >
                {run.paused ? <Play /> : <Pause />}
                {run.paused ? "Resume" : "Pause"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={
                running
                  ? () => {
                      setRun((current) => stopFeed(current));
                      toast.info("Run stopped. Completed work is preserved.");
                    }
                  : () => restart()
              }
            >
              {running ? <Square className="size-3" /> : <RotateCcw className="size-3" />}
              {running ? "Stop" : "Rerun"}
            </Button>
          </div>
        </footer>
      </Card>
    </div>
  );
}
