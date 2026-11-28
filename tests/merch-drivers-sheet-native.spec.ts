import { expect, test, type Locator } from "@playwright/test";

test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ actionTimeout: 5000, colorScheme: "light", deviceScaleFactor: 1, trace: "on" });

async function settle(sheet: Locator) {
  await sheet.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished.catch(() => {})));
  });
}

async function geometry(sheet: Locator) {
  return sheet.evaluate((node) => {
    const rectangle = (element: Element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, width: box.width };
    };
    const text = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return Array.from(range.getClientRects()).map((box) => ({
        left: box.left,
        right: box.right,
        width: box.width,
      }));
    };
    const list = node.querySelector<HTMLElement>("[role=tablist]")!;
    const selected = list.querySelector("[role=tab][aria-selected=true]")!;
    return {
      sheet: {
        ...rectangle(node),
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        scrollLeft: node.scrollLeft,
        scrollTop: node.scrollTop,
      },
      list: {
        ...rectangle(list),
        clientWidth: list.clientWidth,
        scrollWidth: list.scrollWidth,
        scrollLeft: list.scrollLeft,
      },
      selectedText: text(selected),
      contentText: Array.from(
        node.querySelectorAll(
          '[data-slot="sheet-title"], [data-slot="sheet-description"], .merch-summary p',
        ),
      ).flatMap(text),
      documentWidth: document.documentElement.scrollWidth,
      pageX: window.scrollX,
    };
  });
}

function expectContained(proof: Awaited<ReturnType<typeof geometry>>, width: number) {
  expect(proof.sheet.scrollWidth).toBeLessThanOrEqual(proof.sheet.clientWidth + 1);
  expect(proof.sheet.scrollLeft).toBe(0);
  expect(proof.pageX).toBe(0);
  expect(proof.documentWidth).toBeLessThanOrEqual(width);
  for (const box of proof.contentText) {
    expect(box.left).toBeGreaterThanOrEqual(proof.sheet.left);
    expect(box.right).toBeLessThanOrEqual(proof.sheet.right);
  }
  for (const box of proof.selectedText) {
    expect(box.left).toBeGreaterThanOrEqual(proof.list.left);
    expect(box.right).toBeLessThanOrEqual(proof.list.right);
  }
}

for (const primitive of ["radix", "base"] as const) {
  test(`Merch ${primitive}: mobile driver tabs scroll their labels without cropping the sheet`, async ({
    page,
    baseURL,
  }, info) => {
    if (!baseURL) throw new Error("A production preview URL is required");
    const faults: string[] = [];
    const measurements: { state: string; geometry: Awaited<ReturnType<typeof geometry>> }[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    const origin = new URL("./", baseURL);
    if (origin.pathname.endsWith("/base/")) origin.pathname = origin.pathname.slice(0, -5);
    const entry = new URL(primitive === "base" ? "base/" : "./", origin);
    const query = new URLSearchParams({
      preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${entry}#/preview/data-grid/advanced/data-grid-advanced-24?${query}`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await page.evaluate(() => document.fonts.ready);
    const root = page.locator('[data-merch-review="category-margin"]');
    await root.getByRole("button", { name: "Table linen", exact: true }).click();
    const month = root.getByRole("button", { name: /^Table linen, Oct 26 gross margin/ });
    await month.click();
    const sheet = page.getByRole("dialog", { name: "Table linen", exact: true });
    await expect(sheet).toBeVisible();
    await settle(sheet);
    const record = async (state: string) => {
      const proof = await geometry(sheet);
      measurements.push({ state, geometry: proof });
      return proof;
    };
    try {
      await record("sales-open");
      const plan = sheet.getByRole("tab", { name: "Plan and quarters", exact: true });
      await plan.click();
      await expect(plan).toHaveAttribute("aria-selected", "true");
      await expect(
        sheet
          .locator('[data-slot="frame-panel-title"]')
          .filter({ hasText: /^Net sales and plan$/ }),
      ).toBeVisible();
      await expect(sheet.locator("svg.recharts-surface")).toBeVisible();
      await settle(sheet);
      await record("plan-selected");
      await sheet.evaluate((node) => {
        node.setAttribute("data-trusted-wheel", "false");
        node.addEventListener(
          "wheel",
          (event) => node.setAttribute("data-trusted-wheel", String(event.isTrusted)),
          { once: true },
        );
      });
      await sheet.hover({ position: { x: 200, y: 120 } });
      await page.mouse.wheel(200, 0);
      await expect(sheet).toHaveAttribute("data-trusted-wheel", "true");
      await sheet.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const afterWheel = await record("plan-after-native-horizontal-wheel");
      await page.screenshot({ path: info.outputPath("plan-native-wheel.png") });
      expectContained(afterWheel, 390);

      await page.setViewportSize({ width: 320, height: 620 });
      const list = sheet.getByRole("tablist");
      await expect
        .poll(() => list.evaluate((node) => node.scrollWidth - node.clientWidth))
        .toBeGreaterThan(0);
      await list.hover();
      await page.mouse.wheel(200, 0);
      await expect.poll(() => list.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
      expect((await record("narrow-list-native-wheel")).sheet.scrollLeft).toBe(0);
      for (const [key, name] of [
        ["Home", "Sales drivers"],
        ["ArrowRight", "Plan and quarters"],
        ["End", "Promotions"],
      ] as const) {
        await sheet.getByRole("tab", { selected: true }).press(key);
        const tab = sheet.getByRole("tab", { name, exact: true });
        await expect(tab).toHaveAttribute("aria-selected", "true");
        await expect(tab).toBeFocused();
        await expect
          .poll(async () => {
            const proof = await geometry(sheet);
            return proof.selectedText.every(
              (box) => box.left >= proof.list.left && box.right <= proof.list.right,
            );
          })
          .toBe(true);
        expectContained(await record(`narrow-keyboard-${key}`), 320);
      }
      await sheet.getByRole("tab", { name: "Promotions", exact: true }).press("ArrowLeft");
      await expect(plan).toHaveAttribute("aria-selected", "true");
      await sheet.hover({ position: { x: 160, y: 400 } });
      await page.mouse.wheel(0, 400);
      await expect.poll(() => sheet.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
      expectContained(await record("narrow-native-vertical-wheel"), 320);
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
      await expect(month).toBeFocused();
      expect(faults).toEqual([]);
    } finally {
      await info.attach("sheet-overflow-geometry", {
        body: JSON.stringify({ primitive, measurements, faults }),
        contentType: "application/json",
      });
    }
  });
}
