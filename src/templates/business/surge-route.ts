import { useSyncExternalStore } from "react";
import { readSurgeRoute, surgePageHref } from "./surge-route-model";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const readHash = () => window.location.hash;

export function useSurgeRoute(enabled: boolean) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const route = readSurgeRoute(hash);
  return {
    ...route,
    page: enabled ? route.page : null,
    createProduct: enabled && route.createProduct,
    href: (page: string) => surgePageHref(hash, page),
    navigate: (page: string) => {
      if (!enabled) return;
      const next = surgePageHref(window.location.hash, page);
      if (window.location.hash !== next) window.location.hash = next;
    },
  };
}
