/** Original demo planning rules. All money is integer cents; amounts are never silently clamped. */
export const planningMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
export const planningYear = 2026;
export const planningMonth = 10;
export const maxPlanningMoney = 100_000_000;
export type PlanningResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validPlanningMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 0 && month < 12;
}

export function planningMonthDays(month: number, year = planningYear): number {
  if (!validPlanningMonth(month)) throw new RangeError("Choose a valid month.");
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function validPlanningMoney(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= maxPlanningMoney;
}

export function validPlanningCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000;
}

export function planningMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function planningPercent(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

export function parsePlanningMoney(value: string): PlanningResult<number> {
  const trimmed = value.trim().replace(/^\$/, "").trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(trimmed)) {
    return { ok: false, error: "Enter a non-negative amount with at most two decimal places." };
  }
  const cents = Math.round(Number(trimmed.replaceAll(",", "")) * 100);
  return validPlanningMoney(cents)
    ? { ok: true, value: cents }
    : { ok: false, error: "The amount is outside the supported range." };
}

export function planningCsv(rows: readonly Record<string, string | number>[]): string {
  const headers = Object.keys(rows[0] ?? {});
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [
    headers.map(quote).join(","),
    ...rows.map((row) => headers.map((h) => quote(row[h])).join(",")),
  ].join("\r\n");
}

export interface PlanningFilterNode {
  type: "group" | "rule";
  combinator?: "and" | "or";
  rules?: PlanningFilterNode[];
  path?: string[];
  operator?: string;
  value?: unknown;
  negated?: boolean;
}

/** ReUI owns the query UI; domain values own matching, including incomplete rules and groups. */
export function matchesPlanningFilter(
  record: Readonly<Record<string, string | number | null>>,
  query: PlanningFilterNode,
): boolean {
  function match(node: PlanningFilterNode): boolean | undefined {
    if (node.type === "group") {
      const results = (node.rules ?? []).map(match).filter((result) => result !== undefined);
      if (!results.length) return undefined;
      return node.combinator === "or" ? results.some(Boolean) : results.every(Boolean);
    }
    const field = node.path?.[0];
    if (!field || !Object.hasOwn(record, field) || !node.operator) return undefined;
    const actual = record[field];
    const empty = actual === null || actual === "";
    if (node.operator === "empty") return node.negated ? !empty : empty;
    if (node.operator === "not_empty") return node.negated ? empty : !empty;
    const input = node.value;
    if (
      input === undefined ||
      input === null ||
      input === "" ||
      (Array.isArray(input) && input.length === 0)
    )
      return undefined;
    const text = (value: unknown) => String(value ?? "").toLowerCase();
    const a = text(actual);
    const b = text(input);
    let result: boolean | undefined;
    switch (node.operator) {
      case "contains":
        result = a.includes(b);
        break;
      case "not_contains":
        result = !a.includes(b);
        break;
      case "starts_with":
        result = a.startsWith(b);
        break;
      case "ends_with":
        result = a.endsWith(b);
        break;
      case "is":
        result = a === b;
        break;
      case "is_not":
        result = a !== b;
        break;
      case "is_any_of":
        result = Array.isArray(input) ? input.some((value) => a === text(value)) : undefined;
        break;
      case "is_none_of":
        result = Array.isArray(input) ? !input.some((value) => a === text(value)) : undefined;
        break;
      case "between":
      case "not_between": {
        if (
          !Array.isArray(input) ||
          input.length !== 2 ||
          input.some((value) => value === "" || !Number.isFinite(Number(value)))
        )
          return undefined;
        const inside =
          !empty && Number(actual) >= Number(input[0]) && Number(actual) <= Number(input[1]);
        result = !empty && (node.operator === "between" ? inside : !inside);
        break;
      }
      case "eq":
      case "neq":
      case "gt":
      case "gte":
      case "lt":
      case "lte": {
        const value = Number(input);
        if (!Number.isFinite(value)) return undefined;
        result =
          !empty &&
          (node.operator === "eq"
            ? Number(actual) === value
            : node.operator === "neq"
              ? Number(actual) !== value
              : node.operator === "gt"
                ? Number(actual) > value
                : node.operator === "gte"
                  ? Number(actual) >= value
                  : node.operator === "lt"
                    ? Number(actual) < value
                    : Number(actual) <= value);
        break;
      }
    }
    return result === undefined ? undefined : node.negated ? !result : result;
  }
  return match(query) ?? true;
}
