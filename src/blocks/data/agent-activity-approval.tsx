/** Actual free REUI c-trace-5 approval composition/effect/focus handoff, extended
 * with original independent gating state and the official REUI Frame/Badge.
 * Free c-marker-3/4 supplies the concise live/phase row composition.
 * Sources: https://reui.io/r/radix-nova/c-trace-5.json
 * https://reui.io/r/radix-nova/c-marker-3.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 */
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  CircleDashed,
  Copy,
  Ellipsis,
  FileText,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Trace, TraceDescription, TraceIcon, TraceLine, TraceTitle } from "@/components/ui/trace";
import {
  APPROVAL_STEPS,
  advanceApproval,
  approvalStepState,
  createApprovalRun,
  decideApproval,
  type ApprovalDecision,
} from "./agent-activity-model";

export default function ApprovalRunConsole() {
  const [run, setRun] = useState(createApprovalRun);
  const [note, setNote] = useState("");
  const [revising, setRevising] = useState(false);
  const [finishedOpen, setFinishedOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const step = APPROVAL_STEPS[run.at];
  const waiting = step?.kind === "approval" || step?.kind === "question";
  const finished = APPROVAL_STEPS.slice(0, run.at);
  const queued = APPROVAL_STEPS.slice(run.at + 1);
  const complete = !step;

  // Actual c-trace-5 phase timer pattern: the planned rows become the rows
  // that execute, one at a time. Approval and question rows stop this effect.
  useEffect(() => {
    if (!step || waiting || run.paused) return;
    const timer = window.setTimeout(
      () => setRun((current) => advanceApproval(current, APPROVAL_STEPS)),
      step.durationMs,
    );
    return () => window.clearTimeout(timer);
  }, [step, waiting, run.paused]);

  function decide(decision: ApprovalDecision) {
    const next = decideApproval(run, APPROVAL_STEPS, decision, note);
    if (next === run) return;
    setRun(next);
    setNote("");
    setRevising(false);
    setAnnouncement(
      decision === "answer"
        ? "Answer recorded. Continuing the run."
        : decision === "approve"
          ? "Approved. Continuing the planned steps."
          : `Request ${decision === "deny" ? "denied" : "returned for revision"}. Its dependent steps will be skipped.`,
    );
    // The official free approval example moves focus when the prompt unmounts.
    window.requestAnimationFrame(() => statusRef.current?.focus());
  }
  function restart() {
    setRun(createApprovalRun());
    setRevising(false);
    setNote("");
    setAnnouncement("Run reset to its first approval");
  }
  async function copy() {
    const text = [
      "Bricklane · Billing settings run",
      ...APPROVAL_STEPS.map((entry, i) => {
        const decision = run.decisions[entry.id];
        return `${approvalStepState(run, entry, i)}: ${entry.title}${decision ? ` · ${decision.decision}${decision.note ? `: ${decision.note}` : ""}` : ""}`;
      }),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Run summary copied");
    } catch {
      toast.error("Clipboard is unavailable");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl py-3" data-agent-activity="approval">
      <Frame>
        <FrameHeader className="gap-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <FrameTitle>Update billing settings</FrameTitle>
              <FrameDescription className="mt-1 text-xs">
                Workspace agent <span className="px-1">·</span> Run BL-2048
              </FrameDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="Approval run actions" variant="ghost" size="icon-sm">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copy}>
                  <Copy />
                  Copy Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={restart}>
                  <RotateCcw />
                  Restart run
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <Badge variant={complete ? "success-light" : waiting ? "warning-light" : "info-light"}>
              {complete
                ? "Completed"
                : waiting
                  ? "Needs your input"
                  : run.paused
                    ? "Paused"
                    : "Working"}
            </Badge>
            <span>
              {run.at} of {APPROVAL_STEPS.length} steps settled
            </span>
          </div>
          <Progress
            aria-label="Run progress"
            value={(run.at / APPROVAL_STEPS.length) * 100}
            className="h-1"
          />
        </FrameHeader>
        <FramePanel className="space-y-5">
          <Collapsible open={finishedOpen} onOpenChange={setFinishedOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-sm py-1 text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Check className="size-3.5" />
              {finished.length} finished steps
              <ChevronDown
                className={cn(
                  "ms-auto size-3.5 transition-transform",
                  finishedOpen && "rotate-180",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <Trace>
                {finished.map((entry, index) => {
                  const skipped = approvalStepState(run, entry, index) === "skipped";
                  const decision = run.decisions[entry.id];
                  return (
                    <TraceLine key={entry.id} status={skipped ? "pending" : undefined}>
                      <TraceIcon>{skipped ? <SkipForward /> : <Check />}</TraceIcon>
                      <TraceTitle className="whitespace-normal">
                        {skipped ? "Skipped: " : "Done: "}
                        {entry.title}
                        {decision?.note && (
                          <span className="block text-xs text-muted-foreground">
                            {decision.note}
                          </span>
                        )}
                      </TraceTitle>
                      {decision && <TraceDescription>{decision.decision}</TraceDescription>}
                    </TraceLine>
                  );
                })}
              </Trace>
            </CollapsibleContent>
          </Collapsible>
          {step ? (
            <div className="space-y-3">
              <Marker>
                <MarkerIcon>
                  {waiting ? <ShieldCheck /> : run.paused ? <CircleDashed /> : <Spinner />}
                </MarkerIcon>
                <MarkerContent className="font-medium text-foreground">
                  {waiting ? "Waiting for you" : run.paused ? "Paused" : "In progress"}
                </MarkerContent>
                {step.highImpact && <Badge variant="warning-light">High impact</Badge>}
              </Marker>
              {waiting ? (
                <Item variant="outline" className="flex-col items-stretch gap-4 p-4">
                  <ItemContent>
                    <ItemTitle className="text-sm">{step.title}</ItemTitle>
                    <ItemDescription className="mt-1 leading-relaxed">
                      {step.detail}
                    </ItemDescription>
                  </ItemContent>
                  {(step.kind === "question" || revising) && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        decide(revising ? "revise" : "answer");
                      }}
                    >
                      <InputGroup>
                        <InputGroupTextarea
                          ref={inputRef}
                          aria-label={revising ? "Revision notes" : "Workspace slug"}
                          placeholder={
                            revising ? "Tell the agent what to change…" : "e.g. bricklane-labs"
                          }
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          className="min-h-18"
                        />
                        <InputGroupAddon align="block-end">
                          <span className="flex-1 text-xs text-muted-foreground">
                            {revising
                              ? "Your notes return this step for revision"
                              : "Only used by this local demo"}
                          </span>
                          <InputGroupButton
                            type="submit"
                            size="icon-xs"
                            aria-label={revising ? "Send revision" : "Submit answer"}
                            disabled={!note.trim()}
                          >
                            <ArrowUp />
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                    </form>
                  )}
                  {step.kind === "approval" && (
                    <ItemActions className="flex flex-wrap justify-end gap-2">
                      {revising ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRevising(false);
                            setNote("");
                          }}
                        >
                          Cancel revision
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => decide("deny")}>
                            Deny
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRevising(true);
                              window.requestAnimationFrame(() => inputRef.current?.focus());
                            }}
                          >
                            Revise
                          </Button>
                          <Button size="sm" onClick={() => decide("approve")}>
                            Approve
                          </Button>
                        </>
                      )}
                    </ItemActions>
                  )}
                </Item>
              ) : (
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                  {step.target && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      onClick={() => toast.info(`${step.target} · local demo`)}
                    >
                      {step.kind === "command" ? <Terminal /> : <FileText />}
                      {step.kind === "command" ? "Open console" : "Open file"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Check className="mt-0.5 size-4 text-success" />
              <div>
                <p className="text-sm font-medium">Run complete</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  All decisions have been recorded. Completed changes are preserved.
                </p>
              </div>
            </div>
          )}
          {queued.length > 0 && (
            <div className="space-y-3">
              <Marker variant="separator">
                <MarkerContent className="text-xs">Up next</MarkerContent>
              </Marker>
              {queued.map((entry) => (
                <Marker key={entry.id}>
                  <MarkerIcon>
                    <CircleDashed />
                  </MarkerIcon>
                  <MarkerContent className="flex-1 text-xs">{entry.title}</MarkerContent>
                  {entry.kind === "approval" && (
                    <Badge size="sm" variant={entry.highImpact ? "warning-light" : "outline"}>
                      {entry.highImpact ? "High impact" : "Approval"}
                    </Badge>
                  )}
                  {entry.kind === "question" && (
                    <Badge size="sm" variant="outline">
                      Question
                    </Badge>
                  )}
                </Marker>
              ))}
            </div>
          )}
        </FramePanel>
        <FrameFooter className="flex-row flex-wrap items-center justify-between gap-3 py-2">
          <p
            ref={statusRef}
            role="status"
            tabIndex={-1}
            className="max-w-full flex-1 text-xs text-muted-foreground outline-none"
          >
            {announcement || "You stay in control of changes that need approval."}
          </p>
          {!waiting && !complete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRun((current) => ({ ...current, paused: !current.paused }))}
            >
              {run.paused ? <Play /> : <Pause />}
              {run.paused ? "Resume" : "Pause"}
            </Button>
          )}
          {complete && (
            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw />
              Run again
            </Button>
          )}
        </FrameFooter>
      </Frame>
    </div>
  );
}
