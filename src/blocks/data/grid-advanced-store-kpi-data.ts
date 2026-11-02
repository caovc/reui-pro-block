import {
  STORE_DEMO_POLICY,
  STORE_MONTHS,
  type MonthlyStoreFact,
  type StoreRecord,
} from "./grid-advanced-store-kpi-model";

// Authored fixture records; no reference-page dataset, avatars, SVGs or financial records are copied.
export const STORE_MARKETS = [
  { code: "US", name: "United States", region: "Americas", count: 15 },
  { code: "CA", name: "Canada", region: "Americas", count: 9 },
  { code: "MX", name: "Mexico", region: "Americas", count: 8 },
  { code: "BR", name: "Brazil", region: "Americas", count: 8 },
  { code: "GB", name: "United Kingdom", region: "EMEA", count: 12 },
  { code: "DE", name: "Germany", region: "EMEA", count: 9 },
  { code: "FR", name: "France", region: "EMEA", count: 9 },
  { code: "ES", name: "Spain", region: "EMEA", count: 7 },
  { code: "JP", name: "Japan", region: "APAC", count: 9 },
  { code: "AU", name: "Australia", region: "APAC", count: 8 },
] as const;

export const STORE_MANAGERS = ["Nora Vale", "Eli Rowan", "Ada Finch", "Theo Lane"];
const districts = [
  "Harbor",
  "Juniper",
  "Northgate",
  "Canal",
  "Riverside",
  "Linden",
  "Cedar",
  "Westhaven",
  "Orchard",
  "Stonebridge",
  "Ashford",
  "Seabrook",
  "Alder",
  "Greenway",
  "Elmfield",
];
const places = [
  "Arcade",
  "House",
  "Square",
  "Market",
  "Walk",
  "Court",
  "Lane",
  "Hall",
  "Yard",
  "Park",
];

export function createStoreFixtures(): StoreRecord[] {
  let sequence = 0;
  return STORE_MARKETS.flatMap((market, marketIndex) =>
    Array.from({ length: market.count }, (_, localIndex): StoreRecord => {
      const index = sequence++;
      const preopening = index > 0 && index % 23 === 0;
      const format = localIndex < 2 ? "Flagship" : localIndex % 4 === 0 ? "Outlet" : "Standard";
      const facts: MonthlyStoreFact[] = preopening
        ? []
        : Array.from({ length: 24 }, (_, position) => {
            const monthIndex = position % 12;
            const currentYear = position >= 12;
            const month = currentYear
              ? STORE_MONTHS[monthIndex].key
              : STORE_MONTHS[monthIndex].previousKey;
            const season = (STORE_DEMO_POLICY.seasonalBasisPoints[monthIndex] / 10000) * 12;
            const baseDollars =
              180000 +
              marketIndex * 9000 +
              localIndex * 13000 +
              (format === "Flagship" ? 270000 : format === "Outlet" ? -50000 : 0);
            const yearGrowth = currentYear ? 0.97 + (index % 13) * 0.009 : 1;
            const monthlyVariation = 1 + Math.sin(index * 0.7 + monthIndex * 1.2) * 0.035;
            const netSalesCents = Math.round(
              baseDollars * 100 * season * yearGrowth * monthlyVariation,
            );
            const averageOrder =
              (92 + (index % 65)) * (currentYear ? 0.99 + (index % 7) * 0.004 : 1);
            const orders = Math.round(netSalesCents / 100 / averageOrder);
            const units = Math.round(
              orders * (1.75 + (index % 9) * 0.08 + (currentYear ? 0.015 : 0)),
            );
            const rate = 0.032 + (index % 10) * 0.005 + Math.sin(monthIndex + index) * 0.004;
            return {
              month,
              netSalesCents,
              orders,
              units,
              customers: Math.round(orders * (0.74 + (index % 5) * 0.02)),
              grossProfitCents: Math.round(
                netSalesCents *
                  (0.47 + (index % 9) * 0.008 + (currentYear ? ((index % 3) - 1) * 0.006 : 0)),
              ),
              returnedUnits: Math.round(units * rate),
            };
          });
      const fiscalSales = facts
        .filter((fact) => fact.month >= "2025-11")
        .reduce((sum, fact) => sum + fact.netSalesCents, 0);
      return {
        id:
          "bricklane-store-" +
          market.code.toLowerCase() +
          "-" +
          String(localIndex + 1).padStart(2, "0"),
        name: districts[localIndex] + " " + places[marketIndex],
        market: market.code,
        marketName: market.name,
        region: market.region,
        format,
        status: preopening ? "Pre-opening" : index % 11 === 0 ? "Refit" : "Trading",
        manager: STORE_MANAGERS[index % STORE_MANAGERS.length],
        opened: preopening
          ? null
          : String(2014 + (index % 10)) +
            "-" +
            String((index % 12) + 1).padStart(2, "0") +
            "-" +
            String((index % 27) + 1).padStart(2, "0"),
        annualGoalCents: preopening
          ? null
          : Math.round(fiscalSales / (0.91 + (index % 10) * 0.02) / 100) * 100,
        facts,
      };
    }),
  );
}
