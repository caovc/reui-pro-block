import { useLucentSecurityModel, useLucentIntegrationsModel } from "./workflow-models";
import { LucentSecurity, LucentIntegrations } from "./lucent-settings";
import { useState } from "react";
import {
  Activity,
  ClipboardCheck,
  ChartPie,
  Radio,
  ChevronRight,
  Home,
  Layers,
  Plus,
  Rocket,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import {
  Shell,
  Panel,
  Button,
  Input,
  Status,
  Chart,
  Segments,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  CreateDialog,
  Detail,
  ExportButton,
  WorkspaceSettings,
  EmptyResults,
} from "./shared";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Deployments } from "./deployments";
import { Person } from "./controls";
import { serviceLogos } from "./service-logos";
const services = ["api-gateway", "orders-db", "edge-cache", "recommender"];
const initialFlags = [
  "Checkout canary routing",
  "Edge failover router",
  "Payment write guardrail",
  "Cold storage read path",
  "Async migration runner",
];
export default function Lucent() {
  const securityModel = useLucentSecurityModel();
  const integrationModel = useLucentIntegrationsModel();
  const [view, setView] = useState("Overview");
  const [period, setPeriod] = useState("30 days");
  const [query, setQuery] = useState("");
  const [flags, setFlags] = useState(initialFlags);
  const [enabled, setEnabled] = useState(["Edge failover router"]);
  const [filter, setFilter] = useState("All");
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState("");
  const [approved, setApproved] = useState<string[]>([]);
  const [renewed, setRenewed] = useState<string[]>([]);
  const [invite, setInvite] = useState(false);
  const deploymentList = (
    <Panel
      title={view === "Infrastructure" ? "Services" : "Deployment ledger"}
      description="Production delivery across all services"
      action={<ExportButton name="deployments" rows={services} />}
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search deployments"
        placeholder="Search services…"
      />
      <Table>
        <TableHeader>
          <TableRow>
            {["Service", "Version", "Environment", "Status", "Owner", ""].map((x) => (
              <TableHead key={x}>{x}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {services
            .filter((x) => x.includes(query.toLowerCase()))
            .map((x, i) => (
              <TableRow key={x}>
                <TableCell>{x}</TableCell>
                <TableCell>
                  v{3 - (i % 3)}.{14 - i}.0
                </TableCell>
                <TableCell>{i === 3 ? "Canary" : "Production"}</TableCell>
                <TableCell>
                  <Status>{i === 1 ? "Down" : i === 0 ? "Degraded" : "Healthy"}</Status>
                </TableCell>
                <TableCell>
                  {["Marcus Webb", "Rafael Duarte", "Amelia Hart", "Adam Reyes"][i]}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelected(x)}>
                    Inspect
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {!services.some((x) => x.includes(query.toLowerCase())) && (
        <EmptyResults reset={() => setQuery("")} />
      )}
    </Panel>
  );
  return (
    <Shell
      brand="DevOps"
      view={view}
      setView={setView}
      nav={[
        { label: "Overview", icon: Home },
        { label: "Delivery", icon: Rocket },
        { label: "Infrastructure", icon: Layers },
        { label: "Observability", icon: Activity },
        { label: "Reliability", icon: Shield },
      ]}
      extra={
        <div className="wf-nav-group">
          <p>Services</p>
          {services.map((x) => (
            <Button
              variant="ghost"
              className="wf-nav-button"
              key={x}
              onClick={() => setSelected(x)}
            >
              <span className="wf-service-dot" />
              {x}
            </Button>
          ))}
          <div className="wf-nav-spacer" />
          {["Integrations", "Security", "Settings"].map((x) => (
            <Button key={x} variant="ghost" className="wf-nav-button" onClick={() => setView(x)}>
              <Settings />
              {x}
            </Button>
          ))}
        </div>
      }
      actions={
        <Button variant="outline" size="sm" onClick={() => setInvite(true)}>
          <Users />
          Invite
        </Button>
      }
    >
      {view === "Overview" ? (
        <>
          <div className="wf-grid wf-three">
            <Panel icon={ClipboardCheck} title="Runbook Coverage" description="Verified services">
              <strong className="wf-stat-value">70%</strong>
              <span className="wf-muted">　+4.8%　 services with a verified runbook</span>
              <div className="wf-tick-meter">
                {Array.from({ length: 56 }, (_, i) => (
                  <i className={i < 39 ? "filled" : ""} key={i} />
                ))}
              </div>
              <p className="wf-muted">Services in scope: 10</p>
              <div className="wf-inline wf-owner-row">
                {[
                  "Marcus Webb",
                  "Klara Nowak",
                  "Rafael Duarte",
                  "Amelia Hart",
                  "Adam Reyes",
                  "Tomas Okonkwo",
                ].map((x) => (
                  <span className="wf-owner-avatar" key={x}>
                    <Person name={x} />
                  </span>
                ))}
                <span className="wf-muted">6 Owners</span>
              </div>
            </Panel>
            <Panel icon={ChartPie} title="Traffic Mix" description="Week">
              <div className="wf-traffic">
                <div className="wf-donut">
                  <span>
                    Requests<strong>185M</strong>
                  </span>
                </div>
                <div>
                  {["api-gateway", "edge-cache", "identity"].map((x, i) => (
                    <div className="wf-traffic-row" key={x}>
                      <i style={{ background: `var(--chart-${i + 1})` }} />
                      {x}
                      <span>{["92.5M", "50M", "42.5M"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel icon={Radio} title="Queue wait" description="42 queued">
              <div className="wf-queue-zone">
                <strong>Queue Lag Zone</strong>
                <div>
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <p>
                  <span>0m</span>
                  <span>15m</span>
                  <span>30m</span>
                  <span>60m</span>
                </p>
              </div>
            </Panel>
          </div>
          <div className="wf-grid wf-wide">
            <Panel
              title="Deploy Frequency"
              action={
                <Segments
                  items={["12 months", "6 months"]}
                  value={period === "6 months" ? "6 months" : "12 months"}
                  onChange={setPeriod}
                />
              }
            >
              <strong className="wf-stat-value">{period === "6 months" ? "412" : "796"}</strong>
              <span className="wf-muted">　↗ 13.4%</span>
              <Chart height={290} />
            </Panel>
            <Panel
              title="Deploys by Service"
              action={
                <Segments items={["30 days", "90 days"]} value={period} onChange={setPeriod} />
              }
            >
              {services.map((x, i) => (
                <div className="wf-list-row wf-service-row" key={x}>
                  <img
                    className="wf-service-logo"
                    src={`data:image/svg+xml,${encodeURIComponent(serviceLogos[i])}`}
                    alt=""
                  />
                  <div>
                    <strong>{x}</strong>
                    <small className="wf-sub">
                      {["Edge & routing", "Data platform", "Edge & routing", "Model serving"][i]}{" "}
                      <Status>{["↗ 8.6%", "↗ 0.5%", "↗ 10.0%", "↘ 2.3%"][i]}</Status>
                    </small>
                  </div>
                  <div className="wf-number">
                    <strong>{[279, 197, 96, 56][i] * (period === "90 days" ? 3 : 1)}</strong>
                    <small className="wf-sub">{[9, 7, 3, 2][i]}/day</small>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setView("Delivery")}>
                View all deployments
                <ChevronRight />
              </Button>
            </Panel>
          </div>
          <div className="wf-grid wf-three">
            <Panel title="Deployments Awaiting Approval">
              {["Marcus Webb", "Klara Nowak", "Rafael Duarte", "Amelia Hart", "Adam Reyes"].map(
                (name, i) => (
                  <div className="wf-list-row" key={name}>
                    <span className="wf-avatar">
                      {name
                        .split(" ")
                        .map((x) => x[0])
                        .join("")}
                    </span>
                    <div>
                      <strong>{name}</strong>
                      <small className="wf-sub">{services[i % 4]} v2.14.0 → prod</small>
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={approved.includes(name)}
                      onClick={() => setSelected(name)}
                    >
                      {approved.includes(name) ? "Approved" : "Review"}
                    </Button>
                  </div>
                ),
              )}
            </Panel>
            <Panel
              title="Pipeline Runs"
              action={<ExportButton name="pipeline-runs" rows={{ total: 925 }} />}
            >
              <div className="wf-pipeline-donut">
                <div>
                  <span>Total Runs</span>
                  <strong>925</strong>
                </div>
              </div>
              <div className="wf-chart-legend">
                <span>
                  <i />
                  Passed 87%
                </span>
                <span>
                  <i />
                  Running 8%
                </span>
                <span>
                  <i />
                  Failed 5%
                </span>
              </div>
            </Panel>
            <Panel title="Certificate Alerts" description="Next 30 days">
              <div className="wf-inline wf-between">
                <div>
                  <small className="wf-sub">MANAGED CERTS</small>
                  <strong className="wf-stat-value">312</strong>
                </div>
                <div>
                  <small className="wf-sub">EXPIRING</small>
                  <strong className="wf-stat-value">{4 - renewed.length}</strong>
                </div>
              </div>
              {["api-gateway", "payments-api", "edge-cache", "identity"].map((x, i) => (
                <div className="wf-list-row" key={x}>
                  <div>
                    <strong>{x}</strong>
                    <small className="wf-sub">
                      {renewed.includes(x)
                        ? "Valid for 90 days"
                        : `Expires in ${[3, 5, 7, 21][i]}d`}
                    </small>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={renewed.includes(x)}
                    onClick={() => {
                      setRenewed([...renewed, x]);
                      toast.success(`${x} certificate renewed in demo`);
                    }}
                  >
                    Renew
                  </Button>
                </div>
              ))}
            </Panel>
          </div>
          <Panel
            title="Delivery feature flags"
            description={`${flags.length} flags`}
            action={
              <Button size="sm" onClick={() => setCreate(true)}>
                <Plus />
                New flag
              </Button>
            }
          >
            <Segments
              items={["All", "Live", "Staged", "Review", "Paused"]}
              value={filter}
              onChange={setFilter}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  {["Flag", "Owner", "Readiness", "Stage", "Enabled"].map((x) => (
                    <TableHead key={x}>{x}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags
                  .filter(
                    (_, i) =>
                      filter === "All" ||
                      ["Staged", "Live", "Review", "Paused", "Staged"][i % 5] === filter,
                  )
                  .map((x) => {
                    const i = flags.indexOf(x);
                    return (
                      <TableRow key={x}>
                        <TableCell>
                          {x}
                          <small className="wf-sub">{services[i % 4]}</small>
                        </TableCell>
                        <TableCell>
                          {
                            [
                              "Marcus Webb",
                              "Amelia Hart",
                              "Klara Nowak",
                              "Rafael Duarte",
                              "Adam Reyes",
                            ][i % 5]
                          }
                        </TableCell>
                        <TableCell>{[4.8, 4.7, 4.3, 3.9, 4.5][i % 5]}</TableCell>
                        <TableCell>
                          <Status>{["Staged", "Live", "Review", "Paused", "Staged"][i % 5]}</Status>
                        </TableCell>
                        <TableCell>
                          <Switch
                            aria-label={`Enable ${x}`}
                            checked={enabled.includes(x)}
                            onCheckedChange={(v) =>
                              setEnabled(v ? [...enabled, x] : enabled.filter((y) => y !== x))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Panel>
        </>
      ) : view === "Delivery" ? (
        <Deployments />
      ) : view === "Security" ? (
        <LucentSecurity model={securityModel} />
      ) : view === "Settings" ? (
        <WorkspaceSettings />
      ) : view === "Integrations" ? (
        <LucentIntegrations model={integrationModel} />
      ) : (
        <>
          {deploymentList}
          {view === "Observability" && (
            <Panel title="Request latency" description="p95 across production services">
              <Chart mode="layers" />
            </Panel>
          )}
        </>
      )}
      <CreateDialog
        title="New feature flag"
        open={create}
        onClose={() => setCreate(false)}
        onCreate={(name) => setFlags([...flags, name])}
      />
      <CreateDialog
        title="Invite teammate"
        label="Email"
        open={invite}
        onClose={() => setInvite(false)}
        onCreate={() => toast.success("Local invite created")}
      />
      <Detail title={selected} open={!!selected} onClose={() => setSelected("")}>
        <div className="flex flex-col gap-4 p-4">
          <Status>Production</Status>
          <p>
            Change reviewed against the current delivery policy. Checks passed: build, integration
            suite, and rollback readiness.
          </p>
          <Panel title="Release details">
            <p>Version 2.14.0</p>
            <p>Region eu-west-1</p>
            <p>Last deployment Oct 22, 2026</p>
          </Panel>
          <Button
            onClick={() => {
              setApproved([...approved, selected]);
              setSelected("");
              toast.success("Change approved in local workspace");
            }}
          >
            Approve change
          </Button>
        </div>
      </Detail>
    </Shell>
  );
}
