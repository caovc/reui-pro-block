import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createQualitySuppliers,
  filterQualitySuppliers,
  qualityLots,
  qualityMetrics,
  saveInspectionLot,
  saveQualitySupplier,
} from "../src/blocks/data/grid-advanced-supplier-quality-model.ts";

function suppliers() {
  const seed = createQualitySuppliers();
  return [
    {
      ...seed[0],
      lots: [
        {
          id: "a",
          received: "2026-11-01",
          score: 90,
          units: 100,
          disposition: "Accepted",
          note: "",
        },
        {
          id: "b",
          received: "2026-09-01",
          score: 50,
          units: 25,
          disposition: "Rejected",
          note: "",
        },
      ],
      monthlySpendCents: Array.from({ length: 12 }, () => 100),
    },
    {
      ...seed[1],
      lots: [
        {
          id: "c",
          received: "2026-11-02",
          score: 70,
          units: 200,
          disposition: "Accepted",
          note: "",
        },
      ],
      monthlySpendCents: Array.from({ length: 12 }, () => 200),
    },
  ];
}

test("quality summaries count accepted lots and weight scores by inspected volume", () => {
  const records = suppliers();
  const result = qualityMetrics(records);
  assert.equal(result.lots, 3);
  assert.equal(result.units, 325);
  assert.equal(result.acceptance, (2 / 3) * 100);
  assert.equal(result.weightedScore, 24250 / 325);
  assert.equal(result.spendCents, 3600);
  assert.deepEqual(
    result.monthlySpendCents,
    Array.from({ length: 12 }, () => 300),
  );
});

test("period and disposition filters govern the same actual lot population", () => {
  const records = suppliers();
  assert.deepEqual(
    qualityLots(records[0], "Last 30 days").map((lot) => lot.id),
    ["a"],
  );
  const rejected = qualityMetrics(records, "All inspected lots", ["Rejected"]);
  assert.equal(rejected.lots, 1);
  assert.equal(rejected.weightedScore, 50);
  assert.equal(rejected.acceptance, 0);
  const filters = {
    search: "",
    divisions: [],
    tiers: [],
    disposition: ["Rejected"],
    period: "Last 30 days",
  };
  assert.deepEqual(filterQualitySuppliers(records, filters), []);
  assert.deepEqual(
    filterQualitySuppliers(records, { ...filters, period: "All inspected lots" }).map(
      (row) => row.id,
    ),
    [records[0].id],
  );
});

test("a supplier without inspected lots has no fabricated score or acceptance rate", () => {
  const empty = {
    ...suppliers()[0],
    lots: [],
    monthlySpendCents: Array.from({ length: 12 }, () => 0),
  };
  const result = qualityMetrics([empty]);
  assert.equal(result.weightedScore, null);
  assert.equal(result.acceptance, null);
  assert.equal(result.spendCents, 0);
});

test("a lot review updates derived quality without mutating other suppliers", () => {
  const records = suppliers();
  const snapshot = structuredClone(records);
  const result = saveInspectionLot(records, records[0].id, {
    ...records[0].lots[0],
    disposition: "Review",
    note: "  Recheck packaging  ",
  });
  assert.equal(result.error, null);
  assert.equal(result.suppliers[1], records[1]);
  assert.equal(result.suppliers[0].lots[0].note, "Recheck packaging");
  assert.equal(qualityMetrics([result.suppliers[0]]).acceptance, 0);
  assert.equal(qualityMetrics([result.suppliers[0]]).weightedScore, 82);
  assert.deepEqual(records, snapshot);
});

test("invalid reviews and duplicate suppliers are rejected atomically", () => {
  const records = suppliers();
  for (const patch of [
    { score: -1 },
    { score: 101 },
    { units: 1.5 },
    { units: 0 },
    { received: "2026-11-31" },
    { received: "2026-12-01" },
    { id: "c" },
  ]) {
    const result = saveInspectionLot(records, records[0].id, { ...records[0].lots[0], ...patch });
    assert.ok(result.error);
    assert.equal(result.suppliers, records);
  }
  const duplicate = saveQualitySupplier(records, {
    ...records[0],
    id: "new",
    name: ` ${records[1].name} `,
  });
  assert.ok(duplicate.error);
  assert.equal(duplicate.suppliers, records);
});
