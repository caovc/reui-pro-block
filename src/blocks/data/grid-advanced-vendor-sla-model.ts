import {
  planningMonth,
  planningMonthDays,
  validPlanningMoney,
  validPlanningMonth,
  type PlanningResult,
} from "./grid-advanced-planning-common.ts";

export const slaReviewDate = "2026-11-23";
export interface SlaContract {
  id: string;
  site: string;
  vendor: string;
  area: string;
  monthlyFee: number;
  capBps: number;
  activeDays: number[];
}
export interface SlaMetric {
  id: string;
  contractId: string;
  name: string;
  direction: "at-least" | "at-most";
  targetBps: number;
  creditBps: number;
  actual: (number | null)[];
}
export interface SlaClaim {
  id: string;
  contractId: string;
  month: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  requested: number;
  approved: number | null;
  metricIds: string[];
  measurements: {
    metricId: string;
    name: string;
    actual: number;
    targetBps: number;
    credit: number;
  }[];
  note: string;
}

function claimMeasurements(review: ReturnType<typeof slaMonthReview>[number]) {
  return review.metrics
    .filter((row) => row.credit > 0)
    .map((row) => ({
      metricId: row.metric.id,
      name: row.metric.name,
      actual: row.actual!,
      targetBps: row.metric.targetBps,
      credit: row.credit,
    }));
}
export interface SlaCureNotice {
  id: string;
  metricId: string;
  month: number;
  dueDate: string;
  status: "open" | "resolved";
  note: string;
}
export interface VendorSlaState {
  contracts: SlaContract[];
  metrics: SlaMetric[];
  claims: SlaClaim[];
  notices: SlaCureNotice[];
}

const contractSeeds = [
  ["north", "North Pier", "Harbor Logistics", "Distribution", 1_200_000, 1000],
  ["east", "East Mesa", "Harbor Logistics", "Distribution", 950_000, 1200],
  ["oak", "Oak Field", "Meadow Fulfilment", "Fulfilment", 1_550_000, 1000],
  ["valley", "Valley Crossing", "Meadow Fulfilment", "Fulfilment", 1_300_000, 1500],
] as const;
const metricSeeds = [
  ["on-time", "Orders on time", "at-least", 9950, 600],
  ["damage", "Damage rate", "at-most", 50, 600],
  ["accuracy", "Stock accuracy", "at-least", 9980, 300],
] as const;

/** Independent demo vendors, locations, measures and contracts. */
export const initialVendorSla: VendorSlaState = {
  contracts: contractSeeds.map(([id, site, vendor, area, monthlyFee, capBps], index) => ({
    id,
    site,
    vendor,
    area,
    monthlyFee,
    capBps,
    activeDays: Array.from({ length: 12 }, (_, month) =>
      index === 1 && month === 0 ? 16 : planningMonthDays(month),
    ),
  })),
  metrics: contractSeeds.flatMap(([contractId], contractIndex) =>
    metricSeeds.map(([id, name, direction, targetBps, creditBps], metricIndex) => ({
      id: `${contractId}-${id}`,
      contractId,
      name,
      direction,
      targetBps,
      creditBps,
      actual: Array.from({ length: 12 }, (_, month) => {
        if (month > planningMonth) return null;
        const breached = (month + contractIndex + metricIndex) % 4 !== 0;
        const delta = 10 + (month % 3) * 15;
        return direction === "at-most"
          ? targetBps + (breached ? delta : -10)
          : Math.min(10_000, targetBps + (breached ? -delta : 10));
      }),
    })),
  ),
  claims: [],
  notices: [],
};

const validBps = (amount: number) => Number.isInteger(amount) && amount >= 0 && amount <= 10_000;

/** Round once, after both the credit rate and active-day fraction are applied. */
export function slaProratedCredit(
  fee: number,
  rateBps: number,
  activeDays: number,
  monthDays: number,
): number {
  if (
    !validPlanningMoney(fee) ||
    !validBps(rateBps) ||
    !Number.isInteger(activeDays) ||
    activeDays < 0 ||
    activeDays > monthDays ||
    !Number.isInteger(monthDays) ||
    monthDays < 1 ||
    monthDays > 31
  ) {
    throw new RangeError("Invalid service credit terms.");
  }
  const numerator = BigInt(fee) * BigInt(rateBps) * BigInt(activeDays);
  const denominator = 10_000n * BigInt(monthDays);
  return Number((numerator + denominator / 2n) / denominator);
}

