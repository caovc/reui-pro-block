import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
const route = (n: number) => `./#/preview/ecommerce/checkout/checkout-${n}`;
async function open(page: Page, n: number) {
  await page.goto(route(n));
  await expect(page.locator(`[data-checkout-variant="${n}"]`)).toBeVisible();
}
for (const n of [1, 2, 5])
  test(`checkout ${n} validates contact and completes edited delivery/payment/review flow`, async ({
    page,
  }) => {
    await open(page, n);
    await expect(page.locator('[data-slot="stepper"]')).toHaveCount(1);
    await page.getByLabel("Email", { exact: true }).fill("invalid");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Customer details", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill("qa@example.com");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Manage addresses" }).click();
    await page.getByLabel("Street address", { exact: true }).fill("20 Market St");
    await page.getByRole("button", { name: "Save address", exact: true }).click();
    await page.getByRole("radio", { name: "Standard", exact: false }).check();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("radio", { name: "PayPal", exact: true }).check();
    await expect(page.getByRole("alert")).toContainText("PayPal selected");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("button", { name: "Place order", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: /Delivery Home/ })).toContainText("20 Market St");
    await page.getByRole("checkbox", { name: /I confirm/ }).check();
    await page.getByRole("button", { name: "Place order", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Your order is confirmed");
    await expect(page.getByRole("alert")).toContainText("No payment was processed");
  });
test("trust-strip checkout applies valid coupon, rejects invalid coupon and removes order item", async ({
  page,
}) => {
  await open(page, 2);
  const total = page.locator("[data-checkout-total]");
  const initial = await total.innerText();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(total).not.toHaveText(initial);
  await page.getByLabel("Promo code").fill("INVALID");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Use SPRING15");
  await page.getByRole("button", { name: "Remove Leather Biker Jacket" }).click();
  await expect(page.getByText("Leather Biker Jacket", { exact: true })).toHaveCount(0);
});
test("official Stepper retains keyboard focus/activation and completion gating", async ({
  page,
}) => {
  await open(page, 1);
  const tabs = page.locator('[data-slot="stepper-trigger"]');
  await expect(tabs.nth(1)).toBeDisabled();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await tabs.nth(1).focus();
  await page.keyboard.press("Home");
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
});
test("AI credit checkout changes provider/package, preserves switches and issues reviewed credits", async ({
  page,
}) => {
  await open(page, 3);
  await page.getByRole("radio", { name: "Claude", exact: true }).check();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page.getByRole("radio", { name: /Scale Pack/ }).check();
  await page.getByRole("switch", { name: "Auto top-up", exact: true }).uncheck();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Claude · Scale Pack" })).toBeVisible();
  await expect(page.getByText("Manual", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Invoice", exact: true }).check();
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  await page.getByRole("button", { name: "Issue credits", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("20M Claude credits issued");
  await expect(page.getByRole("alert")).toContainText("$399.00");
});
test("express checkout edits contact, requires CVV, and confirms saved card payment", async ({
  page,
}) => {
  await open(page, 4);
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await page.getByRole("dialog").getByLabel("Contact", { exact: true }).fill("express@example.com");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("express@example.com", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pay $136.32", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Confirm & pay" })).toBeVisible();
  await page.getByLabel("CVV for Visa ending 1847", { exact: true }).fill("123");
  await page.getByRole("button", { name: "Pay $136.32", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Your order is confirmed");
});
test("one-page checkout switches pickup totals and validates separate billing fields", async ({
  page,
}) => {
  await open(page, 6);
  await page.getByRole("combobox", { name: "Delivery method", exact: true }).click();
  await page.getByRole("option", { name: "Store pickup", exact: true }).click();
  await expect(page.locator("[data-checkout-total]")).toHaveText("$293.08");
  await page.getByRole("checkbox", { name: "Billing matches shipping address" }).uncheck();
  await page.getByRole("button", { name: "Pay $293.08", exact: true }).click();
  await expect(page.getByLabel("Billing address", { exact: true })).toBeVisible();
  await page.getByLabel("Billing address", { exact: true }).fill("10 Main St");
  await page.getByLabel("Billing postal code", { exact: true }).fill("10001");
  await page.getByRole("button", { name: "Pay $293.08", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Your order is confirmed");
});
test("social checkout has local auth and four gated steps with free pickup", async ({ page }) => {
  await open(page, 7);
  await page.getByRole("button", { name: "Google", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Authentication is simulated locally");
  await page.getByRole("button", { name: "Continue as Morgan Lee" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: /Pickup/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Place order · $352.31", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("$352.31");
});
for (let n = 1; n <= 7; n++)
  test(`checkout ${n} fits mobile and retains distinct desktop structure`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, n);
    await expect(page.locator(`[data-checkout-variant="${n}"]`)).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });
