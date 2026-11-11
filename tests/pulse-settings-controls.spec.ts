import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

for (const primitive of ["radix", "base"] as const) {
  test(`Pulse Settings ${primitive} keeps a single date format and saves a prefixed portal URL`, async ({
    page,
  }) => {
    await page.goto(`${primitive === "base" ? "/base/" : "/"}#/template-preview/pulse`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    const trigger = page.getByRole("button", { name: "Toggle Sidebar", exact: true });
    await trigger.click();
    const sidebar = page.getByRole("dialog", { name: "Sidebar", exact: true });
    await sidebar.getByRole("button", { name: "Settings", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(sidebar).toBeHidden();
    await expect(trigger).toBeFocused();

    const formats = page.getByRole("group", { name: "Date display format", exact: true });
    const pressed = formats.getByRole("button", { pressed: true });
    const initial = formats.getByRole("button", { name: "DD/MM/YYYY", exact: true });
    const yearFirst = formats.getByRole("button", { name: "YYYY/MM/DD", exact: true });
    await expect(pressed).toHaveText("DD/MM/YYYY");
    await initial.press("ArrowRight");
    await expect(yearFirst).toBeFocused();
    await expect(pressed).toHaveText("DD/MM/YYYY");
    await yearFirst.press("Space");
    await expect(pressed).toHaveText("YYYY/MM/DD");
    await yearFirst.click();
    await expect(pressed).toHaveText("YYYY/MM/DD");

    const portal = page.getByRole("textbox", { name: "Support portal URL", exact: true });
    const group = page.locator('[data-slot="input-group"]').filter({ has: portal });
    const prefix = group.getByText("https://", { exact: true });
    const initialPortal = await portal.inputValue();
    await prefix.click();
    await expect(portal).toBeFocused();
    await portal.fill("http://draft.bricklane.example");
    await expect(portal).toHaveValue("draft.bricklane.example");
    const reset = page.getByRole("button", { name: "Reset", exact: true });
    await reset.click();
    await expect(portal).toHaveValue(initialPortal);
    await expect(pressed).toHaveText("DD/MM/YYYY");

    await yearFirst.click();
    await portal.fill("https://saved.bricklane.example");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
    await initial.click();
    await portal.fill("draft.bricklane.example");
    await reset.click();
    await expect(portal).toHaveValue("saved.bricklane.example");
    await expect(pressed).toHaveText("YYYY/MM/DD");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
}
