import { useEffect, useState, type MouseEvent } from "react";
import {
  Boxes,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Folder,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Sun,
  Tag,
  TicketPercent,
  UserRound,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useGlobalTheme } from "@/components/site/global-theme-store";
import type { AtlasAccountSection } from "./atlas-account-settings-data";
import { commitCommerceAccountThemeMode } from "./commerce-account-theme";

const navigationIcons = {
  Dashboard: LayoutDashboard,
  Orders: ShoppingBag,
  Products: Tag,
  Inventory: Boxes,
  Customers: Users,
  Categories: Folder,
  Promotions: TicketPercent,
  Reviews: Star,
  Analytics: ChartNoAxesCombined,
  Settings,
};

/** c-sidebar-1/3 primitives retain native anchors; the data wrapper has no href API. */
export function SurgeSidebarNavigation({
  items,
  groups = {},
  active,
  pageHref,
  onNavigate,
  showTooltips = true,
  side = "left",
}: {
  items: string[];
  groups?: Record<string, string[]>;
  active: string;
  pageHref: (page: string) => string;
  onNavigate: (page: string) => void;
  showTooltips?: boolean;
  side?: "left" | "right";
}) {
  const { state, isMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const activeParent = Object.keys(groups).find((label) => groups[label].includes(active));
  const [expanded, setExpanded] = useState<string[]>(() => (activeParent ? [activeParent] : []));
  useEffect(() => {
    if (activeParent) {
      setExpanded((current) =>
        current.includes(activeParent) ? current : [...current, activeParent],
      );
    }
  }, [activeParent]);
  function activate(event: MouseEvent<HTMLAnchorElement>, page: string) {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    onNavigate(page);
  }
  return (
    <div className="surge-native-navigation">
      {["Store", "System"].map((group) => (
        <SidebarGroup key={group}>
          {!collapsed && <SidebarGroupLabel>{group}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items
                .filter((label) =>
                  group === "System"
                    ? ["Analytics", "Settings"].includes(label)
                    : !["Analytics", "Settings"].includes(label),
                )
                .map((label) => {
                  const Icon = navigationIcons[label as keyof typeof navigationIcons] ?? Folder;
                  const children = groups[label];
                  const open = expanded.includes(label);
                  const button = (
                    <SidebarMenuButton
                      asChild={!children?.length}
                      aria-label={label}
                      tooltip={showTooltips ? label : undefined}
                      isActive={active === label || activeParent === label}
                    >
                      {children?.length ? (
                        <>
                          <Icon />
                          {!collapsed && <span className="flex-1">{label}</span>}
                          {!collapsed && (open ? <ChevronDown /> : <ChevronRight />)}
                        </>
                      ) : (
                        <a
                          href={pageHref(label)}
                          onClick={(event) => activate(event, label)}
                          aria-current={active === label ? "page" : undefined}
                        >
                          <Icon />
                          {!collapsed && <span>{label}</span>}
                        </a>
                      )}
                    </SidebarMenuButton>
                  );
                  if (children?.length && collapsed) {
                    return (
                      <SidebarMenuItem key={label}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={button as never}></DropdownMenuTrigger>
                          <DropdownMenuContent
                            side={side === "right" ? "left" : "right"}
                            align="start"
                            className="reui-reference surge-nav-popup"
                          >
                            <DropdownMenuLabel>{label}</DropdownMenuLabel>
                            <DropdownMenuGroup>
                              {children.map((child) => (
                                <DropdownMenuItem
                                  key={child}
                                  render={
                                    <a
                                      href={pageHref(child)}
                                      onClick={(event) => activate(event, child)}
                                    />
                                  }
                                >
                                  {child}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    );
                  }
                  return (
                    <Collapsible
                      key={label}
                      open={open}
                      onOpenChange={(value) =>
                        setExpanded((current) =>
                          value ? [...current, label] : current.filter((name) => name !== label),
                        )
                      }
                    >
                      <SidebarMenuItem>
                        {children?.length ? (
                          <CollapsibleTrigger render={button as never}></CollapsibleTrigger>
                        ) : (
                          button
                        )}
                        {children?.length ? (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {children.map((child) => (
                                <SidebarMenuSubItem key={child}>
                                  <SidebarMenuSubButton
                                    isActive={active === child}
                                    render={
                                      <a
                                        href={pageHref(child)}
                                        onClick={(event) => activate(event, child)}
                                        aria-current={active === child ? "page" : undefined}
                                      />
                                    }
                                  >
                                    {child}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        ) : null}
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  );
}

export function SurgeSidebarAccount({
  account,
  pageHref,
  onNavigate,
  onSignOut,
  showTooltips = true,
  side = "left",
}: {
  account: { name: string; organisation: string; photo?: string };
  pageHref: (page: string) => string;
  onNavigate: (section: AtlasAccountSection) => void;
  onSignOut: () => void;
  showTooltips?: boolean;
  side?: "left" | "right";
}) {
  const { state, isMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const { theme } = useGlobalTheme();
  const mode = theme.mode === "light" || theme.mode === "dark" ? theme.mode : "system";
  const [open, setOpen] = useState(false);
  const initials = account.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  const avatar = (className: string) => (
    <Avatar className={className}>
      <AvatarImage src={account.photo} alt="" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
  // Keep Tooltip outside the menu trigger so both native triggers reach the
  // same button, including the tooltip's accessible description on keyboard focus.
  const trigger = (
    <DropdownMenuTrigger
      render={
        <SidebarMenuButton
          size="lg"
          className="surge-account-trigger"
          aria-label={`Open account menu for ${account.name}`}
        />
      }
    >
      {avatar("surge-account-avatar")}
      {!collapsed && (
        <>
          <span className="surge-account-copy">
            <strong>{account.name}</strong>
            <small>{account.organisation}</small>
          </span>
          <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground" />
        </>
      )}
    </DropdownMenuTrigger>
  );
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          {collapsed && showTooltips ? (
            <Tooltip>
              <TooltipTrigger render={trigger as never}></TooltipTrigger>
              <TooltipContent side={side === "right" ? "left" : "right"} align="center">
                {account.name}
              </TooltipContent>
            </Tooltip>
          ) : (
            trigger
          )}
          <DropdownMenuContent
            side={collapsed ? (side === "right" ? "left" : "right") : "top"}
            align="end"
            className="reui-reference surge-account-menu"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="surge-account-summary">
                {avatar("surge-account-summary-avatar")}
                <span>
                  <strong>{account.name}</strong>
                  <small>{account.organisation}</small>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { label: "Profile", section: "profile", icon: UserRound },
                { label: "Preferences", section: "preferences", icon: Settings },
                { label: "Security", section: "security", icon: ShieldCheck },
              ].map(({ label, section, icon: Icon }) => (
                <DropdownMenuItem
                  key={section}
                  render={
                    <a
                      href={pageHref(label)}
                      onClick={(event) => {
                        if (isModifiedClick(event)) return;
                        event.preventDefault();
                        onNavigate(section as AtlasAccountSection);
                        setOpen(false);
                      }}
                    />
                  }
                >
                  <Icon aria-hidden="true" />
                  {label}
                  {section === "profile" && (
                    <DropdownMenuShortcut aria-hidden="true">⇧⌘P</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="surge-account-theme-row"
                onSelect={(event) => event.preventDefault()}
              >
                <Palette aria-hidden="true" />
                <span>Theme</span>
                <RadioGroup
                  aria-label="Theme"
                  value={mode}
                  className="surge-account-theme-choices"
                  onValueChange={(value) => {
                    if (value !== "light" && value !== "dark" && value !== "system") return;
                    commitCommerceAccountThemeMode(value, theme);
                    setOpen(false);
                  }}
                >
                  {[
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "system", label: "System", icon: Monitor },
                  ].map(({ value, label, icon: Icon }) => (
                    <Label key={value} className="surge-account-theme-option">
                      <RadioGroupItem
                        value={value}
                        aria-label={label}
                        className="surge-account-theme-radio"
                        onClick={() => setOpen(false)}
                      />
                      <Icon aria-hidden="true" />
                    </Label>
                  ))}
                </RadioGroup>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut}>
                <LogOut aria-hidden="true" />
                Sign Out<DropdownMenuShortcut aria-hidden="true">⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** The existing store menu supplies local destinations; no organisation service is added. */
export function SurgeBreadcrumb({
  storeName,
  page,
  href,
  onNavigate,
}: {
  storeName: string;
  page: string;
  href: (page: string) => string;
  onNavigate: (page: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const parent = page === "Reorder queue" ? "Inventory" : page === "Groups" ? "Customers" : null;
  return (
    <Breadcrumb className="surge-breadcrumb" data-dashboard={page === "Dashboard"}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="surge-store-switcher"
                  aria-label={`Open store menu for ${storeName}`}
                />
              }
            >
              <span className="surge-store-dot" aria-hidden="true" />
              <span className="surge-store-name">{storeName}</span>
              <ChevronsUpDown aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="reui-reference surge-store-menu" align="start">
              <DropdownMenuLabel>Store</DropdownMenuLabel>
              {["Products", "Inventory", "Orders"].map((target) => (
                <DropdownMenuItem
                  key={target}
                  render={
                    <a
                      href={href(target)}
                      onClick={(event) => {
                        if (isModifiedClick(event)) return;
                        event.preventDefault();
                        onNavigate(target);
                        setOpen(false);
                      }}
                    />
                  }
                >
                  {target}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        {parent && (
          <>
            <BreadcrumbSeparator className="surge-breadcrumb-divider">/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={href(parent)}
                onClick={(event) => {
                  if (isModifiedClick(event)) return;
                  event.preventDefault();
                  onNavigate(parent);
                }}
              >
                {parent}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        {page && (
          <>
            <BreadcrumbSeparator className="surge-breadcrumb-divider">/</BreadcrumbSeparator>
            <BreadcrumbItem className="surge-breadcrumb-current">
              <BreadcrumbPage>{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}
