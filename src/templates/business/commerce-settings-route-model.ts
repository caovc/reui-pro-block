export const commerceSettingsSections = [
  "general",
  "team",
  "payments",
  "notifications",
  "billing",
  "locations",
  "suppliers",
] as const;

export type CommerceSettingsSection = (typeof commerceSettingsSections)[number];

export const commerceSettingsNavigation: Record<CommerceSettingsSection, string> = {
  general: "General",
  team: "Team",
  payments: "Payments",
  notifications: "Notifications",
  billing: "Billing",
  locations: "Locations",
  suppliers: "Suppliers",
};

export function commerceSectionForLabel(label: string): CommerceSettingsSection | null {
  return (
    commerceSettingsSections.find((section) => commerceSettingsNavigation[section] === label) ??
    null
  );
}

export function readCommerceSettingsRoute(hash: string, id: string) {
  const clean = hash.replace(/^#/, "");
  const queryIndex = clean.indexOf("?");
  const path = (queryIndex < 0 ? clean : clean.slice(0, queryIndex)).replace(/\/$/, "");
  const query = queryIndex < 0 ? "" : clean.slice(queryIndex);
  // Only these two known template IDs can own this route adapter.
  const match = path.match(/^\/(?:templates|template-preview)\/(surge|manifest)(?=\/|$)/);
  const mount = match?.[1] === id ? match[0] : "";
  const tail = path.slice(mount.length);
  const sectionName = tail === "/settings" ? "general" : tail.match(/^\/settings\/([^/]+)$/)?.[1];
  const section = commerceSettingsSections.find((item) => item === sectionName) ?? null;
  return { mount, query, section };
}

export function commerceSettingsHref(
  hash: string,
  id: string,
  section: CommerceSettingsSection | null,
) {
  const { mount, query } = readCommerceSettingsRoute(hash, id);
  const suffix =
    section === null ? "" : section === "general" ? "/settings" : `/settings/${section}`;
  return `#${mount}${suffix}${query}`;
}
