import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

for (const width of [1440, 390])
  for (const section of ["Settings", "Security", "Integrations"]) {
    test(`Lucent ${section} retains its document header and content bounds at ${width}`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      const evidence: unknown[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) errors.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const prefix of ["template-preview", "templates"]) {
        const toolbar = prefix === "templates" ? 36 : 0;
        await page.goto(`/#/${prefix}/lucent`);
        if (width === 390)
          await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        await page.getByRole("button", { name: section, exact: true }).click();
        if (width === 390) await expect(page.getByRole("dialog")).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => window.scrollTo(0, 0));
        const header = page.locator(".wf-root.wf-devops > .wf-main > .wf-header");
        await expect(header).toHaveCSS("position", "sticky");
        await expect
          .poll(async () => {
            const box = await header.boundingBox();
            return box && [box.y, box.height];
          })
          .toEqual([toolbar, 48]);
        const content = page.locator(".wf-root.wf-devops > .wf-main > .wf-content");
        await expect(content).toHaveCSS("padding", "16px");
        if (section === "Settings") {
          const frame = page.locator(".wf-lucent-general > [data-slot='frame']");
          await expect
            .poll(async () => {
              const box = await frame.boundingBox();
              return box && [box.x, box.y, box.width, box.height];
            })
            .toEqual(
              width === 390 ? [16, 64 + toolbar, 358, 1365.25] : [272, 64 + toolbar, 1152, 937.25],
            );
        }
        await page.evaluate(() => window.scrollTo(0, 1390));
        await expect
          .poll(async () => {
            const box = await header.boundingBox();
            return box && [box.y, box.height];
          })
          .toEqual([toolbar, 48]);
        if (prefix === "templates") {
          await expect
            .poll(async () => {
              const box = await page.locator(".template-workspace-toolbar").boundingBox();
              return box && [box.y, box.height];
            })
            .toEqual([0, 36]);
        }
        if (section === "Settings")
          expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        evidence.push({
          prefix,
          section,
          width,
          scrollY: await page.evaluate(() => window.scrollY),
          header: await header.boundingBox(),
          contentPadding: await content.evaluate((element) => getComputedStyle(element).padding),
        });
        await page.screenshot({ path: info.outputPath(`${prefix}-scrolled.png`) });
      }
      expect(errors).toEqual([]);
      await writeFile(info.outputPath("header-proof.json"), JSON.stringify(evidence, null, 2));
    });
  }
