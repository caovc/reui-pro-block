import { expect, test } from "@playwright/test";

test.use({ deviceScaleFactor: 1, colorScheme: "light", reducedMotion: "reduce" });

test("Pricing 8 uses semantic Badge skin, native rail density and native scrollbar geometry", async ({
  page,
}) => {
  for (const [width, height] of [
    [1440, 1100],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("./#/preview/marketing/pricing/pricing-8");
    const dialog = page.getByRole("dialog", { name: "Pick Your Plan", exact: true });
    await expect(dialog).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await dialog.evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
    expect(await page.evaluate(() => devicePixelRatio)).toBe(1);
    const badge = dialog.getByText("Most Popular", { exact: true });
    const skin = await badge.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        image: style.backgroundImage,
        origin: style.backgroundOrigin,
        background: style.backgroundColor,
        shadow: style.boxShadow,
      };
    });
    expect(skin.image).toContain("to right in oklch");
    expect(skin.origin).toBe("border-box");
    expect(skin.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(skin.shadow).toMatch(/0\.25\) 0px 1px 3px 0px/);
    expect(skin.shadow).toMatch(/0\.25\) 0px 1px 2px -1px/);
    if (width < 768) {
      await expect(dialog.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
      for (const item of await dialog.locator(".pu8-rail-item").all()) {
        expect(
          await item
            .locator('[data-slot="item-description"]')
            .evaluate((element) => getComputedStyle(element).lineHeight),
        ).toBe("18px");
        const itemBox = await item.boundingBox();
        const mediaBox = await item.locator('[data-slot="item-media"]').boundingBox();
        expect(mediaBox!.y + mediaBox!.height / 2).toBeCloseTo(itemBox!.y + itemBox!.height / 2, 2);
      }
    }
    const track = dialog.locator('[data-slot="scroll-area-scrollbar"]');
    const thumb = dialog.locator('[data-slot="scroll-area-thumb"]');
    expect((await track.boundingBox())?.width).toBe(10);
    expect((await thumb.boundingBox())?.width).toBe(7);
    const thumbColor = await thumb.evaluate((element) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      context.fillStyle = getComputedStyle(element).backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    });
    expect(thumbColor).toEqual([229, 229, 229, 255]);
    const header = dialog.locator('[data-slot="dialog-header"]');
    const footer = dialog.locator('[data-slot="dialog-footer"]');
    const headerBefore = await header.boundingBox();
    const footerBefore = await footer.boundingBox();
    const viewport = dialog.locator('[data-slot="scroll-area-viewport"]');
    await viewport.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
    expect(await header.boundingBox()).toEqual(headerBefore);
    expect(await footer.boundingBox()).toEqual(footerBefore);
    await expect(dialog.locator('[data-feature="support"] td:visible').last()).toBeVisible();
  }
});
