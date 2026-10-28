import { useSyncExternalStore } from "react";
import type { VerveConfigurationSection } from "./verve-configuration-data";
import type { VerveAccountSection } from "./verve-account-settings-data";

export type VerveSettingsTarget =
  | VerveAccountSection
  | VerveConfigurationSection
  | "general"
  | "billing"
  | "team"
  | null;
export interface VerveSettingsRoute {
  mount: string;
  query: string;
  section: VerveAccountSection | null;
  general: boolean;
  workspace: "billing" | "team" | null;
  configuration: VerveConfigurationSection | null;
}

/** Adapt the same native hash mount/query convention as Atlas. Unimplemented
 * settings domains are deliberately not mapped to the General page. */
export function readVerveSettingsRoute(hash: string): VerveSettingsRoute {
  const clean = hash.replace(/^#/, "");
  const queryIndex = clean.indexOf("?");
  const path = (queryIndex < 0 ? clean : clean.slice(0, queryIndex)).replace(/\/$/, "");
  const query = queryIndex < 0 ? "" : clean.slice(queryIndex);
  const mount = path.match(/^\/(?:templates|template-preview)\/verve(?=\/|$)/)?.[0] ?? "";
  const suffix = path.slice(mount.length);
  const match = suffix.match(/^\/account\/(profile|preferences|notifications)$/);
  const workspaceMatch = suffix.match(/^\/settings\/(billing|team)$/);
  const configurationMatch = suffix.match(/^\/settings\/(integrations|api-keys|webhooks)$/);
  return {
    mount,
    query,
    section: match ? (match[1] as VerveAccountSection) : null,
    general: suffix === "/settings",
    workspace: workspaceMatch ? (workspaceMatch[1] as "billing" | "team") : null,
    configuration: configurationMatch ? (configurationMatch[1] as VerveConfigurationSection) : null,
  };
}

export function verveSettingsHref(hash: string, target: VerveSettingsTarget): string {
  const { mount, query } = readVerveSettingsRoute(hash);
  const suffix =
    target === "general"
      ? "/settings"
      : target === "integrations" ||
          target === "api-keys" ||
          target === "webhooks" ||
          target === "billing" ||
          target === "team"
        ? `/settings/${target}`
        : target
          ? `/account/${target}`
          : "";
  return `#${mount}${suffix || (mount ? "" : "/")}${query}`;
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
export function useVerveSettingsRoute() {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  return {
    ...readVerveSettingsRoute(hash),
    href: (target: VerveSettingsTarget) => verveSettingsHref(hash, target),
    navigate: (target: VerveSettingsTarget) => {
      const next = verveSettingsHref(window.location.hash, target);
      if (window.location.hash !== next) window.location.hash = next;
    },
  };
}
