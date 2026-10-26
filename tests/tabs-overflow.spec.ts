import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

for (const width of [1440, 390]) {
  test(`template category tabs avoid vertical overflow and retain keyboard access at ${width}px`, async ({
    page,
    context,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("./#/templates");
    const viewport = page.locator('.template-gallery-controls > [data-slot="tabs"]');
    const tabs = viewport.getByRole("tab");
    await expect(tabs).toHaveCount(5);
    const size = await viewport.evaluate((node) => ({
      height: node.clientHeight,
      contentHeight: node.scrollHeight,
      width: node.clientWidth,
      contentWidth: node.scrollWidth,
    }));
    expect(size.contentHeight).toBeLessThanOrEqual(size.height);
    if (width === 1440) expect(size.contentWidth).toBeLessThanOrEqual(size.width);
    else expect(size.contentWidth).toBeGreaterThan(size.width);

    await tabs.first().focus();
    const pageY = await page.evaluate(() => scrollY);
    await tabs.first().press("End");
    await expect(tabs.last()).toBeFocused();
    await expect(tabs.last()).toHaveAttribute("data-state", "active");
    await expect(page.getByText("2 templates", { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        tabs.last().evaluate((node) => {
          const port = node.closest('[data-slot="tabs"]')!;
          const bounds = port.getBoundingClientRect();
          const item = node.getBoundingClientRect();
          return item.left >= bounds.left && item.right <= bounds.left + port.clientWidth;
        }),
      )
      .toBe(true);
    expect(await page.evaluate(() => scrollY)).toBe(pageY);
    expect(await tabs.last().evaluate((node) => node.matches(":focus-visible"))).toBe(true);
    await expect
      .poll(() =>
        tabs.last().evaluate((node) => ({
          width: getComputedStyle(node).outlineWidth,
          offset: getComputedStyle(node).outlineOffset,
        })),
      )
      .toEqual({ width: "1px", offset: "0px" });
    await expect
      .poll(() => tabs.last().evaluate((node) => getComputedStyle(node).boxShadow))
      .toContain(" 3px");

    await tabs.last().press("Home");
    await expect(tabs.first()).toBeFocused();
    if (width === 1440) {
      expect(await viewport.evaluate((node) => node.scrollLeft)).toBe(0);
      await page.evaluate(() => {
        const button = document.createElement("button");
        button.id = "native-focus-audit";
        button.textContent = "Native focus audit";
        Object.assign(button.style, { position: "fixed", left: "16px", bottom: "16px" });
        document.body.append(button);
      });
      const native = page.locator("#native-focus-audit");
      await native.focus();
      expect(await native.evaluate((node) => node.matches(":focus-visible"))).toBe(true);
      expect(
        await native.evaluate((node) => ({
          width: getComputedStyle(node).outlineWidth,
          offset: getComputedStyle(node).outlineOffset,
        })),
      ).toEqual({ width: "2px", offset: "3px" });
      await native.evaluate((node) => node.remove());
    }
    if (width === 390) {
      await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBe(0);
      const bounds = (await viewport.boundingBox())!;
      const session = await context.newCDPSession(page);
      await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
      await session.send("Input.synthesizeScrollGesture", {
        x: bounds.x + bounds.width - 15,
        y: bounds.y + bounds.height / 2,
        xDistance: -200,
        yDistance: 0,
        speed: 500,
        gestureSourceType: "touch",
      });
      await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
      await session.detach();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`gallery-${width}.png`),
      animations: "disabled",
    });
  });
}

for (const width of [1280, 390]) {
  test(`a consumer's workbench height is honored without vertical tab scrolling at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./#/preview/application/app-shell/app-shell-11");
    const list = page
      .getByRole("tablist")
      .filter({ has: page.getByRole("tab", { name: "Settings", exact: true }) });
    await expect(list).toBeVisible();
    const size = await list.evaluate((node) => ({
      height: node.clientHeight,
      contentHeight: node.scrollHeight,
      width: node.clientWidth,
      contentWidth: node.scrollWidth,
    }));
    expect(size.height).toBeGreaterThanOrEqual(40);
    expect(size.contentHeight).toBeLessThanOrEqual(size.height);
    if (width === 390) expect(size.contentWidth).toBeGreaterThan(size.width);
    await list.getByRole("tab").first().focus();
    await list.getByRole("tab").first().press("End");
    await expect(list.getByRole("tab").last()).toBeFocused();
    await expect(list.getByRole("tab").last()).toHaveAttribute("data-state", "active");
    await expect
      .poll(() =>
        list
          .getByRole("tab")
          .last()
          .evaluate((node) => {
            const viewport = node.parentElement!;
            const bounds = viewport.getBoundingClientRect();
            const item = node.getBoundingClientRect();
            const left = bounds.left + viewport.clientLeft;
            const top = bounds.top + viewport.clientTop;
            return (
              item.left - 3 >= left &&
              item.right + 3 <= left + viewport.clientWidth &&
              item.top - 3 >= top &&
              item.bottom + 3 <= top + viewport.clientHeight
            );
          }),
      )
      .toBe(true);
  });
}

test("filled tabs have no invisible underline overflow and real source scrolling and downloads remain intact", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/block/application/auth/auth-20");
  const list = page.locator('.preview-toolbar [data-slot="tabs-list"]');
  await expect(list).toBeVisible();
  expect(await list.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const filename = "src/components/ui/tabs.tsx";
  await dialog.getByRole("combobox", { name: "Source file", exact: true }).click();
  await page.getByRole("option", { name: filename, exact: true }).click();
  const expected = await readFile(filename, "utf8");
  const source = dialog.locator(".source-code");
  await source.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  const viewport = source.locator('[data-slot="code-block-viewport"]');
  expect(await viewport.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  await viewport.evaluate((node) => node.scrollTo({ top: 120, behavior: "instant" }));
  expect(await viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  const pendingFile = page.waitForEvent("download");
  await source.getByRole("button", { name: "Download source file", exact: true }).click();
  expect(await readFile((await (await pendingFile).path())!, "utf8")).toBe(expected);
  const pendingZip = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
  const zip = unzipSync(new Uint8Array(await readFile((await (await pendingZip).path())!)));
  expect(strFromU8(zip[filename])).toBe(expected);
});

test("Grouping 3 keeps the focused and active mobile tab inside its own scrollport without moving the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/preview/data-grid/grouping/data-grid-grouping-3");
  const list = page.getByRole("tablist", { name: "Group intake signals" });
  await expect(list).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const viewport = list.locator("..");
  const tabs = list.getByRole("tab");
  expect(await viewport.evaluate((node) => node.clientHeight)).toBe(40);
  const originalTop = await tabs.last().evaluate((node) => node.getBoundingClientRect().top);
  expect(await viewport.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
  expect(await viewport.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  await tabs.first().focus();
  const pageY = await page.evaluate(() => scrollY);
  const scrollTop = await viewport.evaluate((node) => node.scrollTop);
  await tabs.first().press("ArrowRight");
  await expect(tabs.nth(1)).toBeFocused();
  await tabs.nth(1).press("ArrowRight");
  await expect(tabs.last()).toBeFocused();
  await expect(tabs.last()).toHaveAttribute("data-state", "active");
  await expect
    .poll(() =>
      tabs.last().evaluate((node) => {
        const viewport = node.parentElement!.parentElement!;
        const bounds = viewport.getBoundingClientRect();
        const item = node.getBoundingClientRect();
        const top = bounds.top + viewport.clientTop;
        return (
          item.left - 3 >= bounds.left &&
          item.right + 3 <= bounds.left + viewport.clientWidth &&
          item.top >= top &&
          item.bottom <= top + viewport.clientHeight
        );
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      tabs.last().evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          outlineWidth: style.outlineWidth,
          outlineOffset: style.outlineOffset,
          insetRing: style.boxShadow.includes("3px inset"),
        };
      }),
    )
    .toEqual({ outlineWidth: "1px", outlineOffset: "-1px", insetRing: true });
  expect(await tabs.last().evaluate((node) => node.getBoundingClientRect().top)).toBe(originalTop);
  expect(await viewport.evaluate((node) => node.clientHeight)).toBe(40);
  expect(await viewport.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
  expect(await viewport.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  expect(await viewport.evaluate((node) => node.scrollTop)).toBe(scrollTop);
  expect(await page.evaluate(() => scrollY)).toBe(pageY);
});
