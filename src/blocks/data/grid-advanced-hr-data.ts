import type { FilterNode, FilterQuery } from "@/components/reui/filters/filters-types";

export const hrGroups = [
  "Hiring",
  "Retention",
  "Learning",
  "Performance",
  "Engagement",
  "Workforce",
] as const;
export type HrGroup = (typeof hrGroups)[number];
export const hrUnits = ["Days", "Hours", "Months", "Percent", "Count", "Score", "USD"] as const;
export type HrUnit = (typeof hrUnits)[number];
export const hrOwners = [
  "Ari Bennett",
  "Leah Chen",
  "Omar Davis",
  "Maya Singh",
  "Eli Brooks",
  "Nina Park",
  "Theo Morgan",
  "Iris Reed",
  "Leo Cruz",
  "Zoe Ellis",
];
export const hrMonths = Array.from(
  { length: 9 },
  (_, index) => `2026-${String(index + 1).padStart(2, "0")}`,
);
export const defaultMonth = "2026-09";
export type HrDirection = "higher" | "lower";
export type HrStatus = "On Track" | "Watch" | "Off Track" | "Pending";
export interface HrSample {
  target: number | null;
  actual: number | null;
}
export interface HrKpi {
  id: string;
  label: string;
  description: string;
  group: HrGroup;
  unit: HrUnit;
  owner: string;
  direction: HrDirection;
  rollup: "average" | "sum";
  series: Record<string, HrSample>;
  notes: string;
}
export interface HrThresholds {
  onTrack: number;
  watch: number;
  headcount: number;
  hrStaff: number;
}
export const defaultThresholds: HrThresholds = {
  onTrack: 100,
  watch: 90,
  headcount: 1320,
  hrStaff: 16,
};
export interface HrMetric {
  priorYear: number | null;
  priorMonth: number | null;
  target: number | null;
  actual: number | null;
  variance: number | null;
  attainment: number | null;
  vsPY: number | null;
  vsTarget: number | null;
  status: HrStatus;
  trend: (number | null)[];
}
export interface HrRow extends HrMetric {
  id: string;
  kind: "group" | "kpi";
  label: string;
  group: HrGroup;
  owner: string;
  unit: HrUnit;
  direction: HrDirection;
  kpi?: HrKpi;
  children?: HrRow[];
}
export interface HrSummary {
  count: number;
  measured: number;
  onTrack: number;
  watch: number;
  offTrack: number;
  pending: number;
  index: number | null;
  priorIndex: number | null;
}

// Independent Bricklane KPI definitions and measurements, never reference-site seeds.
const profiles: [string, HrGroup, HrUnit, HrDirection, number, number, "average" | "sum"][] = [
  ["Hiring cycle time", "Hiring", "Days", "lower", 32, 37.6, "average"],
  ["Offer acceptance", "Hiring", "Percent", "higher", 86, 88.4, "average"],
  ["Recruiting cost per hire", "Hiring", "USD", "lower", 4200, 4490, "average"],
  ["Internal placement share", "Hiring", "Percent", "higher", 24, 22.3, "average"],
  ["Open roles filled", "Hiring", "Count", "higher", 35, 38, "sum"],
  ["Voluntary attrition", "Retention", "Percent", "lower", 1.3, 1.6, "average"],
  ["First-year retention", "Retention", "Percent", "higher", 92, 93.1, "average"],
  ["Regretted departures", "Retention", "Count", "lower", 3, 4, "sum"],
  ["Median employee tenure", "Retention", "Months", "higher", 38, 36.8, "average"],
  ["Learning hours per person", "Learning", "Hours", "higher", 6, 5.7, "average"],
  ["Compliance completion", "Learning", "Percent", "higher", 98, 99.2, "average"],
  ["Learning participation", "Learning", "Percent", "higher", 82, 74.6, "average"],
  ["Coaching sessions", "Learning", "Count", "higher", 120, 132, "sum"],
  ["Review completion", "Performance", "Percent", "higher", 96, 97.1, "average"],
  ["Goal alignment", "Performance", "Percent", "higher", 90, 84.4, "average"],
  ["Manager effectiveness", "Performance", "Score", "higher", 4.2, 3.8, "average"],
  ["Performance support cycle", "Performance", "Days", "lower", 45, 52.8, "average"],
  ["Employee advocacy", "Engagement", "Score", "higher", 42, 44, "average"],
  ["Pulse participation", "Engagement", "Percent", "higher", 88, 85.4, "average"],
  ["Wellbeing index", "Engagement", "Score", "higher", 78, 80.3, "average"],
  ["Employee support response", "Engagement", "Hours", "lower", 8, 9.7, "average"],
  ["Workforce capacity", "Workforce", "Count", "higher", 1300, 1320, "average"],
  ["Unplanned absence", "Workforce", "Percent", "lower", 2.8, 3.0, "average"],
  ["Safety incidents", "Workforce", "Count", "lower", 0, 0, "sum"],
];

