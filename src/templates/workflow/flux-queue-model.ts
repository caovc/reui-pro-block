/** Authored queue records and local preview transitions; no remote agent is executed. */
export const fluxQueueStatuses = [
  "Queued",
  "Running",
  "Succeeded",
  "Failed",
  "Held",
  "Cancelled",
] as const;
export type FluxQueueStatus = (typeof fluxQueueStatuses)[number];
export const fluxQueuePriorities = ["High", "Normal", "Low"] as const;
export type FluxQueuePriority = (typeof fluxQueuePriorities)[number];
export type FluxQueueGrouping = "agent" | "status" | "none";
export interface FluxQueueEvent {
  id: string;
  at: string;
  label: string;
  description: string;
}
export interface FluxQueueRun {
  id: string;
  task: string;
  agent: string;
  owner: string;
  status: FluxQueueStatus;
  priority: FluxQueuePriority;
  attention: boolean;
  attentionReason: string;
  totalSteps: number;
  completedSteps: number;
  queuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  pendingSince: string | null;
  previewOutcome: "Succeeded" | "Failed";
  notes: string;
  events: FluxQueueEvent[];
}

const authoredQueue = [
  [
    "Prepare the Arbor weekly invoice digest",
    "Invoice Reconciler",
    "Eli Morgan",
    "Queued",
    "High",
    5,
    "",
  ],
  [
    "Route the Brookside onboarding questions",
    "Support Router",
    "Maya Ellis",
    "Running",
    "Normal",
    4,
    "",
  ],
  [
    "Review the Larkspur renewal adjustment",
    "Refund Triage",
    "Sofia Reed",
    "Queued",
    "High",
    6,
    "Approval is required before this refund fixture can start.",
  ],
  [
    "Refresh the Cedar account directory",
    "Account Sync",
    "Noah Bennett",
    "Succeeded",
    "Normal",
    4,
    "",
  ],
  [
    "Verify the Finch contract attachments",
    "Contract Reader",
    "Sofia Reed",
    "Failed",
    "High",
    5,
    "An attachment fixture is unavailable. Review the run before queuing it again.",
  ],
  [
    "Classify the Alder support handover",
    "Support Router",
    "Maya Ellis",
    "Queued",
    "Normal",
    3,
    "",
  ],
  [
    "Reconcile the Seabrook credit-note batch",
    "Invoice Reconciler",
    "Eli Morgan",
    "Held",
    "Normal",
    6,
    "Waiting for the account owner to confirm the batch.",
  ],
  [
    "Extract the Grove service commitments",
    "Contract Reader",
    "Sofia Reed",
    "Running",
    "Low",
    7,
    "",
  ],
  ["Sync the Meadow contact preferences", "Account Sync", "Noah Bennett", "Queued", "Low", 4, ""],
  [
    "Review the Birch duplicate payment fixture",
    "Refund Triage",
    "Sofia Reed",
    "Succeeded",
    "Normal",
    5,
    "",
  ],
  [
    "Archive the closed Juniper support request",
    "Support Router",
    "Maya Ellis",
    "Cancelled",
    "Low",
    3,
    "",
  ],
  [
    "Check the Hawthorn invoice references",
    "Invoice Reconciler",
    "Eli Morgan",
    "Failed",
    "Normal",
    4,
    "The local invoice reference did not match. Check its source details.",
  ],
] satisfies Array<[string, string, string, FluxQueueStatus, FluxQueuePriority, number, string]>;

export const fluxQueueAgents = [...new Set(authoredQueue.map((row) => row[1]))];
export const fluxQueueOwners = [...new Set(authoredQueue.map((row) => row[2]))];

export function createFluxQueueSeed(): FluxQueueRun[] {
  return authoredQueue.map(([task, agent, owner, status, priority, totalSteps, reason], index) => {
    const id = `LOCAL-QUEUE-${3101 + index}`;
    const queuedAt = new Date(Date.UTC(2026, 9, 22, 11, 30 + index * 4)).toISOString();
    const began = ["Running", "Succeeded", "Failed"].includes(status);
    const terminal = ["Succeeded", "Failed", "Cancelled"].includes(status);
    const startedAt = began ? new Date(Date.parse(queuedAt) + 60000).toISOString() : null;
    const finishedAt = terminal ? new Date(Date.parse(queuedAt) + 180000).toISOString() : null;
    const events: FluxQueueEvent[] = [
      {
        id: `${id}-event-1`,
        at: queuedAt,
        label: "Queued",
        description: "Added to the authored local queue.",
      },
    ];
    if (startedAt)
      events.push({
        id: `${id}-event-2`,
        at: startedAt,
        label: "Started",
        description: "This record represents an existing preview run.",
      });
    if (terminal || status === "Held")
      events.push({
        id: `${id}-event-${events.length + 1}`,
        at: finishedAt ?? new Date(Date.parse(queuedAt) + 120000).toISOString(),
        label: status,
        description:
          reason ||
          (status === "Succeeded"
            ? "All authored steps completed."
            : "Retained in this local queue for review."),
      });
    return {
      id,
      task,
      agent,
      owner,
      status,
      priority,
      attention: Boolean(reason),
      attentionReason: reason,
      totalSteps,
      completedSteps: status === "Succeeded" ? totalSteps : began ? Math.max(1, totalSteps - 2) : 0,
      queuedAt,
      startedAt,
      finishedAt,
      pendingSince: null,
      previewOutcome: status === "Failed" ? "Failed" : "Succeeded",
      notes: "Original local preview record. No provider or external tool is contacted.",
      events,
    };
  });
}

