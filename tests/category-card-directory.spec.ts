import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/category-card/category-card-${n}`);
  await expect(page.locator(`[data-category-card-variant="${n}"]`)).toBeVisible();
}

test("featured department and native scroll index share 620px desktop height", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 4);
  const hero = (await page
    .locator('[data-category-card-variant="4"] [data-slot="card"]')
    .first()
    .boundingBox())!;
  const index = (await page.locator("[data-department-index]").boundingBox())!;
  expect(hero.height).toBe(620);
  expect(index.height).toBe(620);
  expect(index.y).toBe(hero.y);
  expect(index.x).toBeGreaterThan(hero.x + hero.width);
  await expect(page.locator("[data-department-row]")).toHaveCount(7);
  await expect(page.locator("[data-unique-catalog-count]")).toHaveText("60");
  await expect(page.locator("[data-directory-count]")).toHaveText("8");
});

test("directory counts and starting prices describe actual collection pieces", async ({ page }) => {
  await open(page, 4);
  await expect(page.locator("[data-featured-meta]")).toHaveText(/15 pieces.*From \$38/);
  for (const [id, count, price] of [
    ["footwear", 15, 88],
    ["accessories", 15, 35],
    ["home", 15, 42],
    ["everyday", 30, 35],
    ["weekend", 30, 35],
    ["quiet", 30, 35],
    ["all", 60, 35],
  ] as const) {
    await expect(page.locator(`[data-department-row="${id}"] [data-department-meta]`)).toHaveText(
      new RegExp(`${count} pieces.*From \\$${price}`),
    );
  }
  await page.getByRole("button", { name: "Explore clothing", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(15);
});

test("real wheel scrolling reaches the final directory route and opens its full catalog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 4);
  const viewport = page.locator('[data-department-index] [data-slot="scroll-area-viewport"]');
  const scrollable = await viewport.evaluate((element) => ({
    client: element.clientHeight,
    scroll: element.scrollHeight,
  }));
  expect(scrollable.scroll).toBeGreaterThan(scrollable.client);
  await viewport.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
  await page.getByRole("button", { name: "Explore All Considered", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(60);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Explore All Considered", exact: true }),
  ).toBeFocused();
});

test("directory footer and breadcrumb navigate to the unique 60-piece catalog", async ({
  page,
}) => {
  await open(page, 4);
  await page.getByRole("button", { name: "Browse all 60 pieces", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(60);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(60);
});

test("every guide opens its real piece count and minimum starting budget", async ({ page }) => {
  await open(page, 5);
  await expect(page.locator("[data-guide]")).toHaveCount(4);
  for (const [id, title, count, from] of [
    ["uniform", "A good everyday uniform", 30, 38],
    ["carry", "Small things, well considered", 15, 35],
    ["living", "A little room to unwind", 15, 42],
    ["weekend", "The weekend checklist", 45, 35],
  ] as const) {
    await expect(page.locator(`[data-guide="${id}"] [data-guide-meta]`)).toHaveText(
      new RegExp(`${count} pieces.*Start from \\$${from}`),
    );
    await page.getByRole("button", { name: `View guide ${title}`, exact: true }).click();
    const products = page.locator("[data-collection-product]");
    await expect(products).toHaveCount(count);
    const prices = await products.evaluateAll((rows) =>
      rows.map((row) => Number(row.textContent!.match(/\$(\d+)/)![1])),
    );
    expect(Math.min(...prices)).toBe(from);
    await page.keyboard.press("Escape");
  }
});

test("guide subcategory links narrow the actual catalog and retain saved state across entry points", async ({
  page,
}) => {
  await open(page, 5);
  await page
    .getByRole("button", { name: "A good everyday uniform: shop Clothing", exact: true })
    .click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(15);
  await page.getByRole("textbox", { name: "Search collection pieces", exact: true }).fill("linen");
  await expect(page.locator("[data-collection-product]")).toHaveCount(3);
  await page.getByRole("button", { name: "View Linen Field Shirt · Sand", exact: true }).click();
  await page.getByRole("button", { name: "Save Linen Field Shirt · Sand", exact: true }).click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "View guide A good everyday uniform", exact: true })
    .click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(30);
  await page.getByRole("button", { name: "View Linen Field Shirt · Sand", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save Linen Field Shirt · Sand", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("guide browse action opens all pieces and individual department links open 15 each", async ({
  page,
}) => {
  await open(page, 5);
  await page.getByRole("button", { name: "Browse collections", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(60);
  await page.keyboard.press("Escape");
  for (const name of [
    "A good everyday uniform: shop Footwear",
    "A little room to unwind: shop Home Objects",
    "The weekend checklist: shop Bags & Accessories",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("[data-collection-product]")).toHaveCount(15);
    await page.keyboard.press("Escape");
  }
});

test("seasonal desktop hover replaces resting labels with full-card details and a real Shop action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 6);
  const card = page.locator('[data-seasonal-category="clothing"]');
  await expect(card.locator("[data-seasonal-detail]")).toHaveCSS("opacity", "0");
  await expect(card.locator("[data-seasonal-resting]")).toHaveCSS("opacity", "1");
  await card.hover();
  await expect(card.locator("[data-seasonal-detail]")).toHaveCSS("opacity", "1");
  await expect(card.locator("[data-seasonal-resting]")).toHaveCSS("opacity", "0");
  await card.getByRole("button", { name: "Shop seasonal Everyday Clothing", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(15);
});

test("mobile seasonal details stay open, resting metadata stays hidden and all four shops work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page, 6);
  for (const [id, name, price] of [
    ["clothing", "Everyday Clothing", 38],
    ["footwear", "Footwear", 88],
    ["accessories", "Bags & Accessories", 35],
    ["home", "Objects for Home", 42],
  ] as const) {
    const card = page.locator(`[data-seasonal-category="${id}"]`);
    await expect(card.locator("[data-seasonal-resting]")).toBeHidden();
    await expect(card.locator("[data-seasonal-detail]")).toHaveCSS("opacity", "1");
    await expect(card.locator("[data-seasonal-meta]")).toHaveText(
      new RegExp(`15 pieces.*From \\$${price}`),
    );
    await page.getByRole("button", { name: `Shop seasonal ${name}`, exact: true }).click();
    await expect(page.locator("[data-collection-product]")).toHaveCount(15);
    await page.keyboard.press("Escape");
  }
});

test("seasonal keyboard focus reveals details with reduced motion and restores focus after browsing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, 6);
  const button = page.getByRole("button", { name: "Shop seasonal Footwear", exact: true });
  await button.focus();
  const detail = page.locator('[data-seasonal-category="footwear"] [data-seasonal-detail]');
  await expect(detail).toHaveCSS("opacity", "1");
  await expect(detail).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-collection-product]")).toHaveCount(15);
  await page.keyboard.press("Escape");
  await expect(button).toBeFocused();
});

test("seasonal top-level edit opens all departments while tile counts stay disjoint", async ({
  page,
}) => {
  await open(page, 6);
  await expect(page.locator("[data-seasonal-category]")).toHaveCount(4);
  await page.getByRole("button", { name: "Explore the seasonal edit", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(60);
});

for (const n of [4, 5, 6])
  for (const width of [1440, 390]) {
    test(`Category Card ${n} renders at ${width}px with original media and usable catalog overlays`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, n);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(
        await page
          .locator(".isolated-preview h2")
          .first()
          .evaluate(
            (heading) =>
              parseFloat(getComputedStyle(heading).lineHeight) /
              parseFloat(getComputedStyle(heading).fontSize),
          ),
      ).toBeLessThan(1.15);
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
      if (n === 4)
        await page.getByRole("button", { name: "Explore clothing", exact: true }).click();
      if (n === 5)
        await page
          .getByRole("button", { name: "View guide A good everyday uniform", exact: true })
          .click();
      if (n === 6) {
        const button = page.getByRole("button", {
          name: "Shop seasonal Everyday Clothing",
          exact: true,
        });
        if (width === 1440) await button.focus();
        await button.click();
      }
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.locator("[data-collection-product]")).toHaveCount(n === 5 ? 30 : 15);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }

for (const [n, module, component] of [
  [4, "featured-department", "FeaturedDepartment"],
  [5, "collection-guides", "CollectionGuides"],
  [6, "seasonal-categories", "SeasonalCategories"],
] as const) {
  test(`Category Card ${n} actual source default, clipboard, leaf and ZIP are byte-identical`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/ecommerce/category-card/category-card-${n}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const filename = `src/blocks/commerce/category-card-variants/${module}.tsx`;
    await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(filename);
    const source = dialog.locator(".source-code");
    await expect(source).toContainText(`function ${component}`);
    const expected = await readFile(filename, "utf8");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const pendingFile = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    expect(await readFile((await (await pendingFile).path())!, "utf8")).toBe(expected);
    const pendingZip = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
    const entries = unzipSync(new Uint8Array(await readFile((await (await pendingZip).path())!)));
    expect(new TextDecoder().decode(entries[filename])).toBe(expected);
    for (const path of [
      "src/blocks/commerce/category-card-variants/discovery-data.ts",
      "src/blocks/commerce/category-card-variants/breadcrumb.tsx",
      "src/blocks/commerce/shop-hero-variants/image-card.tsx",
      "src/blocks/commerce/shop-hero-variants/collection-dialog.tsx",
      "src/components/reui/badge.tsx",
      "src/components/reui/REUI-LICENSE.txt",
    ])
      expect(entries[path]).toBeDefined();
    if (n === 4) expect(entries["src/components/ui/scroll-area.tsx"]).toBeDefined();
    if (n === 4 || n === 5) expect(entries["src/components/ui/item.tsx"]).toBeDefined();
  });
}
