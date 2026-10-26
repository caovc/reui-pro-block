import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

test("Deploy Board default, copy, file and starter preserve the actual leaf and native free implementations", async ({
  page,
  context,
}, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/block/solutions/dev-ops/solution-dev-ops-7");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const leaf = "src/blocks/data/solution-dev-ops-variants/deploy-board.tsx";
  const expected = await readFile(leaf, "utf8");
  await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(leaf);
  const source = dialog.locator(".source-code");
  await expect(source).toContainText("function DeployBoard");
  await source.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  const filePending = page.waitForEvent("download");
  await source.getByRole("button", { name: "Download source file", exact: true }).click();
  const file = await filePending;
  expect(await readFile((await file.path())!, "utf8")).toBe(expected);
  const zipPending = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
  const download = await zipPending;
  await download.saveAs(info.outputPath("deploy-board.zip"));
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const name of [
    leaf,
    "src/blocks/data/solution-dev-ops-variants/deploy-board-data.ts",
    "src/blocks/data/solution-dev-ops-variants/deploy-board-model.ts",
    "src/blocks/data/solution-dev-ops-variants/deploy-board-sheet.tsx",
    "src/blocks/data/solution-dev-ops-variants/deploy-board.css",
    "src/blocks/data/solution-dev-ops-variants/split-flap.tsx",
    "src/blocks/data/solution-dev-ops-variants/canary-lever.tsx",
    "src/components/ui/slider.tsx",
    "src/components/ui/sheet.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/ui/alert-dialog.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/alert.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/timeline.tsx",
    "src/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard.ts",
  ]) {
    expect(files[name], name).toBeTruthy();
    expect(strFromU8(files[name]), name).toBe(await readFile(name, "utf8"));
  }
  expect(strFromU8(files["src/Example.tsx"])).toContain("solution-dev-ops-7");
  expect(Object.keys(files).some((name) => name.endsWith("REUI-LICENSE.txt"))).toBe(true);
  expect(
    Object.entries(files).some(
      ([name, bytes]) =>
        /LICENSE|OFL|NOTICES/.test(name) && /SIL OPEN FONT LICENSE/.test(strFromU8(bytes)),
    ),
  ).toBe(true);
});
