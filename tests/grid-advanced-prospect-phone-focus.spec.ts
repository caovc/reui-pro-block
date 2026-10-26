import { expect, test } from "@playwright/test";

test("phone filtered editor Save restores a visible fallback after its company row leaves My Accounts", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/preview/data-grid/advanced/data-grid-advanced-22");
  await page.getByRole("button", { name: "My Accounts", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(7);
  await page.locator('tbody button[aria-label^="Open "]').first().click();
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  const editor = page.getByRole("dialog");
  await editor.getByRole("combobox", { name: "Owner", exact: true }).click();
  await page.getByRole("option", { name: "Kian Bell", exact: true }).click();
  await editor.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(6);
  const focus = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    const search = document.querySelector('input[aria-label="Search companies"]') as HTMLElement;
    const add = document.querySelector('button[aria-label="Add Company"]') as HTMLElement;
    return {
      activeTag: active?.tagName,
      activeLabel: active?.getAttribute("aria-label"),
      activeConnected: active?.isConnected,
      searchHasLayout: search.getClientRects().length > 0,
      addHasLayout: add.getClientRects().length > 0,
      bodyPointerEvents: getComputedStyle(document.body).pointerEvents,
    };
  });
  await testInfo.attach("filtered-editor-focus.json", {
    body: JSON.stringify(focus, null, 2),
    contentType: "application/json",
  });
  expect(focus.bodyPointerEvents).toBe("auto");
  await expect(page.getByRole("button", { name: "Add Company", exact: true })).toBeFocused();
});
