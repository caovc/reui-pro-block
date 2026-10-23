import { test, expect } from "@playwright/test";

const preview = (n: number) => `./#/preview/application/app-shell/app-shell-${n}`;

test("icon collapse shrinks the painted panel and its layout spacer together", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const n of [
    1, 2, 3, 6, 7, 9, 10, 11, 12, 13, 15, 17, 18, 19, 20, 21, 23, 24, 27, 28, 29, 33, 36,
  ]) {
    await test.step(`AppShell ${n}`, async () => {
      await page.goto(preview(n));
      const sidebar = page
        .locator('[data-slot="sidebar"][data-state]')
        .filter({ has: page.locator(".reui-sidebar-panel:not(.shell-icon-rail)") })
        .last();
      const panel = sidebar.locator('[data-slot="sidebar-container"]');
      await expect(panel).toBeVisible();
      const expanded = (await panel.boundingBox())!;
      expect(expanded.width).toBeGreaterThan(200);
      await page.keyboard.press("Control+b");
      if ([19, 23, 24].includes(n)) {
        await expect(sidebar).toHaveAttribute("data-collapsible", "offcanvas");
        await expect
          .poll(
            async () => (await sidebar.locator('[data-slot="sidebar-gap"]').boundingBox())?.width,
          )
          .toBe(0);
        await expect
          .poll(async () => {
            const box = (await panel.boundingBox())!;
            return box.x + box.width;
          })
          .toBeLessThanOrEqual(0);
        await page.keyboard.press("Control+b");
        await expect.poll(async () => (await panel.boundingBox())?.x).toBe(expanded.x);
        return;
      }
      await expect(sidebar).toHaveAttribute("data-collapsible", "icon");
      // Native floating/inset panels include outer padding and a 2px border allowance.
      const padded = [2, 3, 9, 10].includes(n);
      const icon = n === 9 ? 50 : 48;
      await expect
        .poll(async () => (await panel.boundingBox())?.width)
        .toBe(padded ? icon + 18 : icon);
      const gap = (await sidebar.locator('[data-slot="sidebar-gap"]').boundingBox())!;
      const collapsed = (await (
        padded ? panel.locator('[data-slot="sidebar-inner"]') : panel
      ).boundingBox())!;
      if (padded) expect(collapsed.width).toBe(icon + 2);
      // Floating examples retain their explicit outer gutter, never a full blank column.
      expect(gap.width).toBeGreaterThanOrEqual(48);
      expect(gap.width).toBeLessThanOrEqual(66);
      expect(collapsed.x + collapsed.width).toBeLessThanOrEqual(gap.x + gap.width);
      await page.keyboard.press("Control+b");
      await expect.poll(async () => (await panel.boundingBox())?.width).toBe(expanded.width);
    });
  }
});

