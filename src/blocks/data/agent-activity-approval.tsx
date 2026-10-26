/** Actual free REUI c-trace-5 progression/approval/focus handoff, Marker
 * state rows and official Frame/Badge; c-input-group-10 inline action field.
 * https://reui.io/r/radix-nova/c-trace-5.json
 * https://reui.io/r/radix-nova/c-marker-3.json
 * https://reui.io/r/radix-nova/c-input-group-10.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 * Compact persistent sequence follows the actual public desktop/393px notes
 * in docs/audits/activity1-native-reference.md. Fixtures and workflow remain
 * independent. Answer/revision/completion structure was publicly observed;
 * Later public menu observations are recorded in the independent menu ledger.
 * The grouped menu composes actual free c-dropdown-menu-6/7/8 patterns:
 * https://reui.io/r/radix-nova/c-dropdown-menu-8.json
 * Local state, checkbox/radio bindings and the approved workflow remain original.
 */
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  CircleDashed,
  CircleHelp,
  Copy,
  Ellipsis,
  ExternalLink,
  FileText,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  SkipForward,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Item, ItemActions, ItemContent, ItemDescription } from "@/components/ui/item";
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
  type RunStep,
  type StepState,
} from "./agent-activity-model";

function RunIcon({ entry, state, paused }: { entry: RunStep; state: StepState; paused: boolean }) {
  if (state === "skipped") return <SkipForward />;
  if (state === "running") return paused ? <CircleDashed /> : <Spinner />;
  if (entry.kind === "question") return <CircleHelp />;
  if (entry.kind === "approval") return <ShieldCheck />;
  if (entry.kind === "command") return <Terminal />;
  if (entry.kind === "write") return <Pencil />;
  return <FileText />;
}
function durationLabel(ms: number) {
  return ms ? `${(ms / 1000).toFixed(1)}s` : "—";
}

