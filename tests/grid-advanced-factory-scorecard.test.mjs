import assert from "node:assert/strict";
import test from "node:test";
import {
  createFactories,
  currentQuarter,
  factoryReducer,
  matchesFactoryQuery,
  matchesFactorySearch,
  matchesLens,
  newFactory,
  otifPosition,
  quarterRanks,
  quarters,
  scoreFactories,
} from "../src/blocks/data/grid-advanced-factory-scorecard-data.ts";

const group = (rules, combinator = "and") => ({ id: "root", type: "group", combinator, rules });
const rule = (field, operator, value, negated = false) => ({
  id: `${field}-${operator}`,
  type: "rule",
  path: [field],
  operator,
  value,
  negated,
});

test("original fixture has 26 stable suppliers, eight raw quarters and three genuine new partners", () => {
  const records = createFactories();
  assert.equal(records.length, 26);
  assert.equal(new Set(records.map((row) => row.id)).size, 26);
  assert.ok(records.every((row) => Object.keys(row.quarters).length === 8));
  const scores = scoreFactories(records, "Q2 2026");
  assert.equal(scores.filter((row) => matchesLens(row, "New")).length, 3);
  assert.ok(
    scores
      .filter((row) => matchesLens(row, "New"))
      .every((row) => row.prior === null && row.priorRank === null && row.change === null),
  );
});

test("comparison changes prior metrics while preserving current spend, rank and raw identity", () => {
  const records = createFactories();
  const before = JSON.stringify(records);
  const recent = scoreFactories(records, "Q2 2026");
  const older = scoreFactories(records, "Q1 2026");
  for (const row of recent) {
    const other = older.find((item) => item.id === row.id);
    assert.equal(other.current.spend, row.current.spend);
    assert.equal(other.rank, row.rank);
    if (row.prior) assert.notEqual(other.prior.spend, row.prior.spend);
  }
  assert.equal(JSON.stringify(records), before);
});

test("rank compares numeric spend over the full book and category mode restarts each category", () => {
  const records = createFactories();
  const ranks = quarterRanks([...records].reverse(), currentQuarter);
  assert.equal(ranks.get("BL-F101"), 1);
  assert.equal(ranks.get("BL-F126"), 26);
  const category = quarterRanks(records, currentQuarter, true);
  assert.equal(category.get("BL-F101"), 1);
  assert.equal(category.get("BL-F102"), 1);
  assert.equal(category.get("BL-F104"), 1);
  assert.equal(category.get("BL-F105"), 1);
  assert.ok(scoreFactories(records, "Q2 2026").some((row) => matchesLens(row, "Climbers")));
  assert.ok(scoreFactories(records, "Q2 2026").some((row) => matchesLens(row, "Fallers")));
});

test("each supplier's peer band is category-wide and independent of record order/search", () => {
  const records = createFactories();
  const all = scoreFactories(records, "Q2 2026");
  const reversed = scoreFactories([...records].reverse(), "Q2 2026");
  for (const row of all) {
    const same = reversed.find((item) => item.id === row.id);
    assert.equal(same.peerLow, row.peerLow);
    assert.equal(same.peerHigh, row.peerHigh);
    assert.ok(row.peerLow <= row.peerHigh);
    assert.ok(
      all
        .filter((item) => item.category === row.category)
        .every((item) => item.peerLow === row.peerLow && item.peerHigh === row.peerHigh),
    );
  }
  const found = all.filter((row) => matchesFactorySearch(row, "Cedar Loom"));
  assert.equal(found.length, 1);
  assert.equal(found[0].peerLow, all[0].peerLow);
});

test("OTIF maps to a common bounded 80–100 percent axis", () => {
  assert.deepEqual([70, 80, 85, 90, 95, 100, 110].map(otifPosition), [0, 0, 25, 50, 75, 100, 100]);
});

test("manual next buy can differ from suggestion and undo restores the call without rewriting metrics", () => {
  const initial = { records: createFactories(), undo: [] };
  const before = scoreFactories(initial.records, "Q2 2026")[0];
  const edited = factoryReducer(initial, { type: "call", id: before.id, value: "Exit" });
  const after = scoreFactories(edited.records, "Q2 2026")[0];
  assert.equal(after.nextBuy, "Exit");
  assert.equal(after.suggested, before.suggested);
  assert.equal(after.current, before.current);
  assert.equal(after.reasons.length, 9);
  assert.equal(factoryReducer(edited, { type: "undo" }).records, initial.records);
});

