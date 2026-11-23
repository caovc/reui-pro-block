import { useEffect, useReducer } from "react";
import {
  createFluxFailureWorkspace,
  cancelInactiveFluxFailureRetry,
  dismissFluxFailure,
  fluxFailureReducer,
  type FluxFailure,
  type FluxFailureDraft,
} from "./flux-runs-model";

export function useFluxFailureWorkspace() {
  const [state, dispatch] = useReducer(fluxFailureReducer, undefined, createFluxFailureWorkspace);
  const hasPendingRetry = state.rows.some(
    (row) => row.status === "Retrying" && row.attempts.at(-1)?.outcome === "Queued",
  );
  useEffect(() => {
    if (!hasPendingRetry) return;
    const timer = window.setInterval(() => {
      dispatch({ type: "settle-retries", at: new Date().toISOString() });
    }, 1200);
    return () => window.clearInterval(timer);
  }, [hasPendingRetry]);
  const replace = (before: FluxFailure, after: FluxFailure) => {
    const prepared = cancelInactiveFluxFailureRetry(after);
    dispatch({ type: "replace", before, after: prepared });
    // Compare by revision: undo never overwrites a later edit or retry completion.
    return () => dispatch({ type: "replace", before: prepared, after: before });
  };
  return {
    ...state,
    dispatch,
    update: replace,
    dismiss: (before: FluxFailure) => replace(before, dismissFluxFailure(before)),
    retry: (row: FluxFailure) => dispatch({ type: "retry", row, at: new Date().toISOString() }),
    remove: (row: FluxFailure) => {
      const index = state.rows.indexOf(row);
      dispatch({ type: "remove", row });
      return () => dispatch({ type: "restore", row, index });
    },
    create: (draft: FluxFailureDraft) =>
      dispatch({ type: "create", draft, at: new Date().toISOString() }),
  };
}

export type FluxFailureModel = ReturnType<typeof useFluxFailureWorkspace>;
