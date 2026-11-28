import {
  merchNet,
  merchQuarters,
  readMerchLines,
  type MerchLine,
} from "./grid-advanced-merch-review-model.ts";

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const rate = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 10000) : null;
const orderedMonths = (months: string[]) => [...new Set(months)].sort();
const completePeriod = (lines: MerchLine[], months: string[]) =>
  lines.length > 0 &&
  months.length > 0 &&
  lines.every((line) =>
    months.every((month) => line.months.some((record) => record.month === month)),
  );

function periodTotals(lines: MerchLine[], months: string[]) {
  const selected = new Set(months);
  const records = lines.flatMap((line) =>
    line.months
      .filter((record) => selected.has(record.month))
      .map((record) => ({ record, targetMarginBps: line.targetMarginBps })),
  );
  const netCents = sum(records.map(({ record }) => merchNet(record)));
  const profitCents = sum(records.map(({ record }) => merchNet(record) - record.costCents));
  const planCents = sum(records.map(({ record }) => record.planCents));
  // The fixture records a net-sales plan and each line's target margin rate.
  // Planned gross profit is derived per record, preserving whole cents.
  const plannedProfitCents = sum(
    records.map(({ record, targetMarginBps }) =>
      Math.round((record.planCents * targetMarginBps) / 10000),
    ),
  );
  return {
    observed: records.length > 0,
    complete: completePeriod(lines, months),
    netCents,
    profitCents,
    planCents,
    plannedProfitCents,
    marginBps: rate(profitCents, netCents),
    plannedMarginBps: rate(plannedProfitCents, planCents),
  };
}

export function readCategoryPeriod(lines: MerchLine[], months: string[]) {
  const selected = orderedMonths(months);
  const current = periodTotals(lines, selected);
  const priorMonths = selected.map((month) => `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`);
  const prior = periodTotals(lines, priorMonths);
  const comparable = current.complete && prior.complete;
  return {
    ...current,
    months: selected,
    startMonth: selected[0] ?? null,
    endMonth: selected.at(-1) ?? null,
    priorComplete: prior.complete,
    priorNetCents: prior.observed ? prior.netCents : null,
    netYoYBps: comparable ? rate(current.netCents - prior.netCents, prior.netCents) : null,
    yearMoveBps:
      comparable && current.marginBps !== null && prior.marginBps !== null
        ? current.marginBps - prior.marginBps
        : null,
    profitVarianceCents: current.profitCents - current.plannedProfitCents,
    rateVarianceBps:
      current.marginBps !== null && current.plannedMarginBps !== null
        ? current.marginBps - current.plannedMarginBps
        : null,
  };
}

export function readCategoryStock(lines: MerchLine[], months: string[]) {
  const month = orderedMonths(months).at(-1);
  return month
    ? { ...readMerchLines(lines, month), complete: completePeriod(lines, [month]) }
    : null;
}

export function categoryQuarterHistory(lines: MerchLine[], months: string[]) {
  const end = orderedMonths(months).at(-1);
  if (!end) return [];
  const recorded = orderedMonths(
    lines
      .flatMap((line) => line.months.map((record) => record.month))
      .filter((month) => month <= end),
  );
  return merchQuarters(lines, recorded)
    .map((quarter) => {
      const keys = recorded.filter(
        (month) =>
          `${month.slice(0, 4)} Q${Math.ceil(Number(month.slice(5)) / 3)}` === quarter.quarter,
      );
      return {
        ...quarter,
        startMonth: keys[0],
        endMonth: keys.at(-1)!,
        complete: keys.length === 3 && completePeriod(lines, keys),
      };
    })
    .slice(-8);
}

export type CategoryPeriod = ReturnType<typeof readCategoryPeriod>;
export type CategoryQuarter = ReturnType<typeof categoryQuarterHistory>[number];
