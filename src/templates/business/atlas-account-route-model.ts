import type { AtlasAccountSection } from "./atlas-account-settings-data";

export interface AtlasAccountRoute {
  mount: string;
  query: string;
  section: AtlasAccountSection | null;
}

/** Keep account links inside the current template or downloaded standalone app. */
export function readAtlasAccountRoute(hash: string): AtlasAccountRoute {
  const clean = hash.replace(/^#/, "");
  const queryIndex = clean.indexOf("?");
  const path = (queryIndex < 0 ? clean : clean.slice(0, queryIndex)).replace(/\/$/, "");
  const query = queryIndex < 0 ? "" : clean.slice(queryIndex);
  const mount = path.match(/^\/(?:templates|template-preview)\/atlas(?=\/|$)/)?.[0] ?? "";
  const accountPath = path.slice(mount.length);
  const match = accountPath.match(/^\/account\/(profile|security|preferences)$/);
  return { mount, query, section: match ? (match[1] as AtlasAccountSection) : null };
}

export function atlasAccountHref(hash: string, section: AtlasAccountSection | null): string {
  const { mount, query } = readAtlasAccountRoute(hash);
  return `#${mount}${section ? `/account/${section}` : ""}${query}`;
}
