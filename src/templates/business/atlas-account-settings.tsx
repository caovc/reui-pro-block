// Inline Atlas account settings, composed from actual existing Pro Settings
// fields and free ReUI Frame/Field/Collapsible/Select/Switch/AvatarUpload.
import { Fragment, useId, type ReactNode } from "react";
import { ChevronDown, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  SettingsChoice,
  SettingsFields,
  SettingsRow,
  type SettingsFieldDefinition,
  type SettingsValues,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { LocalAvatarUpload } from "@/blocks/application/dialog-variants/workspace/free/avatar-upload";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  atlasAccountSections,
  atlasPreferenceOptions,
  atlasRoleOptions,
  atlasTimeZoneGroups,
  type AtlasAccountSection,
} from "./atlas-account-settings-data";
import type { AtlasAccountSettingsModel } from "./atlas-account-settings-model";
import "./atlas-account-settings.css";

function SettingsBadge({ children, plain = false }: { children: ReactNode; plain?: boolean }) {
  return (
    <Badge variant={plain ? "outline" : "success-light"} size="sm" className="aas-badge">
      {children}
    </Badge>
  );
}

function InlineCard({
  title,
  description,
  label,
  children,
  footer,
}: {
  title?: string;
  description?: string;
  label: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Frame dense variant="ghost" className="aas-card" role="region" aria-label={label}>
      <FramePanel fit className="aas-card-panel">
        {title && (
          <FrameHeader className="aas-card-header">
            <FrameTitle>{title}</FrameTitle>
            {description && <FrameDescription>{description}</FrameDescription>}
          </FrameHeader>
        )}
        {children}
        {footer && <FrameFooter className="aas-card-footer">{footer}</FrameFooter>}
      </FramePanel>
    </Frame>
  );
}

function Profile({ model, prefix }: { model: AtlasAccountSettingsModel; prefix: string }) {
  const value = model.draftProfile;
  const fields: SettingsFieldDefinition[] = [
    {
      id: "fullName",
      label: "Full name",
      description: "Used across the app.",
      error: model.profileErrors.fullName,
    },
    {
      id: "email",
      label: "Email address",
      description: "Primary sign-in email.",
      type: "email",
      badge:
        model.savedProfile.emailVerified && value.email === model.savedProfile.email ? (
          <SettingsBadge>Verified</SettingsBadge>
        ) : undefined,
      error: model.profileErrors.email,
    },
    { id: "phone", label: "Phone number", description: "For recovery and urgent alerts." },
    { id: "username", label: "Username", description: "Used in mentions and links.", prefix: "@" },
  ];
  const values: SettingsValues = {
    fullName: value.fullName,
    email: value.email,
    phone: value.phone,
    username: value.username,
  };
  const roleId = `${prefix}-role`;
  const zoneId = `${prefix}-time-zone`;
  const websiteId = `${prefix}-website`;
  const bioId = `${prefix}-bio`;
  return (
    <form
      className="aas-profile"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        model.saveProfile();
      }}
    >
      <InlineCard
        title="Profile"
        description="Manage your personal information and how you appear across the app."
        label="Profile details"
        footer={
          <>
            <span className="aas-save-status" role="status">
              {model.status}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={!model.profileDirty && !model.avatarPending && !model.profileErrors.avatar}
              onClick={model.cancelProfile}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !model.profileDirty || model.avatarPending || Boolean(model.profileErrors.avatar)
              }
            >
              Save changes
            </Button>
          </>
        }
      >
        <FieldGroup className="aas-profile-fields">
          <SettingsRow
            title="Profile photo"
            description="Shown on comments, mentions, and the sign-in menu."
            className="aas-photo-row"
            invalid={Boolean(model.profileErrors.avatar)}
          >
            <LocalAvatarUpload
              key={model.avatarRevision}
              label="Profile photo"
              changeLabel={
                <>
                  <Upload aria-hidden="true" />
                  Upload
                </>
              }
              defaultAvatar={value.avatar ?? undefined}
              className="aas-avatar"
              onFileChange={model.changeAvatar}
              onDefaultRemove={model.removeAvatar}
            />
            {model.avatarPending && (
              <span className="aas-upload-status" role="status">
                Preparing image…
              </span>
            )}
            {model.profileErrors.avatar && <FieldError>{model.profileErrors.avatar}</FieldError>}
          </SettingsRow>
          <FieldSeparator />
          {fields.map((field) => (
            <Fragment key={field.id}>
              <SettingsFields
                fields={[field]}
                value={values}
                idPrefix={prefix}
                onValueChange={(key, next) => {
                  if (
                    key === "fullName" ||
                    key === "email" ||
                    key === "phone" ||
                    key === "username"
                  )
                    model.updateProfile(key, String(next));
                }}
              />
              <FieldSeparator />
            </Fragment>
          ))}
          <SettingsRow
            title="Public details"
            description="Role, time zone, and website."
            className="aas-public-row"
          >
            <FieldGroup className="aas-public-fields">
              <Field>
                <FieldLabel htmlFor={roleId}>Role</FieldLabel>
                <SettingsChoice
                  id={roleId}
                  value={value.role}
                  options={atlasRoleOptions}
                  onChange={(next) => model.updateProfile("role", next)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={zoneId}>Time zone</FieldLabel>
                <Select
                  value={value.timeZone}
                  onValueChange={(next) => model.updateProfile("timeZone", next)}
                >
                  <SelectTrigger id={zoneId} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="reui-reference">
                    {atlasTimeZoneGroups.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor={websiteId}>Website</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>https://</InputGroupAddon>
                  <InputGroupInput
                    id={websiteId}
                    value={value.website}
                    onChange={(event) => model.updateProfile("website", event.target.value)}
                  />
                </InputGroup>
              </Field>
            </FieldGroup>
          </SettingsRow>
          <FieldSeparator />
          <SettingsRow
            id={bioId}
            title="Bio"
            description="A short profile summary."
            className="aas-bio-row"
          >
            <Textarea
              id={bioId}
              value={value.bio}
              aria-describedby={`${bioId}-description`}
              maxLength={2000}
              onChange={(event) => model.updateProfile("bio", event.target.value)}
            />
          </SettingsRow>
        </FieldGroup>
      </InlineCard>
    </form>
  );
}

