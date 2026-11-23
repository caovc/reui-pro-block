/** Independent Bricklane store fixtures and additive, cent-based sales rules. */
export const TARGET_REGIONS = ["North", "South", "East", "West"] as const;
export const TARGET_FORMATS = ["City", "Neighborhood", "Outlet"] as const;
export type TargetRegion = (typeof TARGET_REGIONS)[number];
export type TargetFormat = (typeof TARGET_FORMATS)[number];
export type SalesPeriod = "month" | "last3" | "ytd";
export type SalesTargetFact = { month: string; actualCents: number; targetCents: number };
export type SalesTargetStore = {
  id: string;
  name: string;
  region: TargetRegion;
  format: TargetFormat;
  manager: string;
  facts: SalesTargetFact[];
};
export type SalesTargetMetrics = {
  actualCents: number;
  targetCents: number;
  varianceCents: number;
  attainment: number | null;
};
export const TARGET_MONTHS = Array.from({ length: 18 }, (_, index) => {
  const date = new Date(Date.UTC(2025, 6 + index, 1));
  return {
    key: date.toISOString().slice(0, 7),
    year: date.getUTCFullYear(),
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
    shortLabel: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date),
  };
});
export const INITIAL_TARGET_MONTH = "2026-11";

export function createSalesTargetStores(): SalesTargetStore[] {
  const names = [
    "Juniper Lane",
    "Harbor Point",
    "Willow Square",
    "Orchard Market",
    "Cedar Crossing",
    "Riverside Walk",
    "Brookfield Corner",
    "Laurel Station",
    "Birch Commons",
    "Pinecrest Yard",
    "Maple Terrace",
    "Stonegate Mall",
  ];
  return names.map((name, index): SalesTargetStore => ({
    id: `target-store-${index + 1}`,
    name,
    region: TARGET_REGIONS[Math.floor(index / 3)],
    format: TARGET_FORMATS[index % 3],
    manager: ["Amara Ortiz", "Maya Brooks", "Noah Reed", "Theo Mercer"][Math.floor(index / 3)],
    facts: TARGET_MONTHS.map((month, step) => {
      const targetCents = (98000 + index * 6700 + (step % 12) * 2600) * 100;
      return {
        month: month.key,
        targetCents: index === 11 && step === 16 ? 0 : targetCents,
        actualCents: Math.round((targetCents * (86 + ((index * 7 + step * 3) % 33))) / 100),
      };
    }),
  }));
}

/** Three-month windows cross the year boundary; YTD starts in January. */
export function salesPeriodMonths(month: string, period: SalesPeriod): string[] {
  const selected = TARGET_MONTHS.find((value) => value.key === month);
  if (!selected) return [];
  const [year, monthNumber] = month.split("-").map(Number);
  const count = period === "month" ? 1 : period === "last3" ? 3 : monthNumber;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, monthNumber - count + index, 1));
    return date.toISOString().slice(0, 7);
  });
}

export function salesTargetMetrics(
  stores: SalesTargetStore[],
  month: string,
  period: SalesPeriod,
): SalesTargetMetrics {
  const months = new Set(salesPeriodMonths(month, period));
  const facts = stores.flatMap((store) => store.facts.filter((fact) => months.has(fact.month)));
  const actualCents = facts.reduce((sum, fact) => sum + fact.actualCents, 0);
  const targetCents = facts.reduce((sum, fact) => sum + fact.targetCents, 0);
  return {
    actualCents,
    targetCents,
    varianceCents: actualCents - targetCents,
    attainment: targetCents ? (actualCents / targetCents) * 100 : null,
  };
}

export function filterSalesTargetStores(
  stores: SalesTargetStore[],
  month: string,
  search: string,
  regions: string[],
  formats: string[],
  pace: "All stores" | "Below target" | "At or above target" | "No target",
): SalesTargetStore[] {
  const query = search.trim().toLowerCase();
  return stores.filter((store) => {
    const metrics = salesTargetMetrics([store], month, "month");
    return (
      (!query ||
        [store.name, store.region, store.manager].join(" ").toLowerCase().includes(query)) &&
      (!regions.length || regions.includes(store.region)) &&
      (!formats.length || formats.includes(store.format)) &&
      (pace === "All stores" ||
        (pace === "No target"
          ? metrics.attainment === null
          : pace === "Below target"
            ? metrics.attainment !== null && metrics.attainment < 100
            : metrics.attainment !== null && metrics.attainment >= 100))
    );
  });
}

export function saveSalesTargetStore(
  stores: SalesTargetStore[],
  store: SalesTargetStore,
): { stores: SalesTargetStore[]; error: string | null } {
  const fail = (error: string) => ({ stores, error });
  if (!store.id || !store.name.trim()) return fail("Enter a store name.");
  if (!TARGET_REGIONS.includes(store.region)) return fail("Choose a region.");
  if (!TARGET_FORMATS.includes(store.format)) return fail("Choose a store format.");
  if (!store.manager.trim()) return fail("Enter a store manager.");
  if (
    store.facts.length !== TARGET_MONTHS.length ||
    store.facts.some(
      (fact) =>
        !TARGET_MONTHS.some((month) => month.key === fact.month) ||
        !Number.isSafeInteger(fact.actualCents) ||
        fact.actualCents < 0 ||
        !Number.isSafeInteger(fact.targetCents) ||
        fact.targetCents < 0,
    ) ||
    new Set(store.facts.map((fact) => fact.month)).size !== store.facts.length
  )
    return fail("Enter unique monthly records with nonnegative sales and target amounts.");
  if (
    stores.some(
      (item) => item.id !== store.id && item.name.toLowerCase() === store.name.trim().toLowerCase(),
    )
  )
    return fail("This store already exists.");
  const next = { ...store, name: store.name.trim(), manager: store.manager.trim() };
  return {
    stores: stores.some((item) => item.id === store.id)
      ? stores.map((item) => (item.id === store.id ? next : item))
      : [...stores, next],
    error: null,
  };
}

export function saveSalesTargetFact(
  stores: SalesTargetStore[],
  storeId: string,
  fact: SalesTargetFact,
): { stores: SalesTargetStore[]; error: string | null } {
  const store = stores.find((item) => item.id === storeId);
  if (!store) return { stores, error: "This store is no longer available." };
  return saveSalesTargetStore(stores, {
    ...store,
    facts: store.facts.some((item) => item.month === fact.month)
      ? store.facts.map((item) => (item.month === fact.month ? { ...fact } : item))
      : [...store.facts, { ...fact }],
  });
}
