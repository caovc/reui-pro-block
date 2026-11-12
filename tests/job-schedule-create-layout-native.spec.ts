import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const styles = ["nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"] as const;
type Style = (typeof styles)[number];
type Primitive = "radix" | "base";

test.describe.configure({ retries: 0 });
test.use({ actionTimeout: 5000, trace: "retain-on-failure" });

async function openCreate(
  page: Page,
  baseURL: string | undefined,
  primitive: Primitive,
  width: number,
  style: Style,
) {
  if (!baseURL) throw new Error("Create Job layout checks require a production preview URL");
  const height = width === 390 ? 844 : 1000;
  await page.setViewportSize({ width, height });
  const params = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  const entry = new URL(primitive === "base" ? "base/" : "./", new URL("./", baseURL));
  await page.goto(`${entry.href}#/preview/data-grid/advanced/data-grid-advanced-22?${params}`);
  await expect(page).toHaveTitle("Job Schedule — Preview");
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  const schedule = page.getByRole("region", { name: "Job schedule", exact: true });
  const opener = schedule.getByRole("button", { name: "Add Job", exact: true });
  await expect(opener).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Add Job", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("data-slot", "sheet-content");
  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox();
      if (!bounds) return false;
      const expected =
        width === 390
          ? { x: 16, y: 16, width: 358, height: 812 }
          : { x: width - 512, y: 0, width: 512, height };
      return Object.entries(expected).every(
        ([key, value]) => Math.abs(bounds[key as keyof typeof bounds] - value) < 0.75,
      );
    })
    .toBe(true);
  return { opener, dialog };
}

async function recordLayout(dialog: Locator) {
  return dialog.evaluate((node) => {
    const rect = (element: Element) => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const named = (selector: string) => rect(node.querySelector(selector)!);
    const group = node.querySelector<HTMLElement>('form > [data-slot="field-group"]')!;
    return {
      sheet: rect(node),
      radius: getComputedStyle(node).borderTopLeftRadius,
      client: named('input[name="client"]'),
      phone: named('input[name="phone"]'),
      type: named('[role="combobox"][aria-label="Job Type"]'),
      lead: named('[role="combobox"][aria-label="Lead"]'),
      fields: rect(group),
      footer: named('[data-slot="sheet-footer"]'),
      scroll: {
        height: group.clientHeight,
        content: group.scrollHeight,
        top: group.scrollTop,
        overflow: getComputedStyle(group).overflowY,
      },
      rootWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
    };
  });
}

async function checkPhoneColumns(dialog: Locator) {
  const layout = await recordLayout(dialog);
  expect(layout.radius).toBe("14px");
  expect(layout.phone.y).toBeGreaterThan(layout.client.bottom);
  expect(layout.lead.y).toBeGreaterThan(layout.type.bottom);
  expect(layout.client.x).toBeCloseTo(layout.phone.x, 1);
  expect(layout.client.width).toBeCloseTo(layout.phone.width, 1);
  expect(layout.type.x).toBeCloseTo(layout.lead.x, 1);
  expect(layout.type.width).toBeCloseTo(layout.lead.width, 1);
  expect(layout.rootWidth).toBeLessThanOrEqual(layout.viewport);
  expect(layout.scroll.overflow).toBe("auto");
  return layout;
}

function recordErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(`${message.type()}: ${message.text()}`);
  });
  return errors;
}

for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390]) {
    test(`Create Job ${primitive} Nova ${width}: reference frame, fields and native keyboard reachability`, async ({
      page,
      baseURL,
    }, info) => {
      const errors = recordErrors(page);
      const { dialog, opener } = await openCreate(page, baseURL, primitive, width, "nova");
      const layout = width === 390 ? await checkPhoneColumns(dialog) : await recordLayout(dialog);
      if (width === 1440) {
        expect(layout.client.y).toBeCloseTo(layout.phone.y, 1);
        expect(layout.type.y).toBeCloseTo(layout.lead.y, 1);
        expect(layout.client.right).toBeLessThan(layout.phone.x);
        expect(layout.type.right).toBeLessThan(layout.lead.x);
      }
      await writeFile(info.outputPath("create-layout.json"), JSON.stringify(layout, null, 2));
      await page.screenshot({ path: info.outputPath(`create-${primitive}-${width}.png`) });
      const client = dialog.getByRole("textbox", { name: "Client", exact: true });
      await expect(client).toBeFocused();
      const footer = dialog.locator('[data-slot="sheet-footer"]');
      for (const control of [
        dialog.getByRole("textbox", { name: "Phone", exact: true }),
        dialog.getByRole("textbox", { name: "Street", exact: true }),
        dialog.getByRole("textbox", { name: "Town", exact: true }),
        dialog.getByRole("combobox", { name: "Job Type", exact: true }),
        dialog.getByRole("combobox", { name: "Lead", exact: true }),
        dialog.getByRole("button", { name: "Start", exact: true }),
        dialog.getByRole("button", { name: "Due Date", exact: true }),
        footer.getByRole("button", { name: "Cancel", exact: true }),
        footer.getByRole("button", { name: "Add Job", exact: true }),
      ]) {
        await page.keyboard.press("Tab");
        await expect(control).toBeFocused();
        const bounds = await control.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(layout.sheet.x);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(layout.sheet.right);
        expect(bounds!.y).toBeGreaterThanOrEqual(layout.sheet.y);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(layout.sheet.bottom);
      }
      await page.screenshot({ path: info.outputPath(`create-footer-${primitive}-${width}.png`) });
      await page.keyboard.press("Shift+Tab");
      await expect(footer.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }

  for (const style of styles.filter((style) => style !== "nova")) {
    test(`Create Job ${primitive} ${style} phone: inset frame, single columns and inner scroll bounds`, async ({
      page,
      baseURL,
    }, info) => {
      const errors = recordErrors(page);
      const { dialog, opener } = await openCreate(page, baseURL, primitive, 390, style);
      const layout = await checkPhoneColumns(dialog);
      await writeFile(info.outputPath("create-style-bounds.json"), JSON.stringify(layout, null, 2));
      await page.screenshot({ path: info.outputPath(`create-${primitive}-${style}-phone.png`) });
      const due = dialog.getByRole("button", { name: "Due Date", exact: true });
      await due.focus();
      await expect(due).toBeFocused();
      const position = await due.boundingBox();
      expect(position!.y).toBeGreaterThanOrEqual(layout.fields.y);
      expect(position!.y + position!.height).toBeLessThanOrEqual(layout.fields.bottom);
      const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
      const submit = dialog.getByRole("button", { name: "Add Job", exact: true });
      await expect(cancel).toBeInViewport();
      await expect(submit).toBeInViewport();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
}
