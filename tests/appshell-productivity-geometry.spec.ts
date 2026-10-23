import { test, expect } from "@playwright/test";

const route = (n: number) => `./#/preview/application/app-shell/app-shell-${n}`;
for (const width of [1280, 1718]) {
  for (const n of [17, 18, 20]) {
    test(`native productivity shell ${n} preserves compact controls at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route(n));
      const panel = page.locator('[data-slot="sidebar-container"]').first();
      const expanded = n === 17 ? 255 : n === 18 ? 250 : 240;
      await expect.poll(async () => (await panel.boundingBox())?.width).toBe(expanded);
      const collapse = page.getByRole("button", { name: "Toggle Sidebar", exact: true }).first();
      await collapse.click();
      await expect.poll(async () => (await panel.boundingBox())?.width).toBe(66);
      const gap = page.locator('[data-slot="sidebar-gap"]').first();
      expect((await gap.boundingBox())!.width).toBe(64);
      const inner = (await panel.locator('[data-slot="sidebar-inner"]').boundingBox())!;
      expect(inner.width).toBe(50);
      const expand =
        n === 17
          ? page.getByRole("button", { name: "Expand sidebar", exact: true })
          : page.getByRole("button", { name: "Toggle Sidebar", exact: true });
      const trigger = (await expand.boundingBox())!;
      expect(trigger.x).toBeGreaterThanOrEqual(64);
      const brand =
        n === 20
          ? panel.locator('[data-slot="sidebar-header"] [data-slot="avatar"]').first()
          : panel.locator('[data-slot="sidebar-header"] svg').first();
      const logo = (await brand.boundingBox())!;
      expect(logo.x).toBeGreaterThanOrEqual(inner.x);
      expect(logo.x + logo.width).toBeLessThanOrEqual(inner.x + inner.width);
      await expect(
        panel.getByRole("button", {
          name: n === 17 ? "New Chat" : n === 18 ? "New Task" : "New Mail",
          exact: true,
        }),
      ).toBeVisible();
      if (n === 17)
        await expect(panel.getByRole("button", { name: "Favorites", exact: true })).toBeVisible();
      if (n === 18) await expect(panel.locator(".todo-focus")).toHaveCount(0);
      await expand.focus();
      await expand.press("Enter");
      await expect.poll(async () => (await panel.boundingBox())?.width).toBe(expanded);
    });
  }
}

test("productivity phone sheets retain labels after desktop folding and have one close control", async ({
  page,
}) => {
  for (const n of [17, 18, 20]) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("about:blank");
    await page.goto(route(n));
    await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).first().click();
    await page.setViewportSize({ width: 390, height: 844 });
    if (n === 18)
      await page
        .getByRole("dialog", { name: "AI Assistant", exact: true })
        .getByRole("button", { name: "Close assistant", exact: true })
        .click();
    const opener = page.getByRole("button", { name: "Open navigation", exact: true });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Navigation", exact: true });
    await expect(
      dialog.getByRole("button", {
        name: n === 17 ? "New Chat" : n === 18 ? "All Tasks" : "Inbox",
        exact: true,
      }),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Toggle Sidebar", exact: true })).toHaveCount(
      0,
    );
    if (n === 17)
      expect(
        await dialog
          .locator('.model-chat-pinned [data-slot="sidebar-menu-button"]')
          .evaluate((el) => getComputedStyle(el).display),
      ).toBe("grid");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  }
});

test("section-tabs shell has a fixed desktop panel and a responsive mobile Sheet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route(28));
  const panel = page.getByRole("complementary", { name: "Fleet navigation", exact: true });
  await expect(panel).toBeVisible();
  const before = (await panel.boundingBox())!;
  await page.keyboard.press("Control+b");
  await expect.poll(async () => (await panel.boundingBox())!.width).toBe(before.width);
  await expect(page.getByRole("button", { name: "Fleet Preferences", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const opener = page.getByRole("button", { name: "Open fleet navigation", exact: true });
  await opener.click();
  await expect(page.getByRole("dialog", { name: "Fleet navigation", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("favorites compact header and footer retain reachable icon controls", async ({ page }) => {
  await page.goto(route(15));
  const toggle = page.getByRole("button", { name: "Toggle Sidebar", exact: true });
  await toggle.click();
  const panel = page.locator('[data-slot="sidebar-container"]');
  await expect.poll(async () => (await panel.boundingBox())?.width).toBe(48);
  const box = (await panel.boundingBox())!;
  for (const button of [
    toggle,
    page.getByRole("button", { name: "Invite", exact: true }),
    page.getByRole("button", { name: "Help", exact: true }),
  ]) {
    const b = (await button.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(box.x);
    expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width);
    await expect(button).toBeVisible();
  }
  await toggle.click();
  await expect(page.getByRole("button", { name: "Workspaces", exact: true })).toBeVisible();
});
