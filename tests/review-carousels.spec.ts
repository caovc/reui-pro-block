import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

const route = (n: number) => `./#/preview/ecommerce/review/review-${n}`;
async function open(page: Page, n: number) {
  await page.goto(route(n));
  await expect(page.locator(`[data-review-variant="${n}"]`)).toBeVisible();
}

test("avatar carousel uses real main/thumb synchronization after click and keyboard", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("button", { name: "Pause testimonials", exact: true }).click();
  await page
    .getByRole("button", { name: "Read review 3 of 5 by Leon Vargas", exact: true })
    .click();
  await expect(page.locator("[data-current-reviewer]")).toContainText("Leon Vargas");
  await expect(page.getByRole("blockquote")).toContainText("research sessions");
  await page.getByRole("region", { name: "Owner review carousel", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Read review 4 of 5 by Jules Akinyemi", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await expect(page.locator("[data-current-reviewer]")).toContainText("Jules Akinyemi");
  await expect(page.getByRole("blockquote")).toContainText("Long listening sessions");
});

test("avatar review form validates input and publishes chosen rating/name/text into the actual carousel", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("button", { name: "Pause testimonials", exact: true }).click();
  await page.getByRole("button", { name: "Write a review", exact: true }).click();
  await page.getByRole("button", { name: "Save review", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Write a review", exact: true })).toBeVisible();
  await page.getByLabel("Your name", { exact: true }).fill("Review QA");
  await page.getByRole("button", { name: "Rate 4 out of 5 stars", exact: true }).click();
  await page.getByLabel("Review title", { exact: true }).fill("A useful studio companion");
  await page
    .getByLabel("Your review", { exact: true })
    .fill("Clear playback and comfortable enough for an afternoon of editing.");
  await page.getByRole("button", { name: "Save review", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator("[data-current-reviewer]")).toContainText("Review QA");
  await expect(page.getByRole("blockquote")).toContainText("afternoon of editing");
  await expect(page.getByText("1,285 verified reviews", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Read review 1 of 6 by Review QA", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

for (const n of [5, 6]) {
  test(`testimonial ${n} dot navigation follows real Embla snap and keyboard control`, async ({
    page,
  }) => {
    await open(page, n);
    await page.getByRole("button", { name: "Pause testimonials", exact: true }).click();
    await page
      .getByRole("button", { name: "Go to testimonial 6 of 6 by Priya Anand", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Go to testimonial 6 of 6 by Priya Anand", exact: true }),
    ).toHaveAttribute("aria-current", "true");
    await page
      .getByRole("region", {
        name: n === 5 ? "Customer testimonials" : "Star-led testimonials",
        exact: true,
      })
      .focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("button", { name: "Go to testimonial 1 of 6 by Mira Okonkwo", exact: true }),
    ).toHaveAttribute("aria-current", "true");
  });
}

test("official Autoplay continues after dot choice and respects explicit pause/resume", async ({
  page,
}) => {
  test.setTimeout(45000);
  await open(page, 5);
  const last = page.getByRole("button", {
    name: "Go to testimonial 6 of 6 by Priya Anand",
    exact: true,
  });
  const first = page.getByRole("button", {
    name: "Go to testimonial 1 of 6 by Mira Okonkwo",
    exact: true,
  });
  await last.click();
  await expect(first).toHaveAttribute("aria-current", "true", { timeout: 11000 });
  await page.getByRole("button", { name: "Pause testimonials", exact: true }).click();
  await page
    .getByRole("button", { name: "Go to testimonial 3 of 6 by Leon Vargas", exact: true })
    .click();
  await page.waitForTimeout(7300);
  await expect(
    page.getByRole("button", { name: "Go to testimonial 3 of 6 by Leon Vargas", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Play testimonials", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Go to testimonial 4 of 6 by Jules Akinyemi", exact: true }),
  ).toHaveAttribute("aria-current", "true", { timeout: 11000 });
});

for (const n of [1, 5, 6]) {
  test(`review ${n} has locally decoded original avatars and fits 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, n);
    const images = page.locator(".isolated-preview img");
    await images.evaluateAll(async (list) => {
      await Promise.all(
        list.map(async (element) => {
          try {
            await (element as HTMLImageElement).decode();
          } catch {}
        }),
      );
    });
    expect(
      await images.evaluateAll(
        (list) => list.filter((element) => (element as HTMLImageElement).naturalWidth === 0).length,
      ),
    ).toBe(0);
    expect(
      await images.evaluateAll((list) =>
        list.every((element) =>
          (element as HTMLImageElement).src.startsWith("data:image/svg+xml,"),
        ),
      ),
    ).toBe(true);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });
}

test("actual review ZIP carries original avatar source and original carousel dependencies", async ({
  page,
}) => {
  await page.goto("./#/block/ecommerce/review/review-1");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const entries = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  expect(entries["src/lib/demo-artwork.ts"]).toBeDefined();
  const decoder = new TextDecoder();
  expect(decoder.decode(entries["src/lib/demo-artwork.ts"])).toContain("function demoAvatar");
  expect(decoder.decode(entries["src/blocks/commerce/review-data.ts"])).toContain("demoAvatar(");
  expect(
    Object.keys(entries).some((name) => /commerce\/assets\/reviews\/owner-\d\.jpg$/.test(name)),
  ).toBe(false);
  expect(entries["src/blocks/commerce/review-carousels.tsx"]).toBeDefined();
  expect(entries["src/components/ui/carousel.tsx"]).toBeDefined();
  const manifest = JSON.parse(new TextDecoder().decode(entries["package.json"]));
  expect(manifest.dependencies["embla-carousel-autoplay"]).toBeTruthy();
});
