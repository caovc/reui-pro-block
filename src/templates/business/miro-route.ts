import { useSyncExternalStore } from "react";
import { miroPageHref, readMiroRoute } from "./miro-route-model";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const readHash = () => window.location.hash;
const readEmptyHash = () => "";

/** Used only by the Miro entry, never subscribed by other templates. */
export function useMiroRoute() {
  const hash = useSyncExternalStore(subscribe, readHash, readEmptyHash);
  return {
    ...readMiroRoute(hash),
    href: (page: string) => miroPageHref(hash, page),
    navigate: (page: string) => {
      const next = miroPageHref(window.location.hash, page);
      if (next !== window.location.hash) window.location.hash = next;
    },
  };
}
