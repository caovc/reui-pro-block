/** Independent application state extending actual REUI free chat examples.
 * Streaming follows c-message-7/c-message-scroller-2: derive text from a slice
 * counter, one cleaned timeout per slice, reduced-motion reveals the full body.
 * Thread state, source binding and document workflows are application gaps.
 * MIT free example sources: https://reui.io/r/radix-nova/c-message-7.json
 * Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 */
import { useEffect, useState } from "react";

export type ChatEffort = "Instant" | "Extended" | "Deep";
export type ChatContext = { id: string; name: string; description: string };
export const CHAT_CONTEXTS: ChatContext[] = [
  { id: "release", name: "release-notes-4.2.md", description: "Product release notes · 8 KB" },
  { id: "research", name: "customer-research.md", description: "Interview themes · 12 KB" },
  { id: "roadmap", name: "workspace-roadmap.md", description: "Milestones and owners · 6 KB" },
  { id: "settings", name: "workspace-settings.ts", description: "Original demo source · 3 KB" },
];
export const CHAT_MODELS = ["Auto", "GPT-5.1 mini", "Claude Sonnet", "Gemini Pro"];
export type ChatMeta = {
  model: string;
  effort: ChatEffort;
  contextIds: string[];
  webSearch: boolean;
  thinking: boolean;
};
export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  body: string;
  status: "complete" | "pending" | "streaming" | "stopped";
  revealed: number;
  meta: ChatMeta;
  version: number;
  vote: "up" | "down" | null;
  kind?: "questionnaire" | "text" | "plan";
};
export type ChatThread = {
  id: string;
  title: string;
  group: "Today" | "Earlier";
  pinned: boolean;
  turns: ChatTurn[];
};
export type ChatState = { activeId: string; threads: ChatThread[]; nextId: number };
const DEFAULT_META: ChatMeta = {
  model: "Auto",
  effort: "Instant",
  contextIds: [],
  webSearch: false,
  thinking: false,
};
export const PLAN_QUESTIONS = [
  {
    name: "goal",
    title: "What are we planning?",
    choices: [
      { value: "launch", label: "A product launch", hint: "Scope, milestones and a rollout check" },
      {
        value: "improvement",
        label: "A workspace improvement",
        hint: "A focused change with validation",
      },
    ],
  },
  {
    name: "audience",
    title: "Who is this plan for?",
    choices: [
      { value: "team", label: "The internal team", hint: "Owners, handoffs and a review" },
      { value: "customers", label: "Customers", hint: "Clear communication and a staged release" },
    ],
  },
  {
    name: "pace",
    title: "What is the working window?",
    choices: [
      { value: "week", label: "One week", hint: "A short, tightly scoped plan" },
      { value: "month", label: "One month", hint: "Discovery, build, validation and rollout" },
    ],
  },
];
export type PlanAnswers = Record<"goal" | "audience" | "pace", string>;

export function draftChatReply(
  prompt: string,
  meta: ChatMeta,
  version = 0,
): { body: string; kind: "text" | "questionnaire" } {
  const sources = CHAT_CONTEXTS.filter((entry) => meta.contextIds.includes(entry.id)).map(
    (entry) => entry.name,
  );
  const evidence = sources.length
    ? `\n\nContext used: ${sources.join(", ")}.`
    : "\n\nThis is an independent local draft without attached workspace sources.";
  const settings = meta.thinking
    ? "\n\nI separated the proposed change, its evidence and the review needed before rollout."
    : "";
  const search = meta.webSearch
    ? "\n\nWeb search is staged for this demo; no external search was sent."
    : "";
  if (/scope a plan|plan a project|guided plan/i.test(prompt))
    return {
      kind: "questionnaire",
      body: "A few choices will make the plan specific. Answer the three questions below; your selections will shape the resulting milestones.",
    };
  let body: string;
  if (/code|typescript|function|query|sql/i.test(prompt)) {
    body =
      version % 2
        ? "Keep the field label stable and derive its helper text from the current limit:\n\n```typescript\nexport function limitHint(limit: number) {\n  return `Up to ${limit.toLocaleString()} records per month`;\n}\n```\n\nAdd a keyboard test that finds the input by its visible label."
        : "Use a small typed helper so the displayed limit and the validation can share one value:\n\n```typescript\nexport function withinLimit(count: number, limit: number): boolean {\n  return count >= 0 && count <= limit;\n}\n```\n\nKeep the visible label associated with the input and test both boundaries.";
  } else if (/release|changelog|catch me up/i.test(prompt)) {
    body =
      version % 2
        ? "Release 4.2 keeps the workspace familiar while making its settings easier to use. The limit label is clearer, exports show a useful completion state, and keyboard checks cover the updated form.\n\nBefore publishing, ask the release owner to verify the final scope and link the rollout checklist."
        : "Release 4.2 focuses on everyday workspace reliability.\n\nWhat changed\n• Clearer workspace limit labels and helper text.\n• A visible export completion state.\n• Keyboard coverage for the settings form.\n\nNext step: confirm the rollout owner and check the release checklist before sharing this draft.";
  } else if (/plan|milestone|roadmap/i.test(prompt)) {
    body =
      version % 2
        ? "A smaller plan will be easier to review. Start by naming the user problem, make the first change behind a preview, and have one owner verify the result before rollout.\n\nKeep the decision log with the implementation so the next review has context."
        : "Suggested working plan\n\n1. Confirm the problem and define one observable success check.\n2. Build the smallest useful version and assign a reviewer.\n3. Test keyboard access, narrow screens and error recovery.\n4. Share the preview and record the rollout decision.";
  } else if (/feedback|research|customer/i.test(prompt)) {
    body =
      version % 2
        ? "The research points to a clarity problem before a feature gap. Customers need to understand limits, know when exports finish, and find the next setup step without searching.\n\nValidate the revised labels with a short task-based review."
        : "Three themes are useful to investigate in this original demo research: clearer limits, visible completion states, and a shorter first-run checklist.\n\nTreat these as a local example, then verify each theme against your own interviews before prioritizing work.";
  } else {
    body =
      version % 2
        ? "I would start with a focused draft and one review question: does this make the next action clearer? Keep the change small, test its main path, and write down what still needs a decision."
        : "Here is a practical starting point: define the outcome, gather the relevant context, and make a small draft you can review.\n\nI can turn it into a release note, a short plan, a research summary or a typed code example. This response is generated from original local demo content.";
  }
  return { body: body + evidence + settings + search, kind: "text" };
}

