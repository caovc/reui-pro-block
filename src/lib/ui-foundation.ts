import { UI_STYLES, type UiStyle } from "../foundations/styles/index.ts";

export const uiPrimitiveOptions = [
  { value: "radix", label: "Radix UI" },
  { value: "base", label: "Base UI" },
] as const;

export const uiStyleOptions = UI_STYLES.map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
}));

export type UiPrimitive = (typeof uiPrimitiveOptions)[number]["value"];
export type { UiStyle };
export type UiFoundation = { primitive: UiPrimitive; style: UiStyle };

export const uiFoundation: UiFoundation = {
  primitive: import.meta.env?.MODE === "base-ui" ? "base" : "radix",
  style: "nova",
};

export function getUiRegistryStyle(foundation: UiFoundation) {
  return `${foundation.primitive}-${foundation.style}` as const;
}

export function getUiPresetUrl(themePreset: object) {
  const url = new URL(location.href);
  const queryIndex = url.hash.indexOf("?");
  const route = queryIndex === -1 ? url.hash : url.hash.slice(0, queryIndex);
  const existingQuery = queryIndex === -1 ? "" : url.hash.slice(queryIndex + 1);
  const query = existingQuery ? existingQuery.split("&") : [];
  const parts = query.filter((part) => !new URLSearchParams(part).has("preset"));
  parts.push(new URLSearchParams({ preset: JSON.stringify(themePreset) }).toString());
  url.hash = `${route || "#/"}?${parts.join("&")}`;
  return url;
}

export function navigateToUiPrimitive(primitive: UiPrimitive, themePreset: object) {
  if (primitive === uiFoundation.primitive) return;

  const current = getUiPresetUrl(themePreset);
  const root = new URL(uiFoundation.primitive === "base" ? "../" : "./", current);
  const target = primitive === "base" ? new URL("base/", root) : root;
  target.hash = current.hash;
  target.search = current.search;
  location.replace(target);
}
