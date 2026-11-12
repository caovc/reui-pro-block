import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });

const faultsByPage = new WeakMap<Page, string[]>();

function near(actual: number, expected: number, description: string) {
  expect(Math.abs(actual - expected), description).toBeLessThanOrEqual(0.75);
}

async function rectangle(target: Locator) {
  const measured = await target.boundingBox();
  expect(measured).not.toBeNull();
  return measured!;
}

async function settledVisual(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === "running" || animation.pending).length,
      ),
    )
    .toBe(0);
  // Observe native paint frames without editing or disabling application styles.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === "running" || animation.pending).length,
    ),
  ).toBe(0);
}

async function openAtlas(page: Page, entry: string, width: number, suffix = "") {
  const faults: string[] = [];
  faultsByPage.set(page, faults);
  page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      faults.push(`${message.type()}: ${message.text()}`);
    }
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`${entry}#/template-preview/atlas${suffix}`);
  await expect(page.locator(".bt-atlas")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect(page.locator('.bt-atlas[data-slot="sidebar-wrapper"]')).toHaveCount(1);
  await settledVisual(page);
}

async function healthy(page: Page) {
  const document = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    fonts: document.fonts.status,
  }));
  expect(document.width).toBeLessThanOrEqual(document.clientWidth);
  expect(document.fonts).toBe("loaded");
  expect(faultsByPage.get(page)).toEqual([]);
}

async function evidence(
  page: Page,
  info: TestInfo,
  name: string,
  targets: Record<string, Locator>,
  extra: Record<string, unknown> = {},
) {
  await settledVisual(page);
  const observed: Record<string, unknown> = {
    ...extra,
    page: await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        width: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        height: document.documentElement.scrollHeight,
        scrollY,
      },
      fonts: document.fonts.status,
    })),
    faults: faultsByPage.get(page) ?? [],
  };
  for (const [key, target] of Object.entries(targets)) {
    observed[key] = await target.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      return {
        tag: element.tagName,
        slot: element.getAttribute("data-slot"),
        rect: { x: box.x, y: box.y, width: box.width, height: box.height },
        padding: css.padding,
        gap: css.gap,
        background: css.backgroundColor,
        foreground: css.color,
        boxShadow: css.boxShadow,
        font: css.font,
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      };
    });
  }
  await writeFile(info.outputPath(`${name}.json`), JSON.stringify(observed, null, 2));
  await page.screenshot({ path: info.outputPath(`${name}.png`), animations: "allow" });
}

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus && !page.isClosed()) {
    await evidence(page, info, "first-failure", {});
  }
});

