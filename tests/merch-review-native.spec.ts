import { expect as baseExpect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const expect = baseExpect.configure({ timeout: 5000 });
test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ colorScheme: "light", deviceScaleFactor: 1, actionTimeout: 5000, trace: "on" });
const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const faults: string[] = [];
  errors.set(page, faults);
  page.on("pageerror", (error) => faults.push(error.message));
});
test.afterEach(async ({ page }, info) => {
  await info.attach("runtime-faults", {
    body: JSON.stringify(errors.get(page)),
    contentType: "application/json",
  });
  expect(errors.get(page)).toEqual([]);
});

async function open(
  page: Page,
  baseURL: string | undefined,
  primitive: "radix" | "base",
  id: 24 | 25,
  phone = false,
  style: "nova" | "sera" = "nova",
) {
  if (!baseURL) throw new Error("Bound integrated draft artifact required");
  const origin = new URL("./", baseURL);
  if (origin.pathname.endsWith("/base/")) origin.pathname = origin.pathname.slice(0, -5);
  const root = new URL(primitive === "base" ? "base/" : "./", origin);
  const query = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  await page.setViewportSize(phone ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  await page.goto(`${root}#/preview/data-grid/advanced/data-grid-advanced-${id}?${query}`);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  const scope = page.locator(
    `[data-merch-review="${id === 24 ? "category-margin" : "brand-scorecard"}"]`,
  );
  await expect(
    scope.locator('[data-slot="frame-panel-title"]').filter({
      hasText: id === 24 ? /^Category margin workbench$/ : /^Brand trading scorecard$/,
    }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return scope;
}

async function downloaded(page: Page, button: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: button, exact: true }).click();
  return readFile((await (await pending).path())!, "utf8");
}

for (const primitive of ["radix", "base"] as const) {
  test(`Advanced24 ${primitive}: real drill path, financial edit and exact CSV agree`, async ({
    page,
    baseURL,
  }, info) => {
    const root = await open(page, baseURL, primitive, 24);
    await root.getByRole("button", { name: "Home", exact: true }).click();
    await root.getByRole("button", { name: "Table linen", exact: true }).click();
    await expect(root.getByRole("navigation", { name: "Margin drill path" })).toContainText(
      "Table linen",
    );
    const actions = root.getByRole("button", { name: "Actions for Table linen", exact: true });
    await actions.click();
    await page.getByRole("menuitem", { name: "Edit product line", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit product line", exact: true });
    for (const [label, value] of [
      ["Gross sales", "10000"],
      ["Discounts", "0"],
      ["Returned sales", "0"],
      ["Direct cost", "5000"],
      ["Sales plan", "10000"],
      ["Margin target (%)", "60"],
    ])
      await editor.getByLabel(label, { exact: true }).fill(value);
    await editor.getByRole("button", { name: "Save product line", exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    await expect(actions).toBeFocused();
    const month = root.getByRole("button", { name: /Table linen, Oct 26 gross margin 50\.0%/ });
    await expect(month).toBeVisible();
    await expect(root.getByRole("row", { name: /Table linen/ })).toContainText("60.0%");
    const csv = await downloaded(page, "Export matching lines");
    expect(csv).toContain('"Home","Table linen","2026-10","1000000","500000","5000","6000"');
    await month.click();
    const sheet = page.getByRole("dialog", { name: "Table linen", exact: true });
    await expect(
      sheet.locator('[data-slot="frame-panel-title"]').filter({ hasText: /^Gross to net bridge$/ }),
    ).toBeVisible();
    await sheet.getByRole("tab", { name: "Plan and quarters", exact: true }).click();
    await expect(
      sheet.locator('[data-slot="frame-panel-title"]').filter({ hasText: /^Net sales and plan$/ }),
    ).toBeVisible();
    await expect(sheet.locator("svg.recharts-surface")).toBeVisible();
    await sheet.screenshot({ path: info.outputPath("category-edited-plan.png") });
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
    await expect(month).toBeFocused();
  });

  test(`Advanced24 ${primitive}: phone create, removal and undo preserve actual product records`, async ({
    page,
    baseURL,
  }, info) => {
    const root = await open(page, baseURL, primitive, 24, true);
    await root.getByRole("button", { name: "Add product line", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "New product line", exact: true });
    await editor.getByLabel("Product line name", { exact: true }).fill("Archive tote");
    await editor.getByLabel("Gross sales", { exact: true }).fill("1000");
    await editor.getByLabel("Direct cost", { exact: true }).fill("600");
    await editor.getByRole("button", { name: "Save product line", exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    await root
      .getByRole("textbox", { name: "Search category margin", exact: true })
      .fill("Archive tote");
    await root.getByRole("button", { name: "Home", exact: true }).click();
    await expect(
      root.getByRole("button", { name: /Archive tote, Oct 26 gross margin 40\.0%/ }),
    ).toBeVisible();
    const before = await downloaded(page, "Export matching lines");
    expect(before).toContain('"Archive tote","2026-10","100000","40000","4000"');
    await root.getByRole("button", { name: "Actions for Archive tote", exact: true }).click();
    await page.getByRole("menuitem", { name: "Remove product line", exact: true }).click();
    const confirm = page.getByRole("alertdialog", { name: "Remove Archive tote?", exact: true });
    await confirm.getByRole("button", { name: "Remove product line", exact: true }).click();
    await expect(confirm).toBeHidden();
    await expect(root.getByRole("button", { name: "Archive tote", exact: true })).toHaveCount(0);
    await root.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(root.getByRole("button", { name: "Archive tote", exact: true })).toBeVisible();
    expect(await downloaded(page, "Export matching lines")).toBe(before);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.screenshot({ path: info.outputPath("category-phone-undo.png") });
  });

  test(`Advanced25 ${primitive}: original brand columns, first record, target and portfolio export stay coherent`, async ({
    page,
    baseURL,
  }, info) => {
    const root = await open(page, baseURL, primitive, 25);
    await expect(root.getByRole("img", { name: /trading range/ })).toHaveCount(4);
    await root.getByRole("button", { name: "Add brand", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "New brand", exact: true });
    await editor.getByLabel("Brand name", { exact: true }).fill("Pine Reach");
    await editor.getByLabel("Brand initials", { exact: true }).fill("PR");
    await editor.getByLabel("Margin target (%)", { exact: true }).fill("55");
    await editor.getByRole("button", { name: "Save brand", exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    await root.getByRole("button", { name: "Add product record", exact: true }).click();
    const product = page.getByRole("dialog", { name: "New product line", exact: true });
    await product.getByLabel("Product line name", { exact: true }).fill("Pine tote");
    await product.getByRole("combobox", { name: "Brand", exact: true }).click();
    await page.getByRole("option", { name: "Pine Reach", exact: true }).click();
    for (const [label, value] of [
      ["Gross sales", "10000"],
      ["Discounts", "0"],
      ["Returned sales", "0"],
      ["Direct cost", "4000"],
      ["Sales plan", "10000"],
    ])
      await product.getByLabel(label, { exact: true }).fill(value);
    await product.getByRole("button", { name: "Save product line", exact: true }).click();
    await expect(product).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    await root.getByRole("textbox", { name: "Search brands", exact: true }).fill("Pine Reach");
    await expect(root.getByRole("img", { name: /Pine Reach trading range/ })).toHaveAttribute(
      "aria-label",
      /Oct 26 \$2,000\.00 to \$3,000\.00/,
    );
    const csv = await downloaded(page, "Export scorecard");
    expect(csv.split("\r\n")[0]).toBe('"Section","Metric","Month","Portfolio","Pine Reach"');
    expect(csv.split("\r\n").find((line) => line.includes('"Gross margin"'))).toMatch(/,"6000"$/);
    await root.getByRole("button", { name: "Review Pine Reach", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Pine Reach", exact: true });
    await expect(sheet).toContainText("60.0%");
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
    await root.getByRole("button", { name: "Actions for Pine Reach", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit brand", exact: true }).click();
    const edit = page.getByRole("dialog", { name: "Edit brand", exact: true });
    await edit.getByLabel("Margin target (%)", { exact: true }).fill("70");
    await edit.getByRole("button", { name: "Save brand", exact: true }).click();
    await expect(edit).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    await expect(
      root.getByRole("button", { name: "Actions for Pine Reach", exact: true }),
    ).toBeFocused();
    await expect(root.getByText("Goal 70.0%", { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath("brand-first-record-and-goal.png") });
  });

  test(`Advanced25 ${primitive}: phone brand removal and undo restore portfolio and range data`, async ({
    page,
    baseURL,
  }, info) => {
    const root = await open(page, baseURL, primitive, 25, true, "sera");
    await root.getByRole("textbox", { name: "Search brands", exact: true }).fill("Northfork Goods");
    await expect(root.getByRole("img", { name: /trading range/ })).toHaveCount(1);
    const before = await downloaded(page, "Export scorecard");
    const trigger = root.getByRole("button", { name: "Actions for Northfork Goods", exact: true });
    await trigger.scrollIntoViewIfNeeded();
    const hit = await trigger.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const target = document.elementFromPoint(center.x, center.y);
      return {
        box: box.toJSON(),
        center,
        realPointerTarget: target === element || element.contains(target),
        hitStack: document
          .elementsFromPoint(center.x, center.y)
          .slice(0, 8)
          .map((node) => ({
            tag: node.tagName,
            role: node.getAttribute("role"),
            label: node.getAttribute("aria-label"),
            column: node.closest("th")?.getAttribute("data-col-id"),
          })),
      };
    });
    await info.attach("brand-phone-real-pointer-target", {
      body: JSON.stringify(hit),
      contentType: "application/json",
    });
    expect(hit.realPointerTarget).toBe(true);
    await trigger.click();
    await page.getByRole("menuitem", { name: "Remove brand", exact: true }).click();
    const confirm = page.getByRole("alertdialog", { name: "Remove Northfork Goods?", exact: true });
    await confirm.getByRole("button", { name: "Remove brand", exact: true }).click();
    await expect(confirm).toBeHidden();
    await expect(root.getByText("No brands match this review.", { exact: true })).toBeVisible();
    await root.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(
      root.getByRole("button", { name: "Review Northfork Goods", exact: true }),
    ).toBeVisible();
    expect(await downloaded(page, "Export scorecard")).toBe(before);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.screenshot({ path: info.outputPath("brand-phone-undo.png") });
  });
}

for (const primitive of ["radix", "base"] as const) {
  test(`Advanced24 ${primitive}: keyboard menu to sheet returns to the actual trigger`, async ({
    page,
    baseURL,
  }) => {
    const root = await open(page, baseURL, primitive, 24);
    await root.getByRole("button", { name: "Home", exact: true }).click();
    await root.getByRole("button", { name: "Table linen", exact: true }).click();
    const trigger = root.getByRole("button", { name: "Actions for Table linen", exact: true });
    for (let step = 0; step < 80; step++) {
      if (await trigger.evaluate((element) => element === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(trigger).toBeFocused();
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(key);
      await page.getByRole("menuitem", { name: "Inspect drivers", exact: true }).click();
      const sheet = page.getByRole("dialog", { name: "Table linen", exact: true });
      await expect(sheet).toBeVisible();
      await expect(
        sheet
          .locator('[data-slot="frame-panel-title"]')
          .filter({ hasText: /^Gross to net bridge$/ }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  });
}
