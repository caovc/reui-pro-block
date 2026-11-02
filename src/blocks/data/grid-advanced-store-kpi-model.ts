import type { FilterNode, FilterQuery } from "@/components/reui/filters/filters-types";

export const STORE_FORMATS = ["Flagship", "Standard", "Outlet"] as const;
export type StoreFormat = (typeof STORE_FORMATS)[number];
export type StoreStatus = "Trading" | "Refit" | "Pre-opening";
export type StoreGrouping = "store" | "market" | "region";

export interface MonthlyStoreFact {
  month: string;
  netSalesCents: number;
  grossProfitCents: number;
  orders: number;
  customers: number;
  units: number;
  returnedUnits: number;
}

export interface StoreRecord {
  id: string;
  name: string;
  market: string;
  marketName: string;
  region: string;
  format: StoreFormat;
  status: StoreStatus;
  manager: string;
  opened: string | null;
  annualGoalCents: number | null;
  facts: MonthlyStoreFact[];
}

export const KPI_DEFINITIONS = [
  { id: "sales", label: "Net Sales", unit: "currency", inverse: false },
  { id: "orders", label: "Orders", unit: "integer", inverse: false },
  { id: "averageOrder", label: "Avg Order", unit: "currency", inverse: false },
  { id: "grossMargin", label: "Gross Margin", unit: "percent", inverse: false },
  { id: "customers", label: "Customers", unit: "integer", inverse: false },
  { id: "unitsPerOrder", label: "Units per Order", unit: "decimal", inverse: false },
  { id: "returnRate", label: "Return Rate", unit: "percent", inverse: true },
] as const;
export type KpiId = (typeof KPI_DEFINITIONS)[number]["id"];
export type KpiValues = Record<KpiId, number | null>;

/** Explicitly authored demo policy. Exact ReUI weights and status cutoffs are not public UI facts. */
export const STORE_DEMO_POLICY = {
  provenance: "Bricklane authored demonstration; not a claimed ReUI formula",
  fiscalYear: 2026,
  // November through October, in basis points; exactly 10,000 in total.
  seasonalBasisPoints: [1000, 1300, 600, 600, 750, 800, 850, 800, 800, 800, 750, 950],
  relativeImprovementPercent: 1,
  marginImprovementPoints: 0.5,
  returnImprovementPoints: 0.2,
  returnWarningPercent: 6.5,
  returnDangerPercent: 8.5,
} as const;

export const STORE_MONTHS = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(Date.UTC(2025, 10 + index, 1));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return {
    key: year + "-" + String(month).padStart(2, "0"),
    previousKey: year - 1 + "-" + String(month).padStart(2, "0"),
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
    shortLabel: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date),
    previousLabel: new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year - 1, month - 1, 1))),
  };
});

const zeroFact = (): MonthlyStoreFact => ({
  month: "",
  netSalesCents: 0,
  grossProfitCents: 0,
  orders: 0,
  customers: 0,
  units: 0,
  returnedUnits: 0,
});

export function sumStoreMonth(stores: readonly StoreRecord[], month: string): MonthlyStoreFact {
  return stores.reduce(
    (sum, store) => {
      const fact = store.facts.find((entry) => entry.month === month);
      if (!fact) return sum;
      return {
        month,
        netSalesCents: sum.netSalesCents + fact.netSalesCents,
        grossProfitCents: sum.grossProfitCents + fact.grossProfitCents,
        orders: sum.orders + fact.orders,
        customers: sum.customers + fact.customers,
        units: sum.units + fact.units,
        returnedUnits: sum.returnedUnits + fact.returnedUnits,
      };
    },
    { ...zeroFact(), month },
  );
}

export function metricValues(fact: MonthlyStoreFact): KpiValues {
  const hasSales = fact.netSalesCents > 0;
  return {
    sales: hasSales ? fact.netSalesCents / 100 : null,
    orders: fact.orders > 0 ? fact.orders : null,
    averageOrder: fact.orders > 0 ? fact.netSalesCents / 100 / fact.orders : null,
    grossMargin: hasSales ? (fact.grossProfitCents / fact.netSalesCents) * 100 : null,
    customers: fact.customers > 0 ? fact.customers : null,
    unitsPerOrder: fact.orders > 0 ? fact.units / fact.orders : null,
    returnRate: fact.units > 0 ? (fact.returnedUnits / fact.units) * 100 : null,
  };
}

export function relativeDelta(current: number | null, previous: number | null): number | null {
  return current !== null && previous !== null && previous !== 0
    ? ((current - previous) / Math.abs(previous)) * 100
    : null;
}

