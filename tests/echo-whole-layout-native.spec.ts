import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });

const faultsByPage = new WeakMap<Page, string[]>();

async function stable(root: Locator) {
  await expect
    .poll(() =>
      root.evaluate((element) => {
        const css = getComputedStyle(element);
        return {
          opacity: css.opacity,
          identity: css.transform === "none" || css.transform === "matrix(1, 0, 0, 1, 0, 0)",
          running: element
            .getAnimations()
            .filter((animation) => animation.playState === "running" || animation.pending).length,
        };
      }),
    )
    .toEqual({ opacity: "1", identity: true, running: 0 });
}

async function rectangle(target: Locator) {
  const measured = await target.boundingBox();
  expect(measured).not.toBeNull();
  return measured!;
}

function near(actual: number, expected: number, description: string) {
  expect(Math.abs(actual - expected), description).toBeLessThanOrEqual(0.5);
}

async function scrollMetrics(target: Locator) {
  return target.evaluate((element) => ({
    top: element.scrollTop,
    height: element.scrollHeight,
    clientHeight: element.clientHeight,
    width: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
}

async function openEcho(page: Page, width: number) {
  const faults: string[] = [];
  faultsByPage.set(page, faults);
  page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      faults.push(`${message.type()}: ${message.text()}`);
    }
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/echo");
  await expect(
    page.getByRole("heading", { name: "How can I help you?", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.status;
    }),
  ).toBe("loaded");
  await expect(page.locator('.echo-root [data-slot="sidebar-wrapper"]')).toHaveCount(1);
  return faults;
}

async function openSidebar(page: Page, mobile: boolean) {
  if (mobile) {
    await page.getByRole("button", { name: "Open chats", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Chats", exact: true });
    await expect(sheet).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await stable(sheet);
    return sheet;
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
  return page.locator('[data-slot="sidebar-inner"]:visible');
}

async function openSettings(page: Page, mobile: boolean) {
  const sidebar = await openSidebar(page, mobile);
  await sidebar.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Account Settings", exact: true })).toBeVisible();
  if (mobile) {
    await expect(page.getByRole("dialog", { name: "Chats", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Open chats", exact: true })).toBeFocused();
  }
}

async function healthy(page: Page) {
  const document = await page.evaluate(() => ({
    top: window.scrollY,
    rootTop: document.documentElement.scrollTop,
    bodyTop: document.body.scrollTop,
    width: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    fonts: document.fonts.status,
  }));
  expect(document.top).toBe(0);
  expect(document.rootTop).toBe(0);
  expect(document.bodyTop).toBe(0);
  expect(document.width).toBeLessThanOrEqual(document.clientWidth);
  expect(document.fonts).toBe("loaded");
  expect(faultsByPage.get(page)).toEqual([]);
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
  // Observe actual paint frames after native scrolling and CSS transitions.
  // This neither changes styles nor suppresses the application's animations.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  const running = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === "running" || animation.pending).length,
  );
  expect(running).toBe(0);
  return { running, observedPaintFrames: 2 };
}

async function evidence(
  page: Page,
  info: TestInfo,
  name: string,
  targets: Record<string, Locator>,
  extra: Record<string, unknown> = {},
) {
  const visualSettled = await settledVisual(page);
  const observed: Record<string, unknown> = {
    ...extra,
    visualSettled,
    page: await page.evaluate(() => ({
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        width: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
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
        color: css.color,
        background: css.backgroundColor,
        font: css.font,
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
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

// Compare actual computed foreground/background, without editing page styles or
// using a synthetic theme fixture. The browser may serialize RGB, OKLCH or OKLab values.
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
  // A changed serialization (OKLCH -> OKLab) is not a changed theme. Wait for
  // real luminance endpoints while the existing CSS color transition runs.
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

test("Echo desktop: actual Resizable drag, bounded keyboard resize and remembered collapse width", async ({
  page,
}, info) => {
  await openEcho(page, 1440);
  const main = page.locator('.echo-main[data-slot="sidebar-inset"]');
  const handle = page.locator('.echo-resizable-handle[role="separator"]');
  await expect(handle).toHaveCount(1);
  const initial = await rectangle(main);
  const separator = await rectangle(handle);
  near(initial.x, 249, "initial local main position");
  near(separator.width, 1, "actual Resizable separator width");
  await page.mouse.move(separator.x + separator.width / 2, separator.y + separator.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    separator.x + separator.width / 2 + 64,
    separator.y + separator.height / 2,
    {
      steps: 8,
    },
  );
  await page.mouse.up();
  await expect.poll(async () => Math.abs((await rectangle(main)).x - 313)).toBeLessThanOrEqual(0.5);
  const dragged = await rectangle(main);
  await handle.press("ArrowLeft");
  await expect.poll(async () => (await rectangle(main)).x).toBeLessThan(dragged.x);
  const left = await rectangle(main);
  expect(left.x).toBeGreaterThanOrEqual(210.5);
  await handle.press("ArrowRight");
  await expect.poll(async () => (await rectangle(main)).x).toBeGreaterThan(left.x);
  const keyboardPositions: number[] = [];
  for (let index = 0; index < 12; index += 1) {
    await handle.press("ArrowRight");
    const position = (await rectangle(main)).x;
    keyboardPositions.push(position);
    expect(position, "native keyboard resize stays within the 361px maximum").toBeLessThanOrEqual(
      361.5,
    );
  }
  const recent = await rectangle(main);
  await handle.press("ArrowRight");
  expect((await rectangle(main)).x).toBeLessThanOrEqual(361.5);
  const remembered = await rectangle(main);
  await handle.click();
  await expect.poll(async () => Math.abs((await rectangle(main)).x - 49)).toBeLessThanOrEqual(0.5);
  const collapsed = await rectangle(main);
  await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
  await expect
    .poll(async () => Math.abs((await rectangle(main)).x - remembered.x))
    .toBeLessThanOrEqual(0.5);
  const account = page.getByRole("button", { name: "Account menu", exact: true });
  await account.click();
  await page.getByRole("menuitem", { name: "Relay", exact: true }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(account).toContainText("Relay");
  await page.setViewportSize({ width: 390, height: 844 });
  const sheet = await openSidebar(page, true);
  await expect(sheet.getByRole("button", { name: "Account menu", exact: true })).toContainText(
    "Relay",
  );
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Open chats", exact: true })).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(account).toContainText("Relay");
  await expect
    .poll(async () => Math.abs((await rectangle(main)).x - remembered.x))
    .toBeLessThanOrEqual(0.5);
  await expect(page.locator('.echo-root [data-slot="sidebar-wrapper"]')).toHaveCount(1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('[data-slot="sidebar"][data-mobile="true"]')).toHaveCount(0);
  await evidence(
    page,
    info,
    "resizable",
    { main, handle },
    {
      initial,
      dragged,
      left,
      recent,
      remembered,
      keyboardPositions,
      collapsed,
    },
  );
  await healthy(page);
});

for (const width of [1440, 390]) {
  const mobile = width === 390;

  test(`Echo settings ${width}: real Card and nested FieldSets, named Profile and bounded scroll`, async ({
    page,
  }, info) => {
    await openEcho(page, width);
    await openSettings(page, mobile);
    const general = page.getByRole("tabpanel", { name: "General", exact: true });
    await expect(general).toBeVisible();
    await expect(general.locator('[data-slot="frame"]')).toHaveCount(0);
    const generalCard = general.locator('[data-slot="card"]');
    const generalGroup = general.getByRole("group", { name: "General", exact: true });
    await expect(generalGroup).toHaveJSProperty("tagName", "FIELDSET");
    await expect(generalGroup.locator(":scope > legend")).toHaveText("General");
    const generalBox = await rectangle(generalCard);
    near(generalBox.width, mobile ? 343 : 704, "General Card width");
    near(generalBox.height, mobile ? 404.8984375 : 278.5, "General Card height");
    if (mobile) near(generalBox.y, 229.5, "phone title, navigation and Card offset");
    near(
      (await rectangle(generalCard.locator(':scope > [data-slot="card-header"]'))).height,
      71,
      "General CardHeader height",
    );
    const appearance = general.getByRole("radiogroup", { name: "Theme", exact: true });
    await expect(appearance.getByRole("radio")).toHaveCount(3);
    near((await rectangle(appearance)).height, 28, "real General theme RadioGroup height");
    await evidence(page, info, "general", { generalCard, generalGroup, appearance });
    const profileTab = page.getByRole("tab", { name: "My Profile", exact: true });
    await profileTab.click();
    await expect(profileTab).toHaveAttribute("aria-selected", "true");
    const profile = page.getByRole("tabpanel", { name: "My Profile", exact: true });
    await expect(profile).toBeVisible();
    const profileCard = profile.locator('[data-slot="card"]');
    const outer = profile.getByRole("group", { name: "Profile fields", exact: true });
    const details = outer.getByRole("group", { name: "Profile details", exact: true });
    await expect(outer).toHaveJSProperty("tagName", "FIELDSET");
    await expect(details).toHaveJSProperty("tagName", "FIELDSET");
    await expect(details.getByRole("combobox", { name: "Role", exact: true })).toBeVisible();
    near(
      (await rectangle(profileCard.locator(':scope > [data-slot="card-header"]'))).height,
      71,
      "Profile CardHeader height",
    );
    const footer = profileCard.locator(':scope > [data-slot="card-footer"]');
    near((await rectangle(footer)).height, 57, "Profile CardFooter height");
    if (!mobile) near((await rectangle(profileCard)).height, 768.25, "desktop Profile Card height");
    const scroller = page.locator(".echo-settings-scroller");
    const scrollerBox = await rectangle(scroller);
    if (mobile) expect((await scrollMetrics(scroller)).height).toBeGreaterThan(scrollerBox.height);
    await page.mouse.move(
      scrollerBox.x + scrollerBox.width / 2,
      scrollerBox.y + scrollerBox.height / 2,
    );
    await page.mouse.wheel(0, 1600);
    await expect
      .poll(async () => {
        const current = await scrollMetrics(scroller);
        return current.height - current.clientHeight - current.top;
      })
      .toBeLessThanOrEqual(0.5);
    await expect(profile.getByRole("button", { name: "Save changes", exact: true })).toBeInViewport(
      { ratio: 1 },
    );
    const scroll = await scrollMetrics(scroller);
    expect(scroll.width).toBeLessThanOrEqual(scroll.clientWidth);
    await evidence(page, info, "profile-scrolled", {
      profileCard,
      outer,
      details,
      footer,
      scroller,
    });
    await healthy(page);
  });

  test(`Echo account ${width}: one native menu, actual theme radios and layered Escape focus`, async ({
    page,
  }, info) => {
    await openEcho(page, width);
    const sidebar = await openSidebar(page, mobile);
    // A modal menu hides its background Sheet from the accessibility tree.
    // Read actual DOM colors without changing native interaction locators.
    const sidebarSurface = mobile
      ? page.locator('[data-slot="sidebar"][data-mobile="true"]')
      : sidebar;
    const trigger = sidebar.getByRole("button", { name: "Account menu", exact: true });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toHaveCount(1);
    await stable(menu);
    const choices = menu.getByRole("radiogroup", { name: "Theme", exact: true });
    await expect(choices.getByRole("radio")).toHaveCount(3);
    for (const label of ["Light", "Dark", "System"]) {
      const choice = choices.getByRole("radio", { name: label, exact: true });
      const box = await rectangle(choice);
      near(box.width, 28, `${label} actual radio hitbox width`);
      near(box.height, 28, `${label} actual radio hitbox height`);
    }
    await choices.getByRole("radio", { name: "Light", exact: true }).check();
    await expect(choices.getByRole("radio", { name: "Light", exact: true })).toBeChecked();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    const light = await readableTheme(menu, "light");
    const lightSidebar = await readableTheme(sidebarSurface, "light");
    await choices.getByRole("radio", { name: "Dark", exact: true }).check();
    await expect(choices.getByRole("radio", { name: "Dark", exact: true })).toBeChecked();
    await expect(page.locator("html")).toHaveClass(/dark/);
    const dark = await readableTheme(menu, "dark");
    const darkSidebar = await readableTheme(sidebarSurface, "dark");
    expect(dark.backgroundLuminance).toBeLessThan(light.backgroundLuminance);
    await settledVisual(page);
    const controlTargets = {
      artifacts: sidebarSurface.locator('.echo-sidebar-tabs [role="tab"][aria-selected="false"]'),
      searchIcon: sidebarSurface.locator('.echo-sidebar-brand [aria-label="Search chats"] svg'),
      modelValue: page.locator(
        '.echo-main [aria-label="Select AI model"] [data-slot="select-value"]',
      ),
    };
    const visibleControls: Record<string, { color: string; luminance: number }> = {};
    for (const [name, target] of Object.entries(controlTargets)) {
      await expect(target).toHaveCount(1);
      const color = await target.evaluate((element) => getComputedStyle(element).color);
      visibleControls[name] = { color, luminance: luminance(color) };
    }
    await writeFile(
      info.outputPath("dark-visible-controls.json"),
      JSON.stringify(
        {
          visibleControls,
          sidebarRoleCountWhileMenuOpen: await sidebar.count(),
          sidebarDOMSurfaceCount: await sidebarSurface.count(),
        },
        null,
        2,
      ),
    );
    for (const [name, observed] of Object.entries(visibleControls)) {
      expect(
        observed.luminance,
        `${name} remains readable on the actual dark surface`,
      ).toBeGreaterThanOrEqual(0.2);
    }
    await expect(menu).toHaveCount(1);
    await evidence(
      page,
      info,
      "account-menu",
      { menu, choices, sidebar: sidebarSurface, ...controlTargets },
      { light, dark, lightSidebar, darkSidebar, visibleControls },
    );
    await choices.getByRole("radio", { name: "System", exact: true }).check();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    if (mobile) {
      await expect(page.getByRole("dialog", { name: "Chats", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Chats", exact: true })).toBeHidden();
      await expect(page.getByRole("button", { name: "Open chats", exact: true })).toBeFocused();
      await openSidebar(page, true);
    }
    await page.getByRole("button", { name: "Account menu", exact: true }).click();
    await page.getByRole("menuitem", { name: /^Profile/ }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("tabpanel", { name: "My Profile", exact: true })).toBeVisible();
    if (mobile) {
      await expect(page.getByRole("dialog", { name: "Chats", exact: true })).toBeHidden();
      await expect(page.getByRole("button", { name: "Open chats", exact: true })).toBeFocused();
    }
    await expect(page.locator('.echo-root [data-slot="sidebar-wrapper"]')).toHaveCount(1);
    await healthy(page);
  });

  test(`Echo conversation ${width}: real Frame composer and MessageScroller return to end`, async ({
    page,
  }, info) => {
    await openEcho(page, width);
    const composer = page.locator(".echo-composer");
    const frame = composer.locator('.echo-frame-composer > [data-slot="frame"]');
    const usage = frame.locator(':scope > [data-slot="frame-panel-header"]');
    const panel = frame.locator(':scope > [data-slot="frame-panel"]');
    await expect(frame).toHaveCount(1);
    await expect(
      composer.getByRole("group", { name: "Attached context", exact: true }),
    ).toHaveCount(0);
    near((await rectangle(frame)).height, 149, "initial actual Frame height without context");
    near((await rectangle(usage)).height, 36, "usage FrameHeader height");
    near((await rectangle(panel)).height, 112, "composer FramePanel height");
    await evidence(page, info, "composer-initial", { composer, frame, usage, panel });
    await composer.getByRole("button", { name: "Dismiss usage notice", exact: true }).click();
    await expect(usage).toHaveCount(0);
    const prompt = Array.from({ length: 30 }, (_, index) =>
      [
        `Echo layout note ${index + 1}:`,
        "This is a long local demo paragraph for checking native message scrolling.",
        "It contains no external request and stays inside this preview conversation.",
      ].join(" "),
    ).join("\n\n");
    const message = composer.getByRole("textbox", { name: "Message Bricklane Chat", exact: true });
    await message.fill(prompt);
    await composer.getByRole("button", { name: "Send message", exact: true }).click();
    await expect(message).toHaveValue("");
    const viewport = page.locator('[data-slot="message-scroller-viewport"]');
    await expect(viewport).toBeVisible();
    await expect(viewport.locator('[data-slot="message-scroller-item"]')).toHaveCount(2);
    await expect(viewport.locator('[data-slot="message"]')).toHaveCount(2);
    await expect(viewport.locator('[data-slot="bubble"]')).toHaveCount(2);
    await expect(viewport).toContainText("Echo layout note 30:");
    await expect
      .poll(async () => {
        const current = await scrollMetrics(viewport);
        return current.height - current.clientHeight;
      })
      .toBeGreaterThan(100);
    await expect.poll(async () => (await scrollMetrics(viewport)).top).toBeGreaterThan(0);
    const before = await scrollMetrics(viewport);
    const composerBefore = await rectangle(composer);
    const bounds = await rectangle(viewport);
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.wheel(0, -600);
    await expect.poll(async () => (await scrollMetrics(viewport)).top).toBeLessThan(before.top);
    const up = await scrollMetrics(viewport);
    const jump = page.getByRole("button", { name: "Scroll to end", exact: true });
    await expect(jump).toBeVisible();
    await jump.click();
    await expect
      .poll(async () => {
        const current = await scrollMetrics(viewport);
        return current.height - current.clientHeight - current.top;
      })
      .toBeLessThanOrEqual(0.5);
    const composerAfter = await rectangle(composer);
    near(composerAfter.x, composerBefore.x, "composer x stays fixed while messages scroll");
    near(composerAfter.y, composerBefore.y, "composer y stays fixed while messages scroll");
    near(
      composerAfter.width,
      composerBefore.width,
      "composer width stays fixed while messages scroll",
    );
    near(
      composerAfter.height,
      composerBefore.height,
      "composer height stays fixed while messages scroll",
    );
    await evidence(
      page,
      info,
      "message-scrolled",
      { composer, frame, panel, viewport },
      {
        before,
        up,
        composerBefore,
        composerAfter,
      },
    );
    await healthy(page);
  });
}
