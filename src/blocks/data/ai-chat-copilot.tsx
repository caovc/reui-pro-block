import { IconTile } from "@/components/reui/icon-tile";
/** Independent Copilot Shell application, composed from actual official free
 * REUI InputGroup/Attachment/Message/Scroller examples in the imported leaves.
 * This provisional layout is based on the public brief; reference pixels are
 * explicitly pending. All task data/artwork are original local fixtures.
 */
import { useState } from "react";
import {
  BookOpen,
  Code2,
  Compass,
  Download,
  Ellipsis,
  Plus,
  Sparkles,
  Star,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatComposer from "./ai-chat-composer";
import { useChatDraft } from "./ai-chat-draft";
import ChatHistory from "./ai-chat-history";
import { useChatSession } from "./ai-chat-session";
import ChatTranscript from "./ai-chat-transcript";

const CATEGORIES = [
  {
    id: "Create",
    icon: WandSparkles,
    prompts: [
      { text: "Draft a customer note for release 4.2", context: ["release"] },
      { text: "Turn the roadmap into a short working plan", context: ["roadmap"] },
      { text: "Write a clear workspace update", context: [] },
    ],
  },
  {
    id: "Explore",
    icon: Compass,
    prompts: [
      { text: "Find the strongest customer feedback themes", context: ["research"] },
      { text: "Compare the latest release to the roadmap", context: ["release", "roadmap"] },
      { text: "Catch me up on the workspace release", context: ["release"] },
    ],
  },
  {
    id: "Code",
    icon: Code2,
    prompts: [
      { text: "Write a TypeScript helper for workspace limits", context: ["settings"] },
      { text: "Review the settings code for keyboard access", context: ["settings"] },
      { text: "Suggest a small test for the limit function", context: ["settings"] },
    ],
  },
  {
    id: "Learn",
    icon: BookOpen,
    prompts: [
      { text: "Explain how to scope a useful review", context: [] },
      { text: "Help me plan a focused validation session", context: ["research"] },
      { text: "What makes a clear release note?", context: ["release"] },
    ],
  },
];

export default function CopilotShell() {
  const session = useChatSession();
  const draft = useChatDraft();
  const [category, setCategory] = useState("Create");
  const rows = CATEGORIES.find((entry) => entry.id === category)?.prompts ?? [];
  const usedTokens = Math.ceil(
    (session.thread?.turns.reduce((sum, turn) => sum + turn.body.length, 0) ?? 0) / 4,
  );
  const hasTurns = Boolean(session.thread?.turns.length);
  function exportTranscript() {
    const text =
      session.thread?.turns
        .map(
          (turn) =>
            `${turn.role === "user" ? "You" : "Assistant"}: ${turn.status === "complete" ? turn.body : turn.body.slice(0, turn.revealed)}`,
        )
        .join("\n\n") ?? "";
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bricklane-conversation.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="flex h-svh min-h-0 w-full flex-col bg-background" data-ai-chat="copilot">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-1">
          <Sparkles className="size-4 shrink-0" />
          <ChatHistory session={session} />
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Favorite conversation"
            aria-pressed={session.thread?.pinned ?? false}
            disabled={!session.thread}
            onClick={() => session.thread && session.togglePin(session.thread.id)}
          >
            <Star className={session.thread?.pinned ? "fill-current" : ""} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Start new conversation"
            onClick={() => {
              session.selectThread("new");
              draft.prepare("");
            }}
          >
            <Plus />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label="Conversation actions">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportTranscript} disabled={!hasTurns}>
                <Download />
                Export transcript
              </DropdownMenuItem>
              <DropdownMenuItem onClick={session.clearThread} disabled={!hasTurns}>
                <Trash2 />
                Clear conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">
        {hasTurns ? (
          <ChatTranscript session={session} />
        ) : (
          <ScrollArea className="h-full">
            <div className="mx-auto flex min-h-96 w-full max-w-3xl flex-col items-center justify-center px-5 py-12 sm:py-20">
              <IconTile variant="frame" className="mb-5">
                <Sparkles />
              </IconTile>
              <h1 className="text-center text-2xl font-semibold tracking-tight">
                What would you like to work on?
              </h1>
              <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                Write a draft, understand your context, or work through the next small step.
              </p>
              <Tabs value={category} onValueChange={setCategory} className="mt-8 w-full max-w-xl">
                <TabsList className="grid h-auto w-full grid-cols-4">
                  {CATEGORIES.map(({ id, icon: Icon }) => (
                    <TabsTrigger key={id} value={id} className="min-w-0 gap-1.5 px-1 py-2 text-xs">
                      <Icon className="size-3.5" />
                      {id}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="mt-3 grid w-full max-w-xl gap-2">
                {rows.map((entry) => (
                  <Button
                    key={entry.text}
                    variant="ghost"
                    className="h-auto min-h-10 justify-start rounded-lg border px-3 py-3 text-left text-xs font-normal whitespace-normal"
                    onClick={() => draft.prepare(entry.text, entry.context)}
                  >
                    {entry.text}
                  </Button>
                ))}
              </div>
              <div className="mt-7 w-full max-w-xl">
                <p className="mb-2 text-xs text-muted-foreground">Pick up where you left off</p>
                <div className="flex flex-wrap gap-2">
                  {session.state.threads.slice(0, 3).map((thread) => (
                    <Button
                      key={thread.id}
                      variant="outline"
                      size="sm"
                      className="max-w-full min-w-0 text-xs"
                      onClick={() => session.selectThread(thread.id)}
                    >
                      <span className="truncate">{thread.title}</span>
                      {thread.pinned && (
                        <Badge variant="outline" size="sm">
                          Pinned
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </main>
      <footer className="shrink-0 px-3 pt-2 pb-4 sm:px-5 sm:pb-6">
        <div className="mx-auto w-full max-w-3xl">
          <ChatComposer
            draft={draft}
            busy={Boolean(session.pending)}
            onSend={session.send}
            onStop={session.stop}
            usedTokens={usedTokens}
          />
        </div>
      </footer>
    </div>
  );
}
