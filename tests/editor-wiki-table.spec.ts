import { test, expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import type { Editor } from "@tiptap/core";

async function nativeDocument(document: Locator) {
  return document.evaluate((element) =>
    (element as HTMLElement & { editor: Editor }).editor.getJSON(),
  );
}

async function saveNativeEvidence(page: Page, testInfo: TestInfo, name: string, sample: unknown) {
  await testInfo.attach(`${name}-native.json`, {
    body: JSON.stringify(sample, null, 2),
    contentType: "application/json",
  });
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await testInfo.attach(`${name}-native.png`, { path, contentType: "image/png" });
}

async function readToolbarRelation(toolbar: Locator) {
  return toolbar.evaluate((element) => {
    const table = element.ownerDocument.querySelector(
      '[role="textbox"][aria-label="Rich text document"] table',
    );
    const toolbarBounds = element.getBoundingClientRect();
    const tableBounds = table?.getBoundingClientRect();
    const tolerance = 2;
    const leftError = tableBounds ? Math.abs(toolbarBounds.left - tableBounds.left) : null;
    const verticalGap = tableBounds ? tableBounds.top - toolbarBounds.bottom : null;
    return {
      toolbarConnected: element.isConnected,
      tableConnected: Boolean(table?.isConnected),
      aligned: leftError !== null && leftError <= tolerance,
      above: verticalGap !== null && verticalGap >= -tolerance,
      adjacent: verticalGap !== null && verticalGap <= toolbarBounds.height + tolerance,
      leftError,
      verticalGap,
      tolerance,
      toolbarBounds: toolbarBounds.toJSON(),
      tableBounds: tableBounds?.toJSON() ?? null,
    };
  });
}

async function readMenuRelation(menu: Locator) {
  return menu.evaluate((element) => {
    const triggers = element.ownerDocument.querySelectorAll(
      '[role="toolbar"][aria-label="Table"] button[aria-label="Delete"]',
    );
    const trigger = triggers.length === 1 ? triggers[0] : null;
    const triggerBounds = trigger?.getBoundingClientRect();
    const triggerStyle = trigger ? getComputedStyle(trigger) : null;
    const menuBounds = element.getBoundingClientRect();
    const side = element.getAttribute("data-side");
    const tolerance = 2;
    const vertical = side === "top" || side === "bottom";
    const horizontal = side === "left" || side === "right";
    const gap = !triggerBounds
      ? null
      : side === "bottom"
        ? menuBounds.top - triggerBounds.bottom
        : side === "top"
          ? triggerBounds.top - menuBounds.bottom
          : side === "right"
            ? menuBounds.left - triggerBounds.right
            : side === "left"
              ? triggerBounds.left - menuBounds.right
              : null;
    const crossAxisOverlap = Boolean(
      triggerBounds &&
      (vertical
        ? menuBounds.right >= triggerBounds.left - tolerance &&
          menuBounds.left <= triggerBounds.right + tolerance
        : horizontal
          ? menuBounds.bottom >= triggerBounds.top - tolerance &&
            menuBounds.top <= triggerBounds.bottom + tolerance
          : false),
    );
    return {
      triggerCount: triggers.length,
      triggerConnected: Boolean(trigger?.isConnected),
      triggerHasArea: Boolean(triggerBounds && triggerBounds.width > 0 && triggerBounds.height > 0),
      triggerVisible: Boolean(
        triggerStyle &&
        triggerStyle.visibility === "visible" &&
        triggerStyle.display !== "none" &&
        Number(triggerStyle.opacity) > 0,
      ),
      triggerStyle: triggerStyle
        ? {
            visibility: triggerStyle.visibility,
            display: triggerStyle.display,
            opacity: triggerStyle.opacity,
          }
        : null,
      positionedSide: vertical || horizontal,
      adjacent: Boolean(
        gap !== null &&
        triggerBounds &&
        gap >= -tolerance &&
        gap <= Math.max(triggerBounds.width, triggerBounds.height) + tolerance,
      ),
      crossAxisOverlap,
      side,
      align: element.getAttribute("data-align"),
      gap,
      tolerance,
      triggerBounds: triggerBounds?.toJSON() ?? null,
      menuBounds: menuBounds.toJSON(),
    };
  });
}

async function captureToolbar(page: Page, toolbar: Locator, testInfo: TestInfo, name: string) {
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toBeInViewport({ ratio: 1 });
  await expect
    .poll(() => readToolbarRelation(toolbar))
    .toMatchObject({
      toolbarConnected: true,
      tableConnected: true,
      aligned: true,
      above: true,
      adjacent: true,
    });
  const relation = await readToolbarRelation(toolbar);
  const sample = await toolbar.evaluate((element) => {
    const bounds = element.getBoundingClientRect().toJSON();
    const controls = Array.from(element.querySelectorAll("button,[role=checkbox]")).map(
      (control) => ({
        label: control.getAttribute("aria-label") ?? control.textContent?.trim() ?? "",
        role: control.getAttribute("role") ?? control.tagName.toLowerCase(),
        checked: control.getAttribute("aria-checked"),
        bounds: control.getBoundingClientRect().toJSON(),
      }),
    );
    return { bounds, controls, viewport: { width: window.innerWidth, height: window.innerHeight } };
  });
  await saveNativeEvidence(page, testInfo, name, { ...sample, relation });
  expect(sample.bounds.x).toBeGreaterThanOrEqual(0);
  expect(sample.bounds.y).toBeGreaterThanOrEqual(0);
  expect(sample.bounds.right).toBeLessThanOrEqual(sample.viewport.width);
  expect(sample.bounds.bottom).toBeLessThanOrEqual(sample.viewport.height);
  expect(sample.controls.map((control) => control.label)).toEqual([
    "Add row below",
    "Add column right",
    "Header row",
    "Delete",
  ]);
  expect(sample.controls.find((control) => control.label === "Header row")?.role).toBe("checkbox");
  expect(sample.controls.find((control) => control.label === "Header row")?.checked).toMatch(
    /^(true|false)$/,
  );
}

async function captureDeleteMenu(page: Page, testInfo: TestInfo, name: string) {
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("opacity", "1");
  await expect(menu).toBeInViewport({ ratio: 1 });
  await expect
    .poll(() => readMenuRelation(menu))
    .toMatchObject({
      triggerCount: 1,
      triggerConnected: true,
      triggerHasArea: true,
      triggerVisible: true,
      positionedSide: true,
      adjacent: true,
      crossAxisOverlap: true,
    });
  const relation = await readMenuRelation(menu);
  const sample = await menu.evaluate((element) => ({
    bounds: element.getBoundingClientRect().toJSON(),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    items: Array.from(element.querySelectorAll('[role="menuitem"]')).map((item) => ({
      label: item.textContent?.trim() ?? "",
      variant: item.getAttribute("data-variant"),
      color: getComputedStyle(item).color,
      destructiveToken: getComputedStyle(item).getPropertyValue("--destructive"),
      bounds: item.getBoundingClientRect().toJSON(),
    })),
  }));
  await saveNativeEvidence(page, testInfo, name, { ...sample, relation });
  expect(sample.bounds.x).toBeGreaterThanOrEqual(0);
  expect(sample.bounds.y).toBeGreaterThanOrEqual(0);
  expect(sample.bounds.right).toBeLessThanOrEqual(sample.viewport.width);
  expect(sample.bounds.bottom).toBeLessThanOrEqual(sample.viewport.height);
  expect(sample.items.map((item) => item.label)).toEqual([
    "Delete Row",
    "Delete Column",
    "Delete Table",
  ]);
  const deletion = sample.items.find((item) => item.label === "Delete Table")!;
  expect(deletion.variant).toBe("destructive");
  expect(deletion.color).not.toBe(sample.items.find((item) => item.label === "Delete Row")!.color);
}

async function nativeSelection(document: Locator) {
  return document.evaluate((element) => {
    const selection = (element as HTMLElement & { editor: Editor }).editor.state.selection;
    return { type: selection.toJSON().type, empty: selection.empty };
  });
}

async function nativeCellState(document: Locator) {
  return document.evaluate((element) => {
    const editor = (element as HTMLElement & { editor: Editor }).editor;
    const selection = editor.state.selection;
    const cells = selection as typeof selection & {
      $anchorCell?: { pos: number };
      $headCell?: { pos: number };
    };
    return {
      document: editor.getJSON(),
      storedMarks: editor.state.storedMarks?.map((mark) => mark.toJSON()) ?? null,
      selection: selection.toJSON(),
      selectionClass: selection.constructor.name,
      cellPositions:
        cells.$anchorCell && cells.$headCell ? [cells.$anchorCell.pos, cells.$headCell.pos] : null,
      undo: editor.can().undo(),
      redo: editor.can().redo(),
    };
  });
}

async function verifyTextSelectionFormatting(page: Page, editor: Locator, table: Locator) {
  const originalDocument = await nativeDocument(editor);
  const cell = table.locator("td").first();
  const originalText = await cell.textContent();
  await cell.click();
  const readCaret = () =>
    cell.evaluate((element) => {
      const root = element.closest('[role="textbox"]') as HTMLElement & { editor: Editor };
      const instance = root.editor;
      const selection = instance.state.selection;
      const cellFor = (node: Node | null) =>
        (node instanceof Element ? node : node?.parentElement)?.closest("td,th") ?? null;
      const nativePoint = instance.view.domAtPos(selection.from);
      const dom = element.ownerDocument.getSelection();
      const domInCell = Boolean(
        dom?.anchorNode &&
        dom.focusNode &&
        cellFor(dom.anchorNode) === element &&
        cellFor(dom.focusNode) === element,
      );
      const domMatchesNative = Boolean(
        domInCell &&
        dom?.anchorNode &&
        dom.focusNode &&
        instance.view.posAtDOM(dom.anchorNode, dom.anchorOffset) === selection.anchor &&
        instance.view.posAtDOM(dom.focusNode, dom.focusOffset) === selection.head,
      );
      return {
        type: selection.toJSON().type,
        empty: selection.empty,
        inCell: cellFor(nativePoint.node) === element,
        domInCell,
        domMatchesNative,
        offset: selection.$from.parentOffset,
      };
    });
  await expect.poll(readCaret).toMatchObject({
    type: "text",
    empty: true,
    inCell: true,
    domInCell: true,
    domMatchesNative: true,
  });
  const caretOffset = (await readCaret()).offset;
  for (let step = 0; step < caretOffset; step++) await page.keyboard.press("ArrowLeft");
  for (const _character of originalText!) await page.keyboard.press("Shift+ArrowRight");
  await expect
    .poll(() =>
      editor.evaluate((element) => {
        const state = (element as HTMLElement & { editor: Editor }).editor.state;
        return state.doc.textBetween(state.selection.from, state.selection.to, " ");
      }),
    )
    .toBe(originalText);
  await expect.poll(() => nativeSelection(editor)).toEqual({ type: "text", empty: false });
  const formatting = page.getByRole("toolbar", { name: "Selection formatting", exact: true });
  await expect(formatting).toBeVisible();
  await expect(page.getByRole("toolbar", { name: "Table", exact: true })).toHaveCount(0);
  await formatting.getByRole("button", { name: "Bold selection", exact: true }).click();
  await expect(cell.locator("strong")).toHaveText(originalText!);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(() => nativeDocument(editor)).toEqual(originalDocument);
  await cell.click();
  await expect.poll(() => nativeSelection(editor)).toEqual({ type: "text", empty: true });
}

test.describe("pointer CellSelection", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });
  test("real cell drag and Escape retain native cells, document, marks and history", async ({
    page,
  }, testInfo) => {
    await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-2");
    const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
    await expect(
      page
        .getByRole("navigation", { name: "Document outline", exact: true })
        .getByRole("button", { name: "Useful resources", exact: true }),
    ).toBeVisible();
    await editor.locator(":scope > p").first().click();
    const original = await nativeCellState(editor);
    expect(original.undo).toBe(false);
    expect(original.redo).toBe(false);
    const table = editor.locator("table").first();
    const cells = table.locator("tr").nth(1).locator("td");
    await cells.first().scrollIntoViewIfNeeded();
    const start = await cells.nth(0).boundingBox();
    const end = await cells.nth(1).boundingBox();
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();
    await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
    await page.mouse.down();
    try {
      await page.mouse.move(end!.x + end!.width / 2, end!.y + end!.height / 2, { steps: 8 });
    } finally {
      await page.mouse.up();
    }
    await expect.poll(async () => (await nativeCellState(editor)).selection.type).toBe("cell");
    const selected = await nativeCellState(editor);
    expect(selected.cellPositions).not.toBeNull();
    expect(selected.cellPositions![0]).not.toBe(selected.cellPositions![1]);
    expect(selected.document).toEqual(original.document);
    expect(selected.storedMarks).toEqual(original.storedMarks);
    expect(selected.undo).toBe(false);
    expect(selected.redo).toBe(false);
    const toolbar = page.getByRole("toolbar", { name: "Table", exact: true });
    await expect(
      page.getByRole("toolbar", { name: "Selection formatting", exact: true }),
    ).toHaveCount(0);
    await captureToolbar(page, toolbar, testInfo, "real-cell-selection");
    await saveNativeEvidence(page, testInfo, "real-cell-selection-state", selected);
    const trigger = toolbar.getByRole("button", { name: "Delete", exact: true });
    await trigger.click();
    await captureDeleteMenu(page, testInfo, "real-cell-selection-menu");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    const after = await nativeCellState(editor);
    expect(after.selection.type).toBe("cell");
    expect(after.selection).toEqual(selected.selection);
    expect(after.cellPositions).toEqual(selected.cellPositions);
    expect(after.document).toEqual(original.document);
    expect(after.storedMarks).toEqual(original.storedMarks);
    expect(after.undo).toBe(false);
    expect(after.redo).toBe(false);
    await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Redo", exact: true })).toBeDisabled();
    await saveNativeEvidence(page, testInfo, "real-cell-selection-after-escape", after);
  });
});

async function verifyDeleteBoundaries(
  page: Page,
  editor: Locator,
  table: Locator,
  testInfo: TestInfo,
) {
  const originalDocument = await nativeDocument(editor);
  const originalText = await table.textContent();
  const originalRows = await table.locator("tr").count();
  const originalColumns = await table.locator("tr").first().locator("th,td").count();
  let edits = 0;
  for (let remaining = originalRows - 1; remaining >= 1; remaining--) {
    await table.locator("th,td").first().click();
    await page
      .getByRole("toolbar", { name: "Table", exact: true })
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Delete Row", exact: true }).click();
    await expect(table.locator("tr")).toHaveCount(remaining);
    edits++;
  }
  for (let remaining = originalColumns - 1; remaining >= 1; remaining--) {
    await table.locator("th,td").first().click();
    await page
      .getByRole("toolbar", { name: "Table", exact: true })
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Delete Column", exact: true }).click();
    await expect(table.locator("tr").first().locator("th,td")).toHaveCount(remaining);
    edits++;
  }
  await table.locator("th,td").first().click();
  const boundaryDocument = await nativeDocument(editor);
  await page
    .getByRole("toolbar", { name: "Table", exact: true })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByRole("menuitem", { name: "Delete Row", exact: true })).toBeDisabled();
  await expect(page.getByRole("menuitem", { name: "Delete Column", exact: true })).toBeDisabled();
  await expect(page.getByRole("menuitem", { name: "Delete Table", exact: true })).toBeEnabled();
  await captureDeleteMenu(page, testInfo, "last-row-column");
  const readOnlyEditor = page.getByRole("textbox", {
    name: "Rich text document",
    exact: true,
    includeHidden: true,
  });
  await expect.poll(() => nativeDocument(readOnlyEditor)).toEqual(boundaryDocument);
  await page.keyboard.press("Escape");
  for (let edit = 0; edit < edits; edit++) {
    await page.getByRole("button", { name: "Undo", exact: true }).click();
  }
  await expect(table.locator("tr")).toHaveCount(originalRows);
  await expect(table.locator("tr").first().locator("th,td")).toHaveCount(originalColumns);
  await expect(table).toHaveText(originalText!);
  await expect.poll(() => nativeDocument(editor)).toEqual(originalDocument);
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });
    test("wiki header row changes the real first row and undo restores its cells", async ({
      page,
    }, testInfo) => {
      await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-2");
      const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
      await expect(
        page
          .getByRole("navigation", { name: "Document outline", exact: true })
          .getByRole("button", { name: "Useful resources", exact: true }),
      ).toBeVisible();
      const table = editor.locator("table").first();
      const original = await table.textContent();
      const originalDocument = await nativeDocument(editor);
      await verifyTextSelectionFormatting(page, editor, table);
      await table.locator("td").first().click();
      const toolbar = page.getByRole("toolbar", { name: "Table", exact: true });
      await expect(
        page.getByRole("toolbar", { name: "Selection formatting", exact: true }),
      ).toHaveCount(0);
      const header = toolbar.getByRole("checkbox", { name: "Header row", exact: true });
      await expect(header).toBeChecked();
      await captureToolbar(page, toolbar, testInfo, "header-on");
      await header.click();
      await expect(table.locator("tr").first().locator("th")).toHaveCount(0);
      await expect(table.locator("tr").first().locator("td")).toHaveCount(3);
      await expect(header).not.toBeChecked();
      await expect(table).toHaveText(original!);
      await captureToolbar(page, toolbar, testInfo, "header-off");
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await expect(table.locator("tr").first().locator("th")).toHaveCount(3);
      await expect(table).toHaveText(original!);
      await expect(header).toBeChecked();
      await expect.poll(() => nativeDocument(editor)).toEqual(originalDocument);
      await captureToolbar(page, toolbar, testInfo, "header-undo");
    });

    test("wiki delete menu changes native rows, columns and table with independent undo", async ({
      page,
    }, testInfo) => {
      await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-2");
      const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
      await expect(
        page
          .getByRole("navigation", { name: "Document outline", exact: true })
          .getByRole("button", { name: "Useful resources", exact: true }),
      ).toBeVisible();
      const table = editor.locator("table").first();
      const original = await table.textContent();
      const originalDocument = await nativeDocument(editor);
      for (const operation of ["Delete Row", "Delete Column", "Delete Table"]) {
        await table.locator("td").first().click();
        const toolbar = page.getByRole("toolbar", { name: "Table", exact: true });
        await captureToolbar(page, toolbar, testInfo, operation + "-toolbar");
        await toolbar.getByRole("button", { name: "Delete", exact: true }).click();
        await captureDeleteMenu(page, testInfo, operation + "-menu");
        await page.getByRole("menuitem", { name: operation, exact: true }).click();
        if (operation === "Delete Row") await expect(table.locator("tr")).toHaveCount(2);
        else if (operation === "Delete Column")
          await expect(table.locator("tr").first().locator("th")).toHaveCount(2);
        else await expect(editor.locator("table")).toHaveCount(0);
        await page.getByRole("button", { name: "Undo", exact: true }).click();
        await expect(table.locator("tr")).toHaveCount(3);
        await expect(table.locator("tr").first().locator("th")).toHaveCount(3);
        await expect(table).toHaveText(original!);
        await expect.poll(() => nativeDocument(editor)).toEqual(originalDocument);
      }
      await verifyDeleteBoundaries(page, editor, table, testInfo);
    });
  });
}
