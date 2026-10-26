/** Agentic Task Panel: actual free REUI c-sidebar-4, c-trace-2/4 and
 * c-questionnaire-1 compositions, actual CodeBlock/Badge, Message/Bubble,
 * Attachment and MessageScroller. No Pro source/media or tracker API.
 * https://reui.io/r/radix-nova/c-trace-2.json
 * https://reui.io/r/radix-nova/c-trace-4.json
 * MIT, Copyright (c) 2025 Keenthemes Inc.; preserve REUI-LICENSE.txt.
 * Public desktop/mobile pixels are pending; the state machine is independent.
 */
import { useRef, useState } from "react";
import {
  Check,
  Circle,
  CircleCheck,
  CircleX,
  Download,
  FileText,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { CodeBlock, CodeBlockCopyButton } from "@/components/reui/code-block/code-block";
import { ReuiSidebar } from "@/components/reui/sidebar";
import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Message, MessageContent, MessageHeader } from "@/components/ui/message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useChatDraft } from "./ai-chat-draft";
import { CHAT_CONTEXTS, type ChatMeta } from "./ai-chat-session";
import { AgentTaskBrief, AgentTaskFork } from "./ai-chat-task-brief";
import {
  answerTaskFork,
  createAgentTask,
  createTaskTicket,
  editTaskStep,
  retryTaskStep,
  setTaskBrief,
  skipTaskStep,
  startAgentTask,
  taskArtifact,
  useAgentTask,
  type AgentTask,
} from "./ai-chat-task-model";
import WorkspaceComposer from "./ai-chat-workspace-composer";
import WorkspaceTranscript from "./ai-chat-workspace-transcript";
const INITIAL_META: ChatMeta = {
  model: "Auto",
  effort: "Instant",
  contextIds: [],
  webSearch: false,
  thinking: false,
};
const DEFAULT_PROMPT = "Review the workspace release and prepare a handoff for the team.";
const SOURCES = CHAT_CONTEXTS.slice(0, 3);

