import { expect, test, type Locator } from "@playwright/test";

async function expectDateVisible(title: Locator, date: string) {
  await expect(title).toHaveText(date);
  await expect
    .poll(() =>
      title.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        const target = document.elementFromPoint(text.x + text.width / 2, text.y + text.height / 2);
        return (
          text.width > 0 &&
          text.left >= box.left &&
          text.right <= Math.min(box.right, innerWidth) &&
          element.contains(target)
        );
      }),
    )
    .toBe(true);
}

for (const primitive of ["radix", "base"] as const) {
  test(`Strata Calendar ${primitive}: Sera 320px keeps the date and actions visible`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    const entry = primitive === "base" ? "./base/" : "./";
    const preset = new URLSearchParams({
      preset: JSON.stringify({ primitive, style: "sera", mode: "light" }),
    });
    await page.goto(`${entry}#/template-preview/strata/calendar?${preset}`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await expect(page.locator("html")).toHaveAttribute("data-ui-style", "sera");
    await page.evaluate(() => document.fonts.ready);

    const title = page.locator('[data-slot="event-calendar-title"]');
    const path = page.locator(".strata-calendar-navigation");
    await expectDateVisible(title, "Monday, October 19, 2026");
    await path.getByRole("button", { name: "Next", exact: true }).click();
    await expectDateVisible(title, "Tuesday, October 20, 2026");
    await path.getByRole("button", { name: "Previous", exact: true }).click();
    await expectDateVisible(title, "Monday, October 19, 2026");

    const create = page.getByRole("button", { name: "New event", exact: true });
    await expect(create).toBeInViewport({ ratio: 1 });
    await create.press("Enter");
    const dialog = page.getByRole("dialog", { name: "New Event", exact: true });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(create).toBeFocused();

    const owner = page.getByRole("button", { name: /^Ownership/ });
    await expect(owner).toBeInViewport({ ratio: 1 });
    await owner.press("Enter");
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitemcheckbox").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(owner).toBeFocused();
  });
}
