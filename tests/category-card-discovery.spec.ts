import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/category-card/category-card-${n}`);
  await expect(page.locator(`[data-category-card-variant="${n}"]`)).toBeVisible();
}
async function choose(page: Page, label: string, name: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name, exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(0);
}

test("browse grid has eight real collections, three signal badges and four desktop columns", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 1);
  await expect(page.locator("[data-category-collection]")).toHaveCount(8);
  await expect(page.locator('[data-category-grid] [data-slot="badge"]')).toHaveCount(3);
  expect(
    await page
      .locator("[data-category-grid]")
      .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length),
  ).toBe(4);
  await expect(page.getByRole("navigation", { name: "breadcrumb" })).toBeVisible();
});

test("every grid collection opens the actual dataset represented by its piece count", async ({
  page,
}) => {
  await open(page, 1);
  for (const [name, count] of [
    ["Everyday Clothing", 15],
    ["Footwear", 15],
    ["Bags & Accessories", 15],
    ["Objects for Home", 15],
    ["The Everyday Edit", 30],
    ["Weekends Away", 30],
    ["The Quiet Corner", 30],
    ["All Considered", 60],
  ] as const) {
    const button = page.getByRole("button", { name: `Browse ${name}`, exact: true });
    await button.focus();
    await button.click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(page.locator("[data-collection-product]")).toHaveCount(count);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(button).toBeFocused();
  }
});

test("hover and keyboard focus expose the browse action and shared saved state survives navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 1);
  const card = page.locator('[data-category-collection="clothing"]');
  const button = card.getByRole("button", { name: "Browse Everyday Clothing", exact: true });
  const action = button.locator("..");
  await expect(action).toHaveCSS("opacity", "0");
  await card.hover();
  await expect(action).toHaveCSS("opacity", "1");
  await button.click();
  await page.getByRole("button", { name: "View Linen Field Shirt · Sand", exact: true }).click();
  await page.getByRole("button", { name: "Save Linen Field Shirt · Sand", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Browse The Everyday Edit", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "View Linen Field Shirt · Sand", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save Linen Field Shirt · Sand", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("breadcrumb opens the complete catalog instead of a hash placeholder", async ({ page }) => {
  await open(page, 1);
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(60);
});

test("four-per-page pagination and search operate on the complete collection dataset", async ({
  page,
}) => {
  await open(page, 2);
  await expect(page.locator("[data-collection-range]")).toHaveText("1–4 of 8 collections");
  await expect(page.locator("[data-category-collection]")).toHaveCount(4);
  await expect(
    page.getByRole("link", { name: "Go to previous page", exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("link", { name: "Go to next page", exact: true }).click();
  await expect(page.locator("[data-collection-range]")).toHaveText("5–8 of 8 collections");
  await expect(page.getByRole("link", { name: "Collection page 2", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("textbox", { name: "Search collections", exact: true }).fill("quiet");
  await expect(page.locator("[data-collection-range]")).toHaveText("1–1 of 1 collections");
  await expect(page.locator("[data-category-collection]")).toHaveAttribute(
    "data-category-collection",
    "quiet",
  );
  await page.getByRole("button", { name: "Browse The Quiet Corner", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-collection-product]")).toHaveCount(30);
});

test("department and availability facets narrow real collection rows", async ({ page }) => {
  await open(page, 2);
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await choose(page, "Department filter", "Clothing");
  await expect(page.locator('[data-category-card-variant="2"]')).toHaveAttribute(
    "data-results",
    "3",
  );
  await choose(page, "Availability filter", "Coming soon");
  await expect(page.locator('[data-category-card-variant="2"]')).toHaveAttribute(
    "data-results",
    "0",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "No collections found", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset collection search", exact: true }).click();
  await expect(page.locator('[data-category-card-variant="2"]')).toHaveAttribute(
    "data-results",
    "8",
  );
});

test("fit counts derive from the dataset and multi-fit OR combines with featured-only", async ({
  page,
}) => {
  await open(page, 2);
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(page.getByRole("button", { name: "Everyday 4", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Travel 4", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Living 3", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Travel 4", exact: true }).click();
  await expect(page.locator('[data-category-card-variant="2"]')).toHaveAttribute(
    "data-results",
    "4",
  );
  await page.getByRole("button", { name: "Living 3", exact: true }).click();
  await expect(page.locator('[data-category-card-variant="2"]')).toHaveAttribute(
    "data-results",
    "6",
  );
  await page.getByRole("switch", { name: /Featured only/ }).click();
  await expect(page.locator('[data-category-card-variant="2"]')).toHaveAttribute(
    "data-results",
    "2",
  );
  await expect(page.locator("[data-filter-count]")).toHaveText("3");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(page.locator('[data-category-card-variant="2"]')).toHaveAttribute(
    "data-results",
    "8",
  );
});

test("availability and featured-only controls retain distinct filtering semantics", async ({
  page,
}) => {
  await open(page, 2);
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await choose(page, "Availability filter", "Coming soon");
  await expect(page.locator('[data-category-card-variant="2"]')).toHaveAttribute(
    "data-results",
    "2",
  );
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await page.getByRole("switch", { name: /Featured only/ }).click();
  await expect(page.locator('[data-category-card-variant="2"]')).toHaveAttribute(
    "data-results",
    "3",
  );
});

test("sorting and empty reset return the correct first page and source counts", async ({
  page,
}) => {
  await open(page, 2);
  await choose(page, "Sort collections", "Most pieces");
  await expect(page.locator("[data-category-collection]").first()).toHaveAttribute(
    "data-category-collection",
    "all",
  );
  await choose(page, "Sort collections", "Name: A–Z");
  await expect(page.locator("[data-category-collection]").first()).toHaveAttribute(
    "data-category-collection",
    "all",
  );
  await page
    .getByRole("textbox", { name: "Search collections", exact: true })
    .fill("no-matching-collection");
  await expect(page.locator("[data-collection-range]")).toHaveText("0–0 of 0 collections");
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.locator("[data-category-collection]").first()).toHaveAttribute(
    "data-category-collection",
    "clothing",
  );
});

test("actual Embla arrows, page boundaries and collection actions agree", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 3);
  await expect(page.getByRole("button", { name: "Previous slide", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(page.locator("[data-category-page-counter]")).toHaveText("2 / 2");
  await expect(page.getByRole("button", { name: "Next slide", exact: true })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Browse Everyday Clothing", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Browse All Considered", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-collection-product]")).toHaveCount(60);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Previous slide", exact: true }).click();
  await expect(page.locator("[data-category-page-counter]")).toHaveText("1 / 2");
});

test("carousel keyboard navigation and pointer dragging update the genuine selected snap", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 3);
  const carousel = page.getByRole("region", { name: "Collection pages", exact: true });
  await expect(page.getByRole("button", { name: "Next slide", exact: true })).toBeEnabled();
  const firstImage = page.locator('[data-category-collection="clothing"] img');
  const initialLeft = (await firstImage.boundingBox())!.x;
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("[data-category-page-counter]")).toHaveText("2 / 2");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("[data-category-page-counter]")).toHaveText("1 / 2");
  await expect
    .poll(async () => Math.abs((await firstImage.boundingBox())!.x - initialLeft))
    .toBeLessThan(1);
  const image = page.locator('[data-category-collection="home"] img');
  const bounds = (await image.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.35);
  await page.mouse.down();
  await page.mouse.move(100, bounds.y + bounds.height * 0.35, { steps: 18 });
  await page.mouse.up();
  await expect(page.locator("[data-category-page-counter]")).toHaveText("2 / 2");
});

for (const n of [1, 2, 3])
  for (const width of [1440, 390]) {
    test(`Category Card ${n} fits ${width}px with original images, legible headings and usable overlays`, async ({
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
      const name = "Browse Everyday Clothing";
      const button = page.getByRole("button", { name, exact: true });
      if (width === 1440) await button.focus();
      await button.click();
      await expect(page.locator("[data-collection-product]")).toHaveCount(15);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await page.keyboard.press("Escape");
      if (n === 2) {
        await page.getByRole("button", { name: "Filters", exact: true }).click();
        await expect(
          page.getByRole("heading", { name: "Find your collection", exact: true }),
        ).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
      }
      if (n === 3 && width === 390) {
        const grid = page.locator('[aria-label="Collection page 1"] > div');
        expect(
          await grid.evaluate(
            (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length,
          ),
        ).toBe(2);
      }
    });
  }

for (const [n, module, component] of [
  [1, "browse-grid", "CategoryBrowseGrid"],
  [2, "filterable-collections", "FilterableCollections"],
  [3, "category-carousel", "CategoryCarousel"],
] as const) {
  test(`Category Card ${n} source default, copy, file and starter share real implementation bytes`, async ({
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
      "src/blocks/commerce/category-card-variants/collection-card.tsx",
      "src/blocks/commerce/shop-hero-variants/image-card.tsx",
      "src/blocks/commerce/shop-hero-variants/collection-dialog.tsx",
      "src/components/reui/badge.tsx",
      "src/components/reui/REUI-LICENSE.txt",
    ])
      expect(entries[path]).toBeDefined();
    if (n === 2) expect(entries["src/components/ui/pagination.tsx"]).toBeDefined();
    if (n === 3) expect(entries["src/components/ui/carousel.tsx"]).toBeDefined();
  });
}
