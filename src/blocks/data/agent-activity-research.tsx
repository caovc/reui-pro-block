/** Actual official free REUI Timeline composition (c-timeline-1), extended with
 * original source/file evidence and a local timed research replay.
 * https://reui.io/r/radix-nova/c-timeline-1.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 * Publisher initials are original typography, not extracted source-site marks.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemActions, ItemContent } from "@/components/ui/item";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import "../reference.css";

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

function ResearchAction({
  label,
  tooltip,
  onClick,
  children,
}: {
  label: string;
  tooltip: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="size-6 [&_svg]:size-3"
          aria-label={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="reui-reference" side="top" sideOffset={4}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

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
  const stages = ["Searching", "Reviewing sources", "Checking the repo", "Answer"];
  const rowActions =
    "shrink-0 gap-0.5 sm:opacity-0 sm:group-hover/item:opacity-100 sm:group-focus-within/item:opacity-100";

  return (
    <TooltipProvider>
      <div className="reui-reference min-h-svh w-full px-6 py-16" data-agent-activity="research">
        <div className="mx-auto w-full max-w-xl">
          <Marker role="status" className="mb-2.5 min-h-5 gap-4 text-sm leading-5">
            <MarkerIcon>
              {stage < 4 ? (
                <Spinner className="size-4" />
              ) : (
                <Check className="size-4 text-success" />
              )}
            </MarkerIcon>
            <MarkerContent>
              {stage < 4
                ? "Researching sources and files"
                : `Read ${SOURCES.length} sources and ${CHECKED.length} files`}
            </MarkerContent>
          </Marker>
          <Timeline value={stage} className="w-full">
            {stages.map((title, index) => {
              const number = index + 1;
              const visible = number <= stage;
              return (
                <TimelineItem
                  key={title}
                  step={number}
                  className="gap-0 has-[+[data-completed]]:**:data-[slot=timeline-separator]:bg-border"
                >
                  <TimelineIndicator className="size-3 border border-border bg-background group-data-completed/timeline-item:border-border group-data-[orientation=vertical]/timeline:top-1" />
                  <TimelineSeparator className="bg-border group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem)] group-data-[orientation=vertical]/timeline:w-px group-data-[orientation=vertical]/timeline:translate-y-5" />
                  <TimelineHeader className="mb-2 flex h-5 items-center gap-2">
                    <TimelineTitle className="leading-5">{title}</TimelineTitle>
                    {number === 2 || number === 3 ? (
                      <Badge
                        variant="outline"
                        className="h-5 min-w-5 justify-center px-1 font-normal tabular-nums"
                      >
                        {number === 2 ? SOURCES.length : CHECKED.length}
                      </Badge>
                    ) : number === 4 && visible ? (
                      <Badge variant="success-light" className="h-5 font-normal">
                        High confidence
                      </Badge>
                    ) : null}
                  </TimelineHeader>
                  <TimelineContent>
                    {!visible ? (
                      <div className="space-y-2" aria-label={`${title}: queued`}>
                        <Skeleton className="h-3 w-4/5" />
                        <Skeleton className="h-3 w-3/5" />
                      </div>
                    ) : number === 1 ? (
                      <Item
                        size="xs"
                        variant="outline"
                        className="h-[38px] flex-nowrap gap-2 rounded-[10px]"
                      >
                        <Search
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <ItemContent className="min-w-0 gap-0">
                          <p className="truncate text-sm leading-5 text-foreground" title={QUERY}>
                            {QUERY}
                          </p>
                        </ItemContent>
                      </Item>
                    ) : number === 2 ? (
                      <Card className="gap-0 rounded-[14px] py-0" aria-label="Cited sources">
                        <CardContent className="px-0 py-1.5">
                          {SOURCES.map((source) => (
                            <Item
                              key={source.id}
                              size="xs"
                              className="h-[34px] flex-nowrap gap-2.5 py-1.5"
                            >
                              <Badge
                                variant="outline"
                                className="size-5 shrink-0 justify-center px-0 font-normal tabular-nums"
                              >
                                {source.id}
                              </Badge>
                              <ItemContent className="min-w-0 flex-row items-center gap-2 group-data-[size=xs]/item:gap-2">
                                <a
                                  href="#"
                                  className="min-w-0 truncate rounded-sm text-sm leading-5 text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    toast.info(
                                      `${source.publisher} · source preview in this local demo`,
                                    );
                                  }}
                                >
                                  {source.title}
                                </a>
                                <ItemActions className={rowActions}>
                                  <ResearchAction
                                    label={`Copy ${source.publisher} source URL`}
                                    tooltip="Copy link"
                                    onClick={() => void copy(source.url, "Source URL")}
                                  >
                                    <Copy />
                                  </ResearchAction>
                                  <ResearchAction
                                    label={`Open ${source.publisher} source`}
                                    tooltip="Open source"
                                    onClick={() =>
                                      toast.info(`${source.title} · ${source.publisher}`)
                                    }
                                  >
                                    <ExternalLink />
                                  </ResearchAction>
                                </ItemActions>
                              </ItemContent>
                              <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                                <span
                                  className="inline-flex size-3.5 items-center justify-center text-[11px] font-medium"
                                  aria-hidden="true"
                                >
                                  {source.initials}
                                </span>
                                <span className="hidden max-w-28 truncate sm:inline">
                                  {source.publisher}
                                </span>
                              </span>
                            </Item>
                          ))}
                        </CardContent>
                      </Card>
                    ) : number === 3 ? (
                      <Card
                        className="gap-0 rounded-[14px] py-0"
                        aria-label="Checked repository files"
                      >
                        <CardContent className="px-0 py-1.5">
                          {CHECKED.map((file) => (
                            <Item
                              key={file.path}
                              size="xs"
                              className="h-[34px] flex-nowrap gap-2.5 py-1.5"
                            >
                              <ItemContent className="min-w-0 flex-row items-center gap-2 group-data-[size=xs]/item:gap-2">
                                <Marker className="min-w-0 flex-1 gap-2.5">
                                  <MarkerIcon className="size-3.5">
                                    <FileText className="size-3.5" />
                                  </MarkerIcon>
                                  <MarkerContent className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                                    {file.path}
                                  </MarkerContent>
                                </Marker>
                                <ItemActions className={rowActions}>
                                  <ResearchAction
                                    label={`Copy path: ${file.path}`}
                                    tooltip="Copy path"
                                    onClick={() => void copy(file.path, "File path")}
                                  >
                                    <Copy />
                                  </ResearchAction>
                                  <ResearchAction
                                    label="Open file"
                                    tooltip="Open file"
                                    onClick={() => toast.info(`${file.path} · local file preview`)}
                                  >
                                    <ExternalLink />
                                  </ResearchAction>
                                </ItemActions>
                              </ItemContent>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {file.lines}
                              </span>
                            </Item>
                          ))}
                        </CardContent>
                      </Card>
                    ) : (
                      <p className="text-sm leading-5 text-foreground">
                        Keep the existing validation. Add a visible “Monthly workspace limit” label,
                        connect it to the input, and explain the unit in helper text.
                      </p>
                    )}
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </div>
      </div>
    </TooltipProvider>
  );
}
