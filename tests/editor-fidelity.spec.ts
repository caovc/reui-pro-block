import { test, expect } from "@playwright/test";

const endDocument = process.platform === "darwin" ? "Meta+ArrowDown" : "Control+End";
const startLine = process.platform === "darwin" ? "Meta+ArrowLeft" : "Home";
const selectLine = process.platform === "darwin" ? "Meta+Shift+ArrowRight" : "Shift+End";
const route = "/#/preview/application/rich-text-editor/rich-text-editor-1";

test("contract toolbar retains editing and suggesting input modes", async ({ page }) => {
  await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-3");
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  await page.getByRole("button", { name: "Suggesting", exact: true }).click();
  await expect(page.getByRole("button", { name: "Editing", exact: true })).toBeVisible();
  await editor.locator("p").last().click();
  await editor.press(endDocument);
  await page.keyboard.type(" Direct addition");
  await expect(editor).toContainText("Direct addition");
  await expect(editor.locator("ins").filter({ hasText: "Direct addition" })).toHaveCount(0);
  await page.getByRole("button", { name: "Editing", exact: true }).click();
  await expect(page.getByRole("button", { name: "Suggesting", exact: true })).toBeVisible();
  await editor.locator("p").last().click();
  await editor.press(endDocument);
  await page.keyboard.type("X");
  await expect(editor.locator("ins").filter({ hasText: "X" })).toHaveText("X");
});

test("assistant toolbar retains the existing generate shortcut", async ({ page }) => {
  await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-5");
  await page.getByRole("button", { name: "Ask assistant", exact: true }).click();
  await expect(page.getByRole("button", { name: "Apply suggestion", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate suggestion", exact: true }),
  ).toBeEnabled();
});

test("registry task checkbox changes the native document and undo restores it", async ({
  page,
}) => {
  await page.goto(route);
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  const task = editor.getByRole("checkbox", { name: "Define success criteria", exact: true });
  await expect(task).not.toBeChecked();
  await task.check();
  await expect(task).toBeChecked();
  await expect(editor.locator('li[data-type="taskItem"]').first()).toHaveAttribute(
    "data-checked",
    "true",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(task).not.toBeChecked();
  await expect(editor.locator('li[data-type="taskItem"]').first()).toHaveAttribute(
    "data-checked",
    "false",
  );
});

test("block type and alignment follow native selection and preserve undo", async ({ page }) => {
  await page.goto(route);
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  await editor.locator("p").last().click();
  await editor.press(endDocument);
  await editor.press("Enter");
  await editor.press("Enter");
  await page.keyboard.type("A native heading");
  await page.getByRole("button", { name: "Block type, Text", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /Heading 2/ }).click();
  const heading = editor.getByRole("heading", { name: "A native heading", exact: true });
  await expect(heading).toHaveJSProperty("tagName", "H2");
  await page.getByRole("button", { name: "Alignment, Align left", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /Align center/ }).click();
  await expect(heading).toHaveCSS("text-align", "center");
  await page.keyboard.press("Escape");
  await editor.locator(":scope > p:not(.document-subtitle)").first().click();
  await expect(page.getByRole("button", { name: "Block type, Text", exact: true })).toBeVisible();
  await heading.click();
  await expect(
    page.getByRole("button", { name: "Block type, Heading 2", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(heading).not.toHaveCSS("text-align", "center");
});

test("link popover retains formatted selection and edits and removes the native link", async ({
  page,
}) => {
  await page.goto(route);
  const linkDialog = page.getByRole("dialog", { name: "Link", exact: true });
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  await editor.locator("p").last().click();
  await editor.press(endDocument);
  await editor.press("Enter");
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("Formatted resource");
  await page.keyboard.press("ControlOrMeta+b");
  await editor.press(startLine);
  await editor.press(selectLine);
  await page.getByRole("button", { name: "Insert link", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Link address", exact: true })
    .fill("https://example.com/brief");
  await page.getByRole("button", { name: "Apply link", exact: true }).click();
  const link = editor.getByRole("link", { name: "Formatted resource", exact: true });
  await expect(link).toHaveAttribute("href", "https://example.com/brief");
  await expect(page.getByRole("group", { name: "Link", exact: true })).toBeVisible();
  await expect(editor.locator("strong").filter({ hasText: "Formatted resource" })).toHaveText(
    "Formatted resource",
  );
  await link.click();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(linkDialog).toBeVisible();
  await expect(page.getByRole("group", { name: "Link", exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Link address", exact: true })).toHaveValue(
    "https://example.com/brief",
  );
  await page
    .getByRole("textbox", { name: "Link address", exact: true })
    .fill("https://example.com/updated");
  await page.getByRole("button", { name: "Apply link", exact: true }).click();
  await expect(link).toHaveAttribute("href", "https://example.com/updated");
  await expect(page.getByRole("group", { name: "Link", exact: true })).toBeVisible();
  await link.click();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(linkDialog).toBeVisible();
  await expect(page.getByRole("group", { name: "Link", exact: true })).toHaveCount(0);
  await linkDialog.getByRole("button", { name: "Remove link", exact: true }).click();
  await expect(linkDialog).toHaveCount(0);
  await expect(link).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Link", exact: true })).toHaveCount(0);
  await expect(editor.locator("strong").filter({ hasText: "Formatted resource" })).toHaveText(
    "Formatted resource",
  );
});

for (const width of [1440, 390]) {
  test(`bounded ReUI frame, native clear undo, view mode and shortcuts at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    const frame = page.locator('.reui-editor[data-slot="frame"]');
    const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
    await expect(editor).not.toBeEmpty();
    const original = await editor.textContent();
    const bounds = await frame.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    const toolbar = page.getByRole("toolbar", { name: "Document formatting", exact: true });
    expect((await toolbar.boundingBox())!.height).toBeLessThanOrEqual(48);
    await expect(frame.locator('[data-slot="frame-panel"]')).toHaveCSS("overflow-y", "auto");
    await expect(frame.locator("footer")).toContainText(
      /\d+ words · [\d,]+ characters · \d+ min read/,
    );
    await page.getByRole("button", { name: "Document actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Clear Document", exact: true }).click();
    await expect(editor).toHaveText("");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(editor).toHaveText(original!);
    await page.getByRole("button", { name: "Document actions", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Viewing", exact: true }).click();
    await expect(editor).toHaveAttribute("contenteditable", "false");
    await expect(
      page.getByRole("toolbar", { name: "Document formatting", exact: true }),
    ).toBeHidden();
    await page.getByRole("button", { name: "Document actions", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Editing", exact: true }).click();
    await expect(editor).toHaveAttribute("contenteditable", "true");
    await page.getByRole("button", { name: "Shortcuts", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Keyboard Shortcuts", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Markdown", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Shortcuts", exact: true })).toBeFocused();
  });
}
