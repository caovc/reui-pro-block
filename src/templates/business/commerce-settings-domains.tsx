import { CommerceBillingSettings } from "./commerce-settings-billing";
import { CommerceNotificationSettings } from "./commerce-settings-notifications";
import { CommercePaymentSettings } from "./commerce-settings-payments";
import { CommerceRecordsSettings } from "./commerce-settings-records";
import { CommerceTeamSettings } from "./commerce-settings-team";
import { commerceSettingsLabels, type CommerceSettingsSection } from "./commerce-settings-data";
import type { CommerceSettingsModel } from "./commerce-settings-model";
import "@/blocks/reference.css";
import "./commerce-settings-domains.css";

export type { CommerceSettingsModel } from "./commerce-settings-model";
export type { CommerceSettingsSection } from "./commerce-settings-data";

/** The caller owns route parsing/sidebar/header and keeps the model mounted. */
export function CommerceSettingsPage({
  section,
  model,
  orderUsage,
}: {
  section: CommerceSettingsSection;
  model: CommerceSettingsModel;
  orderUsage?: { count: number; label: string };
}) {
  let content;
  switch (section) {
    case "team":
      content = <CommerceTeamSettings model={model} />;
      break;
    case "payments":
      content = <CommercePaymentSettings model={model} />;
      break;
    case "notifications":
      content = <CommerceNotificationSettings model={model} />;
      break;
    case "billing":
      content = <CommerceBillingSettings model={model} orderUsage={orderUsage} />;
      break;
    case "locations":
    case "suppliers":
      content = <CommerceRecordsSettings key={section} kind={section} model={model} />;
      break;
  }
  return (
    <section
      className="commerce-settings-domains reui-reference"
      aria-label={`${commerceSettingsLabels[section]} settings`}
    >
      {content}
      {model.notice && (
        <p className="csd-local-notice" role="status">
          {model.notice}
        </p>
      )}
    </section>
  );
}
