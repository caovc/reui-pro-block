import type { BlockMeta } from "@/data/types";

// These are implementation modules, not the family routers or the generated
// usage example. Keep variant-specific modules ahead of their shared fallback.
// source-files.test.mjs checks the entire catalog against the reachable files.
const application: Record<string, string> = {
  dashboard: "workspace",
  stats: "workspace",
  navbar: "workspace",
  list: "workspace",
  form: "forms",
  settings: "forms",
  profile: "forms",
  wizard: "forms",
  onboarding: "forms",
  dialog: "forms",
  sheet: "forms",
  "event-calendar": "planning",
  "kanban-board": "planning",
  timeline: "planning",
  "empty-state": "planning",
  whiteboard: "whiteboard",
  "rich-text-editor": "editor",
  schedule: "schedule",
};

const shellModules = [
  "standard",
  "standard",
  "standard",
  "mail",
  "hub",
  "standard",
  "environment",
  "inventory",
  "standard",
  "standard",
  "operations",
  "standard",
  "workspaces",
  "workspaces",
  "workspaces",
  "workspaces",
  "productivity",
  "productivity",
  "productivity",
  "productivity",
  "chat-workspace",
  "fleet-hero",
  "fleet-consoles",
  "fleet-consoles",
  "fleet-consoles",
  "fleet-consoles",
  "fleet-consoles",
  "fleet-consoles",
  "fleet-consoles",
  "fleet-consoles",
  "glass-workspace",
  "fleet-consoles",
  "fleet-center",
  "invoice-queue",
  "board-workspace",
  "observability",
];

const cardModules = [
  "tiles",
  "tiles",
  "records",
  "reports",
  "tiles",
  "tiles",
  "records",
  "reports",
  "records",
  "reports",
  "tiles",
  "tiles",
  "tiles",
  "records",
  "records",
  "extended/records",
  "extended/tiles",
  "extended/tiles",
  "extended/records",
  "extended/tiles",
  "extended/tiles",
  "extended/promos",
  "extended/promos",
  "extended/records",
  "extended/metrics",
  "extended/tiles",
  "extended/records",
  "extended/metrics",
  "extended/metrics",
  "final-kpis/tiles",
  "final-kpis/tiles",
  "final-kpis/static",
  "final-kpis/tiles",
  "final-kpis/static",
  "final-kpis/static",
  "final-profiles/metrics",
  "final-profiles/metrics",
  "final-profiles/metrics",
  "final-profiles/resources",
  "final-profiles/metrics",
  "final-profiles/resources",
  "final-profiles/profiles",
  "final-profiles/profiles",
];

const commerce: Record<string, string> = {
  "category-card": "catalog",
  "filter-sidebar": "catalog",
  "product-card": "product-cards",
  "product-detail": "product-details",
  "product-grid": "product-grids",
  wishlist: "wishlist-shopping",
  receipt: "transactions",
  coupon: "promotions",
  comparison: "promotions",
  review: "promotions",
  "shop-hero": "promotions",
  blog: "marketing",
  compare: "marketing",
  faq: "marketing-contact-faq",
  contact: "marketing-contact-faq",
  hero: "heroes",
  cta: "heroes",
  "how-it-works": "heroes",
  pricing: "pricing",
};

function paths(family: string, ...modules: string[]) {
  return modules.map((module) => `src/blocks/${family}/${module}.tsx`);
}

