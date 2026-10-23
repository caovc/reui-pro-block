import {
  ReuiSidebar,
  SidebarCollection,
  SidebarWorkspaceSwitcher,
} from "@/components/reui/sidebar";
import { AppShellInset, useShellSidebarState } from "@/components/reui/layout";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  CircleHelp,
  Code2,
  CreditCard,
  Ellipsis,
  Home,
  Layers,
  Library,
  MessageSquare,
  Network,
  PanelRight,
  Plus,
  Settings,
  Shield,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import {
  AppsMenu,
  Breadcrumbs,
  Button,
  CollapseHandle,
  CreateItemDialog,
  Face,
  FooterLinks,
  Members,
  Navigation,
  Notifications,
  PinnedProjects,
  PlaceholderCanvas,
  ReuiMark,
  SearchPalette,
  UsageCard,
  WorkspaceMenu,
  RowActions,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  standardNavigation,
  toast,
} from "./chrome";
import type { NavNode } from "./chrome";
import { Sidebar } from "./primitives";
import { CalendarContext } from "./calendar-panel";
const railNavigation: NavNode[] = [
  { label: "Overview", icon: Home },
  {
    label: "Pipelines",
    icon: Zap,
    children: ["Build Runs", "Deployments", "Release Gates"],
  },
  {
    label: "Infrastructure",
    icon: Layers,
    children: ["Compute", "Databases", "Storage"],
  },
  { label: "Observability", icon: Activity, badge: "14" },
  { label: "Security", icon: Shield },
];
const floatingNavigation: NavNode[] = [
  { label: "Overview", icon: Home },
  {
    label: "Customers",
    icon: Users,
    children: ["Segments", "Accounts", "Health Scores"],
  },
  {
    label: "Subscriptions",
    icon: CreditCard,
    children: ["Plans", "Invoices", "Usage"],
  },
  { label: "Revenue", icon: BarChart3, dot: true },
  { label: "Automation", icon: Workflow },
  { label: "Support", icon: CircleHelp },
];
const agentsNavigation: NavNode[] = [
  { label: "New Chat", icon: Plus, accent: true },
  {
    label: "Agents",
    icon: Bot,
    children: ["My Agents", "Templates", "Deployed"],
  },
  {
    label: "Threads",
    icon: MessageSquare,
    children: ["Recent", "Saved", "Archived"],
  },
  {
    label: "Tools",
    icon: Code2,
    children: ["All tools", "Integrations", "API keys"],
  },
  {
    label: "Knowledge",
    icon: Library,
    children: ["Sources", "Collections", "Documents"],
  },
  { label: "Runs", icon: Workflow, children: ["Live", "History", "Scheduled"] },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];
