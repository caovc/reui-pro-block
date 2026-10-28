/**
 * Bricklane original Strategy Scorecard demo data (MIT).
 * Public QA informs capability boundaries only; no upstream KPI fixture is copied.
 * Business scoring is a local domain contract, not a DataGrid/Filters engine.
 */
export type MarketCode = "US" | "GB" | "DE" | "CA" | "FR" | "NL" | "JP" | "AU" | "SE" | "NO";
export type ScoreStatus = "on-track" | "watch" | "off-track" | "not-scored";
export type KpiDirection = "higher" | "lower";
export type ValueUnit =
  | "currency-million"
  | "currency"
  | "percent"
  | "number"
  | "days"
  | "hours"
  | "minutes"
  | "ratio"
  | "kg";

export interface ScorecardMonth {
  index: number;
  id: string;
  label: string;
  shortLabel: string;
}
export interface Market {
  id: MarketCode;
  code: MarketCode;
  name: string;
  salesWeight: number;
  flag: string;
}
export interface Owner {
  id: string;
  name: string;
  initials: string;
  color: string;
}
export interface Perspective {
  id: string;
  title: string;
  description: string;
  color: string;
  weight: number;
}
export interface Objective {
  id: string;
  perspectiveId: string;
  title: string;
  description: string;
}
export type MarketActuals = Record<MarketCode, (number | null)[]>;
export interface Kpi {
  id: string;
  objectiveId: string;
  title: string;
  description: string;
  ownerId: string;
  unit: ValueUnit;
  direction: KpiDirection;
  weight: number;
  baseline: number;
  target: number;
  actuals: MarketActuals;
}
export interface ScoreThresholds {
  onTrack: number;
  watch: number;
}
export interface ScorecardState {
  perspectives: Perspective[];
  objectives: Objective[];
  kpis: Kpi[];
  thresholds: ScoreThresholds;
}
export interface MonthScore {
  monthIndex: number;
  actual: number | null;
  score: number | null;
  change: number | null;
}
export interface ScoreCounts {
  total: number;
  scored: number;
  onTrack: number;
  watch: number;
  offTrack: number;
  notScored: number;
}
export interface MarketScore {
  market: Market;
  actual: number | null;
  score: number | null;
  status: ScoreStatus;
  change: number | null;
}
export interface AggregateScore {
  score: number | null;
  status: ScoreStatus;
  change: number | null;
  history: MonthScore[];
}
export interface KpiScore extends AggregateScore {
  kpi: Kpi;
  owner: Owner | null;
  actual: number | null;
  toGo: number | null;
  markets: MarketScore[];
  laggingMarket: MarketScore | null;
  offTrackMarkets: number;
}
export interface ObjectiveScore extends AggregateScore {
  objective: Objective;
  counts: ScoreCounts;
  kpiWeightTotal: number;
  scoredWeightTotal: number;
  weightWarning: boolean;
}
export interface PerspectiveScore extends AggregateScore {
  perspective: Perspective;
  counts: ScoreCounts;
  objectiveCount: number;
}
export interface ComputedScorecard {
  monthIndex: number;
  company: AggregateScore;
  companyMarkets: MarketScore[];
  offTrackMarkets: number;
  perspectives: PerspectiveScore[];
  objectives: ObjectiveScore[];
  kpis: KpiScore[];
  counts: ScoreCounts;
  weakestPerspective: PerspectiveScore | null;
  perspectiveWeightTotal: number;
}
export interface ScorecardRow {
  id: string;
  kind: "perspective" | "objective" | "kpi";
  title: string;
  description: string;
  perspectiveId: string;
  perspectiveTitle: string;
  objectiveId: string | null;
  objectiveTitle: string;
  kpiId: string | null;
  owner: Owner | null;
  weight: number | null;
  baseline: number | null;
  value: number | null;
  target: number | null;
  toGo: number | null;
  score: number | null;
  status: ScoreStatus;
  change: number | null;
  unit: ValueUnit | null;
  direction: KpiDirection | null;
  kpiCount: number;
  scoredCount: number;
  offTrackCount: number;
  weightTotal: number | null;
  weightWarning: boolean;
  markets: MarketScore[];
  months: MonthScore[];
  searchText: string;
  children: ScorecardRow[];
}

