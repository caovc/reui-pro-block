import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import { getUiStyleCss, UI_STYLES } from "../../src/foundations/styles/index.ts";

// Expected measurements from the upstream style definitions, at a 16px root.
const expected = {
  nova: {
    button: [32, 10],
    input: [32, 10],
    frame: [14, 3],
    card: [14, 16],
    item: [10, 12],
    menu: [10, 4],
    dialog: [14, 16],
    tabs: [32, 10],
  },
  vega: {
    button: [36, 8],
    input: [36, 8],
    frame: [14, 3],
    card: [14, 24],
    item: [8, 16],
    menu: [8, 4],
    dialog: [14, 24],
    tabs: [36, 10],
  },
  maia: {
    button: [36, 26],
    input: [36, 26],
    frame: [18, 3],
    card: [18, 24],
    item: [18, 16],
    menu: [18, 4],
    dialog: [26, 24],
    tabs: [36, 26],
  },
  lyra: {
    button: [32, 0],
    input: [32, 0],
    frame: [0, 3],
    card: [0, 16],
    item: [0, 12],
    menu: [0, 0],
    dialog: [0, 16],
    tabs: [32, 0],
  },
  mira: {
    button: [28, 8],
    input: [28, 8],
    frame: [10, 3],
    card: [10, 16],
    item: [8, 12],
    menu: [10, 4],
    dialog: [14, 16],
    tabs: [32, 10],
  },
  luma: {
    button: [36, 26],
    input: [36, 22],
    frame: [26, 4],
    card: [26, 24],
    item: [18, 16],
    menu: [22, 6],
    dialog: [26, 24],
    tabs: [36, 9999],
  },
  sera: {
    button: [40, 0],
    input: [40, 0],
    frame: [0, 3],
    card: [0, 32],
    item: [0, 16],
    menu: [0, 6],
    dialog: [0, 24],
    tabs: [40, 0],
  },
  rhea: {
    button: [32, 18],
    input: [32, 18],
    frame: [24, 3],
    card: [24, 20],
    item: [18, 16],
    menu: [18, 4],
    dialog: [24, 24],
    tabs: [32, 18],
  },
};

const properties = {
  button: ["height", "border-top-left-radius"],
  input: ["height", "border-top-left-radius"],
  frame: ["border-top-left-radius", "padding-left"],
  card: ["border-top-left-radius", "padding-top"],
  item: ["border-top-left-radius", "padding-left"],
  menu: ["border-top-left-radius", "padding-top"],
  dialog: ["border-top-left-radius", "padding-top"],
  tabs: ["height", "border-top-left-radius"],
};

const expectedSelect = {
  nova: [32, 10, 10, 4],
  vega: [36, 8, 8, 6],
  maia: [36, 26, 18, 8],
  lyra: [32, 0, 0, 8],
  mira: [28, 8, 10, 4],
  luma: [36, 22, 22, 8],
  sera: [40, 0, 0, 8],
  rhea: [32, 18, 18, 6],
};

// Checkbox size/radius, then default and small Switch track dimensions.
const expectedToggles = {
  nova: [16, 4, 32, 18.4, 24, 14],
  vega: [16, 4, 32, 18.4, 24, 14],
  maia: [16, 6, 32, 18.4, 24, 14],
  lyra: [16, 0, 32, 18.4, 24, 14],
  mira: [16, 4, 28, 16.6, 24, 14],
  luma: [16, 5, 44, 20, 28, 16],
  sera: [18, 0, 33, 18, 25, 14],
  rhea: [16, 5, 32, 20, 24, 16],
};

const expectedProgress = {
  nova: [4, "pill", 14],
  vega: [6, "pill", 14],
  maia: [12, 26, 14],
  lyra: [4, 0, 12],
  mira: [4, 8, 12],
  luma: [12, "pill", 14],
  sera: [2, 0, 12],
  rhea: [8, 18, 14],
};

