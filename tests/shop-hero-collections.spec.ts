import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/shop-hero/shop-hero-${n}`);
  await expect(page.locator(`[data-shop-hero-variant="${n}"]`)).toBeVisible();
}

for (const [category, label] of [
  ["clothing", "Clothing"],
  ["footwear", "Footwear"],
  ["accessories", "Bags & Accessories"],
  ["home", "Home Objects"],
] as const) {
  test(`category hero ${label} opens its own 15 real pieces`, async ({ page }) => {
    await open(page, 4);
    await expect(page.locator(`[data-shop-category="${category}"]`)).toContainText("15 styles");
    await page.getByRole("button", { name: `Shop ${label}`, exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText(label);
    await expect(page.locator("[data-collection-results]")).toHaveText("15 of 15 pieces");
    await expect(page.locator("[data-collection-product]")).toHaveCount(15);
    expect(
      await page
        .locator("[data-collection-product]")
        .evaluateAll(
          (rows, prefix) =>
            rows.every((row) => row.getAttribute("data-collection-product")!.startsWith(prefix)),
          category,
        ),
    ).toBe(true);
  });
}

test("all 60 pieces, native category tabs, live material search and empty recovery reflect the dataset", async ({
  page,
}) => {
  await open(page, 4);
  await page.getByRole("button", { name: "See all 60 pieces", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(60);
  await page.getByRole("tab", { name: "Clothing", exact: true }).click();
  await expect(page.locator("[data-collection-results]")).toHaveText("15 of 60 pieces");
  await page.getByRole("textbox", { name: "Search collection pieces", exact: true }).fill("linen");
  await expect(page.locator("[data-collection-product]")).toHaveCount(3);
  await expect(page.locator("[data-collection-results]")).toHaveText("3 of 60 pieces");
  await page
    .getByRole("textbox", { name: "Search collection pieces", exact: true })
    .fill("no such fabric");
  await expect(page.getByText("No matching pieces", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(15);
  await page.getByRole("tab", { name: "All pieces", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(60);
});

test("native tabs retain keyboard selection and change the rendered category", async ({ page }) => {
  await open(page, 4);
  await page.getByRole("button", { name: "See all 60 pieces", exact: true }).click();
  await page.getByRole("tab", { name: "All pieces", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Clothing", exact: true })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Clothing", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("[data-collection-product]")).toHaveCount(15);
});

test("product view uses the actual free bookmark toggle and retains its real saved state on back", async ({
  page,
}) => {
  await open(page, 4);
  await page.getByRole("button", { name: "Shop Clothing", exact: true }).click();
  await page.getByRole("button", { name: "View Linen Field Shirt · Sand", exact: true }).click();
  const save = page.getByRole("button", { name: "Save Linen Field Shirt · Sand", exact: true });
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("alert")).toContainText("Saved to your collection");
  await page.getByRole("button", { name: "Back to collection", exact: true }).click();
  await page.getByRole("button", { name: "View Linen Field Shirt · Sand", exact: true }).click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "See all 60 pieces", exact: true }).click();
  await page.getByRole("button", { name: "View Linen Field Shirt · Sand", exact: true }).click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("dual story CTAs open different collections with counts and from-prices derived from real data", async ({
  page,
}) => {
  await open(page, 5);
  await expect(
    page.getByRole("button", { name: "30 pieces in the collection", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "15 pieces in the collection", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-collection-story="everyday"]')).toContainText("From $35");
  await expect(page.locator('[data-collection-story="living"]')).toContainText("From $42");
  const partial = page
    .locator('[data-collection-story="everyday"] [data-slot="rating-star-filled"]')
    .last();
  const fill = await partial.evaluate((element) =>
    parseFloat((element.parentElement as HTMLElement).style.width),
  );
  expect(fill).toBeCloseTo(80, 4);
  await page.getByRole("button", { name: "Shop the everyday edit", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(30);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Shop objects for living", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(15);
  await expect(page.locator("[data-collection-results]")).toHaveText("15 of 15 pieces");
});

for (const n of [4, 5]) {
  for (const width of [390, 1280]) {
    test(`Shop Hero ${n} fits ${width}px with its own image layout and working detail overlay`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, n);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      const columns = await page
        .locator(n === 4 ? "[data-category-shop-grid]" : '[data-shop-hero-variant="5"]')
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
      expect(columns).toBe(n === 4 ? (width === 390 ? 2 : 4) : width === 390 ? 1 : 2);
      expect(
        await page.locator(".isolated-preview img").evaluateAll(async (images) => {
          await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
          return images.every(
            (image) =>
              (image as HTMLImageElement).src.startsWith("data:image/svg+xml,") &&
              (image as HTMLImageElement).naturalWidth > 0,
          );
        }),
      ).toBe(true);
      await page
        .getByRole("button", {
          name: n === 4 ? "Shop Clothing" : "Shop the everyday edit",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "View Linen Field Shirt · Sand", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Save Linen Field Shirt · Sand", exact: true }),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }
}

for (const [n, module, component] of [
  [4, "category-shop", "CategoryShopHero"],
  [5, "dual-collections", "DualCollectionHero"],
] as const) {
  test(`Shop Hero ${n} default source, clipboard, file and ZIP match its actual leaf`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/ecommerce/shop-hero/shop-hero-${n}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const source = dialog.locator(".source-code");
    const filename = `src/blocks/commerce/shop-hero-variants/${module}.tsx`;
    await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(filename);
    await expect(source).toContainText(`function ${component}`);
    const expected = await readFile(filename, "utf8");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const pendingFile = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    const file = await pendingFile;
    expect(await readFile((await file.path())!, "utf8")).toBe(expected);
    const pendingZip = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
    const zip = await pendingZip;
    const entries = unzipSync(new Uint8Array(await readFile((await zip.path())!)));
    expect(new TextDecoder().decode(entries[filename])).toBe(expected);
    for (const entry of [
      "src/blocks/commerce/shop-hero-variants/collection-dialog.tsx",
      "src/blocks/commerce/shop-hero-variants/collection-data.ts",
      "src/components/reui/badge.tsx",
      "src/components/ui/toggle.tsx",
      "src/components/ui/scroll-area.tsx",
      "src/components/ui/tabs.tsx",
      "src/components/reui/REUI-LICENSE.txt",
    ])
      expect(entries[entry]).toBeDefined();
  });
}
