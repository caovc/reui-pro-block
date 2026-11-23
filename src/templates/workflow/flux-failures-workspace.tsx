import { useRef, useState } from "react";
import { toast } from "sonner";
import { FluxFailures } from "./flux-failures";
import { FluxFailureDetail } from "./flux-failure-detail";
import { FluxFailureForm } from "./flux-failure-form";
import {
  cancelInactiveFluxFailureRetry,
  dismissFluxFailure,
  type FluxFailure,
} from "./flux-runs-model";
import type { FluxFailureModel } from "./flux-runs-state";

export function FluxFailuresWorkspace({ model }: { model: FluxFailureModel }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [undoNotice, setUndoNotice] = useState<{
    revision: FluxFailure;
    message: string;
    onUndo: () => void;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const selected = model.rows.find((row) => row.id === selectedId);
  const saveChange = (before: FluxFailure, next: FluxFailure, message: string) => {
    const revision = cancelInactiveFluxFailureRetry(next);
    const undo = model.update(before, revision);
    setUndoNotice({
      revision,
      message,
      onUndo: () => {
        undo();
        setUndoNotice(null);
      },
    });
  };
  const update = (next: FluxFailure) => {
    if (!selected) return;
    const ownerRole = model.rows.find((row) => row.owner === next.owner)?.ownerRole ?? "Run owner";
    const after = { ...next, ownerRole };
    saveChange(selected, after, "Run details saved");
  };
  return (
    <>
      <FluxFailures
        rows={model.rows}
        onOpen={(row, trigger) => {
          returnFocusRef.current = trigger;
          setUndoNotice(null);
          setSelectedId(row.id);
        }}
        onCreate={() => setCreating(true)}
        searchRef={searchRef}
        filters={model.filters}
        onFiltersChange={(filters) => model.dispatch({ type: "filter", filters })}
        pagination={model.pagination}
        onPaginationChange={(value) => model.dispatch({ type: "page", value })}
        sorting={model.sorting}
        onSortingChange={(value) => model.dispatch({ type: "sort", value })}
      />
      {selected ? (
        <FluxFailureDetail
          key={selected.id}
          row={selected}
          initialTab="Error"
          onClose={() => {
            if (!returnFocusRef.current?.isConnected) returnFocusRef.current = searchRef.current;
            setSelectedId(null);
            setUndoNotice(null);
          }}
          notice={undoNotice?.revision === selected ? undoNotice : undefined}
          onUpdate={update}
          returnFocusRef={returnFocusRef}
          onAction={(action) => {
            if (action === "retry") {
              setUndoNotice(null);
              model.retry(selected);
              toast.info("Local retry queued", {
                description: "A simulated attempt will record the current fixture error.",
              });
            } else if (action === "dismiss") {
              saveChange(selected, dismissFluxFailure(selected), "Run dismissed");
            } else {
              setUndoNotice(null);
              const undo = model.remove(selected);
              returnFocusRef.current = searchRef.current;
              setSelectedId(null);
              toast.success("Failure removed", { action: { label: "Undo", onClick: undo } });
            }
          }}
        />
      ) : null}
      {creating ? (
        <FluxFailureForm
          rows={model.rows}
          onClose={() => setCreating(false)}
          onCreate={(draft) => {
            model.create(draft);
            setCreating(false);
            toast.success("Failure logged");
          }}
        />
      ) : null}
    </>
  );
}
