/** Original Bricklane retail fixtures. All amount vectors are $ thousands. */
export type PnlSectionId = "revenue" | "cogs" | "fulfilment" | "marketing" | "operating";
export type PnlCompareBase = "budget" | "prior";
export type PnlConfidence = "high" | "medium" | "low";
export type PnlStatus = "adverse" | "favourable" | "in-line";

export interface PnlNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface PnlLine {
  id: string;
  name: string;
  section: PnlSectionId;
  owner: string;
  confidence: PnlConfidence;
  budget: number[];
  actual: number[];
  forecast: number[];
  prior: number[];
  notes: PnlNote[];
}

export interface PnlVariance {
  delta: number;
  /** Percentage points: 5 means 5%, not 0.05. Null means a zero baseline. */
  percent: number | null;
  status: PnlStatus;
}

export interface PnlRow {
  id: string;
  kind: "section" | "line" | "margin";
  name: string;
  section?: PnlSectionId;
  lineId?: string;
  owner: string;
  confidence?: PnlConfidence;
  lowCount: number;
  notesCount: number;
  values: number[];
  baseline: number[];
  outlook: number;
  baselineTotal: number;
  closed: number;
  closedShare: number | null;
  marginPercent: number | null;
  variance: PnlVariance;
  children?: PnlRow[];
}

export interface PnlProjection {
  rows: PnlRow[];
  profit: PnlRow;
  /** Body rows in preorder; the independently rendered profit footer is excluded. */
  flatRows: PnlRow[];
}

export const pnlYear = 2026;
export const pnlClosedMonths = 9;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const pnlMonths = monthNames.map((name, index) => ({
  id: `month-${index}`,
  index,
  name,
  short: name.slice(0, 3),
  quarter: (Math.floor(index / 3) + 1) as 1 | 2 | 3 | 4,
  forecast: index >= pnlClosedMonths,
}));

export const pnlSections: ReadonlyArray<{
  id: PnlSectionId;
  name: string;
  owner: string;
  scope: string;
  read: "higher" | "lower";
}> = [
  {
    id: "revenue",
    name: "Net Revenue",
    owner: "Mara Ellis",
    scope: "All sales channels, including customer rebates",
    read: "higher",
  },
  {
    id: "cogs",
    name: "Cost of Goods",
    owner: "Jonah Reed",
    scope: "Merchandise, supplier freight and stock adjustments",
    read: "lower",
  },
  {
    id: "fulfilment",
    name: "Fulfilment",
    owner: "Nia Patel",
    scope: "Order handling, distribution and customer delivery",
    read: "lower",
  },
  {
    id: "marketing",
    name: "Marketing",
    owner: "Owen Hart",
    scope: "Acquisition, community, membership and creative work",
    read: "lower",
  },
  {
    id: "operating",
    name: "Operating Costs",
    owner: "Tessa Moreno",
    scope: "People, premises, software and shared operations",
    read: "lower",
  },
];

interface FixtureDefinition {
  name: string;
  section: PnlSectionId;
  base: number;
  confidence: PnlConfidence;
  forecastFactor: number;
}

// These names, people, assumptions and amounts are independent demo content.
const fixtures: readonly FixtureDefinition[] = [
  {
    name: "Online storefront",
    section: "revenue",
    base: 1940,
    confidence: "high",
    forecastFactor: 1.075,
  },
  {
    name: "Neighbourhood shops",
    section: "revenue",
    base: 1130,
    confidence: "medium",
    forecastFactor: 1.035,
  },
  {
    name: "Loyalty rebates",
    section: "revenue",
    base: -84,
    confidence: "high",
    forecastFactor: 1.06,
  },
  {
    name: "Merchandise procurement",
    section: "cogs",
    base: 1210,
    confidence: "medium",
    forecastFactor: 1.018,
  },
  {
    name: "Supplier inbound",
    section: "cogs",
    base: 118,
    confidence: "low",
    forecastFactor: 1.095,
  },
  {
    name: "Stock adjustments",
    section: "cogs",
    base: 43,
    confidence: "medium",
    forecastFactor: 0.96,
  },
  {
    name: "Pick and pack",
    section: "fulfilment",
    base: 95,
    confidence: "high",
    forecastFactor: 1.025,
  },
  {
    name: "Customer delivery",
    section: "fulfilment",
    base: 76,
    confidence: "low",
    forecastFactor: 1.12,
  },
  {
    name: "Distribution hubs",
    section: "fulfilment",
    base: 68,
    confidence: "high",
    forecastFactor: 1.01,
  },
  {
    name: "Parcel protection",
    section: "fulfilment",
    base: 12,
    confidence: "medium",
    forecastFactor: 1.04,
  },
  {
    name: "Search acquisition",
    section: "marketing",
    base: 79,
    confidence: "medium",
    forecastFactor: 1.11,
  },
  {
    name: "Community campaigns",
    section: "marketing",
    base: 46,
    confidence: "high",
    forecastFactor: 0.97,
  },
  {
    name: "Member programme",
    section: "marketing",
    base: 31,
    confidence: "high",
    forecastFactor: 1.035,
  },
  {
    name: "Studio production",
    section: "marketing",
    base: 27,
    confidence: "low",
    forecastFactor: 1.14,
  },
  {
    name: "Retail team",
    section: "operating",
    base: 238,
    confidence: "high",
    forecastFactor: 1.025,
  },
  {
    name: "Space and utilities",
    section: "operating",
    base: 112,
    confidence: "medium",
    forecastFactor: 1.07,
  },
  {
    name: "Platform subscriptions",
    section: "operating",
    base: 49,
    confidence: "high",
    forecastFactor: 1.012,
  },
  {
    name: "Shared operations",
    section: "operating",
    base: 64,
    confidence: "medium",
    forecastFactor: 0.985,
  },
];

const seasonality = [0.91, 0.94, 1.02, 0.97, 1.01, 1.04, 0.99, 1.03, 1.08, 1.12, 1.19, 1.27];
const actualFactors = [0.986, 1.012, 1.028, 0.975, 1.019, 1.035, 0.992, 1.023, 1.041];

/** A fresh object graph on every call, including vectors and original notes. */
export function createPnlLines(): PnlLine[] {
  return fixtures.map((fixture, lineIndex) => {
    const id = `rpo-line-${String(lineIndex + 1).padStart(2, "0")}`;
    const section = pnlSections.find((item) => item.id === fixture.section)!;
    const budget = seasonality.map((weight) => Math.round(fixture.base * weight));
    return {
      id,
      name: fixture.name,
      section: fixture.section,
      owner: section.owner,
      confidence: fixture.confidence,
      budget,
      actual: budget.map((value, month) =>
        month < pnlClosedMonths
          ? Math.round(value * actualFactors[month] * (1 + ((lineIndex % 5) - 2) * 0.004))
          : 0,
      ),
      forecast: budget.map((value, month) =>
        month >= pnlClosedMonths ? Math.round(value * fixture.forecastFactor) : 0,
      ),
      prior: budget.map((value, month) =>
        Math.round(value / (1.045 + (lineIndex % 4) * 0.009 + (month % 3) * 0.003)),
      ),
      notes:
        lineIndex === 0 || lineIndex === 7
          ? [
              {
                id: `${id}-note-1`,
                text:
                  lineIndex === 0
                    ? "Quarter-end outlook reflects the new neighbourhood collection launch."
                    : "Review the parcel-rate assumption before the next planning meeting.",
                author: section.owner,
                createdAt: "2026-09-28T09:00:00.000Z",
              },
            ]
          : [],
    };
  });
}
