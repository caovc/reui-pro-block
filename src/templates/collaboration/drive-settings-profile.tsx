import type { Value as PhoneValue } from "react-phone-number-input";
import { useState } from "react";
import { Badge } from "@/components/reui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  SettingsChoice,
  SettingsFields,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { DriveCardActions, DriveLocalUpload, DriveSettingsCard } from "./drive-settings-components";
import { DrivePhoneInput, DriveRichChoice, DriveTimezone } from "./drive-settings-free";
import {
  driveDigestOptions,
  driveLandingOptions,
  driveLanguageOptions,
} from "./drive-settings-options";
import type { DriveSettingsModel } from "./drive-settings-model";

export function DriveProfileSettings({ model }: { model: DriveSettingsModel }) {
  const [details, setDetails] = useState(() => ({ ...model.profile }));
  const [preferences, setPreferences] = useState(() => ({ ...model.profilePreferences }));
  const update = (id: string, value: string | boolean) =>
    setDetails((current) => ({ ...current, [id]: value }));
  return (
    <>
      <DriveSettingsCard
        title="Profile Details"
        description="Personal account info."
        footer={
          <DriveCardActions
            onCancel={() => setDetails({ ...model.profile })}
            onSave={() => model.saveProfile(details)}
          />
        }
      >
        <SettingsRow title="Profile Photo" description="Shown in comments and mentions.">
          <DriveLocalUpload />
        </SettingsRow>
        <SettingsFields
          fields={[
            {
              id: "fullName",
              controlId: "drive-profile-name",
              label: "Full Name",
              description: "Used across Bricklane.",
            },
          ]}
          value={{ ...details }}
          onValueChange={update}
        />
        <SettingsRow
          id="drive-profile-email"
          title="Email Address"
          description="Primary sign-in email."
          badge={
            <Badge variant="success-light" size="sm">
              Verified
            </Badge>
          }
        >
          <Input
            id="drive-profile-email"
            type="email"
            value={details.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </SettingsRow>
        <SettingsRow
          id="drive-profile-phone"
          title="Phone Number"
          description="Recovery and urgent alerts."
        >
          <DrivePhoneInput
            id="drive-profile-phone"
            variant="sm"
            placeholder="Enter phone number"
            defaultCountry="US"
            value={details.phone as PhoneValue}
            onChange={(value) => update("phone", value)}
            popupClassName="reui-reference"
          />
        </SettingsRow>
        <SettingsFields
          fields={[
            {
              id: "username",
              controlId: "drive-profile-username",
              label: "Username",
              description: "Used in mentions and links.",
              prefix: "@",
            },
          ]}
          value={{ ...details }}
          onValueChange={update}
        />
        <SettingsRow title="Public Details" description="Shown across Bricklane.">
          <FieldGroup className="ds-public-details">
            <p className="ds-public-title sr-only">Public details</p>
            <p className="ds-muted sr-only">Public profile and workspace defaults.</p>
            <Field>
              <FieldLabel htmlFor="drive-profile-role">Role</FieldLabel>
              <SettingsChoice
                id="drive-profile-role"
                value={details.role}
                options={["Workspace Owner", "Creative Director", "Design Systems"]}
                onChange={(value) => update("role", value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="drive-profile-timezone">Time zone</FieldLabel>
              <DriveTimezone
                id="drive-profile-timezone"
                value={details.timezone}
                onChange={(value) => update("timezone", value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="drive-profile-website">Website</FieldLabel>
              <InputGroup>
                <InputGroupAddon>https://</InputGroupAddon>
                <InputGroupInput
                  id="drive-profile-website"
                  value={details.website}
                  onChange={(event) => update("website", event.target.value)}
                />
              </InputGroup>
            </Field>
          </FieldGroup>
        </SettingsRow>
        <SettingsRow id="drive-profile-bio" title="Bio" description="Short profile summary.">
          <Textarea
            id="drive-profile-bio"
            value={details.bio}
            onChange={(event) => update("bio", event.target.value)}
          />
        </SettingsRow>
      </DriveSettingsCard>
      <DriveSettingsCard
        title="Profile Preferences"
        description="Default workspace behavior."
        footer={
          <DriveCardActions
            onCancel={() => setPreferences({ ...model.profilePreferences })}
            onSave={() => model.saveProfilePreferences(preferences)}
          />
        }
      >
        <SettingsRow id="drive-profile-language" title="Language">
          <DriveRichChoice
            id="drive-profile-language"
            value={preferences.language}
            options={driveLanguageOptions}
            onChange={(language) => setPreferences((current) => ({ ...current, language }))}
          />
        </SettingsRow>
        <SettingsRow
          id="drive-profile-landing"
          title="Landing View"
          description="Which view the drive opens on."
        >
          <DriveRichChoice
            id="drive-profile-landing"
            value={preferences.landingView}
            options={driveLandingOptions}
            onChange={(landingView) => setPreferences((current) => ({ ...current, landingView }))}
          />
        </SettingsRow>
        <SettingsRow id="drive-profile-digest" title="Digest Cadence">
          <DriveRichChoice
            id="drive-profile-digest"
            value={preferences.digest}
            options={driveDigestOptions}
            onChange={(digest) => setPreferences((current) => ({ ...current, digest }))}
          />
        </SettingsRow>
        <SettingsRow
          id="drive-profile-briefing"
          title="Daily Briefing"
          description="Morning recap before meetings."
        >
          <Switch
            id="drive-profile-briefing"
            checked={preferences.dailyBriefing}
            onCheckedChange={(dailyBriefing) =>
              setPreferences((current) => ({ ...current, dailyBriefing }))
            }
          />
        </SettingsRow>
      </DriveSettingsCard>
    </>
  );
}
