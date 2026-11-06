import { CollapseHandle, SearchPalette } from "@/blocks/application/shells/chrome";
import { MiniTrend } from "@/blocks/data/sparkline-primitives";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ReuiSidebar,
  SidebarNavigation,
  SidebarCollection,
  SidebarRailButton,
  SidebarWorkspaceSwitcher,
} from "@/components/reui/sidebar";
import { BrandGlyph } from "@/components/brand-mark";
import { AtlasAccountControl } from "./atlas-shell-chrome";
import { SurgeSidebarNavigation } from "./surge-shell-chrome";
import {
  CohortAccountControl,
  CohortDepartments,
  CohortSidebarHeader,
} from "./cohort-shell-chrome";
import { demoAvatar } from "@/lib/demo-artwork";
const userAvatar = demoAvatar("Nick Bold");
/* Shared template primitives and small data helpers intentionally share one module. */
/* eslint-disable react/only-export-components */
import { createContext, useContext, useState, type ReactNode, type ComponentProps } from "react";
import {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  Settings,
  CalendarDays,
  ChartNoAxesCombined,
  FileText,
  Bell,
  Stethoscope,
  CircleCheck,
  Activity,
  Target,
  BriefcaseBusiness,
  Clock,
  Folder,
  Tag,
  Star,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FramePanel,
  FrameHeader,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { BusinessGrid } from "./grid";
import { BusinessBars, BusinessArea } from "./charts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import "@/blocks/reference.css";
import "@/blocks/application/shells/shells.css";
import "./business-layout.css";
import "./atlas-shell-chrome.css";
import "./cohort-shell-chrome.css";
import "./surge-shell-chrome.css";
import "./manifest-shell-chrome.css";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
export {
  Button,
  Input,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  toast,
};
export const icons = {
  Payments: CreditCard,
  Dashboard: LayoutDashboard,
  Deals: FileText,
  Products: Package,
  Billing: CreditCard,
  Users,
  Reports: ChartNoAxesCombined,
  Orders: ShoppingBag,
  Inventory: Package,
  Customers: Users,
  Categories: Folder,
  Promotions: Tag,
  Reviews: Star,
  Analytics: ChartNoAxesCombined,
  Settings,
  Approvals: CircleCheck,
  People: Users,
  Hiring: BriefcaseBusiness,
  Time: Clock,
  Today: CalendarDays,
  "Activity Feed": Activity,
  "Quick Stats": ChartNoAxesCombined,
  Attainment: Target,
  "Quota Plan": FileText,
  Patients: Users,
  Appointments: CalendarDays,
  Staff: Stethoscope,
  Invoices: CreditCard,
  Calendar: CalendarDays,
  Pipeline: Target,
  Contacts: Users,
  Companies: BriefcaseBusiness,
  Forecast: ChartNoAxesCombined,
};
export function Mark() {
  return (
    <span className="bt-mark" aria-hidden="true">
      <BrandGlyph />
    </span>
  );
}

const NavigationCloseContext = createContext<() => void>(() => {});
export function NavItems({
  items,
  active,
  onSelect,
  atlas = false,
  groups,
  label,
  menuClassName,
  showTooltips = true,
  closeOnSelect = true,
}: {
  items: string[];
  active: string;
  onSelect: (value: string) => void;
  atlas?: boolean;
  groups?: Record<string, string[]>;
  label?: string;
  menuClassName?: string;
  showTooltips?: boolean;
  closeOnSelect?: boolean;
}) {
  const closeNavigation = useContext(NavigationCloseContext);
  return (
    <nav className="bt-nav bt-reui-navigation">
      <SidebarNavigation
        label={label}
        menuClassName={menuClassName}
        showTooltips={showTooltips}
        closeOnSelect={closeOnSelect}
        active={active}
        onSelect={(value) => {
          onSelect(value);
          if (closeOnSelect) closeNavigation();
        }}
        items={items.map((label) => {
          const Icon = icons[label as keyof typeof icons] ?? FileText;
          return {
            label,
            icon: <Icon />,
            children:
              groups?.[label] ??
              (atlas && label === "Users"
                ? ["All Users", "Roles & Permissions", "Access Control", "Audit Log"]
                : undefined),
          };
        })}
      />
    </nav>
  );
}

function BusinessNotifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="reui-reference" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <p className="px-2 py-3 text-sm text-muted-foreground">No unread notifications.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Shell(props: ComponentProps<typeof ShellContent>) {
  const framed = ["cohort", "verve", "miro"].includes(props.id);
  return (
    <SidebarProvider
      data-sidebar-side={props.sidebarSide ?? "left"}
      data-reduce-animations={props.reduceAnimations ? "true" : undefined}
      className={`bt-app bt-layout bt-${props.id} ${props.rail ? "bt-has-rail" : ""} ${framed ? "bt-framed" : ""}`}
      style={
        {
          "--sidebar-width-icon":
            props.id === "cohort" ? "64px" : props.id === "atlas" ? "48px" : "62px",
        } as React.CSSProperties
      }
    >
      <ShellContent {...props} />
    </SidebarProvider>
  );
}
function ShellContent({
  id,
  brand,
  active,
  setActive,
  items,
  children,
  aside,
  rail = false,
  top,
  topWrapper = "span",
  notifications,
  topbarNotifications,
  headerActions,
  pageHref,
  footer,
  navGroups,
  account,
  accountMenuContent,
  surgeSidebarAccount,
  manifestSidebarAccount,
  miroSidebarAccount,
  sidebarSide = "left",
  showTooltips = true,
}: {
  id: string;
  brand: string;
  active: string;
  setActive: (x: string) => void;
  items: string[];
  children: ReactNode;
  aside?: ReactNode;
  rail?: boolean;
  top?: ReactNode;
  topWrapper?: "span" | "div";
  notifications?: ReactNode;
  topbarNotifications?: ReactNode;
  headerActions?: ReactNode;
  pageHref?: (page: string, department?: string) => string;
  footer?: ReactNode;
  navGroups?: Record<string, string[]>;
  account?: { name: string; organisation: string; photo?: string };
  accountMenuContent?: ReactNode;
  surgeSidebarAccount?: ReactNode;
  manifestSidebarAccount?: ReactNode;
  miroSidebarAccount?: ReactNode;
  sidebarSide?: "left" | "right";
  reduceAnimations?: boolean;
  showTooltips?: boolean;
}) {
  const { state, isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const [workspace, setWorkspace] = useState(brand);
  const [workspaces, setWorkspaces] = useState(
    id === "atlas" ? [brand, "Northstar", "Relay"] : [brand],
  );
  const [createWorkspace, setCreateWorkspace] = useState(false);
  const commerce = ["surge", "manifest"].includes(id);
  const crossHeader = commerce || id === "verve";
  const closeNavigation = () => setOpenMobile(false);
  function select(value: string) {
    setActive(value);
    if (id !== "miro") closeNavigation();
  }
  const accountName = account?.name || (id === "cohort" ? "Bruno Duarte" : "Nick Bold");
  const accountOrganisation =
    account?.organisation || (id === "cohort" ? "Cohort UK" : "nick@bricklane.demo");
  const accountControl =
    id === "surge" && surgeSidebarAccount ? (
      surgeSidebarAccount
    ) : id === "manifest" && manifestSidebarAccount ? (
      manifestSidebarAccount
    ) : id === "miro" && miroSidebarAccount ? (
      miroSidebarAccount
    ) : id === "atlas" ? (
      <AtlasAccountControl
        name={accountName}
        email={accountOrganisation}
        photo={account?.photo}
        side={sidebarSide}
        showTooltips={showTooltips}
        onNavigate={(value) => {
          if (value === "Account settings") setActive(value);
          else select(value);
        }}
      />
    ) : id === "cohort" && pageHref ? (
      <CohortAccountControl
        name={accountName}
        organisation={accountOrganisation}
        photo={account?.photo}
        pageHref={pageHref}
        onNavigate={setActive}
        showTooltips={showTooltips}
      />
    ) : (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                tooltip={showTooltips ? accountName : undefined}
                className="bt-account-button"
                aria-label={`Open account menu for ${accountName}`}
              >
                <span className="bt-avatar">
                  {account?.photo ? (
                    <img src={account.photo} alt="" />
                  ) : account ? (
                    accountName
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")
                  ) : id === "cohort" ? (
                    "BD"
                  ) : (
                    <img src={userAvatar} alt="" />
                  )}
                </span>
                {!collapsed && !rail && (
                  <span className="bt-account-copy">
                    <strong>{accountName}</strong>
                    <small>{accountOrganisation}</small>
                  </span>
                )}
                {!collapsed && !rail && <ChevronDown className="ml-auto size-3.5" />}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="reui-reference"
              side={isMobile ? "top" : sidebarSide === "right" ? "left" : "right"}
              align="end"
            >
              {accountMenuContent ?? (
                <>
                  <DropdownMenuLabel>{accountName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {account && (
                    <DropdownMenuItem onSelect={() => select("Profile")}>Profile</DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => select("Settings")}>Settings</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  const collapseControl =
    isMobile || id !== "cohort" ? null : (
      <SidebarTrigger
        className="bt-sidebar-toggle"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      />
    );
  const header = (
    <>
      {id === "cohort" && pageHref ? (
        <CohortSidebarHeader
          brand={brand}
          pageHref={pageHref}
          onDashboard={() => setActive("Dashboard")}
          notifications={<BusinessNotifications />}
        />
      ) : null}
      {id !== "cohort" &&
        !commerce &&
        !rail &&
        (id === "atlas" ? (
          <div className="bt-sidebar-workspace">
            <SidebarWorkspaceSwitcher
              value={workspace}
              workspaces={workspaces}
              onSelect={setWorkspace}
              onCreate={() => setCreateWorkspace(true)}
            />
            {collapseControl}
          </div>
        ) : (
          <div className="bt-brand">
            <Mark />
            {!collapsed && <strong>{brand}</strong>}
            {id === "cohort" && !collapsed && !isMobile && <BusinessNotifications />}
            {collapseControl}
          </div>
        ))}
      {!rail && (!aside || isMobile) && id !== "atlas" && id !== "cohort" && (
        <SearchPalette
          label="Search navigation"
          collapsed={collapsed}
          routes={[...new Set([...items, ...Object.values(navGroups ?? {}).flat()])]}
          onSelect={select}
        />
      )}
    </>
  );
  const navigation = (
    <>
      {id === "surge" && pageHref ? (
        <SurgeSidebarNavigation
          items={items}
          groups={navGroups}
          active={active}
          pageHref={pageHref}
          onNavigate={setActive}
          showTooltips={showTooltips}
          side={sidebarSide}
        />
      ) : id === "manifest" && pageHref ? (
        <SurgeSidebarNavigation
          items={items}
          groups={navGroups}
          active={active}
          pageHref={pageHref}
          onNavigate={setActive}
          showTooltips={showTooltips}
          side={sidebarSide}
        />
      ) : (
        (aside ?? (
          <>
            <NavItems
              label={id === "atlas" ? "Menu" : id === "cohort" ? "Workspace" : "Store"}
              atlas={id === "atlas"}
              menuClassName={id === "cohort" ? "min-w-48" : undefined}
              groups={navGroups}
              showTooltips={showTooltips}
              items={
                commerce ? items.filter((item) => !["Analytics", "Settings"].includes(item)) : items
              }
              active={active}
              closeOnSelect={id !== "cohort"}
              onSelect={id === "cohort" ? setActive : select}
            />
            {commerce && (
              <NavItems
                label="System"
                groups={navGroups}
                showTooltips={showTooltips}
                items={items.filter((item) => ["Analytics", "Settings"].includes(item))}
                active={active}
                onSelect={select}
              />
            )}
          </>
        ))
      )}
      {!collapsed && id === "atlas" && (
        <SidebarCollection
          label="Favorites"
          rows={["Weekly revenue", "Open deals", "New signups", "Low stock"].map(
            (label, index) => ({
              label,
              icon: (
                <span className="inline-flex size-4 shrink-0 items-center justify-center">
                  <span
                    className="bt-metric-dot"
                    style={{ background: `var(--bt-series-${index})` }}
                  />
                </span>
              ),
            }),
          )}
          onSelect={(name) =>
            select(
              ["Reports", "Deals", "Users", "Products"][
                ["Weekly revenue", "Open deals", "New signups", "Low stock"].indexOf(name)
              ],
            )
          }
        />
      )}
      {!collapsed && id === "cohort" && pageHref ? (
        <CohortDepartments pageHref={pageHref} />
      ) : (
        !collapsed &&
        id === "cohort" && (
          <SidebarCollection
            label="Headcount by department"
            rows={["Engineering", "People", "Sales", "Customer Success", "Design"].map(
              (label, index) => ({
                label,
                icon: (
                  <span className="inline-flex size-4 shrink-0 items-center justify-center">
                    <span
                      className="bt-metric-dot"
                      style={{
                        background: ["#3b82f6", "#a855f7", "#bbf7d0", "#fb923c", "#f9a8d4"][index],
                      }}
                    />
                  </span>
                ),
              }),
            )}
            onSelect={() => select("People")}
          />
        )
      )}
    </>
  );
  const sidebarFooter = (
    <>
      {id !== "atlas" &&
        id !== "cohort" &&
        id !== "surge" &&
        id !== "manifest" &&
        !collapsed &&
        footer && (
          <div
            className="bt-custom-footer"
            onClick={(event) => {
              const target =
                event.target instanceof Element ? event.target.closest("button, a") : null;
              if (target && !target.hasAttribute("aria-haspopup")) closeNavigation();
            }}
          >
            {footer}
          </div>
        )}
      {!rail && accountControl}
    </>
  );
  const topbar = (
    <header
      className={`bt-topbar${id === "atlas" ? " atlas-topbar" : id === "cohort" ? " cohort-topbar" : id === "surge" ? " surge-topbar" : id === "manifest" ? " manifest-topbar" : ""}`}
    >
      {isMobile && (
        <SidebarTrigger
          className="bt-mobile-menu"
          aria-label={id === "miro" ? "Toggle Sidebar" : "Open menu"}
        />
      )}
      {collapsed && rail && !isMobile && (
        <SidebarTrigger className="bt-expand-trigger" aria-label="Expand sidebar" />
      )}
      {commerce && <Mark />}
      {topWrapper === "div" ? (
        <div className="bt-top-content">{top ?? active}</div>
      ) : (
        <span>{top ?? active}</span>
      )}
      <div className="bt-topbar-right">
        {id === "atlas" || id === "cohort" ? (
          headerActions
        ) : commerce ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Store status">
                ◉ Store <Badge variant="warning-light">Attention</Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="reui-reference" align="end">
              <DropdownMenuLabel>Store</DropdownMenuLabel>
              {["Products", "Inventory", "Orders"].map((page) => (
                <DropdownMenuItem key={page} onSelect={() => select(page)}>
                  {page}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : topbarNotifications !== undefined ? (
          topbarNotifications
        ) : notifications !== undefined ? (
          notifications
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="reui-reference" align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <p className="px-2 py-3 text-sm text-muted-foreground">No unread notifications.</p>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
  const applicationRail = (
    <ReuiSidebar
      collapsible="none"
      width={isMobile || id === "miro" ? 48 : 63}
      className={`bt-icon-rail bt-layout-rail${isMobile ? " bt-mobile-icon-rail" : ""}`}
      aria-label={`${brand} applications`}
      header={
        id === "miro" && pageHref ? (
          <a
            href={pageHref("Dashboard")}
            aria-label="Bricklane Clinic, back to the dashboard"
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              select("Dashboard");
            }}
          >
            <Mark />
          </a>
        ) : (
          <Mark />
        )
      }
      footer={
        <>
          {id === "miro" && (
            <>
              {notifications !== undefined ? notifications : <BusinessNotifications />}
              <SearchPalette label="Search" iconOnly routes={items} onSelect={select} />
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarRailButton label="Settings" active={active === "Settings"}>
                    <button type="button" aria-label="Settings" onClick={() => select("Settings")}>
                      <Settings />
                    </button>
                  </SidebarRailButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </>
          )}
          {accountControl}
        </>
      }
    >
      <SidebarMenu>
        {items
          .filter((item) => id !== "miro" || item !== "Settings")
          .map((item) => {
            const Icon = icons[item as keyof typeof icons] ?? FileText;
            return (
              <SidebarMenuItem key={item}>
                <SidebarRailButton label={item} active={active === item}>
                  <button type="button" aria-label={item} onClick={() => select(item)}>
                    <Icon />
                  </button>
                </SidebarRailButton>
              </SidebarMenuItem>
            );
          })}
      </SidebarMenu>
    </ReuiSidebar>
  );
  return (
    <NavigationCloseContext.Provider value={closeNavigation}>
      {rail && !isMobile && applicationRail}
      <div className="bt-workspace" data-sidebar-state={state}>
        {crossHeader && topbar}
        <div className="bt-layout-columns">
          <ReuiSidebar
            side={sidebarSide}
            width={id === "miro" ? 302 : id === "verve" ? 200 : commerce ? 260 : 256}
            collapsible={rail ? "offcanvas" : "icon"}
            className="bt-sidebar shell-reference"
            aria-label={`${brand} navigation`}
            mobileClassName={`reui-reference bt-app bt-sidebar-mobile bt-layout-mobile bt-${id}${id === "atlas" ? " shell-reference" : ""}${rail ? " bt-mobile-with-rail" : ""}`}
            mobileTitle={id === "miro" ? "Sidebar" : id === "manifest" ? "Sidebar" : brand}
            {...(id === "miro"
              ? { mobileDescription: "Displays the mobile sidebar." }
              : id === "manifest"
                ? { mobileDescription: "Displays the mobile sidebar." }
                : {})}
            mobileShowCloseButton={!commerce && id !== "miro" && id !== "atlas" && id !== "cohort"}
            mobileWidth={
              id === "cohort"
                ? "min(288px, calc(100vw - 32px))"
                : id === "surge"
                  ? "calc((100vw - var(--removed-body-scroll-bar-size, 0px)) * 0.75)"
                  : id === "manifest"
                    ? "calc((100vw - var(--removed-body-scroll-bar-size, 0px)) * 0.75)"
                    : "75vw"
            }
            header={header}
            footer={sidebarFooter}
            rail={
              id !== "cohort" && (!isMobile || id === "atlas") ? (
                <CollapseHandle
                  collapsed={collapsed}
                  onToggle={toggleSidebar}
                  showTooltips={showTooltips}
                />
              ) : undefined
            }
          >
            {rail && isMobile && applicationRail}
            {id === "cohort" && (
              <div className="cohort-sidebar-search">
                <SearchPalette
                  label="Search navigation"
                  collapsed={collapsed}
                  routes={[...new Set([...items, ...Object.values(navGroups ?? {}).flat()])]}
                  onSelect={select}
                />
              </div>
            )}
            {navigation}
            {id === "surge" && !collapsed && footer && (
              <div className="surge-sidebar-info">{footer}</div>
            )}
            {id === "manifest" && !collapsed && footer && (
              <div className="manifest-sidebar-info">{footer}</div>
            )}
            {id === "cohort" && !collapsed && footer && (
              <div className="cohort-plan-content">{footer}</div>
            )}
            {id === "atlas" && footer && (
              <div
                className="bt-atlas-footer-content"
                onClick={(event) => {
                  const target =
                    event.target instanceof Element ? event.target.closest("button, a") : null;
                  if (target && target.textContent?.trim() !== "Settings") closeNavigation();
                }}
              >
                {footer}
              </div>
            )}
          </ReuiSidebar>
          <SidebarInset className="bt-main">
            {!crossHeader && topbar}
            <div className="bt-content">{children}</div>
          </SidebarInset>
        </div>
      </div>
      <RecordDialog
        title="New workspace"
        open={createWorkspace}
        onOpenChange={setCreateWorkspace}
        fields={[{ name: "name", label: "Workspace name" }]}
        onSave={({ name }) => {
          const value = name.trim();
          if (!value) return;
          setWorkspaces((current) => [...new Set([...current, value])]);
          setWorkspace(value);
        }}
      />
    </NavigationCloseContext.Provider>
  );
}
export function Heading({
  title,
  description,
  action,
  onAction,
  date = "May 12, 2026 - Jun 10, 2026",
  onExport,
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
  date?: string;
  onExport?: () => void;
}) {
  return (
    <div className="bt-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="bt-actions">
        <Button
          variant="outline"
          type="button"
          onClick={() => toast("Showing the current demo reporting period")}
        >
          <CalendarDays />
          {date}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={
            onExport ??
            (() =>
              exportCsv("report", [
                ["Metric", "Value"],
                ["Revenue", "20000"],
                ["Orders", "33"],
              ]))
          }
        >
          <Download />
          Export
        </Button>
        {action && (
          <Button type="button" onClick={onAction}>
            <Plus />
            {action}
          </Button>
        )}
      </div>
    </div>
  );
}
export function exportCsv(name: string, rows: string[][]) {
  const blob = new Blob(
    [rows.map((row) => row.map((x) => '"' + x.replaceAll('"', '""') + '"').join(",")).join("\n")],
    { type: "text/csv" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV downloaded");
}
export function Panel({
  title,
  description,
  children,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Frame className={`bt-panel ${className}`}>
      <FrameHeader>
        <div className="bt-panel-heading">
          <div>
            <FrameTitle>{title}</FrameTitle>
            {description && <FrameDescription>{description}</FrameDescription>}
          </div>
          {action}
        </div>
      </FrameHeader>
      <FramePanel>{children}</FramePanel>
    </Frame>
  );
}
export function Spark({
  color = "var(--bt-green)",
  index = 0,
}: {
  color?: string;
  index?: number;
}) {
  const series = [
    [9, 13, 10, 24, 19, 27, 18, 23, 31],
    [13, 7, 20, 23, 17, 28, 18, 30, 25],
  ];
  return (
    <div className="bt-spark">
      <MiniTrend
        values={series[index % 2]}
        color={color}
        height={35}
        label="Metric trend"
        curve="linear"
      />
    </div>
  );
}

export function Bars(props: {
  labels: string[];
  large?: boolean;
  multi?: boolean;
  values?: number[];
}) {
  return <BusinessBars {...props} />;
}
export function Area(props: { mono?: boolean }) {
  return <BusinessArea {...props} />;
}
export function Period({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList>
        {["Week", "Month", "Year"].map((x) => (
          <TabsTrigger key={x} value={x}>
            {x}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
export function RecordDialog({
  title,
  open,
  onOpenChange,
  fields,
  onSave,
}: {
  title: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fields: {
    name: string;
    label: string;
    type?: string;
    value?: string;
  }[];
  onSave: (values: Record<string, string>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Update your workspace with this record.</DialogDescription>
        </DialogHeader>
        <form
          className="bt-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(
              Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>,
            );
            onOpenChange(false);
          }}
        >
          {fields.map((f) => (
            <label key={f.name}>
              {f.label}
              <Input
                name={f.name}
                aria-label={f.label}
                type={f.type ?? "text"}
                step={f.type === "number" ? "any" : undefined}
                required
                defaultValue={f.value ?? ""}
              />
            </label>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function DataTable({
  columns,
  rows,
  query = "",
  onRow,
  onReset,
}: {
  columns: string[];
  rows: (string | ReactNode)[][];
  query?: string;
  onRow?: (i: number) => void;
  onReset?: () => void;
}) {
  const filtered = rows
    .map((row, i) => ({ row, i }))
    .filter(({ row }) =>
      row.some((c) => typeof c === "string" && c.toLowerCase().includes(query.toLowerCase())),
    );
  return (
    <>
      <BusinessGrid
        headers={columns}
        rows={filtered.map((x) => x.row)}
        onRow={onRow ? (i) => onRow(filtered[i].i) : undefined}
      />
      {!filtered.length && onReset && (
        <Button variant="outline" onClick={onReset}>
          Clear filters
        </Button>
      )}
    </>
  );
}

export function SettingsPage({ brand }: { brand: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <>
      <Heading title="Settings" description="Manage your workspace preferences." />
      <Panel title="Workspace profile" description="Your team’s shared information.">
        <form
          className="bt-form bt-settings"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
            toast.success("Settings saved");
          }}
        >
          <label>
            Workspace name
            <Input defaultValue={brand} required />
          </label>
          <label>
            Contact email
            <Input defaultValue="hello@example.com" type="email" required />
          </label>
          <label>
            Timezone
            <Input defaultValue="Asia/Shanghai" required />
          </label>
          <Button type="submit">Save changes</Button>
          {saved && <p role="status">Your workspace settings have been updated.</p>}
        </form>
      </Panel>
    </>
  );
}
export const allIcons = {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  ChevronDown,
};
