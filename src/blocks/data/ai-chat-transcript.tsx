/** Actual free REUI c-message-scroller-2/3, c-message-4/7 and c-code-block-4.
 * https://reui.io/r/radix-nova/c-message-scroller-2.json
 * https://reui.io/r/radix-nova/c-message-4.json
 * https://reui.io/r/radix-nova/c-code-block-4.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 * Uses real upstream transcript/turn surfaces and the official REUI code fence
 * renderer. It does not replace scrolling, highlighting or questionnaire logic.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Copy, FileText, RotateCcw, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import {
  CodeBlock,
  CodeBlockCopyButton,
  markdownFences,
} from "@/components/reui/code-block/code-block";
import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Badge } from "@/components/reui/badge";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import ChatQuestionnaire from "./ai-chat-questionnaire";
import { CHAT_CONTEXTS, type ChatSession, type ChatTurn } from "./ai-chat-session";

function Reply({
  turn,
  session,
  onInsert,
  insertedBody,
}: {
  turn: ChatTurn;
  session: ChatSession;
  onInsert?: (body: string) => void;
  insertedBody?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const pending = turn.status === "pending" || turn.status === "streaming";
  const body = turn.status === "complete" ? turn.body : turn.body.slice(0, turn.revealed);
  const sources = CHAT_CONTEXTS.filter((entry) => turn.meta.contextIds.includes(entry.id));
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <Message>
      <MessageContent>
        <MessageHeader className="gap-2 px-0">
          <Sparkles className="size-3.5" />
          <span>Bricklane assistant</span>
          <span className="ms-auto text-[10px] font-normal text-muted-foreground">
            {turn.meta.model}
            {turn.version ? ` · draft ${turn.version + 1}` : ""}
          </span>
        </MessageHeader>
        <span role="status" className="sr-only">
          {turn.status === "complete"
            ? turn.kind === "plan"
              ? "Plan built from your answers"
              : "Reply ready"
            : turn.status === "stopped"
              ? "Reply stopped"
              : turn.revealed === 0
                ? "Generating reply"
                : ""}
        </span>
        <Bubble variant="ghost" aria-busy={pending}>
          <BubbleContent ref={resultRef} tabIndex={-1} className="outline-none">
            {turn.status === "pending" ? (
              <Marker>
                <MarkerIcon>
                  <Spinner />
                </MarkerIcon>
                <MarkerContent>Reading the attached context…</MarkerContent>
              </Marker>
            ) : (
              <div className="space-y-3 leading-6">
                {markdownFences(body).map((part, index) =>
                  part.type === "text" ? (
                    <div key={index} className="space-y-3">
                      {part.content
                        .split("\n\n")
                        .filter(Boolean)
                        .map((paragraph, i) => (
                          <p key={i} className="whitespace-pre-wrap">
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <CodeBlock
                      key={index}
                      code={part.content}
                      language={part.language}
                      streaming={pending && part.open}
                      wrap
                      className="max-w-full"
                    >
                      <CodeBlockCopyButton />
                    </CodeBlock>
                  ),
                )}
                {pending && (
                  <span
                    className="inline-block h-4 w-0.5 bg-foreground motion-reduce:hidden"
                    aria-hidden="true"
                  />
                )}
              </div>
            )}
          </BubbleContent>
        </Bubble>
        {turn.status === "stopped" && (
          <Marker>
            <MarkerContent className="text-xs">
              Stopped by you{!body ? " before any text arrived" : " · partial draft kept"}
            </MarkerContent>
          </Marker>
        )}
        {turn.status === "complete" && turn.kind === "questionnaire" && (
          <ChatQuestionnaire
            onComplete={(answers) => {
              session.applyPlan(turn.id, answers);
              window.requestAnimationFrame(() => resultRef.current?.focus());
            }}
          />
        )}
        {turn.status === "complete" && sources.length > 0 && (
          <AttachmentGroup aria-label="Reply context sources">
            {sources.map((source) => (
              <Attachment key={source.id} size="xs" className="max-w-52">
                <AttachmentMedia>
                  <FileText />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{source.name}</AttachmentTitle>
                </AttachmentContent>
              </Attachment>
            ))}
          </AttachmentGroup>
        )}
        <MessageFooter className="flex-wrap gap-0.5 px-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={!body}
            aria-label={copied ? "Reply copied" : "Copy reply"}
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
            aria-label="Regenerate reply"
            disabled={Boolean(session.pending)}
            onClick={() => session.regenerate(turn.id)}
          >
            <RotateCcw />
          </Button>
          <Button
            type="button"
            variant={turn.vote === "up" ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Good reply"
            aria-pressed={turn.vote === "up"}
            disabled={pending}
            onClick={() => session.vote(turn.id, "up")}
          >
            <ThumbsUp />
          </Button>
          <Button
            type="button"
            variant={turn.vote === "down" ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Bad reply"
            aria-pressed={turn.vote === "down"}
            disabled={pending}
            onClick={() => session.vote(turn.id, "down")}
          >
            <ThumbsDown />
          </Button>
          {turn.status === "complete" && (
            <Badge variant="outline" size="sm" className="ms-2 font-normal">
              {turn.meta.effort}
            </Badge>
          )}
          {onInsert && turn.status === "complete" && turn.kind !== "questionnaire" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ms-auto text-xs"
              onClick={() => onInsert(body)}
            >
              {insertedBody === body ? "Undo insert" : "Insert into draft"}
            </Button>
          )}
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}
export default function ChatTranscript({
  session,
  onInsert,
  insertedBody,
}: {
  session: ChatSession;
  onInsert?: (body: string) => void;
  insertedBody?: string;
}) {
  const turns = session.thread?.turns ?? [];
  return (
    <MessageScrollerProvider
      key={session.state.activeId}
      autoScroll
      defaultScrollPosition="last-anchor"
      scrollPreviousItemPeek={64}
      scrollMargin={16}
    >
      <MessageScroller>
        <MessageScrollerViewport aria-label="Chat transcript">
          <MessageScrollerContent
            aria-busy={Boolean(session.pending)}
            className="mx-auto w-full max-w-3xl gap-7 px-4 py-6"
          >
            {turns.map((turn) => (
              <MessageScrollerItem
                key={turn.id}
                messageId={turn.id}
                scrollAnchor={turn.role === "user"}
              >
                {turn.role === "user" ? (
                  <Message align="end">
                    <MessageContent>
                      <Bubble variant="muted" align="end">
                        <BubbleContent className="whitespace-pre-wrap">{turn.body}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                ) : (
                  <Reply
                    turn={turn}
                    session={session}
                    onInsert={onInsert}
                    insertedBody={insertedBody}
                  />
                )}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton variant="outline" className="rounded-full shadow-sm" />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
