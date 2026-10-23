import { ReuiSidebar } from "@/components/reui/sidebar";
import { AppShellInset, useShellSidebarState } from "@/components/reui/layout";
import { useState } from "react";
import {
  ChevronRight,
  Ellipsis,
  Filter,
  List,
  PanelLeft,
  Pin,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Badge,
  Breadcrumbs,
  CollapseHandle,
  CreateItemDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FooterLinks,
  Input,
  Navigation,
  Notifications,
  PlaceholderCanvas,
  ReuiMark,
  SearchPalette,
  WorkspaceMenu,
  toast,
} from "./chrome";
import {
  Choices,
  ContentCards,
  Face,
  GroupedNav,
  PageTitle,
  Rail,
  Segments,
  Sidebar,
} from "./primitives";
import { CalendarContext } from "./calendar-panel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
const communityGroups = [
  {
    label: "General",
    items: ["Dashboards", "Public Profiles", "Account Settings", "Network", "Authentication"],
  },
  {
    label: "Custom Feed",
    items: ["Create a custom feed", "New order received", "New customer registered"],
  },
  {
    label: "Communities",
    items: ["Create a community", "Designers Hub", "React Guild", "Node Runtime"],
  },
  {
    label: "Resources",
    items: ["About ReUI", "Advertise", "Help", "Blog", "Careers", "Press"],
  },
];
const sourceGroups = [
  { label: "", items: ["Home", "Updates", "Inbox", "Clients", "My Tasks"] },
  {
    label: "Workspaces",
    items: ["Business Concepts", "Northstar Studio", "Teams", "Reports"],
  },
  {
    label: "Communities",
    items: ["Create A Community", "Designers Hub", "React Js", "Node Js"],
  },
];
export function CommunityShell() {
  const [collapsed, setCollapsed] = useShellSidebarState();
  const [active, setActive] = useState("Public Profiles");
  const [query, setQuery] = useState("");
  const [create, setCreate] = useState(false);
  const [filters, setFilters] = useState(["Popular", "Latest", "Following"]);
  return (
    <div className="shell-reference flex-col" data-shell-variant="13">
      <header className="shell-header border-b">
        <div className="flex items-center gap-4">
          <ReuiMark small />
          <strong className="text-sm">Bricklane</strong>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle Sidebar"
            onClick={() => setCollapsed((v) => !v)}
          >
            <PanelLeft />
          </Button>
        </div>
        <Input
          placeholder="Search ReUI"
          aria-label="Search community"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="hidden h-8 max-w-xs md:block"
        />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCreate(true)}>
            <Plus />
            Create
          </Button>
          <Notifications />
          <WorkspaceMenu collapsed user />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar
          width={240}
          collapsed={collapsed}
          className="!w-60 border-r !bg-background"
          label="Community navigation"
        >
          <GroupedNav groups={communityGroups} active={active} onSelect={setActive} query={query} />
          <FooterLinks collapsed={collapsed} onSelect={setActive} />
        </Sidebar>
        <AppShellInset className="shell-content-frame">
          <div className="flex items-center justify-between gap-3 p-3">
            <div>
              <h1 className="text-base font-medium">Community Feeds</h1>
              <p className="text-xs text-muted-foreground">
                Manage your feed preferences and filters
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter />
                  Manage Feeds<Badge>{filters.length}</Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {["Popular", "Latest", "Following", "Trending"].map((name) => (
                    <DropdownMenuItem
                      key={name}
                      onSelect={(e) => {
                        e.preventDefault();
                        setFilters((v) =>
                          v.includes(name) ? v.filter((n) => n !== name) : [...v, name],
                        );
                      }}
                    >
                      {filters.includes(name) ? "✓" : "○"} {name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <PlaceholderCanvas rows={2} solid />
        </AppShellInset>
      </div>
      <CreateItemDialog
        open={create}
        onOpenChange={setCreate}
        title="Create community feed"
        onCreate={(name) => {
          setActive(name);
          toast.success(`${name} created`);
        }}
      />
    </div>
  );
}
export function DualWorkspace({ variant }: { variant: 14 | 16 }) {
  const [section, setSection] = useState("Missions");
  const [active, setActive] = useState("Updates");
  const [hidden, setHidden] = useState(false);
  const [view, setView] = useState("List");
  const [action, setAction] = useState("");
  const [workspace, setWorkspace] = useState("Thunder AI");
  const [create, setCreate] = useState(false);
  return (
    <div className="shell-reference" data-shell-variant={variant}>
      <Rail
        dark={variant === 16}
        active={section}
        onChange={(value) => {
          setSection(value);
          setHidden(false);
        }}
      />
      {!hidden && (
        <Sidebar width={264} className="!w-[264px] border-r" label="Workspace navigation">
          <div className="flex h-12 items-center justify-between">
            <Choices
              label="Workspaces"
              value={workspace}
              items={["Thunder AI", "Metronic", "KeenThemes Studio"]}
              onChange={setWorkspace}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Collapse secondary navigation"
              onClick={() => setHidden(true)}
            >
              <PanelLeft />
            </Button>
          </div>
          <GroupedNav groups={sourceGroups} active={active} onSelect={setActive} />
          <CollapseHandle
            collapsed={false}
            label="secondary navigation"
            onToggle={() => setHidden(true)}
          />
        </Sidebar>
      )}
      <AppShellInset className="shell-content-frame">
        <header className="shell-header border-b">
          {hidden ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Expand secondary navigation"
              onClick={() => setHidden(false)}
            >
              <PanelLeft />
            </Button>
          ) : null}
          <Breadcrumbs items={variant === 14 ? ["Home", active] : [active]} />
          <div className="flex items-center gap-1">
            <div className="hidden sm:block">
              <SearchPalette onSelect={setActive} />
            </div>
            <Button variant="outline" size="sm" onClick={() => setActive("Reports")}>
              Reports
            </Button>
            <Button size="sm" onClick={() => setCreate(true)}>
              <Plus />
              Add
            </Button>
            <Face />
          </div>
        </header>
        {variant === 14 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
            <Segments
              label="Workspace views"
              items={["List", "Kanban", "Calendar", "Dashboard"]}
              value={view}
              onChange={setView}
            />
            <div className="flex gap-1">
              {[
                ["Sort", List],
                ["View", SlidersHorizontal],
                ["Filter", Filter],
                ["Search", Search],
              ].map(([name, I]) => {
                const Icon = I as typeof List;
                return (
                  <Button
                    size="sm"
                    variant={action === name ? "secondary" : "outline"}
                    aria-pressed={action === name}
                    key={String(name)}
                    className="h-7 px-2 text-xs"
                    onClick={() => setAction(action === name ? "" : String(name))}
                  >
                    <Icon />
                    {name === "Search" ? "" : String(name)}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
        <PlaceholderCanvas rows={2} solid />
      </AppShellInset>
      <CreateItemDialog
        open={create}
        onOpenChange={setCreate}
        title="Add workspace item"
        onCreate={(name) => toast.success(`${name} added`)}
      />
    </div>
  );
}
export function FavoritesShell() {
  const [collapsed, setCollapsed] = useShellSidebarState();
  const [active, setActive] = useState("Dashboard");
  const [workspace, setWorkspace] = useState("Mint");
  const [pinned, setPinned] = useState(["Tasks", "Notes", "Contacts", "Companies", "Company"]);
  return (
    <div className="shell-reference flex-col" data-shell-variant="15">
      <header className="shell-header shell-dark !min-h-10">
        <div className="flex items-center gap-3">
          <ReuiMark small />
          <span>Bricklane</span>
        </div>
        <div className="flex items-center gap-2">
          <Choices
            label="Upgrade"
            value="✣ Upgrade"
            items={["Pro workspace", "Enterprise workspace"]}
            onChange={(v) => toast(v)}
            compact
          />
          <Choices
            label="New"
            value="New"
            items={["Task", "Note", "Contact", "Company"]}
            onChange={(v) => toast(`New ${v} selected`)}
            compact
          />
          <div className="hidden -space-x-1 sm:flex">
            {[0, 1, 2].map((i) => (
              <Face key={i} index={i} small />
            ))}
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar width={248} collapsed={collapsed} className="!w-[248px] border-r !bg-background">
          <div className="flex h-12 items-center justify-between">
            <Choices
              label="Workspaces"
              value={workspace}
              items={["Mint", "Studio", "Nova", "Orbit"]}
              onChange={setWorkspace}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle Sidebar"
              onClick={() => setCollapsed((v) => !v)}
            >
              <PanelLeft />
            </Button>
          </div>
          <Navigation
            label=""
            items={["Dashboard", ...pinned].map((label) => ({
              label,
              icon: List,
            }))}
            collapsed={collapsed}
            active={active}
            onSelect={setActive}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="shell-nav-button justify-start" variant="ghost">
                <Ellipsis />
                {!collapsed && "More"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                {["Tasks", "Notes", "Contacts", "Companies", "Company", "Reports", "Activity"].map(
                  (name) => (
                    <DropdownMenuItem
                      key={name}
                      onSelect={(e) => {
                        e.preventDefault();
                        setPinned((v) =>
                          v.includes(name) ? v.filter((n) => n !== name) : [...v, name],
                        );
                      }}
                    >
                      <Pin />
                      {name}
                      <span className="ml-auto">{pinned.includes(name) ? "✓" : "+"}</span>
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {!collapsed && (
            <GroupedNav
              groups={[
                {
                  label: "Favorites",
                  items: ["New task", "New deal", "Recent note", "Lead added"],
                },
              ]}
              active={active}
              onSelect={setActive}
            />
          )}
          <div className="mt-auto flex border-t">
            <Button variant="ghost" className="flex-1" onClick={() => toast("Invite selected")}>
              Invite
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => toast("Help selected")}>
              Help
            </Button>
          </div>
        </Sidebar>
        <AppShellInset className="shell-content-frame">
          <PageTitle title={active}>
            <Button variant="outline" size="sm" onClick={() => setActive("Reports")}>
              Reports
            </Button>
          </PageTitle>
          <PlaceholderCanvas rows={2} solid />
        </AppShellInset>
      </div>
    </div>
  );
}
export function WorkbenchShell() {
  const [collapsed, setCollapsed] = useShellSidebarState();
  const [active, setActive] = useState("Today");
  const [regions, setRegions] = useState(["Navigation", "Details", "Workbench", "Calendar"]);
  const [tab, setTab] = useState("Settings");
  const [view, setView] = useState("Overview");
  const [expanded, setExpanded] = useState(false);
  const toggle = (name: string) =>
    setRegions((v) => (v.includes(name) ? v.filter((n) => n !== name) : [...v, name]));
  return (
    <div className="shell-reference" data-shell-variant="11">
      {regions.includes("Navigation") && (
        <Sidebar collapsed={collapsed}>
          <div className="flex h-12 items-center justify-between px-2">
            <ReuiMark />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle Sidebar"
              onClick={() => setCollapsed((v) => !v)}
            >
              <PanelLeft />
            </Button>
          </div>
          <SearchPalette collapsed={collapsed} onSelect={setActive} />
          <Notifications />
          <GroupedNav
            groups={[
              {
                label: "Workspace",
                items: ["Today", "Handoffs", "Follow-ups", "Brief Queue", "Accounts", "Insights"],
              },
              {
                label: "Operators",
                items: [
                  "Maya Chen",
                  "Owen Price",
                  "Noah Singh",
                  "Iris Hale",
                  "Sofia Bennett",
                  "Liam Carter",
                ],
              },
            ]}
            active={active}
            onSelect={setActive}
          />
          <WorkspaceMenu initial="Codex" />
        </Sidebar>
      )}
      <div className="shell-content-frame">
        <header className="shell-header border-b">
          <Breadcrumbs items={["Atlas Desk", "Production"]} />
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => toast("Help selected")}>
              Help
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast("Ask ReUI selected")}>
              <Sparkles />
              Ask ReUI
            </Button>
          </div>
        </header>
        <header className="shell-header border-b">
          <strong>⬡ Codex</strong>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => toast("Add note selected")}
            >
              Add note
            </Button>
            {["Navigation", "Details", "Workbench", "Calendar"].map((name) => (
              <Button
                variant={regions.includes(name) ? "secondary" : "ghost"}
                size="icon-sm"
                key={name}
                aria-label={`Toggle ${name.toLowerCase()}`}
                aria-pressed={regions.includes(name)}
                onClick={() => toggle(name)}
              >
                <PanelLeft />
              </Button>
            ))}
          </div>
        </header>
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize="25%" defaultSize={expanded ? "30%" : "65%"}>
            <div className="flex h-full min-h-0">
              <div className="flex min-w-0 flex-1 flex-col">
                <Segments
                  label="Workspace views"
                  items={["Overview", "Activity", "Briefs", "Timeline", "Files"]}
                  value={view}
                  onChange={setView}
                />
                <ContentCards layout="workbench" />
              </div>
              {regions.includes("Details") && (
                <ReuiSidebar
                  collapsible="none"
                  className="hidden w-[280px] flex-col border-l lg:flex"
                >
                  <div className="flex items-center justify-between border-b p-2">
                    Details
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Close details"
                      onClick={() => toggle("Details")}
                    >
                      ×
                    </Button>
                  </div>
                  <ContentCards layout="details" />
                </ReuiSidebar>
              )}
            </div>
          </ResizablePanel>
          {regions.includes("Workbench") && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel minSize="20%" defaultSize="35%">
                <section className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b px-4 py-1">
                    <strong className="text-xs">Workbench</strong>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Expand workbench"
                        aria-pressed={expanded}
                        onClick={() => setExpanded((v) => !v)}
                      >
                        <ChevronRight />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Close workbench"
                        onClick={() => toggle("Workbench")}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                  <ContentCards layout="table" />
                  <Segments
                    label="Workbench tabs"
                    items={["Settings", "Webhooks", "Events", "Logs", "Health", "Inspector"]}
                    value={tab}
                    onChange={setTab}
                  />
                </section>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
      {regions.includes("Calendar") && (
        <ReuiSidebar collapsible="none" className="shell-context max-lg:!hidden">
          <CalendarContext />
        </ReuiSidebar>
      )}
    </div>
  );
}
