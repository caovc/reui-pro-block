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

async function moveCaretTo(page: Page, editor: Locator, target: number) {
  await expect.poll(async () => (await selection(editor)).synchronized).toBe(true);
  let caret = await selection(editor);
  const limit = Math.abs(caret.from - target) * 2 + 2;
  // Chromium can visit another DOM caret at a mark boundary without changing
  // the editor position. Read the synchronized position after each key.
  for (let step = 0; caret.from !== target && step < limit; step++) {
    expect(caret.from).toBe(caret.to);
    await page.keyboard.press(caret.from > target ? "ArrowLeft" : "ArrowRight");
    await expect.poll(async () => (await selection(editor)).synchronized).toBe(true);
    caret = await selection(editor);
  }
  expect(caret).toMatchObject({ from: target, to: target, synchronized: true });
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
  await moveCaretTo(page, editor, target);
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
      const mode = page.getByRole("combobox", { name: "Document mode", exact: true });
      await mode.click();
      await page.getByRole("option", { name: /^Editing/ }).click();
      await expect(mode).toHaveText("Editing");
      // The mobile review consumer is a real modal Sheet, so use its public controls.
      const review = page.getByRole("dialog", { name: "Suggestions", exact: true });
      const openReview = async () => {
        if (width !== 390) return;
        await page.getByRole("button", { name: /^Suggestions, \d+ open$/ }).click();
        await expect(review).toBeVisible();
      };
      const closeReview = async () => {
        if (width !== 390) return;
        await review.getByRole("button", { name: "Close suggestions", exact: true }).click();
        await page.waitForFunction(
          () =>
            document.querySelector('[data-slot="sheet-content"].contract-review-sheet') === null,
          undefined,
          { polling: "raf", timeout: 5000 },
        );
        await expect(review).toHaveCount(0);
      };
      await splitRevision(page, editor, "ins", "45 days");
      await splitRevision(page, editor, "del", "30 days");
      await openReview();
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
      await closeReview();

      await page.getByRole("button", { name: "Page actions", exact: true }).click();
      await page.getByRole("menuitemcheckbox", { name: "Lock Page", exact: true }).click();
      await expect(editor).toHaveAttribute("contenteditable", "false");
      await openReview();
      await expect(actions).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Accept term change", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Reject term change", exact: true }),
      ).toBeDisabled();
      expect(await nativeState(native)).toEqual(original);
      await closeReview();
      await page.getByRole("button", { name: "Page actions", exact: true }).click();
      await page.getByRole("menuitemcheckbox", { name: "Lock Page", exact: true }).click();
      await expect(editor).toHaveAttribute("contenteditable", "true");
      await openReview();

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

      const confirmation = page.getByRole("alertdialog", {
        name: accept ? "Accept All Suggestions?" : "Reject All Suggestions?",
        exact: true,
      });
      const beforeConfirmationSelection = await selection(native);
      const openConfirmation = async () => {
        await actions.click();
        await page
          .getByRole("menuitem", { name: accept ? "Accept All" : "Reject All", exact: true })
          .click();
        await expect(confirmation).toBeVisible();
        await expect(
          confirmation.getByRole("button", { name: "Cancel", exact: true }),
        ).toBeFocused();
        await expect(confirmation).toContainText(
          accept
            ? "2 suggestions become part of this agreement."
            : "2 suggestions are removed from this agreement.",
        );
        expect(await nativeState(native)).toEqual(original);
        await expect(counter).toHaveText("2");
      };
      await openConfirmation();
      await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(confirmation).toHaveCount(0);
      await expect(actions).toBeFocused();
      expect(await nativeState(native)).toEqual(original);
      const afterCancelSelection = await selection(native);
      expect({
        from: afterCancelSelection.from,
        to: afterCancelSelection.to,
        text: afterCancelSelection.text,
      }).toEqual({
        from: beforeConfirmationSelection.from,
        to: beforeConfirmationSelection.to,
        text: beforeConfirmationSelection.text,
      });
      await expect(counter).toHaveText("2");
      if (width === 390) await expect(review).toBeVisible();
      const focusAfterCancel = await page.evaluate(() => ({
        tagName: document.activeElement?.tagName,
        role: document.activeElement?.getAttribute("role"),
      }));
      await openConfirmation();
      await page.keyboard.press("Escape");
      await expect(confirmation).toHaveCount(0);
      await expect(actions).toBeFocused();
      expect(await nativeState(native)).toEqual(original);
      const afterEscapeSelection = await selection(native);
      expect({
        from: afterEscapeSelection.from,
        to: afterEscapeSelection.to,
        text: afterEscapeSelection.text,
      }).toEqual({
        from: beforeConfirmationSelection.from,
        to: beforeConfirmationSelection.to,
        text: beforeConfirmationSelection.text,
      });
      await expect(counter).toHaveText("2");
      if (width === 390) await expect(review).toBeVisible();
      await openConfirmation();
      const editBoundary = await native.evaluate(
        (element, discardedTag) => {
          const fragment = element.querySelector(`${discardedTag}[data-revision="term"]`);
          if (!fragment) throw new Error("Missing term revision at the edit boundary");
          return (element as HTMLElement & { editor: Editor }).editor.view.posAtDOM(fragment, 0);
        },
        accept ? "del" : "ins",
      );
      // Put both native transactions in the same history time window while the
      // dialog and sheet exit with their regular animations.
      const historyTime = Date.now();
      await page.clock.setFixedTime(historyTime);
      await confirmation
        .getByRole("button", { name: accept ? "Accept All" : "Reject All", exact: true })
        .click();
      const resolved = await nativeState(native);
      await page.waitForFunction(
        (mobile) =>
          document.querySelector('[data-slot="alert-dialog-content"]') === null &&
          (!mobile ||
            document.querySelector('[data-slot="sheet-content"].contract-review-sheet') === null),
        width === 390,
        { polling: "raf", timeout: 5000 },
      );
      await expect(confirmation).toHaveCount(0);
      if (width === 390) await expect(review).toHaveCount(0);
      // The first discarded fragment starts at the cut left by bulk review.
      // Type there so ProseMirror sees an adjacent edit in the same time window.
      await editor
        .locator("strong")
        .filter({ hasText: accept ? "5" : "0" })
        .click();
      await moveCaretTo(page, editor, editBoundary);
      await page.keyboard.type("Q");
      await testInfo.attach("native-review-history", {
        body: JSON.stringify(
          { original, resolved, focusAfterCancel, editBoundary, historyTime },
          null,
          2,
        ),
        contentType: "application/json",
      });
      await page
        .getByRole("toolbar", { name: "Document formatting", exact: true })
        .getByRole("button", { name: "Undo", exact: true })
        .click();
      await expect
        .poll(async () => (await nativeState(native)).document)
        .toEqual(resolved.document);
      await expect(editor.locator("[data-revision]")).toHaveCount(0);
      await expect(counter).toHaveText("0");
      await openReview();
      await expect(actions).toBeDisabled();
      await expect(page.getByText("No Open Suggestions", { exact: true })).toBeVisible();
      await expect(
        page.getByText("Every suggestion in this draft is resolved.", { exact: true }),
      ).toBeVisible();
      await closeReview();
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
      await page
        .locator("[data-sonner-toast]")
        .filter({ hasText: accept ? "2 suggestions accepted" : "2 suggestions rejected" })
        .getByRole("button", { name: "Undo", exact: true })
        .click();
      await expect
        .poll(async () => (await nativeState(native)).document)
        .toEqual(original.document);
      await expect(counter).toHaveText("2");
      await openReview();
      await expect(termCard.locator("strong")).toHaveText("45 days");
      await expect(termCard.locator("del")).toHaveText("30 days");
      await closeReview();
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
    });
  }
}

