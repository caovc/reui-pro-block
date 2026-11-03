import { expect, test, type Locator } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light" });

async function stable(root: Locator) {
  await expect
    .poll(() =>
      root.evaluate((element) => {
        const css = getComputedStyle(element);
        return {
          opacity: css.opacity,
          identity: css.transform === "none" || css.transform === "matrix(1, 0, 0, 1, 0, 0)",
          running: element
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "running" || a.pending).length,
        };
      }),
    )
    .toEqual({ opacity: "1", identity: true, running: 0 });
}

for (const width of [1440, 390]) {
  test(`Mesh viewport ${width}: real ScrollArea owns wheel, Footer matches and native Profile returns focus without page movement`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (e) => faults.push(e.message));
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) faults.push(m.text());
    });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/template-preview/mesh");
    const mobile = width === 390;
    const opener = page.getByRole("button", { name: "Open navigation", exact: true });
    const profile = page.getByRole("button", {
      name: "Open profile for Sienna Wells",
      exact: true,
    });
    if (mobile) {
      await opener.click();
      await stable(page.getByRole("dialog"));
    }
    await profile.click();
    await page.getByRole("menuitemradio", { name: "Dark theme", exact: true }).click();
    await page.getByRole("menu").press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    if (mobile) {
      await page.getByRole("dialog").press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".wf-header").hover();
    const viewport = page.locator('.wf-mesh-scroll > [data-slot="scroll-area-viewport"]');
    await expect(viewport).toBeVisible();
    const measure = await page.locator(".wf-root.wf-mesh").evaluate((root) => {
      const metric = (e: Element) => {
        const b = e.getBoundingClientRect(),
          s = getComputedStyle(e);
        return {
          x: b.x,
          y: b.y,
          w: b.width,
          h: b.height,
          clientW: e.clientWidth,
          scrollW: e.scrollWidth,
          clientH: e.clientHeight,
          scrollH: e.scrollHeight,
          padding: s.padding,
          border: s.borderWidth,
          bg: s.backgroundColor,
        };
      };
      return {
        root: metric(root),
        main: metric(root.querySelector('[data-slot="sidebar-inset"]')!),
        header: metric(root.querySelector(".wf-header")!),
        viewport: metric(
          root.querySelector('.wf-mesh-scroll > [data-slot="scroll-area-viewport"]')!,
        ),
        tableHeader: metric(root.querySelector(".wf-project-status th")!),
        card: metric(root.querySelector(".wf-project-status")!),
        document: {
          w: document.documentElement.scrollWidth,
          h: document.documentElement.scrollHeight,
          scrollY,
        },
      };
    });
    expect(measure.root.h).toBe(mobile ? 844 : 1000);
    expect(measure.main.h).toBe(mobile ? 844 : 1000);
    expect(measure.main.w).toBe(width - (mobile ? 0 : 49));
    expect(measure.header.y).toBe(0);
    expect(measure.header.h).toBe(48);
    expect(measure.header.w).toBe(width - (mobile ? 0 : 49));
    expect(measure.viewport.h).toBe(mobile ? 796 : 952);
    expect(measure.viewport.w).toBe(measure.viewport.clientW);
    expect(measure.viewport.scrollH).toBeGreaterThan(measure.viewport.clientH);
    expect(measure.document).toEqual({ w: width, h: mobile ? 844 : 1000, scrollY: 0 });
    expect(measure.tableHeader.bg).toBe(measure.card.bg);
    if (mobile) {
      await opener.click();
      await stable(page.getByRole("dialog"));
    }
    const account = page.locator(".wf-native-account:visible");
    const footer = account.locator("..");
    const footerBox = await footer.boundingBox();
    expect(footerBox?.height).toBe(84);
    expect(footerBox?.y).toBe(mobile ? 760 : 916);
    const help = page.getByRole("button", { name: "Help", exact: true });
    const helpBox = await help.boundingBox();
    const profileBox = await profile.boundingBox();
    expect([helpBox?.width, helpBox?.height, profileBox?.width, profileBox?.height]).toEqual([
      28, 28, 28, 28,
    ]);
    await expect(help).toHaveCSS("padding", "8px");
    await expect(profile).toHaveCSS("padding", "0px");
    await expect(profile).toHaveCSS("border-width", "1px");
    await writeFile(
      info.outputPath("viewport-footer.json"),
      JSON.stringify(
        { ...measure, footer: footerBox, help: helpBox, profile: profileBox },
        null,
        2,
      ),
    );
    await page.screenshot({ path: info.outputPath("mesh-layout.png") });
    if (mobile) {
      await page.getByRole("dialog").press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await viewport.hover({ position: { x: 40, y: 25 } });
    await page.mouse.wheel(0, 450);
    await expect.poll(() => viewport.evaluate((e) => e.scrollTop)).toBeGreaterThan(100);
    const scrollTop = await viewport.evaluate((e) => e.scrollTop);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect((await page.locator(".wf-header").boundingBox())?.y).toBe(0);
    if (mobile) {
      await opener.click();
      await stable(page.getByRole("dialog"));
    }
    await profile.click();
    await page.getByRole("menuitem", { name: "Profile", exact: false }).click();
    const dialog = page.getByRole("dialog", { name: "Profile", exact: true });
    await stable(dialog);
    const panel = await dialog.boundingBox();
    expect(panel?.width).toBe(mobile ? 366 : 960);
    expect(panel?.height).toBeCloseTo(mobile ? 742.71875 : 768, 1);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await dialog.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(mobile ? opener : profile).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect((await page.locator(".wf-header").boundingBox())?.y).toBe(0);
    expect(await viewport.evaluate((e) => e.scrollTop)).toBe(scrollTop);
    expect(faults).toEqual([]);
  });
}
