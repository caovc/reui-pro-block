import AtlasUsers from "./atlas-users";
import { useState } from "react";
import { CircleHelp, Settings, Users } from "lucide-react";
import {
  Shell,
  Heading,
  Panel,
  Card,
  CardContent,
  Badge,
  Button,
  Spark,
  Bars,
  Area,
  DataTable,
  RecordDialog,
  SettingsPage,
  toast,
  exportCsv,
} from "./shared";
export default function Atlas() {
  const [active, setActive] = useState("Dashboard");
  const [newUser, setNewUser] = useState(false);
  const [users, setUsers] = useState([
    ["Amara Ortiz", "amara@example.com", "Administrator", "Active"],
    ["Theo Mercer", "theo@example.com", "Developer", "Active"],
    ["Lena Hoffman", "lena@example.com", "Editor", "Invited"],
    ["Isaac Chen", "isaac@example.com", "Developer", "Active"],
  ]);
  const [selected, setSelected] = useState("");
  const items = ["Dashboard", "Deals", "Products", "Billing", "Users", "Reports"];
  return (
    <Shell
      id="atlas"
      brand="ReUI"
      active={active}
      setActive={(x) => {
        setActive(x);
      }}
      items={items}
      footer={
        <>
          <div className="bt-nav">
            <Button variant="ghost" className="justify-start" onClick={() => setActive("Users")}>
              <Users />
              Team
            </Button>
            <Button variant="ghost" className="justify-start" onClick={() => setActive("Settings")}>
              <Settings />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() =>
                setSelected("Contact support at support@example.com for your workspace.")
              }
            >
              <CircleHelp />
              Help & Support
            </Button>
          </div>
        </>
      }
    >
      {["Users", "All Users"].includes(active) ? (
        <AtlasUsers />
      ) : active === "Settings" ? (
        <SettingsPage brand="ReUI" />
      ) : (
        <>
          <Heading
            title={active}
            action={active === "Users" ? "Invite user" : undefined}
            onAction={() => setNewUser(true)}
          />
          {selected && (
            <div className="bt-info" role="status">
              {selected}
              <Button variant="link" size="sm" onClick={() => setSelected("")}>
                Dismiss
              </Button>
            </div>
          )}
          {active === "Dashboard" || active === "Reports" ? (
            <>
              <div className="bt-grid-2">
                {[
                  ["Signal Risk", "THREAT INDEX", "Elevated", "+12.5%", "5 cases"],
                  ["Mesh Uptime", "SERVICE HEALTH", "99.98%", "+0.2%", "58 zones"],
                  ["Edge Traffic", "SCRUBBED LOAD", "4.8 GB/s", "-3.1%", "clean flow"],
                  ["Sensor Reach", "GLOBAL NODES", "18,420", "+6.8%", "93 regions"],
                ].map(([title, label, value, change, note], i) => (
                  <Card key={title}>
                    <CardContent>
                      <div className="bt-stat-top">
                        <strong>{title}</strong>
                        <span
                          className="bt-metric-dot"
                          style={{
                            background:
                              i === 0
                                ? "var(--bt-red)"
                                : i === 2
                                  ? "var(--bt-amber)"
                                  : "var(--bt-green)",
                          }}
                        />
                      </div>
                      <div className="bt-stat-label">{label}</div>
                      <div className="bt-stat-line">
                        <strong className="bt-stat-value">{value}</strong>
                        <Spark
                          index={i}
                          color={
                            i === 0
                              ? "var(--bt-red)"
                              : i === 2
                                ? "var(--bt-amber)"
                                : "var(--bt-green)"
                          }
                        />
                      </div>
                      <div className="bt-stat-foot">
                        <Badge
                          variant={
                            i === 0
                              ? "destructive-light"
                              : i === 2
                                ? "warning-light"
                                : "success-light"
                          }
                        >
                          {change}
                        </Badge>{" "}
                        {note}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="bt-grid-2">
                <Panel
                  title="Threat Vectors"
                  description="Blocked Signals"
                  action={
                    <span className="bt-chart-legend">
                      <span>
                        <i style={{ background: "#5277f0" }} />
                        Blocked
                      </span>
                      <span>
                        <i style={{ background: "#83d7ee" }} />
                        Watched
                      </span>
                    </span>
                  }
                >
                  <Bars
                    multi
                    labels={[
                      "Bot",
                      "Phish",
                      "DDoS",
                      "Inject",
                      "Auth",
                      "Probe",
                      "Exfil",
                      "Beacon",
                      "Day0",
                    ]}
                  />
                </Panel>
                <Panel
                  title="Network Flow"
                  description="API and webhooks"
                  action={<Badge variant="outline">+12.8%</Badge>}
                >
                  <Area />
                </Panel>
              </div>
              <div className="bt-grid-wide">
                <Panel
                  title="Cluster Load"
                  description="Normal · Warm · Critical"
                  action={
                    <div className="bt-pills">
                      <Badge variant="secondary">52 Nodes</Badge>
                      <Badge variant="warning-light">2 Warm</Badge>
                      <Badge variant="destructive-light">2 Critical</Badge>
                    </div>
                  }
                >
                  <div className="bt-node-bars" role="img" aria-label="Load of 52 nodes">
                    {[
                      24, 20, 26, 28, 31, 26, 30, 32, 23, 20, 24, 54, 27, 31, 33, 36, 32, 23, 35,
                      37, 43, 36, 33, 31, 49, 28, 39, 41, 24, 35, 25, 28, 34, 32, 36, 29, 38, 33,
                      35, 29, 32, 35, 32, 24, 30, 32, 28, 31, 26, 30, 28, 32,
                    ].map((height, i) => (
                      <i
                        key={i}
                        style={{
                          height: height + "%",
                          background: [11, 24].includes(i)
                            ? "var(--bt-red)"
                            : [26, 29].includes(i)
                              ? "var(--bt-amber)"
                              : undefined,
                        }}
                      />
                    ))}
                  </div>
                </Panel>
                <Panel title="Active Lanes" description="Threat Queue">
                  {[
                    ["API Flood", "Edge WAF · Mitigating", "4,521", 92],
                    ["Mail Spoof", "Mail Relay · Reviewing", "3,102", 64],
                    ["Cloud Probe", "Cloud API · Queued", "1,250", 26],
                    ["Mesh Beacon", "Int Node · Watching", "420", 9],
                  ].map(([title, desc, count, percent], i) => (
                    <button
                      key={title}
                      type="button"
                      className="bt-row w-full text-left"
                      onClick={() =>
                        setSelected(
                          `${title}: ${desc}. ${count} events reviewed in this reporting period.`,
                        )
                      }
                    >
                      <span className="w-full">
                        <span className="flex justify-between">
                          <strong>
                            [0{i}] {title}
                          </strong>
                          <strong>{count}</strong>
                        </span>
                        <small>{desc}</small>
                        <span className="bt-progress block mt-3">
                          <i
                            style={{
                              width: percent + "%",
                              background:
                                i === 0
                                  ? "var(--bt-red)"
                                  : i === 1
                                    ? "var(--bt-amber)"
                                    : "var(--chart-1)",
                            }}
                          />
                        </span>
                      </span>
                    </button>
                  ))}
                </Panel>
              </div>
              <Panel
                title="Timesheets"
                description="Weekly team timesheets"
                action={
                  <Button variant="outline" size="sm" onClick={() => setNewUser(true)}>
                    New entry
                  </Button>
                }
              >
                <DataTable
                  columns={[
                    "People",
                    "Mon, Mar 23",
                    "Tue, Mar 24",
                    "Wed, Mar 25",
                    "Thu, Mar 26",
                    "Fri, Mar 27",
                    "Total",
                  ]}
                  rows={users.map((u, i) => [
                    u[0],
                    i === 0 ? "6h 30m" : "8h",
                    "5h 30m",
                    "7h",
                    "6h",
                    "4h 30m",
                    i === 0 ? "29h 30m" : "39h 30m",
                  ])}
                />
              </Panel>
            </>
          ) : active === "Deals" ? (
            <Panel title="Open deals" description="Current sales opportunities">
              <DataTable
                columns={["Deal", "Company", "Value", "Stage", "Owner"]}
                rows={[
                  [
                    "Enterprise rollout",
                    "Helio Manufacturing",
                    "$84,000",
                    "Negotiation",
                    "Mira Stone",
                  ],
                  ["Platform expansion", "Quartz Payments", "$42,000", "Proposal", "Leo Grant"],
                  ["Annual renewal", "Vera Capital", "$128,000", "Discovery", "Nora Vale"],
                ]}
                onRow={(i) =>
                  setSelected(
                    ["Enterprise rollout", "Platform expansion", "Annual renewal"][i] +
                      " selected for review",
                  )
                }
              />
            </Panel>
          ) : active === "Products" ? (
            <Panel title="Products" description="Manage your subscription catalog">
              <DataTable
                columns={["Product", "SKU", "Price", "Inventory"]}
                rows={[
                  ["Starter plan", "PLAN-001", "$29 / month", "Unlimited"],
                  ["Business plan", "PLAN-002", "$99 / month", "Unlimited"],
                  ["Enterprise license", "PLAN-003", "Custom", "Unlimited"],
                ]}
                onRow={(i) =>
                  setSelected(["Starter", "Business", "Enterprise"][i] + " plan details selected")
                }
              />
            </Panel>
          ) : (
            <Panel title="Billing overview" description="Subscriptions and recent invoices">
              <div className="bt-stat-value">$2,840.00</div>
              <p className="text-muted-foreground mb-6">Current monthly recurring revenue</p>
              <DataTable
                columns={["Invoice", "Customer", "Amount", "Status"]}
                rows={[
                  ["INV-2048", "Helio Manufacturing", "$1,240.00", "Paid"],
                  ["INV-2047", "Quartz Payments", "$890.00", "Paid"],
                  ["INV-2046", "Vera Capital", "$710.00", "Pending"],
                ]}
                onRow={(i) => {
                  exportCsv("invoice-" + i, [
                    ["Invoice", "Total"],
                    ["INV-" + (2048 - i), ["1240", "890", "710"][i]],
                  ]);
                }}
              />
            </Panel>
          )}
        </>
      )}
      <RecordDialog
        title="New timesheet entry"
        open={newUser}
        onOpenChange={setNewUser}
        fields={
          active === "Users"
            ? [
                { name: "name", label: "Full name" },
                { name: "email", label: "Email address", type: "email" },
                { name: "role", label: "Role", value: "Editor" },
              ]
            : [
                { name: "name", label: "Full name" },
                { name: "hours", label: "Tracked hours", type: "number" },
              ]
        }
        onSave={(v) => {
          if (active === "Users") setUsers((x) => [...x, [v.name, v.email, v.role, "Invited"]]);
          else setSelected(`${v.name}: ${v.hours} tracked hours added to this week.`);
          toast.success("Record saved");
        }}
      />
    </Shell>
  );
}
