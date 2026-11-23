import {
  maxPlanningMoney,
  planningMonth,
  planningCsv,
  planningMonths,
  validPlanningMoney,
  validPlanningMonth,
  type PlanningResult,
} from "./grid-advanced-planning-common.ts";

export const familyBudgetSections = ["income", "bills", "expenses", "savings", "debt"] as const;
export type FamilyBudgetSection = (typeof familyBudgetSections)[number];
export const familyBudgetSectionLabels: Record<FamilyBudgetSection, string> = {
  income: "Income",
  bills: "Bills",
  expenses: "Expenses",
  savings: "Savings",
  debt: "Debt payments",
};
export interface FamilyBudgetLine {
  id: string;
  name: string;
  section: FamilyBudgetSection;
  owner: string;
  planned: number[];
  actual: (number | null)[];
}
export interface FamilyBalance {
  id: string;
  name: string;
  kind: "asset" | "liability";
  amount: number;
}
export type FamilyBudgetCell = "planned" | "actual";

function makeLine(
  id: string,
  name: string,
  section: FamilyBudgetSection,
  owner: string,
  monthly: number,
  offset = 0,
): FamilyBudgetLine {
  const planned = Array.from({ length: 12 }, (_, month) => monthly + (month === 11 ? offset : 0));
  const actual = planned.map((amount, month) =>
    month > planningMonth ? null : Math.max(0, amount + ((month % 3) - 1) * offset),
  );
  return { id, name, section, owner, planned, actual };
}

/** Fictional household, names and amounts authored for Bricklane. */
export const initialFamilyBudget: FamilyBudgetLine[] = [
  makeLine("salary-mira", "Mira’s salary", "income", "Mira", 530_000),
  makeLine("salary-jules", "Jules’s salary", "income", "Jules", 420_000),
  makeLine("workshop", "Weekend workshops", "income", "Mira", 32_000, 4_000),
  makeLine("home", "Home payment", "bills", "Joint", 245_000),
  makeLine("utilities", "Power and water", "bills", "Joint", 24_000, 2_000),
  makeLine("insurance", "Household insurance", "bills", "Joint", 18_000),
  makeLine("food", "Groceries", "expenses", "Joint", 72_000, 3_000),
  makeLine("transport", "Local transport", "expenses", "Joint", 28_000, 1_000),
  makeLine("health", "Health and wellbeing", "expenses", "Joint", 20_000, 2_000),
  makeLine("emergency", "Emergency fund", "savings", "Joint", 90_000),
  makeLine("holiday", "Travel goal", "savings", "Joint", 35_000),
  makeLine("student", "Student loan", "debt", "Jules", 48_000),
  makeLine("card", "Card repayment", "debt", "Mira", 27_000, 1_000),
];
export const initialFamilyBalances: FamilyBalance[] = [
  { id: "cash", name: "Checking and cash", kind: "asset", amount: 1_250_000 },
  { id: "emergency-balance", name: "Emergency savings", kind: "asset", amount: 2_800_000 },
  { id: "investments", name: "Long-term investments", kind: "asset", amount: 6_450_000 },
  { id: "student-balance", name: "Student loan balance", kind: "liability", amount: 1_720_000 },
  { id: "card-balance", name: "Card balance", kind: "liability", amount: 215_000 },
];

export function validateFamilyBudgetLine(line: FamilyBudgetLine): string | undefined {
  if (!line.id.trim()) return "A line ID is required.";
  if (!line.name.trim() || line.name.trim().length > 80)
    return "Enter a line name of 1–80 characters.";
  if (!line.owner.trim() || line.owner.trim().length > 40) return "Enter a household owner.";
  if (!familyBudgetSections.includes(line.section)) return "Choose a valid budget section.";
  if (line.planned.length !== 12 || line.actual.length !== 12)
    return "A budget line needs all twelve months.";
  if (!line.planned.every(validPlanningMoney))
    return "Every monthly plan must be a non-negative amount.";
  if (!line.actual.every((amount) => amount === null || validPlanningMoney(amount))) {
    return "Every actual must be a non-negative amount or not reported.";
  }
  return undefined;
}

export function setFamilyBudgetCell(
  lines: readonly FamilyBudgetLine[],
  id: string,
  month: number,
  cell: FamilyBudgetCell,
  amount: number | null,
): PlanningResult<FamilyBudgetLine[]> {
  if (!validPlanningMonth(month)) return { ok: false, error: "Choose a valid month." };
  if (!lines.some((line) => line.id === id)) return { ok: false, error: "Budget line not found." };
  if ((amount === null && cell === "planned") || (amount !== null && !validPlanningMoney(amount))) {
    return { ok: false, error: `Enter an amount from $0 to $${maxPlanningMoney / 100}.` };
  }
  return {
    ok: true,
    value: lines.map((line) =>
      line.id === id
        ? ({
            ...line,
            [cell]: line[cell].map((value, index) => (index === month ? amount : value)),
          } as FamilyBudgetLine)
        : line,
    ),
  };
}

