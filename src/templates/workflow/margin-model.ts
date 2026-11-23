// Original Bricklane finance demo model. All monetary inputs are integer cents.
// This models local planning data; it performs no banking, payment or identity calls.

export const marginToday = "2026-11-20";
export const marginPages = [
  ["", "Dashboard"],
  ["plan/pnl", "Profit & loss"],
  ["plan/budgets", "Project budgets"],
  ["plan/scenarios", "Acquisition scenarios"],
  ["cash/cash-flow", "Cash flow"],
  ["cash/receivables", "Receivables"],
  ["ledger/transactions", "Transactions"],
  ["ledger/controls", "Controls"],
] as const;

export type MarginPage = (typeof marginPages)[number][0];
export type InvoicePlan = "Essential" | "Studio" | "Partner";
export type InvoiceLane = "needs-you" | "waiting" | "next-30-days" | "settled";
export type InvoiceAction = {
  kind:
    | "payment"
    | "reminder"
    | "promise"
    | "dispute"
    | "resolve-dispute"
    | "note"
    | "credit"
    | "writeoff";
  date: string;
  note: string;
  amountCents?: number;
  promisedOn?: string;
};
export type InvoiceDraft = {
  customer: string;
  plan: InvoicePlan;
  issuedOn: string;
  dueOn: string;
  netCents: number;
  costCents: number;
};
export type Invoice = InvoiceDraft & { id: string; activities: InvoiceAction[] };
export type Expense = { id: string; date: string; category: string; amountCents: number };
export type Account = "cash" | "receivables" | "revenue" | "direct-cost" | "operating" | "equity";
export type JournalLine = { account: Account; debitCents: number; creditCents: number };
export type JournalDraft = { date: string; memo: string; lines: JournalLine[] };
export type Journal = JournalDraft & {
  id: string;
  status: "posted" | "review" | "blocked";
  ruleId?: string;
};
export type LedgerEntry = JournalLine & { id: string; date: string; memo: string; source: string };
export type ControlAction = {
  kind: "manual-journal" | "invoice-writeoff" | "data-export";
  amountCents: number;
};
export type ControlRule = {
  id: string;
  name: string;
  enabled: boolean;
  kind: ControlAction["kind"] | "any";
  aboveCents: number;
  verdict: "allow" | "review" | "block";
};
export type MarginBook = {
  asOf: string;
  openingOn: string;
  openingCashCents: number;
  lockedThrough: string | null;
  invoices: Invoice[];
  expenses: Expense[];
  journals: Journal[];
  rules: ControlRule[];
};
export type ProjectBudget = {
  name: string;
  budgetCents: number;
  spentCents: number;
  committedCents: number;
  contingencyCents: number;
  decision: string;
};
export type AcquisitionInputs = {
  priceCents: number;
  downPaymentBps: number;
  annualRateBps: number;
  termYears: number;
  horizonYears: number;
  annualIncomeCents: number;
  appreciationBps: number;
  saleCostBps: number;
};

const maxCents = 100_000_000_000;
const plans: InvoicePlan[] = ["Essential", "Studio", "Partner"];
const accounts: Account[] = [
  "cash",
  "receivables",
  "revenue",
  "direct-cost",
  "operating",
  "equity",
];

function cents(value: number, label = "Amount", allowNegative = false) {
  if (!Number.isSafeInteger(value) || Math.abs(value) > maxCents || (!allowNegative && value < 0)) {
    throw new Error(
      `${label} must be a valid amount from ${allowNegative ? "-$1 billion" : "$0"} through $1 billion.`,
    );
  }
  return value;
}

