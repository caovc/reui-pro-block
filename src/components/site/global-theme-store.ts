import { useSyncExternalStore } from "react";
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
    snapshot = { theme, dark: resolveDark(theme), customizerOpen: false };
  }
  return snapshot;
}
function publish(next: ThemeSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}
export function setGlobalTheme(value: PreviewTheme, persist = true) {
  const theme = normalizeTheme(value);
  const current = getSnapshot();
  publish({ ...current, theme, dark: resolveDark(theme) });
  if (persist) {
    try {
      localStorage.setItem(previewThemeStorageKey, JSON.stringify(theme));
    } catch {
      /* The in-memory theme remains usable when storage is unavailable. */
    }
  }
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
  if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true });
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

// Each same-origin document owns one store. Storage events synchronize open
// tabs and iframe previews; React subscribers synchronize routes in this tab.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === previewThemeStorageKey || event.key === null) {
      try {
        const value = localStorage.getItem(previewThemeStorageKey);
        inheritedDark = storedDark();
        setGlobalTheme(value ? normalizeTheme(JSON.parse(value)) : { ...defaultTheme }, false);
      } catch {
        /* Ignore malformed external storage values. */
      }
    } else if (event.key === "blocks-dark") {
      inheritedDark = storedDark();
      const current = getSnapshot();
      publish({ ...current, dark: resolveDark(current.theme) });
    }
  });
  window.addEventListener("hashchange", () => {
    const params = new URLSearchParams(location.hash.split("?")[1]);
    if (params.has("preset")) setGlobalTheme(readTheme(params));
  });
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
