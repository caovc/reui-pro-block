import { useSyncExternalStore } from "react";
import type { AtlasAccountSection } from "./atlas-account-settings-data";
import { commerceSettingsHref, readCommerceSettingsRoute } from "./commerce-settings-route-model";

export const commerceAccountSections = ["profile", "preferences", "security"] as const;

/** Separate account paths from store settings; preserve both preview mounts and query. */
export function readCommerceAccountRoute(hash: string, id: string) {
  const { mount, query } = readCommerceSettingsRoute(hash, id);
  const path = hash.replace(/^#/, "").split("?")[0].replace(/\/$/, "");
  const value = path.slice(mount.length).match(/^\/account\/(profile|preferences|security)$/)?.[1];
  const section =
    id === "surge" || id === "manifest"
      ? (commerceAccountSections.find((item) => item === value) ?? null)
      : null;
  return { mount, query, section };
}

export function commerceAccountHref(hash: string, id: string, section: AtlasAccountSection | null) {
  const { mount, query } = readCommerceSettingsRoute(hash, id);
  const path = hash.replace(/^#/, "").split("?")[0];
  const standaloneScope = /^(?:\/?|\/(?:account|settings)(?:\/[^/]*)?\/?)$/.test(path);
  if ((id !== "surge" && id !== "manifest") || (!mount && !standaloneScope)) return hash;
  if (section === null) {
    return mount ? commerceSettingsHref(hash, id, null) : `#/${query}`;
  }
  return `#${mount}/account/${section}${query}`;
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const readHash = () => window.location.hash;

export function useCommerceAccountRoute(id: string) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  return {
    ...readCommerceAccountRoute(hash, id),
    href: (section: AtlasAccountSection) => commerceAccountHref(hash, id, section),
    navigate: (section: AtlasAccountSection | null) => {
      const next = commerceAccountHref(window.location.hash, id, section);
      if (window.location.hash !== next) window.location.hash = next;
    },
  };
}
