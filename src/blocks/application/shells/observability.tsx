import { ReuiSidebar } from "@/components/reui/sidebar";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppShellInset, useShellSidebarState } from "@/components/reui/layout";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChartColumn,
  Check,
  ChevronsUpDown,
  Cpu,
  Database,
  DatabaseZap,
  FileText,
  Home,
  Route,
  Blocks,
  Link,
  ListOrdered,
  LogOut,
  Monitor,
  Network,
  PanelLeft,
  Plus,
  ScanSearch,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Timer,
  UserRound,
  X,
  TextAlignStart,
} from "lucide-react";
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import WorkspaceBreadcrumb from "./workspace-breadcrumb";
import WorkspaceSkeleton from "./workspace-skeleton";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Face,
  toast,
} from "./chrome";
import type { ShellIcon } from "./chrome";
import "./observability.css";
type Page = {
  name: string;
  section: string;
  parent?: string;
  icon: ShellIcon;
  children?: string[];
};
const pages: Record<string, Page> = {
  home: { name: "Home", section: "Workspace", icon: Home },
  endpoints: { name: "Endpoints", section: "Observe", icon: Route },
  hosts: { name: "Hosts", section: "Observe", icon: Cpu },
  topology: { name: "Topology", section: "Observe", icon: Network },
  explorer: {
    name: "Explorer",
    section: "Investigate",
    icon: ScanSearch,
    children: ["traces", "logs", "sessions"],
  },
  traces: {
    name: "Traces",
    section: "Investigate",
    parent: "Explorer",
    icon: TextAlignStart,
  },
  logs: {
    name: "Logs",
    section: "Investigate",
    parent: "Explorer",
    icon: FileText,
  },
  sessions: {
    name: "Sessions",
    section: "Investigate",
    parent: "Explorer",
    icon: Monitor,
  },
  queries: { name: "Queries", section: "Investigate", icon: Database },
  checkout: { name: "Checkout Latency", section: "Pinned", icon: Timer },
  cache: { name: "Cache Hit Ratio", section: "Pinned", icon: DatabaseZap },
  queue: { name: "Queue Backlog", section: "Pinned", icon: ListOrdered },
  billing: { name: "Billing Workers", section: "Pinned", icon: ChartColumn },
  sources: { name: "Sources", section: "Workspace", icon: Blocks },
  settings: { name: "Settings", section: "Workspace", icon: Settings },
  observe: {
    name: "Observe",
    section: "",
    icon: Activity,
    children: ["endpoints", "hosts", "topology"],
  },
  investigate: {
    name: "Investigate",
    section: "",
    icon: ScanSearch,
    children: ["explorer", "queries"],
  },
};
const workspaces = [
  { name: "Nimbus Core", subtitle: "Production · EU West", color: "#009c90" },
  { name: "Nimbus Edge", subtitle: "Staging · US East", color: "#5d65df" },
  { name: "Nimbus Labs", subtitle: "Sandbox · EU West", color: "#c86dca" },
  { name: "Nimbus Data", subtitle: "Analytics · EU Central", color: "#cf8a34" },
];
function NavTree({
  group,
  query,
  active,
  navigate,
}: {
  group: string;
  query: string;
  active: string;
  navigate: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(["explorer"]);
  const expandedIds = useMemo(() => (query ? ["explorer"] : expanded), [query, expanded]);
  const matches = (id: string): boolean =>
    pages[id].name.toLowerCase().includes(query.toLowerCase()) ||
    Boolean(pages[id].children?.some(matches));
  const tree = useTree<Page>({
    rootItemId: group,
    state: { expandedItems: expandedIds },
    setExpandedItems: setExpanded,
    initialState: { focusedItem: pages[group].children?.[0] },
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => Boolean(item.getItemData().children),
    onPrimaryAction: (item) => {
      if (!item.isFolder()) navigate(item.getId());
    },
    dataLoader: {
      getItem: (id) => pages[id],
      getChildren: (id) => (pages[id].children ?? []).filter(matches),
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });
  useEffect(() => {
    tree.rebuildTree();
  }, [query, tree]);
  if (!pages[group].children?.some(matches)) return null;
  return (
    <section className="observe-nav-group">
      <p>{pages[group].name}</p>
      <Tree tree={tree} indent={22} aria-label={`${pages[group].name} pages`}>
        {tree.getItems().map((item) => {
          const row = item.getItemData();
          const Icon = row.icon;
          return (
            <TreeItem key={item.getId()} item={item} asChild>
              <button aria-selected={active === item.getId()} onFocus={() => item.setFocused()}>
                <TreeItemLabel>
                  <Icon />
                  <span>{row.name}</span>
                </TreeItemLabel>
              </button>
            </TreeItem>
          );
        })}
      </Tree>
    </section>
  );
}
function NavigationContent({
  collapsed = false,
  workspace,
  setWorkspace,
  active,
  navigate,
  pins,
  unpin,
  query,
  setQuery,
  theme,
  chooseTheme,
  searchTick,
  onSearch,
}: {
  collapsed?: boolean;
  workspace: number;
  setWorkspace: (n: number) => void;
  active: string;
  navigate: (id: string) => void;
  pins: string[];
  unpin: (id: string) => void;
  query: string;
  setQuery: (s: string) => void;
  theme: string;
  chooseTheme: (s: string) => void;
  searchTick: number;
  onSearch: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const selectedWorkspace = workspaces[workspace];
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "f" &&
        ((input.current?.getClientRects().length ?? 0) > 0 ||
          (searchButton.current?.getClientRects().length ?? 0) > 0)
      ) {
        e.preventDefault();
        if (collapsed) onSearch();
        else input.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [collapsed, onSearch]);
  useEffect(() => {
    if (searchTick > 0 && !collapsed && input.current?.getClientRects().length)
      input.current.focus();
  }, [searchTick, collapsed]);
  const matched = (id: string): boolean =>
    pages[id].name.toLowerCase().includes(query.toLowerCase()) ||
    Boolean(pages[id].children?.some(matched));
  const hasMatches = [
    "home",
    "endpoints",
    "hosts",
    "topology",
    "explorer",
    "queries",
    ...pins,
  ].some(matched);
  const navButton = (id: string) => {
    const Icon = pages[id].icon;
    return (
      <Button
        key={id}
        variant={active === id ? "secondary" : "ghost"}
        className="observe-nav-link"
        aria-label={pages[id].name}
        onClick={() => navigate(id)}
      >
        <Icon />
        {!collapsed && <span>{pages[id].name}</span>}
      </Button>
    );
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="observe-workspace-menu"
            aria-label={`Switch workspace, current ${selectedWorkspace.name}`}
          >
            <IconTile variant="solid" size="xs" style={{ background: selectedWorkspace.color }}>
              <Activity />
            </IconTile>
            {!collapsed && (
              <>
                <span>
                  <strong>{selectedWorkspace.name}</strong>
                  <small>{selectedWorkspace.subtitle}</small>
                </span>
                <ChevronsUpDown />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={collapsed ? "right" : "bottom"}
          align="start"
          className="reui-reference w-64"
        >
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuGroup>
            {workspaces.map((w, i) => (
              <DropdownMenuItem key={w.name} onSelect={() => setWorkspace(i)}>
                <IconTile size="sm" variant="solid" style={{ background: w.color }}>
                  <Activity />
                </IconTile>
                <span className="flex flex-col">
                  <strong className="text-xs font-medium">{w.name}</strong>
                  <small className="text-[10px] text-muted-foreground">{w.subtitle}</small>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Plus />
            <span>
              New Workspace
              <small className="block text-muted-foreground">Collaborate with others.</small>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {collapsed ? (
        <Button
          ref={searchButton}
          variant="ghost"
          size="icon-sm"
          aria-label="Search navigation"
          onClick={onSearch}
        >
          <Search />
        </Button>
      ) : (
        <InputGroup className="observe-nav-search">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            ref={input}
            aria-label="Search navigation"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <kbd>⌘F</kbd>
          </InputGroupAddon>
        </InputGroup>
      )}
      <div className="observe-nav-scroll">
        {collapsed ? (
          <>
            {navButton("home")}
            {["endpoints", "hosts", "topology", "queries", ...pins].map((id) => navButton(id))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Explorer">
                  <ScanSearch />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" className="reui-reference">
                <DropdownMenuGroup>
                  {["traces", "logs", "sessions"].map((id) => (
                    <DropdownMenuItem key={id} onSelect={() => navigate(id)}>
                      {pages[id].name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : hasMatches ? (
          <>
            {matched("home") && navButton("home")}
            <NavTree group="observe" query={query} active={active} navigate={navigate} />
            <NavTree group="investigate" query={query} active={active} navigate={navigate} />
            <section className="observe-pinned">
              <p>
                Pinned
                <Badge variant="outline" size="sm">
                  {pins.length}
                </Badge>
              </p>
              {pins.filter(matched).map((id) => {
                const Icon = pages[id].icon;
                return (
                  <div className="observe-pin-row" key={id}>
                    <Button
                      variant={active === id ? "secondary" : "ghost"}
                      onClick={() => navigate(id)}
                    >
                      <Icon />
                      <span>{pages[id].name}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Unpin ${pages[id].name}`}
                      onClick={() => unpin(id)}
                    >
                      <X />
                    </Button>
                  </div>
                );
              })}
              {pins.length === 0 && <small>Pin a page from its header to keep it here.</small>}
            </section>
          </>
        ) : (
          <Empty className="observe-empty">
            <EmptyHeader>
              <EmptyTitle>No Matches</EmptyTitle>
              <EmptyDescription>Try another page name or clear the search.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
      <footer className="observe-nav-footer">
        {navButton("sources")}
        {navButton("settings")}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="observe-account-menu"
              aria-label="Open account menu for Shadcn"
            >
              <Face name="Shadcn" />
              {!collapsed && (
                <>
                  <span>
                    <strong>Shadcn</strong>
                    <small>Author of Shadcn/ui</small>
                  </span>
                  <ChevronsUpDown />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
            align="start"
            className="reui-reference w-56"
          >
            <DropdownMenuLabel>
              Shadcn
              <small className="block text-muted-foreground">m@example.com</small>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {[
                ["Profile", UserRound],
                ["Sign-In Security", ShieldCheck],
                ["Manage Accounts", UserRound],
                ["Shift Roster", Monitor],
                ["Preferences", Settings],
                ["Runbooks", FileText],
                ["Help & Support", ShieldCheck],
              ].map(([name, Glyph]) => {
                const Icon = Glyph as ShellIcon;
                return (
                  <DropdownMenuItem key={String(name)}>
                    <Icon />
                    {String(name)}
                    {name === "Profile" && <span className="ml-auto text-xs">⇧⌘P</span>}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="reui-reference">
                <DropdownMenuRadioGroup value={theme} onValueChange={chooseTheme}>
                  {["light", "dark", "system"].map((value) => (
                    <DropdownMenuRadioItem value={value} key={value}>
                      {value[0].toUpperCase() + value.slice(1)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Sign Out<span className="ml-auto text-xs">⇧⌘Q</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </>
  );
}
export default function ObservabilityShell() {
  const [collapsed, setCollapsed] = useShellSidebarState();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  const [workspace, setWorkspace] = useState(0);
  const [active, setActive] = useState("home");
  const [pins, setPins] = useState(["checkout", "cache", "queue", "billing"]);
  const [query, setQuery] = useState("");
  const [searchTick, setSearchTick] = useState(0);
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  function chooseTheme(value: string) {
    setTheme(value);
    document.documentElement.classList.toggle(
      "dark",
      value === "dark" || (value === "system" && matchMedia("(prefers-color-scheme:dark)").matches),
    );
  }
  useEffect(() => {
    if (theme !== "system") return;
    const media = matchMedia("(prefers-color-scheme:dark)");
    const change = () => document.documentElement.classList.toggle("dark", media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [theme]);
  const onSearch = () => {
    setCollapsed(false);
    setSearchTick((v) => v + 1);
  };
  function pin(id: string) {
    setPins((v) => (v.includes(id) ? v : [...v, id]));
    toast("Page pinned", {
      description: pages[id].name,
      action: {
        label: "Undo",
        onClick: () => setPins((v) => v.filter((page) => page !== id)),
      },
    });
  }
  function unpin(id: string) {
    const index = pins.indexOf(id);
    setPins((v) => v.filter((p) => p !== id));
    toast("Page unpinned", {
      description: pages[id].name,
      action: {
        label: "Undo",
        onClick: () =>
          setPins((v) => {
            if (v.includes(id)) return v;
            const next = [...v];
            next.splice(index, 0, id);
            return next;
          }),
      },
    });
  }
  const { isMobile, setOpenMobile } = useSidebar();
  const navProps = {
    workspace,
    setWorkspace,
    active,
    navigate: (id: string) => {
      setActive(id);
      if (isMobile) setOpenMobile(false);
    },
    pins,
    unpin,
    query,
    setQuery,
    theme,
    chooseTheme,
    searchTick,
    onSearch,
  };
  const page = pages[active];
  return (
    <div className="shell-reference reui-reference observe-shell" data-shell-variant="36">
      <ReuiSidebar
        width={240}
        className={`observe-sidebar ${collapsed ? "collapsed" : ""}`}
        aria-label="Observability navigation"
        mobileTitle="Navigation"
        mobileDescription="Observability pages and workspaces"
        mobileClassName="observe-mobile-sidebar reui-reference"
      >
        <NavigationContent {...navProps} collapsed={collapsed} />
      </ReuiSidebar>
      <AppShellInset className="shell-content-frame">
        <header className="observe-header">
          <div>
            <Button
              className="observe-desktop-toggle"
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle Sidebar"
              onClick={() => setCollapsed(!collapsed)}
            >
              <PanelLeft />
            </Button>
            <SidebarTrigger className="observe-mobile-toggle" aria-label="Open navigation" />
            <span className="observe-header-divider" />
            <WorkspaceBreadcrumb
              items={[page.section, ...(page.parent ? [page.parent] : []), page.name]}
            />
          </div>
          <div>
            <Toggle
              variant="outline"
              aria-label="Pin"
              pressed={pins.includes(active)}
              onPressedChange={(pressed) => (pressed ? pin(active) : unpin(active))}
            >
              <Star data-icon="inline-start" />
              <span>Pin</span>
            </Toggle>
            <Button
              variant="outline"
              aria-label="Copy Link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  setCopied(true);
                } catch {
                  toast.error("Copy failed", {
                    description: "The browser blocked clipboard access.",
                  });
                }
              }}
            >
              {copied ? <Check /> : <Link />}
              <span>Copy Link</span>
              <span aria-live="polite" className="sr-only">
                {copied ? "Link copied" : ""}
              </span>
            </Button>
          </div>
        </header>
        <WorkspaceSkeleton />
      </AppShellInset>
    </div>
  );
}