function Group({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <InlineCard label={`${title} settings`}>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="aas-group-trigger">
            {title}
            <ChevronDown aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="aas-group-content">
          <FieldGroup className="aas-compact-fields">{children}</FieldGroup>
        </CollapsibleContent>
      </Collapsible>
    </InlineCard>
  );
}

function Security({ model, prefix }: { model: AtlasAccountSettingsModel; prefix: string }) {
  return (
    <div className="aas-groups">
      <Group
        title="Sign-in"
        open={model.openGroups.signIn}
        onOpenChange={(open) => model.setGroupOpen("signIn", open)}
      >
        <SettingsRow title="Password" description="Last changed 14 May 2026.">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              toast.info("Change password", {
                description: "Password changes run through your auth provider.",
              })
            }
          >
            Change password
          </Button>
        </SettingsRow>
        <Separator />
        <SettingsRow
          id={`${prefix}-two-factor`}
          title="Two-factor authentication"
          badge={<SettingsBadge>Recommended</SettingsBadge>}
          description="Ask for a second step when signing in."
        >
          <Switch
            id={`${prefix}-two-factor`}
            checked={model.security.twoFactor}
            onCheckedChange={(next) => model.updateSecurity("twoFactor", next)}
          />
        </SettingsRow>
        <Separator />
        <SettingsRow
          id={`${prefix}-second-step`}
          title="Second step"
          description="How the second step reaches you."
        >
          <SettingsChoice
            id={`${prefix}-second-step`}
            value={model.security.secondStep}
            options={["Authenticator app"]}
            onChange={(next) => model.updateSecurity("secondStep", next)}
          />
        </SettingsRow>
        <Separator />
        <SettingsRow
          id={`${prefix}-passkey`}
          title="Passkey"
          badge={<SettingsBadge plain>Passwordless</SettingsBadge>}
          description="Sign in with this device instead of a password."
        >
          <Switch
            id={`${prefix}-passkey`}
            checked={model.security.passkey}
            onCheckedChange={(next) => model.updateSecurity("passkey", next)}
          />
        </SettingsRow>
      </Group>
      <Group
        title="Activity"
        open={model.openGroups.activity}
        onOpenChange={(open) => model.setGroupOpen("activity", open)}
      >
        <SettingsRow
          id={`${prefix}-alerts`}
          title="New sign-in alerts"
          description="Email you when a new device signs in."
        >
          <Switch
            id={`${prefix}-alerts`}
            checked={model.security.signInAlerts}
            onCheckedChange={(next) => model.updateSecurity("signInAlerts", next)}
          />
        </SettingsRow>
        <Separator />
        <SettingsRow
          title="Active sessions"
          description="Signed in on 3 devices, this one included."
        >
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              model.setStatus(
                "This preview has no account sessions to sign out. No device session was changed.",
              )
            }
          >
            Sign out others
          </Button>
        </SettingsRow>
      </Group>
      {model.status && (
        <p className="aas-local-status" role="status">
          {model.status}
        </p>
      )}
    </div>
  );
}

