import { test, expect } from "@playwright/test";
import catalog from "../src/data/catalog.json" with { type: "json" };
const blocks = catalog.flatMap((c) => c.blocks);
test("catalog snapshot is complete and identifiers are unique", async () => {
  expect(catalog).toHaveLength(78);
  expect(blocks).toHaveLength(662);
  expect(
    new Set(blocks.map((b) => `${b.group}/${b.category}/${b.id}`)).size,
  ).toBe(662);
  expect(
    catalog.every((c) => c.count === c.blocks.length && c.count > 0),
  ).toBeTruthy();
});
for (const category of catalog) {
  test.describe(`${category.group}/${category.id}`, () => {
    test("all catalog entries render without an exception", async ({
      page,
    }) => {
      test.setTimeout(Math.max(30000, category.count * 5000));
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const block of category.blocks) {
        await page.goto(
          `./#/preview/${block.group}/${block.category}/${block.id}`,
        );
        await expect(
          page.locator(`[data-block-id="${block.id}"]`),
        ).toBeVisible();
        await expect
          .poll(
            async () =>
              (await page.locator(".isolated-preview").innerText()).trim()
                .length,
          )
          .toBeGreaterThan(3);
        await expect(page.locator(".isolated-preview")).not.toContainText(
          "Preview could not render",
        );
      }
      expect(errors).toEqual([]);
    });
  });
}
