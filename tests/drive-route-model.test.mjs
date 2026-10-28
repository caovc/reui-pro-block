// Pure transport contract tests: explicit locations, missing paths and preserved mounts.
import assert from "node:assert/strict";
import test from "node:test";
import {
  driveRouteHref,
  readDriveRoute,
} from "../src/templates/collaboration/drive-route-model.ts";

const locations = [
  [{ kind: "view", view: "My Drive" }, "/drive"],
  [{ kind: "view", view: "Shared With Me" }, "/shared"],
  [{ kind: "view", view: "Favourites" }, "/starred"],
  [{ kind: "view", view: "Bin" }, "/bin"],
  [{ kind: "view", view: "Recent" }, "/recent"],
  [{ kind: "folder", source: "record", id: "box-0" }, "/folders/record/box-0"],
  [{ kind: "folder", source: "tree", id: "Brand Library" }, "/folders/tree/Brand%20Library"],
  [{ kind: "file", id: "file-10" }, "/files/file-10"],
  [{ kind: "file", id: "name" }, "/files/name"],
  [
    { kind: "lookup", entity: "file", name: "Q3 Studio Plan.pdf" },
    "/files/name/Q3%20Studio%20Plan.pdf",
  ],
  [
    { kind: "lookup", entity: "folder", name: "Studio Operations" },
    "/folders/name/Studio%20Operations",
  ],
  [
    { kind: "lookup", entity: "folder", name: "设计 / 50%?draft#1&2" },
    "/folders/name/%E8%AE%BE%E8%AE%A1%20%2F%2050%25%3Fdraft%231%262",
  ],
  [{ kind: "file", id: "upload/id?part#1" }, "/files/upload%2Fid%3Fpart%231"],
];

for (const id of ["filespace", "filebox"]) {
  for (const prefix of ["templates", "template-preview", "standalone"]) {
    test(`${id} ${prefix} preserves bare semantics, locations and the exact query`, () => {
      const base = prefix === "standalone" ? "" : `/${prefix}/${id}`;
      const query = "?theme=Serif%2Bblue%2Fv1&radius=0.75&token=a%3Fb%26c&theme=Mono";
      const root = `#${base || "/"}${query}`;
      assert.deepEqual(readDriveRoute(root, id), { kind: "files" });
      assert.equal(driveRouteHref(root, id, { kind: "files" }), root);
      for (const [location, suffix] of locations) {
        const route = { kind: "files", location };
        const href = driveRouteHref(root, id, route);
        assert.equal(href, `#${base}${suffix}${query}`);
        assert.deepEqual(readDriveRoute(href, id), route);
        assert.deepEqual(readDriveRoute(`#${base}${suffix}/${query}`, id), route);
        assert.equal(driveRouteHref(href, id, { kind: "files" }), root);
      }
      for (const section of ["profile", "workspace", "team", "billing"]) {
        const route = { kind: "settings", section };
        const href = driveRouteHref(root, id, route);
        assert.equal(
          href,
          `#${base}/settings${section === "profile" ? "" : `/${section}`}${query}`,
        );
        assert.deepEqual(readDriveRoute(href, id), route);
        assert.equal(driveRouteHref(href, id, { kind: "files" }), root);
      }
      const member = { kind: "settings", section: "team", memberSlug: "alex-rivera" };
      const detail = driveRouteHref(root, id, member);
      assert.equal(detail, `#${base}/settings/team/alex-rivera${query}`);
      assert.deepEqual(readDriveRoute(detail, id), member);
      assert.equal(
        driveRouteHref(detail, id, { kind: "settings", section: "team" }),
        `#${base}/settings/team${query}`,
      );
      for (const kind of ["pricing", "login"]) {
        const route = { kind };
        const href = driveRouteHref(detail, id, route);
        assert.equal(href, `#${base}/${kind}${query}`);
        assert.deepEqual(readDriveRoute(href, id), route);
      }
    });

    test(`${id} ${prefix} recognizes missing routes without losing their raw path`, () => {
      const base = prefix === "standalone" ? "" : `/${prefix}/${id}`;
      const query = "?theme=Mono&token=%25%3F%26";
      for (const path of [
        "/unknown",
        "/unknown/",
        "/settings/unknown",
        "/settings/billing/member",
        "/settings/team/%E0%A4%A",
        "/settings/team/a%2Fb",
        "/files/%",
        "/files/%FF",
        "/files/name/%E0%A4%A",
        "/files/name/a/b",
        "/files/file-10/extra",
        "/folders/tree/%",
        "/folders/record/%FF",
        "/folders/name/%E0%A4%A",
        "/folders/unknown/id",
        "/drive/extra",
      ]) {
        const href = `#${base}${path}${query}`;
        const route = { kind: "missing", path };
        assert.deepEqual(readDriveRoute(href, id), route);
        assert.equal(driveRouteHref(href, id, route), href);
      }
    });
  }
}

test("bare files never acquires an explicit My Drive location", () => {
  for (const id of ["filespace", "filebox"]) {
    for (const hash of ["", "#", "#/", `#/template-preview/${id}`, `#/templates/${id}/`]) {
      assert.deepEqual(readDriveRoute(hash, id), { kind: "files" });
    }
  }
  assert.deepEqual(readDriveRoute("#/drive", "filespace"), {
    kind: "files",
    location: { kind: "view", view: "My Drive" },
  });
});

test("unrelated mounts are missing and valid encoded members retain the old slug rule", () => {
  assert.deepEqual(readDriveRoute("#/templates/echo/settings", "filespace"), {
    kind: "missing",
    path: "/templates/echo/settings",
  });
  assert.deepEqual(readDriveRoute("#/settings/team/alex%2Drivera/", "filespace"), {
    kind: "settings",
    section: "team",
    memberSlug: "alex-rivera",
  });
});
