import { useSyncExternalStore } from "react";
import { STRATA_ROUTES, type StrataRoute } from "./strata-domain.ts";
import { strataSettingsQuery, type StrataSettingsTab } from "./strata-settings-routing.ts";

function isStrataRoute(path: string): path is StrataRoute {
  return (STRATA_ROUTES as readonly string[]).includes(path);
}

/** Keep preset/query bytes and the gallery/preview mount during local navigation. */
export function readStrataRoute(hash: string) {
  const raw = hash.replace(/^#/, "") || "/";
  const question = raw.indexOf("?");
  const path = question < 0 ? raw : raw.slice(0, question);
  const query = question < 0 ? "" : raw.slice(question);
  const mounted = path.match(/^(\/(?:templates|template-preview)\/strata)(?=\/|$)/);
  const mount = mounted?.[1] ?? "";
  const route = (mount ? path.slice(mount.length) : path) || "/";
  if (!isStrataRoute(route)) return null;
  return { mount, route, query };
}

export function strataRouteHref(hash: string, destination: StrataRoute) {
  const current = readStrataRoute(hash);
  if (!current || !isStrataRoute(destination)) return null;
  const suffix = destination === "/" && current.mount ? "" : destination;
  const query =
    current.route === "/settings" && destination !== "/settings"
      ? strataSettingsQuery(current.query, null)
      : current.query;
  return `#${current.mount}${suffix}${query}`;
}

export function strataSettingsHref(hash: string, tab: StrataSettingsTab) {
  const current = readStrataRoute(hash);
  if (!current) return null;
  return `#${current.mount}/settings${strataSettingsQuery(current.query, tab)}`;
}

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

export function useStrataRoute() {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  const route = readStrataRoute(hash);
  return {
    route: route?.route ?? null,
    owned: route !== null,
    href: (destination: StrataRoute) => strataRouteHref(hash, destination) ?? "#",
    navigate: (destination: StrataRoute) => {
      const target = strataRouteHref(window.location.hash, destination);
      if (target !== null && window.location.hash !== target) window.location.hash = target;
    },
    settingsTab: (tab: StrataSettingsTab) => {
      const target = strataSettingsHref(window.location.hash, tab);
      if (target !== null && window.location.hash !== target) window.location.hash = target;
    },
  };
}
