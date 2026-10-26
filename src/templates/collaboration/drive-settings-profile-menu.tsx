// Consumer of the existing SidebarProvider and actual free Dropdown/RadioGroup.
import { useState } from "react";
import { Building2, CreditCard, LogOut, Monitor, Moon, Settings, Sun, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar } from "./shared";
import type { DriveSettingsNavigation } from "./drive-settings-types";
import type { DriveSettingsSection } from "./drive-settings-data";

export type DriveThemeMode = "light" | "dark" | "system";
export function DriveProfileMenu({
  name = "Alex Rivera",
  email = "alex.rivera@brick.test",
  theme,
  onThemeChange,
  navigation,
  loginHref,
  onSignOut,
}: {
  name?: string;
  email?: string;
  theme: DriveThemeMode;
  onThemeChange: (mode: DriveThemeMode) => void;
  navigation: DriveSettingsNavigation;
  loginHref: string;
  onSignOut: () => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const select = (section: DriveSettingsSection) => {
    setOpen(false);
    navigation.onNavigate(section);
    if (isMobile) setOpenMobile(false);
  };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          className="ct-drive-profile-trigger"
          aria-label={`Open profile for ${name}`}
        >
          <Avatar name="Alex Rivera" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="end"
        sideOffset={8}
        className="reui-reference ds-profile-menu"
      >
        <DropdownMenuLabel className="ds-profile-menu-identity">
          <strong>{name}</strong>
          <span>{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {(
            [
              { section: "profile", title: "Profile", icon: Settings },
              { section: "workspace", title: "Workspace", icon: Building2 },
              { section: "team", title: "Team", icon: Users },
              { section: "billing", title: "Billing", icon: CreditCard },
            ] as const
          ).map(({ section, title, icon: Icon }) => (
            <DropdownMenuItem key={section} asChild>
              <a
                href={navigation.href(section)}
                onClick={(event) => {
                  if (
                    event.button === 0 &&
                    !event.metaKey &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                    select(section);
                  }
                }}
              >
                <Icon />
                {title}
                {section === "profile" && <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="ds-theme-menu">
          <span>Theme</span>
          <RadioGroup
            value={theme}
            onValueChange={(value) => onThemeChange(value as DriveThemeMode)}
            orientation="horizontal"
            aria-label="Theme"
            className="ds-theme-options"
          >
            {(
              [
                { value: "light", title: "Light", icon: Sun },
                { value: "dark", title: "Dark", icon: Moon },
                { value: "system", title: "System", icon: Monitor },
              ] as const
            ).map(({ value, title, icon: Icon }) => (
              <Label key={value} htmlFor={`drive-theme-${value}`} className="ds-theme-option">
                <RadioGroupItem
                  id={`drive-theme-${value}`}
                  value={value}
                  aria-label={title}
                  className="sr-only"
                />
                <Icon aria-hidden="true" />
              </Label>
            ))}
          </RadioGroup>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href={loginHref}
            onClick={(event) => {
              if (
                event.button === 0 &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                setOpen(false);
                onSignOut();
                if (isMobile) setOpenMobile(false);
              }
            }}
          >
            <LogOut />
            Sign Out<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
