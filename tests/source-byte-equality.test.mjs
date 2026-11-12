import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { expectRawBytes } from "./fidelity-next-source.helpers.ts";

test("archive equality preserves binary bytes, line endings and empty files", () => {
  for (const bytes of [
    Buffer.alloc(0),
    Buffer.from([0, 255, 128, 13, 10, 0]),
    Buffer.from("const value = '雨';\r\n\r\n"),
  ]) {
    assert.doesNotThrow(() =>
      expectRawBytes(new Uint8Array(bytes), Buffer.from(bytes), "original source"),
    );
  }
  assert.throws(() =>
    expectRawBytes(Buffer.from("value\r\n"), Buffer.from("value\n"), "original endings"),
  );
});

test("archive equality rejects a changed final byte and a changed length with complete failure hashes", () => {
  const original = Buffer.alloc(112077, 65);
  const changed = Buffer.from(original);
  changed[changed.length - 1] = 66;
  const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
  assert.throws(
    () => expectRawBytes(changed, original, "src/fixture.tsx"),
    (error) => {
      assert.match(error.message, /src\/fixture\.tsx/);
      assert.ok(error.message.includes(digest(changed)));
      assert.ok(error.message.includes(digest(original)));
      return true;
    },
  );
  assert.throws(() =>
    expectRawBytes(original.subarray(0, original.length - 1), original, "original length"),
  );
});

test("archive equality compares only each view's bytes at different backing offsets", () => {
  const storage = new Uint8Array([99, 1, 2, 3, 98, 1, 2, 3]);
  const first = storage.subarray(1, 4);
  const second = storage.subarray(5, 8);
  assert.doesNotThrow(() => expectRawBytes(first, second, "equal offset views"));
  second[2] = 4;
  assert.throws(() => expectRawBytes(first, second, "changed offset view"));
  assert.deepEqual([...first], [1, 2, 3]);
});
