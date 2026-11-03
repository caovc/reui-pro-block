import { useMemo, useSyncExternalStore } from "react";

export type LucentAccountSection = "profile" | "billing" | "preferences";
export type LucentDestination = LucentAccountSection | "settings" | "root";

/** Lucent owns only these account/settings suffixes; queries stay byte-for-byte. */
function scope(hash: string) {
  const raw = hash.replace(/^#/, "") || "/";
  const question = raw.indexOf("?");
  const path = question < 0 ? raw : raw.slice(0, question);
  const query = question < 0 ? "" : raw.slice(question);
  const mounted = path.match(/^(\/(?:templates|template-preview)\/lucent)(?=\/|$)/);
  if (mounted) {
    const suffix = path.slice(mounted[1].length) || "/";
    if (
      suffix !== "/" &&
      suffix !== "/settings" &&
      !/^\/account\/(profile|billing|preferences)\/?$/.test(suffix)
    )
      return null;
    return { mount: mounted[1], path: suffix, query };
  }
  if (
    path === "/" ||
    /^\/account\/(profile|billing|preferences)\/?$/.test(path) ||
    path === "/settings"
  ) {
    return { mount: "", path, query };
  }
  return null;
}

export function readLucentRoute(hash: string) {
  const current = scope(hash);
  const match = current?.path.match(/^\/account\/(profile|billing|preferences)\/?$/);
  return {
    owned: current !== null,
    account: match ? (match[1] as LucentAccountSection) : null,
    settings: current?.path === "/settings",
  };
}

export function lucentRouteHref(hash: string, destination: LucentDestination) {
  const current = scope(hash);
  if (!current) return null;
  const suffix =
    destination === "root"
      ? current.mount
        ? ""
        : "/"
      : destination === "settings"
        ? "/settings"
        : `/account/${destination}`;
  return `#${current.mount}${suffix}${current.query}`;
}

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

export function useLucentAccountRoute() {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  const route = useMemo(() => readLucentRoute(hash), [hash]);
  const href = (destination: LucentDestination) => lucentRouteHref(hash, destination);
  const navigate = (destination: LucentDestination) => {
    const target = lucentRouteHref(window.location.hash, destination);
    if (target !== null && window.location.hash !== target) window.location.hash = target;
  };
  return { ...route, href, navigate };
}
