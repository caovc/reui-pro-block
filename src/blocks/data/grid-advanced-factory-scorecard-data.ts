import type { FilterNode, FilterQuery } from "@/components/reui/filters/filters-types";

export const quarters = [
  "Q4 2024",
  "Q1 2025",
  "Q2 2025",
  "Q3 2025",
  "Q4 2025",
  "Q1 2026",
  "Q2 2026",
  "Q3 2026",
] as const;
export type Quarter = (typeof quarters)[number];
export const currentQuarter: Quarter = "Q3 2026";
export const calls = ["Open", "Grow", "Hold", "Reduce", "Exit"] as const;
export type BuyCall = (typeof calls)[number];
export const categories = ["Footwear", "Apparel", "Accessories", "Home"] as const;
export type Category = (typeof categories)[number];
export type Lens = "All" | "Climbers" | "Fallers" | "New" | "Below floor" | "At goal";
export const lenses: Lens[] = ["All", "Climbers", "Fallers", "New", "Below floor", "At goal"];
export const owners = ["Avery Chen", "Morgan Reed", "Sofia Patel", "Noah Ellis"];
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
export const percent = (value: number) => `${value.toFixed(1)}%`;
export interface QuarterMetric {
  spend: number;
  otif: number;
  defects: number;
  orders: number;
}
export interface FactoryNote {
  id: string;
  text: string;
  date: string;
  author: string;
}
export interface Factory {
  id: string;
  name: string;
  category: Category;
  country: string;
  flag: string;
  owner: string;
  status: "Active" | "Watch" | "Paused";
  since: string;
  audit: string;
  floor: number;
  nextBuy: BuyCall;
  quarters: Record<Quarter, QuarterMetric | null>;
  notes: FactoryNote[];
}
export interface FactoryScore extends Factory {
  current: QuarterMetric;
  prior: QuarterMetric | null;
  rank: number;
  priorRank: number | null;
  movement: number | null;
  change: number | null;
  peerLow: number;
  peerHigh: number;
  position: string;
  suggested: BuyCall;
  reasons: { label: string; passed: boolean }[];
}

// Original Bricklane demonstration suppliers. No reference-site records or seeds.
const profiles: [string, Category, string, string, number, number, number, BuyCall, number][] = [
  ["Cedar Loom Works", "Apparel", "Portugal", "🇵🇹", 3310000, 96.1, 1.2, "Grow", 0],
  ["Alder Sole Studio", "Footwear", "Vietnam", "🇻🇳", 2940000, 94.3, -0.8, "Hold", 0],
  ["Morrow Stitch Co.", "Apparel", "Türkiye", "🇹🇷", 2680000, 91.4, 2.1, "Grow", 0],
  ["Northbank Ceramics", "Home", "Portugal", "🇵🇹", 2410000, 97.2, 0.6, "Grow", 0],
  ["Saffron Leatherworks", "Accessories", "India", "🇮🇳", 2180000, 89.6, -2.0, "Reduce", 0],
  ["Bracken Footwear", "Footwear", "Indonesia", "🇮🇩", 1960000, 95.7, 1.8, "Hold", 0],
  ["Fieldstone Textiles", "Home", "India", "🇮🇳", 1810000, 93.4, -0.4, "Hold", 0],
  ["Larkspur Assembly", "Accessories", "Vietnam", "🇻🇳", 1670000, 90.8, -1.3, "Open", 0],
  ["Westhaven Knits", "Apparel", "Bangladesh", "🇧🇩", 1540000, 96.4, 2.4, "Grow", 0],
  ["Juniper Forms", "Home", "Poland", "🇵🇱", 1430000, 92.1, 0.2, "Hold", 0],
  ["Copperleaf Trims", "Accessories", "Türkiye", "🇹🇷", 1320000, 88.2, -2.4, "Exit", 0],
  ["Peregrine Shoes", "Footwear", "Portugal", "🇵🇹", 1210000, 94.8, 1.6, "Open", 0],
  ["Wrenhouse Mills", "Apparel", "India", "🇮🇳", 1120000, 91.7, -0.7, "Hold", 0],
  ["Stonebridge Bags", "Accessories", "Indonesia", "🇮🇩", 1030000, 95.1, 0.5, "Grow", 0],
  ["Willowbend Home", "Home", "Vietnam", "🇻🇳", 940000, 86.8, -1.7, "Reduce", 0],
  ["Ridgeline Soles", "Footwear", "India", "🇮🇳", 870000, 92.6, 2.3, "Hold", 0],
  ["Harbor Thread", "Apparel", "Vietnam", "🇻🇳", 790000, 94.9, 0.3, "Grow", 0],
  ["Oakline Metalworks", "Home", "Poland", "🇵🇱", 730000, 90.4, -1.9, "Reduce", 0],
  ["Riverbend Belts", "Accessories", "India", "🇮🇳", 660000, 93.8, 1.1, "Hold", 0],
  ["Elm Walk", "Footwear", "Türkiye", "🇹🇷", 590000, 89.3, -0.6, "Open", 0],
  ["Briar Patch Garments", "Apparel", "Bangladesh", "🇧🇩", 520000, 96.8, 1.7, "Grow", 0],
  ["Tern Housewares", "Home", "Portugal", "🇵🇹", 460000, 94.2, -0.2, "Hold", 0],
  ["Meadowcraft Studio", "Accessories", "Portugal", "🇵🇹", 390000, 91.2, 0.9, "Hold", 0],
  ["Silverfern Footwear", "Footwear", "Vietnam", "🇻🇳", 320000, 93.1, 0.4, "Open", 7],
  ["Orchard Weave", "Apparel", "Türkiye", "🇹🇷", 250000, 95.3, 0.8, "Open", 7],
  ["Hearthline Goods", "Home", "Poland", "🇵🇱", 180000, 88.9, -0.5, "Open", 7],
];

