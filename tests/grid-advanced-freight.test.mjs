import test from "node:test";
import assert from "node:assert/strict";
import {
  createFreightBook,
  freightTerminals,
} from "../src/blocks/data/grid-advanced-freight-data.ts";
import {
  freightApplyRates,
  freightBand,
  freightBookIssue,
  freightCloseLane,
  freightSaveLane,
  freightFigures,
  freightLaneMatches,
  freightMatrix,
  freightPreview,
  freightQueryMatches,
  freightTotals,
  freightValidateLane,
} from "../src/blocks/data/grid-advanced-freight-math.ts";

const fixture = () => createFreightBook();
const rule = (field, operator, value, negated = false) => ({
  id: `${field}-${operator}`,
  type: "rule",
  path: [field],
  operator,
  value,
  negated,
});
const group = (combinator, ...rules) => ({ id: "test-group", type: "group", combinator, rules });

test("independent network has stable, unique directed records and real missing reverses", () => {
  const book = fixture();
  assert.equal(freightTerminals.length, 12);
  assert.equal(book.lanes.length, 98);
  assert.equal(new Set(book.lanes.map((lane) => lane.id)).size, 98);
  assert.deepEqual(book, fixture());
  assert.ok(book.lanes.every((lane) => lane.origin !== lane.destination));
  const matrix = freightMatrix(book.lanes);
  const portoValencia = matrix.byPair.get("OPO-VLC");
  assert.ok(portoValencia);
  assert.equal(matrix.byPair.has("VLC-OPO"), false);
  const twoWay = book.lanes.find((lane) => matrix.byPair.has(`${lane.destination}-${lane.origin}`));
  const reverse = matrix.byPair.get(`${twoWay.destination}-${twoWay.origin}`);
  assert.notEqual(twoWay.id, reverse.id);
  assert.notEqual(twoWay.loads, reverse.loads);
});

test("economics use integer cents and aggregate weighted revenue, not averaged margins", () => {
  const first = {
    ...fixture().lanes[0],
    loads: 10,
    distanceKm: 100,
    rateCents: 200,
    costCents: 150,
  };
  const second = { ...first, id: "second", loads: 2, rateCents: 100, costCents: 150 };
  assert.deepEqual(freightFigures(first), {
    revenueCents: 200000,
    costCents: 150000,
    profitCents: 50000,
    margin: 25,
  });
  const total = freightTotals([first, second]);
  assert.equal(total.loads, 12);
  assert.equal(total.profitCents, 40000);
  assert.equal(total.revenueCents, 220000);
  assert.equal(total.margin, (40000 / 220000) * 100);
  assert.equal(total.losing, 1);
  assert.equal(freightTotals([]).margin, null);
  assert.deepEqual([-9, -1, 0, 6, 12].map(freightBand), [
    "Deep Loss",
    "Loss",
    "Thin",
    "Healthy",
    "Strong",
  ]);
});

test("query bridge preserves AND, OR, nested groups and rule negation", () => {
  const lane = fixture().lanes[0];
  const origin = rule("origin", "is", lane.origin);
  const destination = rule("destination", "is", "not-a-terminal");
  assert.equal(freightQueryMatches(lane, group("and", origin, destination)), false);
  assert.equal(freightQueryMatches(lane, group("or", origin, destination)), true);
  assert.equal(
    freightQueryMatches(
      lane,
      group("and", origin, group("or", destination, rule("loads", "gte", lane.loads))),
    ),
    true,
  );
  assert.equal(freightQueryMatches(lane, { ...origin, negated: true }), false);
  assert.equal(
    freightQueryMatches(lane, rule("loads", "between", [lane.loads + 1, lane.loads - 1])),
    true,
  );
  assert.equal(freightQueryMatches(lane, rule("loads", "not_between", [0, lane.loads + 1])), false);
});

