import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSalesTargetStores,
  filterSalesTargetStores,
  salesPeriodMonths,
  salesTargetMetrics,
  saveSalesTargetFact,
  saveSalesTargetStore,
} from "../src/blocks/data/grid-advanced-sales-target-model.ts";

function stores() {
  return createSalesTargetStores()
    .slice(0, 2)
    .map((store, index) => ({
      ...store,
      facts: store.facts.map((fact) => ({
        ...fact,
        actualCents: index ? 450 : 100,
        targetCents: index ? 900 : 100,
      })),
    }));
}

test("last-three-month periods cross years while YTD begins in January", () => {
  assert.deepEqual(salesPeriodMonths("2026-01", "last3"), ["2025-11", "2025-12", "2026-01"]);
  assert.deepEqual(salesPeriodMonths("2026-01", "ytd"), ["2026-01"]);
  assert.equal(salesPeriodMonths("2026-11", "ytd").length, 11);
  assert.deepEqual(salesPeriodMonths("2029-01", "month"), []);
});

test("region and grand-total percentages are weighted by actual target money", () => {
  const records = stores();
  const result = salesTargetMetrics(records, "2026-11", "month");
  assert.equal(result.actualCents, 550);
  assert.equal(result.targetCents, 1000);
  assert.equal(result.varianceCents, -450);
  assert.ok(Math.abs(result.attainment - 55) < 1e-10);
  assert.equal(salesTargetMetrics(records, "2026-11", "last3").actualCents, 1650);
  const noTarget = {
    ...records[0],
    facts: records[0].facts.map((fact) => ({ ...fact, targetCents: 0 })),
  };
  assert.equal(salesTargetMetrics([noTarget], "2026-11", "month").attainment, null);
});

test("a monthly edit changes every containing period and leaves neighboring records untouched", () => {
  const records = stores();
  const snapshot = structuredClone(records);
  const result = saveSalesTargetFact(records, records[0].id, {
    month: "2026-11",
    actualCents: 100,
    targetCents: 200,
  });
  assert.equal(result.error, null);
  assert.equal(result.stores[1], records[1]);
  for (const period of ["month", "last3", "ytd"]) {
    assert.equal(
      salesTargetMetrics(result.stores, "2026-11", period).targetCents -
        salesTargetMetrics(records, "2026-11", period).targetCents,
      100,
    );
  }
  assert.equal(salesTargetMetrics(result.stores, "2026-10", "month").targetCents, 1000);
  assert.deepEqual(records, snapshot);
});

test("search, region, format and target-status filters select the records behind totals", () => {
  const records = createSalesTargetStores();
  const matching = filterSalesTargetStores(records, "2026-11", "", ["West"], [], "No target");
  assert.equal(matching.length, 1);
  assert.equal(matching[0].name, "Stonegate Mall");
  assert.equal(salesTargetMetrics(matching, "2026-11", "month").targetCents, 0);
  assert.deepEqual(
    filterSalesTargetStores(records, "2026-11", "Juniper", ["South"], [], "All stores"),
    [],
  );
});

test("invalid monthly writes, incomplete series and duplicate stores are atomic", () => {
  const records = stores();
  for (const fact of [
    { month: "2026-11", actualCents: -1, targetCents: 100 },
    { month: "2026-11", actualCents: 100, targetCents: 0.5 },
    { month: "2030-01", actualCents: 100, targetCents: 100 },
  ]) {
    const result = saveSalesTargetFact(records, records[0].id, fact);
    assert.ok(result.error);
    assert.equal(result.stores, records);
  }
  for (const patch of [
    { facts: records[0].facts.slice(1) },
    { id: "duplicate", name: ` ${records[1].name} ` },
  ]) {
    const result = saveSalesTargetStore(records, { ...records[0], ...patch });
    assert.ok(result.error);
    assert.equal(result.stores, records);
  }
});