export function createFactories(): Factory[] {
  return profiles.map(
    ([name, category, country, flag, spend, otif, trend, nextBuy, first], seed) => ({
      id: `BL-F${String(seed + 101)}`,
      name,
      category,
      country,
      flag,
      nextBuy,
      owner: owners[seed % owners.length],
      status: otif < 90 ? "Watch" : "Active",
      since: first === 7 ? "2026-07-01" : `202${(seed % 3) + 1}-02-15`,
      audit: seed % 7 === 0 ? "2025-01-20" : "2026-05-12",
      floor: category === "Footwear" ? 92 : category === "Accessories" ? 90 : 93,
      quarters: Object.fromEntries(
        quarters.map((quarter, index) => {
          const ago = 7 - index;
          const factor = 1 - ago * (seed % 2 === 0 ? 0.11 : -0.1);
          return [
            quarter,
            index < first
              ? null
              : {
                  spend: Math.round((spend * factor) / 100) * 100,
                  otif: Math.round(Math.max(80, Math.min(100, otif - trend * ago)) * 10) / 10,
                  defects: Math.round((0.3 + (seed % 6) * 0.27 + ago * 0.03) * 100) / 100,
                  orders: Math.round((spend * factor) / (11000 + seed * 300)),
                },
          ];
        }),
      ) as Record<Quarter, QuarterMetric | null>,
      notes: [
        {
          id: `note-${seed}`,
          date: "2026-09-25",
          author: owners[seed % 4],
          text: "Quarterly review prepared. Confirm capacity before the next purchase order.",
        },
      ],
    }),
  );
}

function quantile(values: number[], portion: number) {
  const ordered = [...values].sort((a, b) => a - b);
  const at = (ordered.length - 1) * portion;
  const lower = Math.floor(at);
  return ordered[lower] + (ordered[Math.ceil(at)] - ordered[lower]) * (at - lower);
}

export function quarterRanks(records: Factory[], quarter: Quarter, withinCategory = false) {
  const ranked = records
    .filter((factory) => factory.quarters[quarter] !== null)
    .sort(
      (a, b) => b.quarters[quarter]!.spend - a.quarters[quarter]!.spend || a.id.localeCompare(b.id),
    );
  const positions = new Map<string, number>();
  const groups = new Map<string, number>();
  for (const factory of ranked) {
    const key = withinCategory ? factory.category : "all";
    const place = (groups.get(key) ?? 0) + 1;
    groups.set(key, place);
    positions.set(factory.id, place);
  }
  return positions;
}

