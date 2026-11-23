import { useId, useState } from "react";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import { SettingsDrawer } from "./flowly-settings-components";
import { DescribedChoice } from "./flowly-settings-fields";
import {
  fluxFailureErrorCodes,
  fluxFailureAgents,
  fluxFailureOwners,
  newFluxFailureDraft,
  validateFluxFailureDraft,
  type FluxFailure,
  type FluxFailureDraft,
  type FluxFailureDraftErrors,
} from "./flux-runs-model";

/** The existing actual c-sheet-1, c-select-27, Field and NumberField compose this local form. */
export function FluxFailureForm({
  rows,
  onClose,
  onCreate,
}: {
  rows: FluxFailure[];
  onClose: () => void;
  onCreate: (draft: FluxFailureDraft) => void;
}) {
  const formId = useId();
  const [draft, setDraft] = useState(() => newFluxFailureDraft(rows));
  const [errors, setErrors] = useState<FluxFailureDraftErrors>({});
  const set = <K extends keyof FluxFailureDraft>(field: K, value: FluxFailureDraft[K]) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const text = (
    field: "task" | "errorMessage" | "failedStep",
    label: string,
    placeholder: string,
  ) => (
    <Field data-invalid={Boolean(errors[field])}>
      <FieldLabel htmlFor={`${formId}-${field}`}>{label}</FieldLabel>
      <Input
        id={`${formId}-${field}`}
        value={draft[field]}
        onChange={(event) => set(field, event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(errors[field])}
        aria-describedby={errors[field] ? `${formId}-${field}-error` : undefined}
      />
      {errors[field] && <FieldError id={`${formId}-${field}-error`}>{errors[field]}</FieldError>}
    </Field>
  );
  const choice = (
    field: "agent" | "owner" | "status" | "errorCode",
    label: string,
    values: readonly string[],
  ) => (
    <Field>
      <FieldLabel htmlFor={`${formId}-${field}`}>{label}</FieldLabel>
      <DescribedChoice
        id={`${formId}-${field}`}
        value={draft[field]}
        onChange={(value) => set(field, value as FluxFailureDraft[typeof field])}
        options={values.map((value) => ({ label: value, description: "" }))}
      />
    </Field>
  );
  return (
    <SettingsDrawer
      title="Log a failure"
      description="Record a run and its error for review in the local failure ledger."
      className="flux-failure-sheet flux-failure-form"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            Log failure
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          const next = validateFluxFailureDraft(draft);
          setErrors(next);
          if (!Object.keys(next).length) onCreate(draft);
          else {
            const first = Object.keys(next)[0];
            document.getElementById(`${formId}-${first}`)?.focus();
          }
        }}
      >
        <FieldGroup>
          {text("task", "Task", "Review the renewal refund for a local account")}
          {choice("agent", "Agent", fluxFailureAgents)}
          {choice("owner", "Owner", fluxFailureOwners)}
          {choice("status", "Status", ["Failed", "Retrying", "Dismissed"])}
          {choice(
            "errorCode",
            "Error code",
            fluxFailureErrorCodes.map((entry) => entry.code),
          )}
          {text("errorMessage", "Error message", "Describe the error from this local run.")}
          {text("failedStep", "Failed step", "payments.refund")}
          <div className="flux-failure-step-fields">
            {(
              [
                ["step", "Failed at step"],
                ["totalSteps", "Of steps"],
              ] as const
            ).map(([field, label]) => (
              <Field key={field} data-invalid={Boolean(errors[field])}>
                <FieldLabel htmlFor={`${formId}-${field}`}>{label}</FieldLabel>
                <NumberField
                  id={`${formId}-${field}`}
                  value={draft[field]}
                  min={1}
                  step={1}
                  onValueChange={(value) => set(field, value)}
                >
                  <NumberFieldGroup>
                    <NumberFieldInput
                      className="text-left"
                      aria-invalid={Boolean(errors[field])}
                      aria-describedby={errors[field] ? `${formId}-${field}-error` : undefined}
                    />
                  </NumberFieldGroup>
                </NumberField>
                {errors[field] && (
                  <FieldError id={`${formId}-${field}-error`}>{errors[field]}</FieldError>
                )}
              </Field>
            ))}
          </div>
        </FieldGroup>
      </form>
    </SettingsDrawer>
  );
}
