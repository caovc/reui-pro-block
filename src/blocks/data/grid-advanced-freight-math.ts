import type { FilterNode, FilterQuery, FilterRule } from "@/components/reui/filters/filters-types";
import type { FreightBook, FreightLane, FreightTerminal } from "./grid-advanced-freight-data";

export const freightBands = ["Deep Loss", "Loss", "Thin", "Healthy", "Strong"] as const;
export type FreightBand = (typeof freightBands)[number];
export type FreightCriteria = {
  text: string;
  query: FilterQuery;
  band: FreightBand | "All Margins";
};
export type FreightTotals = {
  loads: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  margin: number | null;
  losing: number;
  lanes: number;
};
export type FreightRatePlan = {
  laneIds: string[];
  percent: number;
  losingOnly: boolean;
  reason: string;
};

export function freightFigures(lane: FreightLane) {
  const revenueCents = lane.loads * lane.distanceKm * lane.rateCents;
  const costCents = lane.loads * lane.distanceKm * lane.costCents;
  const profitCents = revenueCents - costCents;
  return {
    revenueCents,
    costCents,
    profitCents,
    margin: revenueCents === 0 ? null : (profitCents / revenueCents) * 100,
  };
}
export function freightBand(margin: number | null): FreightBand | null {
  if (margin === null) return null;
  return margin < -8
    ? "Deep Loss"
    : margin < 0
      ? "Loss"
      : margin < 6
        ? "Thin"
        : margin < 12
          ? "Healthy"
          : "Strong";
}
export function freightTotals(lanes: readonly FreightLane[]): FreightTotals {
  let loads = 0;
  let revenueCents = 0;
  let costCents = 0;
  let losing = 0;
  for (const lane of lanes) {
    const figures = freightFigures(lane);
    loads += lane.loads;
    revenueCents += figures.revenueCents;
    costCents += figures.costCents;
    if (figures.profitCents < 0) losing++;
  }
  const profitCents = revenueCents - costCents;
  return {
    loads,
    revenueCents,
    costCents,
    profitCents,
    margin: revenueCents === 0 ? null : (profitCents / revenueCents) * 100,
    losing,
    lanes: lanes.length,
  };
}

function queryValue(lane: FreightLane, field: string): string | number | null {
  switch (field) {
    case "origin":
      return lane.origin;
    case "destination":
      return lane.destination;
    case "shipper":
      return lane.shipper;
    case "equipment":
      return lane.equipment;
    case "contract":
      return lane.contract;
    case "customs":
      return lane.customs;
    case "loads":
      return lane.loads;
    case "margin":
      return freightFigures(lane).margin;
    default:
      return null;
  }
}
const numericFields = new Set(["loads", "margin"]);
const knownFields = new Set([
  "origin",
  "destination",
  "shipper",
  "equipment",
  "contract",
  "customs",
  "loads",
  "margin",
]);
const noValueOperators = new Set(["empty", "not_empty"]);
const rangeOperators = new Set(["between", "not_between"]);
const manyOperators = new Set(["is_any_of", "is_none_of"]);
const selectOperators = new Set(["is", "is_not", ...noValueOperators, ...manyOperators]);
const numberOperators = new Set([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  ...noValueOperators,
  ...rangeOperators,
]);
const supplied = (value: unknown) =>
  value !== null && value !== undefined && (typeof value !== "string" || value.trim() !== "");

