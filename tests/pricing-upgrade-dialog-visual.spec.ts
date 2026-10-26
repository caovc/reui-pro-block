import { expect, test, type Locator } from "@playwright/test";
import { attachFontRenderDiagnostics, measureReferenceText } from "./font-render-diagnostics";

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
    const typography = await title.evaluate((element) => {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      const entryBounds = element.closest(".pud-entry")!.getBoundingClientRect();
      return {
        tracking: style.letterSpacing,
        width: bounds.width,
        height: bounds.height,
        font: style.fontFamily,
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        horizontalCenterDifference: Math.abs(
          bounds.x + bounds.width / 2 - (entryBounds.x + entryBounds.width / 2),
        ),
      };
    });
    expect
      .soft(typography.font, `${prefix} title uses the loaded reference font`)
      .toContain("Inter");
    expect.soft(typography.tracking, `${prefix} official EmptyTitle tracking`).toBe("-0.35px");
    const titleDiagnostics = await attachFontRenderDiagnostics(
      page,
      testInfo,
      `${prefix}-pricing7-empty-title`,
      '.pud-entry [data-slot="empty-title"]',
    );
    expect.soft(typography, `${prefix} title retains official font parameters`).toMatchObject({
      fontWeight: "500",
      fontSize: "14px",
      lineHeight: "20px",
      height: 20,
    });
    expect
      .soft(typography.horizontalCenterDifference, `${prefix} closed title stays centered`)
      .toBeLessThan(0.1);

    const reference = await measureReferenceText(
      page,
      testInfo,
      `${prefix}-pricing7-independent-reference`,
      "pricing-upgrade-title",
    );
    expect
      .soft(reference.text, `${prefix} fixed official reference literal`)
      .toBe("Upgrade Your Plan");
    expect.soft(reference.computed, `${prefix} independent reference styling`).toMatchObject({
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: "500",
      fontSize: "14px",
      lineHeight: "20px",
      letterSpacing: "-0.35px",
      padding: "0px",
      borderWidth: "0px",
    });
    expect.soft(reference.height, `${prefix} independent reference line box`).toBe(20);
    const expectedFontEvidence = {
      platformFonts: {
        fonts: [{ familyName: "Inter", isCustomFont: true, glyphCount: 17 }],
      },
      buildFontFiles: [
        {
          bytes: 48432,
          sha256: "c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4",
        },
      ],
    };
    expect
      .soft(titleDiagnostics, `${prefix} actual title uses the verified custom Inter file`)
      .toMatchObject(expectedFontEvidence);
    expect
      .soft(reference.diagnostics, `${prefix} reference uses the verified custom Inter file`)
      .toMatchObject(expectedFontEvidence);
    // Historical Mac golden: 119.078125px. Native platform metrics are recorded separately.
    expect
      .soft(typography.width, `${prefix} title matches independent same-platform reference width`)
      .toBeCloseTo(reference.width, 2);
    await page.screenshot({
      path: testInfo.outputPath(`${viewport.width}-closed.png`),
      fullPage: true,
    });
    await testInfo.attach(`${prefix}-computed`, {
      body: JSON.stringify({ viewport, media, focused, typography, reference }, null, 2),
      contentType: "application/json",
    });
  }
});
