import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const styles = ["nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"] as const;
type Style = (typeof styles)[number];
type Primitive = "radix" | "base";
const iconSides: Record<Style, number> = {
  nova: 32,
  vega: 36,
  maia: 36,
  lyra: 32,
  mira: 28,
  luma: 36,
  sera: 40,
  rhea: 32,
};

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });
test.use({ actionTimeout: 5_000, trace: "retain-on-failure", colorScheme: "light" });

async function openSchedule(
  page: Page,
  baseURL: string | undefined,
  primitive: Primitive,
  style: Style,
  width: number,
) {
  if (!baseURL) throw new Error("Job density checks require the frozen production preview URL");
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  const entry = new URL(primitive === "base" ? "base/" : "./", new URL("./", baseURL));
  const params = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  await page.goto(`${entry.href}#/preview/data-grid/advanced/data-grid-advanced-22?${params}`);
  await expect(page).toHaveTitle("Job Schedule — Preview");
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  await page.evaluate(() => document.fonts.ready);
  if (style !== "nova") {
    await expect
      .poll(() => page.locator("#preview-preset").textContent())
      .toContain(`Bricklane: ${style} component style`);
  }
  const region = page.getByRole("region", { name: "Job schedule", exact: true });
  await expect(region.getByRole("heading", { name: "Job Schedule", exact: true })).toBeVisible();
  await expect(region.locator("tbody tr[data-row-id]")).toHaveCount(10);
  await region.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return region;
}

async function buttonGeometry(button: Locator) {
  return button.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const caption = element.querySelector<HTMLElement>(":scope > span");
    const label = caption?.getBoundingClientRect();
    const hit = element.ownerDocument.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    );
    const css = getComputedStyle(element);
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fontSize: css.fontSize,
      captionVisible: !!caption && getComputedStyle(caption).display !== "none",
      captionInside:
        !!label &&
        label.x >= rect.x &&
        label.right <= rect.right &&
        label.y >= rect.y &&
        label.bottom <= rect.bottom,
      ownsCenter: hit === element || (hit !== null && element.contains(hit)),
    };
  });
}

async function gridGeometry(region: Locator) {
  return region.evaluate((element) => {
    const table = element.querySelector("table")!;
    const viewport = table.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')!;
    const rectangle = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const headers = [...table.querySelectorAll<HTMLElement>("thead th[data-col-id]")];
    const columns = [...table.querySelectorAll<HTMLTableColElement>("colgroup col")];
    return {
      frame: rectangle(element.querySelector('[data-slot="frame"]')!),
      table: rectangle(table),
      viewport: rectangle(viewport),
      scroll: {
        left: viewport.scrollLeft,
        content: viewport.scrollWidth,
        width: viewport.clientWidth,
      },
      rows: [...table.querySelectorAll("tbody tr[data-row-id]")].slice(0, 2).map(rectangle),
      headers: headers.map((header, index) => ({
        id: header.dataset.colId!,
        nominalWidth: Number.parseFloat(columns[index].style.width),
        ...rectangle(header),
        position: getComputedStyle(header).position,
      })),
      rootWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      scrollY,
    };
  });
}

async function checkPhoneControls(region: Locator, style: Style) {
  const add = region.getByRole("button", { name: "Add Job", exact: true });
  const settings = region.getByRole("button", { name: "Schedule settings", exact: true });
  await expect(add).toHaveCount(1);
  await expect(settings).toHaveCount(1);
  const measured = await Promise.all(
    [add, settings, region.getByRole("button", { name: "Show job search", exact: true })].map(
      buttonGeometry,
    ),
  );
  for (const control of measured) {
    expect(control.width).toBe(iconSides[style]);
    expect(control.height).toBe(iconSides[style]);
    expect(control.captionVisible).toBe(false);
    expect(control.ownsCenter).toBe(true);
    expect(control.x).toBeGreaterThanOrEqual(0);
    expect(control.x + control.width).toBeLessThanOrEqual(390);
  }
  return { add, settings, measured };
}

