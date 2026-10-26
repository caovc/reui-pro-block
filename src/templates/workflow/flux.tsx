import { FluxSpend, FluxTokenAudit } from "./flux-costs";
import { useFluxCostModel } from "./flux-cost-models";
import { AiOperations } from "./ai-operations";
import { useAiOperationsModel } from "./ai-operations-model";
import { FluxConnections } from "./flux-providers";
import { FluxRouting } from "./flux-routing";
import { useFluxProviderModel } from "./flux-provider-models";
import { FluxEvaluations } from "./flux-evaluations";
import { FluxMemory } from "./flux-memory";
import { useFluxEvidenceModel } from "./flux-evidence-models";
import { useFluxFlagsModel } from "./workflow-models";
import { useState } from "react";
import {
  Activity,
  Bot,
  Brain,
  Check,
  CircleDollarSign,
  FlaskConical,
  Flag,
  LayoutDashboard,
  Play,
  Plus,
  Server,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Wrench,
  Zap,
} from "lucide-react";
import {
  Shell,
  Panel,
  Button,
  Status,
  Chart,
  Detail,
  ExportButton,
  WorkspaceSettings,
} from "./shared";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { IconTile } from "@/components/reui/icon-tile";
import { Choice } from "./controls";
import { RunTree } from "./run-tree";
import { ApprovalInbox } from "./approvals";
import { FluxFlags } from "./flux-flags";
const agentSeed = ["Refund Triage", "Invoice Reconciler", "Support Router", "Contract Reader"];
const incidents = [
  {
    name: "Payment Tool Timeout",
    risk: "Critical",
    agent: "Refund Resolver",
    time: "09:12",
    description:
      "The billing API exceeded its 8s budget on 6 consecutive calls, holding 4 runs at the charge step.",
  },
  {
    name: "Retry Storm Contained",
    risk: "Major",
    agent: "Invoice Reconciler",
    time: "08:47",
    description:
      "Backoff was applied after a vendor 503 spike, capping retries and clearing the queued run backlog.",
  },
  {
    name: "Vector Store Degraded",
    risk: "Minor",
    agent: "Lead Enricher",
    time: "08:05",
    description:
      "Read latency on the embeddings index rose to 1.9s, slowing enrichment lookups before it recovered.",
  },
];
export default function Flux() {
  const costModel = useFluxCostModel();
  const operationsModel = useAiOperationsModel();
  const providerModel = useFluxProviderModel();
  const evidenceModel = useFluxEvidenceModel();
  const flagRecords = useFluxFlagsModel();
  const [view, setView] = useState("Overview");
  const [agents] = useState(agentSeed);
  const [riskOnly, setRiskOnly] = useState(false);
  const [period, setPeriod] = useState("Last 24 hours");
  const [selected, setSelected] = useState("");
  const [tools, setTools] = useState(["orders.read", "payments.refund", "knowledge.search"]);
  const tree = <RunTree open={setSelected} initialRisk={riskOnly} />;
  return (
    <Shell
      brand="AgentOps"
      view={view}
      setView={setView}
      nav={[
        { label: "Overview", icon: LayoutDashboard },
        { label: "Runs", icon: Play },
        { label: "Approvals", icon: ShieldCheck, count: "8" },
        { label: "Evals", icon: FlaskConical },
        { label: "Flags", icon: Flag },
        { label: "Memory", icon: Brain },
        { label: "Tools", icon: Wrench },
        {
          label: "Providers",
          icon: Server,
          children: ["Connections", "Routing rules", "Failover"],
        },
        { label: "Costs", icon: CircleDollarSign, children: ["Spend overview", "Token audit"] },
        { label: "Settings", icon: Settings },
      ]}
      extra={
        <>
          <div className="wf-nav-group">
            <p>Quick links</p>
            {["Failures", "Connections", "Routing rules", "Spend overview", "Token audit"].map(
              (x) => (
                <Button
                  key={x}
                  variant="ghost"
                  className="wf-nav-button"
                  onClick={() => {
                    setView(x === "Failures" ? "Runs" : x);
                    setRiskOnly(x === "Failures");
                  }}
                >
                  <Activity />
                  {x}
                </Button>
              ),
            )}
          </div>
          <div className="wf-usage">
            <strong>Spending Limit</strong>
            <p>$95.10 of $144.09 this period. Resets Oct 23.</p>
            <div className="wf-progress">
              <i style={{ width: "66%" }} />
            </div>
            <p>
              66% Used <span>34% Free</span>
            </p>
          </div>
        </>
      }
      actions={
        <Button size="sm" variant="outline" onClick={() => setSelected("System status")}>
          <Activity />
          System Status
        </Button>
      }
    >
      {view === "Overview" ? (
        <>
          <div className="wf-page-heading">
            <div>
              <h1>
                Agent Operations <span className="wf-live">● Live</span>
              </h1>
              <p>Live run health, approvals, and incidents</p>
            </div>
            <div className="wf-inline">
              <Choice
                label="Activity period"
                value={period}
                onChange={setPeriod}
                items={["Last 24 hours", "Last 7 days"]}
              />
              <Button
                onClick={() =>
                  toast.info("New agent", {
                    description:
                      "Open the agent builder to configure tools, guardrails, and approval gates.",
                  })
                }
              >
                <Plus />
                New Agent
              </Button>
            </div>
          </div>
          <div className="wf-grid wf-four">
            {[
              {
                title: "Autonomous Runs",
                sub: `${period === "Last 24 hours" ? "1,263" : "8,841"} runs, 96% clean`,
                icon: Zap,
              },
              { title: "Approval Backlog", sub: "12 pending, oldest 38m", icon: ShieldCheck },
              { title: "Tool Reliability", sub: "96.2% of calls succeeded", icon: Wrench },
              { title: "Open Incidents", sub: "1 active, 2 resolved", icon: TriangleAlert },
            ].map(({ title, sub, icon: Icon }, i) => (
              <Panel key={title} title={title} description={sub}>
                <IconTile variant="soft" className={`wf-feature-icon wf-feature-${i}`}>
                  <Icon />
                </IconTile>
              </Panel>
            ))}
          </div>
          <div className="wf-grid wf-wide">
            <Panel title="Run Throughput" action={<Status>{period}</Status>}>
              <div className="wf-runway-metrics">
                {[
                  ["Completed", "1,041"],
                  ["Running", "105"],
                  ["Waiting", "66"],
                  ["Failed", "51"],
                ].map(([x, n]) => (
                  <div key={x}>
                    <p>{x}</p>
                    <strong>{n}</strong>
                    <span className={`wf-change ${x === "Completed" ? "" : "negative"}`}>
                      ↗ {x === "Completed" || x === "Running" ? "6" : x === "Waiting" ? "14" : "16"}
                      %
                    </span>
                  </div>
                ))}
              </div>
              <Chart kind="flux" color="var(--chart-2)" mode="layers" height={260} />
            </Panel>
            <Panel
              title="Incident Activity"
              action={<ExportButton name="incidents" rows={incidents} />}
            >
              <div className="wf-incidents">
                {incidents.map((item, i) => (
                  <button
                    key={item.name}
                    className="wf-incident"
                    onClick={() => setSelected(item.name)}
                  >
                    <span className="wf-incident-dot">
                      {i === 0 ? <Activity className="size-4" /> : <Check className="size-4" />}
                    </span>
                    <div>
                      <strong>
                        {item.name} <Status>{item.risk}</Status>
                      </strong>
                      <small className="wf-sub">
                        {item.agent} / {item.time}
                      </small>
                      <p>{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
          {tree}
        </>
      ) : view === "Runs" ? (
        tree
      ) : view === "Settings" ? (
        <WorkspaceSettings />
      ) : view === "Evals" ? (
        <FluxEvaluations model={evidenceModel} />
      ) : view === "Memory" ? (
        <FluxMemory model={evidenceModel} />
      ) : view === "Flags" ? (
        <FluxFlags records={flagRecords} />
      ) : view === "Approvals" ? (
        <ApprovalInbox />
      ) : view === "Connections" || view === "Providers" ? (
        <FluxConnections model={providerModel} />
      ) : view === "Failover" ? (
        <AiOperations model={operationsModel} />
      ) : view === "Routing rules" ? (
        <FluxRouting model={providerModel} />
      ) : view === "Tools" ? (
        <Panel
          title={view === "Tools" ? "Tool matrix" : "Provider routing"}
          description="Manage capabilities available to your agents."
        >
          {(view === "Tools"
            ? [
                "orders.read",
                "payments.refund",
                "knowledge.search",
                "email.send",
                "customer.update",
              ]
            : ["OpenAI", "Anthropic", "Google Gemini"]
          ).map((name) => (
            <div className="wf-list-row" key={name}>
              <Wrench className="size-5" />
              <div>
                <strong>{name}</strong>
                <small className="wf-sub">Production · Policy enforced</small>
              </div>
              <Switch
                aria-label={`Enable ${name}`}
                checked={tools.includes(name)}
                onCheckedChange={(v) =>
                  setTools(v ? [...tools, name] : tools.filter((x) => x !== name))
                }
              />
              <Button variant="outline" size="sm" onClick={() => setSelected(name)}>
                Configure
              </Button>
            </div>
          ))}
        </Panel>
      ) : view === "Costs" || view === "Spend overview" ? (
        <FluxSpend model={costModel} />
      ) : view === "Token audit" ? (
        <FluxTokenAudit model={costModel} />
      ) : (
        <Panel
          title={view}
          description={`Manage your agent ${view.toLowerCase()} across the Atlas workspace.`}
        >
          {agents.map((name, i) => (
            <div className="wf-list-row" key={name}>
              <Bot className="size-5" />
              <div>
                <strong>{name}</strong>
                <small className="wf-sub">
                  {view === "Evals"
                    ? `Evaluation suite · ${96 + i}% passing`
                    : "Production · Updated 2h ago"}
                </small>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelected(name)}>
                Inspect
              </Button>
            </div>
          ))}
        </Panel>
      )}
      <Detail title={selected} open={!!selected} onClose={() => setSelected("")}>
        <div className="flex flex-col gap-4 p-4">
          <Status>
            {selected === "System status" ? "All systems operational" : "Needs review"}
          </Status>
          <p>
            {incidents.find((x) => x.name === selected)?.description ||
              "Atlas workspace · Production environment. Inspect the execution trace and policy decisions for this record."}
          </p>
          <h3>Execution trace</h3>
          {[
            "Request received",
            "Policy constraints checked",
            "Tool execution completed",
            "Response delivered",
          ].map((x, i) => (
            <div className="wf-list-row" key={x}>
              <Check className="size-4" />
              <span>{x}</span>
              <small>{i + 1}.2s</small>
            </div>
          ))}
          <Button
            onClick={() => {
              toast.success("Run replay completed in local demo");
              setSelected("");
            }}
          >
            <Play />
            Replay run
          </Button>
        </div>
      </Detail>
    </Shell>
  );
}
