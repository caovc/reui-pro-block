import assert from "node:assert/strict";
import test from "node:test";
import {
  acquisitionModel,
  allocateCashPlan,
  applyInvoiceAction,
  approveJournal,
  bookSeries,
  buildLedger,
  createInvoice,
  createMarginBook,
  decideBudget,
  evaluateRules,
  financeCsv,
  forecastMonths,
  initialAcquisition,
  initialProjectBudget,
  invoiceBalance,
  invoiceLane,
  lockPeriod,
  monthSummary,
  submitJournal,
} from "../src/templates/workflow/margin-model.ts";

const total = (values) => values.reduce((sum, value) => sum + value, 0);
const journal = (amount, postedOn = "2026-11-20") => ({
  date: postedOn,
  memo: "Original test adjustment",
  lines: [
    { account: "cash", debitCents: amount, creditCents: 0 },
    { account: "equity", debitCents: 0, creditCents: amount },
  ],
});

test("original books tie invoices, income, receivables, cash and double-entry ledger", () => {
  const book = createMarginBook();
  const ledger = buildLedger(book);
  assert.equal(
    total(ledger.map((entry) => entry.debitCents)),
    total(ledger.map((entry) => entry.creditCents)),
  );
  const november = monthSummary(book, "2026-11");
  assert.equal(november.netRevenueCents, 9_550_000);
  assert.equal(november.directCostCents, 2_674_000);
  assert.equal(november.grossMarginBps, 7200);
  assert.equal(november.operatingCents, 3_800_000);
  assert.equal(november.operatingProfitCents, 3_076_000);
  assert.equal(november.receivablesCents, total(book.invoices.map(invoiceBalance)));
  assert.equal(
    november.closingCashCents,
    november.openingCashCents + november.cashInCents - november.cashOutCents,
  );
  const series = bookSeries(book);
  for (let index = 1; index < series.length; index++)
    assert.equal(series[index].openingCashCents, series[index - 1].closingCashCents);
  const separate = createMarginBook();
  book.invoices[0].customer = "Changed private fixture";
  assert.notEqual(separate.invoices[0].customer, book.invoices[0].customer);
});

test("payments and credit notes produce consistent immutable ledger changes", () => {
  const before = createMarginBook();
  const id = "BL-2010";
  const source = monthSummary(before, "2026-11");
  const paid = applyInvoiceAction(before, id, {
    kind: "payment",
    date: before.asOf,
    note: "Second instalment",
    amountCents: 100_001,
  });
  const after = monthSummary(paid, "2026-11");
  assert.equal(after.closingCashCents, source.closingCashCents + 100_001);
  assert.equal(after.receivablesCents, source.receivablesCents - 100_001);
  assert.equal(after.netRevenueCents, source.netRevenueCents);
  assert.equal(invoiceBalance(before.invoices.find((invoice) => invoice.id === id)), 1_680_000);
  const credited = applyInvoiceAction(paid, id, {
    kind: "credit",
    date: before.asOf,
    note: "Service credit",
    amountCents: 20_001,
  });
  const creditSummary = monthSummary(credited, "2026-11");
  assert.equal(creditSummary.netRevenueCents, after.netRevenueCents - 20_001);
  assert.equal(creditSummary.receivablesCents, after.receivablesCents - 20_001);
  assert.equal(creditSummary.closingCashCents, after.closingCashCents);
  assert.throws(
    () =>
      applyInvoiceAction(before, id, {
        kind: "payment",
        date: before.asOf,
        note: "Overpayment",
        amountCents: 1_680_001,
      }),
    /outstanding/,
  );
  assert.throws(
    () =>
      applyInvoiceAction(before, id, {
        kind: "payment",
        date: "2026-11-21",
        note: "Future",
        amountCents: 1,
      }),
    /book date/,
  );
});

test("invoice validation rejects invalid dates and new records flow through all summaries", () => {
  const book = createMarginBook();
  const draft = {
    customer: "Cedar Assembly",
    plan: "Studio",
    issuedOn: book.asOf,
    dueOn: "2026-12-10",
    netCents: 99_999,
    costCents: 10_001,
  };
  const next = createInvoice(book, draft);
  assert.equal(next.invoices.at(-1).id, "BL-2013");
  assert.equal(monthSummary(next, "2026-11").netRevenueCents, 9_649_999);
  assert.equal(invoiceBalance(next.invoices.at(-1)), 99_999);
  assert.equal(invoiceLane(next.invoices.at(-1), book.asOf), "next-30-days");
  assert.throws(() => createInvoice(book, { ...draft, issuedOn: "2026-02-30" }), /calendar date/);
  assert.throws(() => createInvoice(book, { ...draft, issuedOn: "2026-09-20" }), /locked/);
  assert.throws(() => createInvoice(book, { ...draft, dueOn: "2026-11-19" }), /Due date/);
  assert.throws(() => createInvoice(book, { ...draft, netCents: 0.1 }), /valid amount/);
  const promised = applyInvoiceAction(book, "BL-2010", {
    kind: "promise",
    date: book.asOf,
    promisedOn: "2026-11-24",
    note: "Customer confirmed a payment day",
  });
  assert.equal(
    invoiceLane(promised.invoices.find((invoice) => invoice.id === "BL-2010")),
    "waiting",
  );
});

