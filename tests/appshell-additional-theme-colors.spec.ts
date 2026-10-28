import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { defaultTheme, themeCSS } from "../src/components/site/preview-theme";
import { additionalThemeColors } from "./fixtures/additional-theme-colors";

const blockRoute = "./#/block/application/app-shell/app-shell-1";

async function choose(page: Page, label: string, option: string) {
  const trigger = page.getByRole("combobox", { name: label, exact: true });
  await trigger.click();
  await page.getByRole("option", { name: option, exact: true }).click();
  // A visually hidden closing Radix layer can still consume the next Escape.
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText(option);
}

async function closeCustomizerWithEscape(page: Page) {
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("complementary", { name: "Preview customization", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Customize", exact: true })).toBeFocused();
}

function observeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test.use({ viewport: { width: 1440, height: 1000 } });

for (const expected of additionalThemeColors) {
  for (const mode of ["light", "dark"] as const) {
    test(`${expected.label} ${mode}: native Customize colors the AppShell navigation and brand`, async ({
      page,
    }, testInfo) => {
      const errors = observeErrors(page);
      await page.goto(blockRoute);
      await expect(page).toHaveURL(/#\/block\/application\/app-shell\/app-shell-1$/);
      await expect(page).toHaveTitle(/Bricklane/);
      const frame = page.frameLocator("iframe");
      const overview = frame.getByRole("button", { name: "Overview", exact: true });
      await expect(overview).toBeVisible();
      await page.getByRole("button", { name: "Customize", exact: true }).click();
      await choose(page, "Accent color", expected.label);
      await choose(page, "Preview mode", mode === "dark" ? "Dark" : "Light");
      const mark = frame.locator('[data-slot="sidebar-header"] svg[viewBox="0 0 32 32"]').first();
      await Promise.all([
        expect(frame.locator("html")).toHaveCSS("--primary", expected[mode]),
        expect(overview).toHaveCSS("color", expected[mode]),
        expect(overview).toHaveAttribute("data-active", "true"),
        expect(mark.locator("rect").first()).toHaveCSS("fill", expected[mode]),
        expect(mark.locator("rect").nth(1)).toHaveCSS("fill", expected.foreground),
        expect(page.locator("vite-error-overlay")).toHaveCount(0),
      ]);
      await closeCustomizerWithEscape(page);
      await page.screenshot({ path: testInfo.outputPath(`${expected.key}-${mode}.png`) });
      expect(errors).toEqual([]);
    });
  }

  test(`${expected.label}: the actual Theme CSS download matches the current generator bytes`, async ({
    page,
  }, testInfo) => {
    const errors = observeErrors(page);
    const preset = { ...defaultTheme, accent: expected.key };
    const query = new URLSearchParams({ preset: JSON.stringify(preset) });
    await page.goto(`${blockRoute}?${query}`);
    await expect(page.frameLocator("iframe").locator("html")).toHaveCSS(
      "--primary",
      expected.light,
    );
    await page.getByRole("tab", { name: "Code", exact: true }).click();
    await page.locator("details.preset-source > summary").click();
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download theme CSS", exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe("preview-theme.css");
    const saved = testInfo.outputPath(`${expected.key}-preview-theme.css`);
    await download.saveAs(saved);
    const bytes = await readFile(saved);
    expect(bytes).toEqual(Buffer.from(themeCSS(preset), "utf8"));
    const css = bytes.toString("utf8");
    expect(css).toContain(`--primary: ${expected.light};`);
    expect(css).toContain(`--primary: ${expected.dark};`);
    expect(css).toContain(`.ct-lime-cta { --primary-foreground: ${expected.foreground};`);
    expect(css).toContain(
      `:root:root.dark .template-surface .ct-limelight { --lime: ${expected.dark}; }`,
    );
    expect(errors).toEqual([]);
  });
}

for (const expected of additionalThemeColors.filter((color) =>
  ["lime", "yellow"].includes(color.key),
)) {
  for (const mode of ["light", "dark"] as const) {
    test(`${expected.label} ${mode}: AppShell 17 primary controls retain the measured foreground`, async ({
      page,
    }, testInfo) => {
      const errors = observeErrors(page);
      await page.goto("./#/block/application/app-shell/app-shell-17");
      const frame = page.frameLocator("iframe");
      await expect(frame.getByRole("button", { name: "New Chat", exact: true })).toBeVisible();
      const message = frame.getByRole("textbox", { name: "Message Bricklane AI", exact: true });
      await message.fill("Theme contrast check");
      await page.getByRole("button", { name: "Customize", exact: true }).click();
      await choose(page, "Accent color", expected.label);
      await choose(page, "Preview mode", mode === "dark" ? "Dark" : "Light");
      const newChat = frame.getByRole("button", { name: "New Chat", exact: true });
      const send = frame.getByRole("button", { name: "Send message", exact: true });
      await Promise.all([
        expect(message).toHaveValue("Theme contrast check"),
        expect(send).toBeEnabled(),
        expect(newChat).toHaveCSS("background-color", expected[mode]),
        expect(newChat).toHaveCSS("color", expected.foreground),
        expect(send).toHaveCSS("background-color", expected[mode]),
        expect(send).toHaveCSS("color", expected.foreground),
      ]);
      await closeCustomizerWithEscape(page);
      await page.screenshot({ path: testInfo.outputPath(`chat-${expected.key}-${mode}.png`) });
      expect(errors).toEqual([]);
    });

    test(`${expected.label} ${mode}: Limelight retains the same accent and dark CTA foreground`, async ({
      page,
    }, testInfo) => {
      const errors = observeErrors(page);
      await page.goto("./#/templates/limelight");
      await expect(page.locator(".ct-limelight")).toBeVisible();
      await page.getByRole("button", { name: "Customize", exact: true }).click();
      await choose(page, "Accent color", expected.label);
      await choose(page, "Preview mode", mode === "dark" ? "Dark" : "Light");
      const cta = page.locator(".ct-lime-cta").first();
      await Promise.all([
        expect(page.locator(".ct-limelight")).toHaveCSS("--lime", expected[mode]),
        expect(cta).toHaveCSS("--primary-foreground", expected.foreground),
        expect(cta).toHaveCSS("color", expected.foreground),
        expect(cta).toHaveCSS("background-color", expected[mode]),
      ]);
      await closeCustomizerWithEscape(page);
      await page.screenshot({ path: testInfo.outputPath(`limelight-${expected.key}-${mode}.png`) });
      expect(errors).toEqual([]);
    });
  }
}

test("native Green selection survives v2 storage and a reload", async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto(blockRoute);
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await choose(page, "Accent color", "Green");
  await expect(page.frameLocator("iframe").locator("html")).toHaveCSS(
    "--primary",
    "oklch(0.527 0.154 150.069)",
  );
  await closeCustomizerWithEscape(page);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("blocks-preview-theme-v2")!).accent),
  ).toBe("green");
  await page.reload();
  await expect(page.frameLocator("iframe").locator("html")).toHaveCSS(
    "--primary",
    "oklch(0.527 0.154 150.069)",
  );
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Accent color", exact: true })).toContainText(
    "Green",
  );
  expect(errors).toEqual([]);
});

