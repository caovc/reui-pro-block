import { useState, type RefObject } from "react";
import { CircleAlert, CircleX, Copy, RotateCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/reui/alert";
import {
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineSeparator,
  TimelineTitle,
  TimelineContent,
} from "@/components/reui/timeline";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SettingsDrawer } from "./flowly-settings-components";
import { DescribedChoice } from "./flowly-settings-fields";
import { Person } from "./controls";
import { FluxFailureBadge } from "./flux-failure-badge";
import {
  fluxFailureAgents,
  fluxFailureOwners,
  fluxFailureErrorCodes,
  fluxFailureDate,
  parseFluxFailurePayload,
  type FluxFailure,
} from "./flux-runs-model";

export type FluxFailureTab = "Error" | "Attempts" | "Payload" | "Details";
export type FluxFailureMutation = "retry" | "dismiss" | "delete";
type EditableField =
  | "task"
  | "agent"
  | "owner"
  | "status"
  | "errorCode"
  | "errorMessage"
  | "failedStep"
  | "notes";

export function FluxFailureDetail({
  row,
  initialTab,
  onClose,
  onUpdate,
  onAction,
  returnFocusRef,
  notice,
}: {
  row: FluxFailure;
  initialTab: FluxFailureTab;
  onClose: () => void;
  onUpdate: (next: FluxFailure) => void;
  onAction: (action: FluxFailureMutation) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  notice?: { message: string; onUndo: () => void };
}) {
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(row);
  const [changed, setChanged] = useState<Set<EditableField>>(() => new Set());
  const [errors, setErrors] = useState<Partial<Record<EditableField, string>>>({});
  const [payloadText, setPayloadText] = useState("");
  const [payloadDirty, setPayloadDirty] = useState(false);
  const [payloadError, setPayloadError] = useState("");
  const pending = row.status === "Retrying" && row.attempts.at(-1)?.outcome === "Queued";
  const dirty = changed.size > 0 || payloadDirty;
  const value = (field: EditableField) => (changed.has(field) ? draft[field] : row[field]);
  const set = (field: EditableField, next: string) => {
    setDraft((current) => ({ ...current, [field]: next }));
    setChanged((current) => new Set(current).add(field));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const choice = (
    field: "agent" | "owner" | "status" | "errorCode",
    label: string,
    values: readonly string[],
  ) => (
    <Field>
      <FieldLabel htmlFor={`${row.id}-${field}`}>{label}</FieldLabel>
      <DescribedChoice
        id={`${row.id}-${field}`}
        value={value(field)}
        options={values.map((option) => ({ label: option, description: "" }))}
        onChange={(next) => set(field, next)}
      />
    </Field>
  );
  const text = (field: "task" | "failedStep", label: string) => (
    <Field data-invalid={Boolean(errors[field])}>
      <FieldLabel htmlFor={`${row.id}-${field}`}>{label}</FieldLabel>
      <Input
        id={`${row.id}-${field}`}
        value={value(field)}
        onChange={(event) => set(field, event.target.value)}
        aria-invalid={Boolean(errors[field])}
        aria-describedby={errors[field] ? `${row.id}-${field}-error` : undefined}
      />
      {errors[field] ? (
        <FieldError id={`${row.id}-${field}-error`}>{errors[field]}</FieldError>
      ) : null}
    </Field>
  );
  const saveDetails = () => {
    const invalid: Partial<Record<EditableField, string>> = {};
    for (const field of ["task", "errorMessage", "failedStep"] as const) {
      if (!value(field).trim()) invalid[field] = "Enter a value.";
    }
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      document.getElementById(`${row.id}-${Object.keys(invalid)[0]}`)?.focus();
      return;
    }
    const next = { ...row };
    for (const field of changed) Object.assign(next, { [field]: value(field).trim() });
    if (changed.has("errorCode")) {
      next.errorType = fluxFailureErrorCodes.find((entry) => entry.code === next.errorCode)!.type;
      next.providerBackoff = ["Gateway", "Rate Limit", "Query"].includes(next.errorType);
    }
    onUpdate(next);
    setChanged(new Set());
  };
  const payload = payloadDirty
    ? payloadText
    : row.payload
      ? JSON.stringify(row.payload, null, 2)
      : "";
  return (
    <SettingsDrawer
      title="Run review"
      description="Review the failure, prepare the next attempt, and update its triage details."
      className="flux-failure-sheet flux-failure-detail"
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      footer={
        <>
          <Button
            variant="ghost"
            aria-label={`Delete ${row.id}`}
            onClick={() => onAction("delete")}
          >
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => onAction("dismiss")}
            disabled={row.status === "Dismissed" || dirty}
          >
            <CircleX data-icon="inline-start" aria-hidden="true" />
            Dismiss
          </Button>
          <Button onClick={() => onAction("retry")} disabled={pending || dirty}>
            <RotateCw data-icon="inline-start" aria-hidden="true" />
            {pending
              ? "Retry queued"
              : row.status === "Retrying"
                ? "Run queued retry"
                : "Retry run"}
          </Button>
        </>
      }
    >
      <div className="flux-failure-identity">
        <div>
          <code>{row.id}</code>
          <FluxFailureBadge status={row.status} />
        </div>
        <h2>{row.task}</h2>
        <p>
          {row.agent} <span aria-hidden="true">·</span>{" "}
          <time dateTime={row.lastAttempt}>{fluxFailureDate(row.lastAttempt)}</time>
        </p>
      </div>
      {notice ? (
        <Alert variant="success">
          <AlertTitle>{notice.message}</AlertTitle>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={notice.onUndo} disabled={dirty}>
              Undo
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {dirty ? (
        <p className="flux-failure-draft-hint" role="status">
          Save or discard your changes before retrying or dismissing.
        </p>
      ) : null}
      {pending ? (
        <Alert variant="info">
          <RotateCw aria-hidden="true" />
          <AlertTitle>Retry simulation queued</AlertTitle>
          <AlertDescription>
            The next local attempt will record the current fixture error.
          </AlertDescription>
        </Alert>
      ) : null}
      <Tabs
        value={tab}
        onValueChange={(next) => setTab(next as FluxFailureTab)}
        className="flux-failure-tabs"
      >
        <TabsList aria-label="Run review sections">
          {(["Error", "Attempts", "Payload", "Details"] as const).map((label) => (
            <TabsTrigger key={label} value={label}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="Error">
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>
              <code>{row.errorCode}</code>
            </AlertTitle>
            <AlertDescription>{row.errorMessage}</AlertDescription>
          </Alert>
          <dl className="flux-failure-facts">
            <dt>Failure point</dt>
            <dd>
              <code>{row.failedStep}</code>
              <small>
                Step {row.step} of {row.totalSteps}
              </small>
            </dd>
            <dt>Owner</dt>
            <dd>
              <Person name={row.owner} />
              <small>{row.ownerRole}</small>
            </dd>
            <dt>Attempts</dt>
            <dd>{row.attempts.length} recorded</dd>
            <dt>Retry policy</dt>
            <dd>{row.providerBackoff ? "Provider backoff enabled" : "Manual review required"}</dd>
          </dl>
          <div className="flux-failure-next-step">
            <h3>Next step</h3>
            <p>
              {row.errorType === "Schema"
                ? "Review the payload for missing or invalid fields before another attempt."
                : row.errorType === "Payment"
                  ? "Review the existing refund request and payment state before retrying."
                  : "Inspect the attempt history and provider response before another attempt."}
            </p>
            <Button variant="outline" size="sm" onClick={() => setTab("Payload")}>
              Review payload
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="Attempts">
          <div className="flux-failure-section-heading">
            <h3>Attempt history</h3>
            <span>{row.attempts.length} attempts</span>
          </div>
          <Timeline value={row.attempts.length}>
            {row.attempts.map((attempt, index) => (
              <TimelineItem step={index + 1} key={attempt.id}>
                <TimelineSeparator />
                <TimelineIndicator />
                <TimelineTitle>
                  {attempt.kind ?? (index === 0 ? "Initial run" : "Automatic retry")}
                  <time dateTime={attempt.at}>{fluxFailureDate(attempt.at)}</time>
                </TimelineTitle>
                <TimelineContent>
                  <strong>{attempt.outcome ?? "Failed"}</strong>
                  <p>
                    {attempt.result}
                    {attempt.durationMs > 0 ? ` · ${(attempt.durationMs / 1000).toFixed(1)}s` : ""}
                  </p>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
          <p className="flux-failure-help">
            Manual retries run a local simulation and record the same fixture error. You can dismiss
            a run to stop a queued simulation.
          </p>
        </TabsContent>
        <TabsContent value="Payload">
          <div className="flux-failure-section-heading">
            <h3>Input payload</h3>
            <Button
              variant="ghost"
              size="sm"
              disabled={!payload.trim() || Boolean(payloadError)}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(payload);
                  toast.success("Payload copied");
                } catch {
                  toast.error("Could not copy the payload");
                }
              }}
            >
              <Copy data-icon="inline-start" aria-hidden="true" />
              Copy
            </Button>
          </div>
          <FieldGroup>
            <Field data-invalid={Boolean(payloadError)}>
              <FieldLabel htmlFor={`${row.id}-payload`}>JSON object</FieldLabel>
              <Textarea
                id={`${row.id}-payload`}
                className="flux-failure-json"
                value={payload}
                rows={12}
                spellCheck={false}
                placeholder={'{\n  "account": "local-demo"\n}'}
                onChange={(event) => {
                  setPayloadText(event.target.value);
                  setPayloadDirty(true);
                  setPayloadError("");
                }}
                aria-invalid={Boolean(payloadError)}
                aria-describedby={`${row.id}-payload-help${payloadError ? ` ${row.id}-payload-error` : ""}`}
              />
              <FieldDescription id={`${row.id}-payload-help`}>
                {row.payload
                  ? "The saved payload is available for replay review."
                  : "No payload was recorded. Add an object to prepare this run for review."}{" "}
                Leave empty to remove it.
              </FieldDescription>
              {payloadError ? (
                <FieldError id={`${row.id}-payload-error`}>{payloadError}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
          <div className="flux-failure-edit-actions">
            <Button
              variant="outline"
              size="sm"
              disabled={!payloadDirty}
              onClick={() => {
                setPayloadDirty(false);
                setPayloadError("");
              }}
            >
              Discard changes
            </Button>
            <Button
              size="sm"
              disabled={!payloadDirty}
              onClick={() => {
                const result = parseFluxFailurePayload(payload);
                if (result.error) {
                  setPayloadError(result.error);
                  return;
                }
                onUpdate({ ...row, payload: result.payload });
                setPayloadDirty(false);
              }}
            >
              <Save data-icon="inline-start" aria-hidden="true" />
              Save payload
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="Details">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveDetails();
            }}
          >
            <FieldGroup>
              {text("task", "Task")}
              <div className="flux-failure-field-pair">
                {choice("agent", "Agent", fluxFailureAgents)}
                {choice("owner", "Owner", fluxFailureOwners)}
              </div>
              {choice("status", "Status", ["Failed", "Retrying", "Dismissed"])}
              {choice(
                "errorCode",
                "Error code",
                fluxFailureErrorCodes.map((entry) => entry.code),
              )}
              <Field data-invalid={Boolean(errors.errorMessage)}>
                <FieldLabel htmlFor={`${row.id}-errorMessage`}>Error message</FieldLabel>
                <Textarea
                  id={`${row.id}-errorMessage`}
                  value={value("errorMessage")}
                  onChange={(event) => set("errorMessage", event.target.value)}
                  aria-invalid={Boolean(errors.errorMessage)}
                  aria-describedby={
                    errors.errorMessage ? `${row.id}-errorMessage-error` : undefined
                  }
                />
                {errors.errorMessage ? (
                  <FieldError id={`${row.id}-errorMessage-error`}>{errors.errorMessage}</FieldError>
                ) : null}
              </Field>
              {text("failedStep", "Failed step")}
              <Field>
                <FieldLabel htmlFor={`${row.id}-notes`}>Triage notes</FieldLabel>
                <Textarea
                  id={`${row.id}-notes`}
                  value={value("notes")}
                  onChange={(event) => set("notes", event.target.value)}
                  rows={3}
                />
              </Field>
            </FieldGroup>
            <div className="flux-failure-edit-actions">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!changed.size}
                onClick={() => {
                  setChanged(new Set());
                  setErrors({});
                }}
              >
                Discard changes
              </Button>
              <Button type="submit" size="sm" disabled={!changed.size}>
                <Save data-icon="inline-start" aria-hidden="true" />
                Save details
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </SettingsDrawer>
  );
}
