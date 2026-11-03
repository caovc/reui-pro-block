import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

// Natural entry and readonly animation polling follow the existing workflow
// layout/account specs. This file imports no .spec file and changes no budget.
test.describe.configure({ retries: 0 });

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

async function openTempo(page: Page, width: number) {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) faults.push(message.text());
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/tempo");
  await expect(page.locator(".tempo-header")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.status)).toBe("loaded");
  if (width === 390) {
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeVisible();
  }
  return faults;
}

async function rect(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

function near(actual: number, expected: number, label: string, tolerance = 0.5) {
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(tolerance);
}

async function evidence(
  page: Page,
  info: TestInfo,
  name: string,
  targets: Record<string, Locator>,
) {
  const measured: Record<string, unknown> = {
    page: await page.evaluate(() => ({
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        width: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      },
      fonts: document.fonts.status,
      url: location.href,
    })),
  };
  for (const [key, target] of Object.entries(targets)) {
    measured[key] = await target.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      return {
        rect: { x: box.x, y: box.y, width: box.width, height: box.height },
        tag: element.tagName,
        slot: element.getAttribute("data-slot"),
        opacity: css.opacity,
        transform: css.transform,
        display: css.display,
        padding: css.padding,
        gap: css.gap,
        font: css.fontFamily,
        fontSize: css.fontSize,
        lineHeight: css.lineHeight,
        radius: css.borderRadius,
        background: css.backgroundColor,
        value: element.getAttribute("aria-valuenow"),
      };
    });
  }
  await info.attach(`${name}-geometry`, {
    body: JSON.stringify(measured, null, 2),
    contentType: "application/json",
  });
  const screenshot = info.outputPath(`${name}.png`);
  await page.screenshot({ path: screenshot, animations: "allow" });
  await info.attach(name, { path: screenshot, contentType: "image/png" });
}

async function headerGeometry(page: Page) {
  const header = page.locator(".tempo-header");
  const toolbar = header.getByRole("toolbar", { name: "Header actions", exact: true });
  near((await rect(header)).height, 50, "page header height");
  await expect(header).toHaveCSS("padding-left", "18px");
  await expect(header).toHaveCSS("padding-right", "18px");
  await expect(header).toHaveCSS("gap", "8px");
  near((await rect(toolbar)).width, 149, "toolbar width");
  await expect(toolbar).toHaveCSS("gap", "12px");
  const avatars = toolbar.locator('[data-slot="avatar"]');
  await expect(avatars).toHaveCount(3);
  for (const avatar of await avatars.all()) {
    const box = await rect(avatar);
    near(box.width, 24, "avatar width");
    near(box.height, 24, "avatar height");
  }
  near((await rect(toolbar.locator('[data-slot="separator"]'))).width, 1, "toolbar separator");
  for (const name of ["More options", "Open context panel"]) {
    const box = await rect(toolbar.getByRole("button", { name, exact: true }));
    near(box.width, 28, `${name} width`);
    near(box.height, 28, `${name} height`);
  }
}

