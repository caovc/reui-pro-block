/**
 * ReUI free sidebar compositions, adapted to AppShell data (MIT).
 * c-sidebar-1: grouped workspace nav, count badges, per-row actions.
 * c-sidebar-2: icon rail, retained accessible names, conditional tooltips.
 * c-sidebar-3: Collapsible sections and SidebarMenuSub navigation.
 * https://reui.io/components/sidebar/c-sidebar-1
 * https://reui.io/components/sidebar/c-sidebar-2
 * https://reui.io/components/sidebar/c-sidebar-3
 */
import { useEffect, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ReuiSidebar({
  width = 248,
  gapWidth,
  role = "complementary",
  header,
  footer,
  children,
  className,
  ...props
}: ComponentProps<typeof Sidebar> & {
  width?: number;
  gapWidth?: number;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Sidebar
      collapsible="icon"
      role={role}
      {...props}
      className={cn("reui-sidebar-panel", className)}
      style={
        {
          "--sidebar-width": `${width}px`,
          "--sidebar-gap": `${gapWidth ?? width}px`,
          ...props.style,
        } as React.CSSProperties
      }
    >
      {header && <SidebarHeader>{header}</SidebarHeader>}
      <SidebarContent className="reui-sidebar-content">{children}</SidebarContent>
      {footer && <SidebarFooter>{footer}</SidebarFooter>}
    </Sidebar>
  );
}

export type SidebarNavigationItem = {
  label: string;
  icon?: ReactNode;
  children?: string[];
  badge?: string;
  dot?: boolean;
  disabled?: boolean;
  accent?: boolean;
};

/** c-sidebar-2's named icon button, also used by permanently compact rails. */
export function SidebarRailButton({
  label,
  children,
  active = false,
}: {
  label: string;
  children: React.ReactElement;
  active?: boolean;
}) {
  return (
    <SidebarMenuButton asChild isActive={active} tooltip={{ children: label, hidden: false }}>
      {children}
    </SidebarMenuButton>
  );
}

// Project/member sections retain c-sidebar-1's row/action separation and
// c-sidebar-3's accessible Collapsible label/content composition.
export function SidebarCollection({
  label,
  rows,
  onSelect,
}: {
  label: string;
  rows: { label: string; icon: ReactNode; actions?: ReactNode }[];
  onSelect: (value: string) => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <Collapsible defaultOpen className="mt-6">
      <SidebarGroup className="p-0">
        <SidebarGroupLabel
          asChild
          className="w-full px-2 text-xs font-normal hover:bg-sidebar-accent"
        >
          <CollapsibleTrigger>
            <span className="min-w-0 flex-1 truncate text-start">{label}</span>
            <ChevronDown />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {rows.map((row) => (
                <SidebarMenuItem key={row.label}>
                  <SidebarMenuButton
                    className="shell-nav-button"
                    onClick={() => {
                      onSelect(row.label);
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    {row.icon}
                    <span>{row.label}</span>
                  </SidebarMenuButton>
                  {row.actions}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function SidebarNavigation({
  items,
  active,
  onSelect,
  label,
  initialExpanded = [],
  collapsed: collapsedProp,
  className,
}: {
  items: SidebarNavigationItem[];
  active: string;
  onSelect: (value: string) => void;
  label?: string;
  initialExpanded?: string[];
  collapsed?: boolean;
  className?: string;
}) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && (collapsedProp ?? state === "collapsed");
  const activeParent = items.find((item) => item.children?.includes(active))?.label;
  const [expanded, setExpanded] = useState(() =>
    activeParent ? [...new Set([...initialExpanded, activeParent])] : initialExpanded,
  );
  useEffect(() => {
    if (activeParent)
      setExpanded((current) =>
        current.includes(activeParent) ? current : [...current, activeParent],
      );
  }, [activeParent]);
  function select(value: string) {
    onSelect(value);
    if (isMobile) setOpenMobile(false);
  }
  return (
    <SidebarGroup className={cn("p-0", className)}>
      {!collapsed && label && (
        <SidebarGroupLabel className="shell-section-label">{label}</SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const open = expanded.includes(item.label);
            const isActive = active === item.label;
            const button = (
              <SidebarMenuButton
                className={cn(
                  "shell-nav-button",
                  collapsed && "justify-center px-0",
                  item.accent && "text-primary",
                )}
                tooltip={item.label}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                isActive={isActive}
                disabled={item.disabled}
                onClick={item.children ? undefined : () => select(item.label)}
              >
                {item.icon}
                <span className={cn("min-w-0 flex-1 truncate text-left", collapsed && "sr-only")}>
                  {item.label}
                </span>
                {!collapsed && item.dot && (
                  <span className="size-1.5 animate-pulse rounded-full bg-[var(--chart-2)]" />
                )}
                {!collapsed && item.children && (open ? <ChevronDown /> : <ChevronRight />)}
              </SidebarMenuButton>
            );
            if (item.children && collapsed) {
              return (
                <SidebarMenuItem key={item.label}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        {item.children.map((child) => (
                          <DropdownMenuItem key={child} onSelect={() => select(child)}>
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
                key={item.label}
                asChild
                open={open}
                onOpenChange={(value) =>
                  setExpanded((current) =>
                    value
                      ? [...current, item.label]
                      : current.filter((name) => name !== item.label),
                  )
                }
              >
                <SidebarMenuItem>
                  {item.children ? (
                    <CollapsibleTrigger asChild>{button}</CollapsibleTrigger>
                  ) : (
                    button
                  )}
                  {!collapsed && item.badge && (
                    <SidebarMenuBadge className="right-1 rounded border px-1.5 text-[9px]">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                  {item.children && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child}>
                            <SidebarMenuSubButton asChild isActive={active === child}>
                              <button
                                type="button"
                                aria-current={active === child ? "page" : undefined}
                                onClick={() => select(child)}
                              >
                                <span>{child}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
