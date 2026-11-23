/** Independent session-local failure records; no remote run or payment is executed. */
export type FluxFailureStatus = "Failed" | "Retrying" | "Dismissed";
export type FluxFailureError = "Payment" | "Rate Limit" | "Gateway" | "Query" | "Schema";
export interface FluxFailureAttempt {
  id: string;
  at: string;
  result: string;
  durationMs: number;
  kind?: "Initial run" | "Automatic retry" | "Manual retry";
  outcome?: "Failed" | "Queued" | "Cancelled";
}
export interface FluxFailure {
  id: string;
  task: string;
  status: FluxFailureStatus;
  agent: string;
  owner: string;
  ownerRole: string;
  failedStep: string;
  step: number;
  totalSteps: number;
  errorType: FluxFailureError;
  errorCode: string;
  errorMessage: string;
  lastAttempt: string;
  refundCents: number;
  providerBackoff: boolean;
  payload: Record<string, unknown> | null;
  attempts: FluxFailureAttempt[];
  notes: string;
}

const authoredFailures = [
  {
    task: "Review the duplicate renewal refund for Northstar Labs",
    agent: "Refund Triage",
    owner: "Sofia Reed",
    ownerRole: "Operations lead",
    failedStep: "payments.refund",
    errorType: "Payment",
    errorCode: "409 refund_conflict",
    errorMessage:
      "The local payment fixture already has a pending refund for this renewal. Review the existing request before retrying.",
    refundCents: 18250,
    providerBackoff: false,
    payload: { account: "northstar-labs", renewal: "REN-1042", amountCents: 18250 },
  },
  {
    task: "Deliver the weekly account summary to demo subscribers",
    agent: "Support Router",
    owner: "Maya Ellis",
    ownerRole: "Support automation",
    failedStep: "notifications.send",
    errorType: "Rate Limit",
    errorCode: "429 rate_limited",
    errorMessage:
      "The preview provider fixture reached its request limit. The next local attempt is waiting for backoff.",
    refundCents: 0,
    providerBackoff: true,
    payload: { audience: "weekly-summary", subscribers: 240 },
  },
  {
    task: "Match outstanding invoices for Cedar Works",
    agent: "Invoice Reconciler",
    owner: "Eli Morgan",
    ownerRole: "Reliability engineer",
    failedStep: "invoices.list",
    errorType: "Gateway",
    errorCode: "503 provider_unavailable",
    errorMessage: "The fixture invoice provider is unavailable. No invoice or payment has changed.",
    refundCents: 0,
    providerBackoff: true,
    payload: null,
  },
  {
    task: "Sync the local account directory to the reporting fixture",
    agent: "Account Sync",
    owner: "Noah Bennett",
    ownerRole: "Platform engineer",
    failedStep: "warehouse.query",
    errorType: "Query",
    errorCode: "504 query_timeout",
    errorMessage:
      "The simulated reporting query exceeded its deadline. Inspect the attempt before scheduling another local run.",
    refundCents: 0,
    providerBackoff: true,
    payload: null,
  },
  {
    task: "Validate the imported contact batch for Alder Studio",
    agent: "Lead Qualifier",
    owner: "Iris Chen",
    ownerRole: "Growth engineer",
    failedStep: "contacts.validate",
    errorType: "Schema",
    errorCode: "422 missing_domain",
    errorMessage:
      "A demo contact is missing its company domain. Add a valid domain to the payload before retrying.",
    refundCents: 0,
    providerBackoff: false,
    payload: null,
  },
  {
    task: "Reconcile the cancelled add-on refund for Cedar Works",
    agent: "Refund Triage",
    owner: "Owen Hart",
    ownerRole: "Safety reviewer",
    failedStep: "orders.lookup",
    errorType: "Gateway",
    errorCode: "502 upstream_error",
    errorMessage: "The demo order lookup returned an upstream error. No real refund was submitted.",
    refundCents: 9750,
    providerBackoff: true,
    payload: null,
  },
  {
    task: "Prepare the local renewal report for Grove Systems",
    agent: "Contract Reader",
    owner: "Sofia Reed",
    ownerRole: "Operations lead",
    failedStep: "documents.read",
    errorType: "Gateway",
    errorCode: "503 document_unavailable",
    errorMessage: "The authored document fixture is unavailable for this attempt.",
    refundCents: 0,
    providerBackoff: true,
    payload: null,
  },
  {
    task: "Review a superseded support escalation fixture",
    agent: "Support Router",
    owner: "Maya Ellis",
    ownerRole: "Support automation",
    failedStep: "policy.check",
    errorType: "Schema",
    errorCode: "422 superseded_request",
    errorMessage: "This local request was superseded and is retained as a dismissed example.",
    refundCents: 0,
    providerBackoff: false,
    payload: null,
  },
] satisfies Array<
  Pick<
    FluxFailure,
    | "task"
    | "agent"
    | "owner"
    | "ownerRole"
    | "failedStep"
    | "errorType"
    | "errorCode"
    | "errorMessage"
    | "refundCents"
    | "providerBackoff"
    | "payload"
  >
