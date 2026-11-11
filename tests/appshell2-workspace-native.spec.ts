import { expect, test, type Locator, type Page } from "@playwright/test";

const names = ["Vercel", "OpenAI", "Claude", "New Organization", "Account Settings", "Logout"];
const primitives = ["radix", "base"] as const;
type Primitive = (typeof primitives)[number];

function route(primitive: Primitive) {
  const preset = encodeURIComponent(JSON.stringify({ primitive, style: "nova", mode: "light" }));
  const entry = primitive === "base" ? "./base/" : "./";
  return `${entry}#/preview/application/app-shell/app-shell-2?preset=${preset}`;
}

function recordErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      errors.push(`${message.type()}: ${message.text()}`);
    }
  });
  return errors;
}

async function openShell(page: Page, primitive: Primitive) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(route(primitive));
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator('[data-shell-variant="2"]')).toBeVisible();
  await expect(page).toHaveTitle("Floating Sidebar Admin — Preview");
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  return page.getByRole("button", { name: "Switch workspace", exact: true });
}

async function openMenu(page: Page, trigger: Locator) {
  // The native menu hides its trigger from the accessibility tree while open.
  const button = (await trigger.boundingBox())!;
  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute("data-side", "top");
  await expect(menu).toHaveAttribute("data-align", "start");
  await menu.evaluate(async (node) => {
    await Promise.allSettled(node.getAnimations().map((animation) => animation.finished));
  });
  await expect.poll(async () => Math.round((await menu.boundingBox())!.width)).toBe(224);
  await expect.poll(async () => Math.round((await menu.boundingBox())!.height)).toBe(194);
  await expect(menu).toHaveCSS("padding", "4px");
  await expect(menu).toHaveCSS("border-radius", "10px");
  await expect(menu.getByRole("menuitem")).toHaveText(names);
  await expect(menu.getByText("Workspaces", { exact: true })).toHaveCount(0);
  await expect(menu.getByRole("menuitemradio")).toHaveCount(0);
  const row = menu.getByRole("menuitem", { name: "Vercel", exact: true });
  await expect(row).toHaveCSS("height", "28px");
  await expect(row).toHaveCSS("padding", "4px 6px");
  await expect(row).toHaveCSS("font-family", /^Inter,/);
  await expect(row).toHaveCSS("font-size", "14px");
  await expect(row).toHaveCSS("line-height", "20px");
  const popup = (await menu.boundingBox())!;
  expect(Math.abs(popup.x - button.x)).toBeLessThan(1);
  expect(Math.abs(popup.y + popup.height + 8 - button.y)).toBeLessThan(1);
  return menu;
}