export function saveFamilyBudgetLine(
  lines: readonly FamilyBudgetLine[],
  line: FamilyBudgetLine,
): PlanningResult<FamilyBudgetLine[]> {
  const error = validateFamilyBudgetLine(line);
  if (error) return { ok: false, error };
  const name = line.name.trim();
  if (
    lines.some(
      (other) =>
        other.id !== line.id &&
        other.section === line.section &&
        other.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    return { ok: false, error: "That section already contains a line with this name." };
  }
  const next = {
    ...line,
    name,
    owner: line.owner.trim(),
    planned: [...line.planned],
    actual: [...line.actual],
  };
  return {
    ok: true,
    value: lines.some((other) => other.id === line.id)
      ? lines.map((other) => (other.id === line.id ? next : other))
      : [...lines, next],
  };
}

export function familyLineForecast(line: FamilyBudgetLine): number {
  return line.planned.reduce((total, planned, month) => total + (line.actual[month] ?? planned), 0);
}

export function familySectionTotals(lines: readonly FamilyBudgetLine[], month: number) {
  if (!validPlanningMonth(month)) throw new RangeError("Choose a valid month.");
  return familyBudgetSections.map((section) => {
    const rows = lines.filter((line) => line.section === section);
    return {
      section,
      planned: rows.reduce((total, line) => total + line.planned[month], 0),
      actual: rows.reduce((total, line) => total + (line.actual[month] ?? 0), 0),
      unreported: rows.filter((line) => line.actual[month] === null).length,
      forecast: rows.reduce((total, line) => total + familyLineForecast(line), 0),
    };
  });
}

export function familyCashFlow(lines: readonly FamilyBudgetLine[]) {
  return Array.from({ length: 12 }, (_, month) => {
    let income = 0;
    let outflow = 0;
    let actualIncome = 0;
    let actualOutflow = 0;
    for (const line of lines) {
      const forecast = line.actual[month] ?? line.planned[month];
      if (line.section === "income") {
        income += forecast;
        actualIncome += line.actual[month] ?? 0;
      } else {
        outflow += forecast;
        actualOutflow += line.actual[month] ?? 0;
      }
    }
    return {
      month,
      income,
      outflow,
      net: income - outflow,
      actualNet: actualIncome - actualOutflow,
    };
  });
}

export function familyNetWorth(balances: readonly FamilyBalance[]) {
  const assets = balances
    .filter((balance) => balance.kind === "asset")
    .reduce((total, balance) => total + balance.amount, 0);
  const liabilities = balances
    .filter((balance) => balance.kind === "liability")
    .reduce((total, balance) => total + balance.amount, 0);
  return { assets, liabilities, netWorth: assets - liabilities };
}

export function setFamilyBalance(
  balances: readonly FamilyBalance[],
  id: string,
  amount: number,
): PlanningResult<FamilyBalance[]> {
  if (!validPlanningMoney(amount))
    return { ok: false, error: "Enter a valid non-negative balance." };
  if (!balances.some((balance) => balance.id === id))
    return { ok: false, error: "Balance not found." };
  return {
    ok: true,
    value: balances.map((balance) => (balance.id === id ? { ...balance, amount } : balance)),
  };
}

export function familyBudgetCsv(
  view: string,
  month: number,
  lines: readonly FamilyBudgetLine[],
  balances: readonly FamilyBalance[],
): string {
  if (!validPlanningMonth(month)) throw new RangeError("Choose a valid month.");
  if (view === "worth") {
    return planningCsv(
      balances.map((balance) => ({
        Account: balance.name,
        Type: balance.kind,
        BalanceUSD: balance.amount / 100,
      })),
    );
  }
  if (view === "year") {
    return planningCsv(
      lines.map((line) => {
        const months = Object.fromEntries(
          planningMonths.map((name, index) => [
            name,
            (line.actual[index] ?? line.planned[index]) / 100,
          ]),
        );
        return {
          Section: familyBudgetSectionLabels[line.section],
          Line: line.name,
          Owner: line.owner,
          ...months,
          YearForecastUSD: familyLineForecast(line) / 100,
        };
      }),
    );
  }
  return planningCsv(
    lines.map((line) => ({
      Section: familyBudgetSectionLabels[line.section],
      Line: line.name,
      Owner: line.owner,
      Month: planningMonths[month],
      PlanUSD: line.planned[month] / 100,
      ActualUSD: line.actual[month] === null ? "Not reported" : line.actual[month]! / 100,
      YearForecastUSD: familyLineForecast(line) / 100,
    })),
  );
}
