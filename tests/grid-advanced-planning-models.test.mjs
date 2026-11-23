import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parsePlanningMoney,
  matchesPlanningFilter,
} from "../src/blocks/data/grid-advanced-planning-common.ts";
import {
  initialFamilyBudget,
  initialFamilyBalances,
  setFamilyBudgetCell,
  familyLineForecast,
  familyBudgetCsv,
  familySectionTotals,
  familyCashFlow,
  familyNetWorth,
  setFamilyBalance,
  saveFamilyBudgetLine,
} from "../src/blocks/data/grid-advanced-family-budget-model.ts";
import {
  initialInventoryPlanning,
  inventoryStockSeries,
  setInventoryPlanningCell,
  inventoryReorderPlan,
  createInventoryDrafts,
  inventoryOrderTotal,
  inventoryCommittedSpend,
  transitionInventoryOrder,
  validateInventoryProduct,
} from "../src/blocks/data/grid-advanced-inventory-manager-model.ts";
import {
  initialVendorSla,
  allocateSlaCredits,
  slaProratedCredit,
  slaMonthReview,
  setSlaActual,
  draftSlaClaim,
  transitionSlaClaim,
  refreshSlaClaim,
  issueSlaCureNotice,
  resolveSlaCureNotice,
} from "../src/blocks/data/grid-advanced-vendor-sla-model.ts";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const entry of Object.values(value)) deepFreeze(entry);
  }
  return value;
}
const family = deepFreeze(structuredClone(initialFamilyBudget));
const balances = deepFreeze(structuredClone(initialFamilyBalances));
const inventory = deepFreeze(structuredClone(initialInventoryPlanning));
const sla = deepFreeze(structuredClone(initialVendorSla));

function value(result) {
  assert.equal(result.ok, true, result.error);
  return result.value;
}

test("money parsing preserves cents and rejects invalid or fractional-cent inputs", () => {
  assert.equal(value(parsePlanningMoney("$1,250.49")), 125049);
  assert.equal(value(parsePlanningMoney("0.00")), 0);
  for (const input of ["", "-1", "Infinity", "1.005", "words", "1,,2", "12,34"])
    assert.equal(parsePlanningMoney(input).ok, false);
});

test("family actual zero is reported zero; missing actual uses plan only in forecast", () => {
  const zero = value(setFamilyBudgetCell(family, family[0].id, 10, "actual", 0));
  assert.equal(zero[0].actual[10], 0);
  assert.equal(familyLineForecast(zero[0]), familyLineForecast(family[0]) - family[0].actual[10]);
  const missing = value(setFamilyBudgetCell(zero, family[0].id, 10, "actual", null));
  assert.equal(familyLineForecast(missing[0]), familyLineForecast(zero[0]) + family[0].planned[10]);
  assert.equal(familySectionTotals(missing, 10)[0].unreported, 1);
  assert.notEqual(zero, family);
  assert.equal(zero[1], family[1]);
  assert.equal(family[0].actual[10], 530000);
});

test("family plans reject negatives and duplicate section labels; totals and net worth reconcile", () => {
  assert.equal(setFamilyBudgetCell(family, family[0].id, 10, "planned", null).ok, false);
  assert.equal(setFamilyBudgetCell(family, family[0].id, 12, "actual", 1).ok, false);
  assert.equal(setFamilyBudgetCell(family, family[0].id, 10, "actual", -1).ok, false);
  assert.equal(saveFamilyBudgetLine(family, { ...family[0], id: "duplicate" }).ok, false);
  const totals = familySectionTotals(family, 10);
  const net = totals[0].actual - totals.slice(1).reduce((sum, section) => sum + section.actual, 0);
  assert.equal(familyCashFlow(family)[10].actualNet, net);
  const worth = familyNetWorth(balances);
  assert.equal(worth.netWorth, worth.assets - worth.liabilities);
  const paid = value(setFamilyBalance(balances, "card-balance", 0));
  assert.equal(familyNetWorth(paid).netWorth, worth.netWorth + 215000);
  assert.equal(setFamilyBalance(balances, "missing", 0).ok, false);
});

test("inventory count zero closes stock at zero and carries into later months", () => {
  assert.ok(inventory.products.every((product) => !validateInventoryProduct(product)));
  const products = value(
    setInventoryPlanningCell(inventory.products, inventory.products[0].id, 10, "counts", 0),
  );
  const series = inventoryStockSeries(products[0]);
  assert.equal(series[10].closing, 0);
  assert.equal(series[11].opening, 0);
  assert.equal(series[10].adjustment, -series[10].expected);
  assert.equal(inventory.products[0].counts[10], null);
  assert.equal(
    setInventoryPlanningCell(inventory.products, inventory.products[0].id, 10, "sales", 999999).ok,
    false,
  );
  assert.equal(
    setInventoryPlanningCell(inventory.products, inventory.products[0].id, 10, "receipts", 1.5).ok,
    false,
  );
});

