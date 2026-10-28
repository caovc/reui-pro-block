// Actual Pro settings presentation and existing free ReUI compositions.
// Existing dependency licenses remain in src/components/reui/REUI-LICENSE.txt.
import { Fragment, useId, useMemo } from "react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { Upload, X } from "lucide-react";
import type { Value as PhoneValue } from "react-phone-number-input";
import {
  SettingsChoice,
  SettingsFields,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { LocalAvatarUpload } from "@/blocks/application/dialog-variants/workspace/free/avatar-upload";
import { Badge } from "@/components/reui/badge";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DriveSettingsCard } from "@/templates/collaboration/drive-settings-components";
import { DriveRichChoice, DriveTimezone } from "@/templates/collaboration/drive-settings-free";
import { PhoneInput } from "@/templates/collaboration/drive-settings-free/phone-input";
import {
  verveAccountSections,
  verveChannels,
  verveDigestOptions,
  verveLandingOptions,
  verveLanguageOptions,
  verveNotificationCategories,
  verveRoleOptions,
  type VerveAccountPreferences,
  type VerveAccountSection,
  type VerveNotificationCategory,
  type VerveNotificationRow,
} from "./verve-account-settings-data";
import type { VerveAccountSettingsModel } from "./verve-account-settings-model";
import "./verve-account-settings.css";

function Profile({ model, prefix }: { model: VerveAccountSettingsModel; prefix: string }) {
  const draft = model.profileDraft;
  return (
    <div className="vs-cards">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          model.saveProfile();
        }}
      >
        <DriveSettingsCard
          title="Profile details"
          description="Personal account info."
          className="vs-profile-card"
          dense={false}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={model.cancelProfile}
                disabled={
                  !model.profileDirty && !model.profileImage.pending && !model.profileImage.error
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !model.profileDirty ||
                  model.profileImage.pending ||
                  Boolean(model.profileImage.error)
                }
              >
                Save changes
              </Button>
            </>
          }
        >
          <SettingsRow
            title="Profile photo"
            description="Shown in comments and mentions."
            invalid={Boolean(model.profileImage.error)}
          >
            <LocalAvatarUpload
              key={model.profileImage.revision}
              label="Upload profile photo"
              className="vs-upload"
              defaultAvatar={draft.avatar ?? undefined}
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
              onFileChange={model.profileImage.change}
              onDefaultRemove={model.profileImage.remove}
            />
            {model.profileImage.pending && (
              <span role="status" className="vs-helper">
                Preparing image…
              </span>
            )}
            {model.profileImage.error && <FieldError>{model.profileImage.error}</FieldError>}
          </SettingsRow>
          <SettingsFields
            idPrefix={prefix}
            fields={[
              {
                id: "fullName",
                label: "Full name",
                description: "Used across Bricklane.",
                error: model.profileErrors.fullName,
              },
              {
                id: "email",
                label: "Email address",
                description: "Primary sign-in email.",
                type: "email",
                error: model.profileErrors.email,
                badge:
                  model.profile.emailVerified && draft.email === model.profile.email ? (
                    <Badge variant="success-light" size="sm">
                      Verified
                    </Badge>
                  ) : undefined,
              },
            ]}
            value={{ fullName: draft.fullName, email: draft.email }}
            onValueChange={(id, next) => {
              if (id === "fullName" || id === "email") model.updateProfile(id, String(next));
            }}
          />
          <SettingsRow
            id={`${prefix}-phone`}
            title="Phone number"
            description="Recovery and urgent alerts."
          >
            <PhoneInput
              id={`${prefix}-phone`}
              className="vs-phone-input"
              aria-describedby={`${prefix}-phone-description`}
              variant="sm"
              placeholder="Enter phone number"
              defaultCountry="US"
              value={draft.phone as PhoneValue}
              onChange={(value) => model.updateProfile("phone", value)}
              popupClassName="reui-reference vs-phone-popup"
            />
          </SettingsRow>
          <SettingsFields
            idPrefix={prefix}
            fields={[
              {
                id: "username",
                label: "Username",
                description: "Used in mentions and links.",
                prefix: "@",
              },
            ]}
            value={{ username: draft.username }}
            onValueChange={(_, next) => model.updateProfile("username", String(next))}
          />
          <SettingsRow title="Public details" description="Shown across Bricklane.">
            <FieldGroup className="vs-public-details" aria-label="Public details">
              <Field>
                <FieldLabel htmlFor={`${prefix}-role`}>Role</FieldLabel>
                <SettingsChoice
                  id={`${prefix}-role`}
                  value={draft.role}
                  options={verveRoleOptions}
                  onChange={(value) => model.updateProfile("role", value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${prefix}-timezone`}>Time zone</FieldLabel>
                <DriveTimezone
                  id={`${prefix}-timezone`}
                  value={draft.timezone}
                  onChange={(value) => model.updateProfile("timezone", value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${prefix}-website`}>Website</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>https://</InputGroupAddon>
                  <InputGroupInput
                    id={`${prefix}-website`}
                    value={draft.website}
                    onChange={(event) => model.updateProfile("website", event.target.value)}
                  />
                </InputGroup>
              </Field>
            </FieldGroup>
          </SettingsRow>
          <SettingsRow id={`${prefix}-bio`} title="Bio" description="Short profile summary.">
            <Textarea
              id={`${prefix}-bio`}
              aria-describedby={`${prefix}-bio-description`}
              value={draft.bio}
              maxLength={2000}
              onChange={(event) => model.updateProfile("bio", event.target.value)}
            />
          </SettingsRow>
        </DriveSettingsCard>
      </form>
      <DriveSettingsCard title="Profile preferences" description="Default workspace behavior.">
        <SettingsRow id={`${prefix}-language`} title="Language">
          <DriveRichChoice
            id={`${prefix}-language`}
            value={model.profilePreferences.language}
            options={verveLanguageOptions}
            onChange={(value) => model.updateProfilePreference("language", value)}
          />
        </SettingsRow>
        <SettingsRow id={`${prefix}-landing`} title="Landing view">
          <DriveRichChoice
            id={`${prefix}-landing`}
            value={model.profilePreferences.landingView}
            options={verveLandingOptions}
            onChange={(value) => model.updateProfilePreference("landingView", value)}
          />
        </SettingsRow>
        <SettingsRow id={`${prefix}-digest`} title="Digest cadence">
          <DriveRichChoice
            id={`${prefix}-digest`}
            value={model.profilePreferences.digest}
            options={verveDigestOptions}
            onChange={(value) => model.updateProfilePreference("digest", value)}
          />
        </SettingsRow>
        <SettingsRow
          id={`${prefix}-briefing`}
          title="Daily briefing"
          description="Morning recap before meetings."
        >
          <Switch
            id={`${prefix}-briefing`}
            aria-describedby={`${prefix}-briefing-description`}
            checked={model.profilePreferences.dailyBriefing}
            onCheckedChange={(value) => model.updateProfilePreference("dailyBriefing", value)}
          />
        </SettingsRow>
      </DriveSettingsCard>
      <p className="vs-demo-note">
        Additional role and preference choices are Bricklane demo options.
      </p>
    </div>
  );
}

