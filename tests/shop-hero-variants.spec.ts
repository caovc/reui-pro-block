import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/shop-hero/shop-hero-${n}`);
  await expect(page.locator(`[data-shop-hero-variant="${n}"]`)).toBeVisible();
}

test("live cart mosaic adds individual products and derives the actual subtotal", async ({
  page,
}) => {
  await open(page, 1);
  await expect(page.getByRole("button", { name: "Cart with 0 items", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add Sundown Weekender to cart", exact: true }).click();
  await page.getByRole("button", { name: "Add Wayfarer Daypack to cart", exact: true }).click();
  await page.getByRole("button", { name: "Add Sundown Weekender to cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart with 3 items", exact: true }).click();
  await expect(page.locator("[data-shop-cart-total]")).toHaveText("$596");
  await expect(page.getByRole("textbox", { name: "Quantity of Sundown Weekender" })).toHaveValue(
    "2",
  );
  await page.getByRole("button", { name: "Increase Wayfarer Daypack", exact: true }).click();
  await expect(page.locator("[data-shop-cart-total]")).toHaveText("$744");
  await page.getByRole("button", { name: "Remove Sundown Weekender", exact: true }).click();
  await expect(page.locator("[data-shop-cart-total]")).toHaveText("$296");
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Order review ready for 2 items · $296");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Cart with 2 items", exact: true })).toBeVisible();
});

test("local cart supports empty state, quantity lower bound and removal back to empty", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("button", { name: "Cart with 0 items", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Your bag is empty.");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Add Saddle Tote to cart", exact: true }).click();
  await page.getByRole("button", { name: "Cart with 1 item", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Decrease Saddle Tote", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Remove Saddle Tote", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Your bag is empty.");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Cart with 0 items", exact: true })).toBeVisible();
});

test("collection CTA opens real product rows, adds from the free Item actions and resets on reload", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("button", { name: "Shop The Edit", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("The Spring 2026 Edit");
  await expect(dialog.locator('[data-slot="item"]')).toHaveCount(3);
  await dialog.getByRole("button", { name: "Add Saddle Tote", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Saddle Tote added to your cart.");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Cart with 1 item", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Cart with 0 items", exact: true })).toBeVisible();
});

for (const width of [390, 1280]) {
  test(`live cart hero ${width}px preserves mosaic structure, original media and title line height`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, 1);
    const tiles = page.locator("[data-shop-product]");
    const positions = await Promise.all([0, 1, 2].map((index) => tiles.nth(index).boundingBox()));
    expect(positions.every(Boolean)).toBe(true);
    const [featured, second, third] = positions as {
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
    if (width === 390) {
      expect(second.y).toBeGreaterThan(featured.y + featured.height - 2);
      expect(Math.abs(second.y - third.y)).toBeLessThan(2);
      expect(third.x).toBeGreaterThan(second.x);
    } else {
      expect(second.x).toBeGreaterThan(featured.x);
      expect(third.y).toBeGreaterThan(second.y);
    }
    const heading = await page.locator("#live-shop-heading").evaluate((element) => {
      const style = getComputedStyle(element);
      return { font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
    });
    expect(heading.line / heading.font).toBeLessThan(1.1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
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
    await page.getByRole("button", { name: "Add Sundown Weekender to cart", exact: true }).click();
    await page.getByRole("button", { name: "Cart with 1 item", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test("live cart actual project ZIP contains the implementation and official REUI dependencies", async ({
  page,
}) => {
  await page.goto("./#/block/ecommerce/shop-hero/shop-hero-1");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const entries = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const file of [
    "src/blocks/commerce/shop-hero-variants/live-cart.tsx",
    "src/blocks/commerce/shop-hero-variants/artwork.ts",
    "src/blocks/commerce/shop-hero-variants/use-shop-cart.ts",
    "src/components/reui/badge.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/number-field.tsx",
    "src/components/reui/alert.tsx",
  ])
    expect(entries[file]).toBeDefined();
  const source = new TextDecoder().decode(
    entries["src/blocks/commerce/shop-hero-variants/live-cart.tsx"],
  );
  expect(source).toContain("LiveCartHero");
  expect(source).toContain('from "@/components/reui/badge"');
});

test("bento quick add keeps the 1600 ms check feedback and also updates the real local cart", async ({
  page,
}) => {
  await open(page, 2);
  await page.getByRole("button", { name: "Add Wayfarer Daypack to cart", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Wayfarer Daypack added to cart", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cart with 1 item", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Wayfarer Daypack to cart", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cart with 1 item", exact: true }).click();
  await expect(page.locator("[data-shop-cart-total]")).toHaveText("$148");
});

test("countdown derives its displayed minutes from a real deadline rather than static text", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-23T00:00:00Z") });
  await open(page, 3);
  await page.clock.pauseAt(new Date("2026-10-23T00:00:10Z"));
  await expect(page.getByRole("timer")).toBeVisible();
  const before = Number(await page.locator('[data-countdown-unit="Minutes"]').textContent());
  await page.clock.runFor(61_000);
  const after = Number(await page.locator('[data-countdown-unit="Minutes"]').textContent());
  expect(before - after).toBeGreaterThanOrEqual(1);
  expect(before - after).toBeLessThanOrEqual(2);
  await expect(page.locator('[data-countdown-unit="Days"]')).toHaveText("02");
});

test("deal promo reuses the existing official clipboard flow and sale CTA has real products", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, 3);
  await expect(page.locator("[data-deal-promo]")).toHaveCount(3);
  await page.getByRole("button", { name: "Copy code WELCOME10", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied WELCOME10", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("WELCOME10");
  await page.getByRole("button", { name: "Shop the sale", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("The weekly sale");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add Sundown Weekender", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Sundown Weekender added",
  );
});

for (const n of [2, 3]) {
  for (const width of [390, 1280]) {
    test(`Shop Hero ${n} preserves its own layout and local artwork at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, n);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      if (n === 2) {
        await expect(page.locator("[data-bento-product]")).toHaveCount(3);
        await expect(page.locator("[data-shop-sale-tile]")).toBeVisible();
        const grid = await page
          .locator("[data-shop-bento]")
          .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
        expect(grid).toBe(width === 390 ? 2 : 4);
      } else {
        const tiles = page.locator("[data-deal-promo]");
        const first = (await tiles.nth(0).boundingBox())!;
        const second = (await tiles.nth(1).boundingBox())!;
        expect(width === 390 ? second.y > first.y : second.x > first.x).toBe(true);
        await expect(page.locator('[data-slot="rating"]')).toBeVisible();
      }
      const heading = await page.locator(".isolated-preview h2").evaluate((element) => {
        const style = getComputedStyle(element);
        return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
      });
      expect(heading).toBeLessThan(1.1);
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
    });
  }
}

