import { useState } from "react";
import { ChevronLeft, ChevronRight, Webhook } from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { SettingsFields } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckOption, DetailFacts, RecordMenu, SettingsDrawer } from "./flowly-settings-components";
import { webhookEvents, type FlowlyWebhook } from "./flowly-settings-data";
import type { FlowlySettingsModel } from "./flowly-settings-model";

function endpointValid(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
function webhookLabel(record: FlowlyWebhook) {
  return record.url.replace(/^https?:\/\//, "");
}
export function FlowlyWebhooksPage({ model }: { model: FlowlySettingsModel }) {
  return (
    <Frame dense className="fs-frame">
      <FramePanel className="fs-panel">
        {model.webhooks.length === 0 ? (
          <div className="fs-empty">
            <h3>No endpoints</h3>
            <p className="fs-hint">Add a local demo endpoint to choose which events it receives.</p>
            <Button size="sm" onClick={() => model.setDialog({ kind: "webhook-create" })}>
              Add Endpoint
            </Button>
          </div>
        ) : (
          model.webhooks.map((record) => (
            <div className="fs-record-card" key={record.id}>
              <span className="fs-service-mark">
                <Webhook />
              </span>
              <div className="fs-record-copy">
                <h3 className="fs-endpoint">{webhookLabel(record)}</h3>
                <p>{record.description}</p>
                <p>
                  {record.events.length} {record.events.length === 1 ? "event" : "events"},{" "}
                  {record.success} delivered
                </p>
              </div>
              <div className="fs-record-actions">
                <Badge
                  variant="outline"
                  className={
                    record.status === "Delivering"
                      ? "fs-positive"
                      : record.status === "Retrying"
                        ? "fs-warning"
                        : ""
                  }
                >
                  {record.status}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    model.setDialog({ kind: "webhook", id: record.id, tab: "overview" })
                  }
                >
                  Manage
                </Button>
                <RecordMenu
                  label={`Open ${webhookLabel(record)} actions`}
                  items={[
                    {
                      label: "Settings",
                      onSelect: (trigger) =>
                        model.setDialog(
                          { kind: "webhook", id: record.id, tab: "settings" },
                          trigger,
                        ),
                    },
                    {
                      label: "Send test",
                      onSelect: () =>
                        model.updateWebhooks(
                          model.webhooks.map((item) =>
                            item.id === record.id
                              ? { ...item, tests: (item.tests ?? 0) + 1 }
                              : item,
                          ),
                          "Demo webhook delivery recorded",
                        ),
                    },
                    {
                      label: record.status === "Paused" ? "Resume" : "Pause",
                      onSelect: () =>
                        model.updateWebhooks(
                          model.webhooks.map((item) =>
                            item.id === record.id
                              ? {
                                  ...item,
                                  status: item.status === "Paused" ? "Delivering" : "Paused",
                                }
                              : item,
                          ),
                          record.status === "Paused"
                            ? "Demo endpoint resumed"
                            : "Demo endpoint paused",
                        ),
                    },
                    {
                      label: "Delete",
                      separator: true,
                      destructive: true,
                      onSelect: (trigger) =>
                        model.setDialog(
                          {
                            kind: "webhook",
                            id: record.id,
                            tab: "overview",
                            confirmDelete: true,
                          },
                          trigger,
                        ),
                    },
                  ]}
                />
              </div>
            </div>
          ))
        )}
      </FramePanel>
    </Frame>
  );
}

function WebhookFields({
  draft,
  onChange,
  prefix,
}: {
  draft: FlowlyWebhook;
  onChange: (draft: FlowlyWebhook) => void;
  prefix: string;
}) {
  return (
    <div className="fs-detail-form">
      <fieldset className="fs-fieldset">
        <legend>Endpoint</legend>
        <div className="fs-input-field">
          <Label htmlFor={`${prefix}-url`}>URL</Label>
          <Input
            id={`${prefix}-url`}
            type="url"
            required
            placeholder="https://api.example.com/hooks/bricklane"
            value={draft.url}
            aria-invalid={Boolean(draft.url) && !endpointValid(draft.url)}
            onChange={(event) => onChange({ ...draft, url: event.target.value })}
          />
          {draft.url && !endpointValid(draft.url) && (
            <p className="text-sm text-destructive" role="alert">
              Enter an HTTP or HTTPS endpoint URL.
            </p>
          )}
        </div>
        <div className="fs-input-field">
          <Label htmlFor={`${prefix}-description`}>Description</Label>
          <Input
            id={`${prefix}-description`}
            placeholder="Run results for the ops dashboard."
            value={draft.description}
            onChange={(event) => onChange({ ...draft, description: event.target.value })}
          />
        </div>
      </fieldset>
      <fieldset className="fs-fieldset">
        <legend>Events</legend>
        {webhookEvents.map(([event, description]) => (
          <CheckOption
            key={event}
            id={`${prefix}-event-${event}`}
            label={event}
            description={description}
            checked={draft.events.includes(event)}
            onChange={(checked) =>
              onChange({
                ...draft,
                events: checked
                  ? [...draft.events, event]
                  : draft.events.filter((item) => item !== event),
              })
            }
          />
        ))}
      </fieldset>
      <fieldset className="fs-fieldset">
        <legend>Delivery</legend>
        <div className="fs-input-field">
          <Label>Retry Failed Events</Label>
          <RadioGroup
            aria-label="Retry Failed Events"
            className="fs-retry-options"
            value={draft.retry}
            onValueChange={(value) =>
              onChange({ ...draft, retry: value as FlowlyWebhook["retry"] })
            }
          >
            {(["24 hours", "72 hours", "No retries"] as const).map((value) => (
              <div className="fs-radio-option" key={value}>
                <RadioGroupItem
                  id={`${prefix}-retry-${value.replaceAll(" ", "-")}`}
                  value={value}
                />
                <Label htmlFor={`${prefix}-retry-${value.replaceAll(" ", "-")}`}>{value}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <SettingsFields
          fields={[
            {
              id: "sign",
              controlId: `${prefix}-signing`,
              label: "Sign Payloads",
              description: "Adds a signature header the receiver can verify.",
              type: "switch",
            },
          ]}
          value={{ sign: draft.sign }}
          onValueChange={(_, value) => onChange({ ...draft, sign: Boolean(value) })}
        />
      </fieldset>
    </div>
  );
}

export function FlowlyWebhookDrawer({
  model,
  id,
  tab,
  confirmDelete = false,
}: {
  model: FlowlySettingsModel;
  id: string;
  tab: "overview" | "settings";
  confirmDelete?: boolean;
}) {
  const record = model.webhooks.find((item) => item.id === id);
  const [draft, setDraft] = useState(() => (record ? structuredClone(record) : null));
  const [confirm, setConfirm] = useState(confirmDelete);
  if (!record || !draft) return null;
  const dirty = JSON.stringify(record) !== JSON.stringify(draft);
  const index = model.webhooks.findIndex((item) => item.id === id);
  const update = (next: FlowlyWebhook, message: string) =>
    model.updateWebhooks(
      model.webhooks.map((item) => (item.id === id ? next : item)),
      message,
    );
  return (
    <SettingsDrawer
      title={webhookLabel(record)}
      description={`${record.events.length} events · ${record.success} delivered · Last ${record.tests ? "just now (demo)" : "12 s ago"}`}
      returnFocusRef={model.returnFocusRef}
      onClose={() => model.setDialog(null)}
      header={
        <div className="fs-record-heading">
          <span>whk-{record.id}</span>
          <div>
            <span>
              {index + 1} of {model.webhooks.length}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Previous endpoint"
              disabled={index === 0}
              onClick={() =>
                model.setDialog({ kind: "webhook", id: model.webhooks[index - 1].id, tab })
              }
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Next endpoint"
              disabled={index === model.webhooks.length - 1}
              onClick={() =>
                model.setDialog({ kind: "webhook", id: model.webhooks[index + 1].id, tab })
              }
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      }
      footer={
        tab === "settings" && !confirm ? (
          <>
            <Button
              variant="outline"
              disabled={!dirty}
              onClick={() => setDraft(structuredClone(record))}
            >
              Discard
            </Button>
            <Button
              disabled={!dirty || !endpointValid(draft.url) || !draft.events.length}
              onClick={() => update(draft, "Demo endpoint updated")}
            >
              Save Changes
            </Button>
          </>
        ) : undefined
      }
    >
      {confirm ? (
        <section className="fs-confirmation">
          <h3>Delete this endpoint?</h3>
          <p className="fs-hint">
            The local demo endpoint and its sample deliveries will be removed. No remote endpoint is
            changed.
          </p>
          <div>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Keep endpoint
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                model.updateWebhooks(
                  model.webhooks.filter((item) => item.id !== id),
                  "Demo endpoint deleted",
                );
                model.setDialog(null);
              }}
            >
              Delete Endpoint
            </Button>
          </div>
        </section>
      ) : (
        <>
          <div className="fs-detail-status">
            <Badge
              variant="outline"
              className={
                record.status === "Delivering"
                  ? "fs-positive"
                  : record.status === "Retrying"
                    ? "fs-warning"
                    : ""
              }
            >
              {record.status}
            </Badge>
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update(
                    { ...record, tests: (record.tests ?? 0) + 1 },
                    "Demo webhook delivery recorded",
                  )
                }
              >
                Send Test
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update(
                    { ...record, status: record.status === "Paused" ? "Delivering" : "Paused" },
                    record.status === "Paused" ? "Demo endpoint resumed" : "Demo endpoint paused",
                  )
                }
              >
                {record.status === "Paused" ? "Resume" : "Pause"}
              </Button>
            </div>
          </div>
          <Tabs
            value={tab}
            onValueChange={(value) =>
              model.setDialog({ kind: "webhook", id, tab: value as "overview" | "settings" })
            }
            className="fs-detail-tabs"
          >
            <TabsList variant="line">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <h3>Delivery</h3>
              <DetailFacts
                items={[
                  ["Status", record.status],
                  ["Success", `${record.success} in 24 hours`],
                  ["Retries", record.retry],
                ]}
              />
              <h3>Events</h3>
              <div className="fs-event-tags">
                {record.events.map((event) => (
                  <Badge variant="outline" key={event}>
                    {event}
                  </Badge>
                ))}
              </div>
              <h3>Security</h3>
              <DetailFacts
                items={[
                  ["Signing", record.sign ? "Signed" : "Unsigned"],
                  ["Secret", "demo_••••9f2c"],
                ]}
              />
              <h3>Recent Deliveries</h3>
              <ul className="fs-deliveries">
                {Array.from({ length: record.tests ?? 0 }, (_, index) => (
                  <li key={`demo-${index}`}>
                    <Badge variant="outline" className="fs-positive">
                      Demo 200
                    </Badge>
                    <span>run.completed</span>
                    <span>Local only</span>
                    <span>Just now</span>
                  </li>
                ))}
                {[
                  ["run.completed", "182 ms", "12 s ago"],
                  ["run.started", "164 ms", "1 min ago"],
                  ["run.failed", "201 ms", "8 min ago"],
                ].map(([event, time, when]) => (
                  <li key={event}>
                    <Badge variant="outline" className="fs-positive">
                      200
                    </Badge>
                    <span>{event}</span>
                    <span>{time}</span>
                    <span>{when}</span>
                  </li>
                ))}
              </ul>
              <p className="fs-hint">
                All delivery entries are local examples. Send Test never makes a network request.
              </p>
            </TabsContent>
            <TabsContent value="settings">
              <WebhookFields draft={draft} onChange={setDraft} prefix="webhook-edit" />
            </TabsContent>
          </Tabs>
        </>
      )}
    </SettingsDrawer>
  );
}

