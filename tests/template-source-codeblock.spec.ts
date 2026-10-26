import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { unzipSync, strFromU8 } from "fflate";

for (const width of [1440, 390]) {
  test(`template source uses the actual highlighted CodeBlock with exact text and working wrapping at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#/templates/flux");
    const trigger = page.getByRole("button", { name: "View template source", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    const selector = dialog.getByRole("combobox", { name: "Template source file", exact: true });
    const filename = (await selector.textContent())!.trim();
    const expected = await readFile(filename, "utf8");
    const code = dialog.locator(".template-source-code");
    expect(await code.evaluate((node) => node.tagName)).toBe("CODE");
    await expect(dialog.locator('[data-slot="code-block"]')).toHaveCount(1);
    await expect.poll(() => code.textContent()).toBe(expected);
    await expect
      .poll(() => code.locator('[data-slot="code-block-token"]').count())
      .toBeGreaterThan(0);
    await page.evaluate(() => document.fonts.ready);
    const rows = code.locator('[data-slot="code-block-line"]');
    await expect(rows).toHaveCount(expected.split("\n").length);
    expect(
      await rows.evaluateAll((nodes) =>
        nodes.every((node) => {
          const lineHeight = parseFloat(getComputedStyle(node).lineHeight);
          return Math.abs(node.getBoundingClientRect().height - lineHeight) < 0.1;
        }),
      ),
    ).toBe(true);
    const viewport = dialog.locator(".template-source-viewport");
    expect(await viewport.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    await viewport.evaluate((node) => node.scrollTo({ top: 180, behavior: "instant" }));
    expect(await viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    const region = dialog.getByRole("region", { name: `Template source code: ${filename}` });
    await region.focus();
    const beforePageDown = await viewport.evaluate((node) => node.scrollTop);
    await region.press("PageDown");
    await expect
      .poll(() => viewport.evaluate((node) => node.scrollTop))
      .toBeGreaterThan(beforePageDown);
    const wrap = dialog.getByRole("button", { name: "Toggle template code wrapping", exact: true });
    await expect(wrap).toHaveAttribute("aria-pressed", "false");
    await wrap.click();
    await expect(wrap).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() => viewport.evaluate((node) => node.scrollWidth <= node.clientWidth + 1))
      .toBe(true);
    await selector.click();
    const secondFile = "src/templates/workflow/flux-evaluations.tsx";
    await page.getByRole("option", { name: secondFile, exact: true }).click();
    await expect(selector).toBeFocused();
    await expect(wrap).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => code.textContent()).toBe(await readFile(secondFile, "utf8"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`template-source-${width}.png`),
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test("template source resets copy feedback and saves the selected implementation as exact UTF-8 file and project bytes", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/templates/flux");
  await page.getByRole("button", { name: "View template source", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const selector = dialog.getByRole("combobox", { name: "Template source file", exact: true });
  const first = (await selector.textContent())!.trim();
  await dialog.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(await readFile(first, "utf8"));
  await selector.click();
  const filename = "src/templates/workflow/flux-memory.tsx";
  await page.getByRole("option", { name: filename, exact: true }).click();
  const expected = await readFile(filename);
  await expect(dialog.getByRole("button", { name: "Copy", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Copied", exact: true })).toHaveCount(0);
  await expect
    .poll(() => dialog.locator(".template-source-code").textContent())
    .toBe(expected.toString("utf8"));
  await dialog.getByRole("button", { name: "Copy", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(expected.toString("utf8"));
  const pendingFile = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download template source file", exact: true }).click();
  const file = await pendingFile;
  expect(file.suggestedFilename()).toBe(basename(filename));
  expect(await readFile((await file.path())!)).toEqual(expected);
  const pendingProject = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download project", exact: true }).click();
  const project = await pendingProject;
  const files = unzipSync(new Uint8Array(await readFile((await project.path())!)));
  expect(strFromU8(files[filename])).toBe(expected.toString("utf8"));
});