/** Largest-remainder allocation keeps the shared cap exact, including the final cent. */
export function allocateSlaCredits(
  requests: readonly { id: string; requested: number }[],
  cap: number,
) {
  if (
    !validPlanningMoney(cap) ||
    requests.some((request) => !validPlanningMoney(request.requested))
  ) {
    throw new RangeError("Credit amounts must be non-negative integer cents.");
  }
  const total = requests.reduce((sum, request) => sum + request.requested, 0);
  if (!Number.isSafeInteger(total))
    throw new RangeError("Credit total is outside the supported range.");
  if (total <= cap) return requests.map((request) => ({ ...request, credit: request.requested }));
  const divisor = BigInt(total);
  const allocations = requests.map((request, index) => {
    const numerator = BigInt(request.requested) * BigInt(cap);
    return {
      ...request,
      index,
      credit: Number(numerator / divisor),
      remainder: numerator % divisor,
    };
  });
  let remaining = cap - allocations.reduce((sum, request) => sum + request.credit, 0);
  const ranked = [...allocations].sort((a, b) =>
    a.remainder === b.remainder ? a.id.localeCompare(b.id) : a.remainder > b.remainder ? -1 : 1,
  );
  for (const request of ranked) {
    if (remaining === 0) break;
    request.credit += 1;
    remaining -= 1;
  }
  return allocations.map(({ id, requested, credit }) => ({ id, requested, credit }));
}

export function slaMetricGap(metric: SlaMetric, month: number): number | null {
  const actual = metric.actual[month];
  if (actual === null || actual === undefined) return null;
  return metric.direction === "at-least" ? actual - metric.targetBps : metric.targetBps - actual;
}

export function slaMonthReview(
  state: Pick<VendorSlaState, "contracts" | "metrics">,
  month: number,
) {
  if (!validPlanningMonth(month)) throw new RangeError("Choose a valid month.");
  const days = planningMonthDays(month);
  return state.contracts.map((contract) => {
    const metrics = state.metrics.filter((metric) => metric.contractId === contract.id);
    const cap = slaProratedCredit(
      contract.monthlyFee,
      contract.capBps,
      contract.activeDays[month],
      days,
    );
    const requests = metrics.map((metric) => {
      const gap = slaMetricGap(metric, month);
      return {
        id: metric.id,
        requested:
          gap !== null && gap < 0
            ? slaProratedCredit(
                contract.monthlyFee,
                metric.creditBps,
                contract.activeDays[month],
                days,
              )
            : 0,
      };
    });
    const allocations = allocateSlaCredits(requests, cap);
    return {
      contract,
      cap,
      uncapped: requests.reduce((sum, request) => sum + request.requested, 0),
      credit: allocations.reduce((sum, allocation) => sum + allocation.credit, 0),
      metrics: metrics.map((metric) => {
        const gap = slaMetricGap(metric, month);
        return {
          metric,
          actual: metric.actual[month],
          gap,
          breached: gap !== null && gap < 0,
          ...allocations.find((allocation) => allocation.id === metric.id)!,
        };
      }),
    };
  });
}

export function setSlaActual(
  metrics: readonly SlaMetric[],
  id: string,
  month: number,
  actual: number | null,
): PlanningResult<SlaMetric[]> {
  if (!validPlanningMonth(month)) return { ok: false, error: "Choose a valid month." };
  if (!metrics.some((metric) => metric.id === id))
    return { ok: false, error: "SLA measure not found." };
  if (actual !== null && !validBps(actual))
    return {
      ok: false,
      error: "Enter a percentage from 0 to 100 with at most two decimal places.",
    };
  return {
    ok: true,
    value: metrics.map((metric) =>
      metric.id === id
        ? {
            ...metric,
            actual: metric.actual.map((amount, index) => (index === month ? actual : amount)),
          }
        : metric,
    ),
  };
}

export function setSlaTarget(
  metrics: readonly SlaMetric[],
  id: string,
  target: number,
): PlanningResult<SlaMetric[]> {
  if (!validBps(target)) return { ok: false, error: "Enter a target between 0 and 100 percent." };
  if (!metrics.some((metric) => metric.id === id))
    return { ok: false, error: "SLA measure not found." };
  return {
    ok: true,
    value: metrics.map((metric) => (metric.id === id ? { ...metric, targetBps: target } : metric)),
  };
}

export function draftSlaClaim(
  state: VendorSlaState,
  input: { id: string; contractId: string; month: number; note: string },
): PlanningResult<SlaClaim[]> {
  if (!validPlanningMonth(input.month)) return { ok: false, error: "Choose a valid month." };
  if (!input.id.trim() || state.claims.some((claim) => claim.id === input.id))
    return { ok: false, error: "Choose a unique claim ID." };
  if (!input.note.trim()) return { ok: false, error: "Add a claim note." };
  if (
    state.claims.some(
      (claim) =>
        claim.contractId === input.contractId &&
        claim.month === input.month &&
        claim.status !== "rejected",
    )
  ) {
    return { ok: false, error: "This site and month already have an active or approved claim." };
  }
  const review = slaMonthReview(state, input.month).find(
    (row) => row.contract.id === input.contractId,
  );
  if (!review) return { ok: false, error: "Vendor site not found." };
  if (!review.credit)
    return { ok: false, error: "There is no eligible service credit for this site and month." };
  const claim: SlaClaim = {
    id: input.id,
    contractId: input.contractId,
    month: input.month,
    status: "draft",
    requested: review.credit,
    approved: null,
    metricIds: review.metrics.filter((metric) => metric.credit > 0).map((metric) => metric.id),
    measurements: claimMeasurements(review),
    note: input.note.trim(),
  };
  return { ok: true, value: [...state.claims, claim] };
}

