import { useRef } from "react";
import { Copy, Download, Ellipsis, Home, PanelRight, Settings, Share2 } from "lucide-react";
import { Avatar, AvatarGroup, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { CalendarContext } from "@/blocks/application/shells/calendar-panel";
import { demoAvatar } from "@/lib/demo-artwork";
import { toast } from "sonner";
import { Logo } from "./workflow-shell";
import { TempoNotifications } from "./tempo-notifications";
import type { NotificationsFeedModel } from "@/blocks/application/navbar-variants/toolbars/notifications";
import "./tempo-chrome.css";
import "./tempo-context-panel.css";

export function TempoSidebarHeader({
  notificationsModel,
}: {
  notificationsModel: NotificationsFeedModel;
}) {
  const { isMobile, state } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  return (
    <div className="tempo-sidebar-heading" data-collapsed={collapsed}>
      <div className="wf-brand">
        <Logo />
        {!collapsed && <strong>Bricklane</strong>}
      </div>
      <TempoNotifications model={notificationsModel} />
    </div>
  );
}

export function TempoHeader({
  view,
  contextOpen,
  onToggleContext,
  onOpenSettings,
  onExport,
}: {
  view: string;
  contextOpen: boolean;
  onToggleContext: () => void;
  onOpenSettings: (trigger?: HTMLElement | null) => void;
  onExport: () => void;
}) {
  const { isMobile } = useSidebar();
  const moreTrigger = useRef<HTMLButtonElement>(null);
  const openingSettings = useRef(false);
  const panelOpen = contextOpen && !isMobile;

  async function copyPageLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied", { description: "The local preview link is ready to share." });
    } catch {
      toast.error("Link could not be copied", {
        description: "Copy the page address from your browser.",
      });
    }
  }

  return (
    <header className="wf-header tempo-header">
      <SidebarTrigger className="wf-mobile-menu" aria-label="Open navigation" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="inline-flex items-center gap-1.5">
              <Home className="size-4" aria-hidden="true" />
              {view}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div role="toolbar" aria-label="Header actions" className="tempo-header-actions">
        <AvatarGroup aria-label="Workspace members">
          {["Nick Johnson", "Alex Johnson", "Sarah Chen"].map((name) => (
            <Avatar key={name} size="sm">
              <AvatarImage
                src={demoAvatar(name)}
                alt={name === "Alex Johnson" ? "Alex Johnson (away)" : name}
              />
              <AvatarFallback>
                {name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        <Separator orientation="vertical" className="h-4" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button ref={moreTrigger} variant="ghost" size="icon-sm" aria-label="More options" />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="reui-reference tempo-header-more w-48"
            sideOffset={4}
            onCloseAutoFocus={(event) => {
              if (openingSettings.current) {
                event.preventDefault();
                openingSettings.current = false;
              }
            }}
          >
            <DropdownMenuItem
              onSelect={() => {
                void copyPageLink();
              }}
            >
              <Copy />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toast.success("Schedule shared", {
                  description: "A view-only schedule link is ready to share.",
                })
              }
            >
              <Share2 />
              Share schedule
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExport}>
              <Download />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                openingSettings.current = true;
                onOpenSettings(moreTrigger.current);
              }}
            >
              <Settings />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={panelOpen ? "Close context panel" : "Open context panel"}
          aria-expanded={panelOpen}
          aria-controls="tempo-context-panel"
          onClick={() => {
            if (!isMobile) onToggleContext();
          }}
        >
          <PanelRight />
        </Button>
      </div>
    </header>
  );
}

export function TempoContextPanel({ open, onShowAll }: { open: boolean; onShowAll: () => void }) {
  const { isMobile } = useSidebar();
  const visible = open && !isMobile;
  return (
    <aside
      id="tempo-context-panel"
      role="complementary"
      aria-label="Context panel"
      aria-hidden={!visible}
      inert={!visible}
      className="tempo-context-panel"
      data-open={visible}
    >
      <CalendarContext variant="tempo" month={10} day={4} onShowAll={onShowAll} />
    </aside>
  );
}
