import { test, expect, type Page, type Locator } from "@playwright/test";

const url = (n: number) =>
  `./#/preview/application/app-shell/app-shell-${n}?preset=${encodeURIComponent(JSON.stringify({ accent: "default", mode: "light", font: "default" }))}`;
async function openPortal(page: Page, n: number, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.goto(url(n));
  await expect(page.locator(`[data-shell-variant="${n}"]`)).toBeVisible();
  let opener: Locator | undefined;
  if (width === 390) {
    if (n === 18) await page.getByRole("button", { name: "Close assistant", exact: true }).click();
    opener = page.getByRole("button", { name: "Open navigation", exact: true });
    await opener.click();
    await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toBeVisible();
  }
  const trigger = page
    .getByRole("button", {
      name: n === 1 ? "Switch workspace" : n === 2 ? "Search workspace" : "Open user menu",
      exact: true,
    })
    .first();
  await trigger.click();
  const popup =
    n === 2 ? page.getByRole("dialog", { name: "Search", exact: true }) : page.getByRole("menu");
  await expect(popup).toBeVisible();
  const row = n === 2 ? popup.getByRole("combobox") : popup.getByRole("menuitem").first();
  await page.evaluate(() => document.fonts.ready);
  return { trigger, popup, row, opener };
}
async function closePortal(page: Page, entry: Awaited<ReturnType<typeof openPortal>>) {
  await page.keyboard.press("Escape");
  await expect(entry.popup).not.toBeVisible();
  await expect(entry.trigger).toBeFocused();
  if (entry.opener) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).not.toBeVisible();
    await expect(entry.opener).toBeFocused();
  }
}
for (const width of [1440, 390]) {
  for (const n of [1, 2, 18]) {
    test(`AppShell ${n} portal matches reference Inter14/20 at ${width}px and returns focus`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const entry = await openPortal(page, n, width);
      await expect(entry.popup).toHaveCSS("font-family", /^Inter,/);
      await expect(entry.row).toHaveCSS("font-family", /^Inter,/);
      await expect(entry.row).toHaveCSS("font-size", "14px");
      await expect(entry.row).toHaveCSS("line-height", "20px");
      if (n === 2) await entry.row.fill("Projects");
      else {
        await entry.row.focus();
        await page.keyboard.press("ArrowDown");
        expect(await entry.popup.evaluate((e) => e.contains(document.activeElement))).toBe(true);
      }
      await closePortal(page, entry);
      expect(errors).toEqual([]);
    });
  }
}
for (const width of [1440, 390]) {
  for (const n of [1, 2, 18]) {
    test(`AppShell ${n} explicit body fonts and Reset preserve an open portal at ${width}px`, async ({
      page,
      context,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("./#/block/application/app-shell/app-shell-1");
      await page.getByRole("button", { name: "Customize", exact: true }).click();
      const bodyFont = page.getByRole("combobox", { name: "Body font", exact: true });
      await expect(bodyFont).toBeVisible();
      const target = await context.newPage();
      const entry = await openPortal(target, n, width);
      if (n === 2) await entry.row.fill("Projects");
      const choose = async (name: string) => {
        await bodyFont.click();
        await page.getByRole("option", { name, exact: true }).click();
      };
      await choose("Serif");
      await expect(entry.popup).toBeVisible();
      await expect(entry.row).toHaveCSS("font-family", "Georgia, serif");
      if (n === 2) await expect(entry.row).toHaveValue("Projects");
      await choose("Mono");
      await expect(entry.row).toHaveCSS("font-family", "ui-monospace, monospace");
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(entry.row).toHaveCSS("font-family", /^Inter,/);
      if (n === 2) await expect(entry.row).toHaveValue("Projects");
      await closePortal(target, entry);
      await target.close();
    });
  }
}

test("default workspace switcher still follows the native provider collapse and placement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url(1));
  const trigger = page.getByRole("button", { name: "Switch workspace", exact: true });
  await trigger.click();
  await expect(page.getByRole("menu")).toHaveAttribute("data-side", "bottom");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+b");
  await expect(page.locator('[data-slot="sidebar"][data-state]').first()).toHaveAttribute(
    "data-state",
    "collapsed",
  );
  await expect(trigger).not.toContainText("Bricklane");
  await trigger.click();
  await expect(page.getByRole("menu")).toHaveAttribute("data-side", "right");
  await expect(page.getByRole("menuitem", { name: "Acme Inc", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("collapsed navigation children keep reference typography and native keyboard selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url(1));
  await expect(page.locator('[data-shell-variant="1"]')).toBeVisible();
  await page.keyboard.press("Control+b");
  const trigger = page.getByRole("button", { name: "Pipelines", exact: true });
  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute("data-side", "right");
  const first = menu.getByRole("menuitem", { name: "Deployments", exact: true });
  await expect(first).toHaveCSS("font-family", /^Inter,/);
  await expect(first).toHaveCSS("font-size", "14px");
  await expect(first).toHaveCSS("line-height", "20px");
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Release Gates", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Breadcrumb", exact: true })).toContainText(
    "Release Gates",
  );
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
