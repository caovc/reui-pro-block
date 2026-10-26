import assert from "node:assert/strict";
import test from "node:test";
import {
  createProspectSeed,
  initialProspectLists,
} from "../src/blocks/data/grid-advanced-prospect-database-data.ts";
import {
  prospectBookReducer,
  prospectGrowth,
  prospectHandoverPreview,
  prospectIntentSummary,
  prospectMatchesQuery,
  validateProspectDraft,
} from "../src/blocks/data/grid-advanced-prospect-database-model.ts";

const query = (rules, combinator = "and") => ({ id: "root", type: "group", combinator, rules });
const rule = (field, operator, value, negated = false) => ({
  id: `${field}-${operator}`,
  type: "rule",
  path: [field],
  operator,
  value,
  negated,
});
const book = () => ({
  companies: createProspectSeed(),
  lists: structuredClone(initialProspectLists),
  past: [],
});

test("original account histories retain stable identity and tier counts", () => {
  const records = createProspectSeed();
  assert.equal(new Set(records.map((record) => record.id)).size, 30);
  assert.deepEqual(
    prospectIntentSummary(records).map(({ count, unassigned }) => [count, unassigned]),
    [
      [10, 1],
      [11, 5],
      [9, 5],
    ],
  );
  assert.deepEqual(
    prospectIntentSummary(records.filter((record) => record.ownerId === "mara")).map(
      ({ count, share }) => [count, share],
    ),
    [
      [5, 71],
      [1, 14],
      [1, 14],
    ],
  );
  const alder = records.find((record) => record.id === "alder");
  assert.equal(prospectGrowth(alder), 8);
  records.reverse();
  assert.equal(prospectGrowth(records.find((record) => record.id === "alder")), 8);
  records[0].headcount[0] = 999;
  assert.notEqual(createProspectSeed().at(-1).headcount[0], 999);
});

test("nested AND/OR, real free select/list operators and negation keep their meaning", () => {
  const records = createProspectSeed();
  const nested = query([
    query([rule("industry", "is", "Manufacturing"), rule("country", "is", "France")], "or"),
    rule("intent", "gte", 70),
  ]);
  assert.deepEqual(
    records.filter((record) => prospectMatchesQuery(record, nested)).map((record) => record.id),
    ["juniper", "north"],
  );
  assert.equal(
    prospectMatchesQuery(
      records[0],
      query([rule("industry", "is_any_of", ["Retail", "Manufacturing"])]),
    ),
    true,
  );
  assert.equal(
    prospectMatchesQuery(records[0], query([rule("list", "has_all_of", ["industry"])])),
    true,
  );
  assert.equal(
    prospectMatchesQuery(records[0], query([rule("list", "has_none_of", ["industry"])])),
    false,
  );
  assert.equal(
    prospectMatchesQuery(records[0], query([rule("industry", "is", "Manufacturing", true)])),
    false,
  );
});

test("drafts and empty OR groups are skipped; zero and valueless operators remain valid", () => {
  const record = createProspectSeed()[0];
  const incomplete = query([rule("size", "between", [0, undefined])], "or");
  assert.equal(
    prospectMatchesQuery(record, query([rule("industry", "is", "Retail"), incomplete], "or")),
    false,
  );
  assert.equal(prospectMatchesQuery(record, query([rule("size", "gte", undefined)])), true);
  assert.equal(
    prospectMatchesQuery({ ...record, employees: 0 }, query([rule("size", "eq", 0)])),
    true,
  );
  assert.equal(
    prospectMatchesQuery({ ...record, ownerId: null }, query([rule("owner", "empty")])),
    true,
  );
  assert.equal(
    prospectMatchesQuery(record, query([rule("size", "not_between", [400, 500])])),
    false,
  );
});

test("owner/status mutations undo without losing contacts, charts or lists", () => {
  let state = book();
  const original = state.companies[0];
  state = prospectBookReducer(state, {
    type: "patch",
    ids: ["alder"],
    patch: { ownerId: "mara", status: "Qualified" },
  });
  assert.equal(state.companies[0].ownerId, "mara");
  assert.equal(state.companies[0].status, "Qualified");
  state = prospectBookReducer(state, { type: "undo" });
  assert.deepEqual(state.companies[0], original);
  state = prospectBookReducer(state, { type: "remove", ids: ["alder"] });
  assert.equal(state.companies.length, 29);
  state = prospectBookReducer(state, { type: "undo" });
  assert.deepEqual(state.companies[0], original);
});

test("handover moves only open accounts and preserves status, lists and closed owners", () => {
  let state = book();
  const preview = prospectHandoverPreview(state.companies, "mara", "kian");
  assert.equal(preview.owned, 7);
  assert.equal(preview.eligibleIds.length, 5);
  assert.equal(preview.retained, 2);
  const before = structuredClone(state.companies);
  state = prospectBookReducer(state, { type: "handover", from: "mara", to: "kian" });
  assert.equal(state.companies.find((record) => record.id === "grove").ownerId, "mara");
  assert.equal(state.companies.find((record) => record.id === "oak").ownerId, "mara");
  assert.equal(state.companies.find((record) => record.id === "moss").ownerId, "kian");
  assert.deepEqual(
    state.companies.map((record) => record.status),
    before.map((record) => record.status),
  );
  assert.deepEqual(
    state.companies.map((record) => record.listIds),
    before.map((record) => record.listIds),
  );
  state = prospectBookReducer(state, { type: "undo" });
  assert.deepEqual(state.companies, before);
  assert.equal(prospectBookReducer(state, { type: "handover", from: "mara", to: "mara" }), state);
});

test("company identity rejects duplicate domains and accepts genuine zero employees", () => {
  let state = book();
  const draft = {
    ...state.companies[0],
    id: "new",
    name: "New Demo",
    domain: " HTTPS://ALDER.EXAMPLE/ ",
    employees: 0,
  };
  assert.match(validateProspectDraft(draft, state.companies).domain, /already exists/);
  assert.equal(prospectBookReducer(state, { type: "upsert", record: draft }), state);
  draft.domain = "new-demo.example";
  assert.deepEqual(validateProspectDraft(draft, state.companies), {});
  state = prospectBookReducer(state, { type: "upsert", record: draft });
  assert.equal(state.companies.length, 31);
  assert.equal(state.companies.at(-1).employees, 0);
});

test("bulk list changes and list creation are one reversible account mutation", () => {
  let state = book();
  state = prospectBookReducer(state, {
    type: "toggle-list",
    ids: ["alder", "birch"],
    listId: "north",
  });
  assert.equal(
    state.companies.slice(0, 2).every((record) => record.listIds.includes("north")),
    true,
  );
  state = prospectBookReducer(state, {
    type: "create-list",
    list: { id: "review", name: "Review next week" },
    companyIds: ["alder"],
  });
  assert.equal(state.companies[0].listIds.includes("review"), true);
  state = prospectBookReducer(state, { type: "undo" });
  assert.equal(
    state.lists.some((list) => list.id === "review"),
    false,
  );
  assert.equal(state.companies[0].listIds.includes("review"), false);
});