>;

export const fluxFailureAgents = [...new Set(authoredFailures.map((row) => row.agent))];
export const fluxFailureOwners = [...new Set(authoredFailures.map((row) => row.owner))];

export function createFluxFailureSeed(): FluxFailure[] {
  return authoredFailures.map((entry, index) => {
    const id = `LOCAL-RUN-${2108 - index}`;
    const lastAttempt = new Date(Date.UTC(2026, 9, 22, 13, 48 - index * 9)).toISOString();
    return {
      ...entry,
      id,
      status: index === 1 ? "Retrying" : index === 7 ? "Dismissed" : "Failed",
      step: 2 + (index % 3),
      totalSteps: 6,
      lastAttempt,
      payload: entry.payload ? structuredClone(entry.payload) : null,
      attempts: Array.from({ length: index === 0 ? 3 : 2 }, (_, attempt) => ({
        id: `${id}-attempt-${attempt + 1}`,
        at: new Date(
          Date.parse(lastAttempt) - ((index === 0 ? 3 : 2) - 1 - attempt) * 60000,
        ).toISOString(),
        result: entry.errorCode,
        durationMs: 800 + index * 130 + attempt * 100,
        kind: attempt === 0 ? "Initial run" : "Automatic retry",
        outcome: "Failed",
      })),
      notes: "Independent local preview fixture. Actions update only this browser session.",
    };
  });
}

export interface FluxFailureFilters {
  status: string;
  error: string;
  agent: string;
  query: string;
}
export const emptyFluxFailureFilters: FluxFailureFilters = {
  status: "All Statuses",
  error: "All Errors",
  agent: "All Agents",
  query: "",
};

export function filterFluxFailures(rows: readonly FluxFailure[], filters: FluxFailureFilters) {
  const query = filters.query.trim().toLocaleLowerCase("en-US");
  return rows.filter(
    (row) =>
      (filters.status === "All Statuses" || row.status === filters.status) &&
      (filters.error === "All Errors" || row.errorType === filters.error) &&
      (filters.agent === "All Agents" || row.agent === filters.agent) &&
      (!query ||
        [row.id, row.task, row.agent, row.owner, row.failedStep, row.errorCode].some((value) =>
          value.toLocaleLowerCase("en-US").includes(query),
        )),
  );
}

export function summarizeFluxFailures(rows: readonly FluxFailure[]) {
  const active = rows.filter((row) => row.status !== "Dismissed");
  return {
    total: rows.length,
    failed: rows.filter((row) => row.status === "Failed").length,
    active: active.length,
    exposureCents: active.reduce((sum, row) => sum + row.refundCents, 0),
    backoff: active.filter((row) => row.providerBackoff).length,
    owners: new Set(active.map((row) => row.owner).filter(Boolean)).size,
    payloadReady: active.filter((row) => row.payload !== null).length,
  };
}

export function updateFluxFailureStatus(
  rows: readonly FluxFailure[],
  id: string,
  status: FluxFailureStatus,
) {
  return rows.map((row) => (row.id === id ? { ...row, status } : row));
}