for (const width of [1440, 390]) {
  test(`contract mode, markup and lock matrix preserves the native document at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-3");
    const native = page.getByRole("textbox", {
      name: "Rich text document",
      exact: true,
      includeHidden: true,
    });
    await expect(native).not.toBeEmpty();
    const original = await nativeState(native);
    const modeControl = page.getByRole("combobox", { name: "Document mode", exact: true });
    const review = page.getByRole("dialog", { name: "Suggestions", exact: true });
    const toolbar = page.getByRole("toolbar", {
      name: "Document formatting",
      exact: true,
      includeHidden: true,
    });
    for (const locked of [false, true]) {
      if (locked) {
        await page.getByRole("button", { name: "Page actions", exact: true }).click();
        await page.getByRole("menuitemcheckbox", { name: "Lock Page", exact: true }).click();
      }
      for (const mode of ["Suggesting", "Editing", "Viewing"]) {
        await modeControl.click();
        await page.getByRole("option", { name: new RegExp(`^${mode}`) }).click();
        for (const markup of ["Final", "Original", "All markup"]) {
          if (width === 390) {
            await page.getByRole("button", { name: /^Suggestions, \d+ open$/ }).click();
            await expect(review).toBeVisible();
            await expect(review).toHaveAttribute("data-side", "right");
            await expect(review).toHaveAttribute("data-slot", "sheet-content");
            // Visibility begins during the free Sheet's native entrance animation.
            // Keep the original exact viewport geometry, waiting within the same expect budget.
            await expect
              .poll(async () => {
                const box = await review.boundingBox();
                return box && { x: box.x, y: box.y, width: box.width, height: box.height };
              })
              .toEqual({ x: 0, y: 0, width, height: 900 });
            const box = await review.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.x).toBe(0);
            expect(box!.y).toBe(0);
            expect(box!.width).toBe(width);
            expect(box!.height).toBe(900);
          }
          await page.getByRole("radio", { name: markup, exact: true }).click();
          const canEdit = !locked && mode !== "Viewing" && markup === "All markup";
          await expect(native).toHaveAttribute("contenteditable", String(canEdit));
          await expect(toolbar).toBeVisible();
          const bold = toolbar.getByRole("button", {
            name: "Bold",
            exact: true,
            includeHidden: true,
          });
          const actions = page.getByRole("button", { name: "Review actions", exact: true });
          const accept = page.getByRole("button", { name: /^Accept .+ change$/ }).first();
          const reject = page.getByRole("button", { name: /^Reject .+ change$/ }).first();
          for (const control of [bold, actions, accept, reject]) {
            if (canEdit) await expect(control).toBeEnabled();
            else await expect(control).toBeDisabled();
          }
          await expect(page.locator(".contract-review-diff del").first()).toBeVisible();
          await expect(page.locator(".contract-review-diff strong").first()).toBeVisible();
          const projection = await native.evaluate((element) => ({
            insertions: [...element.querySelectorAll("ins[data-revision]")].map(
              (mark) => getComputedStyle(mark).display,
            ),
            deletions: [...element.querySelectorAll("del[data-revision]")].map(
              (mark) => getComputedStyle(mark).display,
            ),
          }));
          expect(projection.insertions.length).toBeGreaterThan(0);
          expect(projection.deletions.length).toBeGreaterThan(0);
          expect(
            projection.insertions.every(
              (display) => (display === "none") === (markup === "Original"),
            ),
          ).toBe(true);
          expect(
            projection.deletions.every((display) => (display === "none") === (markup === "Final")),
          ).toBe(true);
          expect(await nativeState(native)).toEqual(original);
          if (width === 390) {
            await review.getByRole("button", { name: "Close suggestions", exact: true }).click();
            await expect(review).toHaveCount(0);
          }
        }
      }
    }
    // Viewing must survive Final → All; that combination must not unlock the editor.
    await expect(modeControl).toHaveText("Viewing");
    await expect(native).toHaveAttribute("contenteditable", "false");
    expect(await nativeState(native)).toEqual(original);
  });

  test(`contract navigation resolves fresh split ranges and restores its active ID on undo at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-3");
    const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
    const native = page.getByRole("textbox", {
      name: "Rich text document",
      exact: true,
      includeHidden: true,
    });
    await expect(editor).not.toBeEmpty();
    await page.getByRole("combobox", { name: "Document mode", exact: true }).click();
    await page.getByRole("option", { name: /^Editing/ }).click();
    await splitRevision(page, editor, "ins", "45 days");
    await splitRevision(page, editor, "del", "30 days");
    const original = await nativeState(native);
    const ranges = await native.evaluate((element) => {
      const instance = (element as HTMLElement & { editor: Editor }).editor;
      const groups = new Map<string, { id: string; first: number; fragments: number }>();
      instance.state.doc.descendants((node, pos) => {
        if (!node.isInline) return;
        for (const mark of node.marks) {
          if (!["revisionInsert", "revisionDelete"].includes(mark.type.name)) continue;
          const id = mark.attrs.revision;
          if (typeof id !== "string" || !id) continue;
          const group = groups.get(id) ?? { id, first: pos, fragments: 0 };
          group.fragments++;
          groups.set(id, group);
        }
      });
      return [...groups.values()];
    });
    expect(ranges.length).toBeGreaterThan(0);
    expect(ranges[0].fragments).toBeGreaterThan(2);
    const navigation = page.getByRole("group", { name: "Suggestions", exact: true });
    const next = navigation.getByRole("button", { name: "Next suggestion", exact: true });
    const previous = navigation.getByRole("button", { name: "Previous suggestion", exact: true });
    await expect(navigation).toContainText(`${ranges.length} open`);
    await next.click();
    await expect(navigation).toContainText(`1 of ${ranges.length}`);
    await expect.poll(async () => (await selection(native)).from).toBe(ranges[0].first);
    expect(await nativeState(native)).toEqual(original);
    await previous.click();
    await expect(navigation).toContainText(`${ranges.length} of ${ranges.length}`);
    await expect.poll(async () => (await selection(native)).from).toBe(ranges.at(-1)!.first);
    await next.click();
    await expect(navigation).toContainText(`1 of ${ranges.length}`);
    const review = page.getByRole("dialog", { name: "Suggestions", exact: true });
    if (width === 390) {
      await page.getByRole("button", { name: /^Suggestions, \d+ open$/ }).click();
      await expect(review).toBeVisible();
    }
    await expect(page.locator('[data-contract-review-card][data-current="true"]')).toHaveAttribute(
      "data-contract-review-card",
      ranges[0].id,
    );
    await page.getByRole("button", { name: `Accept ${ranges[0].id} change`, exact: true }).click();
    if (width === 390) {
      await review.getByRole("button", { name: "Close suggestions", exact: true }).click();
      await expect(review).toHaveCount(0);
    }
    await expect(navigation).toContainText(`${ranges.length - 1} open`);
    await expect(editor.locator(`[data-revision="${ranges[0].id}"]`)).toHaveCount(0);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect.poll(async () => (await nativeState(native)).document).toEqual(original.document);
    await expect(navigation).toContainText(`1 of ${ranges.length}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
