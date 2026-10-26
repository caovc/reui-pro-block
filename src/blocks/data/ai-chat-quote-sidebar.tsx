/** Independent Quote Reply Sidebar; public pixels remain pending.
 * Actually adapts free REUI c-sidebar-4 inset-first/floating/offcanvas layout,
 * c-command-7 keyboard palette, c-message-4/7 surfaces/actions and c-bubble-7.
 * https://reui.io/r/radix-nova/c-sidebar-4.json
 * https://reui.io/r/radix-nova/c-command-7.json
 * MIT, Copyright (c) 2025 Keenthemes Inc.; preserve REUI-LICENSE.txt.
 * Quote selection/personalization are original application behavior; no paid
 * code, extracted media or backend integration is used.
 */
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  FileText,
  MessageSquare,
  Plus,
  Quote,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { ReuiSidebar } from "@/components/reui/sidebar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import ChatHistory from "./ai-chat-history";
import { useChatDraft } from "./ai-chat-draft";
import { CHAT_CONTEXTS, useChatSession, type ChatTurn } from "./ai-chat-session";
import { sendQuotedMessage } from "./ai-chat-quote-model";
import WorkspaceComposer from "./ai-chat-workspace-composer";
import WorkspaceTranscript from "./ai-chat-workspace-transcript";

const SUGGESTIONS = [
  "Explain this in plain language",
  "Rewrite this as a shorter sentence",
  "What should we verify next?",
  "Turn this into an action item",
];

function QuoteAnswer({
  turn,
  quote,
  onQuote,
}: {
  turn: ChatTurn;
  quote?: string;
  onQuote: (text: string) => void;
}) {
  const body = turn.status === "complete" ? turn.body : turn.body.slice(0, turn.revealed);
  const pending = turn.status === "pending" || turn.status === "streaming";
  const [selection, setSelection] = useState("");
  const [copied, setCopied] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);
  function readSelection() {
    const selected = window.getSelection();
    const text = selected?.toString().trim() ?? "";
    if (
      text &&
      answerRef.current?.contains(selected?.anchorNode ?? null) &&
      answerRef.current.contains(selected?.focusNode ?? null)
    )
      setSelection(text.slice(0, 500));
    else setSelection("");
  }
  return (
    <Message>
      <MessageContent>
        <MessageHeader className="gap-2 px-0">
          <Sparkles className="size-3.5" />
          Bricklane assistant
          <span className="ms-auto truncate text-[10px] font-normal">{turn.meta.model}</span>
        </MessageHeader>
        {quote && (
          <blockquote
            className="line-clamp-3 border-s-2 ps-3 text-xs leading-5 text-muted-foreground"
            data-replied-quote
          >
            {quote}
          </blockquote>
        )}
        <span role="status" className="sr-only">
          {pending
            ? "Generating reply"
            : turn.status === "stopped"
              ? "Reply stopped"
              : "Reply ready"}
        </span>
        <Bubble variant="ghost" aria-busy={pending}>
          <BubbleContent
            ref={answerRef}
            onPointerUp={readSelection}
            onKeyUp={readSelection}
            className="select-text"
          >
            {turn.status === "pending" ? (
              <Marker>
                <MarkerIcon>
                  <Spinner />
                </MarkerIcon>
                <MarkerContent>Considering the quoted context…</MarkerContent>
              </Marker>
            ) : (
              <div className="space-y-3">
                {body.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-wrap leading-6">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </BubbleContent>
        </Bubble>
        {selection && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit text-xs"
            onClick={() => {
              onQuote(selection);
              setSelection("");
              window.getSelection()?.removeAllRanges();
            }}
          >
            <Quote />
            Reply to selection
          </Button>
        )}
        {turn.status === "stopped" && (
          <Marker>
            <MarkerContent className="text-xs">Stopped · partial draft kept</MarkerContent>
          </Marker>
        )}
        <MessageFooter className="gap-1 px-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={copied ? "Reply copied" : "Copy reply"}
            disabled={!body}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(body);
                setCopied(true);
              } catch {
                toast.error("Clipboard unavailable");
              }
            }}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Quote first sentence"
            disabled={pending || !body}
            onClick={() => onQuote(body.split(/(?<=[.!?])\s/)[0].slice(0, 500))}
          >
            <Quote />
          </Button>
          <span className="text-[10px] text-muted-foreground">
            Select a sentence to reply to it
          </span>
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}

