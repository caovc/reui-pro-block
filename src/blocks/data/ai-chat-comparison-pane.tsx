import { downloadComparisonText } from "./ai-chat-comparison-export";
/** Composes actual free ReUI c-message-4/7, c-message-scroller-2/3/4,
 * c-select and c-code-block-4 surfaces. MIT, Keenthemes Inc.
 * The consumer adds independent reply state, structured fixture tables and quote actions.
 */
import { useRef, useState, type Ref, type UIEvent } from "react";
import {
  ArrowDownUp,
  Check,
  Download,
  Ellipsis,
  MessageSquareQuote,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/reui/code-block/code-block";
import { ComparisonCopy, ComparisonTip } from "./ai-chat-comparison-actions";
import {
  COMPARISON_MODELS,
  comparisonAnswerText,
  comparisonModel,
  comparisonTranscript,
  comparisonTurnMetrics,
  segmentText,
  type AnswerSegment,
  type ComparisonModelId,
  type ComparisonTurn,
} from "./ai-chat-comparison-model";
import type { ComparisonPaneSession } from "./ai-chat-comparison-session";

type TableSegment = Extract<AnswerSegment, { type: "table" }>;
function ComparisonTable({
  segment,
  rowsVisible,
  onSort,
}: {
  segment: TableSegment;
  rowsVisible: number;
  onSort: (column: number, descending: boolean) => void;
}) {
  const [sort, setSort] = useState<{ column: number; descending: boolean } | null>(null);
  return (
    <Table className="comparison-answer-table" aria-label={segment.caption}>
      <caption className="sr-only">{segment.caption}</caption>
      <TableHeader>
        <TableRow>
          {segment.columns.map((column, index) => (
            <TableHead
              key={column}
              aria-sort={
                sort?.column === index ? (sort.descending ? "descending" : "ascending") : "none"
              }
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Sort by ${column}`}
                onClick={() => {
                  const descending = sort?.column === index && !sort.descending;
                  setSort({ column: index, descending });
                  onSort(index, descending);
                }}
              >
                {column}
                <ArrowDownUp aria-hidden="true" />
              </Button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {segment.rows.slice(0, rowsVisible).map((row) => (
          <TableRow key={String(row[0])}>
            {row.map((cell, index) => (
              <TableCell key={index}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      {rowsVisible === segment.rows.length && (
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            {segment.columns.slice(1).map((column, index) => (
              <TableCell key={column}>
                {index === 0 || segment.columns.length === 4
                  ? segment.rows.reduce(
                      (sum, row) =>
                        sum + (typeof row[index + 1] === "number" ? (row[index + 1] as number) : 0),
                      0,
                    )
                  : ""}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
function ComparisonReply({
  turn,
  session,
  onQuote,
}: {
  turn: ComparisonTurn;
  session: ComparisonPaneSession;
  onQuote: (text: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState("");
  const model = comparisonModel(turn.modelId);
  const text = comparisonAnswerText(turn.answer).slice(0, turn.revealed);
  const metrics = comparisonTurnMetrics(turn);
  const busy = turn.status === "pending" || turn.status === "streaming";
  const rememberSelection = () => {
    const selected = window.getSelection();
    if (
      selected?.anchorNode &&
      selected.focusNode &&
      root.current?.contains(selected.anchorNode) &&
      root.current.contains(selected.focusNode)
    )
      setSelection(selected.toString().trim());
  };
  let offset = 0;
  return (
    <Message
      data-comparison-turn={turn.id}
      role="group"
      aria-label={`${model.label} answer ${turn.id}`}
    >
      <MessageContent className="comparison-reply-content">
        <Bubble variant="ghost" className="w-full" aria-busy={busy}>
          <BubbleContent
            ref={root}
            className="comparison-answer-body"
            onMouseUp={rememberSelection}
            onKeyUp={rememberSelection}
          >
            {turn.status === "limited" ? (
              <Alert className="comparison-limited">
                <AlertTitle>Playback paused</AlertTitle>
                <AlertDescription>
                  This local demo is simulating a rate limit for {model.label}.
                </AlertDescription>
                <Button type="button" variant="outline" size="sm" onClick={session.retry}>
                  Retry
                </Button>
              </Alert>
            ) : turn.status === "pending" ? (
              <div role="status" className="comparison-working">
                <Spinner />
                Preparing the comparison…
              </div>
            ) : (
              turn.answer.segments.map((segment, index) => {
                const length = segmentText(segment).length;
                const available = Math.min(length, Math.max(0, turn.revealed - offset));
                offset += length + 2;
                if (available <= 0) return null;
                if (segment.type === "paragraph")
                  return <p key={index}>{segment.text.slice(0, available)}</p>;
                if (segment.type === "table")
                  return (
                    <ComparisonTable
                      key={`${index}-${turn.revision}`}
                      segment={segment}
                      rowsVisible={Math.min(
                        segment.rows.length,
                        Math.ceil((available / length) * segment.rows.length),
                      )}
                      onSort={(column, descending) =>
                        session.sortTable(turn.id, index, column, descending)
                      }
                    />
                  );
                const code = segment.text.slice(
                  0,
                  Math.max(0, available - segment.language.length - 4),
                );
                return (
                  <CodeBlock
                    key={index}
                    code={code}
                    language={segment.language}
                    label={`${model.label} ${segment.title}`}
                    streaming={busy}
                    showLineNumbers
                    wrap
                    selectable
                    onSelectedLinesChange={(lines) =>
                      setSelection(
                        lines
                          .map((line) => code.split("\n")[line - 1])
                          .filter((line) => line !== undefined)
                          .join("\n"),
                      )
                    }
                    className="comparison-code"
                  >
                    <CodeBlockHeader>
                      <CodeBlockTitle className="flex-1">{segment.title}</CodeBlockTitle>
                      <CodeBlockCopyButton />
                    </CodeBlockHeader>
                  </CodeBlock>
                );
              })
            )}
            {turn.status === "streaming" && (
              <span className="comparison-caret motion-reduce:hidden" aria-hidden="true" />
            )}
          </BubbleContent>
        </Bubble>
        {selection && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => {
              onQuote(selection);
              setSelection("");
            }}
          >
            Ask both about selection
          </Button>
        )}
        {turn.status === "stopped" && (
          <p role="status" className="text-xs text-muted-foreground">
            Stopped by you · partial answer kept
          </p>
        )}
        {text && (
          <MessageFooter className="comparison-reply-footer">
            <span>{metrics.latency.toFixed(1)}s</span>
            <span>•</span>
            <span>{metrics.tokens} tokens</span>
            <span>•</span>
            <span>{metrics.rate} tok/s</span>
            {turn.preferred && (
              <span className="comparison-preferred">
                <Check />
                Preferred
              </span>
            )}
            <div className="comparison-reply-actions">
              <ComparisonCopy text={text} />
              <ComparisonTip label="Like answer">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Like answer"
                  aria-pressed={turn.rating === "up"}
                  onClick={() => session.rate(turn.id, "up")}
                >
                  <ThumbsUp />
                </Button>
              </ComparisonTip>
              <ComparisonTip label="Dislike answer">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Dislike answer"
                  aria-pressed={turn.rating === "down"}
                  onClick={() => session.rate(turn.id, "down")}
                >
                  <ThumbsDown />
                </Button>
              </ComparisonTip>
              <ComparisonTip label="Quote answer">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Quote answer"
                  onClick={() => onQuote(text)}
                >
                  <MessageSquareQuote />
                </Button>
              </ComparisonTip>
            </div>
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}
export default function ComparisonPane({
  session,
  lane,
  onModelChange,
  onRegenerate,
  onQuote,
  onExportAll,
  viewportRef,
  onScroll,
  onIntent,
}: {
  session: ComparisonPaneSession;
  lane: "A" | "B";
  onModelChange: (model: ComparisonModelId) => void;
  onRegenerate: () => void;
  onQuote: (text: string) => void;
  onExportAll: () => void;
  viewportRef: Ref<HTMLDivElement>;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  onIntent: () => void;
}) {
  const model = comparisonModel(session.modelId);
  const latest = session.turns.at(-1);
  const live = comparisonTurnMetrics(latest);
  const transcript = comparisonTranscript(session.turns, model.label);
  const totalTokens = session.turns.reduce(
    (sum, turn) => sum + comparisonTurnMetrics(turn).tokens,
    0,
  );
  const totalCost = session.turns.reduce((sum, turn) => sum + comparisonTurnMetrics(turn).cost, 0);
  return (
    <section
      className="comparison-pane"
      data-comparison-lane={lane}
      aria-label={`${model.label} answers`}
      onPointerDown={onIntent}
    >
      <header className="comparison-pane-header">
        <Badge variant="secondary" className="comparison-lane">
          {lane}
        </Badge>
        <div className="comparison-model-field">
          <span className="comparison-model-caption">Perspective {lane === "A" ? "01" : "02"}</span>
          <Select
            value={session.modelId}
            onValueChange={(value) => onModelChange(value as ComparisonModelId)}
          >
            <SelectTrigger
              size="sm"
              className="comparison-model-selector"
              aria-label={`Model, ${model.label}`}
            >
              <SelectValue className="comparison-model-label">{model.label}</SelectValue>
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {[...new Set(COMPARISON_MODELS.map((item) => item.provider))].map((provider) => (
                <SelectGroup key={provider}>
                  <SelectLabel>{provider}</SelectLabel>
                  {COMPARISON_MODELS.filter((item) => item.provider === provider).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span>{item.label}</span>
                      {item.id === "gemini" && (
                        <span className="comparison-option-limited">Limited</span>
                      )}
                      <span className="comparison-context-window">{item.context}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="comparison-pane-actions">
          {session.busy && (
            <span className="comparison-live-metric" aria-label="Recorded demo playback timing">
              <Spinner />
              {live.latency.toFixed(1)}s
            </span>
          )}
          <ComparisonTip label={`Regenerate the ${model.label} answer`}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="comparison-icon size-7"
              aria-label={`Regenerate the ${model.label} answer`}
              disabled={!latest}
              onClick={onRegenerate}
            >
              <RotateCcw />
            </Button>
          </ComparisonTip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="comparison-icon size-7"
                aria-label={`More actions for ${model.label}`}
              >
                <Ellipsis className="rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!session.turns.length}
                onSelect={() =>
                  downloadComparisonText(`${session.modelId}-transcript.md`, transcript)
                }
              >
                <Download />
                Download this transcript
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!latest?.revealed}
                onSelect={() =>
                  latest && onQuote(comparisonAnswerText(latest.answer).slice(0, latest.revealed))
                }
              >
                <MessageSquareQuote />
                Quote latest answer
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExportAll}>
                <Download />
                Download comparison
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <MessageScrollerProvider
        autoScroll
        defaultScrollPosition="last-anchor"
        scrollPreviousItemPeek={0}
        scrollMargin={16}
      >
        <MessageScroller className="comparison-scroller">
          <MessageScrollerViewport
            ref={viewportRef}
            aria-label="Messages"
            onScroll={onScroll}
            onWheel={onIntent}
            onKeyDown={onIntent}
            className="comparison-messages"
          >
            <MessageScrollerContent
              role="log"
              aria-busy={session.busy}
              className="comparison-message-content"
            >
              {session.turns.length ? (
                <>
                  <div className="comparison-day">
                    <span />
                    Shared context
                    <span />
                  </div>
                  {session.turns.map((turn) => (
                    <div key={turn.id} className="comparison-exchange">
                      <MessageScrollerItem messageId={`question-${turn.id}`} scrollAnchor>
                        <Message align="end">
                          <MessageContent>
                            <Bubble variant="muted" align="end" className="comparison-question">
                              <BubbleContent>
                                <span className="comparison-question-copy">
                                  <span className="comparison-question-label">Shared question</span>
                                  {turn.prompt}
                                </span>
                                <time>{turn.time}</time>
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                      <MessageScrollerItem messageId={`answer-${turn.id}`}>
                        <ComparisonReply turn={turn} session={session} onQuote={onQuote} />
                      </MessageScrollerItem>
                    </div>
                  ))}
                </>
              ) : (
                <Empty className="comparison-empty">
                  <EmptyHeader>
                    <EmptyTitle>Make room for another perspective</EmptyTitle>
                    <EmptyDescription>
                      Write a shared question below to play two sample answers.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <footer className="comparison-pane-footer">
        <ComparisonCopy
          text={transcript}
          label={`Copy ${model.label} transcript`}
          compact={false}
        />
        <span>
          {session.turns.filter((turn) => turn.status === "complete").length}{" "}
          {session.turns.filter((turn) => turn.status === "complete").length === 1
            ? "answer"
            : "answers"}
          <span className="comparison-dot">•</span>
          {totalTokens.toLocaleString()} tokens<span className="comparison-dot">•</span>$
          {totalCost.toFixed(3)}
        </span>
      </footer>
    </section>
  );
}
