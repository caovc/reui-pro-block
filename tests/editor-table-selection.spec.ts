import { test, expect, type Locator } from "@playwright/test";
import type { Editor } from "@tiptap/core";

async function nativeState(document: Locator) {
  return document.evaluate((element) => {
    // Tiptap attaches its public Editor to the editable root. Read only;
    // all selection changes below come from the user's real pointer.
    const editor = (element as HTMLElement & { editor: Editor }).editor;
    return {
      document: editor.getJSON(),
      storedMarks: editor.state.storedMarks?.map((mark) => mark.toJSON()) ?? null,
      collapsed: editor.state.selection.empty,
      table: editor.isActive("table"),
    };
  });
}

test("collapsed pointer selection keeps table actions synchronized without editing the document", async ({
  page,
}) => {
  await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-2");
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  // The real outline is populated by onCreate, after heading IDs are assigned.
  await expect(
    page
      .getByRole("navigation", { name: "Document outline", exact: true })
      .getByRole("button", { name: "Useful resources", exact: true }),
  ).toBeVisible();
  const paragraph = editor.locator(":scope > p").first();
  await paragraph.click();
  await expect(editor).toHaveClass(/ProseMirror-focused/);
  const original = await nativeState(editor);
  expect(original.collapsed).toBe(true);
  expect(original.table).toBe(false);
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Redo", exact: true })).toBeDisabled();

  const cell = editor.locator("table").first().locator("td").first();
  // Settle the real block-hover control before clicking. Hover does not move
  // the caret, so incidental onNodeChange renders cannot hide a missing
  // selection subscription behind a later unrelated component update.
  await cell.hover();
  await expect(page.getByRole("button", { name: "Block actions", exact: true })).toBeVisible();
  expect((await nativeState(editor)).table).toBe(false);
  await cell.click();
  await expect.poll(async () => (await nativeState(editor)).table).toBe(true);
  await expect(page.getByRole("button", { name: "Table actions", exact: true })).toBeVisible();
  const inTable = await nativeState(editor);
  expect(inTable.collapsed).toBe(true);
  expect(inTable.document).toEqual(original.document);
  expect(inTable.storedMarks).toEqual(original.storedMarks);

  await paragraph.click();
  await expect.poll(async () => (await nativeState(editor)).table).toBe(false);
  await expect(page.getByRole("button", { name: "Table actions", exact: true })).toHaveCount(0);
  const after = await nativeState(editor);
  expect(after.collapsed).toBe(true);
  expect(after.document).toEqual(original.document);
  expect(after.storedMarks).toEqual(original.storedMarks);
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Redo", exact: true })).toBeDisabled();
});
