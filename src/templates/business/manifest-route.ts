import { useSyncExternalStore } from "react";
import { manifestPageHref, readManifestRoute } from "./manifest-route-model";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function subscribeDisabled() {
  return () => {};
}

const readHash = () => window.location.hash;
const readEmptyHash = () => "";

/** The other templates do not subscribe to this consumer's route adapter. */
export function useManifestRoute(enabled: boolean) {
  const hash = useSyncExternalStore(
    enabled ? subscribe : subscribeDisabled,
    enabled ? readHash : readEmptyHash,
    readEmptyHash,
  );
  const route = readManifestRoute(hash);
  return {
    ...route,
    page: enabled ? route.page : null,
    createProduct: enabled && route.createProduct,
    href: (page: string) => manifestPageHref(hash, page),
    navigate: (page: string) => {
      if (!enabled) return;
      const next = manifestPageHref(window.location.hash, page);
      if (window.location.hash !== next) window.location.hash = next;
    },
  };
}