async function checkProgress(page, style) {
  const [height, corner, labelSize] = expectedProgress[style];
  const progress = page.getByRole("progressbar", { name: "Progress example", exact: true });
  const custom = page.getByRole("progressbar", { name: "Custom progress", exact: true });
  const labeledTrack = page.locator('[data-slot="progress-track"]');
  for (const track of [progress, labeledTrack]) {
    await expect(track).toHaveCSS("height", `${height}px`);
    const radius = await track.evaluate((node) => parseFloat(getComputedStyle(node).borderRadius));
    if (corner === "pill") assert.ok(radius > 100);
    else assert.equal(radius, corner);
  }
  await expect(progress).toHaveAttribute("aria-valuenow", "50");
  await expect(custom).toHaveCSS("height", "20px");
  await expect(custom).toHaveCSS("border-top-left-radius", "6px");
  await expect(page.locator('[data-slot="progress-label"]')).toHaveCSS(
    "font-size",
    `${labelSize}px`,
  );
}

async function checkRadioGroup(page, style) {
  const group = page.getByRole("radiogroup", { name: "Example radio group", exact: true });
  const custom = page.getByRole("radiogroup", { name: "Custom radio group", exact: true });
  const first = group.getByRole("radio", { name: "First radio", exact: true });
  const second = group.getByRole("radio", { name: "Second radio", exact: true });
  await expect(group).toHaveCSS("row-gap", style === "nova" || style === "lyra" ? "8px" : "12px");
  await expect(custom).toHaveCSS("row-gap", "20px");
  await expect(first).toHaveCSS("width", style === "sera" ? "18px" : "16px");
  if (style === "rhea") await expect(first).toHaveCSS("border-top-left-radius", "18px");
  await expect(first).toBeChecked();
  await first.focus();
  // Radix defers roving focus and checks whether the arrow is still held.
  await page.keyboard.down("ArrowDown");
  try {
    await expect(second).toBeFocused();
    await expect(second).toBeChecked();
  } finally {
    await page.keyboard.up("ArrowDown");
  }
  await first.press("Space");
  await expect(first).toBeChecked();
}

const expectedSlider = {
  nova: [4, 12, 12],
  vega: [6, 16, 16],
  maia: [12, 16, 16],
  lyra: [4, 12, 12],
  mira: [4, 12, 12],
  luma: [8, 24, 16],
  sera: [2, 12, 12],
  rhea: [4, 16, 16],
};

async function checkSlider(page, style) {
  const [trackSize, thumbWidth, thumbHeight] = expectedSlider[style];
  for (const direction of ["horizontal", "vertical"]) {
    const root = page.getByTestId(`${direction}-slider`);
    const track = root.locator('[data-slot="slider-track"]');
    const thumb = root.locator('[data-slot="slider-thumb"]');
    const vertical = direction === "vertical";
    await expect(track).toHaveCSS(vertical ? "width" : "height", `${trackSize}px`);
    await expect(thumb).toHaveCSS("width", `${vertical ? thumbHeight : thumbWidth}px`);
    await expect(thumb).toHaveCSS("height", `${vertical ? thumbWidth : thumbHeight}px`);
  }
}

const expectedConfirmation = {
  nova: [16, 14],
  vega: [24, 14],
  maia: [24, 26],
  lyra: [16, 0],
  mira: [16, 14],
  luma: [24, 26],
  sera: [24, 0],
  rhea: [24, 24],
};

