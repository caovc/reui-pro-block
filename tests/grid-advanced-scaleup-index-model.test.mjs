import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createScaleupCompanies,
  filterScaleups,
  rankScaleups,
  saveScaleupCompany,
  scaleupMetrics,
  scaleupSummary,
  setScaleupCheck,
} from "../src/blocks/data/grid-advanced-scaleup-index-model.ts";

function company(id, revenue = 1728) {
  return {
    ...createScaleupCompanies()[0],
    id,
    name: id,
    checks: { independent: "Yes", audited: "Yes", recurring: "N/A" },
    facts: [
      { year: 2023, revenueCents: 1000, grossProfitCents: 200, employees: 10 },
      { year: 2026, revenueCents: revenue, grossProfitCents: 400, employees: 20 },
    ],
  };
}

test("the scale-up screen uses three-year CAGR and treats N/A as not disqualifying", () => {
  const record = company("Canal Instruments");
  const result = scaleupMetrics(record, 2026);
  assert.ok(Math.abs(result.growth - 20) < 1e-10);
  assert.equal(result.eligible, true);
  assert.equal(result.margin, (400 / 1728) * 100);
  const missing = scaleupMetrics(record, 2025);
  assert.equal(missing.revenueCents, null);
  assert.equal(missing.growth, null);
  assert.equal(missing.eligible, false);
});

test("province ranks remain stable through search and recompute after a screen edit", () => {
  const first = company("First");
  const second = {
    ...company("Second", 3456),
    facts: [
      { year: 2023, revenueCents: 2000, grossProfitCents: 400, employees: 10 },
      { year: 2026, revenueCents: 3456, grossProfitCents: 800, employees: 20 },
    ],
  };
  const records = [first, second];
  const ranked = rankScaleups(records, 2026);
  assert.equal(ranked.find((row) => row.company.id === "Second").provinceRank, 1);
  assert.equal(filterScaleups(ranked, "First", [], true)[0].provinceRank, 2);
  const edited = setScaleupCheck(records, "Second", "audited", "No");
  assert.equal(edited.error, null);
  assert.equal(rankScaleups(edited.companies, 2026)[0].provinceRank, 1);
  assert.equal(edited.companies[0], first);
  assert.equal(second.checks.audited, "Yes");
});

test("regional margin markers use total profit over total revenue", () => {
  const first = {
    ...company("Small"),
    facts: [
      { year: 2023, revenueCents: 50, grossProfitCents: 10, employees: 10 },
      { year: 2026, revenueCents: 100, grossProfitCents: 10, employees: 10 },
    ],
  };
  const second = {
    ...company("Large"),
    facts: [
      { year: 2023, revenueCents: 450, grossProfitCents: 200, employees: 20 },
      { year: 2026, revenueCents: 900, grossProfitCents: 450, employees: 20 },
    ],
  };
  const summary = scaleupSummary(rankScaleups([first, second], 2026));
  assert.equal(summary.revenueCents, 1000);
  assert.equal(summary.averageRevenueCents, 500);
  assert.equal(summary.weightedMargin, 46);
  assert.equal(summary.employees, 30);
});

test("zero or missing revenue baselines produce no fabricated growth or medal rank", () => {
  const record = company("New base");
  record.facts[0].revenueCents = 0;
  assert.equal(scaleupMetrics(record, 2026).growth, null);
  assert.equal(scaleupMetrics(record, 2026).eligible, false);
  assert.equal(rankScaleups([record], 2026)[0].provinceRank, null);
  assert.equal(scaleupSummary([]).weightedMargin, null);
});

test("invalid checks and malformed yearly records preserve the entire input array", () => {
  const records = [company("Original")];
  const invalidCheck = setScaleupCheck(records, "Original", "audited", "Unknown");
  assert.ok(invalidCheck.error);
  assert.equal(invalidCheck.companies, records);
  const invalidFact = saveScaleupCompany(records, {
    ...records[0],
    facts: [...records[0].facts, records[0].facts[0]],
  });
  assert.ok(invalidFact.error);
  assert.equal(invalidFact.companies, records);
  const snapshot = structuredClone(records);
  const saved = saveScaleupCompany(records, { ...records[0], name: "  Revised company  " });
  assert.equal(saved.error, null);
  assert.equal(saved.companies[0].name, "Revised company");
  assert.deepEqual(records, snapshot);
});
