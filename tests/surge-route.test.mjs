import assert from "node:assert/strict";
import { test } from "node:test";
import { readSurgeRoute, surgePageHref } from "../src/templates/business/surge-route-model.ts";

test("Surge distinct observed leaf routes retain their hosted mount", () => {
  for (const mount of ["/templates/surge", "/template-preview/surge"]) {
    const reorder = surgePageHref(`#${mount}`, "Reorder queue");
    const groups = surgePageHref(reorder, "Groups");
    assert.equal(reorder, `#${mount}/inventory/reorder`);
    assert.equal(readSurgeRoute(reorder).page, "Reorder queue");
    assert.equal(groups, `#${mount}/customers/groups`);
    assert.equal(readSurgeRoute(groups).page, "Groups");
    assert.equal(surgePageHref(groups, "Stock ledger"), `#${mount}/inventory`);
    assert.equal(surgePageHref(groups, "All customers"), `#${mount}/customers`);
  }
});

test("Surge ordinary navigation preserves every opaque preset and query byte", () => {
  const query = "?preset=%7B%22font%22%3A%22Inter%22%7D&x=one+two&x=one%20two&theme=dark";
  const hash = `#/template-preview/surge/settings/team${query}`;
  const groups = surgePageHref(hash, "Groups");
  assert.equal(groups, `#/template-preview/surge/customers/groups${query}`);
  assert.equal(surgePageHref(groups, "Dashboard"), `#/template-preview/surge${query}`);
  assert.equal(readSurgeRoute(groups).query, query);
});

test("Surge standalone navigation has a canonical root and can leave account or settings", () => {
  assert.equal(
    surgePageHref("#/settings?theme=dark", "Reorder queue"),
    "#/inventory/reorder?theme=dark",
  );
  assert.equal(surgePageHref("#/account/profile?x=1", "Dashboard"), "#/?x=1");
  assert.equal(surgePageHref("#/customers/groups", "Dashboard"), "#/");
  assert.equal(readSurgeRoute("#/").page, "Dashboard");
  assert.equal(readSurgeRoute("#/settings").page, null);
  assert.equal(readSurgeRoute("#/account/security").page, null);
});

test("Surge product creation routes reuse the Products page and existing editor", () => {
  const next = surgePageHref("#/templates/surge?theme=light", "New product");
  assert.equal(next, "#/templates/surge/products/new?theme=light");
  const route = readSurgeRoute(next);
  assert.equal(route.page, "Products");
  assert.equal(route.createProduct, true);
  assert.equal(readSurgeRoute(surgePageHref(next, "Products")).createProduct, false);
});

test("Surge standalone ordinary pages can open existing store and account models", () => {
  assert.equal(surgePageHref("#/orders?x=1", "Profile"), "#/account/profile?x=1");
  assert.equal(surgePageHref("#/products/new?x=1", "Preferences"), "#/account/preferences?x=1");
  assert.equal(surgePageHref("#/inventory/reorder?x=1", "Settings"), "#/settings?x=1");
  assert.equal(surgePageHref("#/customers/groups?x=1", "Team"), "#/settings/team?x=1");
  assert.equal(readSurgeRoute("#/account/profile").page, null);
  assert.equal(readSurgeRoute("#/settings/team").page, null);
});

test("Surge route adapters do not take over another template or unknown standalone path", () => {
  for (const hash of [
    "#/templates/manifest/customers",
    "#/template-preview/atlas/orders",
    "#/templates/surge-copy/inventory",
    "#/foreign/path?theme=dark",
  ]) {
    assert.equal(readSurgeRoute(hash).owned, false);
    assert.equal(readSurgeRoute(hash).page, null);
    assert.equal(surgePageHref(hash, "Groups"), hash);
  }
  assert.equal(readSurgeRoute("#/templates/surge/inventory/purchase-orders").page, null);
  assert.equal(readSurgeRoute("#/products/new/extra").createProduct, false);
});
