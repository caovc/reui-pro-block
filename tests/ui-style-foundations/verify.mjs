import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import { once } from "node:events";
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

const root = fileURLToPath(new URL("../../", import.meta.url));
const vite = await createViteServer({
  root,
  appType: "mpa",
  server: { middlewareMode: true, hmr: false, watch: null },
});
const server = createHttpServer(vite.middlewares);
let browser;
try {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  const url = `http://127.0.0.1:${server.address().port}/tests/ui-style-foundations/fixture.html`;
  await page.goto(url);
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
    await page.getByRole("button", { name: "Open menu" }).click();
    await checkSurface(style, "menu");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("menu")).toHaveCount(0);
    await page.getByRole("button", { name: "Open dialog" }).click();
    await checkSurface(style, "dialog");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("dialog")).toHaveCount(0);
    console.log(`${style}: button, input, Frame, Card, Item, menu, dialog and tabs match`);
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
  await exported.evaluate((element) => element.remove());
  await checkSurface("nova", "button");
} finally {
  await browser?.close();
  await vite.close();
  server.close();
}
