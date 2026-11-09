import { useState, type MouseEvent, type ReactNode } from "react";
import {
  ChevronDown,
  Check,
  Ellipsis,
  LogOut,
  Monitor,
  Moon,
  Palette,
  PanelLeft,
  Plus,
  SlidersHorizontal,
  Sun,
  UserRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Progress } from "../workflow/free/flowly-progress";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import { toast } from "sonner";

export function CohortSidebarHeader({
  brand,
  notifications,
  pageHref,
  onDashboard,
}: {
  brand: string;
  notifications: ReactNode;
  pageHref: (page: string) => string;
  onDashboard: () => void;
}) {
  const { isMobile, state, openMobile, toggleSidebar } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  return (
    <div className="cohort-sidebar-brand">
      <a
        className="cohort-brand-link"
        href={pageHref("Dashboard")}
        aria-label={`${brand}, go to the dashboard`}
        onClick={(event) => {
          if (isModifiedClick(event)) return;
          event.preventDefault();
          onDashboard();
        }}
      >
        <BrandMark />
        {!collapsed && <span>{brand}</span>}
      </a>
      {notifications}
      {isMobile ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="cohort-sidebar-toggle"
          aria-label="Toggle Sidebar"
          aria-expanded={openMobile}
          onClick={toggleSidebar}
        >
          <PanelLeft aria-hidden="true" />
        </Button>
      ) : (
        <SidebarTrigger
          className="cohort-sidebar-toggle"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        />
      )}
    </div>
  );
}

/** Actual free Frame plus the declared Base c-progress-2 implementation. */
export function CohortHeadcountPlan() {
  return (
    <Frame dense spacing="xs" className="cohort-headcount-plan">
      <FrameHeader>
        <FrameTitle>Headcount plan</FrameTitle>
      </FrameHeader>
      <FramePanel fit>
        <p>Approved headcount for FY26. Resets when the plan is re-baselined.</p>
        <Progress value={92} aria-label="Headcount plan" className="cohort-headcount-progress" />
        <div className="cohort-headcount-totals">
          <span>
            <strong>92%</strong> Filled
          </span>
          <span>
            <strong>8%</strong> Open
          </span>
        </div>
      </FramePanel>
    </Frame>
  );
}

export function CohortAccountControl({
  name,
  organisation,
  photo,
  pageHref,
  onNavigate,
  showTooltips = true,
}: {
  name: string;
  organisation: string;
  photo?: string;
  pageHref: (page: string) => string;
  onNavigate: (page: string) => void;
  showTooltips?: boolean;
}) {
  const { state, isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const collapsed = !isMobile && state === "collapsed";
  const { theme } = useGlobalTheme();
  const mode = theme.mode === "inherit" ? "system" : theme.mode;
  const activeTheme = mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System";
  const nextTheme = mode === "system" ? "Light" : mode === "light" ? "Dark" : "System";
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="cohort-account-trigger"
                aria-label={`Open account menu for ${name}`}
                tooltip={showTooltips ? name : undefined}
              />
            }
          >
            <Avatar className="cohort-account-avatar">
              <AvatarImage src={photo} alt="" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <span className="cohort-account-copy">
                  <strong>{name}</strong>
                  <small>
                    <i aria-hidden="true" />
                    {organisation}
                  </small>
                </span>
                <Ellipsis className="ml-auto size-3.5 text-muted-foreground" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
            align="end"
            className="reui-reference cohort-account-menu"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {[organisation, "Cohort EU", "Cohort APAC"].map((label, index) => (
                <DropdownMenuItem
                  key={`${index}-${label}`}
                  onSelect={() =>
                    toast("Organization switching is unavailable in this local preview.")
                  }
                >
                  <span
                    className={`cohort-organisation-mark cohort-organisation-${index}`}
                    aria-hidden="true"
                  >
                    {["UK", "EU", "AP"][index]}
                  </span>
                  <span className="flex-1">{label}</span>
                  {index === 0 && <Check className="size-3.5" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onSelect={() =>
                  toast("Organization creation is unavailable in this local preview.")
                }
              >
                <Plus />
                New Organization
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem
                render={
                  <a
                    href={pageHref("Profile")}
                    onClick={(event) => {
                      if (isModifiedClick(event)) return;
                      event.preventDefault();
                      onNavigate("Profile");
                      setOpen(false);
                    }}
                  />
                }
              >
                <UserRound />
                Profile<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <a
                    href={pageHref("Preferences")}
                    onClick={(event) => {
                      if (isModifiedClick(event)) return;
                      event.preventDefault();
                      onNavigate("Preferences");
                      setOpen(false);
                    }}
                  />
                }
              >
                <SlidersHorizontal />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cohort-account-theme"
                aria-label={`Theme ${activeTheme} active, activate to switch to ${nextTheme}`}
                onSelect={(event) => {
                  event.preventDefault();
                  setGlobalTheme({
                    ...theme,
                    mode: nextTheme.toLowerCase() as "light" | "dark" | "system",
                  });
                }}
              >
                <Palette />
                Theme
                <span className="cohort-theme-options" aria-hidden="true">
                  {[
                    { mode: "light", icon: Sun },
                    { mode: "dark", icon: Moon },
                    { mode: "system", icon: Monitor },
                  ].map(({ mode: value, icon: Icon }) => (
                    <span key={value} data-active={mode === value ? "true" : undefined}>
                      <Icon />
                    </span>
                  ))}
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => toast("This local preview has no connected sign-in session.")}
            >
              <LogOut />
              Sign Out<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/** The collection adapter intercepts anchors; this free composition retains native links. */
export function CohortDepartments({
  pageHref,
}: {
  pageHref: (page: string, department?: string) => string;
}) {
  return (
    <Collapsible defaultOpen className="cohort-departments">
      <SidebarGroup>
        <SidebarGroupLabel render={<CollapsibleTrigger aria-label="Headcount by department" />}>
          <span className="flex-1 text-left">Headcount by department</span>
          <ChevronDown />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {["Engineering", "People", "Sales", "Customer Success", "Design"].map(
                (label, index) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton render={<a href={pageHref("People", label)} />}>
                      <span
                        className={`cohort-department-dot cohort-department-${index}`}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
