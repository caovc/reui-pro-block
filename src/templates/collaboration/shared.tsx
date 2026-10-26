import { rosterSettingsTabs } from "./roster-settings-model";
import {
  ReuiSidebar,
  SidebarNavigation,
  SidebarCollection,
  SidebarWorkspaceSwitcher,
} from "@/components/reui/sidebar";
import { AppShellLayout, AppShellInset } from "@/components/reui/layout";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { SearchPalette } from "@/blocks/application/shells/chrome";
import { useGlobalTheme, setGlobalTheme } from "@/components/site/global-theme-store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
  FrameFooter,
} from "@/components/reui/frame";
import { Progress } from "@/components/ui/progress";
import { Avatar as FreeAvatar, AvatarFallback } from "@/components/ui/avatar";
import "@/blocks/reference.css";
import "./navigation.css";
import { BrandGlyph } from "@/components/brand-mark";
import { demoAvatar, demoPanel } from "@/lib/demo-artwork";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  Home,
  LayoutDashboard,
  Settings,
  Users,
  Calendar,
  Briefcase,
  CheckSquare,
  Ticket,
  BookOpen,
  BarChart3,
  UserRound,
  Ellipsis,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Plus,
  Palette,
  Activity,
  CircleDot,
  Clock3,
  CircleMinus,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import "./styles.css";
