import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

test("changing source files clears the previous copy acknowledgement and preserves wrapping", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/block/application/navbar/navbar-11");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const selector = dialog.getByRole("combobox", { name: "Source file", exact: true });
  const source = dialog.locator(".source-code");
  const initialFile = "src/blocks/application/navbar-variants/developer/design.tsx";
  const nextFile = "src/blocks/application/navbar-variants/developer/data.ts";
  const initialCode = await readFile(initialFile, "utf8");
  const nextCode = await readFile(nextFile, "utf8");
  await expect(selector).toHaveText(initialFile);

  const wrap = source.getByRole("button", { name: "Toggle code wrapping", exact: true });
  await wrap.click();
  await expect(wrap).toHaveAttribute("aria-pressed", "true");
  const copy = source.locator('[data-slot="code-block-copy"]');
  await copy.click();
  await expect(copy).toHaveAttribute("aria-label", "Copied");
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(initialCode);

  await selector.click();
  await page.getByRole("option", { name: nextFile, exact: true }).click();
  await expect(selector).toHaveText(nextFile);
  // Read the immediate state: polling until the old acknowledgement times out
  // would hide the misleading feedback this interaction is meant to detect.
  expect(await copy.getAttribute("aria-label")).toBe("Copy");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(initialCode);
  await expect(wrap).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () => {
      const lines = await source.locator('[data-slot="code-block-line-content"]').allTextContents();
      return lines.join("\n");
    })
    .toBe(nextCode);

  await copy.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(nextCode);
  const pendingFile = page.waitForEvent("download");
  await source.getByRole("button", { name: "Download source file", exact: true }).click();
  expect(await readFile((await (await pendingFile).path())!, "utf8")).toBe(nextCode);

  const pendingZip = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
  const zip = unzipSync(new Uint8Array(await readFile((await (await pendingZip).path())!)));
  expect(strFromU8(zip[initialFile])).toBe(initialCode);
  expect(strFromU8(zip[nextFile])).toBe(nextCode);
  expect(zip["src/components/reui/REUI-LICENSE.txt"]).toBeTruthy();
  await page.screenshot({
    path: testInfo.outputPath("selected-source.png"),
    animations: "disabled",
  });
});

test("a synchronized theme change clears the old CSS copy acknowledgement and exports the current CSS", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/block/application/auth/auth-20");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const theme = page.getByRole("dialog").locator(".preset-source");
  await theme.locator("summary").click();
  const copy = theme.locator('[data-slot="code-block-copy"]');

  const controls = await context.newPage();
  await controls.goto("./");
  await controls.getByRole("button", { name: "Customize", exact: true }).click();
  await controls.getByRole("combobox", { name: "Accent color", exact: true }).click();
  const rose = controls.getByRole("option", { name: "Rose", exact: true });
  await expect(rose).toBeVisible();

  await page.bringToFront();
  await copy.click();
  await expect(copy).toHaveAttribute("aria-label", "Copied");
  const previousCSS = await page.evaluate(() => navigator.clipboard.readText());
  await controls.bringToFront();
  await rose.click();
  await expect(page.locator("html")).toHaveCSS("--primary", "#be123c");
  // The previous CSS remains in the clipboard until the user copies again.
  expect(await copy.getAttribute("aria-label")).toBe("Copy code");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(previousCSS);

  const currentCSS = await page.locator("#preview-preset").textContent();
  expect(currentCSS).toContain("--primary: #be123c");
  await page.bringToFront();
  await copy.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(currentCSS);
  const pending = page.waitForEvent("download");
  await theme.getByRole("button", { name: "Download theme CSS", exact: true }).click();
  expect(await readFile((await (await pending).path())!, "utf8")).toBe(currentCSS);
  await controls.close();
});