/** A draft is omitted, not true: otherwise an empty OR child matches every lane. */
function completeRule(rule: FilterRule): boolean {
  const field = rule.path.at(-1) || "";
  if (rule.path.length !== 1) return false;
  const operators = numericFields.has(field) ? numberOperators : selectOperators;
  if (!knownFields.has(field) || !operators.has(rule.operator)) return false;
  if (noValueOperators.has(rule.operator)) return true;
  const values = Array.isArray(rule.value) ? rule.value : [rule.value];
  if (rangeOperators.has(rule.operator) && values.length !== 2) return false;
  if (manyOperators.has(rule.operator) && values.length === 0) return false;
  if (
    !rangeOperators.has(rule.operator) &&
    !manyOperators.has(rule.operator) &&
    values.length !== 1
  )
    return false;
  if (values.length === 0 || !values.every(supplied)) return false;
  if (numericFields.has(field) && !values.every((value) => Number.isFinite(Number(value))))
    return false;
  return true;
}
function matchRule(lane: FreightLane, rule: FilterRule): boolean | undefined {
  if (!completeRule(rule)) return undefined;
  const raw = queryValue(lane, rule.path.at(-1) || "");
  const text = String(raw ?? "").toLocaleLowerCase();
  const values = (Array.isArray(rule.value) ? rule.value : [rule.value]).map((value) =>
    String(value).toLocaleLowerCase(),
  );
  const expected = values[0];
  const actualNumber = raw === null ? Number.NaN : Number(raw);
  let matched = false;
  switch (rule.operator) {
    case "empty":
      matched = raw === null || text === "";
      break;
    case "not_empty":
      matched = raw !== null && text !== "";
      break;
    case "is":
      matched = text === expected;
      break;
    case "is_not":
      matched = text !== expected;
      break;
    case "is_any_of":
      matched = values.includes(text);
      break;
    case "is_none_of":
      matched = !values.includes(text);
      break;
    case "eq":
      matched = actualNumber === Number(expected);
      break;
    case "neq":
      matched = actualNumber !== Number(expected);
      break;
    case "gt":
      matched = actualNumber > Number(expected);
      break;
    case "gte":
      matched = actualNumber >= Number(expected);
      break;
    case "lt":
      matched = actualNumber < Number(expected);
      break;
    case "lte":
      matched = actualNumber <= Number(expected);
      break;
    case "between":
    case "not_between": {
      const lower = Math.min(Number(values[0]), Number(values[1]));
      const upper = Math.max(Number(values[0]), Number(values[1]));
      matched = actualNumber >= lower && actualNumber <= upper;
      if (rule.operator === "not_between") matched = !matched;
      break;
    }
  }
  return rule.negated ? !matched : matched;
}
export function freightQueryMatches(lane: FreightLane, node: FilterNode): boolean | undefined {
  if (node.type === "rule") return matchRule(lane, node);
  const children: boolean[] = [];
  for (const child of node.rules) {
    const result = freightQueryMatches(lane, child);
    if (result !== undefined) children.push(result);
  }
  if (!children.length) return undefined;
  return node.combinator === "or" ? children.some(Boolean) : children.every(Boolean);
}
export function freightLaneMatches(
  lane: FreightLane,
  criteria: FreightCriteria,
  terminals: readonly FreightTerminal[],
) {
  if (!lane.active) return false;
  const origin = terminals.find((terminal) => terminal.id === lane.origin);
  const destination = terminals.find((terminal) => terminal.id === lane.destination);
  const searchable =
    `${origin?.city} ${origin?.country} ${lane.origin} ${destination?.city} ${destination?.country} ${lane.destination} ${lane.shipper}`.toLocaleLowerCase();
  if (criteria.text.trim() && !searchable.includes(criteria.text.trim().toLocaleLowerCase()))
    return false;
  if (criteria.band !== "All Margins" && freightBand(freightFigures(lane).margin) !== criteria.band)
    return false;
  return freightQueryMatches(lane, criteria.query) !== false;
}

