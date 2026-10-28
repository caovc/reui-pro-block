import assert from "node:assert/strict";
import { test } from "node:test";
import {
  commerceSettingsHref,
  commerceSettingsSections,
  readCommerceSettingsRoute,
} from "../src/templates/business/commerce-settings-route-model.ts";
import { applyCommerceDemoData } from "../src/templates/business/commerce-settings-demo-data.ts";

test("seven settings sections retain their template, preview mount and query", () => {
  for (const id of ["surge", "manifest"]) {
    for (const mount of [`/templates/${id}`, `/template-preview/${id}`]) {
      for (const section of commerceSettingsSections) {
        const href = commerceSettingsHref(`#${mount}?theme=dark`, id, section);
        assert.equal(readCommerceSettingsRoute(href, id).section, section);
        assert.equal(readCommerceSettingsRoute(href, id).mount, mount);
        assert.equal(readCommerceSettingsRoute(href, id).query, "?theme=dark");
      }
      assert.equal(
        commerceSettingsHref(`#${mount}/settings/team?theme=dark`, id, null),
        `#${mount}?theme=dark`,
      );
    }
  }
  assert.equal(
    readCommerceSettingsRoute("#/templates/manifest/settings/team", "surge").section,
    null,
  );
  assert.equal(commerceSettingsHref("", "surge", "general"), "#/settings");
});

test("load preserves authored data, reset clones defaults, clear removes the actual collection", () => {
  const authored = [{ id: "custom", values: [9] }];
  const defaults = [{ id: "sample", values: [1] }];
  assert.equal(applyCommerceDemoData("load", authored, defaults), authored);
  assert.deepEqual(applyCommerceDemoData("load", [], defaults), defaults);
  const reset = applyCommerceDemoData("reset", authored, defaults);
  reset[0].values.push(2);
  assert.deepEqual(defaults[0].values, [1]);
  assert.deepEqual(applyCommerceDemoData("clear", authored, defaults), []);
  assert.deepEqual(authored[0].values, [9]);
});
