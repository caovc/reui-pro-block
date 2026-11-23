import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import { CheckOption } from "./flowly-settings-components";
import { DescribedChoice } from "./flowly-settings-fields";
import {
  fluxQueueAgents,
  fluxQueueOwners,
  fluxQueuePriorities,
  type FluxQueueDraft,
  type FluxQueueDraftErrors,
} from "./flux-queue-model";

export type FluxQueueDraftChange = <K extends keyof FluxQueueDraft>(
  field: K,
  value: FluxQueueDraft[K],
) => void;

/** Existing c-select-27, c-checkbox-5 and actual free NumberField supply native controls. */
export function FluxQueueFields({
  id,
  value,
  errors,
  onChange,
  lockSteps = false,
}: {
  id: string;
  value: FluxQueueDraft;
  errors: FluxQueueDraftErrors;
  onChange: FluxQueueDraftChange;
  lockSteps?: boolean;
}) {
  const choice = (
    field: "agent" | "owner" | "priority",
    label: string,
    options: readonly string[],
  ) => (
    <Field>
      <FieldLabel htmlFor={`${id}-${field}`}>{label}</FieldLabel>
      <DescribedChoice
        id={`${id}-${field}`}
        value={value[field]}
        options={options.map((label) => ({ label, description: "" }))}
        onChange={(next) => onChange(field, next as FluxQueueDraft[typeof field])}
      />
    </Field>
  );
  return (
    <FieldGroup>
      <Field data-invalid={Boolean(errors.task)}>
        <FieldLabel htmlFor={`${id}-task`}>Task</FieldLabel>
        <Input
          id={`${id}-task`}
          value={value.task}
          onChange={(event) => onChange("task", event.target.value)}
          aria-invalid={Boolean(errors.task)}
          aria-describedby={errors.task ? `${id}-task-error` : undefined}
          placeholder="Describe the local work to queue"
        />
        {errors.task ? <FieldError id={`${id}-task-error`}>{errors.task}</FieldError> : null}
      </Field>
      <FieldGroup className="flux-queue-field-pair">
        {choice("agent", "Agent", fluxQueueAgents)}
        {choice("owner", "Owner", fluxQueueOwners)}
      </FieldGroup>
      <FieldGroup className="flux-queue-field-pair">
        {choice("priority", "Priority", fluxQueuePriorities)}
        <Field data-invalid={Boolean(errors.totalSteps)}>
          <FieldLabel htmlFor={`${id}-totalSteps`}>Total steps</FieldLabel>
          <NumberField
            id={`${id}-totalSteps`}
            value={value.totalSteps}
            min={1}
            step={1}
            disabled={lockSteps}
            onValueChange={(next) => onChange("totalSteps", next)}
          >
            <NumberFieldGroup>
              <NumberFieldInput
                className="text-left"
                aria-invalid={Boolean(errors.totalSteps)}
                aria-describedby={errors.totalSteps ? `${id}-totalSteps-error` : undefined}
              />
            </NumberFieldGroup>
          </NumberField>
          {errors.totalSteps ? (
            <FieldError id={`${id}-totalSteps-error`}>{errors.totalSteps}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
      <CheckOption
        id={`${id}-attention`}
        label="Needs attention"
        description="Flagged runs need review before they can start."
        checked={value.attention}
        onChange={(next) => onChange("attention", next)}
      />
      {value.attention ? (
        <Field data-invalid={Boolean(errors.attentionReason)}>
          <FieldLabel htmlFor={`${id}-attentionReason`}>Review reason</FieldLabel>
          <Textarea
            id={`${id}-attentionReason`}
            value={value.attentionReason}
            onChange={(event) => onChange("attentionReason", event.target.value)}
            rows={3}
            aria-invalid={Boolean(errors.attentionReason)}
            aria-describedby={errors.attentionReason ? `${id}-attentionReason-error` : undefined}
          />
          {errors.attentionReason ? (
            <FieldError id={`${id}-attentionReason-error`}>{errors.attentionReason}</FieldError>
          ) : null}
        </Field>
      ) : null}
      <Field>
        <FieldLabel htmlFor={`${id}-notes`}>Notes</FieldLabel>
        <Textarea
          id={`${id}-notes`}
          value={value.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          rows={3}
          placeholder="Optional handover details"
        />
      </Field>
    </FieldGroup>
  );
}
