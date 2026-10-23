import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ReuiSidebar, SidebarRailButton } from "@/components/reui/sidebar";
import { AppShellInset } from "@/components/reui/layout";
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Activity,
  Bell,
  BookOpen,
  Bot,
  ChevronDown,
  CircleHelp,
  ListChecks,
  ArrowRightLeft,
  Ellipsis,
  Wallet,
  LayoutDashboard,
  LogOut,
  Moon,
  Radio,
  Route,
  Settings,
  ShieldAlert,
  Sun,
  Monitor,
  UserRound,
  Store,
} from "lucide-react";
import { BrandGlyph } from "@/components/brand-mark";
import { IconTile } from "@/components/reui/icon-tile";
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from "./chrome";
import type { ShellIcon } from "./chrome";
import hero from "./assets/fleet-living-room.png";
import "./fleet-hero.css";

const railSections: { name: string; icon: ShellIcon }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Robots", icon: Bot },
  { name: "Routes", icon: Route },
  { name: "Stations", icon: Radio },
  { name: "Incidents", icon: ShieldAlert },
  { name: "Tasks", icon: ListChecks },
  { name: "Depots", icon: Store },
  { name: "Billing", icon: Wallet },
  { name: "Runbooks", icon: BookOpen },
];
const navSections = ["Overview", "Missions", "Stations", "Requests", "Maintenance"];
const slides = [hero];
function HeroScenes() {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1280);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const columns = Math.ceil(width / 12);
  return (
    <div ref={ref} className="fleet-hero-scenes" aria-hidden="true">
      <svg width="0" height="0">
        <defs>
          <mask id={`fleet-mask-${id}`} maskContentUnits="objectBoundingBox">
            <rect width="1" height="0.83" fill="white" />
            {Array.from({ length: 6 }, (_, row) =>
              Array.from({ length: columns }, (_, col) =>
                (col * 37 + row * 71) % 101 > row * 16.5 ? (
                  <rect
                    key={`${row}-${col}`}
                    x={col / columns}
                    y={0.83 + row * (0.17 / 6)}
                    width={1 / columns + 0.0001}
                    height=".0285"
                    fill="white"
                  />
                ) : null,
              ),
            )}
          </mask>
        </defs>
      </svg>
      <div
        className="fleet-hero-images"
        style={{ maskImage: `url(#fleet-mask-${id})`, WebkitMaskImage: `url(#fleet-mask-${id})` }}
      >
        {slides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            data-hero-slide={i}
            data-last={i === 5 || undefined}
            className={i > 0 ? "fleet-hero-slide" : ""}
            style={{ "--fleet-slide-delay": `${(i - 1) * 5}s` } as CSSProperties}
          />
        ))}
      </div>
      <div className="fleet-hero-grid" />
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          className="fleet-hero-spark"
          style={
            {
              left: `${(i * 37) % 100}%`,
              top: `${45 + ((i * 19) % 42)}%`,
              "--fleet-spark-delay": `${-(i % 9)}s`,
              "--fleet-spark-duration": `${5 + (i % 5)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
function FleetPlaceholders() {
  return (
    <div className="fleet-hero-cards" aria-label="Fleet workspace content placeholders">
      <section className="fleet-hero-summary-grid">
        {[0, 1, 2, 3].map((i) => (
          <Frame key={i} variant="ghost" className="fleet-hero-summary">
            <FramePanel>
              <div>
                <Skeleton className="fleet-summary-icon" />
                <Skeleton className="fleet-summary-title" />
                <Skeleton className="fleet-summary-action" />
              </div>
            </FramePanel>
            <FrameFooter>
              <div>
                {[0, 1, 2].map((j) => (
                  <Skeleton key={j} />
                ))}
              </div>
              <Skeleton />
            </FrameFooter>
          </Frame>
        ))}
      </section>
      <section className="fleet-hero-body-grid">
        {[0, 1].map((i) => (
          <Frame key={i} variant="ghost">
            <FramePanel>
              <Skeleton />
              <Skeleton />
              <Skeleton className="fleet-hero-body-placeholder" />
            </FramePanel>
          </Frame>
        ))}
      </section>
    </div>
  );
}
function FleetAccount({
  theme,
  chooseTheme,
}: {
  theme: string;
  chooseTheme: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Evil Rabbit account">
          <Avatar>
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="end"
        className="reui-reference fleet-glass-menu fleet-account-popup"
      >
        <DropdownMenuLabel>
          <Avatar>
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
          <span>
            Evil Rabbit<small>Fleet Operations Lead</small>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {[
            { name: "Profile", icon: UserRound, shortcut: "⇧⌘P" },
            { name: "Shift Handover", icon: ArrowRightLeft },
            { name: "Preferences", icon: Settings, shortcut: "⌘," },
            { name: "Help & Support", icon: CircleHelp },
            { name: "API Reference", icon: BookOpen },
          ].map(({ name, icon: Icon, shortcut }) => (
            <DropdownMenuItem key={name}>
              <Icon />
              {name}
              {shortcut && <span className="ml-auto text-xs">{shortcut}</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="fleet-account-theme">
          <span>
            <Sun />
            Theme
          </span>
          <ToggleGroup
            type="single"
            value={theme}
            onValueChange={(value) => value && chooseTheme(value)}
            aria-label="Theme"
          >
            {[
              { name: "Light", value: "light", icon: Sun },
              { name: "Dark", value: "dark", icon: Moon },
              { name: "System", value: "system", icon: Monitor },
            ].map(({ name, value, icon: Icon }) => (
              <ToggleGroupItem key={value} value={value} aria-label={name}>
                <Icon />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          Sign Out<span className="ml-auto text-xs">⇧⌘Q</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function FleetRail({
  active,
  onChange,
  theme,
  chooseTheme,
}: {
  active: string;
  onChange: (name: string) => void;
  theme: string;
  chooseTheme: (value: string) => void;
}) {
  function control(name: string, Icon: ShellIcon) {
    const button = (
      <Button
        variant="ghost"
        size="icon"
        aria-label={name}
        aria-current={active === name ? "true" : undefined}
        onClick={name === "Robots" ? undefined : () => onChange(name)}
      >
        <Icon />
      </Button>
    );
    return name === "Robots" ? (
      <DropdownMenu key={name}>
        <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="reui-reference fleet-glass-menu">
          <DropdownMenuGroup>
            {railSections.map(({ name, icon: Glyph }) => (
              <DropdownMenuItem key={name} onSelect={() => onChange(name)}>
                <Glyph />
                {name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <SidebarRailButton key={name} label={name} active={active === name}>
        {button}
      </SidebarRailButton>
    );
  }
  return (
    <>
      <a
        href="#"
        className="fleet-hero-brand"
        aria-label="Bricklane"
        onClick={(e) => e.preventDefault()}
      >
        <BrandGlyph />
      </a>
      <div className="fleet-rail-primary">
        {railSections.slice(0, 6).map(({ name, icon }) => control(name, icon))}
      </div>
      <div className="fleet-rail-secondary">
        {railSections.slice(6).map(({ name, icon }) => control(name, icon))}
      </div>
      <div className="fleet-rail-utility">
        {[
          { name: "Notifications", icon: Bell },
          { name: "Settings", icon: Settings },
          { name: "Sign Out", icon: LogOut },
        ].map(({ name, icon: Icon }) => (
          <SidebarRailButton key={name} label={name}>
            <Button variant="ghost" size="icon" aria-label={name}>
              <Icon />
            </Button>
          </SidebarRailButton>
        ))}
      </div>
      <div className="fleet-rail-account">
        <FleetAccount theme={theme} chooseTheme={chooseTheme} />
      </div>
    </>
  );
}
function AccessNotice() {
  const id = useId();
  useEffect(() => {
    toast.custom(
      (t) => (
        <div
          className="fleet-access-notice reui-reference"
          role="status"
          aria-label="Fleet access request"
        >
          <IconTile variant="outline" size="sm" className="fleet-access-icon">
            <Activity />
          </IconTile>
          <div>
            <div>
              <strong>Access request</strong>
              <small>2m ago</small>
            </div>
            <p>R1-06 wants to connect to the control room.</p>
            <div>
              <Button variant="outline" size="sm" onClick={() => toast.dismiss(t)}>
                Dismiss
              </Button>
              <Button size="sm" onClick={() => toast.dismiss(t)}>
                Allow
              </Button>
            </div>
          </div>
        </div>
      ),
      { id, duration: Infinity, position: "top-right", className: "fleet-access-toast" },
    );
    return () => {
      toast.dismiss(id);
    };
  }, [id]);
  return null;
}
export default function FleetHeroShell() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mobileSections = useRef<HTMLButtonElement>(null);
  const desktopSections = useRef<HTMLButtonElement>(null);
  const menuScroll = useRef(0);
  const onSectionMenuOpen = (open: boolean) => {
    if (open) menuScroll.current = rootRef.current?.scrollTop ?? 0;
  };
  const restoreSectionFocus = (event: Event) => {
    event.preventDefault();
    const trigger = window.innerWidth < 1024 ? mobileSections.current : desktopSections.current;
    trigger?.focus({ preventScroll: true });
    rootRef.current?.scrollTo({ top: menuScroll.current });
  };
  const [rail, setRail] = useState("Overview");

  const [nav, setNav] = useState("Overview");
  const [theme, setTheme] = useState("system");
  const [themeTouched, setThemeTouched] = useState(false);
  function chooseTheme(value: string) {
    setTheme(value);
    setThemeTouched(true);
    document.documentElement.classList.toggle(
      "dark",
      value === "dark" ||
        (value === "system" && matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }
  useEffect(() => {
    if (!themeTouched || theme !== "system") return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const handler = () => document.documentElement.classList.toggle("dark", media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme, themeTouched]);
  const { isMobile, setOpenMobile } = useSidebar();
  const railProps = {
    active: rail,
    onChange: (name: string) => {
      setRail(name);
      if (isMobile) setOpenMobile(false);
    },
    theme,
    chooseTheme,
  };
  const sectionsMenu = (
    <DropdownMenuContent
      onCloseAutoFocus={restoreSectionFocus}
      align="end"
      className="reui-reference fleet-glass-menu"
    >
      <DropdownMenuGroup>
        {navSections.map((name) => (
          <DropdownMenuItem key={name} onSelect={() => setNav(name)}>
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
  return (
    <div
      ref={rootRef}
      className="shell-reference reui-reference fleet-photo-shell"
      data-shell-variant="22"
    >
      <HeroScenes />
      <ReuiSidebar
        width={60}
        collapsible="offcanvas"
        className="fleet-photo-rail"
        aria-label="Fleet navigation"
        mobileTitle="Workspace"
        mobileDescription="Fleet control sections."
        mobileClassName="reui-reference fleet-photo-drawer"
      >
        <FleetRail {...railProps} />
      </ReuiSidebar>
      <AppShellInset className="fleet-photo-content" aria-label="Fleet control overview">
        <h1 className="sr-only">Fleet control overview</h1>
        <header className="fleet-photo-mobile-header">
          <a
            href="#"
            className="fleet-hero-brand"
            aria-label="Bricklane"
            onClick={(e) => e.preventDefault()}
          >
            <BrandGlyph />
          </a>
          <span />
          <SidebarTrigger aria-label="Open workspace navigation" />
          <DropdownMenu onOpenChange={onSectionMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                ref={mobileSections}
                variant="ghost"
                size="icon"
                aria-label="Open sections menu"
              >
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            {sectionsMenu}
          </DropdownMenu>
        </header>
        <div className="fleet-photo-desktop-nav">
          <ToggleGroup
            type="single"
            value={nav}
            onValueChange={(value) => value && setNav(value)}
            aria-label="Fleet sections"
          >
            {navSections.map((name) => (
              <ToggleGroupItem value={name} key={name}>
                {name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <DropdownMenu onOpenChange={onSectionMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button ref={desktopSections} variant="ghost" size="icon" aria-label="More sections">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            {sectionsMenu}
          </DropdownMenu>
        </div>
        <FleetPlaceholders />
      </AppShellInset>
      <AccessNotice />
    </div>
  );
}
