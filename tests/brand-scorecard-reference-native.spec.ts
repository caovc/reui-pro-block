import { expect as baseExpect, test, type Locator, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  createMerchBook,
  reviewMonths,
} from "../src/blocks/data/grid-advanced-merch-review-model.ts";

const expect = baseExpect.configure({ timeout: 5000 });
test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ colorScheme: "light", deviceScaleFactor: 1, actionTimeout: 5000, trace: "on" });
const metrics = [
  "netCents",
  "profitCents",
  "marginBps",
  "attainmentBps",
  "soldUnits",
  "returnBps",
  "sellThroughBps",
  "coverWeeks",
];
const labels = [
  "Net sales",
  "Gross profit",
  "Gross margin",
  "Sales to plan",
  "Units kept",
  "Return rate",
  "Sell-through",
  "Stock cover",
];
const brands = ["bracken", "fieldnote", "mossvale", "northfork"];
const faults = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  faults.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }, info) => {
  await info.attach("brand-runtime-faults", {
    body: JSON.stringify(faults.get(page)),
    contentType: "application/json",
  });
  expect(faults.get(page)).toEqual([]);
});

async function open(
  page: Page,
  baseURL: string | undefined,
  primitive: "radix" | "base",
  width: number,
  style: "nova" | "sera",
) {
  if (!baseURL) throw new Error("A frozen Brand25 preview is required");
  const origin = new URL("./", baseURL);
  if (origin.pathname.endsWith("/base/")) origin.pathname = origin.pathname.slice(0, -5);
  const entry = new URL(primitive === "base" ? "base/" : "./", origin);
  const query = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 });
  await page.goto(`${entry}#/preview/data-grid/advanced/data-grid-advanced-25?${query}`);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  const root = page.locator('[data-merch-review="brand-scorecard"]');
  await expect(
    root
      .locator('[data-slot="frame-panel-title"]')
      .filter({ hasText: /^Brand trading scorecard$/ }),
  ).toBeVisible();
  await expect(root.locator('[data-slot="data-grid-table"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return root;
}

async function bodySnapshot(root: Locator) {
  return root.locator("tbody tr[data-row-id]").evaluateAll((rows) =>
    rows.map((row) => ({
      id: row.getAttribute("data-row-id"),
      cells: Array.from((row as HTMLTableRowElement).cells, (cell) => cell.textContent?.trim()),
    })),
  );
}
async function geometry(root: Locator) {
  return root.evaluate((node) => {
    const table = node.querySelector<HTMLTableElement>('[data-slot="data-grid-table"]')!;
    const viewport = table.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')!;
    const rect = (element: Element) => {
      const box = element.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        right: box.right,
        bottom: box.bottom,
      };
    };
    const bounds = rect(viewport);
    return {
      viewport: {
        ...bounds,
        clientWidth: viewport.clientWidth,
        clientHeight: viewport.clientHeight,
        scrollWidth: viewport.scrollWidth,
        scrollHeight: viewport.scrollHeight,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
      },
      table: rect(table),
      documentWidth: document.documentElement.scrollWidth,
      pageScroll: { x: scrollX, y: scrollY },
      headerIds: Array.from(
        table.querySelectorAll<HTMLTableCellElement>("th[data-col-id]"),
        (cell) => cell.dataset.colId,
      ),
      rows: Array.from(
        table.querySelectorAll<HTMLTableRowElement>("tbody tr[data-row-id]"),
        (row) => {
          const box = rect(row);
          const cell = row.cells[0];
          const label = cell.querySelector("strong")!;
          const range = document.createRange();
          range.selectNodeContents(label);
          return {
            ...box,
            id: row.dataset.rowId,
            label: label.textContent?.trim(),
            cell: rect(cell),
            labelBox: rect(label),
            lineBoxes: Array.from(range.getClientRects(), (r) => ({
              x: r.x,
              y: r.y,
              right: r.right,
              bottom: r.bottom,
            })),
            fullyVisible:
              box.y >= Math.max(0, bounds.y) - 0.5 &&
              box.bottom <= Math.min(innerHeight, bounds.bottom) + 0.5,
          };
        },
      ),
    };
  });
}
// Preserve every rendered SVG attribute and paint value. Only the two proven
// Recharts/React-generated ID families receive stable, reference-aware names.
async function renderedPlot(plot: Locator) {
  return plot.evaluate((node) => {
    const svg = node.querySelector<SVGSVGElement>("svg.recharts-surface");
    if (!svg) throw new Error("Rendered plot SVG is required");
    const elements = [svg, ...svg.querySelectorAll("*")];
    const ids = new Map(
      elements
        .filter((element) => /^recharts\d+-clip$|^recharts-bar-_[a-zA-Z0-9:_-]+$/.test(element.id))
        .map((element, index) => [element.id, `generated-${index}`]),
    );
    const reference = (value: string) =>
      value.replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (full, _quote, url: string) => {
        const id = url.slice(url.lastIndexOf("#") + 1);
        return ids.has(id) ? `url(#${ids.get(id)})` : full;
      });
    const attribute = (name: string, value: string) => {
      if (name === "id" && ids.has(value)) return ids.get(value)!;
      if (["href", "xlink:href"].includes(name) && value.startsWith("#") && ids.has(value.slice(1)))
        return `#${ids.get(value.slice(1))}`;
      if (["aria-labelledby", "aria-describedby"].includes(name))
        return value
          .split(/\s+/)
          .map((id) => ids.get(id) ?? id)
          .join(" ");
      return reference(value);
    };
    const box = (element: Element) => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const paint = [
      "fill",
      "fill-opacity",
      "fill-rule",
      "stroke",
      "stroke-width",
      "stroke-opacity",
      "stroke-dasharray",
      "stroke-dashoffset",
      "opacity",
      "filter",
      "clip-path",
      "transform",
      "transform-origin",
      "shape-rendering",
      "vector-effect",
      "display",
      "visibility",
      "font-family",
      "font-size",
      "font-weight",
      "letter-spacing",
    ];
    return {
      box: box(node),
      svgBox: box(svg),
      label: node.getAttribute("aria-label"),
      fonts: document.fonts.status,
      nodes: elements.map((element) => ({
        tag: element.localName,
        attributes: Object.fromEntries(
          [...element.attributes]
            .map((attr) => [attr.name, attribute(attr.name, attr.value)])
            .sort(([a], [b]) => a.localeCompare(b)),
        ),
        text: element.children.length ? null : element.textContent,
        paint: Object.fromEntries(
          paint.map((property) => [
            property,
            reference(getComputedStyle(element).getPropertyValue(property)),
          ]),
        ),
      })),
    };
  });
}

