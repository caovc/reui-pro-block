import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe.configure({ retries: 0, timeout: 30000 });
test.use({ actionTimeout: 5000, colorScheme: "light", trace: "on" });

const mount = "#/template-preview/roster";
const query = "?qa=roster-time-trail&raw=a%20b&raw=a+b&flag";

async function open(page: Page, primitive: "radix" | "base", width: number) {
  await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
  const entry = primitive === "base" ? "./base/" : "./";
  await page.goto(`${entry}${mount}/time/timesheets${query}`);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.getByRole("heading", { name: "Timesheets", exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function nativeHit(locator: Locator) {
  return locator.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return node === hit || node.contains(hit);
  });
}

for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390, 320]) {
    test(`Roster ${primitive} ${width}px Time trail keeps real parent links and current-page semantics`, async ({
      page,
    }, info) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      await open(page, primitive, width);
      const trail = page.locator(".ct-pagebar").getByRole("navigation", { name: "breadcrumb" });
      await expect(trail).toBeVisible();
      const parent = trail.getByRole("link", { name: "Time", exact: true });
      await expect(parent).toBeVisible();
      await expect(parent).toHaveAttribute("href", `${mount}/time/time-off${query}`);
      const current = trail.getByRole("link", { name: "Timesheets", exact: true });
      await expect(current).toHaveAttribute("aria-current", "page");
      await expect(current).toHaveAttribute("aria-disabled", "true");
      expect(await current.getAttribute("href")).toBeNull();
      await expect(current).toHaveCSS("font-weight", "400");
      const people = trail.getByRole("link", {
        name: "People",
        exact: true,
        includeHidden: true,
      });
      await expect(people).toHaveAttribute("href", `${mount}/people/directory${query}`);
      const separators = trail.locator('[data-slot="breadcrumb-separator"]');
      await expect(separators).toHaveCount(2);
      if (width <= 390) {
        await expect(people).toBeHidden();
        for (const separator of await separators.all()) await expect(separator).toBeHidden();
      } else {
        await expect(people).toBeVisible();
        for (const separator of await separators.all()) await expect(separator).toBeVisible();
      }
      const parentBox = await bounds(parent);
      const currentBox = await bounds(current);
      expect(currentBox.x - parentBox.x - parentBox.width).toBeGreaterThanOrEqual(5.5);
      expect(currentBox.x + currentBox.width).toBeLessThanOrEqual(width);
      expect(await nativeHit(parent)).toBe(true);
      await page.screenshot({ path: info.outputPath("time-trail.png") });
      await parent.press("Enter");
      await expect
        .poll(() => page.evaluate(() => location.hash))
        .toBe(`${mount}/time/time-off${query}`);
      await expect(page.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Timesheets", exact: true })).toHaveCount(0);
      await expect(trail.getByRole("link", { name: "Time off", exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      if (width === 1440) {
        await people.press("Enter");
        await expect
          .poll(() => page.evaluate(() => location.hash))
          .toBe(`${mount}/people/directory${query}`);
        await expect(trail).toHaveCount(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(faults).toEqual([]);
    });

    test(`Roster ${primitive} ${width}px week controls stay connected and preserve native calendar focus`, async ({
      page,
    }, info) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      await open(page, primitive, width);
      const group = page.getByRole("group", { name: "Timesheet week", exact: true });
      await expect(group).toBeVisible();
      await expect(group.getByRole("button")).toHaveCount(3);
      const previous = group.getByRole("button", { name: "Previous week", exact: true });
      const date = group.getByRole("button", {
        name: "Choose timesheet week, 20–26 Jul",
        exact: true,
      });
      const next = group.getByRole("button", { name: "Next week", exact: true });
      const [left, middle, right] = await Promise.all([
        bounds(previous),
        bounds(date),
        bounds(next),
      ]);
      expect(Math.abs(middle.x - left.x - left.width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(right.x - middle.x - middle.width)).toBeLessThanOrEqual(0.5);
      for (const box of [left, middle, right]) {
        expect(box.height).toBe(32);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      expect(left.width).toBe(32);
      expect(middle.width).toBe(168);
      expect(right.width).toBe(32);
      for (const button of [previous, date, next]) {
        expect(await nativeHit(button)).toBe(true);
        await expect(button).toHaveCSS("border-top-width", "1px");
        await expect(button).toHaveCSS("border-bottom-width", "1px");
      }
      await expect(date).toHaveCSS("border-left-width", "0px");
      await expect(next).toHaveCSS("border-left-width", "0px");
      await expect(date).toHaveCSS("font-weight", "400");
      const labelBox = await bounds(date.getByText("20 - 26 Jul", { exact: true }));
      const iconBox = await bounds(date.locator("svg"));
      expect(iconBox.x).toBeGreaterThan(labelBox.x + labelBox.width);
      await info.attach("week-segment-geometry", {
        body: JSON.stringify({ left, middle, right, labelBox, iconBox }),
        contentType: "application/json",
      });
      await page.screenshot({ path: info.outputPath("week-group.png") });
      await previous.click();
      await expect(
        group.getByRole("button", { name: "Choose timesheet week, 13–19 Jul" }),
      ).toBeVisible();
      await expect(page.locator(".ct-timesheets-grid").getByRole("columnheader").nth(1)).toHaveText(
        /Mon\s*13 Jul/,
      );
      await next.click();
      await expect(date).toBeVisible();
      await date.press("Enter");
      const popup = page.locator('[data-slot="popover-content"]').filter({ visible: true });
      await expect(popup).toHaveCount(1);
      await expect(popup.getByRole("grid")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(popup).toBeHidden();
      await expect(date).toBeFocused();
      await expect
        .poll(() => page.evaluate(() => location.hash))
        .toBe(`${mount}/time/timesheets${query}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(faults).toEqual([]);
    });
  }
}