function integer(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`);
  }
  return value;
}

function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error("Enter a valid date.");
  }
  if (new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error("Enter a valid calendar date.");
  }
  return value;
}

function month(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new Error("Enter a month as YYYY-MM.");
  return value;
}

function sum(values: number[]) {
  return cents(
    values.reduce((total, value) => total + value, 0),
    "Total",
    true,
  );
}

function ratio(value: number, numerator: number, denominator: number) {
  const product = BigInt(value) * BigInt(numerator);
  const sign = product < 0n ? -1n : 1n;
  const magnitude = product * sign;
  return cents(
    Number(sign * ((magnitude + BigInt(denominator) / 2n) / BigInt(denominator))),
    "Result",
    true,
  );
}

function editable(book: MarginBook, value: string) {
  date(value);
  if (value < book.openingOn) throw new Error("The date is before these books opened.");
  if (book.lockedThrough && value.slice(0, 7) <= book.lockedThrough) {
    throw new Error(`The books are locked through ${book.lockedThrough}.`);
  }
}

export function createMarginBook(): MarginBook {
  const customers = ["Alder Workshop", "Harbour Research", "Juniper Studio"];
  const monthly = [
    ["2026-08", 3_500_000, 2_500_000, 2_000_000],
    ["2026-09", 3_800_000, 2_700_000, 2_100_000],
    ["2026-10", 3_900_000, 2_900_000, 2_150_000],
    ["2026-11", 4_200_000, 3_100_000, 2_250_000],
  ] as const;
  const invoices = monthly.flatMap(([period, ...amounts], periodIndex) =>
    amounts.map((netCents, index): Invoice => {
      const issuedOn = `${period}-${["02", "08", "12"][index]}`;
      const dueOn = `${period}-${["15", "22", "25"][index]}`;
      const paid = periodIndex < 3 || index === 2;
      return {
        id: `BL-${2001 + periodIndex * 3 + index}`,
        customer: customers[index],
        plan: plans[index],
        issuedOn,
        dueOn,
        netCents,
        costCents: ratio(netCents, 2800, 10000),
        activities: paid
          ? [
              {
                kind: "payment",
                date: `${period}-14`,
                note: "Recorded local settlement",
                amountCents: netCents,
              },
            ]
          : index === 0
            ? [
                {
                  kind: "payment",
                  date: `${period}-14`,
                  note: "First instalment",
                  amountCents: 2_520_000,
                },
              ]
            : [
                {
                  kind: "dispute",
                  date: `${period}-18`,
                  note: "Purchase-order reference needs review",
                },
              ],
      };
    }),
  );
  return {
    asOf: marginToday,
    openingOn: "2026-08-01",
    openingCashCents: 52_000_000,
    lockedThrough: "2026-09",
    invoices,
    expenses: monthly.flatMap(([period], index) => [
      { id: `payroll-${index}`, date: `${period}-15`, category: "Team", amountCents: 2_800_000 },
      { id: `tools-${index}`, date: `${period}-16`, category: "Tools", amountCents: 420_000 },
      { id: `space-${index}`, date: `${period}-17`, category: "Workspace", amountCents: 360_000 },
      { id: `growth-${index}`, date: `${period}-18`, category: "Growth", amountCents: 220_000 },
    ]),
    journals: [],
    rules: [
      {
        id: "writeoff-review",
        name: "Review large credit losses",
        enabled: true,
        kind: "invoice-writeoff",
        aboveCents: 100_000,
        verdict: "review",
      },
      {
        id: "journal-review",
        name: "Review substantial journals",
        enabled: true,
        kind: "manual-journal",
        aboveCents: 2_000_000,
        verdict: "review",
      },
    ],
  };
}

export function invoiceBalance(invoice: Invoice) {
  return cents(
    invoice.netCents -
      sum(
        invoice.activities
          .filter((action) => ["payment", "credit", "writeoff"].includes(action.kind))
          .map((action) => action.amountCents ?? 0),
      ),
    "Invoice balance",
  );
}

export function invoiceLane(invoice: Invoice, asOf = marginToday): InvoiceLane {
  date(asOf);
  if (invoiceBalance(invoice) === 0) return "settled";
  const resolvedAt = invoice.activities.findLastIndex(
    (action) => action.kind === "resolve-dispute",
  );
  if (invoice.activities.some((action, index) => action.kind === "dispute" && index > resolvedAt))
    return "needs-you";
  const latest = invoice.activities.findLast((action) => action.kind === "promise");
  if (latest?.promisedOn && latest.promisedOn >= asOf) return "waiting";
  if (invoice.dueOn < asOf) return "needs-you";
  const thirtyDays = new Date(`${asOf}T00:00:00Z`);
  thirtyDays.setUTCDate(thirtyDays.getUTCDate() + 30);
  return invoice.dueOn <= thirtyDays.toISOString().slice(0, 10) ? "next-30-days" : "waiting";
}

export function createInvoice(book: MarginBook, draft: InvoiceDraft): MarginBook {
  editable(book, draft.issuedOn);
  if (draft.issuedOn > book.asOf) throw new Error("Issue date cannot be after the book date.");
  date(draft.dueOn);
  if (draft.dueOn < draft.issuedOn) throw new Error("Due date cannot be before issue date.");
  if (!draft.customer.trim()) throw new Error("Enter a customer name.");
  if (!plans.includes(draft.plan)) throw new Error("Choose an available plan.");
  if (cents(draft.netCents) === 0) throw new Error("Invoice amount must be greater than zero.");
  cents(draft.costCents, "Direct cost");
  const next = Math.max(2000, ...book.invoices.map(({ id }) => Number(id.slice(3)) || 0)) + 1;
  return {
    ...book,
    invoices: [
      ...book.invoices,
      { ...draft, customer: draft.customer.trim(), id: `BL-${next}`, activities: [] },
    ],
  };
}

export function applyInvoiceAction(
  book: MarginBook,
  id: string,
  action: InvoiceAction,
): MarginBook {
  const invoice = book.invoices.find((item) => item.id === id);
  if (!invoice) throw new Error("Invoice no longer exists.");
  date(action.date);
  if (action.date < invoice.issuedOn) throw new Error("Activity cannot predate the invoice.");
  if (!action.note.trim()) throw new Error("Add a short activity note.");
  const financial = ["payment", "credit", "writeoff"].includes(action.kind);
  if (financial) {
    editable(book, action.date);
    if (action.date > book.asOf)
      throw new Error("Financial activity cannot be after the book date.");
    if (!action.amountCents || cents(action.amountCents) > invoiceBalance(invoice)) {
      throw new Error("Amount must be positive and no greater than the outstanding balance.");
    }
    if (action.kind === "writeoff") {
      const decision = evaluateRules(book.rules, {
        kind: "invoice-writeoff",
        amountCents: action.amountCents,
      });
      if (decision.verdict !== "allow")
        throw new Error(
          `Write-off needs ${decision.verdict === "review" ? "finance review" : "a different control policy"}.`,
        );
    }
  }
  if (action.kind === "promise") {
    if (!action.promisedOn) throw new Error("Choose the promised payment date.");
    date(action.promisedOn);
    if (action.promisedOn < action.date) throw new Error("Promised date cannot be in the past.");
  }
  return {
    ...book,
    invoices: book.invoices.map((item) =>
      item.id === id
        ? { ...item, activities: [...item.activities, { ...action, note: action.note.trim() }] }
        : item,
    ),
  };
}

export function buildLedger(book: MarginBook): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  function post(
    id: string,
    postedOn: string,
    memo: string,
    source: string,
    debit: Account,
    credit: Account,
    amount: number,
  ) {
    if (amount === 0) return;
    entries.push({
      id: `${id}-d`,
      date: postedOn,
      memo,
      source,
      account: debit,
      debitCents: amount,
      creditCents: 0,
    });
    entries.push({
      id: `${id}-c`,
      date: postedOn,
      memo,
      source,
      account: credit,
      debitCents: 0,
      creditCents: amount,
    });
  }
  post(
    "opening",
    book.openingOn,
    "Opening local capital",
    "Opening",
    "cash",
    "equity",
    book.openingCashCents,
  );
  for (const invoice of book.invoices) {
    post(
      invoice.id,
      invoice.issuedOn,
      invoice.customer,
      invoice.id,
      "receivables",
      "revenue",
      invoice.netCents,
    );
    post(
      `${invoice.id}-cost`,
      invoice.issuedOn,
      "Direct delivery cost paid",
      invoice.id,
      "direct-cost",
      "cash",
      invoice.costCents,
    );
    invoice.activities.forEach((action, index) => {
      const amount = action.amountCents ?? 0;
      if (action.kind === "payment")
        post(
          `${invoice.id}-${index}`,
          action.date,
          action.note,
          invoice.id,
          "cash",
          "receivables",
          amount,
        );
      if (action.kind === "credit")
        post(
          `${invoice.id}-${index}`,
          action.date,
          action.note,
          invoice.id,
          "revenue",
          "receivables",
          amount,
        );
      if (action.kind === "writeoff")
        post(
          `${invoice.id}-${index}`,
          action.date,
          action.note,
          invoice.id,
          "operating",
          "receivables",
          amount,
        );
    });
  }
  for (const expense of book.expenses)
    post(
      expense.id,
      expense.date,
      expense.category,
      "Expenses",
      "operating",
      "cash",
      expense.amountCents,
    );
  for (const journal of book.journals) {
    if (journal.status !== "posted") continue;
    journal.lines.forEach((line, index) =>
      entries.push({
        ...line,
        id: `${journal.id}-${index}`,
        date: journal.date,
        memo: journal.memo,
        source: journal.id,
      }),
    );
  }
  return entries.toSorted((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function monthSummary(book: MarginBook, period: string) {
  month(period);
  const ledger = buildLedger(book).filter((entry) => entry.date <= book.asOf);
  const current = ledger.filter((entry) => entry.date.slice(0, 7) === period);
  const balance = (account: Account, creditPositive = false) =>
    sum(
      current
        .filter((entry) => entry.account === account)
        .map((entry) =>
          creditPositive
            ? entry.creditCents - entry.debitCents
            : entry.debitCents - entry.creditCents,
        ),
    );
  const netRevenueCents = balance("revenue", true);
  const directCostCents = balance("direct-cost");
  const operatingCents = balance("operating");
  const cashInCents = sum(
    current.filter((entry) => entry.account === "cash").map((entry) => entry.debitCents),
  );
  const cashOutCents = sum(
    current.filter((entry) => entry.account === "cash").map((entry) => entry.creditCents),
  );
  const openingCashCents = sum(
    ledger
      .filter((entry) => entry.account === "cash" && entry.date.slice(0, 7) < period)
      .map((entry) => entry.debitCents - entry.creditCents),
  );
  const closingCashCents = sum([openingCashCents, cashInCents, -cashOutCents]);
  const grossProfitCents = netRevenueCents - directCostCents;
  const invoices = book.invoices.filter(
    (invoice) => invoice.issuedOn.slice(0, 7) === period && invoice.issuedOn <= book.asOf,
  );
  const due = invoices.filter((invoice) => invoice.dueOn <= book.asOf);
  const onTime = due.filter(
    (invoice) =>
      sum(
        invoice.activities
          .filter((action) => action.kind === "payment" && action.date <= invoice.dueOn)
          .map((action) => action.amountCents ?? 0),
      ) >= invoice.netCents,
  );
  const receivablesCents = sum(
    ledger
      .filter((entry) => entry.account === "receivables" && entry.date.slice(0, 7) <= period)
      .map((entry) => entry.debitCents - entry.creditCents),
  );
  return {
    month: period,
    netRevenueCents,
    directCostCents,
    grossProfitCents,
    operatingCents,
    operatingProfitCents: grossProfitCents - operatingCents,
    grossMarginBps:
      netRevenueCents === 0 ? null : Math.round((grossProfitCents / netRevenueCents) * 10000),
    openingCashCents,
    cashInCents,
    cashOutCents,
    closingCashCents,
    netCashCents: cashInCents - cashOutCents,
    receivablesCents,
    cashRunwayMonths:
      cashOutCents > cashInCents ? closingCashCents / (cashOutCents - cashInCents) : null,
    onTimeCollectionBps: due.length === 0 ? null : Math.round((onTime.length / due.length) * 10000),
    invoiceCount: invoices.length,
  };
}

export function bookSeries(book: MarginBook) {
  const periods = [...new Set(book.invoices.map((invoice) => invoice.issuedOn.slice(0, 7)))].sort();
  return periods.map((period) => monthSummary(book, period));
}

export function forecastMonths(input: {
  startMonth: string;
  months: number;
  revenueCents: number;
  growthBps: number;
  costRateBps: number;
  operatingCents: number;
}) {
  month(input.startMonth);
  integer(input.months, 1, 24, "Forecast months");
  cents(input.revenueCents, "Starting revenue");
  cents(input.operatingCents, "Operating costs");
  integer(input.growthBps, -10000, 10000, "Growth basis points");
  integer(input.costRateBps, 0, 10000, "Direct cost basis points");
  let revenueCents = input.revenueCents;
  const start = new Date(`${input.startMonth}-01T00:00:00Z`);
  return Array.from({ length: input.months }, (_, index) => {
    const point = new Date(start);
    point.setUTCMonth(point.getUTCMonth() + index);
    const directCostCents = ratio(revenueCents, input.costRateBps, 10000);
    const row = {
      month: point.toISOString().slice(0, 7),
      revenueCents,
      directCostCents,
      operatingCents: input.operatingCents,
      profitCents: revenueCents - directCostCents - input.operatingCents,
    };
    if (index < input.months - 1)
      revenueCents = ratio(revenueCents, 10000 + input.growthBps, 10000);
    return row;
  });
}

export function allocateCashPlan(totalCents: number, weights: number[]) {
  cents(totalCents);
  weights.forEach((weight) => integer(weight, 0, 1_000_000_000, "Plan weight"));
  const totalWeight = weights.reduce((total, weight) => total + BigInt(weight), 0n);
  if (totalWeight === 0n) throw new Error("At least one plan weight must be positive.");
  const portions = weights.map((weight, index) => ({
    index,
    cents: Number((BigInt(totalCents) * BigInt(weight)) / totalWeight),
    remainder: (BigInt(totalCents) * BigInt(weight)) % totalWeight,
  }));
  const remainder = totalCents - sum(portions.map((portion) => portion.cents));
  const order = portions.toSorted((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  );
  for (let index = 0; index < remainder; index++) order[index].cents++;
  return portions.map((portion) => portion.cents);
}

export function initialProjectBudget(): ProjectBudget {
  return {
    name: "Customer portal launch",
    budgetCents: 6_000_000,
    spentCents: 3_800_000,
    committedCents: 2_900_000,
    contingencyCents: 1_000_000,
    decision: "A delivery commitment exceeds the working budget.",
  };
}

export function decideBudget(
  project: ProjectBudget,
  decision: "contingency" | "reforecast" | "vendor-hold",
  remainingCents?: number,
): ProjectBudget {
  [
    project.budgetCents,
    project.spentCents,
    project.committedCents,
    project.contingencyCents,
  ].forEach((value) => cents(value));
  const overrun = Math.max(0, project.spentCents + project.committedCents - project.budgetCents);
  if (decision === "contingency") {
    if (overrun === 0) throw new Error("There is no overrun to cover.");
    if (overrun > project.contingencyCents)
      throw new Error("The contingency does not cover the overrun.");
    return {
      ...project,
      budgetCents: project.budgetCents + overrun,
      contingencyCents: project.contingencyCents - overrun,
      decision: "Covered from the existing contingency.",
    };
  }
  if (decision === "reforecast") {
    if (remainingCents === undefined) throw new Error("Enter the remaining commitment.");
    cents(remainingCents, "Remaining commitment");
    return {
      ...project,
      committedCents: remainingCents,
      decision: "Updated the remaining delivery forecast.",
    };
  }
  if (project.spentCents > project.budgetCents)
    throw new Error("Spent costs already exceed plan; use a revised forecast.");
  return {
    ...project,
    committedCents: project.budgetCents - project.spentCents,
    decision: "Capped the remaining vendor commitment at plan.",
  };
}

export function initialAcquisition(): AcquisitionInputs {
  return {
    priceCents: 45_000_000,
    downPaymentBps: 3000,
    annualRateBps: 625,
    termYears: 15,
    horizonYears: 10,
    annualIncomeCents: 5_200_000,
    appreciationBps: 200,
    saleCostBps: 400,
  };
}

export function acquisitionModel(input: AcquisitionInputs) {
  if (cents(input.priceCents, "Purchase price") === 0)
    throw new Error("Purchase price must be positive.");
  cents(input.annualIncomeCents, "Annual operating income");
  integer(input.downPaymentBps, 1, 10000, "Down payment basis points");
  integer(input.annualRateBps, 0, 3500, "Annual rate basis points");
  integer(input.termYears, 1, 30, "Loan term years");
  integer(input.horizonYears, 5, 20, "Holding period years");
  integer(input.appreciationBps, -5000, 5000, "Appreciation basis points");
  integer(input.saleCostBps, 0, 10000, "Selling cost basis points");
  const downPaymentCents = ratio(input.priceCents, input.downPaymentBps, 10000);
  if (downPaymentCents === 0) throw new Error("Down payment must be at least one cent.");
  const principalCents = input.priceCents - downPaymentCents;
  const monthlyRate = input.annualRateBps / 120000;
  const months = input.termYears * 12;
  const monthlyPaymentCents =
    principalCents === 0
      ? 0
      : Math.round(
          monthlyRate === 0
            ? principalCents / months
            : (principalCents * monthlyRate) / (1 - (1 + monthlyRate) ** -months),
        );
  let outstandingCents = principalCents;
  let debtServiceCents = 0;
  for (let index = 0; index < input.horizonYears * 12 && outstandingCents > 0; index++) {
    const interest = ratio(outstandingCents, input.annualRateBps, 120000);
    const due = outstandingCents + interest;
    const payment = index === months - 1 ? due : Math.min(monthlyPaymentCents, due);
    debtServiceCents = sum([debtServiceCents, payment]);
    outstandingCents = due - payment;
  }
  const salePriceCents = cents(
    Math.round(input.priceCents * (1 + input.appreciationBps / 10000) ** input.horizonYears),
    "Projected sale price",
  );
  const saleCostCents = ratio(salePriceCents, input.saleCostBps, 10000);
  const operatingIncomeCents = cents(
    input.annualIncomeCents * input.horizonYears,
    "Total operating income",
  );
  const netGainCents = sum([
    operatingIncomeCents,
    -debtServiceCents,
    salePriceCents,
    -saleCostCents,
    -outstandingCents,
    -downPaymentCents,
  ]);
  return {
    downPaymentCents,
    principalCents,
    monthlyPaymentCents,
    annualDebtServiceCents: monthlyPaymentCents * 12,
    debtServiceCents,
    outstandingCents,
    salePriceCents,
    saleCostCents,
    operatingIncomeCents,
    netGainCents,
    totalRoiBps: Math.round((netGainCents / downPaymentCents) * 10000),
  };
}

export function evaluateRules(rules: ControlRule[], action: ControlAction) {
  cents(action.amountCents);
  const trace: { ruleId: string; name: string; matched: boolean; reason: string }[] = [];
  for (const rule of rules) {
    cents(rule.aboveCents, "Rule threshold");
    const matched =
      rule.enabled &&
      (rule.kind === "any" || rule.kind === action.kind) &&
      action.amountCents > rule.aboveCents;
    trace.push({
      ruleId: rule.id,
      name: rule.name,
      matched,
      reason: !rule.enabled
        ? "Rule disabled"
        : rule.kind !== "any" && rule.kind !== action.kind
          ? "Action does not match"
          : action.amountCents <= rule.aboveCents
            ? "Amount is at or below the threshold"
            : `Matched: ${rule.verdict}`,
    });
    if (matched) return { verdict: rule.verdict, ruleId: rule.id, trace };
  }
  return { verdict: "allow" as const, ruleId: undefined, trace };
}

export function submitJournal(book: MarginBook, draft: JournalDraft): MarginBook {
  editable(book, draft.date);
  if (draft.date > book.asOf) throw new Error("Posting date cannot be after the book date.");
  if (!draft.memo.trim()) throw new Error("Add a journal description.");
  if (draft.lines.length < 2) throw new Error("A journal needs at least two lines.");
  for (const line of draft.lines) {
    if (!accounts.includes(line.account)) throw new Error("Choose a known account.");
    cents(line.debitCents, "Debit");
    cents(line.creditCents, "Credit");
    if (line.debitCents > 0 === line.creditCents > 0)
      throw new Error("Each line must contain either a debit or a credit.");
  }
  const total = sum(draft.lines.map((line) => line.debitCents));
  if (total !== sum(draft.lines.map((line) => line.creditCents)))
    throw new Error("Debits and credits must balance exactly.");
  const decision = evaluateRules(book.rules, { kind: "manual-journal", amountCents: total });
  const status =
    decision.verdict === "allow" ? "posted" : decision.verdict === "review" ? "review" : "blocked";
  const id = `J-${Math.max(1000, ...book.journals.map((journal) => Number(journal.id.slice(2)) || 0)) + 1}`;
  return {
    ...book,
    journals: [
      ...book.journals,
      {
        ...draft,
        lines: draft.lines.map((line) => ({ ...line })),
        memo: draft.memo.trim(),
        id,
        status,
        ruleId: decision.ruleId,
      },
    ],
  };
}

export function approveJournal(book: MarginBook, id: string): MarginBook {
  const journal = book.journals.find((item) => item.id === id);
  if (!journal || journal.status !== "review") throw new Error("Select a journal awaiting review.");
  editable(book, journal.date);
  return {
    ...book,
    journals: book.journals.map((item) => (item.id === id ? { ...item, status: "posted" } : item)),
  };
}

export function lockPeriod(book: MarginBook, period: string): MarginBook {
  month(period);
  if (period >= book.asOf.slice(0, 7)) throw new Error("Only a completed month can be locked.");
  if (book.lockedThrough && period <= book.lockedThrough)
    throw new Error("This period is already locked.");
  if (
    book.journals.some(
      (journal) => journal.status === "review" && journal.date.slice(0, 7) <= period,
    )
  )
    throw new Error("Resolve pending journals before locking the period.");
  return { ...book, lockedThrough: period };
}

export function financeCsv(headers: string[], rows: (string | number | null)[][]) {
  const quote = (value: string | number | null) => {
    const text = value === null ? "" : String(value);
    const safe = /^[\s]*[=+@-]/.test(text) && typeof value === "string" ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [headers, ...rows].map((row) => row.map(quote).join(",")).join("\r\n");
}
