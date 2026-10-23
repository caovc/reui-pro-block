import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const entries = ["copilot", "docked", "welcome"];
const modules = [
  "ai-chat-session.ts",
  "ai-chat-draft.ts",
  "ai-chat-composer.tsx",
  "ai-chat-questionnaire.tsx",
  "ai-chat-transcript.tsx",
  "ai-chat-history.tsx",
  "ai-chat-copilot.tsx",
  "ai-chat-welcome.tsx",
  "ai-chat-docked.tsx",
  "ai-chat-initial-variants.tsx",
];

test("all three chat code drawers copy and download their actual independent leaf", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const [index, name] of entries.entries()) {
    await page.goto(`./#/block/ai-agents/ai-chat/ai-chat-${index + 1}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const filename = `src/blocks/data/ai-chat-${name}.tsx`;
    await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(filename);
    const expected = await readFile(filename, "utf8");
    await dialog.locator(".source-code").getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const download = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download source file", exact: true }).click();
    expect(await readFile((await (await download).path())!, "utf8")).toBe(expected);
    await page.keyboard.press("Escape");
  }
});

test("actual chat starter includes its complete implementation, official Questionnaire and free chat primitives", async ({
  page,
}, testInfo) => {
  await page.goto("./#/block/ai-agents/ai-chat/ai-chat-3");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const file = await downloaded;
  await file.saveAs(testInfo.outputPath("ai-chat-welcome-starter.zip"));
  const zip = unzipSync(new Uint8Array(await readFile((await file.path())!)));
  for (const filename of [
    ...modules.map((name) => `src/blocks/data/${name}`),
    "src/components/ui/questionnaire.tsx",
    "src/components/ui/message.tsx",
    "src/components/ui/bubble.tsx",
    "src/components/ui/message-scroller.tsx",
    "src/components/ui/attachment.tsx",
    "src/components/ui/input-group.tsx",
    "src/components/ui/sheet.tsx",
    "src/components/reui/icon-stack.tsx",
    "src/components/reui/icon-tile.tsx",
    "src/components/reui/code-block/code-block.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/REUI-LICENSE.txt",
  ]) {
    expect(zip[filename], filename).toBeTruthy();
    expect(strFromU8(zip[filename]), filename).toBe(await readFile(filename, "utf8"));
  }
  expect(strFromU8(zip["src/main.tsx"]).trimStart()).toMatch(/^import ["']\.\/theme\.css["'];/);
  expect(strFromU8(zip["src/components/ui/questionnaire.tsx"])).toContain(
    "@shadcn/react/questionnaire",
  );
  expect(strFromU8(zip["src/blocks/data/ai-chat-transcript.tsx"])).toContain(
    "markdownFences(body)",
  );
  await testInfo.attach("starter-files", {
    body: JSON.stringify(Object.keys(zip).sort(), null, 2),
    contentType: "application/json",
  });
});

test("local desktop and narrow layouts retain styled composer, transcript and original media", async ({
  page,
}, testInfo) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 });
    for (const id of [1, 2, 3]) {
      await page.goto(`./#/preview/ai-agents/ai-chat/ai-chat-${id}`);
      await expect(page.locator("[data-ai-chat]")).toBeVisible();
      const sheet = page.getByRole("dialog", { name: "Document assistant", exact: true });
      const scope = id === 2 && width === 390 ? sheet : page.locator("[data-ai-chat]");
      const composer = scope.locator('[data-slot="input-group"]');
      await expect(composer).toBeVisible();
      const style = await composer.evaluate((node) => {
        const css = getComputedStyle(node);
        return {
          opacity: css.opacity,
          border: css.borderTopWidth,
          radius: css.borderRadius,
          width: node.getBoundingClientRect().width,
        };
      });
      expect(parseFloat(style.opacity)).toBe(1);
      expect(parseFloat(style.border)).toBeGreaterThan(0);
      expect(parseFloat(style.radius)).toBeGreaterThan(0);
      expect(style.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      );
      expect(await page.locator('img[src*="reui.io"],img[src*="keenthemes"]').count()).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath(`chat-${id}-${width}.png`),
        animations: "disabled",
      });
      await testInfo.attach(`chat-${id}-${width}-computed`, {
        body: JSON.stringify(style),
        contentType: "application/json",
      });
    }
  }
});
