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
  const running = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === "running" || animation.pending).length,
  );
  expect(running).toBe(0);
  return { running, observedPaintFrames: 2 };
}

async function openSurge(page: Page, width: number) {
  const faults: string[] = [];
  faultsByPage.set(page, faults);
  page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      faults.push(`${message.type()}: ${message.text()}`);
    }
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/surge");
  await expect(page.getByRole("heading", { name: /^Welcome to / })).toBeVisible();
  await expect(page.locator(".bt-surge[data-slot=sidebar-wrapper]")).toHaveCount(1);
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

async function navigate(
  page: Page,
  mobile: boolean,
  label: string,
  suffix: string,
  parent?: string,
) {
  const navigation = await sidebar(page, mobile);
  const link = navigation.getByRole("link", { name: label, exact: true });
  if (!(await link.isVisible()) && parent) {
    await navigation.getByRole("button", { name: parent, exact: true }).click();
  }
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/#/template-preview/surge${suffix}$`));
  if (mobile && (await navigation.isVisible())) {
    await page.keyboard.press("Escape");
    await expect(navigation).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
}

async function downloadedCsv(page: Page, control: Locator, info: TestInfo, name: string) {
  const pending = page.waitForEvent("download");
  await control.click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  const path = info.outputPath(name);
  await download.saveAs(path);
  return readFile(path, "utf8");
}

function bodyRows(region: Locator) {
  return region.locator('[data-slot="data-grid-table-body"] > tr');
}

for (const width of [1440, 390]) {
  const mobile = width === 390;

  test(`Surge dashboard ${width}: real Frame density, native Sidebar and document scroll`, async ({
    page,
  }, info) => {
    await openSurge(page, width);
    const header = page.locator(".surge-topbar");
    const main = page.locator('.bt-surge [data-slot="sidebar-inset"]');
    const content = page.locator(".bt-surge .bt-content");
    const dashboard = page.getByRole("region", { name: "Store dashboard", exact: true });
    const metrics = dashboard.locator(".surge-dashboard-metric");
    await expect(page.locator(".surge-breadcrumb-current")).toHaveText("Dashboard");
    await expect(page.locator(".surge-breadcrumb-current")).toBeVisible();
    await expect(page.locator(".surge-breadcrumb-divider")).toBeVisible();
    near((await rectangle(header)).height, 51, "sticky full-width header height");
    near((await rectangle(header)).y, 0, "initial sticky header top");
    await expect(header).toHaveCSS("position", "sticky");
    await expect(main).toHaveCSS("overflow-y", "visible");
    await expect(metrics).toHaveCount(4);
    const boxes = [];
    for (const metric of await metrics.all()) {
      await expect(metric).toHaveAttribute("data-slot", "frame");
      near((await rectangle(metric)).height, 148, "actual KPI Frame height");
      near(
        (await rectangle(metric.locator(':scope > [data-slot="frame-panel-header"]'))).height,
        44,
        "actual KPI FrameHeader height",
      );
      await expect(metric.locator(':scope > [data-slot="frame-panel"]')).toHaveCount(1);
      await expect(metric.locator('[data-slot="card"]')).toHaveCount(0);
      boxes.push(await rectangle(metric));
    }
    for (const name of ["Inventory velocity", "Top categories", "Inventory stocks"]) {
      const panel = dashboard.getByRole("region", { name, exact: true });
      await expect(panel).toHaveAttribute("data-slot", "frame");
      near(
        (await rectangle(panel.locator(':scope > [data-slot="frame-panel-header"]'))).height,
        58,
        `${name} FrameHeader height`,
      );
    }
    if (mobile) {
      for (let index = 1; index < boxes.length; index += 1) {
        near(boxes[index].x, boxes[0].x, "phone KPI column alignment");
        near(boxes[index].y - boxes[index - 1].y - boxes[index - 1].height, 24, "phone KPI gap");
      }
      near(boxes[0].x, 16, "phone content padding");
    } else {
      near((await rectangle(main)).x, 260, "expanded main position");
      const container = page.locator('.bt-sidebar[data-slot="sidebar-container"]');
      near((await rectangle(container)).width, 260, "expanded Sidebar width");
      near((await rectangle(container)).y, 50, "native fixed Sidebar top");
      await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
      await expect.poll(async () => (await rectangle(container)).width).toBe(62);
      const footer = container.locator('[data-slot="sidebar-footer"]');
      near((await rectangle(footer)).height, 48, "compact account footer height");
      await settledVisual(page);
      const compactMain = await rectangle(main);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const expectedContentLeft =
        compactMain.x + Math.max(0, (clientWidth - compactMain.x - 1280) / 2) + 24;
      near(
        (await rectangle(dashboard)).x,
        expectedContentLeft,
        "compact centered content position",
      );
      expect((await rectangle(content)).width).toBeLessThanOrEqual(1280.75);
      await page.keyboard.press("Control+b");
      await expect.poll(async () => (await rectangle(container)).width).toBe(260);
    }
    await evidence(page, info, "dashboard-first-viewport", { header, main, dashboard });
    const navigation = await sidebar(page, mobile);
    const sideHeader = navigation.locator('[data-slot="sidebar-header"]');
    const sideFooter = navigation.locator('[data-slot="sidebar-footer"]');
    near((await rectangle(sideHeader)).height, 56, "Sidebar Search header height");
    near((await rectangle(sideFooter)).height, 64, "expanded account-only footer height");
    await expect(
      sideHeader.getByRole("button", { name: "Search navigation", exact: true }),
    ).toBeVisible();
    await expect(
      navigation.locator('[data-slot="sidebar-content"] .surge-sidebar-info'),
    ).toHaveCount(1);
    await expect(sideFooter.locator(".surge-sidebar-info")).toHaveCount(0);
    if (mobile) {
      await expect(navigation.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);
      const measured = await navigation.evaluate((element) => ({
        width: element.getBoundingClientRect().width,
        viewport: innerWidth,
        removed:
          parseFloat(
            getComputedStyle(element).getPropertyValue("--removed-body-scroll-bar-size"),
          ) || 0,
      }));
      near(
        measured.width,
        (measured.viewport - measured.removed) * 0.75,
        "native compensated phone Sheet width",
      );
      for (const [parent, label, suffix] of [
        ["Settings", "General", "/settings"],
        ["Inventory", "Reorder queue", "/inventory/reorder"],
        ["Customers", "Groups", "/customers/groups"],
      ]) {
        const link = navigation.getByRole("link", { name: label, exact: true });
        if (!(await link.isVisible())) {
          await navigation.getByRole("button", { name: parent, exact: true }).click();
        }
        await link.click();
        await expect(page).toHaveURL(new RegExp(`/#/template-preview/surge${suffix}$`));
        await expect(link).toBeFocused();
        await expect(navigation).toBeVisible();
      }
      await evidence(page, info, "phone-retained-navigation", { navigation });
      await page.keyboard.press("Escape");
      await expect(navigation).toBeHidden();
      await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
      await navigate(page, true, "Dashboard", "");
    }
    const mainBox = await rectangle(main);
    await page.mouse.move(mainBox.x + 40, 600);
    await page.mouse.wheel(0, 1200);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await settledVisual(page);
    near((await rectangle(header)).y, 0, "header stays sticky while the document scrolls");
    expect(await main.evaluate((element) => element.scrollTop)).toBe(0);
    await healthy(page);
  });

  test(`Surge account ${width}: actual 24px RadioGroup, readable themes and native focus`, async ({
    page,
  }, info) => {
    await openSurge(page, width);
    const navigation = await sidebar(page, mobile);
    const surface = mobile ? page.locator('.bt-layout-mobile[data-slot="sidebar"]') : navigation;
    const account = navigation.getByRole("button", {
      name: "Open account menu for Nora Bell",
      exact: true,
    });
    await account.click();
    const menu = page.locator(".surge-account-menu");
    await expect(page.getByRole("menu")).toHaveCount(1);
    await expect(menu.getByRole("menuitemradio")).toHaveCount(0);
    const group = menu.getByRole("radiogroup", { name: "Theme", exact: true });
    await expect(group.getByRole("radio")).toHaveCount(3);
    expect(await group.evaluate((element) => Boolean(element.closest('[role="menuitem"]')))).toBe(
      true,
    );
    await settledVisual(page);
    near((await rectangle(menu)).width, 224, "account menu width");
    near((await rectangle(menu)).height, 235, "account menu height");
    for (const name of ["Light", "Dark", "System"]) {
      const radio = group.getByRole("radio", { name, exact: true });
      await expect(radio).toHaveJSProperty("tagName", "BUTTON");
      near((await rectangle(radio)).width, 24, `${name} actual radio hitbox width`);
      near((await rectangle(radio)).height, 24, `${name} actual radio hitbox height`);
    }
    const colors: Record<string, unknown> = {};
    for (const mode of ["Light", "Dark", "System"] as const) {
      await group.getByRole("radio", { name: mode, exact: true }).click();
      await expect(menu).toBeHidden();
      await expect(account).toBeFocused();
      if (mobile) await expect(navigation).toBeVisible();
      await account.click();
      await expect(group.getByRole("radio", { name: mode, exact: true })).toBeChecked();
      const scheme = mode === "Dark" ? "dark" : "light";
      if (scheme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
      else await expect(page.locator("html")).not.toHaveClass(/dark/);
      colors[mode] = {
        menu: await readableTheme(menu, scheme),
        sidebar: await readableTheme(surface, scheme),
      };
      if (mode === "Dark")
        await evidence(page, info, "dark-account-menu", { menu, surface }, { colors });
    }
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(account).toBeFocused();
    if (mobile) {
      await expect(navigation).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(navigation).toBeHidden();
      await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
    }
    await healthy(page);
  });

  test(`Surge dates ${width}: free selector stages, cancels and commits a local reporting period`, async ({
    page,
  }, info) => {
    await openSurge(page, width);
    const trigger = page.locator(".surge-reporting-trigger");
    const original = await trigger.textContent();
    await trigger.click();
    const popover = page.getByRole("dialog", { name: "Reporting date range", exact: true });
    await expect(popover).toBeVisible();
    await expect(popover.getByRole("tab", { name: "between", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(popover.getByRole("tab", { name: "Day", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    for (const name of [
      "is",
      "before",
      "after",
      "between",
      "Day",
      "Month",
      "Quarter",
      "Half-year",
      "Year",
    ]) {
      await expect(popover.getByRole("tab", { name, exact: true })).toBeVisible();
    }
    // The unmodified official DateSelector renders one month through useIsMobile.
    await expect(popover.getByRole("grid")).toHaveCount(mobile ? 1 : 2);
    await expect(popover.getByPlaceholder("Select date...", { exact: true })).toHaveValue(
      /\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}/,
    );
    await settledVisual(page);
    const box = await rectangle(popover);
    near(box.width, mobile ? width - 16 : 494, "responsive date popover width");
    await evidence(page, info, "original-between-day", { popover });
    const year = String(new Date().getFullYear());
    await popover.getByRole("tab", { name: "is", exact: true }).click();
    await popover.getByRole("tab", { name: "Year", exact: true }).click();
    await popover.getByRole("button", { name: year, exact: true }).click();
    await popover.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveText(original || "");
    await trigger.click();
    await expect(popover.getByRole("tab", { name: "Day", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await popover.getByRole("tab", { name: "is", exact: true }).click();
    await popover.getByRole("tab", { name: "Year", exact: true }).click();
    await popover.getByRole("button", { name: year, exact: true }).click();
    await popover.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveText(year);
    await navigate(page, mobile, "Orders", "/orders");
    await page.goBack();
    await expect(page).toHaveURL(/#\/template-preview\/surge$/);
    await expect(trigger).toHaveText(year);
    await trigger.click();
    await expect(popover.getByRole("tab", { name: "Year", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
    await healthy(page);
  });

  test(`Surge Reorder ${width}: parent inventory drives native filtering, selection and CSV`, async ({
    page,
  }, info) => {
    await openSurge(page, width);
    await navigate(page, mobile, "Reorder queue", "/inventory/reorder", "Inventory");
    const queue = page.getByRole("region", { name: "Reorder queue", exact: true });
    const summary = page.getByRole("region", { name: "Reorder urgency", exact: true });
    await expect(queue).toHaveAttribute("data-slot", "frame");
    await expect(bodyRows(queue)).toHaveCount(3);
    await expect(summary.getByText("$10,012.00", { exact: true })).toBeVisible();
    await expect(
      summary.getByRole("progressbar", { name: "Reorder urgency", exact: true }),
    ).toHaveAttribute("aria-valuetext", "2 low stock, 1 out of stock");
    const urgency = queue.getByRole("combobox", { name: "Urgency", exact: true });
    await urgency.click();
    await page.getByRole("option", { name: "Low stock", exact: true }).click();
    await expect(urgency).toBeFocused();
    await expect(bodyRows(queue)).toHaveCount(2);
    await urgency.click();
    await page.getByRole("option", { name: "Out of stock", exact: true }).click();
    await expect(bodyRows(queue)).toHaveCount(1);
    await expect(bodyRows(queue)).toContainText("FW-1122");
    await urgency.click();
    await page.getByRole("option", { name: "All urgency", exact: true }).click();
    const search = queue.getByRole("textbox", { name: "Search reorder queue", exact: true });
    await expect(search).toHaveAttribute("data-slot", "input-group-control");
    await search.fill("OW-4021");
    await expect(bodyRows(queue)).toHaveCount(1);
    await expect(bodyRows(queue)).toContainText("Relaxed Denim Jacket");
    await search.fill("");
    await expect(bodyRows(queue)).toHaveCount(3);
    const supplier = queue.getByRole("combobox", { name: "Supplier", exact: true });
    await supplier.click();
    await page.getByRole("option", { name: "Unassigned", exact: true }).click();
    await expect(supplier).toBeFocused();
    await expect(bodyRows(queue)).toHaveCount(3);
    const selected = queue.getByRole("checkbox", { name: "Select FW-1122", exact: true });
    await selected.check();
    await expect(selected).toBeChecked();
    const csv = await downloadedCsv(
      page,
      queue.getByRole("button", { name: "Export", exact: true }),
      info,
      "selected-reorder.csv",
    );
    expect(csv.trim().split("\n")).toHaveLength(2);
    expect(csv).toContain('"FW-1122"');
    expect(csv).not.toContain('"OW-4021"');
    await selected.uncheck();
    await queue
      .getByRole("columnheader", { name: "Deficit", exact: true })
      .getByRole("button", { name: "Deficit", exact: true })
      .click();
    await queue
      .getByRole("columnheader", { name: "Deficit", exact: true })
      .getByRole("button", { name: "Deficit", exact: true })
      .click();
    await expect(queue.getByRole("columnheader", { name: "Deficit", exact: true })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(bodyRows(queue).first()).toContainText("AC-1240");
    const rowsPerPage = queue.getByRole("combobox", { name: "Rows per page", exact: true });
    await expect(rowsPerPage).toHaveText("6");
    await evidence(page, info, "reorder-filtered-data", { queue, summary });
    await healthy(page);
  });

  test(`Surge Groups ${width}: free inline Filters and native Sheet save local groups across routes`, async ({
    page,
  }, info) => {
    await openSurge(page, width);
    await navigate(page, mobile, "Groups", "/customers/groups", "Customers");
    const groups = page.getByRole("region", { name: "Customer groups", exact: true });
    await expect(bodyRows(groups)).toHaveCount(5);
    const newsletter = bodyRows(groups).filter({ hasText: "Newsletter" });
    await expect(newsletter.getByRole("cell").nth(2)).toContainText("4");
    await expect(newsletter).toContainText("$4,697.00");
    const search = groups.getByRole("textbox", { name: "Name, description...", exact: true });
    await search.fill("VIP");
    await expect(bodyRows(groups)).toHaveCount(1);
    await expect(bodyRows(groups)).toContainText("VIP");
    await groups.getByRole("button", { name: "contains", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(groups.getByRole("button", { name: "contains", exact: true })).toBeFocused();
    await groups.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(bodyRows(groups)).toHaveCount(5);
    const rowChoice = groups.getByRole("checkbox", { name: "Select Newsletter", exact: true });
    await rowChoice.check();
    await expect(rowChoice).toBeChecked();
    await rowChoice.uncheck();
    const trigger = page.getByRole("button", { name: "New group", exact: true });
    const sheet = page.getByRole("dialog", { name: "New group", exact: true });
    await trigger.click();
    await expect(sheet).toHaveAttribute("data-slot", "sheet-content");
    const name = sheet.getByRole("textbox", { name: "Name", exact: true });
    const description = sheet.getByRole("textbox", { name: "Description", exact: true });
    await expect(name).toBeFocused();
    await settledVisual(page);
    const bounds = await rectangle(sheet);
    near(bounds.width, mobile ? width - 32 : 480, "native group Sheet width");
    near(bounds.x, mobile ? 16 : width - 496, "native group Sheet right offset");
    near(bounds.y, 16, "native group Sheet top offset");
    near(bounds.height, (mobile ? 844 : 1000) - 32, "native group Sheet height");
    await sheet.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await sheet.getByRole("button", { name: "Close", exact: true }).click();
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await sheet.getByRole("button", { name: "Create group", exact: true }).click();
    await expect(sheet.getByRole("alert")).toHaveText("Enter a group name.");
    await name.fill("VIP");
    await sheet.getByRole("button", { name: "Create group", exact: true }).click();
    await expect(sheet.getByRole("alert")).toHaveText("A group with this name already exists.");
    const localName = `Local review ${width}`;
    await name.fill(localName);
    await description.fill("Customers for the upcoming store review");
    await evidence(page, info, "new-group-local-draft", { sheet, name, description });
    await sheet.getByRole("button", { name: "Create group", exact: true }).click();
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(bodyRows(groups)).toHaveCount(6);
    await expect(bodyRows(groups).filter({ hasText: localName })).toBeVisible();
    await navigate(page, mobile, "All customers", "/customers", "Customers");
    await page.goBack();
    await expect(page).toHaveURL(/#\/template-preview\/surge\/customers\/groups$/);
    await expect(bodyRows(groups)).toHaveCount(6);
    await expect(bodyRows(groups).filter({ hasText: localName })).toBeVisible();
    await expect(bodyRows(groups).filter({ hasText: "Newsletter" })).toContainText("$4,697.00");
    await healthy(page);
  });
}

test("Surge stock: real pagination, numeric sorting, compact search, CSV and New product cancellation", async ({
  page,
}, info) => {
  await openSurge(page, 1440);
  const inventory = page.getByRole("region", { name: "Inventory stocks", exact: true });
  const rows = bodyRows(inventory);
  await expect(rows).toHaveCount(5);
  await inventory.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("Cotton Oxford Shirt");
  await inventory.getByRole("button", { name: "Go to previous page", exact: true }).click();
  await expect(rows).toHaveCount(5);
  await inventory
    .getByRole("columnheader", { name: "Price", exact: true })
    .getByRole("button", { name: "Price", exact: true })
    .click();
  await expect(inventory.getByRole("columnheader", { name: "Price", exact: true })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect(rows.first().getByRole("cell").nth(2)).toHaveText("$36");
  const searchButton = inventory.getByRole("button", { name: "Search products", exact: true });
  await searchButton.click();
  const searchPopover = page.getByRole("dialog", {
    name: "Search inventory products",
    exact: true,
  });
  const search = searchPopover.getByRole("textbox", { name: "Search products", exact: true });
  await search.fill("FW-1122");
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("Everyday Running Shoes");
  await page.keyboard.press("Escape");
  await expect(searchPopover).toBeHidden();
  await expect(searchButton).toBeFocused();
  await searchButton.click();
  await searchPopover.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(search).toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(rows).toHaveCount(5);
  await expect(inventory.locator(".surge-dashboard-stock-tools").getByRole("textbox")).toHaveCount(
    0,
  );
  const csv = await downloadedCsv(
    page,
    inventory.getByRole("button", { name: "Export", exact: true }),
    info,
    "dashboard-products.csv",
  );
  expect(csv.trim().split("\n")).toHaveLength(7);
  expect(csv).toContain('"Merino Ribbed Beanie","Accessories","39","28"');
  expect(csv).toContain('"Merino Ribbed Beanie","Accessories","36","76"');
  const main = await rectangle(page.locator('.bt-surge [data-slot="sidebar-inset"]'));
  await page.mouse.move(main.x + 40, 500);
  await page.mouse.wheel(0, -1600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const newProduct = page.getByRole("link", { name: "New product", exact: true });
  await expect(newProduct).toHaveAttribute("href", "#/template-preview/surge/products/new");
  await newProduct.click();
  await expect(page).toHaveURL(/#\/template-preview\/surge\/products\/new$/);
  await expect(page.getByRole("heading", { name: "New product", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(/#\/template-preview\/surge\/products$/);
  await expect(page.getByRole("heading", { name: "New product", exact: true })).toBeHidden();
  await navigate(page, false, "Dashboard", "");
  await expect(page.getByRole("tab", { name: /^All products/ })).toContainText("6");
  await evidence(page, info, "stock-and-product-route", { inventory });
  await healthy(page);
});
