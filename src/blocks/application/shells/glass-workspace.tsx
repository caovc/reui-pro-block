import { useEffect, useState } from "react";
import {
  Bot,
  ClipboardList,
  LogOut,
  Map,
  MapPinned,
  Menu,
  Moon,
  Monitor,
  RadioTower,
  Route,
  Settings,
  ShieldAlert,
  SquareDashedMousePointer,
  Sun,
  UserRound,
  Search,
  LayoutDashboard,
} from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Face,
  ReuiMark,
} from "./chrome";
import type { ShellIcon } from "./chrome";
const railItems: [string, ShellIcon][] = [
  ["Overview", LayoutDashboard],
  ["Routes", Route],
  ["Map", Map],
  ["Signals", RadioTower],
  ["Robots", Bot],
  ["Zones", SquareDashedMousePointer],
  ["Stops", MapPinned],
  ["Incidents", ShieldAlert],
  ["Tasks", ClipboardList],
];
function GlassCard({ small = false }: { small?: boolean }) {
  return (
    <Frame
      variant="ghost"
      className={`glass-reference-card ${small ? "small" : ""}`}
    >
      <FramePanel>
        <span className="glass-reference-line" />
        {!small && <span className="glass-reference-line" />}
        <span className="glass-reference-block" />
      </FramePanel>
    </Frame>
  );
}
export default function GlassWorkspace() {
  const [active, setActive] = useState("Overview");
  const [tab, setTab] = useState("Operations");
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  const [themeTouched, setThemeTouched] = useState(false);
  useEffect(() => {
    if (!themeTouched) return;
    const media = matchMedia("(prefers-color-scheme:dark)");
    const update = () =>
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && media.matches),
      );
    update();
    if (theme === "system") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
  }, [theme, themeTouched]);
  const sectionButtons = railItems.map(([name, Icon]) => (
    <IconTile
      asChild
      key={name}
      variant="outline"
      size="sm"
      className="glass-rail-item"
    >
      <button
        aria-label={name}
        title={name}
        aria-pressed={active === name}
        onClick={() => setActive(name)}
      >
        <Icon />
      </button>
    </IconTile>
  ));
  return (
    <div
      className="shell-reference reui-reference glass-reference"
      data-shell-variant="31"
    >
      <nav className="glass-reference-rail" aria-label="Workspace sections">
        <div className="glass-rail-pill glass-rail-brand">
          <ReuiMark small />
          <Button variant="ghost" size="icon-sm" aria-label="Search">
            <Search />
          </Button>
        </div>
        <div className="glass-rail-pill glass-rail-sections">
          {sectionButtons}
        </div>
        <div className="glass-rail-pill glass-rail-account">
          <Button variant="ghost" size="icon-sm" aria-label="Sign out">
            <LogOut />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Operator menu" className="glass-operator">
                <Face name="Kai Meyer" index={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              className="reui-reference w-56"
            >
              <DropdownMenuLabel>
                <strong className="block text-sm font-medium">Kai Meyer</strong>
                <span className="text-xs font-normal text-muted-foreground">
                  kai@reui.io
                </span>
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserRound />
                  Profile
                  <span className="ml-auto text-xs text-muted-foreground">
                    ⇧⌘P
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <ToggleGroup
                type="single"
                value={theme}
                onValueChange={(value) => {
                  if (value) {
                    setThemeTouched(true);
                    setTheme(value);
                  }
                }}
                className="mx-2 mb-2 w-[calc(100%-16px)] rounded-lg border p-0.5"
                size="sm"
              >
                {(
                  [
                    ["light", Sun],
                    ["dark", Moon],
                    ["system", Monitor],
                  ] as const
                ).map(([value, Icon]) => (
                  <ToggleGroupItem
                    key={value}
                    value={value}
                    aria-label={value[0].toUpperCase() + value.slice(1)}
                    className="h-7 flex-1"
                  >
                    <Icon className="size-3.5" />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      <div className="glass-mobile-toolbar">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label="Open sections">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="reui-reference">
            <SheetHeader>
              <SheetTitle>Sections</SheetTitle>
              <SheetDescription>Workspace navigation</SheetDescription>
            </SheetHeader>
            <div className="glass-mobile-sections">{sectionButtons}</div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="glass-reference-columns">
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="glass-reference-workspace"
        >
          <TabsList className="glass-reference-tabs">
            {["Operations", "Structure", "Insights"].map((name) => (
              <TabsTrigger value={name} key={name}>
                <svg
                  viewBox="0 0 264 44"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M24 0H208C220 0 222 3 228 14L240 34C244 41 247 44 256 44H264H0V24C0 10 10 0 24 0Z" />
                </svg>
                <span>{name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab} className="glass-reference-sheet">
            <div className="glass-reference-top">
              <div className="glass-reference-stat-grid">
                {[0, 1, 2, 3].map((i) => (
                  <GlassCard small key={i} />
                ))}
              </div>
              <GlassCard />
            </div>
            <GlassCard />
          </TabsContent>
        </Tabs>
        <Frame variant="ghost" className="glass-reference-assistant">
          <FramePanel fit className="glass-assistant-title" />
          <div className="glass-assistant-thread">
            <div />
            <section>
              <span />
              <span />
            </section>
            <div />
            <div />
          </div>
        </Frame>
      </div>
    </div>
  );
}