function Preferences({ model, prefix }: { model: AtlasAccountSettingsModel; prefix: string }) {
  const value = model.preferences;
  const definitions = {
    general: [
      {
        id: "defaultView",
        label: "Default view",
        description: "Choose which page opens when you sign in.",
        options: atlasPreferenceOptions.defaultView,
      },
      {
        id: "dateFormat",
        label: "Date format",
        description: "How dates appear across the app.",
        options: atlasPreferenceOptions.dateFormat,
      },
      {
        id: "firstDay",
        label: "First day of week",
        description: "Used by calendars and date pickers.",
        options: atlasPreferenceOptions.firstDay,
      },
      {
        id: "autoSaveDrafts",
        label: "Auto-save drafts",
        description: "Keep unsaved edits as you work.",
        type: "switch",
        badge: <SettingsBadge>Recommended</SettingsBadge>,
      },
      {
        id: "richTextEditing",
        label: "Rich text editing",
        description: "Show the formatting toolbar in text fields.",
        type: "switch",
        badge: <SettingsBadge plain>Editor</SettingsBadge>,
      },
    ],
    display: [
      {
        id: "colorTheme",
        label: "Color theme",
        description: "Applies everywhere, including the sidebar toggle.",
        options: atlasPreferenceOptions.colorTheme,
      },
      {
        id: "sidebarPosition",
        label: "Sidebar position",
        description: "Place the navigation on either side.",
        options: atlasPreferenceOptions.sidebarPosition,
      },
      {
        id: "reduceAnimations",
        label: "Reduce animations",
        description: "Minimize motion across the interface.",
        type: "switch",
        badge: (
          <Badge variant="warning-light" size="sm" className="aas-badge">
            Accessibility
          </Badge>
        ),
      },
      {
        id: "showTooltips",
        label: "Show tooltips",
        description: "Reveal helpful hints on hover.",
        type: "switch",
      },
    ],
  } satisfies Record<string, SettingsFieldDefinition[]>;
  const values: SettingsValues = { ...value };
  return (
    <div className="aas-groups">
      {(["general", "display"] as const).map((group) => (
        <Group
          key={group}
          title={group === "general" ? "General" : "Display"}
          open={model.openGroups[group]}
          onOpenChange={(open) => model.setGroupOpen(group, open)}
        >
          {definitions[group].map((field, index) => (
            <Fragment key={field.id}>
              {index > 0 && <Separator />}
              <SettingsFields
                fields={[field]}
                value={values}
                idPrefix={prefix}
                onValueChange={(key, next) => {
                  switch (key) {
                    case "autoSaveDrafts":
                    case "richTextEditing":
                    case "reduceAnimations":
                    case "showTooltips":
                      model.updatePreference(key, Boolean(next));
                      break;
                    case "colorTheme":
                      if (next === "System" || next === "Light" || next === "Dark")
                        model.updatePreference(key, next);
                      break;
                    case "sidebarPosition":
                      if (next === "Left" || next === "Right") model.updatePreference(key, next);
                      break;
                    case "defaultView":
                    case "dateFormat":
                    case "firstDay":
                      model.updatePreference(key, String(next));
                      break;
                  }
                }}
              />
            </Fragment>
          ))}
        </Group>
      ))}
    </div>
  );
}

export function AtlasAccountSettings({
  model,
  sectionHref,
  onSectionChange,
}: {
  model: AtlasAccountSettingsModel;
  sectionHref: (section: AtlasAccountSection) => string;
  onSectionChange?: (section: AtlasAccountSection) => void;
}) {
  const prefix = `atlas-account-${useId().replaceAll(":", "")}`;
  return (
    <section
      className="atlas-account-settings"
      data-reduce-motion={model.preferences.reduceAnimations}
    >
      <header className="aas-heading">
        <h1>Account</h1>
        <p>Manage your profile, sign-in security, and app preferences.</p>
      </header>
      <nav aria-label="Account sections" className="aas-nav">
        {atlasAccountSections.map((section) => (
          <Button asChild variant="ghost" key={section.id}>
            <a
              href={sectionHref(section.id)}
              aria-current={model.section === section.id ? "page" : undefined}
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
                model.setSection(section.id);
                onSectionChange?.(section.id);
              }}
            >
              {section.label}
            </a>
          </Button>
        ))}
      </nav>
      {model.section === "profile" ? (
        <Profile model={model} prefix={prefix} />
      ) : model.section === "security" ? (
        <Security model={model} prefix={prefix} />
      ) : (
        <Preferences model={model} prefix={prefix} />
      )}
    </section>
  );
}
