import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import { chromium } from "playwright";
import { createServer } from "vite";
import { getUiStyleCss, UI_STYLES } from "../../src/foundations/styles/index.ts";

// Gap, header padding/gap, title and description sizes, overlay opacity/blur, close inset.
const sheets = {
  nova: ["16px", "16px", "2px", "16px", "14px", 0.1, "blur(4px)", "12px"],
  vega: ["16px", "16px", "6px", "14px", "14px", 0.1, "blur(4px)", "16px"],
  maia: ["normal", "24px", "6px", "16px", "14px", 0.8, "blur(4px)", "16px"],
  lyra: ["normal", "16px", "2px", "14px", "12px", 0.1, "blur(4px)", "12px"],
  mira: ["normal", "24px", "6px", "14px", "12px", 0.8, "blur(4px)", "16px"],
  luma: ["normal", "24px", "6px", "16px", "14px", 0.3, "blur(8px)", "16px"],
  sera: ["normal", "32px", "6px", "18px", "14px", 0.2, "blur(8px)", "16px"],
  rhea: ["normal", "24px", "6px", "16px", "14px", 0.3, "blur(8px)", "16px"],
};

// Radius, content padding/gap, header gap, title and description sizes, shadow offset.
const popovers = {
  nova: ["10px", "10px", "10px", "2px", "14px", "14px", "0px 4px 6px -1px"],
  vega: ["8px", "16px", "16px", "4px", "14px", "14px", "0px 4px 6px -1px"],
  maia: ["18px", "16px", "16px", "4px", "16px", "14px", "0px 25px 50px -12px"],
  lyra: ["0px", "10px", "10px", "4px", "14px", "12px", "0px 4px 6px -1px"],
  mira: ["10px", "10px", "16px", "4px", "14px", "12px", "0px 4px 6px -1px"],
  luma: ["22px", "16px", "16px", "4px", "16px", "14px", "0px 10px 15px -3px"],
  sera: ["0px", "16px", "16px", "4px", "12px", "14px", "0px 4px 6px -1px"],
  rhea: ["22px", "16px", "16px", "4px", "16px", "14px", "0px 10px 15px -3px"],
};

// Width, radius, padding, font size/leading, shadow offset and light ring opacity.
const hoverCards = {
  nova: ["256px", "10px", "10px", "14px", "20px", "0px 4px 6px -1px", 10],
  vega: ["256px", "10px", "16px", "14px", "20px", "0px 4px 6px -1px", 10],
  maia: ["288px", "18px", "16px", "14px", "20px", "0px 25px 50px -12px", 5],
  lyra: ["256px", "0px", "10px", "12px", "19.5px", "0px 4px 6px -1px", 10],
  mira: ["288px", "10px", "10px", "12px", "19.5px", "0px 4px 6px -1px", 10],
  luma: ["288px", "22px", "16px", "14px", "20px", "0px 10px 15px -3px", 5],
  sera: ["288px", "0px", "16px", "14px", "20px", "0px 4px 6px -1px", 10],
  rhea: ["288px", "22px", "16px", "14px", "20px", "0px 10px 15px -3px", 5],
};

const slot = (page, name) => page.locator(`[data-slot="${name}"]`);