export const DEFAULT_MONTH_INDEX = 8;
export const MONTHS: readonly ScorecardMonth[] = [
  { index: 0, id: "2026-01", label: "Jan 2026", shortLabel: "Jan" },
  { index: 1, id: "2026-02", label: "Feb 2026", shortLabel: "Feb" },
  { index: 2, id: "2026-03", label: "Mar 2026", shortLabel: "Mar" },
  { index: 3, id: "2026-04", label: "Apr 2026", shortLabel: "Apr" },
  { index: 4, id: "2026-05", label: "May 2026", shortLabel: "May" },
  { index: 5, id: "2026-06", label: "Jun 2026", shortLabel: "Jun" },
  { index: 6, id: "2026-07", label: "Jul 2026", shortLabel: "Jul" },
  { index: 7, id: "2026-08", label: "Aug 2026", shortLabel: "Aug" },
  { index: 8, id: "2026-09", label: "Sep 2026", shortLabel: "Sep" },
];

export const MARKETS: readonly Market[] = [
  {
    id: "US",
    code: "US",
    name: "United States",
    salesWeight: 30,
    flag: "🇺🇸",
  },
  {
    id: "GB",
    code: "GB",
    name: "United Kingdom",
    salesWeight: 14,
    flag: "🇬🇧",
  },
  {
    id: "DE",
    code: "DE",
    name: "Germany",
    salesWeight: 12,
    flag: "🇩🇪",
  },
  {
    id: "CA",
    code: "CA",
    name: "Canada",
    salesWeight: 9,
    flag: "🇨🇦",
  },
  {
    id: "FR",
    code: "FR",
    name: "France",
    salesWeight: 8,
    flag: "🇫🇷",
  },
  {
    id: "NL",
    code: "NL",
    name: "Netherlands",
    salesWeight: 7,
    flag: "🇳🇱",
  },
  {
    id: "JP",
    code: "JP",
    name: "Japan",
    salesWeight: 6,
    flag: "🇯🇵",
  },
  {
    id: "AU",
    code: "AU",
    name: "Australia",
    salesWeight: 5,
    flag: "🇦🇺",
  },
  {
    id: "SE",
    code: "SE",
    name: "Sweden",
    salesWeight: 5,
    flag: "🇸🇪",
  },
  {
    id: "NO",
    code: "NO",
    name: "Norway",
    salesWeight: 4,
    flag: "🇳🇴",
  },
];

export const OWNERS: readonly Owner[] = [
  {
    id: "owner-elio",
    name: "Elio Voss",
    initials: "EV",
    color: "#7c3aed",
  },
  {
    id: "owner-mara",
    name: "Mara Quinn",
    initials: "MQ",
    color: "#0369a1",
  },
  {
    id: "owner-zoya",
    name: "Zoya Ellis",
    initials: "ZE",
    color: "#be185d",
  },
  {
    id: "owner-ruben",
    name: "Ruben Moss",
    initials: "RM",
    color: "#0f766e",
  },
  {
    id: "owner-aya",
    name: "Aya Nouri",
    initials: "AN",
    color: "#b45309",
  },
  {
    id: "owner-dev",
    name: "Dev Rao",
    initials: "DR",
    color: "#4338ca",
  },
  {
    id: "owner-nell",
    name: "Nell Arlo",
    initials: "NA",
    color: "#4d7c0f",
  },
  {
    id: "owner-soren",
    name: "Soren Vale",
    initials: "SV",
    color: "#a21caf",
  },
];