async function checkConfirmation(page, style) {
  const [padding, corner] = expectedConfirmation[style];
  const trigger = page.getByRole("button", { name: "Open confirmation", exact: true });
  const dialog = page.getByRole("alertdialog", { name: "Example confirmation", exact: true });
  await trigger.click();
  await expect(dialog).toHaveCSS("padding-top", `${padding}px`);
  await expect(dialog).toHaveCSS("border-top-left-radius", `${corner}px`);
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

const expectedIdentity = {
  nova: [26, 14, 32],
  vega: [26, 14, 36],
  maia: [26, 14, 36],
  lyra: [0, 12, 32],
  mira: ["pill", 12, 28],
  luma: [22, 14, 36],
  sera: [0, 14, 40],
  rhea: [18, 14, 32],
};

async function checkIdentityAndToggle(page, style) {
  const [corner, countFontSize, toggleHeight] = expectedIdentity[style];
  const badge = page.getByTestId("identity-badge");
  if (corner === "pill") {
    const badgeRadius = await badge.evaluate((node) =>
      parseFloat(getComputedStyle(node).borderRadius),
    );
    assert.ok(badgeRadius > 100);
  } else {
    await expect(badge).toHaveCSS("border-top-left-radius", `${corner}px`);
  }
  await expect(page.getByTestId("avatar-count")).toHaveCSS("font-size", `${countFontSize}px`);
  await expect(page.getByRole("button", { name: "Standalone toggle" })).toHaveCSS(
    "height",
    `${toggleHeight}px`,
  );
  const name = { name: "Vertical options", exact: true };
  const group = page.getByRole("group", name).or(page.getByRole("toolbar", name));
  const first = group.getByRole("button", { name: "First toggle" });
  const last = group.getByRole("button", { name: "Last toggle" });
  await expect(group).toHaveCSS("flex-direction", "column");
  await first.press("ArrowDown");
  await expect(last).toBeFocused();
  await last.press("ArrowUp");
  await expect(first).toBeFocused();
}

const expectedTextEntry = {
  nova: [10, 32, 10, 20],
  vega: [8, 36, 8, 28],
  maia: [14, 36, 26, 28],
  lyra: [0, 32, 0, 20],
  mira: [8, 28, 8, 16],
  luma: [18, 36, 26, 28],
  sera: [0, 40, 0, 40],
  rhea: [18, 32, 18, 24],
};

async function checkTextEntry(page, style) {
  const [textareaCorner, groupHeight, groupCorner, fieldGap] = expectedTextEntry[style];
  const textarea = page.getByRole("textbox", { name: "Note", exact: true });
  const group = page.getByRole("group", { name: "Example input group", exact: true });
  await expect(textarea).toHaveCSS("border-top-left-radius", `${textareaCorner}px`);
  await expect(group).toHaveCSS("height", `${groupHeight}px`);
  await expect(group).toHaveCSS("border-top-left-radius", `${groupCorner}px`);
  await expect(page.getByTestId("example-field-group")).toHaveCSS("row-gap", `${fieldGap}px`);
}

async function checkToggles(page, style) {
  const [boxSize, boxRadius, switchWidth, switchHeight, smallWidth, smallHeight] =
    expectedToggles[style];
  const checkbox = page.getByRole("checkbox", { name: "Example checkbox", exact: true });
  const custom = page.getByRole("checkbox", { name: "Custom checkbox", exact: true });
  await expect(checkbox).toHaveCSS("width", `${boxSize}px`);
  await expect(checkbox).toHaveCSS("border-top-left-radius", `${boxRadius}px`);
  await expect(custom).toHaveCSS("width", "20px");
  const customRadius = await custom.evaluate((element) =>
    parseFloat(getComputedStyle(element).borderTopLeftRadius),
  );
  assert.ok(customRadius > 8, `${style} preserves the custom checkbox radius`);
  await checkbox.press("Space");
  await expect(checkbox).toBeChecked();
  await checkbox.press("Space");
  await expect(checkbox).not.toBeChecked();

  for (const [name, width, height] of [
    ["Example switch", switchWidth, switchHeight],
    ["Small switch", smallWidth, smallHeight],
  ]) {
    const toggle = page.getByRole("switch", { name, exact: true });
    await expect(toggle).toHaveCSS("width", `${width}px`);
    await expect
      .poll(async () => Math.abs((await toggle.boundingBox()).height - height))
      .toBeLessThan(0.03);
    await toggle.press("Space");
    await expect(toggle).toBeChecked();
    await toggle.press("Space");
    await expect(toggle).not.toBeChecked();
  }
}

const root = fileURLToPath(new URL("../../", import.meta.url));
const vite = await createViteServer({
  root,
  appType: "mpa",
  server: { host: "127.0.0.1", port: 0, watch: null },
});
let browser;
try {
  await vite.listen();
  browser = await chromium.launch();
  for (const primitive of ["radix", "base"]) {
    const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
    const prefix = primitive === "base" ? "/base" : "";
    const url = `http://127.0.0.1:${vite.httpServer.address().port}${prefix}/tests/ui-style-foundations/fixture.html`;
    await page.goto(url);
    await expect(page.locator("main")).toHaveAttribute("data-library", primitive);
    const select = page.getByRole("combobox", { name: "Component style" });

    async function checkSurface(style, surface) {
      for (const [index, property] of properties[surface].entries()) {
        await expect(page.getByTestId(surface)).toHaveCSS(
          property,
          `${expected[style][surface][index]}px`,
        );
      }
    }

    assert.equal(getUiStyleCss("nova"), "");
    assert.equal(getUiStyleCss("radix-nova"), "");
    assert.equal(getUiStyleCss("constructor"), "");

    for (const style of UI_STYLES) {
      await select.selectOption(style);
      assert.equal(await page.locator("#fixture-style").textContent(), getUiStyleCss(style));
      assert.equal(getUiStyleCss(`base-${style}`), getUiStyleCss(`radix-${style}`));
      for (const surface of ["button", "input", "frame", "card", "item", "tabs"]) {
        await checkSurface(style, surface);
      }
      await expect(page.getByTestId("custom-button")).toHaveCSS("height", "48px");
      const customRadius = await page.getByTestId("custom-button").evaluate((button) => {
        return Number.parseFloat(getComputedStyle(button).borderTopLeftRadius);
      });
      assert.ok(customRadius > 100, `${style} preserves the custom pill radius`);
      await expect(page.getByTestId("line-tabs")).toHaveCSS("border-top-left-radius", "0px");
      await checkToggles(page, style);
      await checkProgress(page, style);
      await checkRadioGroup(page, style);
      await checkSlider(page, style);
      await checkIdentityAndToggle(page, style);
      await checkTextEntry(page, style);
      await page.getByRole("button", { name: "Open menu" }).click();
      await checkSurface(style, "menu");
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("menu")).toHaveCount(0);
      await page.getByRole("button", { name: "Open dialog" }).click();
      await checkSurface(style, "dialog");
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("dialog")).toHaveCount(0);
      await checkConfirmation(page, style);
      const [height, triggerRadius, popupRadius, itemPadding] = expectedSelect[style];
      const trigger = page.getByRole("combobox", { name: "Example select" });
      await expect(trigger).toHaveCSS("height", `${height}px`);
      await expect(trigger).toHaveCSS("border-top-left-radius", `${triggerRadius}px`);
      await trigger.click();
      await expect(page.getByTestId("select-content")).toHaveCSS(
        "border-top-left-radius",
        `${popupRadius}px`,
      );
      await expect(page.getByTestId("select-item")).toHaveCSS("padding-top", `${itemPadding}px`);
      await page.getByRole("option", { name: "Second choice" }).click();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      console.log(
        `${primitive}-${style}: shared controls and overlays match, including Progress, Radio Group and Slider`,
      );
    }

    await select.selectOption("sera");
    await expect(page.getByTestId("button")).toHaveCSS("text-transform", "uppercase");
    await expect(page.getByTestId("input")).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
    await select.selectOption("nova");
    await checkSurface("nova", "button");

    // The exact CSS returned for a starter also works after a fresh page load.
    await page.reload();
    const exported = await page.addStyleTag({ content: getUiStyleCss("luma") });
    await checkSurface("luma", "frame");
    await checkSurface("luma", "button");
    await checkToggles(page, "luma");
    await exported.evaluate((element) => element.remove());
    await checkSurface("nova", "button");
    await page.close();
  }
} finally {
  await browser?.close();
  await vite.close();
}
