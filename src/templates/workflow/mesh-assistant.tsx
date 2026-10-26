import { useRef, useState } from "react";
import {
  ArrowUp,
  Copy,
  FileText,
  Plus,
  Settings2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { ResponsiveAssistantPanel } from "@/blocks/application/shells/responsive-assistant";
import { StreamingMessage } from "@/components/reui/streaming-message";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { copyMeshText } from "./mesh-page-actions";

type Source = { id: string; title: string; text: string; onOpen?: () => void };
export type MeshAssistantContext = {
  title: string;
  kind: "canvas" | "document";
  text: string;
  sources: Source[];
};
type Turn = {
  id: string;
  question: string;
  answer: string;
  sources: Source[];
  settled: boolean;
  vote?: "up" | "down";
};

/** Local preview replies are derived from the current native document/scene. */
function answerQuestion(
  question: string,
  context: MeshAssistantContext,
  useSources: boolean,
): Turn {
  const query = question.toLowerCase();
  const lines = context.text
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sourceMatch = /question|risk|decision|action|next|goal/.exec(query)?.[0];
  const matchingSources =
    useSources && sourceMatch
      ? context.sources.filter((source) =>
          `${source.title} ${source.text}`.toLowerCase().includes(sourceMatch),
        )
      : [];
  const sources = useSources
    ? (matchingSources.length ? matchingSources : context.sources).slice(0, 2)
    : [];
  let excerpts: string[];
  if (matchingSources.length) {
    excerpts = matchingSources
      .flatMap((source) =>
        source.text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      )
      .slice(0, 6);
  } else if (/summari[sz]e|summary/.test(query)) {
    excerpts = lines.filter((line) => line.length > 25).slice(0, 5);
  } else {
    const terms = query.split(/\W+/).filter((word) => word.length > 3);
    excerpts = lines
      .filter((line) => terms.some((term) => line.toLowerCase().includes(term)))
      .slice(0, 6);
  }
  const answer = excerpts.length
    ? `${context.title}\n\n${excerpts.map((line) => `• ${line}`).join("\n\n")}`
    : `I couldn't find that in ${context.title}. Try asking about a heading, a note, or a decision on the current page.`;
  return { id: crypto.randomUUID(), question, answer, sources, settled: false };
}

export function MeshAssistant({
  context,
  onClose,
}: {
  context: MeshAssistantContext;
  onClose: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>(() => [
    {
      ...answerQuestion(
        context.kind === "canvas" ? "Summarize this board" : "Summarize this document",
        context,
        true,
      ),
      settled: true,
    },
  ]);
  const [question, setQuestion] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);
  const [useSources, setUseSources] = useState(true);
  const [followUps, setFollowUps] = useState(true);
  const composer = useRef<HTMLTextAreaElement>(null);
  const suggestions =
    context.kind === "canvas"
      ? ["What are the open questions?", "Summarize the decisions", "What are the goals?"]
      : ["What are the open questions?", "List the action items", "Summarize the risks"];

  function ask(value: string) {
    if (!value.trim() || generating) return;
    const turn = answerQuestion(value.trim(), context, useSources);
    setTurns((previous) => [...previous, turn]);
    setGenerating(turn.id);
    setQuestion("");
  }
  return (
    <ResponsiveAssistantPanel
      title="Mesh AI assistant"
      onClose={onClose}
      className="mesh-assistant"
    >
      <div className="mesh-assistant-header">
        <Sparkles className="size-4" />
        <strong>Ask AI</strong>
        <div className="ms-auto flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="New question"
            onClick={() => {
              setTurns([]);
              setGenerating(null);
              setQuestion("");
              composer.current?.focus();
            }}
          >
            <Plus />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Assistant settings">
                <Settings2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <h3 className="mb-4 text-sm font-semibold">Assistant settings</h3>
              <Label className="mb-4 flex items-center justify-between gap-3">
                Use page sources
                <Switch checked={useSources} onCheckedChange={setUseSources} />
              </Label>
              <Label className="flex items-center justify-between gap-3">
                Suggested follow-ups
                <Switch checked={followUps} onCheckedChange={setFollowUps} />
              </Label>
              <p className="mt-4 text-xs text-muted-foreground">
                Local preview answers use the content on this page.
              </p>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon-sm" aria-label="Hide assistant" onClick={onClose}>
            <X />
          </Button>
        </div>
      </div>
      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller className="mesh-assistant-scroller">
          <MessageScrollerViewport>
            <MessageScrollerContent className="mesh-assistant-messages">
              {!turns.length && (
                <div className="mesh-assistant-empty">
                  <Sparkles />
                  <h3>What would you like to know?</h3>
                  <p>Ask about {context.title}.</p>
                </div>
              )}
              {turns.map((turn, index) => (
                <MessageScrollerItem key={turn.id} scrollAnchor={index === turns.length - 1}>
                  <StreamingMessage
                    question={turn.question}
                    answer={turn.answer}
                    settled={turn.settled}
                    pendingLabel={`Reading ${context.kind === "canvas" ? "the board" : "the document"}…`}
                    onReplay={() => {
                      const replacement = answerQuestion(turn.question, context, useSources);
                      setTurns((previous) =>
                        previous.map((item) =>
                          item.id === turn.id ? { ...replacement, id: turn.id } : item,
                        ),
                      );
                      setGenerating(turn.id);
                    }}
                    onDone={() => {
                      setGenerating((active) => (active === turn.id ? null : active));
                      setTurns((previous) =>
                        previous.map((item) =>
                          item.id === turn.id ? { ...item, settled: true } : item,
                        ),
                      );
                    }}
                    footer={
                      <>
                        {turn.sources.length > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="xs" className="mesh-ai-sources">
                                <FileText />
                                {turn.sources.length} sources used
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80 max-h-96 overflow-auto">
                              <h3 className="mb-3 text-sm font-semibold">Sources</h3>
                              {turn.sources.map((source) => (
                                <div key={source.id} className="border-t py-3">
                                  {source.onOpen ? (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0 text-left"
                                      onClick={source.onOpen}
                                    >
                                      {source.title}
                                    </Button>
                                  ) : (
                                    <p className="text-xs font-medium">{source.title}</p>
                                  )}
                                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                                    {source.text.slice(0, 450)}
                                  </p>
                                </div>
                              ))}
                            </PopoverContent>
                          </Popover>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Helpful answer"
                          aria-pressed={turn.vote === "up"}
                          onClick={() =>
                            setTurns((previous) =>
                              previous.map((item) =>
                                item.id === turn.id
                                  ? { ...item, vote: item.vote === "up" ? undefined : "up" }
                                  : item,
                              ),
                            )
                          }
                        >
                          <ThumbsUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Unhelpful answer"
                          aria-pressed={turn.vote === "down"}
                          onClick={() =>
                            setTurns((previous) =>
                              previous.map((item) =>
                                item.id === turn.id
                                  ? { ...item, vote: item.vote === "down" ? undefined : "down" }
                                  : item,
                              ),
                            )
                          }
                        >
                          <ThumbsDown />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Copy answer"
                          onClick={() => copyMeshText(turn.answer, "Answer copied")}
                        >
                          <Copy />
                        </Button>
                      </>
                    }
                  />
                </MessageScrollerItem>
              ))}
              {followUps && !generating && (
                <div className="mesh-assistant-suggestions">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => ask(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton aria-label="Scroll to latest message" />
        </MessageScroller>
      </MessageScrollerProvider>
      <form
        className="mesh-assistant-composer"
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
      >
        <Textarea
          ref={composer}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          aria-label="Ask about this page"
          placeholder="Ask a follow-up…"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              ask(question);
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">Local assistant · current page</span>
          <Button
            type="submit"
            size="icon-sm"
            aria-label="Send question"
            disabled={!question.trim() || Boolean(generating)}
          >
            <ArrowUp />
          </Button>
        </div>
      </form>
    </ResponsiveAssistantPanel>
  );
}
