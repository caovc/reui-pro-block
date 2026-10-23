import { useState } from "react";
import { Filter, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button, Input, Panel, Status, Segments } from "./shared";
import { Choice, SideForm, Person } from "./controls";
import { WorkflowGrid, type WorkflowField } from "./grid";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
export type WorkflowRecord = {
  name: string;
  owner: string;
  role: string;
  trigger: string;
  fires: string;
  tags: string[];
  result: string;
  date: string;
  runs: string;
  enabled: boolean;
  environment: string;
};
const seeds: WorkflowRecord[] = [
  [
    "Order Fulfillment",
    "Tomas Lindqvist",
    "Solutions Engineer",
    "Event",
    "On paid order",
    "Operations,Critical",
    "Succeeded",
    "Oct 6, 09:44",
    "3,946",
  ],
  [
    "Lead Routing",
    "Ines Marchetti",
    "Head of Operations",
    "Webhook",
    "On new lead",
    "Sales,AI",
    "Succeeded",
    "Oct 6, 09:42",
    "1,208",
  ],
  [
    "Support Triage",
    "Hanna Berg",
    "Support Lead",
    "Event",
    "On new ticket",
    "Support,AI",
    "Failed",
    "Oct 6, 09:37",
    "904",
  ],
  [
    "Social Mentions Alert",
    "Ines Marchetti",
    "Head of Operations",
    "Event",
    "On brand mention",
    "Marketing,AI",
    "Failed",
    "Oct 6, 09:31",
    "397",
  ],
  [
    "Onboarding Emails",
    "Hanna Berg",
    "Support Lead",
    "Event",
    "On signup",
    "Marketing,Growth",
    "Succeeded",
    "Oct 6, 09:28",
    "465",
  ],
  [
    "Meeting Notes to CRM",
    "Nick Bold",
    "Workspace Admin",
    "Event",
    "On call ended",
    "Sales,AI",
    "Failed",
    "Oct 6, 09:10",
    "184",
  ],
  [
    "Data Warehouse Export",
    "Omar Haddad",
    "Data Engineer",
    "Schedule",
    "Every hour",
    "Data",
    "Succeeded",
    "Oct 6, 09:00",
    "672",
  ],
  [
    "Invoice Reminders",
    "Tomas Lindqvist",
    "Solutions Engineer",
    "Schedule",
    "Daily at 08:00",
    "Finance",
    "Succeeded",
    "Oct 6, 08:00",
    "28",
  ],
  [
    "Inventory Restock",
    "Tomas Lindqvist",
    "Solutions Engineer",
    "Schedule",
    "Daily at 06:00",
    "Operations",
    "Succeeded",
    "Oct 6, 06:00",
    "28",
  ],
  [
    "Churn Risk Digest",
    "Omar Haddad",
    "Data Engineer",
    "Schedule",
    "Mondays at 07:00",
    "Growth,Data",
    "Succeeded",
    "Oct 5, 07:00",
    "4",
  ],
  [
    "Contract Sync",
    "Lena Wade",
    "Legal Operations",
    "Webhook",
    "On signed contract",
    "Legal",
    "Succeeded",
    "Oct 4, 16:21",
    "240",
  ],
  [
    "Expense Approvals",
    "Lena Wade",
    "Legal Operations",
    "Webhook",
    "On expense filed",
    "Finance",
    "Not run",
    "—",
    "0",
  ],
].map((r, i) => ({
  name: r[0],
  owner: r[1],
  role: r[2],
  trigger: r[3],
  fires: r[4],
  tags: r[5].split(","),
  result: r[6],
  date: r[7],
  runs: r[8],
  enabled: i < 10,
  environment: "Production",
}));
export function WorkflowList({
  extra,
  edit,
}: {
  extra: WorkflowRecord[];
  edit: (name: string) => void;
}) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [deleted, setDeleted] = useState<string[]>([]);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("Any");
  const [remove, setRemove] = useState("");
  const [filters, setFilters] = useState(true);
  const all = [...extra, ...seeds]
    .filter((r) => !deleted.includes(r.name))
    .map((r) => ({ ...r, id: r.name, enabled: overrides[r.name] ?? r.enabled }));
  const filtered = all.filter(
    (x) =>
      (tab === "All" ||
        (tab === "Active" && x.enabled) ||
        (tab === "Paused" && !x.enabled) ||
        (tab === "Failing" && x.result === "Failed")) &&
      (result === "Any" || x.result === result) &&
      `${x.name} ${x.owner}`.toLowerCase().includes(query.toLowerCase()),
  );
  const fields: WorkflowField<WorkflowRecord & { id: string }>[] = [
    {
      key: "name",
      title: "Workflow",
      size: 280,
      render: (r) => (
        <>
          <button type="button" className="wf-text-button" onClick={() => edit(r.name)}>
            {r.name}
          </button>
          <small className="wf-sub">
            {r.trigger} · {r.fires}
          </small>
        </>
      ),
    },
    {
      key: "owner",
      title: "Owner",
      size: 220,
      render: (r) => (
        <>
          <Person
            name={r.owner}
            index={
              [
                "Tomas Lindqvist",
                "Ines Marchetti",
                "Hanna Berg",
                "Nick Bold",
                "Omar Haddad",
              ].indexOf(r.owner) + 5
            }
          />
          <small className="wf-sub wf-person-sub">{r.role}</small>
        </>
      ),
    },
    {
      key: "enabled",
      title: "Status",
      size: 110,
      render: (r) => (
        <span className="wf-inline">
          <Switch
            aria-label={`Enable ${r.name}`}
            checked={r.enabled}
            onCheckedChange={(v) => setOverrides({ ...overrides, [r.name]: v })}
          />
          {r.enabled ? "On" : "Off"}
        </span>
      ),
    },
    {
      key: "tags",
      title: "Tags",
      size: 170,
      render: (r) => (
        <div className="wf-inline">
          {r.tags.map((t) => (
            <Status key={t}>{t}</Status>
          ))}
        </div>
      ),
    },
    {
      key: "result",
      title: "Last run",
      size: 170,
      render: (r) => (
        <>
          <Status>{r.result}</Status>
          <small className="wf-sub">{r.date}</small>
        </>
      ),
    },
    {
      key: "runs",
      title: "Runs",
      size: 85,
      value: (r) => Number(r.runs.replaceAll(",", "")),
      render: (r) => r.runs,
    },
    {
      key: "actions",
      title: "",
      size: 110,
      render: (r) => (
        <div className="wf-inline">
          <Button
            aria-label={`Edit ${r.name}`}
            variant="ghost"
            size="icon-sm"
            onClick={() => edit(r.name)}
          >
            <Pencil />
          </Button>
          <Button
            aria-label={`Delete ${r.name}`}
            variant="ghost"
            size="icon-sm"
            onClick={() => setRemove(r.name)}
          >
            <Trash2 />
          </Button>
          <Button
            aria-label={`More ${r.name}`}
            variant="ghost"
            size="icon-sm"
            onClick={() => edit(r.name)}
          >
            <MoreHorizontal />
          </Button>
        </div>
      ),
    },
  ];
  return (
    <Panel
      className="wf-workflow-list wf-edge-table"
      title="Workflows"
      action={
        <Button variant="outline" onClick={() => setFilters(!filters)}>
          <Filter />
          Display
        </Button>
      }
    >
      <div className="wf-list-tabs">
        {["All", "Active", "Paused", "Failing"].map((x) => (
          <button type="button" key={x} aria-pressed={tab === x} onClick={() => setTab(x)}>
            {x}
          </button>
        ))}
      </div>
      {filters && (
        <div className="wf-ledger-filters">
          <span>Last run</span>
          <span className="wf-muted">is</span>
          <Choice
            label="Last run result"
            value={result}
            onChange={setResult}
            items={["Any", "Succeeded", "Failed", "Not run"]}
          />
          <Input
            aria-label="Search workflows"
            placeholder="Search workflows…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => {
              setResult("Any");
              setQuery("");
              setTab("All");
            }}
          >
            Clear all
          </Button>
        </div>
      )}
      <WorkflowGrid rows={filtered} fields={fields} />
      <AlertDialog
        open={!!remove}
        onOpenChange={(v) => {
          if (!v) setRemove("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              {remove} will be removed from this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleted([...deleted, remove]);
                setRemove("");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
export function WorkflowCreate({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (record: WorkflowRecord) => void;
}) {
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("Production");
  const [fires, setFires] = useState("");
  const [trigger, setTrigger] = useState("");
  const [owner, setOwner] = useState("Nick Bold");
  const [alert, setAlert] = useState(true);
  const [error, setError] = useState("");
  return (
    <SideForm
      title="New Workflow"
      description="Name it and pick what starts it. Steps are added in the editor."
      open={open}
      onClose={onClose}
      wide
      submit="Create Workflow"
      onSubmit={() => {
        if (!trigger) {
          setError("Choose a trigger to continue.");
          return;
        }
        if (name.trim() && trigger) {
          onCreate({
            name: name.trim(),
            environment,
            fires,
            trigger,
            owner,
            role: "Workspace Admin",
            tags: [],
            result: "Not run",
            date: "Not run yet",
            runs: "0",
            enabled: false,
          });
          setName("");
          onClose();
        }
      }}
    >
      <strong>Workflow</strong>
      <label>
        Name
        <Input
          required
          placeholder="Refund Requests"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Environment
        <Segments
          items={["Production", "Staging", "Sandbox"]}
          value={environment}
          onChange={setEnvironment}
        />
      </label>
      <label>
        Fires
        <Input
          placeholder="On new ticket"
          value={fires}
          onChange={(e) => setFires(e.target.value)}
        />
      </label>
      <strong>Run</strong>
      {error && (
        <p role="alert" className="wf-danger">
          {error}
        </p>
      )}
      <div className="wf-form-columns">
        <label>
          Trigger
          <Choice
            label="Trigger"
            value={trigger}
            onChange={setTrigger}
            items={["Event", "Webhook", "Schedule", "Manual"]}
            placeholder="Choose a trigger"
          />
        </label>
        <label>
          Owner
          <Choice
            label="Owner"
            value={owner}
            onChange={setOwner}
            items={[
              "Nick Bold",
              "Tomas Lindqvist",
              "Ines Marchetti",
              "Hanna Berg",
              "Omar Haddad",
              "Lena Wade",
            ]}
          />
        </label>
      </div>
      <div className="wf-inline wf-between">
        <div>
          <strong>Alert on failure</strong>
          <p className="wf-muted">Notifies #ops-alerts after three failed runs in a row.</p>
        </div>
        <Switch checked={alert} onCheckedChange={setAlert} aria-label="Alert on failure" />
      </div>
    </SideForm>
  );
}
