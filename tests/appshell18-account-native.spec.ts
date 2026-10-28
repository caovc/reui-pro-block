import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import {
  viewports,
  recordErrors,
  openTodo,
  openAccount,
  closeAccount,
  checkThemeFlow,
  expectDark,
  appearance,
} from "./appshell18-account-native-helpers";

for (const viewport of viewports) {
  test(`AppShell 18 ${viewport.width}: native account theme, focus and closed-menu OS follow`, async ({
    page,
  }) => {
    const errors = recordErrors(page);
    await openTodo(page, viewport);
    await checkThemeFlow(page, viewport.width);
    expect(errors).toEqual([]);
  });

  test(`AppShell 18 ${viewport.width}: inherited dark remains dark on a light OS`, async ({
    page,
  }) => {
    const errors = recordErrors(page);
    await openTodo(page, viewport, { mode: "inherit", inheritedDark: true });
    await expectDark(page, true);
    const before = await appearance(page);
    const { trigger } = await openAccount(page, viewport.width);
    await closeAccount(page, trigger);
    if (viewport.width === 390) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toBeHidden();
    }
    await page.emulateMedia({ colorScheme: "dark" });
    await expectDark(page, true);
    await page.emulateMedia({ colorScheme: "light" });
    await expectDark(page, true);
    expect(await appearance(page)).toEqual(before);
    expect(errors).toEqual([]);
  });

  test(`AppShell 18 ${viewport.width}: account geometry and native keyboard navigation`, async ({
    page,
  }, testInfo) => {
    const errors = recordErrors(page);
    await openTodo(page, viewport, { geometry: true });
    const { trigger, menu } = await openAccount(page, viewport.width, true);
    await expect(menu).toHaveAttribute("data-side", viewport.width === 390 ? "top" : "right");
    await expect(menu).toHaveAttribute("data-align", "end");
    await expect.poll(async () => Math.round((await menu.boundingBox())!.width)).toBe(240);
    await expect.poll(async () => Math.round((await menu.boundingBox())!.height)).toBe(309);
    const geometryTrigger = page.getByRole("button", {
      name: "Open user menu",
      exact: true,
      includeHidden: true,
    });
    expect((await geometryTrigger.locator('[data-slot="avatar"]').boundingBox())!.width).toBe(32);
    const rect = (await menu.boundingBox())!;
    const geometryPath = testInfo.outputPath("account-geometry.json");
    await writeFile(
      geometryPath,
      JSON.stringify(
        {
          viewport,
          phase: "initial-open-before-keyboard-theme-change",
          rect,
          side: await menu.getAttribute("data-side"),
          align: await menu.getAttribute("data-align"),
          initialPreset: await page.evaluate(() =>
            JSON.parse(localStorage.getItem("blocks-preview-theme-v2")!),
          ),
        },
        null,
        2,
      ),
    );
    await testInfo.attach("account-geometry", {
      path: geometryPath,
      contentType: "application/json",
    });
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
    expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
    // Persist the initial light state; settled dark has a separate visual gate.
    const menuScreenshot = testInfo.outputPath("native-account-menu.png");
    await page.screenshot({ path: menuScreenshot });
    await testInfo.attach("native-account-menu", {
      path: menuScreenshot,
      contentType: "image/png",
    });
    await page.keyboard.press("End");
    await expect(menu.getByRole("menuitem", { name: /Sign Out/ })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(menu.getByRole("menuitem", { name: /Profile/ })).toBeFocused();
    const nextItems = [
      menu.getByRole("menuitem", { name: "Preferences", exact: true }),
      menu.getByRole("menuitem", { name: "My Tasks", exact: true }),
      menu.getByRole("menuitem", { name: "Completed", exact: true }),
      menu.getByRole("menuitem", { name: "Help & Support", exact: true }),
      menu.getByRole("menuitemradio", { name: "Light", exact: true }),
      menu.getByRole("menuitemradio", { name: "Dark", exact: true }),
    ];
    for (const target of nextItems) {
      await page.keyboard.press("ArrowDown");
      await expect(target).toBeFocused();
    }
    const dark = menu.getByRole("menuitemradio", { name: "Dark", exact: true });
    await expect(dark).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dark).toHaveAttribute("aria-checked", "true");
    await expectDark(page, true);
    await expect(menu).toBeVisible();
    await closeAccount(page, trigger);
    if (viewport.width === 1440) {
      const sidebar = page.locator('[data-slot="sidebar"][data-state]');
      const gap = sidebar.locator('[data-slot="sidebar-gap"]');
      const panel = sidebar.locator('[data-slot="sidebar-container"]');
      const before = (await panel.boundingBox())!.width;
      await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
      await expect(sidebar).toHaveAttribute("data-state", "collapsed");
      await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThan(80);
      await expect.poll(async () => (await gap.boundingBox())!.width).toBeLessThan(80);
      expect((await panel.boundingBox())!.width).toBeLessThan(before / 2);
      const button = (await trigger.boundingBox())!;
      const avatar = (await trigger.locator('[data-slot="avatar"]').boundingBox())!;
      expect(avatar.width).toBe(24);
      expect(avatar.x).toBeGreaterThanOrEqual(button.x);
      expect(avatar.x + avatar.width).toBeLessThanOrEqual(button.x + button.width);
      await trigger.click();
      await expect(menu).toBeVisible();
      await closeAccount(page, trigger);
      const collapsedScreenshot = testInfo.outputPath("collapsed-account.png");
      await page.screenshot({ path: collapsedScreenshot });
      await testInfo.attach("collapsed-account", {
        path: collapsedScreenshot,
        contentType: "image/png",
      });
    }
    expect(errors).toEqual([]);
  });
}
