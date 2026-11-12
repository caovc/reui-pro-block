import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import {
  Activity,
  Blocks,
  CalendarDays,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  House,
  Layers,
  LayoutGrid,
  CreditCard,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Sun,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ReuiSidebar, SidebarRailButton } from "@/components/reui/sidebar";
import { AppShellInset } from "@/components/reui/layout";
import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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

const defaultWorkspaces = [
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
  workspaceOptions?: readonly { name: string; description: string }[];
  onWorkspaceChange: (workspace: number) => void;
  onCreateWorkspace: () => void;
  workspaceTriggerRef?: RefObject<HTMLButtonElement | null>;
  onAccountAction: (action: string) => void;
  accountTriggerRef?: RefObject<HTMLButtonElement | null>;
  account?: { name: string; description: string; email: string; avatar?: string };
  themeMode?: "light" | "dark" | "system";
  onThemeChange?: (mode: "light" | "dark" | "system") => void;
  pinnedRoutes: readonly StrataRoute[];
  onTogglePin: (route: StrataRoute) => void;
  children: ReactNode;
};

/** Actual ReUI free Sidebar + Tree composition, with independent route data. */
export function StrataShell(props: ShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider className="strata-root h-[calc(100dvh-var(--template-toolbar-height,0px))] min-h-0 overflow-hidden">
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
  workspaceOptions = defaultWorkspaces,
  onWorkspaceChange,
  onCreateWorkspace,
  workspaceTriggerRef,
  onAccountAction,
  accountTriggerRef,
  account = {
    name: "Maya Ellis",
    description: "Platform workspace",
    email: "maya@bricklane.test",
    avatar: demoAvatar("Maya Ellis"),
  },
  themeMode = "system",
  onThemeChange,
  pinnedRoutes,
  onTogglePin,
  children,
}: ShellProps) {
  const { isMobile, state, setOpenMobile, setOpen, triggerRef } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const [query, setQuery] = useState("");
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const createWorkspaceRequested = useRef(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const signOutRequested = useRef(false);
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
  const selectedWorkspace =
    workspaceOptions[workspace] ?? workspaceOptions[0] ?? defaultWorkspaces[0];
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
            <DropdownMenu open={workspaceMenuOpen} onOpenChange={setWorkspaceMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  ref={workspaceTriggerRef}
                  className="strata-workspace"
                  aria-label={`Switch workspace, current ${selectedWorkspace.name}`}
                >
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
              <DropdownMenuContent
                className="strata-menu w-64"
                align="start"
                onCloseAutoFocus={(event) => {
                  if (!createWorkspaceRequested.current) return;
                  event.preventDefault();
                  createWorkspaceRequested.current = false;
                  onCreateWorkspace();
                }}
              >
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={String(workspace)}
                  onValueChange={(value) => {
                    const index = Number(value);
                    if (Number.isInteger(index) && workspaceOptions[index])
                      onWorkspaceChange(index);
                  }}
                >
                  {workspaceOptions.map((item, index) => (
                    <DropdownMenuRadioItem key={`${index}-${item.name}`} value={String(index)}>
                      <BrandMark className="size-6 shrink-0" />
                      <span className="flex-1">
                        <span className="block">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    createWorkspaceRequested.current = true;
                    setWorkspaceMenuOpen(false);
                  }}
                >
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
            <DropdownMenu open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  ref={accountTriggerRef}
                  className="strata-workspace strata-account"
                  aria-label="Account menu"
                >
                  <Avatar>
                    <AvatarImage src={account.avatar || undefined} alt="" />
                    <AvatarFallback>
                      {account.name
                        .split(/\s+/)
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <span>
                        <strong>{account.name}</strong>
                        <small>{account.description}</small>
                      </span>
                      <ChevronsUpDown className="size-3.5" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="strata-menu w-56"
                side={isMobile ? "top" : "right"}
                align="end"
                sideOffset={8}
                collisionPadding={8}
                onCloseAutoFocus={(event) => {
                  if (!signOutRequested.current) return;
                  event.preventDefault();
                  signOutRequested.current = false;
                  onAccountAction("Sign Out");
                }}
              >
                <DropdownMenuLabel className="strata-account-summary">
                  <Avatar>
                    <AvatarImage src={account.avatar || undefined} alt="" />
                    <AvatarFallback>{account.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span>
                    <strong>{account.name}</strong>
                    <small>{account.email}</small>
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {[
                    { label: "Profile", icon: UserRound },
                    { label: "General", icon: SlidersHorizontal },
                    { label: "API keys", icon: KeyRound },
                    { label: "Security", icon: Shield },
                    { label: "Billing", icon: CreditCard },
                  ].map(({ label, icon: Icon }) => (
                    <DropdownMenuItem
                      key={label}
                      onSelect={() => {
                        onAccountAction(label);
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <Icon />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="strata-account-theme"
                    onSelect={(event) => event.preventDefault()}
                    onKeyDown={(event) => {
                      if (
                        event.target === event.currentTarget &&
                        ["Enter", " ", "ArrowRight"].includes(event.key)
                      ) {
                        event.preventDefault();
                        event.stopPropagation();
                        const group = event.currentTarget.querySelector(
                          '[data-slot="toggle-group"]',
                        );
                        const selected = group?.querySelector<HTMLButtonElement>(
                          'button[data-state="on"], button[aria-pressed="true"]',
                        );
                        (selected ?? group?.querySelector<HTMLButtonElement>("button"))?.focus();
                      }
                    }}
                  >
                    <Palette />
                    <span>Theme</span>
                    <ToggleGroup
                      type="single"
                      value={themeMode}
                      variant="outline"
                      size="sm"
                      aria-label="Theme"
                      onValueChange={(value) => {
                        if (value !== "light" && value !== "dark" && value !== "system") return;
                        if (onThemeChange) onThemeChange(value);
                        else onAccountAction(`Theme:${value}`);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (
                          ["Enter", " ", "ArrowLeft", "ArrowRight", "Home", "End"].includes(
                            event.key,
                          )
                        )
                          event.stopPropagation();
                      }}
                    >
                      <ToggleGroupItem value="light" aria-label="Light">
                        <Sun />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="dark" aria-label="Dark">
                        <Moon />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="system" aria-label="System">
                        <Monitor />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    signOutRequested.current = true;
                    setAccountMenuOpen(false);
                  }}
                >
                  <LogOut />
                  Sign Out
                </DropdownMenuItem>
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
