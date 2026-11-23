import { useId, useState, type RefObject } from "react";
import { Copy, Pause, Play, RotateCcw, Save, X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/reui/alert";
import {
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineSeparator,
  TimelineTitle,
  TimelineContent,
} from "@/components/reui/timeline";
import { Button } from "@/components/ui/button";
import { FieldSet, FieldLegend } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "./free/flowly-progress";
import { DetailFacts, SettingsDrawer } from "./flowly-settings-components";
import { FluxQueueStatusBadge, FluxQueuePriorityBadge } from "./flux-queue-badge";
import { FluxQueueFields, type FluxQueueDraftChange } from "./flux-queue-fields";
import {
  editFluxQueueRun,
  fluxQueueDate,
  fluxQueueUpdatedAt,
  validateFluxQueueDraft,
  type FluxQueueDraft,
  type FluxQueueDraftErrors,
  type FluxQueueRun,
  type FluxQueueOperation,
} from "./flux-queue-model";

const draftFromRun = (row: FluxQueueRun): FluxQueueDraft => ({
  task: row.task,
  agent: row.agent,
  owner: row.owner,
  priority: row.priority,
  totalSteps: row.totalSteps,
  attention: row.attention,
  attentionReason: row.attentionReason,
  notes: row.notes,
});

export function FluxQueueDetail({
  row,
  onClose,
  onUpdate,
  onOperation,
  returnFocusRef,
  notice,
}: {
  row: FluxQueueRun;
  onClose: () => void;
  onUpdate: (row: FluxQueueRun) => void;
  onOperation: (operation: FluxQueueOperation) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  notice?: { message: string; onUndo: () => void };
}) {
  const id = useId();
  const [tab, setTab] = useState("Overview");
  const [draft, setDraft] = useState(() => draftFromRun(row));
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<FluxQueueDraftErrors>({});
  const [copyMessage, setCopyMessage] = useState("");
  const pending = Boolean(row.pendingSince);
  const value = dirty ? draft : draftFromRun(row);
  const change: FluxQueueDraftChange = (field, next) => {
    setDraft((current) => ({ ...(dirty ? current : draftFromRun(row)), [field]: next }));
    setDirty(true);
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const queued = row.status === "Queued";
  const canCancel = ["Queued", "Running", "Held"].includes(row.status);
  const canRequeue = ["Held", "Succeeded", "Failed", "Cancelled"].includes(row.status);
  return (
    <SettingsDrawer
      title="Queue run"
      description="Review progress, attention flags and the local run history."
      className="flux-queue-sheet"
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      footer={
        <>
          {queued ? (
            <Button
              variant="outline"
              disabled={dirty || pending}
              onClick={() => onOperation("hold")}
            >
              <Pause data-icon="inline-start" aria-hidden="true" />
              Hold
            </Button>
          ) : null}
          {canCancel ? (
            <Button variant="outline" disabled={dirty} onClick={() => onOperation("cancel")}>
              <X data-icon="inline-start" aria-hidden="true" />
              Cancel run
            </Button>
          ) : null}
          {queued ? (
            <Button
              disabled={dirty || pending}
              onClick={() => onOperation(row.attention ? "review" : "start")}
            >
              <Play data-icon="inline-start" aria-hidden="true" />
              {row.attention ? "Mark reviewed" : "Start run"}
            </Button>
          ) : null}
          {canRequeue ? (
            <Button disabled={dirty} onClick={() => onOperation("requeue")}>
              <RotateCcw data-icon="inline-start" aria-hidden="true" />
              {row.status === "Held" ? "Return to queue" : "Queue again"}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flux-queue-identity">
        <div>
          <code>{row.id}</code>
          <FluxQueueStatusBadge status={row.status} />
        </div>
        <h2>{row.task}</h2>
        <p>
          {row.agent} · {row.owner}
        </p>
        <FluxQueuePriorityBadge priority={row.priority} />
      </div>
      {notice ? (
        <Alert variant="success">
          <AlertTitle>{notice.message}</AlertTitle>
          <AlertAction>
            <Button variant="outline" size="sm" disabled={dirty} onClick={notice.onUndo}>
              Undo
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {dirty ? (
        <p className="flux-queue-help" role="status">
          Save or discard your details before changing this run.
        </p>
      ) : null}
      {pending ? (
        <Alert variant="info">
          <AlertTitle>Local run in progress</AlertTitle>
          <AlertDescription>
            This short preview will record the authored result without executing an external agent.
          </AlertDescription>
        </Alert>
      ) : null}
      <Tabs value={tab} onValueChange={setTab} className="flux-queue-tabs">
        <TabsList aria-label="Queue run sections">
          {["Overview", "Activity", "Details"].map((name) => (
            <TabsTrigger key={name} value={name}>
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="Overview">
          {row.attention ? (
            <Alert variant="warning">
              <AlertTitle>Needs attention</AlertTitle>
              <AlertDescription>{row.attentionReason}</AlertDescription>
              {!queued ? (
                <AlertAction>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={dirty}
                    onClick={() => onOperation("review")}
                  >
                    Mark reviewed
                  </Button>
                </AlertAction>
              ) : null}
            </Alert>
          ) : null}
          <div className="flux-queue-progress-summary">
            <strong>Step progress</strong>
            <span>
              {row.completedSteps} of {row.totalSteps} steps
            </span>
            <Progress
              aria-label="Run step progress"
              value={(row.completedSteps / row.totalSteps) * 100}
            />
          </div>
          <DetailFacts
            items={[
              ["Queued", fluxQueueDate(row.queuedAt)],
              ["Started", row.startedAt ? fluxQueueDate(row.startedAt) : "Not started"],
              ["Finished", row.finishedAt ? fluxQueueDate(row.finishedAt) : "Not finished"],
              ["Updated", fluxQueueDate(fluxQueueUpdatedAt(row))],
            ]}
          />
          <p className="flux-queue-help">{row.notes || "No handover notes have been added."}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(row.id);
                setCopyMessage("Run ID copied");
              } catch {
                setCopyMessage("Could not copy the run ID");
              }
            }}
          >
            <Copy data-icon="inline-start" aria-hidden="true" />
            Copy run ID
          </Button>
          {copyMessage ? (
            <p className="flux-queue-help" role="status">
              {copyMessage}
            </p>
          ) : null}
        </TabsContent>
        <TabsContent value="Activity">
          <Timeline value={row.events.length}>
            {row.events.map((event, index) => (
              <TimelineItem key={event.id} step={index + 1}>
                <TimelineSeparator />
                <TimelineIndicator />
                <TimelineTitle>
                  {event.label}
                  <time dateTime={event.at}>{fluxQueueDate(event.at)}</time>
                </TimelineTitle>
                <TimelineContent>{event.description}</TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </TabsContent>
        <TabsContent value="Details">
          <form
            id={id}
            onSubmit={(event) => {
              event.preventDefault();
              const invalid = validateFluxQueueDraft(value);
              setErrors(invalid);
              const first = Object.keys(invalid)[0];
              if (first) {
                document.getElementById(`${id}-${first}`)?.focus();
                return;
              }
              const after = editFluxQueueRun(row, value, new Date().toISOString());
              if (after !== row) onUpdate(after);
              setDirty(false);
            }}
          >
            <FieldSet disabled={pending}>
              <FieldLegend className="sr-only">Run details</FieldLegend>
              <FluxQueueFields
                id={id}
                value={value}
                errors={errors}
                onChange={change}
                lockSteps={!["Queued", "Held"].includes(row.status)}
              />
            </FieldSet>
            <div className="flux-queue-edit-actions">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!dirty}
                onClick={() => {
                  setDirty(false);
                  setErrors({});
                }}
              >
                Discard changes
              </Button>
              <Button type="submit" size="sm" disabled={!dirty || pending}>
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