export interface FluxQueueFilters {
  query: string;
  status: "All statuses" | FluxQueueStatus;
  attentionOnly: boolean;
}
export const emptyFluxQueueFilters: FluxQueueFilters = {
  query: "",
  status: "All statuses",
  attentionOnly: false,
};
export function filterFluxQueue(rows: readonly FluxQueueRun[], filters: FluxQueueFilters) {
  const query = filters.query.trim().toLocaleLowerCase("en-US");
  return rows.filter(
    (row) =>
      (filters.status === "All statuses" || row.status === filters.status) &&
      (!filters.attentionOnly || row.attention) &&
      (!query ||
        [row.id, row.task, row.agent, row.owner, row.attentionReason, row.notes].some((value) =>
          value.toLocaleLowerCase("en-US").includes(query),
        )),
  );
}
export function summarizeFluxQueue(rows: readonly FluxQueueRun[]) {
  return {
    total: rows.length,
    queued: rows.filter((row) => row.status === "Queued").length,
    running: rows.filter((row) => row.status === "Running").length,
    succeeded: rows.filter((row) => row.status === "Succeeded").length,
    failed: rows.filter((row) => row.status === "Failed").length,
    held: rows.filter((row) => row.status === "Held").length,
    attention: rows.filter((row) => row.attention).length,
  };
}
export type FluxQueueLeaf = { kind: "run"; id: string; label: string; run: FluxQueueRun };
export type FluxQueueNode =
  | FluxQueueLeaf
  | { kind: "group"; id: string; label: string; children: FluxQueueLeaf[] };

export function groupFluxQueue(
  rows: readonly FluxQueueRun[],
  grouping: FluxQueueGrouping,
): FluxQueueNode[] {
  const leaf = (run: FluxQueueRun): FluxQueueLeaf => ({
    kind: "run",
    id: run.id,
    label: run.task,
    run,
  });
  if (grouping === "none") return rows.map(leaf);
  const groups = new Map<string, FluxQueueLeaf[]>();
  for (const row of rows) {
    const label = row[grouping];
    const children = groups.get(label) ?? [];
    children.push(leaf(row));
    groups.set(label, children);
  }
  const labels =
    grouping === "status"
      ? fluxQueueStatuses.filter((status) => groups.has(status))
      : [...groups.keys()];
  return labels.map((label) => ({
    kind: "group",
    id: `queue-group-${grouping}-${encodeURIComponent(label)}`,
    label,
    children: groups.get(label)!,
  }));
}

