import assert from "node:assert/strict";
import test from "node:test";
import {
  driveRouteHref,
  readDriveRoute,
} from "../src/templates/collaboration/drive-route-model.ts";

for (const id of ["filespace", "filebox"])
  for (const prefix of ["templates", "template-preview", "standalone"])
    test(`${id} ${prefix} keeps its mount and exact theme query through nested routes`, () => {
      const base = prefix === "standalone" ? "" : `/${prefix}/${id}`;
      const query = "?theme=Serif%2Bblue%2Fv1&radius=0.75&token=a%3Fb%26c";
      const root = `#${base || "/"}${query}`;
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
        const href = driveRouteHref(detail, id, { kind });
        assert.equal(href, `#${base}/${kind}${query}`);
        assert.deepEqual(readDriveRoute(href, id), { kind });
      }
    });

test("invalid and unrelated paths do not masquerade as settings or throw", () => {
  for (const hash of [
    "",
    "#",
    "#/",
    "#/settings/unknown",
    "#/settings/billing/member",
    "#/settings/team/%E0%A4%A",
    "#/settings/team/a%2Fb",
    "#/templates/echo/settings",
  ])
    assert.deepEqual(readDriveRoute(hash, "filespace"), { kind: "files" });
  assert.deepEqual(readDriveRoute("#/settings/team/alex-rivera/", "filespace"), {
    kind: "settings",
    section: "team",
    memberSlug: "alex-rivera",
  });
});
