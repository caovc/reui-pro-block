/** Native local plan, payment method and provider-directory contracts. */
import { expect, test, type Page } from "@playwright/test";

const faults = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  faults.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) messages.push(message.text());
  });
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !["GET", "HEAD"].includes(request.method()))
      messages.push(`Unexpected write: ${request.method()} ${request.url()}`);
  });
});
test.afterEach(async ({ page }) => {
  expect(faults.get(page) ?? []).toEqual([]);
});

async function open(page: Page, id: "surge" | "manifest", width: number, section: string) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/#/template-preview/${id}/settings/${section}?qa=finance`, {
    waitUntil: "networkidle",
  });
  if (id === "manifest") await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(
    page
      .locator(".bt-content")
      .getByRole("heading", { name: section === "billing" ? "Billing" : "Payments", exact: true }),
  ).toBeVisible();
}
async function section(page: Page, width: number, name: string) {
  if (width === 390) await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const navigation =
    width === 390
      ? page.locator(".bt-layout-mobile")
      : page.locator('.bt-sidebar[data-slot="sidebar-container"]');
  const surge = (await page.locator(".bt-layout.bt-surge").count()) === 1;
  const target = navigation.getByRole(surge ? "link" : "button", { name, exact: true });
  if (!(await target.isVisible()))
    await navigation.getByRole("button", { name: "Settings", exact: true }).first().click();
  await target.click();
  if (width === 390) {
    if (surge) {
      await expect(navigation).toBeVisible();
      await expect(target).toBeFocused();
      await page.keyboard.press("Escape");
    }
    await expect(navigation).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
}
async function choice(page: Page, label: string, value: string) {
  const trigger = page.getByRole("combobox", { name: label, exact: true });
  await trigger.click();
  await page.getByRole("option", { name: value, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(trigger).toBeFocused();
}
for (const id of ["surge", "manifest"] as const)
  for (const width of [1440, 390]) {
    test(`${id} demo billing plan reset, cancel, save and local cancellation lifecycle ${width}`, async ({
      page,
    }) => {
      await open(page, id, width, "billing");
      const change = page.getByRole("button", { name: "Change plan", exact: true });
      await change.click();
      let dialog = page.getByRole("dialog", { name: "Change demo plan", exact: true });
      await choice(page, "Demo plan", "Scale");
      await dialog.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(dialog.getByRole("combobox", { name: "Demo plan", exact: true })).toHaveText(
        "Growth",
      );
      await choice(page, "Demo plan", "Scale");
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(change).toBeFocused();
      await expect(page.locator(".csd-plan-heading")).toContainText("Growth plan");
      await change.click();
      await expect(dialog.getByRole("combobox", { name: "Demo plan", exact: true })).toHaveText(
        "Growth",
      );
      await choice(page, "Demo plan", "Scale");
      await dialog.getByRole("button", { name: "Save plan", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(change).toBeFocused();
      await expect(page.locator(".csd-plan-heading")).toContainText("Scale plan");
      await expect(page.locator(".csd-usage-row").filter({ hasText: "Staff seats" })).toContainText(
        "12 / 30",
      );
      await section(page, width, "Team");
      await expect(page.locator(".csd-team-heading")).toContainText("12 of 30 seats");
      await section(page, width, "Billing");
      const cancel = page.getByRole("button", { name: "Cancel plan", exact: true });
      await cancel.click();
      dialog = page.getByRole("dialog", { name: "Cancel demo plan", exact: true });
      await expect(
        dialog.getByRole("button", { name: "Confirm cancellation", exact: true }),
      ).toBeDisabled();
      await dialog.getByRole("button", { name: "Keep current plan", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(cancel).toBeFocused();
      await cancel.click();
      await choice(page, "Cancellation reason", "Store is on pause");
      await dialog
        .getByRole("checkbox", {
          name: "Schedule this cancellation in the local preview",
          exact: true,
        })
        .click();
      await dialog.getByRole("button", { name: "Confirm cancellation", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      const resume = page.getByRole("button", { name: "Resume plan", exact: true });
      await expect(resume).toBeFocused();
      await expect(page.locator(".csd-plan-heading")).toContainText("Cancellation scheduled");
      await resume.click();
      const restoring = page.getByRole("dialog", { name: "Resume demo plan", exact: true });
      await restoring.getByRole("button", { name: "Resume plan", exact: true }).click();
      await expect(restoring).toHaveCount(0);
      await expect(cancel).toBeFocused();
      await expect(page.locator(".csd-plan-heading")).toContainText("Active");
    });

    test(`${id} demo payment method validation, reset, cancel and saved state ${width}`, async ({
      page,
    }) => {
      await open(page, id, width, "billing");
      const trigger = page.getByRole("button", { name: "Update", exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Update demo payment method", exact: true });
      await dialog.getByRole("textbox", { name: "Billing name", exact: true }).fill("");
      await dialog.getByRole("textbox", { name: "Billing email", exact: true }).fill("invalid");
      await dialog.getByRole("button", { name: "Save payment method", exact: true }).click();
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("textbox", { name: "Billing name", exact: true }),
      ).toHaveAttribute("aria-invalid", "true");
      await expect(dialog.getByText("Enter a valid billing email.", { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(dialog.getByRole("textbox", { name: "Billing email", exact: true })).toHaveValue(
        "billing@bricklane.example",
      );
      await choice(page, "Demo payment method", "Mastercard ending 4444");
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page.locator(".csd-billing-stack")).toContainText("Visa ending 4242");
      await trigger.click();
      await choice(page, "Demo payment method", "Mastercard ending 4444");
      await dialog.getByRole("textbox", { name: "Billing name", exact: true }).fill("Canal Store");
      await dialog
        .getByRole("textbox", { name: "Billing email", exact: true })
        .fill("accounts@bricklane.example");
      await dialog.getByRole("button", { name: "Save payment method", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await section(page, width, "Payments");
      await section(page, width, "Billing");
      await expect(page.locator(".csd-billing-stack")).toContainText("Mastercard ending 4444");
      await trigger.click();
      await expect(dialog.getByRole("textbox", { name: "Billing name", exact: true })).toHaveValue(
        "Canal Store",
      );
      await expect(dialog.getByRole("textbox", { name: "Billing email", exact: true })).toHaveValue(
        "accounts@bricklane.example",
      );
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(trigger).toBeFocused();
    });

    test(`${id} local provider directory adds real rows, rejects duplicate names and preserves connections ${width}`, async ({
      page,
    }) => {
      await open(page, id, width, "payments");
      const list = page.locator(".csd-provider-list");
      const trigger = page.getByRole("button", { name: "Add provider", exact: true });
      await expect(list.getByRole("listitem")).toHaveCount(6);
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Add demo provider", exact: true });
      await dialog
        .getByRole("textbox", { name: "Provider display name", exact: true })
        .fill("Stripe");
      await dialog.getByRole("button", { name: "Add provider", exact: true }).click();
      await expect(
        dialog.getByText("Use a different provider display name.", { exact: true }),
      ).toBeVisible();
      await dialog.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(
        dialog.getByRole("textbox", { name: "Provider display name", exact: true }),
      ).toHaveValue("Adyen");
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(list.getByRole("listitem")).toHaveCount(6);
      await trigger.click();
      await choice(page, "Provider", "Square");
      await dialog
        .getByRole("textbox", { name: "Provider display name", exact: true })
        .fill("Square local demo");
      await dialog.getByRole("button", { name: "Add provider", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(list.getByRole("listitem")).toHaveCount(7);
      const provider = list.getByRole("listitem").filter({ hasText: "Square local demo" });
      await provider
        .getByRole("button", { name: "Connect Square local demo", exact: true })
        .click();
      await expect(provider).toContainText("Connected");
      await section(page, width, "Billing");
      await section(page, width, "Payments");
      await expect(provider).toContainText("Connected");
      await provider
        .getByRole("button", { name: "Disconnect Square local demo", exact: true })
        .click();
      await expect(provider).toContainText("Available");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }
