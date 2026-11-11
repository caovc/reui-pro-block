import { useSyncExternalStore } from "react";
import { getUiPresetUrl, uiFoundation } from "@/lib/ui-foundation";
import {
  defaultTheme,
  isThemeDark,
  loadTheme,
  normalizeTheme,
  previewThemeStorageKey,
  readTheme,
  type PreviewTheme,
} from "./preview-theme";

type ThemeSnapshot = { theme: PreviewTheme; dark: boolean; customizerOpen: boolean };
let snapshot: ThemeSnapshot | undefined;
let inheritedDark = false;
const listeners = new Set<() => void>();
let lastTrigger: HTMLElement | null = null;
export const reopenCustomizerKey = "bricklane-reopen-customizer";

function takeCustomizerState() {
  if (window.parent !== window) return false;
  try {
    const reopen = sessionStorage.getItem(reopenCustomizerKey) === "true";
    sessionStorage.removeItem(reopenCustomizerKey);
    return reopen;
  } catch {
    return false;
  }
}

function storedDark() {
  try {
    return JSON.parse(localStorage.getItem("blocks-dark") || "false") === true;
  } catch {
    return false;
  }
}
function resolveDark(theme: PreviewTheme) {
  return isThemeDark(theme, inheritedDark, matchMedia("(prefers-color-scheme: dark)").matches);
}
function getSnapshot(): ThemeSnapshot {
  if (!snapshot) {
    const params = new URLSearchParams(location.hash.split("?")[1]);
    inheritedDark = params.has("theme") ? params.get("theme") === "dark" : storedDark();
    const theme = loadTheme();
    snapshot = { theme, dark: resolveDark(theme), customizerOpen: takeCustomizerState() };
  }
  return snapshot;
}
function publish(next: ThemeSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}
function publishTheme(theme: PreviewTheme) {
  const current = getSnapshot();
  publish({ ...current, theme, dark: resolveDark(theme) });
}
function persistTheme(theme: PreviewTheme) {
  try {
    localStorage.setItem(previewThemeStorageKey, JSON.stringify(theme));
  } catch {
    /* The in-memory theme remains usable when storage is unavailable. */
  }
}
export function setGlobalTheme(value: PreviewTheme, persist = true) {
  const theme = normalizeTheme(value);
  publishTheme(theme);
  if (!persist) return;
  const params = new URLSearchParams(location.hash.split("?")[1]);
  if (
    window.parent === window &&
    params.has("preset") &&
    theme.primitive === uiFoundation.primitive
  ) {
    const url = getUiPresetUrl(theme);
    if (url.href !== location.href) history.replaceState(history.state, "", url);
  }
  persistTheme(theme);
}
export function syncGlobalThemeFromUrl() {
  const params = new URLSearchParams(location.hash.split("?")[1]);
  if (!params.has("preset")) return;
  // Reading a shared preset must preserve the incoming route and its raw query.
  const theme = readTheme(params);
  publishTheme(theme);
  if (window.parent === window) persistTheme(theme);
}
export function toggleGlobalTheme() {
  const current = getSnapshot();
  inheritedDark = !current.dark;
  try {
    localStorage.setItem("blocks-dark", JSON.stringify(inheritedDark));
  } catch {
    /* Keep the local control functional. */
  }
  setGlobalTheme({ ...current.theme, mode: inheritedDark ? "dark" : "light" });
}
export function openGlobalCustomizer(trigger?: HTMLElement) {
  if (trigger) lastTrigger = trigger;
  publish({ ...getSnapshot(), customizerOpen: true });
}
export function closeGlobalCustomizer() {
  publish({ ...getSnapshot(), customizerOpen: false });
  if (matchMedia("(min-width: 1024px)").matches) restoreCustomizerFocus();
}
export function restoreCustomizerFocus() {
  const target = lastTrigger?.isConnected
    ? lastTrigger
    : Array.from(
        document.querySelectorAll<HTMLElement>('[aria-controls="preview-customizer"]'),
      ).find((element) => element.getClientRects().length > 0);
  target?.focus({ preventScroll: true });
}
export function resetGlobalTheme() {
  setGlobalTheme({ ...defaultTheme });
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function useGlobalTheme() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function getCurrentPreviewTheme(): PreviewTheme {
  return { ...getSnapshot().theme, primitive: uiFoundation.primitive };
}

// Each same-origin document owns one store. Storage events synchronize open
// tabs and iframe previews; React subscribers synchronize routes in this tab.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === previewThemeStorageKey || event.key === null) {
      try {
        const value = localStorage.getItem(previewThemeStorageKey);
        inheritedDark = storedDark();
        const theme = value ? normalizeTheme(JSON.parse(value)) : defaultTheme;
        setGlobalTheme({ ...theme, primitive: uiFoundation.primitive }, false);
      } catch {
        /* Ignore malformed external storage values. */
      }
    } else if (event.key === "blocks-dark") {
      inheritedDark = storedDark();
      const current = getSnapshot();
      publish({ ...current, dark: resolveDark(current.theme) });
    }
  });
  window.addEventListener("hashchange", syncGlobalThemeFromUrl);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const current = getSnapshot();
    publish({ ...current, dark: resolveDark(current.theme) });
  });
  window.addEventListener("message", (event: MessageEvent) => {
    if (
      event.origin !== location.origin ||
      event.source !== window.parent ||
      window.parent === window ||
      event.data?.type !== "reui-preview-theme"
    )
      return;
    inheritedDark = event.data.dark === true;
    setGlobalTheme(normalizeTheme(event.data.theme), false);
  });
}