export const SCORE_STATUS_LABELS: Record<ScoreStatus, string> = {
  "on-track": "On Track",
  watch: "Watch",
  "off-track": "Off Track",
  "not-scored": "Not Scored",
};

/** Explicit original rules; unknown official edge cases are not asserted as reproduced. */
export const ORIGINAL_DOMAIN_CONTRACT = {
  origin:
    "Bricklane original entities, people, observations and business rules; not upstream data.",
  months: "Jan–Sep 2026; monthIndex is an integer from 0 to 8; September is the default.",
  observations:
    "Ten raw market series per KPI. No company or summary score is stored as fixture data.",
  marketWeights:
    "Sales weights: US30 GB14 DE12 CA9 FR8 NL7 JP6 AU5 SE5 NO4. Only US30 is observed; all other weights are our original assumption.",
  completeness:
    "Company actual requires ten finite market actuals. Any missing market makes that month unscored; no hidden missing-market renormalization.",
  progress:
    "Higher: (actual-baseline)/(target-baseline)*100. Lower: (baseline-actual)/(baseline-target)*100. Clamp each KPI/market score to 0–100 before aggregation.",
  zeroRange:
    "When target equals baseline, score is 100 if actual meets the direction's target condition, otherwise 0.",
  objectives:
    "Normalize strictly positive weights across scored KPIs only. Keep raw weight totals, including zero/unscored KPIs, visible; do not silently rewrite a total of 90 to 100.",
  perspectives:
    "Equal arithmetic mean of scored objective scores within the perspective. Empty/unscored objectives do not contribute.",
  company:
    "Normalize strictly positive perspective weights across scored perspectives only. Summaries always use all domain data, independently of table search/filters/expansion.",
  status:
    "On Track >=70; Watch >=45; below45 Off Track; null Not Scored. Editable thresholds require 0<=watch<=onTrack<=100; status compares unrounded scores.",
  changes:
    "Current progress minus previous month's progress, in percentage points; never relative growth. January or either missing score yields null.",
  units:
    "currency-million stores millions of USD (1.88 means $1.88M); currency stores USD; percent stores percentage points (64.2 means64.2%); ratio stores a bare multiple; days/hours/minutes/kg are raw labeled units; number is a plain scalar.",
  owners:
    "Empty ownerId is Unassigned and derives owner:null; nonempty unknown demo IDs are rejected.",
  missingAndZero:
    "null is missing, finite zero is observed. Finite negative actuals are allowed. Never coerce blank, null or invalid text to zero.",
  input:
    "Mutations reject nonfinite numbers, invalid IDs/months/weights/units/direction or reversed target ranges atomically. Empty editor text or an em dash parses to null. No exponent or ambiguous compact suffix parsing.",
  companyWrite:
    "For a complete month, add the same raw-unit delta to every market, preserving gaps. If incomplete, replace all ten selected-month values with the requested actual. Null clears all ten selected-month values. Other months stay unchanged.",
  companyMarkets:
    "Original footer contract, not an inferred official formula: each market reuses positive scored KPI-weight normalization per objective, equal scored-objective means per perspective, then normalized scored-perspective weights. Prior market KPI score is current score minus change only when both are present. Cross-unit market actual is always null. Thresholds and fixed market-order ties are unchanged.",
  laggingMarket:
    "Lowest scored market progress, ties in fixed MARKETS declaration order; market off-track counts use the same thresholds. No market sorting engine is provided.",
  filters:
    "Consume the actual free FilterQuery tree as a row predicate, preserving nested AND/OR and rule negation. Table search/filter row models, sorting, pagination and selection remain native DataGrid/useTable responsibilities.",
} as const;

