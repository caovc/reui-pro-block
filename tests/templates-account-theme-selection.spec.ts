import { expect, test, type Locator } from "@playwright/test";

const targets = [
  { name: "Atlas", route: "atlas/account/profile", menu: ".atlas-account-menu", closes: true },
  { name: "Miro", route: "miro/settings", menu: ".miro-account-menu", closes: true },
  { name: "Surge", route: "surge", menu: ".surge-account-menu", closes: true },
  { name: "Drive", route: "filespace/settings", menu: ".ds-profile-menu", closes: false },
] as const;

test.use({
  viewport: { width: 1440, height: 1000 },
  colorScheme: "light",
  reducedMotion: "no-preference",
  actionTimeout: 5000,
});

async function expectVisibleSelection(group: Locator, selected: "Light" | "Dark" | "System") {
  await expect(group.getByRole("radio", { name: selected, exact: true })).toBeChecked();
  await expect
    .poll(() =>
      group.getByRole("radio").evaluateAll((radios) =>
        radios.map((radio) => {
          const label = radio.closest("label")!;
          const css = getComputedStyle(label);
          const box = label.getBoundingClientRect();
          const icon = label.querySelector("svg")!.getBoundingClientRect();
          return {
            name: radio.getAttribute("aria-label"),
            checked: radio.getAttribute("aria-checked") === "true",
            painted: css.backgroundColor !== "rgba(0, 0, 0, 0)",
            visible:
              box.width >= 24 &&
              box.height >= 24 &&
              icon.width >= 12 &&
              icon.height >= 12 &&
              icon.left >= box.left - 0.5 &&
              icon.top >= box.top - 0.5 &&
              icon.right <= box.right + 0.5 &&
              icon.bottom <= box.bottom + 0.5 &&
              css.visibility === "visible",
          };
        }),
      ),
    )
    .toEqual(
      ["Light", "Dark", "System"].map((name) => ({
        name,
        checked: name === selected,
        painted: name === selected,
        visible: true,
      })),
    );
}

for (const target of targets) {
  for (const primitive of ["radix", "base"] as const) {
    test(`${target.name} ${primitive}: native account theme paints the selected visible icon`, async ({
      page,
      baseURL,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      const entry = new URL(primitive === "base" ? "base/" : "./", baseURL);
      const query = new URLSearchParams({
        preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
      });
      entry.hash = `#/template-preview/${target.route}?${query}`;
      await page.goto(entry.href);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.locator("html")).toHaveAttribute("data-ui-style", "nova");
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
      const trigger = page.getByRole("button", {
        name: /^Open (account menu|profile) for /,
      });
      await trigger.click();
      const menu = page.locator(target.menu);
      const group = menu.getByRole("radiogroup", { name: "Theme", exact: true });
      await expectVisibleSelection(group, "Light");

      // Drive intentionally hides its native radio. Its existing label remains
      // the visible hit target; all four pages keep their original RadioGroup.
      await group.getByRole("radio", { name: "Dark", exact: true }).locator("xpath=..").click();
      if (target.closes) {
        await expect(menu).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await trigger.click();
      } else {
        await expect(menu).toBeVisible();
      }
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expectVisibleSelection(group, "Dark");

      await group.getByRole("radio", { name: "Dark", exact: true }).press("ArrowRight");
      // Native groups can select on focus or wait for activation. Preserve the
      // actual result, and only activate a still-open focused option if needed.
      const remainsOpen = await menu.evaluateAll((popups) =>
        popups.some(
          (popup) => popup.getAttribute("data-state") === "open" || popup.hasAttribute("data-open"),
        ),
      );
      if (remainsOpen) {
        const system = group.getByRole("radio", { name: "System", exact: true });
        await expect(system).toBeFocused();
        if (!(await system.isChecked())) await system.press("Space");
      }
      if (target.closes) {
        await expect(menu).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await trigger.click();
      } else {
        await expect(menu).toBeVisible();
      }
      await expect(page.locator("html")).not.toHaveClass(/dark/);
      await expectVisibleSelection(group, "System");
      await group.screenshot({ path: info.outputPath("selected-system-theme.png") });
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(trigger).toBeFocused();
      expect(errors).toEqual([]);
    });
  }
}
