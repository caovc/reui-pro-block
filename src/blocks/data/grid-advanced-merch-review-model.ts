import type { FilterNode } from "@/components/reui/filters/filters-types";

// Original Bricklane merchandising fixtures and local review logic.
// Cents and basis points are integers; aggregate rates are revenue weighted.
export const reviewAsOf = "2026-10-31";
export const reviewMonths = Array.from({ length: 24 }, (_, index) => {
  const value = new Date(Date.UTC(2024, 10 + index, 1));
  return value.toISOString().slice(0, 7);
});
export const reviewDepartments = ["Home", "Field", "Studio"] as const;
export const reviewCalls = ["Invest", "Maintain", "Review"] as const;
export type ReviewCall = (typeof reviewCalls)[number];
export type ReviewDepartment = (typeof reviewDepartments)[number];
export type MerchMonth = {
  month: string;
  grossCents: number;
  discountCents: number;
  returnedCents: number;
  costCents: number;
  units: number;
  returnedUnits: number;
  closingUnits: number;
  planCents: number;
  weeklyNetCents: number[];
};
export type MerchPromotion = { id: string; month: string; label: string; discountBps: number };
export type MerchLine = {
  id: string;
  name: string;
  department: ReviewDepartment;
  brandId: string;
  targetMarginBps: number;
  call: ReviewCall;
  months: MerchMonth[];
  promotions: MerchPromotion[];
};
export type MerchBrand = {
  id: string;
  name: string;
  initials: string;
  targetMarginBps: number;
  call: ReviewCall;
};
export type MerchBook = { brands: MerchBrand[]; lines: MerchLine[] };
export type MerchDraft = Omit<MerchLine, "id" | "months" | "promotions"> & {
  current: Omit<MerchMonth, "weeklyNetCents">;
};

function whole(value: number, label: string, maximum = 1_000_000_000) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum)
    throw new Error(`${label} must be a non-negative whole value within the supported range.`);
  return value;
}
const add = (values: number[]) => values.reduce((total, value) => total + value, 0);
const rate = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 10000) : null;
export function merchNet(month: MerchMonth) {
  return month.grossCents - month.discountCents - month.returnedCents;
}

