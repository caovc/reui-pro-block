export type DriveTemplateId = "filespace" | "filebox";
export type DriveSettingsSection = "profile" | "workspace" | "team" | "billing";
export type DriveView = "My Drive" | "Shared With Me" | "Favourites" | "Bin" | "Recent";
export type DriveLocation =
  | { kind: "view"; view: DriveView }
  | { kind: "folder"; source: "record" | "tree"; id: string }
  | { kind: "file"; id: string }
  | { kind: "lookup"; entity: "file" | "folder"; name: string };
export type DriveRoute =
  | { kind: "files"; location?: DriveLocation }
  | { kind: "settings"; section: DriveSettingsSection; memberSlug?: string }
  | { kind: "pricing" }
  | { kind: "login" }
  | { kind: "missing"; path: string };

const driveViewPaths: Record<DriveView, string> = {
  "My Drive": "/drive",
  "Shared With Me": "/shared",
  Favourites: "/starred",
  Bin: "/bin",
  Recent: "/recent",
};

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
  const rawPath = mount(hash, templateId).path;
  const path = rawPath.replace(/\/+$/, "") || "/";
  const missing: DriveRoute = { kind: "missing", path: rawPath };
  if (path === "/") return { kind: "files" };
  if (path === "/pricing") return { kind: "pricing" };
  if (path === "/login") return { kind: "login" };
  if (path === "/settings") return { kind: "settings", section: "profile" };
  for (const view of Object.keys(driveViewPaths) as DriveView[]) {
    if (driveViewPaths[view] === path) return { kind: "files", location: { kind: "view", view } };
  }
  try {
    const settings = path.match(/^\/settings\/(workspace|team|billing)(?:\/([^/]+))?$/);
    if (settings) {
      if (settings[2] && settings[1] !== "team") return missing;
      const section = settings[1] as DriveSettingsSection;
      if (!settings[2]) return { kind: "settings", section };
      const memberSlug = decodeURIComponent(settings[2]);
      if (!/^[a-z0-9-]+$/i.test(memberSlug)) return missing;
      return { kind: "settings", section, memberSlug };
    }
    const lookup = path.match(/^\/(files|folders)\/name\/([^/]+)$/);
    if (lookup)
      return {
        kind: "files",
        location: {
          kind: "lookup",
          entity: lookup[1] === "files" ? "file" : "folder",
          name: decodeURIComponent(lookup[2]),
        },
      };
    const folder = path.match(/^\/folders\/(record|tree)\/([^/]+)$/);
    if (folder)
      return {
        kind: "files",
        location: {
          kind: "folder",
          source: folder[1] as "record" | "tree",
          id: decodeURIComponent(folder[2]),
        },
      };
    const file = path.match(/^\/files\/([^/]+)$/);
    if (file) return { kind: "files", location: { kind: "file", id: decodeURIComponent(file[1]) } };
  } catch {
    return missing;
  }
  return missing;
}

function driveLocationPath(location: DriveLocation): string {
  switch (location.kind) {
    case "view":
      return driveViewPaths[location.view];
    case "folder":
      return `/folders/${location.source}/${encodeURIComponent(location.id)}`;
    case "file":
      return `/files/${encodeURIComponent(location.id)}`;
    case "lookup":
      return `/${location.entity === "file" ? "files" : "folders"}/name/${encodeURIComponent(location.name)}`;
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
  } else if (route.kind === "files") {
    if (route.location) path = driveLocationPath(route.location);
  } else if (route.kind === "missing") path = route.path;
  else path = `/${route.kind}`;
  return `#${base}${path || (base ? "" : "/")}${query}`;
}
