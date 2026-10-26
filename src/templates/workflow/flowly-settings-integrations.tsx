import { useState } from "react";
import { Calendar, Check, ChevronLeft, ChevronRight, Puzzle, Search } from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { SettingsFields } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { CheckOption, DetailFacts, RecordMenu, SettingsDrawer } from "./flowly-settings-components";
import {
  integrationServices,
  type FlowlyIntegration,
  type IntegrationUse,
} from "./flowly-settings-data";
import type { FlowlySettingsModel } from "./flowly-settings-model";

const integrationUses: readonly [IntegrationUse, string][] = [
  ["Workflow steps", "Workflows can call it as a step."],
  ["Agent tools", "Agents can use it while they work."],
  ["Run alerts", "Failed and slow runs report here."],
];
export function IntegrationMark({ name }: { name: string }) {
  return (
    <span className="fs-service-mark" aria-hidden="true">
      {name === "Google Calendar" ? (
        <Calendar />
      ) : name === "Slack" ? (
        <span className="fs-original-slack">S</span>
      ) : name === "n8n" ? (
        <Puzzle />
      ) : (
        <span>{name.slice(0, 1)}</span>
      )}
    </span>
  );
}

export function FlowlyIntegrationsPage({ model }: { model: FlowlySettingsModel }) {
  const card = (record: FlowlyIntegration) => (
    <div className="fs-record-card" key={record.id}>
      <IntegrationMark name={record.name} />
      <div className="fs-record-copy">
        <h3>{record.name}</h3>
        <p>{record.description}</p>
        <p>
          {record.status === "Needs setup"
            ? `Ready for ${record.target}`
            : `${record.targetLabel}: ${record.target}`}
        </p>
      </div>
      <div className="fs-record-actions">
        <Badge
          variant="outline"
          className={
            record.status === "Needs setup"
              ? "fs-warning"
              : record.status === "Paused"
                ? ""
                : record.status === "Live"
                  ? "fs-purple"
                  : "fs-positive"
          }
        >
          {record.status}
        </Badge>
        <Button
          size="sm"
          variant={record.status === "Needs setup" ? "default" : "outline"}
          onClick={() =>
            model.setDialog(
              record.status === "Needs setup"
                ? { kind: "integration-create", service: record.name }
                : { kind: "integration", id: record.id, tab: "overview" },
            )
          }
        >
          {record.status === "Needs setup" ? "Connect" : "Manage"}
        </Button>
        <RecordMenu
          label={`Open ${record.name} actions`}
          items={[
            {
              label: "Settings",
              onSelect: (trigger) =>
                model.setDialog({ kind: "integration", id: record.id, tab: "settings" }, trigger),
            },
            {
              label: record.status === "Paused" ? "Resume sync" : "Pause sync",
              disabled: record.status === "Needs setup",
              onSelect: () =>
                model.updateIntegrations(
                  model.integrations.map((item) =>
                    item.id === record.id
                      ? { ...item, status: item.status === "Paused" ? "Connected" : "Paused" }
                      : item,
                  ),
                  record.status === "Paused" ? "Demo sync resumed" : "Demo sync paused",
                ),
            },
            {
              label: "Disconnect",
              separator: true,
              destructive: true,
              disabled: record.status === "Needs setup",
              onSelect: (trigger) =>
                model.setDialog(
                  {
                    kind: "integration",
                    id: record.id,
                    tab: "settings",
                    confirmDisconnect: true,
                  },
                  trigger,
                ),
            },
          ]}
        />
      </div>
    </div>
  );
  return (
    <>
      {model.integrations.slice(0, 1).map((record) => (
        <Frame dense className="fs-frame" key={record.id}>
          <FramePanel className="fs-panel">{card(record)}</FramePanel>
        </Frame>
      ))}
      {model.integrations.length > 1 && (
        <Frame dense className="fs-frame">
          <FramePanel className="fs-panel">{model.integrations.slice(1).map(card)}</FramePanel>
        </Frame>
      )}
    </>
  );
}

