import { expect, test } from "@playwright/test";
import {
  buildChatPlan,
  createChatState,
  draftChatReply,
  pendingChatTurn,
  regenerateChatReply,
  revealChatChunk,
  sendChatMessage,
  stopChatReply,
  updateChatTurn,
  type ChatMeta,
} from "../src/blocks/data/ai-chat-session";
const meta: ChatMeta = {
  model: "Claude Sonnet",
  effort: "Deep",
  contextIds: ["release"],
  webSearch: true,
  thinking: true,
};

test("sending snapshots the actual model/source controls, trims input and does not overwrite a pending turn", () => {
  const original = createChatState();
  expect(sendChatMessage(original, "  ", meta)).toBe(original);
  const options = { ...meta, contextIds: [...meta.contextIds] };
  const sent = sendChatMessage(original, "  Draft the release summary  ", options);
  options.contextIds.length = 0;
  const pending = pendingChatTurn(sent)!;
  expect(pending.turn.meta.contextIds).toEqual(["release"]);
  expect(pending.turn.meta.model).toBe("Claude Sonnet");
  expect(pending.turn.meta.effort).toBe("Deep");
  expect(pending.turn.body).toContain("release-notes-4.2.md");
  expect(pending.turn.body).toContain("Web search is staged");
  expect(pending.thread.turns[0].body).toBe("Draft the release summary");
  expect(sendChatMessage(sent, "another message", meta)).toBe(sent);
  expect(original.threads).toHaveLength(3);
});

test("stop retains only the revealed portion and a later send gets stable unique row IDs", () => {
  let state = sendChatMessage(createChatState(), "Explain the change", meta);
  state = revealChatChunk(revealChatChunk(state));
  const pending = pendingChatTurn(state)!;
  const stopped = stopChatReply(state);
  const turn = stopped.threads.find((thread) => thread.id === stopped.activeId)!.turns.at(-1)!;
  expect(turn.status).toBe("stopped");
  expect(turn.revealed).toBe(8);
  expect(turn.body.slice(0, turn.revealed)).toBe(pending.turn.body.slice(0, 8));
  expect(revealChatChunk(stopped)).toBe(stopped);
  const next = sendChatMessage(stopped, "Now outline a plan", meta);
  const ids = next.threads.flatMap((thread) => thread.turns.map((entry) => entry.id));
  expect(new Set(ids).size).toBe(ids.length);
  expect(next.threads.find((thread) => thread.id === next.activeId)!.turns[1]).toEqual(turn);
});

test("regeneration produces a different draft and resets feedback without changing older question rows", () => {
  let state = createChatState("release");
  const original = state.threads[0].turns[1].body;
  state = updateChatTurn(state, "release-a", (turn) => ({ ...turn, vote: "up" }));
  state = regenerateChatReply(state, "release-a");
  const pending = pendingChatTurn(state)!.turn;
  expect(pending.version).toBe(1);
  expect(pending.vote).toBeNull();
  expect(pending.body).not.toBe(original);
  state = revealChatChunk(state, true);
  expect(pendingChatTurn(state)).toBeUndefined();
  expect(state.threads[0].turns[0].id).toBe("release-q");
  expect(state.threads[0].turns[1].status).toBe("complete");
});

test("the guided plan honors all selected answers and research prompts do not become release summaries", () => {
  const short = buildChatPlan({ goal: "improvement", audience: "team", pace: "week" });
  const launch = buildChatPlan({ goal: "launch", audience: "customers", pace: "month" });
  expect(short).toContain("workspace improvement");
  expect(short).toContain("Day 5");
  expect(launch).toContain("product launch");
  expect(launch).toContain("Week 4");
  expect(launch).toContain("customer note");
  expect(draftChatReply("Summarize customer feedback", meta).body).toContain("Three themes");
  expect(draftChatReply("Plan a project with a guided plan brief", meta).kind).toBe(
    "questionnaire",
  );
});
