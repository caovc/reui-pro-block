import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const styles = ["nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"] as const;

test.describe.configure({ retries: 0 });
test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 5000 });

for (const primitive of ["radix", "base"] as const) {
  for (const style of styles) {
    test(`Host Search ${primitive} ${style}: bounds, shortcut and real overlay focus`, async ({
      page,
      baseURL,
    }, info) => {
      if (!baseURL) throw new Error("Host Search checks require the configured production URL");
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
          errors.push(`${message.type()}: ${message.text()}`);
        }
      });
      const entry = new URL(primitive === "base" ? "base/" : "./", new URL("./", baseURL));
      const params = new URLSearchParams({
        preset: JSON.stringify({ primitive, style, mode: "light" }),
      });
      await page.goto(`${entry.href}#/block/data-grid/advanced/data-grid-advanced-23?${params}`);
      await expect(page).toHaveTitle("Prospect Database — Bricklane");
      await expect(
        page.getByRole("heading", { name: "Prospect Database", exact: true }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
      await page.evaluate(() => document.fonts.ready);

      const header = page.locator(".site-header");
      const search = header.locator("button.search-trigger");
      const shortcut = search.locator(":scope > kbd");
      const customize = header.getByRole("button", { name: "Customize", exact: true });
      await expect(search).toBeVisible();
      const evidence = await header.evaluate((node) => {
        const search = node.querySelector<HTMLElement>("button.search-trigger")!;
        const label = search.querySelector<HTMLElement>(":scope > span")!;
        const shortcut = search.querySelector<HTMLElement>(":scope > kbd")!;
        const icon = search.querySelector<SVGElement>(":scope > svg")!;
        const customize = node.querySelector<HTMLElement>('button[aria-label="Customize"]')!;
        const box = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom,
          };
        };
        const textRange = document.createRange();
        textRange.selectNodeContents(label);
        const text = textRange.getBoundingClientRect();
        const css = getComputedStyle(search);
        const labelCss = getComputedStyle(label);
        const kbd = box(shortcut);
        const point = { x: kbd.right - 1, y: kbd.y + kbd.height / 2 };
        const owner = document.elementFromPoint(point.x, point.y)?.closest("button");
        return {
          search: box(search),
          label: box(label),
          shortcut: kbd,
          icon: box(icon),
          customize: box(customize),
          labelTextWidth: text.width,
          searchStyle: {
            height: css.height,
            padding: css.padding,
            radius: css.borderTopLeftRadius,
            font: css.fontFamily,
            letterSpacing: css.letterSpacing,
            textTransform: css.textTransform,
          },
          labelStyle: { overflow: labelCss.overflowX, textOverflow: labelCss.textOverflow },
          shortcutPoint: point,
          shortcutHitsSearch: owner === search,
          shortcutHitsCustomize: owner === customize,
        };
      });
      await writeFile(
        info.outputPath("host-search-bounds.json"),
        JSON.stringify(evidence, null, 2),
      );
      await page.screenshot({ path: info.outputPath(`${primitive}-${style}-host-search.png`) });
      expect(evidence.search.width).toBeCloseTo(198, 1);
      expect(evidence.shortcut.right).toBeLessThanOrEqual(evidence.search.right + 0.5);
      expect(evidence.shortcut.x).toBeGreaterThanOrEqual(evidence.search.x);
      expect(evidence.label.x).toBeGreaterThanOrEqual(evidence.search.x);
      expect(evidence.label.right).toBeLessThanOrEqual(evidence.shortcut.x + 0.5);
      expect(evidence.icon.x).toBeGreaterThanOrEqual(evidence.search.x);
      expect(evidence.icon.right).toBeLessThanOrEqual(evidence.search.right + 0.5);
      expect(evidence.shortcut.right).toBeLessThanOrEqual(evidence.customize.x);
      expect(evidence.shortcutHitsSearch).toBe(true);
      if (evidence.labelTextWidth > evidence.label.width + 0.5) {
        expect(evidence.labelStyle).toEqual({ overflow: "hidden", textOverflow: "ellipsis" });
      }
      if (style === "sera") {
        expect(evidence.searchStyle.radius).toBe("0px");
        expect(evidence.searchStyle.textTransform).toBe("uppercase");
        expect(evidence.searchStyle.letterSpacing).toBe("1.2px");
      }

      // The right edge of the actual shortcut previously hit Customize in Sera.
      await shortcut.click({
        position: { x: evidence.shortcut.width - 1, y: evidence.shortcut.height / 2 },
      });
      const dialog = page.getByRole("dialog", { name: "Search all blocks", exact: true });
      const input = dialog.getByRole("textbox", { name: "Search all blocks", exact: true });
      await expect(dialog).toBeVisible();
      await expect(input).toBeFocused();
      await input.fill("Prospect");
      await expect(dialog.getByRole("link", { name: /Prospect Database/ })).toBeVisible();
      // Native modal semantics hide the background from role queries while open.
      await expect(header.locator('button[aria-controls="preview-customizer"]')).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(search).toBeFocused();

      await customize.click();
      const panel = page.getByRole("complementary", { name: "Preview customization", exact: true });
      await expect(panel).toBeVisible();
      await expect(customize).toHaveAttribute("aria-expanded", "true");
      await expect(
        panel.getByRole("combobox", { name: "Style", exact: true }).locator(".theme-row-value"),
      ).toHaveText(style[0].toUpperCase() + style.slice(1));
      await panel.getByRole("button", { name: "Close customizer", exact: true }).click();
      await expect(panel).toHaveCount(0);
      await expect(customize).toBeFocused();

      // Keyboard opening from another control must keep that original opener.
      await page.keyboard.press("Control+k");
      await expect(dialog).toBeVisible();
      await expect(input).toBeFocused();
      await page.keyboard.press("Control+k");
      await expect(dialog).toHaveCount(0);
      await expect(customize).toBeFocused();
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
}
