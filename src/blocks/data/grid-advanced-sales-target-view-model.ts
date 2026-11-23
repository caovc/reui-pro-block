import type { FilterNode } from "@/components/reui/filters/filters-types";
import {
  filterSalesTargetStores,
  salesPeriodMonths,
  salesTargetMetrics,
  TARGET_MONTHS,
  TARGET_REGIONS,
  type SalesPeriod,
  type SalesTargetMetrics,
  type SalesTargetStore,
} from "./grid-advanced-sales-target-model.ts";

export const salesCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const salesMoney = (cents: number) => salesCurrency.format(cents / 100);
export const salesPercent = (value: number | null) =>
  value === null ? "No target" : `${value.toFixed(1)}%`;

export const SALES_PERIODS: { id: SalesPeriod; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "last3", label: "Last 3 months" },
  { id: "ytd", label: "Year to date" },
];
export const SALES_PACES = [
  "All stores",
  "Below target",
  "At or above target",
  "No target",
] as const;
export type SalesPace = (typeof SALES_PACES)[number];
export type SalesTargetRow = {
  id: string;
  kind: "total" | "region" | "store";
  label: string;
  stores: SalesTargetStore[];
  metrics: Record<SalesPeriod, SalesTargetMetrics>;
  children?: SalesTargetRow[];
};

export function salesPeriodLabel(month: string, period: SalesPeriod) {
  const months = salesPeriodMonths(month, period);
  const labels = months.map((key) => TARGET_MONTHS.find((item) => item.key === key)?.label ?? key);
  return labels.length > 1 ? `${labels[0]} – ${labels.at(-1)}` : (labels[0] ?? "");
}

export function createSalesTargetRows(stores: SalesTargetStore[], month: string): SalesTargetRow[] {
  function row(
    id: string,
    kind: SalesTargetRow["kind"],
    label: string,
    records: SalesTargetStore[],
  ) {
    return {
      id,
      kind,
      label,
      stores: records,
      metrics: Object.fromEntries(
        SALES_PERIODS.map(({ id: period }) => [period, salesTargetMetrics(records, month, period)]),
      ) as Record<SalesPeriod, SalesTargetMetrics>,
    };
  }
  return [
    row("sales-grand-total", "total", "Filtered total", stores),
    ...TARGET_REGIONS.flatMap((region) => {
      const records = stores.filter((store) => store.region === region);
      return records.length
        ? [
            {
              ...row(`sales-region-${region}`, "region", region, records),
              children: records.map((store) => row(store.id, "store", store.name, [store])),
            },
          ]
        : [];
    }),
  ];
}

/** All supported native Filters operators are explicit; unfinished rules do not filter. */
export function matchesSalesTargetQuery(
  store: SalesTargetStore,
  month: string,
  node: FilterNode,
): boolean | undefined {
  if (node.type === "group") {
    const matches = node.rules
      .map((child) => matchesSalesTargetQuery(store, month, child))
      .filter((value) => value !== undefined);
    if (!matches.length) return undefined;
    return node.combinator === "and" ? matches.every(Boolean) : matches.some(Boolean);
  }
  const values = (Array.isArray(node.value) ? node.value : [node.value]).filter(
    (value): value is string => typeof value === "string" && Boolean(value),
  );
  if (!node.operator || !values.length) return undefined;
  const field = node.path[0];
  const supported = ["is", "is_not", "is_any_of", "is_none_of"];
  if (!supported.includes(node.operator) || !["region", "format", "pace"].includes(field))
    return undefined;
  const matches =
    field === "pace"
      ? values.some(
          (value) =>
            SALES_PACES.includes(value as SalesPace) &&
            filterSalesTargetStores([store], month, "", [], [], value as SalesPace).length > 0,
        )
      : values.includes(field === "region" ? store.region : store.format);
  const result = ["is_not", "is_none_of"].includes(node.operator) ? !matches : matches;
  return node.negated ? !result : result;
}

export function salesTargetSeries(stores: SalesTargetStore[], year: number) {
  return TARGET_MONTHS.filter((month) => month.year === year).map((month) => {
    const metrics = salesTargetMetrics(stores, month.key, "month");
    return {
      month: month.key,
      label: month.shortLabel,
      actual: metrics.actualCents / 100,
      target: metrics.targetCents / 100,
    };
  });
}

export function salesTargetCsv(stores: SalesTargetStore[], month: string) {
  const values: (string | number)[][] = [
    [
      "Store",
      "Region",
      "Format",
      "Manager",
      "Period",
      "From",
      "Through",
      "Actual USD",
      "Target USD",
      "Variance USD",
      "Attainment %",
    ],
  ];
  for (const store of stores) {
    for (const period of SALES_PERIODS) {
      const metrics = salesTargetMetrics([store], month, period.id);
      const months = salesPeriodMonths(month, period.id);
      values.push([
        store.name,
        store.region,
        store.format,
        store.manager,
        period.label,
        months[0],
        months.at(-1)!,
        (metrics.actualCents / 100).toFixed(2),
        (metrics.targetCents / 100).toFixed(2),
        (metrics.varianceCents / 100).toFixed(2),
        metrics.attainment === null ? "" : metrics.attainment.toFixed(2),
      ]);
    }
  }
  return values
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

export function emptySalesTargetStore(id: string): SalesTargetStore {
  return {
    id,
    name: "",
    region: "North",
    format: "City",
    manager: "",
    facts: TARGET_MONTHS.map((month) => ({ month: month.key, actualCents: 0, targetCents: 0 })),
  };
}
