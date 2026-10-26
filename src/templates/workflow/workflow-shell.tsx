import {
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Bell, CircleHelp, LayoutDashboard, MoreHorizontal } from "lucide-react";
import { BrandGlyph } from "@/components/brand-mark";
import { ReuiSidebar, SidebarNavigation, SidebarRailButton } from "@/components/reui/sidebar";
import { AppShellInset } from "@/components/reui/layout";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CollapseHandle, SearchPalette } from "@/blocks/application/shells/chrome";
import { Person } from "./controls";
import "@/blocks/reference.css";
import "@/blocks/application/shells/shells.css";
import "./workflow-layout.css";
import { WorkflowAccountMenu } from "./workflow-account-menu";
import { WorkflowAccountSettings, type WorkflowAccountIdentity } from "./workflow-account-settings";
import type { WorkflowAccountSection } from "./workflow-account-settings-data";
import { demoAvatar } from "@/lib/demo-artwork";

export type NavItem = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  count?: string;
  children?: string[];
};

type ShellProps = {
  brand: string;
  view: string;
  setView: (view: string) => void;
  nav: NavItem[];
  children: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  dark?: boolean;
  extra?: ReactNode;
  taskNavigation?: ReactNode;
  mobileSecondaryNavigation?: ReactNode;
  mobileSecondaryWidth?: number;
  headerTitle?: ReactNode;
  headerActions?: ReactNode;
  closeMobileOnSelect?: (view: string) => boolean;
};

export function Logo() {
  return (
    <span className="wf-logo" aria-hidden="true">
      <BrandGlyph />
    </span>
  );
}

export function Shell(props: ShellProps) {
  const iconWidth = props.brand === "Flowly" ? 63 : 48;
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={!props.compact}
        keyboardShortcut={!props.compact}
        className={`wf-root wf-native-layout wf-${props.brand.toLowerCase()} ${props.compact ? "wf-compact" : ""} ${props.dark ? "wf-dark-sidebar" : ""}`}
        data-layout={
          props.brand === "Flowly" || props.brand === "AgentOps"
            ? "inset"
            : props.brand === "ReUI"
              ? "pane"
              : "document"
        }
        style={{ "--sidebar-width-icon": `${iconWidth}px` } as CSSProperties}
      >
        <ShellContent {...props} />
      </SidebarProvider>
    </TooltipProvider>
  );
}

