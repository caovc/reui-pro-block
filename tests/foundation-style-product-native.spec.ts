import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const styles = ["nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"] as const;
type Style = (typeof styles)[number];
type Primitive = "radix" | "base";

// Physical input heights from the public style reference, at a 16px root.
const inputHeights: Record<Style, number> = {
  nova: 32,
  vega: 36,
  maia: 36,
  lyra: 32,
  mira: 28,
  luma: 36,
  sera: 40,
  rhea: 32,
};
const blockRoute = "#/block/data-grid/advanced/data-grid-advanced-23";
const viewport = { width: 1440, height: 1000 };

test.use({ viewport, reducedMotion: "no-preference", actionTimeout: 5000 });

const preview = (page: Page) => page.frameLocator('iframe[title$=" live preview"]');

function entryUrl(baseURL: string | undefined, primitive: Primitive) {
  if (!baseURL) throw new Error("The foundation matrix requires the configured baseURL");
  return new URL(primitive === "base" ? "base/" : "./", new URL("./", baseURL)).href;
}

function recordErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      errors.push(`${message.type()}: ${message.text()}`);
    }
  });
  return errors;
}

async function measure(target: Locator) {
  await expect(target).toBeVisible();
  return target.evaluate((node) => {
    const css = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      radius: css.borderTopLeftRadius,
      padding: css.padding,
      gap: css.gap,
      font: css.fontFamily,
      fontSize: css.fontSize,
      border: css.borderTopWidth,
      background: css.backgroundColor,
      color: css.color,
      nativeOpen: node.hasAttribute("data-open"),
      state: node.getAttribute("data-state"),
    };
  });
}

async function expectFoundation(page: Page, primitive: Primitive, style: Style) {
  for (const html of [page.locator("html"), preview(page).locator("html")]) {
    await expect(html).toHaveAttribute("data-ui-primitive", primitive);
    await expect(html).toHaveAttribute("data-ui-style", style);
  }
}

async function selectStyle(page: Page, entry: string, primitive: Primitive, style: Style) {
  const params = new URLSearchParams({
    preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
  });
  await page.goto(`${entry}${blockRoute}?${params}`);
  await expect(page).toHaveTitle("Prospect Database — Bricklane");
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  const panel = page.getByRole("complementary", { name: "Preview customization", exact: true });
  await expect(panel).toBeVisible();
  await panel.getByRole("combobox", { name: "Style", exact: true }).click();
  await page
    .getByRole("option", { name: style[0].toUpperCase() + style.slice(1), exact: true })
    .click();
  await page.getByRole("button", { name: "Close customizer", exact: true }).click();
  await expectFoundation(page, primitive, style);
}

async function evidence(page: Page, info: TestInfo, name: string, details: object) {
  await page.screenshot({ path: info.outputPath(`${name}.png`) });
  await info.attach(name, {
    body: JSON.stringify(
      { url: page.url(), title: await page.title(), viewport, ...details },
      null,
      2,
    ),
    contentType: "application/json",
  });
}

for (const primitive of ["radix", "base"] as const) {
  for (const style of styles) {
    test(`${primitive} ${style}: product Field, Select and native overlays`, async ({
      page,
      baseURL,
    }, info) => {
      const errors = recordErrors(page);
      const entry = entryUrl(baseURL, primitive);
      await selectStyle(page, entry, primitive, style);
      const frame = preview(page);
      const region = frame.getByRole("region", { name: "Prospect database", exact: true });
      await expect(region).toBeVisible();
      await expect(region.locator("tbody tr")).toHaveCount(10);
      const add = region.getByRole("button", { name: "Add Company", exact: true });
      const addGeometry = await measure(add);
      await add.press("Enter");
      const sheet = frame.getByRole("dialog", { name: "Add Company", exact: true });
      await expect(sheet).toBeVisible();
      await expect(sheet).toHaveAttribute(
        primitive === "base" ? "data-open" : "data-state",
        primitive === "base" ? "" : "open",
      );
      const input = sheet.getByRole("textbox", { name: "Company Name", exact: true });
      await input.fill("Foundation audit");
      await expect(input).toHaveValue("Foundation audit");
      await expect(input).toHaveCSS("height", `${inputHeights[style]}px`);
      const inputGeometry = await measure(input);
      const fieldGeometry = await measure(input.locator("xpath=.."));
      const industry = sheet.getByRole("combobox", { name: "Industry", exact: true });
      const selectGeometry = await measure(industry);
      await industry.click();
      const listbox = frame.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await expect(listbox.getByRole("option")).toHaveCount(7);
      // Base's role=listbox is its inner List; native open state belongs to Popup.
      const popup = frame.locator('[data-slot="select-content"]');
      await expect(popup).toHaveAttribute(
        primitive === "base" ? "data-open" : "data-state",
        primitive === "base" ? "" : "open",
      );
      const popupGeometry = await measure(popup);
      await listbox.getByRole("option", { name: "Healthcare", exact: true }).click();
      await expect(industry).toContainText("Healthcare");
      await expect(listbox).toBeHidden();
      await evidence(page, info, `${primitive}-${style}-field-sheet`, {
        primitive,
        style,
        addGeometry,
        inputGeometry,
        fieldGeometry,
        selectGeometry,
        popupGeometry,
      });
      await input.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(add).toBeFocused();
      await region.getByRole("button", { name: "Hand Over", exact: true }).click();
      const dialog = frame.getByRole("dialog", { name: "Hand Over Accounts", exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute(
        primitive === "base" ? "data-open" : "data-state",
        primitive === "base" ? "" : "open",
      );
      const dialogGeometry = await measure(dialog);
      await evidence(page, info, `${primitive}-${style}-native-dialog`, {
        primitive,
        style,
        dialogGeometry,
        errors,
      });
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      expect(errors).toEqual([]);
    });

    test(`${primitive} ${style}: style persists through reload and Manifest workspace`, async ({
      page,
      baseURL,
    }, info) => {
      const errors = recordErrors(page);
      const entry = entryUrl(baseURL, primitive);
      await selectStyle(page, entry, primitive, style);
      const add = preview(page).getByRole("button", { name: "Add Company", exact: true });
      const addGeometry = await measure(add);
      await page.reload();
      await expectFoundation(page, primitive, style);
      await expect(add).toHaveCSS("height", `${addGeometry.height}px`);
      await page.goto(`${entry}#/templates/manifest`);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
      await expect(page.locator(".template-surface")).toBeVisible();
      await page.getByRole("button", { name: "Log in", exact: true }).click();
      await expect(page.getByRole("heading", { name: /^Welcome to / })).toBeVisible();
      await expect(page.locator('.bt-manifest[data-slot="sidebar-wrapper"]')).toHaveCount(1);
      const dashboard = page.getByRole("region", { name: "Store dashboard", exact: true });
      await expect(dashboard).toBeVisible();
      const templateGeometry = await measure(page.locator(".template-surface"));
      await evidence(page, info, `${primitive}-${style}-manifest-workspace`, {
        primitive,
        style,
        templateGeometry,
      });
      await page.goto(`${entry}${blockRoute}`);
      await expectFoundation(page, primitive, style);
      await expect(
        preview(page).getByRole("region", { name: "Prospect database", exact: true }),
      ).toBeVisible();
      await evidence(page, info, `${primitive}-${style}-returned-block`, {
        primitive,
        style,
        addGeometry,
        errors,
      });
      expect(errors).toEqual([]);
    });
  }
}
