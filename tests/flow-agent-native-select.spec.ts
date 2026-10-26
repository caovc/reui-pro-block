import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`agent App selection preserves native interaction, draft cancellation, save and Undo at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./#/preview/application/flow/flow-2");
    await expect(page.locator("[data-flow-variant]")).toBeVisible();

    const node = page.locator('[data-flow-node="query"]');
    await expect(node).toBeVisible();
    await expect(node).toContainText("Neon");
    await node.dblclick();

    const title = page.getByRole("textbox", { name: "Title", exact: true });
    const app = page.getByRole("combobox", { name: "App", exact: true });
    const popup = page.getByRole("listbox");
    const label = page.locator(".fg-inspector-app-fields label", { hasText: /^App$/ });
    await expect(title).toHaveValue("Neon");
    await expect(app).toContainText("Neon");
    await expect(label).toHaveAttribute("for", (await app.getAttribute("id"))!);
    await label.click();
    await expect(popup).toBeVisible();
    await expect(popup.getByRole("option", { name: "Neon", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(app).toBeFocused();

    // Use the free Select's keyboard/typeahead behavior, without selecting DOM state directly.
    await app.press("ArrowDown");
    await expect(popup).toBeVisible();
    await page.keyboard.press("r");
    await expect(popup.getByRole("option", { name: "Resend", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(popup).toHaveCount(0);
    await expect(app).toContainText("Resend");
    await expect(app).toBeFocused();

    // Escape dismisses only the Select portal, preserving its draft and editor focus.
    await app.press("ArrowDown");
    await expect(popup).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(app).toBeFocused();
    await expect(app).toContainText("Resend");
    await expect(title).toHaveValue("Neon");
    await expect(page.getByRole("button", { name: "Save step", exact: true })).toBeVisible();
    if (width === 390) {
      await expect(page.getByRole("dialog")).toBeVisible();
    }

    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(app).toHaveCount(0);
    await node.dblclick();
    await expect(app).toContainText("Neon");
    await expect(title).toHaveValue("Neon");

    // Pointer selection must pass through the actual native option and saved graph.
    await app.click();
    await expect(popup).toBeVisible();
    await popup.getByRole("option", { name: "Slack", exact: true }).click();
    await expect(popup).toHaveCount(0);
    await expect(app).toContainText("Slack");
    const notice = page.locator("[data-sonner-toast]").filter({ hasText: "Step updated" });
    await page.getByRole("button", { name: "Save step", exact: true }).click();
    await expect(app).toHaveCount(0);

    // Undo is a short-lived native action. Use it before testing a separate reopen.
    if (width === 390) {
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await notice.getByRole("button", { name: "Undo", exact: true }).click();
    await node.dblclick();
    await expect(app).toContainText("Neon");
    await expect(title).toHaveValue("Neon");

    // A second real save independently verifies persistence after reopening.
    await app.click();
    await expect(popup).toBeVisible();
    await popup.getByRole("option", { name: "Slack", exact: true }).click();
    await expect(popup).toHaveCount(0);
    await expect(app).toContainText("Slack");
    await page.getByRole("button", { name: "Save step", exact: true }).click();
    await expect(app).toHaveCount(0);
    // Hovering a bottom-right toast pauses its native lifetime and blocks this footer.
    await page.mouse.move(0, 0);
    await expect(notice).toHaveCount(0);
    await page.getByRole("button", { name: "Edit step", exact: true }).click();
    await expect(app).toContainText("Slack");
    await expect(title).toHaveValue("Neon");
    await page
      .getByRole("button", {
        name: width === 390 ? "Close" : "Close step details",
        exact: true,
      })
      .click();
    await expect(app).toHaveCount(0);
    if (width === 390) {
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });
}
