import { Frame, FrameFooter } from "@/components/reui/frame";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Bell,
  Bot,
  Box,
  ChevronDown,
  CircleHelp,
  FileText,
  Grid2X2,
  Home,
  Layers,
  Menu,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Shield,
  Truck,
  Users,
  Workflow,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Face,
  Input,
  ReuiMark,
  WorkspaceMenu,
} from "./chrome";
import type { ShellIcon } from "./chrome";

export function Choices({
  label,
  value,
  items,
  onChange,
  icon: Icon,
  compact = false,
}: {
  label: string;
  value: string;
  items: string[];
  onChange: (v: string) => void;
  icon?: ShellIcon;
  compact?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 min-w-0 gap-1.5 px-2 font-normal", compact && "border")}
          aria-label={label}
        >
          {Icon && <Icon />}
          <span className="truncate">{value}</span>
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuItem key={item} onSelect={() => onChange(item)}>
              {item}
              {item === value && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function Segments({
  label,
  items,
  value,
  onChange,
  className,
}: {
  label: string;
  items: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <>
      <div
        role="tablist"
        aria-label={label}
        className={cn(
          "shell-segments hidden min-w-0 items-center gap-1 rounded-lg bg-muted/65 p-1 md:flex",
          className,
        )}
      >
        {items.map((item) => (
          <button
            role="tab"
            aria-selected={item === value}
            key={item}
            onClick={() => onChange(item)}
            className={cn(
              "min-w-0 rounded-md px-2 py-1 text-xs text-muted-foreground",
              value === item && "bg-background text-foreground shadow-xs",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="md:hidden">
        <Choices label={label} items={items} value={value} onChange={onChange} compact />
      </div>
    </>
  );
}
export function Sidebar({
  children,
  collapsed = false,
  className,
  label = "Navigation",
  drawerClassName,
}: {
  children: ReactNode;
  collapsed?: boolean;
  className?: string;
  label?: string;
  drawerClassName?: string;
}) {
  return (
    <>
      <aside
        className={cn("shell-sidebar shell-desktop-sidebar", collapsed && "collapsed", className)}
        aria-label={label}
      >
        {children}
      </aside>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shell-mobile-trigger"
            aria-label={`Open ${label.toLowerCase()}`}
          >
            <PanelLeft />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className={cn(
            "shell-reference shell-drawer !w-72 !min-h-0 flex-col gap-0 p-2",
            drawerClassName,
          )}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{label}</SheetTitle>
            <SheetDescription>Workspace navigation</SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    </>
  );
}
export const railItems = [
  { label: "Overview", icon: Grid2X2 },
  { label: "Fleet", icon: Bot },
  { label: "Missions", icon: Workflow },
  { label: "Stations", icon: Box },
  { label: "Maintenance", icon: Settings },
  { label: "Reports", icon: FileText },
  { label: "Security", icon: Shield },
];
export function Rail({
  active,
  onChange,
  dark = false,
  glass = false,
  children,
}: {
  active: string;
  onChange: (s: string) => void;
  dark?: boolean;
  glass?: boolean;
  children?: ReactNode;
}) {
  const contents = (
    <>
      <ReuiMark small />
      <div className="mt-4 flex flex-col gap-2">
        {railItems.map(({ label, icon: Icon }) => (
          <Button
            variant={active === label ? "secondary" : "ghost"}
            size="icon-sm"
            key={label}
            title={label}
            aria-label={label}
            onClick={() => onChange(label)}
          >
            <Icon />
          </Button>
        ))}
      </div>
      {children}
      <div className="mt-auto flex flex-col items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Help" onClick={() => onChange("Help")}>
          <CircleHelp />
        </Button>
        <WorkspaceMenu collapsed user />
      </div>
    </>
  );
  return (
    <>
      <nav
        className={cn(
          "shell-icon-rail shell-desktop-rail",
          dark && "shell-dark m-2 rounded-2xl !border-0",
          glass && "shell-glass-rail",
        )}
        aria-label="Applications"
      >
        {contents}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shell-mobile-trigger"
            aria-label="Open applications"
          >
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="shell-reference shell-drawer !w-64 !min-h-0 flex-col gap-3 p-4"
        >
          <SheetHeader>
            <SheetTitle>Applications</SheetTitle>
            <SheetDescription>Switch your workspace section.</SheetDescription>
          </SheetHeader>
          {railItems.map(({ label, icon: Icon }) => (
            <Button
              variant={active === label ? "secondary" : "ghost"}
              key={label}
              onClick={() => onChange(label)}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </SheetContent>
      </Sheet>
    </>
  );
}
function SkeletonSummary({ stats = false }: { stats?: boolean }) {
  return (
    <Frame className="shell-skeleton-card summary">
      {stats ? (
        <>
          <div className="flex items-center gap-2">
            <span className="size-7 rounded-lg bg-muted/55" />
            <span className="shell-skeleton-line short" />
            <span className="ml-auto size-6 rounded-lg bg-muted/55" />
          </div>
          <div className="shell-skeleton-line short" />
          <FrameFooter className="shell-card-foot">
            <span className="flex -space-x-2">
              {[0, 1, 2].map((i) => (
                <i key={i} className="size-5 rounded-full border border-background bg-muted" />
              ))}
            </span>
            <span className="shell-skeleton-line !h-2 !w-1/4" />
          </FrameFooter>
        </>
      ) : (
        <>
          <div className="shell-skeleton-line" />
          <div className="shell-skeleton-line" />
          <div className="shell-skeleton-block !min-h-8" />
        </>
      )}
    </Frame>
  );
}
function SkeletonBody() {
  return (
    <Frame className="shell-skeleton-card">
      <div className="shell-skeleton-line" />
      <div className="shell-skeleton-line" />
      <div className="shell-skeleton-block" />
    </Frame>
  );
}
export function ContentCards({
  layout = "dashboard",
}: {
  layout?:
    | "dashboard"
    | "three"
    | "four"
    | "rows"
    | "split"
    | "glass"
    | "invoice"
    | "chat"
    | "console"
    | "fleet"
    | "security"
    | "workbench"
    | "mission"
    | "details"
    | "table";
}) {
  if (layout === "mission")
    return (
      <div className="shell-card-canvas layout-three">
        <div className="shell-summary-grid">
          {[0, 1, 2].map((i) => (
            <SkeletonSummary stats key={i} />
          ))}
        </div>
        <Frame className="shell-skeleton-card flex-1">
          <div className="shell-skeleton-line !w-1/3" />
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="shell-skeleton-block"
              style={{ minHeight: i === 0 ? 190 : 100 }}
            />
          ))}
        </Frame>
      </div>
    );
  if (layout === "chat")
    return (
      <div className="shell-chat-skeleton" aria-label="Conversation placeholders">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="mb-8" key={i}>
            <div className="ml-auto mb-7 h-8 w-1/3 rounded-lg bg-muted/50" />
            <div className="flex gap-4">
              <span className="size-8 rounded-full bg-muted/40" />
              <div className="flex-1 space-y-3">
                {[100, 100, 70].map((w, j) => (
                  <div key={j} className="h-3 rounded bg-muted/40" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  if (layout === "details")
    return (
      <div className="shell-card-canvas">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            className="shell-skeleton-line"
            key={i}
            style={{ width: `${i % 3 === 0 ? 85 : i % 3 === 1 ? 60 : 75}%` }}
          />
        ))}
      </div>
    );
  if (layout === "table")
    return (
      <div className="shell-card-canvas">
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((k) => (
            <Frame className="shell-skeleton-card" key={k}>
              {Array.from({ length: 6 }, (_, i) => (
                <div className="flex items-center gap-4" key={i}>
                  <span className="shell-skeleton-line flex-1" />
                  <span className="h-4 w-8 rounded bg-muted/60" />
                </div>
              ))}
            </Frame>
          ))}
        </div>
      </div>
    );
  if (layout === "glass")
    return (
      <div className="shell-card-canvas">
        <div className="shell-glass-top">
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Frame className="shell-skeleton-card !min-h-0 !p-3" key={i}>
                <div className="shell-skeleton-line !w-1/2" />
                <div className="shell-skeleton-block" />
              </Frame>
            ))}
          </div>
          <SkeletonBody />
        </div>
        <div className="shell-glass-lower">
          <SkeletonBody />
        </div>
      </div>
    );
  if (layout === "console")
    return (
      <div className="shell-console-canvas">
        <div className="shell-console-stats">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonSummary stats key={i} />
          ))}
        </div>
        <div className="shell-console-body">
          <div className="shell-skeleton-line !w-1/4" />
          {Array.from({ length: 6 }, (_, i) => (
            <div className="space-y-4" key={i}>
              <div className="flex gap-4">
                <span className="shell-skeleton-line !w-3" />
                <span className="shell-skeleton-line !w-1/6" />
                <span className="shell-skeleton-line !w-1/12" />
              </div>
              {i === 1 && <div className="shell-skeleton-block !h-80" />}
            </div>
          ))}
        </div>
      </div>
    );
  if (layout === "invoice")
    return (
      <div className="shell-invoice-canvas">
        <div className="shell-invoice-focus">
          <div className="shell-skeleton-line !w-1/4" />
          <div className="shell-invoice-form">
            <div className="space-y-4">
              <div className="shell-skeleton-line !w-1/3" />
              <div className="shell-skeleton-line !w-1/2" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div className="shell-skeleton-line" key={i} />
                  ))}
                </div>
                <Frame className="shell-skeleton-card !p-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div className="shell-skeleton-line" key={i} />
                  ))}
                </Frame>
              </div>
            </div>
            <SkeletonBody />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Frame key={i} className="shell-skeleton-card !min-h-32">
              {[0, 1, 2, 3].map((j) => (
                <div className="shell-skeleton-line" key={j} />
              ))}
            </Frame>
          ))}
        </div>
        <Frame className="shell-skeleton-card !p-0">
          {Array.from({ length: 8 }, (_, i) => (
            <div className="grid grid-cols-4 gap-6 border-b px-3 py-2" key={i}>
              {[0, 1, 2, 3].map((j) => (
                <div className="shell-skeleton-line !h-3" key={j} />
              ))}
            </div>
          ))}
        </Frame>
      </div>
    );
  return (
    <div
      className={cn("shell-card-canvas", `layout-${layout}`)}
      aria-label="Workspace content placeholders"
    >
      <div className="shell-summary-grid">
        {Array.from(
          {
            length:
              layout === "four" || layout === "dashboard" ? 4 : layout === "workbench" ? 6 : 3,
          },
          (_, i) => (
            <SkeletonSummary stats={layout === "security" || layout === "fleet"} key={i} />
          ),
        )}
      </div>
      <div className="shell-body-grid">
        {Array.from(
          {
            length:
              layout === "rows" || layout === "fleet"
                ? 5
                : layout === "three" || layout === "four" || layout === "security"
                  ? 6
                  : layout === "workbench"
                    ? 1
                    : 4,
          },
          (_, i) => (
            <SkeletonBody key={i} />
          ),
        )}
      </div>
    </div>
  );
}
export function NavSearch({
  value,
  onChange,
  label = "Search navigation",
}: {
  value: string;
  onChange: (s: string) => void;
  label?: string;
  drawerClassName?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div className="relative my-3">
      <Search className="absolute left-2 top-2 size-3.5 text-muted-foreground" />
      <Input
        ref={input}
        aria-label={label}
        placeholder="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-7 pr-8 text-xs"
      />
      <kbd className="absolute right-2 top-2 text-[10px] text-muted-foreground">⌘F</kbd>
    </div>
  );
}
export const fleetGroups = [
  {
    label: "Fleet Overview",
    items: ["Overview", "Live Map", "All Robots", "Robot Groups", "Zones", "Assignments"],
  },
  {
    label: "Fleet Activity",
    items: ["Live Status", "Access Requests", "Alerts", "Event Feed"],
  },
  {
    label: "Fleet Settings",
    items: ["Robot Profiles", "Tags & Labels", "Access Rules", "Data Sync", "Fleet Preferences"],
  },
];
const navIcons = [
  Grid2X2,
  Activity,
  Bot,
  Layers,
  Truck,
  Workflow,
  Activity,
  Users,
  Bell,
  Activity,
  Bot,
  FileText,
  Shield,
  Workflow,
  Settings,
];
export function GroupedNav({
  groups = fleetGroups,
  active,
  onSelect,
  query = "",
  indented = false,
}: {
  groups?: { label: string; items: string[] }[];
  active: string;
  onSelect: (s: string) => void;
  query?: string;
  indented?: boolean;
}) {
  let index = 0;
  const matches = groups
    .flatMap((g) => g.items)
    .filter((v) => v.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="min-h-0 overflow-y-auto">
      {groups.map((group) => {
        const items = group.items.filter((v) => v.toLowerCase().includes(query.toLowerCase()));
        if (!items.length) return null;
        return (
          <section className="mb-4" key={group.label}>
            <p className="shell-section-label">{group.label}</p>
            {items.map((item) => {
              const Icon = navIcons[index++ % navIcons.length];
              return (
                <Button
                  variant={active === item ? "secondary" : "ghost"}
                  className={cn("shell-nav-button justify-start", indented && "pl-6")}
                  key={item}
                  aria-label={item}
                  onClick={() => onSelect(item)}
                >
                  <Icon />
                  <span className="truncate">{item}</span>
                </Button>
              );
            })}
          </section>
        );
      })}
      {!matches.length && (
        <p className="p-5 text-center text-xs text-muted-foreground">No matching routes.</p>
      )}
    </div>
  );
}
export function AccountCard() {
  return (
    <div className="mt-auto rounded-lg border bg-background">
      <WorkspaceMenu
        user
        displayName="Shadcn"
        initial="Nimbus Core"
        subtitle="Author of Shadcn/ui"
      />
    </div>
  );
}
export function Promo() {
  return (
    <div className="m-2 rounded-xl border bg-background p-4 text-center">
      <Bot className="mx-auto mb-2 size-6" />
      <p className="text-xs font-medium">Integrations</p>
      <p className="mb-3 mt-1 text-[11px] text-muted-foreground">
        Connect fleet tools, data and workflows here
      </p>
      <Choices
        label="Upgrade workspace"
        value="Upgrade"
        items={["Pro plan", "Enterprise plan"]}
        onChange={() => {}}
        compact
      />
    </div>
  );
}
export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="shell-header border-b">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-sm font-medium">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </header>
  );
}
export {
  Activity,
  Bot,
  Box,
  ChevronDown,
  FileText,
  Grid2X2,
  Home,
  Layers,
  Plus,
  Search,
  Settings,
  Shield,
  Truck,
  Users,
  Workflow,
  X,
  Face,
};
