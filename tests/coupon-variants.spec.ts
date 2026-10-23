import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";

async function open(page: Page, n: number) {
  await page.goto(`./#/preview/ecommerce/coupon/coupon-${n}`);
  await expect(page.locator(`[data-coupon-variant="${n}"]`)).toBeVisible();
}

for (const [n, code] of [
  [1, "SUMMER25"],
  [2, "WELCOME10"],
  [3, "EARLY30"],
  [4, "WELCOME15"],
  [5, "FREESHIP50"],
  [6, "WEEKEND20"],
] as const) {
  test(`coupon${n} copies the actual ${code} and native free hook resets success`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page, n);
    await page.getByRole("button", { name: `Copy code ${code}`, exact: true }).click();
    await expect(page.getByRole("button", { name: `Copied ${code}`, exact: true })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
    await expect(
      page.getByRole("button", { name: `Copy code ${code}`, exact: true }),
    ).toBeVisible();
  });
}

test("native free filter group shows every specific category and cannot clear the active filter", async ({
  page,
}) => {
  await open(page, 2);
  await expect(page.locator("[data-coupon-offer]")).toHaveCount(6);
  await expect(page.locator("[data-coupon-count]")).toHaveText("6 offers");
  for (const [category, code] of [
    ["Welcome", "WELCOME10"],
    ["Seasonal", "SUMMER25"],
    ["Shipping", "SHIPFREE"],
    ["Bundle", "BUNDLE30"],
    ["Loyalty", "MEMBER15"],
    ["Education", "STUDENT20"],
  ]) {
    const trigger = page.getByRole("radio", { name: category, exact: true });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("[data-coupon-offer]")).toHaveAttribute("data-coupon-offer", code);
    await expect(page.locator("[data-coupon-count]")).toHaveText("1 of 6 offers");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-checked", "true");
  }
  await page.getByRole("radio", { name: "All offers", exact: true }).click();
  await expect(page.locator("[data-coupon-offer]")).toHaveCount(6);
});

test("free filter group keyboard navigation selects the intended category", async ({ page }) => {
  await open(page, 2);
  await page.getByRole("radio", { name: "All offers", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Welcome", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: "Welcome", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.locator("[data-coupon-offer]")).toHaveAttribute(
    "data-coupon-offer",
    "WELCOME10",
  );
});

for (const n of [5, 6])
  test(`coupon${n} actually dismisses and Show again restores its own banner`, async ({ page }) => {
    await open(page, n);
    await page.getByRole("button", { name: "Dismiss promotion", exact: true }).click();
    await expect(page.getByRole("region", { name: /promotion/ })).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText("Promo bar dismissed.");
    await page.getByRole("button", { name: "Show again", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Dismiss promotion", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: n === 5 ? "Free shipping promotion" : "Weekend sale promotion",
        exact: true,
      }),
    ).toBeVisible();
  });

test("missing clipboard does not call the fragile original hook or falsely report copied", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }),
  );
  await open(page, 1);
  await page.getByRole("button", { name: "Copy code SUMMER25", exact: true }).click();
  await expect(
    page.getByText(
      "Select the displayed code and copy it manually if clipboard access is blocked.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Copied SUMMER25", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe("SUMMER25");
  expect(errors).toEqual([]);
});

test("a rejected clipboard write keeps manual-copy guidance and never presents false success", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () => Promise.reject(new DOMException("Clipboard blocked", "NotAllowedError")),
      },
      configurable: true,
    }),
  );
  await open(page, 6);
  await page.getByRole("button", { name: "Copy code WEEKEND20", exact: true }).click();
  await expect(
    page.getByText(
      "Select the displayed code and copy it manually if clipboard access is blocked.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Copied WEEKEND20", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("offer terms card opens specific full terms instead of a dead hash link", async ({ page }) => {
  await open(page, 4);
  await page.getByRole("button", { name: "Full terms", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Offer terms · WELCOME15");
  await expect(page.getByRole("dialog")).toContainText(
    "Cannot stack with other percentage discounts.",
  );
  await expect(page.getByRole("dialog")).toContainText("Min spend$50");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("shop preview uses actual NumberField quantities and applies the first-order15% minimum", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 4);
  await page.getByRole("button", { name: "Shop now", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Increase Everyday Canvas Tote", exact: true }).click();
  await expect(page.locator("[data-coupon-subtotal]")).toHaveText("$45");
  await expect(page.locator("[data-coupon-savings]")).toHaveText("−$0");
  await expect(page.getByRole("alert")).toContainText("Add $5 more");
  await page
    .getByRole("button", { name: "Increase Slim Leather Card Holder", exact: true })
    .click();
  await expect(page.locator("[data-coupon-subtotal]")).toHaveText("$80");
  await expect(page.locator("[data-coupon-savings]")).toHaveText("−$12");
  await expect(page.locator("[data-coupon-total]")).toHaveText("$68");
  await expect(page.getByRole("alert")).toContainText("WELCOME15 is applied");
  await page.getByRole("button", { name: "Decrease Everyday Canvas Tote", exact: true }).click();
  await expect(page.locator("[data-coupon-total]")).toHaveText("$35");
  await expect(page.getByRole("alert")).toContainText("Add $15 more");
});

test("member campaign is its own30% offer with eligible local amounts", async ({ page }) => {
  await open(page, 3);
  await page.getByRole("button", { name: "Shop early access", exact: true }).click();
  await page.getByRole("button", { name: "Increase Linen Field Shirt", exact: true }).click();
  await expect(page.locator("[data-coupon-savings]")).toHaveText("−$24");
  await expect(page.locator("[data-coupon-total]")).toHaveText("$56");
  await expect(page.getByRole("alert")).toContainText("EARLY30 is applied");
});

for (const n of [1, 2, 3, 4, 5, 6])
  test(`coupon${n} has the individual responsive layout and local media at390px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, n);
    if (n === 1 || n === 3) {
      const heading = await page.locator("h1").evaluate((element) => {
        const style = getComputedStyle(element);
        return { size: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) };
      });
      expect(heading.line / heading.size).toBeLessThanOrEqual(1.25);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    expect(
      await page.locator(".isolated-preview img").evaluateAll(async (images) => {
        await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
        return images.every(
          (image) =>
            (image as HTMLImageElement).naturalWidth > 0 &&
            (image as HTMLImageElement).src.startsWith("data:image/svg+xml,"),
        );
      }),
    ).toBe(true);
  });

test("actual coupon source ZIP includes the existing official copy hook and real Frame source", async ({
  page,
}) => {
  await page.goto("./#/block/ecommerce/coupon/coupon-2");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const entries = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const name of [
    "src/blocks/commerce/coupon-variants/grid.tsx",
    "src/blocks/commerce/coupon-variants/copy.tsx",
    "src/components/reui/frame.tsx",
    "src/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard.ts",
  ])
    expect(entries[name]).toBeDefined();
  expect(
    new TextDecoder().decode(entries["src/blocks/commerce/coupon-variants/copy.tsx"]),
  ).toContain("useCopyToClipboard");
  expect(
    new TextDecoder().decode(entries["src/blocks/commerce/coupon-variants/grid.tsx"]),
  ).toContain("<FramePanel");
});
