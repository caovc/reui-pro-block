import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 5000 });

for (const primitive of ["radix", "base"]) {
  test(`Filebox New Folder returns keyboard focus after Escape under ${primitive}`, async ({
    page,
  }) => {
    const preset = new URLSearchParams({
      preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
    });
    const root = primitive === "base" ? "./base/" : "./";
    await page.goto(`${root}#/template-preview/filebox?${preset}`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    const opener = page.getByRole("button", { name: "New Folder", exact: true });
    const dialog = page.getByRole("dialog", { name: "New Folder", exact: true });
    await opener.click();
    await expect(dialog.getByRole("textbox", { name: "Name", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog.getByRole("textbox", { name: "Name", exact: true })).toBeFocused();
  });
}
