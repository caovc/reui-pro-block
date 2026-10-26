import { expect, test } from "@playwright/test";

async function openSettings(page: import("@playwright/test").Page) {
  await page.goto("./#/preview/application/dialog/dialog-10");
  await page.getByRole("button", { name: "Open account settings", exact: true }).click();
  await expect(page.locator('[data-settings-panel="controlled"]')).toBeVisible();
}

for (const width of [1440, 390]) {
  test(`controlled settings preserve caller draft, validation and committed values at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await openSettings(page);
    await page.getByLabel("Full Name", { exact: true }).fill("Bricklane reviewer");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.getByRole("button", { name: "Open account settings", exact: true }).click();
    await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue("Bricklane reviewer");

    await page.getByRole("tab", { name: "Workspace", exact: true }).click();
    await page.getByLabel("Workspace Name", { exact: true }).fill("Bricklane Studio");
    await page.getByLabel("Support Email", { exact: true }).fill("invalid");
    await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    const support = page.getByLabel("Support Email", { exact: true });
    await expect(support).toHaveAttribute("aria-invalid", "true");
    await expect(support).toHaveAttribute(
      "aria-describedby",
      /workspace-settings-supportEmail-error/,
    );
    await support.fill("support@bricklane.example");
    await page.getByRole("tab", { name: "Team", exact: true }).click();
    await page.getByRole("switch", { name: "Member Invites", exact: true }).check();
    await page.getByLabel("Default Role", { exact: true }).click();
    await page.getByRole("option", { name: "Reviewer", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Bricklane reviewer · Bricklane Studio · Reviewer",
    );
    await expect(page.getByRole("alert")).toContainText("Member invites: On");
    await page.getByRole("button", { name: "Open account settings", exact: true }).click();
    await expect(page.getByRole("switch", { name: "Member Invites", exact: true })).toBeChecked();
    await expect(page.getByLabel("Default Role", { exact: true })).toHaveText("Reviewer");
    const footer = await page.locator(".workspace-settings-footer").boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(844);
    expect(errors).toEqual([]);
  });
}
