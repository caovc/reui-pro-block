import assert from "node:assert/strict";
import { test } from "node:test";
import { STRATA_ROUTES } from "../src/templates/workflow/strata-domain.ts";
import {
  readStrataRoute,
  strataRouteHref,
  strataOverviewHref,
} from "../src/templates/workflow/strata-routing.ts";

test("Strata observed routes retain preview/gallery mounts and exact preset bytes", () => {
  const query = "?preset=%7B%22style%22%3A%22sera%22%7D&scope=a%2Bb&scope=b";
  for (const mount of ["/templates/strata", "/template-preview/strata", ""]) {
    for (const route of STRATA_ROUTES) {
      const hash = `#${mount}${route}${query}`;
      assert.deepEqual(readStrataRoute(hash), { mount, route, query });
      assert.equal(strataRouteHref(hash, "/logs"), `#${mount}/logs${query}`);
      assert.equal(strataRouteHref(hash, "/"), `#${mount || "/"}${query}`);
    }
  }
});

test("Strata refuses unrelated templates, route prefixes and unobserved destinations", () => {
  for (const hash of [
    "#/templates/strata-other/logs",
    "#/template-preview/lucent/services",
    "#/templates/strata/sign-out",
    "#/templates/strata/account/profile",
    "#/templates/strata/logs/unobserved",
    "#/templates/strata//logs",
    "#/projects",
  ]) {
    assert.equal(readStrataRoute(hash), null, hash);
    assert.equal(strataRouteHref(hash, "/logs"), null, hash);
  }
});

test("Strata accepts the two actually observed authentication pages under each mount", () => {
  for (const mount of ["/templates/strata", "/template-preview/strata", ""]) {
    for (const route of ["/sign-in", "/sign-up"]) {
      const hash = `#${mount}${route}?preset=%7B%7D`;
      assert.deepEqual(readStrataRoute(hash), { mount, route, query: "?preset=%7B%7D" });
      assert.equal(strataRouteHref(hash, "/"), `#${mount || "/"}?preset=%7B%7D`);
    }
  }
});

test("Strata accepts a canonical template root without adding a slash or dropping the query", () => {
  assert.deepEqual(readStrataRoute("#/templates/strata?preset=x"), {
    mount: "/templates/strata",
    route: "/",
    query: "?preset=x",
  });
  assert.equal(
    strataRouteHref("#/templates/strata/services?preset=x", "/"),
    "#/templates/strata?preset=x",
  );
  assert.equal(strataRouteHref("#/logs?preset=x", "/"), "#/?preset=x");
});

test("unknown Strata leaves recover within their mount and preserve exact non-settings query bytes", () => {
  const query = "?preset=%7B%22style%22%3A%22sera%22%7D&scope=a%2Bb&scope=b";
  for (const mount of ["/templates/strata", "/template-preview/strata", ""]) {
    assert.equal(strataOverviewHref(`#${mount}/unknown${query}`), `#${mount || "/"}${query}`);
    assert.equal(
      strataOverviewHref(`#${mount}/unknown${query}&tab=billing`),
      `#${mount || "/"}${query}`,
    );
  }
  assert.equal(strataOverviewHref("#/templates/strata-other/unknown"), "#/");
});
