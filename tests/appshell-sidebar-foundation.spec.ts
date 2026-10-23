import { test, expect } from "@playwright/test";

const route = (n: number) => `/#/preview/application/app-shell/app-shell-${n}`;

test("all 36 desktop shells use the ReUI Sidebar and Inset foundation", async ({ page }) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1280, height: 900 });
  for (let n = 1; n <= 36; n++) {
    await test.step(`AppShell ${n}`, async () => {
      await page.goto(route(n));
      const shell = page.locator(`[data-shell-variant="${n}"]`);
      await expect(shell).toBeVisible();
      await expect(page.locator(".reui-shell-layout[data-slot=sidebar-wrapper]")).toBeVisible();
      await expect(shell.locator("[data-slot=sidebar-inset]").first()).toBeVisible();
      // AppShell 30 is the reference's horizontal-navigation layout.
      if (n === 30) return;
      await expect(shell.locator(".reui-sidebar-panel").first()).toBeVisible();
      await expect(
        shell.locator("aside.shell-sidebar, nav.shell-icon-rail, aside.observe-sidebar"),
      ).toHaveCount(0);
      const panel = await shell.locator(".reui-sidebar-panel").first().boundingBox();
      expect(panel?.y).toBeLessThan(100);
      expect(panel?.height).toBeGreaterThan(500);
    });
  }
});

test("Sidebar keyboard shortcut, rail and nested menu share one collapsed state", async ({
  page,
}) => {
  await page.goto(route(1));
  const sidebar = page.locator('[data-slot="sidebar"][data-side="left"]').first();
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  await page.keyboard.press("Control+b");
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  await expect(page.getByRole("button", { name: "Expand sidebar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Infrastructure", exact: true }).click();
  await page.getByRole("menuitem", { name: "Databases", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Databases");
  await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  await expect(page.getByRole("button", { name: "Databases", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Databases", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("a desktop collapse does not remove labels from the mobile Sidebar Sheet", async ({
  page,
}) => {
  await page.goto(route(1));
  await page.keyboard.press("Control+b");
  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Navigation", exact: true });
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true, includeHidden: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await sheet.getByRole("button", { name: "Infrastructure", exact: true }).click();
  await sheet.getByRole("button", { name: "Databases", exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Databases");
});

test("project row menus remain keyboard reachable and disclosure owns aria-controls", async ({
  page,
}) => {
  await page.goto(route(3));
  const heading = page.getByRole("button", { name: "Active Projects", exact: true });
  await expect(heading).toHaveAttribute("aria-controls", /.+/);
  await heading.click();
  await expect(page.getByRole("button", { name: "Design System", exact: true })).toBeHidden();
  await heading.click();
  const action = page.getByRole("button", { name: "Actions for Design System", exact: true });
  await action.focus();
  await action.press("Enter");
  await page.getByRole("menuitem", { name: "Remove from sidebar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Design System", exact: true })).toHaveCount(0);
});

test("order Sidebar retains its filter across mobile dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route(34));
  const trigger = page.getByRole("button", { name: "Open order queue", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Order queue", exact: true });
  await dialog.getByRole("textbox", { name: "Search orders", exact: true }).fill("10090");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog.getByRole("textbox", { name: "Search orders", exact: true })).toHaveValue(
    "10090",
  );
  await expect(dialog.getByRole("treeitem", { name: "PO-2026-10090", exact: true })).toBeVisible();
});

test("scope Tabs use the free composition's arrow, Home and End navigation", async ({ page }) => {
  await page.goto(route(26));
  const first = page.getByRole("tab", { name: "Endpoints", exact: true });
  await first.focus();
  await first.press("ArrowRight");
  const code = page.getByRole("tab", { name: "Code", exact: true });
  await expect(code).toHaveAttribute("aria-selected", "true");
  await code.press("End");
  const last = page.getByRole("tab", { name: "Compliance", exact: true });
  await expect(last).toHaveAttribute("aria-selected", "true");
  await last.press("Home");
  await expect(first).toHaveAttribute("aria-selected", "true");
});

test("fleet photo shell switches its Sidebar at the reference tablet breakpoint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto(route(22));
  const trigger = page.getByRole("button", { name: "Open workspace navigation", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Workspace", exact: true });
  await expect(dialog.getByRole("button", { name: "Robots", exact: true })).toBeVisible();
  await expect
    .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(900);
});
