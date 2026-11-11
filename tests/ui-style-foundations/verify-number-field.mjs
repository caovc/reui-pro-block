import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";
import { chromium } from "playwright";
import { createServer } from "vite";
import { UI_STYLES } from "../../src/foundations/styles/index.ts";

// The free registry's Group and both outer stepper corners, then each
// stepper's inline padding and icon at the small, standard and large sizes.
const expected = {
  nova: { radius: 10, padding: [6, 8, 10], icons: [14, 16, 16] },
  vega: { radius: 8, padding: [8, 10, 12], icons: [14, 16, 16] },
  maia: { radius: 26, padding: [8, 10, 12], icons: [14, 16, 16] },
  lyra: { radius: 0, padding: [6, 8, 10], icons: [14, 16, 16] },
  mira: { radius: 8, padding: [6, 6, 8], icons: [12, 14, 14] },
  luma: { radius: 22, padding: [8, 10, 12], icons: [14, 16, 16] },
  sera: { radius: 0, padding: [12, 14, 16], icons: [14, 14, 14] },
  rhea: { radius: 18, padding: [6, 8, 10], icons: [14, 16, 16] },
};

const sizes = [
  { label: "Small", groupHeight: 28, inputInline: 8, inputBlock: 2 },
  { label: "Standard", groupHeight: 32, inputInline: 10, inputBlock: 4 },
  { label: "Large", groupHeight: 36, inputInline: 10, inputBlock: 6 },
];

const slot = (name) => `[data-slot="number-field-${name}"]`;

async function expectStyle(control, css) {
  for (const [property, value] of Object.entries(css)) {
    await expect(control).toHaveCSS(property, `${value}px`);
  }
}

async function checkStyle(page, style) {
  const { radius, padding, icons } = expected[style];
  for (const [index, { label, groupHeight, inputInline, inputBlock }] of sizes.entries()) {
    const field = page.getByRole("region", { name: label, exact: true });
    const group = field.locator(slot("group"));
    const decrease = field.getByRole("button", { name: `Decrease ${label}` });
    const increase = field.getByRole("button", { name: `Increase ${label}` });
    await expectStyle(group, { height: groupHeight, "border-top-left-radius": radius });
    await expectStyle(decrease, {
      "padding-inline-start": padding[index],
      "padding-inline-end": padding[index],
      "border-start-start-radius": radius,
      "border-end-start-radius": radius,
      "border-start-end-radius": 0,
    });
    await expectStyle(increase, {
      "padding-inline-start": padding[index],
      "padding-inline-end": padding[index],
      "border-start-end-radius": radius,
      "border-end-end-radius": radius,
      "border-start-start-radius": 0,
    });
    for (const stepper of [decrease, increase]) {
      await expectStyle(stepper.locator("svg"), { width: icons[index], height: icons[index] });
    }
    await expectStyle(field.locator(slot("input")), {
      "padding-inline-start": inputInline,
      "padding-inline-end": inputInline,
      "padding-block-start": inputBlock,
      "padding-block-end": inputBlock,
      "font-size": 14,
    });
  }

  const standard = page.getByRole("region", { name: "Standard" });
  const input = standard.locator(slot("input"));
  await standard.getByRole("button", { name: "Increase Standard" }).click();
  await expect(input).toHaveValue("11");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("10");

  const overrides = page.getByRole("region", { name: "Caller overrides" });
  const customDecrease = overrides.getByRole("button", { name: "Decrease custom" });
  const customIncrease = overrides.getByRole("button", { name: "Increase custom" });
  await expectStyle(overrides.locator(slot("group")), { height: 40, "border-top-left-radius": 13 });
  await expectStyle(customDecrease, { "border-top-right-radius": 13, "padding-inline-start": 10 });
  await expectStyle(customDecrease.locator("svg"), { width: 20, height: 20 });
  await expectStyle(customIncrease, {
    "border-top-left-radius": 13,
    "padding-inline-start": padding[0],
  });
  await expectStyle(overrides.locator(slot("input")), {
    "padding-inline-start": 14,
    "padding-block-start": 8,
  });
}

async function bytes(download) {
  const path = await download.path();
  assert(path, "the browser saved the requested file");
  return readFile(path);
}

async function checkSource(page, entry, primitive, style) {
  const url = new URL(entry);
  const params = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  url.hash = `/block/ecommerce/shopping-cart/shopping-cart-1?${params}`;
  await page.goto(url.href);
  const iframe = page.frameLocator('iframe[title="Save-for-Later Cart live preview"]');
  await expect(iframe.locator("html")).toHaveAttribute("data-ui-style", style);
  await expect(iframe.locator(slot("group")).first()).toHaveCSS(
    "border-top-left-radius",
    `${expected[style].radius}px`,
  );

  await page.getByRole("button", { name: "View code", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const implementation = dialog.getByRole("region", { name: "Block source", exact: true });
  await implementation.getByRole("combobox", { name: "Source file" }).click();
  await page.getByRole("option", { name: "src/theme.css", exact: true }).click();
  const code = implementation.locator('[data-slot="code-block-line-content"]');
  const sourceText = async () => (await code.allTextContents()).join("\n");
  await expect.poll(sourceText).toContain(`Bricklane: ${style} component style`);
  const source = await sourceText();
  assert(source.includes('[data-slot="number-field-group"][class~="rounded-lg"]'));
  assert(source.includes('[data-slot="number-field-increment"][class~="rounded-e-lg"]'));
  await implementation.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source);

  const single = page.waitForEvent("download");
  await implementation.getByRole("button", { name: "Download source file", exact: true }).click();
  assert.equal((await bytes(await single)).toString("utf8"), source);

  const starter = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
  const zip = unzipSync(new Uint8Array(await bytes(await starter)));
  assert.equal(strFromU8(zip["src/theme.css"]), source);
  assert.equal(JSON.parse(strFromU8(zip["components.json"])).style, `${primitive}-${style}`);
  assert(strFromU8(zip["index.html"]).includes(`data-ui-style="${style}"`));
  assert(strFromU8(zip["index.html"]).includes(`data-ui-primitive="${primitive}"`));
  const numberField = await readFile(
    new URL("../../src/components/reui/number-field.tsx", import.meta.url),
  );
  assert.deepEqual(Buffer.from(zip["src/components/reui/number-field.tsx"]), numberField);
}

const vite = await createServer({
  root: fileURLToPath(new URL("../../", import.meta.url)),
  server: { host: "127.0.0.1", port: 0, watch: null },
});
let browser;
try {
  await vite.listen();
  browser = await chromium.launch();
  for (const primitive of ["radix", "base"]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const faults = [];
    page.on("pageerror", (error) => faults.push(error.message));
    const prefix = primitive === "base" ? "/base" : "";
    const entry = `http://127.0.0.1:${vite.httpServer.address().port}${prefix}/`;
    for (const style of UI_STYLES) {
      await page.goto(`${entry}tests/ui-style-foundations/number-field.html?style=${style}`);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
      await checkStyle(page, style);
      console.log(`${primitive}-${style}: all Number Field sizes, overrides and keyboard match`);
    }
    const style = primitive === "base" ? "sera" : "maia";
    await page.setViewportSize({ width: 1440, height: 1000 });
    await checkSource(page, entry, primitive, style);
    assert.deepEqual(faults, []);
    console.log(
      `${primitive}-${style}: cart preview, View, Copy, single CSS and starter ZIP match`,
    );
    await page.close();
  }
} finally {
  await browser?.close();
  await vite.close();
}