/** Candidate implementation files in the same routing order as the previews. */
export function blockImplementationCandidates(block: BlockMeta): string[] {
  const variant = Number(block.id.split("-").at(-1));
  if (block.group === "application") {
    if (block.category === "app-shell") {
      return paths("application", `shells/${shellModules[variant - 1]}`, "shells/audited");
    }
    if (block.category === "card") {
      return paths("application", `card-variants/${cardModules[variant - 1]}`, "cards");
    }
    if (block.category === "empty-state" && variant <= 5) {
      const modules = ["data-import", "search", "project", "reports", "brief"];
      return paths("application", `empty-variants/${modules[variant - 1]}`, "planning");
    }
    if (block.category === "empty-state" && variant >= 6 && variant <= 10) {
      const modules = ["launch", "invite", "settings", "invite", "blueprints"];
      return paths("application", `empty-variants/team-setup/${modules[variant - 6]}`, "planning");
    }
    if (block.category === "empty-state" && variant >= 11 && variant <= 14) {
      const modules = ["signals", "exports", "storage", "organizations"];
      return paths(
        "application",
        `empty-variants/workspace-setup/${modules[variant - 11]}`,
        "planning",
      );
    }
    if (block.category === "auth") {
      if ([9, 12].includes(variant)) return paths("application", "auth-methods", "auth");
      if ([13, 14].includes(variant)) return paths("application", "auth-access", "auth");
      if ([10, 11, 18].includes(variant)) return paths("application", "auth-review-panels", "auth");
      if ([6, 8].includes(variant)) return paths("application", "auth-editorial", "auth");
      const module = [5, 7].includes(variant)
        ? "auth-growth"
        : [1, 2, 3, 4].includes(variant)
          ? "auth-split"
          : [15, 16, 17, 19, 20].includes(variant)
            ? "auth-centered"
            : "auth";
      return paths("application", module);
    }
    if (block.category === "flow" || block.category === "gantt") {
      return paths(
        "application",
        block.category === "flow" ? "flow-gantt-flow" : "flow-gantt-timeline",
        "planning",
      );
    }
    if (block.category === "schedule" && ["schedule-1", "schedule-8"].includes(block.id)) {
      return paths("application", "schedule-agendas", "schedule");
    }
    return paths("application", application[block.category]);
  }
  if (block.group === "ecommerce" || block.group === "marketing") {
    if (block.category === "wishlist") {
      const modules = [
        "wishlist-bulk",
        "wishlist-grid",
        "wishlist-grid",
        "wishlist-boards",
        "wishlist-priority",
        "wishlist-rail",
      ];
      return paths(
        "commerce",
        modules[block.index],
        block.index < 3 ? "wishlist-shopping" : "wishlist-collection-pages",
      );
    }
    if (block.category === "review" && [1, 2, 3].includes(block.index)) {
      const modules = ["review-topic-filter", "review-summary", "review-highlights"];
      return paths("commerce", modules[block.index - 1], "review-list-pages");
    }
    if (block.category === "review" && [0, 4, 5].includes(block.index)) {
      return paths("commerce", "review-carousels", "review-carousel-pages");
    }
    if (block.category === "receipt")
      return paths(
        "commerce",
        block.index < 3 ? "receipt-documents" : "receipt-post-purchase",
        "transactions",
      );
    if (block.category === "checkout") {
      return paths(
        "commerce",
        [2, 3, 5, 6].includes(block.index) ? "checkout-specialized" : "checkout-shared",
      );
    }
    if (block.category === "shopping-cart") {
      return paths("commerce", block.index >= 5 ? "cart-overlays" : "cart-pages");
    }
    return paths("commerce", commerce[block.category]);
  }
  if (block.group === "data-grid") {
    if (
      ["data-grid-drag-drop-3", "data-grid-editing-2", "data-grid-expansion-2"].includes(block.id)
    ) {
      const module =
        block.id === "data-grid-drag-drop-3"
          ? "grid-dispatch"
          : block.id === "data-grid-editing-2"
            ? "grid-inventory"
            : "grid-treasury";
      return paths("data", module, "grid");
    }
    return paths("data", `grid-${block.category}`);
  }
  if (block.group === "chart") {
    if (block.id === "chart-16") return paths("data", "generation-mix");
    if (block.category === "bar-chart") {
      const module = [9, 10, 29, 30].includes(variant)
        ? "bar-comparisons"
        : [32, 33, 35, 40].includes(variant)
          ? "bar-operations"
          : "bar-slo-sync";
      return paths("data", module);
    }
    if (block.category === "composed-chart") {
      const module = [19, 21].includes(variant)
        ? "treasury-composed"
        : [20, 36].includes(variant)
          ? "sales-margin-composed"
          : "canary-composed";
      return paths("data", module, "charts");
    }
    if (block.category === "line-chart") {
      const module = [4, 26].includes(variant)
        ? "balance-floor-lines"
        : variant === 23
          ? "social-lines"
          : "commerce-lines";
      return paths("data", module, "charts");
    }
    if (block.category === "sparkline") {
      const module = [1, 2, 15, 25].includes(variant)
        ? "sparkline-business"
        : [3, 5, 11].includes(variant)
          ? "sparkline-finance"
          : [31, 41, 46].includes(variant)
            ? "sparkline-operations"
            : "sparkline-budgets";
      return paths("data", module, "charts");
    }
    const modules: Record<string, string> = {
      "area-chart": "area-panels",
      "pie-chart": "pie-charts",
      "radial-chart": "radial-charts",
      "slope-chart": "slope-charts",
      "sankey-chart": "sankey-charts",
    };
    return paths("data", modules[block.category] ?? "charts");
  }
  if (block.group === "ai-agents") {
    return paths("data", block.id === "ai-chat-9" ? "branching-chat" : "ai");
  }
  if (block.category === "digital-twin") return paths("data", "digital-twin");
  if (
    (block.category === "billing" && [2, 5, 8].includes(block.index)) ||
    (block.category === "users" && [3, 4].includes(block.index))
  )
    return paths("data", "queues");
  if (
    ["files", "bookings"].includes(block.category) ||
    (block.category === "travel" && block.index === 1)
  )
    return paths("data", "business");
  if (
    (block.category === "analytics" && block.index !== 8) ||
    (block.category === "dev-ops" && [0, 1, 2, 3, 4].includes(block.index)) ||
    (block.category === "agents" && [1, 2, 4, 6, 8].includes(block.index))
  )
    return paths("data", "operations");
  if (
    (block.category === "inventory" && [3, 6, 8, 9, 10].includes(block.index)) ||
    (block.category === "users" && block.index === 1) ||
    (block.category === "billing" && block.index === 3) ||
    (block.category === "crm" && [3, 8].includes(block.index))
  )
    return paths("data", "business");
  if (
    /Dashboard|Overview|Product Signals|Spend vs Budget|Travel Operator Home|Shop Activity|Agent Eval Report/.test(
      block.name,
    )
  )
    return paths("data", "operations");
  if (
    /Permission|Tool Access Matrix|CSV Import|Builder|Plan Change|Settings|Routing Policy|Connections|Feature Flags|SSO|Reorder Rules|Alert Rules|Prompt Editor|Timeline|Access Audit|Deal Board|Pipeline Workspace|Forecast Call|Plan Catalog|Tenant Billing/.test(
      block.name,
    )
  )
    return paths("data", "workflows");
  return paths("data", "grid");
}

export function implementationFirst(files: Record<string, string>, candidates: string[]) {
  const main = candidates.find((path) => files[path] !== undefined);
  if (!main) throw new Error(`Missing implementation source: ${candidates.join(", ")}`);
  // Keep the original source byte-for-byte: Copy, single-file download and ZIP
  // all refer to the same real module, including imports, data and local helpers.
  return { [main]: files[main], ...files };
}
