import fleetLivingRoom from "./assets/fleet-living-room.png";
import { useState } from "react";
import {
  Copy,
  Download,
  Ellipsis,
  FileText,
  Link,
  PanelLeft,
  Pin,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Button,
  Badge,
  Breadcrumbs,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Face,
  toast,
} from "./chrome";
import {
  AccountCard,
  Choices,
  ContentCards,
  GroupedNav,
  NavSearch,
  Rail,
  Segments,
  Sidebar,
} from "./primitives";
import { downloadFile } from "@/lib/download";
export function GlassWorkspace() {
  const [active, setActive] = useState("Fleet");
  const [tab, setTab] = useState("Operations");
  return (
    <div
      className="shell-reference shell-color-wash p-3 gap-4"
      data-shell-variant="31"
    >
      <Rail glass active={active} onChange={setActive} />
      <main className="shell-content-frame !overflow-visible rounded-3xl !bg-transparent pt-3">
        <div
          className="shell-folder-tabs flex"
          role="tablist"
          aria-label="Workspace tabs"
        >
          {["Operations", "Structure", "Insights"].map((name) => (
            <button
              role="tab"
              aria-selected={tab === name}
              key={name}
              onClick={() => setTab(name)}
              className={`shell-folder-tab ${tab === name ? "active" : ""}`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex min-h-0 flex-1 gap-6">
          <section className="flex min-w-0 flex-1 rounded-3xl bg-background/90 p-2">
            <ContentCards layout="glass" />
          </section>
          <aside className="shell-glass-assistant hidden w-[32%] flex-col rounded-3xl border border-background/70 bg-background/70 p-2 lg:flex">
            <div className="h-6 rounded-xl bg-muted/60" />
            <div className="mt-auto space-y-3">
              <div className="h-20 rounded-xl bg-muted/70" />
              <div className="h-3 w-2/5 rounded bg-muted/70" />
              <div className="h-40 rounded-xl bg-muted/70" />
              <div className="h-10 rounded-xl bg-muted/70" />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
export function BoardWorkspace() {
  const [active, setActive] = useState("Overview");
  const [view, setView] = useState("Board");
  const [confirm, setConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [name, setName] = useState("Launch Map");
  return (
    <div className="shell-reference" data-shell-variant="35">
      <Rail active={active} onChange={setActive} />
      <main className="shell-content-frame">
        <header className="shell-header border-b">
          <Breadcrumbs items={["Boards", name]} />
          <Segments
            label="Board views"
            items={["Board", "Outline", "Comments", "Activity"]}
            value={view}
            onChange={setView}
          />
          <div className="flex shrink-0 items-center gap-1">
            <div
              className="mr-2 hidden -space-x-1 lg:flex"
              aria-label="3 people editing now"
            >
              {[0, 1, 2].map((i) => (
                <Face small key={i} index={i} />
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(location.href);
                toast.success("Board link copied");
              }}
            >
              <Share2 />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadFile(
                  `${name}.json`,
                  JSON.stringify({ name, view }, null, 2),
                  "application/json",
                )
              }
            >
              <Download />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Board menu">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      setName(`${name} copy`);
                      toast.success("Board duplicated");
                    }}
                  >
                    <Copy />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      downloadFile(
                        `${name}.json`,
                        JSON.stringify({ name, view }, null, 2),
                        "application/json",
                      )
                    }
                  >
                    <Download />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setConfirm(true)}>
                    <Trash2 />
                    Delete Board
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {deleted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p>Board deleted</p>
            <Button variant="outline" onClick={() => setDeleted(false)}>
              Undo
            </Button>
          </div>
        ) : (
          <ContentCards />
        )}
      </main>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {name}? You can undo this action in the preview.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleted(true);
                toast("Board deleted", {
                  action: { label: "Undo", onClick: () => setDeleted(false) },
                });
              }}
            >
              Delete Board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
const observeGroups = [
  { label: "", items: ["Home"] },
  { label: "Observe", items: ["Endpoints", "Hosts", "Topology"] },
  {
    label: "Investigate",
    items: ["Explorer", "Traces", "Logs", "Sessions", "Queries"],
  },
];
export function ObservabilityShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("Home");
  const [query, setQuery] = useState("");
  const [pins, setPins] = useState([
    "Checkout Latency",
    "Cache Hit Ratio",
    "Queue Backlog",
    "Billing Workers",
  ]);
  const [workspace, setWorkspace] = useState("Nimbus Core");
  const [explorer, setExplorer] = useState(true);
  const groups = observeGroups.map((g) =>
    g.label === "Investigate" && !explorer
      ? { ...g, items: ["Explorer", "Queries"] }
      : g,
  );
  function unpin(name: string) {
    setPins((v) => v.filter((n) => n !== name));
    toast(`${name} unpinned`, {
      action: {
        label: "Undo",
        onClick: () => setPins((v) => (v.includes(name) ? v : [...v, name])),
      },
    });
  }
  return (
    <div className="shell-reference" data-shell-variant="36">
      <Sidebar collapsed={collapsed} className="!w-60 border-r !bg-background">
        <Choices
          label="Switch workspace"
          value={workspace}
          items={["Nimbus Core", "Atlas Cloud", "Personal"]}
          onChange={setWorkspace}
        />
        <NavSearch value={query} onChange={setQuery} />
        <GroupedNav
          groups={groups}
          active={active}
          onSelect={(name) => {
            setActive(name);
            if (name === "Explorer") setExplorer((v) => !v);
          }}
          query={query}
        />
        {!collapsed && (
          <section className="mt-2">
            <p className="shell-section-label flex justify-between">
              Pinned<Badge variant="outline">{pins.length}</Badge>
            </p>
            {pins
              .filter((p) => p.toLowerCase().includes(query.toLowerCase()))
              .map((name) => (
                <div className="group flex items-center" key={name}>
                  <Button
                    variant={active === name ? "secondary" : "ghost"}
                    className="shell-nav-button min-w-0 flex-1 justify-start"
                    onClick={() => setActive(name)}
                  >
                    <FileText />
                    <span className="truncate">{name}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Unpin ${name}`}
                    onClick={() => unpin(name)}
                  >
                    <X />
                  </Button>
                </div>
              ))}
          </section>
        )}
        <div className="mt-auto">
          <GroupedNav
            groups={[{ label: "", items: ["Sources", "Settings"] }]}
            active={active}
            onSelect={setActive}
          />
          <AccountCard />
        </div>
      </Sidebar>
      <main className="shell-content-frame">
        <header className="shell-header border-b">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle Sidebar"
              onClick={() => setCollapsed((v) => !v)}
            >
              <PanelLeft />
            </Button>
            <Breadcrumbs items={["Workspace", active]} />
          </div>
          <div className="flex gap-1">
            <Button
              variant={pins.includes(active) ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                if (pins.includes(active)) unpin(active);
                else setPins((v) => [...v, active]);
              }}
            >
              <Pin />
              {pins.includes(active) ? "Unpin" : "Pin"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `${location.href.split("?")[0]}?page=${encodeURIComponent(active)}`,
                );
                toast.success("Page link copied");
              }}
            >
              <Link />
              Copy Link
            </Button>
          </div>
        </header>
        <ContentCards />
      </main>
    </div>
  );
}
export function FleetHeroShell() {
  const [section, setSection] = useState("Overview");
  const [rail, setRail] = useState("Fleet");
  const [request, setRequest] = useState(true);
  return (
    <div className="shell-reference shell-fleet-hero" data-shell-variant="22">
      <div
        className="shell-hero-scene"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${fleetLivingRoom})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="shell-hero-pixels">
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                bottom: `${(i * 17) % 90}px`,
                width: 4 + (i % 3) * 4,
                height: 4 + (i % 3) * 4,
                opacity: 0.2 + (i % 4) * 0.15,
              }}
            />
          ))}
        </div>
      </div>
      <Rail glass active={rail} onChange={setRail} />
      <main className="shell-content-frame !bg-transparent">
        <div className="relative z-10 mx-auto mt-4 max-w-full px-2">
          <Segments
            label="Fleet sections"
            items={[
              "Overview",
              "Missions",
              "Statistics",
              "Requests",
              "Maintenance",
            ]}
            value={section}
            onChange={setSection}
          />
        </div>
        {request && (
          <div className="shell-access-request absolute right-5 top-5 z-20 w-64 rounded-xl bg-black/65 p-3 text-xs text-white shadow-lg backdrop-blur-lg">
            <strong>Access request</strong>
            <p className="mt-1 text-white/70">
              R1-06 wants to connect to the control room.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded border border-white/30 px-2 py-1"
                onClick={() => setRequest(false)}
              >
                Dismiss
              </button>
              <button
                className="rounded bg-emerald-500 px-2 py-1"
                onClick={() => {
                  setRequest(false);
                  toast.success("Access allowed");
                }}
              >
                Allow
              </button>
            </div>
          </div>
        )}
        <div className="mt-[280px] flex min-h-0 flex-1">
          <ContentCards />
        </div>
      </main>
    </div>
  );
}
