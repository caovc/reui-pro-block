import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import {
  Activity,
  Blocks,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  House,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  Tag,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ReuiSidebar, SidebarRailButton } from "@/components/reui/sidebar";
import { AppShellInset } from "@/components/reui/layout";
import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { demoAvatar } from "@/lib/demo-artwork";
import { StrataHeaderProvider } from "./strata-context";
import type { StrataRoute } from "./strata-domain";
import "./strata-shell.css";

type NavigationItem = {
  label: string;
  route: StrataRoute;
  icon: ComponentType<{ className?: string }>;
};

const navigation: { label: string; items: NavigationItem[] }[] = [
  { label: "Workspace", items: [{ label: "Overview", route: "/", icon: House }] },
  {
    label: "Observe",
    items: [
      { label: "Services", route: "/services", icon: Layers },
      { label: "Logs", route: "/logs", icon: FileText },
      { label: "Monitors", route: "/monitors", icon: Activity },
    ],
  },
  {
    label: "Ship",
    items: [
      { label: "Releases", route: "/deployments", icon: Tag },
      { label: "Deploy board", route: "/deployments/board", icon: LayoutGrid },
      { label: "Calendar", route: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Pinned",
    items: [
      { label: "checkout-api", route: "/services/checkout-api", icon: Layers },
      { label: "api.acme.com", route: "/monitors/api-acme-com", icon: Activity },
      { label: "Errors · payments", route: "/logs/errors-payments", icon: FileText },
      { label: "On-call · payments", route: "/calendar/on-call-payments", icon: CalendarDays },
    ],
  },
];

const workspaces = [
  { name: "Bricklane Core", description: "Production · EU West" },
  { name: "Bricklane Edge", description: "Staging · US East" },
  { name: "Bricklane Labs", description: "Sandbox · EU West" },
  { name: "Bricklane Data", description: "Analytics · EU Central" },
];

const workspaceTools: NavigationItem[] = [
  { label: "Sources", route: "/sources", icon: Blocks },
  { label: "Settings", route: "/settings", icon: Settings },
];
const routeCatalog = [...navigation.flatMap((group) => group.items), ...workspaceTools];

type ShellProps = {
  route: StrataRoute;
  onNavigate: (route: StrataRoute) => void;
  href: (route: StrataRoute) => string;
  workspace: number;
  onWorkspaceChange: (workspace: number) => void;
  onCreateWorkspace: () => void;
  onAccountAction: (action: string) => void;
  pinnedRoutes: readonly StrataRoute[];
  onTogglePin: (route: StrataRoute) => void;
  children: ReactNode;
};

/** Actual ReUI free Sidebar + Tree composition, with independent route data. */
export function StrataShell(props: ShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider className="strata-root h-dvh min-h-0 overflow-hidden">
        <ShellContent {...props} />
      </SidebarProvider>
    </TooltipProvider>
  );
}

function NavigationTree({
  label,
  items,
  route,
  href,
  onNavigate,
  onUnpin,
}: Pick<ShellProps, "route" | "href" | "onNavigate"> & {
  label: string;
  items: NavigationItem[];
  onUnpin?: (route: StrataRoute) => void;
}) {
  const container = useRef<HTMLElement>(null);
  const data = useMemo(() => new Map(items.map((item) => [item.route, item])), [items]);
  const tree = useTree<NavigationItem>({
    rootItemId: "root",
    initialState: { focusedItem: items[0]?.route },
    getItemName: (item) => item.getItemData().label,
    isItemFolder: (item) => item.getId() === "root",
    onPrimaryAction: (item) => onNavigate(item.getItemData().route),
    dataLoader: {
      getItem: (id) =>
        // The tree rebuilds its visible item list after this render. Keep the
        // catalog available while an unpinned or filtered item is being removed.
        id === "root"
          ? { label, route: "/", icon: House }
          : routeCatalog.find((entry) => entry.route === id)!,
      getChildren: (id) => (id === "root" ? items.map((item) => item.route) : []),
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });
  useEffect(() => {
    tree.rebuildTree();
  }, [tree, data]);
  if (!items.length) return null;
  return (
    <section className="strata-navigation-group" ref={container}>
      {label !== "Workspace" && (
        <div className="strata-navigation-label">
          {label}
          {label === "Pinned" && <span>{items.length}</span>}
        </div>
      )}
      <Tree tree={tree} indent={0} aria-label={`${label} navigation`}>
        {tree
          .getItems()
          .filter((item) => data.has(item.getId() as StrataRoute))
          .map((item) => {
            const row = item.getItemData();
            const Icon = row.icon;
            return (
              <TreeItem key={item.getId()} item={item} asChild>
                <div
                  className="strata-navigation-row"
                  aria-selected={route === row.route}
                  aria-current={route === row.route ? "page" : undefined}
                  data-pinned={Boolean(onUnpin) || undefined}
                  onKeyDown={(event) => {
                    if (
                      event.target === event.currentTarget &&
                      !event.metaKey &&
                      !event.ctrlKey &&
                      !event.altKey &&
                      !event.shiftKey &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      item.primaryAction();
                    }
                  }}
                >
                  <a
                    href={href(row.route)}
                    tabIndex={-1}
                    aria-current={route === row.route ? "page" : undefined}
                    onClick={(event) => {
                      // The Tree owns keyboard activation. The nested link owns
                      // pointer activation and preserves native modified clicks.
                      event.stopPropagation();
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                      event.preventDefault();
                      item.setFocused();
                      onNavigate(row.route);
                    }}
                  >
                    <TreeItemLabel>
                      <Icon />
                      <span>{row.label}</span>
                    </TreeItemLabel>
                  </a>
                  {onUnpin && (
                    <Button
                      className="strata-unpin"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Unpin ${row.label}`}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        const siblings = tree.getItems();
                        const index = siblings.findIndex(
                          (candidate) => candidate.getId() === item.getId(),
                        );
                        const next = siblings[index + 1] ?? siblings[index - 1];
                        const nextElement = next?.getElement();
                        const fallback = container.current
                          ?.closest('[data-sidebar="sidebar"]')
                          ?.querySelector<HTMLInputElement>('[aria-label="Search navigation"]');
                        onUnpin(row.route);
                        requestAnimationFrame(() => {
                          if (nextElement?.isConnected) {
                            next.setFocused();
                            nextElement.focus();
                          } else {
                            fallback?.focus();
                          }
                        });
                      }}
                    >
                      <X />
                    </Button>
                  )}
                </div>
              </TreeItem>
            );
          })}
      </Tree>
    </section>
  );
}

function ShellContent({
  route,
  onNavigate,
  href,
  workspace,
  onWorkspaceChange,
  onCreateWorkspace,
  onAccountAction,
  pinnedRoutes,
  onTogglePin,
  children,
}: ShellProps) {
  const { isMobile, state, setOpenMobile, setOpen, triggerRef } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const [query, setQuery] = useState("");
  const [headerTarget, setHeaderTarget] = useState<HTMLDivElement | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const navigate = (next: StrataRoute) => {
    onNavigate(next);
    if (isMobile) setOpenMobile(false);
  };
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "f" &&
        !(target instanceof HTMLElement && target.closest('[role="dialog"]'))
      ) {
        event.preventDefault();
        if (isMobile) setOpenMobile(true);
        else setOpen(true);
        requestAnimationFrame(() => search.current?.focus());
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile, setOpenMobile, setOpen]);
  const selectedWorkspace = workspaces[workspace] ?? workspaces[0];
  const matches = (item: NavigationItem) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase());
  const groups = navigation.map((group) =>
    group.label === "Pinned"
      ? {
          ...group,
          items: pinnedRoutes.flatMap((path) => {
            const item = routeCatalog.find((entry) => entry.route === path);
            return item ? [item] : [];
          }),
        }
      : group,
  );
  const filteredGroups = groups.map((group) => ({ ...group, items: group.items.filter(matches) }));
  const filteredTools = workspaceTools.filter(matches);
  const activeGroup = navigation.find((group) => group.items.some((item) => item.route === route));
  const active = activeGroup?.items.find((item) => item.route === route);
  const breadcrumb = active?.label ?? (route === "/sources" ? "Sources" : "Settings");
  return (
    <StrataHeaderProvider target={headerTarget}>
      <ReuiSidebar
        width={240}
        mobileWidth="240px"
        mobileTitle="Navigation"
        className="strata-sidebar"
        mobileClassName="strata-sidebar"
        header={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="strata-workspace" aria-label="Switch workspace">
                  <BrandMark className="size-6 shrink-0 text-foreground" />
                  {!collapsed && (
                    <>
                      <span>
                        <strong>{selectedWorkspace.name}</strong>
                        <small>{selectedWorkspace.description}</small>
                      </span>
                      <ChevronsUpDown className="size-3.5" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="strata-menu w-64" align="start">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuGroup>
                  {workspaces.map((item, index) => (
                    <DropdownMenuItem key={item.name} onSelect={() => onWorkspaceChange(index)}>
                      <BrandMark className="size-6 shrink-0" />
                      <span className="flex-1">
                        <span className="block">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                      {workspace === index && <Check className="size-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onCreateWorkspace}>
                  <Plus /> New Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!collapsed && (
              <InputGroup className="strata-search">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  ref={search}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  aria-label="Search navigation"
                />
                <InputGroupAddon align="inline-end">
                  <kbd>⌘F</kbd>
                </InputGroupAddon>
              </InputGroup>
            )}
          </>
        }
        footer={
          <>
            <NavigationTree
              label="Workspace tools"
              items={filteredTools}
              route={route}
              href={href}
              onNavigate={navigate}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="strata-workspace strata-account" aria-label="Account menu">
                  <img src={demoAvatar("Maya Ellis")} alt="" />
                  {!collapsed && (
                    <>
                      <span>
                        <strong>Maya Ellis</strong>
                        <small>Platform workspace</small>
                      </span>
                      <ChevronsUpDown className="size-3.5" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="strata-menu w-52" side="top" align="start">
                <DropdownMenuLabel>Local demo account</DropdownMenuLabel>
                <DropdownMenuGroup>
                  {[
                    "Profile",
                    "General",
                    "API keys",
                    "Security",
                    "Billing",
                    "Theme",
                    "Sign Out",
                  ].map((action) => (
                    <DropdownMenuItem key={action} onSelect={() => onAccountAction(action)}>
                      {action}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      >
        {filteredGroups.map((group) => {
          const items = group.items;
          if (collapsed)
            return (
              <div key={group.label} className="strata-rail">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarRailButton
                      key={item.route}
                      label={item.label}
                      active={route === item.route}
                    >
                      <a
                        href={href(item.route)}
                        aria-label={item.label}
                        aria-current={route === item.route ? "page" : undefined}
                        onClick={(event) => {
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                            return;
                          event.preventDefault();
                          navigate(item.route);
                        }}
                      >
                        <Icon />
                      </a>
                    </SidebarRailButton>
                  );
                })}
              </div>
            );
          return (
            <NavigationTree
              key={group.label}
              label={group.label}
              items={items}
              route={route}
              href={href}
              onNavigate={navigate}
              onUnpin={group.label === "Pinned" ? onTogglePin : undefined}
            />
          );
        })}
        {query && !filteredGroups.some((group) => group.items.length) && !filteredTools.length && (
          <p className="strata-no-navigation">No matching pages</p>
        )}
      </ReuiSidebar>
      <AppShellInset className="strata-main">
        <header className="strata-header">
          <BrandMark className="strata-mobile-brand" />
          <SidebarTrigger ref={triggerRef} aria-label="Toggle navigation" />
          <span className="strata-header-divider" />
          <div className="strata-breadcrumb">
            {activeGroup && !["Workspace", "Pinned"].includes(activeGroup.label) && (
              <>
                <span>{activeGroup.label}</span>
                <ChevronRight />
              </>
            )}
            <span aria-current="page">{breadcrumb}</span>
          </div>
          <div className="strata-header-actions" ref={setHeaderTarget} />
        </header>
        <section className="strata-page-scroll" aria-label={`${breadcrumb} content`}>
          {children}
        </section>
      </AppShellInset>
    </StrataHeaderProvider>
  );
}
