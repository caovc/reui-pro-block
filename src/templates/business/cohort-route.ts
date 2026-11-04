import { useSyncExternalStore } from "react";
import { cohortPageHref, readCohortRoute } from "./cohort-route-model";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const readHash = () => window.location.hash;

export function useCohortRoute() {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  return {
    ...readCohortRoute(hash),
    href: (page: string, department?: string) => cohortPageHref(hash, page, department),
    navigate: (page: string) => {
      const next = cohortPageHref(window.location.hash, page);
      if (window.location.hash !== next) window.location.hash = next;
    },
  };
}