async function withOverlay(page, label, overlay, check) {
  const trigger = page.getByRole("button", { name: label, exact: true });
  await trigger.click();
  await expect(overlay).toBeVisible();
  await check();
  await page.keyboard.press("Escape");
  await expect(overlay).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

async function checkSheet(page, style) {
  const content = slot(page, "sheet-content");
  const [gap, padding, headerGap, title, description, opacity, blur, inset] = sheets[style];
  await withOverlay(page, "Open sheet", content, async () => {
    assert.equal(await content.locator("xpath=ancestor::main").count(), 0, "sheet is portaled");
    await expect(content).toHaveCSS("row-gap", gap);
    await expect(content).toHaveCSS("border-top-left-radius", "0px");
    await expect(slot(page, "sheet-header")).toHaveCSS("padding-top", padding);
    await expect(slot(page, "sheet-header")).toHaveCSS("row-gap", headerGap);
    await expect(slot(page, "sheet-footer")).toHaveCSS("padding-top", padding);
    await expect(slot(page, "sheet-title")).toHaveCSS("font-size", title);
    await expect(slot(page, "sheet-description")).toHaveCSS("font-size", description);
    const alpha = Math.round(255 * opacity);
    const measuredAlpha = await slot(page, "sheet-overlay").evaluate((element) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = getComputedStyle(element).backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      return ctx.getImageData(0, 0, 1, 1).data[3];
    });
    assert.ok(Math.abs(measuredAlpha - alpha) <= 1, `${style} sheet backdrop opacity`);
    await expect(slot(page, "sheet-overlay")).toHaveCSS("backdrop-filter", blur);
    const close = page.getByRole("button", { name: "Close", exact: true });
    await expect(close).toHaveCSS("top", inset);
    if (["luma", "sera", "rhea"].includes(style)) {
      await expect(close).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
    if (style === "sera") {
      await expect(slot(page, "sheet-title")).toHaveCSS("text-transform", "uppercase");
      await expect(slot(page, "sheet-description")).toHaveCSS("margin-top", "2px");
    }
  });
}

async function checkPopover(page, style) {
  const content = slot(page, "popover-content");
  const [radius, padding, gap, headerGap, title, description, shadow] = popovers[style];
  await withOverlay(page, "Open popover", content, async () => {
    assert.equal(await content.locator("xpath=ancestor::main").count(), 0, "popover is portaled");
    await expect(content).toHaveCSS("border-top-left-radius", radius);
    await expect(content).toHaveCSS("padding-top", padding);
    await expect(content).toHaveCSS("row-gap", gap);
    await expect(content).toHaveCSS("box-shadow", new RegExp(shadow));
    await expect(slot(page, "popover-header")).toHaveCSS("row-gap", headerGap);
    await expect(slot(page, "popover-title")).toHaveCSS("font-size", title);
    await expect(slot(page, "popover-description")).toHaveCSS("font-size", description);
    if (style === "sera") {
      await expect(slot(page, "popover-title")).toHaveCSS("text-transform", "uppercase");
      await expect(slot(page, "popover-title")).toHaveCSS("font-weight", "600");
      await expect(slot(page, "popover-description")).toHaveCSS("margin-top", "2px");
    }
    if (["luma", "rhea"].includes(style)) {
      const ring = () =>
        content.evaluate((element) =>
          getComputedStyle(element).getPropertyValue("--tw-ring-color"),
        );
      assert.match(await ring(), /5%, transparent\)/);
      await page.locator("html").evaluate((element) => element.classList.add("dark"));
      assert.match(await ring(), /10%, transparent\)/);
      await page.locator("html").evaluate((element) => element.classList.remove("dark"));
    }
  });
}

async function checkHoverCard(page, style, { keyboard = true } = {}) {
  const trigger = page.getByRole("link", { name: "Hover card preview", exact: true });
  const content = slot(page, "hover-card-content");
  const [width, radius, padding, size, leading, shadow, ring] = hoverCards[style];
  await trigger.hover();
  await expect(content).toBeVisible();
  assert.equal(await content.locator("xpath=ancestor::main").count(), 0, "hover card is portaled");
  await expect(content).toHaveAttribute("data-side", "bottom");
  await expect(content).toHaveCSS("width", width);
  await expect(content).toHaveCSS("border-top-left-radius", radius);
  await expect(content).toHaveCSS("padding-top", padding);
  await expect(content).toHaveCSS("font-size", size);
  await expect(content).toHaveCSS("line-height", leading);
  await expect(content).toHaveCSS("box-shadow", new RegExp(shadow));
  const ringColor = () =>
    content.evaluate((element) => getComputedStyle(element).getPropertyValue("--tw-ring-color"));
  assert.match(await ringColor(), new RegExp(` ${ring}%, transparent\\)`));
  if (style === "luma" || style === "rhea") {
    await page.locator("html").evaluate((element) => element.classList.add("dark"));
    assert.match(await ringColor(), /10%, transparent\)/);
    await page.locator("html").evaluate((element) => element.classList.remove("dark"));
  }
  await content.hover();
  await expect(content).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(content).toBeHidden();

  if (keyboard) {
    await page.getByRole("button", { name: "Open custom popover", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(trigger).toBeFocused();
    await expect(content).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(content).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Shift+Tab");
  }
}

async function checkHoverCardOverrides(page) {
  await page.getByRole("link", { name: "Custom hover card preview", exact: true }).hover();
  const content = slot(page, "hover-card-content");
  await expect(content).toHaveCSS("width", "256px");
  await expect(content).toHaveCSS("border-top-left-radius", "6px");
  await expect(content).toHaveCSS("padding-left", "4px");
  await expect(content).toHaveCSS("padding-top", "12px");
  await expect(content).toHaveCSS("padding-bottom", "16px");
  await expect(content).toHaveCSS("font-size", "18px");
  await expect(content).toHaveCSS("line-height", "22.5px");
  await expect(content).not.toHaveCSS("box-shadow", /0px 10px 15px -3px/);
  assert.match(
    await content.evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--tw-ring-color"),
    ),
    /25%, transparent\)/,
  );
  await page.mouse.move(0, 0);
  await expect(content).toBeHidden();
}

