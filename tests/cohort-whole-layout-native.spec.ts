import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

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

async function openCohort(page: Page, width: number) {
  const faults: string[] = [];
  faultsByPage.set(page, faults);
  page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      faults.push(`${message.type()}: ${message.text()}`);
    }
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/cohort");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".bt-cohort[data-slot=sidebar-wrapper]")).toHaveCount(1);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await settledVisual(page);
}

async function healthy(page: Page) {
  const document = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    fonts: document.fonts.status,
    top: scrollY,
    rootTop: document.documentElement.scrollTop,
    bodyTop: document.body.scrollTop,
  }));
  expect(document.top).toBe(0);
  expect(document.rootTop).toBe(0);
  expect(document.bodyTop).toBe(0);
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
    const sheet = page.getByRole("dialog", { name: "Cohort", exact: true });
    await expect(sheet).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await settledVisual(page);
    return sheet;
  }
  return page.locator('.bt-sidebar > [data-slot="sidebar-inner"]');
}

async function openOrganisation(page: Page, mobile: boolean) {
  const navigation = await sidebar(page, mobile);
  const organisation = navigation.getByRole("button", { name: "Organisation", exact: true });
  if (!(await organisation.isVisible())) {
    await navigation.getByRole("button", { name: "Settings", exact: true }).click();
  }
  await organisation.click();
  await expect(page).toHaveURL(/\/cohort\/settings\/organisation$/);
  if (mobile) {
    await expect(navigation).toBeVisible();
    await expect(organisation).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(navigation).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
  await expect(page.getByRole("region", { name: "Company", exact: true })).toBeVisible();
  await settledVisual(page);
}

for (const width of [1440, 390]) {
  const mobile = width === 390;

  test(`Cohort shell ${width}: native Sidebar structure and bounded main scrolling`, async ({
    page,
  }, info) => {
    await openCohort(page, width);
    const navigation = await sidebar(page, mobile);
    const sidebarHeader = navigation.locator('[data-slot="sidebar-header"]');
    const sidebarContent = navigation.locator('[data-slot="sidebar-content"]');
    const sidebarFooter = navigation.locator('[data-slot="sidebar-footer"]');
    near((await rectangle(sidebarHeader)).height, 56, "expanded Sidebar header height");
    near((await rectangle(sidebarFooter)).height, 48, "account-only Sidebar footer height");
    await expect(
      sidebarContent.getByRole("button", { name: "Search navigation", exact: true }),
    ).toBeVisible();
    await expect(
      sidebarHeader.getByRole("button", { name: "Search navigation", exact: true }),
    ).toHaveCount(0);
    const plan = sidebarContent
      .locator('[data-slot="frame"]')
      .filter({ hasText: "Headcount plan" });
    await expect(plan).toHaveCount(1);
    const planTitle = plan.locator('[data-slot="frame-panel-title"]');
    await expect(planTitle).toHaveCSS("font-size", "12px");
    await expect(planTitle).toHaveCSS("line-height", "16px");
    await expect(sidebarFooter.locator('[data-slot="frame"]')).toHaveCount(0);
    const progress = plan.getByRole("progressbar", { name: "Headcount plan", exact: true });
    await expect(progress).toHaveAttribute("aria-valuenow", "92");
    const track = progress.locator('[data-slot="progress-track"]');
    const indicator = progress.locator('[data-slot="progress-indicator"]');
    near((await rectangle(progress)).height, 6, "actual Headcount Progress height");
    near((await rectangle(track)).height, 6, "actual Headcount Progress track height");
    near(
      (await rectangle(indicator)).width,
      (await rectangle(track)).width * 0.92,
      "Headcount indicator represents 92 percent",
    );
    if (mobile) {
      near((await rectangle(navigation)).width, 288, "Cohort native phone Sheet width");
      await expect(navigation.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);
      await expect(
        navigation.getByRole("button", { name: "Toggle Sidebar", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(navigation).toBeHidden();
    } else {
      const container = page.locator('.bt-sidebar[data-slot="sidebar-container"]');
      near((await rectangle(container)).width, 256, "expanded Sidebar width");
      await page.keyboard.press("Control+b");
      await expect.poll(async () => (await rectangle(container)).width).toBe(66);
      near(
        (await rectangle(page.locator('.bt-layout-columns > [data-slot="sidebar"]'))).width,
        64,
        "collapsed Sidebar occupies 64px while its observed container extends 2px",
      );
      near(
        (await rectangle(page.locator('.bt-cohort [data-slot="sidebar-inset"]'))).x,
        64,
        "collapsed inset follows the actual Sidebar gap",
      );
      await page.keyboard.press("Control+b");
      await expect.poll(async () => (await rectangle(container)).width).toBe(256);
    }
    await openOrganisation(page, mobile);
    const expandedNavigation = await sidebar(page, mobile);
    const settingsSubmenu = expandedNavigation
      .locator('[data-slot="sidebar-menu-sub"]')
      .filter({ has: page.getByRole("button", { name: "Organisation", exact: true }) });
    near((await rectangle(settingsSubmenu)).height, 192, "six original native Sidebar sub rows");
    for (const row of await settingsSubmenu
      .locator('[data-slot="sidebar-menu-sub-button"]')
      .all()) {
      near((await rectangle(row)).height, 28, "original Sidebar sub row height");
      await expect(row).toHaveCSS("font-size", "14px");
    }
    if (mobile) {
      await page.keyboard.press("Escape");
      await expect(expandedNavigation).toBeHidden();
      await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
    }
    const main = page.locator('.bt-cohort [data-slot="sidebar-inset"]');
    const header = main.locator(".cohort-topbar");
    const mainBox = await rectangle(main);
    const headerBefore = await rectangle(header);
    near(mainBox.height, mobile ? 844 : 984, "bounded main height");
    near(mainBox.y, mobile ? 0 : 8, "native inset top edge");
    near(headerBefore.height, 56, "main header height");
    await expect(header).toHaveCSS("position", "static");
    await expect(main).toHaveCSS("overflow-y", "auto");
    const before = await main.evaluate((element) => ({
      top: element.scrollTop,
      height: element.scrollHeight,
      clientHeight: element.clientHeight,
    }));
    expect(before.height).toBeGreaterThan(before.clientHeight);
    near(before.top, 0, "Organisation begins at the main scroll origin");
    // Keep the pointer over Company fields, outside the grid's independent viewport.
    await page.mouse.move(mainBox.x + 30, mainBox.y + 230);
    await page.mouse.wheel(0, 1600);
    await expect
      .poll(() =>
        main.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop),
      )
      .toBeLessThanOrEqual(0.5);
    await settledVisual(page);
    const top = await main.evaluate((element) => element.scrollTop);
    expect(top).toBeGreaterThan(0);
    near(
      (await rectangle(header)).y,
      headerBefore.y - top,
      "header scrolls with actual main content",
    );
    near((await rectangle(main)).y, mainBox.y, "main stays within the viewport");
    const working = page.getByRole("region", { name: "Working week", exact: true });
    await expect(working.getByRole("button", { name: "Save changes", exact: true })).toBeInViewport(
      { ratio: 1 },
    );
    await evidence(page, info, "bounded-main-end", { main, header, working }, { initial: before });
    await healthy(page);
  });

  test(`Cohort settings ${width}: manual anchor Tabs and actual Frame FieldSets`, async ({
    page,
  }, info) => {
    await openCohort(page, width);
    await openOrganisation(page, mobile);
    const tabs = page.getByRole("tablist", { name: "Settings pages", exact: true });
    await expect(tabs).toHaveAttribute("data-slot", "tabs-list");
    await expect(tabs.getByRole("tab")).toHaveCount(6);
    const titleBox = await rectangle(page.getByRole("heading", { name: "Settings", exact: true }));
    const tabsBox = await rectangle(tabs);
    near(titleBox.height, 28, "Settings title height");
    near(tabsBox.y - titleBox.y - titleBox.height, 16, "Settings title-to-tabs spacing");
    near(
      (await rectangle(page.getByRole("region", { name: "Company", exact: true }))).y -
        tabsBox.y -
        tabsBox.height,
      16,
      "Settings tabs-to-Frame spacing",
    );
    const organisation = tabs.getByRole("tab", { name: "Organisation", exact: true });
    const policies = tabs.getByRole("tab", { name: "Policies", exact: true });
    await expect(organisation).toHaveJSProperty("tagName", "A");
    await expect(organisation).toHaveAttribute("href", /\/cohort\/settings\/organisation$/);
    await expect(organisation).toHaveAttribute("aria-selected", "true");
    await organisation.click();
    await organisation.press("ArrowRight");
    await expect(policies).toBeFocused();
    await expect(organisation).toHaveAttribute("aria-selected", "true");
    await expect(policies).toHaveAttribute("aria-selected", "false");
    await expect(page).toHaveURL(/\/cohort\/settings\/organisation$/);
    await policies.click();
    await expect(page).toHaveURL(/\/cohort\/settings\/policies$/);
    await expect(policies).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel", { name: "Policies", exact: true })).toBeVisible();
    await organisation.click();
    const company = page.getByRole("region", { name: "Company", exact: true });
    await expect(company).toHaveAttribute("data-slot", "frame");
    const fiscal = company.getByRole("group", { name: "Fiscal year start", exact: true });
    await expect(fiscal).toHaveJSProperty("tagName", "FIELDSET");
    await expect(fiscal.locator(":scope > legend")).toHaveText("Fiscal year start");
    const fiscalLegend = await rectangle(fiscal.locator(":scope > legend"));
    near(fiscalLegend.width, 1, "Fiscal legend stays visually hidden");
    near(fiscalLegend.height, 1, "Fiscal legend stays visually hidden");
    await expect(
      fiscal.getByRole("combobox", { name: "Fiscal year start month", exact: true }),
    ).toContainText("April");
    await expect(
      fiscal.getByRole("combobox", { name: "Fiscal year start day", exact: true }),
    ).toHaveText("6");
    const profileTab = tabs.getByRole("tab", { name: "Profile", exact: true });
    await profileTab.click();
    await expect(page).toHaveURL(/\/cohort\/settings\/profile$/);
    const panel = page.getByRole("tabpanel", { name: "Profile", exact: true });
    const profile = panel.getByRole("region", { name: "Profile", exact: true });
    const details = profile.getByRole("group", { name: "Your details", exact: true });
    await expect(details).toHaveJSProperty("tagName", "FIELDSET");
    await expect(details.locator(":scope > legend")).toHaveText("Your details");
    const legend = await rectangle(details.locator(":scope > legend"));
    near(legend.width, 1, "Profile legend stays visually hidden");
    near(legend.height, 1, "Profile legend stays visually hidden");
    await expect(profile).toHaveAttribute("data-slot", "frame");
    const profileHeader = profile.locator(':scope > [data-slot="frame-panel-header"]');
    const profilePanel = profile.locator(':scope > [data-slot="frame-panel"]');
    const profileFooter = profile.locator(':scope > [data-slot="frame-panel-footer"]');
    await expect(profilePanel).toHaveCount(1);
    near((await rectangle(profileHeader)).height, 52, "Profile actual FrameHeader height");
    near((await rectangle(profileFooter)).height, 48, "Profile actual FrameFooter height");
    const settings = page.locator(".bt-cohort-settings");
    const settingsBox = await rectangle(settings);
    const profileBox = await rectangle(profile);
    const breadcrumb = page.getByRole("navigation", { name: "breadcrumb", exact: true });
    const breadcrumbBox = await rectangle(breadcrumb);
    const separators = breadcrumb.locator('[data-slot="breadcrumb-separator"]');
    if (mobile) {
      const openerBox = await rectangle(
        page.getByRole("button", { name: "Open menu", exact: true }),
      );
      near(openerBox.x, 13, "phone native Sidebar opener preserves its original negative margin");
      near(openerBox.width, 28, "phone native Sidebar opener width");
      await expect(breadcrumb.getByRole("link", { name: "People", exact: true })).toHaveCount(0);
      await expect(separators.first()).toBeHidden();
      await expect(separators.last()).toBeHidden();
      near(breadcrumbBox.x, 49, "phone Settings breadcrumb follows the native opener");
      near(breadcrumbBox.width, 102.4453125, "phone shows Settings and Profile only");
    } else {
      near(breadcrumbBox.x, settingsBox.x, "Settings breadcrumb aligns with its max864 column");
      for (const separator of await separators.all()) {
        const separatorBox = await rectangle(separator);
        near(separatorBox.width, 8, "original breadcrumb line width");
        near(separatorBox.height, 2, "original breadcrumb line height");
      }
      await page.keyboard.press("Control+b");
      await expect
        .poll(
          async () =>
            (await rectangle(page.locator('.bt-sidebar[data-slot="sidebar-container"]'))).width,
        )
        .toBe(66);
      await settledVisual(page);
      near(
        (await rectangle(breadcrumb)).x,
        (await rectangle(settings)).x,
        "collapsed Settings breadcrumb stays aligned with its column",
      );
      near((await rectangle(breadcrumb)).x, 316, "collapsed Profile reference column position");
      await page.keyboard.press("Control+b");
      await expect
        .poll(
          async () =>
            (await rectangle(page.locator('.bt-sidebar[data-slot="sidebar-container"]'))).width,
        )
        .toBe(256);
    }
    near(profileBox.x, settingsBox.x, "Profile is left-aligned inside the settings column");
    near(profileBox.width, Math.min(672, settingsBox.width), "Profile Frame max width");
    expect(settingsBox.width).toBeLessThanOrEqual(864.75);
    if (!mobile) near(settingsBox.width, 864, "desktop settings column width");
    await expect(details.getByRole("textbox", { name: "Full Name", exact: true })).toHaveValue(
      "Bruno Duarte",
    );
    await evidence(page, info, "profile-native-frame", {
      profile,
      profileHeader,
      profilePanel,
      profileFooter,
      details,
      breadcrumb,
      settings,
    });
    await healthy(page);
  });

  test(`Cohort account ${width}: theme cycle keeps one readable native menu`, async ({
    page,
  }, info) => {
    await openCohort(page, width);
    const navigation = await sidebar(page, mobile);
    const surface = mobile ? page.locator('.bt-layout-mobile[data-slot="sidebar"]') : navigation;
    const trigger = navigation.getByRole("button", {
      name: "Open account menu for Bruno Duarte",
      exact: true,
    });
    await trigger.click();
    const menu = page.locator(".cohort-account-menu");
    await expect(menu).toHaveRole("menu");
    await expect(page.getByRole("menu")).toHaveCount(1);
    const colors: Record<string, unknown> = {};
    for (const [current, next] of [
      ["System", "Light"],
      ["Light", "Dark"],
      ["Dark", "System"],
    ] as const) {
      const theme = menu.getByRole("menuitem", { name: /^Theme / });
      await expect(theme).toHaveAccessibleName(
        `Theme ${current} active, activate to switch to ${next}`,
      );
      await theme.click();
      await expect(menu).toBeVisible();
      await expect(theme).toBeFocused();
      // A modal menu hides its background Sheet from the accessibility tree.
      // Inspect that actual DOM surface while keeping actions on native roles.
      if (mobile) await expect(surface).toBeVisible();
      const after = next === "Light" ? "Dark" : next === "Dark" ? "System" : "Light";
      await expect(
        menu.getByRole("menuitem", {
          name: `Theme ${next} active, activate to switch to ${after}`,
          exact: true,
        }),
      ).toBeVisible();
      const mode = next === "Dark" ? "dark" : "light";
      if (mode === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
      else await expect(page.locator("html")).not.toHaveClass(/dark/);
      colors[next] = {
        menu: await readableTheme(menu, mode),
        sidebar: await readableTheme(surface, mode),
      };
      if (next === "Dark")
        await evidence(page, info, "dark-account-menu", { menu, surface }, { colors });
    }
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

test("Cohort phone: Search Escape and observed account and department destinations retain Sheet", async ({
  page,
}, info) => {
  await openCohort(page, 390);
  const sheet = await sidebar(page, true);
  const search = sheet.getByRole("button", { name: "Search navigation", exact: true });
  await search.click();
  const dialog = page.getByRole("dialog", { name: "Search", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox").fill("Policies");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(search).toBeFocused();
  await expect(sheet).toBeVisible();
  const account = sheet.getByRole("button", {
    name: "Open account menu for Bruno Duarte",
    exact: true,
  });
  for (const [name, suffix] of [
    ["Profile", "profile"],
    ["Preferences", "preferences"],
  ]) {
    await account.click();
    const item = page.locator(".cohort-account-menu").getByRole("menuitem", {
      name: name === "Profile" ? /^Profile(?:\s*⇧⌘P)?$/ : name,
      exact: true,
    });
    await item.click();
    await expect(page).toHaveURL(new RegExp(`/cohort/settings/${suffix}$`));
    await expect(page.locator(".bt-cohort-settings")).toContainText("Settings");
    await expect(sheet).toBeVisible();
    await expect(account).toBeFocused();
  }
  const engineering = sheet.getByRole("link", { name: "Engineering", exact: true });
  await engineering.click();
  await expect(page).toHaveURL(/\/cohort\/people\?department=Engineering$/);
  await expect(page.locator(".bt-content")).toContainText("People");
  await expect(sheet).toBeVisible();
  await expect(engineering).toBeFocused();
  await evidence(page, info, "phone-retained-sheet", { sheet });
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  await healthy(page);
});