const PERSPECTIVES: Perspective[] = [
  {
    id: "persp-resilience",
    title: "Financial resilience",
    description: "A durable cash cycle gives the workshop room to invest.",
    weight: 32,
    color: "#7c3aed",
  },
  {
    id: "persp-confidence",
    title: "Customer confidence",
    description: "Useful adoption and clear resolutions earn the next renewal.",
    weight: 26,
    color: "#0284c7",
  },
  {
    id: "persp-delivery",
    title: "Delivery systems",
    description: "Reliable handoffs keep exceptions from becoming repeat work.",
    weight: 24,
    color: "#0d9488",
  },
  {
    id: "persp-renewal",
    title: "People and renewal",
    description: "Share practical knowledge while reducing the resources each account needs.",
    weight: 18,
    color: "#b45309",
  },
];

const OBJECTIVES: Objective[] = [
  {
    id: "obj-receipts",
    perspectiveId: "persp-resilience",
    title: "Earn durable receipts",
    description: "Collect useful recurring work without slowing customers down.",
  },
  {
    id: "obj-productive",
    perspectiveId: "persp-resilience",
    title: "Keep contracts productive",
    description: "Retain contribution as the account base broadens.",
  },
  {
    id: "obj-quarter",
    perspectiveId: "persp-resilience",
    title: "Fund the next quarter",
    description: "Keep cash available for deliberate product work.",
  },
  {
    id: "obj-adoption",
    perspectiveId: "persp-confidence",
    title: "Make adoption useful",
    description: "Help teams turn setup effort into repeatable daily work.",
  },
  {
    id: "obj-clarity",
    perspectiveId: "persp-confidence",
    title: "Resolve with clarity",
    description: "Reduce handoffs and earn voluntary recommendations.",
  },
  {
    id: "obj-dispatch",
    perspectiveId: "persp-delivery",
    title: "Keep dispatch predictable",
    description: "Make promises that each market can consistently meet.",
  },
  {
    id: "obj-rework",
    perspectiveId: "persp-delivery",
    title: "Avoid repeated work",
    description: "Catch defects before they become another queue.",
  },
  {
    id: "obj-knowledge",
    perspectiveId: "persp-renewal",
    title: "Make knowledge travel",
    description: "Build shared capability without concentrating it in one team.",
  },
  {
    id: "obj-resources",
    perspectiveId: "persp-renewal",
    title: "Reduce resource load",
    description: "Deliver the same useful outcome with fewer material inputs.",
  },
];

interface KpiDefinition extends Omit<Kpi, "actuals"> {
  monthlyValues: (number | null)[];
  marketSpread: number;
}

