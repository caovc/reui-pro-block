export type DriveTemplateId = "filespace" | "filebox";
export type DriveSettingsSection = "profile" | "workspace" | "team" | "billing";
export type DriveRoute =
  | { kind: "files" }
  | { kind: "settings"; section: DriveSettingsSection; memberSlug?: string }
  | { kind: "pricing" }
  | { kind: "login" };

type DriveMount = { base: string; path: string; query: string };

function mount(hash: string, templateId: DriveTemplateId): DriveMount {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  const queryStart = value.indexOf("?");
  const path = queryStart < 0 ? value : value.slice(0, queryStart);
  const query = queryStart < 0 ? "" : value.slice(queryStart);
  const preview = path.match(/^\/(templates|template-preview)\/(filespace|filebox)(?=\/|$)/);
  if (preview)
    return {
      base: `/${preview[1]}/${templateId}`,
      path: path.slice(preview[0].length),
      query,
    };
  return { base: "", path, query };
}

export function readDriveRoute(hash: string, templateId: DriveTemplateId): DriveRoute {
  const path = mount(hash, templateId).path.replace(/\/+$/, "") || "/";
  if (path === "/pricing") return { kind: "pricing" };
  if (path === "/login") return { kind: "login" };
  if (path === "/settings") return { kind: "settings", section: "profile" };
  const match = path.match(/^\/settings\/(workspace|team|billing)(?:\/([^/]+))?$/);
  if (!match || (match[2] && match[1] !== "team")) return { kind: "files" };
  const section = match[1] as DriveSettingsSection;
  if (!match[2]) return { kind: "settings", section };
  try {
    const memberSlug = decodeURIComponent(match[2]);
    if (!/^[a-z0-9-]+$/i.test(memberSlug)) return { kind: "files" };
    return { kind: "settings", section, memberSlug };
  } catch {
    return { kind: "files" };
  }
}

export function driveRouteHref(
  hash: string,
  templateId: DriveTemplateId,
  route: DriveRoute,
): string {
  const { base, query } = mount(hash, templateId);
  let path = "";
  if (route.kind === "settings") {
    path = route.section === "profile" ? "/settings" : `/settings/${route.section}`;
    if (route.section === "team" && route.memberSlug)
      path += `/${encodeURIComponent(route.memberSlug)}`;
  } else if (route.kind !== "files") path = `/${route.kind}`;
  return `#${base}${path || (base ? "" : "/")}${query}`;
}