/** Domain pivot only; the input is the native lane table's filtered row model. */
export function freightMatrix(lanes: readonly FreightLane[]) {
  const outbound = new Map<string, FreightLane[]>();
  const inbound = new Map<string, FreightLane[]>();
  const byPair = new Map<string, FreightLane>();
  for (const lane of lanes) {
    const out = outbound.get(lane.origin) || [];
    out.push(lane);
    outbound.set(lane.origin, out);
    const into = inbound.get(lane.destination) || [];
    into.push(lane);
    inbound.set(lane.destination, into);
    byPair.set(`${lane.origin}-${lane.destination}`, lane);
  }
  return { outbound, inbound, byPair };
}
export function freightFigureText(lane: FreightLane | undefined, mode: "loads" | "profit") {
  return lane
    ? mode === "loads"
      ? String(lane.loads)
      : freightMoney(freightFigures(lane).profitCents, true)
    : "";
}
export function freightMoney(cents: number, compact = false) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(cents / 100);
}
export function freightPreview(book: FreightBook, plan: FreightRatePlan) {
  if (!Number.isFinite(plan.percent) || plan.percent < -20 || plan.percent > 30)
    throw new Error("Enter a rate change from -20% to 30%.");
  const wanted = new Set(plan.laneIds);
  const before: FreightLane[] = [];
  const after: FreightLane[] = [];
  const changes: { laneId: string; beforeCents: number; afterCents: number }[] = [];
  for (const lane of book.lanes) {
    if (!lane.active || !wanted.has(lane.id)) continue;
    before.push(lane);
    const eligible = !plan.losingOnly || freightFigures(lane).profitCents < 0;
    const rateCents = eligible
      ? Math.max(1, Math.round(lane.rateCents * (1 + plan.percent / 100)))
      : lane.rateCents;
    if (
      !Number.isSafeInteger(rateCents) ||
      !Number.isSafeInteger(lane.loads * lane.distanceKm * rateCents)
    )
      throw new Error("The proposed rate is too large to calculate exactly.");
    after.push({ ...lane, rateCents });
    if (rateCents !== lane.rateCents)
      changes.push({ laneId: lane.id, beforeCents: lane.rateCents, afterCents: rateCents });
  }
  return { before: freightTotals(before), after: freightTotals(after), changes };
}
export function freightApplyRates(
  book: FreightBook,
  plan: FreightRatePlan,
  at: string,
): FreightBook {
  const preview = freightPreview(book, plan);
  const changes = new Map(preview.changes.map((change) => [change.laneId, change]));
  return {
    lanes: book.lanes.map((lane) =>
      changes.has(lane.id) ? { ...lane, rateCents: changes.get(lane.id)!.afterCents } : lane,
    ),
    history: [
      ...book.history,
      ...preview.changes.map((change, index) => ({
        id: `reprice-${book.history.length + index}-${change.laneId}`,
        laneId: change.laneId,
        at,
        kind: "Repriced" as const,
        previousRateCents: change.beforeCents,
        rateCents: change.afterCents,
        reason: plan.reason.trim(),
      })),
    ],
  };
}
export function freightValidateLane(
  lane: FreightLane,
  book: FreightBook,
  terminals?: readonly FreightTerminal[],
): string | null {
  if (!lane.origin || !lane.destination) return "Choose an origin and destination.";
  if (lane.origin === lane.destination) return "Choose two different terminals.";
  if (
    terminals &&
    ![lane.origin, lane.destination].every((id) => terminals.some((terminal) => terminal.id === id))
  )
    return "Choose terminals from this network.";
  if (
    book.lanes.some(
      (candidate) =>
        candidate.active &&
        candidate.id !== lane.id &&
        candidate.origin === lane.origin &&
        candidate.destination === lane.destination,
    )
  )
    return "This route already has an active lane.";
  if (!lane.shipper.trim()) return "Choose a shipper.";
  if (!Number.isInteger(lane.loads) || lane.loads < 1 || lane.loads > 200)
    return "Loads must be a whole number from 1 to 200.";
  if (!Number.isSafeInteger(lane.distanceKm) || lane.distanceKm < 1)
    return "Distance must be a positive whole number of km.";
  if (
    ![lane.rateCents, lane.costCents].every(
      (value) => Number.isSafeInteger(value) && value >= 30 && value <= 600,
    )
  )
    return "Rate and cost must be positive whole cents from €0.30 to €6.00 per km.";
  return null;
}

