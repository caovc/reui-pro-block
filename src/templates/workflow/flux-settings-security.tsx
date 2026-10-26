import { Fragment, type ReactNode } from "react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  SettingsFields,
  SettingsRow,
  type SettingsFieldDefinition,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import type { FluxSettingsModel } from "./flux-settings-model";
import { ItemSeparator } from "@/components/ui/item";
import "@/blocks/reference.css";
import "@/blocks/application/dialog-variants/workspace/workspace.css";
import "./flux-settings.css";

const sessionFields = [
  {
    id: "twoFactor",
    label: "Enforce two-factor authentication",
    description: "Require every operator to enable 2FA.",
    type: "switch",
  },
  {
    id: "sessionTimeout",
    label: "Session timeout",
    description: "Sign an operator out after this long idle.",
    options: ["30 minutes", "1 hour", "4 hours", "24 hours", "Never"],
  },
  {
    id: "singleSession",
    label: "Single active session",
    description: "Limit each operator to one active session.",
    type: "switch",
  },
] satisfies SettingsFieldDefinition[];
const loginFields = [
  {
    id: "passwordLogin",
    label: "Password authentication",
    description: "Allow operators to sign in with a password.",
    type: "switch",
  },
  {
    id: "magicLink",
    label: "Magic link login",
    description: "Send a one-time link via email to sign in.",
    type: "switch",
  },
] satisfies SettingsFieldDefinition[];
const accessRows = [
  {
    title: "Operator invitations",
    description: "Who can invite a new operator.",
    plan: "Basic",
    variant: "success-light",
  },
  {
    title: "Agent registration",
    description: "Who can register a new agent.",
    plan: "Business",
    variant: "warning-light",
  },
  {
    title: "Custom roles",
    description: "Create and assign approval roles.",
    plan: "Business",
    variant: "warning-light",
  },
  {
    title: "Audit log access",
    description: "View the full run and approval trail.",
    plan: "Enterprise",
    variant: "focus-light",
  },
] as const;
function SecurityGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Frame dense spacing="sm">
      <FrameHeader>
        <FrameTitle>{title}</FrameTitle>
        <FrameDescription>{description}</FrameDescription>
      </FrameHeader>
      <FramePanel className="flux-settings-fields p-0">{children}</FramePanel>
    </Frame>
  );
}
function SecurityFields({
  fields,
  model,
}: {
  fields: SettingsFieldDefinition[];
  model: FluxSettingsModel;
}) {
  return fields.map((field, index) => (
    <Fragment key={field.id}>
      {index > 0 && <ItemSeparator className="m-0" />}
      <SettingsFields
        fields={[field]}
        value={model.security}
        onValueChange={model.setSecurityValue}
        idPrefix="flux-security"
      />
    </Fragment>
  ));
}
export function FluxSecuritySettings({ model }: { model: FluxSettingsModel }) {
  return (
    <section className="flux-settings-page" aria-labelledby="flux-security-heading">
      <h1 className="sr-only" id="flux-security-heading">
        Security settings
      </h1>
      <SecurityGroup
        title="Session Policy"
        description="How long an operator stays signed in to this console."
      >
        <SecurityFields fields={sessionFields} model={model} />
      </SecurityGroup>
      <SecurityGroup
        title="Login Methods"
        description="Admins can always sign in by email. These apply to operators only."
      >
        <SecurityFields fields={loginFields} model={model} />
        <ItemSeparator className="m-0" />
        <SettingsRow
          title="SAML single sign-on"
          description="Authenticate via your identity provider."
        >
          <Badge variant="focus-light" radius="full" className="border-dashed">
            Enterprise
          </Badge>
        </SettingsRow>
      </SecurityGroup>
      <SecurityGroup
        title="Access Restrictions"
        description="Which console features this workspace's plan unlocks."
      >
        {accessRows.map((row, index) => (
          <Fragment key={row.title}>
            {index > 0 && <ItemSeparator className="m-0" />}
            <SettingsRow key={row.title} title={row.title} description={row.description}>
              <Badge
                variant={row.variant}
                radius="full"
                className={row.plan === "Enterprise" ? "border-dashed" : undefined}
              >
                {row.plan}
              </Badge>
            </SettingsRow>
          </Fragment>
        ))}
      </SecurityGroup>
    </section>
  );
}
