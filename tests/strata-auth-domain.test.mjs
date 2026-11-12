import assert from "node:assert/strict";
import test from "node:test";
import { validateStrataAuth } from "../src/templates/workflow/strata-auth-model.ts";

test("sign-in accepts the observed username contract without requiring an email", () => {
  assert.deepEqual(validateStrataAuth("sign-in", "  bricklane-demo  ", "demo-password"), {
    ok: true,
    identifier: "bricklane-demo",
  });
});

test("registration requires an email and a password of at least eight characters", () => {
  assert.deepEqual(validateStrataAuth("sign-up", "demo", "1234567"), {
    ok: false,
    errors: {
      identifier: "Enter a valid email address.",
      password: "Use at least 8 characters.",
    },
  });
  assert.deepEqual(validateStrataAuth("sign-up", "m@example.com", "12345678"), {
    ok: true,
    identifier: "m@example.com",
  });
});

test("both modes report identifier and password errors for blank submissions", () => {
  for (const mode of ["sign-in", "sign-up"]) {
    const result = validateStrataAuth(mode, " \t ", "");
    assert.equal(result.ok, false);
    assert.ok(result.errors.identifier);
    assert.equal(result.errors.password, "Enter your password.");
    assert.deepEqual(Object.keys(result.errors).sort(), ["identifier", "password"]);
  }
});

test("password whitespace is not silently trimmed and passwords never cross the success boundary", () => {
  const result = validateStrataAuth("sign-up", "  m@example.com  ", " pass123 ");
  assert.deepEqual(result, { ok: true, identifier: "m@example.com" });
  assert.equal(Object.hasOwn(result, "password"), false);
  assert.equal(JSON.stringify(result).includes("pass123"), false);
});

test("invalid registration identifiers cannot be accepted as the username-only sign-in mode", () => {
  for (const identifier of [
    "name",
    "name@",
    "@example.com",
    "name@example com",
    "a@@example.com",
  ]) {
    const result = validateStrataAuth("sign-up", identifier, "demo-password");
    assert.equal(result.ok, false);
    assert.ok(result.errors.identifier);
  }
});