function luminance(color: string) {
  const numbers = color.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  if (color.startsWith("rgb")) {
    const channels = numbers.slice(0, 3).map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  if (color.startsWith("oklch") || color.startsWith("oklab")) {
    const [rawLightness, second, third] = numbers;
    const lightness = color.split(/[\s(]+/)[1].endsWith("%") ? rawLightness / 100 : rawLightness;
    const polar = color.startsWith("oklch");
    const angle = (third * Math.PI) / 180;
    const a = polar ? second * Math.cos(angle) : second;
    const b = polar ? second * Math.sin(angle) : third;
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  }
  throw new Error(`Unsupported computed theme color: ${color}`);
}

async function readableTheme(surface: Locator, mode: "light" | "dark") {
  const readColors = () =>
    surface.evaluate((element) => {
      const css = getComputedStyle(element);
      return { foreground: css.color, background: css.backgroundColor };
    });
  await expect
    .poll(async () => {
      const colors = await readColors();
      const foreground = luminance(colors.foreground);
      const background = luminance(colors.background);
      return mode === "dark"
        ? { background: background < 0.1, foreground: foreground > 0.8 }
        : { background: background > 0.8, foreground: foreground < 0.1 };
    })
    .toEqual({ background: true, foreground: true });
  const colors = await readColors();
  expect(colors.foreground).not.toBe("rgba(0, 0, 0, 0)");
  expect(colors.background).not.toBe("rgba(0, 0, 0, 0)");
  const foreground = luminance(colors.foreground);
  const background = luminance(colors.background);
  const contrast =
    (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  return { ...colors, foregroundLuminance: foreground, backgroundLuminance: background, contrast };
}

async function sidebar(page: Page, mobile: boolean) {
  if (mobile) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toHaveCount(1);
    await expect(sheet).toBeVisible();
    await settledVisual(page);
    return sheet;
  }
  return page.locator('.bt-sidebar > [data-slot="sidebar-inner"]');
}

for (const foundation of [
  { name: "Radix", entry: "/" },
  { name: "Base UI", entry: "/base/" },
]) {
  test.describe(foundation.name, () => {
    test("Atlas desktop: one Sidebar provider, 64px header and document scrolling", async ({
      page,
    }, info) => {
      await openAtlas(page, foundation.entry, 1440);
      const header = page.locator(".bt-topbar.atlas-topbar");
      const main = page.locator('.bt-atlas [data-slot="sidebar-inset"]');
      const container = page.locator('.bt-sidebar[data-slot="sidebar-container"]');
      const inner = container.locator(':scope > [data-slot="sidebar-inner"]');
      near((await rectangle(header)).height, 64, "Atlas desktop header height");
      near((await rectangle(main)).x, 256, "expanded inset position");
      near((await rectangle(container)).width, 256, "expanded Sidebar width");
      await expect(
        header.getByRole("navigation", { name: "breadcrumb", exact: true }),
      ).toBeVisible();
      await expect(header.getByRole("button", { name: "Export", exact: true })).toBeVisible();
      near(
        (await rectangle(inner.locator(':scope > [data-slot="sidebar-header"]'))).height,
        52,
        "Sidebar header height",
      );
      near(
        (await rectangle(inner.locator(':scope > [data-slot="sidebar-footer"]'))).height,
        58,
        "Sidebar account footer height",
      );
      await container.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
      await expect.poll(async () => (await rectangle(main)).x).toBe(48);
      await expect.poll(async () => (await rectangle(container)).width).toBe(48);
      await page.keyboard.press("Control+b");
      await expect.poll(async () => (await rectangle(main)).x).toBe(256);
      const mainBox = await rectangle(main);
      await page.mouse.move(mainBox.x + mainBox.width / 2, 500);
      await page.mouse.wheel(0, 1200);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
      await settledVisual(page);
      const top = await page.evaluate(() => scrollY);
      near((await rectangle(header)).y, -top, "header moves with the document");
      near((await rectangle(container)).y, 0, "Sidebar remains at the viewport top");
      await evidence(page, info, "desktop-document-scroll", { header, main, container });
      await healthy(page);
    });

    for (const width of [1440, 390]) {
      test(`Atlas home ${width}: header contains its controls and preserves keyboard export`, async ({
        page,
      }, info) => {
        await openAtlas(page, foundation.entry, width);
        const header = page.locator(".bt-topbar.atlas-topbar");
        const breadcrumb = header.getByRole("navigation", { name: "breadcrumb", exact: true });
        const date = header.getByRole("button", {
          name: "May 12, 2026 - Jun 10, 2026",
          exact: true,
        });
        const exportButton = header.getByRole("button", { name: "Export", exact: true });
        const headerBox = await rectangle(header);
        if (width === 1440) near(headerBox.height, 64, "Atlas desktop header height");
        const breadcrumbBox = await rectangle(breadcrumb);
        for (const control of [date, exportButton]) {
          await expect(control).toBeInViewport({ ratio: 1 });
          const box = await rectangle(control);
          expect(box.y, "control begins inside the header").toBeGreaterThanOrEqual(headerBox.y);
          expect(box.y + box.height, "control ends inside the header").toBeLessThanOrEqual(
            headerBox.y + headerBox.height,
          );
          expect(box.x, "control begins inside the viewport").toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, "control ends inside the viewport").toBeLessThanOrEqual(width);
          const overlapsBreadcrumb =
            box.x < breadcrumbBox.x + breadcrumbBox.width &&
            box.x + box.width > breadcrumbBox.x &&
            box.y < breadcrumbBox.y + breadcrumbBox.height &&
            box.y + box.height > breadcrumbBox.y;
          expect(overlapsBreadcrumb, "header controls do not overlap the breadcrumb").toBe(false);
        }
        expect((await rectangle(page.locator(".bt-content"))).y).toBeGreaterThanOrEqual(
          headerBox.y + headerBox.height,
        );

        await date.click();
        await expect(
          page.getByText("Showing the current demo reporting period", { exact: true }),
        ).toBeVisible();
        await date.focus();
        await page.keyboard.press("Tab");
        await expect(exportButton).toBeFocused();
        await page.keyboard.press("Shift+Tab");
        await expect(date).toBeFocused();
        await page.keyboard.press("Tab");
        const downloadPromise = page.waitForEvent("download");
        await page.keyboard.press("Enter");
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe("report.csv");
        const downloadPath = await download.path();
        expect(downloadPath).not.toBeNull();
        expect(await readFile(downloadPath!, "utf8")).toContain('"Metric","Value"');
        await expect(exportButton).toBeFocused();
        await evidence(page, info, "home-header-contained", {
          header,
          breadcrumb,
          date,
          exportButton,
        });
        await healthy(page);
      });
    }

    for (const style of ["vega", "maia", "lyra", "mira", "luma", "sera", "rhea"]) {
      test(`Atlas phone style preset ${style}: header contains its controls`, async ({
        page,
      }, info) => {
        const preset = encodeURIComponent(
          JSON.stringify({
            primitive: foundation.entry === "/base/" ? "base" : "radix",
            style,
            font: "inter",
            mode: "light",
          }),
        );
        await openAtlas(page, foundation.entry, 390, `?preset=${preset}`);
        await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
        await expect
          .poll(() => page.locator("#preview-preset").textContent())
          .toContain(`Bricklane: ${style} component style`);
        const header = page.locator(".bt-topbar.atlas-topbar");
        const breadcrumb = header.getByRole("navigation", { name: "breadcrumb", exact: true });
        const date = header.getByRole("button", {
          name: "May 12, 2026 - Jun 10, 2026",
          exact: true,
        });
        const exportButton = header.getByRole("button", { name: "Export", exact: true });
        const appearance = await exportButton.evaluate((element) => {
          const presetStyle = document.querySelector<HTMLStyleElement>("#preview-preset");
          const matchingRadiusRules = [...(presetStyle?.sheet?.cssRules ?? [])].filter(
            (rule) =>
              rule instanceof CSSStyleRule &&
              rule.style.getPropertyValue("border-radius") &&
              element.matches(rule.selectorText),
          ).length;
          const css = getComputedStyle(element);
          return {
            matchingRadiusRules,
            radius: css.borderRadius,
            font: css.font,
            padding: css.padding,
          };
        });
        expect(
          appearance.matchingRadiusRules,
          "real preset CSS matches the control",
        ).toBeGreaterThan(0);
        const headerBox = await rectangle(header);
        const breadcrumbBox = await rectangle(breadcrumb);
        for (const control of [date, exportButton]) {
          await expect(control).toBeInViewport({ ratio: 1 });
          const box = await rectangle(control);
          expect(box.y, "control begins inside the header").toBeGreaterThanOrEqual(headerBox.y);
          expect(box.y + box.height, "control ends inside the header").toBeLessThanOrEqual(
            headerBox.y + headerBox.height,
          );
          expect(box.x, "control begins inside the viewport").toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, "control ends inside the viewport").toBeLessThanOrEqual(390);
          const overlapsBreadcrumb =
            box.x < breadcrumbBox.x + breadcrumbBox.width &&
            box.x + box.width > breadcrumbBox.x &&
            box.y < breadcrumbBox.y + breadcrumbBox.height &&
            box.y + box.height > breadcrumbBox.y;
          expect(overlapsBreadcrumb, "header controls do not overlap the breadcrumb").toBe(false);
        }
        expect((await rectangle(page.locator(".bt-content"))).y).toBeGreaterThanOrEqual(
          headerBox.y + headerBox.height,
        );
        await evidence(
          page,
          info,
          `phone-header-${style}`,
          { header, breadcrumb, date, exportButton },
          { style, appearance },
        );
        await healthy(page);
      });
    }

    for (const width of [1440, 390]) {
      const mobile = width === 390;

      test(`Atlas Profile ${width}: actual Card composition, row separators and document footer`, async ({
        page,
      }, info) => {
        await openAtlas(page, foundation.entry, width, "/account/profile");
        const profile = page.getByRole("region", { name: "Profile details", exact: true });
        await expect(profile).toHaveAttribute("data-slot", "card");
        await expect(profile).not.toHaveCSS("box-shadow", "none");
        await expect(profile.locator('[data-slot="frame"]')).toHaveCount(0);
        await expect(page.getByRole("heading", { name: "Account", exact: true })).toHaveCount(1);
        const header = profile.locator(':scope > [data-slot="card-header"]');
        const content = profile.locator(':scope > [data-slot="card-content"]');
        const footer = profile.locator(':scope > [data-slot="card-footer"]');
        await expect(header.locator('[data-slot="card-title"]')).toHaveText("Profile");
        await expect(content.locator('[data-slot="separator"]')).toHaveCount(6);
        await expect(
          content.getByRole("textbox", { name: "Full name", exact: true }),
        ).toBeVisible();
        await expect(profile.locator("fieldset")).toHaveCount(0);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        const card = await rectangle(profile);
        near(card.x, mobile ? 24 : 280, "Profile content left edge");
        near(card.y, mobile ? 214 : 194, "Profile title and navigation offset");
        near(card.width, clientWidth - (mobile ? 48 : 304), "Card follows actual available width");
        near(card.height, mobile ? 1316 : 911.5, "Profile Card height");
        near((await rectangle(header)).height, mobile ? 99 : 79, "Profile CardHeader height");
        near((await rectangle(footer)).height, 65, "Profile CardFooter height");
        const mainHeader = page.locator(".bt-topbar.atlas-topbar");
        near((await rectangle(mainHeader)).height, 64, "Account page header height");
        await expect(mainHeader.locator(".bt-actions")).toHaveCount(0);
        await evidence(page, info, "profile-header-no-actions", { mainHeader, profile });
        await page.mouse.move(card.x + card.width / 2, 550);
        await page.mouse.wheel(0, 1600);
        await expect
          .poll(() =>
            page.evaluate(
              () =>
                document.documentElement.scrollHeight -
                innerHeight -
                document.documentElement.scrollTop,
            ),
          )
          .toBeLessThanOrEqual(0.5);
        await expect(
          profile.getByRole("button", { name: "Save changes", exact: true }),
        ).toBeInViewport({ ratio: 1 });
        await evidence(page, info, "profile-at-document-end", { profile, header, content, footer });
        await healthy(page);
      });

      test(`Atlas account ${width}: inline radios apply readable themes and native layered Escape`, async ({
        page,
      }, info) => {
        await openAtlas(page, foundation.entry, width, "/account/profile");
        const navigation = await sidebar(page, mobile);
        const surface = mobile
          ? page.locator('.bt-layout-mobile[data-slot="sidebar"]')
          : navigation;
        const trigger = navigation.getByRole("button", {
          name: "Open account menu for Amara Ortiz",
          exact: true,
        });
        await trigger.click();
        const menu = page.locator(".atlas-account-menu");
        await expect(menu).toHaveRole("menu");
        const radios = menu.getByRole("radiogroup", { name: "Theme", exact: true });
        await expect(radios.getByRole("radio")).toHaveCount(3);
        for (const name of ["Light", "Dark", "System"]) {
          const radio = radios.getByRole("radio", { name, exact: true });
          await expect(radio).toBeVisible();
          const box = await rectangle(radio);
          expect(box.width, `${name} is a usable native radio hitbox`).toBeGreaterThanOrEqual(24);
          expect(box.height, `${name} is a usable native radio hitbox`).toBeGreaterThanOrEqual(24);
        }
        const colors: Record<string, unknown> = {};
        for (const mode of ["Light", "Dark"] as const) {
          await radios.getByRole("radio", { name: mode, exact: true }).click();
          await expect(menu).toBeHidden();
          await expect(trigger).toBeFocused();
          if (mobile) await expect(navigation).toBeVisible();
          if (mode === "Dark") await expect(page.locator("html")).toHaveClass(/dark/);
          else await expect(page.locator("html")).not.toHaveClass(/dark/);
          await trigger.click();
          await expect(radios.getByRole("radio", { name: mode, exact: true })).toBeChecked();
          const scheme = mode === "Dark" ? "dark" : "light";
          colors[mode] = {
            menu: await readableTheme(menu, scheme),
            sidebar: await readableTheme(surface, scheme),
          };
          if (mode === "Dark") {
            await evidence(page, info, "dark-account-menu", { menu, surface }, { colors });
          }
        }
        await radios.getByRole("radio", { name: "System", exact: true }).click();
        await expect(menu).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(page.locator("html")).not.toHaveClass(/dark/);
        await trigger.click();
        await expect(radios.getByRole("radio", { name: "System", exact: true })).toBeChecked();
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        await expect(trigger).toBeFocused();
        if (mobile) {
          await expect(navigation).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(navigation).toBeHidden();
          await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
        }
        await healthy(page);
      });
    }

    test("Atlas phone: workspace and account menus preserve the native Sheet until Escape", async ({
      page,
    }, info) => {
      await openAtlas(page, foundation.entry, 390);
      const sheet = await sidebar(page, true);
      await expect(sheet.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);
      await expect(
        sheet.getByRole("button", { name: "Collapse sidebar", exact: true }),
      ).toBeVisible();
      const workspace = sheet.getByRole("button", { name: "Switch workspace", exact: true });
      await workspace.click();
      const workspaceMenu = page.getByRole("menu", { name: "Switch workspace", exact: true });
      await expect(workspaceMenu).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(workspaceMenu).toBeHidden();
      await expect(workspace).toBeFocused();
      await expect(sheet).toBeVisible();
      const account = sheet.getByRole("button", {
        name: "Open account menu for Amara Ortiz",
        exact: true,
      });
      await account.click();
      await page.getByRole("menuitem", { name: "Account settings", exact: true }).click();
      await expect(page).toHaveURL(/\/atlas\/account\/security$/);
      await expect(page.locator(".atlas-account-settings")).toContainText("Sign-in");
      await expect(sheet).toBeVisible();
      await expect(account).toBeFocused();
      const settings = sheet.getByRole("link", { name: "Settings", exact: true });
      await settings.click();
      await expect(page).toHaveURL(/\/atlas\/account\/profile$/);
      await expect(page.locator(".atlas-account-settings")).toContainText("Profile");
      await expect(sheet).toBeVisible();
      await expect(settings).toBeFocused();
      await evidence(page, info, "phone-sheet-after-settings", { sheet });
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
      await healthy(page);
    });

    test("Atlas Security and Preferences use real Cards around native Collapsible content", async ({
      page,
    }, info) => {
      await openAtlas(page, foundation.entry, 1440, "/account/security");
      const account = page.locator(".atlas-account-settings");
      const signIn = account.getByRole("button", { name: "Sign-in", exact: true });
      const activity = account.getByRole("button", { name: "Activity", exact: true });
      const cards = account.locator('[data-slot="card"]');
      await expect(cards).toHaveCount(2);
      await expect(account.locator('[data-slot="frame"]')).toHaveCount(0);
      await expect(signIn).toHaveAttribute("aria-expanded", "true");
      await expect(activity).toHaveAttribute("aria-expanded", "true");
      const security = account.getByRole("region", { name: "Sign-in settings", exact: true });
      near((await rectangle(security)).height, 316.5, "Sign-in Card height");
      near(
        (await rectangle(security.locator('[data-slot="card-header"]'))).height,
        47,
        "native group header and trigger boundary",
      );
      await expect(security.locator('[data-slot="separator"]')).toHaveCount(3);
      await signIn.click();
      await expect(signIn).toHaveAttribute("aria-expanded", "false");
      await expect(
        account.getByRole("switch", { name: "Two-factor authentication Recommended", exact: true }),
      ).toBeHidden();
      await expect(activity).toHaveAttribute("aria-expanded", "true");
      await signIn.press("Enter");
      await expect(signIn).toHaveAttribute("aria-expanded", "true");
      await expect(
        account.getByRole("switch", { name: "Two-factor authentication Recommended", exact: true }),
      ).toBeChecked();
      await account
        .getByRole("navigation", { name: "Account sections", exact: true })
        .getByRole("link", { name: "Preferences", exact: true })
        .click();
      await expect(page).toHaveURL(/\/atlas\/account\/preferences$/);
      await expect(cards).toHaveCount(2);
      const general = account.getByRole("button", { name: "General", exact: true });
      const display = account.getByRole("button", { name: "Display", exact: true });
      await expect(general).toHaveAttribute("aria-expanded", "true");
      await expect(display).toHaveAttribute("aria-expanded", "true");
      await general.click();
      await expect(general).toHaveAttribute("aria-expanded", "false");
      await expect(display).toHaveAttribute("aria-expanded", "true");
      await expect(
        account.getByRole("combobox", { name: "Color theme", exact: true }),
      ).toBeVisible();
      await general.press("Enter");
      await expect(general).toHaveAttribute("aria-expanded", "true");
      await expect(
        account.getByRole("combobox", { name: "Default view", exact: true }),
      ).toBeVisible();
      await evidence(page, info, "native-collapsible-cards", { account });
      await healthy(page);
    });
  });
}
