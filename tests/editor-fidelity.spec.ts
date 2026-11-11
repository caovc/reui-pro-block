import { test, expect } from "@playwright/test";

const endDocument = process.platform === "darwin" ? "Meta+ArrowDown" : "Control+End";
const startLine = process.platform === "darwin" ? "Meta+ArrowLeft" : "Home";
const selectLine = process.platform === "darwin" ? "Meta+Shift+ArrowRight" : "Shift+End";
const route = "/#/preview/application/rich-text-editor/rich-text-editor-1";

test("contract toolbar retains editing and suggesting input modes", async ({ page }) => {
  await page.goto("/#/preview/application/rich-text-editor/rich-text-editor-3");
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  const mode = page.getByRole("combobox", { name: "Document mode", exact: true });
  await mode.click();
  await page.getByRole("option", { name: /^Editing/ }).click();
  await expect(mode).toHaveText("Editing");
  await editor.locator("p").last().click();
  await editor.press(endDocument);
  await page.keyboard.type(" Direct addition");
  await expect(editor).toContainText("Direct addition");
  await expect(editor.locator("ins").filter({ hasText: "Direct addition" })).toHaveCount(0);
  await mode.click();
  await page.getByRole("option", { name: /^Suggesting/ }).click();
  await expect(mode).toHaveText("Suggesting");
  await editor.locator("p").last().click();
  await editor.press(endDocument);
  await page.keyboard.type("X");
  await expect(editor.locator("ins").filter({ hasText: "X" })).toHaveText("X");
});