const preferenceRows: {
  id: keyof VerveAccountPreferences;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    id: "workspaceSearch",
    title: "Appear in workspace search",
    description: "Let teammates find you in @-mentions and assignee pickers.",
    badge: "Pro",
  },
  {
    id: "readReceipts",
    title: "Read receipts",
    description: "Show teammates when you have seen their comments and messages.",
    badge: "Pro",
  },
  {
    id: "activityStatus",
    title: "Activity status",
    description: "Show when you are active so teammates know you are around.",
  },
  {
    id: "publicProfile",
    title: "Public profile card",
    description: "Let teammates view your role, time zone and bio.",
  },
  {
    id: "usageAnalytics",
    title: "Usage analytics",
    description: "Share anonymous product usage to help improve Bricklane.",
  },
];
function Preferences({ model, prefix }: { model: VerveAccountSettingsModel; prefix: string }) {
  return (
    <DriveSettingsCard
      title="Preferences"
      description="Control how you appear to teammates and what Bricklane sends you."
      className="vs-preferences-card"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={!model.preferencesDirty}
            onClick={model.cancelPreferences}
          >
            Cancel
          </Button>
          <Button type="button" disabled={!model.preferencesDirty} onClick={model.savePreferences}>
            Save changes
          </Button>
        </>
      }
    >
      <ItemGroup className="vs-preference-items">
        {preferenceRows.map((row, index) => (
          <Fragment key={row.id}>
            {index > 0 && <ItemSeparator />}
            {index === 3 && (
              <>
                <Item role="listitem">
                  <ItemContent>
                    <ItemTitle>
                      <h2>Calendar sync</h2>
                      <Badge variant="outline" size="sm">
                        Beta
                      </Badge>
                    </ItemTitle>
                    <ItemDescription>
                      Connect your calendar so Bricklane can suggest follow-up times.
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        model.setStatus(
                          "Calendar linking needs a connected account. No external calendar was connected in this preview.",
                        )
                      }
                    >
                      Connect
                    </Button>
                  </ItemActions>
                </Item>
                <ItemSeparator />
              </>
            )}
            <Item role="listitem">
              <ItemContent>
                <ItemTitle>
                  <h2 id={`${prefix}-${row.id}-title`}>{row.title}</h2>
                  {row.badge && (
                    <Badge variant="outline" size="sm">
                      {row.badge}
                    </Badge>
                  )}
                </ItemTitle>
                <ItemDescription id={`${prefix}-${row.id}-description`}>
                  {row.description}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch
                  id={`${prefix}-${row.id}`}
                  aria-labelledby={`${prefix}-${row.id}-title`}
                  aria-describedby={`${prefix}-${row.id}-description`}
                  checked={model.preferenceDraft[row.id]}
                  onCheckedChange={(value) => model.updatePreference(row.id, value)}
                />
              </ItemActions>
            </Item>
          </Fragment>
        ))}
        <ItemSeparator />
        <Item role="listitem">
          <ItemContent>
            <ItemTitle>
              <h2>All email notifications</h2>
              <Badge variant="outline" size="sm">
                Beta
              </Badge>
            </ItemTitle>
            <ItemDescription>
              Turn every deal, mention and report email on or off at once.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              type="button"
              variant="outline"
              aria-pressed={model.emailBulkDraft === false}
              onClick={() => model.setEmailBulkDraft(false)}
            >
              Disable all
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-pressed={model.emailBulkDraft === true}
              onClick={() => model.setEmailBulkDraft(true)}
            >
              Enable all
            </Button>
          </ItemActions>
        </Item>
      </ItemGroup>
      {model.emailBulkDraft !== null && (
        <p className="vs-inline-notice" role="status">
          Email changes will apply to all categories when you save changes.
        </p>
      )}
    </DriveSettingsCard>
  );
}

