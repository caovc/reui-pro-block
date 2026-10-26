import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { createFleetState } from "./fleet-data";
import { fleetReducer } from "./fleet-model";
import { FleetContext } from "./fleet-context";
import type { FleetAction } from "./fleet-types";

export function FleetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createFleetState);
  const latest = useRef(state);
  const act = useCallback((action: FleetAction) => {
    const previous = latest.current;
    const next = fleetReducer(previous, action);
    latest.current = next;
    if (next !== previous) setState(next);
    return next.feedback === previous.feedback || next.feedback?.kind !== "error";
  }, []);

  useEffect(() => {
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      act({ type: "tick", elapsed: (now - previous) / 1000 });
      previous = now;
    }, 1000);
    return () => clearInterval(timer);
  }, [act]);

  useEffect(() => {
    const feedback = state.feedback;
    if (!feedback) return;
    if (feedback.kind === "error") {
      toast.error(feedback.message);
      return;
    }
    const undo = state.undo.at(-1);
    toast.success(feedback.message, {
      action:
        undo?.id === feedback.id
          ? {
              label: "Undo",
              onClick: () => {
                act({ type: "undo", id: undo.id });
              },
            }
          : undefined,
    });
  }, [state.feedback, state.undo, act]);

  return <FleetContext.Provider value={{ state, act }}>{children}</FleetContext.Provider>;
}
