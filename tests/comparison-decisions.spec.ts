import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/comparison/comparison-${n}`);
  await expect(page.locator(`[data-comparison-variant="${n}"]`)).toBeVisible();
}
async function choose(page: Page, side: "A" | "B", name: string) {
  await page.getByRole("combobox", { name: `Model ${side}`, exact: true }).click();
  await page.getByRole("option", { name, exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(0);
}
async function openCart(page: Page) {
  await page.getByRole("button", { name: /^Cart with/ }).click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Your cart", exact: true }),
  ).toBeVisible();
}

async function expectKeySpecsContained(page: Page) {
  expect(
    await page.locator("[data-key-spec]").evaluateAll((elements) =>
      elements.every((element) => {
        const panel = element.closest('[data-slot="frame-panel"]')!.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        return rect.top >= panel.top && rect.bottom <= panel.bottom;
      }),
    ),
  ).toBe(true);
}

for (const width of [1440, 390]) {
  test(`spec comparison follows the observed title/table and native column dimensions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await open(page, 1);
    const content = (await page.locator("[data-comparison-content]").boundingBox())!;
    expect(content.x).toBeCloseTo(width === 390 ? 16 : 176, 0);
    expect(content.width).toBeCloseTo(width === 390 ? 358 : 1088, 0);
    await expect(page.locator("[data-comparison-eyebrow]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reset comparison", exact: true })).toHaveCount(
      0,
    );
    const table = page.locator('[data-slot="data-grid-table"]');
    const tableBox = (await table.boundingBox())!;
    const containerBox = (await page.locator('[data-slot="data-grid"]').boundingBox())!;
    expect(containerBox.y).toBeCloseTo(width === 390 ? 152 : 132, 0);
    expect(tableBox.y - containerBox.y).toBe(1);
    expect(tableBox.width).toBeCloseTo(width === 390 ? 1728 : 1760, 0);
    const headers = table.locator("thead th");
    expect((await headers.first().boundingBox())!.width).toBeCloseTo(width === 390 ? 192 : 224, 0);
    expect((await headers.nth(1).boundingBox())!.width).toBeCloseTo(256, 0);
    expect((await headers.nth(1).boundingBox())!.height).toBeCloseTo(390.5, 0);
    const image = table.locator('[data-compared-product="sora"] img');
    const imageBox = (await image.boundingBox())!;
    expect(imageBox.width).toBe(160);
    expect(imageBox.height).toBe(160);
    await expect(image).toHaveCSS("object-fit", "contain");
    const normalRow = page.locator('[data-spec-label="battery"]').locator("../..");
    const groupRow = page.locator("[data-spec-group]").first().locator("../..");
    expect((await normalRow.boundingBox())!.height).toBeCloseTo(37, 0);
    expect((await groupRow.boundingBox())!.height).toBeCloseTo(33, 0);
  });

  test(`two-model cards use observed horizontal media, phone stacking and a fluid table at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await open(page, 2);
    const a = (await page.locator('[data-comparison-selector="A"]').boundingBox())!;
    const b = (await page.locator('[data-comparison-selector="B"]').boundingBox())!;
    expect(a.width).toBeCloseTo(width === 390 ? 358 : 534, 0);
    expect(a.height).toBeCloseTo(width === 390 ? 242 : 266, 0);
    expect(a.y).toBeCloseTo(width === 390 ? 192 : 144, 0);
    const header = page.locator("[data-comparison-content] > header");
    const swap = page.getByRole("button", { name: "Swap models", exact: true });
    await expect(header.getByRole("button", { name: "Swap models", exact: true })).toHaveText(
      "Swap",
    );
    const swapBox = (await swap.boundingBox())!;
    const description = (await page.locator("[data-comparison-description]").boundingBox())!;
    expect(description.height).toBe(width === 390 ? 40 : 20);
    expect(swapBox.height).toBe(28);
    expect(swapBox.y).toBe(width === 390 ? 140 : 92);
    expect(swapBox.x).toBeCloseTo(width === 390 ? 16 : 1264 - swapBox.width, 0);
    expect(a.y - (swapBox.y + swapBox.height)).toBe(24);
    expect(
      await header
        .locator(":scope > div")
        .first()
        .evaluate((element) => getComputedStyle(element).minHeight),
    ).toBe("auto");
    expect((await header.locator(":scope > div").first().boundingBox())!.height).toBe(
      width === 390 ? 96 : 80,
    );
    await expect(
      page
        .locator('footer[aria-label="Comparison demo actions"]')
        .getByRole("button", { name: "Swap models", exact: true }),
    ).toHaveCount(0);

    expect(b.x).toBeCloseTo(width === 390 ? a.x : a.x + a.width + 20, 0);
    expect(b.y).toBeCloseTo(width === 390 ? a.y + a.height + 16 : a.y, 0);
    for (const media of await page.locator("[data-comparison-model-media]").all()) {
      const box = (await media.boundingBox())!;
      expect(box.width).toBe(width === 390 ? 80 : 96);
      expect(box.height).toBe(width === 390 ? 80 : 96);
      await expect(media.locator("img")).toHaveCSS("object-fit", "contain");
    }
    const table = page.locator("[data-comparison-pair-table]");
    expect((await table.boundingBox())!.width).toBeCloseTo(width === 390 ? 356 : 1086, 0);
    expect(
      await table.locator("..").evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    expect((await table.locator("th").first().boundingBox())!.width).toBeCloseTo(
      width === 390 ? 192 : 224,
      0,
    );
    await expect(page.getByText("Better numeric value", { exact: true }).first()).toHaveClass(
      "sr-only",
    );
  });

  test(`editor picks place a badge over contained 5:4 media and keep four horizontal chips intact at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await open(page, 3);
    const cards = page.locator("[data-editor-pick]");
    const first = (await cards.first().boundingBox())!;
    const second = (await cards.nth(1).boundingBox())!;
    expect(first.width).toBeCloseTo(width === 390 ? 358 : (1088 - 40) / 3, 0);
    expect(first.y).toBeCloseTo(width === 390 ? 192 : 152, 0);
    expect(second.x).toBeCloseTo(width === 390 ? first.x : first.x + first.width + 20, 0);
    expect(second.y).toBeCloseTo(width === 390 ? first.y + first.height + 16 : first.y, 0);
    for (const card of await cards.all()) {
      const media = (await card.locator("[data-pick-media]").boundingBox())!;
      const badge = (await card.locator("[data-pick-badge]").boundingBox())!;
      expect(media.width / media.height).toBeCloseTo(1.25, 2);
      expect(badge.x - media.x).toBeCloseTo(width === 390 ? 12 : 16, 0);
      expect(badge.y - media.y).toBeCloseTo(width === 390 ? 12 : 16, 0);
      await expect(card.locator("[data-pick-media] img")).toHaveCSS("object-fit", "contain");
      await expect(card.locator("[data-pick-media] img")).toHaveCSS("transform", "none");
      for (const chip of await card.locator("[data-key-spec]").all()) {
        await expect(chip).toHaveCSS("border-top-style", "dashed");
        const labels = await chip.locator("span").evaluateAll((elements) =>
          elements.map((element) => {
            const box = element.getBoundingClientRect();
            return { x: box.x, centerY: box.y + box.height / 2 };
          }),
        );
        expect(labels[1].x).toBeGreaterThan(labels[0].x);
        expect(labels[1].centerY).toBeCloseTo(labels[0].centerY, 0);
      }
    }
    await expectKeySpecsContained(page);
  });
}

