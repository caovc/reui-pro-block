/** Consumer-owned routes for the existing Surge preview data and forms. */
const pagePaths: Record<string, string> = {
  Dashboard: "",
  Orders: "/orders",
  Products: "/products",
  Inventory: "/inventory",
  "Reorder queue": "/inventory/reorder",
  Customers: "/customers",
  Groups: "/customers/groups",
  Categories: "/categories",
  Promotions: "/promotions",
  Reviews: "/reviews",
  Analytics: "/analytics",
};

// Existing store/account route adapters still own the corresponding page models.
// These anchors also work when leaving a standalone ordinary commerce route.
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

export interface SurgeRoute {
  mount: string;
  query: string;
  owned: boolean;
  page: string | null;
  createProduct: boolean;
}

export function readSurgeRoute(hash: string): SurgeRoute {
  const clean = hash.replace(/^#/, "");
  const queryIndex = clean.indexOf("?");
  const path = (queryIndex < 0 ? clean : clean.slice(0, queryIndex)).replace(/\/$/, "");
  const query = queryIndex < 0 ? "" : clean.slice(queryIndex);
  const host = path.match(/^\/(?:templates|template-preview)\/([^/]+)(?=\/|$)/);
  const foreignHost = Boolean(host && host[1] !== "surge");
  const mount = host?.[1] === "surge" ? host[0] : "";
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

export function surgePageHref(hash: string, page: string): string {
  const route = readSurgeRoute(hash);
  if (!route.owned) return hash;
  const normalized =
    page === "Stock ledger"
      ? "Inventory"
      : page === "All customers"
        ? "Customers"
        : page === "Settings"
          ? "General"
          : page;
  const path =
    normalized === "New product"
      ? "/products/new"
      : (pagePaths[normalized] ?? sectionPaths[normalized]);
  if (path === undefined) return hash;
  return `#${route.mount || (path ? "" : "/")}${path}${route.query}`;
}
