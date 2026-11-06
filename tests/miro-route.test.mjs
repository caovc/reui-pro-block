import assert from "node:assert/strict";
import { test } from "node:test";
import { miroPageHref, readMiroRoute } from "../src/templates/business/miro-route-model.ts";

const query = "?qa=miro&raw=a%20b&raw=a+b&flag&preset=%7b%22mode%22%3a%22light%22%7d";

test("Miro ordinary navigation preserves the hosted mount and opaque duplicate query bytes", () => {
  const start = `#/template-preview/miro${query}`;
  assert.equal(miroPageHref(start, "Calendar"), `#/template-preview/miro/calendar${query}`);
  assert.equal(miroPageHref(start, "Settings"), `#/template-preview/miro/settings${query}`);
  assert.equal(miroPageHref(start, "Dashboard"), `#/template-preview/miro/dashboard${query}`);
  assert.equal(readMiroRoute(`#/templates/miro/appointments${query}`).page, "Appointments");
});

test("Miro standalone root and ordinary pages can enter or leave settings", () => {
  assert.equal(readMiroRoute(`#/${query}`).page, "Dashboard");
  const settings = miroPageHref(`#/${query}`, "Settings");
  assert.equal(settings, `#/settings${query}`);
  assert.equal(miroPageHref(settings, "Appointments"), `#/appointments${query}`);
  assert.equal(miroPageHref(settings, "Dashboard"), `#/dashboard${query}`);
});

test("Miro route parsing does not claim another template or an unrelated standalone path", () => {
  for (const hash of [
    `#/template-preview/manifest/settings${query}`,
    `#/templates/atlas/dashboard${query}`,
    `#/unrelated${query}`,
  ]) {
    assert.equal(readMiroRoute(hash).owned, false);
    assert.equal(miroPageHref(hash, "Dashboard"), hash);
  }
});

test("Miro page routes do not invent unobserved settings tab or record-detail addresses", () => {
  const start = `#/templates/miro/settings${query}`;
  assert.equal(miroPageHref(start, "Hours"), start);
  assert.equal(miroPageHref(start, "Unknown page"), start);
  assert.equal(readMiroRoute(`#/templates/miro/settings/hours${query}`).page, null);
  assert.equal(readMiroRoute(`#/templates/miro/calendar/unvisited-booking${query}`).page, null);
});