test("spec table renders six real product columns and every grouped feature in the official DataGrid", async ({
  page,
}) => {
  await open(page, 1);
  await expect(page.locator('[data-slot="data-grid-table"]')).toBeVisible();
  await expect(page.locator("[data-compared-product]")).toHaveCount(6);
  await expect(page.locator("[data-spec-group]")).toHaveCount(3);
  await expect(page.locator("[data-spec-label]")).toHaveCount(13);
  await expect(page.locator("[data-comparison-active-count]")).toHaveText(
    "6 of 6 models in this comparison",
  );
  await expect(page.locator('[data-product="sora"][data-spec="battery"]')).toHaveText("30 hrs");
  await expect(page.locator('[data-product="reference"][data-spec="codec"]')).toHaveText("LDAC");
  await expect(page.locator('[data-product="pocket"][data-spec="anc"]')).toHaveText("Not included");
});

test("native DataGrid pinning keeps the label cell fixed while the horizontal viewport scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page, 1);
  const viewport = page.locator(
    '[data-slot="data-grid-scroll-area"] [data-slot="scroll-area-viewport"]',
  );
  const label = page.locator('[data-spec-label="battery"]').locator("..");
  const left = (await label.boundingBox())!.x;
  expect(await label.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
  await viewport.hover();
  await page.mouse.wheel(600, 0);
  await expect.poll(() => viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
  expect((await label.boundingBox())!.x).toBeCloseTo(left, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("all native DataGrid column removals and Reset operate without losing the cart", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("button", { name: "Add Field Pro to cart", exact: true }).click();
  for (const name of [
    "Sora One",
    "Field Pro",
    "Studio Max",
    "Arc Travel",
    "Pocket Lite",
    "Reference X",
  ]) {
    await page.getByRole("button", { name: `Remove ${name} from comparison`, exact: true }).click();
  }
  await expect(
    page.getByRole("heading", { name: "No models in this comparison", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-comparison-active-count]")).toHaveText(
    "0 of 6 models in this comparison",
  );
  await page.getByRole("button", { name: "Restore all models", exact: true }).click();
  await expect(page.locator("[data-compared-product]")).toHaveCount(6);
  await expect(page.locator("[data-comparison-cart-count]")).toHaveText("1");
  await page.getByRole("button", { name: "Remove Sora One from comparison", exact: true }).click();
  await page.getByRole("button", { name: "Reset comparison", exact: true }).click();
  await expect(page.locator("[data-compared-product]")).toHaveCount(6);
});

test("spec hints use the actual native Tooltip keyboard behavior", async ({ page }) => {
  await open(page, 1);
  await page.getByRole("button", { name: "About Battery life", exact: true }).focus();
  await expect(page.getByRole("tooltip")).toContainText("Longer battery life is emphasized");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("dual selectors, Swap and Reset preserve their actual model identities", async ({ page }) => {
  await open(page, 2);
  await expect(page.locator('[data-comparison-selector="A"]')).toHaveAttribute(
    "data-selected-product",
    "field",
  );
  await expect(page.locator('[data-comparison-selector="B"]')).toHaveAttribute(
    "data-selected-product",
    "studio",
  );
  await choose(page, "A", "Pocket Lite");
  await page.getByRole("button", { name: "Swap models", exact: true }).click();
  await expect(page.locator('[data-comparison-selector="A"]')).toHaveAttribute(
    "data-selected-product",
    "studio",
  );
  await expect(page.locator('[data-comparison-selector="B"]')).toHaveAttribute(
    "data-selected-product",
    "pocket",
  );
  await page.getByRole("button", { name: "Reset pair", exact: true }).click();
  await expect(page.locator('[data-comparison-selector="A"]')).toHaveAttribute(
    "data-selected-product",
    "field",
  );
  await expect(page.locator('[data-comparison-selector="B"]')).toHaveAttribute(
    "data-selected-product",
    "studio",
  );
});

test("numeric winners respect lower price, weight and charge time versus higher battery and rating", async ({
  page,
}) => {
  await open(page, 2);
  for (const [spec, id] of [
    ["price", "field"],
    ["weight", "field"],
    ["charging", "field"],
    ["battery", "studio"],
    ["rating", "studio"],
  ])
    await expect(page.locator(`[data-spec="${spec}"][data-winner="${id}"]`)).toHaveCount(1);
  await expect(page.locator('[data-pair-spec="codec"] [data-winner]')).toHaveCount(0);
  await expect(page.locator("[data-pair-win-summary]")).toHaveText("Field Pro: 3 · Studio Max: 2");
  await choose(page, "A", "Reference X");
  await expect(page.locator('[data-spec="price"][data-winner="studio"]')).toHaveCount(1);
  await expect(page.locator('[data-spec="rating"][data-winner="reference"]')).toHaveCount(1);
  await expect(page.locator("[data-pair-win-summary]")).toHaveText(
    "Reference X: 1 · Studio Max: 4",
  );
});

test("same-model ties produce no false winner emphasis", async ({ page }) => {
  await open(page, 2);
  await choose(page, "B", "Field Pro");
  await expect(page.getByRole("alert")).toContainText("Same model selected");
  await expect(page.locator("[data-winner]")).toHaveCount(0);
  await expect(page.locator('[data-pair-spec="price"] [data-spec="price"]')).toHaveCount(2);
});

test("fractional ratings consume the actual official Rating partial-fill implementation", async ({
  page,
}) => {
  await open(page, 3);
  const card = page.locator('[data-editor-pick="sora"]');
  await expect(card.locator('[data-slot="rating-value"]')).toHaveText("4.3");
  const last = card.locator('[data-slot="rating-star-filled"]').nth(4).locator("..");
  expect(await last.evaluate((el) => parseFloat((el as HTMLElement).style.width))).toBeCloseTo(
    30,
    1,
  );
});

test("three editor picks retain distinct badges, struck-through gaps and four actual spec chips", async ({
  page,
}) => {
  await open(page, 3);
  await expect(page.locator("[data-editor-pick]")).toHaveCount(3);
  for (const label of ["Best value", "Editor's choice", "Top premium"])
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  await expect(page.locator('[data-editor-pick="sora"] del')).toHaveCount(4);
  await expect(page.locator('[data-editor-pick="field"] del')).toHaveCount(0);
  await expect(page.locator('[data-editor-pick="studio"] del')).toHaveCount(1);
  for (const id of ["sora", "field", "studio"])
    await expect(page.locator(`[data-editor-pick="${id}"] [data-key-spec]`)).toHaveCount(4);
  await expectKeySpecsContained(page);
});

test("cart additions, official NumberField input and remove calculate real subtotal", async ({
  page,
}) => {
  await open(page, 3);
  await page.getByRole("button", { name: "Add Sora One to cart", exact: true }).click();
  await page.getByRole("button", { name: "Add Sora One to cart", exact: true }).click();
  await page.getByRole("button", { name: "Add Field Pro to cart", exact: true }).click();
  await expect(page.locator("[data-comparison-cart-count]")).toHaveText("3");
  await openCart(page);
  await expect(page.locator("[data-comparison-cart-total]")).toHaveText("$457");
  const quantity = page.getByLabel("Sora One quantity", { exact: true });
  await quantity.fill("3");
  await quantity.press("Tab");
  await expect(page.locator("[data-comparison-cart-total]")).toHaveText("$586");
  await page.getByRole("button", { name: "Remove Field Pro from cart", exact: true }).click();
  await expect(page.locator("[data-comparison-cart-item]")).toHaveCount(1);
  await expect(page.locator("[data-comparison-cart-total]")).toHaveText("$387");
  await page.getByRole("button", { name: "Clear cart", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your cart is empty", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue comparing", exact: true }).click();
  await expect(page.locator("[data-comparison-cart-count]")).toHaveText("0");
});

test("native NumberField bounds and cart-button limits agree", async ({ page }) => {
  await open(page, 3);
  const add = page.getByRole("button", { name: "Add Sora One to cart", exact: true });
  for (let i = 0; i < 5; i++) await add.click();
  await expect(add).toBeDisabled();
  await openCart(page);
  await expect(page.getByLabel("Sora One quantity", { exact: true })).toHaveValue("5");
  await expect(
    page.getByRole("button", { name: "Increase Sora One quantity", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Decrease Sora One quantity", exact: true }).click();
  await expect(page.getByLabel("Sora One quantity", { exact: true })).toHaveValue("4");
  await page.getByRole("button", { name: "Continue browsing", exact: true }).click();
  await expect(add).toBeEnabled();
});

test("swapping and resetting the chosen pair preserve added model quantities", async ({ page }) => {
  await open(page, 2);
  await page.getByRole("button", { name: "Add Field Pro to cart", exact: true }).click();
  await page.getByRole("button", { name: "Swap models", exact: true }).click();
  await page.getByRole("button", { name: "Reset pair", exact: true }).click();
  await openCart(page);
  await expect(page.locator('[data-comparison-cart-item="field"]')).toBeVisible();
  await expect(page.locator("[data-comparison-cart-total]")).toHaveText("$199");
});

for (const n of [1, 2, 3])
  for (const width of [1440, 390]) {
    test(`Comparison ${n} fits ${width}px with original media, legible heading and usable cart`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, n);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      const headingStyle = await page.locator("[data-comparison-heading]").evaluate((element) => ({
        fontSize: getComputedStyle(element).fontSize,
        lineHeight: getComputedStyle(element).lineHeight,
      }));
      expect(headingStyle).toEqual(
        width === 390
          ? { fontSize: "24px", lineHeight: "32px" }
          : { fontSize: "30px", lineHeight: "36px" },
      );
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
      if (n === 3) await expectKeySpecsContained(page);
      await page
        .getByRole("button", {
          name: n === 2 ? "Add Field Pro to cart" : "Add Sora One to cart",
          exact: true,
        })
        .click();
      await openCart(page);
      await expect(page.locator("[data-comparison-cart-item]")).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await page
        .getByRole("button", {
          name: n === 2 ? "Increase Field Pro quantity" : "Increase Sora One quantity",
          exact: true,
        })
        .click();
      await expect(page.locator("[data-comparison-cart-total]")).toHaveText(
        n === 2 ? "$398" : "$258",
      );
    });
  }

for (const [n, module, component] of [
  [1, "spec-table", "SpecComparisonTable"],
  [2, "two-product", "TwoProductCompare"],
  [3, "buying-guide", "BuyingGuidePicks"],
] as const) {
  test(`Comparison ${n} actual source default, clipboard, downloaded leaf and ZIP match`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/ecommerce/comparison/comparison-${n}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const source = dialog.locator(".source-code");
    const filename = `src/blocks/commerce/comparison-variants/${module}.tsx`;
    await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(filename);
    await expect(source).toContainText(`function ${component}`);
    const expected = await readFile(filename, "utf8");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const filePromise = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    expect(await readFile((await (await filePromise).path())!, "utf8")).toBe(expected);
    const zipPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
    const entries = unzipSync(new Uint8Array(await readFile((await (await zipPromise).path())!)));
    expect(new TextDecoder().decode(entries[filename])).toBe(expected);
    for (const path of [
      "src/blocks/commerce/comparison-variants/cart.tsx",
      "src/blocks/application/dialog-variants/first-run/free/dialog-surface.tsx",
      "src/blocks/application/dialog-variants/first-run/first-run.css",
      "src/blocks/commerce/wishlist-artwork.ts",
      "src/components/reui/rating.tsx",
      "src/components/reui/number-field.tsx",
      "src/components/reui/REUI-LICENSE.txt",
    ]) {
      expect(entries[path]).toBeDefined();
      expect(new TextDecoder().decode(entries[path])).toBe(await readFile(path, "utf8"));
    }
    if (n === 1) expect(entries["src/components/reui/data-grid/data-grid-table.tsx"]).toBeDefined();
    if (n === 2 || n === 3) expect(entries["src/components/reui/frame.tsx"]).toBeDefined();
  });
}