const appsNavigation: NavNode[] = [
  {
    label: "Audience",
    icon: Users,
    children: ["Contacts", "Segments", "Lists"],
  },
  {
    label: "Account",
    icon: Settings,
    children: ["Profile", "Billing", "Security", "Members"],
  },
  {
    label: "Network",
    icon: Network,
    children: ["Connections", "Integrations", "Requests"],
  },
];
function ResourceLinks({ onSelect }: { onSelect: (s: string) => void }) {
  const [items, setItems] = useState([
    "API Gateway",
    "ML Pipeline",
    "Database",
    "CDN",
    "Authentication",
  ]);
  const colors = ["#00bc7d", "#8e51ff", "#2b7fff", "#fe9a00", "#ff2056"];
  return (
    <SidebarCollection
      label="Resources"
      onSelect={onSelect}
      rows={items.map((name) => ({
        label: name,
        icon: (
          <span
            className="mx-1 size-1.5 shrink-0 rounded-full"
            style={{
              background:
                colors[
                  ["API Gateway", "ML Pipeline", "Database", "CDN", "Authentication"].indexOf(name)
                ],
            }}
          />
        ),
        badge:
          name === "API Gateway" || name === "Database" ? (
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              {name === "API Gateway" ? "Prod" : "US-East"}
            </Badge>
          ) : undefined,
        actions: (
          <RowActions
            name={name}
            sidebar
            onRemove={() => setItems((current) => current.filter((value) => value !== name))}
          />
        ),
      }))}
    />
  );
}
function InsetNavShell({ variant }: { variant: 1 | 2 | 3 | 6 | 9 | 10 | 12 }) {
  const [collapsed, setCollapsed] = useShellSidebarState();
  const { isMobile } = useSidebar();
  const [active, setActive] = useState(
    variant === 1 || variant === 2 || variant === 12 ? "Overview" : "Dashboard",
  );
  const [context, setContext] = useState(true);
  const [auto, setAuto] = useState(true);
  const [newItem, setNewItem] = useState(false);
  const [workspace, setWorkspace] = useState(variant === 1 ? "Bricklane" : "Atlas");
  const [workspaces, setWorkspaces] = useState(["Bricklane", "Acme Inc", "Atlas"]);
  const [createWorkspace, setCreateWorkspace] = useState(false);
  const dark = variant === 6 || variant === 9;
  const floating = variant === 2;
  const apps = variant === 12;
  const inset = [3, 9, 10].includes(variant);
  const hasSearch = [2, 3, 6, 9, 10].includes(variant);
  const hasProjects = [3, 10, 12].includes(variant);
  const hasMembers = variant === 6 || variant === 9;
  const hasUsage = [3, 6, 9, 10].includes(variant);
  const nav =
    variant === 1
      ? railNavigation
      : variant === 2
        ? floatingNavigation
        : variant === 10
          ? agentsNavigation
          : standardNavigation;
  const crumb =
    variant === 1
      ? ["Dashboard", active]
      : variant === 2
        ? ["VC Workspace", "CN @shadcn", active === "Overview" ? "Projects" : active]
        : variant === 10
          ? [workspace, "Nick Bold", active === "Dashboard" ? "Overview" : active]
          : apps
            ? ["Dashboards", active]
            : ["Home", active === "Dashboard" ? "Overview" : active];
  return (
    <div
      className={`shell-reference ${variant === 9 ? "bg-[#171717]" : ""} ${floating ? "bg-muted/25" : ""}`}
      data-shell-variant={variant}
    >
      <Sidebar
        width={variant === 6 || variant === 9 ? 250 : apps ? 240 : 256}
        variant={floating ? "floating" : inset ? "inset" : "sidebar"}
        collapsed={collapsed}
        header={
          variant === 1 ? (
            <SidebarWorkspaceSwitcher
              value={workspace}
              workspaces={workspaces}
              onSelect={setWorkspace}
              onCreate={() => setCreateWorkspace(true)}
            />
          ) : floating ? (
            <div className="shell-floating-header">
              <div className="shell-floating-brand">
                <ReuiMark />
                {!collapsed && <span className="text-sm font-medium">Bricklane</span>}
              </div>
              {!isMobile && (
                <SidebarTrigger
                  className="shell-floating-toggle opacity-60 hover:opacity-100"
                  aria-label="Toggle Sidebar"
                />
              )}
            </div>
          ) : (
            <div className="shell-standard-header">
              <div className="shell-standard-brand">
                <ReuiMark />
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Bricklane</p>
                    {apps && <p className="text-xs text-muted-foreground">Pro plan</p>}
                  </div>
                )}
              </div>
              {!apps && <Notifications />}
              {variant === 3 && !isMobile && (
                <SidebarTrigger
                  className="shell-standard-toggle opacity-60 hover:opacity-100"
                  aria-label="Toggle Sidebar"
                />
              )}
            </div>
          )
        }
        footer={
          variant === 1 ? (
            <WorkspaceMenu collapsed={collapsed} user card />
          ) : floating ? (
            <WorkspaceMenu collapsed={collapsed} compact initial="Vercel" onName={setWorkspace} />
          ) : apps ? (
            <FooterLinks collapsed={collapsed} onSelect={setActive} />
          ) : (
            <WorkspaceMenu
              collapsed={collapsed}
              user={[9, 10].includes(variant)}
              initial={variant === 9 ? "Acme Corp" : variant === 10 ? "Atlas" : "Claude"}
              subtitle={variant === 9 ? "Acme Corp" : variant === 10 ? "Atlas" : undefined}
              onName={setWorkspace}
            />
          )
        }
        rail={
          floating || variant === 3 ? undefined : (
            <CollapseHandle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          )
        }
        className={` ${collapsed ? "collapsed" : ""} ${dark ? "shell-dark" : ""} ${apps ? "border-r" : ""} ${variant === 1 ? "border-r" : ""}`}
      >
        {hasSearch && (
          <div
            className={
              floating
                ? "shell-floating-search px-2 pt-2 mb-4"
                : "shell-standard-search px-2 pt-2 mb-4"
            }
          >
            <SearchPalette
              collapsed={collapsed}
              shortcut={variant === 10 ? "/" : "⌘K"}
              onSelect={setActive}
            />
          </div>
        )}
        <div className="shell-scroll px-0 pb-3">
          {apps ? (
            <>
              <Navigation
                items={[
                  { label: "Overview", icon: Home },
                  {
                    label: "Analytics",
                    icon: BarChart3,
                    badge: "Soon",
                    disabled: true,
                  },
                ]}
                label="Dashboards"
                collapsed={collapsed}
                active={active}
                onSelect={setActive}
              />
              <div className="mt-5">
                <Navigation
                  items={appsNavigation}
                  label="Workspace"
                  initialExpanded={["Account"]}
                  collapsed={collapsed}
                  active={active === "Overview" ? "Billing" : active}
                  onSelect={setActive}
                />
              </div>
            </>
          ) : (
            <Navigation
              items={nav}
              initialExpanded={variant === 1 ? ["Pipelines"] : variant === 2 ? ["Customers"] : []}
              collapsed={collapsed}
              active={active}
              onSelect={setActive}
              label={variant === 10 ? "Workspace" : "Platform"}
            />
          )}
          {variant === 1 && !collapsed && (
            <div className="sidebar-expanded">
              <ResourceLinks onSelect={setActive} />
            </div>
          )}
          {hasProjects && (
            <div className="sidebar-expanded">
              <PinnedProjects
                collapsed={collapsed}
                onSelect={setActive}
                names={
                  apps
                    ? [
                        "Billing Portal",
                        "Audience Sync",
                        "Report Builder",
                        "Network Map",
                        "Access Review",
                      ]
                    : undefined
                }
              />
            </div>
          )}
          {hasMembers && (
            <div className="sidebar-expanded">
              <Members collapsed={collapsed} onSelect={setActive} />
            </div>
          )}
        </div>
        {(variant === 1 || variant === 2) && (
          <div
            className={
              variant === 1 ? "shell-icon-dashboard-footer" : collapsed ? "" : "sidebar-expanded"
            }
          >
            <FooterLinks collapsed={collapsed} onSelect={setActive} />
          </div>
        )}
        {hasUsage && (
          <div className="sidebar-expanded shell-standard-usage mt-auto px-2 pb-2">
            <UsageCard
              collapsed={collapsed}
              title={variant === 9 ? "AI Credits" : "Spending Limit"}
              description={
                variant === 9 ? "Usage resets at the end of your billing cycle." : undefined
              }
              upgrade={variant === 9}
            />
          </div>
        )}
      </Sidebar>
      {variant === 1 && (
        <CreateItemDialog
          open={createWorkspace}
          onOpenChange={setCreateWorkspace}
          title="New workspace"
          onCreate={(name) => {
            const value = name.trim();
            if (!value) return;
            setWorkspaces((current) => (current.includes(value) ? current : [...current, value]));
            setWorkspace(value);
          }}
        />
      )}
      <AppShellInset className={`shell-content-frame ${inset ? "inset" : ""}`}>
        <header
          className={`shell-header ${apps || variant === 10 || variant === 9 ? "border-b" : ""}`}
        >
          <Breadcrumbs items={crumb} />
          <div className="flex shrink-0 items-center gap-1">
            {variant === 6 && (
              <>
                <div className="mr-2 flex -space-x-1">
                  {["Nick Johnson", "Alex Johnson", "Sarah Chen"].map((n, i) => (
                    <Face key={n} name={n} index={i} small />
                  ))}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="More options">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => toast("Workspace refreshed")}>
                        Refresh
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setNewItem(true)}>
                        Add a note
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant={context ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label={context ? "Close context panel" : "Open context panel"}
                  onClick={() => setContext(!context)}
                >
                  <PanelRight />
                </Button>
              </>
            )}
            {variant === 10 && (
              <>
                <label className="mr-2 hidden items-center gap-2 text-xs sm:flex">
                  <Switch checked={auto} onCheckedChange={setAuto} aria-label="Auto refresh" />
                  Auto Refresh
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="More options">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      {["Refresh", "Export", "Settings"].map((n) => (
                        <DropdownMenuItem key={n} onSelect={() => toast(`${n} selected`)}>
                          {n}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" className="ml-1 h-7 text-xs" onClick={() => setNewItem(true)}>
                  <Plus />
                  New order
                </Button>
              </>
            )}
            {apps && (
              <>
                <SearchPalette iconOnly onSelect={setActive} />
                <Notifications />
                <AppsMenu onSelect={setActive} />
                <WorkspaceMenu collapsed user initial="Atlas" />
              </>
            )}
          </div>
        </header>
        {apps && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-1 pt-5">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{active}</h1>
              <p className="mt-1 text-xs text-muted-foreground">Your workspace at a glance.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const blob = new Blob(["Workspace report\nStatus: ready\nDate: 2026-06-10"], {
                    type: "text/plain",
                  });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "workspace-report.txt";
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
              >
                Export
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={() => setNewItem(true)}>
                <Plus />
                New Report
              </Button>
            </div>
          </div>
        )}
        <PlaceholderCanvas solid={[3, 9, 10].includes(variant)} />
        {apps && (
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-6 py-3 text-[10px] text-muted-foreground">
            <span>
              2026 © <span className="text-foreground">Bricklane</span>
            </span>
            <div className="flex gap-3">
              {["Docs", "Changelog", "Support", "Privacy", "Status"].map((n) => (
                <Button
                  key={n}
                  variant="link"
                  className="h-auto p-0 text-[10px] font-normal text-muted-foreground"
                  onClick={() => toast(`${n} selected`)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </footer>
        )}
      </AppShellInset>
      {variant === 6 && context && (
        <ReuiSidebar collapsible="none" className="shell-context">
          <CalendarContext />
        </ReuiSidebar>
      )}
      <CreateItemDialog
        open={newItem}
        onOpenChange={setNewItem}
        title={apps ? "New report" : variant === 10 ? "New order" : "Add note"}
        onCreate={(name) => toast.success(`${name} created`)}
      />
    </div>
  );
}
export function IconRailDashboard() {
  return <InsetNavShell variant={1} />;
}
export function FloatingSidebarAdmin() {
  return <InsetNavShell variant={2} />;
}
export function ProjectTrackerSidebar() {
  return <InsetNavShell variant={3} />;
}
export function TeamCalendarPanel() {
  return <InsetNavShell variant={6} />;
}
export function TeamPresenceWorkspace() {
  return <InsetNavShell variant={9} />;
}
export function AiAgentsConsole() {
  return <InsetNavShell variant={10} />;
}
export function AppsGridHeader() {
  return <InsetNavShell variant={12} />;
}