export function transitionSlaClaim(
  state: VendorSlaState,
  id: string,
  status: "submitted" | "approved" | "rejected",
  approved?: number,
): PlanningResult<SlaClaim[]> {
  const claim = state.claims.find((row) => row.id === id);
  if (!claim) return { ok: false, error: "Claim not found." };
  if (status === "submitted" ? claim.status !== "draft" : claim.status !== "submitted") {
    return { ok: false, error: "That claim transition is not available." };
  }
  if (status === "submitted") {
    const review = slaMonthReview(state, claim.month).find(
      (row) => row.contract.id === claim.contractId,
    );
    if (
      !review ||
      review.credit !== claim.requested ||
      JSON.stringify(claimMeasurements(review)) !== JSON.stringify(claim.measurements)
    ) {
      return {
        ok: false,
        error: "The reviewed measures changed. Refresh the draft calculation before submitting.",
      };
    }
  }
  if (
    status === "approved" &&
    (approved === undefined || !validPlanningMoney(approved) || approved > claim.requested)
  ) {
    return { ok: false, error: "Approval must be between zero and the requested service credit." };
  }
  return {
    ok: true,
    value: state.claims.map((row) =>
      row.id === id
        ? {
            ...row,
            status,
            approved: status === "approved" ? approved! : status === "rejected" ? 0 : null,
          }
        : row,
    ),
  };
}

export function refreshSlaClaim(state: VendorSlaState, id: string): PlanningResult<SlaClaim[]> {
  const claim = state.claims.find((row) => row.id === id);
  if (!claim || claim.status !== "draft")
    return { ok: false, error: "Only a draft claim can be refreshed." };
  const review = slaMonthReview(state, claim.month).find(
    (row) => row.contract.id === claim.contractId,
  );
  if (!review || review.credit === 0)
    return {
      ok: false,
      error: "No eligible service credit remains. Discard this draft if the site has recovered.",
    };
  return {
    ok: true,
    value: state.claims.map((row) =>
      row.id === id
        ? {
            ...row,
            requested: review.credit,
            metricIds: review.metrics
              .filter((metric) => metric.credit > 0)
              .map((metric) => metric.id),
            measurements: claimMeasurements(review),
          }
        : row,
    ),
  };
}

export function discardSlaClaim(state: VendorSlaState, id: string): PlanningResult<SlaClaim[]> {
  const claim = state.claims.find((row) => row.id === id);
  if (!claim || (claim.status !== "draft" && claim.status !== "rejected"))
    return { ok: false, error: "Only draft or rejected claims can be discarded." };
  return { ok: true, value: state.claims.filter((row) => row.id !== id) };
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function issueSlaCureNotice(
  state: VendorSlaState,
  input: { id: string; metricId: string; month: number; dueDate: string; note: string },
): PlanningResult<SlaCureNotice[]> {
  if (!validPlanningMonth(input.month)) return { ok: false, error: "Choose a valid month." };
  const metric = state.metrics.find((row) => row.id === input.metricId);
  if (!metric || (slaMetricGap(metric, input.month) ?? 0) >= 0)
    return { ok: false, error: "Choose a reported SLA breach." };
  if (!input.id.trim() || state.notices.some((notice) => notice.id === input.id))
    return { ok: false, error: "Choose a unique notice ID." };
  if (
    state.notices.some(
      (notice) =>
        notice.metricId === input.metricId &&
        notice.month === input.month &&
        notice.status === "open",
    )
  ) {
    return { ok: false, error: "An open cure notice already covers this measure and month." };
  }
  if (!validDate(input.dueDate) || input.dueDate < slaReviewDate)
    return { ok: false, error: "Enter a valid due date on or after the review date." };
  if (!input.note.trim()) return { ok: false, error: "Add the required corrective action." };
  return {
    ok: true,
    value: [...state.notices, { ...input, note: input.note.trim(), status: "open" }],
  };
}

export function resolveSlaCureNotice(
  state: VendorSlaState,
  id: string,
): PlanningResult<SlaCureNotice[]> {
  const notice = state.notices.find((row) => row.id === id);
  if (!notice || notice.status !== "open")
    return { ok: false, error: "Open cure notice not found." };
  const metric = state.metrics.find((row) => row.id === notice.metricId);
  const gap = metric ? slaMetricGap(metric, notice.month) : null;
  if (gap === null || gap < 0)
    return {
      ok: false,
      error: "Record a measure that meets the SLA before resolving this notice.",
    };
  return {
    ok: true,
    value: state.notices.map((row) => (row.id === id ? { ...row, status: "resolved" } : row)),
  };
}
