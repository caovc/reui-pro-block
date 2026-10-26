import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Transpile only the real domain modules: no Vite, application typecheck, mock reducer or map SDK.
const directory = await mkdtemp(join(tmpdir(), "bricklane-dispatch-model-"));
after(() => rm(directory, { recursive: true, force: true }));
for (const name of [
  "fleet-types",
  "fleet-data",
  "fleet-model",
  "fleet-filter",
  "fleet-geo",
  "fleet-time",
]) {
  const source = await readFile(
    new URL(`../src/blocks/data/solution-map-variants/${name}.ts`, import.meta.url),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: `${name}.ts`,
    reportDiagnostics: true,
  });
  assert.equal(
    output.diagnostics?.filter((item) => item.category === ts.DiagnosticCategory.Error).length,
    0,
  );
  await writeFile(
    join(directory, `${name}.mjs`),
    output.outputText.replace(/from "\.\/(fleet-[\w-]+)"/g, 'from "./$1.mjs"'),
  );
}
const { createFleetState, DISPATCH_EPOCH, DEPOT } = await import(
  pathToFileURL(join(directory, "fleet-data.mjs"))
);
const {
  fleetReducer: reduce,
  reassignEligibility,
  rankedCandidates,
  fleetSummary,
} = await import(pathToFileURL(join(directory, "fleet-model.mjs")));
const { fleetRouteFeatures, fleetBounds } = await import(
  pathToFileURL(join(directory, "fleet-geo.mjs"))
);
const { matchesFleetQuery } = await import(pathToFileURL(join(directory, "fleet-filter.mjs")));
const { seattleDateInput, parseSeattleInput } = await import(
  pathToFileURL(join(directory, "fleet-time.mjs"))
);

function delivery(state, overrides = {}) {
  return {
    vehicleId: "V02",
    customer: "Harbor QA",
    address: "152 Pine Street, Seattle",
    position: [-122.332, 47.61],
    parcels: 3,
    cold: false,
    windowStart: state.now,
    windowEnd: state.now + 4 * 3600_000,
    serviceMinutes: 4,
    ...overrides,
  };
}

test("authored fleet has 24 independent vehicles, unique routes and a fixed Seattle service clock", () => {
  const first = createFleetState();
  const second = createFleetState();
  assert.equal(Object.keys(first.vehicles).length, 24);
  assert.equal(Object.keys(first.stops).length, 82);
  assert.equal(fleetSummary(first).delivered, 44);
  assert.equal(first.now, DISPATCH_EPOCH);
  const ids = Object.values(first.vehicles).flatMap((vehicle) => vehicle.routeIds);
  assert.equal(new Set(ids).size, 82);
  for (const vehicle of Object.values(first.vehicles)) {
    for (const id of vehicle.routeIds) assert.equal(first.stops[id].vehicleId, vehicle.id);
  }
  first.vehicles.V02.driver = "Changed locally";
  assert.notEqual(second.vehicles.V02.driver, first.vehicles.V02.driver);
});

test("one clock owns pause, speed and simulated motion without wall-clock leakage", () => {
  const initial = createFleetState();
  const paused = reduce(initial, { type: "running", value: false });
  assert.equal(reduce(paused, { type: "tick", elapsed: 30 }), paused);
  const fast = reduce(reduce(paused, { type: "running", value: true }), {
    type: "speed",
    value: 120,
  });
  const moved = reduce(fast, { type: "tick", elapsed: 2 });
  assert.equal(moved.now - initial.now, 240_000);
  assert.notDeepEqual(moved.vehicles.V01.position, initial.vehicles.V01.position);
  assert.ok(moved.vehicles.V01.fuel < initial.vehicles.V01.fuel);
  assert.equal(reduce(fast, { type: "tick", elapsed: NaN }), fast);
  assert.equal(reduce(fast, { type: "speed", value: 999 }).speed, 120);
  assert.equal(reduce(fast, { type: "speed", value: -4 }).speed, 1);
});

test("selection cannot point at another vehicle's delivery", () => {
  const initial = createFleetState();
  assert.equal(reduce(initial, { type: "select", vehicleId: "V02", stopId: "V18-S4" }), initial);
  const selected = reduce(initial, { type: "select", vehicleId: "V18", stopId: "V18-S4" });
  assert.equal(selected.selectedStopId, "V18-S4");
  assert.equal(reduce(selected, { type: "select", vehicleId: null }).selectedStopId, null);
});

