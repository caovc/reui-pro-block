import { expect, test, type Locator } from "@playwright/test";

const weeks = [
  ["Mar 24", "58%"],
  ["Mar 31", "57%"],
  ["Apr 7", "59.5%"],
  ["Apr 14", "60.8%"],
  ["Apr 21", "59.8%"],
  ["Apr 28", "62.3%"],
  ["May 5", "64.2%"],
  ["May 12", "63.3%"],
  ["May 19", "66.3%"],
  ["May 26", "68.3%"],
  ["Jun 2", "69%"],
  ["Jun 9", "70.7%"],
];

async function checkIndicator(indicator: Locator, value: number, stage: string) {
  await expect(indicator).toHaveAttribute("aria-valuenow", String(value));
  await expect(indicator).toHaveAttribute("aria-valuetext", stage);
  await expect(indicator.locator('[data-slot="progress-track"]')).toHaveCSS("height", "4px");
  await expect
    .poll(() =>
      indicator.evaluate((node) => {
        const track = node.querySelector('[data-slot="progress-track"]')!;
        const fill = node.querySelector('[data-slot="progress-indicator"]')!;
        return Math.round(
          (fill.getBoundingClientRect().width / track.getBoundingClientRect().width) * 100,
        );
      }),
    )
    .toBe(value);
}

for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390]) {
    test(`Pulse Dashboard ${primitive} ${width}: real chart tooltips, keyboard readout and stage indicators`, async ({
      page,
    }, info) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) faults.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`${primitive === "base" ? "/base/" : "/"}#/template-preview/pulse`);
      await expect(page).toHaveTitle("Bricklane — Blocks & Templates");
      await expect(page).toHaveURL(/#\/template-preview\/pulse$/);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.getByText("10 of 10 open escalations", { exact: true })).toBeVisible();
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);

      const chart = page.locator(".pulse-resolution-chart");
      const group = chart.getByRole("group", {
        name: "First contact resolution by week. Arrow keys move between points.",
        exact: true,
      });
      const dots = chart.locator(".recharts-area-dot");
      await expect(dots).toHaveCount(12);
      await expect(chart).toHaveCSS("height", "350px");
      await expect(chart.locator(".recharts-yAxis-tick-labels text").first()).toHaveCSS(
        "font-size",
        "12px",
      );
      const tooltip = chart.locator(".recharts-tooltip-wrapper");
      for (const [index, [date, rate]] of weeks.entries()) {
        await dots.nth(index).hover();
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText(date);
        await expect(tooltip).toContainText(rate);
      }
      await page.screenshot({
        path: info.outputPath(`pulse-tooltip-${primitive}-${width}.png`),
        fullPage: true,
      });
      await page.mouse.move(0, 0);
      await expect(tooltip).toBeHidden();

      const frame = chart.locator("xpath=ancestor::*[@data-slot='frame']");
      const beforeHeight = await frame.evaluate((node) => node.getBoundingClientRect().height);
      await page.locator(".ct-queue-row").last().focus();
      await page.keyboard.press("Tab");
      await expect(group).toBeFocused();
      await page.keyboard.press("Home");
      await expect(group.getByRole("status")).toHaveText("Mar 24First contact resolution 58%");
      await page.keyboard.press("End");
      await expect(group.getByRole("status")).toHaveText("Jun 9First contact resolution 70.7%");
      await page.keyboard.press("ArrowLeft");
      await expect(group.getByRole("status")).toHaveText("Jun 2First contact resolution 69%");
      expect(await frame.evaluate((node) => node.getBoundingClientRect().height)).toBe(
        beforeHeight,
      );
      await page.keyboard.press("Escape");
      await expect(group.getByRole("status")).toHaveCount(0);
      await expect(group).toBeFocused();

      await checkIndicator(
        page.getByRole("progressbar", { name: "TCK-4863 stage indicator", exact: true }),
        50,
        "Escalated",
      );
      await checkIndicator(
        page.getByRole("progressbar", { name: "TCK-4821 stage indicator", exact: true }),
        35,
        "Awaiting agent",
      );
      const green = await dots.first().evaluate((node) => getComputedStyle(node).stroke);
      await expect(
        page
          .getByRole("progressbar", { name: "TCK-4863 stage indicator", exact: true })
          .locator('[data-slot="progress-indicator"]'),
      ).toHaveCSS("background-color", green);
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await expect(page.getByRole("progressbar", { name: "TCK-4863 stage indicator" })).toHaveCount(
        0,
      );
      await checkIndicator(
        page.getByRole("progressbar", { name: "TCK-4890 stage indicator", exact: true }),
        35,
        "Awaiting agent",
      );
      await page.getByRole("combobox", { name: "Filter ticket queue", exact: true }).click();
      await page.getByRole("option", { name: "On Time", exact: true }).click();
      await expect(page.getByText("4 of 10 open escalations", { exact: true })).toBeVisible();
      await expect(page.getByRole("progressbar")).toHaveCount(4);
      await checkIndicator(
        page.getByRole("progressbar", { name: "TCK-4872 stage indicator", exact: true }),
        35,
        "Triage",
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await page.screenshot({
        path: info.outputPath(`pulse-filtered-${primitive}-${width}.png`),
        fullPage: true,
      });
      expect(faults).toEqual([]);
    });
  }
}
