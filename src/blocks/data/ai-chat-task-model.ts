/** Original task application state. Free c-trace-2/4 supplies cancellable
 * timer/retry/derived-status patterns, not this Pro task workflow controller.
 * https://reui.io/r/radix-nova/c-trace-4.json (MIT, Keenthemes Inc.)
 */
import { useEffect, useState } from "react";
import type { ChatMeta } from "./ai-chat-session";
export type TaskStage =
  | "brief"
  | "ready"
  | "running"
  | "paused"
  | "failed"
  | "fork"
  | "complete"
  | "ticket";
export type TaskBrief = { scope: string; delivery: string; depth: string };
export type TaskStep = {
  id: string;
  title: string;
  enabled: boolean;
  status: "pending" | "running" | "done" | "skipped" | "failed";
  attempt: number;
  output: string;
};
export type AgentTask = {
  revision: number;
  stage: TaskStage;
  prompt: string;
  meta: ChatMeta;
  allowed: string[];
  brief: TaskBrief | null;
  steps: TaskStep[];
  forkAnswered: boolean;
  ticket: { id: string; owner: string; title: string } | null;
};
const BASE_STEPS = [
  { id: "read", title: "Read the permitted workspace sources" },
  { id: "compare", title: "Compare the release checklist with the draft" },
  { id: "example", title: "Add an illustrative customer example" },
  { id: "write", title: "Write the requested artifact" },
  { id: "verify", title: "Verify source scope and unresolved questions" },
];
export function createAgentTask(
  revision: number,
  prompt: string,
  meta: ChatMeta,
  allowed: string[],
): AgentTask {
  return {
    revision,
    stage: "brief",
    prompt: prompt.trim(),
    meta: { ...meta, contextIds: [...meta.contextIds] },
    allowed: [...allowed],
    brief: null,
    steps: BASE_STEPS.map((step) => ({
      ...step,
      enabled: true,
      status: "pending",
      attempt: 0,
      output: "",
    })),
    forkAnswered: false,
    ticket: null,
  };
}
export function setTaskBrief(task: AgentTask, brief: TaskBrief): AgentTask {
  if (task.stage !== "brief") return task;
  return {
    ...task,
    stage: "ready",
    brief: { ...brief },
    allowed:
      brief.scope === "attachments"
        ? task.meta.contextIds.filter((id) => task.allowed.includes(id))
        : [...task.allowed],
  };
}
export function editTaskStep(
  task: AgentTask,
  id: string,
  changes: { title?: string; enabled?: boolean },
): AgentTask {
  if (task.stage !== "ready") return task;
  return {
    ...task,
    steps: task.steps.map((step) =>
      step.id === id
        ? {
            ...step,
            title: changes.title === undefined ? step.title : changes.title.slice(0, 180),
            enabled: changes.enabled ?? step.enabled,
            status: changes.enabled === false ? "skipped" : "pending",
          }
        : step,
    ),
  };
}
function nextTaskStep(task: AgentTask): AgentTask {
  const next = task.steps.find((step) => step.enabled && step.status === "pending");
  if (!next) return { ...task, stage: "complete" };
  if (next.id === "example" && !task.forkAnswered) return { ...task, stage: "fork" };
  return {
    ...task,
    stage: "running",
    steps: task.steps.map((step) =>
      step.id === next.id ? { ...step, status: "running", attempt: step.attempt + 1 } : step,
    ),
  };
}
export function startAgentTask(task: AgentTask): AgentTask {
  if (task.stage === "paused") return { ...task, stage: "running" };
  if (task.stage !== "ready" || !task.steps.some((step) => step.enabled)) return task;
  return nextTaskStep(task);
}
export function finishTaskStep(task: AgentTask): AgentTask {
  if (task.stage !== "running") return task;
  const live = task.steps.find((step) => step.status === "running");
  if (!live) return task;
  if (live.id === "compare" && live.attempt === 1)
    return {
      ...task,
      stage: "failed",
      steps: task.steps.map((step) =>
        step.id === live.id
          ? {
              ...step,
              status: "failed",
              output:
                "Demo comparison check failed: rollout owner is missing. Review the checklist, then retry or skip this step.",
            }
          : step,
      ),
    };
  const output =
    live.id === "read"
      ? `Read only permitted source IDs: ${task.allowed.join(", ") || "none"}. No external service contacted.`
      : live.id === "compare"
        ? "Comparison passed on retry. Owner field is now represented in the original local fixture."
        : live.id === "example"
          ? "Included a clearly labeled illustrative example, not a customer quotation."
          : live.id === "write"
            ? `Created workspace-${task.brief?.delivery === "checklist" ? "checklist" : "note"}.md from the selected brief.`
            : "Verified local source scope, the selected plan and unresolved follow-ups.";
  return nextTaskStep({
    ...task,
    steps: task.steps.map((step) =>
      step.id === live.id ? { ...step, status: "done", output } : step,
    ),
  });
}
export function retryTaskStep(task: AgentTask, id: string): AgentTask {
  if (
    task.stage !== "failed" ||
    !task.steps.some((step) => step.id === id && step.status === "failed")
  )
    return task;
  return {
    ...task,
    stage: "running",
    steps: task.steps.map((step) =>
      step.id === id ? { ...step, status: "running", attempt: step.attempt + 1, output: "" } : step,
    ),
  };
}
export function skipTaskStep(task: AgentTask, id: string): AgentTask {
  if (!["failed", "running", "paused"].includes(task.stage)) return task;
  const step = task.steps.find((entry) => entry.id === id);
  if (!step || !["running", "failed"].includes(step.status)) return task;
  return nextTaskStep({
    ...task,
    steps: task.steps.map((entry) =>
      entry.id === id ? { ...entry, status: "skipped", output: "Skipped by you." } : entry,
    ),
  });
}
export function answerTaskFork(task: AgentTask, include: boolean): AgentTask {
  if (task.stage !== "fork") return task;
  return nextTaskStep({
    ...task,
    forkAnswered: true,
    steps: task.steps.map((step) =>
      step.id === "example" && !include
        ? {
            ...step,
            enabled: false,
            status: "skipped",
            output: "Example branch removed by your answer.",
          }
        : step,
    ),
  });
}
export function taskArtifact(task: AgentTask): { name: string; content: string } {
  const checklist = task.brief?.delivery === "checklist";
  const done = task.steps.filter((step) => step.status === "done");
  return {
    name: `workspace-${checklist ? "checklist" : "note"}.md`,
    content: `# ${checklist ? "Workspace review checklist" : "Workspace review note"}\n\n${task.prompt}\n\nPermitted sources: ${task.allowed.join(", ") || "none"}.\n\n${done.map((step) => `${checklist ? "- [x]" : "-"} ${step.title}: ${step.output}`).join("\n")}\n\n${task.steps.find((step) => step.id === "example")?.status === "done" ? "Illustrative example: a workspace export now shows a visible completion message. This example is original demo content." : "Customer example omitted; no unverified quotation added."}${task.brief?.depth === "detailed" ? "\n\nDetailed review: verify keyboard access, narrow screens and error recovery with the release owner." : ""}\n\nOriginal Bricklane local demonstration. No real files or tracker were modified.\n`,
  };
}
export function createTaskTicket(task: AgentTask, owner: string): AgentTask {
  if (task.stage !== "complete" || !owner.trim()) return task;
  return {
    ...task,
    stage: "ticket",
    ticket: { id: `BRK-${104 + task.revision}`, owner, title: task.prompt },
  };
}
export function useAgentTask(initial: AgentTask) {
  const [task, setTask] = useState(initial);
  const live = task.steps.find((step) => step.status === "running");
  const liveId = live?.id;
  const liveAttempt = live?.attempt;
  useEffect(() => {
    if (task.stage !== "running" || !liveId) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => setTask(finishTaskStep),
      reduced ? 0 : liveId === "compare" ? 1300 : 850,
    );
    return () => window.clearTimeout(timer);
  }, [task.stage, task.revision, liveId, liveAttempt]);
  return { task, setTask };
}