for (const [n, module] of [
  [2, "bento"],
  [3, "countdown"],
] as const) {
  test(`Shop Hero ${n} actual ZIP contains its real leaf and reused free implementations`, async ({
    page,
  }) => {
    await page.goto(`./#/block/ecommerce/shop-hero/shop-hero-${n}`);
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download source", exact: true }).click();
    const download = await pending;
    const entries = unzipSync(new Uint8Array(await readFile((await download.path())!)));
    expect(entries[`src/blocks/commerce/shop-hero-variants/${module}.tsx`]).toBeDefined();
    expect(
      new TextDecoder().decode(entries[`src/blocks/commerce/shop-hero-variants/${module}.tsx`]),
    ).toBe(await readFile(`src/blocks/commerce/shop-hero-variants/${module}.tsx`, "utf8"));
    expect(entries["src/blocks/commerce/shop-hero-variants/image-card.tsx"]).toBeDefined();
    expect(
      new TextDecoder().decode(entries["src/blocks/commerce/shop-hero-variants/image-card.tsx"]),
    ).toContain("c-card-8");
    if (n === 3) {
      expect(entries["src/components/reui/rating.tsx"]).toBeDefined();
      expect(entries["src/blocks/commerce/coupon-variants/copy.tsx"]).toBeDefined();
      expect(
        entries["src/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard.ts"],
      ).toBeDefined();
    }
  });
}

for (const [n, module, component] of [
  [1, "live-cart", "LiveCartHero"],
  [2, "bento", "BentoShopHero"],
  [3, "countdown", "CountdownDealHero"],
] as const) {
  test(`Shop Hero ${n} default source, clipboard and single-file download match its actual leaf`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/ecommerce/shop-hero/shop-hero-${n}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const filename = `src/blocks/commerce/shop-hero-variants/${module}.tsx`;
    await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(filename);
    const source = dialog.locator(".source-code");
    await expect(source).toContainText(`function ${component}`);
    const expected = await readFile(filename, "utf8");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const pending = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    const file = await pending;
    expect(file.suggestedFilename()).toBe(`${module}.tsx`);
    expect(await readFile((await file.path())!, "utf8")).toBe(expected);
  });
}