function ShellContent({
  brand,
  view,
  setView,
  nav,
  children,
  actions,
  compact = false,
  dark = false,
  extra,
  taskNavigation,
  mobileSecondaryNavigation,
  mobileSecondaryWidth = 200,
  headerTitle,
  headerActions,
  closeMobileOnSelect,
}: ShellProps) {
  const { isMobile, state, setOpenMobile, toggleSidebar, triggerRef: mobileTrigger } = useSidebar();
  const hasMobileSecondary = isMobile && Boolean(mobileSecondaryNavigation);
  const collapsed = !isMobile && state === "collapsed";
  const iconRail = compact || collapsed;
  const inset = brand === "AgentOps";
  const width = brand === "ReUI" ? 250 : brand === "Flowly" ? 63 : brand === "Mesh" ? 48 : 256;
  const accountKind = brand === "ReUI" ? "tempo" : brand === "Mesh" ? "mesh" : undefined;
  const accountTrigger = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<WorkflowAccountSection>("profile");
  const [identity, setIdentity] = useState<WorkflowAccountIdentity>(() => ({
    name: brand === "Mesh" ? "Sienna Wells" : "Nick Bold",
    avatar: demoAvatar(brand === "Mesh" ? "Sienna Wells" : "Nick Bold"),
  }));
  const openSettings = (section: WorkflowAccountSection, trigger?: HTMLElement | null) => {
    returnFocus.current =
      isMobile && accountKind === "mesh"
        ? mobileTrigger.current
        : (trigger ?? (document.activeElement as HTMLElement));
    setSettingsSection(section);
    if (isMobile && accountKind === "mesh") setOpenMobile(false);
    setSettingsOpen(true);
  };
  const changeSettingsOpen = (open: boolean) => {
    setSettingsOpen(open);
    if (!open)
      requestAnimationFrame(() => {
        const target = returnFocus.current;
        if (target?.isConnected && target.getClientRects().length)
          target.focus({ preventScroll: true });
        else accountTrigger.current?.focus({ preventScroll: true });
      });
  };
  const shouldCloseMobile = (value: string) =>
    accountKind === "tempo" && value === "Settings"
      ? false
      : closeMobileOnSelect?.(value) !== false;
  const select = (value: string) => {
    if (accountKind && value === "Settings") {
      openSettings("profile");
      return;
    }
    setView(value);
    if (isMobile && shouldCloseMobile(value)) setOpenMobile(false);
  };
  const selectExtra = (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest("button");
    if (isMobile && button && !button.hasAttribute("aria-expanded")) setOpenMobile(false);
  };
  const navigation = (items: NavItem[], label?: string) => (
    <SidebarNavigation
      className="wf-native-navigation"
      label={label}
      items={items.map(({ label, icon: Icon = LayoutDashboard, count, children }) => ({
        label,
        icon: <Icon />,
        badge: count,
        children,
      }))}
      active={view}
      onSelect={select}
      closeOnSelect={accountKind === "tempo" || closeMobileOnSelect ? shouldCloseMobile : undefined}
      menuClassName={brand === "AgentOps" || brand === "DevOps" ? "min-w-48" : undefined}
    />
  );
  const tasksIndex = nav.findIndex((item) => item.label === "Tasks");
  const navLabel = compact ? undefined : brand === "ReUI" ? "Platform" : "Workspace";
  const railItems = (items: NavItem[]) => (
    <SidebarMenu className="wf-native-navigation wf-rail-navigation">
      {items.map(({ label, icon: Icon = LayoutDashboard }) => (
        <SidebarMenuItem key={label}>
          <SidebarRailButton label={label} active={view === label}>
            <button
              type="button"
              aria-label={label}
              aria-current={view === label ? "page" : undefined}
              onClick={() => select(label)}
            >
              <Icon />
            </button>
          </SidebarRailButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
  return (
    <>
      <ReuiSidebar
        width={width}
        gapWidth={brand === "Mesh" ? 49 : undefined}
        variant={inset ? "inset" : "sidebar"}
        className={`shell-reference wf-native-sidebar ${dark ? "wf-native-dark" : ""} ${compact ? "wf-native-rail" : ""}`}
        mobileClassName={`reui-reference shell-reference wf-native-mobile wf-${brand.toLowerCase()} ${compact ? "wf-native-rail" : ""} ${dark ? "wf-native-dark" : ""} ${hasMobileSecondary ? "wf-mobile-with-secondary" : ""}`}
        mobileWidth={
          hasMobileSecondary
            ? `calc(${compact ? "49px" : "75vw"} + ${mobileSecondaryWidth}px)`
            : compact
              ? "49px"
              : "75vw"
        }
        style={
          hasMobileSecondary
            ? ({ "--wf-mobile-secondary-width": `${mobileSecondaryWidth}px` } as CSSProperties)
            : undefined
        }
        mobileShowCloseButton={false}
        mobileTitle={`${brand === "ReUI" ? "Bricklane" : brand} navigation`}
        header={
          brand === "Flowly" && isMobile ? undefined : (
            <>
              <div className="wf-brand">
                <Logo />
                {!iconRail && <strong>{brand === "ReUI" ? "Bricklane" : brand}</strong>}
              </div>
            </>
          )
        }
        footer={
          <SidebarMenu className="wf-native-account">
            {compact && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={brand === "Flowly" ? "Notifications" : "Help"}
                  aria-label={brand === "Flowly" ? "Notifications" : "Help"}
                  onClick={() =>
                    toast.info(
                      brand === "Flowly"
                        ? "You are up to date. No new notifications."
                        : "Use the sidebar to explore this interactive local workspace.",
                    )
                  }
                >
                  {brand === "Flowly" ? <Bell /> : <CircleHelp />}
                  {!iconRail && (
                    <span>{brand === "Flowly" ? "Notifications" : "Help & documentation"}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              {accountKind ? (
                <WorkflowAccountMenu
                  kind={accountKind}
                  identity={identity}
                  collapsed={iconRail}
                  triggerRef={accountTrigger}
                  onSectionSelect={openSettings}
                />
              ) : (
                <SidebarMenuButton
                  tooltip="Account settings"
                  aria-label="Account settings"
                  onClick={() => select("Settings")}
                >
                  <span className="wf-avatar">{dark ? "C" : brand === "DevOps" ? "TO" : "NB"}</span>
                  {!iconRail && (
                    <span>
                      {dark ? "Claude" : brand === "DevOps" ? "Tomas Okonkwo" : "Nick Bold"}
                    </span>
                  )}
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        }
        rail={
          hasMobileSecondary ? (
            <div className="wf-mobile-secondary-navigation">{mobileSecondaryNavigation}</div>
          ) : !compact && !isMobile ? (
            <CollapseHandle collapsed={collapsed} onToggle={toggleSidebar} />
          ) : undefined
        }
      >
        {brand !== "DevOps" && !compact && (
          <div className="wf-native-search">
            <SearchPalette
              label="Search workspace"
              collapsed={collapsed}
              shortcut={brand === "AgentOps" ? "/" : "⌘K"}
              routes={nav.flatMap((item) => [item.label, ...(item.children ?? [])])}
              onSelect={select}
            />
          </div>
        )}
        {compact ? (
          brand === "Mesh" ? (
            <div className="wf-mesh-rail-groups">
              {railItems(nav.slice(0, 3))}
              <SidebarSeparator />
              {railItems(nav.slice(3))}
            </div>
          ) : (
            railItems(nav)
          )
        ) : taskNavigation && tasksIndex >= 0 ? (
          <>
            {navigation(nav.slice(0, tasksIndex + 1), navLabel)}
            {!collapsed && <div onClick={selectExtra}>{taskNavigation}</div>}
            {navigation(nav.slice(tasksIndex + 1))}
          </>
        ) : (
          navigation(nav, navLabel)
        )}
        {!collapsed && extra && (
          <div className="wf-native-extra" onClick={selectExtra}>
            {extra}
          </div>
        )}
      </ReuiSidebar>
      <AppShellInset className="wf-main">
        <header
          className={`wf-header ${headerTitle !== undefined || headerActions !== undefined ? "wf-header-override" : ""}`}
        >
          {isMobile && brand === "Mesh" && (
            <Button
              size="icon"
              variant="ghost"
              className="wf-mobile-brand"
              aria-label="Bricklane home"
              onClick={() => select("Home")}
            >
              <Logo />
            </Button>
          )}
          <SidebarTrigger className="wf-mobile-menu" aria-label="Open navigation" />
          {isMobile && brand === "Flowly" && (
            <Button
              size="icon"
              variant="ghost"
              className="wf-mobile-brand"
              aria-label="Bricklane home"
              onClick={() => select("Dashboard")}
            >
              <Logo />
            </Button>
          )}
          <span>
            {headerTitle !== undefined ? (
              headerTitle
            ) : brand === "AgentOps" ? (
              <span className="wf-inline wf-muted">
                <i className="wf-workspace-dot" />
                Atlas　›　
                <Person name="Nick Bold" index={3} />
                　›　<span className="wf-current-crumb">{view}</span>
              </span>
            ) : (
              view
            )}
          </span>
          <div
            className={`wf-header-actions ${headerActions !== undefined ? "wf-header-actions-override" : ""}`}
          >
            {headerActions !== undefined ? (
              <div className="wf-header-action-slot">{headerActions}</div>
            ) : (
              <>
                {brand === "DevOps" && (
                  <div className="wf-header-search">
                    <SearchPalette
                      label="Search or jump to…"
                      iconOnly={isMobile}
                      routes={[
                        ...nav.flatMap((item) => [item.label, ...(item.children ?? [])]),
                        "Integrations",
                        "Security",
                        "Settings",
                      ]}
                      onSelect={select}
                    />
                  </div>
                )}
                {(brand === "Flowly" || brand === "DevOps" || brand === "ReUI") && (
                  <div className="wf-header-avatars">
                    {["Tomas Lindqvist", "Ines Marchetti", "Hanna Berg"].map((name, i) => (
                      <Person key={name} name={name} index={i} />
                    ))}
                    <small>+{brand === "Flowly" ? "8" : "5"}</small>
                  </div>
                )}
                {actions}
                {brand === "Flowly" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="Dashboard menu">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {nav.map((n) => (
                        <DropdownMenuItem key={n.label} onSelect={() => setView(n.label)}>
                          {n.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Notifications"
                    onClick={() => toast.info("You are up to date. No new notifications.")}
                  >
                    <Bell />
                  </Button>
                )}
              </>
            )}
          </div>
        </header>
        <div className="wf-content">{children}</div>
      </AppShellInset>
      {accountKind && (
        <WorkflowAccountSettings
          kind={accountKind}
          open={settingsOpen}
          onOpenChange={changeSettingsOpen}
          initialSection={settingsSection}
          onIdentityChange={setIdentity}
        />
      )}
    </>
  );
}
