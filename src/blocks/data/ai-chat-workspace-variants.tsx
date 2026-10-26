import type { BlockProps } from "@/data/types";
import QuoteReplySidebar from "./ai-chat-quote-sidebar";
import ConnectedAppsChat from "./ai-chat-connected-apps";
import AgenticTaskPanel from "./ai-chat-task-panel";

/** Narrow second batch: coordinator dispatches only exact Chat IDs 4–6. */
export default function WorkspaceChatVariants({ block }: BlockProps) {
  switch (block.id) {
    case "ai-chat-5":
      return <ConnectedAppsChat />;
    case "ai-chat-6":
      return <AgenticTaskPanel />;
    default:
      return <QuoteReplySidebar />;
  }
}
