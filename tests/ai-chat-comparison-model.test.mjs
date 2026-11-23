import assert from "node:assert/strict";
import test from "node:test";
import {
  COMPARISON_MODELS,
  comparisonAnswerText,
  comparisonTranscript,
  comparisonTurnMetrics,
  createComparisonTurn,
  makeComparisonAnswer,
  seedComparisonTurns,
  sortComparisonRows,
} from "../src/blocks/data/ai-chat-comparison-model.ts";

test("the two comparison perspectives carry different evidence and rich reply structures", () => {
  const cohort = makeComparisonAnswer("rank the drivers", "sonnet");
  const baseline = makeComparisonAnswer("rank the drivers", "gpt");
  assert.notEqual(comparisonAnswerText(cohort), comparisonAnswerText(baseline));
  assert.ok(
    cohort.segments.some((segment) => segment.type === "code" && segment.language === "sql"),
  );
  const left = cohort.segments.find((segment) => segment.type === "table");
  const right = baseline.segments.find((segment) => segment.type === "table");
  assert.equal(
    left.rows.reduce((sum, row) => sum + row[1], 0),
    18,
  );
  assert.equal(
    right.rows.reduce((sum, row) => sum + row[1], 0),
    8,
  );
  assert.equal(
    right.rows.reduce((sum, row) => sum + row[2], 0),
    18,
  );
  assert.equal(
    right.rows.reduce((sum, row) => sum + row[3], 0),
    10,
  );
});

test("every selectable model has distinct local answer content and finite recorded metrics", () => {
  const answers = COMPARISON_MODELS.map((model) =>
    makeComparisonAnswer("rank the drivers", model.id),
  );
  assert.equal(new Set(answers.map(comparisonAnswerText)).size, COMPARISON_MODELS.length);
  for (const answer of answers) {
    assert.ok(Number.isFinite(answer.cost) && answer.cost > 0);
    assert.ok(answer.latencyMs > 0 && answer.tokensOut > 0);
  }
});

test("regeneration produces an alternative draft without mutating the original answer", () => {
  const first = makeComparisonAnswer("confirm the denominator", "gpt");
  const original = structuredClone(first);
  const revised = makeComparisonAnswer("confirm the denominator", "gpt", 1);
  assert.notEqual(comparisonAnswerText(first), comparisonAnswerText(revised));
  assert.deepEqual(first, original);
  assert.match(comparisonAnswerText(revised), /revised draft/);
});

test("seeded history has one finished exchange and one independent pending answer per model", () => {
  const left = seedComparisonTurns("sonnet");
  const right = seedComparisonTurns("gpt");
  assert.equal(left[0].status, "complete");
  assert.equal(left[0].preferred, true);
  assert.equal(right[0].preferred, false);
  assert.equal(left[1].status, "pending");
  assert.equal(right[1].revealed, 0);
  assert.notEqual(comparisonAnswerText(left[1].answer), comparisonAnswerText(right[1].answer));
});

test("reply table sorting treats numbers numerically and leaves the source row order intact", () => {
  const rows = [
    ["North", 12],
    ["East", 2],
    ["West", 9],
  ];
  const original = structuredClone(rows);
  assert.deepEqual(
    sortComparisonRows(rows, 1, false).map((row) => row[1]),
    [2, 9, 12],
  );
  assert.deepEqual(
    sortComparisonRows(rows, 1, true).map((row) => row[1]),
    [12, 9, 2],
  );
  assert.deepEqual(
    sortComparisonRows(rows, 0, false).map((row) => row[0]),
    ["East", "North", "West"],
  );
  assert.deepEqual(rows, original);
});

test("transcript export keeps the actual stopped partial answer, selected model and context", () => {
  const turn = createComparisonTurn(3, "> selected line\n\nExplain this", "haiku", 0, [
    "review-notes.md",
  ]);
  const full = comparisonAnswerText(turn.answer);
  turn.revealed = 43;
  turn.status = "stopped";
  turn.preferred = true;
  const text = comparisonTranscript([turn], "Review");
  assert.ok(text.includes(full.slice(0, 43)));
  assert.ok(!text.includes(full.slice(0, 44)));
  assert.match(text, /Claude Haiku 4\.5/);
  assert.match(text, /Status: stopped · Preferred/);
  assert.match(text, /Context: review-notes\.md/);
  assert.match(text, /> selected line\n\nExplain this/);
});

test("stopping an empty or partial local answer never reports the full fixture cost and tokens", () => {
  const turn = createComparisonTurn(3, "rank drivers", "sonnet");
  turn.status = "stopped";
  assert.deepEqual(comparisonTurnMetrics(turn), { latency: 0, rate: 0, cost: 0, tokens: 0 });
  turn.revealed = 40;
  const partial = comparisonTurnMetrics(turn);
  assert.ok(partial.cost > 0 && partial.cost < turn.answer.cost);
  assert.ok(partial.tokens > 0 && partial.tokens < turn.answer.tokensOut);
  turn.revealed = comparisonAnswerText(turn.answer).length;
  turn.status = "complete";
  const full = comparisonTurnMetrics(turn);
  assert.equal(full.tokens, turn.answer.tokensOut);
  assert.equal(full.cost, turn.answer.cost);
});
