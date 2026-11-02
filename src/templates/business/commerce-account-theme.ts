import { setGlobalTheme } from "@/components/site/global-theme-store";
import { normalizeTheme, readTheme, type PreviewTheme } from "@/components/site/preview-theme";

export type CommerceAccountThemeMode = "light" | "dark" | "system";

/** Update the authoritative first preset without rewriting unrelated raw query
 * entries, duplicate keys, their ordering, or the current route path. */
export function commerceAccountThemeHash(hash: string, update: Partial<PreviewTheme>) {
  const queryIndex = hash.indexOf("?");
  if (queryIndex < 0) return hash;
  const query = hash.slice(queryIndex + 1);
  const params = new URLSearchParams(query);
  if (!params.has("preset")) return hash;
  const theme = normalizeTheme({ ...readTheme(params), ...update });
  // Same preset JSON/URLSearchParams encoding used by the existing customizer.
  const encoded = new URLSearchParams({ preset: JSON.stringify(theme) }).toString().slice(7);
  let replaced = false;
  const nextQuery = query
    .split("&")
    .map((entry) => {
      if (replaced || !new URLSearchParams(entry).has("preset")) return entry;
      replaced = true;
      const key = entry.split("=", 1)[0];
      return `${key}=${encoded}`;
    })
    .join("&");
  return `${hash.slice(0, queryIndex + 1)}${nextQuery}`;
}

/** No additional history entry or synthetic hashchange. Publish only after the
 * URL agrees with the mode which future account/settings navigation will read. */
export function commitCommerceAccountThemeMode(
  mode: CommerceAccountThemeMode,
  current: PreviewTheme,
) {
  const next = normalizeTheme({ ...current, mode });
  const hash = commerceAccountThemeHash(window.location.hash, next);
  if (hash !== window.location.hash) window.history.replaceState(window.history.state, "", hash);
  setGlobalTheme(next, false);
}
