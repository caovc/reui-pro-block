/** Original app-scope controller extending actual free REUI c-item-11,
 * c-combobox-26 and c-trace-2 timer/stop patterns. No integration API/OAuth.
 * Free implementations own the UI; application receipts are scoped snapshots.
 */
import { useEffect, useState } from "react";
import type { ChatMeta } from "./ai-chat-session";

export const WORK_APPS = [
  { id: "drive", label: "Google Drive", mark: "GD", hint: "Project documents and release notes" },
  { id: "slack", label: "Slack", mark: "SL", hint: "Team updates and decisions" },
  { id: "calendar", label: "Calendar", mark: "CA", hint: "Upcoming meetings and working sessions" },
  { id: "dropbox", label: "Dropbox", mark: "DB", hint: "Shared research files" },
  { id: "onedrive", label: "OneDrive", mark: "OD", hint: "Workspace files" },
  { id: "box", label: "Box", mark: "BX", hint: "Approved project materials" },
  { id: "zoom", label: "Zoom", mark: "ZM", hint: "Meeting notes" },
  { id: "loom", label: "Loom", mark: "LM", hint: "Recorded project walkthroughs" },
  { id: "notion", label: "Notion", mark: "NO", hint: "Independent demo's ninth workspace app" },
];
export const APP_JOB_MODES = [
  {
    id: "catchup",
    label: "Catch me up",
    prompt: "Catch me up on the workspace release",
    sources: ["drive", "slack", "calendar", "loom"],
  },
  {
    id: "answer",
    label: "Find an answer",
    prompt: "What do we know about the workspace export?",
    sources: ["drive", "dropbox", "box"],
  },
  {
    id: "meeting",
    label: "Prepare a meeting",
    prompt: "Prepare an agenda for the next review meeting",
    sources: ["calendar", "zoom", "onedrive"],
  },
  {
    id: "update",
    label: "Draft an update",
    prompt: "Draft a short project update from connected sources",
    sources: ["slack", "drive", "notion", "loom"],
  },
];
export type AppReceipt = { appId: string; status: "pending" | "read" | "skipped" };
export type AppRun = {
  id: number;
  prompt: string;
  modeId: string;
  meta: ChatMeta;
  allowed: string[];
  receipts: AppReceipt[];
  status: "running" | "stopped" | "complete";
  revealed: number;
};
export function createAppRun(
  id: number,
  prompt: string,
  modeId: string,
  allowed: string[],
  meta: ChatMeta,
): AppRun {
  const mode = APP_JOB_MODES.find((entry) => entry.id === modeId) ?? APP_JOB_MODES[0];
  return {
    id,
    prompt: prompt.trim(),
    modeId: mode.id,
    meta: { ...meta, contextIds: [...meta.contextIds] },
    allowed: [...allowed],
    receipts: mode.sources.map((appId) => ({ appId, status: "pending" })),
    status: "running",
    revealed: 0,
  };
}
export function appRunAnswer(run: AppRun): string {
  const read = run.receipts
    .filter((entry) => entry.status === "read")
    .map((entry) => WORK_APPS.find((app) => app.id === entry.appId)!.label);
  const skipped = run.receipts.filter((entry) => entry.status === "skipped").length;
  const body =
    run.modeId === "meeting"
      ? "Suggested agenda\n1. Confirm the release scope and its owner.\n2. Review the export completion check.\n3. Decide which remaining questions need a follow-up."
      : run.modeId === "answer"
        ? "The original demo documents describe a visible completion state for workspace exports and a keyboard check for the updated settings form. Confirm the final rollout with the project owner."
        : run.modeId === "update"
          ? "Workspace update\nThe release checklist is ready for review. The next step is to validate export completion and agree on the rollout owner. Keep unverified information out of the customer note."
          : "Your workspace catch-up\nThe release draft is ready, the team is reviewing the settings labels, and the next working session will verify export completion. Ask the release owner to confirm the rollout checklist.";
  return `${read.length ? body : "No permitted source produced evidence. Connect a skipped app, then rerun its receipt before relying on an answer."}\n\nSources read: ${read.join(", ") || "none"}.${skipped ? ` ${skipped} disconnected ${skipped === 1 ? "source was" : "sources were"} skipped.` : ""}\n\nRequest: ${run.prompt}\nOriginal local fixtures only; no external app was contacted.`;
}
export function advanceAppRun(run: AppRun, finishStream = false): AppRun {
  if (run.status !== "running") return run;
  const pending = run.receipts.find((entry) => entry.status === "pending");
  if (pending)
    return {
      ...run,
      receipts: run.receipts.map((entry) =>
        entry === pending
          ? { ...entry, status: run.allowed.includes(entry.appId) ? "read" : "skipped" }
          : entry,
      ),
    };
  const answer = appRunAnswer(run);
  const revealed = finishStream ? answer.length : Math.min(answer.length, run.revealed + 4);
  return { ...run, revealed, status: revealed === answer.length ? "complete" : "running" };
}
export function connectRunSource(run: AppRun, appId: string): AppRun {
  if (!run.receipts.some((entry) => entry.appId === appId && entry.status === "skipped"))
    return run;
  return {
    ...run,
    allowed: [...new Set([...run.allowed, appId])],
    receipts: run.receipts.map((entry) =>
      entry.appId === appId ? { ...entry, status: "pending" } : entry,
    ),
    status: "running",
    revealed: 0,
  };
}
export function useConnectedRun() {
  const [run, setRun] = useState<AppRun | null>(null);
  useEffect(() => {
    if (!run || run.status !== "running") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasPending = run.receipts.some((entry) => entry.status === "pending");
    const timer = window.setTimeout(
      () => setRun((current) => (current ? advanceAppRun(current, reduced) : current)),
      reduced ? 0 : hasPending ? 650 : 24,
    );
    return () => window.clearTimeout(timer);
  }, [run]);
  return { run, setRun };
}