export interface FluxQueueDraft {
  task: string;
  agent: string;
  owner: string;
  priority: FluxQueuePriority;
  totalSteps: number | null;
  attention: boolean;
  attentionReason: string;
  notes: string;
}
export type FluxQueueDraftErrors = Partial<Record<keyof FluxQueueDraft, string>>;
export function newFluxQueueDraft(): FluxQueueDraft {
  return {
    task: "",
    agent: fluxQueueAgents[0],
    owner: fluxQueueOwners[0],
    priority: "Normal",
    totalSteps: 4,
    attention: false,
    attentionReason: "",
    notes: "",
  };
}
export function validateFluxQueueDraft(draft: FluxQueueDraft): FluxQueueDraftErrors {
  const errors: FluxQueueDraftErrors = {};
  for (const field of ["task", "agent", "owner"] as const)
    if (!draft[field].trim()) errors[field] = "Enter a value.";
  if (!fluxQueuePriorities.includes(draft.priority)) errors.priority = "Choose a priority.";
  if (draft.totalSteps === null || !Number.isInteger(draft.totalSteps) || draft.totalSteps < 1)
    errors.totalSteps = "Enter a positive whole step count.";
  if (draft.attention && !draft.attentionReason.trim())
    errors.attentionReason = "Explain what needs review.";
  return errors;
}
function appendFluxQueueEvent(row: FluxQueueRun, at: string, label: string, description: string) {
  return [
    ...row.events,
    { id: `${row.id}-event-${row.events.length + 1}`, at, label, description },
  ];
}
export type FluxQueueOperation = "start" | "hold" | "requeue" | "cancel" | "review" | "flag";
export function changeFluxQueueRun(
  row: FluxQueueRun,
  operation: FluxQueueOperation,
  at: string,
): FluxQueueRun {
  if (
    !Number.isFinite(Date.parse(at)) ||
    Date.parse(at) < Date.parse(row.events.at(-1)?.at ?? row.queuedAt)
  )
    return row;
  if (operation === "start" && row.status === "Queued" && !row.attention)
    return {
      ...row,
      status: "Running",
      completedSteps: 0,
      startedAt: at,
      finishedAt: null,
      pendingSince: at,
      events: appendFluxQueueEvent(
        row,
        at,
        "Started",
        "A short local simulation started. No external agent is executed.",
      ),
    };
  if (operation === "hold" && row.status === "Queued")
    return {
      ...row,
      status: "Held",
      events: appendFluxQueueEvent(row, at, "Held", "Paused in the queue for later review."),
    };
  if (operation === "requeue" && ["Held", "Succeeded", "Failed", "Cancelled"].includes(row.status))
    return {
      ...row,
      status: "Queued",
      completedSteps: 0,
      queuedAt: at,
      startedAt: null,
      finishedAt: null,
      pendingSince: null,
      events: appendFluxQueueEvent(
        row,
        at,
        "Queued again",
        "Returned to the local queue. Existing attention flags remain in place.",
      ),
    };
  if (operation === "cancel" && ["Queued", "Running", "Held"].includes(row.status))
    return {
      ...row,
      status: "Cancelled",
      finishedAt: at,
      pendingSince: null,
      events: appendFluxQueueEvent(
        row,
        at,
        "Cancelled",
        "Stopped locally and retained in the queue history.",
      ),
    };
  if (operation === "review" && row.attention)
    return {
      ...row,
      attention: false,
      attentionReason: "",
      events: appendFluxQueueEvent(
        row,
        at,
        "Reviewed",
        "The attention flag was acknowledged and cleared.",
      ),
    };
  if (operation === "flag" && !row.attention)
    return {
      ...row,
      attention: true,
      attentionReason: "Flagged for a teammate to review.",
      events: appendFluxQueueEvent(row, at, "Flagged", "Marked as needing attention."),
    };
  return row;
}
export function editFluxQueueRun(
  row: FluxQueueRun,
  draft: FluxQueueDraft,
  at: string,
): FluxQueueRun {
  if (
    Object.keys(validateFluxQueueDraft(draft)).length ||
    !Number.isFinite(Date.parse(at)) ||
    Date.parse(at) < Date.parse(fluxQueueUpdatedAt(row))
  )
    return row;
  if (!["Queued", "Held"].includes(row.status) && draft.totalSteps !== row.totalSteps) return row;
  return {
    ...row,
    ...draft,
    task: draft.task.trim(),
    agent: draft.agent.trim(),
    owner: draft.owner.trim(),
    attentionReason: draft.attention ? draft.attentionReason.trim() : "",
    totalSteps: draft.totalSteps!,
    completedSteps: Math.min(row.completedSteps, draft.totalSteps!),
    events: appendFluxQueueEvent(row, at, "Updated", "Saved the run's queue details."),
  };
}
export function nextFluxQueueRun(rows: readonly FluxQueueRun[]) {
  const priority = { High: 0, Normal: 1, Low: 2 };
  return rows
    .filter((row) => row.status === "Queued" && !row.attention)
    .toSorted(
      (a, b) =>
        priority[a.priority] - priority[b.priority] ||
        a.queuedAt.localeCompare(b.queuedAt) ||
        a.id.localeCompare(b.id),
    )[0];
}
export type FluxQueueExpanded = true | Record<string, boolean>;
export interface FluxQueueSort {
  id: string;
  desc: boolean;
}
export interface FluxQueueWorkspace {
  rows: FluxQueueRun[];
  filters: FluxQueueFilters;
  grouping: FluxQueueGrouping;
  expanded: FluxQueueExpanded;
  sorting: FluxQueueSort[];
  nextId: number;
}
export function createFluxQueueWorkspace(): FluxQueueWorkspace {
  return {
    rows: createFluxQueueSeed(),
    filters: { ...emptyFluxQueueFilters },
    grouping: "agent",
    expanded: true,
    sorting: [],
    nextId: 3113,
  };
}
type Change<T> = T | ((current: T) => T);
export type FluxQueueAction =
  | { type: "filter"; filters: FluxQueueFilters }
  | { type: "group"; grouping: FluxQueueGrouping }
  | { type: "expand"; value: Change<FluxQueueExpanded> }
  | { type: "sort"; value: Change<FluxQueueSort[]> }
  | { type: "replace"; before: FluxQueueRun; after: FluxQueueRun }
  | { type: "create"; draft: FluxQueueDraft; at: string }
  | { type: "start-next"; at: string }
  | { type: "settle"; at: string };
