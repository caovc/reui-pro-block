import { Activity, Info, Upload, X } from "lucide-react";
import AccountSettingsDialog from "@/blocks/application/dialog-variants/workspace/settings";
import type { SettingsValues } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { SystemMonitor } from "@/blocks/application/shells/environment";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { demoAvatar } from "@/lib/demo-artwork";
import { Person } from "./controls";
import "@/blocks/reference.css";
import "@/blocks/application/dialog-variants/workspace/workspace.css";
import "./flux-settings.css";

// Owner is the only reference Role option observed so far.
const fluxProfileRoles = ["Owner"] as const;

// Observed public Info keyboard popup text. Root's native reference observation
// preserves the exact content; the local free Tooltip retains Radix semantics.
const fluxPublicDetailsHelp = "Role, time zone, and website show on your public profile.";

export function FluxSettingsBreadcrumb({
  view,
  profileValues,
  onProfileSave,
}: {
  view: string;
  profileValues: Readonly<SettingsValues>;
  onProfileSave: (values: SettingsValues) => void;
}) {
  const profileName = String(profileValues.fullName);
  return (
    <Breadcrumb aria-label="Settings breadcrumb" className="flux-settings-crumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <i className="wf-workspace-dot" aria-hidden="true" />
          <span className="flux-crumb-workspace">Atlas</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <AccountSettingsDialog
            trigger={
              <Button
                type="button"
                variant="ghost"
                aria-label={`Profile settings for ${profileName}`}
                className="wf-flux-profile-trigger"
              >
                <Person name={profileName} />
              </Button>
            }
            initialValues={profileValues}
            initialAvatar={demoAvatar("Nick Bold")}
            profileRoleOptions={fluxProfileRoles}
            profilePhotoLabels={{
              changeLabel: (
                <>
                  <Upload className="size-4" data-icon="inline-start" aria-hidden="true" />
                  Change
                </>
              ),
              removeLabel: (
                <>
                  <X className="size-4" data-icon="inline-start" aria-hidden="true" />
                  Remove
                </>
              ),
            }}
            profilePublicDetailsTitle={
              <>
                Public Details
                {/* Actual free ReUI c-tooltip-1 composition; MIT Keenthemes.
                    https://reui.io/r/radix-nova/c-tooltip-1.json */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="wf-flux-profile-info border-0 p-0 text-muted-foreground"
                        aria-label={fluxPublicDetailsHelp}
                      >
                        <Info aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs rounded-[var(--radius-xl)] p-3">
                      <p className="text-sm">{fluxPublicDetailsHelp}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            }
            contentClassName="reui-reference wf-flux-profile-dialog"
            onSave={onProfileSave}
          />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>Settings</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{view}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function FluxSettingsMonitor() {
  return (
    <SystemMonitor
      presentation="flux"
      trigger={
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flux-settings-status"
          aria-label="System Status"
        >
          <Activity />
          <span>System Status</span>
        </Button>
      }
    />
  );
}