function QuotePanel() {
  const { toggleSidebar } = useSidebar();
  const session = useChatSession("release");
  const draft = useChatDraft();
  const [quote, setQuote] = useState("");
  const [personalize, setPersonalize] = useState(true);
  const [mode, setMode] = useState("Ask");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [quotes, setQuotes] = useState<Record<string, string>>({});
  const threadSession = {
    ...session,
    selectThread: (id: string) => {
      setQuote("");
      session.selectThread(id);
    },
  };
  function quoteText(text: string) {
    setQuote(text);
    draft.prepare(draft.value);
  }
  return (
    <ReuiSidebar
      width={420}
      side="right"
      variant="floating"
      collapsible="offcanvas"
      className="absolute h-full"
      mobileClassName="data-[side=right]:w-(--sidebar-width) data-[side=right]:sm:max-w-none"
      mobileTitle="Quote reply assistant"
      mobileDescription="Select an answer sentence and ask a focused follow-up."
      mobileWidth="min(100vw, 28rem)"
      header={
        <div className="flex h-10 min-w-0 items-center gap-1 pe-8 md:pe-0">
          <MessageSquare className="ms-1 size-3.5 shrink-0" />
          <ChatHistory session={threadSession} />
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="ms-auto shrink-0"
            aria-label="New quote conversation"
            onClick={() => {
              session.selectThread("new");
              setQuote("");
              draft.prepare("");
            }}
          >
            <Plus />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="hidden md:inline-flex"
            aria-label="Close quote assistant"
            onClick={toggleSidebar}
          >
            <X />
          </Button>
        </div>
      }
      footer={
        <div className="space-y-3 p-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <label htmlFor="quote-personalize" className="flex items-center gap-2">
              <Sparkles className="size-3.5" />
              Personalize for this workspace
            </label>
            <Switch id="quote-personalize" checked={personalize} onCheckedChange={setPersonalize} />
          </div>
          <WorkspaceComposer
            draft={draft}
            sources={CHAT_CONTEXTS.slice(0, 2)}
            quote={quote}
            onClearQuote={() => setQuote("")}
            busy={Boolean(session.pending)}
            onStop={session.stop}
            onSuggest={() => setSuggestionsOpen(true)}
            onSend={(text, meta) => {
              if (session.pending || !text.trim()) return;
              const answerId = `answer-${session.state.nextId}`;
              setQuotes((current) => ({ ...current, [answerId]: quote }));
              session.setState((current) =>
                sendQuotedMessage(current, text, meta, quote, personalize),
              );
              setQuote("");
            }}
            tools={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="text-xs"
                    aria-label="Choose reply mode"
                  >
                    {mode}
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup value={mode} onValueChange={setMode}>
                    {["Ask", "Write", "Explore"].map((value) => (
                      <DropdownMenuRadioItem key={value} value={value}>
                        {value}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
          <Popover open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="sr-only"
                aria-label="Open prompt palette"
              >
                Suggestions
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-[min(22rem,calc(100vw-2rem))] p-0"
            >
              <Command>
                <CommandInput
                  placeholder="Find a suggested prompt…"
                  aria-label="Find a suggested prompt"
                />
                <CommandList>
                  <CommandEmpty>No suggestions found.</CommandEmpty>
                  <CommandGroup heading="Ask a follow-up">
                    {SUGGESTIONS.map((text) => (
                      <CommandItem
                        key={text}
                        value={text}
                        onSelect={() => {
                          draft.prepare(text);
                          setSuggestionsOpen(false);
                        }}
                      >
                        <Sparkles className="size-3.5" />
                        {text}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-y bg-background">
        {session.thread?.turns.length ? (
          <WorkspaceTranscript
            threadId={session.state.activeId}
            turns={session.thread.turns}
            busy={Boolean(session.pending)}
          >
            {(turn) => (
              <QuoteAnswer turn={turn as ChatTurn} quote={quotes[turn.id]} onQuote={quoteText} />
            )}
          </WorkspaceTranscript>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-7 text-center">
            <Sparkles className="size-6 text-muted-foreground" />
            <h2 className="text-sm font-medium">Ask a focused question</h2>
            <p className="text-xs leading-5 text-muted-foreground">
              Attach one of the two workspace documents. Select any sentence in an answer to bring
              it into your next question.
            </p>
          </div>
        )}
      </div>
    </ReuiSidebar>
  );
}

export default function QuoteReplySidebar() {
  return (
    <SidebarProvider
      className="relative h-svh min-h-0 w-full overflow-hidden bg-muted/30"
      data-ai-chat="quote"
    >
      <SidebarInset className="min-w-0 overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-5">
          <FileText className="size-4" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">Workspace review</span>
          <Badge variant="outline" className="max-sm:hidden">
            Original local demo
          </Badge>
          <SidebarTrigger aria-label="Toggle quote assistant" />
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-10 sm:px-12">
          <div className="mx-auto max-w-2xl space-y-10">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            {[0, 1, 2, 3].map((section) => (
              <section
                key={section}
                className="space-y-4"
                aria-label={`Page placeholder ${section + 1}`}
              >
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-11/12" />
                <Skeleton className="h-2.5 w-4/5" />
              </section>
            ))}
          </div>
        </div>
      </SidebarInset>
      <QuotePanel />
    </SidebarProvider>
  );
}
