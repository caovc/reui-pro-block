/** Actual official free REUI c-marker-2/3/4 compositions.
 * https://reui.io/r/radix-nova/c-marker-2.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 * Reused: tool Marker rows, timed progression and stable Stop/Rerun controls.
 * Summary, Detailed and Raw follow the observed official preview behavior.
 * Free c-avatar-1 supplies the Avatar/Fallback composition; original initials
 * replace its photograph. Original fixtures and transcript actions are local.
 */
import { useEffect, useState } from "react";
import "../reference.css";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
      : "Open in console";
}

function copyLabel(step: FeedStep) {
  if (step.file) return "Copy path";
  if (step.tool === "reason") return "Copy topic";
  if (step.tool === "query") return "Copy query";
  if (step.tool === "create_issue") return "Copy name";
  return "Copy command";
}

export default function LiveRunFeed() {
  const [run, setRun] = useState(createFeedRun);
  const [view, setView] = useState("detailed");
  const running = run.cutFrom === null && run.at < FEED_STEPS.length;
  const live = running ? FEED_STEPS[run.at] : undefined;
  const shown = running ? FEED_STEPS.slice(0, run.at + 1) : FEED_STEPS;
  // The live raw view contains observed steps, rather than future queued work.
  // A stopped run still retains the model's explicit cancellation records.
  const transcript = feedTranscript(run, FEED_STEPS)
    .split("\n")
    .filter((line) => !line.startsWith("[queued]"))
    .join("\n");
  const elapsed =
    FEED_STEPS.slice(0, run.at).reduce((sum, entry) => sum + entry.durationMs, 0) / 1000;
  const files = new Set(
    FEED_STEPS.filter((entry, index) => entry.changedFile && index < run.at).map(
      (entry) => entry.target,
    ),
  ).size;
  const tools = FEED_STEPS.filter((entry, index) => entry.countsAsTool && index < run.at).length;

  // Preserve the local progression model and clean up its timer on pause/stop.
  // Rerun starts with the same two completed steps as the official preview.
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

  function restart() {
    setRun({ ...createFeedRun(), at: 2 });
    toast.success("Run restarted from the first unfinished step");
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
    <TooltipProvider>
      <div className="reui-reference min-h-svh w-full px-6 py-16" data-agent-activity="live-feed">
        <Card className="mx-auto w-full max-w-xl gap-0 overflow-hidden py-0 shadow-none">
          <CardHeader className="gap-0 px-3 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Avatar aria-hidden="true">
                  <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-900">
                    JL
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <CardTitle className="min-w-0 truncate text-sm">Fix Workspace Limits</CardTitle>
                    <Badge
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
                  <Button variant="ghost" size="icon-sm" aria-label="Run options">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="reui-reference w-52">
                  <DropdownMenuGroup aria-label="Detail">
                    <DropdownMenuLabel>Detail</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={view} onValueChange={setView}>
                      <DropdownMenuRadioItem
                        value="summary"
                        onSelect={(event) => event.preventDefault()}
                      >
                        Summary
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="detailed"
                        onSelect={(event) => event.preventDefault()}
                      >
                        Detailed
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="raw"
                        onSelect={(event) => event.preventDefault()}
                      >
                        Raw
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup aria-label="Export">
                    <DropdownMenuLabel>Export</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => copyText(transcript, "Run transcript")}>
                      <Copy />
                      Copy Transcript
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={download}>
                      <Download />
                      Download Log
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="border-t px-0 py-3">
            {view === "raw" ? (
              <CodeBlock
                code={transcript}
                language="text"
                highlight={false}
                variant="ghost"
                wrap
                className="mx-3 max-w-full rounded-none text-muted-foreground [--code-block-font-size:11px] [--code-block-line-height:1.625rem] [--code-block-padding:0px]"
              />
            ) : (
              <div className="flex min-w-0 flex-col" aria-label="Run steps">
                {shown.map((step, index) => (
                  <Marker
                    key={step.id}
                    className="group/step relative h-[34px] min-w-0 gap-2 px-3"
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
                      <span className="max-w-[75%] shrink-0 truncate text-foreground">
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
                    <div
                      className={cn(
                        "absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 rounded-md bg-card opacity-0 group-hover/step:opacity-100 group-focus-within/step:opacity-100",
                        view === "detailed" ? "right-14" : "right-3",
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="size-6"
                            aria-label={`Copy ${step.title}`}
                            onClick={() => copyText(step.target, "Step target")}
                          >
                            <Copy className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="reui-reference" side="top" sideOffset={4}>
                          {copyLabel(step)}
                        </TooltipContent>
                      </Tooltip>
                      {step.tool !== "reason" &&
                        step.tool !== "search" &&
                        step.tool !== "run_command" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                className="size-6"
                                aria-label={`${openLabel(step)}: ${step.title}`}
                                onClick={() => open(step)}
                              >
                                <ExternalLink className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="reui-reference" side="top" sideOffset={4}>
                              {openLabel(step)}
                            </TooltipContent>
                          </Tooltip>
                        )}
                    </div>
                    {view === "detailed" && (
                      <span
                        data-duration
                        className="w-10 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums"
                      >
                        {index < run.at ? `${(step.durationMs / 1000).toFixed(1)}s` : "—"}
                      </span>
                    )}
                  </Marker>
                ))}
              </div>
            )}
            {!running && run.cutFrom === null && view !== "raw" && (
              <Marker className="h-[34px] gap-2 px-3">
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
            <p className="text-xs text-muted-foreground">
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

                  onClick={() => setRun((current) => ({ ...current, paused: !current.paused }))}
                >
                  {run.paused ? <Play /> : <Pause />}
                  {run.paused ? "Resume" : "Pause"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"

                onClick={
                  running
                    ? () => {
                        setRun((current) => stopFeed(current));
                        toast.info("Run stopped. Completed work is preserved.");
                      }
                    : () => restart()
                }
              >
                {running ? <Square className="size-3.5" /> : <RotateCcw className="size-3.5" />}
                {running ? "Stop" : "Rerun"}
              </Button>
            </div>
          </footer>
        </Card>
      </div>
    </TooltipProvider>
  );
}
