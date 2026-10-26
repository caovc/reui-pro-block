// ReUI free compositions: Copyright (c) 2025 Keenthemes Inc, MIT.
// Full notice: src/components/reui/REUI-LICENSE.txt (included in project exports).
import { useEffect, useState, type ReactNode } from "react";
import { Info, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  SettingsFields,
  SettingsRow,
  SettingsChoice,
  type SettingsFieldDefinition,
  type SettingsValue,
  type SettingsValues,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Frame, FramePanel } from "@/components/reui/frame";
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/reui/number-field";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFileUpload } from "@/hooks/use-file-upload";
import { demoAvatar } from "@/lib/demo-artwork";
import {
  formDefaults,
  formFields,
  languageOptions,
  landingOptions,
  timezones,
  type FlowlySettingsSection,
} from "./flowly-settings-data";
import "@/blocks/application/dialog-variants/workspace/workspace.css";

export function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="fs-group">
      <h2 className="sr-only">{title}</h2>
      {description && <p className="sr-only">{description}</p>}
      <Frame dense stacked className="fs-frame">
        <FramePanel className="fs-panel">{children}</FramePanel>
      </Frame>
    </section>
  );
}

/** Actual official free c-combobox-6 composition. MIT upstream; controlled values/data only. */
export function TimezoneChoice({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Combobox
      items={timezones}
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <ComboboxInput
        id={id}
        placeholder="Select a timezone"
        aria-describedby={`${id}-description`}
      />
      <ComboboxContent className="reui-reference fs-portal">
        <ComboboxEmpty>No timezones found.</ComboboxEmpty>
        <ComboboxList>
          {(group) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** Official free c-select-27: selected label only, menu retains description and selected check. */
export function DescribedChoice({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: readonly { label: string; description: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} size="sm" className="w-full [&_span.text-muted-foreground]:hidden">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="reui-reference fs-portal">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.label} value={option.label}>
              <div className="flex flex-col items-start gap-px">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function NumericSetting({
  id,
  title,
  description,
  value,
  onChange,
  prefix,
  suffix,
}: {
  id: string;
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <SettingsRow id={id} title={title} description={description}>
      <NumberField
        id={id}
        value={value === "" ? null : Number(value)}
        onValueChange={(next) => onChange(next === null ? "" : String(next))}
        aria-describedby={`${id}-description`}
      >
        <NumberFieldGroup>
          {prefix && <span className="fs-number-addon">{prefix}</span>}
          <NumberFieldInput className="text-left" />
          {suffix && <span className="fs-number-addon">{suffix}</span>}
        </NumberFieldGroup>
      </NumberField>
    </SettingsRow>
  );
}

function ProfilePhoto() {
  const [{ files, errors }, { getInputProps, openFileDialog, clearFiles }] = useFileUpload({
    accept: "image/*",
    multiple: false,
    initialFiles: [
      {
        id: "profile-photo",
        name: "nick-bold.svg",
        size: 0,
        type: "image/svg+xml",
        url: demoAvatar("Nick Bold"),
      },
    ],
  });
  useEffect(() => () => clearFiles(), [clearFiles]);
  return (
    <SettingsRow
      id="settings-photo"
      title="Profile Photo"
      description="Shown in approvals, mentions, and member lists."
    >
      <div className="fs-photo">
        <Avatar className="size-10">
          <AvatarImage src={files[0]?.preview} alt="Nick Bold" />
          <AvatarFallback>NB</AvatarFallback>
        </Avatar>
        <input
          {...getInputProps({ id: "settings-photo", "aria-label": "Upload profile photo" })}
          className="sr-only"
        />
        <Button size="sm" variant="outline" onClick={openFileDialog}>
          <Upload />
          Change
        </Button>
        <Button size="sm" variant="outline" disabled={!files.length} onClick={clearFiles}>
          <X />
          Remove
        </Button>
      </div>
      {errors.length > 0 && (
        <p role="alert" className="text-sm text-destructive">
          {errors.join(" ")}
        </p>
      )}
    </SettingsRow>
  );
}

export function FlowlyFormPage({ section }: { section: FlowlySettingsSection }) {
  const [value, setValue] = useState<SettingsValues>(() => ({ ...formDefaults[section] }));
  const [domains, setDomains] = useState(["brick.test", "labs.brick.test", "partners.brick.test"]);
  const change = (id: string, next: SettingsValue) =>
    setValue((current) => ({ ...current, [id]: next }));
  const fields = (definitions: readonly SettingsFieldDefinition[]) => (
    <SettingsFields
      fields={definitions}
      value={value}
      onValueChange={change}
      idPrefix={`flowly-${section}`}
    />
  );
  const timezone = (id = "settings-timezone") => (
    <TimezoneChoice
      id={id}
      value={String(value.timezone)}
      onChange={(next) => change("timezone", next)}
    />
  );
  if (section === "general")
    return (
      <>
        <SettingsGroup title="Workspace basics">
          <SettingsRow
            id="settings-workspace-name"
            title="Workspace Name"
            description="Used in shared pages and invites."
          >
            <Input
              id="settings-workspace-name"
              value={String(value.workspaceName)}
              onChange={(event) => change("workspaceName", event.target.value)}
              aria-describedby="settings-workspace-name-description"
            />
            <p className="fs-hint">Appears in invite flows and the workspace switcher.</p>
          </SettingsRow>
          <SettingsRow
            id="settings-workspace-domain"
            title={
              <span className="flex flex-wrap items-center gap-2">
                Workspace Domain
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon-xs" variant="ghost" aria-label="Workspace domain info">
                      <Info />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="reui-reference">
                    The public address for shared workspace pages.
                  </TooltipContent>
                </Tooltip>
                <Badge variant="secondary" className="fs-positive">
                  Connected
                </Badge>
              </span>
            }
            description="Keep the public URL short and clear."
          >
            <InputGroup>
              <InputGroupAddon>app.brick.test/</InputGroupAddon>
              <InputGroupInput
                id="settings-workspace-domain"
                value={String(value.domain)}
                onChange={(event) => change("domain", event.target.value)}
              />
            </InputGroup>
            <p className="fs-hint">New invite and share links will use this slug.</p>
          </SettingsRow>
          <SettingsRow
            title="Invite Domains"
            description="Allow signups from trusted company domains."
          >
            <div className="fs-chips">
              {domains.map((domain) => (
                <Badge variant="outline" key={domain}>
                  {domain}
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Remove ${domain}`}
                    onClick={() =>
                      setDomains((current) => current.filter((item) => item !== domain))
                    }
                  >
                    <X />
                  </Button>
                </Badge>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast.info("Domain review required", {
                    description:
                      "Local demo: an owner must approve a new invite domain before it is used.",
                  })
                }
              >
                <Plus />
                Add domain
              </Button>
            </div>
            <p className="fs-hint">Only trusted company domains are auto-approved for invites.</p>
          </SettingsRow>
        </SettingsGroup>
        <SettingsGroup title="Regional preferences">
          <SettingsRow
            title="Language And Timezone"
            description="Keep the workspace readable for the whole team."
          >
            <div className="fs-control-stack">
              <label htmlFor="settings-language">Language</label>
              <DescribedChoice
                id="settings-language"
                value={String(value.language)}
                options={languageOptions}
                onChange={(next) => change("language", next)}
              />
              <p className="fs-hint">Sets shared UI copy for this workspace.</p>
              <label htmlFor="settings-timezone">Timezone</label>
              {timezone()}
              <p className="fs-hint" id="settings-timezone-description">
                Schedules and cron triggers run on this clock.
              </p>
            </div>
          </SettingsRow>
          <SettingsRow
            id="settings-date-format"
            title="Date Format"
            description="Keep reports and summaries consistent."
          >
            <SettingsChoice
              id="settings-date-format"
              value={String(value.dateFormat)}
              options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD"]}
              onChange={(next) => change("dateFormat", next)}
            />
            <p className="fs-hint">Applies to exports, reports, and activity tables.</p>
          </SettingsRow>
        </SettingsGroup>
        <SettingsGroup title="Editor behavior">{fields(formFields.generalEditor)}</SettingsGroup>
      </>
    );
  if (section === "billing")
    return (
      <>
        <SettingsGroup title="Billing Profile">{fields(formFields.billingProfile)}</SettingsGroup>
        <SettingsGroup title="Usage Limits">
          <NumericSetting
            id="settings-run-cap"
            title="Monthly Run Cap"
            description="Runs past this number wait until the next cycle."
            value={String(value.runCap)}
            onChange={(next) => change("runCap", next)}
            suffix="runs"
          />
          {fields(formFields.billingAlert)}
        </SettingsGroup>
      </>
    );
  if (section === "execution")
    return (
      <>
        <SettingsGroup title="Run Defaults">{fields(formFields.executionDefaults)}</SettingsGroup>
        <SettingsGroup title="Scheduling">{fields(formFields.executionScheduling)}</SettingsGroup>
      </>
    );
  if (section === "ai-models")
    return (
      <>
        <SettingsGroup title="Default Model">
          {fields(formFields.modelDefaults)}
          <NumericSetting
            id="settings-token-budget"
            title="Monthly Budget"
            description="Agents fall back to a cheaper model past this spend."
            value={String(value.budget)}
            onChange={(next) => change("budget", next)}
            prefix="$"
            suffix="/ month"
          />
        </SettingsGroup>
        <SettingsGroup title="Guardrails">
          {fields(
            formFields.modelGuardrails.map((field) =>
              field.id === "approve"
                ? {
                    ...field,
                    badge: (
                      <Badge variant="secondary" className="fs-positive">
                        Recommended
                      </Badge>
                    ),
                  }
                : field,
            ),
          )}
        </SettingsGroup>
      </>
    );
  if (section === "audit-log")
    return <SettingsGroup title="Audit Retention">{fields(formFields.audit)}</SettingsGroup>;
  if (section === "profile")
    return (
      <>
        <SettingsGroup title="Personal details">
          <ProfilePhoto />
          {fields(
            formFields.profileIdentity.map((field) =>
              field.id === "email"
                ? {
                    ...field,
                    badge: (
                      <Badge variant="secondary" className="fs-positive">
                        Verified
                      </Badge>
                    ),
                  }
                : field,
            ),
          )}
        </SettingsGroup>
        <SettingsGroup title="Profile details">
          <SettingsRow
            id="settings-role"
            title="Role"
            description="Public title shown on shared workspace surfaces."
          >
            <SettingsChoice
              id="settings-role"
              value={String(value.role)}
              options={["Workspace Admin", "Automation Lead", "Ops Lead"]}
              onChange={(next) => change("role", next)}
            />
          </SettingsRow>
          <SettingsRow
            id="settings-timezone"
            title="Timezone"
            description="Used in review schedules and run times."
          >
            {timezone()}
          </SettingsRow>
        </SettingsGroup>
        <SettingsGroup title="Display preferences">
          <SettingsRow
            id="settings-landing-view"
            title="Landing View"
            description="Open into the most useful workspace view."
          >
            <DescribedChoice
              id="settings-landing-view"
              value={String(value.landing)}
              options={landingOptions}
              onChange={(next) => change("landing", next)}
            />
          </SettingsRow>
        </SettingsGroup>
      </>
    );
  if (section === "security")
    return (
      <>
        <SettingsGroup title="Sign-In Methods">{fields(formFields.securitySignin)}</SettingsGroup>
        <SettingsGroup title="Session Policy">{fields(formFields.securitySessions)}</SettingsGroup>
      </>
    );
  return null;
}
