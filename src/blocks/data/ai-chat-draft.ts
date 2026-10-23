import { useCallback, useRef, useState } from "react";
import { CHAT_MODELS, type ChatEffort, type ChatMeta } from "./ai-chat-session";

export function useChatDraft() {
  const [value, setValue] = useState("");
  const [model, setModel] = useState(CHAT_MODELS[0]);
  const [effort, setEffort] = useState<ChatEffort>("Instant");
  const [contextIds, setContextIds] = useState<string[]>([]);
  const [webSearch, setWebSearch] = useState(false);
  const [thinking, setThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bindTextarea = useCallback((node: HTMLTextAreaElement | null) => {
    textareaRef.current = node;
  }, []);
  const meta: ChatMeta = { model, effort, contextIds, webSearch, thinking };
  function prepare(text: string, ids: string[] = []) {
    setValue(text);
    setContextIds(ids);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }
  return {
    value,
    setValue,
    model,
    setModel,
    effort,
    setEffort,
    contextIds,
    setContextIds,
    webSearch,
    setWebSearch,
    thinking,
    setThinking,
    bindTextarea,
    meta,
    prepare,
  };
}
export type ChatDraft = ReturnType<typeof useChatDraft>;
