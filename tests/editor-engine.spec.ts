import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const endDocument = process.platform === "darwin" ? "Meta+ArrowDown" : "Control+End";
const startLine = process.platform === "darwin" ? "Meta+ArrowLeft" : "Home";
const selectLine = process.platform === "darwin" ? "Meta+Shift+ArrowRight" : "Shift+End";
const route = (kind: number) => `/#/preview/application/rich-text-editor/rich-text-editor-${kind}`;

test("Tiptap edits, formats and restores the saved document with native undo and redo", async ({
  page,
}, testInfo) => {
  await page.goto(route(2));
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  await expect(editor).toHaveClass(/tiptap/);
  // Install once before the first click; do not insert awaits between the native actions.
  const observation = await editor.evaluateHandle((root) => {
    const document = root.ownerDocument;
    const limit = 1000;
    const records: Record<string, unknown>[] = [];
    const installedAt = performance.now();
    let dropped = 0;
    let stopped = false;

    function nodePath(node: Node | null) {
      if (!node) return null;
      if (node === root) return "editor";
      if (!root.contains(node)) return `outside-editor/${node.nodeName}`;
      const parts: string[] = [];
      let current: Node | null = node;
      while (current && current !== root) {
        const parent: ParentNode | null = current.parentNode;
        if (!parent) break;
        let index = 0;
        for (const sibling of parent.childNodes) {
          if (sibling === current) break;
          index += 1;
        }
        parts.unshift(`${current.nodeName}[${index}]`);
        current = parent;
      }
      return `editor/${parts.join("/")}`;
    }

    function describeNode(node: Node | null) {
      return node
        ? {
            path: nodePath(node),
            nodeType: node.nodeType,
            // Only sample the synthetic local editor document, never outside input values.
            text: root.contains(node) ? node.textContent?.slice(0, 160) : undefined,
          }
        : null;
    }

    function activeElement() {
      const element = document.activeElement;
      if (!element) return null;
      return {
        tag: element.tagName,
        path: nodePath(element),
        attributes: Object.fromEntries(
          ["id", "role", "aria-label", "contenteditable", "tabindex", "type", "class"]
            .filter((name) => element.hasAttribute(name))
            .map((name) => [name, element.getAttribute(name)]),
        ),
      };
    }

    function selection() {
      const current = document.getSelection();
      return current
        ? {
            anchor: describeNode(current.anchorNode),
            anchorOffset: current.anchorOffset,
            focus: describeNode(current.focusNode),
            focusOffset: current.focusOffset,
            isCollapsed: current.isCollapsed,
            rangeCount: current.rangeCount,
          }
        : null;
    }

    function record(kind: string, detail: Record<string, unknown> = {}) {
      if (records.length >= limit) {
        dropped += 1;
        return;
      }
      records.push({
        kind,
        monotonicMs: performance.now(),
        editorConnected: root.isConnected,
        documentHasFocus: document.hasFocus(),
        documentReadyState: document.readyState,
        fontStatus: document.fonts.status,
        activeElement: activeElement(),
        selection: selection(),
        ...detail,
      });
    }

    const types = [
      "pointerdown",
      "mousedown",
      "mouseup",
      "click",
      "focusin",
      "focusout",
      "keydown",
      "keyup",
      "beforeinput",
      "input",
      "selectionchange",
    ];
    function eventRecord(event: Event, listenerPhase: "capture" | "bubble") {
      const target = event.target;
      const element = target instanceof Element ? target : null;
      const control = element?.closest("button");
      const relevantControl = ["Undo", "Redo", "Bold selection"].includes(
        control?.getAttribute("aria-label") ?? "",
      );
      if (
        event.type !== "selectionchange" &&
        !(target instanceof Node && root.contains(target)) &&
        !relevantControl
      )
        return;
      const keyboard = event instanceof KeyboardEvent ? event : null;
      const input = event instanceof InputEvent ? event : null;
      record("event", {
        type: event.type,
        listenerPhase,
        eventPhase: event.eventPhase,
        eventTimestampMs: event.timeStamp,
        defaultPrevented: event.defaultPrevented,
        isTrusted: event.isTrusted,
        target: nodePath(target instanceof Node ? target : null),
        key: keyboard?.key,
        code: keyboard?.code,
        ctrlKey: keyboard?.ctrlKey,
        metaKey: keyboard?.metaKey,
        shiftKey: keyboard?.shiftKey,
        altKey: keyboard?.altKey,
        repeat: keyboard?.repeat,
        isComposing: keyboard?.isComposing ?? input?.isComposing,
        inputType: input?.inputType,
        data: input?.data?.slice(0, 160),
      });
    }
    const capture = (event: Event) => eventRecord(event, "capture");
    const bubble = (event: Event) => eventRecord(event, "bubble");
    for (const type of types) {
      document.addEventListener(type, capture, { capture: true, passive: true });
      document.addEventListener(type, bubble, { passive: true });
    }
    const mutationObserver = new MutationObserver((mutations) => {
      record("childList", {
        mutationCount: mutations.length,
        changes: mutations.slice(0, 12).map((mutation) => ({
          target: nodePath(mutation.target),
          added: Array.from(mutation.addedNodes).slice(0, 4).map(describeNode),
          removed: Array.from(mutation.removedNodes)
            .slice(0, 4)
            .map((node) => ({
              nodeType: node.nodeType,
              nodeName: node.nodeName,
              text: node.textContent?.slice(0, 160),
            })),
        })),
        childOrder: Array.from(root.childNodes).slice(0, 24).map(describeNode),
      });
    });
    mutationObserver.observe(root, { childList: true, subtree: true });
    record("installed", {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      childOrder: Array.from(root.childNodes).slice(0, 24).map(describeNode),
    });
    return {
      stop() {
        if (!stopped) {
          record("stopped");
          stopped = true;
          for (const type of types) {
            document.removeEventListener(type, capture, true);
            document.removeEventListener(type, bubble);
          }
          mutationObserver.disconnect();
        }
        return { installedAt, stoppedAt: performance.now(), limit, dropped, records };
      },
    };
  });
  let observationData: unknown;
  try {
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
    // This read is after all early native actions and the save assertion, before reload destroys
    // the handle's execution context. It does not certify unmodified persistence timing.
    observationData = await observation.evaluate((observer) => observer.stop());
    await page.reload();
    await expect(editor.locator("strong").last()).toHaveText("A verified editor paragraph");
  } finally {
    if (observationData === undefined) {
      try {
        observationData = await observation.evaluate((observer) => observer.stop());
      } catch (error) {
        observationData = {
          collectionError: error instanceof Error ? error.message : String(error),
        };
      }
    }
    let disposalError: string | undefined;
    try {
      await observation.dispose();
    } catch (error) {
      disposalError = error instanceof Error ? error.message : String(error);
    }
    await testInfo.attach("editor-native-selection-observation.json", {
      body: Buffer.from(
        JSON.stringify(
          {
            scope: "Passive DOM observation; no PM internals or layout reads",
            observationData,
            disposalError,
          },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });
  }
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
  await page
    .getByRole("toolbar", { name: "Table", exact: true })
    .getByRole("button", { name: "Add row below", exact: true })
    .click();
  await expect(table.locator("tr")).toHaveCount(4);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(table.locator("tr")).toHaveCount(3);
  await table.locator("td").first().click();
  await page
    .getByRole("toolbar", { name: "Table", exact: true })
    .getByRole("button", { name: "Add column right", exact: true })
    .click();
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
