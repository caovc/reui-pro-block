import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light" });

async function stable(root: Locator) {
  await expect
    .poll(() =>
      root.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          opacity: style.opacity,
          identity: style.transform === "none" || style.transform === "matrix(1, 0, 0, 1, 0, 0)",
          running: element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === "running" || animation.pending).length,
        };
      }),
    )
    .toEqual({ opacity: "1", identity: true, running: 0 });
}

async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 80; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}

for (const width of [1440, 390]) {
  test(`Flowly sidebar layout ${width}: free menu density, compact footer and live native Seats progress`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    const writes: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) faults.push(message.text());
    });
    page.on("request", (request) => {
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(request.url());
    });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/template-preview/flowly");
    const mobile = width === 390;
    const opener = page.getByRole("button", { name: "Open navigation", exact: true });
    if (mobile) await opener.click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const nav = page.locator(
      mobile ? ".wf-mobile-secondary-navigation .fs-navigation" : ".fs-secondary .fs-navigation",
    );
    await nav.getByRole("button", { name: "Members", exact: true }).click();
    await expect(page.locator(".fs-workspace")).toHaveAttribute("data-settings-section", "members");
    await page.evaluate(() => document.fonts.ready);
    await stable(mobile ? page.getByRole("dialog") : nav);
    const footer = page.locator(".wf-native-account:visible").locator("..");
    const measured = await nav.evaluate((root) => {
      const rect = (element: Element) => {
        const box = element.getBoundingClientRect(),
          css = getComputedStyle(element);
        return {
          x: box.x,
          y: box.y,
          w: box.width,
          h: box.height,
          font: css.fontSize,
          line: css.lineHeight,
          padding: css.padding,
          gap: css.gap,
        };
      };
      const progress = root.querySelector('[role="progressbar"]')!;
      return {
        rows: Array.from(root.querySelectorAll('[data-slot="sidebar-menu-button"]')).map((row) => ({
          ...rect(row),
          text: row.textContent,
        })),
        summary: rect(root.querySelector(".fs-summary-members")!),
        progress: rect(progress),
        track: rect(progress.querySelector('[data-slot="progress-track"]')!),
        indicator: rect(progress.querySelector('[data-slot="progress-indicator"]')!),
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    const footerBox = await footer.boundingBox();
    await writeFile(
      info.outputPath("sidebar-layout.json"),
      JSON.stringify({ ...measured, footer: footerBox }, null, 2),
    );
    await page.screenshot({ path: info.outputPath("sidebar-layout.png") });
    expect(measured.documentWidth).toBe(width);
    expect(footerBox?.height).toBe(80);
    expect(footerBox?.y).toBe(mobile ? 764 : 912);
    const expectedY = mobile
      ? [
          31.7109375, 61.7109375, 91.7109375, 164.421875, 194.421875, 224.421875, 297.1328125,
          327.1328125, 399.84375, 429.84375,
        ]
      : [91.5, 121.5, 151.5, 225, 255, 285, 358.5, 388.5, 462, 492];
    expect(measured.rows).toHaveLength(10);
    for (const [index, row] of measured.rows.entries()) {
      expect(row.y).toBeCloseTo(expectedY[index], 1);
      expect(row.h).toBe(28);
      expect(row.font).toBe("12.8px");
      expect(row.padding).toBe("0px 10px");
      expect(row.gap).toBe("10px");
    }
    expect(measured.progress.h).toBe(8);
    expect(measured.track.h).toBe(4);
    expect(measured.indicator.h).toBe(4);
    expect(measured.indicator.w / measured.track.w).toBeCloseTo(0.6, 2);
    expect(measured.summary.h).toBe(73);
    const progress = nav.getByRole("progressbar", { name: "Seats: 60%", exact: true });
    await expect(progress).toHaveAttribute("aria-valuenow", "60");
    const general = nav.getByRole("button", { name: "General", exact: true });
    await tabTo(page, general);
    await page.keyboard.press("Enter");
    await expect(page.locator(".fs-workspace")).toHaveAttribute("data-settings-section", "general");
    await expect(nav.getByRole("progressbar")).toHaveCount(0);
    await nav.getByRole("button", { name: "Members", exact: true }).click();
    await expect(progress).toHaveAttribute("aria-valuenow", "60");
    if (mobile) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
    await page.getByRole("button", { name: "Invite member", exact: true }).click();
    await page.getByRole("textbox", { name: "Name", exact: true }).fill("Layout Example");
    await page.getByRole("textbox", { name: "Work Email", exact: true }).fill("layout@brick.test");
    await page.getByRole("button", { name: "Send Invite", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    if (mobile) await opener.click();
    await expect(nav.getByRole("progressbar", { name: "Seats: 70%", exact: true })).toHaveAttribute(
      "aria-valuenow",
      "70",
    );
    const ratio = () =>
      nav
        .locator('[data-slot="progress-track"]')
        .evaluate(
          (track) =>
            track.querySelector('[data-slot="progress-indicator"]')!.getBoundingClientRect().width /
            track.getBoundingClientRect().width,
        );
    await stable(nav);
    await expect.poll(ratio).toBeCloseTo(0.7, 2);
    const invitedRatio = await ratio();
    if (mobile) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Demo invitation added" })
      .getByRole("button", { name: "Undo", exact: true })
      .click();
    if (mobile) await opener.click();
    await expect(progress).toHaveAttribute("aria-valuenow", "60");
    await stable(nav);
    await expect.poll(ratio).toBeCloseTo(0.6, 2);
    await writeFile(
      info.outputPath("seats-transition.json"),
      JSON.stringify({ invitedRatio, undoneRatio: await ratio() }),
    );
    if (mobile) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
    expect(faults).toEqual([]);
    expect(writes).toEqual([]);
  });
}
