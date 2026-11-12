import { expect, test } from "@playwright/test";
import { accountPopupGeometry, expectAccountPopupReachable } from "./strata-account-popup-geometry";
import { accountMenu, evidence, healthy, openPublic } from "./strata-account-popup-helpers";

// Match the original validated gate; do not widen budgets to mask regressions.
test.setTimeout(30000);
test.describe.configure({ retries: 0 });
test.use({
  actionTimeout: 5000,
  colorScheme: "light",
  reducedMotion: "no-preference",
  deviceScaleFactor: 1,
});

for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390]) {
    test(`${primitive} ${width} additive account popup: viewport, email, hit ownership and pointer Theme choices`, async ({
      page,
      baseURL,
    }, info) => {
      const initial = await openPublic(page, baseURL, primitive, width);
      const { trigger, menu } = await accountMenu(page, primitive, width);
      const geometry = await accountPopupGeometry(menu);
      await evidence(page, info, "account-popup-before-assert", {
        geometry,
        publicBounds: initial.bounds,
      });
      expectAccountPopupReachable(geometry);
      const row = menu.locator(".strata-account-theme");
      const dark = row.getByLabel("Dark", { exact: true });
      const light = row.getByLabel("Light", { exact: true });
      const system = row.getByLabel("System", { exact: true });
      for (const choice of [dark, light, system]) {
        await choice.click();
        await expect(choice).toHaveAttribute(
          primitive === "base" ? "data-pressed" : "data-state",
          primitive === "base" ? "" : "on",
        );
        await expect(menu).toBeVisible();
        if (choice === dark) await expect(page.locator("html")).toHaveClass(/(?:^|\s)dark(?:\s|$)/);
        else await expect(page.locator("html")).not.toHaveClass(/(?:^|\s)dark(?:\s|$)/);
      }
      const selectedGeometry = await accountPopupGeometry(menu);
      await evidence(page, info, "account-popup-system-selected", { geometry: selectedGeometry });
      expectAccountPopupReachable(selectedGeometry);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      const reopened = await accountMenu(page, primitive, width);
      await reopened.menu.getByRole("menuitem", { name: "General", exact: true }).click();
      if (width === 390)
        await expect(page.locator('.strata-sidebar[data-mobile="true"]')).toBeHidden();
      await expect(page.getByRole("combobox", { name: "Color theme", exact: true })).toContainText(
        "System",
      );
      await healthy(page, initial.faults);
    });
  }
}