function IntegrationUseFields({
  value,
  onChange,
  prefix,
}: {
  value: IntegrationUse[];
  onChange: (value: IntegrationUse[]) => void;
  prefix: string;
}) {
  return (
    <fieldset className="fs-fieldset">
      <legend>Use In</legend>
      {integrationUses.map(([label, description]) => (
        <CheckOption
          key={label}
          id={`${prefix}-${label.toLowerCase().replaceAll(" ", "-")}`}
          label={label}
          description={description}
          checked={value.includes(label)}
          onChange={(checked) =>
            onChange(checked ? [...value, label] : value.filter((item) => item !== label))
          }
        />
      ))}
    </fieldset>
  );
}
function ConnectionTest({
  name,
  targetLabel,
  enabled,
  tested,
  onTest,
}: {
  name: string;
  targetLabel: string;
  enabled: boolean;
  tested: boolean;
  onTest: () => void;
}) {
  return (
    <section className="fs-connection-test">
      <div className="fs-section-heading">
        <h3>Connection Test</h3>
        <Button size="sm" variant="outline" disabled={!enabled} onClick={onTest}>
          Test Connection
        </Button>
      </div>
      <DetailFacts
        items={[
          [`Reach ${name}`, tested ? "Demo passed" : "Not run yet"],
          ["Authenticate", tested ? "Demo passed" : "Not run yet"],
          [`Open the ${targetLabel.toLowerCase()}`, tested ? "Demo passed" : "Not run yet"],
        ]}
      />
      <p className="fs-hint">
        Local preview only. This test never contacts {name} or grants authorization.
      </p>
    </section>
  );
}

