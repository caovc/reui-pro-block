import { SidebarCollection, SidebarNavigation } from "@/components/reui/sidebar";
import { SidebarRail, SidebarMenuAction, SidebarMenuButton } from "@/components/ui/sidebar";
import { BrandMark } from "@/components/brand-mark";
import portrait0 from "./assets/portrait-0.jpg";
import portrait1 from "./assets/portrait-1.jpg";
import portrait2 from "./assets/portrait-2.jpg";
import portrait3 from "./assets/portrait-3.jpg";
import portrait4 from "./assets/portrait-4.jpg";
import portrait5 from "./assets/portrait-5.jpg";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  ArrowDownToLine,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  CreditCard,
  SlidersHorizontal,
  UserRound,
  Copy,
  Ellipsis,
  FileText,
  Folder,
  Grid2X2,
  Home,
  Laptop,
  LayoutDashboard,
  SquareCheck,
  CircleDot,
  ChartNoAxesColumn,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Shield,
  Sun,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
export type ShellIcon = ComponentType<{ className?: string }>;
export type NavNode = {
  label: string;
  icon: ShellIcon;
  children?: string[];
  badge?: string;
  dot?: boolean;
  disabled?: boolean;
  accent?: boolean;
};
export const standardNavigation: NavNode[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Projects", icon: Folder },
  { label: "My Tasks", icon: SquareCheck },
  { label: "Issues", icon: CircleDot, children: ["All issues", "Assigned to me", "Archived"] },
  { label: "Team", icon: Users, children: ["Members", "Groups", "Invitations"] },
  { label: "Reports", icon: ChartNoAxesColumn },
];
export const projectNames = [
  "Design System",
  "API Integration",
  "Mobile App",
  "Analytics Dashboard",
  "Auth Module",
];
export const teamNames = [
  "Daniel Parker",
  "Matthew Reed",
  "Ryan Brooks",
  "Lena Dawson",
  "Sophie Bennett",
  "Liam Carter",
];
/** Compatibility name retained for existing shells; artwork is the original Bricklane mark. */
// Variant metadata follows React portals without introducing another sidebar state.
export const ShellVariantContext = createContext(0);
const primaryBrandVariants = new Set([
  1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 23,
]);
const primaryNavigationVariants = new Set([1, 4, 5, 7, 8, 11, 12, 13, 18, 19, 20]);
export function shellThemeClasses(variant: number) {
  return cn(
    `shell-theme-${variant}`,
    primaryBrandVariants.has(variant) && "shell-theme-brand",
    primaryNavigationVariants.has(variant) && "shell-theme-navigation",
  );
}
export function ReuiMark({ small = false }: { small?: boolean }) {
  const variant = useContext(ShellVariantContext);
  return (
    <BrandMark
      className={cn(
        small ? "size-6 shrink-0" : "size-7 shrink-0",
        primaryBrandVariants.has(variant) &&
          "text-primary [--background:var(--primary-foreground)]",
      )}
    />
  );
}