export function createHrKpis(): HrKpi[] {
  return profiles.map(([label, group, unit, direction, target, actual, rollup], seed) => {
    const series: Record<string, HrSample> = {};
    for (let index = 0; index < 21; index++) {
      const year = 2025 + Math.floor(index / 12);
      const month = (index % 12) + 1;
      const ago = 20 - index;
      const wave = ((index % 4) - 1.5) * 0.013;
      const factor = 1 + ago * (direction === "higher" ? -0.006 : 0.008) + wave;
      const precision = unit === "Count" || unit === "USD" ? 1 : 10;
      series[`${year}-${String(month).padStart(2, "0")}`] = {
        target: Math.round(target * (index < 12 ? 0.96 : 1) * precision) / precision,
        actual:
          index === 20 ? actual : Math.max(0, Math.round(actual * factor * precision) / precision),
      };
    }
    return {
      id: `HR-${seed + 101}`,
      label,
      group,
      unit,
      direction,
      rollup,
      owner: hrOwners[seed % hrOwners.length],
      series,
      description: `${label} measured monthly by the ${group.toLowerCase()} team.`,
      notes: "",
    };
  });
}

export function shiftHrMonth(month: string, offset: number) {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, value - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
export function monthLabel(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
function rollup(kpi: HrKpi, keys: string[], field: keyof HrSample) {
  const values = keys.flatMap((key) => kpi.series[key]?.[field] ?? []);
  return kpi.rollup === "sum"
    ? values.length
      ? values.reduce((sum, value) => sum + value, 0)
      : null
    : average(values);
}

/** Direction score is deliberately separate from raw actual / target attainment. */
export function directionScore(
  actual: number | null,
  reference: number | null,
  direction: HrDirection,
): number | null {
  if (
    actual === null ||
    reference === null ||
    !Number.isFinite(actual) ||
    !Number.isFinite(reference)
  )
    return null;
  if (actual === 0 && reference === 0) return 100;
  if (direction === "lower")
    return actual === 0 ? 200 : Math.max(0, Math.min(200, (reference / actual) * 100));
  return reference === 0 ? 200 : Math.max(0, Math.min(200, (actual / reference) * 100));
}
export function hrStatus(index: number | null, thresholds: HrThresholds): HrStatus {
  return index === null
    ? "Pending"
    : index >= thresholds.onTrack
      ? "On Track"
      : index >= thresholds.watch
        ? "Watch"
        : "Off Track";
}
export function computeHrMetric(
  kpi: HrKpi,
  month: string,
  ytd: boolean,
  thresholds: HrThresholds,
): HrMetric {
  const keys = ytd
    ? Array.from(
        { length: Number(month.slice(5)) },
        (_, index) => `${month.slice(0, 4)}-${String(index + 1).padStart(2, "0")}`,
      )
    : [month];
  const actual = rollup(kpi, keys, "actual");
  const target = rollup(kpi, keys, "target");
  const priorYear = rollup(
    kpi,
    keys.map((key) => shiftHrMonth(key, -12)),
    "actual",
  );
  const priorMonth = kpi.series[shiftHrMonth(month, -1)]?.actual ?? null;
  const vsTarget = directionScore(actual, target, kpi.direction);
  return {
    actual,
    target,
    priorYear,
    priorMonth,
    variance: actual === null || target === null ? null : actual - target,
    attainment:
      actual === null || target === null
        ? null
        : target === 0
          ? actual === 0
            ? 100
            : null
          : (actual / target) * 100,
    vsPY: directionScore(actual, priorYear, kpi.direction),
    vsTarget,
    status: hrStatus(vsTarget, thresholds),
    trend: Array.from(
      { length: 12 },
      (_, index) => kpi.series[shiftHrMonth(month, index - 11)]?.actual ?? null,
    ),
  };
}
export function hrRows(
  records: HrKpi[],
  month: string,
  ytd: boolean,
  thresholds: HrThresholds,
): HrRow[] {
  return hrGroups.map((group) => ({
    id: `group-${group}`,
    kind: "group",
    label: group,
    group,
    owner: "",
    unit: "Count",
    direction: "higher",
    actual: null,
    target: null,
    priorYear: null,
    priorMonth: null,
    variance: null,
    attainment: null,
    vsPY: null,
    vsTarget: null,
    status: "Pending",
    trend: [],
    children: records
      .filter((kpi) => kpi.group === group)
      .map((kpi) => ({
        id: kpi.id,
        kind: "kpi",
        label: kpi.label,
        group: kpi.group,
        owner: kpi.owner,
        unit: kpi.unit,
        direction: kpi.direction,
        kpi,
        ...computeHrMetric(kpi, month, ytd, thresholds),
      })),
  }));
}
export function hrSummary(rows: HrRow[]): HrSummary {
  const leaves = rows.flatMap((row) => (row.kind === "group" ? (row.children ?? []) : [row]));
  return {
    count: leaves.length,
    measured: leaves.filter((row) => row.vsTarget !== null).length,
    onTrack: leaves.filter((row) => row.status === "On Track").length,
    watch: leaves.filter((row) => row.status === "Watch").length,
    offTrack: leaves.filter((row) => row.status === "Off Track").length,
    pending: leaves.filter((row) => row.status === "Pending").length,
    index: average(leaves.flatMap((row) => row.vsTarget ?? [])),
    priorIndex: average(leaves.flatMap((row) => row.vsPY ?? [])),
  };
}
export function formatHrValue(value: number | null, unit: HrUnit, ratio = false) {
  if (value === null) return "—";
  if (ratio) return `${Math.round(value)}%`;
  if (unit === "USD")
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  return (
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: ["Count", "Score"].includes(unit) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value) + (unit === "Percent" ? "%" : "")
  );
}
export function newHrKpi(id: string, group: HrGroup = "Hiring"): HrKpi {
  return {
    id,
    label: "",
    group,
    unit: "Count",
    owner: hrOwners[0],
    direction: "higher",
    rollup: "average",
    description: "",
    notes: "",
    series: { [defaultMonth]: { target: 0, actual: null } },
  };
}
export const parseHrNumber = (raw: string): number | null | undefined => {
  if (!raw.trim()) return null;
  const cleaned = raw.replaceAll(",", "").replace(/[$%]/g, "").trim();
  if (!cleaned) return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
};

const queryValue = (row: HrRow, field: string): unknown =>
  field === "group" ||
  field === "status" ||
  field === "owner" ||
  field === "unit" ||
  field === "direction" ||
  field === "vsTarget" ||
  field === "vsPY"
    ? row[field]
    : undefined;
const blank = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && !value.trim());
function evaluateHrNode(row: HrRow, node: FilterNode): boolean | undefined {
  if (node.type === "group") {
    const matches = node.rules
      .map((child) => evaluateHrNode(row, child))
      .filter((value) => value !== undefined);
    return !matches.length
      ? undefined
      : node.combinator === "and"
        ? matches.every(Boolean)
        : matches.some(Boolean);
  }
  if (
    !node.operator ||
    !["group", "status", "owner", "unit", "direction", "vsTarget", "vsPY"].includes(node.path[0])
  )
    return undefined;
  const raw = queryValue(row, node.path[0]);
  const values = Array.isArray(node.value) ? node.value : [node.value];
  const noValue = ["empty", "not_empty"].includes(node.operator);
  const range = ["between", "not_between"].includes(node.operator);
  const many = ["is_any_of", "is_none_of"].includes(node.operator);
  if (
    !noValue &&
    (!values.length ||
      values.some(blank) ||
      (range && values.length !== 2) ||
      (!range && !many && values.length !== 1))
  )
    return undefined;
  const numeric = ["eq", "neq", "gt", "gte", "lt", "lte", "between", "not_between"].includes(
    node.operator,
  );
  if (
    numeric &&
    (values.some((value) => !Number.isFinite(Number(value))) ||
      (range && Number(values[0]) > Number(values[1])))
  )
    return undefined;
  let result: boolean;
  const choices = values.map((value) => String(value).toLowerCase());
  switch (node.operator) {
    case "empty":
      result = blank(raw);
      break;
    case "not_empty":
      result = !blank(raw);
      break;
    case "is":
    case "is_any_of":
      result = choices.includes(String(raw ?? "").toLowerCase());
      break;
    case "is_not":
    case "is_none_of":
      result = !choices.includes(String(raw ?? "").toLowerCase());
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
export const matchesHrQuery = (row: HrRow, query: FilterQuery) =>
  evaluateHrNode(row, query) ?? true;

export interface HrSnapshot {
  records: HrKpi[];
  thresholds: HrThresholds;
}
export interface HrStore extends HrSnapshot {
  history: HrSnapshot[];
  future: HrSnapshot[];
}
export interface HrWrite {
  id: string;
  month: string;
  field: keyof HrSample;
  value: number | null;
}
export type HrAction =
  | { type: "write"; changes: HrWrite[] }
  | { type: "put"; kpi: HrKpi }
  | { type: "remove"; id: string }
  | { type: "thresholds"; value: HrThresholds }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" }
  | { type: "load"; records: HrKpi[] };
export const initialHrStore = (): HrStore => ({
  records: createHrKpis(),
  thresholds: { ...defaultThresholds },
  history: [],
  future: [],
});
export function hrBookIssue(records: HrKpi[]): string | null {
  if (!Array.isArray(records)) return "Expected an array of KPI definitions.";
  const ids = new Set<string>();
  for (const kpi of records) {
    if (!kpi || !kpi.id || ids.has(kpi.id)) return "KPI identifiers must be present and unique.";
    ids.add(kpi.id);
    if (
      !kpi.label?.trim() ||
      !hrGroups.includes(kpi.group) ||
      !hrUnits.includes(kpi.unit) ||
      !["higher", "lower"].includes(kpi.direction) ||
      !["average", "sum"].includes(kpi.rollup)
    )
      return `Invalid definition for ${kpi.id}.`;
    if (!kpi.series || typeof kpi.series !== "object") return `Missing measurements for ${kpi.id}.`;
    for (const [month, sample] of Object.entries(kpi.series)) {
      if (
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
        !sample ||
        [sample.target, sample.actual].some(
          (value) => value !== null && (!Number.isFinite(value) || value < 0),
        )
      )
        return `Invalid measurements for ${kpi.id} at ${month}.`;
    }
  }
  return null;
}
export function hrReducer(store: HrStore, action: HrAction): HrStore {
  const snapshot = { records: store.records, thresholds: store.thresholds };
  if (action.type === "undo")
    return store.history.length
      ? {
          ...store.history.at(-1)!,
          history: store.history.slice(0, -1),
          future: [snapshot, ...store.future],
        }
      : store;
  if (action.type === "redo")
    return store.future.length
      ? { ...store.future[0], history: [...store.history, snapshot], future: store.future.slice(1) }
      : store;
  if (action.type === "load") return { ...store, records: action.records, history: [], future: [] };
  let next: HrSnapshot = snapshot;
  if (action.type === "write") {
    const valid = action.changes.filter(
      (change) =>
        store.records.some((kpi) => kpi.id === change.id) &&
        (change.value === null || (Number.isFinite(change.value) && change.value >= 0)),
    );
    if (!valid.length) return store;
    next = {
      ...snapshot,
      records: store.records.map((kpi) => {
        const edits = valid.filter((change) => change.id === kpi.id);
        if (!edits.length) return kpi;
        const series = { ...kpi.series };
        for (const edit of edits)
          series[edit.month] = {
            ...(series[edit.month] ?? { target: null, actual: null }),
            [edit.field]: edit.value,
          };
        return { ...kpi, series };
      }),
    };
  } else if (action.type === "put")
    next = {
      ...snapshot,
      records: store.records.some((kpi) => kpi.id === action.kpi.id)
        ? store.records.map((kpi) => (kpi.id === action.kpi.id ? action.kpi : kpi))
        : [...store.records, action.kpi],
    };
  else if (action.type === "remove")
    next = { ...snapshot, records: store.records.filter((kpi) => kpi.id !== action.id) };
  else if (action.type === "thresholds") {
    if (
      !Number.isFinite(action.value.watch) ||
      !Number.isFinite(action.value.onTrack) ||
      !Number.isFinite(action.value.headcount) ||
      !Number.isFinite(action.value.hrStaff) ||
      action.value.onTrack > 200 ||
      action.value.watch < 0 ||
      action.value.onTrack < action.value.watch ||
      action.value.hrStaff < 1 ||
      action.value.headcount < 0
    )
      return store;
    next = { ...snapshot, thresholds: action.value };
  } else if (action.type === "reset") next = initialHrStore();
  return { ...next, history: [...store.history, snapshot].slice(-50), future: [] };
}