for (const width of [1280, 1718]) {
  test(`AppShell 1 aligns the collapsed brand, icons and account at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(preview(1));
    const collapse = page.getByRole("button", { name: "Collapse sidebar", exact: true });
    await collapse.click();
    const panel = page.locator('[data-slot="sidebar-container"]');
    await expect.poll(async () => (await panel.boundingBox())?.width).toBe(48);
    const main = (await page.locator('[data-slot="sidebar-inset"]').boundingBox())!;
    expect(main.x).toBe(48);
    const brand = (await page
      .getByRole("button", { name: "Switch workspace", exact: true })
      .locator("svg")
      .first()
      .boundingBox())!;
    const icon = (await page
      .getByRole("button", { name: "Overview", exact: true })
      .locator("svg")
      .boundingBox())!;
    const avatar = (await page
      .getByRole("button", { name: "Open user menu", exact: true })
      .locator('[data-slot="avatar"]')
      .boundingBox())!;
    for (const box of [brand, icon, avatar]) expect(box.x + box.width / 2).toBeCloseTo(24, 0);
    expect(brand.width).toBe(24);
    const expand = page.getByRole("button", { name: "Expand sidebar", exact: true });
    const rail = (await expand.boundingBox())!;
    expect(rail.x).toBeGreaterThanOrEqual(47);
    expect(rail.x).toBeLessThanOrEqual(48);
    expect(rail.y + rail.height / 2).toBe(450);
    // Real hit testing catches a rail clipped by the collapsed Content or behind the Inset.
    await expand.focus();
    await expand.press("Enter");
    await expect.poll(async () => (await panel.boundingBox())?.width).toBe(256);
  });
}

test("workspace switcher retains the selected name and opens beside the compact rail", async ({
  page,
}) => {
  await page.goto(preview(1));
  const trigger = page.getByRole("button", { name: "Switch workspace", exact: true });
  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu).toHaveAttribute("data-side", "bottom");
  await expect.poll(async () => (await menu.boundingBox())!.width).toBeGreaterThanOrEqual(239);
  await menu.getByRole("menuitem", { name: "Acme Inc", exact: true }).click();
  await expect(trigger).toContainText("Acme Inc");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole("menuitem", { name: /New Workspace/ }).click();
  const dialog = page.getByRole("dialog", { name: "New workspace", exact: true });
  await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("Design Studio");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(trigger).toContainText("Design Studio");
  await page.keyboard.press("Control+b");
  await expect.poll(async () => (await trigger.boundingBox())?.width).toBe(32);
  await trigger.click();
  await expect(menu).toHaveAttribute("data-side", "right");
  await expect(menu.getByRole("menuitem", { name: "Design Studio", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("catalog iframe uses the same collapsed geometry and remains usable on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1718, height: 1100 });
  await page.goto("/#/block/application/app-shell/app-shell-1");
  const iframe = page.frameLocator("iframe");
  await iframe.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  const panel = iframe.locator('[data-slot="sidebar-container"]');
  await expect.poll(async () => (await panel.boundingBox())?.width).toBe(48);
  await expect(iframe.getByRole("button", { name: "Expand sidebar", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(preview(1));
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Navigation", exact: true });
  await expect(sheet.getByRole("button", { name: "Switch workspace", exact: true })).toContainText(
    "Bricklane",
  );
  await expect(sheet.getByRole("button", { name: "Overview", exact: true })).toBeVisible();
  const switcher = (await sheet
    .getByRole("button", { name: "Switch workspace", exact: true })
    .boundingBox())!;
  const close = (await sheet.getByRole("button", { name: "Close", exact: true }).boundingBox())!;
  expect(switcher.x + switcher.width).toBeLessThanOrEqual(close.x);
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
});

test("account card uses account actions and a keyboard-operated Theme submenu", async ({
  page,
}) => {
  await page.goto(preview(1));
  const account = page.getByRole("button", { name: "Open user menu", exact: true });
  await account.click();
  const menu = page
    .getByRole("menu")
    .filter({ has: page.getByRole("menuitem", { name: /^Profile/ }) });
  await expect(menu).toHaveAttribute("data-side", "right");
  await expect(menu).toContainText("nick@bricklane.demo");
  await expect(menu.getByRole("menuitem", { name: "Billing & Usage", exact: true })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /^Preferences/ })).toBeVisible();
  await expect(menu).not.toContainText("Workspaces");
  const theme = menu.getByRole("menuitem", { name: "Theme", exact: true });
  await theme.focus();
  await theme.press("ArrowRight");
  const light = page.getByRole("menuitemradio", { name: "Light", exact: true });
  await expect(light).toBeFocused();
  await light.press("ArrowDown");
  const dark = page.getByRole("menuitemradio", { name: "Dark", exact: true });
  await expect(dark).toBeFocused();
  await dark.press("Enter");
  await expect(dark).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(menu).toBeVisible();
  await page.getByRole("menuitemradio", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.keyboard.press("ArrowLeft");
  await expect(theme).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(account).toBeFocused();
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await account.click();
  await expect(menu).toHaveAttribute("data-side", "right");
  await menu.getByRole("menuitem", { name: /^Profile/ }).click();
  await expect(page.getByText("Profile selected", { exact: true })).toBeVisible();
});

for (const width of [1280, 1718]) {
  test(`floating shell preserves its logo and header toggle after collapse at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(preview(2));
    const sidebar = page.locator('[data-slot="sidebar"][data-state]');
    await expect(sidebar).toHaveAttribute("data-variant", "floating");
    const toggle = page.getByRole("button", { name: "Toggle Sidebar", exact: true });
    await expect(toggle).toHaveAttribute("data-slot", "sidebar-trigger");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    const frame = sidebar.locator('[data-slot="sidebar-inner"]');
    await expect.poll(async () => (await frame.boundingBox())?.width).toBe(50);
    const logo = (await sidebar.locator(".shell-floating-brand > svg").boundingBox())!;
    const search = page.getByRole("button", { name: "Search workspace", exact: true });
    const searchBox = (await search.boundingBox())!;
    const control = (await toggle.boundingBox())!;
    expect(logo.width).toBe(28);
    expect(logo.height).toBe(28);
    expect(logo.x).toBe(19);
    expect(logo.y).toBe(23);
    expect(control.y).toBe(65);
    expect(control.width).toBe(28);
    expect(searchBox.width).toBe(32);
    expect(searchBox.height).toBe(32);
    expect(searchBox.x).toBe(17);
    expect(searchBox.y).toBe(109);
    await expect(toggle.locator("svg")).toHaveCSS("transform", "matrix(-1, 0, 0, -1, 0, 0)");
    const visibleFrame = (await frame.boundingBox())!;
    for (const box of [logo, control, searchBox]) {
      expect(box.x).toBeGreaterThan(visibleFrame.x);
      expect(box.x + box.width).toBeLessThan(visibleFrame.x + visibleFrame.width);
    }
    await expect(page.getByRole("button", { name: "Expand sidebar", exact: true })).toHaveCount(0);
    await search.click();
    const palette = page.getByRole("dialog", { name: "Search", exact: true });
    await expect(palette).toBeVisible();
    await palette.getByRole("combobox").fill("Projects");
    await page.keyboard.press("Enter");
    await expect(palette).toHaveCount(0);
    await expect(search).toBeFocused();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Projects");
    await toggle.focus();
    await toggle.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toBeFocused();
    await expect.poll(async () => (await frame.boundingBox())?.width).toBe(240);
    await toggle.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Control+b");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
}

test("floating Sidebar returns focus to the phone opener after a desktop collapse", async ({
  page,
}) => {
  await page.goto(preview(2));
  await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const opener = page.getByRole("button", { name: "Open navigation", exact: true });
  await opener.click();
  const sheet = page.getByRole("dialog", { name: "Navigation", exact: true });
  await expect(sheet.getByText("Bricklane", { exact: true })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Toggle Sidebar", exact: true })).toHaveCount(0);
  await sheet.getByRole("button", { name: "Close", exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  const search = sheet.getByRole("button", { name: "Search workspace", exact: true });
  await search.click();
  const palette = page.getByRole("dialog", { name: "Search", exact: true });
  await palette.getByRole("combobox").fill("Projects");
  await page.keyboard.press("Enter");
  await expect(palette).toHaveCount(0);
  await expect(search).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(opener).toBeFocused();
});
