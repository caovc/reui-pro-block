import { test, expect, type Locator, type Page } from "@playwright/test";
import type { Editor } from "@tiptap/core";

async function selection(editor: Locator) {
  return editor.evaluate((element) => {
    const instance = (element as HTMLElement & { editor: Editor }).editor;
    const native = instance.state.selection;
    const dom = element.ownerDocument.getSelection();
    return {
      from: native.from,
      to: native.to,
      text: instance.state.doc.textBetween(native.from, native.to),
      synchronized: Boolean(
        dom?.anchorNode &&
        dom.focusNode &&
        instance.view.posAtDOM(dom.anchorNode, dom.anchorOffset) === native.anchor &&
        instance.view.posAtDOM(dom.focusNode, dom.focusOffset) === native.head,
      ),
    };
  });
}

async function splitRevision(page: Page, editor: Locator, tag: "ins" | "del", text: string) {
  const insertion = editor.locator(`${tag}[data-revision="term"]`);
  await expect(insertion).toHaveText(text);
  const target = await editor.evaluate(
    (element, target) => {
      const instance = (element as HTMLElement & { editor: Editor }).editor;
      let position = -1;
      instance.state.doc.descendants((node, pos) => {
        if (
          node.text === target.text &&
          node.marks.some(
            (mark) =>
              mark.type.name === (target.tag === "ins" ? "revisionInsert" : "revisionDelete") &&
              mark.attrs.revision === "term",
          )
        )
          position = pos + 1;
      });
      return position;
    },
    { tag, text },
  );
  expect(target).toBeGreaterThan(0);
  await insertion.click();
  await expect.poll(async () => (await selection(editor)).synchronized).toBe(true);
  const caret = await selection(editor);
  expect(caret.from).toBe(caret.to);
  for (let step = caret.from; step > target; step--) await page.keyboard.press("ArrowLeft");
  for (let step = caret.from; step < target; step++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowRight");
  await expect
    .poll(() => selection(editor))
    .toMatchObject({ from: target, to: target + 1, text: text[1], synchronized: true });
  await page
    .getByRole("toolbar", { name: "Selection formatting", exact: true })
    .getByRole("button", { name: "Bold selection", exact: true })
    .click();
  await expect(editor.locator(`strong ${tag}[data-revision="term"]`)).toHaveText(text[1]);
  await expect(editor.locator(`${tag}[data-revision="term"]`)).toHaveCount(3);
}

async function nativeState(editor: Locator) {
  return editor.evaluate((element) => {
    const instance = (element as HTMLElement & { editor: Editor }).editor;
    return {
      document: instance.getJSON(),
      text: instance.state.doc.textContent,
      undo: instance.can().undo(),
      redo: instance.can().redo(),
    };
  });
}

for (const width of [1440, 390]) {
  for (const accept of [true, false]) {
    test(`contract ${accept ? "accepts" : "rejects"} all split revisions with native history at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-3");
      await expect(page).toHaveTitle("Contract Redlines — Preview");
      const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
      const native = page.getByRole("textbox", {
        name: "Rich text document",
        exact: true,
        includeHidden: true,
      });
      await expect(editor).not.toBeEmpty();
      await page.getByRole("button", { name: "Suggesting", exact: true }).click();
      await expect(page.getByRole("button", { name: "Editing", exact: true })).toBeVisible();
      await splitRevision(page, editor, "ins", "45 days");
      await splitRevision(page, editor, "del", "30 days");
      const termCard = page
        .getByRole("button", { name: "Accept term change", exact: true })
        .locator("..")
        .locator("..");
      await expect(termCard.locator("strong")).toHaveText("45 days");
      await expect(termCard.locator("del")).toHaveText("30 days");
      const original = await nativeState(native);
      const counter = page.getByLabel("Pending suggested changes", { exact: true });
      await expect(counter).toHaveText("2");
      const actions = page.getByRole("button", { name: "Review actions", exact: true });

      await page.getByRole("button", { name: "Page actions", exact: true }).click();
      await page.getByRole("menuitemcheckbox", { name: "Lock Page", exact: true }).click();
      await expect(editor).toHaveAttribute("contenteditable", "false");
      await expect(actions).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Accept term change", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Reject term change", exact: true }),
      ).toBeDisabled();
      expect(await nativeState(native)).toEqual(original);
      await page.getByRole("button", { name: "Page actions", exact: true }).click();
      await page.getByRole("menuitemcheckbox", { name: "Lock Page", exact: true }).click();
      await expect(editor).toHaveAttribute("contenteditable", "true");

      await actions.click();
      const menu = page.getByRole("menu", { name: "Review actions", exact: true });
      await expect(menu).toBeVisible();
      await expect
        .poll(() => menu.evaluate((element) => getComputedStyle(element).opacity))
        .toBe("1");
      expect(await nativeState(native)).toEqual(original);
      const triggerBox = await page
        .getByRole("button", { name: "Review actions", exact: true, includeHidden: true })
        .boundingBox();
      const menuBox = await menu.boundingBox();
      expect(triggerBox).not.toBeNull();
      expect(menuBox).not.toBeNull();
      expect(menuBox!.width).toBeGreaterThan(0);
      expect(menuBox!.x).toBeGreaterThanOrEqual(0);
      expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(width);
      await testInfo.attach("review-menu", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(actions).toBeFocused();
      expect(await nativeState(native)).toEqual(original);

      await actions.click();
      await page
        .getByRole("menuitem", {
          name: accept ? "Accept all changes" : "Reject all changes",
          exact: true,
        })
        .click();
      const resolvedAt = Date.now();
      const resolved = await nativeState(native);
      // Type immediately into a retained fragment rather than an unrelated paragraph.
      await editor
        .locator("strong")
        .filter({ hasText: accept ? "5" : "0" })
        .click();
      await page.keyboard.type("Q");
      const nextInputDelayMs = Date.now() - resolvedAt;
      await testInfo.attach("native-review-history", {
        body: JSON.stringify({ original, resolved, nextInputDelayMs }, null, 2),
        contentType: "application/json",
      });
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await expect
        .poll(async () => (await nativeState(native)).document)
        .toEqual(resolved.document);
      await expect(editor.locator("[data-revision]")).toHaveCount(0);
      await expect(counter).toHaveText("0");
      await expect(actions).toBeDisabled();
      await expect(editor).toContainText(accept ? "45 days" : "30 days");
      await expect(editor).toContainText(accept ? "$9,500" : "$8,000");
      await expect(editor).not.toContainText(accept ? "30 days" : "45 days");
      await expect(editor).not.toContainText(accept ? "$8,000" : "$9,500");
      await expect(editor.locator("strong").filter({ hasText: accept ? "5" : "0" })).toHaveText(
        accept ? "5" : "0",
      );
      // All blocks outside the reviewed paragraph and their node attributes remain exact.
      expect(resolved.document.content!.filter((_node, index) => index !== 6)).toEqual(
        original.document.content!.filter((_node, index) => index !== 6),
      );
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await expect
        .poll(async () => (await nativeState(native)).document)
        .toEqual(original.document);
      await expect(counter).toHaveText("2");
      await expect(termCard.locator("strong")).toHaveText("45 days");
      await expect(termCard.locator("del")).toHaveText("30 days");
      await page.getByRole("button", { name: "Redo", exact: true }).click();
      await expect
        .poll(async () => (await nativeState(native)).document)
        .toEqual(resolved.document);
      await expect(counter).toHaveText("0");
      await testInfo.attach("review-resolved", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(errors).toEqual([]);
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
      expect(nextInputDelayMs).toBeLessThan(300);
    });
  }
}
