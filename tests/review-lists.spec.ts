import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/review/review-${n}`);
  await expect(page.locator(`[data-review-variant="${n}"]`)).toBeVisible();
}
async function submitReview(page: Page, name: string, rating = 4) {
  await page.getByRole("button", { name: "Write a review", exact: true }).click();
  await page.getByLabel("Your name", { exact: true }).fill(name);
  await page.getByRole("button", { name: `Rate ${rating} out of 5 stars`, exact: true }).click();
  await page
    .getByLabel("Review title", { exact: true })
    .fill("Comfortable during an afternoon of editing");
  await page
    .getByLabel("Your review", { exact: true })
    .fill(
      "The fit stays comfortable and the useful controls are easy to find during a long afternoon.",
    );
  await page.getByRole("button", { name: "Save review", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
}

test("actual free topic ToggleGroup filters reviews and deselection returns to all", async ({
  page,
}) => {
  await open(page, 2);
  await expect(page.locator("[data-owner-review]:visible")).toHaveCount(6);
  const battery = page.getByLabel("Filter reviews by Battery", { exact: true });
  await battery.click();
  await expect(battery).toHaveAttribute("data-state", "on");
  await expect(page.locator("[data-owner-review]:visible")).toHaveCount(2);
  await expect(page.locator("[data-owner-review]:visible").first()).toHaveAttribute(
    "data-owner-review",
    "leon",
  );
  await expect(page.locator("[data-owner-review]:visible").last()).toHaveAttribute(
    "data-owner-review",
    "priya",
  );
  await battery.click();
  await expect(page.locator("[data-owner-review]:visible")).toHaveCount(6);
  await expect(page.getByLabel("Filter reviews by All reviews", { exact: true })).toHaveAttribute(
    "data-state",
    "on",
  );
});

test("topic selection preserves native group keyboard interaction", async ({ page }) => {
  await open(page, 2);
  await page.getByLabel("Filter reviews by All reviews", { exact: true }).focus();
  await page.keyboard.press("End");
  await expect(page.getByLabel("Filter reviews by Companion App", { exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Filter reviews by Companion App", { exact: true })).toHaveAttribute(
    "data-state",
    "on",
  );
  await expect(page.locator("[data-owner-review]:visible")).toHaveCount(2);
  await expect(page.locator("[data-owner-review]:visible").first()).toHaveAttribute(
    "data-owner-review",
    "theo",
  );
});

test("helpful votes update only the intended review and undo cleanly", async ({ page }) => {
  await open(page, 2);
  const helpful = page.getByRole("button", {
    name: "Mark review by Mira Okonkwo as helpful",
    exact: true,
  });
  await helpful.click();
  await expect(helpful).toContainText("249 found this helpful");
  await expect(helpful).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Mark review by Theo Larsen as helpful", exact: true }),
  ).toContainText("192 found this helpful");
  await page.getByLabel("Filter reviews by Battery", { exact: true }).click();
  await expect(helpful).not.toBeVisible();
  await page.getByLabel("Filter reviews by All reviews", { exact: true }).click();
  await expect(helpful).toContainText("249 found this helpful");
  await helpful.click();
  await expect(helpful).toContainText("248 found this helpful");
  await expect(helpful).toHaveAttribute("aria-pressed", "false");
});

test("adding a review clears the active topic and inserts the chosen local review", async ({
  page,
}) => {
  await open(page, 2);
  await page.getByLabel("Filter reviews by Battery", { exact: true }).click();
  await submitReview(page, "Topic reviewer", 4);
  await expect(page.locator("[data-owner-review]:visible")).toHaveCount(7);
  await expect(page.locator("[data-owner-review]:visible").first()).toContainText("Topic reviewer");
  await expect(page.getByLabel("Filter reviews by All reviews", { exact: true })).toHaveAttribute(
    "data-state",
    "on",
  );
  await expect(page.getByText("1,285", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View all 1,285 reviews", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Showing 7 original sample reviews");
});

test("free rating summary renders five real distribution progress bars", async ({ page }) => {
  await open(page, 3);
  await expect(page.locator("[data-review-average]")).toHaveText("4.8");
  await expect(page.getByRole("progressbar")).toHaveCount(5);
  await expect(
    page.getByRole("progressbar", { name: "5-star reviews", exact: true }),
  ).toHaveAttribute("aria-valuenow", /^81\./);
  await expect(page.locator('[data-star-count="5"] [data-distribution-count]')).toHaveText("1,052");
});

test("summary sorting changes actual row order and show more reveals remaining samples", async ({
  page,
}) => {
  await open(page, 3);
  await expect(page.locator("[data-owner-review]:visible")).toHaveCount(3);
  await page.getByRole("combobox", { name: "Sort reviews", exact: true }).click();
  await page.getByRole("option", { name: "Lowest Rated", exact: true }).click();
  await expect(page.locator("[data-owner-review]:visible").first()).toHaveAttribute(
    "data-owner-review",
    "leon",
  );
  await page.getByRole("button", { name: "Show more reviews", exact: true }).click();
  await expect(page.locator("[data-owner-review]:visible")).toHaveCount(6);
  await expect(page.getByRole("status")).toHaveText("All 6 sample reviews shown");
  await page.getByRole("combobox", { name: "Sort reviews", exact: true }).click();
  await page.getByRole("option", { name: "Most Helpful", exact: true }).click();
  await expect(page.locator("[data-owner-review]:visible")).toHaveCount(3);
  await expect(page.locator("[data-owner-review]:visible").first()).toHaveAttribute(
    "data-owner-review",
    "mira",
  );
});

test("summary composer updates the selected star bucket and review total", async ({ page }) => {
  await open(page, 3);
  await expect(page.locator('[data-star-count="2"] [data-distribution-count]')).toHaveText("18");
  await submitReview(page, "Summary reviewer", 2);
  await expect(page.locator('[data-star-count="2"] [data-distribution-count]')).toHaveText("19");
  await expect(page.locator("[data-review-count]")).toHaveText("1,285");
  await expect(page.locator("[data-owner-review]:visible").first()).toContainText(
    "Summary reviewer",
  );
  await expect(page.locator("[data-owner-review]:visible").first()).toContainText("2.0");
});

test("highlights is a static six-quote layout and read all opens real local reviews", async ({
  page,
}) => {
  await open(page, 4);
  await expect(page.locator("[data-owner-highlight]")).toHaveCount(6);
  await expect(page.locator('[data-slot="carousel"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Read all 1,284 reviews", exact: true }).click();
  await expect(page.getByRole("dialog").locator("[data-owner-review]:visible")).toHaveCount(6);
  await expect(page.getByRole("dialog")).toContainText("Showing 6 original sample reviews");
});

test("a new highlight is shown immediately with its original avatar and rating", async ({
  page,
}) => {
  await open(page, 4);
  await submitReview(page, "Highlight reviewer", 3);
  const first = page.locator("[data-owner-highlight]").first();
  await expect(page.locator("[data-owner-highlight]")).toHaveCount(7);
  await expect(first).toContainText("Highlight reviewer");
  await expect(first.getByRole("blockquote")).toContainText("long afternoon");
  await expect(first).toContainText("3.0");
  await expect(first.locator("img")).toHaveAttribute("src", /^data:image\/svg\+xml,/);
  await expect(
    page.getByRole("button", { name: "Read all 1,285 reviews", exact: true }),
  ).toBeVisible();
});

for (const n of [2, 3, 4]) {
  test(`review ${n} fits 390px and decodes original local avatars`, async ({ page }) => {
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
}

test("actual summary ZIP contains official summary primitives and original avatar source", async ({
  page,
}) => {
  await page.goto("./#/block/ecommerce/review/review-3");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const entries = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const name of [
    "src/blocks/commerce/review-summary.tsx",
    "src/components/reui/rating.tsx",
    "src/components/ui/progress.tsx",
    "src/lib/demo-artwork.ts",
  ])
    expect(entries[name]).toBeDefined();
  expect(new TextDecoder().decode(entries["src/blocks/commerce/review-summary.tsx"])).toContain(
    "c-rating-6",
  );
  expect(
    Object.keys(entries).some((name) => /commerce\/assets\/reviews\/owner-\d\.jpg$/.test(name)),
  ).toBe(false);
});
