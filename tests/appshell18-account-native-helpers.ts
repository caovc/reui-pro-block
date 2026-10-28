import { expect, type Page, type Locator } from "@playwright/test";

export const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

export const preferences = {
  base: "default",
  accent: "violet",
  chart: "default",
  font: "mono",
  heading: "serif",
  radius: "1",
  custom: "",
  menu: "default",
  menuAccent: "default",
};

export function recordErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

export async function openTodo(
  page: Page,
  viewport: (typeof viewports)[number],
  options: { standalone?: string; mode?: string; inheritedDark?: boolean; geometry?: boolean } = {},
) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: "light" });
  const preset = {
    ...preferences,
    ...(options.geometry
      ? { accent: "default", font: "default", heading: "default", radius: "default" }
      : {}),
    mode: options.mode ?? "light",
  };
  await page.addInitScript((value) => {
    localStorage.setItem("blocks-preview-theme-v2", JSON.stringify(value));
    localStorage.setItem("blocks-dark", "false");
  }, preset);
  const params = new URLSearchParams({
    preset: JSON.stringify(preset),
    theme: options.inheritedDark ? "dark" : "light",
  });
  const hash = `#/preview/application/app-shell/app-shell-18?${params}`;
  if (options.standalone) {
    const url = new URL(options.standalone);
    url.hash = hash;
    await page.goto(url.href);
    await expect(page).toHaveTitle("Component preview");
  } else {
    await page.goto(`./${hash}`);
    await expect(page).toHaveTitle(/Preview/);
  }
  await expect(page.locator('[data-shell-variant="18"]')).toBeVisible();
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  if (viewport.width === 390) {
    const assistant = page.getByRole("dialog", { name: "AI Assistant", exact: true });
    await expect(assistant).toBeVisible();
    await assistant.getByRole("button", { name: "Close assistant", exact: true }).click();
    await expect(assistant).toBeHidden();
  }
  await expect(page.getByRole("heading", { name: "All Tasks", exact: true })).toBeVisible();
}

export async function openAccount(page: Page, width: number, keyboard = false) {
  if (width === 390) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toBeVisible();
  }
  const trigger = page.getByRole("button", { name: "Open user menu", exact: true });
  await expect(trigger).toBeVisible();
  if (keyboard) {
    await trigger.focus();
    await page.keyboard.press("Enter");
  } else {
    await trigger.click();
  }
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  return { trigger, menu };
}

export async function expectDark(page: Page, dark: boolean) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
    .toBe(dark);
}

export async function appearance(page: Page) {
  return page.locator('[data-shell-variant="18"]').evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      primary: style.getPropertyValue("--primary").trim(),
      radius: style.getPropertyValue("--radius").trim(),
      font: style.fontFamily,
      heading: style.getPropertyValue("--font-heading").trim(),
    };
  });
}

export async function expectPreset(
  page: Page,
  initial: Awaited<ReturnType<typeof appearance>>,
  mode: string,
) {
  expect(await appearance(page)).toEqual(initial);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("blocks-preview-theme-v2")!)))
    .toEqual({
      ...preferences,
      mode,
    });
}

export async function closeAccount(page: Page, trigger: Locator) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(trigger).toBeFocused();
}

export async function checkThemeFlow(page: Page, width: number) {
  await expectDark(page, false);
  const initial = await appearance(page);
  expect(initial.primary.toLowerCase()).toBe("#7c3aed");
  expect(initial.radius).toBe("1rem");
  expect(initial.font).toContain("monospace");
  expect(initial.heading).toContain("Georgia");
  const { trigger, menu } = await openAccount(page, width, true);
  const portalAppearance = () =>
    menu.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        primary: style.getPropertyValue("--primary").trim(),
        radius: style.getPropertyValue("--radius").trim(),
        font: style.fontFamily,
      };
    });
  const portalBefore = await portalAppearance();
  expect(portalBefore.primary.toLowerCase()).toBe("#7c3aed");
  expect(portalBefore.radius).toBe("1rem");
  expect(portalBefore.font).toContain("monospace");
  await expect(menu.getByRole("menuitem")).toHaveText([
    /Profile\s*⇧⌘P/,
    "Preferences",
    "My Tasks",
    "Completed",
    "Help & Support",
    /Sign Out\s*⇧⌘Q/,
  ]);
  await expect(menu.getByRole("menuitemradio")).toHaveCount(3);
  await expect(menu.getByText("mira@bricklane.demo", { exact: true })).toBeVisible();
  for (const [name, mode, dark] of [
    ["Dark", "dark", true],
    ["Light", "light", false],
    ["System", "system", false],
  ] as const) {
    await menu.getByRole("menuitemradio", { name, exact: true }).click();
    await expectDark(page, dark);
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitemradio", { name, exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(menu.locator('[role="menuitemradio"][aria-checked="true"]')).toHaveCount(1);
    await expectPreset(page, initial, mode);
    expect(await portalAppearance()).toEqual(portalBefore);
  }
  await closeAccount(page, trigger);
  if (width === 390) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Open user menu", exact: true })).toBeHidden();
  }
  await page.emulateMedia({ colorScheme: "dark" });
  await expectDark(page, true);
  await expectPreset(page, initial, "system");
  await page.emulateMedia({ colorScheme: "light" });
  await expectDark(page, false);
  await expectPreset(page, initial, "system");
  const reopened = await openAccount(page, width);
  await expect(
    reopened.menu.getByRole("menuitemradio", { name: "System", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await reopened.menu.getByRole("menuitem", { name: "Preferences", exact: true }).click();
  await expect(reopened.menu).toBeHidden();
  await expect(reopened.trigger).toBeFocused();
  if (width === 390) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
  }
  await expect(page.getByRole("heading", { name: "All Tasks", exact: true })).toBeVisible();
}
