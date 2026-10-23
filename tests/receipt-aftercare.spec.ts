import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const route = (n: number) => `./#/preview/ecommerce/receipt/receipt-${n}`;
async function open(page: Page, n: number) {
  await page.goto(route(n));
  await expect(page.locator(`[data-receipt-variant="${n}"]`)).toBeVisible();
}

test("delivered receipt saves a real product review and updates the per-item action", async ({
  page,
}) => {
  await open(page, 4);
  await page
    .getByRole("button", { name: "Write a review for Compass Down Vest", exact: true })
    .click();
  await page.getByRole("button", { name: "Rate 3 out of 5 stars", exact: true }).click();
  await page.getByLabel("Review title").fill("Comfortable everyday layer");
  await page
    .getByLabel("Your review", { exact: true })
    .fill("Light enough for a day trip and easy to pack into my bag.");
  await page.getByRole("button", { name: "Save review", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Your review is saved");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByText("Your review · Just now", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Buy Compass Down Vest again", exact: true }),
  ).toBeVisible();
});

test("delivered receipt item menu shows real product details and a scoped return with purchased quantity limit", async ({
  page,
}) => {
  await open(page, 4);
  await page
    .getByRole("button", { name: "More actions for Linen Field Shirt", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "View product", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("HALDEN · Sand · M");
  await page.getByRole("button", { name: "Back to receipt", exact: true }).click();
  await page
    .getByRole("button", { name: "More actions for Linen Field Shirt", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Return item", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Increase Linen Field Shirt quantity", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Decrease Linen Field Shirt quantity", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("$118.61");
  await expect(
    page.getByRole("button", { name: "Download return request", exact: true }),
  ).toBeDisabled();
  await page.getByRole("combobox", { name: "Return reason", exact: true }).click();
  await page.getByRole("option", { name: "Wrong size", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download return request", exact: true }).click();
  const file = await pending;
  const content = await readFile((await file.path())!, "utf8");
  expect(content).toContain("Linen Field Shirt · Qty 1");
  expect(content).toContain("Reason: Wrong size");
  expect(content).toContain("$118.61");
  await expect(page.getByRole("alert")).toContainText("Return request downloaded");
});

test("reorder all adjusts quantity, disables empty selection and preserves a local bag count", async ({
  page,
}) => {
  await open(page, 4);
  await page.getByRole("button", { name: "Reorder all", exact: true }).click();
  for (const name of ["Field Shell Jacket", "Compass Down Vest", "Linen Field Shirt"]) {
    await page.getByRole("checkbox", { name: `Select ${name}`, exact: true }).uncheck();
  }
  await expect(
    page.getByRole("button", { name: "Add selected items to bag", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: "Select Compass Down Vest", exact: true }).check();
  await page
    .getByRole("button", { name: "Increase Compass Down Vest quantity", exact: true })
    .click();
  await page.getByRole("button", { name: "Add selected items to bag", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("2 items added to your local bag");
  await expect(page.getByRole("alert")).toContainText("$456.00");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByText("Local bag · 2 items", { exact: true })).toBeVisible();
  await expect(page.locator("[data-receipt-total]")).toHaveText("$631.92");
});

test("statement receipt tracks shipping and saves a support file", async ({ page }) => {
  await open(page, 5);
  await page.getByRole("button", { name: "Track your shipment", exact: true }).click();
  await expect(page.getByRole("dialog").locator('[data-slot="timeline-item"]')).toHaveCount(5);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Contact demo support", exact: true }).click();
  await page.getByLabel("How can we help?").fill("Please help update my delivery preferences.");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save support request", exact: true }).click();
  const file = await pending;
  expect(await readFile((await file.path())!, "utf8")).toContain("delivery preferences");
  await expect(page.getByRole("alert")).toContainText("Support request downloaded");
});

test("post-purchase action tiles are live: tracking, filtered return and reorder", async ({
  page,
}) => {
  await open(page, 6);
  await page.getByRole("button", { name: /Track order.*See where it is/ }).click();
  await expect(page.getByRole("dialog")).toContainText("1Z999AA10123456784");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Return.*Start a return/ }).click();
  await page.getByRole("checkbox", { name: "Select Field Shell Jacket", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Select Compass Down Vest", exact: true }).uncheck();
  await page.getByRole("combobox", { name: "Return reason", exact: true }).click();
  await page.getByRole("option", { name: "Changed my mind", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download return request", exact: true }).click();
  const file = await pending;
  const content = await readFile((await file.path())!, "utf8");
  expect(content).toContain("Linen Field Shirt · Qty 2");
  expect(content).not.toContain("Field Shell Jacket");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: /Reorder.*Buy items again/ }).click();
  await page.getByRole("button", { name: "Add selected items to bag", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("4 items added to your local bag");
});

for (const n of [4, 5, 6]) {
  test(`receipt ${n} has distinct desktop layout and fits 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await open(page, n);
    await expect(page.locator("[data-receipt-total]")).toHaveText("$631.92");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });
}
