import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  Check,
  CircleHelp,
  Clock,
  Ellipsis,
  Folder,
  LogOut,
  Monitor,
  Moon,
  Pin,
  Plus,
  SlidersHorizontal,
  Star,
  Sun,
  User,
  CreditCard,
  MessageSquare,
  Building2,
  PanelLeft,
  Menu,
  ChevronUp,
} from "lucide-react";
import { AppShellLayout, AppShellInset } from "@/components/reui/layout";
import { ReuiSidebar, SidebarCollection, SidebarNavigation } from "@/components/reui/sidebar";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { SearchPalette } from "@/blocks/application/shells/chrome";
import { BrandMark } from "@/components/brand-mark";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import { CreateDialog } from "./shared";
import { EchoChatActions } from "./echo-chat-actions";
import type { EchoChat, EchoChatHistory } from "./echo-chat-data";
import type { EchoSettingsModel, EchoSettingsSection } from "./echo-settings-data";
import "@/blocks/reference.css";
import "./echo-layout.css";

export { AppShellInset as EchoInset };
export function EchoLayout({ children }: { children: ReactNode }) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
export type EchoSidebarProps = {
  view: string;
  group: string;
  onGroupChange: (value: string) => void;
  onNavigate: (value: string) => void;
  onChat: (title: string) => void;
  onNew: () => void;
  recent: string[];
  projects: number;
  scheduled: number;
  settings: EchoSettingsModel;
  artifacts: ReactNode;
  history: EchoChatHistory;
  onRename: (id: string, title: string) => boolean;
  onSchedule: (chat: EchoChat) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
};
function ChatSearch({ recent, onChat }: Pick<EchoSidebarProps, "recent" | "onChat">) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SearchPalette
      iconOnly
      label="Search chats"
      routes={recent}
      onSelect={(title) => {
        onChat(title);
        if (isMobile) setOpenMobile(false);
      }}
    />
  );
}
export function EchoMobileHeader({
  recent,
  onChat,
  onNew,
}: Pick<EchoSidebarProps, "recent" | "onChat" | "onNew">) {
  const { isMobile, openMobile } = useSidebar();
  if (!isMobile) return null;
  return (
    <header className="echo-mobile-header">
      <SidebarTrigger aria-label="Open chats">
        <Menu aria-hidden="true" />
      </SidebarTrigger>
      <button
        className="echo-brand-link"
        onClick={onNew}
        aria-label="Bricklane Chat, go to conversations"
      >
        <BrandMark />
        <strong>Bricklane Chat</strong>
      </button>
      {!openMobile && <ChatSearch recent={recent} onChat={onChat} />}
      <Button variant="ghost" size="icon-sm" aria-label="New chat" onClick={onNew}>
        <Plus />
      </Button>
    </header>
  );
}
export function EchoSidebar(props: EchoSidebarProps) {
  const {
    view,
    group,
    onGroupChange,
    onNavigate,
    onChat,
    onNew,
    recent,
    projects,
    scheduled,
    settings,
    artifacts,
    history,
    onRename,
    onSchedule,
    onArchive,
    onDelete,
  } = props;
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const { theme } = useGlobalTheme();
  const { setSection: setSettingsSection, setSignedOut } = settings;
  const [organization, setOrganization] = useState("Atlas");
  const [organizations, setOrganizations] = useState(["Atlas", "Relay", "Orbit"]);
  const [createOrganization, setCreateOrganization] = useState(false);
  function navigate(value: string) {
    onNavigate(value);
    if (isMobile) setOpenMobile(false);
  }
  function section(value: EchoSettingsSection) {
    settings.setSection(value);
    navigate("Settings");
  }
  function chat(title: string) {
    onChat(title);
    if (isMobile) setOpenMobile(false);
  }
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return;
      if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        setSettingsSection("My Profile");
        onNavigate("Settings");
        if (isMobile) setOpenMobile(false);
      }
      if (event.key.toLowerCase() === "q") {
        event.preventDefault();
        setSignedOut(true);
        if (isMobile) setOpenMobile(false);
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [setSettingsSection, setSignedOut, onNavigate, isMobile, setOpenMobile]);
  const account = (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="echo-account-trigger"
              aria-label="Account menu"
              tooltip="Account menu"
            >
              <Avatar className="size-8">
                <AvatarImage src={String(settings.saved.avatar || "")} alt="" />
                <AvatarFallback>{String(settings.saved.name).slice(0, 2)}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <span className="echo-account-label">
                    <strong>{String(settings.saved.name)}</strong>
                    <small>
                      <span />
                      {organization} · Max
                    </small>
                  </span>
                  <Ellipsis className="ml-auto size-4 text-muted-foreground" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
            align="start"
            className="reui-reference echo-account-menu min-w-60"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {organizations.map((name, index) => (
                <DropdownMenuItem key={name} onSelect={() => setOrganization(name)}>
                  <span className={`echo-organization-mark echo-org-${index % 3}`}>
                    <Building2 />
                  </span>
                  <span className="flex-1">{name}</span>
                  {name === organization && <Check />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onSelect={() => setCreateOrganization(true)}>
                <Plus />
                New Organization
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => section("My Profile")}>
                <User />
                Profile<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => section("Billing")}>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => section("General")}>
                <SlidersHorizontal />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="reui-reference">
                  <DropdownMenuRadioGroup
                    value={theme.mode === "inherit" ? "system" : theme.mode}
                    onValueChange={(value) =>
                      setGlobalTheme({ ...theme, mode: value as typeof theme.mode })
                    }
                  >
                    {[
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "system", label: "System", icon: Monitor },
                    ].map(({ id, label, icon: Icon }) => (
                      <DropdownMenuRadioItem key={id} value={id}>
                        <Icon />
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                settings.setSignedOut(true);
                if (isMobile) setOpenMobile(false);
              }}
            >
              <LogOut />
              Sign Out<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
  return (
    <>
      <ReuiSidebar
        width={249}
        gapWidth={249}
        style={{ "--sidebar-width-icon": "49px" } as React.CSSProperties}
        className="echo-native-sidebar"
        mobileClassName="reui-reference echo-native-sidebar echo-sidebar-mobile"
        mobileWidth="75vw"
        mobileTitle="Chats"
        mobileDescription="Switch between your conversations."
        mobileShowCloseButton={false}
        header={
          <>
            <div className="echo-sidebar-brand">
              {!collapsed && (
                <button
                  className="echo-brand-link"
                  onClick={() => {
                    onNew();
                    if (isMobile) setOpenMobile(false);
                  }}
                  aria-label="Bricklane Chat, go to conversations"
                >
                  <BrandMark />
                  <strong>Bricklane Chat</strong>
                </button>
              )}
              {!collapsed && <ChatSearch recent={recent} onChat={onChat} />}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close chats"
                  onClick={() => setOpenMobile(false)}
                >
                  <PanelLeft />
                </Button>
              )}
              {!isMobile && (
                <SidebarTrigger aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} />
              )}
            </div>
            {!collapsed && (
              <Tabs value={group} onValueChange={onGroupChange} className="echo-sidebar-tabs">
                <TabsList aria-label="Conversation content">
                  <TabsTrigger value="Chats">Chats</TabsTrigger>
                  <TabsTrigger value="Artifacts">Artifacts</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </>
        }
        footer={
          <div className="echo-native-footer">
            <SidebarNavigation
              items={[
                { label: "Docs", icon: <BookOpen /> },
                { label: "What is new", icon: <Star /> },
                { label: "Help", icon: <CircleHelp /> },
              ]}
              active={view}
              onSelect={(value) =>
                navigate(value === "Help" || value === "Docs" ? "Documentation" : value)
              }
            />
            {account}
          </div>
        }
      >
        <div className="echo-native-nav">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="New Chat"
                isActive={view === "New chat" && group === "Chats"}
                aria-label="New Chat"
                onClick={() => {
                  onNew();
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <Plus />
                {!collapsed && <span>New Chat</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {collapsed && <ChatSearch recent={recent} onChat={onChat} />}
          <SidebarNavigation
            items={[
              { label: "Projects", icon: <Folder />, badge: String(projects) },
              { label: "Scheduled", icon: <Clock />, badge: String(scheduled) },
              { label: "Settings", icon: <SlidersHorizontal /> },
            ]}
            active={view}
            onSelect={navigate}
          />
        </div>
        {collapsed ? (
          <div className="echo-history-menus">
            {[
              {
                label: "Pinned",
                titles: history.records
                  .filter((chat) => chat.pinned && !chat.archived)
                  .map((chat) => chat.title),
                icon: Pin,
              },
              {
                label: "Recent",
                titles: history.records
                  .filter((chat) => !chat.pinned && !chat.archived)
                  .map((chat) => chat.title),
                icon: MessageSquare,
              },
            ].map(({ label, titles, icon: Icon }) => (
              <SidebarMenu key={label}>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton tooltip={label} aria-label={label}>
                        <Icon />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="right"
                      align="start"
                      className="reui-reference echo-history-popup w-64 min-w-64"
                    >
                      <DropdownMenuLabel>{label}</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        {titles.map((title) => (
                          <DropdownMenuItem key={title} onSelect={() => chat(title)}>
                            <span className="truncate">{title}</span>
                            <small className="ml-auto text-muted-foreground">
                              {history.records.find((chat) => chat.title === title)?.changed}
                            </small>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            ))}
          </div>
        ) : group === "Chats" ? (
          <div className="echo-native-history">
            {["Pinned", "Today", "Yesterday", "Older"].map((label) => {
              const records = history.records.filter(
                (chat) =>
                  !chat.archived &&
                  (label === "Pinned" ? chat.pinned : !chat.pinned && chat.period === label),
              );
              return (
                <SidebarCollection
                  key={label}
                  label={label}
                  headerTrailing={
                    <>
                      <span aria-hidden="true" className="text-xs text-muted-foreground">
                        {records.length}
                      </span>
                      <ChevronUp
                        aria-hidden="true"
                        className="group-data-[state=closed]/sidebar-collection-trigger:rotate-180"
                      />
                    </>
                  }
                  rows={records.map((chat) => ({
                    label: chat.title,
                    icon: null,
                    actions: (
                      <EchoChatActions
                        chat={chat}
                        history={history}
                        onRename={onRename}
                        onSchedule={onSchedule}
                        onArchive={onArchive}
                        onDelete={onDelete}
                      />
                    ),
                  }))}
                  onSelect={chat}
                />
              );
            })}
          </div>
        ) : (
          artifacts
        )}
      </ReuiSidebar>
      <CreateDialog
        title="New organization"
        open={createOrganization}
        onClose={() => setCreateOrganization(false)}
        onCreate={(name) => {
          setOrganizations((current) => [...current, name]);
          setOrganization(name);
          setCreateOrganization(false);
        }}
      />
    </>
  );
}