export function scoreFactories(
  records: Factory[],
  compare: Quarter,
  withinCategory = false,
): FactoryScore[] {
  const currentRanks = quarterRanks(records, currentQuarter, withinCategory);
  const previousRanks = quarterRanks(records, compare, withinCategory);
  return records.flatMap((factory) => {
    const current = factory.quarters[currentQuarter];
    if (!current) return [];
    const prior = factory.quarters[compare];
    const peers = records
      .filter((item) => item.category === factory.category)
      .flatMap((item) => item.quarters[currentQuarter]?.otif ?? []);
    const rank = currentRanks.get(factory.id)!;
    const priorRank = previousRanks.get(factory.id) ?? null;
    const reasons = [
      { label: "Factory is active", passed: factory.status === "Active" },
      { label: "Meets the contractual floor", passed: current.otif >= factory.floor },
      { label: "At or above the 95% goal", passed: current.otif >= 95 },
      {
        label: "OTIF improved against comparison",
        passed: prior !== null && current.otif > prior.otif,
      },
      {
        label: "Spend increased against comparison",
        passed: prior !== null && current.spend > prior.spend,
      },
      { label: "Defects below 1%", passed: current.defects < 1 },
      { label: "Audit within the last 12 months", passed: factory.audit >= "2025-10-01" },
      { label: "Established before this year", passed: factory.since < "2026-01-01" },
      { label: "Above category median OTIF", passed: current.otif >= quantile(peers, 0.5) },
    ];
    const suggested: BuyCall =
      factory.status === "Paused" || current.otif < factory.floor - 4
        ? "Exit"
        : current.otif < factory.floor
          ? "Reduce"
          : prior === null
            ? "Open"
            : reasons.filter((rule) => rule.passed).length >= 6
              ? "Grow"
              : "Hold";
    return [
      {
        ...factory,
        current,
        prior,
        rank,
        priorRank,
        movement: priorRank === null ? null : priorRank - rank,
        change:
          prior === null || prior.spend === 0
            ? null
            : ((current.spend - prior.spend) / prior.spend) * 100,
        peerLow: quantile(peers, 0.25),
        peerHigh: quantile(peers, 0.75),
        position:
          current.otif < factory.floor
            ? "Below floor"
            : current.otif >= 95
              ? "At goal"
              : "Between floor and goal",
        suggested,
        reasons,
      },
    ];
  });
}

/** All rows use the same 80–100 scale; out-of-range values clamp at its ends. */
export function otifPosition(value: number) {
  return Math.max(0, Math.min(100, (value - 80) * 5));
}
export function matchesLens(factory: FactoryScore, lens: Lens) {
  switch (lens) {
    case "Climbers":
      return factory.movement !== null && factory.movement > 0;
    case "Fallers":
      return factory.movement !== null && factory.movement < 0;
    case "New":
      return factory.prior === null;
    case "Below floor":
      return factory.current.otif < factory.floor;
    case "At goal":
      return factory.current.otif >= 95;
    default:
      return true;
  }
}

const fieldValue = (factory: FactoryScore, field: string): unknown => {
  switch (field) {
    case "category":
    case "country":
    case "owner":
    case "status":
    case "nextBuy":
      return factory[field];
    case "position":
      return factory.position;
    case "change":
      return factory.change;
    case "defects":
      return factory.current.defects;
    default:
      return undefined;
  }
};
const blank = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && !value.trim());

