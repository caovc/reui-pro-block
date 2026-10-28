import { useSyncExternalStore } from "react";
import {
  commerceSettingsHref,
  readCommerceSettingsRoute,
  type CommerceSettingsSection,
} from "./commerce-settings-route-model";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const readHash = () => window.location.hash;

export function useCommerceSettingsRoute(id: string) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  return {
    ...readCommerceSettingsRoute(hash, id),
    href: (section: CommerceSettingsSection) => commerceSettingsHref(hash, id, section),
    navigate: (section: CommerceSettingsSection | null) => {
      const next = commerceSettingsHref(window.location.hash, id, section);
      if (window.location.hash !== next) window.location.hash = next;
    },
  };
}
