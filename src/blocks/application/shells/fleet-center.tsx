import swaggerMark from "./assets/swagger.svg";
import redditMark from "./assets/reddit.svg";
import strapiMark from "./assets/strapi.svg";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  BatteryCharging,
  Bot,
  CircleHelp,
  CopyPlus,
  DatabaseZap,
  Home,
  Layers,
  LayoutDashboard,
  Map,
  MapPinned,
  MonitorCog,
  OctagonAlert,
  PanelLeft,
  Plus,
  RadioTower,
  Route,
  Search,
  Settings,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { IconTile } from "@/components/reui/icon-tile";
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
  toast,
} from "./chrome";
import type { ShellIcon } from "./chrome";
import { Sidebar } from "./primitives";
import { ScopeTree } from "./scopes";
import { FleetPlaceholders } from "./detail-placeholders";
const views: [string, ShellIcon][] = [
  ["Overview", LayoutDashboard],
  ["Live", RadioTower],
  ["Runs", Route],
  ["Load", Layers],
  ["Power", DatabaseZap],
  ["Service", Settings2],
  ["Issues", OctagonAlert],
  ["Trends", BarChart3],
];
function ActionMenu({
  label,
  icon: Icon,
  items,
}: {
  label: string;
  icon: ShellIcon;
  items: [string, ShellIcon][];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Icon />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="reui-reference">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuGroup>
          {items.map(([name, Glyph]) => (
            <DropdownMenuItem key={name} onSelect={() => toast(name)}>
              <Glyph />
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function FleetRail() {
  const [active, setActive] = useState("Fleet");
  const icons: [string, ShellIcon][] = [
    ["Fleet", Home],
    ["Live map", Map],
    ["Robots", Bot],
    ["Stations", MapPinned],
    ["Security", ShieldCheck],
  ];
  return (
    <nav className="fleet-center-rail" aria-label="Applications">
      <ReuiMark small />
      <div className="fleet-rail-links">
        {icons.map(([name, Icon]) => (
          <IconTile
            asChild
            size="xs"
            variant="outline"
            key={name}
            className="fleet-rail-icon"
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
        ))}
      </div>
      <div className="fleet-connected-apps">
        <button
          aria-label="Swagger"
          onClick={() => toast("Swagger selected")}
          className="fleet-brand swagger"
        >
          <img src={swaggerMark} alt="" />
        </button>
        <button
          aria-label="Reddit"
          onClick={() => toast("Reddit selected")}
          className="fleet-brand reddit"
        >
          <img src={redditMark} alt="" />
        </button>
        <button
          aria-label="Strapi"
          onClick={() => toast("Strapi selected")}
          className="fleet-brand strapi"
        >
          <img src={strapiMark} alt="" />
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Connect app"
          onClick={() => toast("Connect app")}
        >
          <Plus />
        </Button>
      </div>
      <div className="fleet-rail-bottom">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Help"
          onClick={() => toast("Help selected")}
        >
          <CircleHelp />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Settings"
          onClick={() => toast("Settings selected")}
        >
          <Settings />
        </Button>
        <button
          aria-label="Account menu for Shadcn"
          onClick={() => toast("Account selected")}
        >
          <Face small />
        </button>
      </div>
    </nav>
  );
}
export default function FleetCenter() {
  const [collapsed, setCollapsed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("Overview");
  const [pinned, setPinned] = useState(views);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searching) search.current?.focus();
  }, [searching]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <div
      className="shell-reference reui-reference fleet-center"
      data-shell-variant="33"
    >
      <FleetRail />
      <Sidebar
        collapsed={collapsed}
        className="fleet-center-sidebar shell-dark"
        drawerClassName="fleet-center shell-dark"
        label="Fleet navigation"
      >
        <header className="fleet-center-title">
          {searching ? (
            <div className="fleet-scope-search">
              <Search />
              <Input
                ref={search}
                aria-label="Search scopes"
                placeholder="Search scopes"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearching(false);
                    setQuery("");
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Close scope search"
                onClick={() => {
                  setSearching(false);
                  setQuery("");
                }}
              >
                <PanelLeft />
              </Button>
            </div>
          ) : (
            <>
              <span>Fleet Center</span>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Search scopes"
                onClick={() => setSearching(true)}
              >
                <Search />
              </Button>
            </>
          )}
        </header>
        {!collapsed && (
          <div className="fleet-center-panel">
            <div className="fleet-view-grid">
              {pinned.map(([name, Icon]) => (
                <IconTile
                  asChild
                  variant="solid"
                  key={name}
                  className="fleet-view-tile"
                >
                  <button
                    aria-pressed={active === name}
                    onClick={() => setActive(name)}
                  >
                    <Icon />
                    <span>{name}</span>
                  </button>
                </IconTile>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconTile asChild variant="solid" className="fleet-view-tile">
                    <button aria-label="Pin a view">
                      <Plus />
                    </button>
                  </IconTile>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="reui-reference">
                  <DropdownMenuLabel>Pin View</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {(
                      [
                        ["Charging", BatteryCharging],
                        ["Zones", MapPinned],
                        ["Dispatch", Route],
                      ] as [string, ShellIcon][]
                    )
                      .filter(([name]) => !pinned.some(([n]) => n === name))
                      .map(([name, Icon]) => (
                        <DropdownMenuItem
                          key={name}
                          onSelect={() =>
                            setPinned((v) => [...v, [name, Icon]])
                          }
                        >
                          <Icon />
                          {name}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ScopeTree fleetTree query={query} onSelect={setActive} />
          </div>
        )}
        <footer className="fleet-center-footer">
          <ActionMenu
            label="Quick Add"
            icon={CopyPlus}
            items={[
              ["New Mission", Route],
              ["New Robot", Bot],
              ["New Zone", MapPinned],
            ]}
          />
          <ActionMenu
            label="System"
            icon={MonitorCog}
            items={[
              ["Sync Robots", Activity],
              ["Run Diagnostics", Settings2],
              ["Fleet Health", ShieldCheck],
            ]}
          />
        </footer>
        <Button
          className="shell-collapse-handle"
          variant="ghost"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span />
        </Button>
      </Sidebar>
      <main className="fleet-center-main">
        <FleetPlaceholders />
      </main>
    </div>
  );
}
