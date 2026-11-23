import { downloadComparisonText } from "./ai-chat-comparison-export";
/** Independent Bricklane comparison workspace. Original fixtures; actual free ReUI
 * Resizable/Message/Scroller/InputGroup/Select/Table/CodeBlock/Tooltip parts.
 * No remote model service, paid registry source or official media is used.
 */
import { useRef, useState } from "react";
import { Check, FlaskConical, Link, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { ComparisonTip } from "./ai-chat-comparison-actions";
import ComparisonComposer, { type ComparisonFile } from "./ai-chat-comparison-composer";
import {
  COMPARISON_CONTEXT,
  comparisonTurnMetrics,
  comparisonModel,
  comparisonTranscript,
  type ComparisonModelId,
} from "./ai-chat-comparison-model";
import ComparisonPane from "./ai-chat-comparison-pane";
import { useComparisonPane } from "./ai-chat-comparison-session";
import "./ai-chat-comparison.css";

export default function ModelComparison() {
  const left = useComparisonPane("sonnet");
  const right = useComparisonPane("gpt");
  const panes = [left, right] as const;
  const mobile = useIsMobile();
  const [active, setActive] = useState("left");
  const [locked, setLocked] = useState(true);
  const [draft, setDraft] = useState("");
  const [quote, setQuote] = useState("");
  const [files, setFiles] = useState<ComparisonFile[]>([COMPARISON_CONTEXT]);
  const [winner, setWinner] = useState<number | null>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const viewports = useRef<(HTMLDivElement | null)[]>([null, null]);
  const scrollIntent = useRef<number | null>(null);
  const nextTurn = useRef(2);
  const busy = left.busy || right.busy;
  const modelNames = panes.map((pane) => comparisonModel(pane.modelId).label);
  const latest = panes.map((pane) => pane.turns.at(-1));
  const ready =
    !busy && latest.every((turn) => turn && turn.revealed > 0 && turn.status !== "limited");
  const metrics = latest.map(comparisonTurnMetrics);
  function synchronize(source: number) {
    if (!locked || mobile || scrollIntent.current !== source) return;
    const from = viewports.current[source];
    const to = viewports.current[1 - source];
    if (!from || !to) return;
    const fromRange = from.scrollHeight - from.clientHeight;
    const toRange = to.scrollHeight - to.clientHeight;
    const target = fromRange > 0 ? (from.scrollTop / fromRange) * Math.max(0, toRange) : 0;
    if (Math.abs(to.scrollTop - target) > 1) to.scrollTop = target;
  }
  function clearVote() {
    setWinner(null);
    left.prefer(false);
    right.prefer(false);
  }
  function send() {
    if (busy || !draft.trim()) return;
    const prompt = quote ? `> ${quote.replaceAll("\n", "\n> ")}\n\n${draft.trim()}` : draft.trim();
    const id = ++nextTurn.current;
    const names = files.map((file) => file.name);
    left.send(id, prompt, names);
    right.send(id, prompt, names);
    setWinner(null);
    setDraft("");
    setQuote("");
    scrollIntent.current = null;
    composer.current?.focus();
  }
  function quoteAnswer(text: string) {
    setQuote(text);
    setDraft((current) => (current.trim() ? current : "Explain this part of the answer."));
    composer.current?.focus();
  }
  function regenerate(side: number) {
    clearVote();
    panes[side].regenerate();
    scrollIntent.current = null;
  }
  function chooseModel(side: number, model: ComparisonModelId) {
    clearVote();
    panes[side].chooseModel(model);
    scrollIntent.current = null;
  }
  function exportAll() {
    downloadComparisonText(
      "model-comparison.md",
      panes
        .map((pane, index) => comparisonTranscript(pane.turns, modelNames[index]))
        .join("\n\n---\n\n"),
    );
  }
  function newComparison() {
    left.reset();
    right.reset();
    setWinner(null);
    setDraft("");
    setQuote("");
    setFiles([COMPARISON_CONTEXT]);
    scrollIntent.current = null;
    composer.current?.focus();
  }
  function pane(side: number) {
    return (
      <ComparisonPane
        session={panes[side]}
        lane={side === 0 ? "A" : "B"}
        onModelChange={(model) => chooseModel(side, model)}
        onRegenerate={() => regenerate(side)}
        onQuote={quoteAnswer}
        onExportAll={exportAll}
        viewportRef={(node) => {
          viewports.current[side] = node;
        }}
        onScroll={() => synchronize(side)}
        onIntent={() => {
          scrollIntent.current = side;
        }}
      />
    );
  }
  const fastest = metrics[0].latency <= metrics[1].latency ? 0 : 1;
  const equalTiming = Math.abs(metrics[0].latency - metrics[1].latency) < 0.05;
  const equalCost = Math.abs(metrics[0].cost - metrics[1].cost) < 0.0005;
  return (
    <div
      className="comparison-shell"
      data-ai-chat="comparison"
      aria-describedby="comparison-demo-description"
    >
      <p id="comparison-demo-description" className="sr-only">
        A local demo comparing original canned model answers. Timing, tokens and cost are recorded
        fixture values. No prompt or file is uploaded.
      </p>
      <header className="comparison-header">
        <div className="comparison-title">
          <div className="comparison-eyebrow-row">
            <span className="comparison-eyebrow">Bricklane lab</span>
            <Badge variant="outline" className="comparison-local-badge">
              <FlaskConical data-icon="inline-start" />
              Local playback
            </Badge>
          </div>
          <h1>Model Comparison</h1>
          <p>One question. Two perspectives.</p>
        </div>
        <div className="comparison-header-actions">
          {!mobile && (
            <ComparisonTip
              label={locked ? "Unlock transcript scrolling" : "Lock transcript scrolling"}
            >
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="size-7"
                aria-label="Lock both transcripts to one scroll position"
                aria-pressed={locked}
                onClick={() => {
                  setLocked((current) => !current);
                  scrollIntent.current = null;
                }}
              >
                <Link />
              </Button>
            </ComparisonTip>
          )}
          <ComparisonTip label="New comparison">
            <Button
              type="button"
              size="sm"
              className="comparison-new text-sm"
              aria-label="New comparison"
              onClick={newComparison}
            >
              <Plus />
              <span>Start fresh</span>
            </Button>
          </ComparisonTip>
        </div>
      </header>
      <div className="comparison-workspace">
        {mobile ? (
          <Tabs value={active} onValueChange={setActive} className="comparison-mobile">
            <div className="comparison-tabs-row">
              <TabsList className="comparison-tabs" aria-label="Compared models">
                {panes.map((session, index) => (
                  <TabsTrigger key={index} value={index === 0 ? "left" : "right"}>
                    {modelNames[index]}
                    {session.busy && <Spinner />}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="left" className="comparison-mobile-panel">
              {pane(0)}
            </TabsContent>
            <TabsContent value="right" className="comparison-mobile-panel">
              {pane(1)}
            </TabsContent>
          </Tabs>
        ) : (
          <ResizablePanelGroup orientation="horizontal" className="comparison-desktop-panels">
            <ResizablePanel id="comparison-left" defaultSize="50%" minSize="25%">
              {pane(0)}
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="comparison-divider"
              aria-label="Resize model comparison panes"
            />
            <ResizablePanel id="comparison-right" defaultSize="50%" minSize="25%">
              {pane(1)}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
      <section className="comparison-score" aria-label="Recorded comparison metrics">
        <div className="comparison-evaluation-heading">
          <span>Your evaluation</span>
          <span>
            {left.turns.length} {left.turns.length === 1 ? "shared question" : "shared questions"}
          </span>
        </div>
        <div className="comparison-score-inner">
          {!ready ? (
            <>
              {mobile && (
                <div className="comparison-score-models">
                  <span>{modelNames[0]}</span>
                  <span>{modelNames[1]}</span>
                </div>
              )}
              {(["latency", "rate", "cost"] as const).map((metric) => {
                const values = metrics.map((entry) => entry[metric]);
                const max = Math.max(...values, 0.001);
                const label =
                  metric === "latency" ? "latency" : metric === "rate" ? "tok/s" : "cost";
                const format = (value: number) =>
                  metric === "latency"
                    ? `${value.toFixed(1)}s`
                    : metric === "cost"
                      ? `$${value.toFixed(3)}`
                      : String(value);
                return (
                  <div key={metric} className="comparison-score-row">
                    <div className="comparison-score-side">
                      <span>{format(values[0])}</span>
                      <div className="comparison-score-track">
                        <i style={{ width: `${(values[0] / max) * 100}%` }} />
                      </div>
                    </div>
                    <span>{label}</span>
                    <div className="comparison-score-side comparison-score-right">
                      <div className="comparison-score-track">
                        <i style={{ width: `${(values[1] / max) * 100}%` }} />
                      </div>
                      <span>{format(values[1])}</span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="comparison-verdict">
              <p>
                {equalTiming
                  ? "Equal recorded latency"
                  : `${modelNames[fastest]}: ${Math.abs(metrics[0].latency - metrics[1].latency).toFixed(1)}s faster`}
                {equalCost
                  ? ", equal cost"
                  : `, $${Math.abs(metrics[0].cost - metrics[1].cost).toFixed(3)} ${metrics[fastest].cost > metrics[1 - fastest].cost ? "more" : "less"}`}
              </p>
              <div>
                <span>Better answer</span>
                {panes.map((session, index) => (
                  <Button
                    key={index}
                    type="button"
                    size="sm"
                    variant={winner === index ? "secondary" : "outline"}
                    aria-label={`Prefer ${index === 0 ? "A" : "B"}, ${modelNames[index]}`}
                    aria-pressed={winner === index}
                    onClick={() => {
                      setWinner(index);
                      session.prefer(true);
                      panes[1 - index].prefer(false);
                    }}
                  >
                    {winner === index && <Check />}
                    {modelNames[index]}
                  </Button>
                ))}
              </div>
              <span role="status" className="sr-only">
                {winner !== null
                  ? `${modelNames[winner]} preferred`
                  : "Both local answers are ready"}
              </span>
            </div>
          )}
        </div>
      </section>
      <ComparisonComposer
        draft={draft}
        onDraft={setDraft}
        quote={quote}
        onClearQuote={() => setQuote("")}
        files={files}
        onFiles={setFiles}
        busy={busy}
        onSend={send}
        onStop={() => {
          left.stop();
          right.stop();
        }}
        textareaRef={composer}
      />
    </div>
  );
}
