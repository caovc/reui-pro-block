/** Independent local run state used to extend the official free REUI patterns.
 * No network calls, permissions or real repository writes are performed.
 */
export type ApprovalDecision = "approve" | "revise" | "deny" | "answer";
export type RunStep = {
  id: string;
  title: string;
  detail: string;
  kind: "read" | "reason" | "approval" | "question" | "write" | "command";
  phase: "Inspect" | "Change" | "Verify";
  durationMs: number;
  gatedBy?: string;
  highImpact?: boolean;
  target?: string;
};
export type DecisionRecord = { decision: ApprovalDecision; note: string };
export type ApprovalRun = {
  at: number;
  decisions: Record<string, DecisionRecord>;
  paused: boolean;
};
export type StepState = "done" | "running" | "waiting" | "queued" | "skipped";

// Original fixture, separate from the public reference's data and media.
export const APPROVAL_STEPS: RunStep[] = [
  {
    id: "read",
    title: "Read the workspace instructions",
    detail: "Checked project conventions and the release checklist.",
    kind: "read",
    phase: "Inspect",
    durationMs: 900,
    target: "AGENTS.md",
  },
  {
    id: "inspect",
    title: "Inspect the billing settings",
    detail: "Found an outdated limit label in the settings form.",
    kind: "read",
    phase: "Inspect",
    durationMs: 1000,
    target: "src/billing/settings.tsx",
  },
  {
    id: "edit-gate",
    title: "Update the billing settings?",
    detail: "Change the limit label and add a short description. Two files will be edited.",
    kind: "approval",
    phase: "Change",
    durationMs: 0,
  },
  {
    id: "edit",
    title: "Update the limit label",
    detail: "Wrote an accessible label and a matching description.",
    kind: "write",
    phase: "Change",
    durationMs: 1200,
    gatedBy: "edit-gate",
    target: "src/billing/settings.tsx",
  },
  {
    id: "question",
    title: "Which workspace should receive the preview?",
    detail: "Enter the workspace slug. The preview remains private until you publish it.",
    kind: "question",
    phase: "Change",
    durationMs: 0,
  },
  {
    id: "check",
    title: "Run the billing checks",
    detail: "All 12 checks passed, including the keyboard label check.",
    kind: "command",
    phase: "Verify",
    durationMs: 1300,
    target: "npm run test:billing",
  },
  {
    id: "publish-gate",
    title: "Publish the billing preview?",
    detail:
      "Create a preview deployment for the selected workspace. No production traffic changes.",
    kind: "approval",
    phase: "Verify",
    durationMs: 0,
    highImpact: true,
  },
  {
    id: "publish",
    title: "Create the preview deployment",
    detail: "Preview deployment created for the approved workspace.",
    kind: "command",
    phase: "Verify",
    durationMs: 1400,
    gatedBy: "publish-gate",
    target: "Preview deployment",
  },
];

export function createApprovalRun(): ApprovalRun {
  return { at: 2, decisions: {}, paused: false };
}

export function approvalStepState(run: ApprovalRun, step: RunStep, index: number): StepState {
  const gate = step.gatedBy ? run.decisions[step.gatedBy] : undefined;
  if (gate && gate.decision !== "approve") return "skipped";
  if (index < run.at) return "done";
  if (index > run.at) return "queued";
  return step.kind === "approval" || step.kind === "question" ? "waiting" : "running";
}

function skipDeclinedSteps(run: ApprovalRun, steps: readonly RunStep[]): ApprovalRun {
  let at = run.at;
  while (at < steps.length) {
    const gate = steps[at].gatedBy;
    const answer = gate ? run.decisions[gate] : undefined;
    if (!answer || answer.decision === "approve") break;
    at += 1;
  }
  return at === run.at ? run : { ...run, at };
}

export function decideApproval(
  run: ApprovalRun,
  steps: readonly RunStep[],
  decision: ApprovalDecision,
  note: string,
): ApprovalRun {
  const step = steps[run.at];
  if (!step) return run;
  if (step.kind === "question") {
    if (decision !== "answer" || !note.trim()) return run;
  } else if (step.kind === "approval") {
    if (decision === "answer" || (decision === "revise" && !note.trim())) return run;
  } else return run;
  return skipDeclinedSteps(
    {
      ...run,
      at: run.at + 1,
      decisions: { ...run.decisions, [step.id]: { decision, note: note.trim() } },
    },
    steps,
  );
}

export function advanceApproval(run: ApprovalRun, steps: readonly RunStep[]): ApprovalRun {
  const step = steps[run.at];
  if (run.paused || !step || step.kind === "approval" || step.kind === "question") return run;
  return skipDeclinedSteps({ ...run, at: run.at + 1 }, steps);
}

