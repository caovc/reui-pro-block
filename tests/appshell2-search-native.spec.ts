import { expect, test, type Locator } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`AppShell 2 ${width}: native compact search preserves the reference input-only flow`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(
      `./#/preview/application/app-shell/app-shell-2?preset=${encodeURIComponent(JSON.stringify({ mode: "light", accent: "violet" }))}`,
    );
    await expect(page.locator('[data-shell-variant="2"]')).toBeVisible();
    let navigationOpener: Locator | undefined;
    if (width === 390) {
      navigationOpener = page.getByRole("button", { name: "Open navigation", exact: true });
      await navigationOpener.click();
      await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toBeVisible();
    } else {
      await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
      await expect(page.locator('[data-slot="sidebar"][data-state]').first()).toHaveAttribute(
        "data-state",
        "collapsed",
      );
    }
    const trigger = page.getByRole("button", { name: "Search workspace", exact: true });
    const breadcrumb = page.getByRole("navigation", {
      name: "Breadcrumb",
      exact: true,
      includeHidden: true,
    });
    const initialCrumb = await breadcrumb.textContent();
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Search", exact: true });
    const input = dialog.getByRole("textbox", { name: "Search", exact: true });
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("placeholder", "Type to search...");
    await expect(dialog.getByRole("combobox")).toHaveCount(0);
    await expect(dialog.getByRole("listbox")).toHaveCount(0);
    await expect(input).toHaveCSS("height", "40px");
    await expect(input).toHaveCSS("font-size", "14px");
    await expect(input).toHaveCSS("line-height", "20px");
    await expect(dialog).toHaveCSS("padding", "8px 16px");
    await expect(dialog).toHaveCSS("font-family", /^Inter,/);
    await expect.poll(async () => Math.round((await dialog.boundingBox())!.height)).toBe(56);
    await expect
      .poll(async () => Math.round((await dialog.boundingBox())!.width))
      .toBe(width === 390 ? 358 : 448);
    await input.fill("accounts");
    await input.press("Enter");
    await expect(dialog).toBeVisible();
    await expect(input).toHaveValue("accounts");
    await expect(breadcrumb).toHaveText(initialCrumb!);
    await page.screenshot({ path: testInfo.outputPath(`search-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Control+k");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    if (navigationOpener) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toBeHidden();
      await expect(navigationOpener).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}

test("AppShell 18 uses the actual themed Progress primitive for focus completion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const mode of ["light", "dark"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(
      `./#/preview/application/app-shell/app-shell-18?preset=${encodeURIComponent(JSON.stringify({ mode, accent: "emerald" }))}`,
    );
    const progress = page.getByRole("progressbar", { name: "Focus progress", exact: true });
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute("data-slot", "progress");
    await expect(progress).toHaveAttribute("aria-valuemin", "0");
    await expect(progress).toHaveAttribute("aria-valuemax", "100");
    await expect(progress).toHaveAttribute("aria-valuenow", "56");
    await expect(page.locator(".todo-focus")).toContainText("18 / 32");
    await expect(progress).toHaveCSS("height", "4px");
    const indicator = progress.locator('[data-slot="progress-indicator"]');
    await expect(indicator).toHaveCSS("background-color", "rgb(4, 120, 87)");
    const widths = await progress.evaluate((element) => {
      const fill = element.querySelector('[data-slot="progress-indicator"]')!;
      return {
        track: element.getBoundingClientRect().width,
        fill: fill.getBoundingClientRect().width,
      };
    });
    const transform = await indicator.evaluate(
      (element) => new DOMMatrix(getComputedStyle(element).transform).m41,
    );
    expect(Math.abs((widths.fill + transform) / widths.track - 0.56)).toBeLessThan(0.01);
    await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
    await expect(progress).toBeHidden();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Close assistant", exact: true }).click();
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute("aria-valuenow", "56");
    await expect(indicator).toHaveCSS("background-color", "rgb(4, 120, 87)");
  }
  expect(errors).toEqual([]);
});
