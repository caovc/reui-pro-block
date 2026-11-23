import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { FluxQueue } from "./flux-queue";
import { FluxQueueDetail } from "./flux-queue-detail";
import { FluxQueueForm } from "./flux-queue-form";
import type { FluxQueueOperation, FluxQueueRun } from "./flux-queue-model";
import type { FluxQueueModel } from "./flux-queue-state";

const operationMessages: Record<FluxQueueOperation, string> = {
  start: "Local run started",
  hold: "Run held",
  requeue: "Run queued again",
  cancel: "Run cancelled",
  review: "Attention cleared",
  flag: "Run flagged for review",
};

export function FluxQueueWorkspace({ model }: { model: FluxQueueModel }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<{
    revision: FluxQueueRun;
    message: string;
    onUndo: () => void;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const selected = model.rows.find((row) => row.id === selectedId);
  const open = useCallback((row: FluxQueueRun, trigger: HTMLElement) => {
    returnFocusRef.current = trigger;
    setSelectedId(row.id);
    setNotice(null);
  }, []);
  const act = model.act;
  const rowOperation = useCallback(
    (row: FluxQueueRun, operation: FluxQueueOperation) => {
      const result = act(row, operation);
      if (!result) return;
      toast.success(
        operationMessages[operation],
        operation === "start" ? undefined : { action: { label: "Undo", onClick: result.undo } },
      );
    },
    [act],
  );
  const showUndo = (revision: FluxQueueRun, message: string, undo: () => void) =>
    setNotice({
      revision,
      message,
      onUndo: () => {
        undo();
        setNotice(null);
      },
    });
  return (
    <>
      <FluxQueue
        rows={model.rows}
        filters={model.filters}
        onFiltersChange={(filters) => model.dispatch({ type: "filter", filters })}
        grouping={model.grouping}
        onGroupingChange={(grouping) => model.dispatch({ type: "group", grouping })}
        expanded={model.expanded}
        onExpandedChange={(value) => model.dispatch({ type: "expand", value })}
        sorting={model.sorting}
        onSortingChange={(value) => model.dispatch({ type: "sort", value })}
        onOpen={open}
        onOperation={rowOperation}
        onCreate={() => setCreating(true)}
        onStartNext={() => model.dispatch({ type: "start-next", at: new Date().toISOString() })}
        searchRef={searchRef}
      />
      {selected ? (
        <FluxQueueDetail
          key={selected.id}
          row={selected}
          returnFocusRef={returnFocusRef}
          onClose={() => {
            if (!returnFocusRef.current?.isConnected) returnFocusRef.current = searchRef.current;
            setSelectedId(null);
            setNotice(null);
          }}
          notice={notice?.revision === selected ? notice : undefined}
          onUpdate={(after) => showUndo(after, "Run details saved", model.update(selected, after))}
          onOperation={(operation) => {
            const result = model.act(selected, operation);
            if (result) showUndo(result.revision, operationMessages[operation], result.undo);
          }}
        />
      ) : null}
      {creating ? (
        <FluxQueueForm
          onClose={() => setCreating(false)}
          onCreate={(draft) => {
            model.dispatch({ type: "create", draft, at: new Date().toISOString() });
            setCreating(false);
            toast.success("Run added to queue");
          }}
        />
      ) : null}
    </>
  );
}
