import assert from "node:assert/strict";
import test from "node:test";
import {
  createDriveHeaderBindings,
  driveFolderLocation,
  driveHeaderRoute,
  resolveDriveFileDestination,
} from "../src/templates/collaboration/drive-file-navigation.ts";
import {
  driveRouteHref,
  readDriveRoute,
} from "../src/templates/collaboration/drive-route-model.ts";
import { getDriveTreeFolders } from "../src/templates/collaboration/drive-tree-data.ts";

const folder = (id, name, extra = {}) => ({
  id,
  name,
  type: "Folder",
  parent: "My Drive",
  owner: "Alex Rivera",
  size: "0 B",
  modified: "Today",
  star: false,
  ...extra,
});
const file = (id, name, extra = {}) => ({ ...folder(id, name), type: "PDF", ...extra });
const trees = getDriveTreeFolders();
const resolve = (location, files, bindings) =>
  resolveDriveFileDestination(location, files, trees, "Favourites", bindings);

test("bare files retain their host default while explicit empty views remain valid", () => {
  const bindings = createDriveHeaderBindings([], trees);
  assert.equal(resolve(undefined, [], bindings).view, "Favourites");
  assert.equal(
    resolveDriveFileDestination(undefined, [], trees, "My Drive", bindings).view,
    "My Drive",
  );
  for (const view of ["My Drive", "Shared With Me", "Favourites", "Recent", "Bin"]) {
    assert.deepEqual(resolve({ kind: "view", view }, [], bindings), {
      status: "ready",
      view,
      file: null,
    });
  }
});

test("real tree-only folders work without fabricating a FileRecord", () => {
  const records = [file("guide", "Guide.pdf", { parent: "Brand Library" })];
  const before = JSON.stringify(records);
  const bindings = createDriveHeaderBindings(records, trees);
  const route = driveHeaderRoute(
    { kind: "folder", name: "Brand Library" },
    records,
    trees,
    bindings,
  );
  assert.deepEqual(route.location, { kind: "folder", source: "tree", id: "Brand Library" });
  assert.deepEqual(resolve(route.location, records, bindings), {
    status: "ready",
    view: "Brand Library",
    file: null,
  });
  assert.equal(JSON.stringify(records), before);
});

test("a real folder keeps its ID through rename and cannot revive through the tree after deletion", () => {
  const original = [folder("box-0", "Brand Library")];
  const bindings = createDriveHeaderBindings(original, trees);
  const renamed = [{ ...original[0], name: "Brand Archive" }];
  const route = driveHeaderRoute(
    { kind: "folder", name: "Brand Library" },
    renamed,
    trees,
    bindings,
  );
  assert.deepEqual(route.location, { kind: "folder", source: "record", id: "box-0" });
  assert.equal(resolve(route.location, renamed, bindings).view, "Brand Archive");
  assert.equal(
    resolve({ kind: "folder", source: "tree", id: "Brand Library" }, renamed, bindings).view,
    "Brand Archive",
  );
  const deleted = [{ ...renamed[0], deleted: true }];
  assert.equal(resolve(route.location, deleted, bindings).status, "unavailable");
  assert.equal(
    resolve({ kind: "folder", source: "tree", id: "Brand Library" }, deleted, bindings).status,
    "unavailable",
  );
});

test("duplicate generic names are ambiguous while a specific live ID remains usable", () => {
  const records = [
    folder("a", "Duplicates"),
    folder("b", "Duplicates"),
    file("one", "Brief.pdf"),
    file("two", "Brief.pdf"),
  ];
  const bindings = createDriveHeaderBindings(records, trees);
  assert.equal(
    resolve(driveFolderLocation("Duplicates", records, trees, bindings), records, bindings).status,
    "ambiguous",
  );
  const target = driveHeaderRoute({ kind: "file", name: "Brief.pdf" }, records, trees, bindings);
  assert.equal(resolve(target.location, records, bindings).status, "ambiguous");
  assert.equal(resolve({ kind: "file", id: "two" }, records, bindings).file.id, "two");
});

test("a fixed notification file link does not retarget a new record using its old name", () => {
  const original = [file("original", "Plan.pdf")];
  const bindings = createDriveHeaderBindings(original, trees);
  const later = [
    file("original", "Old Plan.pdf", { deleted: true }),
    file("replacement", "Plan.pdf"),
  ];
  const target = driveHeaderRoute({ kind: "file", name: "Plan.pdf" }, later, trees, bindings);
  assert.deepEqual(target.location, { kind: "file", id: "original" });
  assert.equal(resolve(target.location, later, bindings).status, "unavailable");
});

test("all Header destinations use the same parsed route and exact theme query", () => {
  const records = [folder("box-0", "Brand Library"), file("plan", "Plan.pdf")];
  const bindings = createDriveHeaderBindings(records, trees);
  const root = "#/template-preview/filebox?theme=Mono%2BSerif&token=a%3Fb%26c";
  for (const target of [
    { kind: "view", view: "My Drive" },
    { kind: "folder", name: "Brand Library" },
    { kind: "file", name: "Plan.pdf" },
    { kind: "file", name: "Missing.pdf" },
    { kind: "settings", section: "team", memberSlug: "theo-park" },
  ]) {
    const route = driveHeaderRoute(target, records, trees, bindings);
    const href = driveRouteHref(root, "filebox", route);
    assert.deepEqual(readDriveRoute(href, "filebox"), route);
    assert.ok(href.endsWith("?theme=Mono%2BSerif&token=a%3Fb%26c"));
  }
  assert.equal(resolve({ kind: "file", id: "missing" }, records, bindings).status, "unavailable");
});

test("removed names do not make a unique live lookup ambiguous or revive an empty tree", () => {
  const records = [
    file("old", "Plan.pdf", { deleted: true }),
    file("live", "Plan.pdf"),
    folder("old-folder", "Brand Library", { deleted: true }),
    folder("live-folder", "Brand Library"),
  ];
  const bindings = createDriveHeaderBindings(records, trees);
  assert.deepEqual(
    driveHeaderRoute({ kind: "file", name: "Plan.pdf" }, records, trees, bindings).location,
    { kind: "file", id: "live" },
  );
  assert.equal(
    resolve({ kind: "lookup", entity: "file", name: "Plan.pdf" }, records, bindings).file.id,
    "live",
  );
  assert.deepEqual(driveFolderLocation("Brand Library", records, trees, bindings), {
    kind: "folder",
    source: "record",
    id: "live-folder",
  });
  assert.equal(
    resolve({ kind: "lookup", entity: "folder", name: "Brand Library" }, records, bindings).status,
    "ready",
  );
  const removed = records.map((entry) => ({ ...entry, deleted: true }));
  assert.equal(
    resolve({ kind: "lookup", entity: "folder", name: "Brand Library" }, removed, bindings).status,
    "unavailable",
  );
  assert.equal(
    resolve({ kind: "folder", source: "tree", id: "Brand Library" }, removed, bindings).status,
    "unavailable",
  );
});
