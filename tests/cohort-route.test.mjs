import assert from "node:assert/strict";
import { test } from "node:test";
import { cohortPageHref, readCohortRoute } from "../src/templates/business/cohort-route-model.ts";

test("Cohort account links preserve hosted mounts and opaque theme query bytes", () => {
  for (const mount of ["/templates/cohort", "/template-preview/cohort"]) {
    const hash = `#${mount}/settings/profile?preset=%7B%22font%22%3A%22Inter%22%7D&theme=dark`;
    assert.equal(readCohortRoute(hash).page, "Profile");
    assert.equal(
      cohortPageHref(hash, "Preferences"),
      `#${mount}/settings/preferences?preset=%7B%22font%22%3A%22Inter%22%7D&theme=dark`,
    );
    assert.equal(readCohortRoute(cohortPageHref(hash, "Policies")).page, "Policies");
  }
});

test("Cohort department navigation replaces only its own filter", () => {
  const hash = "#/template-preview/cohort/people?theme=dark&department=Sales";
  const next = cohortPageHref(hash, "People", "Customer Success");
  assert.equal(next, "#/template-preview/cohort/people?theme=dark&department=Customer%20Success");
  assert.equal(readCohortRoute(next).department, "Customer Success");
  assert.equal(
    cohortPageHref(next, "Settings"),
    "#/template-preview/cohort/settings/organisation?theme=dark",
  );
});

test("Cohort standalone routes and the existing local calendar remain distinct", () => {
  assert.equal(cohortPageHref("#/", "Profile"), "#/settings/profile");
  assert.equal(readCohortRoute("#/settings/security").page, "Security");
  assert.equal(readCohortRoute("#/").page, "Dashboard");
  const calendar = cohortPageHref("#/template-preview/cohort?theme=dark", "Time");
  assert.equal(calendar, "#/template-preview/cohort?theme=dark&cohortView=calendar");
  assert.equal(readCohortRoute(calendar).page, "Time");
  assert.equal(
    cohortPageHref(calendar, "Time off"),
    "#/template-preview/cohort/time/time-off?theme=dark",
  );
});

test("Cohort invalid suffixes and other template mounts never select a page", () => {
  for (const hash of [
    "#/templates/cohort/settings/unknown",
    "#/templates/cohort-extra/settings/profile",
    "#/templates/atlas/settings/profile",
    "#/settings/profile/extra",
  ]) {
    assert.equal(readCohortRoute(hash).page, null);
  }
});
