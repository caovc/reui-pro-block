import { useId, useState } from "react";
import { Upload, X } from "lucide-react";
import {
  SettingsFields,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { LocalAvatarUpload } from "@/blocks/application/dialog-variants/workspace/free/avatar-upload";
import { BrandGlyph } from "@/components/brand-mark";
import { Badge } from "@/components/reui/badge";
import { ColorPicker, ColorPickerSwatches } from "@/components/reui/color-picker";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  DriveSettingsCard,
  DriveSettingsDialog,
} from "@/templates/collaboration/drive-settings-components";
import { DriveRichChoice } from "@/templates/collaboration/drive-settings-free";
import { verveAccentOptions, verveLandingOptions } from "./verve-account-settings-data";
import type { VerveAccountSettingsModel } from "./verve-account-settings-model";
import "./verve-account-settings.css";

export function VerveWorkspaceSettings({ model }: { model: VerveAccountSettingsModel }) {
  const prefix = `verve-workspace-${useId().replaceAll(":", "")}`;
  const [preview, setPreview] = useState(false);
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null);
  const draft = model.workspaceDraft;
  const preferences = model.workspacePreferences;
  const accent =
    verveAccentOptions.find((item) => item.label === draft.accent) ?? verveAccentOptions[2];
  return (
    <section className="verve-settings verve-workspace-settings" aria-label="Workspace">
      <h1 className="vs-workspace-heading">Settings</h1>
      <div className="vs-cards">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            model.saveWorkspace();
          }}
        >
          <DriveSettingsCard
            title="Workspace details"
            description="Brand and contact info."
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(event) => {
                    setReturnFocus(event.currentTarget);
                    setPreview(true);
                  }}
                >
                  Preview brand
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !model.workspaceDirty ||
                    model.workspaceImage.pending ||
                    Boolean(model.workspaceImage.error)
                  }
                >
                  Save workspace
                </Button>
              </>
            }
          >
            <SettingsRow
              title="Workspace logo"
              description="Used in navigation and shared links."
              invalid={Boolean(model.workspaceImage.error)}
            >
              <LocalAvatarUpload
                key={model.workspaceImage.revision}
                label="Upload workspace logo"
                className="vs-upload vs-logo-upload"
                defaultAvatar={draft.logo ?? undefined}
                changeLabel={
                  <>
                    <Upload aria-hidden="true" />
                    Change
                  </>
                }
                removeLabel={
                  <>
                    <X aria-hidden="true" />
                    Remove
                  </>
                }
                onFileChange={model.workspaceImage.change}
                onDefaultRemove={model.workspaceImage.remove}
              />
              {model.workspaceImage.pending && (
                <span className="vs-helper" role="status">
                  Preparing image…
                </span>
              )}
              {model.workspaceImage.error && <FieldError>{model.workspaceImage.error}</FieldError>}
            </SettingsRow>
            <SettingsFields
              idPrefix={prefix}
              fields={[
                {
                  id: "workspaceName",
                  label: "Workspace name",
                  error: model.workspaceErrors.workspaceName,
                },
                {
                  id: "subdomain",
                  label: "Workspace URL",
                  description: "Link for teammates and clients.",
                  suffix: ".bricklane.test",
                  error: model.workspaceErrors.subdomain,
                },
                {
                  id: "supportEmail",
                  label: "Support email",
                  description: "Shown on help surfaces.",
                  type: "email",
                  error: model.workspaceErrors.supportEmail,
                },
              ]}
              value={{
                workspaceName: draft.workspaceName,
                subdomain: draft.subdomain,
                supportEmail: draft.supportEmail,
              }}
              onValueChange={(id, value) => {
                if (id === "workspaceName" || id === "subdomain" || id === "supportEmail")
                  model.updateWorkspace(id, String(value));
              }}
            />
            <SettingsRow
              title="Accent color"
              description="Used for highlights and links. Select one accent."
            >
              <ColorPicker
                value={accent.value}
                onValueChange={(value) => {
                  const selected = verveAccentOptions.find(
                    (item) => item.value.toLowerCase() === value?.toLowerCase(),
                  );
                  if (selected) model.updateWorkspace("accent", selected.label);
                }}
                aria-label="Accent color"
                i18n={{ labels: { swatches: "Accent color" } }}
              >
                <ColorPickerSwatches
                  colors={[...verveAccentOptions]}
                  shape="circle"
                  className="vs-accent-colors"
                />
              </ColorPicker>
            </SettingsRow>
          </DriveSettingsCard>
        </form>
        <DriveSettingsCard
          title="Workspace preferences"
          description="Sharing and automation defaults."
        >
          <SettingsRow id={`${prefix}-landing`} title="Default landing view">
            <DriveRichChoice
              id={`${prefix}-landing`}
              value={preferences.landingView}
              options={verveLandingOptions}
              onChange={(value) => model.updateWorkspacePreference("landingView", value)}
            />
          </SettingsRow>
          <SettingsRow
            id={`${prefix}-sharing`}
            title="External sharing"
            description="Create client-safe links."
          >
            <Switch
              id={`${prefix}-sharing`}
              aria-describedby={`${prefix}-sharing-description`}
              checked={preferences.externalSharing}
              onCheckedChange={(value) => model.updateWorkspacePreference("externalSharing", value)}
            />
          </SettingsRow>
          <SettingsRow
            id={`${prefix}-recaps`}
            title="AI deal recaps"
            description="Short recaps as deals move stage."
          >
            <Switch
              id={`${prefix}-recaps`}
              aria-describedby={`${prefix}-recaps-description`}
              checked={preferences.aiDealRecaps}
              onCheckedChange={(value) => model.updateWorkspacePreference("aiDealRecaps", value)}
            />
          </SettingsRow>
        </DriveSettingsCard>
        <DriveSettingsCard title="Workspace summary" description="Brand, routing, and region.">
          <div className="vs-summary">
            <section className="vs-summary-row">
              <div>
                <p className="vs-summary-label">Verified domain</p>
                <p className="vs-summary-value">{model.workspace.subdomain}.bricklane.test</p>
                <p className="vs-summary-description">
                  Deal links, invites, and shared reports resolve here.
                </p>
              </div>
              <Badge variant="success-light" size="sm">
                Active
              </Badge>
            </section>
            <Separator />
            <section className="vs-summary-row">
              <div>
                <p className="vs-summary-label">Data region</p>
                <p className="vs-summary-value">US East</p>
                <p className="vs-summary-description">
                  Primary routing for contact and deal records.
                </p>
              </div>
            </section>
            <Separator />
            <section className="vs-summary-row">
              <div>
                <p className="vs-summary-label">Brand posture</p>
                <p className="vs-summary-value">{model.workspace.accent} accent</p>
                <p className="vs-summary-description">
                  Applied to shared quotes and workspace navigation.
                </p>
              </div>
            </section>
          </div>
        </DriveSettingsCard>
        <p className="vs-demo-note">
          Workspace changes stay in this local preview. Additional landing choices are Bricklane
          demo options.
        </p>
      </div>
      <p className="vs-page-status" role="status">
        {model.status}
      </p>
      {preview && (
        <DriveSettingsDialog
          title="Preview brand"
          description="Local preview of the current workspace draft."
          onClose={() => setPreview(false)}
          returnFocus={returnFocus}
        >
          <section className="vs-brand-preview">
            <div className="vs-brand-preview-title">
              {draft.logo ? <img src={draft.logo} alt="Workspace logo" /> : <BrandGlyph />}
              <strong>{draft.workspaceName || "Workspace name"}</strong>
            </div>
            <p>{draft.subdomain}.bricklane.test</p>
            <p>{draft.supportEmail}</p>
            <p>{draft.accent} accent</p>
          </section>
        </DriveSettingsDialog>
      )}
    </section>
  );
}