function NotificationMatrix({
  model,
  category,
  group,
  rows,
}: {
  model: VerveAccountSettingsModel;
  category: VerveNotificationCategory;
  group: string;
  rows: VerveNotificationRow[];
}) {
  const { updateNotification } = model;
  const columns = useMemo<ColumnDef<DataGridFeatures, VerveNotificationRow>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: group,
        size: 420,
        minSize: 190,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => row.original.title,
      },
      ...verveChannels.map((channel): ColumnDef<DataGridFeatures, VerveNotificationRow> => ({
        id: channel.id,
        header: channel.label,
        size: 90,
        minSize: 70,
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: "text-center", cellClassName: "text-center" },
        cell: ({ row }) => (
          <Checkbox
            aria-label={`${row.original.title} via ${channel.label}`}
            checked={row.original.channels[channel.id]}
            onCheckedChange={(value) =>
              updateNotification(category, row.original.id, channel.id, value === true)
            }
          />
        ),
      })),
    ],
    [category, group, updateNotification],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 100 } },
  });
  return (
    <section aria-label={group} className="vs-notification-matrix">
      <DataGrid
        table={table}
        recordCount={rows.length}
        tableLayout={{
          dense: true,
          width: "auto",
          rowBorder: true,
          headerBorder: true,
          headerBackground: false,
        }}
        tableClassNames={{
          base: "vs-matrix-table",
          headerRow: "vs-matrix-header",
          bodyRow: "vs-matrix-row",
        }}
      >
        <DataGridContainer className="rounded-none border-0">
          <DataGridScrollArea orientation="horizontal">
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>
      </DataGrid>
    </section>
  );
}
function Notifications({ model }: { model: VerveAccountSettingsModel }) {
  const category = model.notificationCategory;
  const rows = model.notifications[category];
  const groups = [...new Set(rows.map((row) => row.group))];
  return (
    <Tabs
      value={category}
      onValueChange={(value) => {
        if (verveNotificationCategories.some((item) => item.id === value))
          model.setNotificationCategory(value as VerveNotificationCategory);
      }}
      className="vs-notifications"
    >
      <TabsList variant="line" aria-label="Notification categories">
        {verveNotificationCategories.map((item) => (
          <TabsTrigger value={item.id} key={item.id}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {verveNotificationCategories.map((item) => (
        <TabsContent value={item.id} key={item.id}>
          {!item.observed && <p className="vs-demo-note">Local demo notification preferences.</p>}
          {item.id === category &&
            groups.map((group) => (
              <NotificationMatrix
                key={group}
                model={model}
                category={category}
                group={group}
                rows={rows.filter((row) => row.group === group)}
              />
            ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
export function VerveAccountSettings({
  model,
  onSectionChange,
}: {
  model: VerveAccountSettingsModel;
  onSectionChange?: (section: VerveAccountSection) => void;
}) {
  const prefix = `verve-account-${useId().replaceAll(":", "")}`;
  return (
    <section className="verve-settings verve-account-settings">
      <Tabs
        value={model.section}
        onValueChange={(value) => {
          if (verveAccountSections.some((section) => section.id === value)) {
            const section = value as VerveAccountSection;
            model.setSection(section);
            onSectionChange?.(section);
          }
        }}
        className="vs-account-tabs"
      >
        <TabsList aria-label="Account settings">
          {verveAccountSections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="profile">
          <h1 className="sr-only">Profile</h1>
          <Profile model={model} prefix={prefix} />
        </TabsContent>
        <TabsContent value="preferences">
          <h1 className="sr-only">Preferences</h1>
          <Preferences model={model} prefix={prefix} />
        </TabsContent>
        <TabsContent value="notifications">
          <h1 className="sr-only">Notifications</h1>
          <Notifications model={model} />
        </TabsContent>
      </Tabs>
      <p className="vs-page-status" role="status">
        {model.status}
      </p>
    </section>
  );
}
