/** Application gap: a quoted sentence must actually shape the local answer.
 * Reads the already-frozen free-example stream controller without changing it.
 */
import { sendChatMessage, updateChatTurn, type ChatMeta, type ChatState } from "./ai-chat-session";

export function quotedReply(prompt: string, quote: string, personalize: boolean): string {
  const context = quote ? `Regarding “${quote}”` : "For the workspace review";
  const detail = /why|explain|mean/i.test(prompt)
    ? "This means making the next action explicit, naming one owner, and checking the outcome before the change reaches the rest of the workspace."
    : /short|rewrite|clear/i.test(prompt)
      ? "A clearer draft: make the next action visible, assign one owner, and verify the result before sharing it."
      : "I would turn this into one small review task: describe the change, gather the supporting context, and record an observable check.";
  return `${context}:\n\n${detail}${personalize ? "\n\nFor your Bricklane workspace, keep the review with the release checklist and share the short decision with Jamie and Sam." : "\n\nPersonalization is off; this draft uses only your prompt and quoted sentence."}\n\nOriginal local demonstration; verify it against your own work.`;
}
export function sendQuotedMessage(
  state: ChatState,
  input: string,
  meta: ChatMeta,
  quote: string,
  personalize: boolean,
): ChatState {
  const next = sendChatMessage(state, input, meta);
  if (next === state) return state;
  return updateChatTurn(next, `answer-${state.nextId}`, (turn) => ({
    ...turn,
    body: quotedReply(input, quote, personalize),
    kind: "text",
  }));
}