test("reorder drafts reserve exact budget, avoid double orders, and receipt is applied once", () => {
  const line = inventoryReorderPlan(inventory.products, [], 10, 30)[0];
  assert.ok(line.quantity > 0);
  const input = {
    idPrefix: "po-original",
    month: 10,
    coverageDays: 30,
    budget: line.cost,
    selected: [line.product.id],
  };
  assert.equal(createInventoryDrafts(inventory, { ...input, budget: line.cost - 1 }).ok, false);
  const drafted = value(createInventoryDrafts(inventory, input));
  assert.equal(drafted.orders.length, 1);
  assert.equal(inventoryOrderTotal(drafted.orders[0]), line.cost);
  assert.equal(inventoryCommittedSpend(drafted.orders, 10), line.cost);
  assert.equal(createInventoryDrafts(drafted, { ...input, idPrefix: "second" }).ok, false);
  const oldMonth = inventoryReorderPlan(inventory.products, drafted.orders, 0, 30)[0];
  assert.equal(oldMonth.incoming, 0, "November drafts cannot supply January stock");
  const sent = value(transitionInventoryOrder(drafted, drafted.orders[0].id, "sent"));
  const received = value(transitionInventoryOrder(sent, drafted.orders[0].id, "received"));
  assert.equal(
    inventoryStockSeries(received.products[0])[10].closing,
    line.closing + line.quantity,
  );
  assert.equal(
    inventoryCommittedSpend(received.orders, 10),
    line.cost,
    "received purchases remain spent budget",
  );
  assert.equal(transitionInventoryOrder(received, drafted.orders[0].id, "received").ok, false);
  assert.equal(transitionInventoryOrder(received, drafted.orders[0].id, "cancelled").ok, false);
  assert.equal(inventory.orders.length, 0);
});

test("cancelling an unreceived order frees its budget and incoming units", () => {
  const line = inventoryReorderPlan(inventory.products, [], 10, 30)[0];
  const drafted = value(
    createInventoryDrafts(inventory, {
      idPrefix: "cancel",
      month: 10,
      coverageDays: 30,
      budget: line.cost,
      selected: [line.product.id],
    }),
  );
  const cancelled = value(transitionInventoryOrder(drafted, drafted.orders[0].id, "cancelled"));
  assert.equal(inventoryCommittedSpend(cancelled.orders, 10), 0);
  assert.equal(
    inventoryReorderPlan(cancelled.products, cancelled.orders, 10, 30)[0].quantity,
    line.quantity,
  );
});

test("service credits use active-day pro rata and exact shared-cap cent allocation", () => {
  assert.equal(slaProratedCredit(100000, 1000, 14, 28), 5000);
  assert.equal(slaProratedCredit(100000, 1000, 0, 28), 0);
  assert.throws(() => slaProratedCredit(100000, 1000, 29, 28), RangeError);
  assert.deepEqual(
    allocateSlaCredits(
      [
        { id: "c", requested: 1 },
        { id: "a", requested: 1 },
        { id: "b", requested: 1 },
      ],
      2,
    ),
    [
      { id: "c", requested: 1, credit: 0 },
      { id: "a", requested: 1, credit: 1 },
      { id: "b", requested: 1, credit: 1 },
    ],
  );
  const review = slaMonthReview(sla, 10)[0];
  assert.ok(review.uncapped > review.cap);
  assert.equal(review.credit, review.cap);
  assert.equal(
    review.metrics.reduce((sum, metric) => sum + metric.credit, 0),
    review.cap,
  );
  assert.ok(
    slaMonthReview(sla, 11).every(
      (site) => site.credit === 0 && site.metrics.every((metric) => metric.gap === null),
    ),
  );
});

test("claim lifecycle rejects duplicates, skipped approval and over-approval", () => {
  const claims = value(
    draftSlaClaim(sla, {
      id: "claim-one",
      contractId: "north",
      month: 10,
      note: "November credit review",
    }),
  );
  const drafted = { ...sla, claims };
  assert.equal(
    draftSlaClaim(drafted, { id: "claim-two", contractId: "north", month: 10, note: "Duplicate" })
      .ok,
    false,
  );
  assert.equal(
    transitionSlaClaim({ ...sla, claims }, "claim-one", "approved", claims[0].requested).ok,
    false,
  );
  const submitted = value(transitionSlaClaim({ ...sla, claims }, "claim-one", "submitted"));
  assert.equal(
    transitionSlaClaim(
      { ...sla, claims: submitted },
      "claim-one",
      "approved",
      claims[0].requested + 1,
    ).ok,
    false,
  );
  const approved = value(
    transitionSlaClaim({ ...sla, claims: submitted }, "claim-one", "approved", 0),
  );
  assert.equal(approved[0].approved, 0, "zero approved credit is a real value");
  assert.equal(sla.claims.length, 0);
});

