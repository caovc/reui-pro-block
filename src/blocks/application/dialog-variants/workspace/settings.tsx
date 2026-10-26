import { useState } from "react";
import { Settings2 } from "lucide-react";
import { demoAvatar, integrationArtwork, svgImage } from "@/lib/demo-artwork";
import { Badge } from "@/components/reui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { DialogLauncher } from "../first-run/support";
import { SettingsPanel, SettingsRow, SettingsChoice } from "./settings-panel";
import { LocalAvatarUpload } from "./free/avatar-upload";
import {
  initialSettings,
  profileInitial,
  settingsFields,
  settingsSections,
  timezones,
  type SettingsSection,
} from "./settings-data";

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function AccountSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>("profile");
  const [values, setValues] = useState(initialSettings);
  const [defaultAvatar, setDefaultAvatar] = useState(true);
  const [defaultLogo, setDefaultLogo] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>();
  const [saved, setSaved] = useState<Record<string, string | boolean> | null>(null);
  const [savedMedia, setSavedMedia] = useState("");
  const emailsValid = ["email", "supportEmail", "billingEmail"].every((id) =>
    validEmail(String(values[id])),
  );
  function change(id: string, value: string | boolean) {
    setValues((current) => ({ ...current, [id]: value }));
  }
  const sections = settingsSections.map((entry) => ({
    ...entry,
    icon: <entry.icon data-icon="inline-start" />,
    children:
      entry.id === "profile" ? (
        <>
          <SettingsRow title="Profile Photo" description="Shown in comments and mentions.">
            <LocalAvatarUpload
              defaultAvatar={
                avatarPreview ?? (defaultAvatar ? demoAvatar("Ava Chen profile") : undefined)
              }
              onDefaultRemove={() => {
                setDefaultAvatar(false);
                setAvatarFile(null);
                setAvatarPreview(undefined);
              }}
              onFileChange={(file) => {
                setAvatarFile(file?.file instanceof File ? file.file : null);
                setAvatarPreview(file?.preview);
              }}
            />
          </SettingsRow>
          <SettingsRow
            id="workspace-settings-fullName"
            title="Full Name"
            description="Used across Atlas."
          >
            <Input
              id="workspace-settings-fullName"
              value={String(values.fullName)}
              maxLength={80}
              onChange={(event) => change("fullName", event.target.value)}
            />
          </SettingsRow>
          <SettingsRow
            id="workspace-settings-email"
            title="Email Address"
            description="Primary sign-in email."
            invalid={!validEmail(String(values.email))}
            badge={
              <Badge
                variant={values.email === profileInitial.email ? "success-light" : "secondary"}
                size="sm"
              >
                {values.email === profileInitial.email ? "Verified" : "Unverified draft"}
              </Badge>
            }
          >
            <Input
              id="workspace-settings-email"
              type="email"
              value={String(values.email)}
              maxLength={160}
              onChange={(event) => change("email", event.target.value)}
              aria-invalid={!validEmail(String(values.email))}
            />
            {!validEmail(String(values.email)) && (
              <FieldError>Enter a valid email address.</FieldError>
            )}
          </SettingsRow>
          <SettingsRow
            id="workspace-settings-username"
            title="Username"
            description="Used in mentions and links."
          >
            <InputGroup>
              <InputGroupAddon>@</InputGroupAddon>
              <InputGroupInput
                id="workspace-settings-username"
                value={String(values.username)}
                maxLength={80}
                onChange={(event) => change("username", event.target.value)}
              />
            </InputGroup>
          </SettingsRow>
          <SettingsRow title="Public Details" description="Shown across Atlas.">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="workspace-settings-profileRole">Role</FieldLabel>
                <SettingsChoice
                  id="workspace-settings-profileRole"
                  value={String(values.role)}
                  options={["Staff Product Lead", "Product Manager", "Design Lead"]}
                  onChange={(value) => change("role", value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="workspace-settings-profileTimezone">Time zone</FieldLabel>
                <SettingsChoice
                  id="workspace-settings-profileTimezone"
                  value={String(values.timezone)}
                  options={timezones}
                  onChange={(value) => change("timezone", value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="workspace-settings-website">Website</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>https://</InputGroupAddon>
                  <InputGroupInput
                    id="workspace-settings-website"
                    value={String(values.website)}
                    maxLength={160}
                    onChange={(event) => change("website", event.target.value)}
                  />
                </InputGroup>
              </Field>
            </FieldGroup>
          </SettingsRow>
          <SettingsRow id="workspace-settings-bio" title="Bio" description="Short profile summary.">
            <Textarea
              id="workspace-settings-bio"
              className="min-h-24"
              value={String(values.bio)}
              maxLength={1200}
              onChange={(event) => change("bio", event.target.value)}
            />
          </SettingsRow>
        </>
      ) : entry.id === "workspace" ? (
        <SettingsRow title="Workspace Logo" description="Used in navigation and shared links.">
          <LocalAvatarUpload
            className="workspace-settings-logo"
            label="Upload workspace logo"
            defaultAvatar={
              logoPreview ??
              (defaultLogo ? svgImage(integrationArtwork("AT", "#7b8497")) : undefined)
            }
            onDefaultRemove={() => {
              setDefaultLogo(false);
              setLogoFile(null);
              setLogoPreview(undefined);
            }}
            onFileChange={(file) => {
              setLogoFile(file?.file instanceof File ? file.file : null);
              setLogoPreview(file?.preview);
            }}
          />
        </SettingsRow>
      ) : undefined,
    fields:
      entry.id === "profile"
        ? undefined
        : settingsFields[entry.id].map((field) => ({
            ...field,
            controlId: `workspace-settings-${field.id}`,
            error:
              field.type === "email" && !validEmail(String(values[field.id]))
                ? "Enter a valid email address."
                : undefined,
            badge:
              field.id === "plan" ? (
                <Badge variant="secondary" size="sm">
                  Current
                </Badge>
              ) : undefined,
          })),
  }));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={10}
        title="Account settings"
        description="Keep your profile and workspace preferences in sync."
        icon={<Settings2 />}
        action="Open account settings"
        result={
          saved && (
            <span>
              {saved.fullName} · {saved.workspaceName} · {saved.defaultRole} · {saved.theme}. Member
              invites: {saved.memberInvites ? "On" : "Off"}; external sharing:{" "}
              {saved.externalSharing ? "On" : "Off"}. {savedMedia} Local settings only; no real
              account, permission, billing or device preference was changed.
            </span>
          )
        }
      >
        <div className="flex flex-wrap gap-2">
          {settingsSections.map((entry) => (
            <Badge variant="outline" key={entry.id}>
              {entry.title}
            </Badge>
          ))}
        </div>
      </DialogLauncher>
      <DialogContent className="workspace-settings-shell" data-workspace-dialog={10}>
        <SettingsPanel
          sections={sections}
          section={section}
          onSectionChange={(next) => setSection(next as SettingsSection)}
          value={values}
          onValueChange={change}
          saveDisabled={!emailsValid || !String(values.fullName).trim()}
          onCancel={() => setOpen(false)}
          onSave={(next) => {
            setSaved({ ...next });
            setSavedMedia(
              `Photo: ${avatarFile?.name ?? (defaultAvatar ? "Original demo avatar" : "None")}; logo: ${logoFile?.name ?? (defaultLogo ? "Original demo mark" : "None")}.`,
            );
            setOpen(false);
          }}
          renderHeader={(active) => (
            <DialogHeader className="workspace-settings-header">
              <DialogTitle>{active.title}</DialogTitle>
              <DialogDescription>{active.description}</DialogDescription>
            </DialogHeader>
          )}
          renderFooter={(actions) => (
            <DialogFooter className="workspace-settings-footer">{actions}</DialogFooter>
          )}
        />
      </DialogContent>
    </Dialog>
  );
}
