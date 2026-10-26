// Main-candidate draft only. Do not run before Root installs the exact phone dependency
// and approves an integrated warm slot. This is not browser pass evidence.
import { expect, test } from "@playwright/test";

const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:6350";

for (const width of [1440, 390]) {
  test(`Drive PhoneInput country registry, controlled number and native focus at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) faults.push(message.text());
    });
    await page.goto(`${base}/#/template-preview/filespace/settings`);
    await expect(page.getByText("Profile Details", { exact: true })).toBeVisible();
    const row = page
      .locator(".workspace-settings-row")
      .filter({ has: page.locator('label[for="drive-profile-phone"]') });
    const trigger = row.locator('[data-slot="combobox-trigger"]');
    const number = page.getByLabel("Phone Number", { exact: true });
    const initialNumber = await number.inputValue();
    await expect(trigger).toContainText("United States");

    const popup = page.locator('[data-slot="combobox-content"]');
    await trigger.click();
    await expect(popup).toBeVisible();
    const unitedStates = popup.getByRole("option", { name: /^United States\b/ });
    await expect(unitedStates).toHaveAttribute("aria-selected", "true");
    await expect(unitedStates).toHaveAttribute("data-highlighted", "");
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();

    // Closed-trigger typeahead uses the Base UI value registry directly.
    // With CountryEntry objects in items this can send an object into the
    // react-phone-number-input Country callback rather than the code "ZM".
    await trigger.focus();
    await trigger.press("z");
    await expect(trigger).toContainText("Zambia");

    await trigger.click();
    await expect(popup).toBeVisible();
    const search = popup.getByPlaceholder("e.g. United States");
    await search.fill("China");
    const china = popup.getByRole("option", { name: /^China\b/ });
    await expect(china).toBeVisible();
    await china.click();
    await expect(popup).toHaveCount(0);
    await expect(trigger).toContainText("China");
    await expect(number).not.toHaveValue(initialNumber);
    await expect(number).toBeFocused();

    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(china).toHaveAttribute("aria-selected", "true");
    // Confirm that the selected item is also the keyboard's opening anchor,
    // not merely a checkmark painted from a separate string Item value.
    await expect(china).toHaveAttribute("data-highlighted", "");
    await search.fill("zzzz-no-country-match");
    await expect(popup.getByText("No country found.", { exact: true })).toBeVisible();
    await expect(popup.getByRole("option")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText("China");

    // This is the parent-controlled value path, not a second test-only model.
    const details = page
      .locator(".ds-card")
      .filter({ has: page.getByText("Profile Details", { exact: true }) });
    await details.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(number).toHaveValue(initialNumber);
    await expect(trigger).toContainText("United States");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`phone-country-${width}.png`) });
    await info.attach("console-faults", {
      body: JSON.stringify(faults),
      contentType: "application/json",
    });
    expect(faults).toEqual([]);
  });
}
