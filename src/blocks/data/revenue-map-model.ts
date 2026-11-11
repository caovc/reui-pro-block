export const revenueSegments = [
  { id: "all", label: "All Segments" },
  { id: "self-serve", label: "Self-Serve" },
  { id: "mid-market", label: "Mid-Market" },
  { id: "enterprise", label: "Enterprise" },
] as const;

export const revenuePeriods = [
  { id: "q3", label: "Q3 2026", first: 9, last: 11, month: "Sep 2026" },
  { id: "q2", label: "Q2 2026", first: 6, last: 8, month: "Jun 2026" },
  { id: "q1", label: "Q1 2026", first: 3, last: 5, month: "Mar 2026" },
  { id: "year", label: "Last 12 Months", first: 0, last: 11, month: "Sep 2026" },
] as const;

export type RevenueSegment = (typeof revenueSegments)[number]["id"];
export type RevenuePeriod = (typeof revenuePeriods)[number]["id"];

// Original demo accounts and revenue by market. The last two columns control
// the self-serve mix and the strength of enterprise sales in each market.
const markets = [
  ["north-america", "North America", 2240000, 2930, 54, 41],
  ["latin-america", "Latin America", 141800, 547, 75, 12],
  ["uk-ireland", "UK and Ireland", 648200, 770, 47, 36],
  ["western-europe", "Western Europe", 921600, 1188, 53, 34],
  ["nordics", "Nordics", 273900, 336, 48, 32],
  ["eastern-europe", "Eastern Europe", 143600, 555, 78, 8],
  ["middle-east", "Middle East", 209500, 193, 33, 59],
  ["africa", "Africa", 31800, 148, 81, 0],
  ["central-asia", "Central Asia", 19300, 92, 78, 0],
  ["south-asia", "South Asia", 151600, 883, 83, 8],
  ["east-asia", "East Asia", 375700, 448, 44, 47],
  ["southeast-asia", "Southeast Asia", 93600, 399, 68, 13],
  ["oceania", "Oceania", 280400, 397, 50, 29],
] as const;

export type RevenueRegionId = (typeof markets)[number][0];

const monthlyFactors = [
  0.246, 0.251, 0.257, 0.26, 0.27, 0.28, 0.29, 0.3, 0.318, 0.318, 0.337, 0.345,
];

function shares(total: number, selfServe: number, enterprise: number): [number, number, number] {
  const self = Math.round((total * selfServe) / 100);
  const ent = Math.round((total * enterprise) / 100);
  return [self, total - self - ent, ent];
}

function monthlyFacts(
  market: (typeof markets)[number],
  month: number,
  marketIndex: number,
  segment: RevenueSegment,
) {
  const [, , baselineRevenue, baselineAccounts, selfServeMix, enterpriseMix] = market;
  const matureMarket = month >= 9 ? 1 : 1 + (((marketIndex * 7 + month) % 11) - 5) / 100;
  const revenue = Math.round(baselineRevenue * monthlyFactors[month] * matureMarket);
  const accounts = Math.round(baselineAccounts * (1 - (11 - month) * 0.019) * matureMarket);
  if (segment === "all") return { revenue, accounts };

  const index = segment === "self-serve" ? 0 : segment === "mid-market" ? 1 : 2;
  return {
    revenue: shares(revenue, Math.round(selfServeMix * 0.51), enterpriseMix)[index],
    accounts: shares(accounts, selfServeMix, Math.round(enterpriseMix * 0.28))[index],
  };
}

export function revenueOverview(segment: RevenueSegment, periodId: RevenuePeriod) {
  const period = revenuePeriods.find((entry) => entry.id === periodId) ?? revenuePeriods[0];
  const facts = markets.map((market, index) => {
    const months = Array.from({ length: period.last - period.first + 1 }, (_, offset) =>
      monthlyFacts(market, period.first + offset, index, segment),
    );
    const recent = months[months.length - 1];
    return {
      id: market[0],
      label: market[1],
      revenue: months.reduce((sum, month) => sum + month.revenue, 0),
      monthlyRevenue: recent.revenue,
      accounts: recent.accounts,
    };
  });
  const revenue = facts.reduce((sum, market) => sum + market.revenue, 0);
  const monthlyRevenue = facts.reduce((sum, market) => sum + market.monthlyRevenue, 0);
  const accounts = facts.reduce((sum, market) => sum + market.accounts, 0);
  const regions = facts.map((market) => ({
    ...market,
    share: revenue > 0 ? market.revenue / revenue : 0,
  }));
  const hotSpots = regions
    .filter((region) => region.revenue > 0)
    .toSorted((left, right) => right.revenue - left.revenue)
    .slice(0, 3);

  return {
    period,
    regions,
    hotSpots,
    revenue,
    monthlyRevenue,
    accounts,
    revenuePerAccount: accounts > 0 ? monthlyRevenue / accounts : 0,
  };
}

export type RevenueRegion = ReturnType<typeof revenueOverview>["regions"][number];

export const revenueBands = [
  { label: "No revenue", color: "var(--color-border)", lower: 0 },
  { label: "<2%", color: "#36b8ac", lower: 0 },
  { label: "2%–4%", color: "#35a5ea", lower: 0.02 },
  { label: "4%–8%", color: "#8738fa", lower: 0.04 },
  { label: "8%–12%", color: "#c324df", lower: 0.08 },
  { label: "12%–25%", color: "#ef264c", lower: 0.12 },
  { label: "25%+", color: "#f5a500", lower: 0.25 },
] as const;

export function revenueBand(share: number) {
  if (share <= 0) return revenueBands[0];
  return revenueBands.findLast((entry) => share >= entry.lower) ?? revenueBands[0];
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});
const count = new Intl.NumberFormat("en-US");

export const revenueAmount = (amount: number) => usd.format(amount);
export const compactRevenue = (amount: number) => compactUsd.format(amount);
export const revenueAccountCount = (amount: number) => count.format(amount);
export const revenueShare = (share: number) =>
  share > 0 && share < 0.01 ? "<1%" : `${Math.round(share * 100)}%`;
