import { BrandGlyph } from "@/components/brand-mark";
import { useState, useId, type ReactNode, type ComponentType } from "react";
import {
  Activity,
  ArrowDownToLine,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  MoreHorizontal,
  LayoutDashboard,
  Menu,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Person } from "./controls";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
export {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
};
export type NavItem = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  count?: string;
};
export function Logo() {
  return (
    <span className="wf-logo" aria-hidden="true">
      <BrandGlyph />
    </span>
  );
}

export function Shell({
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
}: {
  brand: string;
  view: string;
  setView: (v: string) => void;
  nav: NavItem[];
  children: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  dark?: boolean;
  extra?: ReactNode;
  taskNavigation?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const sidebar = (
    <>
      <div className="wf-brand">
        <Logo />
        {!compact && <strong>{brand}</strong>}
      </div>
      {!compact && brand !== "DevOps" && (
        <Button variant="outline" className="wf-search" onClick={() => setSearchOpen(true)}>
          <Search />
          Search…<kbd>/</kbd>
        </Button>
      )}
      <div className="wf-nav-group">
        {!compact && <p>{brand === "ReUI" ? "Platform" : "Workspace"}</p>}
        {nav.map(({ label, icon: Icon = LayoutDashboard, count }) => (
          <div key={label}>
            <Button
              title={label}
              aria-label={label}
              aria-current={view === label ? "page" : undefined}
              variant={view === label ? "secondary" : "ghost"}
              size={compact ? "icon" : "default"}
              className="wf-nav-button"
              onClick={() => {
                setView(label);
                setOpen(false);
              }}
            >
              <Icon />
              {!compact && (
                <>
                  <span>{label}</span>
                  {count ? <small>{count}</small> : null}
                </>
              )}
            </Button>
            {label === "Tasks" && taskNavigation}
          </div>
        ))}
      </div>
      {!compact && extra}
      <div className="wf-sidebar-bottom">
        <Button
          aria-label="Help"
          title="Help"
          size={compact ? "icon" : "default"}
          variant="ghost"
          onClick={() => toast.info("Use the sidebar to explore this interactive local workspace.")}
        >
          <CircleHelp />
          {!compact && "Help & documentation"}
        </Button>
        <Button
          aria-label="Account settings"
          size={compact ? "icon" : "default"}
          variant="ghost"
          onClick={() => setView("Settings")}
        >
          <span className="wf-avatar">{dark ? "C" : brand === "DevOps" ? "TO" : "NB"}</span>
          {!compact && (dark ? "Claude" : brand === "DevOps" ? "Tomas Okonkwo" : "Nick Bold")}
        </Button>
      </div>
    </>
  );
  return (
    <div
      className={`wf-root wf-${brand.toLowerCase()} ${compact ? "wf-compact" : ""} ${dark ? "wf-dark-sidebar" : ""}`}
    >
      <aside className="wf-sidebar">{sidebar}</aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetTitle>{brand}</SheetTitle>
          <SheetDescription>Workspace navigation</SheetDescription>
          {sidebar}
        </SheetContent>
      </Sheet>
      <div className="wf-main">
        <header className="wf-header">
          <Button
            className="wf-mobile-menu"
            size="icon"
            variant="ghost"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </Button>
          <span>
            {brand === "AgentOps" ? (
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
          <div className="wf-header-actions">
            {brand === "DevOps" && (
              <Button
                variant="outline"
                className="wf-header-search"
                onClick={() => setSearchOpen(true)}
              >
                <Search />
                Search or jump to…<kbd>⌘K</kbd>
              </Button>
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
          </div>
        </header>
        <main className="wf-content">{children}</main>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogTitle>Search your workspace</DialogTitle>
          <DialogDescription>Jump to a workspace view.</DialogDescription>
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search views…"
          />
          {nav
            .filter((n) => n.label.toLowerCase().includes(search.toLowerCase()))
            .map((n) => (
              <Button
                key={n.label}
                variant="ghost"
                onClick={() => {
                  setView(n.label);
                  setSearchOpen(false);
                }}
              >
                {n.label}
                <ChevronRight />
              </Button>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <Card size="sm" className={`wf-panel ${className}`}>
      <CardHeader>
        {Icon && (
          <IconTile variant="frame" className="wf-panel-icon">
            <Icon />
          </IconTile>
        )}
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
export function Status({ children }: { children: ReactNode }) {
  const s = String(children);
  return (
    <Badge
      className="wf-status"
      data-status={s.toLowerCase().replaceAll(" ", "-")}
      variant="outline"
    >
      {children}
    </Badge>
  );
}
export function Stat({
  label,
  value,
  sub,
  icon: Icon = Activity,
  children,
  period,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  period?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <span className="wf-inline">
            <IconTile variant="frame" size="sm">
              <Icon />
            </IconTile>
            {label}
          </span>
        </CardTitle>
        {period && <CardAction className="wf-stat-period">{period}</CardAction>}
      </CardHeader>
      <CardContent>
        <strong className="wf-stat-value">
          {value.includes("/") ? (
            <>
              {value.split("/")[0]}
              <small className="wf-denominator">/{value.split("/")[1]}</small>
            </>
          ) : (
            value
          )}
        </strong>
        <span
          className={`wf-change ${label === "Failed Runs" || label === "Workflow Health" ? "negative" : ""}`}
        >
          {label === "Workflow Health"
            ? "↓ 25.0%"
            : label === "Live Agents"
              ? "↑ 20.0%"
              : label === "Workflow Runs"
                ? "↗ 5.3%"
                : label === "Failed Runs"
                  ? "↗ 200%"
                  : ""}
        </span>
        <p className="wf-muted">{sub}</p>
        {children}
      </CardContent>
    </Card>
  );
}
export function Spark({
  color = "var(--chart-1)",
  variant = 0,
}: {
  color?: string;
  variant?: number;
}) {
  const nums = [
    [22, 29, 24, 33, 31, 18, 20, 32, 33, 31, 36, 30, 26, 30],
    [6, 3, 9, 6, 13, 8, 16, 10, 14, 21, 16, 23, 19, 28],
  ][variant % 2];
  return (
    <svg viewBox="0 0 300 65" className="wf-spark" aria-label="Trend">
      <path
        d={`M0,65 ${nums.map((v, i) => `L${i * 23},${65 - v * 1.6}`).join(" ")} L300,65Z`}
        fill={color}
        opacity=".07"
      />
      <polyline
        points={nums.map((v, i) => `${i * 23},${65 - v * 1.6}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      />
    </svg>
  );
}
export function Chart({
  mode = "line",
  color = "var(--chart-1)",
  height = 275,
  kind = "deploy",
}: {
  mode?: "line" | "layers";
  color?: string;
  height?: number;
  kind?: "deploy" | "tempo" | "flux";
}) {
  const uid = useId().replaceAll(":", "");
  const values =
    kind === "flux"
      ? [42, 24, 31, 76, 112, 126, 130, 124, 109, 87]
      : kind === "tempo"
        ? [74, 87, 91, 86, 80, 81]
        : [66, 76, 83, 80, 52, 71, 78, 88, 75, 82, 77, 87];
  const data = values.map((value, i) => ({
    name:
      kind === "flux"
        ? [
            "00:00",
            "02:00",
            "04:00",
            "06:00",
            "08:00",
            "10:00",
            "12:00",
            "14:00",
            "16:00",
            "20:00",
          ][i]
        : kind === "tempo"
          ? ["", "Jul 14", "", "Jul 15", "", "Jul 16"][i]
          : ["", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"][i],
    value,
    second:
      kind === "tempo"
        ? [43, 54, 58, 51, 48, 50][i]
        : kind === "flux"
          ? [8, 5, 5, 7, 10, 16, 21, 24, 22, 15][i]
          : Math.round(value * 0.26),
    third: kind === "tempo" ? [79, 82, 79, 74, 70, 73][i] : Math.round(value * 0.06),
  }));
  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 20, right: 24, left: 24, bottom: 0 }}>
          <defs>
            <pattern id={uid + "hatch"} patternUnits="userSpaceOnUse" width="6" height="6">
              <path
                d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2"
                stroke={color}
                strokeWidth=".5"
                opacity=".4"
              />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
          <YAxis hide domain={[0, kind === "flux" ? 140 : 120]} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            interval={kind === "flux" ? 1 : 0}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              borderColor: "var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type={kind === "deploy" ? "linear" : "monotone"}
            dataKey="value"
            stroke={color}
            fill={kind === "tempo" ? `url(#${uid}hatch)` : color}
            fillOpacity={kind === "tempo" ? 1 : mode === "layers" ? 0.24 : 0.06}
            strokeWidth={mode === "line" ? 2 : 1}
            dot={
              kind === "deploy" && mode === "line"
                ? { r: 3, fill: "var(--background)", strokeWidth: 2 }
                : false
            }
            isAnimationActive={false}
          />
          {mode === "layers" && (
            <>
              <Area
                type="monotone"
                dataKey="second"
                stroke={kind === "tempo" ? "var(--chart-1)" : color}
                fill={kind === "tempo" ? "var(--chart-1)" : color}
                fillOpacity={0.08}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="third"
                stroke={kind === "tempo" ? "var(--muted-foreground)" : color}
                strokeDasharray={kind === "tempo" ? "4 4" : undefined}
                fill={color}
                fillOpacity={kind === "tempo" ? 0 : 0.18}
                isAnimationActive={false}
              />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Segments({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (x: string) => void;
}) {
  return (
    <div className="wf-segments" role="group">
      {items.map((x) => (
        <Button
          key={x}
          size="sm"
          variant={value === x ? "outline" : "ghost"}
          aria-pressed={value === x}
          onClick={() => onChange(x)}
        >
          {x}
        </Button>
      ))}
    </div>
  );
}
export function EmptyResults({ reset }: { reset: () => void }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No matching records</EmptyTitle>
        <EmptyDescription>Try a different search or clear your filters.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={reset}>
          Clear filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}
export function CreateDialog({
  title,
  open,
  onClose,
  onCreate,
  label = "Name",
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  label?: string;
}) {
  const [name, setName] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Create a record in this local demo workspace.</DialogDescription>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) {
              onCreate(name.trim());
              setName("");
              onClose();
            }
          }}
        >
          <label className="flex flex-col gap-2">
            {label}
            <Input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={label}
            />
          </label>
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function Detail({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className="overflow-auto">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>Workspace record details</SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}
function exportData(name: string, rows: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".json";
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Export downloaded");
}
export function ExportButton({
  name,
  rows,
  primary = false,
}: {
  name: string;
  rows: unknown;
  primary?: boolean;
}) {
  return (
    <Button
      size="sm"
      variant={primary ? "default" : "outline"}
      onClick={() => exportData(name, rows)}
    >
      <ArrowDownToLine />
      Export
    </Button>
  );
}
export function WorkspaceSettings() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="wf-settings">
      <h1>Workspace settings</h1>
      <Panel title="General" description="Manage your workspace profile and preferences.">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
          }}
        >
          <label className="flex flex-col gap-2">
            Workspace name
            <Input defaultValue="Atlas" onChange={() => setSaved(false)} />
          </label>
          <label className="flex flex-col gap-2">
            Contact email
            <Input type="email" defaultValue="nick@example.com" onChange={() => setSaved(false)} />
          </label>
          <Button type="submit">
            {saved ? (
              <>
                <Check />
                Changes saved
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
