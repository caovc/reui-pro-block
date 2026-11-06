import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ colorScheme: "light", deviceScaleFactor: 1 });

async function tabTo(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 20; attempt++) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element.ownerDocument.activeElement === element)) return;
  }
  await expect(target, "Control must be reachable with native Tab navigation").toBeFocused();
}

async function settledStyle(control: Locator) {
  return control.evaluate(async (element) => {
    const animations = element.getAnimations().filter((animation) => {
      const endTime = animation.effect?.getComputedTiming().endTime;
      return typeof endTime === "number" && Number.isFinite(endTime);
    });
    await Promise.allSettled(animations.map((animation) => animation.finished));
    const style = getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      selected: element.getAttribute("aria-selected"),
      shadow: style.boxShadow,
      background: style.backgroundColor,
      color: style.color,
      radius: style.borderRadius,
      ringColor: style.getPropertyValue("--tw-ring-color"),
    };
  });
}

function expectVisibleNativeRing(style: Awaited<ReturnType<typeof settledStyle>>, label: string) {
  expect.soft(style.focusVisible, `${label}: native keyboard focus-visible must match`).toBe(true);
  expect.soft(style.selected, `${label}: focused team must be the selected team`).toBe("true");
  const layers = style.shadow.split(/,(?![^()]*\))/);
  const ring = layers.find((layer) => layer.includes("0px 0px 0px 3px"));
  expect
    .soft(ring, `${label}: selected tab must retain its visible native 3px focus ring`)
    .toBeTruthy();
  if (ring) {
    expect
      .soft(ring, `${label}: ring layer must not be transparent`)
      .not.toContain("rgba(0, 0, 0, 0)");
  }
}

test("Pricing3 native keyboard focus stays visible on selected team tabs at desktop and 390px", async ({
  page,
}, testInfo) => {
  const observations: unknown[] = [];
  try {
    for (const viewport of [
      { width: 1280, height: 1100 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("about:blank");
      await page.goto(process.env.PRICING3_URL || "./#/preview/marketing/pricing/pricing-3");
      const root = page.locator('[data-pricing-variant="3"]');
      await expect(root).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const startup = root.getByRole("tab", { name: "Startup", exact: true });
      const growth = root.getByRole("tab", { name: "Growth", exact: true });
      await expect(startup).toHaveAttribute("aria-selected", "true");
      await tabTo(page, startup);
      const startupStyle = await settledStyle(startup);
      const rootColors = await root.evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
        color: getComputedStyle(element).color,
      }));
      expectVisibleNativeRing(startupStyle, `${viewport.width}px Startup`);
      expect.soft(startupStyle.background).toBe(rootColors.background);
      expect.soft(startupStyle.color).toBe(rootColors.color);
      expect.soft(startupStyle.radius).toBe("8px");
      expect(
        await root
          .getByRole("tablist", { name: "Choose your team size" })
          .evaluate((element) => getComputedStyle(element).borderRadius),
      ).toBe("10px");

      await page.keyboard.down("ArrowRight");
      await expect(growth).toBeFocused();
      await expect(growth).toHaveAttribute("aria-selected", "true");
      await page.keyboard.up("ArrowRight");
      await page.keyboard.press("Space");
      const growthStyle = await settledStyle(growth);
      expectVisibleNativeRing(growthStyle, `${viewport.width}px Growth after ArrowRight/Space`);
      const desktop = viewport.width >= 768;
      const surface = desktop
        ? root.getByRole("table", { name: "Compare pricing plans" })
        : root.locator(".psp-mobile-card").nth(1);
      await expect(surface.locator('[data-plan-price="pro"] .psp-price-number')).toHaveText("$360");
      const card = desktop
        ? root.locator(".psp-desktop-card")
        : root.locator(".psp-mobile-card").first();
      expect(await card.evaluate((element) => getComputedStyle(element).borderRadius)).toBe("14px");
      await expect(
        root.getByRole("button", { name: "Included in your package", exact: true }),
      ).toBeDisabled();
      await expect(
        root.getByRole("button", { name: "Current Package", exact: true }),
      ).toBeDisabled();
      observations.push({ viewport, url: page.url(), startupStyle, growthStyle, rootColors });
      await page.screenshot({
        path: testInfo.outputPath(`${viewport.width}-keyboard-selected.png`),
      });

      if (desktop) {
        const help = root.getByRole("button", { name: "About Analyst seats", exact: true });
        await tabTo(page, help);
        const tooltip = page.locator('[data-slot="tooltip-content"]:not([data-state="closed"])');
        await expect(tooltip).toHaveText(
          "Viewers who only read shared dashboards never take a seat.",
        );
        expect(await tooltip.evaluate((element) => getComputedStyle(element).fontFamily)).toContain(
          "Inter",
        );
        await page.keyboard.press("Escape");
        await expect(help).toBeFocused();
      }
    }
  } finally {
    const path = testInfo.outputPath("native-focus-observations.json");
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(observations, null, 2), "utf8");
    await testInfo.attach("native-focus-observations", { path, contentType: "application/json" });
  }
});