// Original observation centers, not progress percentages or precomputed summaries.
const KPI_DEFINITIONS: KpiDefinition[] = [
  {
    id: "kpi-service-receipts",
    objectiveId: "obj-receipts",
    title: "Contracted service receipts",
    description: "Bricklane tracks contracted service receipts across all ten sales markets.",
    ownerId: "owner-elio",
    unit: "currency-million",
    direction: "higher",
    weight: 40,
    baseline: 1.35,
    target: 2.05,
    monthlyValues: [1.39, 1.43, 1.5, 1.57, 1.61, 1.68, 1.77, 1.81, 1.88],
    marketSpread: 0.065,
  },
  {
    id: "kpi-seat-yield",
    objectiveId: "obj-receipts",
    title: "Seat expansion yield",
    description: "Bricklane tracks seat expansion yield across all ten sales markets.",
    ownerId: "owner-mara",
    unit: "percent",
    direction: "higher",
    weight: 35,
    baseline: 6,
    target: 15,
    monthlyValues: [6.7, 7.4, 8.1, 8.8, 9.6, 10.2, 10.6, 11.4, 12.7],
    marketSpread: 1.8,
  },
  {
    id: "kpi-collection-span",
    objectiveId: "obj-receipts",
    title: "Invoice collection span",
    description: "Bricklane tracks invoice collection span across all ten sales markets.",
    ownerId: "owner-elio",
    unit: "days",
    direction: "lower",
    weight: 25,
    baseline: 39,
    target: 28,
    monthlyValues: [38.5, 37.6, 36.4, 35.7, 34.8, 33.6, 33.0, 31.8, 30.6],
    marketSpread: 1.5,
  },
  {
    id: "kpi-shipment-contribution",
    objectiveId: "obj-productive",
    title: "Contribution per shipment",
    description: "Bricklane tracks contribution per shipment across all ten sales markets.",
    ownerId: "owner-ruben",
    unit: "currency",
    direction: "higher",
    weight: 45,
    baseline: 18,
    target: 24,
    monthlyValues: [18.4, 18.9, 19.5, 19.7, 20.1, 20.4, 20.2, 20.8, 21.1],
    marketSpread: 0.8,
  },
  {
    id: "kpi-support-intensity",
    objectiveId: "obj-productive",
    title: "Support cost intensity",
    description: "Bricklane tracks support cost intensity across all ten sales markets.",
    ownerId: "owner-mara",
    unit: "percent",
    direction: "lower",
    weight: 35,
    baseline: 16,
    target: 11,
    monthlyValues: [15.8, 15.6, 15.2, 15.4, 14.9, 14.6, 14.1, 14.0, 13.8],
    marketSpread: 0.7,
  },
  {
    id: "kpi-recovery-credits",
    objectiveId: "obj-productive",
    title: "Recovery credit share",
    description: "Bricklane tracks recovery credit share across all ten sales markets.",
    ownerId: "owner-ruben",
    unit: "percent",
    direction: "lower",
    weight: 20,
    baseline: 7.6,
    target: 4,
    monthlyValues: [7.4, 7.1, 6.8, 6.4, 6.2, 5.9, 5.5, 5.4, 5.1],
    marketSpread: 0.5,
  },
  {
    id: "kpi-reserve-days",
    objectiveId: "obj-quarter",
    title: "Reserve coverage days",
    description: "Bricklane tracks reserve coverage days across all ten sales markets.",
    ownerId: "owner-elio",
    unit: "days",
    direction: "higher",
    weight: 45,
    baseline: 62,
    target: 95,
    monthlyValues: [63, 64, 67, 70, 73, 75, 78, 81, 84],
    marketSpread: 5,
  },
  {
    id: "kpi-balance-exposure",
    objectiveId: "obj-quarter",
    title: "Overdue balance exposure",
    description: "Bricklane tracks overdue balance exposure across all ten sales markets.",
    ownerId: "owner-aya",
    unit: "percent",
    direction: "lower",
    weight: 30,
    baseline: 12,
    target: 6,
    monthlyValues: [11.8, 11.5, 11.1, 10.8, 10.5, 10.3, 9.9, 10.0, 9.7],
    marketSpread: 0.9,
  },
  {
    id: "kpi-conversion-coverage",
    objectiveId: "obj-quarter",
    title: "Cash conversion coverage",
    description: "Bricklane tracks cash conversion coverage across all ten sales markets.",
    ownerId: "owner-aya",
    unit: "ratio",
    direction: "higher",
    weight: 15,
    baseline: 0.75,
    target: 1.1,
    monthlyValues: [0.77, 0.79, 0.83, 0.86, 0.88, 0.91, 0.94, 0.96, 0.99],
    marketSpread: 0.04,
  },
  {
    id: "kpi-guided-setup",
    objectiveId: "obj-adoption",
    title: "Guided setup completion",
    description: "Bricklane tracks guided setup completion across all ten sales markets.",
    ownerId: "owner-zoya",
    unit: "percent",
    direction: "higher",
    weight: 30,
    baseline: 52,
    target: 78,
    monthlyValues: [54, 56, 59, 61, 64, 65, 67, 69, 72],
    marketSpread: 3.2,
  },
  {
    id: "kpi-workspace-depth",
    objectiveId: "obj-adoption",
    title: "Active workspace depth",
    description: "Bricklane tracks active workspace depth across all ten sales markets.",
    ownerId: "owner-zoya",
    unit: "number",
    direction: "higher",
    weight: 30,
    baseline: 2.4,
    target: 4,
    monthlyValues: [2.5, 2.65, 2.7, 2.8, 2.95, 3.0, 3.1, 3.2, 3.35],
    marketSpread: 0.2,
  },
  {
    id: "kpi-trial-interval",
    objectiveId: "obj-adoption",
    title: "Trial decision interval",
    description: "Bricklane tracks trial decision interval across all ten sales markets.",
    ownerId: "owner-nell",
    unit: "days",
    direction: "lower",
    weight: 25,
    baseline: 18,
    target: 11,
    monthlyValues: [17.8, 17.4, 17.0, 16.4, 16.1, 15.6, 15.2, 15.1, 14.8],
    marketSpread: 1,
  },
  {
    id: "kpi-handover-evidence",
    objectiveId: "obj-adoption",
    title: "Handover evidence coverage",
    description: "Bricklane tracks handover evidence coverage across all ten sales markets.",
    ownerId: "owner-nell",
    unit: "percent",
    direction: "higher",
    weight: 15,
    baseline: 60,
    target: 88,
    monthlyValues: [62, 64, 65, 68, 70, 73, 75, 77, null],
    marketSpread: 2.5,
  },
  {
    id: "kpi-resolution-quality",
    objectiveId: "obj-clarity",
    title: "Resolution quality index",
    description: "Bricklane tracks resolution quality index across all ten sales markets.",
    ownerId: "owner-mara",
    unit: "number",
    direction: "higher",
    weight: 45,
    baseline: 64,
    target: 86,
    monthlyValues: [65, 67, 69, 71, 73, 75, 77, 79, 80],
    marketSpread: 2.4,
  },
  {
    id: "kpi-support-handoffs",
    objectiveId: "obj-clarity",
    title: "Support handoff count",
    description: "Bricklane tracks support handoff count across all ten sales markets.",
    ownerId: "owner-nell",
    unit: "number",
    direction: "lower",
    weight: 30,
    baseline: 3.5,
    target: 1.8,
    monthlyValues: [3.4, 3.2, 3.0, 2.9, 2.8, 2.6, 2.5, 2.4, 2.25],
    marketSpread: 0.2,
  },
  {
    id: "kpi-referral-share",
    objectiveId: "obj-clarity",
    title: "Quarterly referral share",
    description: "Bricklane tracks quarterly referral share across all ten sales markets.",
    ownerId: "owner-zoya",
    unit: "percent",
    direction: "higher",
    weight: 25,
    baseline: 9,
    target: 18,
    monthlyValues: [9.3, 9.7, 10.2, 10.9, 11.3, 11.8, 12.0, 12.5, 13.0],
    marketSpread: 1,
  },
  {
    id: "kpi-dispatch-hit",
    objectiveId: "obj-dispatch",
    title: "Dispatch promise hit rate",
    description: "Bricklane tracks dispatch promise hit rate across all ten sales markets.",
    ownerId: "owner-ruben",
    unit: "percent",
    direction: "higher",
    weight: 40,
    baseline: 81,
    target: 96,
    monthlyValues: [82, 83, 84, 86, 87, 89, 90, 91, 93],
    marketSpread: 1.8,
  },
  {
    id: "kpi-routing-latency",
    objectiveId: "obj-dispatch",
    title: "Order routing latency",
    description: "Bricklane tracks order routing latency across all ten sales markets.",
    ownerId: "owner-dev",
    unit: "minutes",
    direction: "lower",
    weight: 35,
    baseline: 14,
    target: 6,
    monthlyValues: [13.5, 13.0, 12.2, 11.4, 10.8, 10.1, 9.9, 9.2, 8.7],
    marketSpread: 0.8,
  },
  {
    id: "kpi-capacity-confidence",
    objectiveId: "obj-dispatch",
    title: "Capacity forecast confidence",
    description: "Bricklane tracks capacity forecast confidence across all ten sales markets.",
    ownerId: "owner-ruben",
    unit: "percent",
    direction: "higher",
    weight: 25,
    baseline: 62,
    target: 84,
    monthlyValues: [63, 64, 66, 68, 69, 70, 71, 70, 72],
    marketSpread: 2.8,
  },
  {
    id: "kpi-reopen-incidents",
    objectiveId: "obj-rework",
    title: "Reopen incidents per hundred",
    description: "Bricklane tracks reopen incidents per hundred across all ten sales markets.",
    ownerId: "owner-dev",
    unit: "number",
    direction: "lower",
    weight: 35,
    baseline: 8,
    target: 3,
    monthlyValues: [7.8, 7.5, 7.1, 6.8, 6.5, 6.3, 5.9, 5.6, 5.2],
    marketSpread: 0.6,
  },
  {
    id: "kpi-release-checks",
    objectiveId: "obj-rework",
    title: "Automated release checks",
    description: "Bricklane tracks automated release checks across all ten sales markets.",
    ownerId: "owner-dev",
    unit: "percent",
    direction: "higher",
    weight: 25,
    baseline: 41,
    target: 78,
    monthlyValues: [43, 45, 48, 51, 54, 57, 59, 61, 64],
    marketSpread: 4,
  },
  {
    id: "kpi-supplier-corrections",
    objectiveId: "obj-rework",
    title: "Supplier correction hours",
    description: "Bricklane tracks supplier correction hours across all ten sales markets.",
    ownerId: "owner-aya",
    unit: "hours",
    direction: "lower",
    weight: 20,
    baseline: 12,
    target: 5,
    monthlyValues: [11.7, 11.2, 10.9, 10.3, 10.0, 9.8, 9.4, 9.2, 9.0],
    marketSpread: 0.8,
  },
  {
    id: "kpi-exception-interval",
    objectiveId: "obj-rework",
    title: "Exception decision interval",
    description: "Bricklane tracks exception decision interval across all ten sales markets.",
    ownerId: "owner-soren",
    unit: "hours",
    direction: "lower",
    weight: 20,
    baseline: 7,
    target: 3,
    monthlyValues: [6.8, 6.5, 6.3, 6.1, 5.8, 5.5, 5.2, 5.3, 5.0],
    marketSpread: 0.4,
  },
  {
    id: "kpi-cross-skill",
    objectiveId: "obj-knowledge",
    title: "Cross-skill coverage",
    description: "Bricklane tracks cross-skill coverage across all ten sales markets.",
    ownerId: "owner-soren",
    unit: "percent",
    direction: "higher",
    weight: 40,
    baseline: 38,
    target: 68,
    monthlyValues: [40, 42, 45, 47, 49, 52, 55, 57, 59],
    marketSpread: 3,
  },
  {
    id: "kpi-pairing-hours",
    objectiveId: "obj-knowledge",
    title: "Pairing practice hours",
    description: "Bricklane tracks pairing practice hours across all ten sales markets.",
    ownerId: "owner-soren",
    unit: "hours",
    direction: "higher",
    weight: 35,
    baseline: 2,
    target: 6,
    monthlyValues: [2.1, 2.3, 2.6, 2.8, 3.1, 3.3, 3.6, 3.8, 4.1],
    marketSpread: 0.4,
  },
  {
    id: "kpi-vacancy-interval",
    objectiveId: "obj-knowledge",
    title: "Vacancy closure interval",
    description: "Bricklane tracks vacancy closure interval across all ten sales markets.",
    ownerId: "owner-nell",
    unit: "days",
    direction: "lower",
    weight: 25,
    baseline: 53,
    target: 32,
    monthlyValues: [52, 50, 48, 47, 45, 43, 42, 40, 38],
    marketSpread: 2.2,
  },
  {
    id: "kpi-packing-reuse",
    objectiveId: "obj-resources",
    title: "Reused packing share",
    description: "Bricklane tracks reused packing share across all ten sales markets.",
    ownerId: "owner-aya",
    unit: "percent",
    direction: "higher",
    weight: 30,
    baseline: 16,
    target: 48,
    monthlyValues: [18, 20, 23, 25, 28, 31, 33, 35, 38],
    marketSpread: 3,
  },
  {
    id: "kpi-account-energy",
    objectiveId: "obj-resources",
    title: "Service energy per account",
    description: "Bricklane tracks service energy per account across all ten sales markets.",
    ownerId: "owner-dev",
    unit: "number",
    direction: "lower",
    weight: 25,
    baseline: 11,
    target: 7,
    monthlyValues: [10.8, 10.6, 10.4, 10.1, 9.9, 9.6, 9.3, 9.1, 8.9],
    marketSpread: 0.35,
  },
  {
    id: "kpi-freight-intensity",
    objectiveId: "obj-resources",
    title: "Ground freight intensity",
    description: "Bricklane tracks ground freight intensity across all ten sales markets.",
    ownerId: "owner-ruben",
    unit: "kg",
    direction: "lower",
    weight: 25,
    baseline: 4.2,
    target: 2.7,
    monthlyValues: [4.1, 4.0, 3.9, 3.8, 3.65, 3.5, 3.4, 3.3, 3.15],
    marketSpread: 0.18,
  },
  {
    id: "kpi-verified-sourcing",
    objectiveId: "obj-resources",
    title: "Verified sourcing share",
    description: "Bricklane tracks verified sourcing share across all ten sales markets.",
    ownerId: "owner-aya",
    unit: "percent",
    direction: "higher",
    weight: 20,
    baseline: 40,
    target: 76,
    monthlyValues: [42, 44, 46, 49, 52, 55, 57, 60, 62],
    marketSpread: 3.5,
  },
];