for (const primitive of primitives) {
  test.describe(`${primitive} Shell 2`, () => {
    test("Shell 2 footer uses the native six-item workspace menu and preserves local actions", async ({
      page,
    }, testInfo) => {
      const errors = recordErrors(page);
      const trigger = await openShell(page, primitive);
      await expect(trigger).toContainText("Vercel");
      await expect.poll(async () => Math.round((await trigger.boundingBox())!.width)).toBe(222);
      await expect(trigger).toHaveCSS("height", "32px");
      const menu = await openMenu(page, trigger);
      await page.screenshot({ path: testInfo.outputPath("expanded-workspace-menu.png") });
      await menu.getByRole("menuitem", { name: "OpenAI", exact: true }).click();
      await expect(menu).toBeHidden();
      await expect(trigger).toContainText("OpenAI");
      await expect(trigger).toBeFocused();
      await openMenu(page, trigger);
      await expect(
        menu.getByRole("menuitem", { name: "OpenAI", exact: true }).locator(".lucide-check"),
      ).toHaveCount(1);
      await menu.getByRole("menuitem", { name: "New Organization", exact: true }).click();
      await expect(menu).toBeHidden();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await openMenu(page, trigger);
      await menu.getByRole("menuitem", { name: "Account Settings", exact: true }).click();
      await expect(page.getByText("Workspace settings selected", { exact: true })).toBeVisible();
      await openMenu(page, trigger);
      await menu.getByRole("menuitem", { name: "Logout", exact: true }).click();
      await expect(page.getByText("Demo account menu", { exact: true })).toBeVisible();
      await expect(
        page.getByText("This preview uses a local sample account.", { exact: true }),
      ).toBeVisible();
      await expect(trigger).toContainText("OpenAI");
      await expect(page).toHaveURL(/app-shell-2\?preset=/);
      expect(errors).toEqual([]);
    });

    test("Shell 2 footer stays above its compact trigger and retains native keyboard selection", async ({
      page,
    }, testInfo) => {
      const errors = recordErrors(page);
      const trigger = await openShell(page, primitive);
      let menu = await openMenu(page, trigger);
      await menu.getByRole("menuitem", { name: "Claude", exact: true }).click();
      await expect(menu).toBeHidden();
      await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
      await expect.poll(async () => Math.round((await trigger.boundingBox())!.width)).toBe(32);
      await expect(trigger).toHaveCSS("height", "32px");
      menu = await openMenu(page, trigger);
      await expect(
        menu.getByRole("menuitem", { name: "Claude", exact: true }).locator(".lucide-check"),
      ).toHaveCount(1);
      await page.screenshot({ path: testInfo.outputPath("collapsed-workspace-menu.png") });
      await menu.getByRole("menuitem", { name: "Claude", exact: true }).focus();
      await page.keyboard.press("ArrowUp");
      await expect(menu.getByRole("menuitem", { name: "OpenAI", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
      await expect(trigger).toContainText("OpenAI");
      await openMenu(page, trigger);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      expect(errors).toEqual([]);
    });

    test("Shell 2 phone footer retains reference spacing and nested native Escape focus", async ({
      page,
    }, testInfo) => {
      const errors = recordErrors(page);
      await openShell(page, primitive);
      await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
      await page.setViewportSize({ width: 390, height: 844 });
      const opener = page.getByRole("button", { name: "Open navigation", exact: true });
      await opener.click();
      const sheet = page.getByRole("dialog", { name: "Navigation", exact: true });
      await expect(sheet).toBeVisible();
      await expect.poll(async () => Math.round((await sheet.boundingBox())!.width)).toBe(288);
      await expect(sheet).toHaveCSS("padding", "0px");
      await expect.poll(async () => (await sheet.boundingBox())?.x).toBe(0);
      const header = sheet.locator('[data-slot="sidebar-header"]');
      const overview = sheet.getByRole("button", { name: "Overview", exact: true });
      const search = sheet.getByRole("button", { name: "Search workspace", exact: true });
      const close = sheet.getByRole("button", { name: "Close", exact: true });
      for (const control of [header, overview, search, close]) await expect(control).toBeVisible();
      await expect(sheet.getByRole("button", { name: "Toggle Sidebar", exact: true })).toHaveCount(
        0,
      );
      const trigger = sheet.getByRole("button", { name: "Switch workspace", exact: true });
      await expect.poll(async () => Math.round((await trigger.boundingBox())!.width)).toBe(271);
      await expect(trigger).toHaveCSS("height", "32px");
      const panel = (await sheet.boundingBox())!;
      const button = (await trigger.boundingBox())!;
      const controls = await Promise.all(
        [header, overview, search, close].map((control) => control.boundingBox()),
      );
      for (const bounds of controls) {
        expect(bounds!.x).toBeGreaterThanOrEqual(panel.x);
        expect(bounds!.y).toBeGreaterThanOrEqual(panel.y);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(panel.x + panel.width);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(panel.y + panel.height);
      }
      expect(Math.abs(button.x - panel.x - 8)).toBeLessThan(1);
      expect(Math.abs(panel.y + panel.height - button.y - button.height - 8)).toBeLessThan(1);
      const menu = await openMenu(page, trigger);
      await testInfo.attach("phone-sheet-header-nav-footer-geometry", {
        body: JSON.stringify({
          panel,
          button,
          header: controls[0],
          overview: controls[1],
          search: controls[2],
          close: controls[3],
        }),
        contentType: "application/json",
      });
      await page.screenshot({ path: testInfo.outputPath("phone-workspace-menu.png") });
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(sheet).toBeVisible();
      await expect(trigger).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(opener).toBeFocused();
      await opener.click();
      await expect(sheet).toBeVisible();
      await close.click();
      await expect(sheet).toBeHidden();
      await expect(opener).toBeFocused();
      expect(errors).toEqual([]);
    });
  });
}
