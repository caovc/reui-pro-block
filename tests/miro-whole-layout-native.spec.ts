import { writeFile } from "node:fs/promises";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

// Parent executes W1/R0/max-failures=1; retain default30s and expect5s.
test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });
const mount = "#/template-preview/miro";
const rawQuery = "?qa=miro-native&raw=a%20b&raw=a+b&flag";
const faults = new WeakMap<Page, string[]>();

function near(actual: number, expected: number, label: string) {
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(0.75);
}
async function box(target: Locator) {
  const result = await target.boundingBox();
  expect(result).not.toBeNull();
  return result!;
}
async function settled(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const active = () =>
    page.evaluate(
      () =>
        document.getAnimations().filter((item) => item.playState === "running" || item.pending)
          .length,
    );
  await expect.poll(active).toBe(0);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(await active()).toBe(0);
  expect(await page.evaluate(() => document.fonts.status)).toBe("loaded");
}
async function evidence(page: Page, info: TestInfo, name: string) {
  const observed = await page.evaluate(() => ({
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    document: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
      scrollY,
    },
    fonts: document.fonts.status,
    active: {
      tag: document.activeElement?.tagName,
      label: document.activeElement?.getAttribute("aria-label"),
      text: document.activeElement?.textContent?.trim().slice(0, 100),
    },
    elements: [
      ...document.querySelectorAll<HTMLElement>(
        '.miro-settings-card, .miro-settings-card > [data-slot], .miro-chair-calendar, .bt-miro [data-slot="scroll-area-viewport"], .miro-account-menu, .miro-account-menu [role="radio"], .miro-chair-preview, .bt-layout-mobile',
      ),
    ].map((node) => {
      const rect = node.getBoundingClientRect();
      const css = getComputedStyle(node);
      return {
        tag: node.tagName,
        slot: node.getAttribute("data-slot"),
        role: node.getAttribute("role"),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        padding: css.padding,
        gap: css.gap,
        font: css.font,
        overflow: css.overflow,
        scrollTop: node.scrollTop,
        scrollLeft: node.scrollLeft,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
    }),
  }));
  const path = info.outputPath(`${name}.json`);
  await writeFile(path, JSON.stringify({ ...observed, faults: faults.get(page) ?? [] }, null, 2));
  await info.attach(name, { path, contentType: "application/json" });
  await page.screenshot({ path: info.outputPath(`${name}.png`), animations: "allow" });
}

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  faults.set(page, messages);
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      messages.push(`${message.type()}: ${message.text()}`);
  });
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !["GET", "HEAD"].includes(request.method()))
      messages.push(`Unexpected HTTP write: ${request.method()} ${request.url()}`);
  });
});
test.afterEach(async ({ page }, info) => {
  const messages = faults.get(page) ?? [];
  if (!page.isClosed() && (info.status !== info.expectedStatus || messages.length > 0))
    await evidence(page, info, "first-failure");
  await info.attach("runtime-faults", {
    body: JSON.stringify(messages, null, 2),
    contentType: "application/json",
  });
  expect(messages).toEqual([]);
});
async function open(page: Page, width: number, path: string, query = "") {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/${mount}${path}${query}`);
  await expect(page.locator(".bt-layout.bt-miro")).toBeVisible();
  await settled(page);
}
async function exactRoute(page: Page, path: string, query = "") {
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`${mount}${path}${query}`);
}
async function boundedDocument(page: Page) {
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    y: scrollY,
  }));
  expect(metrics.width).toBeLessThanOrEqual(metrics.client);
  expect(metrics.height).toBeLessThanOrEqual(metrics.clientHeight);
  expect(metrics.y).toBe(0);
}
const opener = (page: Page) => page.getByRole("button", { name: "Toggle Sidebar", exact: true });
async function navigation(page: Page, width: number) {
  if (width === 390) {
    const drawer = page.getByRole("dialog", { name: "Sidebar", exact: true });
    const newlyOpened = !(await drawer.isVisible());
    if (newlyOpened) await opener(page).click();
    await expect(drawer).toBeVisible();
    if (newlyOpened) {
      // Local Radix Sheet initially focuses Dashboard; original Base UI focused Home.
      // Verify Home through real keyboard navigation, not as local autofocus parity.
      await expect(drawer.getByRole("button", { name: "Dashboard", exact: true })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        drawer.getByRole("link", { name: "Bricklane Clinic, back to the dashboard", exact: true }),
      ).toBeFocused();
    }
    await expect(drawer.getByText("Displays the mobile sidebar.", { exact: true })).toHaveCount(1);
    await expect(drawer.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);
    return drawer;
  }
  return page.locator(".bt-layout.bt-miro");
}
async function closeNavigation(page: Page, width: number) {
  if (width === 390) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Sidebar", exact: true })).toBeHidden();
    await expect(opener(page)).toBeFocused();
  }
}
async function settingsTab(page: Page, width: number, name: string) {
  const nav = await navigation(page, width);
  const tab = nav.getByRole("tab", { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  if (width === 390) {
    await expect(nav).toBeVisible();
    await expect(tab).toBeFocused();
  }
  await closeNavigation(page, width);
}
async function navigate(page: Page, width: number, name: string, path: string, query = "") {
  const nav = await navigation(page, width);
  const target = nav.getByRole("button", { name, exact: true });
  await target.click();
  await exactRoute(page, path, query);
  if (width === 390) {
    await expect(nav).toBeVisible();
    await expect(target).toBeFocused();
  }
  await closeNavigation(page, width);
}
async function wheelDown(page: Page, target: Locator, delta = 500) {
  const before = await target.evaluate((node) => node.scrollTop);
  await target.hover();
  await page.mouse.wheel(0, delta);
  await expect.poll(() => target.evaluate((node) => node.scrollTop)).toBeGreaterThan(before);
}

for (const width of [1440, 390]) {
  test(`Miro actual settings anatomy and native sidebar layers ${width}`, async ({
    page,
  }, info) => {
    await open(page, width, "/settings");
    const profile = page.getByRole("tabpanel", { name: "My Profile", exact: true });
    const card = profile.locator('.miro-settings-card[data-slot="card"]');
    await expect(card).toHaveCount(1);
    await expect(card.locator(':scope > [data-slot="card-content"]')).toHaveCount(1);
    await expect(card.locator('[data-slot="field"]')).toHaveCount(9);
    await expect(card.locator('[data-slot="field-separator"]')).toHaveCount(5);
    await expect(card.getByRole("group", { name: "Profile fields", exact: true })).toHaveCount(1);
    await expect(card.getByRole("group", { name: "Profile details", exact: true })).toHaveCount(1);
    await settled(page);
    const rect = await box(card);
    near(rect.x, width === 1440 ? 368 : 18, "Original settings Card x");
    near(rect.y, 68, "Original settings Card y");
    near(
      (await box(card.locator(':scope > [data-slot="card-header"]'))).height,
      71,
      "Original Profile CardHeader height",
    );
    near(
      (await box(card.locator(':scope > [data-slot="card-footer"]'))).height,
      57,
      "Original Profile CardFooter height",
    );
    // Original totals739/1042 are evidence, not a fixed height for different local content.
    await evidence(page, info, "profile-card-natural-layout");
    await boundedDocument(page);
    if (width === 390) {
      await wheelDown(page, page.locator(".bt-main"));
      await expect(
        profile.getByRole("button", { name: "Save changes", exact: true }),
      ).toBeInViewport();
      await boundedDocument(page);
    }
    await settingsTab(page, width, "Hours");
    const hours = page.getByRole("tabpanel", { name: "Hours", exact: true });
    await expect(hours.locator('[data-slot="card"]')).toHaveCount(1);
    await expect(hours.locator('[data-slot="field"]')).toHaveCount(2);
    await expect(hours.locator('[data-slot="field-separator"]')).toHaveCount(1);
    await expect(hours.getByRole("combobox", { name: "Opens", exact: true })).toBeVisible();
    await expect(hours.getByRole("combobox", { name: "Closes", exact: true })).toBeVisible();
    await settingsTab(page, width, "Chairs");
    const chairs = page.getByRole("tabpanel", { name: "Chairs", exact: true });
    await expect(chairs.locator('[data-slot="card"]')).toHaveCount(1);
    await expect(chairs.locator('[data-slot="field"]')).toHaveCount(9);
    await expect(chairs.getByRole("switch")).toHaveCount(9);
    await expect(chairs.getByRole("combobox")).toHaveCount(9);
    const nav = await navigation(page, width);
    const tab = nav.getByRole("tab", { name: "My Profile", exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    if (width === 390) {
      await expect(nav).toBeVisible();
      await expect(tab).toBeFocused();
      near((await box(nav)).width, 292.5, "Original phone sidebar width");
    }
    const calendar = nav.getByRole("button", { name: "Calendar", exact: true });
    await calendar.click();
    await exactRoute(page, "/calendar");
    if (width === 390) {
      await expect(nav).toBeVisible();
      await expect(calendar).toBeFocused();
    }
    await closeNavigation(page, width);
    await expect(page.locator('[data-slot="event-calendar-resource-view"]')).toBeVisible();
    await boundedDocument(page);
  });

  test(`Miro shared free calendar date, resource and native scroll behavior ${width}`, async ({
    page,
  }, info) => {
    await open(page, width, "/calendar");
    const calendar = page.locator('.miro-chair-calendar[data-slot="event-calendar"]');
    await expect(calendar.locator('[data-slot="event-calendar-resource-view"]')).toBeVisible();
    await expect(calendar.locator('[data-slot="event-calendar-resource-header"]')).toHaveCount(5);
    // Original shell50 + horizontal tabs45: no duplicate mobile body heading.
    await expect(page.locator(".bt-content > .bt-heading")).toBeHidden();
    const boardTabs = page.locator('.miro-board-tabs > [data-slot="tabs-list"]');
    await expect(boardTabs).toHaveCSS("flex-direction", "row");
    const strip = await box(boardTabs);
    near(strip.y, 50, "Original board tabs y");
    near(strip.height, 45, "Composed tab row including its consumer border");
    near((await box(calendar)).y, 95, "Original calendar body y");

    const controls = calendar.locator('.miro-chair-nav > [data-slot="event-calendar-toolbar"]');
    await expect(controls).toHaveCount(2);
    if (width === 390) {
      near((await box(controls.nth(0))).y, 95, "Original phone navigation row y");
      near((await box(controls.nth(0))).height, 48, "Original phone navigation row height");
      near((await box(controls.nth(1))).y, 143, "Original phone controls row y");
      near((await box(controls.nth(1))).height, 40, "Original phone controls row height");
      await expect(
        calendar.getByRole("button", { name: "Choose chairs", exact: true }),
      ).toBeInViewport();
      await expect(calendar.getByRole("button", { name: "Filters", exact: true })).toBeInViewport();
    }
    near(
      (await box(calendar.locator('[data-slot="event-calendar-resource-view"]'))).y,
      width === 390 ? 183 : 143,
      "Original resource view follows its responsive toolbar rows",
    );
    const firstTab = await box(boardTabs.getByRole("tab", { name: "Calendar", exact: true }));
    const secondTab = await box(boardTabs.getByRole("tab", { name: "Log History", exact: true }));
    near(firstTab.y, secondTab.y, "Calendar tabs share one row");
    expect(secondTab.x).toBeGreaterThanOrEqual(firstTab.x + firstTab.width);
    expect(secondTab.y + secondTab.height).toBeLessThanOrEqual(strip.y + strip.height);
    await expect(calendar.locator('[data-slot="event-calendar-event"]')).toHaveCount(5);
    await calendar.getByRole("radio", { name: "Week", exact: true }).click();
    await expect(calendar.getByRole("radio", { name: "Week", exact: true })).toBeChecked();
    await expect(calendar.locator('[data-slot="event-calendar-time-grid"]')).toBeVisible();
    await expect(calendar.locator('[data-slot="event-calendar-resource-view"]')).toHaveCount(0);
    await calendar.getByRole("radio", { name: "Day", exact: true }).click();
    await expect(calendar.getByRole("radio", { name: "Day", exact: true })).toBeChecked();
    const nav = await navigation(page, width);
    // Geometry must observe the native Sheet after its real entry animation.
    await settled(page);
    const mini = nav.locator('.miro-mini-calendar[data-slot="calendar"]');
    await expect(mini).toHaveCount(1);

    const paneBounds = await box(nav.locator(".miro-calendar-sidebar"));

    const secondary = nav.locator(".miro-calendar-sidebar");
    await info.attach("secondary-width-before-options", {
      body: JSON.stringify(
        await secondary
          .locator(
            '.miro-secondary-scroll, [data-slot="scroll-area-viewport"], [data-slot="scroll-area-viewport"] > div, .miro-sidebar-section, .miro-sidebar-section-heading, .miro-chair-choice, .miro-chair-choice button',
          )
          .evaluateAll((nodes) =>
            nodes.map((node) => {
              const rect = node.getBoundingClientRect();
              const style = getComputedStyle(node);
              return {
                tag: node.tagName,
                className: node.className,
                label: node.getAttribute("aria-label"),
                slot: node.getAttribute("data-slot"),
                x: rect.x,
                width: rect.width,
                display: style.display,
                minWidth: style.minWidth,
                overflowX: style.overflowX,
                scrollWidth: node.scrollWidth,
                clientWidth: node.clientWidth,
              };
            }),
          ),
        null,
        2,
      ),
      contentType: "application/json",
    });
    for (const item of await secondary
      .locator(".miro-sidebar-section-heading, .miro-chair-choice, .miro-chair-choice button")
      .all()) {
      const bounds = await box(item);
      expect(bounds.x).toBeGreaterThanOrEqual(paneBounds.x - 0.75);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(paneBounds.x + paneBounds.width + 0.75);
    }
    const chairOptions = secondary.getByRole("button", {
      name: "Options for Dr. Leila Hart",
      exact: true,
    });
    await chairOptions.click();
    await expect(page.locator('.miro-chair-options[role="menu"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".miro-chair-options")).toHaveCount(0);
    await expect(chairOptions).toBeFocused();
    if (width === 390) await expect(nav).toBeVisible();
    const weekdays = mini.locator(".rdp-weekday");
    await expect(weekdays).toHaveCount(7);
    const firstWeek = mini.locator(".rdp-week").first().locator(".rdp-day");
    expect(await firstWeek.count()).toBeGreaterThanOrEqual(7);
    for (let index = 0; index < 7; index += 1) {
      for (const column of [weekdays.nth(index), firstWeek.nth(index)]) {
        const bounds = await box(column);
        expect(bounds.x).toBeGreaterThanOrEqual(paneBounds.x - 0.75);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(paneBounds.x + paneBounds.width + 0.75);
      }
    }
    // Keep the free Calendar's actual structural nav classes and natural buttons.
    const miniNav = mini.getByRole("navigation");
    await expect(miniNav).toHaveCSS("display", "flex");
    await expect(miniNav).toHaveCSS("position", "absolute");
    const previousMonth = await box(mini.getByRole("button", { name: /previous month/i }));
    const nextMonth = await box(mini.getByRole("button", { name: /next month/i }));
    near(previousMonth.y, nextMonth.y, "Month navigation buttons share one row");

    const monthLabel = await box(mini.locator(".rdp-caption_label"));
    near(
      monthLabel.y + monthLabel.height / 2,
      nextMonth.y + nextMonth.height / 2,
      "Month caption and navigation share one header row",
    );
    expect(previousMonth.x).toBeGreaterThanOrEqual(monthLabel.x + monthLabel.width);
    expect(nextMonth.x).toBeGreaterThanOrEqual(previousMonth.x + previousMonth.width);
    const miniBounds = await box(mini);
    expect(nextMonth.x + nextMonth.width).toBeLessThanOrEqual(miniBounds.x + miniBounds.width);
    expect(nextMonth.y + nextMonth.height).toBeLessThanOrEqual(miniBounds.y + 0.75);
    await mini.getByRole("button", { name: /next month/i }).click();
    await expect(mini.locator('[data-selected-single="true"]')).toHaveAttribute(
      "data-day",
      "11/1/2026",
    );
    if (width === 390) await expect(nav).toBeVisible();
    await closeNavigation(page, width);
    const month = page.locator(
      width === 1440 ? ".miro-layout-month-long" : ".miro-layout-month-short",
    );
    await expect(month).toBeVisible();
    await expect(month).toHaveText(width === 1440 ? "November 2026" : "Nov 2026");
    await expect(calendar.locator('[data-slot="event-calendar-resource-header"]')).toHaveCount(5);
    await settled(page);
    await evidence(page, info, "shared-calendar-date");
    // Smaller available height exercises contained scrolling; not a reference geometry oracle.
    await page.setViewportSize({ width, height: 600 });
    await settled(page);
    const viewport = calendar.locator(
      '[data-slot="event-calendar-resource-view"] [data-slot="scroll-area-viewport"]',
    );
    expect(await viewport.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    await wheelDown(page, viewport);
    await boundedDocument(page);
  });

  test(`Miro local theme native radios and layered Escape ${width}`, async ({ page }, info) => {
    await open(page, width, "/settings");
    const nav = await navigation(page, width);
    const account = nav.getByRole("button", { name: /^Open profile for / });
    await account.click();
    const menu = page.locator('.miro-account-menu[role="menu"]');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("radiogroup", { name: "Theme", exact: true })).toBeVisible();
    await expect(menu.getByRole("radio")).toHaveCount(3);
    await expect(menu.getByRole("menuitemradio")).toHaveCount(0);
    await expect(menu.getByRole("radio", { name: "System", exact: true })).toBeChecked();
    await settled(page);
    near((await box(menu)).width, 224, "Original account popup width");
    for (const radio of await menu.getByRole("radio").all()) {
      const rect = await box(radio);
      near(rect.width, 24, "Native theme hit width");
      near(rect.height, 24, "Native theme hit height");
    }
    await evidence(page, info, "native-account-theme");
    await menu.getByRole("radio", { name: "Dark", exact: true }).click();
    await expect(menu).toBeHidden();
    await expect(account).toBeFocused();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    if (width === 390) await expect(nav).toBeVisible();
    await account.click();
    await expect(menu.getByRole("radio", { name: "Dark", exact: true })).toBeChecked();
    await menu.getByRole("radio", { name: "System", exact: true }).click();
    await expect(menu).toBeHidden();
    await expect(account).toBeFocused();
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await account.click();
    await expect(menu.getByRole("radio", { name: "System", exact: true })).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(account).toBeFocused();
    if (width === 390) await expect(nav).toBeVisible();
    await closeNavigation(page, width);
  });
}

test("Miro event preview preserves status until explicit check in updates the source", async ({
  page,
}) => {
  await open(page, 1440, "/calendar");
  const event = page
    .locator('[data-slot="event-calendar-event"]')
    .filter({ hasText: "Amelia James" });
  await expect(event).toHaveCount(1);
  await expect(event).toContainText("Booked");
  await event.click();
  const preview = page.getByRole("dialog", { name: "Amelia James", exact: true });
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("Booked");
  await expect(preview).not.toContainText("Arrived");
  await preview
    .locator('[data-slot="sheet-footer"]')
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(preview).toBeHidden();
  await expect(event).toContainText("Booked");
  await event.click();
  await preview.getByRole("button", { name: "Check in", exact: true }).click();
  await expect(preview).toBeHidden();
  await expect(event).toContainText("Arrived");
  await navigate(page, 1440, "Dashboard", "/dashboard");
  await navigate(page, 1440, "Calendar", "/calendar");
  await expect(event).toContainText("Arrived");
  await event.click();
  await expect(preview).toContainText("Arrived");
  await page.keyboard.press("Escape");
  await expect(preview).toBeHidden();
});

test("Miro actual route history preserves duplicate raw query and saved profile", async ({
  page,
}) => {
  await open(page, 1440, "/settings", rawQuery);
  const profile = page.getByRole("tabpanel", { name: "My Profile", exact: true });
  await profile.getByRole("textbox", { name: "Full name", exact: true }).fill("Miro Native Review");
  await profile.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open profile for Miro Native Review", exact: true }),
  ).toBeVisible();
  await navigate(page, 1440, "Calendar", "/calendar", rawQuery);
  await navigate(page, 1440, "Appointments", "/appointments", rawQuery);
  await page.goBack();
  await exactRoute(page, "/calendar", rawQuery);
  await page.goBack();
  await exactRoute(page, "/settings", rawQuery);
  await expect(profile.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue(
    "Miro Native Review",
  );
  await page.goForward();
  await exactRoute(page, "/calendar", rawQuery);
  await page.goForward();
  await exactRoute(page, "/appointments", rawQuery);
  await expect(
    page.getByRole("button", { name: "Open profile for Miro Native Review", exact: true }),
  ).toBeVisible();
});