test("unfinished nodes and empty OR children are omitted rather than matching everything", () => {
  const lane = fixture().lanes[0];
  const noMatch = rule("origin", "is", "missing");
  const drafts = [
    rule("origin", "", lane.origin),
    rule("origin", "is", " "),
    rule("loads", "gte", null),
    rule("loads", "between", [2, ""]),
    rule("loads", "between", [2]),
    rule("origin", "is_any_of", []),
    rule("unknown", "is", "x"),
    { ...rule("origin", "is", lane.origin), path: ["unknown", "origin"] },
    rule("origin", "is", [lane.origin, lane.destination]),
    rule("loads", "contains", "1"),
    rule("origin", "made_up", lane.origin),
    group("or"),
  ];
  for (const draft of drafts) {
    assert.equal(freightQueryMatches(lane, draft), undefined);
    assert.equal(freightQueryMatches(lane, group("or", noMatch, draft)), false);
    assert.equal(
      freightQueryMatches(lane, group("and", rule("origin", "is", lane.origin), draft)),
      true,
    );
  }
  assert.equal(freightQueryMatches(lane, group("or", ...drafts)), undefined);
  assert.equal(freightQueryMatches(lane, { ...rule("loads", "eq", ""), negated: true }), undefined);
  assert.equal(freightQueryMatches(lane, rule("loads", "gte", 0)), true);
});

test("search includes both route ends and shipper; projection totals conserve filtered loads", () => {
  const book = fixture();
  const criteria = { text: "Porto", query: group("and"), band: "All Margins" };
  const matching = book.lanes.filter((lane) =>
    freightLaneMatches(lane, criteria, freightTerminals),
  );
  assert.ok(matching.length > 0);
  assert.ok(matching.every((lane) => lane.origin === "OPO" || lane.destination === "OPO"));
  const matrix = freightMatrix(matching);
  const outbound = [...matrix.outbound.values()].reduce(
    (sum, lanes) => sum + freightTotals(lanes).loads,
    0,
  );
  const inbound = [...matrix.inbound.values()].reduce(
    (sum, lanes) => sum + freightTotals(lanes).loads,
    0,
  );
  assert.equal(outbound, inbound);
  assert.equal(inbound, freightTotals(matching).loads);
  const first = book.lanes[0];
  assert.equal(
    freightLaneMatches(first, { ...criteria, text: first.shipper }, freightTerminals),
    true,
  );
  assert.equal(
    freightLaneMatches({ ...first, active: false }, { ...criteria, text: "" }, freightTerminals),
    false,
  );
});

test("repricing preview and apply agree, round per-km cents, skip closed/profitable lanes and preserve undo snapshot", () => {
  const book = fixture();
  const saved = structuredClone(book);
  const losing = book.lanes.find((lane) => freightFigures(lane).profitCents < 0);
  const winning = book.lanes.find((lane) => freightFigures(lane).profitCents > 0);
  const plan = {
    laneIds: [losing.id, winning.id],
    percent: 5,
    losingOnly: true,
    reason: "Annual review",
  };
  const preview = freightPreview(book, plan);
  assert.equal(preview.changes.length, 1);
  const updated = freightApplyRates(book, plan, "2026-10-26T10:00:00Z");
  assert.deepEqual(book, saved);
  assert.equal(
    updated.lanes.find((lane) => lane.id === losing.id).rateCents,
    Math.round(losing.rateCents * 1.05),
  );
  assert.equal(
    updated.lanes.find((lane) => lane.id === winning.id),
    winning,
  );
  assert.equal(updated.history.length, book.history.length + 1);
  assert.equal(updated.history.at(-1).previousRateCents, losing.rateCents);
  assert.equal(updated.history.at(-1).reason, "Annual review");
  assert.equal(
    freightTotals(updated.lanes.filter((lane) => plan.laneIds.includes(lane.id))).profitCents,
    preview.after.profitCents,
  );
  assert.deepEqual(saved, book); // The UI undo stack can restore this full book, including history.
  assert.throws(() => freightPreview(book, { ...plan, percent: -100 }));
  assert.throws(() => freightPreview(book, { ...plan, percent: -20.5 }));
  assert.throws(() => freightPreview(book, { ...plan, percent: 30.5 }));
  assert.doesNotThrow(() => freightPreview(book, { ...plan, percent: -20 }));
  assert.doesNotThrow(() => freightPreview(book, { ...plan, percent: 30 }));
  const blankReason = freightApplyRates(book, { ...plan, reason: " " }, "2026-10-26T10:00:00Z");
  assert.equal(blankReason.history.at(-1).reason, "");
});