for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390]) {
    test(`${primitive} Nova ${width}: density, fixed dates, native pinning and toolbar focus`, async ({
      page,
      baseURL,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const region = await openSchedule(page, baseURL, primitive, "nova", width);
      const initial = await gridGeometry(region);
      await writeFile(
        info.outputPath("initial-grid-geometry.json"),
        JSON.stringify(initial, null, 2),
      );
      expect(initial.scrollY).toBe(0);
      expect(initial.frame.y).toBe(width === 390 ? 32 : 48);
      expect(initial.rootWidth).toBe(width);
      expect(initial.rows).toHaveLength(2);
      for (const row of initial.rows) {
        expect(row.height).toBeGreaterThanOrEqual(48);
        expect(row.height).toBeLessThanOrEqual(50);
      }
      const dates = initial.headers.filter((header) => /^\d{4}-\d{2}-\d{2}$/.test(header.id));
      expect(dates).toHaveLength(20);
      const fillScale = width === 390 ? 1 : initial.table.width / 1109;
      for (const date of dates) {
        expect(date.nominalWidth).toBe(37);
        expect(date.width).toBeCloseTo(dates[0].width, 1);
        expect(date.width).toBeCloseTo(37 * fillScale, width === 390 ? 1 : 0);
      }
      for (const [id, size] of [
        ["select", 42],
        ["job", 190],
        ["finish", 96],
        ["actions", 41],
      ] as const) {
        const header = initial.headers.find((column) => column.id === id)!;
        expect(header.nominalWidth).toBe(size);
        expect(header.width).toBeCloseTo(size * fillScale, width === 390 ? 1 : 0);
      }
      expect(initial.headers.find((header) => header.id === "job")?.position).toBe("sticky");
      if (width === 390) {
        expect(initial.table.width).toBeCloseTo(1109, 1);
        expect(initial.scroll.content).toBe(1109);
        expect(initial.scroll.content).toBeGreaterThan(initial.scroll.width);
      } else {
        expect(initial.table.width).toBeGreaterThanOrEqual(1109);
        expect(initial.table.width).toBeCloseTo(initial.viewport.width, 1);
      }

      const add = region.getByRole("button", { name: "Add Job", exact: true });
      const settings = region.getByRole("button", { name: "Schedule settings", exact: true });
      const controls: Record<string, Awaited<ReturnType<typeof buttonGeometry>>> = {};
      for (const name of ["Previous week", "Today", "Next week", "Filter"] as const) {
        controls[name] = await buttonGeometry(region.getByRole("button", { name, exact: true }));
        expect(controls[name].height).toBe(32);
        expect(controls[name].fontSize).toBe("14px");
      }
      if (width === 390) {
        const phone = await checkPhoneControls(region, "nova");
        controls.add = phone.measured[0];
        controls.settings = phone.measured[1];
        controls.search = phone.measured[2];
      } else {
        for (const [name, button] of [
          ["add", add],
          ["settings", settings],
        ] as const) {
          controls[name] = await buttonGeometry(button);
          expect(controls[name].height).toBe(32);
          expect(controls[name].width).toBeGreaterThan(32);
          expect(controls[name].captionVisible).toBe(true);
          expect(controls[name].captionInside).toBe(true);
          expect(controls[name].ownsCenter).toBe(true);
        }
      }
      await writeFile(
        info.outputPath("initial-geometry.json"),
        JSON.stringify({ initial, controls }, null, 2),
      );
      await page.screenshot({ path: info.outputPath(`nova-${primitive}-${width}.png`) });

      await settings.press("Enter");
      const compact = page.getByRole("switch", { name: "Compact rows", exact: true });
      await expect(compact).toBeChecked();
      await compact.press("Space");
      await expect(compact).not.toBeChecked();
      await page.keyboard.press("Escape");
      await expect(settings).toBeFocused();
      const comfortable = await gridGeometry(region);
      for (const row of comfortable.rows) {
        expect(row.height).toBeGreaterThanOrEqual(57);
        expect(row.height).toBeLessThanOrEqual(59);
        expect(row.height).toBeGreaterThan(initial.rows[0].height);
      }
      await settings.press("Enter");
      await compact.press("Space");
      await expect(compact).toBeChecked();
      await page.keyboard.press("Escape");
      await expect(settings).toBeFocused();

      await add.press("Enter");
      const create = page.getByRole("dialog", { name: "Add Job", exact: true });
      await expect(create).toBeVisible();
      await expect(create.getByRole("textbox", { name: "Client", exact: true })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(create).toBeHidden();
      await expect(add).toBeFocused();

      const row = region.locator('tbody tr[data-row-id="job-1"]');
      await row.getByRole("button", { name: "Expand row", exact: true }).press("Enter");
      await expect(region.getByText("Rowan Bennett", { exact: true })).toBeVisible();
      await row.getByRole("button", { name: "Collapse row", exact: true }).press("Enter");
      await expect(region.getByText("Rowan Bennett", { exact: true })).toHaveCount(0);
      if (width === 390) {
        const viewport = region.locator('[data-slot="scroll-area-viewport"]').first();
        await viewport.evaluate((node) => {
          node.scrollLeft = 320;
        });
        const scrolled = await gridGeometry(region);
        expect(scrolled.scroll.left).toBe(320);
        for (const id of ["select", "job"]) {
          expect(scrolled.headers.find((header) => header.id === id)?.x).toBeCloseTo(
            initial.headers.find((header) => header.id === id)!.x,
            1,
          );
        }
        expect(scrolled.headers.find((header) => header.id === dates[0].id)!.x).toBeLessThan(
          dates[0].x,
        );
        expect(scrolled.rootWidth).toBe(width);
        await writeFile(
          info.outputPath("scrolled-geometry.json"),
          JSON.stringify(scrolled, null, 2),
        );
        await page.screenshot({ path: info.outputPath(`nova-${primitive}-phone-scrolled.png`) });
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      expect(errors).toEqual([]);
    });
  }

  for (const style of styles.filter((value) => value !== "nova")) {
    test(`${primitive} ${style} 390: phone actions retain their free style size and native focus`, async ({
      page,
      baseURL,
    }, info) => {
      const region = await openSchedule(page, baseURL, primitive, style, 390);
      const { add, settings, measured } = await checkPhoneControls(region, style);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
      await writeFile(
        info.outputPath("phone-controls.json"),
        JSON.stringify({ primitive, style, measured }, null, 2),
      );
      await page.screenshot({ path: info.outputPath(`${primitive}-${style}-phone-controls.png`) });
      await settings.press("Enter");
      await expect(page.getByRole("switch", { name: "Compact rows", exact: true })).toBeChecked();
      await page.keyboard.press("Escape");
      await expect(settings).toBeFocused();
      await add.press("Enter");
      const create = page.getByRole("dialog", { name: "Add Job", exact: true });
      await expect(create).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(create).toBeHidden();
      await expect(add).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    });
  }
}
