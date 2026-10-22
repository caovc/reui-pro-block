import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("official CodeBlock supports file selection, wrap, copy and file download", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/block/application/auth/auth-4");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  const code = page.locator('.reui-source-viewer[data-slot="code-block"]');
  await expect(code).toContainText("export default function Example");
  await expect(code.locator("pre")).toHaveAttribute("data-code-line-numbers", "true");
  await page.getByRole("combobox", { name: "Source file" }).click();
  await page.getByRole("option", { name: "src/blocks/application/auth-form.tsx", exact: true }).click();
  await expect(code).toContainText("function PasswordAuthForm");
  await page.getByRole("button", { name: "Toggle code wrapping", exact: true }).click();
  await expect(code.locator("pre")).toHaveAttribute("data-wrap", "true");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("function PasswordAuthForm");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source file", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("auth-form.tsx");
  expect(await readFile((await download.path())!, "utf8")).toContain("function PasswordAuthForm");
});

test("official NumberField clamps board zoom and preserves reset/pan controls", async ({ page }) => {
  await page.goto("./#/preview/application/whiteboard/whiteboard-1");
  const field = page.getByLabel("Zoom percentage", { exact: true });
  await expect(field).toHaveValue("60%");
  await field.fill("80%");
  await field.press("Tab");
  await expect(field).toHaveValue("80%");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(field).toHaveValue("90%");
  await field.fill("250%");
  await field.press("Tab");
  await expect(field).toHaveValue("180%");
  await expect(page.getByRole("button", { name: "Zoom in", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Reset zoom and pan", exact: true }).click();
  await expect(field).toHaveValue("60%");
});

test("official framed auth and source viewer fit a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./#/preview/application/auth/auth-4");
  await expect(page.locator('[data-slot="frame"] > [data-slot="frame-panel"]')).toBeVisible();
  await expect(page.getByLabel("Email or username", { exact: true })).toBeVisible();
  await page.goto("./#/block/application/auth/auth-4");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.locator('.reui-source-viewer[data-slot="code-block"]')).toContainText("export default function Example");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  expect(errors).toEqual([]);
});