export function buildChatPlan(answers: PlanAnswers): string {
  const goal = answers.goal === "launch" ? "product launch" : "workspace improvement";
  const audience = answers.audience === "customers" ? "customers" : "the internal team";
  const pace = answers.pace === "month" ? "one month" : "one week";
  return `Plan for a ${goal}\n\nAudience: ${audience}. Working window: ${pace}.\n\n1. ${answers.pace === "month" ? "Week 1: clarify" : "Day 1: clarify"} scope and choose an owner.\n2. ${answers.pace === "month" ? "Weeks 2–3: build" : "Days 2–4: build"} and review a focused preview.\n3. ${answers.pace === "month" ? "Week 4: validate" : "Day 5: validate"} keyboard access, narrow layouts and recovery.\n4. ${answers.audience === "customers" ? "Prepare a customer note and release in stages." : "Share the review result with the team and record the decision."}`;
}

function settledTurn(
  id: string,
  role: ChatTurn["role"],
  body: string,
  contextIds: string[],
): ChatTurn {
  return {
    id,
    role,
    body,
    revealed: body.length,
    status: "complete",
    meta: { ...DEFAULT_META, contextIds },
    version: 0,
    vote: null,
    kind: "text",
  };
}
export function createChatState(defaultThread = "new"): ChatState {
  return {
    activeId: defaultThread,
    nextId: 1,
    threads: [
      {
        id: "release",
        title: "Release 4.2 customer note",
        group: "Today",
        pinned: true,
        turns: [
          settledTurn(
            "release-q",
            "user",
            "Draft a short release summary for the workspace improvements.",
            ["release"],
          ),
          settledTurn(
            "release-a",
            "assistant",
            draftChatReply("release summary", { ...DEFAULT_META, contextIds: ["release"] }).body,
            ["release"],
          ),
        ],
      },
      {
        id: "research",
        title: "Research themes to review",
        group: "Today",
        pinned: false,
        turns: [
          settledTurn("research-q", "user", "Summarize the customer feedback themes.", [
            "research",
          ]),
          settledTurn(
            "research-a",
            "assistant",
            draftChatReply("customer feedback", { ...DEFAULT_META, contextIds: ["research"] }).body,
            ["research"],
          ),
        ],
      },
      {
        id: "roadmap",
        title: "Workspace improvement plan",
        group: "Earlier",
        pinned: true,
        turns: [
          settledTurn("roadmap-q", "user", "Outline the next roadmap milestone.", ["roadmap"]),
          settledTurn(
            "roadmap-a",
            "assistant",
            draftChatReply("roadmap plan", { ...DEFAULT_META, contextIds: ["roadmap"] }).body,
            ["roadmap"],
          ),
        ],
      },
    ],
  };
}
export function pendingChatTurn(state: ChatState) {
  for (const thread of state.threads) {
    const turn = thread.turns.find(
      (entry) => entry.status === "pending" || entry.status === "streaming",
    );
    if (turn) return { thread, turn };
  }
  return undefined;
}
export function updateChatTurn(
  state: ChatState,
  id: string,
  update: (turn: ChatTurn) => ChatTurn,
): ChatState {
  return {
    ...state,
    threads: state.threads.map((thread) => ({
      ...thread,
      turns: thread.turns.map((turn) => (turn.id === id ? update(turn) : turn)),
    })),
  };
}
export function sendChatMessage(state: ChatState, input: string, meta: ChatMeta): ChatState {
  const prompt = input.trim();
  if (!prompt || pendingChatTurn(state)) return state;
  const id = state.activeId === "new" ? `thread-${state.nextId}` : state.activeId;
  const reply = draftChatReply(prompt, meta);
  const turns: ChatTurn[] = [
    {
      ...settledTurn(`question-${state.nextId}`, "user", prompt, [...meta.contextIds]),
      meta: { ...meta, contextIds: [...meta.contextIds] },
    },
    {
      id: `answer-${state.nextId}`,
      role: "assistant",
      body: reply.body,
      revealed: 0,
      status: "pending",
      meta: { ...meta, contextIds: [...meta.contextIds] },
      version: 0,
      vote: null,
      kind: reply.kind,
    },
  ];
  const exists = state.threads.some((thread) => thread.id === id);
  return {
    activeId: id,
    nextId: state.nextId + 1,
    threads: exists
      ? state.threads.map((thread) =>
          thread.id === id ? { ...thread, turns: [...thread.turns, ...turns] } : thread,
        )
      : [
          { id, title: prompt.slice(0, 48), group: "Today", pinned: false, turns },
          ...state.threads,
        ],
  };
}
export function revealChatChunk(state: ChatState, finish = false): ChatState {
  const pending = pendingChatTurn(state);
  if (!pending) return state;
  return updateChatTurn(state, pending.turn.id, (turn) => {
    const revealed = finish ? turn.body.length : Math.min(turn.body.length, turn.revealed + 4);
    return { ...turn, revealed, status: revealed >= turn.body.length ? "complete" : "streaming" };
  });
}
export function stopChatReply(state: ChatState): ChatState {
  const pending = pendingChatTurn(state);
  return pending
    ? updateChatTurn(state, pending.turn.id, (turn) => ({ ...turn, status: "stopped" }))
    : state;
}
export function regenerateChatReply(state: ChatState, turnId: string): ChatState {
  if (pendingChatTurn(state)) return state;
  const thread = state.threads.find((entry) => entry.turns.some((turn) => turn.id === turnId));
  const index = thread?.turns.findIndex((turn) => turn.id === turnId) ?? -1;
  const turn = thread?.turns[index];
  const question = thread?.turns.slice(0, index).findLast((entry) => entry.role === "user");
  if (!turn || turn.role !== "assistant" || !question) return state;
  const reply = draftChatReply(question.body, turn.meta, turn.version + 1);
  return updateChatTurn(state, turnId, (entry) => ({
    ...entry,
    body: reply.body,
    kind: reply.kind,
    version: entry.version + 1,
    status: "pending",
    revealed: 0,
    vote: null,
  }));
}
export function useChatSession(defaultThread = "new") {
  const [state, setState] = useState(() => createChatState(defaultThread));
  const pending = pendingChatTurn(state);
  const pendingId = pending?.turn.id;
  const revealed = pending?.turn.revealed;
  const effort = pending?.turn.meta.effort;
  useEffect(() => {
    if (!pendingId) return;
    // Same free c-message-7 reduced-motion result, dispatched through a zero
    // timeout so the repository's set-state-in-effect check stays clean.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced
      ? 0
      : revealed === 0
        ? effort === "Deep"
          ? 1500
          : effort === "Extended"
            ? 900
            : 350
        : 24;
    const timer = window.setTimeout(
      () => setState((current) => revealChatChunk(current, reduced)),
      delay,
    );
    return () => window.clearTimeout(timer);
  }, [pendingId, revealed, effort]);
  return {
    state,
    setState,
    pending,
    thread: state.threads.find((entry) => entry.id === state.activeId),
    send: (text: string, meta: ChatMeta) =>
      setState((current) => sendChatMessage(current, text, meta)),
    stop: () => setState(stopChatReply),
    selectThread: (id: string) =>
      setState((current) => ({ ...stopChatReply(current), activeId: id })),
    regenerate: (id: string) => setState((current) => regenerateChatReply(current, id)),
    vote: (id: string, vote: "up" | "down") =>
      setState((current) =>
        updateChatTurn(current, id, (turn) => ({
          ...turn,
          vote: turn.vote === vote ? null : vote,
        })),
      ),
    applyPlan: (id: string, answers: PlanAnswers) =>
      setState((current) =>
        updateChatTurn(current, id, (turn) => {
          const body = buildChatPlan(answers);
          return { ...turn, body, revealed: body.length, status: "complete", kind: "plan" };
        }),
      ),
    togglePin: (id: string) =>
      setState((current) => ({
        ...current,
        threads: current.threads.map((entry) =>
          entry.id === id ? { ...entry, pinned: !entry.pinned } : entry,
        ),
      })),
    clearThread: () =>
      setState((current) => ({
        ...current,
        threads: current.threads.map((entry) =>
          entry.id === current.activeId ? { ...entry, turns: [] } : entry,
        ),
      })),
  };
}
export type ChatSession = ReturnType<typeof useChatSession>;
