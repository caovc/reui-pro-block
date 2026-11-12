import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });

const rows = [
  ["Accessories", 11],
  ["Activewear", 14],
  ["Apparel", 15],
  ["Bags", 15],
  ["Denim", 12],
  ["Footwear", 10],
  ["Outerwear", 17],
] as const;
const threatRows = [
  ["Bot", 41, 75],
  ["Phish", 36, 89],
  ["DDoS", 62, 40],
  ["Inject", 27, 58],
  ["Auth", 52, 82],
  ["Probe", 22, 70],
  ["Exfil", 67, 42],
  ["Beacon", 45, 77],
  ["Day0", 17, 34],
] as const;
const faults = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  faults.set(page, messages);
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
});

test.afterEach(async ({ page }, info) => {
  await info.attach("runtime-faults", {
    body: JSON.stringify(faults.get(page) ?? [], null, 2),
    contentType: "application/json",
  });
  if (!page.isClosed() && info.status !== info.expectedStatus) {
    await page.screenshot({ path: info.outputPath("first-failure.png"), animations: "allow" });
  }
  expect(faults.get(page)).toEqual([]);
});

async function open(
  page: Page,
  template: "manifest" | "surge",
  width: number,
  entryPrefix: string,
) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`${entryPrefix}/#/template-preview/${template}`);
  if (template === "manifest") {
    await page.getByRole("button", { name: "Log in", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: /^Welcome to / })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${entryPrefix}/#/template-preview/${template}`));
  await expect(page).toHaveTitle(/Bricklane/);
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const card = page.getByRole("region", { name: "Inventory velocity", exact: true });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("svg.recharts-surface")).toBeVisible();
  return card;
}

async function readout(card: Locator, category: string, units: number) {
  const popup = card.locator(".recharts-tooltip-wrapper");
  await expect(popup).toBeVisible();
  await expect(popup.getByText(category, { exact: true })).toBeVisible();
  await expect(popup.getByText("Units", { exact: true })).toBeVisible();
  await expect(popup.getByText(String(units), { exact: true })).toBeVisible();
}

async function tickGeometry(card: Locator) {
  return card
    .locator(".recharts-xAxis-tick-labels text.recharts-cartesian-axis-tick-value")
    .evaluateAll((ticks) =>
      ticks.map((tick) => {
        const rect = tick.getBoundingClientRect();
        return { label: tick.textContent, x: rect.x, right: rect.right, width: rect.width };
      }),
    );
}

