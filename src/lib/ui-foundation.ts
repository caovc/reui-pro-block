export const uiPrimitiveOptions = [
  { value: "radix", label: "Radix UI" },
  { value: "base", label: "Base UI" },
] as const;

export const uiStyleOptions = [
  { value: "nova", label: "Nova" },
  { value: "vega", label: "Vega" },
  { value: "maia", label: "Maia" },
  { value: "lyra", label: "Lyra" },
  { value: "mira", label: "Mira" },
  { value: "luma", label: "Luma" },
  { value: "sera", label: "Sera" },
  { value: "rhea", label: "Rhea" },
] as const;

export type UiPrimitive = (typeof uiPrimitiveOptions)[number]["value"];
export type UiStyle = (typeof uiStyleOptions)[number]["value"];
export type UiFoundation = { primitive: UiPrimitive; style: UiStyle };

export const uiFoundation: UiFoundation = {
  primitive: import.meta.env?.MODE === "base-ui" ? "base" : "radix",
  style: "nova",
};

export function getUiRegistryStyle(foundation: UiFoundation) {
  return `${foundation.primitive}-${foundation.style}` as const;
}

export function navigateToUiPrimitive(primitive: UiPrimitive, themePreset?: object) {
  if (primitive === uiFoundation.primitive) return;

  const current = new URL(location.href);
  const root = new URL(uiFoundation.primitive === "base" ? "../" : "./", current);
  const target = primitive === "base" ? new URL("base/", root) : root;
  const queryIndex = current.hash.indexOf("?");
  const route = queryIndex === -1 ? current.hash : current.hash.slice(0, queryIndex);
  const existingQuery = queryIndex === -1 ? "" : current.hash.slice(queryIndex + 1);
  const query = existingQuery ? existingQuery.split("&") : [];
  const parts = themePreset
    ? [
        ...query.filter((part) => !new URLSearchParams(part).has("preset")),
        new URLSearchParams({ preset: JSON.stringify(themePreset) }).toString(),
      ]
    : query;
  target.hash = `${route || "#/"}${parts.length ? `?${parts.join("&")}` : ""}`;
  target.search = current.search;
  location.assign(target);
}