export function fluxFailureMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export const fluxFailureErrorCodes = [
  { code: "402 card_declined", type: "Payment" },
  { code: "409 refund_conflict", type: "Payment" },
  { code: "429 rate_limited", type: "Rate Limit" },
  { code: "502 upstream_error", type: "Gateway" },
  { code: "503 provider_unavailable", type: "Gateway" },
  { code: "503 document_unavailable", type: "Gateway" },
  { code: "504 query_timeout", type: "Query" },
  { code: "422 missing_domain", type: "Schema" },
  { code: "422 superseded_request", type: "Schema" },
] as const;
export interface FluxFailureDraft {
  task: string;
  agent: string;
  owner: string;
  status: FluxFailureStatus;
  errorCode: string;
  errorMessage: string;
  failedStep: string;
  step: number | null;
  totalSteps: number | null;
}
export type FluxFailureDraftErrors = Partial<Record<keyof FluxFailureDraft, string>>;
export function newFluxFailureDraft(rows: readonly FluxFailure[]): FluxFailureDraft {
  return {
    task: "",
    agent: rows[0]?.agent ?? "Refund Triage",
    owner: rows[0]?.owner ?? "Sofia Reed",
    status: "Failed",
    errorCode: "402 card_declined",
    errorMessage: "",
    failedStep: "",
    step: 1,
    totalSteps: 4,
  };
}
export function validateFluxFailureDraft(draft: FluxFailureDraft): FluxFailureDraftErrors {
  const errors: FluxFailureDraftErrors = {};
  for (const field of ["task", "agent", "owner", "errorMessage", "failedStep"] as const)
    if (!draft[field].trim()) errors[field] = "Enter a value.";
  if (!["Failed", "Retrying", "Dismissed"].includes(draft.status))
    errors.status = "Choose a run status.";
  if (!fluxFailureErrorCodes.some((entry) => entry.code === draft.errorCode))
    errors.errorCode = "Choose an error code.";
  if (draft.step === null || !Number.isInteger(draft.step) || draft.step < 1)
    errors.step = "Enter a positive whole step.";
  if (draft.totalSteps === null || !Number.isInteger(draft.totalSteps) || draft.totalSteps < 1)
    errors.totalSteps = "Enter a positive whole total.";
  if (draft.step !== null && draft.totalSteps !== null && draft.step > draft.totalSteps)
    errors.step = "The failed step must be within the run.";
  return errors;
}
export function fluxFailureFromDraft(
  draft: FluxFailureDraft,
  id: string,
  at: string,
  rows: readonly FluxFailure[],
): FluxFailure | null {
  if (
    Object.keys(validateFluxFailureDraft(draft)).length ||
    !Number.isFinite(Date.parse(at)) ||
    rows.some((row) => row.id === id)
  )
    return null;
  const errorType = fluxFailureErrorCodes.find((entry) => entry.code === draft.errorCode)!.type;
  return {
    id,
    task: draft.task.trim(),
    agent: draft.agent,
    owner: draft.owner,
    ownerRole: rows.find((row) => row.owner === draft.owner)?.ownerRole ?? "Run owner",
    status: draft.status,
    failedStep: draft.failedStep.trim(),
    step: draft.step!,
    totalSteps: draft.totalSteps!,
    errorType,
    errorCode: draft.errorCode,
    errorMessage: draft.errorMessage.trim(),
    lastAttempt: at,
    refundCents: 0,
    providerBackoff: errorType === "Gateway" || errorType === "Rate Limit" || errorType === "Query",
    payload: null,
    attempts: [
      {
        id: `${id}-attempt-1`,
        at,
        result: draft.errorCode,
        durationMs: 0,
        kind: "Initial run",
        outcome: "Failed",
      },
    ],
    notes: "Independent local preview fixture. Actions update only this browser session.",
  };
}

export interface FluxFailurePage {
  pageIndex: number;
  pageSize: number;
}
export interface FluxFailureSort {
  id: string;
  desc: boolean;
}
export interface FluxFailureWorkspace {
  rows: FluxFailure[];
  filters: FluxFailureFilters;
  pagination: FluxFailurePage;
  sorting: FluxFailureSort[];
  nextId: number;
}
export function createFluxFailureWorkspace(): FluxFailureWorkspace {
  return {
    rows: createFluxFailureSeed(),
    filters: { ...emptyFluxFailureFilters },
    pagination: { pageIndex: 0, pageSize: 6 },
    sorting: [],
    nextId: 2109,
  };
}
type Change<T> = T | ((previous: T) => T);
export type FluxFailureAction =
  | { type: "filter"; filters: FluxFailureFilters }
  | { type: "page"; value: Change<FluxFailurePage> }
  | { type: "sort"; value: Change<FluxFailureSort[]> }
  | { type: "replace"; before: FluxFailure; after: FluxFailure }
  | { type: "remove"; row: FluxFailure }
  | { type: "restore"; row: FluxFailure; index: number }
  | { type: "create"; draft: FluxFailureDraft; at: string }
  | { type: "retry"; row: FluxFailure; at: string }
  | { type: "settle-retries"; at: string };
