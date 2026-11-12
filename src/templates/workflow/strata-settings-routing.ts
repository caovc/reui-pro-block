export const STRATA_SETTINGS_TABS = [
  "profile",
  "general",
  "api-keys",
  "security",
  "billing",
] as const;
export type StrataSettingsTab = (typeof STRATA_SETTINGS_TABS)[number];

export function readStrataSettingsTab(query: string): StrataSettingsTab {
  const tab = new URLSearchParams(query.replace(/^\?/, "")).get("tab");
  return STRATA_SETTINGS_TABS.find((value) => value === tab) ?? "general";
}

/** Remove only tab keys, retaining the original spelling/order of other pairs. */
export function strataSettingsQuery(query: string, tab: StrataSettingsTab | null): string {
  const raw = query.replace(/^\?/, "");
  const parts = raw ? raw.split("&") : [];
  const kept = parts.filter((part) => {
    const key = part.split("=", 1)[0];
    try {
      return decodeURIComponent(key.replace(/\+/g, " ")) !== "tab";
    } catch {
      return true;
    }
  });
  if (tab && tab !== "general") kept.push(`tab=${tab}`);
  return kept.length ? `?${kept.join("&")}` : "";
}
