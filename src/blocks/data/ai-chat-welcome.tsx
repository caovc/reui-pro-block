import { IconTile } from "@/components/reui/icon-tile";
/** Independent starter welcome screen composed from the audited official free
 * REUI examples. Actual Empty, InputGroup, Attachment and Message parts are
 * retained; application starter/context/effort state is original demo logic.
 * Public desktop/mobile pixels remain pending, as recorded in the ledger.
 */
import { ArrowUpRight, FileText, History, ListChecks, MessageSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatComposer from "./ai-chat-composer";
import { useChatDraft } from "./ai-chat-draft";
import ChatHistory from "./ai-chat-history";
import { useChatSession } from "./ai-chat-session";
import ChatTranscript from "./ai-chat-transcript";

const STARTERS = [
  {
    title: "Draft a release update",
    description: "Start from the latest release notes",
    text: "Draft a release update for the customer note",
    context: ["release"],
    icon: FileText,
  },
  {
    title: "Plan a project",
    description: "Answer a short brief, then build a plan",
    text: "Plan a project with a guided plan brief",
    context: ["roadmap"],
    icon: ListChecks,
  },
  {
    title: "Review customer themes",
    description: "Bring the research context into the conversation",
    text: "Review the strongest customer feedback themes",
    context: ["research"],
    icon: MessageSquare,
  },
];
export default function PromptStarterWelcome() {
  const session = useChatSession();
  const draft = useChatDraft();
  const hasTurns = Boolean(session.thread?.turns.length);
  return (
    <div className="flex h-svh min-h-0 w-full flex-col bg-background" data-ai-chat="welcome">
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-5">
        <ChatHistory session={session} />
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          onClick={() => {
            session.selectThread("new");
            draft.prepare("");
          }}
        >
          New chat
        </Button>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">
        {hasTurns ? (
          <ChatTranscript session={session} />
        ) : (
          <ScrollArea className="h-full">
            <div className="mx-auto w-full max-w-3xl px-5 py-9 sm:py-14">
              <Empty className="gap-4 border-0 p-0">
                <EmptyHeader>
                  <EmptyMedia>
                    <IconTile variant="frame" size="lg">
                      <Sparkles />
                    </IconTile>
                  </EmptyMedia>
                  <EmptyTitle className="text-2xl tracking-tight">Welcome back, Jamie</EmptyTitle>
                  <EmptyDescription className="max-w-md">
                    Pick up a conversation or bring a small task. We can start with what you already
                    have.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
              <div
                className="mt-6 flex flex-wrap justify-center gap-2"
                aria-label="Demo workspace statistics"
              >
                <Badge variant="outline" className="font-normal">
                  4 context files
                </Badge>
                <Badge variant="outline" className="font-normal">
                  3 recent chats
                </Badge>
                <Badge variant="outline" className="font-normal">
                  Local demo workspace
                </Badge>
              </div>
              <div className="mt-9 space-y-6">
                <section aria-labelledby="chat-start-heading">
                  <h2
                    id="chat-start-heading"
                    className="mb-2 text-xs font-medium text-muted-foreground"
                  >
                    Start something
                  </h2>
                  <div className="divide-y rounded-xl border">
                    {STARTERS.map(({ title, description, text, context, icon: Icon }) => (
                      <button
                        type="button"
                        key={title}
                        className="group flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left outline-none first:rounded-t-xl last:rounded-b-xl hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => draft.prepare(text, context)}
                      >
                        <IconTile size="sm" variant="outline">
                          <Icon />
                        </IconTile>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{title}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {description}
                          </span>
                        </span>
                        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </section>
                <section aria-labelledby="chat-resume-heading">
                  <h2
                    id="chat-resume-heading"
                    className="mb-2 text-xs font-medium text-muted-foreground"
                  >
                    Resume a conversation
                  </h2>
                  <div className="grid gap-1">
                    {session.state.threads.map((thread) => (
                      <Button
                        key={thread.id}
                        variant="ghost"
                        className="min-w-0 justify-start gap-3 text-xs font-normal"
                        onClick={() => session.selectThread(thread.id)}
                      >
                        <History className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-left">{thread.title}</span>
                        <span className="text-[10px] text-muted-foreground">{thread.group}</span>
                      </Button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </ScrollArea>
        )}
      </main>
      <footer className="shrink-0 px-3 pt-2 pb-4 sm:px-5 sm:pb-6">
        <div className="mx-auto max-w-3xl">
          <ChatComposer
            draft={draft}
            busy={Boolean(session.pending)}
            onSend={session.send}
            onStop={session.stop}
            effortPicker
            usedTokens={Math.ceil(
              (session.thread?.turns.reduce((sum, turn) => sum + turn.body.length, 0) ?? 0) / 4,
            )}
          />
        </div>
      </footer>
    </div>
  );
}