/** Tri-state evaluation skips draft rules AND empty subgroups, including inside OR. */
function evaluateNode(factory: FactoryScore, node: FilterNode): boolean | undefined {
  if (node.type === "group") {
    const values = node.rules
      .map((child) => evaluateNode(factory, child))
      .filter((value) => value !== undefined);
    if (!values.length) return undefined;
    return node.combinator === "and" ? values.every(Boolean) : values.some(Boolean);
  }
  const raw = fieldValue(factory, node.path[0]);
  if (
    !node.operator ||
    ![
      "category",
      "country",
      "owner",
      "status",
      "nextBuy",
      "position",
      "change",
      "defects",
    ].includes(node.path[0])
  )
    return undefined;
  const noValue = node.operator === "empty" || node.operator === "not_empty";
  const values = Array.isArray(node.value) ? node.value : [node.value];
  if (!noValue && (values.length === 0 || values.some(blank))) return undefined;
  const range = node.operator === "between" || node.operator === "not_between";
  if (range && values.length !== 2) return undefined;
  const many = node.operator === "is_any_of" || node.operator === "is_none_of";
  if (!noValue && !range && !many && values.length !== 1) return undefined;
  const numeric = ["eq", "neq", "gt", "gte", "lt", "lte", "between", "not_between"].includes(
    node.operator,
  );
  if (numeric && values.some((value) => !Number.isFinite(Number(value)))) return undefined;
  if (range && Number(values[0]) > Number(values[1])) return undefined;
  const text = String(raw ?? "").toLowerCase();
  const expected = values.map((value) => String(value).toLowerCase());
  let result: boolean;
  switch (node.operator) {
    case "empty":
      result = blank(raw);
      break;
    case "not_empty":
      result = !blank(raw);
      break;
    case "is":
    case "is_any_of":
      result = expected.includes(text);
      break;
    case "is_not":
    case "is_none_of":
      result = !expected.includes(text);
      break;
    case "eq":
      result = !blank(raw) && Number(raw) === Number(values[0]);
      break;
    case "neq":
      result = !blank(raw) && Number(raw) !== Number(values[0]);
      break;
    case "gt":
      result = !blank(raw) && Number(raw) > Number(values[0]);
      break;
    case "gte":
      result = !blank(raw) && Number(raw) >= Number(values[0]);
      break;
    case "lt":
      result = !blank(raw) && Number(raw) < Number(values[0]);
      break;
    case "lte":
      result = !blank(raw) && Number(raw) <= Number(values[0]);
      break;
    case "between":
      result = !blank(raw) && Number(raw) >= Number(values[0]) && Number(raw) <= Number(values[1]);
      break;
    case "not_between":
      result =
        !blank(raw) && !(Number(raw) >= Number(values[0]) && Number(raw) <= Number(values[1]));
      break;
    default:
      return undefined;
  }
  return node.negated ? !result : result;
}
export const matchesFactoryQuery = (factory: FactoryScore, query: FilterQuery) =>
  evaluateNode(factory, query) ?? true;
export const matchesFactorySearch = (factory: Factory, query: string) =>
  [factory.name, factory.country, factory.category, factory.owner, factory.id]
    .join(" ")
    .toLowerCase()
    .includes(query.trim().toLowerCase());

export interface FactoryStore {
  records: Factory[];
  undo: Factory[][];
}
export type FactoryAction =
  | { type: "put"; factory: Factory }
  | { type: "delete"; id: string }
  | { type: "call"; id: string; value: BuyCall }
  | { type: "undo" }
  | { type: "load"; records: Factory[] };
export function factoryReducer(store: FactoryStore, action: FactoryAction): FactoryStore {
  if (action.type === "load") return { records: action.records, undo: [] };
  if (action.type === "undo")
    return store.undo.length
      ? { records: store.undo[store.undo.length - 1], undo: store.undo.slice(0, -1) }
      : store;
  let records: Factory[];
  if (action.type === "put") {
    records = store.records.some((factory) => factory.id === action.factory.id)
      ? store.records.map((factory) =>
          factory.id === action.factory.id ? action.factory : factory,
        )
      : [...store.records, action.factory];
  } else if (action.type === "delete")
    records = store.records.filter((factory) => factory.id !== action.id);
  else
    records = store.records.map((factory) =>
      factory.id === action.id ? { ...factory, nextBuy: action.value } : factory,
    );
  return { records, undo: [...store.undo, store.records].slice(-30) };
}

export function newFactory(id: string): Factory {
  return {
    id,
    name: "",
    category: "Apparel",
    country: "Portugal",
    flag: "🇵🇹",
    owner: owners[0],
    status: "Active",
    since: "2026-10-01",
    audit: "2026-10-01",
    floor: 93,
    nextBuy: "Open",
    quarters: Object.fromEntries(
      quarters.map((quarter) => [
        quarter,
        quarter === currentQuarter ? { spend: 0, otif: 95, defects: 0, orders: 0 } : null,
      ]),
    ) as Record<Quarter, QuarterMetric | null>,
    notes: [],
  };
}
