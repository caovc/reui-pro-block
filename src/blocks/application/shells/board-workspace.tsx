import { SidebarTrigger } from "@/components/ui/sidebar";
import { ReuiSidebar, SidebarRailButton } from "@/components/reui/sidebar";
import { AppShellInset } from "@/components/reui/layout";
import { useEffect, useState } from "react";
import {
  Archive,
  Bell,
  CircleHelp,
  Copy,
  Download,
  Ellipsis,
  Folder,
  History,
  Layers,
  LayoutTemplate,
  LayoutDashboard,
  MessageSquare,
  Activity,
  List,
  LogOut,
  Settings,
  Share2,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  UserRound,
  UserRoundPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Face,
  ReuiMark,
  toast,
} from "./chrome";
import type { ShellIcon } from "./chrome";
import WorkspaceSkeleton from "./workspace-skeleton";
import WorkspaceBreadcrumb from "./workspace-breadcrumb";
import "./board-workspace.css";

const sections: { name: string; icon: ShellIcon }[][] = [
  [
    { name: "Boards", icon: Layers },
    { name: "Templates", icon: LayoutTemplate },
    { name: "Recent", icon: History },
    { name: "Starred", icon: Star },
    { name: "Shared", icon: Users },
  ],
  [
    { name: "Projects", icon: Folder },
    { name: "Teams", icon: UsersRound },
    { name: "Tags", icon: Tag },
    { name: "Archive", icon: Archive },
    { name: "Trash", icon: Trash2 },
  ],
];
const views = ["Board", "Outline", "Comments", "Activity"];
function BoardProfile({
  theme,
  chooseTheme,
}: {
  theme: string;
  chooseTheme: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Open profile for Sienna Wells">
          <Face name="Sienna Wells" index={4} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="reui-reference w-56">
        <DropdownMenuLabel>
          Sienna Wells
          <small className="block text-muted-foreground">sienna@nimbusfleet.io</small>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {[
            { name: "Profile", icon: UserRound },
            { name: "Sign-In Security", icon: ShieldCheck },
            { name: "Alert Routing", icon: Bell },
            { name: "Preferences", icon: Settings },
            { name: "Shift Roster", icon: Users },
            { name: "Invite Operator", icon: UserRoundPlus },
          ].map(({ name, icon: Icon }) => (
            <DropdownMenuItem key={name}>
              <Icon />
              {name}
              {name === "Profile" && <span className="ml-auto text-xs">⇧⌘P</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="reui-reference">
            <DropdownMenuRadioGroup value={theme} onValueChange={chooseTheme}>
              {["light", "dark", "system"].map((value) => (
                <DropdownMenuRadioItem value={value} key={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function BoardRail({
  theme,
  chooseTheme,
}: {
  theme: string;
  chooseTheme: (value: string) => void;
}) {
  function link(name: string, Icon: ShellIcon) {
    return (
      <SidebarRailButton key={name} label={name} active={name === "Boards"}>
        <Button
          asChild
          variant={name === "Boards" ? "default" : "ghost"}
          size="icon-sm"
          aria-label={name}
        >
          <a href="#" onClick={(e) => e.preventDefault()}>
            <Icon />
          </a>
        </Button>
      </SidebarRailButton>
    );
  }
  return (
    <>
      <a
        href="#"
        className="board-brand"
        aria-label="Bricklane"
        onClick={(e) => e.preventDefault()}
      >
        <ReuiMark />
      </a>
      <div className="board-rail-groups">
        {sections.map((group, i) => (
          <div key={i}>{group.map(({ name, icon }) => link(name, icon))}</div>
        ))}
      </div>
      <footer>
        {link("Help", CircleHelp)}
        <BoardProfile theme={theme} chooseTheme={chooseTheme} />
      </footer>
    </>
  );
}
export default function BoardWorkspace() {
  const [view, setView] = useState("Board");
  const [confirm, setConfirm] = useState(false);
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  function chooseTheme(value: string) {
    setTheme(value);
    document.documentElement.classList.toggle(
      "dark",
      value === "dark" ||
        (value === "system" && matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }
  useEffect(() => {
    if (theme !== "system") return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => document.documentElement.classList.toggle("dark", media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);
  const profile = { theme, chooseTheme };
  const exportBoard = () =>
    toast("Export started", {
      description: "The image lands in your downloads.",
    });
  return (
    <div className="shell-reference reui-reference board-shell" data-shell-variant="35">
      <ReuiSidebar
        width={49}
        collapsible="offcanvas"
        className="board-icon-rail"
        aria-label="Board navigation"
        mobileTitle="Navigation"
        mobileDescription="Sections, help and your account."
        mobileClassName="reui-reference board-mobile-rail"
      >
        <BoardRail {...profile} />
      </ReuiSidebar>
      <AppShellInset className="shell-content-frame">
        <header className="board-header">
          <div className="board-header-start">
            <a
              className="board-mobile-brand"
              href="#"
              aria-label="Bricklane"
              onClick={(e) => e.preventDefault()}
            >
              <ReuiMark />
            </a>
            <SidebarTrigger className="board-mobile-navigation" aria-label="Open navigation" />
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="board-mobile-views"
                  aria-label={`Board views: ${view}`}
                >
                  <List />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="reui-reference board-views-drawer">
                <DrawerHeader className="sr-only">
                  <DrawerTitle>Board Views</DrawerTitle>
                  <DrawerDescription>Switch what the board shows.</DrawerDescription>
                </DrawerHeader>
                <nav aria-label="Board views">
                  <ul>
                    {views.map((name, i) => {
                      const Icon = [LayoutDashboard, List, MessageSquare, Activity][i];
                      return (
                        <li key={name}>
                          <Button asChild variant="ghost">
                            <a
                              href="#"
                              aria-current={view === name ? "page" : undefined}
                              onClick={(e) => {
                                e.preventDefault();
                                setView(name);
                              }}
                            >
                              <Icon />
                              {name}
                            </a>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </DrawerContent>
            </Drawer>
            <WorkspaceBreadcrumb items={["Boards", "Launch Map"]} />
          </div>
          <Tabs value={view} onValueChange={setView} className="board-desktop-views">
            <TabsList aria-label="Board views">
              {views.map((name) => (
                <TabsTrigger value={name} key={name}>
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="board-header-actions">
            <div className="board-collaborators" aria-label="3 people editing now">
              {[1, 3, 4].map((i) => (
                <Face key={i} index={i} />
              ))}
            </div>
            <Button
              size="sm"
              aria-label="Share"
              onClick={() =>
                toast("Board shared", {
                  description: "Your team got the invite link.",
                })
              }
            >
              <Share2 />
              <span>Share</span>
            </Button>
            <Button size="sm" variant="outline" aria-label="Export" onClick={exportBoard}>
              <Download />
              <span>Export</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Board menu">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="reui-reference w-48">
                <DropdownMenuLabel>Board</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() =>
                      toast("Board duplicated", {
                        description: "Launch Map copy is in Boards.",
                      })
                    }
                  >
                    <Copy />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={exportBoard}>
                    <Download />
                    Export as Image
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
                  <Trash2 />
                  Delete Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <WorkspaceSkeleton spacing={24} />
      </AppShellInset>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="reui-reference">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board?</AlertDialogTitle>
            <AlertDialogDescription>
              Launch Map and its history leave the workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                toast("Board deleted", {
                  description: "Launch Map left the workspace.",
                  action: {
                    label: "Undo",
                    onClick: () =>
                      toast("Board restored", {
                        description: "Launch Map is back in Boards.",
                      }),
                  },
                })
              }
            >
              Delete Board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
