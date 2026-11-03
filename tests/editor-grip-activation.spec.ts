import { test, expect } from "@playwright/test";

test("real grip click and keyboard Enter Space ArrowDown retain native menu focus and cancellation", async ({
  page,
}) => {
  await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-2");
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  const target = editor.getByRole("heading", { name: "Our design principles", exact: true });
  const grip = page.getByRole("button", { name: "Block actions", exact: true });
  const menu = page.getByRole("menu", { name: "Block actions", exact: true });
  await target.click();
  await target.hover();
  await grip.click();
  await expect(menu).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Block actions", exact: true, includeHidden: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(editor).toBeFocused();
  for (const key of ["Enter", "Space", "ArrowDown"]) {
    // Native DragHandle intentionally hides on the editable view's keydown.
    // Leave that text surface first, then prepare the real visible grip by hover.
    await page.keyboard.press("Tab");
    await target.hover();
    for (
      let count = 0;
      count < 12 &&
      !(await page
        .getByRole("button", { name: "Block actions", exact: true, includeHidden: true })
        .evaluate((element) => element === element.ownerDocument.activeElement));
      count++
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(grip).toBeFocused();
    await page.keyboard.press(key);
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Turn Into", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(editor).toBeFocused();
    await expect(menu).toHaveCount(0);
  }
});
