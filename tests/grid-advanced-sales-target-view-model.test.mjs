import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSalesTargetStores,
  salesTargetMetrics,
} from "../src/blocks/data/grid-advanced-sales-target-model.ts";
import {
  createSalesTargetRows,
  emptySalesTargetStore,
  matchesSalesTargetQuery,
  salesPeriodLabel,
  salesTargetCsv,
  salesTargetSeries,
} from "../src/blocks/data/grid-advanced-sales-target-view-model.ts";

const condition = (path, operator, value, negated) => ({
  id: "rule",
  type: "rule",
  path: [path],
  operator,
  value,
  negated,
});
const group = (combinator, rules) => ({ id: "root", type: "group", combinator, rules });

test("native tree projection contains a separately pinned total and additive region branches", () => {
  const stores = createSalesTargetStores();
  const rows = createSalesTargetRows(stores, "2026-11");
  assert.equal(rows[0].id, "sales-grand-total");
  assert.equal(rows[0].children, undefined);
  assert.equal(rows[0].stores.length, 12);
  assert.equal(rows.length, 5);
  assert.equal(rows.slice(1).flatMap((row) => row.children).length, 12);
  for (const period of ["month", "last3", "ytd"]) {
    assert.deepEqual(rows[0].metrics[period], salesTargetMetrics(stores, "2026-11", period));
    assert.equal(
      rows.slice(1).reduce((sum, row) => sum + row.metrics[period].actualCents, 0),
      rows[0].metrics[period].actualCents,
    );
  }
  const narrow = createSalesTargetRows([stores[11]], "2026-11");
  assert.equal(narrow.length, 2);
  assert.equal(narrow[1].label, "West");
  assert.equal(narrow[0].metrics.month.attainment, null);
  assert.equal(createSalesTargetRows([], "2026-11")[0].metrics.month.attainment, null);
});

test("native Filters honors nested OR, AND, negative and unfinished conditions", () => {
  const [north, , , south] = createSalesTargetStores();
  const query = group("and", [
    group("or", [condition("region", "is", "North"), condition("region", "is", "South")]),
    condition("format", "is_none_of", ["Outlet"]),
    condition("pace", "", undefined),
  ]);
  assert.equal(matchesSalesTargetQuery(north, "2026-11", query), true);
  assert.equal(matchesSalesTargetQuery(south, "2026-11", query), true);
  assert.equal(
    matchesSalesTargetQuery(north, "2026-11", condition("region", "is", "North", true)),
    false,
  );
  assert.equal(
    matchesSalesTargetQuery(north, "2026-11", condition("region", "is_not", "North")),
    false,
  );
  assert.equal(
    matchesSalesTargetQuery(north, "2026-11", condition("region", "is_any_of", ["North", "West"])),
    true,
  );
  assert.equal(
    matchesSalesTargetQuery(north, "2026-11", condition("unsupported", "is", "North")),
    undefined,
  );
  assert.equal(
    matchesSalesTargetQuery(north, "2026-11", condition("region", "is_any_of", [])),
    undefined,
  );
});

test("no-target pace is based on the selected month and target changes preserve weighted totals", () => {
  const stores = createSalesTargetStores();
  const zero = stores[11];
  const rule = condition("pace", "is", "No target");
  assert.equal(matchesSalesTargetQuery(zero, "2026-11", rule), true);
  assert.equal(matchesSalesTargetQuery(zero, "2026-10", rule), false);
  assert.equal(
    matchesSalesTargetQuery(zero, "2026-11", condition("pace", "is_not", "No target")),
    false,
  );
});

test("year strips and period captions align with the selected month across years", () => {
  const stores = createSalesTargetStores();
  const series = salesTargetSeries(stores, 2026);
  assert.equal(series.length, 12);
  assert.equal(series[10].month, "2026-11");
  assert.equal(series[10].actual * 100, salesTargetMetrics(stores, "2026-11", "month").actualCents);
  assert.equal(salesTargetSeries(stores, 2025).length, 6);
  assert.equal(salesPeriodLabel("2026-01", "last3"), "Nov 2025 – Jan 2026");
});

test("CSV escapes authored text and exports exactly three periods per filtered store", () => {
  const store = { ...createSalesTargetStores()[11], name: 'Market, "West"' };
  const csv = salesTargetCsv([store], "2026-11");
  assert.equal(csv.split("\r\n").length, 4);
  assert.ok(csv.includes('"Market, ""West"""'));
  assert.ok(csv.includes('"Month","2026-11","2026-11"'));
  assert.ok(
    csv
      .split("\r\n")[1]
      .endsWith(
        ',"0.00","' +
          (store.facts.find((fact) => fact.month === "2026-11").actualCents / 100).toFixed(2) +
          '",""',
      ),
  );
  const blank = emptySalesTargetStore("target-store-13");
  assert.equal(blank.facts.length, 18);
  assert.equal(
    blank.facts.every((fact) => fact.actualCents === 0 && fact.targetCents === 0),
    true,
  );
});