test("cure notices require reported breaches and resolve only after recovery", () => {
  const metric = slaMonthReview(sla, 10)[0].metrics.find((row) => row.breached).metric;
  const notices = value(
    issueSlaCureNotice(sla, {
      id: "notice-one",
      metricId: metric.id,
      month: 10,
      dueDate: "2026-12-07",
      note: "Restore the dispatch checks.",
    }),
  );
  const open = { ...sla, notices };
  assert.equal(resolveSlaCureNotice(open, "notice-one").ok, false);
  assert.equal(
    issueSlaCureNotice(open, {
      id: "notice-two",
      metricId: metric.id,
      month: 10,
      dueDate: "2026-12-07",
      note: "Duplicate",
    }).ok,
    false,
  );
  assert.equal(
    issueSlaCureNotice(sla, {
      id: "bad-date",
      metricId: metric.id,
      month: 10,
      dueDate: "2026-02-30",
      note: "Invalid date",
    }).ok,
    false,
  );
  const recovered = {
    ...open,
    metrics: value(setSlaActual(sla.metrics, metric.id, 10, metric.targetBps)),
  };
  assert.equal(value(resolveSlaCureNotice(recovered, "notice-one"))[0].status, "resolved");
  assert.equal(setSlaActual(sla.metrics, metric.id, 10, Number.NaN).ok, false);
});

test("a changed draft must be refreshed while submitted claim evidence remains a snapshot", () => {
  const claims = value(
    draftSlaClaim(sla, {
      id: "stale-claim",
      contractId: "north",
      month: 10,
      note: "Review source measures",
    }),
  );
  const metric = slaMonthReview(sla, 10)[0].metrics.find((row) => row.breached).metric;
  const changed = {
    ...sla,
    claims,
    metrics: value(setSlaActual(sla.metrics, metric.id, 10, metric.targetBps)),
  };
  assert.equal(transitionSlaClaim(changed, "stale-claim", "submitted").ok, false);
  const refreshed = value(refreshSlaClaim(changed, "stale-claim"));
  assert.ok(refreshed[0].requested < claims[0].requested);
  const submitted = value(
    transitionSlaClaim({ ...changed, claims: refreshed }, "stale-claim", "submitted"),
  );
  assert.equal(
    value(
      transitionSlaClaim(
        { ...changed, claims: submitted },
        "stale-claim",
        "approved",
        submitted[0].requested,
      ),
    )[0].requested,
    submitted[0].requested,
  );
  assert.notDeepEqual(refreshed[0].measurements, claims[0].measurements);
});

test("budget CSV follows month, year and balance views with all year columns", () => {
  const monthly = familyBudgetCsv("month", 10, family, balances);
  const yearly = familyBudgetCsv("year", 10, family, balances);
  const worth = familyBudgetCsv("worth", 10, family, balances);
  assert.match(monthly, /"Month","PlanUSD","ActualUSD"/);
  assert.ok(yearly.includes('"Jan"') && yearly.includes('"Dec"'));
  assert.ok(worth.includes('"Account","Type","BalanceUSD"'));
  assert.ok(!worth.includes('"PlanUSD"'));
});

test("filter groups preserve zero and ignore incomplete rules without treating null as a number", () => {
  const record = { section: "income", actual: 0, planned: 1200 };
  assert.equal(
    matchesPlanningFilter(record, { type: "rule", path: ["actual"], operator: "empty" }),
    false,
  );
  assert.equal(
    matchesPlanningFilter(record, { type: "rule", path: ["actual"], operator: "eq", value: 0 }),
    true,
  );
  assert.equal(
    matchesPlanningFilter(
      { ...record, actual: null },
      { type: "rule", path: ["actual"], operator: "not_between", value: [1, 2] },
    ),
    false,
  );
  assert.equal(
    matchesPlanningFilter(record, {
      type: "rule",
      path: ["section"],
      operator: "is_any_of",
      value: [],
    }),
    true,
  );
  assert.equal(
    matchesPlanningFilter(record, {
      type: "group",
      combinator: "and",
      rules: [
        { type: "rule", path: ["section"], operator: "is", value: "income" },
        {
          type: "group",
          combinator: "or",
          rules: [
            { type: "rule", path: ["planned"], operator: "gt", value: 2000 },
            { type: "rule", path: ["actual"], operator: "eq", value: 0 },
          ],
        },
      ],
    }),
    true,
  );
});