for (const primitive of ["radix", "base"] as const) {
  const assistantRoute = `./${primitive === "base" ? "base/" : ""}#/preview/application/rich-text-editor/rich-text-editor-5`;

  test(`${primitive} assistant stages native revisions and keeps projections, review and undo consistent`, async ({
    page,
  }) => {
    await page.goto(assistantRoute);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
    const review = page.getByRole("region", { name: "Review assistant edits" });
    const view = page.getByRole("combobox", { name: "Suggestion view" });
    await expect(review).toBeVisible();
    await expect(editor.locator("ins")).toHaveCount(3);

    await page.getByRole("button", { name: "Ask Assist", exact: true }).click();
    const prompt = page.getByRole("textbox", { name: "Ask Assist", exact: true });
    await prompt.fill("Fix the typos");
    await prompt.press("Enter");
    await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
    await expect(editor).toHaveAttribute("contenteditable", "false");
    await expect(review).toContainText("5 edits");
    await expect(editor.locator("ins").filter({ hasText: /^occurred$/ })).toBeVisible();
    await expect(editor.locator("ins").filter({ hasText: /^separate$/ })).toBeVisible();

    await view.click();
    await page.getByRole("option", { name: "Final", exact: true }).click();
    await expect(editor.locator("del:visible")).toHaveCount(0);
    await expect(review.getByRole("button", { name: "Accept", exact: true })).toBeDisabled();
    await view.click();
    await page.getByRole("option", { name: "Original", exact: true }).click();
    await expect(editor.locator("ins:visible")).toHaveCount(0);
    await view.click();
    await page.getByRole("option", { name: "All Markup", exact: true }).click();

    await review.getByRole("button", { name: "Next edit", exact: true }).click();
    await expect(review).toContainText("2 of 5");
    await review.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(review).toContainText("4 edits");
    await expect(editor.locator("ins").filter({ hasText: /^receive$/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(editor.locator("ins").filter({ hasText: /^receive$/ })).toHaveCount(1);

    await review.getByRole("button", { name: "All edits", exact: true }).click();
    await page.getByRole("menuitem", { name: "Accept all", exact: true }).click();
    await expect(editor.locator("[data-revision]")).toHaveCount(0);
    await expect(editor).toContainText("if a rollback has occurred");
    await expect(editor).toContainText("a separate search macro");
    await page.reload();
    await expect(editor.locator("[data-revision]")).toHaveCount(0);
  });

  test(`${primitive} assistant can stop a run and remove a rejected generated paragraph`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(assistantRoute);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
    await expect(editor.getByRole("heading", { name: "Workspace Search Rollout" })).toBeVisible();
    const originalParagraphs = await editor.locator(":scope > p").count();
    await page.getByRole("button", { name: "Ask Assist", exact: true }).click();
    const prompt = page.getByRole("textbox", { name: "Ask Assist", exact: true });
    await prompt.fill("Add a summary");
    await prompt.press("Enter");
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect(prompt).toBeVisible();
    await expect(editor).toHaveAttribute("contenteditable", "true");
    await expect(editor.locator("[data-assistant-revision]")).toHaveCount(0);
    await prompt.fill("Add a summary");
    await prompt.press("Enter");
    const review = page.getByRole("region", { name: "Review assistant edits" });
    await expect(review).toContainText("4 edits");
    const addition = editor.locator("[data-assistant-revision]");
    await expect(addition).toContainText("Summary");
    await review.getByRole("button", { name: "All edits", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit 4", exact: true }).click();
    await review.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(addition).toHaveCount(0);
    await expect(editor.locator(":scope > p")).toHaveCount(originalParagraphs);
    const dock = await page.getByRole("complementary", { name: "Writing assistant" }).boundingBox();
    expect(dock!.x).toBeGreaterThanOrEqual(0);
    expect(dock!.x + dock!.width).toBeLessThanOrEqual(390);
  });
}

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
    const confirmation = page.getByRole("alertdialog", { name: "Clear Document?", exact: true });
    await expect(page.locator(".tiptap")).toHaveText(original!);
    await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByRole("button", { name: "Document actions", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Document actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Clear Document", exact: true }).click();
    await confirmation.getByRole("button", { name: "Clear Document", exact: true }).click();
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

test("rapid link form reopen retains focus and permits pointer removal", async ({ page }) => {
  await page.goto(route);
  const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
  const dialog = page.getByRole("dialog", { name: "Link", exact: true });
  const address = dialog.getByRole("textbox", { name: "Link address", exact: true });
  const link = editor.getByRole("link", { name: "Rapid link resource", exact: true });
  const formatted = editor.locator("strong").filter({ hasText: "Rapid link resource" });
  await editor.locator("p").last().click();
  await editor.press(endDocument);
  await editor.press("Enter");
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("Rapid link resource");
  await page.keyboard.press("ControlOrMeta+b");
  await editor.press(startLine);
  await editor.press(selectLine);

  for (let cycle = 0; cycle < 4; cycle += 1) {
    const href = `https://example.com/reopen-${cycle}`;
    await expect(editor).toBeFocused();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(dialog).toBeVisible();
    await expect(address).toBeFocused();
    await expect(page.getByRole("group", { name: "Link", exact: true })).toHaveCount(0);
    await address.fill(href);
    await dialog.getByRole("button", { name: "Apply link", exact: true }).click();
    await expect(link).toHaveAttribute("href", href);
    await expect(page.getByRole("group", { name: "Link", exact: true })).toBeVisible();

    // Reopen immediately after applying. Waiting for the previous dialog's exit
    // here would miss the lifecycle overlap observed in the original CI trace.
    await link.click();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(dialog).toBeVisible();
    await expect(address).toBeFocused();
    await expect(address).toHaveValue(href);
    await expect(page.getByRole("group", { name: "Link", exact: true })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Remove link", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(link).toHaveCount(0);
    await expect(formatted).toHaveText("Rapid link resource");
    await expect(editor).toBeFocused();
  }
});

for (const primitive of ["radix", "base"] as const) {
  const prefix = `./${primitive === "base" ? "base/" : ""}#/preview/application/rich-text-editor`;

  test(`${primitive} wiki keeps the outline in view and confirms a native clear`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/rich-text-editor-2`);
    const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
    const table = editor.getByRole("table");
    await expect(table).toBeVisible();
    const rail = page.getByRole("navigation", { name: "Document outline", exact: true });
    await editor
      .getByRole("heading", { name: "What’s next", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(rail).toBeInViewport();
    await rail.hover();
    await rail.getByRole("button", { name: "Useful resources", exact: true }).click();
    await expect(table).toBeInViewport();

    const menu = page.getByRole("button", { name: "Page actions", exact: true });
    await menu.click();
    await page.getByRole("menuitem", { name: "Clear Page", exact: true }).click();
    const confirmation = page.getByRole("alertdialog", { name: "Clear Page?", exact: true });
    await expect(confirmation).toBeVisible();
    await expect(page.locator(".tiptap table")).toBeAttached();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await menu.click();
    await page.getByRole("menuitem", { name: "Clear Page", exact: true }).click();
    await confirmation.getByRole("button", { name: "Clear Page", exact: true }).click();
    await expect(editor).toHaveText("");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(table).toBeVisible();
  });

  test(`${primitive} contract copies original, final and redline views without editing the draft`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`${prefix}/rich-text-editor-3`);
    const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
    await expect(editor.locator("ins")).toHaveCount(2);
    await expect(editor.locator("ins").first()).toHaveCSS("background-color", "rgb(224, 245, 239)");
    await expect(editor.locator("del").first()).toHaveCSS("background-color", "rgb(252, 226, 229)");
    const before = await editor.innerHTML();
    const copy = async (name: string) => {
      await page.getByRole("button", { name: "Page actions", exact: true }).click();
      await page.getByRole("menuitem", { name, exact: true }).click();
      return page.evaluate(() => navigator.clipboard.readText());
    };
    const final = await copy("Copy Final Text");
    expect(final).toContain("45 days");
    expect(final).not.toContain("30 days");
    const original = await copy("Copy Original Text");
    expect(original).toContain("30 days");
    expect(original).not.toContain("45 days");
    const redline = await copy("Copy Redline HTML");
    expect(redline).toContain('<del data-revision="term">30 days</del>');
    expect(redline).toContain('<ins data-revision="term">45 days</ins>');
    expect(await editor.innerHTML()).toBe(before);
  });
}