function TaskProgress({
  task,
  onChange,
}: {
  task: AgentTask;
  onChange: (task: AgentTask) => void;
}) {
  const [openById, setOpenById] = useState<Record<string, boolean>>({});
  if (task.stage === "ready")
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Edit the ordered plan or uncheck a step before running it.
        </p>
        <div className="space-y-2">
          {task.steps.map((step) => (
            <div key={step.id} className="flex min-w-0 items-center gap-2">
              <Checkbox
                id={`task-plan-${step.id}`}
                aria-label={`Include ${step.id} step`}
                checked={step.enabled}
                onCheckedChange={(checked) =>
                  onChange(editTaskStep(task, step.id, { enabled: checked === true }))
                }
              />
              <Input
                aria-label={`Edit ${step.id} step`}
                value={step.title}
                onChange={(event) =>
                  onChange(editTaskStep(task, step.id, { title: event.target.value }))
                }
                className="h-8 min-w-0 flex-1 text-xs"
              />
            </div>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => onChange(startAgentTask(task))}
          disabled={!task.steps.some((step) => step.enabled)}
        >
          <Play />
          Run selected plan
        </Button>
      </div>
    );
  return (
    <Trace>
      {task.steps.map((step) => {
        const running = task.stage === "running" && step.status === "running";
        const failed = step.status === "failed";
        return (
          <TraceCollapsible
            key={step.id}
            open={openById[step.id] ?? (running || failed)}
            onOpenChange={(open) => setOpenById((current) => ({ ...current, [step.id]: open }))}
          >
            <TraceCollapsibleTrigger className="w-full">
              <TraceLine
                status={
                  running
                    ? "running"
                    : failed
                      ? "error"
                      : step.status === "pending"
                        ? "pending"
                        : undefined
                }
                className="w-full"
              >
                <TraceIcon>
                  {running ? (
                    <Spinner />
                  ) : failed ? (
                    <CircleX />
                  ) : step.status === "done" ? (
                    <CircleCheck />
                  ) : step.status === "skipped" ? (
                    <SkipForward />
                  ) : (
                    <Circle />
                  )}
                </TraceIcon>
                <TraceTitle>{step.title}</TraceTitle>
                <TraceDescription className="ms-auto text-[10px]">
                  {step.status === "running" && task.stage === "paused" ? "paused" : step.status}
                </TraceDescription>
              </TraceLine>
            </TraceCollapsibleTrigger>
            <TraceCollapsibleContent>
              <p className="text-xs leading-5">
                {step.output ||
                  (running
                    ? "Running an original local demo step…"
                    : step.status === "skipped"
                      ? "Excluded from the selected plan."
                      : "Waiting for this step.")}
              </p>
              {(failed || running) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {failed && (
                    <Button
                      variant="outline"
                      size="xs"
                      aria-label={`Retry ${step.id} step`}
                      onClick={() => onChange(retryTaskStep(task, step.id))}
                    >
                      <RotateCcw />
                      Retry
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    aria-label={`Skip ${step.id} step`}
                    onClick={() => onChange(skipTaskStep(task, step.id))}
                  >
                    <SkipForward />
                    Skip step
                  </Button>
                </div>
              )}
            </TraceCollapsibleContent>
          </TraceCollapsible>
        );
      })}
    </Trace>
  );
}

function TaskPanel() {
  const { toggleSidebar } = useSidebar();
  const draft = useChatDraft();
  const [allowed, setAllowed] = useState(["release", "research"]);
  const { task, setTask } = useAgentTask(createAgentTask(0, DEFAULT_PROMPT, INITIAL_META, allowed));
  const [owner, setOwner] = useState("jamie");
  const [notice, setNotice] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);
  const statusLabel = {
    brief: "Confirm the task brief",
    ready: "Review the editable plan",
    running: "Task running",
    paused: "Task paused · completed steps kept",
    failed: "Comparison step failed · retry or skip",
    fork: "Your answer is needed to continue",
    complete: "Task complete · review the produced artifact",
    ticket: "Local ticket created with the reviewed artifact",
  }[task.stage];
  const artifact = taskArtifact(task);
  const finished = task.stage === "complete" || task.stage === "ticket";
  function changeContext(ids: string[]) {
    setAllowed(ids);
    setTask((current) => createAgentTask(current.revision + 1, current.prompt, current.meta, ids));
    setNotice("Context changed · task rewound to its brief");
  }
  function downloadArtifact() {
    const url = URL.createObjectURL(
      new Blob([artifact.content], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = artifact.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <ReuiSidebar
      width={480}
      side="right"
      variant="floating"
      collapsible="offcanvas"
      className="absolute h-full"
      mobileClassName="data-[side=right]:w-(--sidebar-width) data-[side=right]:sm:max-w-none"
      mobileTitle="Agentic task assistant"
      mobileDescription="Confirm source scope, edit a plan, steer its run and create a local ticket."
      mobileWidth="min(100vw, 30rem)"
      header={
        <div className="flex min-w-0 items-center gap-2 py-1 pe-8 md:pe-0">
          <Sparkles className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">Task assistant</span>
          <Badge
            variant={
              task.stage === "failed" ? "destructive" : finished ? "success-light" : "outline"
            }
            size="sm"
          >
            {task.stage === "fork"
              ? "Needs your answer"
              : task.stage === "ticket"
                ? "Ticket created"
                : task.stage}
          </Badge>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="hidden md:inline-flex"
            aria-label="Close task assistant"
            onClick={toggleSidebar}
          >
            <X />
          </Button>
        </div>
      }
      footer={
        <div className="space-y-2 p-1">
          <p
            ref={statusRef}
            tabIndex={-1}
            role="status"
            className="text-[10px] leading-5 text-muted-foreground outline-none"
          >
            {notice ? `${notice} · ${statusLabel}` : statusLabel}
          </p>
          <WorkspaceComposer
            draft={draft}
            sources={SOURCES}
            busy={task.stage === "running"}
            onStop={() => setTask((current) => ({ ...current, stage: "paused" }))}
            onSend={(prompt, meta) => {
              setNotice("");
              setTask((current) => createAgentTask(current.revision + 1, prompt, meta, allowed));
            }}
          />
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <div className="shrink-0 space-y-2 border-y px-3 py-3">
          <p className="text-[11px] font-medium">Permitted workspace sources</p>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((source) => (
              <label key={source.id} className="flex min-w-0 items-center gap-1.5 text-[10px]">
                <Checkbox
                  checked={allowed.includes(source.id)}
                  aria-label={`Permit ${source.name}`}
                  onCheckedChange={(checked) =>
                    changeContext(
                      checked === true
                        ? [...allowed, source.id]
                        : allowed.filter((id) => id !== source.id),
                    )
                  }
                />
                <span className="max-w-32 truncate">{source.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <WorkspaceTranscript
            threadId={`task-${task.revision}`}
            turns={[
              { id: `request-${task.revision}`, role: "user", body: task.prompt },
              { id: `work-${task.revision}`, role: "assistant", body: "" },
            ]}
            busy={task.stage === "running"}
          >
            {() => (
              <Message>
                <MessageContent>
                  <MessageHeader className="gap-2 px-0">
                    <Sparkles className="size-3.5" />
                    Bricklane assistant
                    <span className="ms-auto text-[10px] font-normal">{task.meta.model}</span>
                  </MessageHeader>
                  <Bubble variant="ghost">
                    <BubbleContent>
                      <p className="leading-6">
                        {task.stage === "brief"
                          ? "Before I start, confirm the source scope and the artifact you need."
                          : task.stage === "ready"
                            ? "Here is an editable plan. Run only the steps you want."
                            : task.stage === "failed"
                              ? "The comparison check needs attention. Retry it or explicitly skip it."
                              : task.stage === "fork"
                                ? "One detail needs your decision before I continue."
                                : finished
                                  ? "The selected work is complete. Review the artifact before handing it off."
                                  : task.stage === "paused"
                                    ? "The run is paused. Its completed steps are kept."
                                    : "Working through the selected plan…"}
                      </p>
                    </BubbleContent>
                  </Bubble>
                  {task.stage === "brief" ? (
                    <AgentTaskBrief
                      onComplete={(brief) => {
                        setTask((current) => setTaskBrief(current, brief));
                        setNotice("Brief confirmed");
                        statusRef.current?.focus();
                      }}
                    />
                  ) : (
                    <TaskProgress
                      key={task.revision}
                      task={task}
                      onChange={(next) => {
                        setTask(next);
                        setNotice("");
                        if (next.stage !== task.stage) statusRef.current?.focus();
                      }}
                    />
                  )}
                  {task.stage === "fork" && (
                    <AgentTaskFork
                      onAnswer={(include) => {
                        setTask((current) => answerTaskFork(current, include));
                        statusRef.current?.focus();
                        setNotice(
                          include
                            ? "Illustrative example included"
                            : "Example branch removed from the plan",
                        );
                      }}
                    />
                  )}
                  {(task.stage === "running" || task.stage === "paused") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => {
                        setTask((current) =>
                          current.stage === "running"
                            ? { ...current, stage: "paused" }
                            : startAgentTask(current),
                        );
                        statusRef.current?.focus();
                      }}
                    >
                      {task.stage === "running" ? <Pause /> : <Play />}
                      {task.stage === "running" ? "Pause task" : "Resume task"}
                    </Button>
                  )}
                  {finished && (
                    <div className="min-w-0 space-y-4" data-task-artifact>
                      <AttachmentGroup aria-label="Produced files">
                        <Attachment size="sm">
                          <AttachmentMedia>
                            <FileText />
                          </AttachmentMedia>
                          <AttachmentContent>
                            <AttachmentTitle>{artifact.name}</AttachmentTitle>
                          </AttachmentContent>
                        </Attachment>
                      </AttachmentGroup>
                      <CodeBlock
                        code={artifact.content}
                        language="markdown"
                        wrap
                        label={artifact.name}
                      >
                        <CodeBlockCopyButton />
                      </CodeBlock>
                      <Button variant="outline" size="sm" onClick={downloadArtifact}>
                        <Download />
                        Download artifact
                      </Button>
                      {task.ticket ? (
                        <div
                          className="rounded-lg border bg-muted/40 p-3 text-xs"
                          data-created-task
                        >
                          <p className="flex items-center gap-2 font-medium">
                            <Check className="size-3.5" />
                            {task.ticket.id} · Local ticket created
                          </p>
                          <p className="mt-2 leading-5">{task.ticket.title}</p>
                          <p className="mt-2 text-muted-foreground">
                            Owner: {task.ticket.owner} · File: {artifact.name}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 rounded-lg border p-3">
                          <Label htmlFor="task-handoff-owner" className="text-xs">
                            Assign the finished work
                          </Label>
                          <Select value={owner} onValueChange={setOwner}>
                            <SelectTrigger id="task-handoff-owner" className="h-8 w-full text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                { id: "jamie", name: "Jamie · Product" },
                                { id: "sam", name: "Sam · Engineering" },
                                { id: "ari", name: "Ari · Operations" },
                              ].map((person) => (
                                <SelectItem key={person.id} value={person.id}>
                                  {person.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setTask((current) => createTaskTicket(current, owner));
                              setNotice("");
                              statusRef.current?.focus();
                            }}
                          >
                            Create local ticket
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </MessageContent>
              </Message>
            )}
          </WorkspaceTranscript>
        </div>
      </div>
    </ReuiSidebar>
  );
}
export default function AgenticTaskPanel() {
  return (
    <SidebarProvider
      className="relative h-svh min-h-0 w-full overflow-hidden bg-muted/30"
      data-ai-chat="task"
    >
      <SidebarInset className="min-w-0 overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-5">
          <FileText className="size-4" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            Release review workspace
          </span>
          <SidebarTrigger aria-label="Toggle task assistant" />
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-10 sm:px-12">
          <div className="mx-auto max-w-2xl space-y-10">
            <Skeleton className="h-8 w-3/5" />
            {[0, 1, 2, 3].map((section) => (
              <section
                key={section}
                className="space-y-4"
                aria-label={`Workspace placeholder ${section + 1}`}
              >
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-4/5" />
                <Skeleton className="h-2.5 w-11/12" />
              </section>
            ))}
          </div>
        </div>
      </SidebarInset>
      <TaskPanel />
    </SidebarProvider>
  );
}