async function exported(page: Page, root: Locator) {
  const waiting = page.waitForEvent("download");
  await root.getByRole("button", { name: "Export scorecard", exact: true }).click();
  const file = await (await waiting).path();
  if (!file) throw new Error("CSV download did not produce a file");
  return readFile(file, "utf8");
}
async function actualScroll(page: Page, root: Locator, phone: boolean) {
  const viewport = root
    .locator('[data-slot="data-grid-scroll-area"] [data-slot="scroll-area-viewport"]')
    .first();
  const before = await viewport.evaluate((element) => ({
    left: element.scrollLeft,
    max: element.scrollWidth - element.clientWidth,
    width: element.clientWidth,
  }));
  if (phone) expect(before.max).toBeGreaterThan(100);
  if (before.max > 1) {
    const direction = before.max - before.left >= before.left ? 1 : -1;
    const available = direction > 0 ? before.max - before.left : before.left;
    await viewport.hover({ position: { x: Math.min(220, before.width - 12), y: 120 } });
    await page.mouse.wheel(direction * 900, 0);
    await expect
      .poll(() =>
        viewport.evaluate((element, start) => Math.abs(element.scrollLeft - start), before.left),
      )
      .toBeGreaterThan(Math.min(80, available / 2));
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    page.viewportSize()!.width,
  );
  return { before, after: await viewport.evaluate((element) => element.scrollLeft) };
}

