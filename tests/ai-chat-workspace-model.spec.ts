import { test, expect } from "@playwright/test";
import {
  advanceAppRun,
  appRunAnswer,
  connectRunSource,
  createAppRun,
} from "../src/blocks/data/ai-chat-connected-model";
import {
  answerTaskFork,
  createAgentTask,
  createTaskTicket,
  editTaskStep,
  finishTaskStep,
  retryTaskStep,
  setTaskBrief,
  skipTaskStep,
  startAgentTask,
  taskArtifact,
} from "../src/blocks/data/ai-chat-task-model";
import type { ChatMeta } from "../src/blocks/data/ai-chat-session";
const meta: ChatMeta = {
  model: "Auto",
  effort: "Instant",
  contextIds: ["release"],
  webSearch: false,
  thinking: false,
};

test("connected run snapshots grants, skips missing evidence and never advances after stop", () => {
  const allowed = ["drive"];
  let run = createAppRun(1, "A scoped answer", "answer", allowed, meta);
  allowed.push("dropbox");
  while (run.receipts.some((receipt) => receipt.status === "pending")) run = advanceAppRun(run);
  run = advanceAppRun(run, true);
  expect(run.status).toBe("complete");
  expect(run.receipts.map((receipt) => receipt.status)).toEqual(["read", "skipped", "skipped"]);
  expect(appRunAnswer(run)).toContain("Sources read: Google Drive.");
  const previousReceipt = run.receipts[0];
  run = connectRunSource(run, "dropbox");
  expect(run.receipts[0]).toBe(previousReceipt);
  expect(run.receipts[1].status).toBe("pending");
  const stopped = { ...run, status: "stopped" as const };
  expect(advanceAppRun(stopped)).toBe(stopped);
  const none = createAppRun(2, "No permissions", "answer", [], meta);
  expect(
    appRunAnswer({
      ...none,
      receipts: none.receipts.map((receipt) => ({ ...receipt, status: "skipped" })),
    }),
  ).toContain("No permitted source produced evidence");
});

test("task edited plan failure, retry and answer remove a branch from the real artifact and ticket", () => {
  let task = setTaskBrief(createAgentTask(0, "Review release", meta, ["release", "research"]), {
    scope: "attachments",
    delivery: "checklist",
    depth: "detailed",
  });
  expect(task.allowed).toEqual(["release"]);
  task = editTaskStep(task, "write", { title: "Write the edited handoff" });
  task = startAgentTask(task);
  task = finishTaskStep(task);
  task = finishTaskStep(task);
  expect(task.stage).toBe("failed");
  expect(task.steps.find((step) => step.id === "compare")!.attempt).toBe(1);
  task = retryTaskStep(task, "compare");
  task = finishTaskStep(task);
  expect(task.stage).toBe("fork");
  task = answerTaskFork(task, false);
  while (task.stage === "running") task = finishTaskStep(task);
  expect(task.stage).toBe("complete");
  const artifact = taskArtifact(task);
  expect(artifact.name).toBe("workspace-checklist.md");
  expect(artifact.content).toContain("Write the edited handoff");
  expect(artifact.content).toContain("Customer example omitted");
  expect(artifact.content).not.toContain("[x] Add an illustrative");
  expect(createTaskTicket(task, "sam").ticket?.owner).toBe("sam");
});

test("paused and rewound tasks cannot advance; excluded steps and explicit skips honor user decisions", () => {
  let task = setTaskBrief(createAgentTask(4, "Review scope", meta, ["release"]), {
    scope: "selected",
    delivery: "note",
    depth: "focused",
  });
  task = editTaskStep(task, "example", { enabled: false });
  task = startAgentTask(task);
  const paused = { ...task, stage: "paused" as const };
  expect(finishTaskStep(paused)).toBe(paused);
  task = startAgentTask(paused);
  task = finishTaskStep(task);
  task = finishTaskStep(task);
  task = skipTaskStep(task, "compare");
  while (task.stage === "running") task = finishTaskStep(task);
  expect(task.stage).toBe("complete");
  expect(task.steps.find((step) => step.id === "compare")!.status).toBe("skipped");
  expect(task.forkAnswered).toBe(false);
  const rewind = createAgentTask(task.revision + 1, task.prompt, task.meta, []);
  expect(rewind.stage).toBe("brief");
  expect(finishTaskStep(rewind)).toBe(rewind);
  expect(rewind.ticket).toBeNull();
});
