import { expect, test, type Locator } from "@playwright/test";
import { attachFontRenderDiagnostics } from "./font-render-diagnostics";

async function finishEntryAnimation(dialog: Locator) {
  await dialog.evaluate(async (element) => {
    await document.fonts.ready;
    const finiteAnimations = element.getAnimations().filter((animation) => {
      const endTime = animation.effect?.getComputedTiming().endTime;
      return typeof endTime === "number" && Number.isFinite(endTime);
    });
    await Promise.allSettled(finiteAnimations.map((animation) => animation.finished));
  });
}

test("pricing 7 preserves reference title tracking, centered media and native selected-tab focus layers", async ({
  page,
}, testInfo) => {
  for (const viewport of [
    { width: 1440, height: 1100 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("about:blank");
    await page.goto("./#/preview/marketing/pricing/pricing-7");
    const dialog = page.getByRole("dialog", { name: "Choose Your Plan", exact: true });
    await expect(dialog).toBeVisible();
    await finishEntryAnimation(dialog);
    const prefix = `${viewport.width}px`;

    const media = await dialog.locator('[data-slot="item"]').evaluateAll((items) =>
      items.map((item) => {
        const media = item.querySelector<HTMLElement>('[data-slot="item-media"]')!;
        const cardRect = item.getBoundingClientRect();
        const mediaRect = media.getBoundingClientRect();
        return {
          name: item.querySelector('[data-slot="item-title"]')?.textContent,
          verticalCenterDifference: Math.abs(
            mediaRect.y + mediaRect.height / 2 - (cardRect.y + cardRect.height / 2),
          ),
          translate: getComputedStyle(media).translate,
        };
      }),
    );
    expect.soft(media, `${prefix} must retain three actual plan cards`).toHaveLength(3);
    for (const item of media) {
      expect
        .soft(item.verticalCenterDifference, `${prefix} ${item.name} ItemMedia vertical center`)
        .toBeLessThan(0.1);
    }

    const monthly = dialog.getByRole("tab", { name: "Monthly", exact: true });
    await page.keyboard.press("Tab");
    await monthly.focus();
    await expect(monthly).toBeFocused();
    await expect(monthly).toHaveAttribute("aria-selected", "true");
    await finishEntryAnimation(monthly);
    const focused = await monthly.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        shadow: style.boxShadow,
        outline: style.outline,
        outlineOffset: style.outlineOffset,
      };
    });
    expect
      .soft(focused.shadow, `${prefix} free Tabs must retain its native 3px focus ring`)
      .toContain("0px 0px 0px 3px");
    expect
      .soft(focused.shadow, `${prefix} active elevation must retain -1px spread`)
      .toContain("0px 1px 2px -1px");
    // Shared global outline is deliberately recorded, not asserted as repaired.
    await page.screenshot({
      path: testInfo.outputPath(`${viewport.width}-focused.png`),
      fullPage: true,
    });

    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const title = page.locator('.pud-entry [data-slot="empty-title"]');
    await expect(title).toHaveText("Upgrade Your Plan");
    const typography = await title.evaluate((element) => ({
      tracking: getComputedStyle(element).letterSpacing,
      width: element.getBoundingClientRect().width,
      font: getComputedStyle(element).fontFamily,
    }));
    expect
      .soft(typography.font, `${prefix} title uses the loaded reference font`)
      .toContain("Inter");
    expect.soft(typography.tracking, `${prefix} official EmptyTitle tracking`).toBe("-0.35px");
    await attachFontRenderDiagnostics(
      page,
      testInfo,
      `${prefix}-pricing7-empty-title`,
      '.pud-entry [data-slot="empty-title"]',
    );
    expect.soft(typography.width, `${prefix} reference title width`).toBeCloseTo(119.078125, 2);
    await page.screenshot({
      path: testInfo.outputPath(`${viewport.width}-closed.png`),
      fullPage: true,
    });
    await testInfo.attach(`${prefix}-computed`, {
      body: JSON.stringify({ viewport, media, focused, typography }, null, 2),
      contentType: "application/json",
    });
  }
});
