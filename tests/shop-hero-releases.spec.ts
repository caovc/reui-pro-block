import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/shop-hero/shop-hero-${n}`);
  await expect(page.locator(`[data-shop-hero-variant="${n}"]`)).toBeVisible();
}

test("seasonal counts agree with the actual edit and its searchable collection", async ({
  page,
}) => {
  await open(page, 6);
  await expect(page.locator("[data-seasonal-new]")).toHaveText("30");
  await expect(page.locator("[data-seasonal-image-count]")).toHaveText("30");
  await expect(page.locator("[data-seasonal-archive]")).toHaveText("12");
  await page.getByRole("button", { name: "Shop The Edit", exact: true }).click();
  await expect(page.locator("[data-collection-product]")).toHaveCount(30);
  await page.getByRole("textbox", { name: "Search collection pieces", exact: true }).fill("linen");
  await expect(page.locator("[data-collection-product]")).toHaveCount(3);
});

test("archive uses actual 40% price cuts including decimal amounts on all 12 eligible pieces", async ({
  page,
}) => {
  await open(page, 6);
  await page.getByRole("button", { name: /Shop Sale/ }).click();
  await expect(page.locator("[data-archive-product]")).toHaveCount(12);
  const amounts = await page.locator("[data-archive-product]").evaluateAll((rows) =>
    rows.map((row) => ({
      sale: Number(row.querySelector("[data-archive-sale]")!.textContent!.replace(/[^0-9.]/g, "")),
      original: Number(
        row.querySelector("[data-archive-original]")!.textContent!.replace(/[^0-9.]/g, ""),
      ),
    })),
  );
  for (const value of amounts) expect(value.sale).toBeCloseTo(value.original * 0.6, 2);
  expect(amounts.some((value) => value.sale === 106.8)).toBe(true);
});

test("collection switcher uses native keyboard tabs and exposes the selected collection", async ({
  page,
}) => {
  await open(page, 7);
  await expect(page.getByText("2 live", { exact: false })).toBeVisible();
  await page.getByRole("tab", { name: /The Everyday Edit/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Objects for Living/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator('[data-shop-hero-variant="7"]')).toHaveAttribute(
    "data-active-collection",
    "living",
  );
  await expect(
    page.getByRole("heading", { name: "Make room for the good things.", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-shop-hero-variant="7"]')).toHaveAttribute(
    "data-active-collection",
    "long-way",
  );
  await expect(
    page.getByRole("button", { name: "Set A Drop Reminder", exact: true }),
  ).toBeVisible();
});

test("all three collection panels navigate to their own dataset", async ({ page }) => {
  await open(page, 7);
  for (const [name, count] of [
    ["The Everyday Edit", 30],
    ["Objects for Living", 15],
    ["The Longer Way", 15],
  ] as const) {
    await page.getByRole("tab", { name: new RegExp(name) }).click();
    await page.getByRole("button", { name: `Preview all ${count} pieces`, exact: true }).click();
    await expect(page.locator("[data-collection-product]")).toHaveCount(count);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});

test("drop reminder validates, saves, survives tab changes, updates and removes without any POST", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await open(page, 7);
  await page.getByRole("tab", { name: /The Longer Way/ }).click();
  await page.getByRole("button", { name: "Set A Drop Reminder", exact: true }).click();
  await page.getByLabel("Email address", { exact: true }).fill("invalid-address");
  await page.getByRole("button", { name: "Save reminder", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill("demo@bricklane.example");
  await page.getByRole("button", { name: "Save reminder", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("demo@bricklane.example");
  await page.getByRole("tab", { name: /The Everyday Edit/ }).click();
  await page.getByRole("tab", { name: /The Longer Way/ }).click();
  await expect(page.getByRole("alert")).toContainText("demo@bricklane.example");
  await page.getByRole("button", { name: "Edit Drop Reminder", exact: true }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "demo@bricklane.example",
  );
  await page.getByLabel("Email address", { exact: true }).fill("updated@bricklane.example");
  await page.getByRole("button", { name: "Update reminder", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("updated@bricklane.example");
  await page.getByRole("button", { name: "Edit Drop Reminder", exact: true }).click();
  await page.getByRole("button", { name: "Remove reminder", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Set A Drop Reminder", exact: true }),
  ).toBeVisible();
  expect(posts).toEqual([]);
});

test("cancelling a reminder does not persist the draft", async ({ page }) => {
  await open(page, 7);
  await page.getByRole("tab", { name: /The Longer Way/ }).click();
  await page.getByRole("button", { name: "Set A Drop Reminder", exact: true }).click();
  await page.getByLabel("Email address", { exact: true }).fill("draft@bricklane.example");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Set A Drop Reminder", exact: true }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue("");
});

test("quilt keeps four individual price ranges and native keyboard collection navigation", async ({
  page,
}) => {
  await open(page, 8);
  for (const [id, range] of [
    ["clothing", "$38–$178"],
    ["footwear", "$88–$164"],
    ["accessories", "$35–$98"],
    ["home", "$42–$188"],
  ]) {
    await expect(page.locator(`[data-quilt-collection="${id}"]`)).toContainText(range);
    await expect(page.locator(`[data-quilt-collection="${id}"]`)).toContainText("15 pieces");
  }
  await page.getByRole("button", { name: "Explore Clothing", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-collection-product]")).toHaveCount(15);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Explore Clothing", exact: true })).toBeFocused();
});

for (const n of [6, 7, 8])
  for (const width of [1440, 390]) {
    test(`Shop Hero ${n} fits ${width}px with original media and working overlays`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, n);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      const heading = page
        .locator(n === 7 ? ".isolated-preview h3" : ".isolated-preview h2")
        .first();
      expect(
        await heading.evaluate((element) => {
          const style = getComputedStyle(element);
          return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
        }),
      ).toBeLessThan(1.1);
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
      if (n !== 7) {
        expect(
          await page
            .locator(".isolated-preview img")
            .first()
            .evaluate((image) => {
              const style = getComputedStyle(image);
              return [style.borderTopLeftRadius, style.borderTopRightRadius];
            }),
        ).toEqual(["0px", "0px"]);
      }
      if (n === 6) await page.getByRole("button", { name: /Shop Sale/ }).click();
      if (n === 7) {
        const strip = (await page
          .getByRole("tablist", { name: "Shop collections" })
          .boundingBox())!;
        const lastTab = (await page.getByRole("tab", { name: /The Longer Way/ }).boundingBox())!;
        const panel = (await page.getByRole("tabpanel").boundingBox())!;
        expect(strip.y + strip.height).toBeGreaterThanOrEqual(lastTab.y + lastTab.height);
        expect(panel.y).toBeGreaterThanOrEqual(strip.y + strip.height);
        await page.getByRole("tab", { name: /The Longer Way/ }).click();
        await page.getByRole("button", { name: "Set A Drop Reminder", exact: true }).click();
      }
      if (n === 8) {
        const tiles = page.locator("[data-quilt-collection]");
        const first = (await tiles.nth(0).boundingBox())!;
        const second = (await tiles.nth(1).boundingBox())!;
        expect(first.x).toBe(0);
        expect(first.y).toBe(0);
        if (width === 1440) {
          expect(first.width).toBe(720);
          expect(second.x).toBe(720);
          expect(second.y).toBe(first.y);
          const third = (await tiles.nth(2).boundingBox())!;
          expect(third.y).toBe(first.y + first.height);
        } else {
          expect(first.width).toBe(390);
          expect(second.x).toBe(0);
          expect(second.y).toBe(first.y + first.height);
        }
        await page.getByRole("button", { name: "Explore Clothing", exact: true }).click();
      }
      await expect(page.getByRole("dialog")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }

for (const [n, module, component] of [
  [6, "lookbook", "SeasonalLookbookHero"],
  [7, "collection-switcher", "CollectionSwitcherHero"],
  [8, "collection-quilt", "CollectionQuiltHero"],
] as const) {
  test(`Shop Hero ${n} default source, copy, file and ZIP expose the actual implementation`, async ({
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
    const pending = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    const file = await pending;
    expect(await readFile((await file.path())!, "utf8")).toBe(expected);
    const pendingZip = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
    const zip = await pendingZip;
    const entries = unzipSync(new Uint8Array(await readFile((await zip.path())!)));
    expect(new TextDecoder().decode(entries[filename])).toBe(expected);
    for (const path of [
      "src/blocks/commerce/shop-hero-variants/image-card.tsx",
      "src/blocks/commerce/shop-hero-variants/release-status.tsx",
      "src/components/reui/badge.tsx",
      "src/components/reui/REUI-LICENSE.txt",
      "src/blocks/commerce/shop-hero-variants/collection-dialog.tsx",
    ])
      expect(entries[path]).toBeDefined();
    if (n === 6) expect(entries["src/components/brand-mark.tsx"]).toBeDefined();
    if (n === 7)
      expect(entries["src/blocks/commerce/shop-hero-variants/drop-reminder.tsx"]).toBeDefined();
  });
}
