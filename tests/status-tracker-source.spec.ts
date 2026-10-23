import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const cases = [
  [34, "cron-run-history", "CronRunHistory", "Cron Run History"],
  [38, "release-lanes", "ReleaseLanes", "Release Lanes"],
  [39, "deploy-history", "DeployHistory", "Deploy History"],
] as const;

test("all three status code drawers default to the actual implementation and copy full source", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const [id, module, component, title] of cases) {
    await page.goto(`./#/block/chart/status-tracker/chart-${id}`);
    await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const filename = `src/blocks/data/${module}.tsx`;
    const selector = dialog.getByRole("combobox", { name: "Source file" });
    await selector.waitFor({ state: "visible" });
    await expect(selector).toHaveText(filename);
    const code = dialog.locator(".source-code");
    await expect(code).toContainText(`function ${component}`);
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(await readFile(filename, "utf8"));
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  }
});

test("status starter ZIP contains the real three-entry router and official free dependencies", async ({
  page,
}, testInfo) => {
  await page.goto("./#/block/chart/status-tracker/chart-34");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const file = await download;
  await file.saveAs(testInfo.outputPath("status-starter.zip"));
  const entries = unzipSync(new Uint8Array(await readFile((await file.path())!)));
  for (const filename of [
    "src/blocks/data/status-tracker.tsx",
    "src/blocks/data/status-tracker-data.ts",
    "src/blocks/data/status-tracker-primitives.tsx",
    "src/blocks/data/cron-run-history.tsx",
    "src/blocks/data/release-lanes.tsx",
    "src/blocks/data/deploy-history.tsx",
    "src/blocks/data/sparkline-primitives.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/icon-tile.tsx",
    "src/components/reui/REUI-LICENSE.txt",
    "src/components/ui/hover-card.tsx",
    "src/components/ui/progress.tsx",
    "src/components/ui/alert-dialog.tsx",
  ]) {
    expect(entries[filename], filename).toBeTruthy();
    expect(strFromU8(entries[filename]), filename).toBe(await readFile(filename, "utf8"));
  }
  expect(strFromU8(entries["src/Example.tsx"])).toContain("DataBlock");
});