test("reassign updates both route owners and real GeoJSON; Undo restores both without changing clock", () => {
  const initial = reduce(createFleetState(), {
    type: "select",
    vehicleId: "V18",
    stopId: "V18-S4",
  });
  const stopId = initial.selectedStopId;
  const candidate = rankedCandidates(initial, stopId).find((item) => item.eligible);
  assert.ok(candidate, "fixture must expose a genuinely eligible receiving van");
  const target = candidate.vehicle.id;
  const originalFrom = [...initial.vehicles.V18.routeIds];
  const originalTo = [...initial.vehicles[target].routeIds];
  const next = reduce(initial, { type: "reassign", stopId, vehicleId: target });
  assert.equal(next.stops[stopId].vehicleId, target);
  assert.ok(!next.vehicles.V18.routeIds.includes(stopId));
  assert.deepEqual(next.vehicles[target].routeIds, [...originalTo, stopId]);
  assert.deepEqual(initial.vehicles.V18.routeIds, originalFrom);
  assert.equal(next.stops[next.selectedStopId].vehicleId, next.selectedVehicleId);
  const features = fleetRouteFeatures(next).features;
  assert.equal(
    features.find((item) => item.properties.id === "V18").geometry.coordinates.length,
    originalFrom.length + 1,
  );
  assert.equal(
    features.find((item) => item.properties.id === target).geometry.coordinates.length,
    originalTo.length + 3,
  );
  const restored = reduce(next, { type: "undo" });
  assert.deepEqual(restored.vehicles.V18.routeIds, originalFrom);
  assert.deepEqual(restored.vehicles[target].routeIds, originalTo);
  assert.equal(restored.stops[stopId].vehicleId, "V18");
  assert.equal(restored.now, initial.now);
  assert.deepEqual(fleetRouteFeatures(restored), fleetRouteFeatures(initial));
});

test("eligibility rejects cold chain, capacity, reserve, status and expired windows before mutation", () => {
  const cases = [
    {
      mutate: (state) => {
        state.stops["V18-S4"].cold = true;
      },
      reason: /Temperature-controlled/,
    },
    {
      mutate: (state) => {
        state.vehicles.V02.capacity = 1;
        state.stops["V18-S4"].parcels = 2;
      },
      reason: /capacity/,
    },
    {
      mutate: (state) => {
        state.vehicles.V02.fuel = 0;
      },
      reason: /range/,
    },
    {
      mutate: (state) => {
        state.vehicles.V02.status = "Charging";
      },
      reason: /Charging/,
    },
    {
      mutate: (state) => {
        state.stops["V18-S4"].windowEnd = state.now;
      },
      reason: /time window/,
    },
  ];
  for (const { mutate, reason } of cases) {
    const initial = createFleetState();
    mutate(initial);
    assert.match(reassignEligibility(initial, "V18-S4", "V02").reason, reason);
    const next = reduce(initial, { type: "reassign", stopId: "V18-S4", vehicleId: "V02" });
    assert.equal(next.feedback.kind, "error");
    assert.equal(next.vehicles, initial.vehicles);
    assert.equal(next.stops, initial.stops);
    assert.equal(next.undo.length, 0);
  }
});

test("new delivery validates actual fields and Seattle coordinates, and Undo removes only the new stop", () => {
  const initial = createFleetState();
  for (const overrides of [
    { customer: " " },
    { parcels: 21 },
    { position: [-80, 20] },
    { windowEnd: initial.now - 1 },
  ]) {
    const rejected = reduce(initial, { type: "create-stop", stop: delivery(initial, overrides) });
    assert.equal(rejected.feedback.kind, "error");
    assert.equal(rejected.stops, initial.stops);
  }
  const next = reduce(initial, { type: "create-stop", stop: delivery(initial) });
  const created = Object.values(next.stops).find((stop) => stop.customer === "Harbor QA");
  assert.ok(created);
  assert.equal(Object.keys(next.stops).length, 83);
  assert.equal(next.vehicles.V02.routeIds.at(-1), created.id);
  const restored = reduce(next, { type: "undo" });
  assert.equal(restored.stops[created.id], undefined);
  assert.deepEqual(restored.vehicles.V02.routeIds, initial.vehicles.V02.routeIds);
  assert.deepEqual(restored.stops, initial.stops);
});