export function fluxQueueReducer(
  state: FluxQueueWorkspace,
  action: FluxQueueAction,
): FluxQueueWorkspace {
  if (action.type === "filter") return { ...state, filters: action.filters };
  if (action.type === "group") return { ...state, grouping: action.grouping, expanded: true };
  if (action.type === "expand")
    return {
      ...state,
      expanded: typeof action.value === "function" ? action.value(state.expanded) : action.value,
    };
  if (action.type === "sort")
    return {
      ...state,
      sorting: typeof action.value === "function" ? action.value(state.sorting) : action.value,
    };
  if (action.type === "replace") {
    if (
      !state.rows.includes(action.before) ||
      action.before.id !== action.after.id ||
      action.before === action.after
    )
      return state;
    return {
      ...state,
      rows: state.rows.map((row) => (row === action.before ? action.after : row)),
    };
  }
  if (action.type === "start-next") {
    const before = nextFluxQueueRun(filterFluxQueue(state.rows, state.filters));
    if (!before) return state;
    const after = changeFluxQueueRun(before, "start", action.at);
    return after === before
      ? state
      : { ...state, rows: state.rows.map((row) => (row === before ? after : row)) };
  }
  if (action.type === "settle") {
    const now = Date.parse(action.at);
    if (!Number.isFinite(now)) return state;
    let changed = false;
    const rows = state.rows.map((row) => {
      if (
        row.status !== "Running" ||
        !row.pendingSince ||
        now - Date.parse(row.pendingSince) < 1200
      )
        return row;
      changed = true;
      const failed = row.previewOutcome === "Failed";
      return {
        ...row,
        status: row.previewOutcome,
        completedSteps: failed ? Math.max(0, row.totalSteps - 1) : row.totalSteps,
        finishedAt: action.at,
        pendingSince: null,
        attention: failed || row.attention,
        attentionReason: failed
          ? "The local simulation retained this fixture's failure for review."
          : row.attentionReason,
        events: appendFluxQueueEvent(
          row,
          action.at,
          row.previewOutcome,
          failed
            ? "The local fixture reported a failure. No external request was sent."
            : "The local fixture completed every step.",
        ),
      };
    });
    return changed ? { ...state, rows } : state;
  }
  if (
    Object.keys(validateFluxQueueDraft(action.draft)).length ||
    !Number.isFinite(Date.parse(action.at))
  )
    return state;
  const id = `LOCAL-QUEUE-${state.nextId}`;
  const draft = action.draft;
  const created: FluxQueueRun = {
    id,
    task: draft.task.trim(),
    agent: draft.agent.trim(),
    owner: draft.owner.trim(),
    priority: draft.priority,
    totalSteps: draft.totalSteps!,
    attention: draft.attention,
    attentionReason: draft.attention ? draft.attentionReason.trim() : "",
    notes: draft.notes.trim(),
    status: "Queued",
    completedSteps: 0,
    queuedAt: action.at,
    startedAt: null,
    finishedAt: null,
    pendingSince: null,
    previewOutcome: "Succeeded",
    events: [
      {
        id: `${id}-event-1`,
        at: action.at,
        label: "Queued",
        description: "Added to this local queue.",
      },
    ],
  };
  return {
    ...state,
    rows: [created, ...state.rows],
    filters: { ...emptyFluxQueueFilters },
    expanded: true,
    sorting: [],
    nextId: state.nextId + 1,
  };
}

export function fluxQueueUpdatedAt(row: FluxQueueRun) {
  return row.events.at(-1)?.at ?? row.queuedAt;
}
export function fluxQueueDate(at: string) {
  return `${new Date(at).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} UTC`;
}
export function fluxQueueCsv(rows: readonly FluxQueueRun[]) {
  const lines = [
    [
      "Run",
      "Task",
      "Agent",
      "Owner",
      "Status",
      "Priority",
      "Needs attention",
      "Completed steps",
      "Total steps",
      "Updated",
    ],
    ...rows.map((row) => [
      row.id,
      row.task,
      row.agent,
      row.owner,
      row.status,
      row.priority,
      row.attention ? "Yes" : "No",
      String(row.completedSteps),
      String(row.totalSteps),
      fluxQueueUpdatedAt(row),
    ]),
  ];
  return lines
    .map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}