export function FlowlyWebhookCreate({ model }: { model: FlowlySettingsModel }) {
  const [draft, setDraft] = useState<FlowlyWebhook>({
    id: crypto.randomUUID(),
    url: "",
    description: "",
    events: ["run.completed"],
    status: "Delivering",
    success: "100%",
    retry: "24 hours",
    sign: true,
  });
  return (
    <SettingsDrawer
      title="Add Endpoint"
      description="Bricklane posts the events you pick to this URL as they happen. This local demo does not send requests."
      returnFocusRef={model.returnFocusRef}
      onClose={() => model.setDialog(null)}
      footer={
        <>
          <p className="fs-hint">
            {draft.events.length} {draft.events.length === 1 ? "event" : "events"},{" "}
            {draft.retry === "No retries" ? "no retries" : `${draft.retry} of retries`}
          </p>
          <div>
            <Button variant="outline" onClick={() => model.setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="flowly-webhook-create"
              disabled={!endpointValid(draft.url) || !draft.events.length}
            >
              Add Endpoint
            </Button>
          </div>
        </>
      }
    >
      <form
        id="flowly-webhook-create"
        onSubmit={(event) => {
          event.preventDefault();
          if (!endpointValid(draft.url) || !draft.events.length) return;
          model.updateWebhooks([...model.webhooks, draft], "Demo endpoint added");
          model.setDialog(null);
        }}
      >
        <WebhookFields draft={draft} onChange={setDraft} prefix="webhook-new" />
      </form>
    </SettingsDrawer>
  );
}
