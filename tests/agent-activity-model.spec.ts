import { expect, test } from "@playwright/test";
import {
  APPROVAL_STEPS,
  AUDIT_CALLS,
  FEED_STEPS,
  advanceApproval,
  advanceFeed,
  approvalStepState,
  auditCallStatus,
  beginOutcomeRetry,
  clearOutcomeBlocker,
  createApprovalRun,
  createFeedRun,
  createOutcome,
  decideApproval,
  feedTranscript,
  grantAuditScope,
  keepOutcome,
  resolveOutcomeRetry,
  stopFeed,
  undoKeepOutcome,
} from "../src/blocks/data/agent-activity-model";

test("approval answer validation and declined gates preserve the independent verification step", () => {
  const original = createApprovalRun();
  expect(advanceApproval(original, APPROVAL_STEPS)).toBe(original);
  expect(decideApproval(original, APPROVAL_STEPS, "revise", " ")).toBe(original);
  const denied = decideApproval(original, APPROVAL_STEPS, "deny", "Leave the current label");
  expect(denied.at).toBe(4);
  expect(approvalStepState(denied, APPROVAL_STEPS[3], 3)).toBe("skipped");
  expect(approvalStepState(denied, APPROVAL_STEPS[4], 4)).toBe("waiting");
  expect(decideApproval(denied, APPROVAL_STEPS, "answer", " ")).toBe(denied);
  const answered = decideApproval(denied, APPROVAL_STEPS, "answer", " bricklane-labs ");
  expect(answered.at).toBe(5);
  expect(answered.decisions.question.note).toBe("bricklane-labs");
  expect(advanceApproval(answered, APPROVAL_STEPS).at).toBe(6);
  const revised = decideApproval(original, APPROVAL_STEPS, "revise", "Use the existing wording");
  expect(revised.at).toBe(4);
  expect(revised.decisions["edit-gate"].decision).toBe("revise");
  expect(original.decisions).toEqual({});
});

test("approved steps execute one at a time, pause prevents progress, and final denial skips deployment", () => {
  let run = decideApproval(createApprovalRun(), APPROVAL_STEPS, "approve", "");
  expect(run.at).toBe(3);
  expect(approvalStepState(run, APPROVAL_STEPS[3], 3)).toBe("running");
  const paused = { ...run, paused: true };
  expect(advanceApproval(paused, APPROVAL_STEPS)).toBe(paused);
  run = advanceApproval(run, APPROVAL_STEPS);
  run = decideApproval(run, APPROVAL_STEPS, "answer", "bricklane-labs");
  run = advanceApproval(run, APPROVAL_STEPS);
  run = decideApproval(run, APPROVAL_STEPS, "deny", "");
  expect(run.at).toBe(APPROVAL_STEPS.length);
  expect(approvalStepState(run, APPROVAL_STEPS[7], 7)).toBe("skipped");
  expect(advanceApproval(run, APPROVAL_STEPS)).toBe(run);
});

test("feed stop preserves completed work and cancels only the unfinished transcript", () => {
  const initial = createFeedRun();
  const progressed = advanceFeed(initial, FEED_STEPS);
  expect(progressed.at).toBe(3);
  const stopped = stopFeed(progressed);
  expect(advanceFeed(stopped, FEED_STEPS)).toBe(stopped);
  expect(stopFeed(stopped)).toBe(stopped);
  const transcript = feedTranscript(stopped, FEED_STEPS).split("\n");
  expect(transcript.filter((line) => line.startsWith("[done]"))).toHaveLength(3);
  expect(transcript.filter((line) => line.startsWith("[cancelled]"))).toHaveLength(5);
  expect(createFeedRun()).toEqual(initial);
});

test("audit grant only requeues a matching refused scope without falsely completing a call", () => {
  const denied = AUDIT_CALLS.find((call) => call.deniedScope)!;
  const granted = grantAuditScope([], "issues:create", AUDIT_CALLS);
  expect(auditCallStatus(denied, granted)).toBe("requeued");
  expect(denied.status).toBe("denied");
  expect(grantAuditScope(granted, "issues:create", AUDIT_CALLS)).toBe(granted);
  expect(grantAuditScope(granted, "admin:all", AUDIT_CALLS)).toBe(granted);
  expect(
    auditCallStatus(
      AUDIT_CALLS.find((call) => call.status === "pending")!,
      granted,
    ),
  ).toBe("pending");
});

test("outcome retry respects missing scope and dependency, and keeps successful items unchanged", () => {
  let state = createOutcome();
  const successful = state.items.filter((item) => item.status === "done");
  expect(beginOutcomeRetry(state, ["issue", "link", "label"]).retrying).toEqual([]);
  state = clearOutcomeBlocker(state, "issues:create");
  state = beginOutcomeRetry(state, ["issue", "link", "label"]);
  expect(state.retrying).toEqual(["issue"]);
  state = resolveOutcomeRetry(state);
  expect(state.items.find((item) => item.id === "issue")?.status).toBe("done");
  expect(state.items.find((item) => item.id === "link")?.status).toBe("skipped");
  state = resolveOutcomeRetry(beginOutcomeRetry(state, ["link"]));
  expect(state.items.find((item) => item.id === "link")?.status).toBe("done");
  for (const item of successful)
    expect(state.items.find((entry) => entry.id === item.id)).toEqual(item);
});

test("keep explicitly marks unverified success unsupported and undo restores the exact ledger", () => {
  const original = createOutcome();
  const kept = keepOutcome(original);
  expect(kept.items.find((item) => item.id === "note")?.status).toBe("unsupported");
  expect(kept.items.find((item) => item.id === "label")?.status).toBe("done");
  expect(undoKeepOutcome(kept).items).toEqual(original.items);
  const discarded = { ...original, discarded: true };
  expect(keepOutcome(discarded)).toBe(discarded);
  expect(beginOutcomeRetry(discarded, ["issue"])).toBe(discarded);
});
