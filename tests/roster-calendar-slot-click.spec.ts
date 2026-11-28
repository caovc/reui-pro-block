import { expect, test } from "@playwright/test";

for (const foundation of ["radix", "base"] as const) {
  test(`Roster ${foundation} accepts the first new calendar slot click after closing a leave detail`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      `${foundation === "base" ? "./base/" : "./"}#/template-preview/roster/time/calendar`,
    );
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", foundation);
    const calendar = page.locator(".ct-roster-calendar");
    await calendar.locator('[data-slot="event-calendar-nav-next"]').click();
    const marco = calendar
      .locator('[data-slot="event-calendar-event"]')
      .filter({ hasText: "Marco Bianchi: annual leave" });
    const slot = calendar.getByRole("gridcell", { name: "Friday, August 14th, 2026", exact: true });
    await expect(slot).toBeVisible();
    await marco.click();
    const detail = page.getByRole("dialog", { name: "Marco Bianchi: annual leave", exact: true });
    await expect(detail).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(detail).toHaveCount(0);
    await slot.click();
    const editor = page.getByRole("dialog", { name: "New event", exact: true });
    await expect(editor.getByText("Friday, 14 August 2026", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(editor).toHaveCount(0);
  });
}
