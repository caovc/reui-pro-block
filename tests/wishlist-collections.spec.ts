import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/wishlist/wishlist-${n}`);
  await expect(page.locator(`[data-wishlist-variant="${n}"]`)).toBeVisible();
}

test("boards have actual83 product records and native recent/shared filters", async ({ page }) => {
  await open(page, 4);
  await expect(page.locator("[data-wishlist-count]")).toHaveText("83 items across 6 collections");
  await expect(page.locator("[data-wishlist-collection]")).toHaveCount(6);
  await expect(page.locator('[data-wishlist-collection="gifts"]')).toContainText("+3");
  await page.getByRole("tab", { name: "Recently Updated, 3 collections", exact: true }).click();
  await expect(page.locator("[data-wishlist-collection]")).toHaveCount(3);
  await page.getByRole("tab", { name: "Shared, 2 collections", exact: true }).click();
  await expect(page.locator("[data-wishlist-collection]")).toHaveCount(2);
  await expect(page.locator('[data-wishlist-collection="wedding"]')).toBeVisible();
});

test("collection create validates, adds an empty record and saving updates the same collection", async ({
  page,
}) => {
  await open(page, 4);
  await page.getByRole("button", { name: "New Collection", exact: true }).first().click();
  await page.getByRole("button", { name: "Create collection", exact: true }).click();
  await expect(page.getByLabel("Collection name", { exact: true })).toBeVisible();
  await page.getByLabel("Collection name", { exact: true }).fill("Weekend plans");
  await page.getByLabel("Description", { exact: true }).fill("A small original edit.");
  await page.getByRole("checkbox", { name: "Mark as shared", exact: true }).check();
  await page.getByRole("button", { name: "Create collection", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Weekend plans", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Discover more pieces", exact: true }).click();
  const browser = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: "Discover more pieces", exact: true }) });
  await browser
    .locator('[data-slot="item"]')
    .filter({ hasText: "Atelier Tulle Blouse" })
    .getByRole("button", { name: "Save item", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog").locator("[data-wishlist-item]")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-wishlist-count]")).toHaveText("84 items across 7 collections");
  await expect(page.getByRole("tab", { name: "Shared, 3 collections", exact: true })).toBeVisible();
});

test("native AlertDialog cancellation preserves collection and confirm updates totals", async ({
  page,
}) => {
  await open(page, 4);
  await page.getByRole("button", { name: "Delete Spring Capsule", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator("[data-wishlist-count]")).toHaveText("83 items across 6 collections");
  await page.getByRole("button", { name: "Delete Spring Capsule", exact: true }).click();
  await page.getByRole("button", { name: "Delete collection", exact: true }).click();
  await expect(page.locator("[data-wishlist-count]")).toHaveText("59 items across 5 collections");
  await expect(
    page.getByRole("tab", { name: "Recently Updated, 2 collections", exact: true }),
  ).toBeVisible();
});

test("board detail renders actual24 records and removal synchronizes cover and total counts", async ({
  page,
}) => {
  await open(page, 4);
  await page.getByRole("button", { name: "Open Spring Capsule", exact: true }).click();
  await expect(page.getByRole("dialog").locator("[data-wishlist-item]")).toHaveCount(24);
  await page
    .getByRole("dialog")
    .locator("[data-wishlist-item]")
    .first()
    .getByRole("button", { name: /Remove .* from collection/ })
    .click();
  await expect(page.getByRole("dialog").locator("[data-wishlist-item]")).toHaveCount(23);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-wishlist-count]")).toHaveText("82 items across 6 collections");
  await expect(page.locator('[data-wishlist-collection="spring"]')).toContainText("+19");
});

test("priority action cycles through all three actual groups without changing totals", async ({
  page,
}) => {
  await open(page, 5);
  await expect(page.locator("[data-wishlist-priority-total]")).toHaveText("$1,300 total");
  for (const [label, id] of [
    ["Save For Later", "later"],
    ["Maybe", "maybe"],
    ["Must Have", "must"],
  ]) {
    await page
      .getByRole("button", { name: `Move Lumen Studio Speakers to ${label}`, exact: true })
      .click();
    await expect(
      page.locator(`[data-wishlist-priority="${id}"] [data-wishlist-item="studio-speakers"]`),
    ).toBeVisible();
    await expect(page.locator("[data-wishlist-count]")).toContainText("6 items");
    await expect(page.locator("[data-wishlist-priority-total]")).toHaveText("$1,300 total");
  }
});

test("priority removal recalculates savings and stock-aware total, actual cart controls stay live", async ({
  page,
}) => {
  await open(page, 5);
  await page
    .getByRole("button", { name: "Add Lumen Studio Speakers to cart", exact: true })
    .click();
  await page.getByRole("button", { name: "View bag", exact: true }).click();
  await expect(page.locator("[data-wishlist-bag-total]")).toHaveText("$329");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Remove Lumen Studio Speakers from wishlist", exact: true })
    .click();
  await expect(page.locator("[data-wishlist-priority-total]")).toHaveText("$971 total");
  await expect(page.locator("[data-wishlist-count]")).toContainText("$30 in savings");
  await page.getByRole("button", { name: "Notify Me", exact: true }).click();
  await page.getByLabel("Email address", { exact: true }).fill("collector@example.com");
  await page.getByRole("button", { name: "Save restock alert", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("collector@example.com");
});

test("all four collection rail buttons show their own product records and exact totals", async ({
  page,
}) => {
  await open(page, 6);
  for (const [name, id, count, total] of [
    ["Capsule Wardrobe", "capsule", 4, "$939"],
    ["Gift Ideas", "gift-ideas", 3, "$238"],
    ["Office Looks", "office", 2, "$473"],
    ["Travel Kit", "travel", 3, "$793"],
  ] as const) {
    await page.getByRole("button", { name: `Open ${name}`, exact: true }).click();
    await expect(page.locator("[data-wishlist-active-collection]")).toHaveAttribute(
      "data-wishlist-active-collection",
      id,
    );
    await expect(page.locator("[data-wishlist-item]")).toHaveCount(count);
    await expect(page.locator("[data-wishlist-collection-total]")).toHaveText(
      `${count} items · ${total}`,
    );
    await expect(page.getByRole("button", { name: `Open ${name}`, exact: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
  }
  await expect(page.getByText("Weekender Duffel", { exact: true })).toBeVisible();
});

test("active rail removals change rail/head totals and available add action excludes prior bag items", async ({
  page,
}) => {
  await open(page, 6);
  await page.getByRole("button", { name: "Open Gift Ideas", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove Slim Card Holder from collection", exact: true })
    .click();
  await expect(page.locator("[data-wishlist-count]")).toHaveText("4 collections · 11 saved items");
  await expect(page.locator('[data-wishlist-rail="gift-ideas"]')).toContainText("2 items · $153");
  await page.getByRole("button", { name: "Add 2 To Cart", exact: true }).click();
  await expect(page.locator("[data-wishlist-item]")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Add 0 To Cart", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "View bag", exact: true }).click();
  await expect(page.locator("[data-wishlist-bag-total]")).toHaveText("$153");
});

test("new rail collection becomes active and empty recovery saves into that exact collection", async ({
  page,
}) => {
  await open(page, 6);
  await page.getByRole("button", { name: "New Collection", exact: true }).click();
  await page.getByLabel("Collection name", { exact: true }).fill("Studio weekend");
  await page.getByRole("button", { name: "Create collection", exact: true }).click();
  await expect(page.locator("[data-wishlist-collection-total]")).toHaveText("0 items · $0");
  await page.getByRole("button", { name: "Discover more pieces", exact: true }).click();
  await page
    .getByRole("dialog")
    .locator('[data-slot="item"]')
    .filter({ hasText: "Atelier Tulle Blouse" })
    .getByRole("button", { name: "Save item", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-wishlist-count]")).toHaveText("5 collections · 13 saved items");
  await expect(page.locator("[data-wishlist-collection-total]")).toHaveText("1 item · $48");
});

for (const n of [4, 5, 6])
  test(`wishlist ${n} fits390px and all original local illustrations decode`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, n);
    expect(
      await page.locator(".isolated-preview img").evaluateAll(async (images) => {
        await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
        return (
          images.length > 0 &&
          images.every(
            (image) =>
              (image as HTMLImageElement).naturalWidth > 0 &&
              (image as HTMLImageElement).src.startsWith("data:image/svg+xml,"),
          )
        );
      }),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  });

test("rail source ZIP actually includes official AvatarGroup and original product art", async ({
  page,
}) => {
  await page.goto("./#/block/ecommerce/wishlist/wishlist-6");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const entries = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const name of [
    "src/blocks/commerce/wishlist-rail.tsx",
    "src/blocks/commerce/wishlist-collection-controls.tsx",
    "src/components/ui/avatar.tsx",
    "src/components/reui/frame.tsx",
    "src/blocks/commerce/wishlist-artwork.ts",
  ])
    expect(entries[name]).toBeDefined();
  expect(
    new TextDecoder().decode(entries["src/blocks/commerce/wishlist-collection-controls.tsx"]),
  ).toContain("<AvatarGroup");
});
