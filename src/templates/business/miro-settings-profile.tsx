import { Upload, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  SettingsFields,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { LocalAvatarUpload } from "@/blocks/application/dialog-variants/workspace/free/avatar-upload";
import { demoAvatar } from "@/lib/demo-artwork";
import {
  initialMiroProfile,
  miroRoles,
  miroTimeZones,
  type MiroProfileField,
} from "./miro-settings-data";
import type { MiroSettingsModel } from "./miro-settings-model";

export function MiroSettingsProfile({ model }: { model: MiroSettingsModel }) {
  const draft = model.profileDraft;
  const avatar =
    draft.avatar === "default" ? demoAvatar(draft.fullName) : draft.avatar || undefined;
  const errors = model.profileErrors;
  const value = {
    fullName: draft.fullName,
    email: draft.email,
    username: draft.username,
    role: draft.role,
    timeZone: draft.timeZone,
    website: draft.website,
  };
  const update = (field: string, next: string | boolean) =>
    model.setProfileField(field as MiroProfileField, String(next));
  return (
    <form
      aria-label="Profile fields"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        model.saveProfile();
      }}
    >
      <Frame className="miro-settings-card">
        <FrameHeader>
          <FrameTitle>My profile</FrameTitle>
          <FrameDescription>Public account details</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <SettingsRow title="Photo" description="Shown in comments and mentions.">
            <LocalAvatarUpload
              key={model.avatarRevision}
              defaultAvatar={avatar}
              label="Upload profile image"
              changeLabel={
                <>
                  <Upload aria-hidden className="size-3.5" />
                  Change
                </>
              }
              removeLabel={
                <>
                  <X aria-hidden className="size-3.5" />
                  Remove
                </>
              }
              onDefaultRemove={() => {
                void model.selectAvatar(null);
              }}
              onFileChange={(file) => {
                if (file?.file instanceof File) void model.selectAvatar(file.file);
                else if (!file) void model.selectAvatar(null);
              }}
            />
          </SettingsRow>
          <SettingsFields
            idPrefix="miro-profile"
            value={value}
            onValueChange={update}
            fields={[
              {
                id: "fullName",
                label: "Full name",
                description: "Used across the workspace.",
                error: errors.fullName,
              },
              {
                id: "email",
                label: "Email address",
                description: "Primary sign-in email.",
                type: "email",
                error: errors.email,
                badge:
                  draft.email === initialMiroProfile.email ? (
                    <Badge variant="secondary" className="miro-verified">
                      Verified
                    </Badge>
                  ) : undefined,
              },
              {
                id: "username",
                label: "Username",
                description: "Visible in mentions and links.",
                prefix: "@",
                error: errors.username,
              },
            ]}
          />
          <SettingsRow
            title="Profile details"
            description="Public details shared across the workspace."
          >
            <div className="miro-profile-details" role="group" aria-label="Profile details">
              <SettingsFields
                idPrefix="miro-profile-details"
                value={value}
                onValueChange={update}
                fields={[
                  { id: "role", label: "Role", options: miroRoles, error: errors.role },
                  {
                    id: "timeZone",
                    label: "Time zone",
                    options: miroTimeZones,
                    error: errors.timeZone,
                  },
                  { id: "website", label: "Website", prefix: "https://", error: errors.website },
                ]}
              />
            </div>
          </SettingsRow>
          <SettingsRow
            id="miro-profile-bio"
            title="Bio"
            description="Short profile summary."
            invalid={Boolean(errors.bio)}
          >
            <Textarea
              id="miro-profile-bio"
              aria-describedby="miro-profile-bio-description"
              value={draft.bio}
              maxLength={1200}
              placeholder="A line about you, for the practice's own records."
              onChange={(event) => model.setProfileField("bio", event.target.value)}
              className="min-h-24"
            />
            {errors.bio && <FieldError>{errors.bio}</FieldError>}
          </SettingsRow>
        </FramePanel>
        <FrameFooter className="miro-settings-actions flex-row">
          <Button type="button" variant="outline" size="sm" onClick={model.cancelProfile}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={model.avatarPending}>
            Save changes
          </Button>
        </FrameFooter>
      </Frame>
    </form>
  );
}
