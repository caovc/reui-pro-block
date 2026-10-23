import type { Agent, useFlowlyAgentsModel } from "./workflow-models";
import { useState } from "react";
import { Bot, Eye, Pencil, Plus } from "lucide-react";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button, Input, Status, Segments } from "./shared";
import { Choice, Person, SideForm } from "./controls";
import { WorkflowGrid, type WorkflowField } from "./grid";
import { Switch } from "@/components/ui/switch";

export function FlowlyAgents({
  onOpen,
  records,
}: {
  onOpen: (name: string) => void;
  records: ReturnType<typeof useFlowlyAgentsModel>;
}) {
  const [rows, setRows] = records;
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [model, setModel] = useState("Claude Sonnet 5.5");
  const [owner, setOwner] = useState("Nick Bold");
  const [environment, setEnvironment] = useState("Production");
  const [alert, setAlert] = useState(true);
  const fields: WorkflowField<Agent>[] = [
    {
      key: "name",
      title: "Agent",
      size: 280,
      render: (r) => (
        <>
          <button className="wf-text-button" onClick={() => onOpen(r.name)}>
            {r.name}
          </button>
          <small className="wf-sub">{r.id} · Updated Oct 4, 2026</small>
        </>
      ),
    },
    {
      key: "owner",
      title: "Owner",
      size: 240,
      render: (r) => (
        <>
          <Person name={r.owner} />
          <small className="wf-sub wf-person-sub">{r.role}</small>
        </>
      ),
    },
    { key: "model", title: "Model", size: 170, render: (r) => <Status>{r.model}</Status> },
    { key: "status", title: "Status", size: 100, render: (r) => <Status>{r.status}</Status> },
    { key: "sessions", title: "Sessions", size: 105, render: (r) => r.sessions.toLocaleString() },
    { key: "spend", title: "Spend", size: 100, render: (r) => r.spend },
    { key: "date", title: "Last active", size: 125, render: (r) => r.date },
    {
      key: "actions",
      title: "Actions",
      size: 90,
      render: (r) => (
        <div className="wf-inline">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={`View ${r.name}`}
            onClick={() => onOpen(r.name)}
          >
            <Eye />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label={`Edit ${r.name}`}
            onClick={() => onOpen(r.name)}
          >
            <Pencil />
          </Button>
        </div>
      ),
    },
  ];
  const visible = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) &&
      (tab === "All" ||
        r.status ===
          { Live: "Live", Drafts: "Draft", Paused: "Paused", "Needs attention": "Error" }[tab]),
  );
  return (
    <>
      <Frame className="wf-agents" spacing="sm">
        <FrameHeader>
          <FrameTitle className="wf-inline">
            <Bot className="size-4" />
            Agents
          </FrameTitle>
          <Button
            size="sm"
            onClick={() => {
              setName("");
              setOpen(true);
            }}
          >
            <Plus />
            New agent
          </Button>
        </FrameHeader>
        <FramePanel className="p-0">
          <Segments
            items={["All", "Live", "Drafts", "Paused", "Needs attention"]}
            value={tab}
            onChange={setTab}
          />
          <div className="wf-agents-filter">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents"
              aria-label="Search agents"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery("");
                setTab("All");
              }}
            >
              Clear all
            </Button>
          </div>
          <WorkflowGrid rows={visible} fields={fields} pageSize={10} />
        </FramePanel>
      </Frame>
      <SideForm
        open={open}
        title="New Agent"
        description="Name it and pick its model. Tools and instructions are added in the Builder."
        onClose={() => setOpen(false)}
        onSubmit={() => {
          if (!name.trim()) return;
          const created = {
            id: `agt_local_${rows.length}`,
            name: name.trim(),
            owner,
            role: environment,
            model,
            status: "Draft",
            sessions: 0,
            spend: "$0.00",
            date: "Never run",
          };
          setRows([...rows, created]);
          setOpen(false);
          setTab("All");
          setQuery(created.name);
        }}
        submit="Create Agent"
      >
        <h3>Agent</h3>
        <label>
          Name
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Agent name"
          />
        </label>
        <Choice
          label="Environment"
          value={environment}
          onChange={setEnvironment}
          items={["Production", "Staging", "Sandbox"]}
        />
        <label>
          Monthly budget (USD)
          <Input type="number" defaultValue="100" min="0" />
        </label>
        <h3>Runtime</h3>
        <Choice
          label="Model"
          value={model}
          onChange={setModel}
          items={["Claude Sonnet 5.5", "Claude Opus 5.5", "GPT-5", "Gemini 3 Pro", "Llama 4"]}
        />
        <Choice
          label="Owner"
          value={owner}
          onChange={setOwner}
          items={["Nick Bold", "Hanna Berg", "Omar Haddad", "Ines Marchetti"]}
        />
        <label className="wf-inline wf-between">
          Alert on failure
          <Switch checked={alert} onCheckedChange={setAlert} />
        </label>
        <p className="wf-muted">Notifies #ops-alerts after three failed sessions in a row.</p>
      </SideForm>
    </>
  );
}