export function FlowlyIntegrationDrawer({
  model,
  id,
  tab,
  confirmDisconnect = false,
}: {
  model: FlowlySettingsModel;
  id: string;
  tab: "overview" | "settings";
  confirmDisconnect?: boolean;
}) {
  const record = model.integrations.find((item) => item.id === id);
  const [draft, setDraft] = useState(() => (record ? structuredClone(record) : null));
  const [tested, setTested] = useState(false);
  const [confirm, setConfirm] = useState(confirmDisconnect);
  if (!record || !draft) return null;
  const dirty = JSON.stringify(record) !== JSON.stringify(draft);
  const peers = model.integrations.filter((item) => item.status !== "Needs setup");
  const index = peers.findIndex((item) => item.id === id);
  const update = (next: FlowlyIntegration, message: string) =>
    model.updateIntegrations(
      model.integrations.map((item) => (item.id === id ? next : item)),
      message,
    );
  return (
    <SettingsDrawer
      title={record.name}
      description={`${record.category} · ${record.target} · ${record.calls} calls today`}
      onClose={() => model.setDialog(null)}
      returnFocusRef={model.returnFocusRef}
      header={
        <div className="fs-record-heading">
          <span>int-{record.id}</span>
          <div>
            <span>
              {index + 1} of {peers.length}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Previous integration"
              disabled={index <= 0}
              onClick={() => model.setDialog({ kind: "integration", id: peers[index - 1].id, tab })}
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Next integration"
              disabled={index >= peers.length - 1}
              onClick={() => model.setDialog({ kind: "integration", id: peers[index + 1].id, tab })}
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
              onClick={() => {
                setDraft(structuredClone(record));
                setTested(false);
              }}
            >
              Discard
            </Button>
            <Button
              disabled={!dirty || !draft.target.trim()}
              onClick={() => update(draft, "Demo integration updated")}
            >
              Save Changes
            </Button>
          </>
        ) : undefined
      }
    >
      {confirm ? (
        <section className="fs-confirmation">
          <h3>Disconnect {record.name}?</h3>
          <p className="fs-hint">
            Only the local demo connection is removed. No service account is changed.
          </p>
          <div>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Keep connected
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                update(
                  { ...record, status: "Needs setup", lastSync: "Not synced" },
                  "Demo integration disconnected",
                );
                model.setDialog(null);
              }}
            >
              Disconnect
            </Button>
          </div>
        </section>
      ) : (
        <>
          <div className="fs-detail-status">
            <Badge variant="outline" className={record.status === "Paused" ? "" : "fs-positive"}>
              {record.status}
            </Badge>
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update({ ...record, lastSync: "Just now (demo)" }, "Demo sync recorded")
                }
              >
                Sync Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update(
                    { ...record, status: record.status === "Paused" ? "Connected" : "Paused" },
                    record.status === "Paused" ? "Demo sync resumed" : "Demo sync paused",
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
              model.setDialog({ kind: "integration", id, tab: value as "overview" | "settings" })
            }
            className="fs-detail-tabs"
          >
            <TabsList variant="line">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <h3>Sync</h3>
              <DetailFacts
                items={[
                  ["Status", record.status],
                  ["Last sync", record.lastSync],
                  ["Calls today", record.calls],
                ]}
              />
              <h3>Connection</h3>
              <DetailFacts
                items={[
                  ["Service", `${record.name} ${record.category}`],
                  ["Signs in as", "Bricklane bot"],
                  [record.targetLabel, record.target],
                  ["Used in", record.uses.join(", ")],
                  ["Failure alerts", record.alert ? "On" : "Off"],
                ]}
              />
              <p className="fs-hint">{record.description}</p>
            </TabsContent>
            <TabsContent value="settings">
              <div className="fs-detail-form">
                <fieldset className="fs-fieldset">
                  <legend>Connection</legend>
                  <div className="fs-input-field">
                    <Label htmlFor="integration-edit-target">{record.targetLabel}</Label>
                    <Input
                      id="integration-edit-target"
                      value={draft.target}
                      onChange={(event) => {
                        setDraft({ ...draft, target: event.target.value });
                        setTested(false);
                      }}
                      placeholder={record.target}
                    />
                  </div>
                  <div className="fs-input-field">
                    <Label htmlFor="integration-edit-description">What It Is For</Label>
                    <Textarea
                      id="integration-edit-description"
                      value={draft.description}
                      onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                    />
                  </div>
                </fieldset>
                <IntegrationUseFields
                  prefix="integration-edit-use"
                  value={draft.uses}
                  onChange={(uses) => setDraft({ ...draft, uses })}
                />
                <SettingsFields
                  fields={[
                    {
                      id: "alert",
                      controlId: "integration-edit-alert",
                      label: "Alert on Failure",
                      description: `Tell the workspace owners when a call to ${record.name} fails.`,
                      type: "switch",
                    },
                  ]}
                  value={{ alert: draft.alert }}
                  onValueChange={(_, value) => setDraft({ ...draft, alert: Boolean(value) })}
                />
                <ConnectionTest
                  name={record.name}
                  targetLabel={record.targetLabel}
                  enabled={Boolean(draft.target.trim())}
                  tested={tested}
                  onTest={() => setTested(true)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </SettingsDrawer>
  );
}

