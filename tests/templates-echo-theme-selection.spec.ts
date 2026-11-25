import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

type ThemeChoice = "Light" | "Dark" | "System";
type Surface = "account" | "appearance";

const scenarios = [
  { width: 1440, height: 1000, style: "nova" },
  { width: 390, height: 844, style: "sera" },
] as const;

test.use({ colorScheme: "light", reducedMotion: "no-preference", actionTimeout: 5000 });

async function themeAppearance(group: Locator, surface: Surface) {
  return group.getByRole("radio").evaluateAll((radios, currentSurface) => {
    return radios.map((radio) => {
      const option = radio.closest("label")!;
      const target = currentSurface === "account" ? option : radio;
      const css = getComputedStyle(target);
      return {
        name: radio.getAttribute("aria-label"),
        checked: radio.getAttribute("aria-checked") === "true",
        background: css.backgroundColor,
        color: getComputedStyle(option).color,
        shadow: css.boxShadow,
      };
    });
  }, surface);
}

async function expectThemeAppearance(group: Locator, surface: Surface, selected: ThemeChoice) {
  await expect(group.getByRole("radio", { name: selected, exact: true })).toBeChecked();
  await expect
    .poll(async () => {
      const choices = await themeAppearance(group, surface);
      const current = choices.find((choice) => choice.name === selected);
      return {
        count: choices.length,
        checked: choices.filter((choice) => choice.checked).map((choice) => choice.name),
        highlighted: choices
          .filter((choice) => /0px 1px 2px/.test(choice.shadow))
          .map((choice) => choice.name),
        distinctBackground: choices
          .filter((choice) => choice.name !== selected)
          .every((choice) => choice.background !== current?.background),
        distinctIconColor: choices
          .filter((choice) => choice.name !== selected)
          .every((choice) => choice.color !== current?.color),
      };
    })
    .toEqual({
      count: 3,
      checked: [selected],
      highlighted: [selected],
      distinctBackground: true,
      distinctIconColor: true,
    });
}

async function openChats(page: Page, width: number) {
  if (width >= 768) return;
  await page.getByRole("button", { name: "Open chats", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Chats", exact: true })).toBeVisible();
}

for (const primitive of ["radix", "base"] as const) {
  for (const { width, height, style } of scenarios) {
    test(`Echo ${primitive} ${style} ${width}: theme highlights follow native selection in account and General`, async ({
      page,
      baseURL,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height });
      const entry = new URL(primitive === "base" ? "base/" : "./", baseURL);
      const preset = new URLSearchParams({
        preset: JSON.stringify({ primitive, style, mode: "light" }),
      });
      entry.hash = `#/template-preview/echo?${preset}`;
      await page.goto(entry.href);
      await expect(page).toHaveTitle(/Bricklane/);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "How can I help you?", exact: true }),
      ).toBeVisible();

      await openChats(page, width);
      const account = page.getByRole("button", { name: "Account menu", exact: true });
      await account.click();
      const accountTheme = page
        .locator(".echo-account-menu")
        .getByRole("radiogroup", { name: "Theme", exact: true });
      await expectThemeAppearance(accountTheme, "account", "Light");
      await accountTheme.getByRole("radio", { name: "Dark", exact: true }).click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expectThemeAppearance(accountTheme, "account", "Dark");
      await page.screenshot({ path: info.outputPath("account-dark-theme.png") });
      const accountAppearance = await themeAppearance(accountTheme, "account");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toBeHidden();
      await expect(account).toBeFocused();

      await account.click();
      await page.getByRole("menuitem", { name: "Preferences", exact: true }).click();
      await expect(page.locator(".echo-account-menu")).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Account Settings", exact: true }),
      ).toBeVisible();
      if (width < 768) {
        await expect(page.getByRole("dialog", { name: "Chats", exact: true })).toBeHidden();
      }
      const appearance = page
        .getByRole("tabpanel", { name: "General", exact: true })
        .getByRole("radiogroup", { name: "Theme", exact: true });
      await expectThemeAppearance(appearance, "appearance", "Dark");
      const light = appearance.getByRole("radio", { name: "Light", exact: true });
      await light.click();
      await expect(page.locator("html")).not.toHaveClass(/dark/);
      await expectThemeAppearance(appearance, "appearance", "Light");
      await light.press("ArrowRight");
      const dark = appearance.getByRole("radio", { name: "Dark", exact: true });
      await expect(dark).toBeFocused();
      await dark.press("Space");
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expectThemeAppearance(appearance, "appearance", "Dark");
      await dark.press("ArrowRight");
      const system = appearance.getByRole("radio", { name: "System", exact: true });
      await expect(system).toBeFocused();
      await system.press("Space");
      await expect(page.locator("html")).not.toHaveClass(/dark/);
      await expectThemeAppearance(appearance, "appearance", "System");
      await page.screenshot({ path: info.outputPath("general-system-theme.png") });
      const appearancePath = info.outputPath("theme-appearance.json");
      await writeFile(
        appearancePath,
        JSON.stringify(
          {
            primitive,
            style,
            width,
            account: accountAppearance,
            appearance: await themeAppearance(appearance, "appearance"),
          },
          null,
          2,
        ),
      );
      await info.attach("theme-appearance", {
        path: appearancePath,
        contentType: "application/json",
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(errors).toEqual([]);
    });
  }
}
