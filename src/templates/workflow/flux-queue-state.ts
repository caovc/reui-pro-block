import { useCallback, useEffect, useReducer } from "react";
import {
  changeFluxQueueRun,
  createFluxQueueWorkspace,
  fluxQueueReducer,
  type FluxQueueOperation,
  type FluxQueueRun,
} from "./flux-queue-model";

export function useFluxQueueWorkspace() {
  const [state, dispatch] = useReducer(fluxQueueReducer, undefined, createFluxQueueWorkspace);
  const hasPending = state.rows.some((row) => row.status === "Running" && row.pendingSince);
  useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(
      () => dispatch({ type: "settle", at: new Date().toISOString() }),
      500,
    );
    return () => window.clearInterval(timer);
  }, [hasPending]);
  const update = useCallback((before: FluxQueueRun, after: FluxQueueRun) => {
    dispatch({ type: "replace", before, after });
    return () => dispatch({ type: "replace", before: after, after: before });
  }, []);
  const act = useCallback(
    (before: FluxQueueRun, operation: FluxQueueOperation) => {
      const after = changeFluxQueueRun(before, operation, new Date().toISOString());
      if (before === after) return null;
      return { revision: after, undo: update(before, after) };
    },
    [update],
  );
  return {
    ...state,
    dispatch,
    update,
    act,
  };
}
export type FluxQueueModel = ReturnType<typeof useFluxQueueWorkspace>;
