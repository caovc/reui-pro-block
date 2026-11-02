// Reuse the actual inline Pro account pages and existing free ReUI compositions.
import {
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { useGlobalTheme } from "@/components/site/global-theme-store";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { AtlasAccountSettings } from "./atlas-account-settings";
import type { AtlasAccountSettingsModel } from "./atlas-account-settings-model";
import type { AtlasAccountSection } from "./atlas-account-settings-data";
import { commitCommerceAccountThemeMode } from "./commerce-account-theme";
import "./commerce-account-settings.css";

export function CommerceAccountSettings({
  model,
  sectionHref,
  onSectionChange,
}: {
  model: AtlasAccountSettingsModel;
  sectionHref: (section: AtlasAccountSection) => string;
  onSectionChange: (section: AtlasAccountSection) => void;
}) {
  return (
    <AtlasAccountSettings
      model={model}
      sectionHref={sectionHref}
      onSectionChange={onSectionChange}
      presentation="commerce"
    />
  );
}

export function CommerceAccountMenuContent({
  model,
  onSelect,
  onSignOut,
}: {
  model: AtlasAccountSettingsModel;
  onSelect: (section: AtlasAccountSection) => void;
  onSignOut: () => void;
}) {
  const theme = useGlobalTheme();
  const mode =
    theme.theme.mode === "light" || theme.theme.mode === "dark" ? theme.theme.mode : "system";
  function select(section: AtlasAccountSection) {
    onSelect(section);
  }
  return (
    <>
      <DropdownMenuLabel>
        <span className="block font-medium text-foreground">{model.identity.name}</span>
        <span className="block font-normal">{model.identity.email}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onSelect={() => select("profile")}>
          <UserRound aria-hidden="true" />
          Profile
          <DropdownMenuShortcut aria-hidden="true">⇧⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => select("preferences")}>
          <Settings aria-hidden="true" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => select("security")}>
          <ShieldCheck aria-hidden="true" />
          Security
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <div className="commerce-account-theme-row flex items-center gap-1 px-1.5 py-1">
        <Palette aria-hidden="true" className="size-4 shrink-0" />
        <span className="flex-1 text-sm">Theme</span>
        <DropdownMenuRadioGroup
          aria-label="Theme"
          value={mode}
          className="commerce-account-theme-options flex gap-0.5"
          onValueChange={(value) => {
            if (value === "light" || value === "dark" || value === "system")
              commitCommerceAccountThemeMode(value, theme.theme);
          }}
        >
          <DropdownMenuRadioItem
            value="light"
            aria-label="Light"
            title="Light"
            className="commerce-account-theme-option data-[state=checked]:bg-accent"
          >
            <Sun aria-hidden="true" />
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="dark"
            aria-label="Dark"
            title="Dark"
            className="commerce-account-theme-option data-[state=checked]:bg-accent"
          >
            <Moon aria-hidden="true" />
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="system"
            aria-label="System"
            title="System"
            className="commerce-account-theme-option data-[state=checked]:bg-accent"
          >
            <Monitor aria-hidden="true" />
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onSignOut}>
        <LogOut aria-hidden="true" />
        Sign Out
        <DropdownMenuShortcut aria-hidden="true">⇧⌘Q</DropdownMenuShortcut>
      </DropdownMenuItem>
    </>
  );
}