export type FeedStep = {
  id: string;
  title: string;
  target: string;
  phase: string;
  tool: string;
  raw: string;
  durationMs: number;
  file?: boolean;
  reasoning?: string;
  changedFile?: boolean;
  countsAsTool?: boolean;
  summary: string;
};
export const FEED_STEPS: FeedStep[] = [
  {
    id: "reason",
    title: "Choose a focused change",
    summary: "Thought for 3s",
    target: "Clarify the limit without changing validation",
    phase: "Plan",
    tool: "reason",
    raw: "reason → update the label, preserve validation and verify keyboard access",
    durationMs: 3000,
    reasoning:
      "The settings form already validates the limit. I will keep that behavior, make the label clearer, and verify the accessible name in the existing test.",
  },
  {
    id: "plan",
    title: "Read the release checklist",
    summary: "Read 86 lines",
    target: "docs/release.md",
    phase: "Plan",
    tool: "read_file",
    raw: "read_file docs/release.md → 86 lines",
    durationMs: 700,
    file: true,
  },
  {
    id: "search",
    title: "Find the settings entry point",
    summary: "4 matches, 2 settings forms",
    target: 'search "workspace settings"',
    phase: "Plan",
    tool: "search",
    raw: 'search "workspace settings" → 4 matches',
    durationMs: 800,
    countsAsTool: true,
  },
  {
    id: "query",
    title: "Inspect the workspace limit records",
    summary: "12 rows in 240ms",
    target: "workspace_limits where active = true",
    phase: "Plan",
    tool: "query",
    raw: "query workspace_limits → 12 rows, consistent validation",
    durationMs: 700,
    countsAsTool: true,
  },
  {
    id: "edit",
    title: "Update the settings label",
    summary: "+4 −2 in the settings form",
    target: "src/workspace/settings.tsx",
    phase: "Edit",
    tool: "edit_file",
    raw: "edit_file src/workspace/settings.tsx → +4 −2",
    durationMs: 1200,
    file: true,
    changedFile: true,
  },
  {
    id: "tests",
    title: "Run the settings tests",
    summary: "12 checks passed",
    target: "npm run test:settings",
    phase: "Verify",
    tool: "run_command",
    raw: "run_command npm run test:settings → 12 passed",
    durationMs: 1400,
    countsAsTool: true,
  },
  {
    id: "summary",
    title: "Write the release note",
    summary: "+3 in the release note",
    target: "docs/changes.md",
    phase: "Verify",
    tool: "edit_file",
    raw: "edit_file docs/changes.md → +3",
    durationMs: 800,
    file: true,
    changedFile: true,
  },
  {
    id: "issue",
    title: "Create the accessibility follow-up",
    summary: "Created BL-241",
    target: "Workspace form follow-up",
    phase: "Verify",
    tool: "create_issue",
    raw: "create_issue → BL-241, workspace settings follow-up",
    durationMs: 900,
    countsAsTool: true,
  },
];
export type FeedRun = { at: number; paused: boolean; cutFrom: number | null; chars: number };
export function createFeedRun(): FeedRun {
  return { at: 2, paused: false, cutFrom: null, chars: 0 };
}
export function stopFeed(run: FeedRun): FeedRun {
  return run.cutFrom !== null ? run : { ...run, cutFrom: run.at, paused: false };
}
export function advanceFeed(run: FeedRun, steps: readonly FeedStep[]): FeedRun {
  if (run.paused || run.cutFrom !== null || run.at >= steps.length) return run;
  return { ...run, at: run.at + 1, chars: 0 };
}
export function feedTranscript(run: FeedRun, steps: readonly FeedStep[]): string {
  return [
    "Bricklane · Workspace release run",
    ...steps.map((step, index) => {
      const status =
        run.cutFrom !== null && index >= run.cutFrom
          ? "cancelled"
          : index < run.at
            ? "done"
            : index === run.at
              ? "running"
              : "queued";
      return `[${status}] ${step.raw}`;
    }),
  ].join("\n");
}

