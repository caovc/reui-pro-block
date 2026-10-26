import type { DeploymentRecord, DeployMerge } from "./deploy-board-data";

export const CANARY_STEPS = [0, 5, 25, 50, 100] as const;
export const CANARY_DWELL_SECONDS = 120;
export const ANALYSIS_SECONDS = 60;
const WINDOW_MS = 20 * 60_000;

export interface DeployNotice {
  token: number;
  kind: "approve" | "traffic" | "rollback" | "retry" | "automatic";
  title: string;
  description: string;
  deployId: string;
  undoable: boolean;
}

export interface DeployBoardState {
  now: number;
  records: DeploymentRecord[];
  serial: number;
  notice: DeployNotice | null;
  undo: { token: number; record: DeploymentRecord } | null;
}

export type DeployAction =
  | { type: "tick"; seconds: number }
  | { type: "approve"; id: string }
  | { type: "traffic"; id: string; value: number }
  | { type: "rollback"; id: string }
  | { type: "retry"; id: string }
  | { type: "undo"; token: number };

export function createDeployBoardState(records: DeploymentRecord[], now: number): DeployBoardState {
  return { now, records: structuredClone(records), serial: 0, notice: null, undo: null };
}

export function nextDeployWindow(now: number) {
  return (Math.floor(now / WINDOW_MS) + 1) * WINDOW_MS;
}

export function canChangeTraffic(record: DeploymentRecord) {
  return record.phase === "Rolling out" && record.environment === "Production";
}

export function deployTime(value: number) {
  return new Date(value).toISOString().slice(11, 16);
}

export function deployStatus(record: DeploymentRecord) {
  if (record.phase === "Rolling out") return `Rolling out ${Math.round(record.target)}%`;
  if (record.phase === "Checks") return `Checks ${record.checks}/9`;
  if (record.phase === "Queued") return `Queued ${deployTime(record.windowAt)}`;
  if (record.phase === "Deployed" && record.completedAt)
    return `Deployed ${deployTime(record.completedAt)}`;
  return record.phase;
}

export function filterDeployRecords(
  records: DeploymentRecord[],
  query: string,
  environment: string,
) {
  const needle = query.trim().toLocaleLowerCase();
  return records.filter(
    (record) =>
      (environment === "All envs" || record.environment === environment) &&
      `${record.id} ${record.service} ${record.version} ${record.author} ${record.region} ${record.phase}`
        .toLocaleLowerCase()
        .includes(needle),
  );
}

export function filterDeployMerges(
  merges: DeployMerge[],
  records: DeploymentRecord[],
  query: string,
  environment: string,
) {
  const needle = query.trim().toLocaleLowerCase();
  return merges.filter((merge) => {
    const record = records.find((item) => item.id === merge.deployId);
    return (
      record &&
      (environment === "All envs" || record.environment === environment) &&
      `${merge.id} ${merge.title} ${merge.author} ${merge.branch} ${record.service} ${record.version}`
        .toLocaleLowerCase()
        .includes(needle)
    );
  });
}

function appendLog(
  record: DeploymentRecord,
  now: number,
  text: string,
  tone: "normal" | "success" | "warning" | "error" = "normal",
) {
  return [...record.log, { at: now, text, tone }].slice(-24);
}

function rollback(record: DeploymentRecord, now: number, automatic = false): DeploymentRecord {
  return {
    ...record,
    phase: "Rolled back",
    changedAt: now,
    completedAt: now,
    target: 0,
    actual: 0,
    errorRate: 0,
    failure: automatic
      ? "Two consecutive canary analyses exceeded the error limit"
      : "Rolled back by the release manager",
    log: appendLog(record, now, `Traffic returned to ${record.previousVersion}`, "warning"),
  };
}

function advanceDeploy(record: DeploymentRecord, now: number, seconds: number): DeploymentRecord {
  if (record.phase === "Needs approval") {
    return record.windowAt <= now ? { ...record, windowAt: nextDeployWindow(now) } : record;
  }
  if ((record.phase === "Scheduled" || record.phase === "Queued") && record.windowAt <= now) {
    if (record.approvals.some((approval) => approval.approvedAt === null))
      return { ...record, phase: "Needs approval", windowAt: nextDeployWindow(now) };
    return {
      ...record,
      phase: "Rolling out",
      changedAt: now,
      target: record.environment === "Production" ? 5 : 25,
      actual: 0,
      checks: 9,
      lastAnalysisAt: now,
      log: appendLog(record, now, "Deployment window opened; rollout started"),
    };
  }
  if (record.phase === "Checks") {
    const checks = Math.min(9, Math.floor((now - record.changedAt) / 10_000));
    return checks === 9
      ? {
          ...record,
          checks,
          phase: "Rolling out",
          target: 25,
          actual: 0,
          changedAt: now,
          lastAnalysisAt: now,
          log: appendLog(record, now, "All nine checks passed", "success"),
        }
      : { ...record, checks };
  }
  if (record.phase !== "Rolling out") return record;

  const actual =
    Math.abs(record.target - record.actual) < 0.05
      ? record.target
      : record.actual + (record.target - record.actual) * (1 - Math.exp(-seconds / 10));
  const errorRate = record.fault === "canary" && record.target >= 25 ? 0.83 : 0.03;
  let next = { ...record, actual, errorRate };
  if (now - record.lastAnalysisAt >= ANALYSIS_SECONDS * 1000) {
    next = {
      ...next,
      lastAnalysisAt: now,
      failedAnalyses: errorRate > record.errorLimit ? record.failedAnalyses + 1 : 0,
    };
    if (next.failedAnalyses >= 2) return rollback(next, now, true);
  }
  if (Math.abs(actual - record.target) > 0.25 || now < record.manualUntil) return next;
  if (now - record.changedAt < CANARY_DWELL_SECONDS * 1000) return next;
  if (record.target === 100) {
    return {
      ...next,
      phase: "Deployed",
      actual: 100,
      completedAt: now,
      log: appendLog(next, now, "Release is serving all traffic", "success"),
    };
  }
  const index = CANARY_STEPS.indexOf(record.target as (typeof CANARY_STEPS)[number]);
  const target = CANARY_STEPS[Math.min(index + 1, 4)];
  return {
    ...next,
    target,
    changedAt: now,
    log: appendLog(next, now, `Canary advanced to ${target}%`),
  };
}

