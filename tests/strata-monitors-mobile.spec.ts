import { expect, test, type Locator } from "@playwright/test";

async function expectReachable(control: Locator, containerSelector: string, label: string) {
  await expect
    .poll(() =>
      control.evaluate(
        (button, { containerSelector, label }) => {
          const container = button.closest(containerSelector);
          const text = Array.from(button.childNodes).find(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === label,
          );
          if (!container || !text) return null;

          const bounds = button.getBoundingClientRect();
          const outer = container.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(text);
          const letters = range.getBoundingClientRect();
          const hit = document.elementFromPoint(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
          );
          return {
            withinContainer: bounds.left >= outer.left && bounds.right <= outer.right,
            withinViewport:
              bounds.left >= 0 &&
              bounds.right <= innerWidth &&
              bounds.top >= 0 &&
              bounds.bottom <= innerHeight,
            labelVisible:
              letters.width > 0 && letters.left >= bounds.left && letters.right <= bounds.right,
            centerReachable: button.contains(hit),
          };
        },
        { containerSelector, label },
      ),
    )
    .toEqual({
      withinContainer: true,
      withinViewport: true,
      labelVisible: true,
      centerReachable: true,
    });
}

for (const primitive of ["radix", "base"] as const) {
  test(`Strata Monitors ${primitive}: Sera 320px keeps creation controls fully reachable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    const entry = primitive === "base" ? "./base/" : "./";
    const preset = new URLSearchParams({
      preset: JSON.stringify({ primitive, style: "sera", mode: "light" }),
    });
    await page.goto(`${entry}#/template-preview/strata/monitors?${preset}`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await expect(page.locator("html")).toHaveAttribute("data-ui-style", "sera");
    await page.evaluate(() => document.fonts.ready);

    const open = page.getByRole("button", { name: "New Monitor", exact: true });
    const dialog = page.getByRole("dialog", { name: "New Monitor", exact: true });
    const create = dialog.getByRole("button", { name: "Create Monitor", exact: true });
    const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
    await expectReachable(open, ".strata-header", "New Monitor");
    await open.press("Enter");
    await expect(dialog).toBeVisible();
    await expectReachable(cancel, ".strata-monitor-form-footer", "Cancel");
    await expectReachable(create, ".strata-monitor-form-footer", "Create Monitor");

    await create.click();
    const name = dialog.getByRole("textbox", { name: "Name", exact: true });
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
  });
}
