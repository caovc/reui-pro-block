import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe.configure({ retries: 0, timeout: 30000 });
test.use({ actionTimeout: 5000, colorScheme: "light", trace: "on" });

const procedureRows = [
  ["Checkup", 41, 75],
  ["Scaling", 36, 89],
  ["Whitening", 62, 40],
  ["Filling", 27, 58],
  ["Extraction", 52, 82],
  ["Crown", 22, 70],
  ["Braces", 67, 42],
  ["Implant", 45, 77],
] as const;
const series = [
  ["Completed", "rgb(82, 119, 240)"],
  ["Scheduled", "rgb(131, 215, 238)"],
] as const;

async function readTooltip(card: Locator, category: string) {
  const tooltip = card.locator(".miro-dashboard-chart-tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip.getByText(category, { exact: true })).toBeVisible();
  return (await tooltip.innerText())
    .split("\n")
    .map((text) => text.trim())
    .filter(Boolean);
}

async function swatchPaint(swatch: Locator) {
  await expect(swatch).toHaveCount(1);
  await expect(swatch).toBeVisible();
  return swatch.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      color: style.backgroundColor,
      width: rect.width,
      height: rect.height,
      radius: style.borderRadius,
    };
  });
}

async function legendPaint(card: Locator) {
  const legend = card.getByRole("group", { name: "Procedure Mix series", exact: true });
  const painted = [];
  for (const [name, color] of series) {
    const row = legend.getByText(name, { exact: true });
    await expect(row).toBeVisible();
    const paint = await swatchPaint(row.locator(":scope > div"));
    expect(paint.color).toBe(color);
    expect(paint.width).toBeGreaterThan(0);
    expect(parseFloat(paint.radius)).toBeGreaterThanOrEqual(paint.width / 2);
    painted.push({ name, ...paint });
  }
  return painted;
}

async function tooltipPaint(card: Locator) {
  const tooltip = card.locator(".miro-dashboard-chart-tooltip");
  const painted = [];
  for (const [name, color] of series) {
    const row = tooltip.locator(":scope > div > div").filter({ hasText: name });
    await expect(row).toHaveCount(1);
    const paint = await swatchPaint(row.locator(":scope > .shrink-0"));
    expect(paint.color).toBe(color);
    expect(parseFloat(paint.radius)).toBeGreaterThanOrEqual(paint.width / 2);
    painted.push({ name, ...paint });
  }
  return painted;
}

async function tabToChart(page: Page, chart: Locator) {
  for (let index = 0; index < 40; index++) {
    if (await chart.evaluate((node) => document.activeElement === node)) return index;
    await page.keyboard.press("Tab");
  }
  throw new Error("Native Tab did not reach the visible Procedure Mix chart");
}

for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390, 320]) {
    test(`Miro ${primitive} ${width}: Procedure Mix legend, hover and keyboard use the same series names`, async ({
      page,
    }, info) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) faults.push(message.text());
      });
      await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
      const entry = primitive === "base" ? "./base/" : "./";
      const preset = new URLSearchParams({
        preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
      });
      await page.goto(`${entry}#/template-preview/miro/dashboard?${preset}`);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.locator("html")).toHaveAttribute("data-ui-style", "nova");
      const card = page
        .locator(".miro-chart-card")
        .filter({ has: page.getByRole("heading", { name: "Procedure Mix", exact: true }) });
      await expect(card).toHaveCount(1);
      await card.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      const legend = await legendPaint(card);
      const bars = card.locator(".recharts-bar");
      await expect(bars).toHaveCount(2);
      for (const bar of [bars.nth(0), bars.nth(1)])
        await expect(bar.locator(".recharts-bar-rectangle")).toHaveCount(8);
      await bars.nth(0).locator(".recharts-bar-rectangle").nth(0).hover();
      const hover = await readTooltip(card, "Checkup");
      const hoverPaint = await tooltipPaint(card);
      await page.screenshot({ path: info.outputPath("procedure-hover.png") });
      await page.mouse.move(0, 0);
      const chart = card.getByRole("application");
      await expect(chart).toHaveCount(1);
      const nativeTabCount = await tabToChart(page, chart);
      await page.keyboard.press("ArrowRight");
      const keyboard = await readTooltip(card, "Scaling");
      await page.keyboard.press("ArrowLeft");
      const keyboardCategories = [await readTooltip(card, "Checkup")];
      for (const [category] of procedureRows.slice(1)) {
        await page.keyboard.press("ArrowRight");
        keyboardCategories.push(await readTooltip(card, category));
      }
      const keyboardPaint = await tooltipPaint(card);
      const svg = card.locator("svg.recharts-surface");
      const svgBox = await svg.boundingBox();
      expect(svgBox).not.toBeNull();
      const ticks = await svg
        .locator("text.recharts-cartesian-axis-tick-value")
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            return {
              text: node.textContent,
              font: getComputedStyle(node).font,
              box: {
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
              },
            };
          }),
        );
      await info.attach("native-procedure-contract", {
        body: JSON.stringify(
          {
            legend,
            hover,
            hoverPaint,
            keyboard,
            keyboardCategories,
            keyboardPaint,
            nativeTabCount,
            ticks,
            svgBox,
            faults,
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
      await page.screenshot({ path: info.outputPath("procedure-keyboard.png") });
      expect(hover).toEqual(["Checkup", "Completed", "41", "Scheduled", "75"]);
      expect(keyboard).toEqual(["Scaling", "Completed", "36", "Scheduled", "89"]);
      expect(keyboardCategories).toEqual(
        procedureRows.map(([category, completed, scheduled]) => [
          category,
          "Completed",
          String(completed),
          "Scheduled",
          String(scheduled),
        ]),
      );
      expect(ticks.length).toBeGreaterThanOrEqual(2);
      expect(ticks.length).toBeLessThanOrEqual(procedureRows.length);
      if (width === 1440) expect(ticks).toHaveLength(procedureRows.length);
      expect(ticks[0].text).toBe("Checkup");
      expect(ticks.at(-1)?.text).toBe("Implant");
      for (const tick of ticks) {
        expect(procedureRows.some(([category]) => category === tick.text)).toBe(true);
        expect(tick.box.left).toBeGreaterThanOrEqual(svgBox!.x - 0.5);
        expect(tick.box.right).toBeLessThanOrEqual(svgBox!.x + svgBox!.width + 0.5);
      }
      for (let index = 1; index < ticks.length; index++)
        expect(ticks[index].box.left - ticks[index - 1].box.right).toBeGreaterThanOrEqual(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(faults).toEqual([]);
    });
  }
}