for (const { name, entryPrefix } of [
  { name: "Radix", entryPrefix: "" },
  { name: "Base", entryPrefix: "/base" },
]) {
  test.describe(name, () => {
    for (const width of [390, 1440]) {
      test(`Manifest inventory velocity ${width}: readable ticks and all seven accessible bars`, async ({
        page,
      }, info) => {
        const card = await open(page, "manifest", width, entryPrefix);
        const container = card.locator('[data-slot="chart"]');
        const surface = card.locator("svg.recharts-surface");
        const bars = card.locator(".recharts-bar-rectangle path.recharts-rectangle");
        const plot = card.locator(".bt-rechart");
        await expect(container).toHaveCount(1);
        await expect(bars).toHaveCount(rows.length);
        await expect(plot).toHaveCSS("height", width === 390 ? "320px" : "369.5px");
        await expect
          .poll(async () => {
            const [outer, inner] = await Promise.all([plot.boundingBox(), surface.boundingBox()]);
            if (!outer || !inner) return Infinity;
            return Math.max(
              Math.abs(outer.width - inner.width),
              Math.abs(outer.height - inner.height),
            );
          })
          .toBeLessThanOrEqual(1);

        if (width === 390) {
          await expect.poll(async () => (await tickGeometry(card)).length).toBeGreaterThan(1);
          await expect
            .poll(async () => (await tickGeometry(card)).length)
            .toBeLessThan(rows.length);
        } else {
          await expect.poll(async () => (await tickGeometry(card)).length).toBe(rows.length);
        }
        const ticks = await tickGeometry(card);
        expect(ticks.length).toBeGreaterThan(1);
        const sorted = [...ticks].sort((left, right) => left.x - right.x);
        for (let index = 1; index < sorted.length; index++) {
          expect(
            sorted[index].x - sorted[index - 1].right,
            "category labels must not collide",
          ).toBeGreaterThanOrEqual(1);
        }
        const box = await container.boundingBox();
        expect(box).not.toBeNull();
        for (const tick of ticks) {
          expect(tick.width).toBeGreaterThan(0);
          expect(tick.x).toBeGreaterThanOrEqual(box!.x - 1);
          expect(tick.right).toBeLessThanOrEqual(box!.x + box!.width + 1);
        }
        if (width === 1440)
          expect(ticks.map((tick) => tick.label)).toEqual(rows.map(([name]) => name));
        for (const [index, [category, units]] of rows.entries()) {
          await expect(bars.nth(index)).toHaveAccessibleName(`${category}: ${units} units`);
          const bar = await bars.nth(index).boundingBox();
          expect(bar?.width).toBeGreaterThan(0);
          expect(bar?.height).toBeGreaterThan(0);
        }

        // Native chart focus and arrow navigation must retain categories omitted from the axis.
        await surface.focus();
        await expect(surface).toBeFocused();
        for (const [index, [category, units]] of rows.entries()) {
          if (index > 0) await page.keyboard.press("ArrowRight");
          await readout(card, category, units);
        }
        await page.keyboard.press("ArrowLeft");
        await readout(card, rows[5][0], rows[5][1]);
        await page.keyboard.press("Tab");
        for (const [index, [category, units]] of rows.entries()) {
          await bars.nth(index).hover();
          await readout(card, category, units);
        }
        await page.mouse.move(0, 0);
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
          .toBeLessThanOrEqual(0);
        await info.attach(`manifest-velocity-${width}-geometry`, {
          body: JSON.stringify(
            {
              viewport: width,
              ticks,
              rows,
              container: box,
              plot: await plot.boundingBox(),
              surface: await surface.boundingBox(),
            },
            null,
            2,
          ),
          contentType: "application/json",
        });
        await card.screenshot({
          path: info.outputPath(`manifest-velocity-${width}.png`),
          animations: "allow",
        });
      });
    }

    test("Surge retains its default seven-tick chart and native tooltip", async ({ page }) => {
      const card = await open(page, "surge", 390, entryPrefix);
      const bars = card.locator(".recharts-bar-rectangle path.recharts-rectangle");
      await expect(card.locator('[data-slot="chart"]')).toHaveCount(0);
      await expect(bars).toHaveCount(rows.length);
      await expect.poll(async () => (await tickGeometry(card)).length).toBe(rows.length);
      expect((await tickGeometry(card)).map((tick) => tick.label)).toEqual(
        rows.map(([name]) => name),
      );
      await bars.first().hover();
      const popup = card.locator(".recharts-tooltip-wrapper");
      await expect(popup).toBeVisible();
      await expect(popup.getByText("Accessories", { exact: true })).toBeVisible();
      await expect(popup.getByText("12", { exact: true })).toBeVisible();
    });

    for (const width of [390, 1440]) {
      test(`Atlas Threat Vectors ${width}: readable ticks and all nine categories in both series`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.goto(`${entryPrefix}/#/template-preview/atlas`);
        await expect(page.locator(".bt-atlas")).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`${entryPrefix}/#/template-preview/atlas`));
        await expect(page).toHaveTitle(/Bricklane/);
        await expect(page.locator("vite-error-overlay")).toHaveCount(0);
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        const card = page
          .locator(".bt-panel")
          .filter({ has: page.getByText("Threat Vectors", { exact: true }) });
        await expect(card).toHaveCount(1);
        await card.scrollIntoViewIfNeeded();
        const container = card.locator('[data-slot="chart"]');
        await expect(container).toHaveCount(1);
        const surface = card.locator("svg.recharts-surface");
        await expect(surface).toBeVisible();
        const plot = card.locator(".bt-rechart");
        await expect(plot).toHaveCSS("height", "218px");
        await expect
          .poll(async () => {
            const [outer, inner] = await Promise.all([plot.boundingBox(), surface.boundingBox()]);
            if (!outer || !inner) return Infinity;
            return Math.max(
              Math.abs(outer.width - inner.width),
              Math.abs(outer.height - inner.height),
            );
          })
          .toBeLessThanOrEqual(1);
        if (width === 390) {
          await expect.poll(async () => (await tickGeometry(card)).length).toBeGreaterThan(1);
          await expect
            .poll(async () => (await tickGeometry(card)).length)
            .toBeLessThan(threatRows.length);
        } else {
          await expect.poll(async () => (await tickGeometry(card)).length).toBe(threatRows.length);
        }
        const ticks = await tickGeometry(card);
        expect(ticks.length).toBeGreaterThan(1);
        const sorted = [...ticks].sort((left, right) => left.x - right.x);
        for (let index = 1; index < sorted.length; index++) {
          expect(sorted[index].x - sorted[index - 1].right).toBeGreaterThanOrEqual(1);
        }
        const box = await container.boundingBox();
        expect(box).not.toBeNull();
        for (const tick of ticks) {
          expect(tick.width).toBeGreaterThan(0);
          expect(tick.x).toBeGreaterThanOrEqual(box!.x - 1);
          expect(tick.right).toBeLessThanOrEqual(box!.x + box!.width + 1);
        }
        if (width === 1440) {
          expect(ticks.map((tick) => tick.label)).toEqual(threatRows.map(([name]) => name));
        }
        const blocked = card.locator(".recharts-bar").first().locator("path.recharts-rectangle");
        const watched = card.locator(".recharts-bar").nth(1).locator("path.recharts-rectangle");
        await expect(blocked).toHaveCount(threatRows.length);
        await expect(watched).toHaveCount(threatRows.length);
        const popup = card.locator(".recharts-tooltip-wrapper");
        const threatReadout = async (
          category: string,
          blockedValue: number,
          watchedValue: number,
        ) => {
          await expect(popup).toBeVisible();
          await expect(popup.getByText(category, { exact: true })).toBeVisible();
          for (const [name, value] of [
            ["Blocked", blockedValue],
            ["Watched", watchedValue],
          ] as const) {
            const row = popup
              .locator(":scope > div > div > div")
              .filter({ has: page.getByText(name, { exact: true }) });
            await expect(row.getByText(String(value), { exact: true })).toBeVisible();
          }
        };
        await surface.focus();
        await expect(surface).toBeFocused();
        for (const [index, [category, blockedValue, watchedValue]] of threatRows.entries()) {
          if (index > 0) await page.keyboard.press("ArrowRight");
          await threatReadout(category, blockedValue, watchedValue);
          await expect(blocked.nth(index)).toHaveAccessibleName(
            `${category}: ${blockedValue} Blocked`,
          );
          await expect(watched.nth(index)).toHaveAccessibleName(
            `${category}: ${watchedValue} Watched`,
          );
          for (const series of [blocked, watched]) {
            const bar = await series.nth(index).boundingBox();
            expect(bar).not.toBeNull();
            expect(bar!.width).toBeGreaterThan(0);
            expect(bar!.height).toBeGreaterThan(0);
            expect(bar!.x).toBeGreaterThanOrEqual(box!.x - 1);
            expect(bar!.x + bar!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
            expect(bar!.y).toBeGreaterThanOrEqual(box!.y - 1);
            expect(bar!.y + bar!.height).toBeLessThanOrEqual(box!.y + box!.height + 1);
          }
        }
        await page.keyboard.press("Tab");
        for (const [index, [category, blockedValue, watchedValue]] of threatRows.entries()) {
          for (const series of [blocked, watched]) {
            await series.nth(index).hover();
            await threatReadout(category, blockedValue, watchedValue);
          }
        }
        await page.mouse.move(0, 0);
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
          .toBeLessThanOrEqual(0);
        await info.attach(`atlas-threat-vectors-${width}-geometry`, {
          body: JSON.stringify(
            {
              viewport: width,
              ticks,
              rows: threatRows,
              container: box,
              plot: await plot.boundingBox(),
              surface: await surface.boundingBox(),
            },
            null,
            2,
          ),
          contentType: "application/json",
        });
        await card.screenshot({
          path: info.outputPath(`atlas-threat-vectors-${width}.png`),
          animations: "allow",
        });
      });
    }
  });
}
