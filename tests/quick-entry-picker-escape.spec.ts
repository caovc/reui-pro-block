import { expect, test } from "@playwright/test";

for (const primitive of ["radix", "base"] as const) {
  test(`${primitive} Quick Entry Escape from each open property trigger closes only its picker`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const preset = new URLSearchParams({
      preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
    });
    await page.goto(
      `${primitive === "base" ? "/base/" : "/"}#/preview/application/dialog/dialog-12?${preset}`,
    );
    const launcher = page.getByRole("button", { name: "Open quick entry", exact: true });
    const dialog = page.getByRole("dialog", { name: "Create entry", exact: true });
    const popup = page.locator('[data-slot="combobox-content"]');
    await page.evaluate(() => {
      document.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape" && event.target instanceof HTMLElement) {
            const open = document.querySelector(
              '[data-slot="combobox-trigger"][aria-expanded="true"]',
            );
            document.documentElement.dataset.pickerEscape = `${event.target.id}:${open?.id}:${open?.getAttribute("aria-expanded")}:${event.isTrusted}`;
          }
        },
        true,
      );
    });
    for (const field of ["status", "assignee", "date", "priority", "labels"]) {
      await launcher.click();
      await dialog.getByRole("tab", { name: "Brief", exact: true }).click();
      const trigger = dialog.locator(`#entry-${field}`);
      await dialog.locator(`label[for="entry-${field}"]`).click();
      await expect(popup).toBeVisible();
      // The first Escape may reach the trigger before popup autofocus finishes.
      await trigger.press("Escape");
      await expect(page.locator("html")).toHaveAttribute(
        "data-picker-escape",
        `entry-${field}:entry-${field}:true:true`,
      );
      await expect(popup).toHaveCount(0);
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toBeFocused();
      await expect(dialog).toBeVisible();

      await trigger.press("Enter");
      if (field === "date") {
        // The free date picker has a native list and no search input.
        await expect(popup.getByRole("listbox")).toBeVisible();
        await popup.press("Escape");
      } else {
        await expect(popup.locator('input[role="combobox"]')).toBeFocused();
        await page.keyboard.press("Escape");
      }
      await expect(popup).toHaveCount(0);
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toBeFocused();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(launcher).toBeFocused();
    }
  });
}
