"use client";

// Adapted from the official MIT ReUI free c-message-7 composition.
// https://reui.io/components/message/c-message-7
// https://reui.io/r/radix-nova/c-message-7.json
// Preserve src/components/reui/REUI-LICENSE.txt when redistributing.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import { Spinner } from "@/components/ui/spinner";

const PENDING_MS = 900;
const STEP_MS = 24;
const STEP_CHARS = 4;

export function StreamingMessage({
  question,
  answer,
  pendingLabel = "Reading the current page…",
  settled = false,
  footer,
  onReplay,
  onDone,
}: {
  question: string;
  answer: string;
  pendingLabel?: string;
  settled?: boolean;
  footer?: ReactNode;
  onReplay?: () => void;
  onDone?: () => void;
}) {
  const [revealed, setRevealed] = useState(settled ? answer.length : 0);
  const doneCallback = useRef(onDone);
  useEffect(() => {
    doneCallback.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (revealed >= answer.length) return;
    // ReUI's reduced-motion path reveals the answer instead of accelerating it.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(answer.length);
      return;
    }
    const id = window.setTimeout(
      () => setRevealed((count) => Math.min(count + STEP_CHARS, answer.length)),
      revealed === 0 ? PENDING_MS : STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [revealed, answer.length]);

  const done = revealed >= answer.length;
  useEffect(() => {
    if (done) doneCallback.current?.();
  }, [done]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Message align="end">
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>{question}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageContent>
          {/* A permanent region announces meaningful states, not every chunk. */}
          <span role="status" className="sr-only">
            {done ? "Reply ready" : revealed === 0 ? "Generating reply" : ""}
          </span>
          <Bubble variant="ghost" aria-busy={!done}>
            <BubbleContent>
              {revealed === 0 && !done ? (
                <Marker>
                  <MarkerIcon>
                    <Spinner />
                  </MarkerIcon>
                  <MarkerContent>
                    <span className="animate-pulse motion-reduce:animate-none">{pendingLabel}</span>
                  </MarkerContent>
                </Marker>
              ) : (
                <p className="whitespace-pre-wrap">
                  {answer.slice(0, revealed)}
                  {done ? null : (
                    <span
                      aria-hidden="true"
                      className="ms-0.5 inline-block h-[1em] w-0.5 translate-y-0.5 bg-foreground"
                    />
                  )}
                </p>
              )}
            </BubbleContent>
          </Bubble>
          {/* Keep actions mounted so replay and completion preserve focus. */}
          <MessageFooter className="gap-2">
            {footer}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                onReplay?.();
                setRevealed(0);
              }}
            >
              Answer again
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}