test("cash allocation preserves every cent with deterministic largest remainders", () => {
  assert.deepEqual(allocateCashPlan(100, [1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(allocateCashPlan(1, [0, 4, 4]), [0, 1, 0]);
  for (const amount of [0, 1, 17, 10_001, 100_000_000_000]) {
    const result = allocateCashPlan(amount, [7, 11, 3, 0]);
    assert.equal(total(result), amount);
    assert.ok(result.every(Number.isSafeInteger));
    assert.equal(result[3], 0);
  }
  assert.throws(() => allocateCashPlan(100, [0, 0]), /positive/);
});

test("collection notes preserve unresolved disputes and write-offs obey controls", () => {
  const book = createMarginBook();
  const reminded = applyInvoiceAction(book, "BL-2011", {
    kind: "reminder",
    date: book.asOf,
    note: "Asked for the purchase order",
  });
  assert.equal(
    invoiceLane(reminded.invoices.find((invoice) => invoice.id === "BL-2011")),
    "needs-you",
  );
  const resolved = applyInvoiceAction(reminded, "BL-2011", {
    kind: "resolve-dispute",
    date: book.asOf,
    note: "Purchase order confirmed",
  });
  assert.equal(
    invoiceLane(resolved.invoices.find((invoice) => invoice.id === "BL-2011")),
    "next-30-days",
  );
  assert.throws(
    () =>
      applyInvoiceAction(book, "BL-2010", {
        kind: "writeoff",
        date: book.asOf,
        note: "Review required",
        amountCents: 100_001,
      }),
    /finance review/,
  );
  const written = applyInvoiceAction(book, "BL-2010", {
    kind: "writeoff",
    date: book.asOf,
    note: "Small agreed loss",
    amountCents: 100_000,
  });
  assert.equal(
    monthSummary(written, "2026-11").receivablesCents,
    monthSummary(book, "2026-11").receivablesCents - 100_000,
  );
  assert.equal(
    monthSummary(written, "2026-11").operatingCents,
    monthSummary(book, "2026-11").operatingCents + 100_000,
  );
});

test("forecasts roll calendar years, compound cents and handle full revenue loss", () => {
  const input = {
    startMonth: "2026-12",
    months: 3,
    revenueCents: 100_001,
    growthBps: 500,
    costRateBps: 2800,
    operatingCents: 20_000,
  };
  const result = forecastMonths(input);
  assert.deepEqual(
    result.map((row) => row.month),
    ["2026-12", "2027-01", "2027-02"],
  );
  assert.deepEqual(
    result.map((row) => row.revenueCents),
    [100_001, 105_001, 110_251],
  );
  assert.equal(result[0].profitCents, 52_001);
  assert.equal(forecastMonths({ ...input, growthBps: -10000 })[1].revenueCents, 0);
  assert.equal(
    forecastMonths({ ...input, months: 1, revenueCents: 100_000_000_000, growthBps: 10000 })[0]
      .revenueCents,
    100_000_000_000,
  );
  assert.throws(() => forecastMonths({ ...input, growthBps: 10001 }), /Growth/);
});

test("budget decisions preserve total authority and distinguish reforecast from vendor cap", () => {
  const initial = initialProjectBudget();
  const covered = decideBudget(initial, "contingency");
  assert.equal(
    covered.budgetCents + covered.contingencyCents,
    initial.budgetCents + initial.contingencyCents,
  );
  assert.equal(covered.budgetCents, initial.spentCents + initial.committedCents);
  assert.equal(covered.contingencyCents, 300_000);
  assert.equal(decideBudget(initial, "vendor-hold").committedCents, 2_200_000);
  assert.equal(decideBudget(initial, "reforecast", 3_500_000).committedCents, 3_500_000);
  assert.throws(
    () => decideBudget({ ...initial, contingencyCents: 0 }, "contingency"),
    /does not cover/,
  );
});

test("acquisition handles zero-rate and cash purchases with explicit exit equity", () => {
  const original = initialAcquisition();
  const noInterest = acquisitionModel({
    ...original,
    priceCents: 12_000_000,
    downPaymentBps: 5000,
    annualRateBps: 0,
    termYears: 5,
    horizonYears: 5,
    appreciationBps: 0,
    saleCostBps: 0,
  });
  assert.equal(noInterest.monthlyPaymentCents, 100_000);
  assert.equal(noInterest.debtServiceCents, 6_000_000);
  assert.equal(noInterest.outstandingCents, 0);
  const cash = acquisitionModel({ ...original, downPaymentBps: 10000 });
  assert.equal(cash.principalCents, 0);
  assert.equal(cash.monthlyPaymentCents, 0);
  assert.equal(
    cash.netGainCents,
    cash.operatingIncomeCents + cash.salePriceCents - cash.saleCostCents - cash.downPaymentCents,
  );
  const leveraged = acquisitionModel(original);
  assert.ok(leveraged.monthlyPaymentCents > 0 && leveraged.outstandingCents > 0);
  assert.equal(
    leveraged.netGainCents,
    leveraged.operatingIncomeCents -
      leveraged.debtServiceCents +
      leveraged.salePriceCents -
      leveraged.saleCostCents -
      leveraged.outstandingCents -
      leveraged.downPaymentCents,
  );
  assert.throws(() => acquisitionModel({ ...original, horizonYears: 4 }), /Holding period/);
});

test("rules trace strict thresholds, disabled policies and first matching verdict", () => {
  const book = createMarginBook();
  assert.equal(
    evaluateRules(book.rules, { kind: "manual-journal", amountCents: 2_000_000 }).verdict,
    "allow",
  );
  const review = evaluateRules(book.rules, { kind: "manual-journal", amountCents: 2_000_001 });
  assert.equal(review.verdict, "review");
  assert.equal(review.trace[0].matched, false);
  assert.equal(review.trace[1].matched, true);
  assert.equal(
    evaluateRules(
      book.rules.map((rule) => ({ ...rule, enabled: false })),
      { kind: "manual-journal", amountCents: 3_000_000 },
    ).verdict,
    "allow",
  );
  const block = {
    id: "first",
    name: "Block demo journal",
    enabled: true,
    kind: "any",
    aboveCents: 0,
    verdict: "block",
  };
  assert.equal(
    evaluateRules([block, ...book.rules], { kind: "manual-journal", amountCents: 3_000_000 }).trace
      .length,
    1,
  );
});

test("journals balance, await review and affect books only after actual approval", () => {
  const book = createMarginBook();
  const awaiting = submitJournal(book, journal(2_000_001));
  assert.equal(awaiting.journals[0].status, "review");
  assert.deepEqual(buildLedger(awaiting), buildLedger(book));
  const approved = approveJournal(awaiting, awaiting.journals[0].id);
  assert.equal(
    monthSummary(approved, "2026-11").closingCashCents,
    monthSummary(book, "2026-11").closingCashCents + 2_000_001,
  );
  assert.throws(
    () =>
      submitJournal(book, {
        ...journal(100),
        lines: [
          { account: "cash", debitCents: 100, creditCents: 0 },
          { account: "equity", debitCents: 0, creditCents: 99 },
        ],
      }),
    /balance exactly/,
  );
  assert.throws(() => submitJournal(book, journal(100, "2026-09-20")), /locked/);
  assert.throws(() => submitJournal(book, journal(100, "2026-11-21")), /book date/);
});

test("period locks reject unresolved review and prevent later backdated posting", () => {
  const book = createMarginBook();
  const awaiting = submitJournal(book, journal(2_000_001, "2026-10-20"));
  assert.throws(() => lockPeriod(awaiting, "2026-10"), /pending journals/);
  const locked = lockPeriod(book, "2026-10");
  assert.equal(locked.lockedThrough, "2026-10");
  assert.throws(() => submitJournal(locked, journal(100, "2026-10-30")), /locked/);
  assert.throws(() => lockPeriod(book, "2026-11"), /completed month/);
});

test("CSV preserves exact data, quoted multiline text and neutralizes string formulas", () => {
  const csv = financeCsv(
    ["Name", "Amount"],
    [
      ['A, B\n"quoted"', 1.25],
      ["=SUM(A1:A2)", -10],
      [null, 0],
    ],
  );
  assert.ok(csv.includes('"A, B\n""quoted""",1.25'.replace(",1.25", ',"1.25"')));
  assert.ok(csv.includes('"\'=SUM(A1:A2)","-10"'));
  assert.ok(csv.endsWith('"","0"'));
});
