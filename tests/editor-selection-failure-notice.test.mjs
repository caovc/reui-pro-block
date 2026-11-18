import assert from "node:assert/strict";
import { test } from "node:test";
import { editorSelectionFailureNotice } from "./editor-selection-failure-notice.ts";

const environment = { CI: "true", GITHUB_ACTIONS: "true" };
const node = (path, text) => ({ path: `editor/${path}`, text });
const verification = "A verified editor paragraph";
const seed = "Type / to insert a block, or @ to mention a teammate.";
const event = (detail, text = verification) => ({
  kind: "event",
  listenerPhase: "bubble",
  monotonicMs: 12,
  selection: {
    anchor: node("P[12]/#text[0]", text),
    anchorOffset: 0,
    focus: node("P[12]/#text[0]", text),
    focusOffset: text.length,
  },
  ...detail,
});
const info = (records) => ({
  title: "Tiptap edits, formats and restores the saved document with native undo and redo",
  line: 9,
  expectedStatus: "passed",
  status: "failed",
  attachments: [
    {
      name: "editor-native-selection-observation.json",
      contentType: "application/json",
      body: Buffer.from(JSON.stringify({ observationData: { records, dropped: 0 } })),
    },
  ],
});

test("CI failure gates consume only the exact test's existing body without mutating it", () => {
  const original = info([]);
  const snapshot = structuredClone(original);
  for (const changed of [
    { status: "passed" },
    { status: "skipped" },
    { expectedStatus: "failed" },
    { title: "another test" },
  ])
    assert.equal(editorSelectionFailureNotice({ ...original, ...changed }, environment), undefined);
  for (const changed of [{ CI: "" }, { GITHUB_ACTIONS: "" }])
    assert.equal(editorSelectionFailureNotice(original, { ...environment, ...changed }), undefined);
  assert.match(editorSelectionFailureNotice(original, environment), /^::notice /);
  assert.equal(
    editorSelectionFailureNotice({ ...original, status: "timedOut" }, environment)?.startsWith(
      "::notice ",
    ),
    true,
  );
  assert.deepEqual(structuredClone(original), snapshot);
});

test("compact rows expose native stages and wrong-paragraph Bold without raw text", () => {
  const result = editorSelectionFailureNotice(
    info([
      { kind: "installed", childOrder: [node("P[11]", seed), node("P[12]", verification)] },
      event({ type: "keyup", key: "End", ctrlKey: true }),
      event({ type: "keyup", key: "Enter" }),
      event({ type: "input" }),
      ...[0, 1].map(() => event({ type: "click", target: "outside-editor/BUTTON" })),
      event({ type: "keyup", key: "End", ctrlKey: true }),
      event({ type: "keyup", key: "Home" }),
      event({ type: "keyup", key: "End", shiftKey: true }),
      event({ type: "click", target: "outside-editor/BUTTON" }, seed),
    ]),
    environment,
  );
  for (const stage of [
    "docEnd1",
    "enter",
    "input",
    "undo",
    "redo",
    "docEnd2",
    "lineStart",
    "lineSelect",
    "bold",
  ])
    assert.ok(result.includes(stage));
  assert.match(result, /bold t12 E\/P12\/T0@0S>E\/P12\/T0@53S ord=2,V1,S0/);
  assert.ok(!result.includes(verification) && !result.includes(seed));
  assert.ok(!result.includes("\n"));
  assert.ok(Buffer.byteLength(result) < 2048);
});

test("malformed data, arbitrary text/paths and worst-case rows stay bounded", () => {
  const original = info([]);
  original.attachments[0].body = Buffer.from("invalid");
  assert.match(editorSelectionFailureNotice(original, environment), /unreadable$/);
  const injected = "\n::error::secret%\r";
  const result = editorSelectionFailureNotice(
    info(
      Array.from({ length: 1000 }, () =>
        event({ type: "input", selection: { anchor: { path: injected, text: injected } } }),
      ),
    ),
    environment,
  );
  assert.ok(!result.includes("secret") && !result.includes("::error"));
  assert.ok(Buffer.byteLength(result) < 2048);
  assert.match(
    editorSelectionFailureNotice({ ...original, attachments: [] }, environment),
    /unavailable$/,
  );
});
