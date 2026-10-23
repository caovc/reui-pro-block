import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";
async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/wishlist/wishlist-${n}`);
  await expect(page.locator(`[data-wishlist-variant="${n}"]`)).toBeVisible();
}
const row = (page: Page, name: string) =>
  page.getByRole("group", { name: `Wishlist item ${name}`, exact: true });

test("actual DataGrid selection is indeterminate and bulk cart excludes unavailable selected rows", async ({
  page,
}) => {
  await open(page, 1);
  await row(page, "Storm Wool Coat").getByRole("checkbox").check();
  await row(page, "Weekend Tote Bag").getByRole("checkbox").check();
  await expect(
    page.getByRole("checkbox", { name: "Select all wishlist items", exact: true }),
  ).toHaveAttribute("aria-checked", "mixed");
  await expect(page.locator("[data-wishlist-selection]")).toHaveText("2 items selected");
  await page.getByRole("button", { name: "Add 1 To Cart", exact: true }).click();
  await expect(page.locator("[data-wishlist-selection]")).toHaveText("5 items");
  await expect(page.locator("[data-wishlist-item]")).toHaveCount(5);
  await page.getByRole("button", { name: "View bag", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Storm Wool Coat");
  await expect(page.getByRole("dialog")).not.toContainText("Weekend Tote Bag");
  await expect(page.locator("[data-wishlist-bag-total]")).toHaveText("$385");
});

test("native select-all removal updates rows/counts and actual free Empty offers recovery", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("checkbox", { name: "Select all wishlist items", exact: true }).check();
  await expect(page.locator("[data-wishlist-selection]")).toHaveText("5 items selected");
  await page.getByRole("button", { name: "Remove selected wishlist items", exact: true }).click();
  await expect(page.locator("[data-wishlist-item]")).toHaveCount(0);
  await expect(page.locator("[data-wishlist-count]")).toHaveText("0 items");
  await expect(
    page.getByRole("checkbox", { name: "Select all wishlist items", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Discover more pieces", exact: true }).click();
  const product = page
    .getByRole("dialog")
    .locator('[data-slot="item"]')
    .filter({ hasText: "Atelier Tulle Blouse" });
  await product.getByRole("button", { name: "Save item", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-wishlist-item]")).toHaveCount(1);
  await expect(page.locator("[data-wishlist-count]")).toHaveText("1 item");
  await expect(
    page.getByRole("checkbox", { name: "Select all wishlist items", exact: true }),
  ).toBeEnabled();
});

test("individual removal and Clear keep the actual selection model consistent", async ({
  page,
}) => {
  await open(page, 1);
  await row(page, "Italian Penny Loafers").getByRole("checkbox").check();
  await row(page, "Cashmere V-Neck Sweater").getByRole("checkbox").check();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator("[data-wishlist-selection]")).toHaveText("5 items");
  await expect(row(page, "Italian Penny Loafers").getByRole("checkbox")).not.toBeChecked();
  await page
    .getByRole("button", { name: "Remove Italian Penny Loafers from wishlist", exact: true })
    .click();
  await expect(page.locator("[data-wishlist-count]")).toHaveText("4 items");
  await expect(page.getByRole("checkbox")).toHaveCount(5);
});

test("sharing copies the actual preview link and downloads the current list", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, 1);
  await page
    .getByRole("button", { name: "Remove Storm Wool Coat from wishlist", exact: true })
    .click();
  await page.getByRole("button", { name: "Share List", exact: true }).click();
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(page.getByRole("button", { name: "Link copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download list", exact: true }).click();
  const download = await pending;
  const list = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(list.items).toHaveLength(4);
  expect(list.items.some((item: { name: string }) => item.name === "Storm Wool Coat")).toBe(false);
});

test("counted native status tabs really filter and support keyboard navigation", async ({
  page,
}) => {
  await open(page, 2);
  await page.getByRole("tab", { name: "Price Drops, 1 item", exact: true }).click();
  await expect(page.locator("[data-wishlist-item]")).toHaveCount(1);
  await expect(page.locator("[data-wishlist-item]")).toHaveAttribute(
    "data-wishlist-item",
    "storm-coat",
  );
  await page.getByRole("tab", { name: "All, 5 items", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Almost Gone, 1 item", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("[data-wishlist-item]")).toHaveAttribute(
    "data-wishlist-item",
    "penny-loafers",
  );
});

test("restock form validates email, saves locally and can turn the alert off", async ({ page }) => {
  await open(page, 2);
  await page.getByRole("button", { name: "Notify When Restocked", exact: true }).click();
  await page.getByRole("button", { name: "Save restock alert", exact: true }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill("wishlist@example.com");
  await page.getByRole("button", { name: "Save restock alert", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("wishlist@example.com");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Alert Saved", exact: true }).click();
  await page.getByRole("button", { name: "Turn off alert", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Notify When Restocked", exact: true }),
  ).toBeVisible();
});

test("add-all preserves the wishlist, excludes unavailable stock and real NumberField changes totals", async ({
  page,
}) => {
  await open(page, 2);
  await page.getByRole("button", { name: "Add 4 To Cart", exact: true }).click();
  await expect(page.locator("[data-wishlist-item]")).toHaveCount(5);
  await page.getByRole("button", { name: "View bag", exact: true }).click();
  await expect(page.locator("[data-wishlist-bag-total]")).toHaveText("$993");
  await page
    .getByRole("button", { name: "Increase quantity for Storm Wool Coat", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Quantity for Storm Wool Coat", exact: true }),
  ).toHaveValue("2");
  await expect(page.locator("[data-wishlist-bag-total]")).toHaveText("$1,378");
  await page
    .getByRole("button", { name: "Remove Italian Penny Loafers from bag", exact: true })
    .click();
  await expect(page.locator("[data-wishlist-bag-total]")).toHaveText("$1,083");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Bag · 4 items", exact: true })).toBeVisible();
});

test("removing the only filtered item updates tab counts and returns to All", async ({ page }) => {
  await open(page, 2);
  await page.getByRole("tab", { name: "Price Drops, 1 item", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove Storm Wool Coat from wishlist", exact: true })
    .click();
  await expect(page.getByRole("tab", { name: "All, 4 items", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: /Price Drops/ })).toHaveCount(0);
  await expect(page.locator("[data-wishlist-item]")).toHaveCount(4);
  await expect(page.getByText("Total savings $0", { exact: true })).toBeVisible();
});

test("move one then all remaining available items genuinely leaves only the unavailable product", async ({
  page,
}) => {
  await open(page, 3);
  await page
    .getByRole("button", { name: "Move Atelier Tulle Blouse to cart", exact: true })
    .click();
  await expect(page.locator("[data-wishlist-count]")).toHaveText("5 saved");
  await expect(page.locator('[data-wishlist-item="tulle-blouse"]')).toHaveCount(0);
  await page.getByRole("button", { name: /Move All To Cart/ }).click();
  await expect(page.locator("[data-wishlist-count]")).toHaveText("1 saved");
  await expect(page.locator("[data-wishlist-item]")).toHaveAttribute(
    "data-wishlist-item",
    "wide-trouser",
  );
  await expect(page.getByRole("button", { name: /Move All To Cart/ })).toBeDisabled();
  await expect(page.getByRole("tab")).toHaveCount(1);
  await page.getByRole("button", { name: "View bag", exact: true }).click();
  await expect(page.locator("[data-wishlist-bag-total]")).toHaveText("$735");
  await expect(page.getByRole("dialog")).not.toContainText("Pleated Wide Trouser");
});
for (const n of [1, 2, 3])
  test(`wishlist ${n} original product illustrations decode and the real layout fits390px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, n);
    const images = page.locator(".isolated-preview img");
    expect(
      await images.evaluateAll(async (list) => {
        await Promise.all(
          list.map(async (element) => {
            try {
              await (element as HTMLImageElement).decode();
            } catch {}
          }),
        );
        return list.every(
          (element) =>
            (element as HTMLImageElement).naturalWidth > 0 &&
            (element as HTMLImageElement).src.startsWith("data:image/svg+xml,"),
        );
      }),
    ).toBe(true);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });

test("actual wishlist source ZIP carries native selection and original illustration sources", async ({
  page,
}) => {
  await page.goto("./#/block/ecommerce/wishlist/wishlist-1");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const entries = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const name of [
    "src/blocks/commerce/wishlist-artwork.ts",
    "src/blocks/commerce/wishlist-bulk.tsx",
    "src/components/reui/data-grid/data-grid-table.tsx",
    "src/components/reui/number-field.tsx",
    "src/lib/demo-artwork.ts",
  ])
    expect(entries[name]).toBeDefined();
  const source = new TextDecoder().decode(entries["src/blocks/commerce/wishlist-bulk.tsx"]);
  expect(source).toContain("DataGridTableRowSelectAll");
  expect(source).toContain("onRowSelectionChange");
});
