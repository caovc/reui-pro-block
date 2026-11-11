import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import { chromium } from "playwright";
import { createServer } from "vite";
import { getUiStyleCss, UI_STYLES } from "../../src/foundations/styles/index.ts";

// Popup corner, shortcut corner, shortcut height, shortcut font, arrow corner.
const expected = {
  nova: [8, 4, 20, 10, 2],
  vega: [8, 4, 20, 10, 2],
  maia: [18, 26, 20, 12, 2],
  lyra: [0, 0, 20, 12, 0],
  mira: [8, 6, 20, 10, 2],
  luma: [14, 10, 22, 12, 2],
  sera: [0, 0, 22, 12, 0],
  rhea: [14, 10, 20, 12, 2],
};

function popupFor(page) {
  return page.locator('[data-slot="tooltip-content"]');
}

async function checkStyle(page, style, library) {
  const [popupCorner, keyCorner, keyHeight, font, arrowCorner] = expected[style];
  const trigger = page.getByRole("button", { name: "Shortcut help", exact: true });
  const popup = popupFor(page);
  const kbd = popup.locator('[data-slot="kbd"]');
  const arrow =
    library === "base" ? popup.locator('[data-slot="tooltip-arrow"]') : popup.locator("span > svg");

  // Hover should respect the provider's delay in both implementations.
  await trigger.hover();
  await expect(popup).toHaveCount(0, { timeout: 100 });
  await expect(popup).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-describedby", /\S/);
  await expect(page.getByRole("tooltip")).toContainText("Save changes");
  assert.equal(await popup.locator("xpath=ancestor::main").count(), 0);
  await expect(popup).toHaveAttribute("data-side", "right");
  const anchor = await trigger.boundingBox();
  const surface = await popup.boundingBox();
  assert.ok(surface.x >= anchor.x + anchor.width + 8, "tooltip preserves the side offset");

  await expect(popup).toHaveCSS("border-top-left-radius", `${popupCorner}px`);
  await expect(kbd).toHaveCSS("border-top-left-radius", `${keyCorner}px`);
  await expect(kbd).toHaveCSS("height", `${keyHeight}px`);
  await expect(kbd).toHaveCSS("min-width", `${keyHeight}px`);
  await expect(kbd).toHaveCSS("padding-left", keyHeight === 22 ? "6px" : "4px");
  await expect(kbd).toHaveCSS("font-size", `${font}px`);
  await expect(arrow).toHaveCSS("border-top-left-radius", `${arrowCorner}px`);
  const shifted = library === "base" && ["maia", "luma", "rhea"].includes(style);
  await expect(arrow).toHaveCSS("translate", shifted ? "1.5px -50%" : /^0px(?: |$)/);
  await expect(page.getByTestId("standalone-key")).toHaveCSS("height", "20px");

  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await page.mouse.move(1, 1);
  await page.getByRole("button", { name: "Before tooltip" }).focus();
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.blur();
}

async function checkOverrides(page) {
  const trigger = page.getByRole("button", { name: "Custom help" });
  await trigger.focus();
  const popup = popupFor(page);
  const key = popup.locator('[data-slot="kbd"]');
  await expect(popup).toHaveCSS("border-top-left-radius", "18px");
  await expect(popup).toHaveCSS("padding-left", "16px");
  await expect(key).toHaveCSS("border-top-left-radius", "14px");
  await expect(key).toHaveCSS("height", "32px");
  await expect(key).toHaveCSS("font-size", "14px");
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await trigger.blur();
}

const vite = await createServer({
  root: fileURLToPath(new URL("../../", import.meta.url)),
  appType: "mpa",
  server: { host: "127.0.0.1", port: 0, watch: null },
});
let browser;
try {
  await vite.listen();
  browser = await chromium.launch();
  for (const library of ["radix", "base"]) {
    const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
    const prefix = library === "base" ? "/base" : "";
    await page.goto(
      `http://127.0.0.1:${vite.httpServer.address().port}${prefix}/tests/ui-style-foundations/tooltip.html`,
    );
    await expect(page.locator("main")).toHaveAttribute("data-library", library);
    for (const style of UI_STYLES) {
      const css = getUiStyleCss(`${library}-${style}`);
      assert.equal(css, getUiStyleCss(style));
      const stylesheet = css ? await page.addStyleTag({ content: css }) : undefined;
      await checkStyle(page, style, library);
      if (style === "sera") await checkOverrides(page);
      await stylesheet?.evaluate((element) => element.remove());
      console.log(`${library}-${style}: Tooltip geometry, delay and keyboard match`);
    }
    await checkStyle(page, "nova", library);
    await page.close();
  }
} finally {
  await browser?.close();
  await vite.close();
}