test("new delivery rejects nonexistent Seattle DST times and nonfinite windows without writing routes", () => {
  const initial = createFleetState();
  const windowStart = parseSeattleInput("2027-03-14T01:30");
  const windowEnd = parseSeattleInput("2027-03-14T03:30");
  const nonexistent = parseSeattleInput("2027-03-14T02:30");
  assert.ok(Number.isNaN(nonexistent));
  assert.ok(Number.isFinite(windowStart));
  assert.ok(Number.isFinite(windowEnd));

  for (const invalid of [nonexistent, Infinity, -Infinity]) {
    for (const overrides of [
      { windowStart: invalid, windowEnd },
      { windowStart, windowEnd: invalid },
      { windowStart: invalid, windowEnd: invalid },
    ]) {
      const rejected = reduce(initial, {
        type: "create-stop",
        stop: delivery(initial, overrides),
      });
      assert.equal(rejected.feedback.kind, "error");
      assert.match(rejected.feedback.message, /future time window/);
      assert.equal(rejected.stops, initial.stops);
      assert.equal(rejected.vehicles, initial.vehicles);
      assert.equal(rejected.undo, initial.undo);
    }
  }

  const next = reduce(initial, {
    type: "create-stop",
    stop: delivery(initial, { windowStart, windowEnd }),
  });
  const created = Object.values(next.stops).find((stop) => stop.customer === "Harbor QA");
  assert.ok(created);
  assert.equal(created.windowStart, windowStart);
  assert.equal(created.windowEnd, windowEnd);
  assert.equal(seattleDateInput(created.windowStart), "2027-03-14T01:30");
  assert.equal(seattleDateInput(created.windowEnd), "2027-03-14T03:30");
  assert.equal(next.vehicles.V02.routeIds.at(-1), created.id);
  assert.equal(Object.keys(next.stops).length, Object.keys(initial.stops).length + 1);
});

test("reschedule rejects invalid windows and Undo restores the original window", () => {
  const initial = createFleetState();
  const id = "V18-S4";
  const old = initial.stops[id];
  assert.equal(
    reduce(initial, {
      type: "reschedule",
      stopId: id,
      windowStart: initial.now,
      windowEnd: initial.now - 1,
    }).feedback.kind,
    "error",
  );
  const next = reduce(initial, {
    type: "reschedule",
    stopId: id,
    windowStart: initial.now + 3600_000,
    windowEnd: initial.now + 7200_000,
  });
  assert.equal(next.stops[id].windowEnd, initial.now + 7200_000);
  const restored = reduce(next, { type: "undo" });
  assert.deepEqual(restored.stops[id], old);
});

test("control Undo restores settings while retaining later simulation time and movement", () => {
  const initial = createFleetState();
  const controls = { ...initial.vehicles.V01.controls, mode: "Eco", speedLimit: 50 };
  const saved = reduce(initial, { type: "controls", vehicleId: "V01", controls });
  assert.equal(saved.vehicles.V01.controls.mode, "Eco");
  const moved = reduce(saved, { type: "tick", elapsed: 1 });
  const restored = reduce(moved, { type: "undo" });
  assert.deepEqual(restored.vehicles.V01.controls, initial.vehicles.V01.controls);
  assert.deepEqual(restored.vehicles.V01.position, moved.vehicles.V01.position);
  assert.equal(restored.now, moved.now);
  assert.equal(
    reduce(initial, {
      type: "controls",
      vehicleId: "V01",
      controls: { ...controls, targetTemperature: 70 },
    }).feedback.kind,
    "error",
  );
});

test("failure, acknowledgement and their Undo never claim the vehicle fault is repaired", () => {
  const initial = createFleetState();
  const failed = reduce(initial, {
    type: "fail-stop",
    stopId: "V18-S4",
    reason: "Recipient unavailable",
  });
  assert.equal(failed.stops["V18-S4"].status, "Failed");
  const exception = failed.exceptions.at(-1);
  assert.equal(exception.kind, "failed");
  const reviewed = reduce(failed, { type: "acknowledge", exceptionId: exception.id });
  assert.equal(reviewed.exceptions.at(-1).acknowledged, true);
  assert.equal(reviewed.vehicles.V18.status, "Breakdown");
  const unreviewed = reduce(reviewed, { type: "undo" });
  assert.equal(unreviewed.exceptions.at(-1).acknowledged, false);
  const restored = reduce(unreviewed, { type: "undo" });
  assert.deepEqual(restored.stops["V18-S4"], initial.stops["V18-S4"]);
  assert.equal(restored.exceptions.length, initial.exceptions.length);
});

