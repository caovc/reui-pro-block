/** Actual official free REUI Timeline composition (c-timeline-1), extended with
 * original source/file evidence cards and a local timed research replay.
 * https://reui.io/r/radix-nova/c-timeline-1.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 * Publisher initials are original typography, not extracted source-site marks.
 */
import { useEffect, useState } from "react";
import { BookOpen, Check, Copy, FileText, Globe, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

const SOURCES = [
  {
    id: 1,
    publisher: "W3C WAI",
    initials: "W",
    title: "Labeling controls",
    description: "Associate a visible label with its form control.",
    url: "https://www.w3.org/WAI/tutorials/forms/labels/",
  },
  {
    id: 2,
    publisher: "MDN Web Docs",
    initials: "M",
    title: "The Label element",
    description: "Explicit labels connect through matching for and id values.",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label",
  },
  {
    id: 3,
    publisher: "React",
    initials: "R",
    title: "Input reference",
    description: "Use an associated label and keep accessible naming stable.",
    url: "https://react.dev/reference/react-dom/components/input",
  },
];
const CHECKED = [
  {
    path: "src/workspace/settings.tsx",
    lines: "L24–62",
    description: "Limit field and visible helper text",
  },
  {
    path: "tests/workspace-settings.spec.ts",
    lines: "L8–41",
    description: "Keyboard and accessible-name checks",
  },
];
const QUERY =
  "How should we make the workspace limit field easier to understand without changing validation?";

export default function ResearchTimeline() {
  const [stage, setStage] = useState(1);
  useEffect(() => {
    if (stage >= 4) return;
    const timer = window.setTimeout(() => setStage((current) => current + 1), 1200);
    return () => window.clearTimeout(timer);
  }, [stage]);
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard is unavailable");
    }
  }
  const stages = [
    { title: "Search the question", time: "0.2s", icon: Search },
    { title: "Read the sources", time: "1.4s", icon: Globe },
    { title: "Check the workspace", time: "2.6s", icon: FileText },
    { title: "Ground the answer", time: "3.8s", icon: Sparkles },
  ];
  return (
    <div className="mx-auto w-full max-w-2xl py-3" data-agent-activity="research">
      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="gap-1.5 border-b p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm">Research trail</CardTitle>
            <Badge variant={stage < 4 ? "info-light" : "success-light"}>
              {stage < 4 ? "Researching" : "Answer ready"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Evidence behind the workspace settings recommendation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <Timeline value={stage} className="w-full">
            {stages.map((entry, index) => {
              const number = index + 1;
              const visible = number <= stage;
              const isLive = number === stage && stage < 4;
              const Icon = entry.icon;
              return (
                <TimelineItem key={entry.title} step={number} className="ms-9 pb-6 last:pb-0">
                  <TimelineIndicator className="-left-6 flex size-6 items-center justify-center border-0 bg-muted text-muted-foreground">
                    {isLive ? (
                      <Spinner className="size-3.5" />
                    ) : visible ? (
                      <Icon className="size-3.5" />
                    ) : (
                      <span className="text-xs">{number}</span>
                    )}
                  </TimelineIndicator>
                  <TimelineSeparator className="-left-6 translate-y-6" />
                  <TimelineHeader className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <TimelineTitle>
                      {entry.title}
                      <span className="sr-only">
                        {isLive ? ": in progress" : visible ? ": complete" : ": queued"}
                      </span>
                    </TimelineTitle>
                    <TimelineDate className="mb-0 h-auto text-[11px] font-normal">
                      {visible ? entry.time : "Queued"}
                    </TimelineDate>
                  </TimelineHeader>
                  <TimelineContent>
                    {!visible ? (
                      <div className="space-y-2" aria-label={`${entry.title}: queued`}>
                        <Skeleton className="h-3 w-4/5" />
                        <Skeleton className="h-3 w-3/5" />
                      </div>
                    ) : number === 1 ? (
                      <div className="group flex items-start gap-2 rounded-lg border bg-muted/20 p-3">
                        <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
                          {QUERY}
                        </p>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          aria-label="Copy research query"
                          onClick={() => copy(QUERY, "Query")}
                        >
                          <Copy />
                        </Button>
                      </div>
                    ) : number === 2 ? (
                      <div className="space-y-2" aria-label="Cited sources">
                        {SOURCES.map((source) => (
                          <div
                            key={source.id}
                            className="group flex items-start gap-2.5 rounded-lg border p-3"
                          >
                            <span
                              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-semibold"
                              aria-hidden="true"
                            >
                              {source.initials}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] text-muted-foreground">
                                [{source.id}] {source.publisher}
                              </p>
                              <button
                                className="mt-0.5 rounded-sm text-left text-sm font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={() =>
                                  toast.info(
                                    `${source.publisher} · source preview in this local demo`,
                                  )
                                }
                              >
                                {source.title}
                              </button>
                              <p className="mt-1 text-xs leading-relaxed">{source.description}</p>
                            </div>
                            <div className="flex shrink-0 flex-col gap-1">
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`Copy ${source.publisher} source URL`}
                                onClick={() => copy(source.url, "Source URL")}
                              >
                                <Copy />
                              </Button>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`Open ${source.publisher} source`}
                                onClick={() => toast.info(`${source.title} · ${source.publisher}`)}
                              >
                                <BookOpen />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : number === 3 ? (
                      <div className="space-y-2" aria-label="Checked repository files">
                        {CHECKED.map((file) => (
                          <div className="rounded-lg border p-3" key={file.path}>
                            <Marker>
                              <MarkerIcon>
                                <FileText />
                              </MarkerIcon>
                              <MarkerContent className="flex-1 font-mono text-xs break-all">
                                {file.path}
                              </MarkerContent>
                              <Badge variant="outline" size="sm">
                                {file.lines}
                              </Badge>
                            </Marker>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs">{file.description}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toast.info(`${file.path} · local file preview`)}
                              >
                                Open file
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Check className="size-4 text-success" />
                          <p className="font-medium text-foreground">
                            Keep the validation, clarify the label
                          </p>
                          <Badge variant="success-light">High confidence</Badge>
                        </div>
                        <p className="text-sm leading-relaxed">
                          Use a visible “Monthly workspace limit” label and connect it to the input.
                          Keep the existing validation, explain the unit in helper text, and verify
                          the field by its accessible name.{" "}
                          <span className="text-xs text-muted-foreground">[1] [2] [3]</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Based on 3 public sources and 2 original demo repository files.
                        </p>
                      </div>
                    )}
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </CardContent>
      </Card>
    </div>
  );
}
