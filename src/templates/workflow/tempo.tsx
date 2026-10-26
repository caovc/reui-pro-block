import { AiOperations } from "./ai-operations";
import { useAiOperationsModel } from "./ai-operations-model";
import { useTempoReportsModel } from "./workflow-models";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleUser,
  Clock,
  Filter,
  Home,
  ListTodo,
  Plus,
  Settings,
  Target,
  TriangleAlert,
} from "lucide-react";
import {
  Shell,
  Panel,
  Button,
  Input,
  Status,
  Chart,
  Spark,
  Segments,
  Detail,
  WorkspaceSettings,
} from "./shared";
import { TempoReports } from "./tempo-reports";
import { TempoCalendar } from "./tempo-calendar";
import { toast } from "sonner";
import { WorkflowGrid, type WorkflowField } from "./grid";
import { Person } from "./controls";
import { ProjectBoard, DeliverableForm } from "./boards";
const seed = [
  {
    id: "TASK-2053",
    name: "Add usage analytics events",
    owner: "Alex Johnson",
    team: "Platform",
    progress: 84,
    estimate: 20,
    status: "In Progress",
    ref: "PLT-91",
  },
  {
    id: "TASK-2052",
    name: "Fix flaky e2e suite",
    owner: "Sana Qureshi",
    team: "Ops",
    progress: 35,
    estimate: 16,
    status: "Blocked",
    ref: "OPS-12",
  },
  {
    id: "TASK-2049",
    name: "Rework onboarding flow",
    owner: "Leo Grant",
    team: "Platform",
    progress: 62,
    estimate: 12,
    status: "In Progress",
    ref: "PLT-88",
  },
  {
    id: "TASK-2048",
    name: "Ship responsive nav bar",
    owner: "Mira Stone",
    team: "Product",
    progress: 100,
    estimate: 8,
    status: "Done",
    ref: "WEB-142",
  },
  {
    id: "TASK-2050",
    name: "Audit permission checks",
    owner: "Nora Vale",
    team: "Growth",
    progress: 40,
    estimate: 6,
    status: "Review",
    ref: "SEC-30",
  },
  {
    id: "TASK-2051",
    name: "Document release checklist",
    owner: "Ada Brooks",
    team: "Product",
    progress: 15,
    estimate: 4,
    status: "Todo",
    ref: "DOC-18",
  },
];
export default function Tempo() {
  const operationsModel = useAiOperationsModel();
  const segmentRecords = useTempoReportsModel();
  const [view, setView] = useState("Home");
  const [reportView, setReportView] = useState("Analytics");
  const [period, setPeriod] = useState("Week");
  const [rows, setRows] = useState(seed);
  const [query, setQuery] = useState("");
  const [exception, setException] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const [selected, setSelected] = useState("");
  const [taskView, setTaskView] = useState("List");
  const filtered = rows.filter(
    (r) =>
      `${r.name} ${r.owner} ${r.id}`.toLowerCase().includes(query.toLowerCase()) &&
      (!exception || r.status === "Blocked"),
  );
  const taskFields: WorkflowField<(typeof seed)[number]>[] = [
    {
      key: "id",
      title: "Task",
      size: 140,
      render: (r) => (
        <>
          <button className="wf-text-button" onClick={() => setSelected(r.id)}>
            {r.id}
          </button>
          <small className="wf-sub">Oct 20, 2026</small>
        </>
      ),
    },
    {
      key: "owner",
      title: "Assignee",
      size: 250,
      render: (r) => (
        <>
          <Person name={r.owner} />
          <small className="wf-sub wf-person-sub">{r.team}</small>
        </>
      ),
    },
    {
      key: "name",
      title: "Deliverable",
      size: 210,
      render: (r) => (
        <>
          <button className="wf-text-button" onClick={() => setSelected(r.id)}>
            {r.name}
          </button>
          <small className="wf-sub">{r.ref}</small>
        </>
      ),
    },
    {
      key: "progress",
      title: "Progress",
      size: 200,
      render: (r) => (
        <>
          {r.status}
          <div className="wf-inline">
            <div className="wf-progress">
              <i
                style={{
                  width: r.progress + "%",
                  background: r.status === "Blocked" ? "var(--destructive)" : "var(--wf-amber)",
                }}
              />
            </div>
            <small className="wf-muted">{r.progress}%</small>
          </div>
        </>
      ),
    },
    {
      key: "estimate",
      title: "Estimate",
      size: 130,
      render: (r) => (
        <>
          {r.estimate}h
          <small className="wf-sub">{Math.max(1, Math.floor(r.estimate / 5))} subtasks</small>
        </>
      ),
    },
    { key: "status", title: "Status", size: 150, render: (r) => <Status>{r.status}</Status> },
    {
      key: "actions",
      title: "",
      size: 60,
      render: (r) => (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Complete ${r.id}`}
          onClick={() => {
            setRows(rows.map((x) => (x.id === r.id ? { ...x, status: "Done", progress: 100 } : x)));
            toast.success("Task completed");
          }}
        >
          <CheckCircle2 />
        </Button>
      ),
    },
  ];
  const taskTable = (
    <Panel
      className="wf-edge-table wf-tempo-queue"
      title="Task Queue"
      description={`${filtered.length} of ${rows.length} tasks`}
      action={
        <div className="wf-inline">
          <Input
            aria-label="Search tasks"
            placeholder="Search tasks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            variant={exception ? "secondary" : "outline"}
            size="sm"
            onClick={() => setException(!exception)}
          >
            <Filter />
            Exceptions
          </Button>
          <Button size="sm" onClick={() => setNewTask(true)}>
            <Plus />
            New task
          </Button>
        </div>
      }
    >
      <WorkflowGrid rows={filtered} fields={taskFields} pageSize={6} />
    </Panel>
  );
  return (
    <Shell
      brand="ReUI"
      dark
      view={view}
      setView={setView}
      nav={[
        { label: "Home", icon: Home },
        { label: "Tasks", icon: ListTodo },
        { label: "Reports", icon: BarChart3 },
        { label: "Settings", icon: Settings },
      ]}
      taskNavigation={
        view === "Tasks" ? (
          <div className="wf-task-subnav">
            {["My tasks", "Team tasks", "Board", "Calendar"].map((x) => (
              <Button
                key={x}
                variant={taskView === x ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTaskView(x.includes("tasks") ? "List" : x)}
              >
                {x}
              </Button>
            ))}
          </div>
        ) : undefined
      }
      extra={
        <>
          {view === "Reports" && (
            <div className="wf-task-subnav">
              {["Activity", "Analytics", "AI Ops"].map((label) => (
                <Button
                  key={label}
                  variant={reportView === label ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setReportView(label)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}

          <div className="wf-nav-group">
            <p>Saved Views</p>
            {[
              { label: "Assigned to me", icon: CircleUser, count: "12" },
              { label: "Active sprint", icon: Activity, count: "24" },
              { label: "Week ahead", icon: CalendarDays, count: "8" },
              { label: "Recent activity", icon: Clock, count: "4" },
            ].map(({ label, icon: Icon, count }) => (
              <Button
                key={label}
                variant="ghost"
                className="wf-nav-button"
                onClick={() => {
                  setView("Tasks");
                  setTaskView(
                    label === "Week ahead"
                      ? "Calendar"
                      : label === "Active sprint"
                        ? "Board"
                        : "List",
                  );
                  setQuery(label === "Assigned to me" ? "Alex" : "");
                }}
              >
                <Icon />
                {label}
                <small>{count}</small>
              </Button>
            ))}
          </div>
          <div className="wf-usage">
            <strong>Usage Limit</strong>
            <p>Your usage resets at the end of the month</p>
            <div className="wf-progress">
              <i style={{ width: "82%" }} />
            </div>
            <p>
              82% Used <span>18% Free</span>
            </p>
          </div>
        </>
      }
    >
      {view === "Reports" ? (
        reportView === "Activity" ? (
          <TempoCalendar />
        ) : reportView === "AI Ops" ? (
          <AiOperations model={operationsModel} variant="tempo" />
        ) : (
          <TempoReports records={segmentRecords} />
        )
      ) : view === "Home" ? (
        <>
          <Panel
            title="Performance Overview"
            action={
              <Segments items={["Week", "Month", "Year"]} value={period} onChange={setPeriod} />
            }
          >
            <div className="wf-grid wf-four wf-performance">
              {[
                {
                  label: "Tasks Completed",
                  value: period === "Week" ? "128" : period === "Month" ? "512" : "6,144",
                  change: "+8.2%",
                  note: "Above target",
                  icon: CheckCircle2,
                },
                {
                  label: "In Progress",
                  value: "34",
                  change: "+5.1%",
                  note: "On pace",
                  icon: Clock,
                },
                {
                  label: "Overdue",
                  value: "6",
                  change: "-2",
                  note: "Needs attention",
                  icon: TriangleAlert,
                },
                {
                  label: "On-Time Rate",
                  value: "92%",
                  change: "+1.4%",
                  note: "Healthy",
                  icon: Target,
                },
              ].map(({ label, value, change, note, icon: Icon }, i) => (
                <div key={label}>
                  <span className="wf-inline">
                    <Icon className="size-4" />
                    {label}
                  </span>
                  <div className="wf-inline wf-between">
                    <strong className="wf-stat-value">{value}</strong>
                    <Spark color="var(--muted-foreground)" variant={i} />
                  </div>
                  <p className="wf-muted">
                    <Status>{change}</Status>　{note}
                  </p>
                </div>
              ))}
            </div>
            <div className="wf-summary">
              <span>128 tasks were completed this week, 8% above target across all projects.</span>
              <Button variant="ghost" size="sm" onClick={() => setView("Reports")}>
                Show full analytics
                <ArrowRight />
              </Button>
            </div>
          </Panel>
          <div className="wf-grid wf-wide">
            <Panel
              title="Completion Pace"
              description="Tasks completed vs target"
              action={
                <div className="wf-tempo-legend">
                  <span>● Completed</span>
                  <span>● In Progress</span>
                  <span>● Target</span>
                </div>
              }
            >
              <div className="wf-runway-metrics">
                <div>
                  <p>Completed</p>
                  <strong>128</strong>
                </div>
                <div>
                  <p>vs Target</p>
                  <strong>+10</strong>
                </div>
                <div>
                  <p>On-Time</p>
                  <strong>
                    70<small> 55%</small>
                  </strong>
                </div>
              </div>
              <Chart kind="tempo" mode="layers" color="var(--chart-2)" height={270} />
            </Panel>
            <Panel title="Workload by Project" description="Daily task share">
              <div className="wf-runway-metrics">
                <div>
                  <p>Latest Tasks</p>
                  <strong>46</strong>
                </div>
                <div>
                  <p>Product Share</p>
                  <strong>39%</strong>
                </div>
              </div>
              <p className="wf-muted">● Product　 ● Platform　 ● Growth</p>
              <div className="wf-workload-bars">
                {["Fri", "Sat", "Sun", "Mon"].map((x, i) => (
                  <div key={x}>
                    <div>
                      <i style={{ height: 45 - i * 2 + "%" }} />
                      <i style={{ height: 24 + i * 2 + "%" }} />
                      <i />
                    </div>
                    <span>{x}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          {taskTable}
        </>
      ) : view === "Settings" ? (
        <WorkspaceSettings />
      ) : (
        <>
          <div
            className={`wf-page-heading ${taskView === "Board" ? "wf-board-toolbar" : taskView === "Calendar" ? "wf-calendar-heading" : ""}`}
          >
            <div>
              {taskView === "Board" ? (
                <p>24 tasks across 5 columns</p>
              ) : (
                <h1>Tasks – {taskView}</h1>
              )}
            </div>
            <Button onClick={() => setNewTask(true)}>
              <Plus />
              New task
            </Button>
          </div>
          {taskView === "List" ? (
            taskTable
          ) : taskView === "Board" ? (
            <ProjectBoard
              kind="tempo"
              createOpen={newTask}
              onCreateClose={() => setNewTask(false)}
            />
          ) : (
            <TempoCalendar />
          )}
        </>
      )}
      {(view !== "Tasks" || taskView !== "Board") && (
        <DeliverableForm
          open={newTask}
          onClose={() => setNewTask(false)}
          onCreate={(value) => {
            setRows([...rows, { ...value, id: `TASK-${2054 + rows.length - seed.length}` }]);
            setView("Tasks");
            setTaskView("List");
          }}
        />
      )}
      <Detail title={selected} open={!!selected} onClose={() => setSelected("")}>
        <div className="flex flex-col gap-4 p-4">
          <h2>{rows.find((x) => x.id === selected)?.name}</h2>
          <Status>{rows.find((x) => x.id === selected)?.status}</Status>
          <p>Owner: {rows.find((x) => x.id === selected)?.owner}</p>
          <p>Deliverable: {rows.find((x) => x.id === selected)?.ref}</p>
          <label className="flex flex-col gap-2">
            Task title
            <Input
              value={rows.find((x) => x.id === selected)?.name || ""}
              onChange={(e) =>
                setRows(rows.map((x) => (x.id === selected ? { ...x, name: e.target.value } : x)))
              }
            />
          </label>
          <Button
            onClick={() => {
              setRows(
                rows.map((x) => (x.id === selected ? { ...x, status: "Done", progress: 100 } : x)),
              );
              setSelected("");
            }}
          >
            Mark complete
          </Button>
        </div>
      </Detail>
    </Shell>
  );
}
