import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

const leaf = "src/blocks/data/solution-map-variants/dispatch-map.tsx";
async function source(page: Page) {
  await page.goto("./#/block/solutions/map/solution-map-1");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toContainText(
    leaf,
  );
  return dialog;
}

test("Dispatch Map defaults to its actual implementation leaf", async ({ page }) => {
  const dialog = await source(page);
  await expect(dialog.locator(".source-code")).toContainText("function DispatchWorkspace");
  await expect(dialog.locator(".source-code")).toContainText("FleetMap");
});

test("Dispatch Map Copy preserves the selected leaf UTF8 bytes", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const dialog = await source(page);
  const expected = await readFile(leaf, "utf8");
  await dialog.locator(".source-code").getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
});

test("Dispatch Map single source download is the same current implementation", async ({ page }) => {
  const dialog = await source(page);
  const expected = await readFile(leaf, "utf8");
  const pending = page.waitForEvent("download");
  await dialog
    .locator(".source-code")
    .getByRole("button", { name: "Download source file", exact: true })
    .click();
  expect(await readFile((await (await pending).path())!, "utf8")).toBe(expected);
});

test("Dispatch Map actual UI starter includes the SDK worker composition, real free sources and notices", async ({
  page,
}, info) => {
  const dialog = await source(page);
  const pending = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
  const download = await pending;
  await download.saveAs(info.outputPath("dispatch-map-starter.zip"));
  const zip = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const filename of [
    leaf,
    "src/blocks/data/solution-map-variants/dispatch-map.css",
    "src/blocks/data/solution-map-variants/fleet-model.ts",
    "src/blocks/data/solution-map-variants/fleet-data.ts",
    "src/blocks/data/solution-map-variants/fleet-map.tsx",
    "src/blocks/data/solution-map-variants/fleet-context.ts",
    "src/blocks/data/solution-map-variants/fleet-focus.ts",
    "src/blocks/data/solution-map-variants/fleet-grid.tsx",
    "src/blocks/data/solution-map-variants/fleet-time.ts",
    "src/blocks/data/solution-map-variants/vehicle-artwork.tsx",
    "src/blocks/data/solution-map-variants/stop-actions.tsx",
    "src/lib/maplibre-runtime.ts",
    "src/components/reui/frame.tsx",
    "src/components/reui/data-grid/data-grid.tsx",
    "src/components/reui/filters/filters.tsx",
    "src/components/reui/cascader/cascader.tsx",
    "src/components/reui/timeline.tsx",
    "src/components/reui/number-field.tsx",
    "src/components/brand-mark.tsx",
    "src/blocks/reference.css",
    "src/blocks/assets/Inter-LICENSE.txt",
    "THIRD_PARTY_NOTICES.md",
  ]) {
    expect(zip[filename], filename).toBeDefined();
    expect(strFromU8(zip[filename]), filename).toBe(await readFile(filename, "utf8"));
  }
  const runtime = strFromU8(zip["src/lib/maplibre-runtime.ts"]);
  expect(runtime).toContain("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url");
  expect(runtime).toContain("maplibre-gl/dist/maplibre-gl.css");
  expect(runtime).toContain("setWorkerUrl(workerUrl)");
  expect(JSON.parse(strFromU8(zip["package.json"])).dependencies["maplibre-gl"]).toBe("6.16.0");
  expect(strFromU8(zip["THIRD_PARTY_NOTICES.md"])).toContain("MapLibre contributors");
  expect(Object.keys(zip).some((path) => path.endsWith("REUI-LICENSE.txt"))).toBe(true);
  expect(strFromU8(zip["src/blocks/assets/Inter-LICENSE.txt"])).toContain(
    "SIL OPEN FONT LICENSE Version 1.1",
  );
  expect(strFromU8(zip["src/blocks/assets/Inter-LICENSE.txt"])).toContain(
    "Copyright (c) 2016 The Inter Project Authors",
  );
  expect(Object.keys(zip).some((path) => /tests\/|playwright|node_modules/.test(path))).toBe(false);
});