export function FlowlyIntegrationWizard({
  model,
  service: initialService,
}: {
  model: FlowlySettingsModel;
  service?: string;
}) {
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [service, setService] = useState(initialService ?? "");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [alert, setAlert] = useState(true);
  const [tested, setTested] = useState(false);
  const [uses, setUses] = useState<IntegrationUse[]>(["Workflow steps"]);
  const selected = integrationServices.find((item) => item[0] === service);
  const existing = model.integrations.find((item) => item.name === service);
  const connected = (name: string) =>
    model.integrations.some((item) => item.name === name && item.status !== "Needs setup");
  function create() {
    if (!selected || !target.trim() || !tested) return;
    const next: FlowlyIntegration = {
      id: existing?.id ?? crypto.randomUUID(),
      name: service,
      category: selected[1],
      description: description.trim() || `Connected to ${service} in the local demo.`,
      target: target.trim(),
      targetLabel: selected[2],
      status: "Connected",
      calls: "0",
      lastSync: "Not synced",
      uses,
      alert,
    };
    model.updateIntegrations(
      existing
        ? model.integrations.map((item) => (item.id === existing.id ? next : item))
        : [...model.integrations, next],
      "Demo integration added",
    );
    model.setDialog(null);
  }
  return (
    <SettingsDrawer
      title="New Integration"
      description={
        step === 0
          ? "Pick what to connect."
          : step === 1
            ? "Point it at your account."
            : "Choose where this integration is used."
      }
      returnFocusRef={model.returnFocusRef}
      onClose={() => model.setDialog(null)}
      footer={
        <>
          <p className="fs-hint">
            {step === 0
              ? service
                ? `${service} selected`
                : "Pick a service to continue"
              : step === 1
                ? "Local demo only. No OAuth access is requested."
                : `${uses.length} uses selected; no external account will be connected.`}
          </p>
          <div>
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button
              disabled={step === 0 ? !service : step === 1 ? !target.trim() || !tested : false}
              onClick={() => (step === 2 ? create() : setStep(step + 1))}
            >
              {step === 2 ? "Add Integration" : "Continue"}
            </Button>
          </div>
        </>
      }
    >
      <ol className="fs-wizard-steps">
        {["Service", "Configure", "Use"].map((label, index) => (
          <li key={label} aria-current={step === index ? "step" : undefined}>
            <span>{index < step ? <Check /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {step === 0 ? (
        <>
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search integrations..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </InputGroup>
          <div className="fs-service-options">
            {integrationServices
              .filter((item) =>
                `${item[0]} ${item[1]}`.toLowerCase().includes(search.toLowerCase()),
              )
              .map((item) => (
                <Button
                  key={item[0]}
                  variant="outline"
                  disabled={connected(item[0])}
                  aria-pressed={service === item[0]}
                  onClick={() => {
                    setService(item[0]);
                    setTarget("");
                    setTested(false);
                  }}
                >
                  <IntegrationMark name={item[0]} />
                  <span>
                    {item[0]}
                    <small>{connected(item[0]) ? "Connected" : item[1]}</small>
                  </span>
                </Button>
              ))}
          </div>
        </>
      ) : step === 1 ? (
        <div className="fs-detail-form">
          <div className="fs-service-selected">
            <IntegrationMark name={service} />
            <div>
              <h3>{service}</h3>
              <p className="fs-hint">{selected?.[1]}, local preview</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setStep(0)}>
              Change
            </Button>
          </div>
          <fieldset className="fs-fieldset">
            <legend>Connection</legend>
            <div className="fs-input-field">
              <Label htmlFor="integration-new-target">{selected?.[2]}</Label>
              <Input
                id="integration-new-target"
                value={target}
                onChange={(event) => {
                  setTarget(event.target.value);
                  setTested(false);
                }}
                placeholder={existing?.target ?? `Your ${selected?.[2].toLowerCase()}`}
              />
            </div>
            <p className="fs-hint">
              Authorization is simulated locally. No OAuth window opens and no credentials are sent.
            </p>
            <div className="fs-input-field">
              <Label htmlFor="integration-new-description">What It Is For</Label>
              <Textarea
                id="integration-new-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </fieldset>
          <SettingsFields
            fields={[
              {
                id: "alert",
                controlId: "integration-new-alert",
                label: "Alert on Failure",
                description: `Tell the workspace owners when a call to ${service} fails.`,
                type: "switch",
              },
            ]}
            value={{ alert }}
            onValueChange={(_, value) => setAlert(Boolean(value))}
          />
          <ConnectionTest
            name={service}
            targetLabel={selected?.[2] ?? "account"}
            enabled={Boolean(target.trim())}
            tested={tested}
            onTest={() => setTested(true)}
          />
        </div>
      ) : (
        <div className="fs-detail-form">
          <DetailFacts
            items={[
              ["Service", service],
              [selected?.[2] ?? "Target", target],
            ]}
          />
          <IntegrationUseFields prefix="integration-new-use" value={uses} onChange={setUses} />
          <p className="fs-notice">
            This creates a working local demo record. It does not connect an external service.
          </p>
        </div>
      )}
    </SettingsDrawer>
  );
}
