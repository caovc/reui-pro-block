// Exercises account routes and the actual free settings/sidebar components.
import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`Atlas account settings save and cancel profile changes at ${width}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/template-preview/atlas/account/profile");
    const root = page.locator(".bt-atlas");
    const account = root.locator(".atlas-account-settings");
    await expect(account.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
    await expect(account.getByRole("heading", { level: 1 })).toHaveCount(1);

    const profile = account.getByRole("region", { name: "Profile details", exact: true });
    const name = profile.getByRole("textbox", { name: "Full name", exact: true });
    const initialName = await name.inputValue();
    await expect(profile.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    const avatar = profile.getByRole("img", { name: "Avatar", exact: true });
    const avatarBefore = await avatar.getAttribute("src");
    await profile.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(avatar).toHaveCount(0);
    await profile.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(avatar).toHaveAttribute("src", avatarBefore ?? "");
    await name.fill("Bricklane Local Editor");
    await profile.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(name).toHaveValue(initialName);
    await name.fill("Bricklane Local Editor");
    await profile.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(profile.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();

    const identity = root.getByRole("button", {
      name: "Open account menu for Bricklane Local Editor",
      exact: true,
    });
    if (width === 390) await root.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(identity).toBeVisible();
    if (width === 390) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(root.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 390]) {
  test(`Atlas account settings navigate account routes and position the native sidebar at ${width}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/template-preview/atlas/account/profile");
    const root = page.locator(".bt-atlas");
    const account = root.locator(".atlas-account-settings");
    await expect(account.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
    await expect(account.getByRole("heading", { level: 1 })).toHaveCount(1);

    const name = account.getByRole("textbox", { name: "Full name", exact: true });
    await name.fill("Bricklane Local Editor");
    await account.getByRole("button", { name: "Save changes", exact: true }).click();
    const nav = account.getByRole("navigation", { name: "Account sections", exact: true });
    await nav.getByRole("link", { name: "Security", exact: true }).click();
    await expect(page).toHaveURL(/\/account\/security$/);
    await expect(
      account.getByRole("region", { name: "Sign-in settings", exact: true }),
    ).toBeVisible();
    const signIn = account.getByRole("button", { name: "Sign-in", exact: true });
    await expect(signIn).toHaveAttribute("aria-expanded", "true");
    await signIn.click();
    await expect(signIn).toHaveAttribute("aria-expanded", "false");
    await signIn.click();
    await account.getByRole("button", { name: "Change password", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByText("Password changes run through your auth provider.", { exact: true }),
    ).toBeVisible();

    await nav.getByRole("link", { name: "Preferences", exact: true }).click();
    await expect(page).toHaveURL(/\/account\/preferences$/);
    const position = account.getByRole("combobox", { name: "Sidebar position", exact: true });
    await position.click();
    const right = page.getByRole("option", { name: "Right", exact: true });
    await expect(right).toBeVisible();
    await expect(right).toHaveCSS("font-family", /Inter/);
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
    await expect(position).toBeFocused();
    await position.click();
    await right.click();
    await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
    await expect(position).toBeFocused();
    await expect(root).toHaveAttribute("data-sidebar-side", "right");
    if (width === 1440) {
      const sidebar = root.locator(".bt-layout-columns [data-slot='sidebar-container']");
      await expect.poll(async () => (await sidebar.boundingBox())?.x ?? 0).toBeGreaterThan(1100);
    }
    if (width === 390) {
      const trigger = root.getByRole("button", { name: "Open menu", exact: true });
      await trigger.click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();
      await expect
        .poll(async () => {
          const box = await sheet.boundingBox();
          return (box?.x ?? -1) + (box?.width ?? 0);
        })
        .toBeCloseTo(width, 0);
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    await page.goBack();
    await expect(page).toHaveURL(/\/account\/security$/);
    await page.goBack();
    await expect(account.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue(
      "Bricklane Local Editor",
    );
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width + 1);
    if (width === 1440) {
      await page
        .getByRole("navigation", { name: "breadcrumb", exact: true })
        .getByRole("link", { name: "Dashboard", exact: true })
        .click();
      await expect(page).toHaveURL(/#\/template-preview\/atlas$/);
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
      await expect(account).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 390]) {
  test(`Atlas rejects an invalid email without saving the profile at ${width}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/template-preview/atlas/account/profile");
    const profile = page.getByRole("region", { name: "Profile details", exact: true });
    const email = profile.getByRole("textbox", { name: /^Email address/ });
    const savedEmail = await email.inputValue();
    await email.fill("not-an-email");
    await profile.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(profile.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
    await expect(email).toHaveValue("not-an-email");
    await expect(profile.getByText("Profile saved in this preview.", { exact: true })).toHaveCount(
      0,
    );
    await profile.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(email).toHaveValue(savedEmail);
    await expect(profile.getByText("Enter a valid email address.", { exact: true })).toHaveCount(0);
    await expect(profile.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 390]) {
  test(`Atlas Color theme preference changes the existing shared appearance at ${width}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/template-preview/atlas/account/preferences");
    const account = page.locator(".atlas-account-settings");
    const mode = account.getByRole("combobox", { name: "Color theme", exact: true });
    for (const choice of ["Dark", "Light"] as const) {
      await mode.click();
      await page.getByRole("option", { name: choice, exact: true }).click();
      await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
      await expect(mode).toBeFocused();
      await expect(mode).toContainText(choice);
      if (choice === "Dark") await expect(page.locator("html")).toHaveClass(/dark/);
      else await expect(page.locator("html")).not.toHaveClass(/dark/);
    }
    await expect(account.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
