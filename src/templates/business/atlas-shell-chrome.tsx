import { useState, type MouseEvent } from "react";
import {
  Bell,
  CircleHelp,
  CreditCard,
  Ellipsis,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import { toast } from "sonner";
import { useAtlasAccountRoute } from "./atlas-account-route";

/** Atlas consumer of the existing free Sidebar and DropdownMenu compositions. */
export function AtlasAccountControl({
  name,
  email,
  photo,
  side,
  onNavigate,
  showTooltips = true,
}: {
  name: string;
  email: string;
  photo?: string;
  side: "left" | "right";
  onNavigate: (value: string) => void;
  showTooltips?: boolean;
}) {
  const { isMobile, state } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const { theme } = useGlobalTheme();
  const routing = useAtlasAccountRoute();
  const [open, setOpen] = useState(false);
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  const avatar = (className: string) => (
    <Avatar className={className}>
      <AvatarImage src={photo} alt="" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="atlas-account-trigger"
                aria-label={`Open account menu for ${name}`}
                tooltip={showTooltips ? name : undefined}
              />
            }
          >
            {avatar("atlas-account-avatar")}
            {!collapsed && <strong className="atlas-account-name">{name}</strong>}
            {!collapsed && <Ellipsis className="ml-auto size-3.5 text-muted-foreground" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "top" : side === "right" ? "left" : "right"}
            align="end"
            className="reui-reference atlas-account-menu"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="atlas-account-summary">
                {avatar("atlas-account-summary-avatar")}
                <span>
                  <strong>{name}</strong>
                  <small>{email}</small>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={
                  <a
                    href={routing.href("profile")}
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
                    href={routing.href("security")}
                    onClick={(event) => {
                      if (isModifiedClick(event)) return;
                      event.preventDefault();
                      onNavigate("Account settings");
                      setOpen(false);
                    }}
                  />
                }
              >
                <Settings />
                Account settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onNavigate("Billing")}>
                <CreditCard />
                Billing &amp; plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => toast("No unread notifications in this preview.")}>
                <Bell />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => toast("Contact support@example.com for this preview workspace.")}
              >
                <CircleHelp />
                Help &amp; support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="atlas-account-theme-row"
                onSelect={(event) => event.preventDefault()}
              >
                <Palette />
                <span>Theme</span>
                <RadioGroup
                  aria-label="Theme"
                  value={theme.mode === "inherit" ? "system" : theme.mode}
                  onValueChange={(value) => {
                    setGlobalTheme({ ...theme, mode: value as typeof theme.mode });
                    setOpen(false);
                  }}
                  className="atlas-account-theme-choices"
                >
                  {[
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "system", label: "System", icon: Monitor },
                  ].map(({ value, label, icon: Icon }) => (
                    <Label key={value} className="atlas-account-theme-option">
                      <RadioGroupItem
                        value={value}
                        aria-label={label}
                        className="atlas-account-theme-radio"
                      />
                      <Icon aria-hidden="true" />
                    </Label>
                  ))}
                </RadioGroup>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => toast("This local preview has no connected sign-in session.")}
              >
                <LogOut />
                Sign out<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AtlasFooterNavigation({
  onSelect,
}: {
  onSelect: (value: "Team" | "Settings" | "Help & Support") => void;
}) {
  const routing = useAtlasAccountRoute();
  return (
    <SidebarMenu className="atlas-footer-navigation">
      {[
        { label: "Team", icon: Users },
        { label: "Settings", icon: Settings },
        { label: "Help & Support", icon: CircleHelp },
      ].map(({ label, icon: Icon }) => (
        <SidebarMenuItem key={label}>
          <SidebarMenuButton
            size="sm"
            tooltip={label}
            asChild={label === "Settings"}
            onClick={
              label === "Settings"
                ? undefined
                : () => onSelect(label as "Team" | "Settings" | "Help & Support")
            }
          >
            {label === "Settings" ? (
              <a
                href={routing.href("profile")}
                onClick={(event) => {
                  if (isModifiedClick(event)) return;
                  event.preventDefault();
                  onSelect("Settings");
                }}
              >
                <Icon />
                <span>{label}</span>
              </a>
            ) : (
              <>
                <Icon />
                <span>{label}</span>
              </>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}