test("legacy v1 Green migrates to Emerald before a new Green choice is saved", async ({ page }) => {
  const errors = observeErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem("blocks-preview-theme-v1", JSON.stringify({ accent: "green" }));
  });
  await page.goto(blockRoute);
  await expect(page.frameLocator("iframe").locator("html")).toHaveCSS("--primary", "#047857");
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Accent color", exact: true })).toContainText(
    "Emerald",
  );
  await choose(page, "Accent color", "Green");
  await closeCustomizerWithEscape(page);
  await page.reload();
  await expect(page.frameLocator("iframe").locator("html")).toHaveCSS(
    "--primary",
    "oklch(0.527 0.154 150.069)",
  );
  expect(errors).toEqual([]);
});

test("a dark Lime child selection survives desktop folding and native phone navigation", async ({
  page,
}, testInfo) => {
  const errors = observeErrors(page);
  await page.goto(blockRoute);
  const frame = page.frameLocator("iframe");
  await frame.getByRole("button", { name: "Deployments", exact: true }).click();
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await choose(page, "Accent color", "Lime");
  await choose(page, "Preview mode", "Dark");
  await closeCustomizerWithEscape(page);
  await frame.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await expect(frame.getByRole("button", { name: "Expand sidebar", exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Mobile viewport", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Mobile viewport", exact: true })).toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  const opener = frame.getByRole("button", { name: "Open navigation", exact: true });
  // The fixed bottom trigger is inside a tall scaled preview, below the parent's first viewport.
  // Put the pointer over the parent page and scroll it through an ordinary wheel gesture.
  await page.getByRole("heading", { name: "Icon Rail Dashboard", exact: true }).hover();
  await page.mouse.wheel(0, 240);
  await expect
    .poll(async () => {
      const viewport = page.viewportSize()!;
      const boxes = await Promise.all([page.locator("iframe").boundingBox(), opener.boundingBox()]);
      return boxes.every(
        (box) =>
          box !== null &&
          box.x >= 0 &&
          box.y >= 0 &&
          box.x + box.width <= viewport.width &&
          box.y + box.height <= viewport.height,
      );
    })
    .toBe(true);
  await opener.click();
  const sheet = frame.getByRole("dialog", { name: "Navigation", exact: true });
  const selected = sheet.getByRole("button", { name: "Deployments", exact: true });
  await expect(selected).toHaveAttribute("data-active", "true");
  await expect(selected).toHaveCSS("color", "oklch(0.768 0.233 130.85)");
  await page.screenshot({ path: testInfo.outputPath("lime-dark-phone-navigation.png") });
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(errors).toEqual([]);
});

test("AppShell 2 retains its neutral default menu while its brand uses Lime", async ({ page }) => {
  const errors = observeErrors(page);
  await page.goto("./#/block/application/app-shell/app-shell-2");
  const frame = page.frameLocator("iframe");
  const selected = frame.getByRole("button", { name: "Overview", exact: true });
  await expect(selected).toBeVisible();
  const neutral = await selected.evaluate((element) => getComputedStyle(element).color);
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await choose(page, "Accent color", "Lime");
  await expect(selected).toHaveCSS("color", neutral);
  await expect(
    frame.locator('.shell-floating-brand svg[viewBox="0 0 32 32"] rect').first(),
  ).toHaveCSS("fill", "oklch(0.841 0.238 128.85)");
  expect(errors).toEqual([]);
});
