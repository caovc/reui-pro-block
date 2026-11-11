import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 1000 } });

for (const primitive of ["radix", "base"] as const) {
  test(`Pulse ${primitive} restores Dashboard focus after dismissing, editing and deleting a ticket`, async ({
    page,
  }) => {
    await page.goto(`${primitive === "base" ? "./base/" : "./"}#/template-preview/pulse`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);

    const subject = "Nightly export has finished empty since the schema change";
    const opener = page.getByRole("button", { name: "Open TCK-4863", exact: true });
    const detail = page.getByRole("dialog", { name: subject, exact: true });
    await opener.press("Enter");
    await expect(detail).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(detail).toBeHidden();
    await expect(opener).toBeFocused();

    await opener.press("Enter");
    await detail.getByRole("button", { name: "More ticket actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit ticket", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit escalation", exact: true });
    const editedSubject = "Nightly export is awaiting reconciliation";
    await editor
      .getByRole("textbox", { name: "What is blocking it", exact: true })
      .fill(editedSubject);
    await editor.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(opener).toBeFocused();

    await opener.press("Enter");
    const editedDetail = page.getByRole("dialog", { name: editedSubject, exact: true });
    await expect(editedDetail.getByText("TCK-4863", { exact: true })).toBeVisible();
    await editedDetail.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(editedDetail).toBeHidden();
    await expect(opener).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "Search tickets", exact: true })).toBeFocused();
  });
}