async function checkOverrides(page) {
  const sheet = slot(page, "sheet-content");
  await withOverlay(page, "Open custom sheet", sheet, async () => {
    await expect(sheet).toHaveAttribute("data-side", "bottom");
    await expect(sheet).toHaveCSS("row-gap", "8px");
    await expect(sheet).toHaveCSS("border-top-left-radius", "14px");
    await expect(slot(page, "sheet-header")).toHaveCSS("padding-left", "20px");
    await expect(slot(page, "sheet-header")).toHaveCSS("padding-top", "12px");
    await expect(slot(page, "sheet-header")).toHaveCSS("padding-bottom", "32px");
    await expect(slot(page, "sheet-footer")).toHaveCSS("padding-top", "0px");
    await expect(slot(page, "sheet-title")).toHaveCSS("font-size", "20px");
    await expect(slot(page, "sheet-title")).toHaveCSS("font-weight", "700");
    await expect(slot(page, "sheet-title")).toHaveCSS("text-transform", "none");
  });
  const popover = slot(page, "popover-content");
  await withOverlay(page, "Open custom popover", popover, async () => {
    await expect(popover).toHaveCSS("width", "176px");
    await expect(popover).toHaveCSS("border-top-left-radius", "6px");
    await expect(popover).toHaveCSS("row-gap", "4px");
    await expect(popover).toHaveCSS("padding-left", "0px");
    await expect(popover).toHaveCSS("padding-top", "0px");
    await expect(popover).toHaveCSS("padding-bottom", "16px");
    await expect(slot(page, "popover-title")).toHaveCSS("font-size", "20px");
    await expect(slot(page, "popover-title")).toHaveCSS("font-weight", "700");
    await expect(slot(page, "popover-title")).toHaveCSS("text-transform", "none");
    await expect(slot(page, "popover-description")).toHaveCSS("font-size", "16px");
    await expect(slot(page, "popover-description")).toHaveCSS("margin-top", "0px");
  });
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
  for (const primitive of ["radix", "base"]) {
    const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
    const prefix = primitive === "base" ? "/base" : "";
    await page.goto(
      `http://127.0.0.1:${vite.httpServer.address().port}${prefix}/tests/ui-style-foundations/sheet-popover.html`,
    );
    await expect(page.locator("main")).toHaveAttribute("data-library", primitive);
    for (const style of UI_STYLES) {
      // Inject the exact stylesheet used by the preview and by exports.
      const css = getUiStyleCss(`${primitive}-${style}`);
      const stylesheet = css ? await page.addStyleTag({ content: css }) : undefined;
      await checkSheet(page, style);
      await checkPopover(page, style);
      await checkHoverCard(page, style);
      if (style === "sera") await checkOverrides(page);
      if (style === "luma") await checkHoverCardOverrides(page);
      await page.setViewportSize({ width: 390, height: 800 });
      await checkHoverCard(page, style, { keyboard: false });
      await page.setViewportSize({ width: 900, height: 800 });
      await stylesheet?.evaluate((element) => element.remove());
      console.log(`${primitive}-${style}: Sheet, Popover and HoverCard match`);
    }
    await checkSheet(page, "nova");
    await checkPopover(page, "nova");
    await page.close();
  }
} finally {
  await browser?.close();
  await vite.close();
}
