import { Fragment, useId, type ReactNode } from "react";
import {
  SettingsChoice,
  SettingsFields,
  SettingsRow,
  type SettingsFieldDefinition,
  type SettingsValue,
  type SettingsValues,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { LucentAccountModel } from "./lucent-account-model";

export function AccountCard({
  title,
  description,
  groupLabel,
  groupDescription,
  children,
  footer,
}: {
  title: string;
  description: string;
  groupLabel: string;
  groupDescription: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const descriptionId = useId();

  return (
    <Card className="lucent-account-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet className="lucent-account-fields" aria-describedby={descriptionId}>
          <FieldLegend className="sr-only">{groupLabel}</FieldLegend>
          <FieldDescription id={descriptionId} className="sr-only">
            {groupDescription}
          </FieldDescription>
          <FieldGroup className="lucent-account-rows gap-0">{children}</FieldGroup>
        </FieldSet>
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

export function AccountFieldRows({
  fields,
  values,
  onChange,
  idPrefix,
}: {
  fields: readonly SettingsFieldDefinition[];
  values: SettingsValues;
  onChange: (id: string, value: SettingsValue) => void;
  idPrefix: string;
}) {
  return fields.map((field, index) => (
    <Fragment key={field.id}>
      {index > 0 && <FieldSeparator />}
      <SettingsFields
        fields={[field]}
        value={values}
        onValueChange={onChange}
        idPrefix={idPrefix}
      />
    </Fragment>
  ));
}

const plans = [
  {
    name: "Free",
    price: "$0",
    details: " / forever · 1 cluster, 7-day log retention, Community support",
  },
  {
    name: "Pro",
    price: "$29",
    details: " / per month · Unlimited clusters, 90-day retention, Priority support",
  },
  {
    name: "Team",
    price: "$79",
    details: " / per month · Everything in Pro, SSO and SCIM, Audit log export",
  },
] as const;

const billingCountries = ["United States", "United Kingdom", "Germany", "Uzbekistan"];

export function LucentBillingSection({ model }: { model: LucentAccountModel }) {
  return (
    <section aria-label="Billing and usage" className="lucent-account-stack">
      <AccountCard
        title="Plan and billing"
        description="Current subscription"
        groupLabel="Plan and billing"
        groupDescription="Review your current subscription and plan options."
      >
        {plans.map((plan, index) => {
          const current = model.plan === plan.name;

          return (
            <Fragment key={plan.name}>
              {index > 0 && <FieldSeparator />}
              <SettingsRow
                title={plan.name}
                badge={
                  current ? (
                    <Badge variant="focus-outline" size="sm">
                      Current
                    </Badge>
                  ) : undefined
                }
                description={
                  <>
                    <span className="lucent-account-plan-price">{plan.price}</span>
                    {plan.details}
                  </>
                }
                controlClassName="lucent-account-inline"
              >
                <Button
                  type="button"
                  variant={current ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => model.choosePlan(plan.name)}
                >
                  {current ? "Manage" : "Switch"}
                </Button>
              </SettingsRow>
            </Fragment>
          );
        })}
      </AccountCard>
      <AccountCard
        title="Billing details"
        description="Invoices and payments"
        groupLabel="Billing details"
        groupDescription="Manage invoice contacts and payment details."
        footer={
          <Button
            type="button"
            size="sm"
            onClick={model.saveBilling}
            disabled={model.billingInvalid}
          >
            Update billing
          </Button>
        }
      >
        <AccountFieldRows
          fields={[
            {
              id: "email",
              label: "Billing email",
              description: "Receives invoices and renewal notices.",
              type: "email",
              error: model.billingInvalid ? "Enter a valid email address." : undefined,
            },
          ]}
          values={model.billing}
          onChange={model.changeBilling}
          idPrefix="lucent-billing"
        />
        <FieldSeparator />
        <SettingsRow
          title="Invoice profile"
          description="Business details used on receipts and tax forms."
        >
          <FieldSet
            className="lucent-account-details"
            aria-describedby="lucent-invoice-profile-description"
          >
            <FieldLegend className="sr-only">Invoice profile</FieldLegend>
            <FieldDescription id="lucent-invoice-profile-description" className="sr-only">
              Company identity used for invoices and tax documents.
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="lucent-billing-company">Company name</FieldLabel>
                <Input
                  id="lucent-billing-company"
                  value={String(model.billing.company ?? "")}
                  onChange={(event) => model.changeBilling("company", event.target.value)}
                  maxLength={160}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lucent-billing-country">Country</FieldLabel>
                <SettingsChoice
                  id="lucent-billing-country"
                  value={String(model.billing.country ?? "")}
                  options={billingCountries}
                  onChange={(value) => model.changeBilling("country", value)}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </SettingsRow>
        <FieldSeparator />
        <AccountFieldRows
          fields={[
            {
              id: "taxId",
              label: "Tax ID",
              description: "Optional number used for VAT or company invoices.",
              prefix: "VAT",
            },
          ]}
          values={model.billing}
          onChange={model.changeBilling}
          idPrefix="lucent-billing"
        />
        <FieldSeparator />
        <SettingsRow
          title="Card on file"
          description="Used for monthly renewals."
          controlClassName="lucent-account-inline"
        >
          <span className="lucent-account-card-summary">
            Visa ending in {String(model.billing.cardLast4 ?? "4242")}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={model.updateDemoCard}>
            Update
          </Button>
        </SettingsRow>
      </AccountCard>
    </section>
  );
}

const activityFields: readonly SettingsFieldDefinition[] = [
  {
    id: "desktopNotifications",
    label: "Desktop notifications",
    description: "Show alerts for deploys, incidents and approvals.",
    type: "switch",
  },
  {
    id: "unreadBadge",
    label: "Unread badge",
    description: "Display a badge when new activity arrives.",
    type: "switch",
  },
  {
    id: "autoDismiss",
    label: "Auto dismiss",
    description: "Choose how long alerts stay visible.",
    options: ["5 minutes", "10 minutes", "15 minutes", "30 minutes"],
  },
];

const emailFields: readonly SettingsFieldDefinition[] = [
  {
    id: "teamCommunication",
    label: "Team communication",
    description: "Approvals, incident updates and change reviews.",
    type: "switch",
  },
  {
    id: "productAnnouncements",
    label: "Product announcements",
    description: "New features and changelog from the platform team.",
    type: "switch",
  },
  {
    id: "digestEmail",
    label: "Digest email",
    description: "A recap of deploys, incidents and on-call load.",
    type: "switch",
  },
  {
    id: "digestCadence",
    label: "How often",
    description: "Only applies while the digest above is on.",
    options: ["Every day", "Every week", "Every month"],
  },
];

const quietHours = [
  {
    id: "quietStart",
    label: "Start",
    options: ["6:00 PM", "8:00 PM", "10:00 PM", "11:00 PM"],
  },
  {
    id: "quietEnd",
    label: "End",
    options: ["6:00 AM", "8:00 AM", "9:00 AM", "10:00 AM"],
  },
] as const;

export function LucentPreferencesSection({ model }: { model: LucentAccountModel }) {
  return (
    <section aria-label="Preferences" className="lucent-account-stack">
      <AccountCard
        title="Activity alerts"
        description="How alerts behave while you are in the console."
        groupLabel="Activity alerts"
        groupDescription="Control desktop notifications, do not disturb, the unread badge and how long alerts stay."
      >
        <AccountFieldRows
          fields={activityFields.slice(0, 1)}
          values={model.preferences}
          onChange={model.changePreferences}
          idPrefix="lucent-preferences"
        />
        <FieldSeparator />
        <SettingsRow
          title="Do not disturb"
          description="Hold non-urgent alerts outside your working hours. Pages still come through."
        >
          <FieldSet
            className="lucent-account-quiet-hours"
            aria-describedby="lucent-quiet-hours-description"
          >
            <FieldLegend className="sr-only">Do not disturb</FieldLegend>
            <FieldDescription id="lucent-quiet-hours-description" className="sr-only">
              Define when non-urgent activity should stay muted.
            </FieldDescription>
            <FieldGroup>
              {quietHours.map((field) => (
                <Field key={field.id}>
                  <FieldLabel htmlFor={`lucent-preferences-${field.id}`}>{field.label}</FieldLabel>
                  <SettingsChoice
                    id={`lucent-preferences-${field.id}`}
                    value={String(model.preferences[field.id] ?? "")}
                    options={field.options}
                    onChange={(value) => model.changePreferences(field.id, value)}
                  />
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>
        </SettingsRow>
        <FieldSeparator />
        <AccountFieldRows
          fields={activityFields.slice(1)}
          values={model.preferences}
          onChange={model.changePreferences}
          idPrefix="lucent-preferences"
        />
      </AccountCard>
      <AccountCard
        title="Email updates"
        description="What reaches your inbox, and how often."
        groupLabel="Email updates"
        groupDescription="Choose which emails reach your inbox and how often the digest arrives."
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={model.resetPreferences}>
              Reset
            </Button>
            <Button type="button" size="sm" onClick={model.savePreferences}>
              Save preferences
            </Button>
          </>
        }
      >
        <AccountFieldRows
          fields={emailFields}
          values={model.preferences}
          onChange={model.changePreferences}
          idPrefix="lucent-preferences"
        />
      </AccountCard>
    </section>
  );
}
