import { useFlowlyAgentsModel } from "./workflow-models";
import { useState } from "react";
import FlowCanvas from "@/blocks/application/flow-gantt-flow";
import { FlowlyAgents } from "./flowly-agents";
import {
  ArrowRight,
  Bot,
  Brain,
  Filter,
  MoreHorizontal,
  Star,
  GitBranch,
  LayoutDashboard,
  Pencil,
  Plus,
  Settings,
  Workflow,
} from "lucide-react";
import {
  Shell,
  Panel,
  Stat,
  Button,
  Input,
  Status,
  Segments,
  CreateDialog,
  WorkspaceSettings,
} from "./shared";
import { toast } from "sonner";
import { WorkflowGrid, type WorkflowField } from "./grid";
import { Person } from "./controls";
import { workflowLogos } from "./workflow-logos";
import "./flowly-dashboard.css";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { WorkflowList, WorkflowCreate, type WorkflowRecord } from "./flowly-workflows";
const seed = [
  {
    name: "Churn Risk Digest",
    owner: "Omar Haddad",
    trigger: "Schedule",
    rate: 100,
    runs: "4/4 runs",
    date: "Oct 05, 07:00",
    schedule: "Mondays at 07:00",
    status: "Active",
    path: "success/churn-digest",
  },
  {
    name: "Contract Sync",
    owner: "Lena Wade",
    trigger: "Webhook",
    rate: 88,
    runs: "211/240 runs",
    date: "Oct 04, 16:21",
    schedule: "On signed contract",
    status: "Paused",
    path: "legal/contract-sync",
  },
  {
    name: "Data Warehouse Export",
    owner: "Omar Haddad",
    trigger: "Schedule",
    rate: 93,
    runs: "626/672 runs",
    date: "Oct 06, 09:00",
    schedule: "Every hour",
    status: "Active",
    path: "data/warehouse-export",
  },
  {
    name: "Expense Approvals",
    owner: "Lena Wade",
    trigger: "Webhook",
    rate: 0,
    runs: "0/0 runs",
    date: "Not run yet",
    schedule: "On expense filed",
    status: "Paused",
    path: "finance/expense-approvals",
  },
  {
    name: "Inventory Restock",
    owner: "Tomas Lindqvist",
    trigger: "Schedule",
    rate: 82,
    runs: "23/28 runs",
    date: "Oct 06, 06:00",
    schedule: "Daily at 06:00",
    status: "Active",
    path: "ops/inventory-restock",
  },
  {
    name: "Invoice Reminders",
    owner: "Tomas Lindqvist",
    trigger: "Schedule",
    rate: 100,
    runs: "28/28 runs",
    date: "Oct 06, 08:00",
    schedule: "Daily at 08:00",
    status: "Active",
    path: "billing/invoice-reminders",
  },
  {
    name: "Lead Routing",
    owner: "Ines Marchetti",
    trigger: "Webhook",
    rate: 98,
    runs: "1,184/1,208 runs",
    date: "Oct 06, 09:42",
    schedule: "On new lead",
    status: "Active",
    path: "crm/lead-routing",
  },
  {
    name: "Meeting Notes to CRM",
    owner: "Nick Bold",
    trigger: "Event",
    rate: 64,
    runs: "118/184 runs",
    date: "Oct 06, 09:10",
    schedule: "On call ended",
    status: "Failing",
    path: "sales/meeting-notes",
  },
  {
    name: "Onboarding Emails",
    owner: "Hanna Berg",
    trigger: "Event",
    rate: 97,
    runs: "451/465 runs",
    date: "Oct 06, 09:28",
    schedule: "On signup",
    status: "Active",
    path: "growth/onboarding-emails",
  },
  {
    name: "Order Fulfillment",
    owner: "Tomas Lindqvist",
    trigger: "Event",
    rate: 99,
    runs: "3,912/3,946 runs",
    date: "Oct 06, 09:44",
    schedule: "On paid order",
    status: "Active",
    path: "ops/order-fulfillment",
  },
  {
    name: "Social Mentions Alert",
    owner: "Ines Marchetti",
    trigger: "Event",
    rate: 76,
    runs: "302/397 runs",
    date: "Oct 06, 09:31",
    schedule: "On brand mention",
    status: "Failing",
    path: "marketing/mentions-alert",
  },
  {
    name: "Support Triage",
    owner: "Hanna Berg",
    trigger: "Event",
    rate: 71,
    runs: "642/904 runs",
    date: "Oct 06, 09:37",
    schedule: "On new ticket",
    status: "Failing",
    path: "support/triage",
  },
];
export default function Flowly() {
  const agentRecords = useFlowlyAgentsModel();
  const [view, setView] = useState("Dashboard");
  const [extraWorkflows, setExtraWorkflows] = useState<WorkflowRecord[]>([]);
  const [rows, setRows] = useState(seed);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(false);
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState("");
  const [chart, setChart] = useState("Runs");
  const [invite, setInvite] = useState(false);
  const [stars, setStars] = useState<string[]>([]);
  const list = rows.filter(
    (r) => r.name.toLowerCase().includes(query.toLowerCase()) && (!filter || r.status === "Active"),
  );
  const fields: WorkflowField<(typeof seed)[number] & { id: string }>[] = [
    {
      key: "rate",
      title: "Success",
      size: 210,
      render: (r) => (
        <div className="wf-inline">
          <span
            className="wf-ring"
            style={
              {
                "--ring-color":
                  r.rate === 100
                    ? "var(--wf-green)"
                    : r.rate === 0
                      ? "var(--border)"
                      : "var(--wf-amber)",
              } as React.CSSProperties
            }
          >
            {r.rate}%
          </span>
          <div>
            <strong>{r.rate ? r.rate + "% success" : "No runs"}</strong>
            <small className="wf-sub">{r.runs}</small>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      title: "Workflow",
      size: 300,
      render: (r) => (
        <>
          <button
            className="wf-text-button"
            onClick={() => {
              setSelected(r.name);
              setView("Workflow");
            }}
          >
            {r.name}
          </button>
          <small className="wf-sub wf-workflow-meta">
            {r.trigger} · <Person name={r.owner} index={4} /> · <code>{r.path}</code>
          </small>
        </>
      ),
    },
    {
      key: "date",
      title: "Last run",
      size: 180,
      render: (r) => (
        <>
          {r.date}
          <small className="wf-sub">◷ {r.schedule}</small>
        </>
      ),
    },
    { key: "status", title: "Status", size: 126, render: (r) => <Status>{r.status}</Status> },
    {
      key: "actions",
      title: "Actions",
      size: 104,
      sortable: false,
      render: (r) => (
        <div className="wf-inline">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${r.name}`}
            onClick={() => {
              setSelected(r.name);
              setView("Workflow");
            }}
          >
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Star ${r.name}`}
            aria-pressed={stars.includes(r.name)}
            onClick={() =>
              setStars(
                stars.includes(r.name) ? stars.filter((x) => x !== r.name) : [...stars, r.name],
              )
            }
          >
            <Star fill={stars.includes(r.name) ? "currentColor" : "none"} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions ${r.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => {
                  setSelected(r.name);
                  setView("Workflow");
                }}
              >
                Open workflow
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  setRows(
                    rows.map((x) =>
                      x.name === r.name
                        ? { ...x, status: x.status === "Active" ? "Paused" : "Active" }
                        : x,
                    ),
                  )
                }
              >
                {r.status === "Active" ? "Pause" : "Activate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  const table = (
    <Panel
      className="wf-edge-table wf-health-table"
      title="Production　›　Workflows"
      action={
        <div className="wf-inline">
          <Input
            aria-label="Search workflows"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={() => setRows([...rows].reverse())}>
            ↕ Name
          </Button>
          <Button
            variant={filter ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilter(!filter)}
          >
            <Filter />
            Filters{filter ? " · Active" : ""}
          </Button>
        </div>
      }
    >
      <WorkflowGrid
        key={`${query}:${filter}`}
        rows={list.map((r) => ({ ...r, id: r.name }))}
        fields={fields}
        pageSize={5}
        layout="fixed"
        dense
        preservePage
      />
    </Panel>
  );
  return (
    <Shell
      brand="Flowly"
      compact
      view={view}
      setView={setView}
      nav={[
        { label: "Dashboard", icon: LayoutDashboard },
        { label: "Workflow", icon: Workflow },
        { label: "Agent Builder", icon: Bot },
        { label: "Workflows", icon: GitBranch },
        { label: "Agents", icon: Bot },
        { label: "Runs", icon: Workflow },
        { label: "AI tools", icon: Brain },
        { label: "Settings", icon: Settings },
      ]}
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => setInvite(true)}>
            Invite
          </Button>
          <Button
            onClick={() => {
              setView("Workflows");
              setCreate(true);
            }}
          >
            <Plus />
            {view === "Dashboard" ? "Add Workflow" : "New workflow"}
          </Button>
        </>
      }
    >
      {view === "Dashboard" ? (
        <>
          <div className="wf-grid wf-four">
            <Stat
              period="Now"
              label="Workflow Health"
              value="6/12"
              sub="8 healthy yesterday"
              icon={Workflow}
            >
              <div className="wf-health">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="wf-two-col wf-muted">
                <span>● Healthy　6</span>
                <span>● Degraded　1</span>
                <span>● Failing　3</span>
                <span>● Paused　2</span>
              </div>
              <Button
                variant="ghost"
                className="wf-full-link"
                onClick={() => {
                  setSelected("Support Triage");
                  setView("Workflow");
                }}
              >
                View Support Triage
                <ArrowRight />
              </Button>
            </Stat>
            <Stat period="Now" label="Live Agents" value="6/12" sub="5 live last week" icon={Bot}>
              <div className="wf-health wf-violet">
                <i />
                <i />
                <i />
              </div>
              <div className="wf-two-col wf-muted">
                <span>● Live　6</span>
                <span>● Need review　2</span>
                <span>● Draft or paused　4</span>
              </div>
              <Button variant="ghost" className="wf-full-link" onClick={() => setView("Agents")}>
                Review Invoice Reconciler
                <ArrowRight />
              </Button>
            </Stat>
            <Stat period="14 days" label="Workflow Runs" value="278" sub="264 yesterday">
              <svg
                className="wf-spark"
                viewBox="0 0 300 65"
                aria-label="Workflow runs over 14 days"
              >
                <defs>
                  <linearGradient id="wf-run-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity=".2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 18 Q20 12 35 20 T62 17 T92 18 T113 29 T139 20 T171 16 T197 17 T222 13 T250 17 T276 17 T300 14 V65 H0Z"
                  fill="url(#wf-run-gradient)"
                />
                <path
                  d="M0 18 Q20 12 35 20 T62 17 T92 18 T113 29 T139 20 T171 16 T197 17 T222 13 T250 17 T276 17 T300 14"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.3"
                />
              </svg>
              <Button variant="ghost" className="wf-full-link" onClick={() => setView("Runs")}>
                View Order Fulfillment
                <ArrowRight />
              </Button>
            </Stat>
            <Stat period="14 days" label="Failed Runs" value="18" sub="6 yesterday, 84 in 14 days">
              <div className="wf-mini-bars">
                {[3, 5, 2, 4, 6, 3, 2, 4, 2, 7, 6, 3, 5, 14].map((v, i) => (
                  <i key={i} style={{ "--bar-height": `${v * 3 + 8}px` } as React.CSSProperties} />
                ))}
              </div>
              <Button variant="ghost" className="wf-full-link" onClick={() => setView("Runs")}>
                View Support Triage
                <ArrowRight />
              </Button>
            </Stat>
          </div>
          <div className="wf-grid wf-wide">
            <Panel
              title="Run Activity"
              description="278 runs in 24 hours, 93.5% succeeded"
              action={
                <div className="wf-inline">
                  <div className="wf-chart-legend">
                    <span>
                      <i />
                      Succeeded
                    </span>
                    <span>
                      <i />
                      Slow
                    </span>
                    <span>
                      <i />
                      Failed
                    </span>
                  </div>
                  <Segments items={["Runs", "Steps"]} value={chart} onChange={setChart} />
                </div>
              }
            >
              <div className="wf-run-bars">
                {[
                  8, 12, 13, 10, 12, 10, 14, 10, 11, 12, 15, 9, 12, 10, 12, 11, 12, 10, 10, 9, 12,
                  12, 10, 11,
                ].map((v, i) => (
                  <div key={i}>
                    <i style={{ height: `${(chart === "Runs" ? v : 16 - v) * 6}%` }} />
                    <b style={{ height: i % 3 === 0 ? "8%" : 0 }} />
                  </div>
                ))}
              </div>
              <div className="wf-axis">
                <span>13:00</span>
                <span>17:00</span>
                <span>21:00</span>
                <span>01:00</span>
                <span>05:00</span>
                <span>Now</span>
              </div>
            </Panel>
            <Panel title="Needs Attention" description="5 items, worst first">
              {[
                "Support Triage",
                "Social Mentions Alert",
                "Meeting Notes to CRM",
                "Inventory Restock",
                "Contract Sync",
              ].map((name, i) => (
                <div className="wf-list-row" key={name}>
                  <img
                    className="wf-workflow-logo"
                    src={`data:image/svg+xml,${encodeURIComponent(workflowLogos[i])}`}
                    alt=""
                  />
                  <span>{name}</span>
                  <Status>{i < 3 ? "Failing" : i === 3 ? "Degraded" : "Paused"}</Status>
                  <Button
                    aria-label={`Open ${name}`}
                    size="icon-sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(name);
                      setView("Workflow");
                    }}
                  >
                    <Pencil />
                  </Button>
                </div>
              ))}
            </Panel>
          </div>
          {table}
        </>
      ) : view === "Workflows" ? (
        <WorkflowList
          extra={extraWorkflows}
          edit={(name) => {
            setSelected(name);
            setView("Workflow");
          }}
        />
      ) : view === "Workflow" || view === "Agent Builder" ? (
        <div className="wf-integrated-editor">
          <div className="wf-editor-title">
            <h1 style={{ fontSize: 14, margin: 0 }}>
              {selected || (view === "Agent Builder" ? "Collections Agent" : "Lead Routing")}
            </h1>
            <span>Production</span>
          </div>
          <FlowCanvas
            block={{
              id: "flowly-editor",
              name: selected || "Lead Routing",
              category: "flow",
              group: "application",
              reference: "https://flowly-app.reui.io/workflow-editor",
              index: view === "Agent Builder" ? 1 : 0,
            }}
          />
        </div>
      ) : view === "Agents" ? (
        <FlowlyAgents
          records={agentRecords}
          onOpen={(name) => {
            setSelected(name);
            setView("Agent Builder");
          }}
        />
      ) : view === "Settings" ? (
        <WorkspaceSettings />
      ) : (
        <Panel
          title={view}
          description={
            view === "Agents"
              ? "Build, review, and monitor your autonomous agents."
              : "Recent activity in your production workspace."
          }
        >
          {[
            "Invoice Reconciler",
            "Support Triage",
            "Order Fulfillment",
            "Lead Enricher",
            "Contract Reader",
          ].map((x, i) => (
            <div className="wf-list-row" key={x}>
              <Bot className="size-5" />
              <div>
                <strong>{x}</strong>
                <small className="wf-sub">
                  {view === "Runs"
                    ? `RUN-00${49 + i} · ${i + 2}m ago`
                    : "Claude Sonnet · Production"}
                </small>
              </div>
              <Status>{i === 1 ? "Failed" : "Active"}</Status>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(x);
                  setView("Workflow");
                }}
              >
                Open
                <ArrowRight />
              </Button>
            </div>
          ))}
        </Panel>
      )}
      <WorkflowCreate
        open={create}
        onClose={() => setCreate(false)}
        onCreate={(record) => {
          setExtraWorkflows([record, ...extraWorkflows]);
          setSelected(record.name);
          setView("Workflow");
          toast.success("Workflow created");
        }}
      />
      <CreateDialog
        title="Invite teammate"
        label="Email address"
        open={invite}
        onClose={() => setInvite(false)}
        onCreate={() => toast.success("Demo invitation added")}
      />
    </Shell>
  );
}
