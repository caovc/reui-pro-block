import { useState } from "react";
import { Plus, MoreHorizontal, Filter } from "lucide-react";
import { Button, Input, Panel, Status } from "./shared";
import { SideForm, Choice, Person } from "./controls";
import { WorkflowGrid, type WorkflowField } from "./grid";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
type Deployment = {
  id: string;
  date: string;
  service: string;
  release: string;
  pipeline: string;
  owner: string;
  team: string;
  environment: string;
  duration: string;
  status: string;
  commit: string;
  note: string;
};
const seed = [
  [
    "0148",
    "Jul 31, 09:14 UTC",
    "api-gateway",
    "v2.14.0",
    "Edge & routing",
    "Marcus Webb",
    "Platform",
    "Production",
    "4m 12s",
    "Succeeded",
  ],
  [
    "0147",
    "Jul 31, 08:02 UTC",
    "orders-db",
    "migration 0142",
    "Data platform",
    "Rafael Duarte",
    "Data",
    "Production",
    "10m 11s",
    "Running",
  ],
  [
    "0146",
    "Jul 30, 17:41 UTC",
    "recommender",
    "v0.8.0",
    "Model serving",
    "Adam Reyes",
    "ML Systems",
    "Canary",
    "7m 08s",
    "Succeeded",
  ],
  [
    "0145",
    "Jul 30, 14:26 UTC",
    "edge-cache",
    "v3.2.1",
    "Edge & routing",
    "Amelia Hart",
    "Edge",
    "Staging",
    "1m 36s",
    "Succeeded",
  ],
  [
    "0144",
    "Jul 30, 11:08 UTC",
    "identity",
    "v1.9.3",
    "Access control",
    "Klara Nowak",
    "Identity",
    "Production",
    "2m 53s",
    "Failed",
  ],
  [
    "0143",
    "Jul 29, 19:35 UTC",
    "payments-api",
    "v2.6.4",
    "Billing core",
    "Mei Watanabe",
    "Payments",
    "Production",
    "5m 34s",
    "Succeeded",
  ],
  [
    "0142",
    "Jul 29, 15:12 UTC",
    "notify-worker",
    "v1.3.9",
    "Messaging",
    "Leila Haddad",
    "Messaging",
    "Staging",
    "3m 34s",
    "Rolled back",
  ],
  [
    "0141",
    "Jul 29, 10:47 UTC",
    "search-index",
    "v5.1.0",
    "Search platform",
    "Sofia Brandt",
    "Search",
    "Preview",
    "2m 38s",
    "Succeeded",
  ],
  [
    "0140",
    "Jul 28, 16:20 UTC",
    "media-proxy",
    "v0.14.2",
    "Media pipeline",
    "Theo Morales",
    "Media",
    "Canary",
    "8m 07s",
    "Running",
  ],
  [
    "0139",
    "Jul 28, 09:03 UTC",
    "audit-log",
    "v1.0.7",
    "Access control",
    "Kofi Mensah",
    "Compliance",
    "Production",
    "2m 01s",
    "Succeeded",
  ],
];
export function Deployments() {
  const [rows, setRows] = useState<Deployment[]>(
    seed.map((r) => ({
      id: `DEP-2026-${r[0]}`,
      date: r[1],
      service: r[2],
      release: r[3],
      pipeline: r[4],
      owner: r[5],
      team: r[6],
      environment: r[7],
      duration: r[8],
      status: r[9],
      commit: "9f2c1ab",
      note: "",
    })),
  );
  const [query, setQuery] = useState("");
  const [environment, setEnvironment] = useState("All environments");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Deployment | null>(null);
  const fields: WorkflowField<Deployment>[] = [
    {
      key: "id",
      title: "Deployment",
      size: 190,
      render: (r) => (
        <button className="wf-text-button" onClick={() => setSelected(r)}>
          <strong>{r.id}</strong>
          <small className="wf-sub">{r.date}</small>
        </button>
      ),
    },
    {
      key: "service",
      title: "Service",
      size: 220,
      render: (r) => (
        <>
          <strong>{r.service}</strong> <Status>{r.release}</Status>
          <small className="wf-sub">{r.pipeline}</small>
        </>
      ),
    },
    {
      key: "owner",
      title: "Triggered by",
      size: 190,
      render: (r) => (
        <div>
          <Person name={r.owner} />
          <small className="wf-sub">{r.team}</small>
        </div>
      ),
    },
    {
      key: "environment",
      title: "Environment",
      size: 130,
      render: (r) => <Status>{r.environment}</Status>,
    },
    { key: "duration", title: "Duration", size: 110, render: (r) => r.duration },
    { key: "status", title: "Status", size: 130, render: (r) => <Status>{r.status}</Status> },
    {
      key: "actions",
      title: "",
      size: 50,
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" aria-label={`Actions ${r.id}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setSelected(r)}>View deployment</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                setRows(rows.map((x) => (x.id === r.id ? { ...x, status: "Rolled back" } : x)))
              }
            >
              Roll back
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  return (
    <>
      <Panel
        title="Deployments"
        description="Delivery ledger (releases / rollbacks)"
        className="wf-edge-table wf-deployment-ledger"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New deployment
          </Button>
        }
      >
        <div className="wf-table-controls">
          <Button variant="outline" size="sm">
            <Filter />
            Filters
          </Button>
          <span>Deployment</span>
          <span>contains</span>
          <Input
            aria-label="Search deployments"
            placeholder=""
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Choice
            label="Environment filter"
            value={environment}
            onChange={setEnvironment}
            items={["All environments", "Production", "Staging", "Canary", "Preview"]}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setEnvironment("All environments");
            }}
          >
            Clear
          </Button>
        </div>
        <WorkflowGrid
          rows={rows.filter(
            (r) =>
              (r.id + " " + r.service + " " + r.owner)
                .toLowerCase()
                .includes(query.toLowerCase()) &&
              (environment === "All environments" || r.environment === environment),
          )}
          fields={fields}
        />
      </Panel>
      <DeploymentForm
        key={selected?.id || String(open)}
        record={selected}
        open={open || !!selected}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        onSave={(r) => {
          setRows(
            selected
              ? rows.map((x) => (x.id === r.id ? r : x))
              : [
                  {
                    ...r,
                    id: `DEP-2026-${String(149 + rows.length - 10).padStart(4, "0")}`,
                    date: "Just now",
                    duration: "0s",
                    status: "Running",
                    owner: "Tomas Okonkwo",
                    team: "Platform",
                  },
                  ...rows,
                ],
          );
          setOpen(false);
          setSelected(null);
        }}
      />
    </>
  );
}
function DeploymentForm({
  open,
  onClose,
  record,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  record: Deployment | null;
  onSave: (r: Deployment) => void;
}) {
  const [service, setService] = useState(record?.service || "api-gateway");
  const [release, setRelease] = useState(record?.release || "");
  const [environment, setEnvironment] = useState(record?.environment || "Staging");
  const [pipeline, setPipeline] = useState(record?.pipeline || "Edge & routing");
  const [commit, setCommit] = useState(record?.commit || "");
  const [note, setNote] = useState(record?.note || "");
  return (
    <SideForm
      title={record ? "Deployment details" : "New deployment"}
      description=""
      className="wf-deployment-sheet"
      open={open}
      onClose={onClose}
      submit={record ? "Save changes" : "Create deployment"}
      onSubmit={() =>
        onSave({
          ...record,
          id: record?.id || "",
          date: record?.date || "",
          owner: record?.owner || "",
          team: record?.team || "",
          duration: record?.duration || "",
          status: record?.status || "Running",
          service,
          release,
          environment,
          pipeline,
          commit,
          note,
        })
      }
    >
      <label>
        Service
        <Input required value={service} onChange={(e) => setService(e.target.value)} />
      </label>
      <label>
        Release
        <Input
          required
          value={release}
          onChange={(e) => setRelease(e.target.value)}
          placeholder="v2.14.0"
        />
      </label>
      <label>
        Environment
        <Choice
          label="Environment"
          value={environment}
          onChange={setEnvironment}
          items={["Staging", "Production", "Canary", "Preview"]}
        />
      </label>
      <label>
        Pipeline
        <Input required value={pipeline} onChange={(e) => setPipeline(e.target.value)} />
      </label>
      <label>
        Commit
        <Input placeholder="9f2c1ab" value={commit} onChange={(e) => setCommit(e.target.value)} />
      </label>
      <label>
        Note
        <Textarea
          placeholder="What this release changes, or why it was rolled back."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
    </SideForm>
  );
}
