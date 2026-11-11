import { writeFile } from "node:fs/promises";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

// Local frozen-v11 behavior plus the free adapter contract, not original-site pixel certification.
// Parent owns execution: W1/R0/max-failures=1, ordinary 30s cases and 5s actions/assertions.
test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });

const mount = "#/template-preview/miro";
const query = "?qa=miro-plots&raw=a%20b&raw=a+b&flag";
const faults = new WeakMap<Page, string[]>();
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
const volumeRows = [
  ["Jan", 28, 10],
  ["Feb", 41, 14],
  ["Mar", 34, 12],
  ["Apr", 49, 17],
  ["May", 36, 13],
  ["Jun", 61, 21],
  ["Jul", 48, 17],
  ["Aug", 69, 24],
  ["Sep", 52, 18],
  ["Oct", 39, 14],
  ["Nov", 51, 18],
  ["Dec", 61, 21],
] as const;

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
  await info.attach("runtime-faults", {
    body: JSON.stringify(messages, null, 2),
    contentType: "application/json",
  });
  if (!page.isClosed() && info.status !== info.expectedStatus) {
    await page.screenshot({ path: info.outputPath("first-failure.png"), animations: "allow" });
  }
  expect(messages).toEqual([]);
});

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/${mount}/dashboard${query}`);
  await expect(page.locator(".bt-layout.bt-miro")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await route(page, "/dashboard");
}
async function route(page: Page, suffix: string) {
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`${mount}${suffix}${query}`);
}
async function bounds(locator: Locator) {
  const result = await locator.boundingBox();
  expect(result).not.toBeNull();
  return result!;
}
async function navigation(page: Page, width: number) {
  if (width === 1440) return page.locator(".bt-layout.bt-miro");
  const drawer = page.getByRole("dialog", { name: "Sidebar", exact: true });
  if (!(await drawer.isVisible())) {
    await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
  }
  await expect(drawer).toBeVisible();
  await expect.poll(() => drawer.evaluate((node) => node.getBoundingClientRect().x)).toBe(0);
  return drawer;
}
async function closeNavigation(page: Page, width: number) {
  if (width === 390) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Sidebar", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Toggle Sidebar", exact: true })).toBeFocused();
  }
}
async function navigate(page: Page, width: number, name: string, suffix: string) {
  const nav = await navigation(page, width);
  const target = nav.getByRole("button", { name, exact: true });
  await target.click();
  await route(page, suffix);
  if (width === 390) {
    await expect(nav).toBeVisible();
    await expect(target).toBeFocused();
  }
  await closeNavigation(page, width);
}
async function theme(page: Page, width: number, mode: "Dark" | "Light") {
  const nav = await navigation(page, width);
  const trigger = nav.getByRole("button", { name: /^Open profile for / });
  await trigger.click();
  const menu = page.locator('.miro-account-menu[role="menu"]');
  await expect(menu.getByRole("radiogroup", { name: "Theme", exact: true })).toBeVisible();
  await menu.getByRole("radio", { name: mode, exact: true }).click();
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  if (width === 390) await expect(nav).toBeVisible();
  await closeNavigation(page, width);
  if (mode === "Dark") await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  else await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
}

function plots(page: Page) {
  const cards = page.locator(".miro-chart-card");
  return {
    cards,
    procedure: cards.filter({
      has: page.getByRole("heading", { name: "Procedure Mix", exact: true }),
    }),
    volume: cards.filter({
      has: page.getByRole("heading", { name: "Patient Volume", exact: true }),
    }),
  };
}
async function boundedPlot(card: Locator) {
  await card.scrollIntoViewIfNeeded();
  const wrapper = card.locator(".bt-rechart");
  const container = wrapper.locator('[data-slot="chart"].miro-dashboard-chart');
  const svg = container.locator("svg.recharts-surface");
  await expect(container).toHaveCount(1);
  await expect(svg).toHaveCount(1);
  await expect(svg).toBeVisible();
  // 218px is the existing local Miro box contract; no original reference width is asserted.
  await expect(wrapper).toHaveCSS("height", "218px");
  await expect
    .poll(async () => {
      const outer = await bounds(wrapper);
      const inner = await bounds(container);
      return Math.max(Math.abs(outer.width - inner.width), Math.abs(outer.height - inner.height));
    })
    .toBeLessThanOrEqual(1);
  // Allow the actual ResponsiveContainer observer to settle its SVG dimensions.
  await expect
    .poll(async () => {
      const parent = await bounds(wrapper);
      const graphic = await bounds(svg);
      return Math.max(graphic.width - parent.width, graphic.height - parent.height);
    })
    .toBeLessThanOrEqual(1);
  const cardBox = await bounds(card);
  const outer = await bounds(wrapper);
  const graphic = await bounds(svg);
  expect(outer.width).toBeGreaterThan(0);
  expect(graphic.width).toBeGreaterThan(0);
  expect(graphic.height).toBeGreaterThan(0);
  for (const child of [outer, graphic]) {
    expect(child.x).toBeGreaterThanOrEqual(cardBox.x - 1);
    expect(child.y).toBeGreaterThanOrEqual(cardBox.y - 1);
    expect(child.x + child.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
    expect(child.y + child.height).toBeLessThanOrEqual(cardBox.y + cardBox.height + 1);
  }
  expect(graphic.width).toBeLessThanOrEqual(outer.width + 1);
  expect(graphic.height).toBeLessThanOrEqual(outer.height + 1);
  return { card: cardBox, wrapper: outer, svg: graphic };
}
async function tooltip(
  card: Locator,
  label: string,
  entries: readonly (readonly [string, number])[],
) {
  const popup = card.locator(".miro-dashboard-chart-tooltip");
  await expect(popup).toBeVisible();
  await expect(popup.getByText(label, { exact: true })).toBeVisible();
  for (const [name, value] of entries) {
    const row = popup.locator(":scope > div > div").filter({ hasText: name });
    await expect(row).toHaveCount(1);
    await expect(row.getByText(name, { exact: true })).toBeVisible();
    await expect(row.getByText(String(value), { exact: true })).toBeVisible();
  }
  return { popup, readout: { label, entries, actualText: await popup.innerText() } };
}
async function hoverProcedure(card: Locator, index: number) {
  await card.scrollIntoViewIfNeeded();
  const firstSeries = card.locator(".recharts-bar").first().locator(".recharts-bar-rectangle");
  await expect(firstSeries).toHaveCount(8);
  await expect(card.locator(".recharts-bar").nth(1).locator(".recharts-bar-rectangle")).toHaveCount(
    8,
  );
  await firstSeries.nth(index).hover();
  const [label, blocked, watched] = procedureRows[index];
  return tooltip(card, label, [
    ["Blocked", blocked],
    ["Watched", watched],
  ]);
}
async function hoverMonth(page: Page, card: Locator, index: number) {
  await card.scrollIntoViewIfNeeded();
  const svg = card.locator("svg.recharts-surface");
  const gridLine = card.locator(".recharts-cartesian-grid-horizontal line").first();
  await expect(svg).toBeVisible();
  await expect(gridLine).toHaveCount(1);
  const line = await gridLine.evaluate((node) => {
    if (!(node instanceof SVGLineElement)) throw new Error("Missing real horizontal SVG grid line");
    const matrix = node.getScreenCTM();
    if (!matrix) throw new Error("Grid has no rendered coordinate transform");
    const start = new DOMPoint(node.x1.baseVal.value, node.y1.baseVal.value).matrixTransform(
      matrix,
    );
    const end = new DOMPoint(node.x2.baseVal.value, node.y2.baseVal.value).matrixTransform(matrix);
    return { x: start.x, width: end.x - start.x };
  });
  expect(line.width).toBeGreaterThan(0);
  const surface = await bounds(svg);
  // Actual rendered grid endpoints define the 12 categorical month positions.
  // Move the real mouse; do not invoke handlers, dispatch synthetic events or set tooltip state.
  const x = Math.max(
    line.x + 1,
    Math.min(line.x + line.width - 1, line.x + (line.width * index) / 11),
  );
  await page.mouse.move(x, surface.y + surface.height / 2);
  const [month, appointments, patients] = volumeRows[index];
  return tooltip(card, month, [
    ["Appointments", appointments],
    ["Patients", patients],
  ]);
}
async function contrast(popup: Locator) {
  return popup.evaluate((element) => {
    // Browser-native CSS color conversion handles the theme's actual oklch values.
    const canvas = new OffscreenCanvas(1, 1);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Cannot read actual tooltip color conversion");
    const rgba = (value: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    const backgroundCSS = getComputedStyle(element).backgroundColor;
    const background = rgba(backgroundCSS);
    const luminance = (rgb: number[]) => {
      const linear = rgb.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const nodes = [element.firstElementChild, ...element.querySelectorAll("span")].filter(
      (node): node is Element => node !== null && Boolean(node.textContent?.trim()),
    );
    return {
      backgroundCSS,
      backgroundAlpha: background[3],
      text: nodes.map((node) => {
        const foregroundCSS = getComputedStyle(node).color;
        const foreground = rgba(foregroundCSS);
        const alpha = foreground[3] / 255;
        const composited = foreground
          .slice(0, 3)
          .map((value, index) => value * alpha + background[index] * (1 - alpha));
        const first = luminance(composited);
        const second = luminance(background);
        return {
          text: node.textContent?.trim(),
          foregroundCSS,
          ratio: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05),
        };
      }),
    };
  });
}
async function evidence(page: Page, info: TestInfo, name: string, observed: unknown) {
  const file = info.outputPath(`${name}.json`);
  await writeFile(
    file,
    JSON.stringify({ observed, url: page.url(), faults: faults.get(page) ?? [] }, null, 2) + "\n",
  );
  await info.attach(name, { path: file, contentType: "application/json" });
  await page.screenshot({ path: info.outputPath(`${name}.png`), animations: "allow" });
}

for (const width of [1440, 390]) {
  test(`Miro free Dashboard plots retain actual SVG bounds and all fixture hover values ${width}`, async ({
    page,
  }, info) => {
    await open(page, width);
    const chart = plots(page);
    await expect(chart.cards).toHaveCount(2);
    await expect(chart.procedure).toContainText("● Completed　● Scheduled");
    await expect(chart.volume).toContainText("+12.8%");
    const geometry = {
      procedure: await boundedPlot(chart.procedure),
      volume: await boundedPlot(chart.volume),
    };
    const procedureReadouts = [];
    for (let index = 0; index < procedureRows.length; index += 1) {
      procedureReadouts.push((await hoverProcedure(chart.procedure, index)).readout);
    }
    const monthReadouts = [];
    for (let index = 0; index < volumeRows.length; index += 1) {
      monthReadouts.push((await hoverMonth(page, chart.volume, index)).readout);
    }
    await theme(page, width, "Dark");
    const dark = [];
    for (const name of ["procedure", "volume"] as const) {
      const beforeTarget =
        name === "volume" ? (await hoverMonth(page, chart.volume, 10)).readout : undefined;
      const result =
        name === "procedure"
          ? await hoverProcedure(chart.procedure, 0)
          : await hoverMonth(page, chart.volume, 11);
      const readable = await contrast(result.popup);
      expect(readable.backgroundAlpha).toBeGreaterThanOrEqual(254);
      expect(readable.text.length).toBeGreaterThanOrEqual(5);
      for (const item of readable.text) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5);
      dark.push({ name, beforeTarget, ...result.readout, readability: readable });
    }
    await evidence(page, info, `plots-${width}-native-hover-dark`, {
      geometry,
      procedureReadouts,
      monthReadouts,
      dark,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });

  test(`Miro free plots survive existing Calendar views, month navigation and Profile round trips ${width}`, async ({
    page,
  }, info) => {
    await open(page, width);
    const chart = plots(page);
    await hoverProcedure(chart.procedure, 7);
    await hoverMonth(page, chart.volume, 0);
    const breakdown = page.locator(".miro-day-breakdown");
    await breakdown.getByRole("tab", { name: "By room", exact: true }).click();
    await expect(breakdown.getByRole("tab", { name: "By room", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(breakdown.getByRole("row", { name: /\bOp 1\b.*\bRestorative\b/ })).toBeVisible();
    await breakdown.getByRole("tab", { name: "By chair", exact: true }).click();
    await expect(breakdown.getByRole("tab", { name: "By chair", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await navigate(page, width, "Calendar", "/calendar");
    const calendar = page.locator(".miro-chair-calendar");
    await calendar.getByRole("radio", { name: "Week", exact: true }).click();
    await expect(calendar.getByRole("radio", { name: "Week", exact: true })).toBeChecked();
    await calendar.getByRole("radio", { name: "Day", exact: true }).click();
    await expect(calendar.getByRole("radio", { name: "Day", exact: true })).toBeChecked();
    const nav = await navigation(page, width);
    const mini = nav.locator(".miro-mini-calendar");
    const beforeMonth = await mini.locator(".rdp-caption_label").innerText();
    await mini.getByRole("button", { name: /next month/i }).click();
    await expect(mini.locator(".rdp-caption_label")).not.toHaveText(beforeMonth);
    await mini.getByRole("button", { name: /previous month/i }).click();
    await expect(mini.locator(".rdp-caption_label")).toHaveText(beforeMonth);
    await closeNavigation(page, width);

    await navigate(page, width, "Dashboard", "/dashboard");
    await boundedPlot(chart.procedure);
    await hoverProcedure(chart.procedure, 7);
    const profileNav = await navigation(page, width);
    await profileNav.getByRole("button", { name: /^Open profile for / }).click();
    const menu = page.locator('.miro-account-menu[role="menu"]');
    await menu.getByRole("menuitem", { name: "My Profile", exact: true }).click();
    await expect(menu).toBeHidden();
    await route(page, "/settings");
    if (width === 390) await expect(profileNav).toBeVisible();
    await closeNavigation(page, width);
    await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("Mara Ellis");
    await navigate(page, width, "Dashboard", "/dashboard");
    const returned = {
      procedure: await boundedPlot(chart.procedure),
      volume: await boundedPlot(chart.volume),
    };
    await hoverProcedure(chart.procedure, 0);
    await hoverMonth(page, chart.volume, 11);
    await expect(chart.procedure).toContainText("● Completed　● Scheduled");
    await expect(chart.volume).toContainText("+12.8%");
    await evidence(page, info, `plots-${width}-route-views-restored`, { returned, beforeMonth });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
