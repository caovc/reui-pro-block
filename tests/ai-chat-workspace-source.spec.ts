import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
const leaves = ["ai-chat-quote-sidebar", "ai-chat-connected-apps", "ai-chat-task-panel"];
const modules = [
  ...leaves.map((name) => `${name}.tsx`),
  "ai-chat-quote-model.ts",
  "ai-chat-connected-model.ts",
  "ai-chat-task-model.ts",
  "ai-chat-task-brief.tsx",
  "ai-chat-workspace-composer.tsx",
  "ai-chat-workspace-transcript.tsx",
  "ai-chat-workspace-variants.tsx",
];

test("Chat4–6 code drawers default to the actual leaf and copy/download its exact bytes", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const [offset, leaf] of leaves.entries()) {
    await page.goto(`./#/block/ai-agents/ai-chat/ai-chat-${offset + 4}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const filename = `src/blocks/data/${leaf}.tsx`;
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

for (const id of [5, 6]) {
  test(`actual Chat ${id} starter includes scoped controllers and the actual free Sidebar, Trace, Questionnaire, Frame and message implementations`, async ({
    page,
  }, testInfo) => {
    await page.goto(`./#/block/ai-agents/ai-chat/ai-chat-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const downloaded = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download starter", exact: true }).click();
    const file = await downloaded;
    await file.saveAs(testInfo.outputPath(`ai-chat-workspace-${id}-starter.zip`));
    const zip = unzipSync(new Uint8Array(await readFile((await file.path())!)));
    for (const filename of [
      ...modules.map((name) => `src/blocks/data/${name}`),
      "src/blocks/data/ai-chat-session.ts",
      "src/blocks/data/ai-chat-draft.ts",
      "src/blocks/data/ai-chat-history.tsx",
      "src/components/ui/questionnaire.tsx",
      "src/components/ui/trace.tsx",
      "src/components/ui/combobox.tsx",
      "src/components/ui/item.tsx",
      "src/components/ui/command.tsx",
      "src/components/ui/message.tsx",
      "src/components/ui/bubble.tsx",
      "src/components/ui/attachment.tsx",
      "src/components/ui/message-scroller.tsx",
      "src/components/ui/sidebar.tsx",
      "src/components/reui/sidebar.tsx",
      "src/components/reui/frame.tsx",
      "src/components/reui/code-block/code-block.tsx",
      "src/components/reui/badge.tsx",
      "src/components/reui/REUI-LICENSE.txt",
      "THIRD_PARTY_NOTICES.md",
    ]) {
      expect(zip[filename], filename).toBeTruthy();
      expect(strFromU8(zip[filename]), filename).toBe(await readFile(filename, "utf8"));
    }
    expect(strFromU8(zip["src/main.tsx"]).trimStart()).toMatch(/^import ["']\.\/theme\.css["'];/);
    expect(strFromU8(zip["THIRD_PARTY_NOTICES.md"])).toContain("Copyright (c) 2023 shadcn");
    expect(strFromU8(zip["src/blocks/data/ai-chat-connected-apps.tsx"])).toContain(
      "(app: (typeof WORK_APPS)[number]) =>",
    );
    await testInfo.attach("starter-files", {
      body: JSON.stringify(Object.keys(zip).sort(), null, 2),
      contentType: "application/json",
    });
  });
}

test("three independent workspace layouts retain actual styled controls at desktop and narrow widths", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 });
    for (const id of [4, 5, 6]) {
      await page.goto(`./#/preview/ai-agents/ai-chat/ai-chat-${id}`);
      if (width === 390 && id !== 5)
        await page
          .getByRole("button", {
            name: id === 4 ? "Toggle quote assistant" : "Toggle task assistant",
            exact: true,
          })
          .click();
      if (width === 390 && id !== 5) {
        const bounds = await page.getByRole("dialog").boundingBox();
        expect(bounds?.width).toBeCloseTo(390, 2);
      }
      const scope =
        width === 390 && id !== 5 ? page.getByRole("dialog") : page.locator("[data-ai-chat]");
      if (width === 390 && id !== 5) {
        await expect(scope.getByRole("button", { name: "Close", exact: true })).toHaveCount(1);
        await expect(
          scope.getByRole("button", {
            name: id === 4 ? "Close quote assistant" : "Close task assistant",
            exact: true,
          }),
        ).not.toBeVisible();
      }
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
      expect(style.opacity).toBe("1");
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
  expect(errors).toEqual([]);
});
