import type { BlockProps } from "@/data/types";
import CopilotShell from "./ai-chat-copilot";
import DockedAssistant from "./ai-chat-docked";
import PromptStarterWelcome from "./ai-chat-welcome";

/** Narrow first batch only; coordinator routes 1–3 here, retaining all others. */
export default function InitialChatVariants({ block }: BlockProps) {
  switch (block.id) {
    case "ai-chat-2":
      return <DockedAssistant />;
    case "ai-chat-3":
      return <PromptStarterWelcome />;
    default:
      return <CopilotShell />;
  }
}
