import { Activity } from "lucide-react";
import AccountSettingsDialog from "@/blocks/application/dialog-variants/workspace/settings";
import type { SettingsValues } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { SystemMonitor } from "@/blocks/application/shells/environment";
import { Button } from "@/components/ui/button";
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
