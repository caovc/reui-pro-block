import { expect, test } from "@playwright/test";

const subject = "Data export failed on 3 consecutive nightly runs";

for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390]) {
    test(`Pulse ${primitive} ${width} separates the ticket number and accessible detail title`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`${primitive === "base" ? "/base/" : "/"}#/template-preview/pulse`);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      if (width === 390) {
        const trigger = page.getByRole("button", { name: "Toggle Sidebar", exact: true });
        await trigger.click();
        const sidebar = page.getByRole("dialog", { name: "Sidebar", exact: true });
        await sidebar.getByRole("button", { name: "Tickets", exact: true }).click();
        await page.keyboard.press("Escape");
        await expect(sidebar).toBeHidden();
        await expect(trigger).toBeFocused();
      } else {
        await page.getByRole("button", { name: "Tickets", exact: true }).click();
      }

      const card = page.locator(".ct-ticket-card").filter({ hasText: "TCK-4960" });
      await card.click();
      const dialog = page.getByRole("dialog", { name: subject, exact: true });
      const header = dialog.locator(".ct-sheet-heading");
      const title = dialog.getByRole("heading", { name: subject, exact: true });
      const close = dialog.getByRole("button", { name: "Close ticket detail", exact: true });
      await expect(header.getByText("TCK-4960", { exact: true })).toBeVisible();
      await expect(header.locator('[data-slot="sheet-title"]')).toHaveCount(0);
      await expect(dialog.locator('[data-slot="sheet-title"]')).toHaveCount(1);
      await expect(title).toBeVisible();
      await expect(header).toHaveCSS("height", "41px");
      await expect(title).toHaveCSS("font-size", "16px");
      await expect(title).toHaveCSS("line-height", "24px");
      await expect(title).toHaveCSS("font-weight", "600");
      await expect(close).toHaveCSS("width", "32px");
      await expect(close).toHaveCSS("height", "32px");
      await expect
        .poll(() =>
          dialog.evaluate((node) => {
            const root = node.getBoundingClientRect();
            const subject = node
              .querySelector('[data-slot="sheet-title"]')!
              .getBoundingClientRect();
            const close = node.querySelector('[data-slot="sheet-close"]')!.getBoundingClientRect();
            return [
              subject.x - root.x,
              subject.y - root.y,
              close.y - root.y,
              root.right - close.right,
            ];
          }),
        )
        .toEqual([20, 57, 4, 20]);

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(card).toBeFocused();
      await card.click();
      await close.press("Enter");
      await expect(dialog).toBeHidden();
      await expect(card).toBeFocused();
    });
  }
}