const portraits = [portrait0, portrait1, portrait2, portrait3, portrait4, portrait5];
export function Face({
  name = "Nick Bold",
  index = 0,
  small = false,
  presence,
}: {
  name?: string;
  index?: number;
  small?: boolean;
  presence?: "online" | "away" | "offline";
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <Avatar className={small ? "size-5" : "size-6"}>
        <AvatarImage
          src={portraits[name === "Mira Stone" ? 1 : index % portraits.length]}
          alt={name}
        />
        <AvatarFallback className="text-[9px]">
          {name
            .split(" ")
            .map((v) => v[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      {presence && (
        <span
          className={cn(
            "absolute -bottom-px -right-px size-1.5 rounded-full border border-background",
            presence === "online"
              ? "bg-[var(--chart-2)]"
              : presence === "away"
                ? "bg-[var(--chart-4)]"
                : "bg-muted-foreground",
          )}
        />
      )}
    </span>
  );
}
export function PlaceholderCanvas({
  rows = 1,
  solid = false,
  fill = true,
  className,
}: {
  rows?: number;
  solid?: boolean;
  fill?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("shell-placeholder-canvas", solid && "solid", className)}
      aria-label="Page content placeholders"
    >
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: rows * 3 }, (_, i) => (
          <div key={i} className="shell-placeholder aspect-video" />
        ))}
      </div>
      {fill && <div className="shell-placeholder min-h-40 flex-1" />}
    </div>
  );
}
export function SkeletonLines({ cards = false }: { cards?: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      {cards && (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex h-24 flex-col justify-between rounded-lg border border-dashed border-border/40 p-4"
            >
              <span className="h-2.5 w-1/2 rounded bg-muted/40" />
              <span className="h-3 w-2/3 rounded bg-muted/40" />
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 rounded-lg border border-dashed border-border/40 p-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="flex items-center gap-3" key={i}>
            <span className="size-3 rounded bg-muted/40" />
            <span
              className="h-2.5 rounded bg-muted/40"
              style={{ width: `${45 + ((i * 19) % 40)}%` }}
            />
            <span className="ml-auto h-2.5 w-9 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
export function Navigation({
  items,
  collapsed = false,
  active,
  onSelect,
  label = "Platform",
  initialExpanded = [],
}: {
  items: NavNode[];
  collapsed?: boolean;
  active: string;
  onSelect: (label: string) => void;
  label?: string;
  initialExpanded?: string[];
}) {
  return (
    <SidebarNavigation
      items={items.map(({ icon: Icon, ...item }) => ({ ...item, icon: <Icon /> }))}
      collapsed={collapsed}
      active={active}
      onSelect={onSelect}
      label={label}
      initialExpanded={initialExpanded}
    />
  );
}

export function PinnedProjects({
  collapsed = false,
  names = projectNames,
  onSelect,
}: {
  collapsed?: boolean;
  names?: string[];
  onSelect: (s: string) => void;
}) {
  const [projects, setProjects] = useState(names);
  if (collapsed) return null;
  return (
    <SidebarCollection
      label="Active Projects"
      onSelect={onSelect}
      rows={projects.map((name, i) => ({
        label: name,
        icon: (
          <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" fill="none" stroke="var(--border)" strokeWidth="2.7" />
            <circle
              cx="10"
              cy="10"
              r="7.5"
              fill="none"
              stroke={`var(--chart-${(i % 5) + 1})`}
              strokeWidth="2.7"
              strokeDasharray={`${[35, 29, 39, 19, 27][i % 5]} 48`}
              transform="rotate(-90 10 10)"
              strokeLinecap="round"
            />
          </svg>
        ),
        actions: (
          <RowActions
            sidebar
            name={name}
            onRemove={() => setProjects((v) => v.filter((p) => p !== name))}
          />
        ),
      }))}
    />
  );
}

export function Members({
  collapsed = false,
  names = teamNames,
  label = "Team Members",
  onSelect,
}: {
  collapsed?: boolean;
  names?: string[];
  label?: string;
  onSelect: (s: string) => void;
}) {
  const [members, setMembers] = useState(names);
  if (collapsed) return null;
  return (
    <SidebarCollection
      label={label}
      onSelect={onSelect}
      rows={members.map((name, i) => ({
        label: name,
        icon: (
          <Face
            name={name}
            index={i}
            small
            presence={i === 2 ? "away" : i === 5 ? "offline" : "online"}
          />
        ),
        actions: (
          <RowActions
            sidebar
            name={name}
            onRemove={() => setMembers((v) => v.filter((m) => m !== name))}
          />
        ),
      }))}
    />
  );
}

export function RowActions({
  name,
  onRemove,
  sidebar = false,
}: {
  name: string;
  onRemove?: () => void;
  sidebar?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {sidebar ? (
          <SidebarMenuAction showOnHover aria-label={`Actions for ${name}`}>
            <Ellipsis />
          </SidebarMenuAction>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-6 shrink-0 opacity-0 focus:opacity-100 group-hover:opacity-100"
            aria-label={`Actions for ${name}`}
          >
            <Ellipsis />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => toast(name, { description: "Item details selected in this demo." })}
          >
            Open details
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              navigator.clipboard?.writeText(name);
              toast.success("Name copied");
            }}
          >
            <Copy />
            Copy name
          </DropdownMenuItem>
          {onRemove && (
            <DropdownMenuItem onSelect={onRemove}>
              <X />
              Remove from sidebar
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function UsageCard({
  collapsed = false,
  title = "Spending Limit",
  description = "Consumption and balance will be reset at the end of the month",
  value = 82,
  upgrade = false,
}: {
  collapsed?: boolean;
  title?: string;
  description?: string;
  value?: number;
  upgrade?: boolean;
}) {
  const [upgraded, setUpgraded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (collapsed || dismissed) return null;
  return (
    <Frame spacing="xs" dense className="shell-usage-card mx-2 mt-auto gap-0">
      <FrameHeader className="relative px-2 py-1">
        <p className="text-xs font-medium text-warning-foreground">{title}</p>
        <Button
          size="icon-sm"
          variant="ghost"
          className="absolute right-1 top-0 size-5 opacity-0 hover:opacity-100 focus:opacity-100"
          aria-label={`Dismiss ${title}`}
          onClick={() => setDismissed(true)}
        >
          <X />
        </Button>
      </FrameHeader>
      <FramePanel className="p-2">
        <p className="mb-2 text-[11px] leading-4 text-muted-foreground">{description}</p>
        <Progress
          className="h-1 [&_[data-slot=progress-indicator]]:bg-success"
          value={upgraded ? 25 : value}
        />
        <div className="mt-2 flex justify-between text-[11px]">
          <span>
            <strong className="font-medium">{upgraded ? 25 : value}%</strong>{" "}
            <span className="text-muted-foreground">Used</span>
          </span>
          <span>
            <strong className="font-medium">{upgraded ? 75 : 100 - value}%</strong>{" "}
            <span className="text-muted-foreground">Free</span>
          </span>
        </div>
        {upgrade && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 w-full text-xs"
            onClick={() => {
              setUpgraded(!upgraded);
              toast.success(upgraded ? "Demo plan reset" : "Demo plan upgraded");
            }}
          >
            {upgraded ? "Plan upgraded" : "Upgrade Plan"}
          </Button>
        )}
      </FramePanel>
    </Frame>
  );
}
export function WorkspaceMenu({
  collapsed = false,
  user = false,
  initial = "Claude",
  displayName = "Nick Bold",
  subtitle,
  top = false,
  onName,
  card = false,
  compact = false,
}: {
  collapsed?: boolean;
  user?: boolean;
  initial?: string;
  displayName?: string;
  subtitle?: string;
  top?: boolean;
  onName?: (s: string) => void;
  card?: boolean;
  compact?: boolean;
}) {
  const [workspace, setWorkspace] = useState(initial);
  const [accountTheme, setAccountTheme] = useState("system");
  function selectAccountTheme(value: string) {
    setAccountTheme(value);
    document.documentElement.classList.toggle(
      "dark",
      value === "dark" ||
        (value === "system" && matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }
  const Trigger = SidebarMenuButton;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger
          size={card ? "lg" : "default"}
          className={cn(
            "w-full px-2",
            card && "shell-account-card border bg-background shadow-xs",
            collapsed ? "justify-center" : "justify-start",
            card ? "h-auto p-1.5" : compact ? "h-8" : user ? "h-12" : "h-10",
          )}
          aria-label={user ? "Open user menu" : top ? "Switch workspace" : "Open workspace menu"}
        >
          {user ? (
            <Face name={displayName} />
          ) : compact ? (
            <span
              className="flex size-4 shrink-0 items-center justify-center text-base"
              aria-hidden="true"
            >
              {workspace === "Vercel" ? "▲" : workspace.slice(0, 1)}
            </span>
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium">
              {workspace === "Claude" ? "C" : workspace === "Vercel" ? "▲" : workspace.slice(0, 1)}
            </span>
          )}
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col text-left">
                <span className="truncate text-[13px] font-medium">
                  {user ? displayName : workspace}
                </span>
                {subtitle && (
                  <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-[var(--chart-3)]" />
                    {subtitle}
                  </span>
                )}
              </span>
              {card ? (
                <Ellipsis className="text-muted-foreground" />
              ) : (
                <ChevronsUpDown className="text-muted-foreground" />
              )}
            </>
          )}
        </Trigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={card || collapsed ? "right" : top ? "bottom" : "top"}
        align="end"
        className="reui-reference w-56"
      >
        {card ? (
          <>
            {/* ReUI free c-sidebar-1 AccountMenu: identity, grouped actions, sign out. */}
            <DropdownMenuLabel className="flex items-center gap-2">
              <Face name={displayName} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  nick@bricklane.demo
                </span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() =>
                  toast("Profile selected", {
                    description: "This preview uses a local sample account.",
                  })
                }
              >
                <UserRound /> Profile <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  toast("Billing & Usage selected", {
                    description: "Demo plan: Pro · No payment information is collected.",
                  })
                }
              >
                <CreditCard /> Billing & Usage
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  toast("Preferences selected", {
                    description: "Appearance is available in the Theme menu.",
                  })
                }
              >
                <SlidersHorizontal /> Preferences <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() =>
                  toast("Help & Support", {
                    description: "This is an independent Bricklane preview using local demo data.",
                  })
                }
              >
                <CircleHelp /> Help & Support
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  toast("API Reference", { description: "Demo only. No live API is connected." })
                }
              >
                <FileText /> API Reference
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun /> Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={accountTheme} onValueChange={selectAccountTheme}>
                    <DropdownMenuRadioItem
                      value="light"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <Sun /> Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="dark"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <Moon /> Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="system"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <Laptop /> System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                toast("Demo account", { description: "There is no active session to sign out of." })
              }
            >
              <LogOut /> Sign Out <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>
              {user ? `${displayName} · nick@bricklane.demo` : "Workspaces"}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {["Claude", "Vercel", "Atlas", "Acme Corp"].map((w) => (
                <DropdownMenuItem
                  key={w}
                  onSelect={() => {
                    setWorkspace(w);
                    onName?.(w);
                  }}
                >
                  {w}
                  {workspace === w && <Check className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => toast("Workspace settings selected")}>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  document.documentElement.classList.remove("dark");
                }}
              >
                <Sun />
                Light theme
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  document.documentElement.classList.add("dark");
                }}
              >
                <Moon />
                Dark theme
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  document.documentElement.classList.toggle(
                    "dark",
                    matchMedia("(prefers-color-scheme:dark)").matches,
                  );
                }}
              >
                <Laptop />
                System theme
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  toast("Demo account menu", {
                    description: "This preview uses a local sample account.",
                  })
                }
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function SearchPalette({
  label = "Search workspace",
  collapsed = false,
  shortcut = "⌘K",
  iconOnly = false,
  onSelect,
  routes: customRoutes,
}: {
  label?: string;
  collapsed?: boolean;
  shortcut?: string;
  iconOnly?: boolean;
  onSelect: (s: string) => void;
  routes?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (trigger.current?.closest("[inert]") || !trigger.current?.getClientRects().length) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  const routes = customRoutes ?? [
    "Overview",
    "Projects",
    "My Tasks",
    "Members",
    "Reports",
    "Settings",
    "Documentation",
  ];
  return (
    <>
      <Button
        ref={trigger}
        variant={iconOnly ? "ghost" : "outline"}
        size={iconOnly || collapsed ? "icon-sm" : "sm"}
        className={cn(
          iconOnly
            ? ""
            : collapsed
              ? "size-8 shrink-0 justify-center px-0"
              : "h-8 w-full justify-start gap-2 px-2 font-normal",
        )}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <Search />
        {!collapsed && !iconOnly && (
          <>
            <span className="flex-1 text-left text-[13px] text-muted-foreground">Search...</span>
            <kbd className="rounded bg-muted px-1 text-[10px] text-muted-foreground">
              {shortcut}
            </kbd>
          </>
        )}
      </Button>
      <CommandDialog
        className="reui-reference"
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search your workspace content."
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        <Command>
          <CommandInput
            aria-label="Search workspace routes"
            placeholder="Search pages, projects, and people…"
            value={q}
            onValueChange={setQ}
          />
          <CommandList>
            <CommandEmpty>No matching pages.</CommandEmpty>
            <CommandGroup heading="Workspace">
              {routes.map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onSelect(name);
                    setOpen(false);
                  }}
                >
                  <FileText />
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
export function CollapseHandle({
  collapsed,
  onToggle,
  label = "sidebar",
}: {
  collapsed: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <SidebarRail
      className="shell-collapse-handle ltr:translate-x-0 rtl:translate-x-0"
      tabIndex={0}
      aria-label={`${collapsed ? "Expand" : "Collapse"} ${label}`}
      aria-expanded={!collapsed}
      onClick={onToggle}
    >
      <span className="shell-rail-glyph" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="shell-rail-label" aria-hidden="true">
        {collapsed ? "Expand" : "Collapse"}
      </span>
    </SidebarRail>
  );
}
export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav className="flex min-w-0 items-center gap-2 text-[13px]" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span className="flex min-w-0 items-center gap-2" key={`${item}-${i}`}>
          {i > 0 && <ChevronRight className="size-3 shrink-0 text-muted-foreground" />}
          {i === 0 && item === "Home" && (
            <Home className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span
            className={cn(
              "truncate",
              i < items.length - 1 ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {item}
          </span>
        </span>
      ))}
    </nav>
  );
}
export function FooterLinks({
  collapsed = false,
  onSelect,
}: {
  collapsed?: boolean;
  onSelect: (s: string) => void;
}) {
  return (
    <div className="mt-auto py-2">
      <SidebarNavigation
        collapsed={collapsed}
        active=""
        onSelect={onSelect}
        items={[
          { label: "Settings", icon: <Settings /> },
          { label: "Invite Team", icon: <Users /> },
          { label: "Documentation", icon: <BookOpen /> },
        ]}
      />
    </div>
  );
}

const notifications = [
  {
    name: "@sarah_smith mentioned you in #PR-1024",
    text: "“Can you review the changes?”",
    time: "2m ago",
    avatar: "Sarah Smith",
  },
  {
    name: "Pending approval",
    text: "Design System v2.0 release requires your approval before deployment.",
    time: "5m ago",
    buttons: ["Approve", "Review"],
  },
  {
    name: "@maverick shared",
    text: "Project Timeline",
    time: "15m ago",
    file: "project-plan.pdf (2mb)",
  },
  {
    name: "Task assigned to you",
    text: "Implement user authentication flow for the mobile app.",
    time: "30m ago",
  },
  {
    name: "4 people joined your workspace",
    text: "Sarah, Mike, Emma and James just joined Bricklane.",
    time: "45m ago",
  },
  {
    name: "Reactions on your comment",
    text: "Sarah and 2 others reacted to your comment in #design-system.",
    time: "1h ago",
  },
  {
    name: "New review received",
    text: "Emma left a review on Design System v2.0.",
    time: "2h ago",
  },
  {
    name: "Upcoming event reminder",
    text: "Design system review with the product team.",
    time: "3h ago",
    buttons: ["Join", "Decline"],
  },
  {
    name: "Team Invitation",
    text: "Alex invited you to join Bricklane.",
    time: "1h ago",
    buttons: ["Accept", "Decline"],
  },
  {
    name: "Slack connected",
    text: "Your Slack workspace is now synced with notifications.",
    time: "2h ago",
  },
  {
    name: "Payment processed · $49.00",
    text: "Your monthly subscription was renewed.",
    time: "3h ago",
  },
  {
    name: "Monthly milestone reached!",
    text: "100 of 100 tasks completed this month.",
    time: "4h ago",
  },
  { name: "New sign-in detected", text: "New login from Mac OS, Chrome.", time: "Yesterday" },
  {
    name: "Feedback requested",
    text: "How was your experience with the new dashboard?",
    time: "Yesterday",
    buttons: ["Rate", "Later"],
  },
  {
    name: "Introducing AI Copilot",
    text: "Generate code, fix bugs, and write tests faster.",
    time: "2 days ago",
  },
  {
    name: "New comment on Issue #84",
    text: "“Let’s prioritize this for the next sprint.”",
    time: "3 days ago",
  },
  {
    name: "Deployment successful",
    text: "Production branch deployed to Vercel.",
    time: "4 days ago",
  },
  {
    name: "API usage at 80%",
    text: "You’ve used 80% of your monthly API quota.",
    time: "5 days ago",
  },
];
export function Notifications({
  drawer = false,
  feed = false,
}: {
  drawer?: boolean;
  feed?: boolean;
}) {
  const [read, setRead] = useState(false);
  const [actions, setActions] = useState<Record<string, string>>({});
  const [all, setAll] = useState(false);
  const content = (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          Notifications<Badge className="h-4 px-1 text-[9px]">{read ? "0" : "5"}</Badge>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Mark all as read"
          onClick={() => setRead(true)}
        >
          <Check />
        </Button>
      </div>
      <div className={cn("overflow-y-auto", feed ? "flex-1" : "max-h-[320px]")}>
        {(all || feed ? notifications : notifications.slice(0, 6)).map((n, i) => (
          <div key={n.name} className="relative flex gap-2 border-b p-3">
            <span className="mt-1 shrink-0">
              {n.avatar ? (
                <Face name={n.avatar} index={1} small />
              ) : (
                <span className="flex size-5 items-center justify-center text-muted-foreground">
                  {i === 1 ? (
                    <Shield className="size-3.5" />
                  ) : i === 2 ? (
                    <FileText className="size-3.5" />
                  ) : (
                    <Bell className="size-3.5" />
                  )}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium leading-5">{n.name}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{n.text}</p>
              {n.buttons && (
                <div className="mt-2 flex gap-1">
                  {n.buttons.map((b, j) => (
                    <Button
                      key={b}
                      variant={j ? "outline" : "default"}
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      disabled={Boolean(actions[n.name])}
                      onClick={() => {
                        setActions({ ...actions, [n.name]: b });
                        toast.success(`${b} recorded`);
                      }}
                    >
                      {actions[n.name] && j === 0 ? actions[n.name] : b}
                    </Button>
                  ))}
                </div>
              )}
              {n.file && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-6 max-w-full px-2 text-[10px]"
                  onClick={() => toast("Demo attachment selected")}
                >
                  <FileText />
                  {n.file}
                  <ArrowDownToLine />
                </Button>
              )}
              <p className="mt-2 text-[10px] text-muted-foreground">{n.time}</p>
            </div>
            {!read && i !== 0 && i < 5 && (
              <span className="absolute right-3 top-4 size-1.5 rounded-full bg-primary" />
            )}
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        className="h-9 w-full rounded-t-none text-[11px]"
        onClick={() => setAll(!all)}
      >
        {all ? "Show recent notifications" : "View all notifications"}
      </Button>
    </>
  );
  if (feed) return <div className="flex min-h-0 flex-1 flex-col">{content}</div>;
  if (drawer)
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon-sm" variant="ghost" className="relative" aria-label="Notifications">
            <Bell />
            {!read && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />}
          </Button>
        </SheetTrigger>
        <SheetContent className="gap-0 px-0 sm:max-w-md">
          <SheetHeader className="sr-only">
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>Your latest workspace updates.</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="relative" aria-label="Notifications">
          <Bell />
          {!read && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-current" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-80 p-0">
        {content}
      </PopoverContent>
    </Popover>
  );
}
export function HeaderSwitchers({
  initialApp = "Web App",
  initialOrg = "Acme Inc",
  initialEnvironment = "Production",
}: {
  initialApp?: string;
  initialOrg?: string;
  initialEnvironment?: string;
}) {
  const [values, setValues] = useState([initialOrg, initialApp, initialEnvironment]);
  const options = [
    ["Acme Inc", "Atlas Desk", "Personal Workspace"],
    ["Web App", "Inventory", "API", "Mobile App"],
    ["Production", "Staging", "Development"],
  ];
  return (
    <div className="flex min-w-0 items-center gap-1 sm:gap-2">
      {values.map((value, i) =>
        value ? (
          <span
            className={cn("flex min-w-0 items-center gap-1 sm:gap-2", i === 1 && "hidden sm:flex")}
            key={i}
          >
            {i > 0 && <span className="mx-1 text-xs text-muted-foreground/50">/</span>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 min-w-0 gap-1 px-1.5 font-normal"
                  aria-label={
                    ["Switch organization", "Switch application", "Switch environment"][i]
                  }
                >
                  {i === 0 && <span className="mr-1 size-3 rounded-full bg-[var(--chart-3)]" />}
                  <span className="truncate text-xs">{value}</span>
                  <ChevronsUpDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>
                  {["Organizations", "Applications", "Environments"][i]}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  {options[i].map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onSelect={() => setValues(values.map((v, j) => (i === j ? option : v)))}
                    >
                      {option}
                      {value === option && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        ) : null,
      )}
    </div>
  );
}
export function AppsMenu({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Apps">
          <Grid2X2 />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <p className="px-4 py-3 text-xs text-muted-foreground">Apps</p>
        <div className="grid grid-cols-3 gap-1 p-2">
          {[
            ["Inbox", FileText],
            ["Calendar", Grid2X2],
            ["Docs", BookOpen],
            ["Tasks", Check],
            ["Reports", Activity],
            ["Settings", Settings],
            ["Teams", Users],
            ["Security", Shield],
            ["Projects", Folder],
          ].map(([n, I]) => {
            const Icon = I as ShellIcon;
            return (
              <Button
                key={String(n)}
                variant="ghost"
                className="h-16 flex-col gap-2 text-[11px] font-normal"
                onClick={() => onSelect(String(n))}
              >
                <Icon />
                {String(n)}
              </Button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          className="h-9 w-full rounded-t-none border-t text-xs"
          onClick={() => onSelect("All apps")}
        >
          Browse All Apps
        </Button>
      </PopoverContent>
    </Popover>
  );
}
export function CreateItemDialog({
  open,
  onOpenChange,
  title = "New item",
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Add an item to your local demo workspace.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate(name);
            onOpenChange(false);
            setName("");
          }}
        >
          <Field>
            <FieldLabel htmlFor="shell-new-item">Name</FieldLabel>
            <Input
              id="shell-new-item"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter a name"
            />
          </Field>
          <Button type="submit">
            <Plus />
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export {
  Button,
  Input,
  Badge,
  Separator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
};