export function kpiChange(id: KpiId, current: KpiValues, previous: KpiValues) {
  const next = current[id];
  const before = previous[id];
  if (next === null || before === null) return { delta: null, status: "No base" as const };
  const points = id === "grossMargin" || id === "returnRate";
  const delta = points ? next - before : relativeDelta(next, before);
  if (delta === null) return { delta, status: "No base" as const };
  const threshold =
    id === "grossMargin"
      ? STORE_DEMO_POLICY.marginImprovementPoints
      : id === "returnRate"
        ? STORE_DEMO_POLICY.returnImprovementPoints
        : STORE_DEMO_POLICY.relativeImprovementPercent;
  const favorable = id === "returnRate" ? -delta : delta;
  return {
    delta,
    status:
      favorable > threshold
        ? ("Improving" as const)
        : favorable < -threshold
          ? ("Slipping" as const)
          : ("Steady" as const),
  };
}

function comparableKpis(stores: readonly StoreRecord[], index: number) {
  const month = STORE_MONTHS[index];
  if (!month) return { values: metricValues(zeroFact()), up: null };
  const current = metricValues(sumStoreMonth(stores, month.key));
  const previous = metricValues(sumStoreMonth(stores, month.previousKey));
  return {
    values: current,
    up:
      current.sales === null
        ? null
        : KPI_DEFINITIONS.filter(
            (definition) => kpiChange(definition.id, current, previous).status === "Improving",
          ).length,
  };
}

export function storeMetrics(stores: readonly StoreRecord[], monthIndex: number) {
  const index = Math.max(0, Math.min(11, Math.trunc(monthIndex)));
  const month = STORE_MONTHS[index];
  const current = comparableKpis(stores, index);
  const previousYear = metricValues(sumStoreMonth(stores, month.previousKey));
  const previousMonth = comparableKpis(stores, index - 1);
  // Goal pace uses the stores with an assigned goal, so unplanned sales cannot inflate it.
  const planned = stores.filter((store) => store.annualGoalCents !== null);
  const annualGoalCents = planned.reduce((sum, store) => sum + (store.annualGoalCents ?? 0), 0);
  const elapsedWeight = STORE_DEMO_POLICY.seasonalBasisPoints
    .slice(0, index + 1)
    .reduce((sum, weight) => sum + weight, 0);
  const goalToDateCents = Math.round((annualGoalCents * elapsedWeight) / 10000);
  const salesToDateCents = STORE_MONTHS.slice(0, index + 1).reduce(
    (sum, selected) => sum + sumStoreMonth(planned, selected.key).netSalesCents,
    0,
  );
  const pace = goalToDateCents > 0 ? (salesToDateCents / goalToDateCents) * 100 : null;
  return {
    ...current,
    previousYear,
    pace,
    gap: pace === null ? null : pace - 100,
    annualGoalCents: annualGoalCents || null,
    goalToDateCents: goalToDateCents || null,
    salesToDateCents,
    salesDelta: relativeDelta(current.values.sales, previousYear.sales),
    ordersDelta: relativeDelta(current.values.orders, previousYear.orders),
    upDelta:
      current.up !== null && previousMonth.up !== null ? current.up - previousMonth.up : null,
    returnHistory: Array.from({ length: 6 }, (_, offset) => {
      const [year, selectedMonth] = month.key.split("-").map(Number);
      const date = new Date(Date.UTC(year, selectedMonth - 1 - 5 + offset, 1));
      const key = date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0");
      return metricValues(sumStoreMonth(stores, key)).returnRate;
    }),
    count: stores.length,
  };
}
export type StoreMetrics = ReturnType<typeof storeMetrics>;

export interface StoreGridRow {
  id: string;
  kind: "store" | "format" | "market" | "region";
  label: string;
  market?: string;
  marketName?: string;
  firstInMarket?: boolean;
  format?: StoreFormat;
  records: StoreRecord[];
  subRows?: StoreGridRow[];
}

function groupRecords(stores: StoreRecord[], key: (store: StoreRecord) => string) {
  const groups = new Map<string, StoreRecord[]>();
  for (const store of stores) {
    const id = key(store);
    const records = groups.get(id) ?? [];
    records.push(store);
    groups.set(id, records);
  }
  return groups;
}

