import { expect as baseExpect, test, type Locator, type Page } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 5000 });
test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ colorScheme: "light", deviceScaleFactor: 1, actionTimeout: 5000, trace: "on" });

const products = ["Table linen", "Stoneware set", "Glass carafe", "Storage basket"];
const months = [
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
];
const faults = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  faults.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }, info) => {
  await info.attach("category-runtime-faults", {
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
) {
  if (!baseURL) throw new Error("An immutable preview artifact is required");
  const origin = new URL("./", baseURL);
  if (origin.pathname.endsWith("/base/")) origin.pathname = origin.pathname.slice(0, -5);
  const entry = new URL(primitive === "base" ? "base/" : "./", origin);
  const query = new URLSearchParams({
    preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  const target = `${entry}#/preview/data-grid/advanced/data-grid-advanced-24?${query}`;
  if (page.url() === target) await page.reload();
  else await page.goto(target);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", "nova");
  const root = page.locator('[data-merch-review="category-margin"]');
  await expect(
    root
      .locator('[data-slot="frame-panel-title"]')
      .filter({ hasText: /^Category margin workbench$/ }),
  ).toBeVisible();
  await expect(root.locator('[data-slot="data-grid-table"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return root;
}

async function initialGeometry(root: Locator) {
  return root.evaluate((node, names) => {
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
    const viewportBox = rect(viewport);
    const visibleTop = Math.max(0, viewportBox.y);
    const visibleBottom = Math.min(innerHeight, viewportBox.bottom);
    const rows = Array.from(
      table.querySelectorAll<HTMLTableRowElement>("tbody tr[data-row-id]"),
    ).map((row) => {
      const box = rect(row);
      const first = row.cells[0];
      const label = Array.from(first.querySelectorAll("button"))
        .map((button) => button.textContent?.trim())
        .find((text) => names.includes(text || ""));
      return {
        ...box,
        label: label || first.textContent?.trim(),
        product: !!label,
        fullyVisible: box.y >= visibleTop - 0.5 && box.bottom <= visibleBottom + 0.5,
        readings: Array.from(
          row.querySelectorAll<HTMLButtonElement>('button[aria-label*="gross margin"]'),
        ).map((button) => ({ label: button.getAttribute("aria-label"), text: button.innerText })),
      };
    });
    const monthHeaders = Array.from(
      table.querySelectorAll<HTMLTableCellElement>("thead th[data-col-id]"),
    ).filter((cell) => /^\d{4}-\d{2}$/.test(cell.dataset.colId || ""));
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      pageScroll: { x: scrollX, y: scrollY },
      current: node
        .querySelector('[aria-label="Margin drill path"] [aria-current="page"]')
        ?.textContent?.trim(),
      table: rect(table),
      viewport: {
        ...viewportBox,
        clientWidth: viewport.clientWidth,
        scrollWidth: viewport.scrollWidth,
        scrollLeft: viewport.scrollLeft,
      },
      header: rect(table.tHead!.rows[table.tHead!.rows.length - 1]),
      monthIds: monthHeaders.map((cell) => cell.dataset.colId),
      monthLabels: monthHeaders.map((cell) => cell.textContent?.trim()),
      rows,
    };
  }, products);
}

async function nativeHorizontalScroll(page: Page, root: Locator, required = true) {
  const viewport = root
    .locator('[data-slot="data-grid-scroll-area"] [data-slot="scroll-area-viewport"]')
    .first();
  const before = await viewport.evaluate((element) => ({
    scrollLeft: element.scrollLeft,
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  const overflow = before.scrollWidth - before.width;
  if (required) expect(overflow).toBeGreaterThan(100);
  if (overflow > 1) {
    const remaining = overflow - before.scrollLeft;
    const direction = remaining > 1 ? 1 : -1;
    const available = direction > 0 ? remaining : before.scrollLeft;
    await viewport.hover({ position: { x: Math.min(300, before.width - 12), y: 48 } });
    await page.mouse.wheel(direction * 900, 0);
    await expect
      .poll(() =>
        viewport.evaluate(
          (element, start) => Math.abs(element.scrollLeft - start),
          before.scrollLeft,
        ),
      )
      .toBeGreaterThan(Math.min(100, available / 2));
  } else {
    expect(required).toBe(false);
    const visibleMonths = await viewport.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return Array.from(element.querySelectorAll<HTMLTableCellElement>("th[data-col-id]"))
        .filter((cell) => /^\d{4}-\d{2}$/.test(cell.dataset.colId || ""))
        .filter((cell) => {
          const bounds = cell.getBoundingClientRect();
          return bounds.left >= box.left - 0.5 && bounds.right <= box.right + 0.5;
        })
        .map((cell) => cell.dataset.colId);
    });
    expect(visibleMonths).toEqual(months);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    page.viewportSize()!.width,
  );
  return {
    before,
    mode: overflow > 1 ? "native-scroll" : "fits",
    after: await viewport.evaluate((element) => ({
      scrollLeft: element.scrollLeft,
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
    })),
  };
}

for (const primitive of ["radix", "base"] as const) {
  test(`Advanced24 ${primitive}: Home default exposes twelve monthly readings and useful phone rows`, async ({
    page,
    baseURL,
  }, info) => {
    for (const width of [390, 1440]) {
      const root = await open(page, baseURL, primitive, width);
      const geometry = await initialGeometry(root);
      await info.attach(`category-initial-${width}`, {
        body: JSON.stringify(geometry, null, 2),
        contentType: "application/json",
      });
      await page.screenshot({ path: info.outputPath(`category-initial-${width}.png`) });
      expect.soft(geometry.current).toBe("Home");
      expect.soft(geometry.monthIds).toEqual(months);
      expect.soft(geometry.monthLabels[0]).toContain("Nov");
      expect.soft(geometry.monthLabels.at(-1)).toContain("Oct");
      expect.soft(geometry.rows).toHaveLength(5);
      expect.soft(geometry.rows[0]?.readings[0]?.label).toMatch(/^Home, Nov 25 gross margin /);
      const productRows = geometry.rows.filter((row) => row.product);
      expect.soft(productRows.map((row) => row.label)).toEqual(products);
      expect
        .soft(productRows.filter((row) => row.fullyVisible).length)
        .toBeGreaterThanOrEqual(width === 390 ? 3 : 4);
      expect.soft(productRows[0]?.fullyVisible).toBe(true);
      for (const row of geometry.rows) {
        expect.soft(row.readings).toHaveLength(12);
        for (const reading of row.readings) {
          expect
            .soft(reading.label)
            .toMatch(
              /gross margin .+; [+-]?\d+ bp on the month; [+-]?\d+ bp on the year; inspect drivers$/,
            );
          expect.soft(reading.text.match(/[+−-]?\d+(?:\.\d+)?/g)).toHaveLength(3);
        }
      }
      expect.soft(geometry.documentWidth).toBe(width);
      expect.soft(geometry.pageScroll.x).toBe(0);
      expect.soft(geometry.viewport.scrollLeft).toBe(0);
      const scroll = await nativeHorizontalScroll(page, root, width === 390);
      await info.attach(`category-native-horizontal-${width}`, {
        body: JSON.stringify(scroll),
        contentType: "application/json",
      });
    }
  });

  test(`Advanced24 ${primitive}: native root expansion and back controls preserve drill scope and query`, async ({
    page,
    baseURL,
  }, info) => {
    const root = await open(page, baseURL, primitive, 390);
    const navigation = root.getByRole("navigation", { name: "Margin drill path" });
    const home = navigation.getByRole("button", { name: "Home", exact: true });
    await expect(home).toHaveAttribute("aria-current", "page");
    await root
      .getByRole("button", { name: "Back up from Home to All departments", exact: true })
      .click();
    await expect(
      navigation.getByRole("button", { name: "All departments", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    const homeRow = root
      .getByRole("row")
      .filter({ has: page.getByRole("button", { name: "Home", exact: true }) });
    await expect(root.locator("tbody tr[data-row-id]")).toHaveCount(3);
    const expand = homeRow.getByRole("button", { name: "Expand row", exact: true });
    await expand.click();
    await expect(
      homeRow.getByRole("button", { name: "Collapse row", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(root.getByRole("button", { name: "Table linen", exact: true })).toBeVisible();
    await homeRow.getByRole("button", { name: "Collapse row", exact: true }).press("Enter");
    await expect(root.getByRole("button", { name: "Table linen", exact: true })).toHaveCount(0);
    await homeRow.getByRole("button", { name: "Actions for Home", exact: true }).click();
    await page.getByRole("menuitem", { name: "Drill into Home", exact: true }).click();
    await expect(home).toHaveAttribute("aria-current", "page");
    await expect(root.locator("tbody tr[data-row-id]")).toHaveCount(5);
    const search = root.getByRole("textbox", { name: "Search category margin", exact: true });
    await search.fill("Table linen");
    await root.getByRole("button", { name: "Table linen", exact: true }).press("Enter");
    await expect(navigation.locator('[aria-current="page"]')).toHaveText("Table linen");
    await expect(root.locator("tbody tr[data-row-id]")).toHaveCount(1);
    await expect(
      root.getByRole("button", { name: "Actions for Table linen", exact: true }),
    ).toHaveCount(1);
    await root
      .getByRole("button", { name: "Back up from Table linen to Home", exact: true })
      .press("Enter");
    await expect(home).toHaveAttribute("aria-current", "page");
    await expect(search).toHaveValue("Table linen");
    await root.getByRole("button", { name: "Table linen", exact: true }).click();
    await home.press("Enter");
    await expect(home).toHaveAttribute("aria-current", "page");
    await expect(search).toHaveValue("Table linen");
    await search.fill("");
    await expect(root.locator("tbody tr[data-row-id]")).toHaveCount(5);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await root
      .getByRole("button", { name: "Back up from Home to All departments", exact: true })
      .press("Enter");
    await root.getByRole("button", { name: "Home", exact: true }).click();
    await expect(home).toHaveAttribute("aria-current", "page");
    await expect(root.getByRole("button", { name: "Add product line", exact: true })).toBeVisible();
    await expect(
      root.getByRole("button", { name: "Export matching lines", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
    await page.screenshot({ path: info.outputPath("category-native-drill-return.png") });
  });

  test(`Advanced24 ${primitive}: Drivers keeps the real scope and returns to twelve Months columns`, async ({
    page,
    baseURL,
  }, info) => {
    for (const width of [390, 1440]) {
      const root = await open(page, baseURL, primitive, width);
      const monthMode = root.getByRole("button", { name: "Months", exact: true });
      const driverMode = root.getByRole("button", { name: "Drivers", exact: true });
      const rowIds = () =>
        root
          .locator("tbody tr[data-row-id]")
          .evaluateAll((rows) => rows.map((row) => row.getAttribute("data-row-id")));
      const initialRows = await rowIds();
      expect(initialRows).toHaveLength(5);
      await expect(monthMode).toHaveAttribute("aria-pressed", "true");
      await expect(driverMode).toHaveAttribute("aria-pressed", "false");
      if (width === 390) await driverMode.click();
      else await driverMode.press("Enter");
      await expect(driverMode).toHaveAttribute("aria-pressed", "true");
      await expect(monthMode).toHaveAttribute("aria-pressed", "false");
      expect(await rowIds()).toEqual(initialRows);
      const headerText = (await root.getByRole("columnheader").allTextContents()).join(" ");
      for (const label of [
        /Product line/i,
        /Net sales/i,
        /vs LY/i,
        /By quarter/i,
        /Cover/i,
        /Sell-through/i,
        /vs plan/i,
      ]) {
        expect(headerText).toMatch(label);
      }
      expect(
        await root
          .locator("th[data-col-id]")
          .evaluateAll(
            (cells) =>
              cells.filter((cell) => /^\d{4}-\d{2}$/.test(cell.getAttribute("data-col-id") || ""))
                .length,
          ),
      ).toBe(0);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      const driverGeometry = await initialGeometry(root);
      await info.attach(`category-drivers-${width}`, {
        body: JSON.stringify({ ...driverGeometry, rowIds: initialRows, headerText }, null, 2),
        contentType: "application/json",
      });
      await page.screenshot({ path: info.outputPath(`category-drivers-${width}.png`) });
      if (width === 390) {
        const scroll = await nativeHorizontalScroll(page, root);
        await info.attach("category-drivers-native-horizontal", {
          body: JSON.stringify(scroll),
          contentType: "application/json",
        });
      }
      if (width === 390) await monthMode.press("Enter");
      else await monthMode.click();
      await expect(monthMode).toHaveAttribute("aria-pressed", "true");
      await expect(driverMode).toHaveAttribute("aria-pressed", "false");
      expect(await rowIds()).toEqual(initialRows);
      const restored = await initialGeometry(root);
      expect(restored.monthIds).toEqual(months);
      expect(restored.current).toBe("Home");
      expect(restored.rows.every((row) => row.readings.length === 12)).toBe(true);
      await expect(
        root
          .locator('[data-slot="frame-panel-title"]')
          .filter({ hasText: /^Category margin workbench$/ }),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
  });
  test(`Advanced24 ${primitive}: Mira and small Sera keep three monthly lines and native controls readable`, async ({
    page,
    baseURL,
  }, info) => {
    for (const { style, width } of [
      { style: "mira", width: 390 },
      { style: "sera", width: 320 },
    ] as const) {
      const root = await openCategoryProfile(page, baseURL, primitive, style, width);
      const search = root.getByRole("textbox", { name: "Search category margin", exact: true });
      await search.click();
      await search.fill("Home");
      await expect(search).toBeFocused();
      await expect(search).toHaveValue("Home");
      const layout = await categoryProfileGeometry(root);
      await info.attach(`category-${style}-${width}-readable-controls`, {
        body: JSON.stringify(layout, null, 2),
        contentType: "application/json",
      });
      await page.screenshot({
        path: info.outputPath(`category-${style}-${width}-readable-controls.png`),
      });
      expect.soft(layout.documentWidth).toBe(width);
      expect
        .soft(layout.numeric.parts.flatMap((part) => part.text.match(/[+−-]?\d+(?:\.\d+)?/g) || []))
        .toHaveLength(3);
      for (const part of layout.numeric.parts) {
        for (const bounds of [layout.numeric.button, layout.numeric.cell, layout.numeric.row]) {
          expect.soft(part.box.x).toBeGreaterThanOrEqual(bounds.x - 0.5);
          expect.soft(part.box.right).toBeLessThanOrEqual(bounds.right + 0.5);
          expect.soft(part.box.y).toBeGreaterThanOrEqual(bounds.y - 0.5);
          expect.soft(part.box.bottom).toBeLessThanOrEqual(bounds.bottom + 0.5);
        }
        expect.soft(part.centerHitsMonth).toBe(true);
      }
      if (style === "sera") {
        for (const line of layout.titleLines) {
          expect.soft(line.x).toBeGreaterThanOrEqual(0);
          expect.soft(line.right).toBeLessThanOrEqual(width);
          expect.soft(line.y).toBeGreaterThanOrEqual(0);
          const overlapsModes =
            line.x < layout.modes.right &&
            line.right > layout.modes.x &&
            line.y < layout.modes.bottom &&
            line.bottom > layout.modes.y;
          expect.soft(overlapsModes).toBe(false);
        }
        expect.soft(layout.search.label).toBe("Search category margin");
        expect.soft(layout.search.box.x).toBeGreaterThanOrEqual(0);
        expect.soft(layout.search.box.right).toBeLessThanOrEqual(width);
        expect.soft(layout.search.queryWidth).toBeLessThanOrEqual(layout.search.contentWidth);
        expect.soft(layout.search.centerHit).toBe(true);
        for (const label of ["Months", "Drivers"])
          await expect(root.getByRole("button", { name: label, exact: true })).toBeVisible();
      }
      const month = root.getByRole("button", { name: /^Table linen, Nov 25 gross margin / });
      await month.click();
      const sheet = page.getByRole("dialog", { name: "Table linen", exact: true });
      await expect(
        sheet
          .locator('[data-slot="frame-panel-title"]')
          .filter({ hasText: /^Gross to net bridge$/ }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
      await expect(month).toBeFocused();
      await search.fill("");
    }
  });
}

async function openCategoryProfile(
  page: Page,
  baseURL: string | undefined,
  primitive: "radix" | "base",
  style: "mira" | "sera",
  width: number,
) {
  if (!baseURL) throw new Error("An immutable Category preview is required");
  const origin = new URL("./", baseURL);
  if (origin.pathname.endsWith("/base/")) origin.pathname = origin.pathname.slice(0, -5);
  const entry = new URL(primitive === "base" ? "base/" : "./", origin);
  const query = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  const alreadyOpen = page.url().includes("#/preview/data-grid/advanced/data-grid-advanced-24");
  await page.setViewportSize({ width, height: 844 });
  await page.goto(`${entry}#/preview/data-grid/advanced/data-grid-advanced-24?${query}`);
  if (alreadyOpen) await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  const root = page.locator('[data-merch-review="category-margin"]');
  await expect(
    root
      .locator('[data-slot="frame-panel-title"]')
      .filter({ hasText: /^Category margin workbench$/ }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return root;
}

async function categoryProfileGeometry(root: Locator) {
  return root.evaluate((node) => {
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
    const title = Array.from(node.querySelectorAll('[data-slot="frame-panel-title"]')).find(
      (element) => element.textContent === "Category margin workbench",
    )!;
    const titleRange = document.createRange();
    titleRange.selectNodeContents(title);
    const search = node.querySelector<HTMLInputElement>(
      'input[aria-label="Search category margin"]',
    )!;
    const searchStyle = getComputedStyle(search);
    const text = document.createElement("canvas").getContext("2d")!;
    text.font = `${searchStyle.fontStyle} ${searchStyle.fontWeight} ${searchStyle.fontSize} ${searchStyle.fontFamily}`;
    const spacing = Number.parseFloat(searchStyle.letterSpacing) || 0;
    const queryWidth =
      text.measureText(search.value).width + Math.max(0, search.value.length - 1) * spacing;
    const searchBox = rect(search);
    const searchHit = document.elementFromPoint(
      searchBox.x + searchBox.width / 2,
      searchBox.y + searchBox.height / 2,
    );
    const month = node.querySelector<HTMLButtonElement>(
      'button[aria-label^="Table linen, Nov 25 gross margin"]',
    )!;
    const parts: { text: string; box: ReturnType<typeof rect>; centerHitsMonth: boolean }[] = [];
    const walker = document.createTreeWalker(month, NodeFilter.SHOW_TEXT);
    for (let value = walker.nextNode(); value; value = walker.nextNode()) {
      if (!/\d/.test(value.textContent || "")) continue;
      let hidden = false;
      for (
        let parent = value.parentElement;
        parent && parent !== month;
        parent = parent.parentElement
      ) {
        const style = getComputedStyle(parent);
        if (
          parent.classList.contains("sr-only") ||
          style.display === "none" ||
          style.visibility === "hidden"
        )
          hidden = true;
      }
      if (hidden) continue;
      const range = document.createRange();
      range.selectNodeContents(value);
      const box = range.getBoundingClientRect();
      if (box.width <= 2 || box.height <= 2) continue;
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      parts.push({
        text: value.textContent!.trim(),
        box: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          right: box.right,
          bottom: box.bottom,
        },
        centerHitsMonth: !!hit && (hit === month || month.contains(hit)),
      });
    }
    const monthStyle = getComputedStyle(month);
    return {
      documentWidth: document.documentElement.scrollWidth,
      pageScroll: { x: scrollX, y: scrollY },
      titleLines: Array.from(titleRange.getClientRects(), (box) => ({
        x: box.x,
        y: box.y,
        right: box.right,
        bottom: box.bottom,
      })),
      modes: rect(node.querySelector('[aria-label="Margin view"]')!),
      search: {
        box: searchBox,
        label: search.getAttribute("aria-label"),
        value: search.value,
        queryWidth,
        contentWidth:
          search.clientWidth -
          Number.parseFloat(searchStyle.paddingLeft) -
          Number.parseFloat(searchStyle.paddingRight),
        paddingLeft: searchStyle.paddingLeft,
        paddingRight: searchStyle.paddingRight,
        centerHit: hitIsSearch(searchHit),
        scrollLeft: search.scrollLeft,
      },
      numeric: {
        button: rect(month),
        cell: rect(month.closest("td")!),
        row: rect(month.closest("tr")!),
        parts,
        computed: {
          height: monthStyle.height,
          minHeight: monthStyle.minHeight,
          padding: monthStyle.padding,
          lineHeight: monthStyle.lineHeight,
        },
      },
    };
    function hitIsSearch(hit: Element | null) {
      return !!hit && (hit === search || search.contains(hit));
    }
  });
}