export function deployBoardReducer(
  state: DeployBoardState,
  action: DeployAction,
): DeployBoardState {
  if (action.type === "undo") {
    if (!state.undo || state.undo.token !== action.token) return state;
    return {
      ...state,
      records: state.records.map((record) =>
        record.id === state.undo!.record.id ? structuredClone(state.undo!.record) : record,
      ),
      undo: null,
      notice: null,
    };
  }
  if (action.type === "tick") {
    if (!Number.isFinite(action.seconds) || action.seconds <= 0) return state;
    const now = state.now + action.seconds * 1000;
    let cursor = state.now;
    let records = state.records;
    let automatic: DeploymentRecord | undefined;
    // Long browser-clock advances still visit every analysis/window boundary.
    while (cursor < now) {
      const seconds = Math.min(10, (now - cursor) / 1000);
      cursor += seconds * 1000;
      const previous = records;
      records = previous.map((record) => advanceDeploy(record, cursor, seconds));
      automatic ??= records.find(
        (record, i) => record.phase === "Rolled back" && previous[i].phase !== "Rolled back",
      );
    }
    if (!automatic) return { ...state, now, records };
    const token = state.serial + 1;
    return {
      ...state,
      now,
      records,
      serial: token,
      notice: {
        token,
        kind: "automatic",
        title: "Canary rolled back",
        description: `${automatic.service} returned to ${automatic.previousVersion} after two failed analyses`,
        deployId: automatic.id,
        undoable: false,
      },
    };
  }
  const record = state.records.find((item) => item.id === action.id);
  if (!record) return state;
  let updated = record;
  let title = "";
  let description = "";
  if (action.type === "approve" && record.phase === "Needs approval") {
    updated = {
      ...record,
      phase: "Scheduled",
      approvals: record.approvals.map((approval) => ({
        ...approval,
        approvedAt: approval.approvedAt ?? state.now,
      })),
      log: appendLog(
        record,
        state.now,
        "Release manager approved this production window",
        "success",
      ),
    };
    title = "Deploy approved";
    description = `${record.service} ${record.version} ships at ${deployTime(record.windowAt)}`;
  } else if (action.type === "retry" && record.phase === "Failed") {
    updated = {
      ...record,
      phase: "Checks",
      checks: 0,
      failure: null,
      changedAt: state.now,
      windowAt: state.now,
      attempts: record.attempts + 1,
      log: appendLog(record, state.now, "Checks restarted by release manager"),
    };
    title = "Checks restarted";
    description = `${record.service} ${record.version} runs its checks again`;
  } else if (
    action.type === "rollback" &&
    (record.phase === "Rolling out" || record.phase === "Deployed")
  ) {
    updated = rollback(record, state.now);
    title = "Deploy rolled back";
    description = `${record.service} now serves ${record.previousVersion}`;
  } else if (
    action.type === "traffic" &&
    canChangeTraffic(record) &&
    CANARY_STEPS.includes(action.value as (typeof CANARY_STEPS)[number]) &&
    action.value >= 5 &&
    action.value !== record.target
  ) {
    updated = {
      ...record,
      target: action.value,
      changedAt: state.now,
      manualUntil: state.now + CANARY_DWELL_SECONDS * 1000,
      log: appendLog(record, state.now, `Release manager set traffic to ${action.value}%`),
    };
    title = "Canary weight set";
    description = `${record.service} ${record.version} takes ${action.value}% of traffic`;
  }
  if (updated === record) return state;
  const token = state.serial + 1;
  return {
    ...state,
    serial: token,
    records: state.records.map((item) => (item.id === record.id ? updated : item)),
    undo: { token, record: structuredClone(record) },
    notice: { token, kind: action.type, title, description, deployId: record.id, undoable: true },
  };
}
