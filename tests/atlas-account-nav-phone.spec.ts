import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ colorScheme: "light", actionTimeout: 5000, trace: "on" });

async function measure(page: Page, nav: Locator) {
  const layout = await nav.evaluate((node) => {
    const box = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    return {
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      scrollX,
      nav: box(node),
      navOverflowX: getComputedStyle(node).overflowX,
      links: Array.from(node.querySelectorAll("a")).map((link) => {
        const range = document.createRange();
        range.selectNodeContents(link);
        const rect = link.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        const style = getComputedStyle(link);
        return {
          name: link.textContent,
          box: box(link),
          textRects: Array.from(range.getClientRects()).map((text) => ({
            left: text.left,
            right: text.right,
            top: text.top,
            bottom: text.bottom,
          })),
          hit: hit === link || (hit !== null && link.contains(hit)),
          padding: style.padding,
          fontSize: style.fontSize,
          letterSpacing: style.letterSpacing,
          textTransform: style.textTransform,
          whiteSpace: style.whiteSpace,
        };
      }),
    };
  });
  return { ...layout, url: page.url() };
}

async function checkLayout(page: Page, nav: Locator, width: number) {
  const layout = await measure(page, nav);
  expect(layout.documentWidth).toBeLessThanOrEqual(width);
  expect(layout.scrollX).toBe(0);
  expect(layout.nav.left).toBeGreaterThanOrEqual(0);
  expect(layout.nav.right).toBeLessThanOrEqual(width);
  expect(layout.links.map((link) => link.name)).toEqual(["Profile", "Security", "Preferences"]);
  for (const link of layout.links) {
    expect(link.box.left, `${link.name} stays inside navigation`).toBeGreaterThanOrEqual(
      layout.nav.left - 0.5,
    );
    expect(link.box.right, `${link.name} stays inside navigation`).toBeLessThanOrEqual(
      layout.nav.right + 0.5,
    );
    expect(link.box.top, `${link.name} stays inside navigation`).toBeGreaterThanOrEqual(
      layout.nav.top - 0.5,
    );
    expect(link.box.bottom, `${link.name} stays inside navigation`).toBeLessThanOrEqual(
      layout.nav.bottom + 0.5,
    );
    expect(link.hit, `${link.name} has a reachable visible hitbox`).toBe(true);
    expect(link.textRects.length).toBeGreaterThan(0);
    for (const text of link.textRects) {
      expect(text.left, `${link.name} full label fits`).toBeGreaterThanOrEqual(link.box.left - 0.5);
      expect(text.right, `${link.name} full label fits`).toBeLessThanOrEqual(link.box.right + 0.5);
      expect(text.top, `${link.name} full label fits`).toBeGreaterThanOrEqual(link.box.top - 0.5);
      expect(text.bottom, `${link.name} full label fits`).toBeLessThanOrEqual(
        link.box.bottom + 0.5,
      );
    }
  }
  if (width === 390 && parseFloat(layout.rootFontSize) <= 16) {
    const tops = layout.links.map((link) => link.box.top);
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(0.5);
  }
  return layout;
}

for (const primitive of ["radix", "base"] as const) {
  for (const width of [320, 390]) {
    test(`Atlas ${primitive} Sera ${width}: account navigation keeps complete labels, routes and focus without document scrolling`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      const entry = primitive === "base" ? "/base/" : "/";
      const preset = encodeURIComponent(
        JSON.stringify({ primitive, style: "sera", mode: "light" }),
      );
      await page.goto(`${entry}#/template-preview/atlas/account/profile?preset=${preset}`);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.locator("html")).toHaveAttribute("data-ui-style", "sera");
      await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const nav = page.getByRole("navigation", { name: "Account sections", exact: true });
      await expect(nav).toBeVisible();
      const initial = await measure(page, nav);
      await info.attach("initial-account-navigation", {
        body: JSON.stringify(initial, null, 2),
        contentType: "application/json",
      });
      await page.screenshot({ path: info.outputPath("account-navigation-phone.png") });
      await checkLayout(page, nav, width);
      await page.mouse.move(width / 2, initial.nav.top + initial.nav.height / 2);
      await page.mouse.wheel(500, 0);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const afterWheel = await checkLayout(page, nav, width);
      const routes = [];
      for (const [name, route] of [
        ["Preferences", "preferences"],
        ["Security", "security"],
        ["Profile", "profile"],
      ] as const) {
        const link = nav.getByRole("link", { name, exact: true });
        await link.click();
        await expect(link).toHaveAttribute("aria-current", "page");
        await expect(link).toBeFocused();
        await expect(page).toHaveURL(new RegExp(`/account/${route}\\?`));
        routes.push(await checkLayout(page, nav, width));
      }
      const profile = nav.getByRole("link", { name: "Profile", exact: true });
      const security = nav.getByRole("link", { name: "Security", exact: true });
      await expect(profile).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(security).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(security).toHaveAttribute("aria-current", "page");
      await expect(security).toBeFocused();
      const keyboard = await checkLayout(page, nav, width);
      await info.attach("native-account-navigation", {
        body: JSON.stringify({ initial, afterWheel, routes, keyboard, errors }, null, 2),
        contentType: "application/json",
      });
      expect(errors).toEqual([]);
    });
  }
}