test("retirement and editing protect open loads and preserve reversible vehicle data", () => {
  const initial = createFleetState();
  assert.equal(reduce(initial, { type: "retire", vehicleId: "V18" }).feedback.kind, "error");
  const retired = reduce(initial, { type: "retire", vehicleId: "V02" });
  assert.equal(fleetSummary(retired).vehicles, 23);
  assert.equal(reduce(retired, { type: "undo" }).vehicles.V02.status, initial.vehicles.V02.status);
  const vehicle = initial.vehicles.V01;
  const action = {
    type: "edit-vehicle",
    vehicleId: vehicle.id,
    driver: "QA Driver",
    registration: "BL QA 01",
    capacity: vehicle.capacity,
    kind: vehicle.kind,
    coldBox: vehicle.coldBox,
    fuel: 80,
  };
  assert.equal(reduce(initial, { ...action, capacity: 1 }).feedback.kind, "error");
  const edited = reduce(initial, action);
  assert.equal(edited.vehicles.V01.driver, "QA Driver");
  assert.deepEqual(reduce(edited, { type: "undo" }).vehicles.V01, vehicle);
});

test("native Filters query domain evaluation honors grouped operators and empty drafts", () => {
  const initial = createFleetState();
  const rule = (path, operator, value) => ({
    id: path,
    type: "rule",
    path: [path],
    operator,
    value,
  });
  const query = {
    id: "q",
    type: "group",
    combinator: "and",
    rules: [rule("kind", "is", ["gas"]), rule("fuel", "gte", 40)],
  };
  assert.equal(matchesFleetQuery(query, initial.vehicles.V02, initial), true);
  assert.equal(matchesFleetQuery(query, initial.vehicles.V09, initial), false);
  assert.equal(
    matchesFleetQuery(
      { ...query, rules: [rule("status", "is", [])] },
      initial.vehicles.V18,
      initial,
    ),
    true,
  );
  assert.equal(
    matchesFleetQuery(
      {
        ...query,
        combinator: "or",
        rules: [rule("status", "is", ["Breakdown"]), rule("kind", "is", ["gas"])],
      },
      initial.vehicles.V18,
      initial,
    ),
    true,
  );
});

test("map bounds remain finite when all vehicles are retired, with real original route GeoJSON", () => {
  const initial = createFleetState();
  const features = fleetRouteFeatures(initial);
  assert.equal(features.type, "FeatureCollection");
  assert.equal(features.features.length, 9);
  for (const feature of features.features) {
    assert.equal(feature.geometry.type, "LineString");
    assert.deepEqual(feature.geometry.coordinates[0], DEPOT);
    assert.deepEqual(feature.geometry.coordinates.at(-1), DEPOT);
  }
  for (const vehicle of Object.values(initial.vehicles)) vehicle.status = "Retired";
  assert.deepEqual(fleetBounds(initial), [DEPOT, DEPOT]);
});

test("Seattle date input round-trips the demo epoch independently of host timezone", () => {
  assert.equal(seattleDateInput(DISPATCH_EPOCH), "2026-10-26T09:30");
  assert.equal(parseSeattleInput("2026-10-26T09:30"), DISPATCH_EPOCH);
  assert.ok(Number.isNaN(parseSeattleInput("")));
  assert.ok(Number.isNaN(parseSeattleInput("2026-02-30T09:30")));
  assert.ok(Number.isNaN(parseSeattleInput("2026-03-08T02:30")));
  assert.equal(parseSeattleInput("2026-12-01T09:30"), Date.UTC(2026, 11, 1, 17, 30));
});

test("stale Undo actions cannot roll back a newer dispatch transaction", () => {
  const initial = createFleetState();
  const first = reduce(initial, { type: "retire", vehicleId: "V02" });
  const second = reduce(first, { type: "retire", vehicleId: "V04" });
  const rejected = reduce(second, { type: "undo", id: first.undo.at(-1).id });
  assert.equal(rejected.feedback.kind, "error");
  assert.equal(rejected.vehicles, second.vehicles);
  assert.equal(rejected.undo.length, 2);
});
