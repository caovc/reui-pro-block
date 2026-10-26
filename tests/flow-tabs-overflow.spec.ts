import { expect, test, type Page } from "@playwright/test";

async function openInspector(page: Page, id: "flow-3" | "flow-4", width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`./#/preview/application/flow/${id}`);
  await expect(page.locator("[data-flow-variant]")).toBeVisible();
  if (width === 390) {
    await page.locator(`[data-flow-node="${id === "flow-3" ? "reconcile" : "north"}"]`).click();
    await page
      .locator(".react-flow__node-toolbar")
      .getByRole("button", { name: /^Open / })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
  }
  await page.evaluate(() => document.fonts.ready);
}

for (const width of [1440, 390]) {
  for (const id of ["flow-3", "flow-4"] as const) {
    test(`${id} inspector at ${width} keeps native tabs inside the row and supports arrow navigation`, async ({
      page,
    }) => {
      await openInspector(page, id, width);
      const list = page.getByRole("tablist", {
        name: id === "flow-3" ? "Task details" : "Metric details",
        exact: true,
      });
      const settings = list.getByRole("tab", { name: "Settings", exact: true });
      const secondary = list.getByRole("tab", {
        name: id === "flow-3" ? "Wiring" : "Links",
        exact: true,
      });
      await expect(settings).toHaveAttribute("aria-selected", "true");
      const dimensions = await list.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        overflowY: getComputedStyle(element).overflowY,
      }));
      expect(dimensions.height).toBe(40);
      expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight);
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      expect(dimensions.overflowY).not.toBe("scroll");

      await settings.focus();
      await page.keyboard.press("ArrowRight");
      await expect(secondary).toBeFocused();
      await expect(secondary).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel")).toContainText(
        id === "flow-3" ? "INPUTS" : "DRIVEN BY",
      );
      const underline = await secondary.evaluate((element) => ({
        bottom: getComputedStyle(element, "::after").bottom,
        opacity: getComputedStyle(element, "::after").opacity,
        focusRing: getComputedStyle(element).boxShadow,
      }));
      expect(underline.bottom).toBe("0px");
      await expect
        .poll(() => secondary.evaluate((element) => getComputedStyle(element, "::after").opacity))
        .toBe("1");
      expect(underline.focusRing).not.toBe("none");
      await page.keyboard.press("ArrowLeft");
      await expect(settings).toBeFocused();
      await expect(page.getByRole("tabpanel").getByLabel("Title", { exact: true })).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("tabpanel")).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    });
  }
}

test("growth period uses native grouped buttons and keeps its phone focus ring visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("./#/preview/application/flow/flow-4");
  const group = page.getByRole("group", { name: "Period", exact: true });
  const sixWeeks = group.getByRole("button", { name: "6 weeks", exact: true });
  await sixWeeks.focus();
  await page.keyboard.press("Space");
  await expect(sixWeeks).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("22,408", { exact: true })).toBeVisible();
  expect(await group.getAttribute("data-slot")).toBe("button-group");
  const metrics = await group.evaluate((element) => ({
    overflowX: getComputedStyle(element).overflowX,
    overflowY: getComputedStyle(element).overflowY,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(metrics.overflowX).toBe("visible");
  expect(metrics.overflowY).toBe("visible");
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
