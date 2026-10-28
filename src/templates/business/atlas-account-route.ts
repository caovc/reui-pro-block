import { useSyncExternalStore } from "react";
import type { AtlasAccountSection } from "./atlas-account-settings-data";
import { atlasAccountHref, readAtlasAccountRoute } from "./atlas-account-route-model";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const readHash = () => window.location.hash;

export function useAtlasAccountRoute() {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const route = readAtlasAccountRoute(hash);
  return {
    ...route,
    href: (section: AtlasAccountSection | null) => atlasAccountHref(hash, section),
    navigate: (section: AtlasAccountSection | null) => {
      const next = atlasAccountHref(window.location.hash, section);
      if (window.location.hash !== next) window.location.hash = next;
    },
  };
}
