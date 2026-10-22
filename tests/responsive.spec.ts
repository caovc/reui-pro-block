import { test, expect } from "@playwright/test";
import catalog from "../src/data/catalog.json" with { type: "json" };
for (const group of [...new Set(catalog.map((c) => c.group))]) {
  test(`${group} category families fit a phone viewport`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    const overflowing: string[] = [];
    for (const category of catalog.filter((c) => c.group === group)) {
      const block = category.blocks[0];
      await page.goto(
        `./#/preview/${block.group}/${block.category}/${block.id}`,
      );
      await expect
        .poll(
          async () =>
            (await page.locator(".isolated-preview").innerText()).length,
        )
        .toBeGreaterThan(3);
      const dimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      if (dimensions.scroll > dimensions.width + 2)
        overflowing.push(`${category.id}: ${dimensions.scroll}px`);
    }
    expect(overflowing).toEqual([]);
  });
}
