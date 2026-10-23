import { AppShellInset, useShellSidebarState } from "@/components/reui/layout";
import { Sidebar } from "./primitives";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  KeyRound,
  Network,
  Shield,
  Users,
  Webhook,
  X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Button,
  Badge,
  CollapseHandle,
  HeaderSwitchers,
  Navigation,
  PlaceholderCanvas,
  ReuiMark,
  SearchPalette,
  WorkspaceMenu,
} from "./chrome";
import type { NavNode } from "./chrome";
const nav: NavNode[] = [
  { label: "Overview", icon: Activity },
  {
    label: "Users",
    icon: Users,
    children: ["All Users", "Invitations", "Roles"],
  },
  {
    label: "Organizations",
    icon: Network,
    children: ["All Organizations", "Teams", "Billing"],
  },
  {
    label: "Security",
    icon: Shield,
    children: ["Policies", "Audit Log", "Sessions"],
  },
  { label: "Webhooks", icon: Webhook },
  { label: "API Keys", icon: KeyRound },
];
export function SystemMonitor() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState(0);
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setPhase((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [open]);
  const metrics = [
    ["CPU", 34.1, "%"],
    ["GPU", 8.9, "%"],
    ["Memory", 8.3, "GB"],
    ["Network", 9.4, "Mbps"],
  ] as const;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px]"
          aria-label="System monitor"
        >
          <Activity />
          System
          <Badge
            variant="outline"
            className="ml-1 h-4 border-0 bg-[color-mix(in_oklab,var(--chart-2)_10%,transparent)] px-1 text-[9px] font-normal text-[var(--chart-2)]"
          >
            Normal
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <h3 className="text-xs font-medium">System Monitor</h3>
          <span className="text-[10px] text-muted-foreground">
            {new Date(2026, 5, 10, 9, 24, 8 + phase).toLocaleTimeString("en-US")}
          </span>
        </div>
        <div className="grid grid-cols-2">
          {metrics.map(([name, base, unit], i) => {
            const color = `var(--chart-${i + 1})`;
            const value = base + Math.sin(phase * 0.5 + i) * Math.min(2, base * 0.08);
            const points = Array.from(
              { length: 25 },
              (_, j) =>
                `${j * 6},${27 - (Math.sin(j * 1.9 + phase * 0.25 + i) * 7 + Math.sin(j * 0.5 + i) * 4)}`,
            ).join(" ");
            return (
              <div className="border-b p-3 odd:border-r" key={name}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{name}</span>
                  <span style={{ color }}>
                    {value.toFixed(1)}
                    <span className="ml-0.5 text-[8px] text-muted-foreground">{unit}</span>
                  </span>
                </div>
                <svg
                  viewBox="0 0 144 46"
                  className="mt-3 h-9 w-full"
                  aria-label={`${name} usage trend`}
                >
                  <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
                </svg>
              </div>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start px-3 text-[10px] font-normal text-muted-foreground"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDown />
          Per-Agent Memory
        </Button>
        {expanded && (
          <div className="flex flex-col gap-3 px-3 pb-4">
            {["Ingest Worker", "Transform Pipeline", "Query Engine", "Export Service"].map(
              (name, i) => (
                <div key={name} className="flex items-center gap-2 text-[10px]">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: `var(--chart-${i + 1})` }}
                  />
                  <span className="flex-1 text-muted-foreground">{name}</span>
                  <Progress value={[46, 98, 84, 22][i]} className="h-1 w-12" />
                  <span className="w-10 text-right text-[9px] text-muted-foreground">
                    {[231, 493, 417, 107][i]}MB
                  </span>
                </div>
              ),
            )}
          </div>
        )}
        <p className="border-t px-3 py-1.5 text-[8px] text-muted-foreground">
          Simulated resource metrics
        </p>
      </PopoverContent>
    </Popover>
  );
}
export function NewsCard() {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const articles = [
    [
      "Multi-theme support is here",
      "Switch between Vega, Nova, Maia, Lyra, and Mira themes across all components.",
    ],
    [
      "Build with your favorite tools",
      "Connect your workspace and keep your team moving together.",
    ],
    [
      "Your next great idea starts here",
      "Explore better workflows for your product and design team.",
    ],
  ];
  if (index >= articles.length) return null;
  return (
    <>
      <div className="relative mx-3 mb-3 rounded-xl border bg-background p-3 shadow-xs">
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1 size-5 opacity-0 hover:opacity-100 focus:opacity-100"
          aria-label="Dismiss news card"
          onClick={() => setIndex(index + 1)}
        >
          <X />
        </Button>
        <p className="pr-2 text-[11px] font-medium">{articles[index][0]}</p>
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
          {articles[index][1]}
        </p>
        <button
          className="mt-3 block h-24 w-full overflow-hidden rounded-lg bg-[radial-gradient(ellipse_at_20%_20%,#eac08d_0%,transparent_46%),radial-gradient(ellipse_at_10%_100%,#27a1d5_0%,transparent_60%),linear-gradient(135deg,#e8b5c6,#7b38d9_65%,#220c91)]"
          aria-label="Read news article"
          onClick={() => setOpen(true)}
        />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{articles[index][0]}</DialogTitle>
            <DialogDescription>{articles[index][1]}</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-7 text-muted-foreground">
            This preview demonstrates a dismissible workspace news card. Use the sidebar’s account
            menu to try light and dark themes.
          </p>
          <Button onClick={() => setOpen(false)}>
            Back to workspace
            <ArrowRight />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default function EnvironmentShell() {
  const [collapsed, setCollapsed] = useShellSidebarState();
  const [active, setActive] = useState("Overview");
  return (
    <div className="shell-reference flex-col" data-shell-variant="7">
      <header className="shell-header border-b">
        <div className="flex min-w-0 items-center gap-4">
          <ReuiMark />
          <HeaderSwitchers />
        </div>
        <SystemMonitor />
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar
          width={260}
          collapsed={collapsed}
          className={` border-r ${collapsed ? "collapsed" : ""}`}
        >
          <div className="mb-3 p-2">
            <SearchPalette collapsed={collapsed} onSelect={setActive} />
          </div>
          <div className="shell-scroll">
            <Navigation
              items={nav}
              collapsed={collapsed}
              initialExpanded={["Users"]}
              active={active}
              onSelect={setActive}
            />
          </div>
          <div className="sidebar-expanded">
            <NewsCard />
          </div>
          <WorkspaceMenu collapsed={collapsed} user initial="Acme Inc" subtitle="nick@reui.io" />
          <CollapseHandle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </Sidebar>
        <AppShellInset className="shell-content-frame">
          <PlaceholderCanvas />
        </AppShellInset>
      </div>
    </div>
  );
}
