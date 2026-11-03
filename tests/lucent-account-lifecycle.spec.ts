import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ retries: 0 });
test.use({ colorScheme: "light", actionTimeout: 5000 });

async function menu(page: Page, mobile: boolean) {
  if (mobile) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("button", { name: "Open user menu", exact: true }).click();
}

for (const width of [1440, 390]) {
  test(`Lucent history ${width}: workspace Settings does not replace underlying Overview`, async ({
    page,
  }) => {
    const mobile = width === 390;
    await page.setViewportSize({ width, height: mobile ? 844 : 1000 });
    await page.goto("/#/template-preview/lucent?x=%2F&x=+&raw=a?b");
    await expect(page.locator(".wf-stat-value").first()).toHaveText("70%");
    await menu(page, mobile);
    await page.getByRole("menuitem", { name: /^Profile/ }).click();
    await expect(page).toHaveURL(/\/lucent\/account\/profile\?x=%2F&x=\+&raw=a\?b$/);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await menu(page, mobile);
    await page.getByRole("menuitem", { name: /^Preferences/ }).click();
    await expect(page.locator(".wf-lucent-general")).toBeVisible();
    await page.goBack();
    await expect(page.locator(".lucent-account-page")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/lucent\?x=%2F&x=\+&raw=a\?b$/);
    await expect(page.locator(".lucent-account-page")).toHaveCount(0);
    await expect(page.locator(".wf-lucent-general")).toHaveCount(0);
    await expect(page.locator(".wf-stat-value").first()).toHaveText("70%");
  });

  test(`Lucent media and theme ${width}: real upload, save, tab return, cancel, remove and appearance`, async ({
    page,
  }) => {
    const mobile = width === 390;
    await page.setViewportSize({ width, height: mobile ? 844 : 1000 });
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await page.goto("/#/template-preview/lucent/account/profile");
    const account = page.locator(".lucent-account-page");
    const input = account.getByLabel("Upload profile image", { exact: true });
    const avatar = account.getByRole("img", { name: "Avatar", exact: true });
    const original = await avatar.getAttribute("src");
    await input.setInputFiles({
      name: "bricklane.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" rx="12" fill="#0d9488"/></svg>',
      ),
    });
    await expect(account.getByRole("button", { name: "Save changes", exact: true })).toBeEnabled();
    await account.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.mouse.move(2, 2);
    await expect(
      page.getByText("Your profile was updated in this local preview.", { exact: true }),
    ).toBeHidden();
    await expect(avatar).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
    const saved = await avatar.getAttribute("src");
    expect(saved).not.toBe(original);
    await account.getByRole("tab", { name: "Billing", exact: true }).click();
    await account.getByRole("tab", { name: "Profile", exact: true }).click();
    await expect(avatar).toHaveAttribute("src", saved!);
    await expect
      .poll(() => avatar.evaluate((image) => (image as HTMLImageElement).naturalWidth))
      .toBe(48);
    await input.setInputFiles({
      name: "draft.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="12" fill="#dc2626"/></svg>',
      ),
    });
    await expect(account.getByRole("button", { name: "Save changes", exact: true })).toBeEnabled();
    await account.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(avatar).toHaveAttribute("src", saved!);
    await page.mouse.move(2, 2);
    await expect(
      page.getByText("Your profile is back to its saved values.", { exact: true }),
    ).toBeHidden();
    await account.getByRole("button", { name: "Remove", exact: true }).click();
    await account.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.mouse.move(2, 2);
    await expect(
      page.getByText("Your profile was updated in this local preview.", { exact: true }),
    ).toBeHidden();
    await expect(avatar).toHaveCount(0);
    await menu(page, mobile);
    await expect(page.getByRole("menu").locator('[data-slot="avatar-image"]')).toHaveCount(0);
    await page.getByRole("radio", { name: "Dark", exact: true }).check();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("radio", { name: "Dark", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "Light", exact: true }).check();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.getByRole("radio", { name: "System", exact: true }).check();
    await expect(page.getByRole("radio", { name: "System", exact: true })).toBeChecked();
    await page.keyboard.press("Escape");
    if (mobile) await page.keyboard.press("Escape");
    expect(faults).toEqual([]);
  });
}
