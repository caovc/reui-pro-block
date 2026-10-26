import { expect, test } from "@playwright/test";
for (const entry of ["settings", "profile"])
  test(`Tempo phone ${entry} preserves Sheet and unwinds one Escape layer at a time`, async ({
    page,
  }) => {
    const issues: string[] = [];
    page.on("pageerror", (error) => issues.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") issues.push(message.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./#/template-preview/tempo");
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    const trigger = page.getByRole("button", {
      name: entry === "settings" ? "Settings" : "Open workspace menu",
      exact: true,
    });
    await trigger.click();
    if (entry === "profile") await page.getByRole("menuitem", { name: /^Profile/ }).click();
    await expect(page.locator("[data-workflow-account=tempo]")).toBeVisible();
    await expect(page.locator("[data-mobile=true][data-state=open]")).toHaveCount(1);
    await page.screenshot({
      path: `/tmp/bricklane-templates-layout/settings-drive-main-proof/tempo-${entry}-v3-dialog-sheet.png`,
      animations: "allow",
    });
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-workflow-account]")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator("[data-mobile=true][data-state=open]")).toHaveCount(1);
    await page.screenshot({
      path: `/tmp/bricklane-templates-layout/settings-drive-main-proof/tempo-${entry}-v3-sheet-trigger.png`,
      animations: "allow",
    });
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-mobile=true]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
    await page.screenshot({
      path: `/tmp/bricklane-templates-layout/settings-drive-main-proof/tempo-${entry}-v3-header-trigger.png`,
      animations: "allow",
    });
    expect(issues).toEqual([]);
  });

test("Mesh phone default navigation closes Sheet and account dialog Cancel returns header focus", async ({
  page,
}) => {
  const issues: string[] = [];
  page.on("pageerror", (error) => issues.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") issues.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/template-preview/mesh");
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.click();
  await page.getByRole("button", { name: "Documents", exact: true }).click();
  await expect(page.locator("[data-mobile=true]")).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Rich text document", exact: true }),
  ).toBeVisible();
  await trigger.click();
  await page.getByRole("button", { name: "Open profile for Sienna Wells", exact: true }).click();
  await page.getByRole("menuitem", { name: /^Profile/ }).click();
  await expect(page.locator("[data-workflow-account=mesh]")).toBeVisible();
  await expect(page.locator("[data-mobile=true]")).toHaveCount(0);
  await page.screenshot({
    path: "/tmp/bricklane-templates-layout/settings-drive-main-proof/mesh-v3-dialog-no-sheet.png",
    animations: "allow",
  });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("textbox", { name: "Rich text document", exact: true }),
  ).toBeVisible();
  expect(issues).toEqual([]);
});
