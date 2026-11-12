import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readStrataSettingsTab,
  strataSettingsQuery,
} from "../src/templates/workflow/strata-settings-routing.ts";
import { strataRouteHref, strataSettingsHref } from "../src/templates/workflow/strata-routing.ts";
import {
  strataProfileDefaults,
  validateStrataProfile,
} from "../src/templates/workflow/strata-settings-model.ts";

test("Settings deep links retain opaque preset bytes and remove only stale tab pairs", () => {
  const query =
    "?preset=%7b%22style%22%3a%22sera%22%7d&scope=a%2Bb&tab=security&scope=b&t%61b=profile";
  assert.equal(
    strataSettingsQuery(query, "billing"),
    "?preset=%7b%22style%22%3a%22sera%22%7d&scope=a%2Bb&scope=b&tab=billing",
  );
  const destination = strataSettingsHref(`#/templates/strata${query}`, "api-keys");
  assert.equal(
    destination,
    "#/templates/strata/settings?preset=%7b%22style%22%3a%22sera%22%7d&scope=a%2Bb&scope=b&tab=api-keys",
  );
  assert.equal(readStrataSettingsTab(destination.split("?")[1]), "api-keys");
  assert.equal(
    strataRouteHref(destination, "/logs"),
    "#/templates/strata/logs?preset=%7b%22style%22%3a%22sera%22%7d&scope=a%2Bb&scope=b",
  );
});

test("General is canonical and unrelated query spelling survives settings navigation", () => {
  assert.equal(
    strataSettingsQuery("?scope=a&&tab=profile&raw=%ZZ&", "general"),
    "?scope=a&&raw=%ZZ&",
  );
  assert.equal(strataSettingsQuery("?tab=profile", "general"), "");
  assert.equal(
    strataSettingsHref("#/template-preview/strata/logs?preset=%7B%7D", "general"),
    "#/template-preview/strata/settings?preset=%7B%7D",
  );
  assert.equal(readStrataSettingsTab("?tab=unknown"), "general");
  assert.equal(strataSettingsHref("#/template-preview/lucent/logs", "profile"), null);
});

test("Profile rejects invalid local identities and website prefixes before saving", () => {
  assert.equal(validateStrataProfile(strataProfileDefaults), null);
  for (const patch of [
    { name: " " },
    { email: "invalid" },
    { username: "a b" },
    { website: "https://bricklane.example" },
    { website: "person@bricklane.example" },
  ]) {
    assert.ok(validateStrataProfile({ ...strataProfileDefaults, ...patch }));
  }
  assert.equal(
    validateStrataProfile({ ...strataProfileDefaults, website: "team.bricklane.example/docs" }),
    null,
  );
});