test("route validation rejects self routes, duplicate directed pairs and invalid numbers", () => {
  const book = fixture();
  const original = book.lanes[0];
  assert.equal(freightValidateLane(original, book), null);
  assert.match(freightValidateLane({ ...original, id: "another" }, book), /already/);
  assert.match(
    freightValidateLane({ ...original, destination: original.origin }, book),
    /different/,
  );
  assert.match(freightValidateLane({ ...original, loads: 1.5 }, book), /whole/);
  assert.match(freightValidateLane({ ...original, rateCents: Number.NaN }, book), /positive/);
});

test("loader input validator rejects malformed identities, figures and history references", () => {
  const book = fixture();
  assert.equal(freightBookIssue(book, freightTerminals), null);
  assert.match(
    freightBookIssue({ lanes: null, history: [] }, freightTerminals),
    /not a freight book/,
  );
  assert.match(
    freightBookIssue({ ...book, lanes: [...book.lanes, book.lanes[0]] }, freightTerminals),
    /unique/,
  );
  assert.match(
    freightBookIssue({ ...book, lanes: [{ ...book.lanes[0], id: " " }] }, freightTerminals),
    /unique/,
  );
  assert.match(
    freightBookIssue(
      { ...book, lanes: [{ ...book.lanes[0], destination: "unknown" }] },
      freightTerminals,
    ),
    /terminal/,
  );
  assert.match(
    freightBookIssue(
      { ...book, lanes: [{ ...book.lanes[0], rateCents: 123.5 }] },
      freightTerminals,
    ),
    /economic/,
  );
  assert.match(
    freightBookIssue(
      { ...book, history: [{ ...book.history[0], laneId: "missing" }] },
      freightTerminals,
    ),
    /history/,
  );
  assert.match(
    freightBookIssue(
      { ...book, history: [{ ...book.history[0], rateCents: null }] },
      freightTerminals,
    ),
    /history/,
  );
});

test("successive repricing batches keep unique audit event identities even at the same timestamp", () => {
  const book = fixture();
  const plan = {
    laneIds: [book.lanes[0].id],
    percent: 10,
    losingOnly: false,
    reason: "Repeat review",
  };
  const first = freightApplyRates(book, plan, "2026-10-26T10:00:00Z");
  const second = freightApplyRates(first, plan, "2026-10-26T10:00:00Z");
  assert.notEqual(first.history.at(-1).id, second.history.at(-1).id);
  assert.equal(second.history.at(-1).previousRateCents, first.lanes[0].rateCents);
});

test("CRUD updates one directed lane and history without changing its reverse or the undo snapshot", () => {
  const book = fixture();
  const lane = book.lanes.find((item) =>
    book.lanes.some(
      (reverse) => reverse.origin === item.destination && reverse.destination === item.origin,
    ),
  );
  const reverse = book.lanes.find(
    (item) => item.origin === lane.destination && item.destination === lane.origin,
  );
  const edited = freightSaveLane(
    book,
    { ...lane, loads: lane.loads + 1 },
    freightTerminals,
    "2026-10-26T11:00:00Z",
  );
  assert.equal(edited.lanes.find((item) => item.id === lane.id).loads, lane.loads + 1);
  assert.equal(
    edited.lanes.find((item) => item.id === reverse.id),
    reverse,
  );
  const closed = freightCloseLane(edited, lane.id, "2026-10-26T11:01:00Z");
  assert.equal(closed.lanes.find((item) => item.id === lane.id).active, false);
  assert.equal(closed.lanes.find((item) => item.id === reverse.id).active, true);
  assert.equal(freightCloseLane(closed, lane.id, "2026-10-26T11:02:00Z"), closed);
  assert.equal(book.lanes.find((item) => item.id === lane.id).active, true);
  assert.equal(book.history.length, 98);
  const fresh = { ...lane, id: "new-VLC-OPO", origin: "VLC", destination: "OPO" };
  const created = freightSaveLane(closed, fresh, freightTerminals, "2026-10-26T11:03:00Z");
  assert.equal(created.lanes.length, 99);
  assert.equal(created.history.at(-1).kind, "Opened");
  assert.equal(freightBookIssue(created, freightTerminals), null);
  assert.throws(
    () => freightSaveLane(book, { ...lane, destination: "missing" }, freightTerminals, "now"),
    /network/,
  );
  assert.throws(
    () => freightSaveLane(book, { ...lane, rateCents: 1.5 }, freightTerminals, "now"),
    /whole cents/,
  );
});
