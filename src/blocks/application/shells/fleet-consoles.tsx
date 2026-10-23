import { useState } from "react";
import {
  Activity,
  ChevronDown,
  Grid2X2,
  PanelLeft,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Button,
  Badge,
  CreateItemDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Face,
  Input,
  Notifications,
  ReuiMark,
  SearchPalette,
  WorkspaceMenu,
  toast,
} from "./chrome";
import {
  AccountCard,
  Choices,
  ContentCards,
  GroupedNav,
  NavSearch,
  Promo,
  Rail,
  Segments,
  Sidebar,
  railItems,
} from "./primitives";
import { ScopePanel, ScopeTree } from "./scopes";
import { Assistant } from "./productivity";
const sections = ["Fleet", "Missions", "Stations", "Maintenance", "Reports"];
function SectionNav({
  value,
  onChange,
  security = false,
}: {
  value: string;
  onChange: (s: string) => void;
  security?: boolean;
}) {
  const names = security ? ["Security", "Incidents", "Threats", "Assets", "Reports"] : sections;
  return (
    <>
      <div
        className="hidden min-w-0 items-center gap-1 lg:flex"
        role="tablist"
        aria-label="Sections"
      >
        {names.map((name, i) => {
          const Icon = railItems[i].icon;
          return (
            <Button
              role="tab"
              aria-selected={value === name}
              variant={value === name ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 font-normal text-muted-foreground aria-selected:text-foreground"
              key={name}
              onClick={() => onChange(name)}
            >
              <Icon />
              {name}
            </Button>
          );
        })}
      </div>
      <div className="lg:hidden">
        <Choices label="Sections" items={names} value={value} onChange={onChange} />
      </div>
    </>
  );
}
function OperationsSettings({
  showCounts,
  onCounts,
  showStatus,
  onStatus,
}: {
  showCounts?: boolean;
  onCounts?: (v: boolean) => void;
  showStatus?: boolean;
  onStatus?: (v: boolean) => void;
}) {
  const [auto, setAuto] = useState(true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Display options">
          <SlidersHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="space-y-4 p-3 text-xs">
          <label className="flex items-center justify-between gap-8">
            Live updates
            <Switch checked={auto} onCheckedChange={setAuto} />
          </label>
          {onCounts && (
            <label className="flex items-center justify-between gap-8">
              Show counts
              <Switch checked={showCounts} onCheckedChange={onCounts} aria-label="Show counts" />
            </label>
          )}
          {onStatus && (
            <label className="flex items-center justify-between gap-8">
              Show status
              <Switch checked={showStatus} onCheckedChange={onStatus} aria-label="Show status" />
            </label>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function OperationsShell({
  variant,
}: {
  variant: 23 | 24 | 26 | 27 | 28 | 29 | 30 | 32 | 33;
}) {
  const [section, setSection] = useState(variant === 26 ? "Security" : "Fleet");
  const [active, setActive] = useState(
    variant === 23 ? "Stations" : variant === 27 ? "Security Center" : "Overview",
  );
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Delivery Center");
  const [create, setCreate] = useState("");
  const [assistant, setAssistant] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [counts, setCounts] = useState(true);
  const [status, setStatus] = useState(true);
  const [tiles, setTiles] = useState([
    "Overview",
    "Live",
    "Runs",
    "Load",
    "Power",
    "Service",
    "Issues",
    "Trends",
  ]);
  const [workspace, setWorkspace] = useState("Fleet");
  const [team, setTeam] = useState("Operations Team");
  const [project, setProject] = useState("Fleet Control");
  const [scopeWorkspace, setScopeWorkspace] = useState("All Workspaces");
  const [endpoints, setEndpoints] = useState(248);
  const [threats, setThreats] = useState(12);
  const top = ![27, 29, 33].includes(variant);
  const scopes = [26, 27, 32].includes(variant);
  const inset = variant === 28;
  const treeOnly = variant === 32;
  const title =
    variant === 32 ? "Fleet Protection" : variant === 30 ? "Mission Control Center" : active;
  function scan() {
    setScanning(true);
    window.setTimeout(() => setScanning(false), 1600);
  }
  return (
    <div
      className={`shell-reference flex-col ${inset ? "bg-muted/25" : ""}`}
      data-shell-variant={variant}
    >
      {top && (
        <header className="shell-header border-b">
          <div className="flex min-w-0 items-center gap-3">
            <ReuiMark small />
            {variant === 23 ? (
              <>
                <Choices
                  label="Teams"
                  value={team}
                  items={["Operations Team", "Engineering", "Design"]}
                  onChange={setTeam}
                />
                <Choices
                  label="Projects"
                  value={project}
                  items={["Fleet Control", "Warehouse", "Delivery"]}
                  onChange={setProject}
                />
              </>
            ) : variant === 32 ? (
              <>
                <strong className="truncate text-sm">Fleet Protection</strong>
                <Badge variant="outline" className="hidden sm:flex">
                  {endpoints} Endpoints
                </Badge>
                <Badge variant="outline" className="hidden sm:flex">
                  {threats} Threats
                </Badge>
              </>
            ) : variant === 26 ? (
              <Choices
                label="Workspaces"
                value={scopeWorkspace}
                items={["All Workspaces", "Production", "Staging"]}
                onChange={setScopeWorkspace}
              />
            ) : (
              <SectionNav value={section} onChange={setSection} />
            )}
          </div>
          {variant === 26 && <SectionNav security value={section} onChange={setSection} />}
          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden md:block">
              <SearchPalette
                iconOnly
                routes={[
                  "Overview",
                  "Live Map",
                  "All Robots",
                  "Zones",
                  "Access Requests",
                  "Alerts",
                  "Security Center",
                ]}
                onSelect={setActive}
              />
            </div>
            <OperationsSettings
              showCounts={counts}
              onCounts={setCounts}
              showStatus={status}
              onStatus={setStatus}
            />
            {variant !== 32 && <Notifications drawer={variant !== 26} />}
            <div className="hidden sm:block">
              <WorkspaceMenu collapsed user />
            </div>
            {variant === 26 ? (
              <Button variant="outline" size="sm" disabled={scanning} onClick={scan}>
                <Activity className={scanning ? "animate-spin" : ""} />
                {scanning ? "Scanning…" : "Run Scan"}
              </Button>
            ) : (
              <Button
                variant={variant === 32 ? "default" : "outline"}
                size="sm"
                onClick={() => setCreate(variant === 30 ? "Onboard robot" : "New mission")}
              >
                {variant === 30 ? "Onboard Robot" : "New Mission"}
              </Button>
            )}
            {variant === 32 && (
              <Button variant="outline" size="sm" onClick={() => setAssistant((v) => !v)}>
                <Sparkles />
                Open Chat
              </Button>
            )}
          </div>
        </header>
      )}
      <div
        className={`flex min-h-0 flex-1 ${inset ? "m-2 rounded-2xl border bg-background overflow-hidden" : ""}`}
      >
        {(treeOnly || variant === 33) && <Rail active={active} onChange={setActive} />}
        {variant !== 30 && variant !== 26 && !treeOnly && (
          <Sidebar
            collapsed={collapsed}
            className={`${variant === 33 ? "shell-dark m-2 !w-[288px] rounded-lg !p-0" : scopes ? "!w-[224px]" : variant === 29 ? "!w-64" : "!w-64"} ${variant === 27 ? "!bg-background" : ""}`}
            label="Fleet navigation"
          >
            {(!top || variant === 29) && (
              <div className="flex h-12 items-center justify-between px-2">
                {variant === 33 ? (
                  <strong className="text-xs">Fleet Center</strong>
                ) : (
                  <ReuiMark small />
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Toggle Sidebar"
                  onClick={() => setCollapsed((v) => !v)}
                >
                  <PanelLeft />
                </Button>
              </div>
            )}
            {variant === 33 ? (
              <>
                <NavSearch label="Search scopes" value={query} onChange={setQuery} />
                <div className="grid grid-cols-3 gap-2 p-3">
                  {tiles.map((name) => (
                    <Button
                      variant="secondary"
                      key={name}
                      className="h-16 flex-col gap-2 text-[10px] font-normal"
                      onClick={() => setActive(name)}
                    >
                      <Grid2X2 className="size-4" />
                      {name}
                    </Button>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-16" aria-label="Pin view">
                        <Plus />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuGroup>
                        {["Health", "Map", "Capacity", "Alerts"]
                          .filter((v) => !tiles.includes(v))
                          .map((name) => (
                            <DropdownMenuItem
                              key={name}
                              onSelect={() => setTiles((v) => [...v, name])}
                            >
                              {name}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <ScopeTree query={query} onSelect={setActive} fleetTree />
                <div className="flex gap-2 p-3">
                  {["Quick Add", "System"].map((name) => (
                    <Choices
                      key={name}
                      label={name}
                      value={name}
                      items={
                        name === "Quick Add"
                          ? ["Robot", "Mission", "Station"]
                          : ["Health", "Diagnostics", "Settings"]
                      }
                      onChange={(v) => toast(`${v} selected`)}
                      compact
                    />
                  ))}
                </div>
              </>
            ) : variant === 29 ? (
              <>
                <Segments
                  label="Workspaces"
                  items={["Fleet", "Team", "Events"]}
                  value={workspace}
                  onChange={setWorkspace}
                />
                <div className="my-4 grid grid-cols-3 gap-2">
                  {(workspace === "Fleet"
                    ? [
                        "Overview",
                        "Live Map",
                        "Robots",
                        "Zones",
                        "Clusters",
                        "Regions",
                        "Data Sync",
                        "Endpoints",
                        "Add",
                      ]
                    : workspace === "Team"
                      ? [
                          "Members",
                          "Roles",
                          "Shifts",
                          "Schedules",
                          "Invites",
                          "Groups",
                          "Reports",
                          "Access",
                          "Add",
                        ]
                      : [
                          "Today",
                          "Upcoming",
                          "Alerts",
                          "History",
                          "Scheduled",
                          "Tasks",
                          "Reports",
                          "Logs",
                          "Add",
                        ]
                  ).map((name) => (
                    <Button
                      key={name}
                      variant={active === name ? "outline" : "secondary"}
                      className="h-16 flex-col gap-1 text-[10px] font-normal"
                      onClick={() => (name === "Add" ? setCreate("Add section") : setActive(name))}
                    >
                      <Grid2X2 />
                      {name}
                    </Button>
                  ))}
                </div>
                <ScopeTree
                  key={workspace}
                  networkTree={workspace === "Fleet"}
                  scope={workspace === "Team" ? "Assets" : "Events"}
                  query={query}
                  onSelect={setActive}
                />
              </>
            ) : (
              <>
                {variant === 27 && <NavSearch value={query} onChange={setQuery} />}
                <GroupedNav
                  indented={variant === 23}
                  query={query}
                  groups={
                    variant === 23
                      ? [
                          {
                            label: "Robot Fleet",
                            items: [
                              "Overview",
                              "Robots",
                              "Stations",
                              "Fleet Map",
                              "Device Groups",
                              "Robot Health",
                            ],
                          },
                          {
                            label: "Mission Control",
                            items: ["Missions", "Requests", "Schedules", "Issue Reports"],
                          },
                          {
                            label: "System Tools",
                            items: [
                              "Integrations",
                              "Automations",
                              "Team Access",
                              "Activity Logs",
                              "API Keys",
                            ],
                          },
                        ]
                      : undefined
                  }
                  active={active}
                  onSelect={setActive}
                />
                {[23, 27].includes(variant) && <Promo />}
                <AccountCard />
              </>
            )}
          </Sidebar>
        )}
        {scopes && (
          <ScopePanel
            dynamic={variant === 26}
            query=""
            onCountChange={(name, count) => {
              if (name === "Devices") setEndpoints(count);
              if (name === "Threats") setThreats(count);
            }}
            onSelect={setActive}
            showCounts={counts}
            showStatus={status}
          />
        )}
        <main className="shell-content-frame">
          {variant === 30 ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-medium">{title}</h1>
                    <div className="flex gap-1">
                      {["342 Robots", "58 Missions", "12 Stations"].map((name) => (
                        <Badge variant="outline" className="text-[10px]" key={name}>
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Track robot status, capacity, assignments, health, and activity across your
                    entire operating fleet.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setCreate("New mission")}>
                    New Mission
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAssistant((v) => !v)}>
                    <Sparkles />
                    Open Chat
                  </Button>
                </div>
              </div>
              <div className="px-6">
                <Segments
                  label="Workspace views"
                  items={[
                    "Summary",
                    "Delivery Center",
                    "Performance",
                    "Coverage",
                    "Issues",
                    "Capacity",
                    "Trends",
                    "Access",
                  ]}
                  value={tab}
                  onChange={setTab}
                />
              </div>
              <ContentCards layout="console" />
            </>
          ) : variant === 29 ? (
            <>
              <div className="mx-4 mt-4">
                <NavSearch value={query} onChange={setQuery} />
              </div>
              <ContentCards layout="three" />
            </>
          ) : (
            <ContentCards
              layout={
                variant === 23
                  ? "three"
                  : variant === 33
                    ? "fleet"
                    : variant === 26 || variant === 27 || variant === 32
                      ? "security"
                      : variant === 28
                        ? "four"
                        : "dashboard"
              }
            />
          )}
        </main>
        {assistant && <Assistant onClose={() => setAssistant(false)} />}
      </div>
      <CreateItemDialog
        open={Boolean(create)}
        onOpenChange={(v) => !v && setCreate("")}
        title={create}
        onCreate={(name) => toast.success(`${name} created`)}
      />
    </div>
  );
}
const assignments = [
  {
    name: "Meow S025",
    status: "On time",
    events: [
      "Cargo scanned",
      "Delay detected",
      "Checkpoint reached",
      "Route changed by Chris",
      "Battery dropped",
    ],
  },
  {
    name: "Dock C112",
    status: "Running late",
    events: [
      "Cargo scanned",
      "Delay detected",
      "Checkpoint reached",
      "Route changed by Chris",
      "Battery dropped",
    ],
  },
  { name: "Pip W92", status: "On time", events: ["Route started"] },
  { name: "Humble P028", status: "2 Failed", events: ["Connection lost"] },
  { name: "Kiko B17", status: "On time", events: ["Load secured"] },
];
export function MissionShell() {
  const [active, setActive] = useState("Missions");
  const [tab, setTab] = useState("Robots");
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState(["Active"]);
  const [expanded, setExpanded] = useState(["Dock C112"]);
  const [create, setCreate] = useState(false);
  const visible = assignments.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="shell-reference flex-col" data-shell-variant="25">
      <header className="shell-header border-b">
        <div className="flex items-center gap-4">
          <ReuiMark small />
          <strong className="hidden sm:block">Mission Control Center</strong>
        </div>
        <Input
          aria-label="Search robots"
          placeholder="Enter Robot SKU or Nickname"
          className="mx-2 h-8 max-w-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex shrink-0 gap-1">
          <Button size="sm" onClick={() => setCreate(true)}>
            <Plus />
            New Mission
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex"
            onClick={() => toast("Ask AI selected")}
          >
            <Sparkles />
            Ask AI
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Rail active={active} onChange={setActive} />
        <aside className="shell-mission-panel flex min-h-0 w-[436px] shrink-0 flex-col border-r p-2">
          <Segments
            label="Mission panels"
            items={["Missions", "Robots", "Stations", "Alerts"]}
            value={tab}
            onChange={setTab}
          />
          {tab === "Robots" ? (
            <>
              <div className="mt-3 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm">Robot Management</strong>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setCreate(true)}
                  >
                    Onboarding
                  </Button>
                </div>
                <div className="mt-4 flex h-5 gap-0.5" aria-label="Mission distribution">
                  {Array.from({ length: 84 }, (_, i) => (
                    <span
                      key={i}
                      className="w-1 rounded"
                      style={{
                        background:
                          i < 38 ? "#8b5cf6" : i < 43 ? "#10b981" : i < 72 ? "#cbd5e1" : "#fb7185",
                      }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  38 Scheduled　5 Active　12 Paused　3 Failed
                </p>
                <div className="mt-4 grid grid-cols-4 text-center text-xs">
                  {["$12.8k", "32 min", "68%", "28"].map((s, i) => (
                    <span key={s}>
                      {s}
                      <span className="mt-1 block text-[9px] text-muted-foreground">
                        {["Order Value", "Avg. Run", "On Time", "Zones"][i]}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="shell-scroll mt-2">
                {["Scheduled", "Active", "Paused", "Failed"].map((group) => (
                  <section className="border-b py-2" key={group}>
                    <button
                      className="flex w-full items-center justify-between gap-2 px-2 text-xs"
                      aria-expanded={groups.includes(group)}
                      onClick={() =>
                        setGroups((v) =>
                          v.includes(group) ? v.filter((s) => s !== group) : [...v, group],
                        )
                      }
                    >
                      <strong className="font-medium">
                        {group}{" "}
                        <Badge variant="outline" className="text-[9px]">
                          {group === "Active"
                            ? visible.length
                            : group === "Scheduled"
                              ? 38
                              : group === "Paused"
                                ? 12
                                : 3}{" "}
                          Missions
                        </Badge>
                      </strong>
                      <ChevronDown className="size-3" />
                    </button>
                    {groups.includes(group) &&
                      (group === "Active" ? (
                        <div className="mt-3 space-y-2">
                          {visible.map((a) => (
                            <div className="rounded-lg border p-2" key={a.name}>
                              <button
                                className="flex w-full items-center gap-2 text-xs"
                                aria-expanded={expanded.includes(a.name)}
                                onClick={() =>
                                  setExpanded((v) =>
                                    v.includes(a.name)
                                      ? v.filter((n) => n !== a.name)
                                      : [...v, a.name],
                                  )
                                }
                              >
                                <Face small />
                                <span>{a.name}</span>
                                <Badge variant="outline" className="text-[9px]">
                                  {a.status}
                                </Badge>
                                <ChevronDown className="ml-auto size-3" />
                              </button>
                              {expanded.includes(a.name) && (
                                <div className="mt-3 space-y-2 border-l pl-3 text-[10px] text-muted-foreground">
                                  <p>24m　3.8km　76%　Checking　Mark</p>
                                  {a.events.map((event, i) => (
                                    <p key={event}>
                                      15:{String(i + 5).padStart(2, "0")} · {event}
                                    </p>
                                  ))}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-full text-[10px]"
                                    onClick={() => toast(`Tracking ${a.name}`)}
                                  >
                                    Track Mission
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                          {visible.length === 0 && (
                            <p className="p-5 text-center text-xs text-muted-foreground">
                              No robots match your search.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="px-2 pt-4 text-xs text-muted-foreground">
                          {group === "Scheduled"
                            ? "Upcoming runs are queued for dispatch."
                            : `No ${group.toLowerCase()} missions to display.`}
                        </p>
                      ))}
                  </section>
                ))}
              </div>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => toast("Review assignments selected")}
              >
                Review Assignments
              </Button>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              No {tab.toLowerCase()} to display
            </div>
          )}
        </aside>
        <main className="shell-content-frame">
          <ContentCards layout="mission" />
        </main>
      </div>
      <CreateItemDialog
        open={create}
        onOpenChange={setCreate}
        title="New mission"
        onCreate={(name) => toast.success(`${name} created`)}
      />
    </div>
  );
}
