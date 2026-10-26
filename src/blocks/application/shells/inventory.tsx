import { ReuiSidebar, SidebarNavigation } from "@/components/reui/sidebar";
import { AppShellInset } from "@/components/reui/layout";
import { useState } from "react";
import {
  BarChart3,
  Box,
  ChevronDown,
  Home,
  MessageSquare,
  Plus,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Button,
  CollapseHandle,
  CreateItemDialog,
  HeaderSwitchers,
  Notifications,
  PlaceholderCanvas,
  ReuiMark,
  SearchPalette,
  WorkspaceMenu,
  toast,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./chrome";
import { NewsCard, SystemMonitor } from "./environment";
const sections = [
  {
    name: "Home",
    icon: Home,
    groups: [
      {
        title: "Overview",
        items: ["Dashboard", "Activity Feed", "Quick Stats"],
      },
      { title: "Reporting", items: ["Reports", "Exports"] },
    ],
    footer: "news",
  },
  {
    name: "Inventory",
    icon: Box,
    groups: [
      {
        title: "Catalog",
        items: ["Product Catalog", "Categories", "Customer Reviews"],
      },
      {
        title: "Operations",
        items: ["Transactions", "Suppliers", "Warehouses", "Stock Alerts"],
      },
    ],
    footer: "storage",
  },
  {
    name: "Orders",
    icon: ShoppingCart,
    groups: [
      {
        title: "Orders",
        items: ["All Orders", "Pending", "In Progress", "Completed", "Returns"],
      },
      { title: "Payments", items: ["Invoices", "Refunds"] },
    ],
    footer: "metrics",
  },
  {
    name: "Customers",
    icon: Users,
    groups: [
      { title: "Customers", items: ["Directory", "Segments", "Companies"] },
      { title: "Engagement", items: ["Reviews", "Messages", "Loyalty"] },
    ],
    footer: "metrics",
  },
  {
    name: "Messages",
    icon: MessageSquare,
    groups: [
      {
        title: "Inbox",
        items: ["All Messages", "Unread", "Starred", "Archived"],
      },
      { title: "Channels", items: ["Support", "Sales", "Internal"] },
    ],
    footer: "news",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    groups: [
      {
        title: "Insights",
        items: ["Overview", "Revenue", "Customers", "Products"],
      },
      { title: "Reports", items: ["Saved Reports", "Scheduled Exports"] },
    ],
    footer: "metrics",
  },
  {
    name: "Settings",
    icon: Settings,
    groups: [
      {
        title: "Workspace",
        items: ["General", "Members", "Billing", "Integrations"],
      },
      { title: "Security", items: ["Access Control", "Audit Log", "API Keys"] },
    ],
    footer: "storage",
  },
];
export default function InventoryShell() {
  const [section, setSection] = useState(1);
  const [active, setActive] = useState("Product Catalog");
  const [hidden, setHidden] = useState(false);
  const [create, setCreate] = useState(false);
  const [usage, setUsage] = useState(74);
  const current = sections[section];
  return (
    <div className="shell-reference bg-muted/20" data-shell-variant="8" data-inner-hidden={hidden}>
      <ReuiSidebar width={64} collapsible="none" className="shell-icon-rail wide">
        <ReuiMark />
        <div className="mt-5 flex flex-col gap-1.5">
          <SidebarNavigation
            collapsed
            className="shell-theme-navigation inventory-rail-navigation"
            active={`${current.name} section`}
            onSelect={(name) => {
              const index = sections.findIndex((section) => `${section.name} section` === name);
              setSection(index);
              setActive(sections[index].groups[0].items[0]);
              setHidden(false);
            }}
            items={sections.map(({ name, icon: Icon }) => ({
              label: `${name} section`,
              icon: <Icon />,
            }))}
          />
        </div>
        <div className="mt-auto">
          <WorkspaceMenu collapsed user />
        </div>
      </ReuiSidebar>
      <AppShellInset className="shell-content-frame inset">
        <header className="shell-header border-b">
          <HeaderSwitchers initialApp="Inventory" />
          <div className="hidden w-80 lg:block">
            <SearchPalette onSelect={setActive} />
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-7 text-xs">
                  <Plus />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  {["New product", "New order", "New customer", "New report"].map((n) => (
                    <DropdownMenuItem key={n} onSelect={() => setCreate(true)}>
                      {n}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Notifications drawer />
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          {!hidden && (
            <ReuiSidebar
              collapsible="none"
              className="shell-secondary !w-[200px] max-md:hidden"
              aria-label={`${current.name} navigation`}
            >
              <div className="shell-scroll">
                {current.groups.map((group) => (
                  <section className="border-b px-2 py-3 last:border-b-0" key={group.title}>
                    <p className="mb-1.5 px-1 text-[9px] uppercase text-muted-foreground">
                      {group.title}
                    </p>
                    <SidebarNavigation
                      className="inventory-section-navigation"
                      collapsed={false}
                      active={active}
                      onSelect={(item) => {
                        setActive(item);
                        if (window.innerWidth < 768) setHidden(true);
                      }}
                      items={group.items.map((label) => ({
                        label,
                        icon: <Box className="size-3.5" />,
                        badge:
                          label === "Customer Reviews"
                            ? "20"
                            : label === "Stock Alerts"
                              ? "4"
                              : undefined,
                      }))}
                    />
                  </section>
                ))}
              </div>
              {current.footer === "news" ? (
                <NewsCard />
              ) : current.footer === "storage" ? (
                <div className="border-t p-3">
                  <p className="text-[10px] font-medium text-[var(--chart-4)]">Storage Usage</p>
                  <p className="mb-2 mt-1.5 text-[10px] leading-4 text-muted-foreground">
                    Warehouse capacity across all locations
                  </p>
                  <Progress
                    value={usage}
                    className="h-1 [&_[data-slot=progress-indicator]]:bg-[var(--chart-4)]"
                  />
                  <div className="mt-2 flex justify-between text-[10px]">
                    <span>
                      <strong className="font-medium">{usage}%</strong> Used
                    </span>
                    <span>
                      <strong className="font-medium">{100 - usage}%</strong> Free
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-5 px-0 text-[9px] text-muted-foreground"
                    onClick={() => {
                      setUsage(usage === 74 ? 42 : 74);
                      toast.success("Storage report refreshed");
                    }}
                  >
                    Refresh usage
                  </Button>
                </div>
              ) : (
                <div className="border-t p-3">
                  <p className="mb-2 text-[10px] font-medium">Live Metrics</p>
                  {[
                    ["Orders today", "128"],
                    ["Active customers", "2,450"],
                    ["Conversion", "4.2%"],
                  ].map(([name, value]) => (
                    <div className="flex justify-between py-1.5 text-[10px]" key={name}>
                      <span className="text-muted-foreground">{name}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                  <div className="mt-2">
                    <SystemMonitor />
                  </div>
                </div>
              )}
              <CollapseHandle
                label="inner sidebar"
                collapsed={hidden}
                onToggle={() => setHidden(true)}
              />
            </ReuiSidebar>
          )}
          {hidden && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="mt-3"
              aria-label="Expand inner sidebar"
              onClick={() => setHidden(false)}
            >
              <ChevronDown />
            </Button>
          )}
          <PlaceholderCanvas rows={2} solid className="inventory-canvas" />
        </div>
      </AppShellInset>
      <CreateItemDialog
        title={`Create ${current.name.toLowerCase()} item`}
        open={create}
        onOpenChange={setCreate}
        onCreate={(name) => toast.success(`${name} created`)}
      />
    </div>
  );
}
