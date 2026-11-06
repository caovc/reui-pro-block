import type { ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Card,
  CardFooter,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { SettingsChoice } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { MiroSettingsField, MiroSettingsFields } from "./miro-settings-fields";
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
      <Card className="miro-settings-card">
        <CardHeader>
          <CardTitle>My profile</CardTitle>
          <CardDescription>Public account details</CardDescription>
        </CardHeader>
        <CardContent>
          <MiroSettingsFields
            legend="Profile fields"
            description="Update your personal profile details."
          >
            <MiroSettingsField title="Photo" description="Shown in comments and mentions.">
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
            </MiroSettingsField>
            {(
              [
                { id: "fullName", label: "Full name", description: "Used across the workspace." },
                { id: "email", label: "Email address", description: "Primary sign-in email." },
                {
                  id: "username",
                  label: "Username",
                  description: "Visible in mentions and links.",
                },
              ] as const
            ).map((field) => {
              const id = `miro-profile-${field.id}`;
              const error = errors[field.id];
              const inputProps = {
                id,
                value: value[field.id],
                maxLength: 160,
                "aria-invalid": Boolean(error),
                "aria-describedby": `${id}-description${error ? ` ${id}-error` : ""}`,
                onChange: (event: ChangeEvent<HTMLInputElement>) =>
                  update(field.id, event.target.value),
              };
              return (
                <MiroSettingsField
                  key={field.id}
                  id={id}
                  title={field.label}
                  description={field.description}
                  invalid={Boolean(error)}
                  badge={
                    field.id === "email" && draft.email === initialMiroProfile.email ? (
                      <Badge variant="secondary" className="miro-verified">
                        Verified
                      </Badge>
                    ) : undefined
                  }
                >
                  {field.id === "username" ? (
                    <InputGroup>
                      <InputGroupAddon>@</InputGroupAddon>
                      <InputGroupInput {...inputProps} />
                    </InputGroup>
                  ) : (
                    <Input {...inputProps} type={field.id === "email" ? "email" : "text"} />
                  )}
                  {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
                </MiroSettingsField>
              );
            })}
            <MiroSettingsField
              title="Profile details"
              description="Public details shared across the workspace."
            >
              <FieldSet className="miro-profile-details" aria-label="Profile details">
                <FieldLegend className="sr-only">Profile details</FieldLegend>
                <FieldDescription className="sr-only">
                  Public profile and workspace defaults.
                </FieldDescription>
                <FieldGroup className="miro-profile-details-group">
                  {(
                    [
                      { id: "role", label: "Role", options: miroRoles },
                      { id: "timeZone", label: "Time zone", options: miroTimeZones },
                      { id: "website", label: "Website", options: undefined },
                    ] as const
                  ).map((field) => {
                    const id = `miro-profile-details-${field.id}`;
                    const error = errors[field.id];
                    const describedBy = error ? `${id}-error` : undefined;
                    return (
                      <Field key={field.id} data-invalid={Boolean(error)}>
                        <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                        {field.options ? (
                          <SettingsChoice
                            id={id}
                            value={value[field.id]}
                            options={field.options}
                            invalid={Boolean(error)}
                            describedBy={describedBy}
                            onChange={(next) => update(field.id, next)}
                          />
                        ) : (
                          <InputGroup>
                            <InputGroupAddon>https://</InputGroupAddon>
                            <InputGroupInput
                              id={id}
                              value={value[field.id]}
                              maxLength={160}
                              aria-invalid={Boolean(error)}
                              aria-describedby={describedBy}
                              onChange={(event) => update(field.id, event.target.value)}
                            />
                          </InputGroup>
                        )}
                        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
                      </Field>
                    );
                  })}
                </FieldGroup>
              </FieldSet>
            </MiroSettingsField>
            <MiroSettingsField
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
            </MiroSettingsField>
          </MiroSettingsFields>
        </CardContent>
        <CardFooter className="miro-settings-actions flex-row">
          <Button type="button" variant="outline" size="sm" onClick={model.cancelProfile}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={model.avatarPending}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
