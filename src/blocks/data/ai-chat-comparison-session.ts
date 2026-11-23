/** Independent local playback using the actual free ReUI c-message-7 pattern.
 * https://reui.io/r/radix-nova/c-message-7.json
 * Copyright (c) 2025 Keenthemes Inc. MIT; preserve REUI-LICENSE.txt.
 * Each pane owns its cleaned timer, immutable captured model and revision.
 */
import { useEffect, useRef, useState } from "react";
import { useMotionPolicy } from "@/components/ui/motion-policy";
import {
  comparisonAnswerText,
  comparisonModel,
  createComparisonTurn,
  seedComparisonTurns,
  sortComparisonRows,
  type ComparisonModelId,
  type ComparisonTurn,
} from "./ai-chat-comparison-model";

type Playback = { key: number; turnId: number; modelId: ComparisonModelId };
type PaneState = {
  modelId: ComparisonModelId;
  turns: ComparisonTurn[];
  job: Playback | null;
  limitCleared: boolean;
};
export function useComparisonPane(initialModel: ComparisonModelId) {
  const serial = useRef(1);
  const reducedMotion = useMotionPolicy();
  const [pane, setPane] = useState<PaneState>(() => ({
    modelId: initialModel,
    turns: seedComparisonTurns(initialModel),
    job: { key: 1, turnId: 2, modelId: initialModel },
    limitCleared: false,
  }));
  const job = pane.job;
  useEffect(() => {
    if (!job) return;
    const model = comparisonModel(job.modelId);
    let interval: ReturnType<typeof setInterval> | undefined;
    const advance = () => {
      setPane((current) => {
        if (current.job?.key !== job.key) return current;
        let completed = false;
        const turns = current.turns.map((turn) => {
          if (turn.id !== job.turnId) return turn;
          const length = comparisonAnswerText(turn.answer).length;
          const revealed = reducedMotion ? length : Math.min(length, turn.revealed + model.chunk);
          completed = revealed === length;
          return {
            ...turn,
            revealed,
            status: completed ? ("complete" as const) : ("streaming" as const),
          };
        });
        return { ...current, turns, job: completed ? null : current.job };
      });
    };
    const delay = setTimeout(
      () => {
        advance();
        if (!reducedMotion) interval = setInterval(advance, 32);
      },
      reducedMotion ? 0 : model.id === "gpt" ? 340 : 160,
    );
    return () => {
      clearTimeout(delay);
      if (interval) clearInterval(interval);
    };
  }, [job, reducedMotion]);

  function begin(
    current: PaneState,
    turn: ComparisonTurn,
    key: number,
    modelId = current.modelId,
  ): PaneState {
    const limited = modelId === "gemini" && !current.limitCleared;
    return {
      ...current,
      modelId,
      turns: [
        ...current.turns.filter((item) => item.id !== turn.id),
        { ...turn, status: limited ? "limited" : "pending" },
      ],
      job: limited ? null : { key, turnId: turn.id, modelId },
    };
  }
  function send(id: number, prompt: string, contextFiles: string[]) {
    const key = ++serial.current;
    setPane((current) =>
      begin(current, createComparisonTurn(id, prompt, current.modelId, 0, contextFiles), key),
    );
  }
  function chooseModel(modelId: ComparisonModelId) {
    const key = ++serial.current;
    setPane((current) => {
      const latest = current.turns.at(-1);
      if (!latest) return { ...current, modelId };
      return begin(
        current,
        createComparisonTurn(
          latest.id,
          latest.prompt,
          modelId,
          latest.revision + 1,
          latest.contextFiles,
          latest.time,
        ),
        key,
        modelId,
      );
    });
  }
  function regenerate() {
    const key = ++serial.current;
    setPane((current) => {
      const latest = current.turns.at(-1);
      return latest
        ? begin(
            current,
            createComparisonTurn(
              latest.id,
              latest.prompt,
              current.modelId,
              latest.revision + 1,
              latest.contextFiles,
              latest.time,
            ),
            key,
          )
        : current;
    });
  }
  function retry() {
    const key = ++serial.current;
    setPane((current) => {
      const latest = current.turns.at(-1);
      if (!latest) return current;
      return begin(
        { ...current, limitCleared: true },
        { ...latest, revealed: 0, status: "pending" },
        key,
      );
    });
  }
  function stop() {
    setPane((current) => ({
      ...current,
      job: null,
      turns: current.turns.map((turn) =>
        turn.id === current.job?.turnId ? { ...turn, status: "stopped" } : turn,
      ),
    }));
  }
  function reset() {
    setPane((current) => ({ ...current, turns: [], job: null, limitCleared: false }));
  }
  function prefer(preferred: boolean) {
    setPane((current) => ({
      ...current,
      turns: current.turns.map((turn, index) =>
        index === current.turns.length - 1 ? { ...turn, preferred } : turn,
      ),
    }));
  }
  function rate(id: number, rating: "up" | "down") {
    setPane((current) => ({
      ...current,
      turns: current.turns.map((turn) =>
        turn.id === id ? { ...turn, rating: turn.rating === rating ? null : rating } : turn,
      ),
    }));
  }
  function sortTable(id: number, segmentIndex: number, column: number, descending: boolean) {
    setPane((current) => ({
      ...current,
      turns: current.turns.map((turn) =>
        turn.id !== id
          ? turn
          : {
              ...turn,
              answer: {
                ...turn.answer,
                segments: turn.answer.segments.map((segment, index) =>
                  index === segmentIndex && segment.type === "table"
                    ? { ...segment, rows: sortComparisonRows(segment.rows, column, descending) }
                    : segment,
                ),
              },
            },
      ),
    }));
  }
  return {
    ...pane,
    busy: Boolean(pane.job),
    send,
    chooseModel,
    regenerate,
    retry,
    stop,
    reset,
    prefer,
    rate,
    sortTable,
  };
}
export type ComparisonPaneSession = ReturnType<typeof useComparisonPane>;
