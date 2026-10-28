import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { unzipSync } from "fflate";

test("AppShell 1 saves its actual starter ZIP with the current theme module", async ({
  page,
}, testInfo) => {
  await page.goto("./#/block/application/app-shell/app-shell-1");
  await expect(
    page.frameLocator("iframe").getByRole("button", { name: "Overview", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("app-shell-1.zip");
  const saved = testInfo.outputPath("app-shell-1.zip");
  await download.saveAs(saved);
  const files = unzipSync(await readFile(saved));
  const source = files["src/components/site/preview-theme.ts"];
  expect(source).toBeDefined();
  expect(Buffer.from(source)).toEqual(await readFile("src/components/site/preview-theme.ts"));
  // The saved original UI ZIP is handed to the coordinator for serial strict/runtime QA.
});