import "./collaboration-layout.css";
export {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
};
export function Mark() {
  return (
    <span className="ct-mark" aria-hidden="true">
      <BrandGlyph />
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="ct-avatar">
      <img src={demoAvatar(name)} alt="" />
    </span>
  );
}
export function ReferenceSheet({
  title,
  description,
  open,
  onClose,
  children,
  footer,
  width = 480,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        className="ct-reference-sheet"
        style={{ width, maxWidth: "calc(100vw - 32px)" }}
      >
        <div className="ct-sheet-heading">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className={description ? "" : "sr-only"}>
            {description || title}
          </SheetDescription>
        </div>
        <div className="ct-sheet-body">{children}</div>
        {footer && <div className="ct-sheet-footer">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
export function Modal({
  title,
  description,
  open,
  onClose,
  children,
  contentClassName,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={[title === "New Folder" ? "ct-folder-modal" : "", contentClassName]
          .filter(Boolean)
          .join(" ")}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description || "Changes are saved in this local demo workspace."}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
const icons = [LayoutDashboard, CheckSquare, Users, Briefcase, Calendar, Settings];
type ShellProps = {
  kind: "roster" | "pulse";
  view: string;
  setView: (v: string) => void;
  children: ReactNode;
  extra?: ReactNode;
  query: string;
  setQuery: (v: string) => void;
  rosterIdentity?: { name: string; company: string; photo: boolean; image: string };
};
export function Shell(props: ShellProps) {
  return (
    <div className={`ct-app ct-${props.kind} ct-layout`}>
      <AppShellLayout>
        <CollaborationShell {...props} />
      </AppShellLayout>
    </div>
  );
}
function CollaborationShell({
  kind,
  view,
  setView,
  children,
  extra,
  query,
  setQuery,
  rosterIdentity,
}: ShellProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const { theme } = useGlobalTheme();
  const [invite, setInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [pendingInvitations, setPendingInvitations] = useState<string[]>([]);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [createOrganization, setCreateOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [extraOrganizations, setExtraOrganizations] = useState<string[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<{
    name: string;
    origin: string;
  } | null>(null);
  const [product, setProduct] = useState("All products");
  const [availability, setAvailability] = useState("Available");
  const [signedOut, setSignedOut] = useState(false);
  const defaultOrganization =
    kind === "roster" ? rosterIdentity?.company || "Roster UK" : "Help Desk";
  const organizations = [
    ...new Set([
      defaultOrganization,
      ...(kind === "roster" ? ["Roster EU", "Roster APAC"] : ["Starter Kit", "Enterprise"]),
      ...extraOrganizations,
    ]),
  ];
  const organization =
    selectedOrganization?.origin === defaultOrganization
      ? selectedOrganization.name
      : defaultOrganization;
  function selectOrganization(name: string) {
    setSelectedOrganization(
      name === defaultOrganization ? null : { name, origin: defaultOrganization },
    );
  }
  const accountName = kind === "roster" ? rosterIdentity?.name || "Bruno Duarte" : "Nick Bold";
  function navigate(name: string) {
    setView(name === "Directory" ? "People" : name);
    setQuery("");
    if (isMobile) setOpenMobile(false);
  }
  const profilePhoto =
    kind === "roster" && rosterIdentity ? (
      <span className="ct-avatar">
        {rosterIdentity.photo ? (
          <img src={rosterIdentity.image || demoAvatar(accountName)} alt="" />
        ) : (
          <UserRound size={18} aria-label="No profile photo" />
        )}
      </span>
    ) : (
      <Avatar name={accountName} />
    );
  const account = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="ct-profile ct-account-trigger"
          aria-label={kind === "roster" ? "Open account menu" : "Open user menu"}
        >
          <span aria-hidden="true" className="ct-account-avatar">
            {profilePhoto}
            <i data-availability={availability} />
          </span>
          {!collapsed && (
            <>
              <span>
                <b>{accountName}</b>
                <small>{kind === "roster" ? organization : "nick.bold@pulse.io"}</small>
              </span>
              {kind === "roster" ? <Ellipsis size={16} /> : <ChevronDown size={14} />}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "top" : "right"}
        align="end"
        className={`reui-reference ct-account-menu ${kind === "roster" ? "min-w-60" : "w-56"}`}
      >
        {kind === "roster" ? (
          <>
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={organization} onValueChange={selectOrganization}>
              {organizations.map((name, index) => (
                <DropdownMenuRadioItem key={name} value={name}>
                  <FreeAvatar className="ct-organization-avatar" aria-hidden="true">
                    <AvatarFallback data-color={index % 3}>
                      {name.startsWith("Roster ")
                        ? name.slice(7, 9)
                        : name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </FreeAvatar>
                  {name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuItem onSelect={() => setCreateOrganization(true)}>
              <Plus />
              New Organization
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Account</DropdownMenuLabel>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="ct-account-identity">
              <span aria-hidden="true">{profilePhoto}</span>
              <span>
                <b>{accountName}</b>
                <span className="block font-normal text-muted-foreground">nick.bold@pulse.io</span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          disabled={kind === "pulse"}
          title={kind === "pulse" ? "The local account profile is not available yet" : undefined}
          onSelect={() => navigate("Profile")}
        >
          <UserRound />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={kind === "pulse"}
          title={
            kind === "pulse" ? "The local account preferences are not available yet" : undefined
          }
          onSelect={() => navigate("Preferences")}
        >
          <Settings />
          Preferences
        </DropdownMenuItem>
        {kind === "pulse" && (
          <>
            <DropdownMenuItem disabled title="Billing is not available in this local demo">
              <CreditCard />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="ct-account-option-row">
              <span>
                <Activity />
                Availability
              </span>
              <DropdownMenuRadioGroup
                value={availability}
                onValueChange={(value) => value && setAvailability(value)}
                aria-label="Availability"
              >
                {[
                  { value: "Available", icon: CircleDot },
                  { value: "Away", icon: Clock3 },
                  { value: "Do not disturb", icon: CircleMinus },
                ].map(({ value, icon: Icon }) => (
                  <DropdownMenuRadioItem
                    key={value}
                    value={value}
                    aria-label={value}
                    title={value}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <Icon />
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </div>
          </>
        )}
        <div className="ct-account-option-row">
          <span>
            <Palette />
            Theme
          </span>
          <DropdownMenuRadioGroup
            value={theme.mode === "dark" || theme.mode === "light" ? theme.mode : "system"}
            onValueChange={(mode) => mode && setGlobalTheme({ ...theme, mode })}
            aria-label="Theme"
          >
            {[
              { value: "light", name: "Light", icon: Sun },
              { value: "dark", name: "Dark", icon: Moon },
              { value: "system", name: "System", icon: Monitor },
            ].map(({ value, name, icon: Icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                aria-label={name}
                title={name}
                onSelect={(event) => event.preventDefault()}
              >
                <Icon />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            setOpenMobile(false);
            setSignedOut(true);
          }}
        >
          <LogOut />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const nav =
    kind === "roster"
      ? ["Dashboard", "Approvals", "People", "Hiring", "Time", "Settings"]
      : ["Dashboard", "Tickets", "Contacts", "Team", "Knowledge Base", "Reports", "Settings"];
  const pulseIcons = [LayoutDashboard, Ticket, Users, Users, BookOpen, BarChart3, Settings];
  const side = (
    <>
      <div className="ct-layout-search">
        <SearchPalette
          label="Search workspace"
          collapsed={collapsed}
          routes={
            kind === "roster"
              ? [
                  "Dashboard",
                  "Approvals",
                  "Directory",
                  "Import",
                  "Hiring",
                  "Time",
                  ...rosterSettingsTabs,
                ]
              : nav
          }
          onSelect={navigate}
        />
      </div>
      <SidebarNavigation
        className="ct-free-navigation"
        menuClassName={kind === "roster" ? "min-w-48" : undefined}
        label={kind === "roster" ? "Workspace" : "Platform"}
        active={kind === "roster" && view === "People" ? "Directory" : view}
        items={nav.map((name, index) => {
          const Icon = kind === "roster" ? icons[index] : pulseIcons[index];
          return {
            label: name,
            icon: <Icon />,
            badge: name === "Tickets" ? "24" : undefined,
            children:
              kind === "roster" && name === "People"
                ? ["Directory", "Import"]
                : kind === "roster" && name === "Settings"
                  ? rosterSettingsTabs
                  : undefined,
          };
        })}
        onSelect={navigate}
      />
      {kind === "roster" && !collapsed && (
        <SidebarCollection
          label="Headcount by department"
          rows={["Engineering", "People", "Sales", "Customer Success", "Design"].map(
            (name, index) => ({
              label: name,
              icon: <span className={`ct-dept-dot ct-color-${index}`} />,
            }),
          )}
          onSelect={(department) => {
            setView("People");
            setQuery(department);
            if (isMobile) setOpenMobile(false);
          }}
        />
      )}
    </>
  );
  const promo =
    !collapsed &&
    !promoDismissed &&
    (kind === "roster" ? (
      <Frame dense className="ct-layout-promo">
        <FrameHeader>
          <FrameTitle>Headcount plan</FrameTitle>
          <FrameDescription>
            Approved headcount for FY26. Resets when the plan is re-baselined.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <Progress className="ct-layout-progress" value={92} aria-label="Headcount plan filled" />
          <div className="ct-between text-xs">
            <span>
              <b>92%</b> Filled
            </span>
            <span>
              <b>8%</b> Open
            </span>
          </div>
        </FramePanel>
      </Frame>
    ) : (
      <Frame dense className="ct-layout-promo">
        <FrameHeader>
          <FrameTitle>SLA clock pauses on waits</FrameTitle>
          <FrameDescription>
            Waiting Customer holds a ticket's clock until the reply.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <button
            type="button"
            onClick={() => navigate("Knowledge Base")}
            aria-label="Read about SLA clock pauses"
          >
            <img className="ct-pulse-promo" src={demoPanel(17)} alt="" />
          </button>
        </FramePanel>
        <FrameFooter className="ct-layout-promo-footer">
          <Button variant="ghost" size="sm" onClick={() => navigate("Knowledge Base")}>
            Read more
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPromoDismissed(true)}>
            Dismiss
          </Button>
        </FrameFooter>
      </Frame>
    ));
  return (
    <>
      {signedOut ? (
        <div className="ct-session-screen">
          <Mark />
          <h1>You're signed out</h1>
          <p>Your local demo changes are kept for this session.</p>
          <Button
            onClick={() => {
              setSignedOut(false);
              navigate("Dashboard");
            }}
          >
            Continue demo
          </Button>
        </div>
      ) : (
        <>
          {kind === "pulse" && (
            <header className="ct-global ct-layout-global">
              <div className="ct-workspace-switcher">
                <SidebarWorkspaceSwitcher
                  collapsed={false}
                  value={organization}
                  workspaces={organizations}
                  onSelect={selectOrganization}
                  onCreate={() => setCreateOrganization(true)}
                />
              </div>
              <span className="ct-muted">/</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ct-product-trigger">
                    {product}
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="reui-reference" align="start">
                  <DropdownMenuLabel>Supported products</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={product} onValueChange={setProduct}>
                    {["All products", "Web App", "Admin Console", "Field App"].map((name) => (
                      <DropdownMenuRadioItem key={name} value={name}>
                        {name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="ct-grow" />
              <div className="ct-layout-teammates">
                <Avatar name="Mira Stone" />
                <Avatar name="Leo Grant" />
                <span className="ct-muted">+7</span>
              </div>
              <Button variant="outline" onClick={() => setInvite(true)}>
                <Users />
                Invite
              </Button>
            </header>
          )}
          <div className="ct-app-body ct-layout-body">
            <ReuiSidebar
              width={kind === "roster" ? 256 : 260}
              variant={kind === "roster" ? "inset" : "sidebar"}
              style={
                {
                  "--sidebar-width-icon": kind === "roster" ? "48px" : "62px",
                } as React.CSSProperties
              }
              className="ct-sidebar ct-layout-sidebar"
              mobileClassName={`reui-reference ct-app ct-${kind} ct-sidebar ct-layout-sidebar ct-layout-mobile`}
              mobileWidth={kind === "roster" ? "288px" : "292.5px"}
              mobileTitle={kind === "roster" ? "Roster" : "Help Desk"}
              header={
                kind === "roster" ? (
                  <div className="ct-side-brand ct-layout-brand">
                    <Mark />
                    {!collapsed && <b>Roster</b>}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
                          <Bell />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="reui-reference" side="right" align="start">
                        <h2 className="font-medium">Notifications</h2>
                        <p className="mt-2 text-sm text-muted-foreground">You are all caught up.</p>
                      </PopoverContent>
                    </Popover>
                    {!isMobile && <SidebarTrigger aria-label="Toggle Sidebar" />}
                  </div>
                ) : undefined
              }
              footer={
                <>
                  {promo}
                  {account}
                </>
              }
              rail={
                kind === "pulse" && !isMobile ? (
                  <SidebarTrigger className="ct-sidebar-edge-trigger" aria-label="Toggle Sidebar" />
                ) : undefined
              }
            >
              {side}
            </ReuiSidebar>
            <AppShellInset className="ct-main ct-layout-inset">
              <header className="ct-pagebar ct-layout-pagebar">
                {isMobile && (
                  <SidebarTrigger className="ct-mobile-menu" aria-label="Open navigation" />
                )}
                <Home size={15} />
                <span>{kind === "roster" ? "People" : "Home"}</span>
                {(kind === "roster" || view !== "Dashboard") && (
                  <>
                    <span className="ct-muted">{kind === "roster" ? "–" : "/"}</span>
                    {kind === "roster" && rosterSettingsTabs.includes(view) && (
                      <>
                        <span>Settings</span>
                        <span className="ct-muted">–</span>
                      </>
                    )}
                    <b>{view === "People" ? "Directory" : view}</b>
                  </>
                )}
                <div className="ct-grow" />
                {((kind === "roster" && view === "Hiring") ||
                  (kind === "pulse" && view === "Knowledge Base")) && (
                  <InputGroup className="ct-page-query">
                    <InputGroupInput
                      aria-label={
                        view === "Hiring" ? "Search candidates" : "Search knowledge articles"
                      }
                      placeholder={
                        view === "Hiring" ? "Search candidates..." : "Search articles..."
                      }
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    <InputGroupAddon>
                      <Search size={14} />
                    </InputGroupAddon>
                  </InputGroup>
                )}
                {extra}
              </header>
              {children}
            </AppShellInset>
          </div>
        </>
      )}
      <Modal
        title="New Organization"
        contentClassName="reui-reference"
        description="Create another organization in this local demo."
        open={createOrganization}
        onClose={() => setCreateOrganization(false)}
      >
        <form
          className="ct-form"
          onSubmit={(event) => {
            event.preventDefault();
            const name = organizationName.trim();
            if (!name) return;
            setExtraOrganizations((rows) => [...new Set([...rows, name])]);
            selectOrganization(name);
            setOrganizationName("");
            setCreateOrganization(false);
          }}
        >
          <label>
            Organization name
            <Input
              required
              aria-label="Organization name"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
            />
          </label>
          <Button type="submit">Create organization</Button>
        </form>
      </Modal>
      <Modal
        contentClassName="reui-reference"
        title="Invite a teammate"
        description="Prepare invitations in this local demo. No email is sent."
        open={invite}
        onClose={() => setInvite(false)}
      >
        <form
          className="ct-form"
          onSubmit={(event) => {
            event.preventDefault();
            const email = inviteEmail.trim().toLowerCase();
            if (!email) return;
            setPendingInvitations((rows) => [...new Set([...rows, email])]);
            setInviteEmail("");
          }}
        >
          <label>
            Email
            <Input
              type="email"
              required
              placeholder="name@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
          </label>
          <Button type="submit">Invite teammate</Button>
        </form>
        {pendingInvitations.length > 0 && (
          <div className="ct-pending-invitations" role="status" aria-label="Pending invitations">
            <h3>Pending invitations</h3>
            <ul>
              {pendingInvitations.map((email) => (
                <li key={email}>
                  <span>{email}</span>
                  <span>Pending</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
export function Empty({ reset }: { reset: () => void }) {
  return (
    <div className="ct-empty">
      <Search />
      <h3>No matching records</h3>
      <p>Try another search or clear the current filters.</p>
      <Button variant="outline" onClick={reset}>
        Clear filters
      </Button>
    </div>
  );
}
export function Sparkline({
  color = "var(--ct-green)",
  seed = 0,
}: {
  color?: string;
  seed?: number;
}) {
  return (
    <svg viewBox="0 0 180 60" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        points={
          seed % 2
            ? "0,49 15,32 30,34 45,22 60,9 75,18 90,35 105,43 120,25 135,37 150,27 165,18 180,24"
            : "0,30 18,25 34,30 50,38 66,25 82,29 98,19 114,26 132,21 150,22 165,14 180,18"
        }
      />
    </svg>
  );
}
export function Export({ rows, name }: { rows: string[][]; name: string }) {
  return (
    <Button
      size="sm"
      onClick={() => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(
          new Blob(
            [
              rows
                .map((r) => r.map((v) => '"' + v.replaceAll('"', '""') + '"').join(","))
                .join("\n"),
            ],
            { type: "text/csv" },
          ),
        );
        a.download = name + ".csv";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Export downloaded");
      }}
    >
      Export
    </Button>
  );
}
