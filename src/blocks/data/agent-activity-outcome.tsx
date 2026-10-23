/** Actual free REUI Frame/Badge plus c-marker-5 changed-file composition.
 * c-trace-13 supplies explicit failure/skipped semantics; original local state
 * adds scoped retry, dependency recovery, keep/undo and discard/restore.
 * https://reui.io/r/radix-nova/c-marker-5.json
 * https://reui.io/r/radix-nova/c-trace-13.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 */
import { useEffect, useState } from "react";
import {
  Check,
  CircleAlert,
  Copy,
  Ellipsis,
  FileText,
  KeyRound,
  RotateCcw,
  SkipForward,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import {
  beginOutcomeRetry,
  clearOutcomeBlocker,
  createOutcome,
  keepOutcome,
  resolveOutcomeRetry,
  undoKeepOutcome,
  type OutcomeItem,
} from "./agent-activity-model";

function visibleStatus(item: OutcomeItem) {
  return item.status === "done" && !item.checked ? "unsupported" : item.status;
}
export default function RunOutcomeReport() {
  const [state, setState] = useState(createOutcome);
  useEffect(() => {
    if (!state.retrying.length || state.discarded) return;
    const timer = window.setTimeout(() => setState(resolveOutcomeRetry), 1000);
    return () => window.clearTimeout(timer);
  }, [state.retrying, state.discarded]);
  const verified = state.items.filter((item) => visibleStatus(item) === "done").length;
  const remaining = state.items.filter(
    (item) => item.status === "failed" || item.status === "skipped",
  );
  const canRetry =
    beginOutcomeRetry(
      state,
      remaining.map((item) => item.id),
    ).retrying.length > 0;
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        [
          "Bricklane · Workspace settings outcome",
          ...state.items.map((item) => `[${visibleStatus(item)}] ${item.title}: ${item.detail}`),
        ].join("\n"),
      );
      toast.success("Outcome summary copied");
    } catch {
      toast.error("Clipboard is unavailable");
    }
  }
  function discard() {
    setState((current) => ({ ...current, discarded: true, retrying: [] }));
    toast.info("Run discarded locally. You can restore it.");
  }
  return (
    <div className="mx-auto w-full max-w-2xl py-3" data-agent-activity="outcome">
      <Frame>
        <FrameHeader className="flex-row items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <FrameTitle>Workspace settings updated</FrameTitle>
            <FrameDescription className="mt-1 text-xs">
              Run BL-2048 <span className="px-1">·</span> Finished just now
            </FrameDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Outcome actions">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={copy}>
                <Copy />
                Copy Summary
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info("Full activity · local demo run BL-2048")}
              >
                Full activity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={discard}>
                <Trash2 />
                Discard run
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </FrameHeader>
        <FramePanel className="space-y-5">
          {state.discarded ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Trash2 />
                </EmptyMedia>
                <EmptyTitle>Run discarded</EmptyTitle>
                <EmptyDescription>
                  The local outcome is hidden. Restore it to review or retry its items.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState((current) => ({ ...current, discarded: false }))}
              >
                <RotateCcw />
                Restore run
              </Button>
            </Empty>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning-foreground">
                  <CircleAlert className="size-4" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {remaining.length
                      ? "Finished with a few loose ends"
                      : "All retryable items recovered"}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {verified} verified successes.{" "}
                    {remaining.length
                      ? "The changes are ready, but the issue and its release-note link still need attention."
                      : "The follow-up and its dependent release-note link are now recorded."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Outcome totals">
                <Badge variant="success-light">{verified} done</Badge>
                <Badge variant="destructive-light">
                  {state.items.filter((item) => item.status === "failed").length} failed
                </Badge>
                <Badge variant="outline">
                  {state.items.filter((item) => item.status === "skipped").length} skipped
                </Badge>
                <Badge variant="warning-light">
                  {state.items.filter((item) => visibleStatus(item) === "unsupported").length}{" "}
                  unsupported
                </Badge>
              </div>
              <div className="space-y-3" aria-label="Outcome items">
                {state.items.map((item, index) => {
                  const status = visibleStatus(item);
                  const retrying = state.retrying.includes(item.id);
                  const dependent =
                    item.id === "link" &&
                    state.items.find((entry) => entry.id === "issue")?.status !== "done";
                  const failed = status === "failed" || status === "skipped";
                  return (
                    <div key={item.id} className="space-y-2" data-outcome-item={item.id}>
                      <Marker
                        variant={index === state.items.length - 1 ? "default" : "border"}
                        className="items-start gap-2.5 pb-3"
                      >
                        <MarkerIcon className="mt-0.5">
                          {retrying ? (
                            <Spinner />
                          ) : status === "done" ? (
                            <Check />
                          ) : status === "skipped" ? (
                            <SkipForward />
                          ) : status === "unsupported" ? (
                            <FileText />
                          ) : (
                            <CircleAlert />
                          )}
                        </MarkerIcon>
                        <MarkerContent className="flex-1">
                          <span className="block text-sm font-medium text-foreground">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed break-words">
                            {item.detail}
                          </span>
                          {status === "unsupported" && (
                            <span className="mt-1 block text-xs">
                              Reported by the agent; not independently checked.
                            </span>
                          )}
                          {item.needsYou ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 h-7 text-xs"
                              onClick={() => {
                                setState((current) => clearOutcomeBlocker(current, item.needsYou!));
                                toast.success(
                                  "Blocker cleared locally. No server permission changed.",
                                );
                              }}
                            >
                              <KeyRound />
                              Grant {item.needsYou}
                            </Button>
                          ) : (
                            failed && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  disabled={retrying || dependent || state.retrying.length > 0}
                                  aria-label={`Retry ${item.title}`}
                                  onClick={() =>
                                    setState((current) => beginOutcomeRetry(current, [item.id]))
                                  }
                                >
                                  {retrying ? <Spinner /> : <RotateCcw />}
                                  {retrying ? "Retrying" : "Retry item"}
                                </Button>
                                {dependent && (
                                  <span className="text-xs text-muted-foreground">
                                    Retry after the issue is created
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </MarkerContent>
                        <Badge
                          size="sm"
                          className="mt-0.5"
                          variant={
                            retrying
                              ? "info-light"
                              : status === "done"
                                ? "success-light"
                                : status === "failed"
                                  ? "destructive-light"
                                  : status === "unsupported"
                                    ? "warning-light"
                                    : "outline"
                          }
                        >
                          {retrying
                            ? "Retrying"
                            : status === "done"
                              ? "Done"
                              : status === "failed"
                                ? "Failed"
                                : status === "unsupported"
                                  ? "Unsupported"
                                  : "Skipped"}
                        </Badge>
                      </Marker>
                    </div>
                  );
                })}
              </div>
              {state.kept && (
                <div
                  role="status"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                >
                  <p className="text-xs">
                    Verified successes kept. Unchecked output remains unsupported.
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => setState(undoKeepOutcome)}>
                    Undo keep
                  </Button>
                </div>
              )}
            </>
          )}
        </FramePanel>
        {!state.discarded && (
          <FrameFooter className="flex-row flex-wrap items-center justify-between gap-3 py-2">
            <ButtonGroup aria-label="Outcome resolution">
              <Button
                size="sm"
                disabled={state.kept || state.retrying.length > 0}
                onClick={() => setState(keepOutcome)}
              >
                {state.kept ? <Check /> : null}
                {state.kept ? "Successes kept" : "Keep what succeeded"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={discard}
                disabled={state.retrying.length > 0}
              >
                Discard
              </Button>
            </ButtonGroup>
            <Button
              size="sm"
              variant="ghost"
              disabled={!canRetry || state.retrying.length > 0}
              onClick={() =>
                setState((current) =>
                  beginOutcomeRetry(
                    current,
                    remaining.map((item) => item.id),
                  ),
                )
              }
            >
              <RotateCcw />
              Retry remaining
            </Button>
          </FrameFooter>
        )}
      </Frame>
    </div>
  );
}
