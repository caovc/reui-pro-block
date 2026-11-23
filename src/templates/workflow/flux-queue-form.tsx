import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingsDrawer } from "./flowly-settings-components";
import { FluxQueueFields, type FluxQueueDraftChange } from "./flux-queue-fields";
import {
  newFluxQueueDraft,
  validateFluxQueueDraft,
  type FluxQueueDraft,
  type FluxQueueDraftErrors,
} from "./flux-queue-model";

export function FluxQueueForm({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (draft: FluxQueueDraft) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(newFluxQueueDraft);
  const [errors, setErrors] = useState<FluxQueueDraftErrors>({});
  const change: FluxQueueDraftChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  return (
    <SettingsDrawer
      title="Queue a run"
      description="Add work to the local queue. The run starts only when you choose to start it."
      className="flux-queue-sheet"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={id}>
            Add to queue
          </Button>
        </>
      }
    >
      <form
        id={id}
        onSubmit={(event) => {
          event.preventDefault();
          const invalid = validateFluxQueueDraft(draft);
          setErrors(invalid);
          const first = Object.keys(invalid)[0];
          if (first) document.getElementById(`${id}-${first}`)?.focus();
          else onCreate(draft);
        }}
      >
        <FluxQueueFields id={id} value={draft} errors={errors} onChange={change} />
      </form>
    </SettingsDrawer>
  );
}