export function groupStoreRows(stores: StoreRecord[], grouping: StoreGrouping): StoreGridRow[] {
  if (grouping !== "store") {
    const groups = groupRecords(stores, (store) =>
      grouping === "market" ? store.market : store.region,
    );
    return [...groups].map(([key, records]) => ({
      id: grouping + ":" + key,
      kind: grouping,
      label: grouping === "market" ? records[0].marketName : key,
      records,
    }));
  }
  const markets = groupRecords(stores, (store) => store.market);
  return [...markets].flatMap(([market, records]) => {
    const formats = STORE_FORMATS.filter((format) =>
      records.some((store) => store.format === format),
    );
    return formats.map((format, index) => {
      const children = records.filter((store) => store.format === format);
      return {
        id: market + ":" + format,
        kind: "format" as const,
        label: format,
        market,
        marketName: records[0].marketName,
        firstInMarket: index === 0,
        format,
        records: children,
        subRows: children.map((store) => ({
          id: store.id,
          kind: "store" as const,
          label: store.name,
          market,
          marketName: store.marketName,
          records: [store],
        })),
      };
    });
  });
}

function fieldValue(store: StoreRecord, field: string, index: number): string | number | null {
  if (field === "market") return store.market;
  if (field === "region") return store.region;
  if (field === "format") return store.format;
  if (field === "status") return store.status;
  if (field === "manager") return store.manager;
  const metrics = storeMetrics([store], index);
  if (field === "pace") return metrics.pace;
  if (field === "returns") return metrics.values.returnRate;
  if (field === "up") return metrics.up;
  return null;
}

function matchesNode(store: StoreRecord, node: FilterNode, index: number): boolean | null {
  if (node.type === "group") {
    const complete = node.rules
      .map((rule) => matchesNode(store, rule, index))
      .filter((value): value is boolean => value !== null);
    if (!complete.length) return null;
    return node.combinator === "and" ? complete.every(Boolean) : complete.some(Boolean);
  }
  if (!node.path.length || !node.operator) return null;
  if (
    !["market", "region", "format", "status", "manager", "pace", "returns", "up"].includes(
      node.path[0],
    )
  )
    return null;
  const actual = fieldValue(store, node.path[0], index);
  const wanted = node.value;
  const empty = actual === null || actual === "";
  if (
    node.operator !== "empty" &&
    node.operator !== "not_empty" &&
    (wanted === undefined ||
      wanted === null ||
      wanted === "" ||
      (Array.isArray(wanted) &&
        (!wanted.length ||
          wanted.some((value) => value === "" || value === undefined || value === null))))
  ) {
    return null;
  }
  if (
    ["eq", "neq", "gt", "gte", "lt", "lte"].includes(node.operator) &&
    !Number.isFinite(Number(wanted))
  )
    return null;
  let result: boolean;
  switch (node.operator) {
    case "empty":
      result = empty;
      break;
    case "not_empty":
      result = !empty;
      break;
    case "is":
    case "eq":
      result = typeof actual === "number" ? actual === Number(wanted) : actual === wanted;
      break;
    case "is_not":
    case "neq":
      result = typeof actual === "number" ? actual !== Number(wanted) : actual !== wanted;
      break;
    case "is_any_of":
      result = Array.isArray(wanted) && wanted.includes(actual);
      break;
    case "is_none_of":
      result = Array.isArray(wanted) && !wanted.includes(actual);
      break;
    case "gt":
      result = typeof actual === "number" && actual > Number(wanted);
      break;
    case "gte":
      result = typeof actual === "number" && actual >= Number(wanted);
      break;
    case "lt":
      result = typeof actual === "number" && actual < Number(wanted);
      break;
    case "lte":
      result = typeof actual === "number" && actual <= Number(wanted);
      break;
    case "between":
    case "not_between": {
      if (!Array.isArray(wanted) || wanted.length !== 2) return null;
      if (!wanted.every((value) => Number.isFinite(Number(value)))) return null;
      const inside =
        typeof actual === "number" && actual >= Number(wanted[0]) && actual <= Number(wanted[1]);
      result = node.operator === "between" ? inside : !inside;
      break;
    }
    default:
      return null;
  }
  return node.negated ? !result : result;
}

export function filterStores(
  stores: StoreRecord[],
  search: string,
  query: FilterQuery,
  index: number,
) {
  const text = search.trim().toLocaleLowerCase();
  return stores.filter((store) => {
    const searchable = [
      store.name,
      store.marketName,
      store.region,
      store.format,
      store.status,
      store.manager,
    ]
      .join(" ")
      .toLocaleLowerCase();
    return (!text || searchable.includes(text)) && (matchesNode(store, query, index) ?? true);
  });
}

export function parseAnnualGoal(input: string): { value: number | null; error?: string } {
  const text = input.trim();
  if (!text) return { value: null };
  const dollars = Number(text);
  if (!/^\d+$/.test(text) || dollars <= 0 || !Number.isSafeInteger(dollars * 100)) {
    return { value: null, error: "Enter a whole number of dollars, or leave it empty." };
  }
  return { value: dollars * 100 };
}