export default function ApprovalRunConsole() {
  const [run, setRun] = useState(createApprovalRun);
  const [note, setNote] = useState("");
  const [revising, setRevising] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [showPaths, setShowPaths] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [foldFinished, setFoldFinished] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const statusRef = useRef<HTMLParagraphElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const step = APPROVAL_STEPS[run.at];
  const waiting = step?.kind === "approval" || step?.kind === "question";
  const complete = !step;
  const elapsed = APPROVAL_STEPS.reduce(
    (sum, entry, index) =>
      sum + (approvalStepState(run, entry, index) === "done" ? entry.durationMs : 0),
    0,
  );
  const liveStatus = complete
    ? "Run complete"
    : `${run.paused ? "Paused" : waiting ? "Waiting for you" : "In progress"}: ${step.title}`;

  // Actual c-trace-5 phase timer pattern, unchanged: a gate stops the effect,
  // and decisions only advance through the existing shared state machine.
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
  async function copyTarget(entry: RunStep) {
    try {
      await navigator.clipboard.writeText(entry.target ?? entry.title);
      toast.success("Step reference copied");
    } catch {
      toast.error("Clipboard is unavailable");
    }
  }

  return (
    <div
      className="flex min-h-svh w-full items-start justify-center px-6 py-16"
      data-agent-activity="approval"
    >
      <Frame className="w-full max-w-xl" spacing="sm" data-approval-card data-density={density}>
        <FrameHeader className="flex-row items-center gap-2 px-4 py-2.5" data-approval-header>
          <FrameTitle className="min-w-0 flex-1 truncate text-[13px]">
            Update billing settings
          </FrameTitle>
          <Badge
            size="sm"
            variant={complete ? "success-light" : waiting ? "warning-light" : "info-light"}
          >
            {complete
              ? "Completed"
              : waiting
                ? "Needs your input"
                : run.paused
                  ? "Paused"
                  : "Working"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Approval run actions" variant="ghost" size="icon-xs">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            {/* Free c-dropdown-menu-8 grouped composition, with the controlled
                checkbox/radio patterns from c-dropdown-menu-6/7. */}
            <DropdownMenuContent align="end" className="w-56" data-approval-run-menu>
              <DropdownMenuGroup>
                <DropdownMenuLabel>View</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={showPaths}
                  onCheckedChange={setShowPaths}
                  onSelect={(event) => event.preventDefault()}
                >
                  File Paths
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showNotes}
                  onCheckedChange={setShowNotes}
                  onSelect={(event) => event.preventDefault()}
                >
                  Step Notes
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={foldFinished}
                  onCheckedChange={setFoldFinished}
                  onSelect={(event) => event.preventDefault()}
                >
                  Fold Finished Steps
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
                <DropdownMenuLabel>Density</DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="comfortable"
                  onSelect={(event) => event.preventDefault()}
                >
                  Comfortable
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="compact" onSelect={(event) => event.preventDefault()}>
                  Compact
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Run</DropdownMenuLabel>
                <DropdownMenuItem onClick={copy}>
                  <Copy />
                  Copy Summary
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={restart}>
                  <RotateCw />
                  Restart Run
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </FrameHeader>
        <FramePanel className={cn("px-4", density === "compact" ? "py-3" : "py-4")}>
          <Trace
            ref={historyRef}
            tabIndex={-1}
            role="list"
            aria-label="Visible run steps"
            className={cn("outline-none", density === "compact" ? "gap-2" : "gap-3.5")}
          >
            {APPROVAL_STEPS.map((entry, index) => {
              const state = approvalStepState(run, entry, index);
              const active = index === run.at;
              const gated = active && waiting;
              const decision = run.decisions[entry.id];
              const provider =
                entry.target ??
                (entry.kind === "question"
                  ? "Question"
                  : entry.kind === "approval"
                    ? (decision?.decision ?? "Approval")
                    : entry.phase);
              return (
                <Collapsible
                  key={entry.id}
                  open={!foldFinished || (state !== "done" && state !== "skipped")}
                  className={cn(
                    foldFinished && (state === "done" || state === "skipped") && "hidden",
                  )}
                >
                  <CollapsibleContent asChild>
                    <div role="listitem" data-approval-step={entry.id} data-step-state={state}>
                      <Item
                        variant={gated ? "muted" : "default"}
                        className={cn("block rounded-lg border-0 p-0", gated && "bg-muted/65 p-3")}
                      >
                        <div className="group/approval-row">
                          <TraceLine
                            status={
                              state === "running" && !run.paused
                                ? "running"
                                : state === "queued" || state === "skipped"
                                  ? "pending"
                                  : undefined
                            }
                            className="w-full items-start gap-2"
                          >
                            <TraceIcon className="mt-0.5 size-3.5">
                              <RunIcon entry={entry} state={state} paused={run.paused} />
                            </TraceIcon>
                            <TraceTitle className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-normal sm:flex-row sm:items-center sm:gap-2">
                              <span
                                className={cn(
                                  "min-w-0 text-[13px] leading-5",
                                  state === "waiting" && "font-medium text-foreground",
                                )}
                              >
                                <span className="sr-only">
                                  {state === "done"
                                    ? "Completed: "
                                    : state === "running"
                                      ? run.paused
                                        ? "Paused: "
                                        : "Running: "
                                      : state === "queued"
                                        ? "Queued: "
                                        : state === "waiting"
                                          ? "Waiting: "
                                          : ""}
                                </span>
                                <span data-step-title>
                                  {state === "skipped" ? "Skipped: " : ""}
                                  {entry.title}
                                </span>
                              </span>
                              <span
                                className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground"
                                data-step-reference
                              >
                                {showPaths && (
                                  <span className="min-w-0 truncate font-mono" data-step-path>
                                    {provider}
                                  </span>
                                )}
                                {entry.highImpact && (
                                  <Badge
                                    size="sm"
                                    variant="warning-light"
                                    className="shrink-0 text-[9px]"
                                  >
                                    High impact
                                  </Badge>
                                )}
                                <span
                                  className="ms-auto inline-flex shrink-0 items-center sm:ms-0 sm:opacity-0 sm:transition-opacity sm:group-hover/approval-row:opacity-100 sm:group-focus-within/approval-row:opacity-100"
                                  data-step-actions
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    className="size-5"
                                    aria-label={`Copy ${entry.target ?? entry.title}`}
                                    onClick={() => copyTarget(entry)}
                                  >
                                    <Copy className="size-3" />
                                  </Button>
                                  {entry.target && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      className="size-5"
                                      aria-label={`Open ${entry.target}`}
                                      onClick={() => toast.info(`${entry.target} · local demo`)}
                                    >
                                      <ExternalLink className="size-3" />
                                    </Button>
                                  )}
                                </span>
                              </span>
                            </TraceTitle>
                            <TraceDescription
                              className="min-w-7 text-right text-[10px] leading-5"
                              data-step-duration
                            >
                              {state === "done"
                                ? durationLabel(entry.durationMs)
                                : state === "running"
                                  ? run.paused
                                    ? "Ⅱ"
                                    : "…"
                                  : "—"}
                            </TraceDescription>
                          </TraceLine>
                        </div>
                        {gated && (
                          <ItemContent className="ms-5 mt-2 gap-2" data-inline-approval-gate>
                            <ItemDescription className="line-clamp-none text-[11px] leading-5">
                              {entry.detail}
                            </ItemDescription>
                            {(entry.kind === "question" || revising) && (
                              <form
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  decide(revising ? "revise" : "answer");
                                }}
                              >
                                <Field className="w-full">
                                  <InputGroup className="h-8 bg-background has-disabled:bg-background has-disabled:opacity-100 dark:has-disabled:bg-background">
                                    <InputGroupInput
                                      ref={inputRef}
                                      aria-label={revising ? "Revision notes" : "Workspace slug"}
                                      placeholder={
                                        revising
                                          ? "Tell the agent what to change…"
                                          : "e.g. bricklane-labs"
                                      }
                                      value={note}
                                      onChange={(event) => setNote(event.target.value)}
                                      className="min-w-0 text-xs"
                                    />
                                    <InputGroupAddon align="inline-end" className="pe-1">
                                      <InputGroupButton
                                        type="submit"
                                        size="xs"
                                        variant="ghost"
                                        aria-label={revising ? "Send revision" : "Submit answer"}
                                        disabled={!note.trim()}
                                        className="h-6 gap-1 text-[10px]"
                                      >
                                        Send
                                        <ArrowUp className="size-3" />
                                      </InputGroupButton>
                                    </InputGroupAddon>
                                  </InputGroup>
                                </Field>
                              </form>
                            )}
                            {entry.kind === "approval" && (
                              <ItemActions className="flex flex-wrap justify-end gap-1.5">
                                {revising ? (
                                  <Button
                                    size="xs"
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
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      onClick={() => decide("deny")}
                                    >
                                      Deny
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      onClick={() => {
                                        setRevising(true);
                                        window.requestAnimationFrame(() =>
                                          inputRef.current?.focus(),
                                        );
                                      }}
                                    >
                                      Revise
                                    </Button>
                                    <Button size="xs" onClick={() => decide("approve")}>
                                      Approve
                                    </Button>
                                  </>
                                )}
                              </ItemActions>
                            )}
                          </ItemContent>
                        )}
                        {showNotes && !gated && (
                          <p
                            className="ms-5 mt-1 text-[11px] leading-5 text-muted-foreground"
                            data-step-note
                          >
                            {entry.detail}
                          </p>
                        )}
                        {decision?.note && !active && (
                          <p
                            className="ms-5 mt-1 text-[10px] leading-4 text-muted-foreground"
                            data-recorded-decision
                          >
                            {decision.note}
                          </p>
                        )}
                      </Item>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            <div
              role="listitem"
              data-approval-step="complete"
              data-step-state={complete ? "done" : "queued"}
            >
              <Marker className={cn("gap-2 text-[13px] leading-5", !complete && "opacity-50")}>
                <MarkerIcon className="size-3.5">
                  {complete ? <Check /> : <CircleDashed />}
                </MarkerIcon>
                <MarkerContent>{complete ? "Run complete" : "Complete the run"}</MarkerContent>
              </Marker>
            </div>
          </Trace>
        </FramePanel>
        <FrameFooter
          className="flex-row items-center justify-between gap-2 px-4 py-2"
          data-approval-footer
        >
          <div className="flex min-w-0 items-center gap-2 text-[10px] text-muted-foreground">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-5 px-0 text-[10px] font-normal"
              aria-label={`${run.at} finished steps · jump to visible run history`}
              onClick={() => {
                setFoldFinished(false);
                window.requestAnimationFrame(() =>
                  historyRef.current?.focus({ preventScroll: true }),
                );
              }}
            >
              Step {Math.min(run.at + 1, APPROVAL_STEPS.length + 1)} of {APPROVAL_STEPS.length + 1}
            </Button>
            <span aria-label={`Recorded work time ${elapsed / 1000} seconds`}>
              {(elapsed / 1000).toFixed(1)}s elapsed
            </span>
          </div>
          <p ref={statusRef} role="status" tabIndex={-1} className="sr-only outline-none">
            {announcement ? `${announcement} ${liveStatus}` : liveStatus}
          </p>
          <Progress
            aria-label="Run progress"
            value={(run.at / APPROVAL_STEPS.length) * 100}
            className="sr-only h-px w-px"
          />
          {!waiting && !complete && (
            <Button
              variant="ghost"
              size="xs"
              className="h-5 text-[10px]"
              onClick={() => setRun((current) => ({ ...current, paused: !current.paused }))}
            >
              {run.paused ? <Play /> : <Pause />}
              {run.paused ? "Resume" : "Pause"}
            </Button>
          )}
          {complete && (
            <Button variant="ghost" size="xs" className="h-5 text-[10px]" onClick={restart}>
              <RotateCcw />
              Run again
            </Button>
          )}
        </FrameFooter>
      </Frame>
    </div>
  );
}
