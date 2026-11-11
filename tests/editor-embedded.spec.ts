import { test, expect } from "@playwright/test";
import type { Editor } from "@tiptap/core";

for (const width of [1440, 390]) {
  test(`actual Collaborative Editor detail iframe retains gutter insertion and native history at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#/block/application/rich-text-editor/rich-text-editor-4");
    const frameElement = page.getByTitle("Collaborative Editor live preview", { exact: true });
    const frame = page.frameLocator('iframe[title="Collaborative Editor live preview"]');
    const editor = frame.getByRole("textbox", { name: "Rich text document", exact: true });
    await expect(editor.getByText(/Shared reply drafts let/)).toBeVisible();
    const original = await editor.evaluate((node) =>
      (node as HTMLElement & { editor: Editor }).editor.getJSON(),
    );
    await editor.locator(":scope > p").first().hover();
    const plus = frame.getByRole("button", { name: "Add block below", exact: true });
    await expect(plus).toBeVisible();
    const measured = {
      outer: await frameElement.evaluate((node) => ({
        rect: node.getBoundingClientRect().toJSON(),
        transform: getComputedStyle(node).transform,
      })),
      inner: await editor.evaluate((node) => ({
        width: node.ownerDocument.defaultView!.innerWidth,
        scale: node.ownerDocument.defaultView!.visualViewport?.scale,
        buttons: Array.from(
          node.parentElement!.querySelectorAll(
            '[aria-label="Add block below"], [aria-label="Block actions"]',
          ),
        ).map((element) => element.getBoundingClientRect().toJSON()),
      })),
    };
    for (const rect of measured.inner.buttons) {
      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(measured.inner.width);
    }
    await info.attach("actual-iframe-geometry", {
      body: JSON.stringify(measured, null, 2),
      contentType: "application/json",
    });
    await plus.click();
    await frame.getByRole("option", { name: "Heading 2", exact: true }).click();
    await page.keyboard.type("Embedded native heading");
    await expect(
      editor.getByRole("heading", { name: "Embedded native heading", exact: true }),
    ).toBeVisible();
    const undo = frame.getByRole("button", { name: "Undo", exact: true });
    await undo.click();
    await undo.click();
    await undo.click();
    expect(
      await editor.evaluate((node) => (node as HTMLElement & { editor: Editor }).editor.getJSON()),
    ).toEqual(original);
    expect(errors).toEqual([]);
  });
}