for (const width of [1440, 390]) {
  test(`Tempo Chrome ${width}: native header, Sidebar slots and real Usage geometry`, async ({
    page,
  }, info) => {
    const faults = await openTempo(page, width);
    const mobile = width === 390;
    const menuTrigger = page.getByRole("button", { name: "Open navigation", exact: true });
    await headerGeometry(page);

    if (mobile) await menuTrigger.click();
    const sidebar = mobile
      ? page.locator('[data-slot="sidebar"][data-mobile="true"]')
      : page.locator('.wf-root.wf-reui > [data-slot="sidebar"]');
    await stable(sidebar);
    if (mobile) await expect.poll(async () => (await sidebar.boundingBox())?.x).toBe(0);
    const heading = sidebar.locator('[data-slot="sidebar-header"]');
    const footer = sidebar.locator('[data-slot="sidebar-footer"]');
    const usage = sidebar.locator('.tempo-usage[data-slot="frame"]');
    const progress = usage.getByRole("progressbar", { name: "Usage Limit", exact: true });
    const track = progress.locator('[data-slot="progress-track"]');
    const indicator = track.locator('[data-slot="progress-indicator"]');
    await expect(usage).toBeVisible();
    await stable(indicator);
    await evidence(page, info, `tempo-${width}`, {
      sidebar,
      heading,
      footer,
      usage,
      usageHeader: usage.locator('[data-slot="frame-panel-header"]'),
      usagePanel: usage.locator('[data-slot="frame-panel"]'),
      progress,
      track,
      indicator,
    });

    near((await rect(sidebar)).width, mobile ? 292.5 : 250, "Sidebar width");
    near((await rect(heading)).height, 56, "Sidebar header height");
    near((await rect(footer)).height, 48, "Sidebar footer height");
    await expect(usage).toHaveCount(1);
    await expect(progress).toHaveCount(1);
    await expect(track).toHaveCount(1);
    await expect(indicator).toHaveCount(1);
    await expect(progress).toHaveAttribute("aria-valuenow", "82");
    await expect(usage).toContainText("Your usage resets at the end of the month");
    await expect(usage.locator(".tempo-usage-totals")).toHaveText("82% Used 18% Free");
    const usageBox = await rect(usage);
    const footerBox = await rect(footer);
    near(footerBox.y - usageBox.y - usageBox.height, 8, "Usage gap above footer");
    near(
      (await rect(usage.locator('[data-slot="frame-panel-header"]'))).height,
      28,
      "Usage header",
    );
    await expect(usage.locator('[data-slot="frame-panel-header"]')).toHaveCSS(
      "padding",
      "6px 12px",
    );
    await expect(usage.locator('[data-slot="frame-panel"]')).toHaveCSS("padding", "14px 12px");
    for (const [name, item] of Object.entries({ progress, track, indicator })) {
      near((await rect(item)).height, 6, `${name} height`);
    }
    near((await rect(indicator)).width / (await rect(track)).width, 0.82, "indicator ratio", 0.001);
    await expect(track).toHaveCSS("border-radius", "0px");
    await expect(indicator).toHaveCSS("background-color", "oklch(0.696 0.17 162.48)");
    await expect(usage.locator(".tempo-usage-meter")).toHaveCSS("border-radius", "6px");
    const description = usage.locator(".tempo-usage-description");
    await expect(description).toHaveCSS("font-size", "12px");
    await expect(description).toHaveCSS("line-height", "16.5px");

    if (mobile) {
      const inner = sidebar.locator(":scope > div.h-full.w-full");
      const innerBox = await rect(inner);
      const font = await usage.evaluate((element) => getComputedStyle(element).fontFamily);
      near(usageBox.x + usageBox.width / 2, innerBox.x + innerBox.width / 2, "Usage centered");
      expect(usageBox.width).toBeLessThanOrEqual(innerBox.width);
      if (/^Inter(?:,|$)/.test(font) && Math.abs(innerBox.width - 291.5) <= 0.5) {
        const intrinsic = await description.evaluate((element) => {
          const panel = element.parentElement!;
          const frame = panel.parentElement!;
          const header = frame.querySelector('[data-slot="frame-panel-header"]')!;
          const title = header.querySelector('[data-slot="frame-panel-title"]')!;
          const totals = panel.querySelector(".tempo-usage-totals")!;
          const measureText = (target: Element) => {
            const range = document.createRange();
            range.selectNodeContents(target);
            const bounds = range.getBoundingClientRect();
            return {
              width: bounds.width,
              height: bounds.height,
              lines: range.getClientRects().length,
            };
          };
          const chrome = (target: Element) => {
            const css = getComputedStyle(target);
            return {
              padding: parseFloat(css.paddingLeft) + parseFloat(css.paddingRight),
              border: parseFloat(css.borderLeftWidth) + parseFloat(css.borderRightWidth),
              margin: parseFloat(css.marginLeft) + parseFloat(css.marginRight),
            };
          };
          const totalTexts = Array.from(totals.children, measureText);
          const css = getComputedStyle(element);
          return {
            description: measureText(element),
            title: measureText(title),
            totalTexts,
            totalsGap: parseFloat(getComputedStyle(totals).columnGap),
            frame: chrome(frame),
            panel: chrome(panel),
            header: chrome(header),
            font: css.font,
            weight: css.fontWeight,
            letterSpacing: css.letterSpacing,
            features: css.fontFeatureSettings,
            variations: css.fontVariationSettings,
          };
        });
        await info.attach("tempo-phone-natural-content", {
          body: JSON.stringify(intrinsic, null, 2),
          contentType: "application/json",
        });
        expect(intrinsic.description.lines).toBe(1);
        expect(intrinsic.description.height).toBeGreaterThan(0);
        const totalsWidth =
          intrinsic.totalTexts.reduce((sum, text) => sum + text.width, 0) + intrinsic.totalsGap;
        expect(intrinsic.description.width).toBeGreaterThan(totalsWidth);
        const panelWidth =
          intrinsic.description.width +
          intrinsic.panel.padding +
          intrinsic.panel.border +
          intrinsic.panel.margin;
        const headerWidth =
          intrinsic.title.width +
          intrinsic.header.padding +
          intrinsic.header.border +
          intrinsic.header.margin;
        expect(panelWidth).toBeGreaterThan(headerWidth);
        // Dense Frame panels extend into the Frame border through their native
        // negative margins. Measure that chrome once; no fixed glyph width or
        // measured card width is used to manufacture the expected result.
        const naturalWidth = panelWidth + intrinsic.frame.padding + intrinsic.frame.border;
        expect(naturalWidth).toBeLessThanOrEqual(innerBox.width);
        near(usageBox.width, naturalWidth, "natural single-line intrinsic width", 0.75);
        near(usageBox.height, 117.5, "default Inter phone height", 0.75);
        near(
          usageBox.x,
          innerBox.x + (innerBox.width - naturalWidth) / 2,
          "intrinsic phone x",
          0.75,
        );
        near((await rect(description)).height, 16.5, "phone single-line description");
      }
      await page.keyboard.press("Escape");
      await expect(sidebar).toHaveCount(0);
      await expect(menuTrigger).toBeFocused();
      const contextTrigger = page.getByRole("button", { name: "Open context panel", exact: true });
      await contextTrigger.click();
      await expect(contextTrigger).toHaveAttribute("aria-expanded", "false");
      await expect(
        page.getByRole("complementary", { name: "Context panel", exact: true }),
      ).toHaveCount(0);
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } else {
      near(usageBox.width, 230, "desktop Usage width");
      near(usageBox.height, 134, "desktop Usage height");
      near(usageBox.x, 9.5, "desktop Usage x");
      near((await rect(description)).height, 33, "desktop two-line description");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(faults).toEqual([]);
  });
}

test("Tempo Chrome 1440: collapsed Sidebar retains hidden Usage and places notification trigger", async ({
  page,
}, info) => {
  const faults = await openTempo(page, 1440);
  const sidebar = page.locator('.wf-root.wf-reui > [data-slot="sidebar"]');
  const usage = sidebar.locator(".tempo-usage");
  await expect(usage).toBeVisible();
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(48);
  await stable(sidebar);
  const heading = sidebar.locator('[data-slot="sidebar-header"]');
  const notification = heading.getByRole("button", { name: /^Notifications/ });
  await evidence(page, info, "tempo-collapsed", { sidebar, heading, notification, usage });
  near((await rect(heading)).height, 92, "collapsed header");
  const notificationBox = await rect(notification);
  near(notificationBox.x, 9.5, "collapsed notification x");
  near(notificationBox.y, 56, "collapsed notification y");
  near(notificationBox.width, 28, "collapsed notification width");
  near(notificationBox.height, 28, "collapsed notification height");
  await expect(usage).toHaveCount(1);
  await expect(usage).not.toBeVisible();
  expect(
    await usage.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }),
  ).toEqual({ width: 0, height: 0 });
  await page.keyboard.press("Control+b");
  await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(250);
  await expect(usage).toBeVisible();
  expect(faults).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`Tempo Chrome ${width}: More opens the real five-section account panel and returns focus`, async ({
    page,
  }, info) => {
    const faults = await openTempo(page, width);
    const originalURL = page.url();
    const trigger = page.getByRole("button", { name: "More options", exact: true });
    await trigger.click();
    const menu = page.getByRole("menu");
    await stable(menu);
    // The modal menu correctly hides its background trigger from the AX tree.
    // Read that already observed DOM control only for evidence; all actions and
    // return-focus assertions continue through its visible semantic locator.
    await evidence(page, info, `tempo-more-${width}`, {
      menu,
      trigger: page.locator('.tempo-header button[aria-label="More options"]'),
    });
    await expect(menu.getByRole("menuitem")).toHaveText([
      "Copy link",
      "Share schedule",
      "Export",
      "Settings",
    ]);
    const menuBox = await rect(menu);
    near(menuBox.width, 192, "More menu width");
    near(menuBox.height, 129, "More menu height");
    await menu.getByRole("menuitem", { name: "Settings", exact: true }).click();
    const panel = page.locator('[data-workflow-account="tempo"]');
    await stable(panel);
    await expect(panel.getByRole("tab")).toHaveText([
      "Profile",
      "Workspace",
      "Team",
      "Billing",
      "Preferences",
    ]);
    await expect(panel.getByRole("tab", { name: "Profile", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(page.url()).toBe(originalURL);
    await evidence(page, info, `tempo-more-account-${width}`, { panel });
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(faults).toEqual([]);
  });
}

test("Tempo Chrome 1440: Context is a 280px complementary pane and Escape keeps it open", async ({
  page,
}, info) => {
  const faults = await openTempo(page, 1440);
  const main = page.locator(".wf-root.wf-reui > .wf-main");
  const before = await rect(main);
  await page.getByRole("button", { name: "Open context panel", exact: true }).click();
  const context = page.getByRole("complementary", { name: "Context panel", exact: true });
  await expect(context).toBeVisible();
  await expect.poll(async () => (await context.boundingBox())?.width).toBe(280);
  await stable(context);
  await evidence(page, info, "tempo-context", { main, context });
  const contextBox = await rect(context);
  const current = await rect(main);
  near(contextBox.x, 1160, "Context right-side x");
  near(contextBox.height, 1000, "Context viewport height");
  near(before.width - current.width, 280, "main shrinks for Context");
  near(current.x, before.x, "main start stays aligned");
  await page.keyboard.press("Escape");
  await expect(context).toBeVisible();
  near((await rect(context)).width, 280, "Escape preserves Context width");
  await page.getByRole("button", { name: "Close context panel", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Context panel", exact: true })).toHaveCount(
    0,
  );
  await expect.poll(async () => (await main.boundingBox())?.width).toBe(before.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(faults).toEqual([]);
});
