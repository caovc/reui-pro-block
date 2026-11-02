/** Native provider exhaustion, closing focus and connection-state contracts. */
import { expect, test, type Page } from "@playwright/test";
import { commerceAdditionalProviders } from "../src/templates/business/commerce-settings-finance-data";

// Same real route, native Manifest login and menu-independent entry protocol as
// templates-commerce-finance-native.spec.ts. This case uses Surge at 390px.
async function open(page: Page, id: "surge" | "manifest", width: number, section: string) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/#/template-preview/${id}/settings/${section}?qa=finance`, {
    waitUntil: "networkidle",
  });
  if (id === "manifest") {
    await page.getByRole("button", { name: "Log in", exact: true }).click();
  }
  await expect(
    page.locator(".bt-content").getByRole("heading", {
      name: section === "billing" ? "Billing" : "Payments",
      exact: true,
    }),
  ).toBeVisible();
}
async function choice(page: Page, label: string, value: string) {
  const trigger = page.getByRole("combobox", { name: label, exact: true });
  await trigger.click();
  await page.getByRole("option", { name: value, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

test("surge provider directory exhaustion preserves native closing focus and existing connections 390", async ({
  page,
}) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) faults.push(message.text());
  });
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !["GET", "HEAD"].includes(request.method())) {
      faults.push(`Unexpected HTTP write: ${request.method()} ${request.url()}`);
    }
  });
  await open(page, "surge", 390, "payments");
  const list = page.locator(".csd-provider-list");
  const launcher = page.getByRole("button", { name: "Add provider", exact: true });
  const dialog = page.getByRole("dialog", { name: "Add demo provider", exact: true });
  const initialRows = 6;
  // The actual authored directory contains precisely Adyen, Mollie and Square.
  // Use the real fixture and a fixed, bounded loop; do not infer exhaustion from
  // a failed click or keep adding until an assertion happens to pass.
  expect(commerceAdditionalProviders.map((provider) => provider.id)).toEqual([
    "adyen",
    "mollie",
    "square",
  ]);
  await expect(list.getByRole("listitem")).toHaveCount(initialRows);
  for (const [index, provider] of commerceAdditionalProviders.entries()) {
    await launcher.click();
    await expect(dialog).toBeVisible();
    await choice(page, "Provider", provider.name);
    await dialog
      .getByRole("textbox", { name: "Provider display name", exact: true })
      .fill(provider.name);
    await dialog.getByRole("button", { name: "Add provider", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(launcher).toBeFocused();
    await expect(list.getByRole("listitem")).toHaveCount(initialRows + index + 1);
    const saved = list.getByRole("listitem").filter({ hasText: provider.name });
    await expect(saved).toContainText("Available");
    await expect(
      saved.getByRole("button", { name: `Connect ${provider.name}`, exact: true }),
    ).toBeVisible();
  }
  const finalRows = initialRows + commerceAdditionalProviders.length;
  await expect(launcher).toBeEnabled();
  await launcher.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Provider", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Add provider", exact: true })).toBeDisabled();
  await expect(
    dialog.getByText("All local demo providers have already been added.", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused();
  await expect(list.getByRole("listitem")).toHaveCount(finalRows);

  await launcher.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Provider", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Add provider", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused();
  await expect(list.getByRole("listitem")).toHaveCount(finalRows);

  // These are the real pre-existing connect/disconnect buttons, not a synthetic
  // switch or an injected provider state. Restore Stripe's original connection.
  const stripe = list.getByRole("listitem").filter({ hasText: "Stripe" });
  await stripe.getByRole("button", { name: "Disconnect Stripe", exact: true }).click();
  await expect(stripe).toContainText("Available");
  await stripe.getByRole("button", { name: "Connect Stripe", exact: true }).click();
  await expect(stripe).toContainText("Connected");
  await expect(list.getByRole("listitem")).toHaveCount(finalRows);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(faults).toEqual([]);
});
