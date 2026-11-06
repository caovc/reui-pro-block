/** Routes for the Manifest consumer; store/account models keep their ownership. */
const pagePaths: Record<string, string> = {
  Dashboard: "",
  Orders: "/orders",
  Products: "/products",
  // Existing local pages remain reachable; their original submenus are unaudited.
  Inventory: "/inventory",
  Customers: "/customers",
  Categories: "/categories",
  Promotions: "/promotions",
  Reviews: "/reviews",
  Analytics: "/analytics",
};

const sectionPaths: Record<string, string> = {
  General: "/settings",
  Team: "/settings/team",
  Payments: "/settings/payments",
  Notifications: "/settings/notifications",
  Billing: "/settings/billing",
  Locations: "/settings/locations",
  Suppliers: "/settings/suppliers",
  Profile: "/account/profile",
  Preferences: "/account/preferences",
  Security: "/account/security",
};

export interface ManifestRoute {
  mount: string;
  query: string;
  owned: boolean;
  page: string | null;
  createProduct: boolean;
}

export function readManifestRoute(hash: string): ManifestRoute {
  const clean = hash.replace(/^#/, "");
  const queryIndex = clean.indexOf("?");
  const path = (queryIndex < 0 ? clean : clean.slice(0, queryIndex)).replace(/\/$/, "");
  const query = queryIndex < 0 ? "" : clean.slice(queryIndex);
  const host = path.match(/^\/(?:templates|template-preview)\/([^/]+)(?=\/|$)/);
  const foreignHost = Boolean(host && host[1] !== "manifest");
  const mount = host?.[1] === "manifest" ? host[0] : "";
  const suffix = path.slice(mount.length);
  const createProduct = !foreignHost && suffix === "/products/new";
  const page = foreignHost
    ? null
    : createProduct
      ? "Products"
      : (Object.entries(pagePaths).find(([, route]) => route === suffix)?.[0] ?? null);
  const storeOrAccountPath =
    /^\/(?:settings(?:\/(?:general|team|payments|notifications|billing|locations|suppliers))?|account\/(?:profile|preferences|security))$/.test(
      suffix,
    );
  return {
    mount,
    query,
    owned: !foreignHost && (Boolean(mount) || page !== null || storeOrAccountPath),
    page,
    createProduct,
  };
}

export function manifestPageHref(hash: string, page: string): string {
  const route = readManifestRoute(hash);
  if (!route.owned) return hash;
  const label = page === "Settings" ? "General" : page;
  const path =
    label === "New product" ? "/products/new" : (pagePaths[label] ?? sectionPaths[label]);
  if (path === undefined) return hash;
  return `#${route.mount || (path ? "" : "/")}${path}${route.query}`;
}
