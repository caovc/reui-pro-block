import assert from "node:assert/strict";
import test from "node:test";
import {
  createStrataWorkspace,
  createStrataWorkspacesFixture,
  STRATA_WORKSPACE_ENVIRONMENTS,
  STRATA_WORKSPACE_REGIONS,
} from "../src/templates/workflow/strata-workspaces-model.ts";

test("workspace fixtures preserve the shell's four identities without sharing mutable records", () => {
  const initial = createStrataWorkspacesFixture();
  assert.deepEqual(
    initial.map(({ name, description }) => ({ name, description })),
    [
      { name: "Bricklane Core", description: "Production · EU West" },
      { name: "Bricklane Edge", description: "Staging · US East" },
      { name: "Bricklane Labs", description: "Sandbox · EU West" },
      { name: "Bricklane Data", description: "Analytics · EU Central" },
    ],
  );
  for (const workspace of initial) {
    assert.ok(STRATA_WORKSPACE_ENVIRONMENTS.includes(workspace.environment));
    assert.ok(STRATA_WORKSPACE_REGIONS.includes(workspace.region));
  }
  initial[0].name = "Changed only in this model";
  assert.equal(createStrataWorkspacesFixture()[0].name, "Bricklane Core");
});

test("creation normalizes the name and derives the description for each supported local choice", () => {
  const workspaces = createStrataWorkspacesFixture();
  const before = structuredClone(workspaces);
  for (const environment of STRATA_WORKSPACE_ENVIRONMENTS) {
    for (const region of STRATA_WORKSPACE_REGIONS) {
      const result = createStrataWorkspace(workspaces, {
        name: "  Bricklane Payments  ",
        environment,
        region,
        description: "A caller cannot substitute inconsistent metadata",
      });
      assert.equal(result.ok, true);
      assert.equal(result.index, 4);
      assert.deepEqual(result.workspace, {
        name: "Bricklane Payments",
        environment,
        region,
        description: `${environment} · ${region}`,
      });
    }
  }
  assert.deepEqual(workspaces, before);
});

test("empty or duplicate names cannot append a second identity", () => {
  const workspaces = createStrataWorkspacesFixture();
  for (const name of ["", "  \n\t ", "Bricklane Core", "  bRiCkLaNe CoRe "])
    assert.equal(
      createStrataWorkspace(workspaces, { name, environment: "Production", region: "EU West" }).ok,
      false,
      name,
    );
  assert.equal(workspaces.length, 4);
});

test("unsupported environments and regions are rejected without mutating existing workspaces", () => {
  const workspaces = createStrataWorkspacesFixture();
  const before = structuredClone(workspaces);
  const draft = { name: "Bricklane Payments", environment: "Production", region: "EU West" };
  assert.deepEqual(createStrataWorkspace(workspaces, { ...draft, environment: "Analytics" }), {
    ok: false,
    error: "Choose a supported environment.",
  });
  assert.deepEqual(createStrataWorkspace(workspaces, { ...draft, region: "Unknown region" }), {
    ok: false,
    error: "Choose a supported region.",
  });
  assert.deepEqual(workspaces, before);
});

test("successive local creations receive distinct indexes and enforce newly created names", () => {
  const initial = createStrataWorkspacesFixture();
  const first = createStrataWorkspace(initial, {
    name: "Bricklane Payments",
    environment: "Production",
    region: "EU West",
  });
  assert.equal(first.ok, true);
  const updated = [...initial, first.workspace];
  assert.equal(updated[first.index].name, "Bricklane Payments");
  const second = createStrataWorkspace(updated, {
    name: "Bricklane Testing",
    environment: "Sandbox",
    region: "US East",
  });
  assert.equal(second.ok, true);
  assert.equal(second.index, 5);
  assert.equal(
    createStrataWorkspace(updated, {
      name: "bricklane payments",
      environment: "Staging",
      region: "EU Central",
    }).ok,
    false,
  );
  assert.equal(initial.length, 4);
});
