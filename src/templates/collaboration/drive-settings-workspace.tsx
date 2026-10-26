import { useState } from "react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  SettingsFields,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { BrandGlyph } from "@/components/brand-mark";
import {
  DriveCardActions,
  DriveLocalUpload,
  DriveSettingsCard,
  DriveSettingsDialog,
} from "./drive-settings-components";
import { DriveRichChoice } from "./drive-settings-free";
import { driveLandingOptions } from "./drive-settings-options";
import type { DriveSettingsModel } from "./drive-settings-model";

export function DriveWorkspaceSettings({ model }: { model: DriveSettingsModel }) {
  const [details, setDetails] = useState(() => ({ ...model.workspace }));
  const [preferences, setPreferences] = useState(() => ({ ...model.workspacePreferences }));
  const [preview, setPreview] = useState(false);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  return (
    <>
      <DriveSettingsCard
        title="Workspace Details"
        description="Brand and contact info."
        footer={
          <>
            <Button
              variant="outline"
              onClick={(event) => {
                setTrigger(event.currentTarget);
                setPreview(true);
              }}
            >
              Preview brand
            </Button>
            <Button onClick={() => model.saveWorkspace(details)}>Save changes</Button>
          </>
        }
      >
        <SettingsRow title="Workspace Logo" description="Used in navigation and shared links.">
          <DriveLocalUpload logo />
        </SettingsRow>
        <SettingsFields
          fields={[
            { id: "workspaceName", controlId: "drive-workspace-name", label: "Workspace Name" },
            {
              id: "subdomain",
              controlId: "drive-workspace-subdomain",
              label: "Workspace URL",
              description: "Link for teammates and clients.",
              suffix: ".brick.test",
            },
            {
              id: "supportEmail",
              controlId: "drive-workspace-email",
              label: "Support Email",
              description: "Shown on help surfaces.",
              type: "email",
            },
          ]}
          value={{ ...details }}
          onValueChange={(id, value) => setDetails((current) => ({ ...current, [id]: value }))}
        />
      </DriveSettingsCard>
      <DriveSettingsCard
        title="Workspace Preferences"
        description="Sharing and automation defaults."
        footer={
          <DriveCardActions
            onCancel={() => setPreferences({ ...model.workspacePreferences })}
            onSave={() => model.saveWorkspacePreferences(preferences)}
          />
        }
      >
        <SettingsRow
          id="drive-workspace-landing"
          title="Default Landing View"
          description="Where a new member's drive opens."
        >
          <DriveRichChoice
            id="drive-workspace-landing"
            value={preferences.landingView}
            options={driveLandingOptions}
            onChange={(landingView) => setPreferences((current) => ({ ...current, landingView }))}
          />
        </SettingsRow>
        <SettingsRow
          id="drive-workspace-sharing"
          title="External Sharing"
          description="Create client-safe links."
        >
          <Switch
            id="drive-workspace-sharing"
            checked={preferences.externalSharing}
            onCheckedChange={(externalSharing) =>
              setPreferences((current) => ({ ...current, externalSharing }))
            }
          />
        </SettingsRow>
        <SettingsRow
          id="drive-workspace-recaps"
          title="AI Project Recaps"
          description="Short recaps as work changes."
        >
          <Switch
            id="drive-workspace-recaps"
            checked={preferences.aiProjectRecaps}
            onCheckedChange={(aiProjectRecaps) =>
              setPreferences((current) => ({ ...current, aiProjectRecaps }))
            }
          />
        </SettingsRow>
      </DriveSettingsCard>
      <DriveSettingsCard
        title="Workspace Summary"
        description="Brand, routing, and region."
        className="ds-summary-card"
      >
        <div className="ds-workspace-summary">
          <section className="ds-workspace-summary-row">
            <div>
              <p className="ds-workspace-summary-label">Verified domain</p>
              <p className="ds-workspace-summary-value">brick.test</p>
              <p className="ds-workspace-summary-description">
                Custom links, invites, and shared pages resolve here.
              </p>
            </div>
            <Badge variant="success-light" size="sm">
              Active
            </Badge>
          </section>
          <Separator />
          <section className="ds-workspace-summary-row">
            <div>
              <p className="ds-workspace-summary-label">Data region</p>
              <p className="ds-workspace-summary-value">US East</p>
              <p className="ds-workspace-summary-description">
                Primary routing for customer and workspace data.
              </p>
            </div>
          </section>
        </div>
      </DriveSettingsCard>
      {preview && (
        <DriveSettingsDialog
          title="Preview brand"
          description="How this workspace appears in navigation and shared links."
          onClose={() => setPreview(false)}
          returnFocus={trigger}
        >
          <section className="ds-brand-preview">
            <p>Workspace switcher preview</p>
            <div>
              <BrandGlyph />
              <strong>{details.workspaceName}</strong>
            </div>
            <p>Shared-link preview</p>
            <strong>{details.workspaceName}</strong>
            <p>{details.subdomain}.brick.test</p>
            <p>{details.supportEmail}</p>
          </section>
        </DriveSettingsDialog>
      )}
    </>
  );
}
