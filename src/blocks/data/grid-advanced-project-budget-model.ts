export const financeDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(value),
  );

export function financeAmount(value: number, currency = "USD", maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function shiftFinanceDate(value: string, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const daysBetween = (start: string, finish: string) =>
  Math.round((Date.parse(finish) - Date.parse(start)) / 86_400_000);

export const percentage = (numerator: number, denominator: number) =>
  denominator ? Math.round((numerator / denominator) * 100) : 0;

export const budgetToday = "2026-10-23";
export const budgetStart = "2026-08-03";
export const budgetLaunch = "2027-03-12";
export const budgetReserve = 29_000;

export const budgetWorkstreams = [
  "Discovery",
  "Design",
  "Build",
  "Integrations",
  "Data Migration",
  "Launch",
] as const;
export const budgetVendors = [
  "Alder & Field",
  "Fieldmark Studio",
  "North Quay Systems",
  "Internal team",
] as const;
export const budgetPeople = ["Inez Moreno", "Kei Fujita", "Samira Cole", "Ellis Grant"] as const;

export type BudgetWorkstream = (typeof budgetWorkstreams)[number];
export type BudgetVendor = (typeof budgetVendors)[number];
export type BudgetPerson = (typeof budgetPeople)[number];
export type BudgetBasis = "hours" | "months" | "fixed";
export type BudgetDecision = "cover" | "adjust" | "hold";
export type BudgetView = "all" | "over" | "under" | "late";
export type BudgetGroupBy = "workstream" | "vendor" | "person" | "none";

export interface BudgetLine {
  id: string;
  name: string;
  workstream: BudgetWorkstream;
  vendor: BudgetVendor;
  person: BudgetPerson;
  basis: BudgetBasis;
  quantity: number;
  rate: number;
  setup: number;
  actual: number;
  remaining: number;
  start: string;
  finish: string;
  forecastFinish: string;
  decision?: BudgetDecision;
  notes: string[];
}

type BudgetSeed = [
  name: string,
  basis: BudgetBasis,
  quantity: number,
  rate: number,
  actual: number,
  remaining: number,
  start: string,
  finish: string,
  slip?: string,
  setup?: number,
];
const linesByWorkstream: Record<BudgetWorkstream, BudgetSeed[]> = {
  Discovery: [
    ["Fulfillment interviews", "hours", 58, 155, 8680, 0, "2026-08-03", "2026-08-12"],
    ["Journey inventory", "hours", 42, 145, 6090, 0, "2026-08-07", "2026-08-21"],
    ["Platform assessment", "fixed", 1, 6400, 6100, 0, "2026-08-10", "2026-08-28"],
  ],
  Design: [
    ["Order workspace concepts", "hours", 112, 155, 16120, 0, "2026-08-31", "2026-09-25"],
    [
      "Operations pattern library",
      "hours",
      100,
      155,
      12710,
      35,
      "2026-09-14",
      "2026-10-16",
      "2026-10-30",
    ],
    ["Dispatch usability study", "fixed", 1, 7600, 7600, 0, "2026-10-05", "2026-10-16"],
  ],
  Build: [
    [
      "Fulfillment dashboard",
      "hours",
      410,
      165,
      41250,
      188,
      "2026-09-28",
      "2027-01-08",
      "2027-01-22",
    ],
    ["Returns workflow", "hours", 164, 175, 10850, 97, "2026-10-19", "2027-01-08"],
    [
      "Warehouse platform plan",
      "months",
      6,
      2400,
      7200,
      5,
      "2026-08-03",
      "2027-03-12",
      "2027-03-25",
    ],
    ["Catalog indexing", "months", 6, 420, 1760, 5, "2026-09-28", "2027-02-12", undefined, 1000],
    ["Keyboard access review", "fixed", 1, 7800, 0, 7800, "2026-12-07", "2027-01-15"],
  ],
  Integrations: [
    [
      "Dispatch carrier API",
      "hours",
      124,
      170,
      10200,
      75,
      "2026-09-21",
      "2026-12-18",
      "2027-01-08",
    ],
    ["Warehouse stock feed", "hours", 74, 160, 4480, 46, "2026-10-12", "2026-12-11"],
    ["Tax service mapping", "fixed", 1, 7000, 0, 7000, "2026-11-02", "2026-12-11"],
  ],
  "Data Migration": [
    [
      "Inventory master records",
      "hours",
      120,
      150,
      10350,
      99,
      "2026-09-21",
      "2026-12-14",
      "2027-01-04",
    ],
    ["Normalize location codes", "hours", 26, 140, 2940, 4, "2026-09-28", "2026-11-27"],
    ["Order archive migration", "fixed", 1, 9600, 0, 9600, "2026-11-16", "2027-01-29"],
    ["Legacy links mapping", "fixed", 1, 4900, 0, 4900, "2026-12-07", "2027-01-08"],
  ],
  Launch: [
    ["Warehouse pilot", "hours", 54, 155, 0, 54, "2027-01-18", "2027-02-05"],
    ["Training and playbooks", "fixed", 1, 5200, 0, 5200, "2027-02-01", "2027-02-19"],
    ["Fulfillment cutover", "fixed", 1, 6650, 0, 6650, "2027-02-22", "2027-03-05"],
    ["Launch support", "hours", 64, 150, 0, 64, "2027-03-01", "2027-03-26"],
  ],
};

export function initialBudgetLines(): BudgetLine[] {
  return budgetWorkstreams.flatMap((workstream, group) =>
    linesByWorkstream[workstream].map(
      (
        [name, basis, quantity, rate, actual, remaining, start, finish, slip, setup = 0],
        index,
      ) => ({
        id: `line-${group}-${index}`,
        name,
        workstream,
        vendor: budgetVendors[(index + group * 2) % budgetVendors.length]!,
        person: budgetPeople[(group + index) % budgetPeople.length]!,
        basis,
        quantity,
        rate,
        setup,
        actual,
        remaining,
        start,
        finish,
        forecastFinish: slip ?? finish,
        notes: [],
      }),
    ),
  );
}

export const budgetOf = (line: BudgetLine) =>
  (line.basis === "fixed" ? line.rate : line.quantity * line.rate) + line.setup;
export const forecastOf = (line: BudgetLine) =>
  line.actual + (line.basis === "fixed" ? line.remaining : line.remaining * line.rate);
export const varianceOf = (line: BudgetLine) => budgetOf(line) - forecastOf(line);
export const isBudgetLate = (line: BudgetLine) =>
  line.forecastFinish > line.finish || (line.remaining > 0 && line.finish < budgetToday);
export const budgetState = (line: BudgetLine) =>
  line.remaining === 0
    ? "Done"
    : line.start > budgetToday
      ? "Not started"
      : isBudgetLate(line)
        ? "Late"
        : "In progress";

export function budgetSummary(lines: readonly BudgetLine[]) {
  return lines.reduce(
    (totals, line) => {
      const overrun = Math.max(0, -varianceOf(line));
      totals.budget += budgetOf(line);
      totals.actual += line.actual;
      totals.forecast += forecastOf(line);
      totals.over += overrun > 0 ? 1 : 0;
      totals.atRisk += line.decision === "cover" ? 0 : overrun;
      totals.committed += line.decision === "cover" ? overrun : 0;
      return totals;
    },
    { budget: 0, actual: 0, forecast: 0, over: 0, atRisk: 0, committed: 0 },
  );
}

export function matchesBudget(line: BudgetLine, search: string, view: BudgetView) {
  const text = search.trim().toLocaleLowerCase();
  if (
    text &&
    ![line.name, line.vendor, line.person, line.workstream].some((value) =>
      value.toLocaleLowerCase().includes(text),
    )
  ) {
    return false;
  }
  if (view === "over") return varianceOf(line) < 0;
  if (view === "under") return varianceOf(line) > 0;
  if (view === "late") return isBudgetLate(line);
  return true;
}

export type BudgetRow =
  | { kind: "line"; id: string; line: BudgetLine }
  | { kind: "group"; id: string; label: string; children: BudgetRow[]; lines: BudgetLine[] };

export function buildBudgetRows(lines: BudgetLine[], groupBy: BudgetGroupBy): BudgetRow[] {
  const lineRow = (line: BudgetLine): BudgetRow => ({ kind: "line", id: line.id, line });
  if (groupBy === "none") return lines.map(lineRow);
  const labels =
    groupBy === "workstream"
      ? budgetWorkstreams
      : groupBy === "vendor"
        ? budgetVendors
        : budgetPeople;
  return labels.flatMap((label): BudgetRow[] => {
    const members = lines.filter((line) => line[groupBy] === label);
    return members.length
      ? [
          {
            kind: "group",
            id: `group-${groupBy}-${label}`,
            label,
            children: members.map(lineRow),
            lines: members,
          },
        ]
      : [];
  });
}

export function emptyBudgetLine(id: string, workstream: BudgetWorkstream): BudgetLine {
  return {
    id,
    name: "",
    workstream,
    vendor: budgetVendors[0],
    person: budgetPeople[0],
    basis: "hours",
    quantity: 1,
    rate: 0,
    setup: 0,
    actual: 0,
    remaining: 1,
    start: budgetToday,
    finish: budgetLaunch,
    forecastFinish: budgetLaunch,
    notes: [],
  };
}

export function canSaveBudgetLine(line: BudgetLine) {
  return (
    line.name.trim().length > 0 &&
    [line.start, line.finish, line.forecastFinish].every((date) =>
      Number.isFinite(Date.parse(date)),
    ) &&
    line.start <= line.finish &&
    line.forecastFinish >= line.start &&
    [line.quantity, line.rate, line.setup, line.actual, line.remaining].every(
      (value) => Number.isFinite(value) && value >= 0,
    )
  );
}