/** The optional loader rejects malformed books before they can replace the UI store. */
export function freightBookIssue(
  book: FreightBook,
  terminals: readonly FreightTerminal[],
): string | null {
  if (!book || !Array.isArray(book.lanes) || !Array.isArray(book.history))
    return "The network response is not a freight book.";
  const known = new Set(terminals.map((terminal) => terminal.id));
  const ids = new Set<string>();
  const activePairs = new Set<string>();
  for (const lane of book.lanes) {
    if (!lane || typeof lane.id !== "string" || !lane.id.trim() || ids.has(lane.id))
      return "Lane identities must be unique.";
    ids.add(lane.id);
    if (!known.has(lane.origin) || !known.has(lane.destination) || lane.origin === lane.destination)
      return "A lane references an invalid terminal pair.";
    if (
      ![lane.loads, lane.distanceKm, lane.rateCents, lane.costCents].every(Number.isFinite) ||
      !Number.isInteger(lane.loads) ||
      lane.loads < 1 ||
      lane.loads > 200 ||
      !Number.isInteger(lane.distanceKm) ||
      lane.distanceKm <= 0 ||
      !Number.isSafeInteger(lane.rateCents) ||
      !Number.isSafeInteger(lane.costCents) ||
      lane.rateCents <= 0 ||
      lane.costCents <= 0 ||
      !Number.isSafeInteger(lane.loads * lane.distanceKm * lane.rateCents) ||
      !Number.isSafeInteger(lane.loads * lane.distanceKm * lane.costCents) ||
      typeof lane.active !== "boolean" ||
      typeof lane.shipper !== "string" ||
      !lane.shipper.trim() ||
      !["Curtainsider", "Reefer", "Flatbed"].includes(lane.equipment) ||
      !["Contract", "Spot"].includes(lane.contract) ||
      !["Domestic", "EU", "Customs"].includes(lane.customs)
    )
      return "A lane contains invalid economic figures.";
    const pair = `${lane.origin}-${lane.destination}`;
    if (lane.active && activePairs.has(pair)) return "Two active lanes share the same direction.";
    if (lane.active) activePairs.add(pair);
  }
  const events = new Set<string>();
  for (const event of book.history) {
    if (
      !event ||
      typeof event.id !== "string" ||
      !event.id.trim() ||
      events.has(event.id) ||
      !ids.has(event.laneId) ||
      !Number.isFinite(Date.parse(event.at)) ||
      !["Opened", "Edited", "Repriced", "Closed"].includes(event.kind) ||
      typeof event.reason !== "string" ||
      !Number.isSafeInteger(event.rateCents) ||
      event.rateCents <= 0 ||
      (event.previousRateCents !== null &&
        (!Number.isSafeInteger(event.previousRateCents) || event.previousRateCents <= 0))
    )
      return "A rate history event is invalid.";
    events.add(event.id);
  }
  return null;
}

export function freightSaveLane(
  book: FreightBook,
  lane: FreightLane,
  terminals: readonly FreightTerminal[],
  at: string,
): FreightBook {
  const issue = freightValidateLane(lane, book, terminals);
  if (issue) throw new Error(issue);
  const original = book.lanes.find((item) => item.id === lane.id);
  if (original && (original.origin !== lane.origin || original.destination !== lane.destination))
    throw new Error("Edit the existing direction or open a new lane.");
  return {
    lanes: original
      ? book.lanes.map((item) => (item.id === lane.id ? { ...lane } : item))
      : [...book.lanes, { ...lane }],
    history: [
      ...book.history,
      {
        id: `save-${book.history.length}-${lane.id}`,
        laneId: lane.id,
        at,
        kind: original ? "Edited" : "Opened",
        previousRateCents: original?.rateCents ?? null,
        rateCents: lane.rateCents,
        reason: original ? "Lane details updated" : "New lane opened in the demo network",
      },
    ],
  };
}
export function freightCloseLane(book: FreightBook, laneId: string, at: string): FreightBook {
  const lane = book.lanes.find((item) => item.id === laneId);
  if (!lane) throw new Error("This lane no longer exists.");
  if (!lane.active) return book;
  return {
    lanes: book.lanes.map((item) => (item.id === laneId ? { ...item, active: false } : item)),
    history: [
      ...book.history,
      {
        id: `close-${book.history.length}-${lane.id}`,
        laneId: lane.id,
        at,
        kind: "Closed",
        previousRateCents: lane.rateCents,
        rateCents: lane.rateCents,
        reason: "Lane closed",
      },
    ],
  };
}
