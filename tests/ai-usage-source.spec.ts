import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
const entries = [
  "ai-usage-planner",
  "ai-usage-spend-map",
  "ai-usage-edge-nodes",
  "ai-usage-local-models",
];
test("all usage code drawers show and copy their actual leaf implementation", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const [index, name] of entries.entries()) {
    await page.goto(`./#/block/ai-agents/ai-usage/ai-usage-${index + 1}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const filename = `src/blocks/data/${name}.tsx`;
    await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(filename);
    await dialog.locator(".source-code").getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(await readFile(filename, "utf8"));
    await page.keyboard.press("Escape");
  }
});
test("actual usage starter preserves independent implementations and official free dependencies", async ({
  page,
}, testInfo) => {
  await page.goto("./#/block/ai-agents/ai-usage/ai-usage-4");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const file = await download;
  await file.saveAs(testInfo.outputPath("ai-usage-starter.zip"));
  const zip = unzipSync(new Uint8Array(await readFile((await file.path())!)));
  for (const filename of [
    ...entries.map((name) => `src/blocks/data/${name}.tsx`),
    "src/blocks/data/ai-usage-variants.tsx",
    "src/blocks/data/ai-usage-model.ts",
    "src/blocks/data/ai-usage-hardware-scene.tsx",
    "src/blocks/data/reui-free-chart-primitives.tsx",
    "src/blocks/data/sparkline-primitives.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/alert.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/REUI-LICENSE.txt",
    "src/components/ui/slider.tsx",
  ]) {
    expect(zip[filename], filename).toBeTruthy();
    expect(strFromU8(zip[filename]), filename).toBe(await readFile(filename, "utf8"));
  }
  expect(strFromU8(zip["src/main.tsx"]).trimStart()).toMatch(/^import ["']\.\/theme\.css["'];/);
});
