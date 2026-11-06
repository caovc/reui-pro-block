/** Addressable Miro pages; settings tabs retain the existing parent model. */
const pagePaths: Record<string, string> = {
  Dashboard: "/dashboard",
  Calendar: "/calendar",
  Appointments: "/appointments",
  Customers: "/customers",
  Staff: "/staff",
  Payments: "/payments",
  Settings: "/settings",
};

export interface MiroRoute {
  mount: string;
  query: string;
  owned: boolean;
  page: string | null;
}

export function readMiroRoute(hash: string): MiroRoute {
  const clean = hash.replace(/^#/, "");
  const queryAt = clean.indexOf("?");
  const path = (queryAt < 0 ? clean : clean.slice(0, queryAt)).replace(/\/$/, "");
  const query = queryAt < 0 ? "" : clean.slice(queryAt);
  const host = path.match(/^\/(?:templates|template-preview)\/([^/]+)(?=\/|$)/);
  const foreignHost = Boolean(host && host[1] !== "miro");
  const mount = host?.[1] === "miro" ? host[0] : "";
  const suffix = path.slice(mount.length);
  const page = foreignHost
    ? null
    : suffix === ""
      ? "Dashboard"
      : (Object.entries(pagePaths).find(([, route]) => route === suffix)?.[0] ?? null);
  return { mount, query, owned: !foreignHost && (Boolean(mount) || page !== null), page };
}

export function miroPageHref(hash: string, page: string): string {
  const route = readMiroRoute(hash);
  const path = pagePaths[page];
  if (!route.owned || path === undefined) return hash;
  return `#${route.mount}${path}${route.query}`;
}
