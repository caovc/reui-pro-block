import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light" });

async function tabTo(page: Page, target: Locator) {
  for (let step = 0; step < 80; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}

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

for (const id of ["filespace", "filebox"] as const) {
  for (const width of [1440, 390]) {
    test(`${id} secondary sidebar ${width}: fixed native sections, real links and keyboard routing`, async ({
      page,
    }, info) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) faults.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`/#/template-preview/${id}`);
      if (id === "filebox") {
        await page.getByRole("button", { name: "Sign in", exact: true }).click();
      }
      await expect(page.getByRole("columnheader", { name: /Name/ })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const mobile = width === 390;
      const opener = page.getByRole("button", { name: "Open folders", exact: true });
      if (mobile) await opener.click();
      const root = page.locator(mobile ? ".ct-drive-folder-sheet" : ".ct-drive-sidebar");
      await stable(root);
      const measured = await root.evaluate((element) => {
        const rect = (target: Element) => {
          const box = target.getBoundingClientRect();
          const css = getComputedStyle(target);
          return {
            x: box.x,
            y: box.y,
            w: box.width,
            h: box.height,
            padding: css.padding,
            gap: css.gap,
          };
        };
        return {
          root: rect(element),
          views: rect(element.querySelector(".ct-drive-side-bottom")!),
          storage: rect(element.querySelector(".ct-storage")!),
          progress: rect(element.querySelector('[role="progressbar"]')!),
          separators: Array.from(element.querySelectorAll('[role="separator"]')).map(rect),
          links: Array.from(element.querySelectorAll(".ct-drive-view-link")).map((link) => ({
            ...rect(link),
            tag: link.tagName,
            href: link.getAttribute("href"),
            role: link.getAttribute("role"),
            fontWeight: getComputedStyle(link).fontWeight,
          })),
          documentWidth: document.documentElement.scrollWidth,
        };
      });
      await writeFile(info.outputPath("secondary-layout.json"), JSON.stringify(measured, null, 2));
      await page.screenshot({ path: info.outputPath("secondary-layout.png") });
      expect(measured.documentWidth).toBe(width);
      expect(measured.root.w).toBe(256);
      expect(measured.views.h).toBe(150);
      expect(measured.views.padding).toBe("8px");
      expect(measured.views.gap).toBe("2px");
      expect(measured.storage.h).toBe(120);
      expect(measured.storage.padding).toBe("12px");
      expect(measured.storage.gap).toBe("8px");
      expect(measured.storage.y + measured.storage.h).toBe(mobile ? 844 : 991);
      expect(measured.progress.h).toBe(4);
      expect(measured.progress.w).toBe(231);
      expect(measured.separators.map((separator) => separator.h)).toEqual([1, 1]);
      expect(measured.separators[0].y).toBe(mobile ? 572 : 719);
      expect(measured.separators[1].y).toBe(mobile ? 723 : 870);
      for (const link of measured.links) {
        expect(link.tag).toBe("A");
        expect(link.role).toBe("button");
        expect(link.h).toBe(32);
        expect(link.w).toBe(239);
        expect(link.fontWeight).toBe("400");
      }
      await expect(root.getByRole("progressbar", { name: "Storage used" })).toHaveAttribute(
        "aria-valuenow",
        "63",
      );
      const recent = root.getByRole("button", { name: "Recent", exact: true });
      await expect(recent).toHaveAttribute("href", `#/template-preview/${id}/recent`);
      await tabTo(page, recent);
      await page.keyboard.press("Space");
      await expect(page).toHaveURL(new RegExp(`/template-preview/${id}/recent$`));
      if (mobile) {
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(opener).toBeFocused();
        await opener.click();
        await stable(root);
      } else {
        await expect(recent).toBeFocused();
      }
      await expect(recent).toHaveAttribute("aria-current", "page");
      const favourites = root.getByRole("button", { name: "Favourites", exact: true });
      await tabTo(page, favourites);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/template-preview/${id}/starred$`));
      if (mobile) {
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(opener).toBeFocused();
      } else {
        await expect(favourites).toBeFocused();
        await expect(favourites).toHaveAttribute("aria-current", "page");
        await page.goBack();
        await expect(recent).toHaveAttribute("aria-current", "page");
        await page.goForward();
        await expect(favourites).toHaveAttribute("aria-current", "page");
        // Native middle-click opens a background tab without a window.opener.
        const popupPending = page.context().waitForEvent("page");
        await recent.click({ button: "middle" });
        const popup = await popupPending;
        try {
          await expect(popup).toHaveURL(new RegExp(`/template-preview/${id}/recent$`));
          await expect(page).toHaveURL(new RegExp(`/template-preview/${id}/starred$`));
        } finally {
          await popup.close();
        }
        await page.setViewportSize({ width, height: 500 });
        const tree = root.locator(".ct-drive-tree-scroll");
        const before = await root.locator(".ct-storage").boundingBox();
        await tree.hover();
        await page.mouse.wheel(0, 500);
        await expect.poll(() => tree.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
        const after = await root.locator(".ct-storage").boundingBox();
        expect(after).toEqual(before);
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
      }
      if (mobile) {
        await opener.click();
        await stable(root);
      }
      await root.getByRole("button", { name: "Get More Storage", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/template-preview/${id}/pricing$`));
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Plans", exact: true })).toBeVisible();
      expect(faults).toEqual([]);
      await writeFile(info.outputPath("console.json"), JSON.stringify(faults));
    });
  }
}
