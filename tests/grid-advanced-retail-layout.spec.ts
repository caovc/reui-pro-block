import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

for (const width of [1440, 390]) {
  test(`Retail native frame, chart band and leaf geometry at ${width}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/preview/data-grid/advanced/data-grid-advanced-15");
    await expect(page.locator(".rpo-frame")).toContainText("P&L Outlook");
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    const geometry = await page.evaluate(() => {
      const rect = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const r = element.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      };
      return {
        frame: rect(".rpo-frame"),
        scroll: rect(".rpo-scroll [data-slot=scroll-area-viewport]"),
        table: rect(".rpo-table"),
        headers: [1, 2, 3].map((i) => rect(`.rpo-table thead tr:nth-child(${i})`)),
        leaf: rect('.rpo-table tbody tr[data-row-id="rpo-line-01"]'),
        profit: rect(".rpo-table tfoot tr td:first-child"),
        pageOverflow: document.documentElement.scrollWidth - innerWidth,
        openMenus: document.querySelectorAll('[role="menu"][data-state="open"]').length,
      };
    });
    await info.attach("actual geometry before assertions", {
      body: JSON.stringify(geometry, null, 2),
      contentType: "application/json",
    });
    await page.screenshot({ path: info.outputPath(`retail-default-${width}.png`), fullPage: true });
    const expectedFrame =
      width === 390 ? { x: 16, y: 32, w: 358, h: 776.65625 } : { x: 112, y: 48, w: 1216, h: 920 };
    for (const key of ["x", "y", "w", "h"] as const)
      expect
        .soft(Math.abs(geometry.frame[key] - expectedFrame[key]), `frame ${key}`)
        .toBeLessThanOrEqual(0.5);
    for (const [index, height] of [29, 144, 32].entries())
      expect
        .soft(Math.abs(geometry.headers[index]!.h - height), `header ${index}`)
        .toBeLessThanOrEqual(0.5);
    expect.soft(Math.abs(geometry.leaf.h - 36), "leaf height").toBeLessThanOrEqual(0.5);
    expect.soft(Math.abs(geometry.profit.h - 52), "profit height").toBeLessThanOrEqual(0.5);
    expect.soft(geometry.pageOverflow).toBeLessThanOrEqual(1);
    expect.soft(geometry.openMenus).toBe(0);
    if (width === 1440) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Export", exact: true }).click(),
      ]);
      const target = info.outputPath("actual-retail-outlook.csv");
      await download.saveAs(target);
      const csv = await readFile(target, "utf8");
      expect(download.suggestedFilename()).toBe("bricklane-retail-pnl-outlook.csv");
      expect(csv).toContain("Operating Profit");
      expect(csv).toContain("Oct 2026 K");
      expect(csv).toContain("Outlook K");
    }
    expect(errors).toEqual([]);
  });
}

test("Retail slash focuses native Search and preserves input and portal keyboard ownership", async ({
  page,
}) => {
  await page.goto("/#/preview/data-grid/advanced/data-grid-advanced-15");
  const search = page.getByRole("textbox", { name: "Search lines", exact: true });
  await expect(search).toBeVisible();
  await page.locator(".rpo-toolbar-title").click();
  await page.keyboard.press("/");
  await expect(search).toBeFocused();
  await page.keyboard.type("a/b");
  await expect(search).toHaveValue("a/b");
  await search.fill("");
  await page.getByRole("button", { name: "Variance", exact: true }).click();
  const variance = page.getByRole("dialog", { name: "Variance", exact: true });
  await expect(variance).toBeVisible();
  await page.keyboard.press("/");
  await expect(page.locator('input[aria-label="Search lines"]')).not.toBeFocused();
  await expect(variance).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(variance).toHaveCount(0);
  await page.getByRole("button", { name: "View", exact: true }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="menu"]'))))
    .toBe(true);
  await page.keyboard.press("/");
  await expect(page.locator('input[aria-label="Search lines"]')).not.toBeFocused();
  await expect(page.getByRole("menu")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="menu"]'))))
    .toBe(true);
});