export type AuditCall = {
  id: string;
  server: string;
  tool: string;
  detail: string;
  status: "success" | "denied" | "error" | "pending";
  duration: string;
  deniedScope?: string;
};
export const AUDIT_SERVERS = [
  { id: "repository", label: "Repository", state: "Connected" },
  { id: "issues", label: "Issue tracker", state: "Connected" },
  { id: "docs", label: "Documentation", state: "Dropped" },
  { id: "design", label: "Design library", state: "Connected" },
];
export const AUDIT_CALLS: AuditCall[] = [
  {
    id: "read",
    server: "repository",
    tool: "read_file",
    detail: "src/workspace/settings.tsx",
    status: "success",
    duration: "124 ms",
  },
  {
    id: "search",
    server: "repository",
    tool: "search_code",
    detail: '"workspace limit"',
    status: "success",
    duration: "212 ms",
  },
  {
    id: "issue",
    server: "issues",
    tool: "create_issue",
    detail: "Track settings accessibility follow-up",
    status: "denied",
    deniedScope: "issues:create",
    duration: "—",
  },
  {
    id: "docs",
    server: "docs",
    tool: "search_docs",
    detail: "Workspace limit guidelines",
    status: "error",
    duration: "3.0 s",
  },
  {
    id: "verify",
    server: "repository",
    tool: "run_checks",
    detail: "Settings keyboard checks",
    status: "pending",
    duration: "In flight",
  },
];
export function auditCallStatus(call: AuditCall, granted: readonly string[]) {
  return call.deniedScope && granted.includes(call.deniedScope) ? "requeued" : call.status;
}
export function grantAuditScope(
  granted: readonly string[],
  scope: string,
  calls: readonly AuditCall[],
) {
  return calls.some((call) => call.deniedScope === scope) && !granted.includes(scope)
    ? [...granted, scope]
    : granted;
}

export type OutcomeItem = {
  id: string;
  title: string;
  detail: string;
  status: "done" | "failed" | "skipped" | "unsupported";
  checked: boolean;
  needsYou?: string;
  recovered?: { detail: string; status: "done" };
};
export const OUTCOME_ITEMS: OutcomeItem[] = [
  {
    id: "label",
    title: "Update workspace settings",
    detail: "src/workspace/settings.tsx · +4 −2",
    status: "done",
    checked: true,
  },
  {
    id: "tests",
    title: "Verify keyboard navigation",
    detail: "npm run test:settings · 12 checks passed",
    status: "done",
    checked: true,
  },
  {
    id: "note",
    title: "Write the release note",
    detail: "docs/changes.md · +3",
    status: "done",
    checked: false,
  },
  {
    id: "issue",
    title: "Create the follow-up issue",
    detail: "Missing permission: issues:create",
    status: "failed",
    checked: true,
    needsYou: "issues:create",
    recovered: { detail: "Created issue BL-241 · Settings follow-up", status: "done" },
  },
  {
    id: "link",
    title: "Link the follow-up in the release note",
    detail: "Waiting for the issue to be created",
    status: "skipped",
    checked: true,
    recovered: { detail: "docs/changes.md now links to BL-241", status: "done" },
  },
];
export type OutcomeState = {
  items: OutcomeItem[];
  retrying: string[];
  discarded: boolean;
  kept: boolean;
  beforeKeep: OutcomeItem[] | null;
};
export function createOutcome(): OutcomeState {
  return {
    items: OUTCOME_ITEMS.map((item) => ({ ...item })),
    retrying: [],
    discarded: false,
    kept: false,
    beforeKeep: null,
  };
}
export function clearOutcomeBlocker(state: OutcomeState, scope: string): OutcomeState {
  return {
    ...state,
    items: state.items.map((item) =>
      item.needsYou === scope ? { ...item, needsYou: undefined } : item,
    ),
  };
}
export function beginOutcomeRetry(state: OutcomeState, ids: readonly string[]): OutcomeState {
  if (state.discarded || state.retrying.length) return state;
  const retrying = state.items
    .filter(
      (item) =>
        ids.includes(item.id) &&
        (item.status === "failed" || item.status === "skipped") &&
        !item.needsYou &&
        item.recovered &&
        (item.id !== "link" ||
          state.items.find((entry) => entry.id === "issue")?.status === "done"),
    )
    .map((item) => item.id);
  return { ...state, retrying, kept: false };
}
export function resolveOutcomeRetry(state: OutcomeState): OutcomeState {
  return {
    ...state,
    retrying: [],
    items: state.items.map((item) =>
      state.retrying.includes(item.id) && item.recovered ? { ...item, ...item.recovered } : item,
    ),
  };
}
export function keepOutcome(state: OutcomeState): OutcomeState {
  if (state.discarded || state.retrying.length) return state;
  return {
    ...state,
    kept: true,
    beforeKeep: state.items.map((item) => ({ ...item })),
    items: state.items.map((item) =>
      item.status === "done" && !item.checked ? { ...item, status: "unsupported" } : item,
    ),
  };
}
export function undoKeepOutcome(state: OutcomeState): OutcomeState {
  return state.beforeKeep
    ? { ...state, kept: false, items: state.beforeKeep, beforeKeep: null }
    : state;
}
