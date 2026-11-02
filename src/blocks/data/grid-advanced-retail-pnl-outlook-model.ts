import {
  pnlClosedMonths,
  pnlMonths,
  pnlSections,
  type PnlCompareBase,
  type PnlLine,
  type PnlProjection,
  type PnlRow,
  type PnlVariance,
} from "./grid-advanced-retail-pnl-outlook-data.ts";

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const ratio = (value: number, baseline: number) =>
  baseline === 0 ? null : (value / baseline) * 100;

/** Original demo boundary policy: strict thresholds; zero baseline uses amount only. */
export function pnlVariance(
  value: number,
  baseline: number,
  direction: "higher" | "lower",
  tolerance: number,
): PnlVariance {
  const delta = value - baseline;
  const percent = baseline === 0 ? null : (delta / Math.abs(baseline)) * 100;
  const threshold = Number.isFinite(tolerance) ? Math.max(0, tolerance) : 5;
  const flagged = Math.abs(delta) > 15 && (percent === null || Math.abs(percent) > threshold);
  const favourable = direction === "higher" ? delta > 0 : delta < 0;
  return {
    delta,
    percent,
    status: flagged ? (favourable ? "favourable" : "adverse") : "in-line",
  };
}

function combine(vectors: readonly (readonly number[])[], signs?: readonly number[]): number[] {
  return pnlMonths.map(({ index }) =>
    vectors.reduce(
      (total, vector, position) => total + vector[index] * (signs?.[position] ?? 1),
      0,
    ),
  );
}

interface RowInput {
  id: string;
  kind: PnlRow["kind"];
  name: string;
  values: number[];
  baseline: number[];
  direction: "higher" | "lower";
  lines: readonly PnlLine[];
  section?: PnlRow["section"];
  line?: PnlLine;
  children?: PnlRow[];
  revenue?: number;
}

function projectRow(input: RowInput, tolerance: number): PnlRow {
  const outlook = sum(input.values);
  const baselineTotal = sum(input.baseline);
  const closed = sum(input.values.slice(0, pnlClosedMonths));
  return {
    id: input.id,
    kind: input.kind,
    name: input.name,
    section: input.section,
    lineId: input.line?.id,
    owner:
      input.line?.owner ??
      pnlSections.find((section) => section.id === input.section)?.owner ??
      "Mara Ellis",
    confidence: input.line?.confidence,
    lowCount: input.lines.filter((line) => line.confidence === "low").length,
    notesCount: input.lines.reduce((total, line) => total + line.notes.length, 0),
    values: input.values,
    baseline: input.baseline,
    outlook,
    baselineTotal,
    closed,
    closedShare: ratio(closed, outlook),
    marginPercent: input.revenue === undefined ? null : ratio(outlook, input.revenue),
    variance: pnlVariance(outlook, baselineTotal, input.direction, tolerance),
    ...(input.children ? { children: input.children } : {}),
  };
}

/** Full raw statement projection. Search/visibility never enter this calculation. */
export function computePnl(
  lines: readonly PnlLine[],
  compare: PnlCompareBase,
  tolerance: number,
): PnlProjection {
  const sections = pnlSections.map((section) => {
    const members = lines.filter((line) => line.section === section.id);
    const children = members.map((line) =>
      projectRow(
        {
          id: line.id,
          kind: "line",
          name: line.name,
          section: line.section,
          line,
          lines: [line],
          values: pnlMonths.map(({ index, forecast }) =>
            forecast ? line.forecast[index] : line.actual[index],
          ),
          baseline: [...line[compare]],
          direction: section.read,
        },
        tolerance,
      ),
    );
    return projectRow(
      {
        id: `section-${section.id}`,
        kind: "section",
        name: section.name,
        section: section.id,
        lines: members,
        values: combine(children.map((row) => row.values)),
        baseline: combine(children.map((row) => row.baseline)),
        direction: section.read,
        children,
      },
      tolerance,
    );
  });
  const [revenue, cogs, fulfilment, marketing, operating] = sections;
  const revenueTotal = revenue.outlook;
  const margin = (
    id: string,
    name: string,
    parts: PnlRow[],
    signs: number[],
    includedSections: PnlLine["section"][],
  ) =>
    projectRow(
      {
        id,
        kind: "margin",
        name,
        values: combine(
          parts.map((row) => row.values),
          signs,
        ),
        baseline: combine(
          parts.map((row) => row.baseline),
          signs,
        ),
        lines: lines.filter((line) => includedSections.includes(line.section)),
        direction: "higher",
        revenue: revenueTotal,
      },
      tolerance,
    );
  const gross = margin(
    "gross-margin",
    "Gross Margin",
    [revenue, cogs],
    [1, -1],
    ["revenue", "cogs"],
  );
  const contribution = margin(
    "contribution",
    "Contribution",
    [gross, fulfilment, marketing],
    [1, -1, -1],
    ["revenue", "cogs", "fulfilment", "marketing"],
  );
  const profit = margin(
    "operating-profit",
    "Operating Profit",
    [contribution, operating],
    [1, -1],
    pnlSections.map((section) => section.id),
  );
  const rows = [revenue, cogs, gross, fulfilment, marketing, contribution, operating];
  return {
    rows,
    profit,
    flatRows: rows.flatMap((row) => [row, ...(row.children ?? [])]),
  };
}

/** Original demo format policy: signed ordinary decimals; no blank/grouping/currency/exponent. */
export function parsePnlAmount(raw: string): number | undefined {
  const text = raw.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

/** All sources enter here as typed writes, including native clear/cut and custom actions. */
export function applyPnlWrites(
  lines: PnlLine[],
  writes: readonly { rowId: string; columnId: string; value: unknown }[],
): { lines: PnlLine[]; accepted: number; rejected: number } {
  const indexById = new Map(lines.map((line, index) => [line.id, index]));
  let result = lines;
  let accepted = 0;
  let rejected = 0;
  for (const write of writes) {
    const rowIndex = indexById.get(write.rowId);
    const month = /^month-(9|10|11)$/.exec(write.columnId);
    if (
      rowIndex === undefined ||
      !month ||
      typeof write.value !== "number" ||
      !Number.isFinite(write.value)
    ) {
      rejected += 1;
      continue;
    }
    const monthIndex = Number(month[1]);
    const current = result[rowIndex];
    if (current.forecast.length !== pnlMonths.length) {
      rejected += 1;
      continue;
    }
    accepted += 1;
    if (Object.is(current.forecast[monthIndex], write.value)) continue;
    if (result === lines) result = [...lines];
    const forecast = [...current.forecast];
    forecast[monthIndex] = write.value;
    result[rowIndex] = { ...current, forecast };
  }
  return { lines: result, accepted, rejected };
}

const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function formatPnlNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const text = integer.format(Math.abs(value));
  return value < 0 && text !== "0" ? `(${text})` : text;
}

/** Input units are thousands: 1250 becomes 1.3M, not 1.3K. */
export function formatPnlCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const magnitude = Math.abs(value);
  const text = `${compact.format(magnitude >= 1000 ? magnitude / 1000 : magnitude)}${magnitude >= 1000 ? "M" : "K"}`;
  return value < 0 && magnitude !== 0 ? `(${text})` : text;
}

export function formatPnlPercent(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const precision = Number.isFinite(digits) ? Math.min(20, Math.max(0, Math.trunc(digits))) : 1;
  return `${value.toFixed(precision)}%`;
}
