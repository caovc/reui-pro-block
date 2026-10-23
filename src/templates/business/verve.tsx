import {
  VerveQuotaPlan,
  VerveQuickStats,
  VerveAttainment,
  useVerveQuotaState,
  useVerveLogState,
  useVerveTargetState,
} from "./verve-goals";
import { ReuiDonut } from "@/blocks/data/reui-free-chart-primitives";
import VervePipeline from "./verve-pipeline";
import { IconTile } from "@/components/reui/icon-tile";
import VerveToday from "./verve-today";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { TrendingUp, Users, ChartNoAxesColumn, TriangleAlert } from "lucide-react";
import {
  Shell,
  Heading,
  Panel,
  Card,
  CardContent,
  Button,
  Badge,
  NavItems,
  Period,
  Input,
  DataTable,
  SettingsPage,
  toast,
  exportCsv,
} from "./shared";
type Deal = {
  name: string;
  company: string;
  amount: string;
  stage: string;
  owner: string;
};
const reps = [
  ["Mira Stone", "Enterprise AE", "94%", "6h", "2", "Stable"],
  ["Leo Grant", "Strategic AE", "81%", "3h", "5", "Watch"],
  ["Nora Vale", "Commercial AE", "72%", "2h", "6", "Critical"],
  ["Theo Park", "Sales Engineer", "89%", "5h", "3", "Stable"],
  ["Sana Qureshi", "Renewals AE", "86%", "4h", "4", "Stable"],
  ["Owen Clarke", "Account Executive", "78%", "7h", "2", "Watch"],
];
export default function Verve() {
  const quotaState = useVerveQuotaState();
  const logState = useVerveLogState();
  const targetState = useVerveTargetState();
  const [donutActive, setDonutActive] = useState<number | null>(null);
  const [active, setActive] = useState("Dashboard");
  const [period, setPeriod] = useState("Week");
  const [query, setQuery] = useState("");
  const [create, setCreate] = useState(false);
  const [meeting, setMeeting] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [deals] = useState<Deal[]>([
    {
      name: "Enterprise rollout",
      company: "Helio Manufacturing",
      amount: "84000",
      stage: "Negotiation",
      owner: "Mira Stone",
    },
    {
      name: "Platform expansion",
      company: "Quartz Payments",
      amount: "42000",
      stage: "Proposal",
      owner: "Leo Grant",
    },
    {
      name: "Annual renewal",
      company: "Vera Capital",
      amount: "128000",
      stage: "Discovery",
      owner: "Nora Vale",
    },
    {
      name: "Security suite",
      company: "Northstar Labs",
      amount: "36000",
      stage: "Qualified",
      owner: "Theo Park",
    },
    {
      name: "Global workspace",
      company: "Lumina Studio",
      amount: "96000",
      stage: "Proposal",
      owner: "Sana Qureshi",
    },
  ]);
  const nav = ["Dashboard", "Today", "Activity Feed", "Quick Stats", "Attainment", "Quota Plan"];
  const rail = ["Dashboard", "Pipeline", "Activity Feed", "Contacts", "Reports", "Settings"];

  const coverage = period === "Week" ? 86 : period === "Month" ? 91 : 94;
  return (
    <Shell
      id="verve"
      brand="Acme Inc"
      active={active}
      setActive={setActive}
      items={rail}
      rail
      top={
        <span className="bt-verve-header">
          <span>Acme Inc　/　CRM</span>
          <Input
            aria-label="Search CRM"
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive("Pipeline");
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">+ Create</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["New Deal", "New Contact", "New Company", "Import Data", "Generate Report"].map(
                (x, i) => (
                  <DropdownMenuItem
                    key={x}
                    onSelect={() =>
                      setActive(["Pipeline", "Contacts", "Companies", "Imports", "Reports"][i])
                    }
                  >
                    {x}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      }
      aside={
        active === "Pipeline" ? (
          <>
            <p className="bt-nav-label">DEALS</p>
            <NavItems
              items={["Deal Board", "Forecast"]}
              active={"Deal Board"}
              onSelect={(x) => setActive(x === "Deal Board" ? "Pipeline" : x)}
            />
            <p className="bt-nav-label">SALES</p>
            <NavItems
              items={["Quotes", "Products", "Approvals"]}
              active={active}
              onSelect={setActive}
            />
          </>
        ) : (
          <>
            <p className="bt-nav-label">OVERVIEW</p>
            <NavItems items={nav.slice(0, 4)} active={active} onSelect={setActive} />
            <p className="bt-nav-label">GOALS</p>
            <NavItems items={nav.slice(4)} active={active} onSelect={setActive} />
          </>
        )
      }
      footer={
        <div className="bt-info">
          <strong>Forecast rolls up by territory</strong>Commit, best case, and pipeline now total
          per territory alongside the quarter view.
          <Button variant="link" size="sm" onClick={() => setActive("Reports")}>
            Read more
          </Button>
        </div>
      }
    >
      {active === "Settings" ? (
        <SettingsPage brand="Acme Inc" />
      ) : (
        <>
          <Heading
            title={"Home › CRM › " + active}
            date={
              active === "Quick Stats"
                ? "This week"
                : active === "Attainment"
                  ? "This quarter"
                  : "Jun 22 to Jul 12, 2026"
            }
            action={
              active === "Pipeline" ? "Add deal" : active === "Today" ? "New meeting" : undefined
            }
            onAction={() => (active === "Today" ? setMeeting(true) : setCreate(true))}
            onExport={() =>
              exportCsv("crm-pipeline", [
                ["Deal", "Company", "Value", "Stage"],
                ...deals.map((d) => [d.name, d.company, d.amount, d.stage]),
              ])
            }
          />
          {active === "Quota Plan" ? (
            <VerveQuotaPlan model={quotaState} />
          ) : active === "Quick Stats" ? (
            <VerveQuickStats model={logState} />
          ) : active === "Attainment" ? (
            <VerveAttainment model={targetState} />
          ) : ["Dashboard", "Reports"].includes(active) ? (
            <>
              <div className="bt-grid-4">
                {[
                  ["Open Pipeline", "11.8% above plan", "$4.82M", "+11.8%", TrendingUp],
                  [
                    "Open Deals",
                    "84% of quota target",
                    String(36 + deals.length - 5),
                    "+9.4%",
                    ChartNoAxesColumn,
                  ],
                  ["New Contacts", "42 via referral", "128", "+18.6%", Users],
                  ["Deals At Risk", "$3.96M exposure", "17", "-2.1%", TriangleAlert],
                ].map(([title, description, value, change, Icon], i) => {
                  const StatIcon = Icon as typeof Users;
                  return (
                    <Card key={String(title)}>
                      <CardContent>
                        <div className="bt-stat-top">
                          <IconTile variant="frame" className="bt-stat-tile">
                            <StatIcon />
                          </IconTile>
                          <span>
                            <strong>{String(title)}</strong>
                            <small className="bt-table-sub">{String(description)}</small>
                          </span>
                          <Badge variant={i === 3 ? "warning-light" : "success-light"}>
                            {String(change)}
                          </Badge>
                        </div>
                        <div className="bt-stat-line">
                          <strong className="bt-stat-value">{String(value)}</strong>
                          <div
                            className="bt-quota-ticks"
                            style={{
                              height: 40,
                              margin: 0,
                              width: 50,
                              alignItems: "flex-end",
                              gap: 3,
                            }}
                          >
                            {Array.from({ length: 8 }, (_, n) => (
                              <i
                                key={n}
                                style={{
                                  height: 15 + n * 3 + "px",
                                  background: ["#00b981", "#a67cf3", "#00b981", "#f2a200"][i],
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="bt-grid-2">
                <Panel
                  title="Performance"
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriod(period === "Year" ? "Week" : "Year")}
                    >
                      Quarter　⌄
                    </Button>
                  }
                >
                  <div className="bt-performance-numbers">
                    {[
                      ["$2.4M", "Closed Won", "+11.8%"],
                      ["26.4%", "Win Rate", "+1.2 pts"],
                      ["48 days", "Sales Cycle", "+9.4%"],
                    ].map(([v, l, c]) => (
                      <div key={l}>
                        <strong>{v}</strong>
                        <small>{l}</small>
                        <span className="bt-positive text-xs">↗ {c}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bt-row">
                    <span>Pipeline Progress</span>
                    <strong>76%</strong>
                  </div>
                  <div className="bt-progress">
                    <i style={{ width: "76%", background: "var(--foreground)" }} />
                  </div>
                  <p className="mt-6 mb-2 font-medium">Recent Activity</p>
                  {[
                    ["Helio Manufacturing returned redlines", "Cleared"],
                    ["Quartz Payments booked a security review", "Review"],
                    ["Vera Capital lost its exec sponsor", "Watch"],
                  ].map(([name, status]) => (
                    <button
                      key={name}
                      className="bt-row w-full text-left"
                      onClick={() => setActive("Activity Feed")}
                    >
                      <span className="text-xs">{name}</span>
                      <Badge
                        variant={
                          status === "Cleared"
                            ? "success-light"
                            : status === "Review"
                              ? "focus-light"
                              : "warning-light"
                        }
                      >
                        {status}
                      </Badge>
                    </button>
                  ))}
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="flex-1" onClick={() => setActive("Today")}>
                      Schedule
                    </Button>
                    <Button className="flex-1" onClick={() => setActive("Reports")}>
                      Full Report
                    </Button>
                  </div>
                </Panel>
                <div className="bt-stack">
                  <Panel
                    title="Quota Coverage"
                    action={<Period value={period} onChange={setPeriod} />}
                  >
                    <div className="bt-stat-line">
                      <span className="bt-stat-value">
                        {coverage}% <small className="text-xs bt-positive">+5.8%</small>{" "}
                        <small className="text-xs text-muted-foreground">vs quota plan</small>
                      </span>
                    </div>
                    <div className="bt-quota-ticks">
                      {Array.from({ length: 56 }, (_, i) => (
                        <i className={i < Math.round(coverage * 0.56) ? "filled" : ""} key={i} />
                      ))}
                    </div>
                    <div className="bt-row">
                      <span className="text-xs text-muted-foreground">
                        In play: <strong className="text-foreground">$3.84M</strong>
                      </span>
                      <span className="text-xs text-muted-foreground">9 Members</span>
                    </div>
                  </Panel>
                  <Panel
                    title="Pipeline Sourced"
                    action={<Period value={period} onChange={setPeriod} />}
                  >
                    <div className="bt-donut-layout">
                      <ReuiDonut
                        label="Pipeline source distribution"
                        rows={[
                          { name: "Inbound", value: 47, color: "#00b981" },
                          { name: "Outbound", value: 23, color: "#3485f6" },
                          { name: "Partner", value: 25, color: "#f2a200" },
                          { name: "Other", value: 5, color: "var(--muted)" },
                        ]}
                        active={donutActive}
                        onActive={setDonutActive}
                        innerRadius={49}
                        outerRadius={70}
                        className="bt-source-donut"
                        center={
                          <text textAnchor="middle">
                            <tspan x="0" dy="-5" className="fill-muted-foreground text-[11px]">
                              Sourced
                            </tspan>
                            <tspan
                              x="0"
                              dy="19"
                              className="fill-foreground text-base font-semibold"
                            >
                              {period === "Week"
                                ? "$842K"
                                : period === "Month"
                                  ? "$1.24M"
                                  : "$4.82M"}
                            </tspan>
                          </text>
                        }
                      />
                      <div>
                        {[
                          ["Inbound", "$396K", "47%"],
                          ["Outbound", "$194K", "23%"],
                          ["Partner", "$210K", "25%"],
                        ].map(([name, n, p]) => (
                          <div className="bt-row" key={name}>
                            <span>{name}</span>
                            <span>
                              {n}　<small className="inline">{p}</small>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Panel>
                </div>
              </div>
              <Panel
                title="Team Performance"
                description="Quota and open deals by rep"
                action={<Badge variant="outline">6 reps</Badge>}
              >
                <DataTable
                  columns={["Rep", "Quota", "Response", "Open Deals", "Status"]}
                  rows={reps.map((r) => [
                    <span key="person" className="bt-product-name">
                      <span className="bt-avatar">
                        {r[0]
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </span>
                      <span>
                        {r[0]}
                        <small className="bt-table-sub">{r[1]}</small>
                      </span>
                    </span>,
                    <span key="quota" className="block min-w-32">
                      {r[2]}
                      <span className="bt-progress block mt-2">
                        <i style={{ width: r[2] }} />
                      </span>
                    </span>,
                    r[3],
                    r[4],
                    <Badge
                      key="status"
                      variant={
                        r[5] === "Stable"
                          ? "success-light"
                          : r[5] === "Critical"
                            ? "destructive-light"
                            : "warning-light"
                      }
                    >
                      {r[5]}
                    </Badge>,
                  ])}
                />
              </Panel>
            </>
          ) : active === "Today" ? (
            <VerveToday open={meeting} onOpenChange={setMeeting} />
          ) : active === "Pipeline" ? (
            <VervePipeline open={create} onOpenChange={setCreate} query={query} />
          ) : active === "Contacts" ? (
            <Panel title="All contacts" description="Your sales relationships">
              <Input
                aria-label="Search contacts"
                placeholder="Search contacts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <DataTable
                onReset={() => setQuery("")}
                query={query}
                columns={["Name", "Email", "Company", "Owner"]}
                rows={[
                  ["Eva Morgan", "eva@example.com", "Helio Manufacturing", "Mira Stone"],
                  ["Daniel Cho", "daniel@example.com", "Quartz Payments", "Leo Grant"],
                  ["Sophie Walsh", "sophie@example.com", "Vera Capital", "Nora Vale"],
                ]}
                onRow={(i) =>
                  toast(["Eva Morgan", "Daniel Cho", "Sophie Walsh"][i] + " contact selected")
                }
              />
            </Panel>
          ) : (
            <Panel title={"Activity feed"} description={"Recent updates across your pipeline."}>
              {[
                ["09:00", "Discovery call · Helio Manufacturing", "Mira Stone"],
                ["10:30", "Security review · Quartz Payments", "Leo Grant"],
                ["14:00", "Contract follow-up · Vera Capital", "Nora Vale"],
                ["16:00", "Weekly pipeline review", "Sales team"],
              ].map(([time, title, owner]) => (
                <div className="bt-row" key={title}>
                  <span className="text-muted-foreground">{time}</span>
                  <span className="flex-1">
                    {title}
                    <small>{owner}</small>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={completed.includes(title)}
                    onClick={() => {
                      setCompleted((x) => [...x, title]);
                      toast.success("Task completed");
                    }}
                  >
                    {completed.includes(title) ? "Completed" : "Complete"}
                  </Button>
                </div>
              ))}
            </Panel>
          )}
        </>
      )}
    </Shell>
  );
}
