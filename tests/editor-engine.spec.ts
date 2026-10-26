import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const endDocument = process.platform === "darwin" ? "Meta+ArrowDown" : "Control+End";
const startLine = process.platform === "darwin" ? "Meta+ArrowLeft" : "Home";
const selectLine = process.platform === "darwin" ? "Meta+Shift+ArrowRight" : "Shift+End";
const route = (kind: number) => `/#/preview/application/rich-text-editor/rich-text-editor-${kind}`;

test("Tiptap edits, formats and restores the saved document with native undo and redo", async ({
  page,
}) => {
  await page.goto(route(2));
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  await expect(editor).toHaveClass(/tiptap/);
  await editor.click();
  await editor.press(endDocument);
  await editor.press("Enter");
  await page.keyboard.type("A verified editor paragraph");
  await expect(editor).toContainText("A verified editor paragraph");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor).not.toContainText("A verified editor paragraph");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(editor).toContainText("A verified editor paragraph");
  await editor.click();
  await editor.press(endDocument);
  await editor.press(startLine);
  await editor.press(selectLine);
  await page.getByRole("button", { name: "Bold selection", exact: true }).click();
  await expect(editor.locator("strong").last()).toHaveText("A verified editor paragraph");
  await expect(page.getByText("All changes saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(editor.locator("strong").last()).toHaveText("A verified editor paragraph");
});

test("slash blocks, mentions and a live contents node use the document schema", async ({
  page,
}) => {
  await page.goto(route(2));
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  await editor.locator("p").last().click();
  await editor.press(endDocument);
  await editor.press("Enter");
  await page.keyboard.type("/");
  await page.getByRole("option", { name: "Heading 2", exact: true }).click();
  await page.keyboard.type("Engine section");
  await expect(editor.getByRole("heading", { name: "Engine section", exact: true })).toBeVisible();
  await editor.press("End");
  await editor.press("Enter");
  await page.keyboard.type("@");
  await page.getByRole("option", { name: "Olivia Rhye", exact: true }).click();
  await expect(editor.locator('[data-type="mention"]')).toContainText("Olivia Rhye");
  await editor.press("End");
  await editor.press("Enter");
  await page.keyboard.type("/");
  await page.getByRole("option", { name: "Contents", exact: true }).click();
  await expect(editor.getByRole("navigation", { name: "Contents", exact: true })).toHaveCount(2);
  await expect(
    editor.getByRole("navigation", { name: "Contents", exact: true }).last(),
  ).toContainText("Engine section");
});

test("table row and column commands update the real table and undo reverses them", async ({
  page,
}) => {
  await page.goto(route(2));
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  const table = editor.locator("table").first();
  await table.locator("td").first().click();
  await page.getByRole("button", { name: "Table actions", exact: true }).click();
  await page.getByRole("button", { name: "Add row", exact: true }).click();
  await expect(table.locator("tr")).toHaveCount(4);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(table.locator("tr")).toHaveCount(3);
  await table.locator("td").first().click();
  await page.getByRole("button", { name: "Table actions", exact: true }).click();
  await page.getByRole("button", { name: "Add column", exact: true }).click();
  await expect(table.locator("tr").first().locator("th")).toHaveCount(4);
});

test("page lock prevents text and formatting edits while retaining content", async ({ page }) => {
  await page.goto(route(2));
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  const original = await editor.textContent();
  await page.getByRole("button", { name: "Page actions", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Lock Page", exact: true }).click();
  await expect(editor).toHaveAttribute("contenteditable", "false");
  await editor.click();
  await page.keyboard.type("SHOULD NOT APPEAR");
  await expect(editor).toHaveText(original);
  await page.getByRole("button", { name: "Page actions", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Lock Page", exact: true }).click();
  await expect(editor).toHaveAttribute("contenteditable", "true");
});

test("contract review accepts and rejects native schema marks with undo", async ({ page }) => {
  await page.goto(route(3));
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  await expect(editor.locator('ins[data-revision="term"]')).toHaveText("45 days");
  await page.getByRole("button", { name: "Accept term change", exact: true }).click();
  await expect(editor.locator('[data-revision="term"]')).toHaveCount(0);
  await expect(editor).toContainText("45 days");
  await page.getByRole("button", { name: "Reject fee change", exact: true }).click();
  await expect(editor).toContainText("$8,000");
  await expect(editor).not.toContainText("$9,500");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor.locator('ins[data-revision="fee"]')).toHaveText("$9,500");
});

for (const width of [1440, 390]) {
  test(`editor renders without runtime errors and stays within ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const kind of [1, 2, 3, 4, 5]) {
      await page.goto(route(kind));
      await expect(
        page.getByRole("textbox", { name: "Rich text document", exact: true }),
      ).not.toBeEmpty();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    expect(errors).toEqual([]);
  });
}

test("HTML export preserves schema content without editor-only NodeView controls", async ({
  page,
}) => {
  await page.goto(route(2));
  await expect(page.locator(".rich-text-contents")).toBeVisible();
  await page.getByRole("button", { name: "Page actions", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export HTML", exact: true }).click();
  const html = await readFile((await (await pending).path())!, "utf8");
  expect(html).toContain('<nav data-type="contents">');
  expect(html).toContain("<table");
  expect(html).not.toContain("data-node-view-wrapper");
  expect(html).not.toContain("<button");
});

test("native keyboard formatting keeps toolbar state synchronized", async ({ page }) => {
  await page.goto(route(1));
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await editor.locator("p").last().click();
  const bold = page.getByRole("button", { name: "Bold", exact: true });
  await page.keyboard.press("ControlOrMeta+b");
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.type("Keyboard bold");
  await expect(editor.locator("strong").filter({ hasText: "Keyboard bold" })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+b");
  await expect(bold).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor).not.toContainText("Keyboard bold");
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(editor.locator("strong").filter({ hasText: "Keyboard bold" })).toBeVisible();
});