function fitFluxFailurePage(state: FluxFailureWorkspace, rows: FluxFailure[]) {
  const count = filterFluxFailures(rows, state.filters).length;
  const lastPage = Math.max(0, Math.ceil(count / state.pagination.pageSize) - 1);
  return {
    ...state,
    rows,
    pagination: { ...state.pagination, pageIndex: Math.min(state.pagination.pageIndex, lastPage) },
  };
}
export function fluxFailureReducer(
  state: FluxFailureWorkspace,
  action: FluxFailureAction,
): FluxFailureWorkspace {
  if (action.type === "filter")
    return { ...state, filters: action.filters, pagination: { ...state.pagination, pageIndex: 0 } };
  if (action.type === "page") {
    const pagination =
      typeof action.value === "function" ? action.value(state.pagination) : action.value;
    if (
      !Number.isInteger(pagination.pageSize) ||
      pagination.pageSize < 1 ||
      !Number.isInteger(pagination.pageIndex) ||
      pagination.pageIndex < 0
    )
      return state;
    return fitFluxFailurePage({ ...state, pagination }, state.rows);
  }
  if (action.type === "sort")
    return {
      ...state,
      sorting: typeof action.value === "function" ? action.value(state.sorting) : action.value,
      pagination: { ...state.pagination, pageIndex: 0 },
    };
  if (action.type === "replace") {
    if (!state.rows.includes(action.before) || action.before.id !== action.after.id) return state;
    return fitFluxFailurePage(
      state,
      state.rows.map((row) => (row === action.before ? action.after : row)),
    );
  }
  if (action.type === "remove") {
    if (!state.rows.includes(action.row)) return state;
    return fitFluxFailurePage(
      state,
      state.rows.filter((row) => row !== action.row),
    );
  }
  if (action.type === "restore") {
    if (state.rows.some((row) => row.id === action.row.id)) return state;
    const rows = [...state.rows];
    rows.splice(Math.min(Math.max(action.index, 0), rows.length), 0, action.row);
    return fitFluxFailurePage(state, rows);
  }
  if (action.type === "retry") {
    if (
      !state.rows.includes(action.row) ||
      (action.row.status === "Retrying" && action.row.attempts.at(-1)?.outcome === "Queued") ||
      !Number.isFinite(Date.parse(action.at))
    )
      return state;
    const after: FluxFailure = {
      ...action.row,
      status: "Retrying",
      lastAttempt: action.at,
      attempts: [
        ...action.row.attempts,
        {
          id: `${action.row.id}-attempt-${action.row.attempts.length + 1}`,
          at: action.at,
          result: "Local retry queued",
          durationMs: 0,
          kind: "Manual retry",
          outcome: "Queued",
        },
      ],
    };
    return fitFluxFailurePage(
      state,
      state.rows.map((row) => (row === action.row ? after : row)),
    );
  }
  if (action.type === "settle-retries") {
    const now = Date.parse(action.at);
    if (!Number.isFinite(now)) return state;
    let changed = false;
    const rows = state.rows.map((row) => {
      const last = row.attempts.at(-1);
      if (
        row.status !== "Retrying" ||
        last?.outcome !== "Queued" ||
        now - Date.parse(last.at) < 1000
      )
        return row;
      changed = true;
      return {
        ...row,
        status: "Failed" as const,
        lastAttempt: action.at,
        attempts: row.attempts.map((attempt) =>
          attempt === last
            ? {
                ...attempt,
                at: action.at,
                outcome: "Failed" as const,
                result: row.errorCode,
                durationMs: now - Date.parse(last.at),
              }
            : attempt,
        ),
      };
    });
    return changed ? fitFluxFailurePage(state, rows) : state;
  }
  const created = fluxFailureFromDraft(
    action.draft,
    `LOCAL-RUN-${state.nextId}`,
    action.at,
    state.rows,
  );
  if (!created) return state;
  return {
    ...state,
    rows: [created, ...state.rows],
    filters: { ...emptyFluxFailureFilters },
    pagination: { ...state.pagination, pageIndex: 0 },
    sorting: [],
    nextId: state.nextId + 1,
  };
}

export function fluxFailureDate(at: string) {
  return `${new Date(at).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} UTC`;
}

export function cancelInactiveFluxFailureRetry(row: FluxFailure): FluxFailure {
  if (row.status === "Retrying" || !row.attempts.some((attempt) => attempt.outcome === "Queued"))
    return row;
  return {
    ...row,
    attempts: row.attempts.map((attempt) =>
      attempt.outcome === "Queued"
        ? { ...attempt, outcome: "Cancelled" as const, result: "Retry cancelled during triage" }
        : attempt,
    ),
  };
}

export function dismissFluxFailure(row: FluxFailure): FluxFailure {
  return cancelInactiveFluxFailureRetry({ ...row, status: "Dismissed" });
}

export function parseFluxFailurePayload(value: string): {
  payload: Record<string, unknown> | null;
  error?: string;
} {
  if (!value.trim()) return { payload: null };
  try {
    const payload: unknown = JSON.parse(value);
    if (payload === null || typeof payload !== "object" || Array.isArray(payload))
      return { payload: null, error: "Enter a JSON object, or leave the payload empty." };
    return { payload: payload as Record<string, unknown> };
  } catch {
    return { payload: null, error: "Enter valid JSON with quoted property names." };
  }
}
