import { CreditCard, KeyRound, Plug, Settings, ShieldCheck, Users, Webhook } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { SidebarNavigation } from "@/components/reui/sidebar";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import type { VerveConfigurationSection } from "./verve-configuration-data";
import type { VerveAccountSection } from "./verve-account-settings-data";
import type { VerveAccountSettingsModel } from "./verve-account-settings-model";
import "./verve-settings-layout.css";

/** Existing actual free navigation. Disabled domains are known parity gaps;
 * this consumer does not pretend their page bodies are implemented. */
export function VerveSettingsNavigation({
  general,
  onGeneral,
  configuration,
  onConfigurationSelect,
  workspace,
  onWorkspaceSelect,
}: {
  general: boolean;
  onGeneral: () => void;
  workspace?: "billing" | "team" | null;
  onWorkspaceSelect?: (section: "billing" | "team") => void;
  configuration?: VerveConfigurationSection | null;
  onConfigurationSelect?: (section: VerveConfigurationSection) => void;
}) {
  return (
    <div className="verve-settings-navigation">
      <SidebarNavigation
        label="Workspace"
        className="verve-settings-workspace"
        active={
          general
            ? "General"
            : workspace === "billing"
              ? "Billing"
              : workspace === "team"
                ? "Team Members"
                : ""
        }
        onSelect={(value) => {
          if (value === "General") onGeneral();
          else if (value === "Billing") onWorkspaceSelect?.("billing");
          else if (value === "Team Members") onWorkspaceSelect?.("team");
        }}
        items={[
          { label: "General", icon: <Settings /> },
          { label: "Billing", icon: <CreditCard />, disabled: !onWorkspaceSelect },
          { label: "Team Members", icon: <Users />, disabled: !onWorkspaceSelect },
        ]}
      />
      <SidebarNavigation
        label="Configuration"
        className="verve-settings-configuration"
        active={
          configuration === "integrations"
            ? "Integrations"
            : configuration === "api-keys"
              ? "API Keys"
              : configuration === "webhooks"
                ? "Webhooks"
                : ""
        }
        onSelect={(value) => {
          if (value === "Integrations") onConfigurationSelect?.("integrations");
          else if (value === "API Keys") onConfigurationSelect?.("api-keys");
          else if (value === "Webhooks") onConfigurationSelect?.("webhooks");
        }}
        items={[
          { label: "Integrations", icon: <Plug />, disabled: !onConfigurationSelect },
          { label: "API Keys", icon: <KeyRound />, disabled: !onConfigurationSelect },
          { label: "Webhooks", icon: <Webhook />, disabled: !onConfigurationSelect },
        ]}
      />
    </div>
  );
}
export function VerveSettingsSummary() {
  return (
    <div className="verve-settings-summary">
      <div className="verve-settings-summary-title">
        <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
        <strong>Security Status</strong>
        <Badge size="sm" variant="success">
          Healthy
        </Badge>
      </div>
      <p className="verve-settings-summary-description">
        All checks passed. 2FA enabled, API keys rotated.
      </p>
    </div>
  );
}
export function VerveAccountMenuContent({
  model,
  onSelect,
}: {
  model: VerveAccountSettingsModel;
  onSelect: (section: VerveAccountSection) => void;
}) {
  const theme = useGlobalTheme();
  const { setOpenMobile } = useSidebar();
  function select(section: VerveAccountSection) {
    onSelect(section);
    setOpenMobile(false);
  }
  const mode =
    theme.theme.mode === "light" || theme.theme.mode === "dark" ? theme.theme.mode : "system";
  return (
    <>
      <DropdownMenuLabel>
        <span className="block text-sm font-medium text-foreground">{model.identity.name}</span>
        <span className="block font-normal">{model.identity.email}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onSelect={() => select("profile")}>Profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => select("preferences")}>Preferences</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => select("notifications")}>Notifications</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        aria-label="Theme"
        value={mode}
        onValueChange={(value) => {
          if (value === "light" || value === "dark" || value === "system")
            setGlobalTheme({ ...theme.theme, mode: value }, false);
        }}
      >
        <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => toast.info("This local preview has no signed-in server session.")}
      >
        Sign Out
      </DropdownMenuItem>
    </>
  );
}
export function VerveSettingsBreadcrumb({
  label,
  homeHref,
  onHome,
}: {
  label: string;
  homeHref: string;
  onHome: () => void;
}) {
  return (
    <Breadcrumb className="verve-settings-breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem className="verve-settings-breadcrumb-context">
          <BreadcrumbLink
            href={homeHref}
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              onHome();
            }}
          >
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="verve-settings-breadcrumb-context" />
        <BreadcrumbItem className="verve-settings-breadcrumb-context">CRM</BreadcrumbItem>
        <BreadcrumbSeparator className="verve-settings-breadcrumb-context" />
        <BreadcrumbItem>
          <BreadcrumbPage>{label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