const MARKET_OFFSETS = [0.42, -0.27, 0.18, -0.4, 0.05, 0.34, -0.2, 0.29, -0.12, -0.31];
const MONTH_VARIATION = [-0.1, 0.06, -0.04, 0.12, -0.08, 0.04, 0.09, -0.07, 0.02];

/** Fresh arrays for every market/month, including new KPI forms. */
export function createEmptyActuals(value: number | null = null): MarketActuals {
  return Object.fromEntries(
    MARKETS.map((market) => [market.code, MONTHS.map(() => value)]),
  ) as MarketActuals;
}

function originalMarketObservations(definition: KpiDefinition, kpiIndex: number): MarketActuals {
  const precision = definition.unit === "currency-million" ? 4 : 2;
  const scale = 10 ** precision;
  return Object.fromEntries(
    MARKETS.map((market, marketIndex) => [
      market.code,
      definition.monthlyValues.map((actual, monthIndex) => {
        if (actual === null) return null;
        const shift =
          MARKET_OFFSETS[marketIndex] +
          MONTH_VARIATION[(kpiIndex + marketIndex + monthIndex) % MONTHS.length];
        return Math.round((actual + definition.marketSpread * shift) * scale) / scale;
      }),
    ]),
  ) as MarketActuals;
}

/** A reset owns fresh entity objects and raw arrays; derived summaries live only in the model. */
export function createInitialScorecard(): ScorecardState {
  return {
    perspectives: PERSPECTIVES.map((perspective) => ({ ...perspective })),
    objectives: OBJECTIVES.map((objective) => ({ ...objective })),
    kpis: KPI_DEFINITIONS.map((definition, index) => {
      const { monthlyValues: _months, marketSpread: _spread, ...kpi } = definition;
      return { ...kpi, actuals: originalMarketObservations(definition, index) };
    }),
    thresholds: { onTrack: 70, watch: 45 },
  };
}
