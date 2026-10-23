import { ReuiSidebar } from "@/components/reui/sidebar";
import { AppShellInset, useShellSidebarState } from "@/components/reui/layout";
import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  CircleHelp,
  Ellipsis,
  FileText,
  ListTodo,
  Maximize2,
  MessageSquare,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Plus,
  Square,
  Users,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  Button,
  Badge,
  CollapseHandle,
  CreateItemDialog,
  HeaderSwitchers,
  Members,
  Navigation,
  Notifications,
  ReuiMark,
  SearchPalette,
  SkeletonLines,
  UsageCard,
  WorkspaceMenu,
  toast,
} from "./chrome";
import type { NavNode } from "./chrome";
import { CalendarContext } from "./calendar-panel";
import { Sidebar } from "./primitives";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
const navigation: NavNode[] = [
  { label: "Today", icon: CalendarDays },
  { label: "Handoffs", icon: FileText },
  { label: "Follow-ups", icon: Check },
  {
    label: "Brief Queue",
    icon: ListTodo,
    children: ["All briefs", "Assigned", "Waiting"],
  },
  {
    label: "Accounts",
    icon: Users,
    children: ["All accounts", "Active", "Archived"],
  },
  { label: "Insights", icon: Activity },
];
const operators = [
  "Maya Chen",
  "Owen Price",
  "Noah Singh",
  "Iris Hale",
  "Sofia Bennett",
  "Liam Carter",
];
function RecordPane() {
  const [view, setView] = useState("Overview");
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs className="min-h-0 flex-1 gap-0" value={view} onValueChange={setView}>
        <TabsList variant="line" className="h-11 w-full shrink-0 justify-start gap-1 border-b px-3">
          {["Overview", "Activity", "Briefs", "Calls"].map((n, i) => (
            <TabsTrigger key={n} value={n} className="h-10 px-2 text-[11px]">
              <Square className="size-3" />
              {n}
              {i > 1 && (
                <Badge variant="outline" className="h-4 px-1 text-[9px]">
                  {i === 2 ? "6" : "3"}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {["Overview", "Activity", "Briefs", "Calls"].map((n) => (
          <TabsContent value={n} key={n} className="flex min-h-0 overflow-hidden">
            <SkeletonLines cards={n === "Overview" || n === "Briefs"} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
function DetailPane({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState("Details");
  return (
    <Tabs className="h-full min-h-0 gap-0" value={tab} onValueChange={setTab}>
      <div className="flex h-11 shrink-0 items-center justify-between border-b">
        <TabsList variant="line" className="h-11 px-3">
          <TabsTrigger value="Details" className="h-10 text-[11px]">
            Details
          </TabsTrigger>
          <TabsTrigger value="Comments" className="h-10 text-[11px]">
            Comments
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              4
            </Badge>
          </TabsTrigger>
        </TabsList>
        <Button variant="ghost" size="icon-sm" aria-label="Hide detail sidebar" onClick={onClose}>
          <PanelRight />
        </Button>
      </div>
      {["Details", "Comments"].map((t) => (
        <TabsContent key={t} value={t} className="min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-5 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div className="flex flex-col gap-2.5" key={i}>
                <span className="shell-placeholder-line w-1/3" />
                <span className="shell-placeholder-line w-2/3" />
                <span className="shell-placeholder-line w-3/4" />
                <span className="shell-placeholder-line w-5/6" />
              </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
function Workbench({
  onClose,
  expanded,
  onExpand,
}: {
  onClose: () => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const [tab, setTab] = useState("Settings");
  const names = ["Settings", "Webhooks", "Events", "Logs", "Health", "Inspector"];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-4">
        <h3 className="text-xs font-semibold">Workbench</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Workbench actions"
            onClick={() => toast("Workbench options selected")}
          >
            <Ellipsis />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={expanded ? "Restore workbench" : "Expand workbench"}
            onClick={onExpand}
          >
            <Maximize2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Hide workbench sheet"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 flex-col-reverse gap-0">
        <TabsList
          variant="line"
          className="h-11 w-full shrink-0 justify-start overflow-x-auto border-t px-4"
        >
          {names.map((name, i) => (
            <TabsTrigger value={name} key={name} className="h-10 shrink-0 px-2 text-[11px]">
              {name}
              {i > 1 && i < 5 && (
                <Badge variant="outline" className="h-4 px-1 text-[9px]">
                  {[0, 0, 8, 3, 12][i]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {names.map((name) => (
          <TabsContent
            key={name}
            value={name}
            className="grid min-h-0 grid-cols-2 gap-4 overflow-hidden p-4"
          >
            {[0, 1].map((i) => (
              <div
                className="flex flex-col gap-3 rounded-lg border border-dashed border-border/40 p-4"
                key={i}
              >
                <span className="shell-placeholder-line mb-2 w-1/3" />
                {Array.from({ length: 4 }, (_, j) => (
                  <div className="flex items-center gap-3" key={j}>
                    <span className="shell-placeholder-line flex-1" />
                    <span className="shell-placeholder-line w-8" />
                  </div>
                ))}
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
export default function OperationsShell() {
  const [compact, setCompact] = useState(() => window.innerWidth < 768);
  const [regions, setRegions] = useState(() =>
    window.innerWidth < 768
      ? ["workspace", "workbench"]
      : ["workspace", "details", "context", "workbench"],
  );
  useEffect(() => {
    const media = matchMedia("(max-width:767px)");
    const update = () => {
      setCompact(media.matches);
      if (media.matches) setRegions((v) => v.filter((n) => n !== "details" && n !== "context"));
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [collapsed, setCollapsed] = useShellSidebarState();
  const [active, setActive] = useState("Today");
  const [note, setNote] = useState(false);
  const [expanded, setExpanded] = useState(false);
  function toggle(name: string) {
    setRegions(regions.includes(name) ? regions.filter((n) => n !== name) : [...regions, name]);
  }
  return (
    <div className="shell-reference" data-shell-variant="11">
      {regions.includes("workspace") && (
        <Sidebar collapsed={collapsed} className="border-r" label="Operations navigation">
          <div className="flex h-9 items-center gap-2 px-2">
            <ReuiMark />
            {!collapsed && <span className="sidebar-expanded text-xs font-medium">Bricklane</span>}
          </div>
          <div className="mt-3 px-0">
            <SearchPalette collapsed={collapsed} onSelect={setActive} />
          </div>
          <div className="sidebar-expanded mt-2 flex items-center gap-2 px-2">
            <Notifications />
            <span className="text-xs">Notifications</span>
          </div>
          <div className="shell-scroll mt-3">
            <Navigation
              items={navigation}
              label="Workspace"
              collapsed={collapsed}
              active={active}
              onSelect={setActive}
            />
            <div className="sidebar-expanded">
              <Members
                collapsed={collapsed}
                names={operators}
                label="Operators"
                onSelect={setActive}
              />
            </div>
          </div>
          <div className="sidebar-expanded">
            <UsageCard
              collapsed={collapsed}
              title="AI Drafts"
              description="Draft credits refresh with the workspace cycle"
              value={78}
            />
          </div>
          <WorkspaceMenu collapsed={collapsed} initial="Codex" />
          <CollapseHandle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </Sidebar>
      )}
      <AppShellInset className="shell-content-frame">
        <header className="shell-header border-b">
          <HeaderSwitchers initialOrg="Atlas Desk" initialApp="" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-muted-foreground max-sm:hidden"
              onClick={() =>
                toast("Workspace help", {
                  description:
                    "Use the panel toggles and resize handles to arrange your workspace.",
                })
              }
            >
              <CircleHelp />
              Help
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() =>
                toast("Ask ReUI", {
                  description: "Assistant selected in this local demo.",
                })
              }
            >
              <MessageSquare />
              Ask ReUI
            </Button>
            <Button
              variant={regions.includes("context") ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label={
                regions.includes("context") ? "Close context panel" : "Open context panel"
              }
              onClick={() => toggle("context")}
            >
              <PanelRight />
            </Button>
          </div>
        </header>
        <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 sm:flex-nowrap sm:py-0">
          <div className="flex items-center gap-2 text-xl font-medium">
            <ReuiMark small />
            Codex
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => setNote(true)}
            >
              <Plus />
              Add note
            </Button>
            <ToggleGroup
              type="multiple"
              value={regions}
              onValueChange={setRegions}
              className="gap-0 rounded-lg border"
              aria-label="Workspace regions"
            >
              {[
                ["workspace", PanelLeft, "Collapse workspace sidebar"],
                ["details", PanelRight, "Collapse details sidebar"],
                ["context", CalendarDays, "Collapse context sidebar"],
                ["workbench", PanelBottom, "Hide workbench bottom sheet"],
              ].map(([value, I, label]) => {
                const Icon = I as typeof PanelLeft;
                return (
                  <ToggleGroupItem
                    value={String(value)}
                    key={String(value)}
                    aria-label={String(label)}
                    className="size-7 min-w-7 rounded-none border-r px-1.5"
                  >
                    <Icon />
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Collapse all sidebars"
              onClick={() =>
                setRegions(regions.length ? [] : ["workspace", "details", "context", "workbench"])
              }
            >
              <Square />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <ResizablePanelGroup orientation="vertical" key={expanded ? "expanded" : "normal"}>
            <ResizablePanel
              id="record"
              defaultSize={regions.includes("workbench") ? (expanded ? "20%" : "64%") : "100%"}
              minSize="15%"
            >
              <ResizablePanelGroup orientation="horizontal">
                <ResizablePanel
                  id="main-record"
                  defaultSize={regions.includes("details") && !compact ? "62%" : "100%"}
                  minSize="25%"
                >
                  <RecordPane />
                </ResizablePanel>
                {regions.includes("details") && !compact && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel id="detail" defaultSize="38%" minSize="20%">
                      <DetailPane onClose={() => toggle("details")} />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
            {regions.includes("workbench") && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel id="workbench" defaultSize={expanded ? "80%" : "36%"} minSize="18%">
                  <Workbench
                    onClose={() => toggle("workbench")}
                    expanded={expanded}
                    onExpand={() => setExpanded(!expanded)}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </AppShellInset>
      {regions.includes("context") && !compact && (
        <ReuiSidebar collapsible="none" className="shell-context">
          <CalendarContext />
        </ReuiSidebar>
      )}
      <Sheet
        open={compact && regions.includes("details")}
        onOpenChange={(open) => {
          if (!open) setRegions((v) => v.filter((n) => n !== "details"));
        }}
      >
        <SheetContent className="gap-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Record details</SheetTitle>
            <SheetDescription>Details and comments for the current record.</SheetDescription>
          </SheetHeader>
          <DetailPane onClose={() => toggle("details")} />
        </SheetContent>
      </Sheet>
      <Sheet
        open={compact && regions.includes("context")}
        onOpenChange={(open) => {
          if (!open) setRegions((v) => v.filter((n) => n !== "context"));
        }}
      >
        <SheetContent className="gap-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Calendar context</SheetTitle>
            <SheetDescription>Calendar accounts and upcoming events.</SheetDescription>
          </SheetHeader>
          <CalendarContext />
        </SheetContent>
      </Sheet>
      <CreateItemDialog
        open={note}
        onOpenChange={setNote}
        title="Add note"
        onCreate={(name) => toast.success(`Note added: ${name}`)}
      />
    </div>
  );
}
