import assert from "node:assert/strict";
import { test } from "node:test";
import {
  atlasAccountHref,
  readAtlasAccountRoute,
} from "../src/templates/business/atlas-account-route-model.ts";

test("account links preserve both preview mounts and theme query", () => {
  for (const mount of ["/templates/atlas", "/template-preview/atlas"]) {
    const hash = `#${mount}/account/profile?theme=dark&color=teal`;
    assert.deepEqual(readAtlasAccountRoute(hash), {
      mount,
      query: "?theme=dark&color=teal",
      section: "profile",
    });
    assert.equal(
      atlasAccountHref(hash, "security"),
      `#${mount}/account/security?theme=dark&color=teal`,
    );
    assert.equal(atlasAccountHref(hash, null), `#${mount}?theme=dark&color=teal`);
  }
});

test("standalone account URLs and invalid suffixes do not invent a section", () => {
  assert.equal(atlasAccountHref("", "preferences"), "#/account/preferences");
  assert.equal(readAtlasAccountRoute("#/account/security").section, "security");
  assert.equal(readAtlasAccountRoute("#/templates/atlas/account/not-found").section, null);
  assert.equal(readAtlasAccountRoute("#/templates/atlas-extra/account/profile").mount, "");
  assert.equal(readAtlasAccountRoute("#/templates/verve/account/profile").section, null);
});