export function allocateMerchCents(amount: number, weights: number[]) {
  whole(amount, "Amount");
  weights.forEach((weight) => whole(weight, "Weight"));
  const total = weights.reduce((sum, weight) => sum + BigInt(weight), 0n);
  if (!total) throw new Error("At least one weight must be positive.");
  const parts = weights.map((weight, index) => ({
    index,
    value: Number((BigInt(amount) * BigInt(weight)) / total),
    remainder: (BigInt(amount) * BigInt(weight)) % total,
  }));
  const order = parts.toSorted((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  );
  const left = amount - add(parts.map((part) => part.value));
  for (let index = 0; index < left; index++) order[index].value++;
  return parts.map((part) => part.value);
}

export function createMerchBook(): MerchBook {
  const brands: MerchBrand[] = [
    {
      id: "northfork",
      name: "Northfork Goods",
      initials: "NG",
      targetMarginBps: 4400,
      call: "Invest",
    },
    {
      id: "mossvale",
      name: "Mossvale Workshop",
      initials: "MW",
      targetMarginBps: 4700,
      call: "Maintain",
    },
    {
      id: "fieldnote",
      name: "Fieldnote Supply",
      initials: "FS",
      targetMarginBps: 4100,
      call: "Review",
    },
    { id: "bracken", name: "Bracken & Co", initials: "BC", targetMarginBps: 4900, call: "Invest" },
  ];
  const products = [
    ["Table linen", "Day pack", "Desk tray"],
    ["Stoneware set", "Trail blanket", "Planner kit"],
    ["Glass carafe", "Camp mug", "Canvas folio"],
    ["Storage basket", "Rain shell", "Task lamp"],
  ];
  const lines = brands.flatMap((brand, brandIndex) =>
    reviewDepartments.map((department, departmentIndex): MerchLine => {
      const ordinal = brandIndex * 3 + departmentIndex;
      const id = `line-${ordinal + 1}`;
      const price = 3400 + ordinal * 800;
      const unitCost = Math.round(price * (0.43 + (ordinal % 4) * 0.035));
      const promotions: MerchPromotion[] = [];
      const months = reviewMonths.map((month, monthIndex): MerchMonth => {
        const seasonal = [0.85, 0.88, 1.03, 0.98, 1.08, 1.1, 1.04, 0.95, 1.12, 1.18, 1.26, 1.32][
          Number(month.slice(5)) - 1
        ];
        const units = Math.round((120 + ordinal * 11 + monthIndex * 2.2) * seasonal);
        const grossCents = units * price;
        const returnedUnits = Math.floor(units * (0.015 + (ordinal % 3) * 0.012));
        const returnedCents = returnedUnits * price;
        const discountBps = (monthIndex + ordinal) % 5 === 0 ? 1100 + (ordinal % 3) * 200 : 250;
        const discountCents = Math.round(((grossCents - returnedCents) * discountBps) / 10000);
        const net = grossCents - discountCents - returnedCents;
        if (discountBps > 250)
          promotions.push({
            id: `${id}-${month}`,
            month,
            label: departmentIndex === 1 ? "Field weekend" : "Season edit",
            discountBps,
          });
        return {
          month,
          grossCents,
          discountCents,
          returnedCents,
          costCents: (units - returnedUnits) * unitCost,
          units,
          returnedUnits,
          closingUnits: Math.round(units * (0.9 + (ordinal % 4) * 0.25)),
          planCents: Math.round(net * (monthIndex % 4 === 0 ? 1.08 : 0.97)),
          weeklyNetCents: allocateMerchCents(net, [19 + (ordinal % 4), 24, 27, 30 - (ordinal % 4)]),
        };
      });
      return {
        id,
        name: products[brandIndex][departmentIndex],
        department,
        brandId: brand.id,
        targetMarginBps: brand.targetMarginBps,
        call: brand.call,
        months,
        promotions,
      };
    }),
  );
  return { brands, lines };
}

function baseReading(lines: MerchLine[], month: string) {
  const records = lines.flatMap((line) => line.months.filter((record) => record.month === month));
  const grossCents = add(records.map((record) => record.grossCents));
  const discountCents = add(records.map((record) => record.discountCents));
  const returnedCents = add(records.map((record) => record.returnedCents));
  const netCents = grossCents - discountCents - returnedCents;
  const costCents = add(records.map((record) => record.costCents));
  const units = add(records.map((record) => record.units));
  const returnedUnits = add(records.map((record) => record.returnedUnits));
  const closingUnits = add(records.map((record) => record.closingUnits));
  const soldUnits = units - returnedUnits;
  const planCents = add(records.map((record) => record.planCents));
  const profitCents = netCents - costCents;
  return {
    month,
    observed: records.length > 0,
    grossCents,
    discountCents,
    returnedCents,
    netCents,
    costCents,
    profitCents,
    units,
    returnedUnits,
    soldUnits,
    closingUnits,
    planCents,
    marginBps: rate(profitCents, netCents),
    returnBps: rate(returnedUnits, units),
    sellThroughBps: rate(soldUnits, soldUnits + closingUnits),
    coverWeeks: soldUnits > 0 ? (closingUnits / soldUnits) * 4.345 : null,
    averageUnitCents: soldUnits > 0 ? Math.round(netCents / soldUnits) : null,
    attainmentBps: rate(netCents, planCents),
    planVarianceCents: netCents - planCents,
  };
}
export type MerchReading = ReturnType<typeof readMerchLines>;

export function merchTargetBps(lines: MerchLine[], month: string) {
  const weights = lines.map((line) => ({
    target: line.targetMarginBps,
    net: line.months
      .filter((record) => record.month === month)
      .reduce((sum, record) => sum + merchNet(record), 0),
  }));
  const total = add(weights.map((record) => record.net));
  return total > 0
    ? Math.round(add(weights.map((record) => record.target * record.net)) / total)
    : null;
}

export function readMerchLines(lines: MerchLine[], month: string) {
  const current = baseReading(lines, month);
  const when = new Date(`${month}-01T00:00:00Z`);
  when.setUTCMonth(when.getUTCMonth() - 1);
  const previous = baseReading(lines, when.toISOString().slice(0, 7));
  const lastYear = baseReading(lines, `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`);
  return {
    ...current,
    monthMoveBps:
      current.marginBps !== null && previous.marginBps !== null
        ? current.marginBps - previous.marginBps
        : null,
    yearMoveBps:
      current.marginBps !== null && lastYear.marginBps !== null
        ? current.marginBps - lastYear.marginBps
        : null,
    promotionCount: lines.reduce(
      (count, line) =>
        count + line.promotions.filter((promotion) => promotion.month === month).length,
      0,
    ),
  };
}

export function merchQuarters(lines: MerchLine[], months: string[]) {
  const groups = new Map<string, string[]>();
  for (const month of months) {
    const key = `${month.slice(0, 4)} Q${Math.ceil(Number(month.slice(5)) / 3)}`;
    groups.set(key, [...(groups.get(key) ?? []), month]);
  }
  return [...groups].map(([quarter, selected]) => {
    const readings = selected.map((month) => baseReading(lines, month));
    const netCents = add(readings.map((reading) => reading.netCents));
    const profitCents = add(readings.map((reading) => reading.profitCents));
    return {
      quarter,
      months: selected.length,
      netCents,
      profitCents,
      marginBps: rate(profitCents, netCents),
    };
  });
}

export function merchRangeSeries(lines: MerchLine[], months: string[]) {
  return months.map((month) => {
    const records = lines.flatMap((line) => line.months.filter((record) => record.month === month));
    const weeks = [0, 1, 2, 3].map((index) =>
      add(records.map((record) => record.weeklyNetCents[index] ?? 0)),
    );
    return {
      month,
      range: records.length ? [Math.min(...weeks), Math.max(...weeks)] : undefined,
      weeks,
    };
  });
}

export function saveMerchLine(book: MerchBook, id: string | null, draft: MerchDraft): MerchBook {
  if (!draft.name.trim()) throw new Error("Enter a product line name.");
  if (!reviewDepartments.includes(draft.department))
    throw new Error("Choose an available department.");
  if (!book.brands.some((brand) => brand.id === draft.brandId))
    throw new Error("Choose an existing brand.");
  if (!reviewCalls.includes(draft.call)) throw new Error("Choose a review call.");
  whole(draft.targetMarginBps, "Margin target", 10000);
  if (!reviewMonths.includes(draft.current.month))
    throw new Error("Choose a recorded review month.");
  Object.entries(draft.current)
    .filter(([key]) => key !== "month")
    .forEach(([key, value]) => whole(Number(value), key));
  if (draft.current.discountCents + draft.current.returnedCents > draft.current.grossCents)
    throw new Error("Discounts and returns cannot exceed gross sales.");
  if (draft.current.returnedUnits > draft.current.units)
    throw new Error("Returned units cannot exceed units shipped.");
  const existing = id ? book.lines.find((line) => line.id === id) : undefined;
  if (id && !existing) throw new Error("This product line no longer exists.");
  const current = {
    ...draft.current,
    weeklyNetCents: allocateMerchCents(
      draft.current.grossCents - draft.current.discountCents - draft.current.returnedCents,
      [20, 25, 25, 30],
    ),
  };
  const next: MerchLine = {
    id: id ?? `line-${Math.max(0, ...book.lines.map((line) => Number(line.id.slice(5)) || 0)) + 1}`,
    name: draft.name.trim(),
    department: draft.department,
    brandId: draft.brandId,
    targetMarginBps: draft.targetMarginBps,
    call: draft.call,
    months: existing
      ? [...existing.months.filter((record) => record.month !== current.month), current].toSorted(
          (a, b) => a.month.localeCompare(b.month),
        )
      : [current],
    promotions: existing?.promotions ?? [],
  };
  return {
    ...book,
    lines: existing
      ? book.lines.map((line) => (line.id === id ? next : line))
      : [...book.lines, next],
  };
}

export function saveMerchBrand(
  book: MerchBook,
  id: string | null,
  draft: Omit<MerchBrand, "id">,
): MerchBook {
  if (!draft.name.trim() || !draft.initials.trim())
    throw new Error("Enter a brand name and initials.");
  if (draft.initials.trim().length > 3) throw new Error("Use up to three initials.");
  whole(draft.targetMarginBps, "Margin target", 10000);
  if (!reviewCalls.includes(draft.call)) throw new Error("Choose a review call.");
  if (id && !book.brands.some((brand) => brand.id === id))
    throw new Error("This brand no longer exists.");
  const brand = {
    ...draft,
    name: draft.name.trim(),
    initials: draft.initials.trim().toUpperCase(),
    id:
      id ?? `brand-${Math.max(0, ...book.brands.map((item) => Number(item.id.slice(6)) || 0)) + 1}`,
  };
  return {
    ...book,
    brands: id
      ? book.brands.map((item) => (item.id === id ? brand : item))
      : [...book.brands, brand],
  };
}

export function removeMerchBrand(book: MerchBook, id: string): MerchBook {
  return {
    brands: book.brands.filter((brand) => brand.id !== id),
    lines: book.lines.filter((line) => line.brandId !== id),
  };
}

export const merchMetrics = [
  { id: "netCents", label: "Net sales", section: "Sales", unit: "money", better: "higher" },
  { id: "profitCents", label: "Gross profit", section: "Sales", unit: "money", better: "higher" },
  { id: "marginBps", label: "Gross margin", section: "Margin", unit: "rate", better: "higher" },
  {
    id: "attainmentBps",
    label: "Sales to plan",
    section: "Margin",
    unit: "rate",
    better: "higher",
  },
  { id: "soldUnits", label: "Units kept", section: "Inventory", unit: "units", better: "higher" },
  { id: "returnBps", label: "Return rate", section: "Inventory", unit: "rate", better: "lower" },
  {
    id: "sellThroughBps",
    label: "Sell-through",
    section: "Inventory",
    unit: "rate",
    better: "higher",
  },
  {
    id: "coverWeeks",
    label: "Stock cover",
    section: "Inventory",
    unit: "weeks",
    better: "neutral",
  },
] as const;
export type MerchMetric = (typeof merchMetrics)[number];
export function merchStanding(metric: MerchMetric, value: number | null, reference: number | null) {
  if (value === null || reference === null || metric.better === "neutral" || value === reference)
    return "neutral";
  return (metric.better === "higher" ? value > reference : value < reference)
    ? "positive"
    : "negative";
}

export function matchesMerchQuery(
  record: Record<string, string | number | null>,
  node: FilterNode,
): boolean | undefined {
  if (node.type === "group") {
    const results = node.rules
      .map((rule) => matchesMerchQuery(record, rule))
      .filter((result) => result !== undefined);
    return results.length
      ? node.combinator === "and"
        ? results.every(Boolean)
        : results.some(Boolean)
      : undefined;
  }
  const key = node.path.join(".");
  if (!Object.hasOwn(record, key)) return undefined;
  const raw = record[key];
  const values = Array.isArray(node.value) ? node.value : [node.value];
  if (
    node.operator !== "empty" &&
    node.operator !== "not_empty" &&
    (values[0] == null || values[0] === "")
  )
    return undefined;
  const text = String(raw ?? "").toLowerCase();
  const options = values.map((value) => String(value ?? "").toLowerCase());
  let result: boolean;
  switch (node.operator) {
    case "contains":
      result = text.includes(options[0]);
      break;
    case "not_contains":
      result = !text.includes(options[0]);
      break;
    case "is":
    case "is_any_of":
      result = options.includes(text);
      break;
    case "is_not":
    case "is_none_of":
      result = !options.includes(text);
      break;
    case "gt":
      result = raw !== null && Number(raw) > Number(values[0]);
      break;
    case "gte":
      result = raw !== null && Number(raw) >= Number(values[0]);
      break;
    case "lt":
      result = raw !== null && Number(raw) < Number(values[0]);
      break;
    case "lte":
      result = raw !== null && Number(raw) <= Number(values[0]);
      break;
    case "eq":
      result = raw !== null && Number(raw) === Number(values[0]);
      break;
    case "neq":
      result = raw !== null && Number(raw) !== Number(values[0]);
      break;
    case "empty":
      result = raw === null || raw === undefined || raw === "";
      break;
    case "not_empty":
      result = raw !== null && raw !== undefined && raw !== "";
      break;
    default:
      return undefined;
  }
  return node.negated ? !result : result;
}

export function merchCsv(headers: string[], rows: (string | number | null)[][]) {
  const quote = (value: string | number | null) => {
    const text = value === null ? "" : String(value);
    const safe = typeof value === "string" && /^\s*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [headers, ...rows].map((row) => row.map(quote).join(",")).join("\r\n");
}
