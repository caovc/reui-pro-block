import assert from "node:assert/strict";
import { test } from "node:test";
import {
  manifestPageHref,
  readManifestRoute,
} from "../src/templates/business/manifest-route-model.ts";

const rawQuery = "?qa=manifest&raw=a%20b&raw=a+b&flag&preset=%7b%22mode%22%3a%22light%22%7d";

test("Manifest preview anchors keep the owned mount and every original query byte", () => {
  const start = `#/template-preview/manifest/account/preferences${rawQuery}`;
  assert.equal(manifestPageHref(start, "Orders"), `#/template-preview/manifest/orders${rawQuery}`);
  assert.equal(
    manifestPageHref(start, "General"),
    `#/template-preview/manifest/settings${rawQuery}`,
  );
  assert.equal(
    manifestPageHref(start, "Profile"),
    `#/template-preview/manifest/account/profile${rawQuery}`,
  );
  assert.equal(manifestPageHref(start, "Dashboard"), `#/template-preview/manifest${rawQuery}`);
});

test("Manifest exported ordinary pages can reach account, settings and the canonical root", () => {
  const start = `#/orders${rawQuery}`;
  assert.equal(manifestPageHref(start, "Security"), `#/account/security${rawQuery}`);
  assert.equal(manifestPageHref(start, "Settings"), `#/settings${rawQuery}`);
  assert.equal(manifestPageHref(start, "Dashboard"), `#/${rawQuery}`);
  assert.equal(readManifestRoute(`#/${rawQuery}`).page, "Dashboard");
  assert.equal(readManifestRoute(`#/products/${rawQuery}`).page, "Products");
});

test("Manifest adapter does not take another template or an unknown standalone route", () => {
  for (const hash of [
    `#/template-preview/surge/orders${rawQuery}`,
    `#/templates/atlas/account/profile${rawQuery}`,
    `#/unrelated${rawQuery}`,
  ]) {
    assert.equal(readManifestRoute(hash).owned, false);
    assert.equal(readManifestRoute(hash).createProduct, false);
    assert.equal(manifestPageHref(hash, "Dashboard"), hash);
  }
  const owned = `#/template-preview/manifest/orders${rawQuery}`;
  assert.equal(manifestPageHref(owned, "Unknown page"), owned);
});

test("Manifest product creation has its own history entry without inventing a product-detail body", () => {
  const list = `#/templates/manifest/products${rawQuery}`;
  const editor = manifestPageHref(list, "New product");
  assert.equal(editor, `#/templates/manifest/products/new${rawQuery}`);
  const route = readManifestRoute(editor);
  assert.equal(route.page, "Products");
  assert.equal(route.createProduct, true);
  assert.equal(manifestPageHref(editor, "Products"), list);
  const unvisited = readManifestRoute(`#/templates/manifest/products/unvisited-product${rawQuery}`);
  assert.equal(unvisited.page, null);
  assert.equal(unvisited.createProduct, false);
});
