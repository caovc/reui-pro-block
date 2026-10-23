import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const entries = ["approval", "feed", "research", "audit", "outcome"];
test("all five activity code drawers copy and download their real dedicated leaf", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const [index, name] of entries.entries()) {
    await page.goto(`./#/block/ai-agents/agent-activity/agent-activity-${index + 1}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const filename = `src/blocks/data/agent-activity-${name}.tsx`;
    await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(filename);
    const expected = await readFile(filename, "utf8");
    await dialog.locator(".source-code").getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const downloaded = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download source file", exact: true }).click();
    expect(await readFile((await (await downloaded).path())!, "utf8")).toBe(expected);
    await page.keyboard.press("Escape");
  }
});

test("actual activity starter includes dedicated leaves, official primitives, licenses and theme-first CSS", async ({
  page,
}, testInfo) => {
  await page.goto("./#/block/ai-agents/agent-activity/agent-activity-5");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const file = await downloaded;
  await file.saveAs(testInfo.outputPath("agent-activity-starter.zip"));
  const zip = unzipSync(new Uint8Array(await readFile((await file.path())!)));
  for (const filename of [
    ...entries.map((name) => `src/blocks/data/agent-activity-${name}.tsx`),
    "src/blocks/data/agent-activity-model.ts",
    "src/blocks/data/agent-activity-variants.tsx",
    "src/components/ui/trace.tsx",
    "src/components/ui/marker.tsx",
    "src/components/ui/collapsible.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/timeline.tsx",
    "src/components/reui/code-block/code-block.tsx",
    "src/components/reui/REUI-LICENSE.txt",
  ]) {
    expect(zip[filename], filename).toBeTruthy();
    expect(strFromU8(zip[filename]), filename).toBe(await readFile(filename, "utf8"));
  }
  expect(strFromU8(zip["src/main.tsx"]).trimStart()).toMatch(/^import ["']\.\/theme\.css["'];/);
});