for (const primitive of ["radix", "base"] as const) {
  for (const { width, style } of [
    { width: 390, style: "nova" },
    { width: 1440, style: "nova" },
    { width: 320, style: "sera" },
  ] as const) {
    test(`Brand25 ${primitive} ${style} ${width}px preserves real metrics across rendered Months and Styles`, async ({
      page,
      baseURL,
    }, info) => {
      const root = await open(page, baseURL, primitive, width, style);
      const initial = await geometry(root);
      await info.attach("brand-initial-layout", {
        body: JSON.stringify(initial, null, 2),
        contentType: "application/json",
      });
      await page.screenshot({ path: info.outputPath("brand-initial.png") });
      const before = await bodySnapshot(root);
      expect(before.map((row) => row.id)).toEqual(metrics);
      expect(initial.headerIds.filter((id) => brands.includes(id || ""))).toEqual(brands);
      expect(initial.rows.map((row) => row.label)).toEqual(labels);
      expect(initial.documentWidth).toBe(width);
      expect(initial.viewport.x).toBeGreaterThanOrEqual(0);
      expect(initial.viewport.right).toBeLessThanOrEqual(width);
      expect(initial.rows.filter((row) => row.fullyVisible).length).toBeGreaterThanOrEqual(
        style === "sera" ? 4 : 8,
      );
      for (const row of initial.rows) {
        for (const line of row.lineBoxes) {
          expect(line.x).toBeGreaterThanOrEqual(row.cell.x - 0.5);
          expect(line.right).toBeLessThanOrEqual(row.cell.right + 0.5);
          expect(line.y).toBeGreaterThanOrEqual(row.y - 0.5);
          expect(line.bottom).toBeLessThanOrEqual(row.bottom + 0.5);
        }
      }
      const months = root.getByRole("button", { name: "Months", exact: true });
      const styles = root.getByRole("button", { name: "Styles", exact: true });
      await expect(months).toHaveAttribute("aria-pressed", "true");
      await expect(styles).toHaveAttribute("aria-pressed", "false");
      await expect(root.getByRole("combobox", { name: "Chart metric", exact: true })).toContainText(
        "Weekly net sales ranges",
      );
      const firstHeader = root.locator('th[data-col-id="bracken"]');
      const range = firstHeader.getByRole("img", { name: /Bracken & Co trading range/ });
      await expect(range).toBeVisible();
      await expect(range.locator("svg.recharts-surface")).toBeVisible();
      const originalAria = await range.getAttribute("aria-label");
      await months.hover();
      const originalPlot = await range.screenshot();
      const originalGeometry = await renderedPlot(range);
      await info.attach("brand-original-months-plot", {
        body: originalPlot,
        contentType: "image/png",
      });
      const originalHash = createHash("sha256").update(originalPlot).digest("hex");
      const csvBefore = await exported(page, root);
      await styles.click();
      await expect(styles).toHaveAttribute("aria-pressed", "true");
      await expect(months).toHaveAttribute("aria-pressed", "false");
      await expect(styles).toBeFocused();
      expect(await bodySnapshot(root)).toEqual(before);
      expect((await geometry(root)).headerIds).toEqual(initial.headerIds);
      const profitPlot = firstHeader.getByRole("img", {
        name: /^Bracken & Co: Recorded gross profit by product line\./,
      });
      await expect(profitPlot).toBeVisible();
      await expect(profitPlot.locator("svg.recharts-surface")).toBeVisible();
      const stylesPlot = await profitPlot.screenshot();
      await page.screenshot({ path: info.outputPath("brand-styles-page.png") });
      const stylesGeometry = await renderedPlot(profitPlot);
      expect(stylesGeometry.nodes).not.toEqual(originalGeometry.nodes);
      await info.attach("brand-styles-plot", { body: stylesPlot, contentType: "image/png" });
      const stylesHash = createHash("sha256").update(stylesPlot).digest("hex");
      expect(stylesHash).not.toBe(originalHash);
      const selectedMonths = reviewMonths.slice(-12);
      const originalBook = createMerchBook();
      const product = originalBook.lines.find(
        (line) => line.brandId === "bracken" && line.name === "Storage basket",
      )!;
      expect(product).toBeDefined();
      const profitCents = product.months
        .filter((record) => selectedMonths.includes(record.month))
        .reduce(
          (total, record) =>
            total +
            record.grossCents -
            record.discountCents -
            record.returnedCents -
            record.costCents,
          0,
        );
      expect(Number.isSafeInteger(profitCents)).toBe(true);
      const expectedProfit = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(profitCents / 100);
      await expect(profitPlot).toHaveAttribute(
        "aria-label",
        new RegExp(`${product.name}: ${expectedProfit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      );
      const point = profitPlot
        .locator("circle")
        .filter({ has: page.locator("title", { hasText: /^Storage basket$/ }) });
      await expect(point).toHaveCount(1);
      await expect(point).toHaveAttribute("data-point-id", product.id);
      const pointTarget = await point.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        const tracked = element as Element & { brandPointer?: Promise<boolean> };
        tracked.brandPointer = new Promise((resolve) => {
          element.addEventListener("pointerenter", (event) => resolve(event.isTrusted), {
            once: true,
          });
        });
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          centerHit: !!target && (target === element || element.contains(target)),
        };
      });
      expect(pointTarget.centerHit).toBe(true);
      await point.hover();
      const trustedPointer = await point.evaluate(
        (element) => (element as Element & { brandPointer?: Promise<boolean> }).brandPointer,
      );
      expect(trustedPointer).toBe(true);
      const tooltip = page.locator(".brand-scorecard-point-tooltip");
      await expect(tooltip).toHaveCount(1);
      await expect(tooltip).toHaveAttribute("data-point-id", product.id);
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText(product.name);
      await expect(tooltip).toContainText(expectedProfit);
      await expect
        .poll(() => tooltip.evaluate((element) => getComputedStyle(element).opacity))
        .toBe("1");
      const tooltipPaint = await pointTooltipPaint(tooltip, [product.name, expectedProfit]);
      await info.attach("brand-point-tooltip-paint", {
        body: JSON.stringify({ pointTarget, trustedPointer, ...tooltipPaint }, null, 2),
        contentType: "application/json",
      });
      expect(tooltipPaint.fields.map((field) => field.text).sort()).toEqual(
        [product.name, expectedProfit].sort(),
      );
      for (const field of tooltipPaint.fields) {
        expect(field.painted).toBe(true);
        for (const textBox of field.boxes) {
          expect(textBox.x).toBeGreaterThanOrEqual(0);
          expect(textBox.right).toBeLessThanOrEqual(tooltipPaint.viewport.width);
          expect(textBox.y).toBeGreaterThanOrEqual(0);
          expect(textBox.bottom).toBeLessThanOrEqual(tooltipPaint.viewport.height);
          for (const clip of field.clips) {
            if (clip.x) {
              expect(textBox.x).toBeGreaterThanOrEqual(clip.box.x - 0.5);
              expect(textBox.right).toBeLessThanOrEqual(clip.box.right + 0.5);
            }
            if (clip.y) {
              expect(textBox.y).toBeGreaterThanOrEqual(clip.box.y - 0.5);
              expect(textBox.bottom).toBeLessThanOrEqual(clip.box.bottom + 0.5);
            }
          }
        }
      }
      await page.screenshot({ path: info.outputPath("brand-product-tooltip-page.png") });
      await info.attach("brand-original-product-profit", {
        body: JSON.stringify({
          product: product.name,
          selectedMonths,
          profitCents,
          expectedProfit,
        }),
        contentType: "application/json",
      });

      expect(await exported(page, root)).toBe(csvBefore);
      const scroll = await actualScroll(page, root, width < 640);
      if (scroll.before.max > 1) {
        const viewport = root
          .locator('[data-slot="data-grid-scroll-area"] [data-slot="scroll-area-viewport"]')
          .first();
        await viewport.hover({ position: { x: Math.min(220, scroll.before.width - 12), y: 120 } });
        await page.mouse.wheel(scroll.after > scroll.before.left ? -900 : 900, 0);
        await expect
          .poll(() => viewport.evaluate((element) => element.scrollLeft))
          .toBe(scroll.before.left);
      }
      await months.press("Enter");
      await expect(months).toHaveAttribute("aria-pressed", "true");
      await expect(styles).toHaveAttribute("aria-pressed", "false");
      await expect(months).toBeFocused();
      expect(await bodySnapshot(root)).toEqual(before);
      expect((await geometry(root)).headerIds).toEqual(initial.headerIds);
      await expect(range).toHaveAttribute("aria-label", originalAria!);
      await months.hover();
      const restoredPlot = await range.screenshot();
      const restoredHash = createHash("sha256").update(restoredPlot).digest("hex");
      const restoredGeometry = await renderedPlot(range);
      await info.attach("brand-restored-months-plot", {
        body: restoredPlot,
        contentType: "image/png",
      });
      await info.attach("brand-exact-rendered-plot", {
        body: JSON.stringify({ originalGeometry, restoredGeometry }, null, 2),
        contentType: "application/json",
      });
      expect(restoredGeometry).toEqual(originalGeometry);
      await months.press("ArrowRight");
      await expect(styles).toBeFocused();
      await expect(months).toHaveAttribute("aria-pressed", "true");
      await styles.press("Space");
      await expect(styles).toHaveAttribute("aria-pressed", "true");
      expect(await bodySnapshot(root)).toEqual(before);
      await styles.press("ArrowLeft");
      await expect(months).toBeFocused();
      await months.press("Space");
      await expect(months).toHaveAttribute("aria-pressed", "true");
      await months.press("Space");
      await expect(months).toHaveAttribute("aria-pressed", "true");
      await expect(styles).toHaveAttribute("aria-pressed", "false");
      expect(await bodySnapshot(root)).toEqual(before);
      await expect(range).toHaveAttribute("aria-label", originalAria!);
      if (initial.viewport.scrollHeight > initial.viewport.clientHeight + 1) {
        const last = root.locator('tbody tr[data-row-id="coverWeeks"]');
        const viewport = root
          .locator('[data-slot="data-grid-scroll-area"] [data-slot="scroll-area-viewport"]')
          .first();
        await viewport.hover({ position: { x: 30, y: 250 } });
        await page.mouse.wheel(0, 900);
        await expect
          .poll(() =>
            last.evaluate((row) => {
              const r = row.getBoundingClientRect();
              const viewport = row
                .closest('[data-slot="scroll-area-viewport"]')!
                .getBoundingClientRect();
              return (
                r.top >= Math.max(0, viewport.top) &&
                r.bottom <= Math.min(innerHeight, viewport.bottom) + 1
              );
            }),
          )
          .toBe(true);
      }
      await info.attach("brand-mode-plot-proof", {
        body: JSON.stringify({
          originalHash,
          stylesHash,
          restoredHash,
          originalAria,
          scroll,
          body: before,
        }),
        contentType: "application/json",
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    });
  }
}

async function pointTooltipPaint(tooltip: Locator, labels: string[]) {
  return tooltip.evaluate((element, labels) => {
    const rect = (box: DOMRect) => ({
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      right: box.right,
      bottom: box.bottom,
    });
    const fields = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const label = text.textContent?.trim() || "";
      if (!labels.includes(label)) continue;
      let accessibilityCopy = false;
      let painted = true;
      const clips = [];
      for (let parent = text.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        const box = parent.getBoundingClientRect();
        // Native Radix Tooltip repeats its text in a one-pixel clipped
        // accessibility description. Inspect the actual painted copy.
        if (
          box.width <= 1 &&
          box.height <= 1 &&
          (style.overflow === "hidden" || style.clip !== "auto")
        )
          accessibilityCopy = true;
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) === 0
        )
          painted = false;
        const x = /^(hidden|clip|scroll|auto)$/.test(style.overflowX);
        const y = /^(hidden|clip|scroll|auto)$/.test(style.overflowY);
        if (x || y) {
          const left = box.left + parent.clientLeft;
          const top = box.top + parent.clientTop;
          clips.push({
            tag: parent.tagName,
            className: parent.className,
            x,
            y,
            box: {
              x: left,
              y: top,
              right: left + parent.clientWidth,
              bottom: top + parent.clientHeight,
            },
          });
        }
      }
      if (accessibilityCopy) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      fields.push({ text: label, painted, boxes: Array.from(range.getClientRects(), rect), clips });
    }
    return {
      box: rect(element.getBoundingClientRect()),
      viewport: { width: innerWidth, height: innerHeight },
      fields,
    };
  }, labels);
}