test("CRUD and notes share one immutable undo history; reload clears stale snapshots", () => {
  const initial = { records: createFactories(), undo: [] };
  const added = { ...newFactory("BL-NEW"), name: "Original Test Mill" };
  let store = factoryReducer(initial, { type: "put", factory: added });
  assert.equal(store.records.length, 27);
  assert.equal(
    scoreFactories(store.records, "Q2 2026").find((row) => row.id === added.id).prior,
    null,
  );
  const note = { id: "local", author: "Avery Chen", date: "2026-10-26", text: "Capacity reserved" };
  store = factoryReducer(store, { type: "put", factory: { ...added, notes: [note] } });
  store = factoryReducer(store, { type: "delete", id: added.id });
  assert.equal(store.records.length, 26);
  store = factoryReducer(store, { type: "undo" });
  assert.equal(store.records.find((row) => row.id === added.id).notes[0].text, note.text);
  store = factoryReducer(store, { type: "undo" });
  assert.equal(store.records.find((row) => row.id === added.id).notes.length, 0);
  assert.equal(initial.records.length, 26);
  store = factoryReducer(store, { type: "load", records: [] });
  assert.deepEqual(factoryReducer(store, { type: "undo" }), { records: [], undo: [] });
});

test("calendar day edits persist both ISO fields without changing quarterly history and Undo restores them together", () => {
  const initial = { records: createFactories(), undo: [] };
  const original = initial.records[0];
  const edited = factoryReducer(initial, {
    type: "put",
    factory: { ...original, since: "2024-02-29", audit: "2026-09-09" },
  });
  const saved = edited.records.find((factory) => factory.id === original.id);
  assert.equal(saved.since, "2024-02-29");
  assert.equal(saved.audit, "2026-09-09");
  assert.equal(saved.quarters, original.quarters);
  assert.equal(saved.nextBuy, original.nextBuy);
  assert.equal(initial.records[0], original);
  const restored = factoryReducer(edited, { type: "undo" });
  assert.equal(restored.records, initial.records);
  assert.equal(restored.records[0].since, original.since);
  assert.equal(restored.records[0].audit, original.audit);
});

test("mixed nested AND/OR query preserves parentheses and rule negation", () => {
  const scores = scoreFactories(createFactories(), "Q2 2026");
  const query = group([
    group([rule("country", "is", "Portugal"), rule("country", "is", "India")], "or"),
    rule("category", "is", "Accessories", true),
  ]);
  const expected = scores.filter(
    (row) => ["Portugal", "India"].includes(row.country) && row.category !== "Accessories",
  );
  assert.deepEqual(
    scores.filter((row) => matchesFactoryQuery(row, query)).map((row) => row.id),
    expected.map((row) => row.id),
  );
});

test("unfinished and empty OR children are ignored instead of becoming universally true", () => {
  const scores = scoreFactories(createFactories(), "Q2 2026");
  const query = group(
    [
      group([], "or"),
      rule("country", "is", "Poland"),
      rule("category", "", undefined),
      rule("change", "gt", " ", true),
    ],
    "or",
  );
  assert.deepEqual(
    scores.filter((row) => matchesFactoryQuery(row, query)).map((row) => row.country),
    ["Poland", "Poland", "Poland"],
  );
  assert.ok(
    scores.every((row) =>
      matchesFactoryQuery(row, group([group([], "or"), rule("defects", "between", [0])])),
    ),
  );
});

test("numeric predicates preserve zero, skip incomplete/invalid ranges and retain true null semantics", () => {
  const scores = scoreFactories(createFactories(), "Q2 2026");
  const newly = scores.find((row) => row.prior === null);
  const established = scores[0];
  assert.equal(matchesFactoryQuery(newly, group([rule("change", "empty")])), true);
  assert.equal(matchesFactoryQuery(newly, group([rule("change", "gt", 0)])), false);
  assert.equal(matchesFactoryQuery(established, group([rule("change", "gt", 0)])), true);
  assert.equal(matchesFactoryQuery(established, group([rule("defects", "between", [2, 1])])), true);
  assert.equal(
    matchesFactoryQuery(established, group([rule("defects", "between", ["", 2])])),
    true,
  );
  assert.equal(
    matchesFactoryQuery(established, group([rule("defects", "lt", "not a number")])),
    true,
  );
});

test("multiple select operators compose with numeric boundaries and human call filters", () => {
  const scores = scoreFactories(createFactories(), "Q2 2026");
  const query = group([
    rule("category", "is_any_of", ["Footwear", "Home"]),
    rule("nextBuy", "is_none_of", ["Exit", "Reduce"]),
    rule("defects", "lte", 1),
  ]);
  assert.deepEqual(
    scores.filter((row) => matchesFactoryQuery(row, query)).map((row) => row.id),
    scores
      .filter(
        (row) =>
          ["Footwear", "Home"].includes(row.category) &&
          !["Exit", "Reduce"].includes(row.nextBuy) &&
          row.current.defects <= 1,
      )
      .map((row) => row.id),
  );
});

test("all quarters preserve finite raw percentages/money and exclude absent factories from historical ranks", () => {
  const records = createFactories();
  for (const quarter of quarters) {
    const ranks = quarterRanks(records, quarter);
    for (const factory of records) {
      const metric = factory.quarters[quarter];
      assert.equal(ranks.has(factory.id), metric !== null);
      if (metric) {
        assert.ok(Number.isFinite(metric.spend) && metric.spend >= 0);
        assert.ok(metric.otif >= 0 && metric.otif <= 100);
      }
    }
  }
});
