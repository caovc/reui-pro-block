import { useEffect, useRef, useState } from "react";
import { Upload, UserRound, X } from "lucide-react";
import {
  SettingsFields,
  SettingsRow,
  type SettingsFieldDefinition,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { LocalAvatarUpload } from "@/blocks/application/dialog-variants/workspace/free/avatar-upload";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AccountCard,
  AccountFieldRows,
  LucentBillingSection,
  LucentPreferencesSection,
} from "./lucent-account-sections";
import type { LucentAccountModel } from "./lucent-account-model";
import "./lucent-account.css";

type AccountPage = "profile" | "billing" | "preferences";

const profileRoles = ["Platform Lead", "Site Reliability Engineer", "Release Manager", "Developer"];

const profileTimezones = [
  "UTC-8 (Pacific Time)",
  "UTC-5 (Eastern Time)",
  "UTC+0 (London)",
  "UTC+1 (Berlin)",
  "UTC+9 (Tokyo)",
];

function LucentProfileSection({ model }: { model: LucentAccountModel }) {
  const [noticeVisible, setNoticeVisible] = useState(true);
  const roleTrigger = useRef<HTMLButtonElement>(null);
  const { releaseAvatarPreviews } = model;
  useEffect(() => () => releaseAvatarPreviews(), [releaseAvatarPreviews]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(model.profile.email ?? ""));
  const identityFields: SettingsFieldDefinition[] = [
    {
      id: "fullName",
      label: "Full name",
      description: "Used across the workspace.",
      error: String(model.profile.fullName ?? "").trim() ? undefined : "Enter your full name.",
    },
    {
      id: "email",
      label: "Email address",
      description: "Primary sign-in email.",
      type: "email",
      badge: (
        <Badge variant="success-outline" aria-hidden="true">
          Verified
        </Badge>
      ),
      error: emailValid ? undefined : "Enter a valid email address.",
    },
    {
      id: "username",
      label: "Username",
      description: "Visible in mentions and links.",
      prefix: "@",
    },
  ];

  return (
    <section aria-label="Profile">
      {noticeVisible && (
        <Alert variant="warning" className="lucent-account-profile-notice">
          <UserRound aria-hidden="true" />
          <AlertTitle>Keep your profile current.</AlertTitle>
          <AlertDescription>
            Add a photo and keep your role and time zone current — the on-call schedule reads both.
          </AlertDescription>
          <AlertAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNoticeVisible(false)}
            >
              Dismiss
            </Button>
            <Button type="button" size="sm" onClick={() => roleTrigger.current?.focus()}>
              Update
            </Button>
          </AlertAction>
        </Alert>
      )}
      <AccountCard
        title="My profile"
        description="Public account details"
        groupLabel="Profile fields"
        groupDescription="Update your personal profile details."
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={model.cancelProfile}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={model.profileInvalid || model.avatarPending || Boolean(model.avatarError)}
              onClick={model.saveProfile}
            >
              Save changes
            </Button>
          </>
        }
      >
        <SettingsRow
          title="Photo"
          description="Shown on incidents, approvals and the on-call roster."
        >
          <LocalAvatarUpload
            key={model.avatarVersion}
            className="lucent-account-avatar"
            label="Upload profile image"
            defaultAvatar={model.avatar}
            onFileChange={model.onAvatarFileChange}
            onDefaultRemove={model.removeAvatar}
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
          />
          {model.avatarPending && <span role="status">Reading image…</span>}
          {model.avatarError && (
            <span className="lucent-account-avatar-error" role="alert">
              {model.avatarError}
            </span>
          )}
        </SettingsRow>
        <FieldSeparator />
        <AccountFieldRows
          fields={identityFields}
          values={model.profile}
          onChange={model.changeProfile}
          idPrefix="lucent-account-profile"
        />
        <FieldSeparator />
        <SettingsRow
          title="Profile details"
          description="Public details shared across the workspace."
        >
          <FieldSet
            className="lucent-account-details"
            aria-describedby="lucent-account-profile-details-description"
          >
            <FieldLegend className="sr-only">Profile details</FieldLegend>
            <FieldDescription id="lucent-account-profile-details-description" className="sr-only">
              Public profile and workspace defaults.
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="lucent-account-profile-role">Role</FieldLabel>
                <Select
                  value={String(model.profile.role)}
                  onValueChange={(value) => model.changeProfile("role", value)}
                >
                  <SelectTrigger id="lucent-account-profile-role" ref={roleTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="reui-reference">
                    <SelectGroup>
                      {profileRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="lucent-account-profile-timezone">Time zone</FieldLabel>
                <Select
                  value={String(model.profile.timezone)}
                  onValueChange={(value) => model.changeProfile("timezone", value)}
                >
                  <SelectTrigger id="lucent-account-profile-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="reui-reference">
                    <SelectGroup>
                      {profileTimezones.map((timezone) => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <SettingsFields
                fields={[{ id: "website", label: "Website", prefix: "https://" }]}
                value={model.profile}
                onValueChange={model.changeProfile}
                idPrefix="lucent-account-profile"
              />
            </FieldGroup>
          </FieldSet>
        </SettingsRow>
        <FieldSeparator />
        <AccountFieldRows
          fields={[
            {
              id: "bio",
              label: "Bio",
              description: "Short profile summary.",
              type: "textarea",
              maxLength: 1200,
            },
          ]}
          values={model.profile}
          onChange={model.changeProfile}
          idPrefix="lucent-account-profile"
        />
      </AccountCard>
    </section>
  );
}

export function LucentAccountPage({
  page,
  onPageChange,
  model,
}: {
  page: AccountPage;
  onPageChange: (page: AccountPage) => void;
  model: LucentAccountModel;
}) {
  return (
    <div className="lucent-account-page">
      <h1 className="sr-only">Account</h1>
      <Tabs
        value={page}
        onValueChange={(value) => {
          if (value === "profile" || value === "billing" || value === "preferences") {
            onPageChange(value);
          }
        }}
      >
        <TabsList aria-label="Account sections">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <LucentProfileSection model={model} />
        </TabsContent>
        <TabsContent value="billing">
          <LucentBillingSection model={model} />
        </TabsContent>
        <TabsContent value="preferences">
          <LucentPreferencesSection model={model} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
