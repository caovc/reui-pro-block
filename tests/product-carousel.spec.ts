import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const detail = (n: number) => `./#/preview/ecommerce/product-detail/product-detail-${n}`;
const card = (n: number) => `./#/preview/ecommerce/product-card/product-card-${n}`;
async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator(".isolated-preview")).toBeVisible();
}
test("c-carousel9 main swipe/keyboard and thumbnail click synchronize the actual selected image", async ({
  page,
}) => {
  await open(page, detail(2));
  const main = page.getByRole("region", {
    name: /image gallery$/,
    exact: true,
  });
  await expect(page.locator('[data-free-product-gallery] [data-slot="carousel"]')).toHaveCount(2);
  await page.getByRole("button", { name: "Show image 3 of 5", exact: true }).click();
  await expect(page.locator("[data-gallery-image]")).toHaveAttribute("alt", /view 3/);
  await main.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("[data-gallery-image]")).toHaveAttribute("alt", /view 4/);
  await expect(
    page.getByRole("button", { name: "Show image 4 of 5", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  // Embla emits select when the target changes, before its animated slide reaches the viewport.
  // Start this gesture from the physically aligned fourth slide, not only its selected metadata.
  await expect
    .poll(async () => {
      const [slide, viewport] = await Promise.all([
        main.locator('[data-slot="carousel-item"][aria-hidden="false"]').boundingBox(),
        main.locator('[data-slot="carousel-content"]').boundingBox(),
      ]);
      return slide && viewport ? Math.abs(slide.x - viewport.x) : Infinity;
    })
    .toBeLessThanOrEqual(1);
  const box = await main.boundingBox();
  if (!box) throw new Error("Gallery missing");
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, {
    steps: 15,
  });
  await page.mouse.up();
  await expect(page.locator("[data-gallery-image]")).toHaveAttribute("alt", /view 5/);
  await expect(
    page.getByRole("button", { name: "Show image 5 of 5", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("vertical and book thumbnails retain selected style and counters after c-carousel9 navigation", async ({
  page,
}) => {
  await open(page, detail(3));
  await page.getByRole("button", { name: "Show image 5 of 6", exact: true }).click();
  await expect(page.locator("[data-gallery-image]")).toHaveAttribute("alt", /view 5/);
  await open(page, detail(4));
  await page.getByRole("button", { name: "Show Workbook preview", exact: true }).click();
  await expect(page.locator("output")).toHaveText("04 / 05");
  await expect(page.locator("[data-gallery-image]")).toHaveAttribute("alt", /view 4/);
});
test("official autoplay advances reviews, stops on dot choice and resumes only when requested", async ({
  page,
}) => {
  test.setTimeout(45000);
  await open(page, detail(2));
  const rail = page.locator("[data-free-review-carousel]");
  const first = rail.getByRole("button", {
    name: "Go to review 1 of 4: Mira Okonkwo",
    exact: true,
  });
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(
    rail.getByRole("button", {
      name: "Go to review 2 of 4: Theo Larsen",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true", { timeout: 10000 });
  await rail
    .getByRole("button", {
      name: "Go to review 3 of 4: Priya Anand",
      exact: true,
    })
    .click();
  await expect(rail.getByRole("button", { name: "Play reviews", exact: true })).toBeVisible();
  await expect(rail.getByRole("blockquote")).toContainText("Soft pads");
  await page.waitForTimeout(6800);
  await expect(
    rail.getByRole("button", {
      name: "Go to review 3 of 4: Priya Anand",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await rail.getByRole("button", { name: "Play reviews", exact: true }).click();
  await rail.getByRole("button", { name: "Pause reviews", exact: true }).blur();
  await page.mouse.move(0, 0);
  await expect(
    rail.getByRole("button", {
      name: "Go to review 4 of 4: Jules Akinyemi",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true", { timeout: 10000 });
});
test("similar products uses actual responsive Embla snap count and original previous/next controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, card(4));
  const rail = page.locator("[data-free-product-rail]");
  await expect(rail.getByText("1 / 2", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Previous similar products",
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next similar products", exact: true }).click();
  await expect(rail.getByText("2 / 2", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next similar products", exact: true }),
  ).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(rail.getByText(/\/ 8$/)).toBeVisible();
  await page.getByRole("button", { name: "Previous similar products", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
});
test("quick-buy card uses real looping carousel controls and clickable dots without resetting size/cart", async ({
  page,
}) => {
  await open(page, card(3));
  await page.getByRole("radio", { name: "L", exact: true }).click();
  await page.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(
    page.getByRole("img", {
      name: "Ribbed tank set alternative view",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go to product photo 1", exact: true }).click();
  await page.getByRole("button", { name: "Add to Bag", exact: true }).click();
  await expect(page.getByRole("button", { name: "Added · Size L", exact: true })).toBeVisible();
});
for (const n of [1, 2, 3, 4, 5, 6])
  test(`detail ${n} real carousel fits 390px and keeps active image unique`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, detail(n));
    await expect(page.locator("[data-gallery-image]")).toHaveCount(1);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });
