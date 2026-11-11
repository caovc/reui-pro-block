import { test, expect, type Page, type Locator } from "@playwright/test";
import type { Editor } from "@tiptap/core";

const route = (kind: number) => `/#/preview/application/rich-text-editor/rich-text-editor-${kind}`;
const box = (page: Page) => page.getByRole("textbox", { name: "Rich text document", exact: true });
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const menu = (page: Page) => page.getByRole("menu", { name: "Block actions", exact: true });
const endDocument = process.platform === "darwin" ? "Meta+ArrowDown" : "Control+End";

async function state(editor: Locator) {
  // The native modal DropdownMenu makes the background editor aria-hidden while open.
  // Read the same public editor DOM without changing its state or bypassing pointer checks.
  return editor
    .page()
    .getByRole("textbox", { name: "Rich text document", exact: true, includeHidden: true })
    .evaluate((node) => {
      const instance = (node as HTMLElement & { editor: Editor }).editor;
      return {
        doc: instance.getJSON(),
        selection: instance.state.selection.toJSON(),
        activeBlock: {
          type: instance.state.selection.$from.parent.type.name,
          level: instance.state.selection.$from.parent.attrs.level ?? null,
        },
        selectedText: instance.state.doc.textBetween(
          instance.state.selection.from,
          instance.state.selection.to,
          "\n",
        ),
      };
    });
}

async function open(page: Page, kind = 2) {
  await page.goto(route(kind));
  const editor = box(page);
  await expect(editor).toHaveClass(/tiptap/);
  if (kind === 2) {
    await expect(
      page
        .getByRole("navigation", { name: "Document outline", exact: true })
        .getByRole("button", { name: "Useful resources", exact: true }),
    ).toBeAttached();
  }
  return editor;
}

async function openHandle(page: Page, target: Locator) {
  await target.hover();
  await button(page, "Block actions").click();
  await expect(menu(page)).toBeVisible();
}

test("slash matches the twelve original entries and native keyboard scroll, filter, dismiss, history", async ({
  page,
}, info) => {
  const editor = await open(page);
  await editor.locator(":scope > p").last().click();
  await page.keyboard.press(endDocument);
  await page.keyboard.press("Enter");
  await page.keyboard.type("/");
  const list = page.getByRole("listbox", { name: "Insert block", exact: true });
  await expect(list).toBeVisible();
  const names = [
    "Text",
    "Heading 1",
    "Heading 2",
    "Heading 3",
    "Bullet List",
    "Numbered List",
    "To-do List",
    "Quote",
    "Code Block",
    "Divider",
    "Table",
    "Contents",
  ];
  await expect(list.getByRole("option")).toHaveCount(12);
  for (const name of names)
    await expect(list.getByRole("option", { name, exact: true })).toBeAttached();
  await expect(list.getByRole("option", { name: "Text", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(await list.evaluate((node) => node.scrollTop)).toBe(0);
  await expect(editor).toBeFocused();
  // Wait for the existing Popover's native zoom-in to finish before measuring pixels.
  await expect
    .poll(async () =>
      list.evaluate((node) => node.closest('[data-slot="command"]')?.getBoundingClientRect().width),
    )
    .toBe(288);
  const metrics = await list.evaluate((node) => ({
    list: node.getBoundingClientRect().toJSON(),
    scrollHeight: node.scrollHeight,
    rows: Array.from(node.querySelectorAll('[role="option"]')).map((row) => ({
      text: row.textContent,
      height: row.getBoundingClientRect().height,
      tile: row.querySelector('[data-slot="icon-tile"]')?.getBoundingClientRect().toJSON(),
    })),
    command: node.closest('[data-slot="command"]')?.getBoundingClientRect().toJSON(),
  }));
  await info.attach("slash-initial-metrics", {
    body: JSON.stringify(metrics, null, 2),
    contentType: "application/json",
  });
  expect(metrics.command?.width).toBe(288);
  expect(metrics.list.height).toBeLessThanOrEqual(288);
  expect(metrics.rows.map((row) => row.height)).toEqual(Array(12).fill(48));
  await info.attach("slash-initial", { body: await page.screenshot(), contentType: "image/png" });
  for (let index = 0; index < 8; index++) await page.keyboard.press("ArrowDown");
  for (let index = 0; index < 5; index++) await page.keyboard.press("ArrowUp");
  const heading = list.getByRole("option", { name: "Heading 3", exact: true });
  await expect(heading).toHaveAttribute("aria-selected", "true");
  expect(await list.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  const selectedBox = await heading.boundingBox();
  const listBox = await list.boundingBox();
  expect(selectedBox!.y).toBeGreaterThanOrEqual(listBox!.y);
  expect(selectedBox!.y + selectedBox!.height).toBeLessThanOrEqual(
    listBox!.y + listBox!.height + 1,
  );
  await info.attach("slash-keyboard-heading3", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  const beforeInsert = (await state(editor)).doc;
  await page.keyboard.press("Enter");
  await expect(list).toHaveCount(0);
  const inserted = (await state(editor)).doc;
  expect((await state(editor)).activeBlock).toEqual({ type: "heading", level: 3 });
  expect(inserted.content?.at(-2)?.type).toBe("heading");
  expect(inserted.content?.at(-2)?.attrs?.level).toBe(3);
  expect(inserted.content?.at(-1)?.type).toBe("paragraph");
  await button(page, "Undo").click();
  expect((await state(editor)).doc).toEqual(beforeInsert);
  await button(page, "Redo").click();
  expect((await state(editor)).doc).toEqual(inserted);
  await editor.locator(":scope > h3").last().click();
  await page.keyboard.press(endDocument);
  await page.keyboard.press("Enter");
  await page.keyboard.type("/zzzz");
  await expect(page.getByText("No matching blocks", { exact: true })).toBeVisible();
  for (let index = 0; index < 4; index++) await page.keyboard.press("Backspace");
  await expect(list.getByRole("option")).toHaveCount(12);
  await page.keyboard.press("Escape");
  await expect(list).toHaveCount(0);
  await page.keyboard.type("after escape");
  await expect(editor).toContainText("/after escape");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/");
  await expect(list).toBeVisible();
  await page.getByRole("banner").click();
  await expect(list).toHaveCount(0);
});

test("handle has nine real conversions, native commands, cancellation bookmark and reopen ownership", async ({
  page,
}, info) => {
  const editor = await open(page);
  const paragraph = editor.locator(":scope > p").first();
  await paragraph.click({ position: { x: 30, y: 10 } });
  const original = await state(editor);
  const paragraphText = await paragraph.textContent();
  await openHandle(page, paragraph);
  expect((await state(editor)).selectedText).toEqual(paragraphText);
  await expect(menu(page).getByRole("menuitem", { name: /^Move Up/ })).toBeEnabled();
  await menu(page).getByRole("menuitem", { name: "Turn Into", exact: true }).hover();
  const types = page.getByRole("menu", { name: "Turn Into", exact: true });
  await expect(types.getByRole("menuitemradio")).toHaveCount(9);
  await expect(types.getByRole("menuitemradio", { name: "Text", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await info.attach("handle-turn-into", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(editor).toBeFocused();
  expect(await state(editor)).toEqual(original);
  for (let iteration = 0; iteration < 2; iteration++) {
    await openHandle(page, paragraph);
    await page.keyboard.press("Escape");
    if (iteration === 1) await expect(menu(page)).toHaveCount(0);
    await openHandle(
      page,
      editor.getByRole("heading", { name: "Our design principles", exact: true }),
    );
    await menu(page)
      .getByRole("menuitem", { name: /^Duplicate/ })
      .click();
    await expect(
      editor.getByRole("heading", { name: "Our design principles", exact: true }),
    ).toHaveCount(2);
    await button(page, "Undo").click();
    expect((await state(editor)).doc).toEqual(original.doc);
  }
  const conversions = [
    ["Heading 1", "heading", 1],
    ["Heading 2", "heading", 2],
    ["Heading 3", "heading", 3],
    ["Bullet List", "bulletList"],
    ["Numbered List", "orderedList"],
    ["To-do List", "taskList"],
    ["Quote", "blockquote"],
    ["Code Block", "codeBlock"],
  ] as const;
  for (const [name, type, level] of conversions) {
    await openHandle(page, paragraph);
    await menu(page).getByRole("menuitem", { name: "Turn Into", exact: true }).hover();
    await types.getByRole("menuitemradio", { name, exact: true }).click();
    const converted = (await state(editor)).doc;
    expect(converted.content?.[1]?.type).toBe(type);
    if (level) expect(converted.content?.[1]?.attrs?.level).toBe(level);
    await button(page, "Undo").click();
    expect((await state(editor)).doc).toEqual(original.doc);
    await button(page, "Redo").click();
    expect((await state(editor)).doc).toEqual(converted);
    await button(page, "Undo").click();
  }
  await openHandle(
    page,
    editor.getByRole("heading", { name: "Our design principles", exact: true }),
  );
  await menu(page).getByRole("menuitem", { name: "Turn Into", exact: true }).hover();
  await types.getByRole("menuitemradio", { name: "Text", exact: true }).click();
  await expect(
    editor.getByRole("heading", { name: "Our design principles", exact: true }),
  ).toHaveCount(0);
  await expect(
    editor.locator(":scope > p").filter({ hasText: "Our design principles" }),
  ).toBeVisible();
  await button(page, "Undo").click();
  expect((await state(editor)).doc).toEqual(original.doc);
});

test("handle commands shortcuts and plus retain separate native history events", async ({
  page,
}) => {
  const editor = await open(page);
  const original = (await state(editor)).doc;
  const heading = editor.getByRole("heading", { name: "Our design principles", exact: true });
  for (const name of ["Move Up", "Move Down", "Duplicate", "Delete"]) {
    await openHandle(page, heading);
    await menu(page)
      .getByRole("menuitem", { name: new RegExp(`^${name}`) })
      .click();
    const changed = (await state(editor)).doc;
    expect(changed).not.toEqual(original);
    await button(page, "Undo").click();
    expect((await state(editor)).doc).toEqual(original);
    await button(page, "Redo").click();
    expect((await state(editor)).doc).toEqual(changed);
    await button(page, "Undo").click();
  }
  await openHandle(page, editor.locator(":scope > h1"));
  await expect(menu(page).getByRole("menuitem", { name: /^Move Up/ })).toBeDisabled();
  await page.keyboard.press("Escape");
  await heading.click();
  for (const keys of [
    "ControlOrMeta+d",
    "ControlOrMeta+Shift+ArrowUp",
    "ControlOrMeta+Shift+ArrowDown",
  ]) {
    await page.keyboard.press(keys);
    expect((await state(editor)).doc).not.toEqual(original);
    await button(page, "Undo").click();
    expect((await state(editor)).doc).toEqual(original);
    await heading.click();
  }
  await heading.hover();
  await button(page, "Add block below").click();
  await expect(page.getByRole("listbox", { name: "Insert block", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "Quote", exact: true }).click();
  const plusInserted = (await state(editor)).doc;
  expect(plusInserted.content?.filter((node) => node.type === "blockquote")).toHaveLength(2);
  await button(page, "Undo").click();
  expect((await state(editor)).doc).not.toEqual(original);
  await button(page, "Undo").click();
  expect((await state(editor)).doc).toEqual(original);
});

for (const width of [1440, 390]) {
  test(`real heading paragraph list gutter stays inside paper and viewport at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    for (const kind of [2, 3, 4, 5]) {
      const editor = await open(page, kind);
      const original = (await state(editor)).doc;
      const samples = [];
      const headingTag = kind === 4 ? "h2" : "h1";
      const targets = [
        editor.locator(`:scope > ${headingTag}`).first(),
        editor.locator(":scope > p").first(),
      ];
      // Contract's actual seed document contains headings and paragraphs, with no list.
      if (kind !== 3) targets.push(editor.locator(":scope > ul").first());
      for (const target of targets) {
        await expect(target).toBeAttached();
        await target.hover();
        await expect(button(page, "Block actions")).toBeVisible();
        const metrics = await editor.evaluate((node) => ({
          paper: node.parentElement!.getBoundingClientRect().toJSON(),
          editor: node.getBoundingClientRect().toJSON(),
          buttons: Array.from(
            node.parentElement!.querySelectorAll(
              '[aria-label="Add block below"], [aria-label="Block actions"]',
            ),
          ).map((element) => ({
            name: element.getAttribute("aria-label"),
            rect: element.getBoundingClientRect().toJSON(),
          })),
        }));
        const targetRect = await target.boundingBox();
        expect(metrics.buttons).toHaveLength(2);
        for (const { rect } of metrics.buttons) {
          expect(rect.left).toBeGreaterThanOrEqual(0);
          expect(rect.right).toBeLessThanOrEqual(width);
          if (kind !== 2) expect(rect.left).toBeGreaterThanOrEqual(metrics.paper.left);
          expect(rect.right).toBeLessThanOrEqual(targetRect!.x - 4);
        }
        samples.push({ target: await target.evaluate((node) => node.tagName), ...metrics });
      }
      expect((await state(editor)).doc).toEqual(original);
      await info.attach(`kind-${kind}-${width}-geometry`, {
        body: JSON.stringify(samples, null, 2),
        contentType: "application/json",
      });
      await info.attach(`kind-${kind}-${width}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await editor.locator(":scope > p").first().hover();
      await button(page, "Add block below").click();
      await expect(page.getByRole("listbox", { name: "Insert block", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });
}

test("standalone Document slash and compact Mesh keep their actual entry layout", async ({
  page,
}, info) => {
  const editor = await open(page, 1);
  await editor.locator(":scope > p").last().click();
  await page.keyboard.press(endDocument);
  await page.keyboard.press("Enter");
  await page.keyboard.type("/");
  await expect(page.getByRole("listbox", { name: "Insert block", exact: true })).toBeVisible();
  await expect(button(page, "Block actions")).toHaveCount(0);
  await page.goto("/#/template-preview/mesh");
  const nav = button(page, "Open navigation");
  if (await nav.isVisible()) await nav.click();
  await button(page, "Documents").click();
  await expect(box(page)).toContainText("Route Planner Product Brief");
  await expect.poll(async () => (await box(page).boundingBox())?.width).toBe(640);
  await expect(box(page)).toHaveCSS("padding-left", "0px");
  await page.setViewportSize({ width: 390, height: 900 });
  await box(page).locator(":scope > h1").hover();
  const bounds = await button(page, "Add block below").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  await button(page, "Add block below").click();
  await expect(page.getByRole("listbox", { name: "Insert block", exact: true })).toBeVisible();
  await info.attach("compact-390-plus", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

const insertionCases = [
  ["Text", "paragraph"],
  ["Heading 1", "heading"],
  ["Heading 2", "heading"],
  ["Heading 3", "heading"],
  ["Bullet List", "bulletList"],
  ["Numbered List", "orderedList"],
  ["To-do List", "taskList"],
  ["Quote", "blockquote"],
  ["Code Block", "codeBlock"],
  ["Divider", "horizontalRule"],
  ["Table", "table"],
  ["Contents", "contents"],
] as const;
for (const [name, type] of insertionCases) {
  test(`atomic slash ${name} uses native schema and a single Undo/Redo event`, async ({ page }) => {
    const editor = await open(page);
    await editor.locator(":scope > p").last().click();
    await page.keyboard.press(endDocument);
    await page.keyboard.press("Enter");
    await page.keyboard.type("/");
    const before = (await state(editor)).doc;
    await page.getByRole("option", { name, exact: true }).click();
    const inserted = (await state(editor)).doc;
    const count = (document: typeof inserted) =>
      document.content?.filter((node) => node.type === type).length ?? 0;
    expect(count(inserted)).toBe(count(before) + (type === "paragraph" ? 0 : 1));
    expect(inserted).not.toEqual(before);
    await button(page, "Undo").click();
    expect((await state(editor)).doc).toEqual(before);
    await button(page, "Redo").click();
    expect((await state(editor)).doc).toEqual(inserted);
  });
}

test("actual native handle drag moves a block and Undo restores the document", async ({
  page,
}, info) => {
  const editor = await open(page);
  const original = (await state(editor)).doc;
  const heading = editor.getByRole("heading", { name: "Our design principles", exact: true });
  await heading.hover();
  const grip = button(page, "Block actions");
  const target = editor.getByRole("heading", { name: "Working together", exact: true });
  await expect(target).toBeVisible();
  const sourceBounds = await grip.boundingBox();
  const targetBounds = await target.boundingBox();
  expect(sourceBounds).not.toBeNull();
  expect(targetBounds).not.toBeNull();
  // Resolve visible geometry before native pointerdown opens the modal trigger.
  // All movement/drop is the browser's real mouse and native drag pipeline.
  await page.mouse.move(
    sourceBounds!.x + sourceBounds!.width / 2,
    sourceBounds!.y + sourceBounds!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    sourceBounds!.x + sourceBounds!.width + 12,
    sourceBounds!.y + sourceBounds!.height / 2,
    { steps: 4 },
  );
  await page.mouse.move(targetBounds!.x + 50, targetBounds!.y + targetBounds!.height - 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect.poll(async () => (await state(editor)).doc).not.toEqual(original);
  await info.attach("actual-drag-document", {
    body: JSON.stringify((await state(editor)).doc, null, 2),
    contentType: "application/json",
  });
  await button(page, "Undo").click();
  expect((await state(editor)).doc).toEqual(original);
});
