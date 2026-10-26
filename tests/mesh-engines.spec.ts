import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";

const documentBox = (page: Page) =>
  page.getByRole("textbox", { name: "Rich text document", exact: true });
const endDocument = process.platform === "darwin" ? "Meta+ArrowDown" : "Control+End";

async function navigate(page: Page, name: string) {
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  if (page.viewportSize()?.width === 390) {
    await expect(trigger).toBeVisible();
    await trigger.click();
  } else if (await trigger.isVisible()) await trigger.click();
  await page.getByRole("button", { name, exact: true }).click();
}
async function openDocuments(page: Page) {
  await page.goto("/#/template-preview/mesh");
  await navigate(page, "Documents");
  await expect(documentBox(page)).toContainText("Route Planner Product Brief");
}
async function docOption(page: Page, option: string) {
  await page.getByRole("button", { name: "Doc options", exact: true }).click();
  await page.getByRole("menuitem", { name: option, exact: true }).click();
}

test("Mesh document edits survive immediate page switching and reload", async ({ page }) => {
  await openDocuments(page);
  const editor = documentBox(page);
  await editor.click();
  await editor.press(endDocument);
  await editor.press("Enter");
  await page.keyboard.type("Navigation must keep this native paragraph.");
  await navigate(page, "Projects");
  await navigate(page, "Documents");
  await expect(editor).toContainText("Navigation must keep this native paragraph.");
  await page.reload();
  await navigate(page, "Documents");
  await expect(editor).toContainText("Navigation must keep this native paragraph.");
  await expect(page.locator(".mesh-page-header")).toHaveCount(1);
  await expect(page.locator(".wf-main > .wf-header")).toHaveCount(0);
});

test("Mesh document creation, native rename and clear retain Undo/Redo", async ({ page }) => {
  await openDocuments(page);
  await docOption(page, "New Doc");
  await page.getByLabel("Document name", { exact: true }).fill("Engine integration notes");
  await page.getByRole("button", { name: "Create document", exact: true }).click();
  const editor = documentBox(page);
  await expect(editor.getByRole("heading", { level: 1 })).toHaveText("Engine integration notes");
  await docOption(page, "Rename");
  await page.getByLabel("Document name", { exact: true }).fill("Native rename");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(editor.getByRole("heading", { level: 1 })).toHaveText("Native rename");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor.getByRole("heading", { level: 1 })).toHaveText("Engine integration notes");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(editor.getByRole("heading", { level: 1 })).toHaveText("Native rename");
  await docOption(page, "Clear Doc");
  await page.getByRole("button", { name: "Clear document", exact: true }).click();
  await expect(editor).toHaveText("");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor.getByRole("heading", { level: 1 })).toHaveText("Native rename");
});

test("Mesh duplicates, switches and restores distinct documents", async ({ page }) => {
  await openDocuments(page);
  await docOption(page, "Duplicate");
  await expect(documentBox(page).getByRole("heading", { level: 1 })).toHaveText(
    "Route Planner Product Brief (copy)",
  );
  await docOption(page, "Delete Doc");
  await page.getByRole("button", { name: "Delete document", exact: true }).click();
  await expect(documentBox(page).getByRole("heading", { level: 1 })).toHaveText(
    "Route Planner Product Brief",
  );
  await page.getByRole("button", { name: "Restore document", exact: true }).click();
  await expect(documentBox(page).getByRole("heading", { level: 1 })).toHaveText(
    "Route Planner Product Brief (copy)",
  );
  await page.getByRole("button", { name: "Doc options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Open Doc", exact: true }).hover();
  await page.getByRole("menuitemradio", { name: /Design Crit Meeting Notes/ }).click();
  await expect(documentBox(page).getByRole("heading", { level: 1 })).toHaveText(
    "Design Crit Meeting Notes",
  );
});

test("Mesh uses measured document typography, display controls and real view mode", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDocuments(page);
  const editor = documentBox(page);
  await expect(editor).toHaveCSS("font-size", "16px");
  await expect(editor).toHaveCSS("line-height", "28px");
  await expect.poll(async () => (await editor.boundingBox())?.width).toBe(640);
  await page.getByRole("button", { name: "Doc options", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Small Text", exact: true }).click();
  await expect(editor).toHaveCSS("font-size", "14px");
  await expect(editor).toHaveCSS("line-height", "24px");
  await page.getByRole("button", { name: "Doc options", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Full Width", exact: true }).click();
  await expect.poll(async () => (await editor.boundingBox())!.width).toBeGreaterThan(1000);
  await page.getByRole("radio", { name: "View", exact: true }).click();
  await expect(editor).toHaveAttribute("contenteditable", "false");
  const text = await editor.textContent();
  await editor.click();
  await page.keyboard.type("THIS MUST NOT BE ADDED");
  await expect(editor).toHaveText(text!);
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await page.getByRole("radio", { name: "Edit", exact: true }).click();
  await expect(editor).toHaveAttribute("contenteditable", "true");
});

test("Mesh canvas tabs and assistant preserve the same native drawing surface", async ({
  page,
}) => {
  await page.goto("/#/template-preview/mesh");
  await navigate(page, "Canvas");
  const host = page.getByRole("application", {
    name: "Route Planner Launch Map drawing canvas",
    exact: true,
  });
  await expect(host).toHaveAttribute("aria-busy", "false");
  const canvas = host.locator("canvas.interactive");
  const original = await canvas.elementHandle();
  for (const tab of ["Outline", "Comments", "Activity", "Board"]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    expect(await canvas.evaluate((node, previous) => node === previous, original)).toBe(true);
  }
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Mesh AI assistant", exact: true }),
  ).toBeVisible();
  expect(await canvas.evaluate((node, previous) => node === previous, original)).toBe(true);
  await page.getByRole("button", { name: "Hide assistant", exact: true }).click();
  expect(await canvas.evaluate((node, previous) => node === previous, original)).toBe(true);
});

test("Mesh native drawing flushes on navigation and exports the real scene", async ({ page }) => {
  await page.goto("/#/template-preview/mesh");
  await navigate(page, "Canvas");
  const host = page.getByRole("application", {
    name: "Route Planner Launch Map drawing canvas",
    exact: true,
  });
  await expect(host).toHaveAttribute("aria-busy", "false");
  await page.getByRole("radio", { name: "Rectangle", exact: true }).click();
  const box = (await host.locator("canvas.interactive").boundingBox())!;
  const start = { x: box.x + box.width * 0.44, y: box.y + box.height * 0.73 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 140, start.y + 80, { steps: 8 });
  await page.mouse.up();
  await navigate(page, "Documents");
  const scene = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bricklane:mesh:canvas:v2") || "null"),
  );
  expect(
    scene.elements.some(
      (element: { type: string; width: number; isDeleted: boolean }) =>
        !element.isDeleted &&
        element.type === "rectangle" &&
        Math.abs(element.width - 140 / 0.6) < 2,
    ),
  ).toBe(true);
  await navigate(page, "Canvas");
  await expect(host).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "Export canvas", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Save board file", exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.excalidraw$/);
  const parsed = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(parsed.type).toBe("excalidraw");
  expect(
    parsed.elements.filter((element: { isDeleted: boolean }) => !element.isDeleted).length,
  ).toBe(scene.elements.filter((element: { isDeleted: boolean }) => !element.isDeleted).length);
});

test("Mesh share, clipboard exports and view-only controls use current document state", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openDocuments(page);
  const editor = documentBox(page);
  await docOption(page, "Copy HTML");
  const html = await page.evaluate(() => navigator.clipboard.readText());
  expect(html).toContain('data-type="contents"');
  expect(html).not.toContain("data-node-view-wrapper");
  expect(html).not.toContain("contenteditable");
  await docOption(page, "Copy Text");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "Route Planner Product Brief",
  );
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await page.getByRole("combobox", { name: "Link access", exact: true }).click();
  await page.getByRole("option", { name: "Can view", exact: true }).click();
  await page.getByRole("switch", { name: "View only", exact: true }).click();
  await expect(editor).toHaveAttribute("contenteditable", "false");
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("doc=DOC-1");
  expect(link).toContain("mode=view");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Share", exact: true })).toBeFocused();
  await page.goto(link);
  await expect(editor).toContainText("Route Planner Product Brief");
  await expect(editor).toHaveAttribute("contenteditable", "false");
});

test("Mesh assistant uses updated native content, sources, feedback and a real composer", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDocuments(page);
  const editor = documentBox(page);
  await editor.click();
  await editor.press(endDocument);
  await editor.press("Enter");
  await page.keyboard.type("Apricot milestone belongs to the driver study.");
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  const assistant = page.getByRole("complementary", { name: "Mesh AI assistant", exact: true });
  await assistant.getByRole("button", { name: "2 sources used", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sources", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await assistant.getByRole("button", { name: "New question", exact: true }).click();
  const composer = assistant.getByRole("textbox", { name: "Ask about this page", exact: true });
  await expect(composer).toBeFocused();
  await composer.fill("Where is the Apricot milestone?");
  await assistant.getByRole("button", { name: "Send question", exact: true }).click();
  await expect(assistant.locator('[data-slot="bubble"][data-variant="ghost"]')).toContainText(
    "Apricot milestone belongs to the driver study.",
  );
  await assistant.getByRole("button", { name: "Helpful answer", exact: true }).click();
  await expect(
    assistant.getByRole("button", { name: "Helpful answer", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await assistant.getByRole("button", { name: "Assistant settings", exact: true }).click();
  await page.getByRole("switch", { name: "Suggested follow-ups", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    assistant.getByRole("button", { name: "What are the open questions?", exact: true }),
  ).toHaveCount(0);
});

for (const width of [1024, 390]) {
  test(`Mesh engine pages keep one header, navigation and native content at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await openDocuments(page);
    await expect
      .poll(async () => (await page.locator(".mesh-page-header").boundingBox())?.height)
      .toBe(48);
    await expect(page.getByRole("button", { name: "Ask AI", exact: true })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Doc options", exact: true })).toBeInViewport();
    await page.getByRole("button", { name: "Ask AI", exact: true }).click();
    await expect(
      page.getByRole(width === 390 ? "dialog" : "complementary", {
        name: "Mesh AI assistant",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Hide assistant", exact: true }).click();
    if (width === 390)
      await expect(page.getByRole("button", { name: "Ask AI", exact: true })).toBeFocused();
    await navigate(page, "Canvas");
    await expect(
      page.getByRole("application", {
        name: "Route Planner Launch Map drawing canvas",
        exact: true,
      }),
    ).toHaveAttribute("aria-busy", "false");
    await expect
      .poll(async () => (await page.locator(".mesh-page-header").boundingBox())?.height)
      .toBe(48);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect(errors).toEqual([]);
  });
}

test("Mesh actual source preview, copy, file and project contain the same engine consumers", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/templates/mesh");
  await page.getByRole("button", { name: "View template source", exact: true }).click();
  const paths = [
    "src/templates/workflow/mesh.tsx",
    "src/templates/workflow/mesh-canvas.tsx",
    "src/templates/workflow/mesh-documents.tsx",
  ];
  const sources = new Map<string, string>();
  for (const path of paths) {
    const select = page.getByRole("combobox", { name: "Template source file", exact: true });
    await select.click();
    if (path === paths[0])
      expect((await page.getByRole("option").allTextContents()).slice(0, 3)).toEqual(paths);
    await page.getByRole("option", { name: path, exact: true }).click();
    const source = await readFile(join(process.cwd(), path), "utf8");
    expect(await page.locator(".template-source-code").textContent()).toBe(source);
    await page.getByRole("button", { name: "Copy", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download template source file", exact: true }).click();
    expect(await readFile((await (await download).path())!, "utf8")).toBe(source);
    sources.set(path, source);
  }
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download project", exact: true }).click();
  const download = await pending;
  const zip = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const [path, source] of sources) expect(strFromU8(zip[path]), path).toBe(source);
  for (const path of [
    "src/blocks/application/editor.tsx",
    "src/blocks/application/rich-text-engine.ts",
    "src/blocks/application/whiteboard.tsx",
    "src/blocks/application/whiteboard-engine.tsx",
    "src/blocks/application/whiteboard-fonts.ts",
    "src/components/reui/streaming-message.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/number-field.tsx",
    "src/components/reui/color-picker.tsx",
    "src/components/reui/REUI-LICENSE.txt",
    "scripts/copy-excalidraw-assets.mjs",
  ])
    expect(strFromU8(zip[path]), path).toBe(await readFile(join(process.cwd(), path), "utf8"));
  expect(JSON.parse(strFromU8(zip["package.json"])).scripts.postinstall).toBe(
    "node scripts/copy-excalidraw-assets.mjs",
  );
  await download.saveAs(testInfo.outputPath("mesh-engines-project.zip"));
});

async function meshCanvas(page: Page) {
  await page.goto("/#/template-preview/mesh");
  await navigate(page, "Canvas");
  const host = page.getByRole("application", {
    name: "Route Planner Launch Map drawing canvas",
    exact: true,
  });
  await expect(host).toHaveAttribute("aria-busy", "false");
  return host;
}
async function activeMeshElements(page: Page) {
  return page.evaluate(() => {
    const scene = JSON.parse(localStorage.getItem("bricklane:mesh:canvas:v2") || "null");
    return scene?.elements.filter((element: { isDeleted: boolean }) => !element.isDeleted).length;
  });
}
async function drawMeshRectangle(page: Page, host: ReturnType<Page["getByRole"]>) {
  await expect.poll(() => activeMeshElements(page)).toBeGreaterThan(0);
  const before = await activeMeshElements(page);
  await page.getByRole("radio", { name: "Rectangle", exact: true }).click();
  const bounds = (await host.locator("canvas.interactive").boundingBox())!;
  const start = { x: bounds.x + bounds.width * 0.5, y: bounds.y + bounds.height * 0.8 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 40, start.y + 40, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => activeMeshElements(page)).toBe(before + 1);
  return before;
}
for (const width of [390, 1024]) {
  test(`Mesh compact board panel is a real Sheet without shrinking the canvas at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const host = await meshCanvas(page);
    const native = host.locator("canvas.interactive");
    const original = await native.elementHandle();
    const trigger = page.getByRole("button", { name: "Board panel", exact: true });
    await expect(trigger).toHaveAttribute("aria-pressed", "false");
    const before = await drawMeshRectangle(page, host);
    const canvasBounds = (await host.boundingBox())!;
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Route Planner Launch Map", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS("width", "320px");
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    await dialog.getByRole("button", { name: /^Goals/ }).click();
    const modalCanvasBounds = await page
      .getByRole("application", {
        name: "Route Planner Launch Map drawing canvas",
        exact: true,
        includeHidden: true,
      })
      .boundingBox();
    expect(modalCanvasBounds?.width).toBe(canvasBounds.width);
    if (width === 390) await page.keyboard.press("Escape");
    else await dialog.getByRole("button", { name: "Close board panel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await native.evaluate((node, previous) => node === previous, original)).toBe(true);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect.poll(() => activeMeshElements(page)).toBe(before);
    await page.getByRole("button", { name: "Ask AI", exact: true }).click();
    const assistant = page.getByRole(width === 390 ? "dialog" : "complementary", {
      name: "Mesh AI assistant",
      exact: true,
    });
    await expect(assistant).toHaveCSS("width", width === 390 ? "288px" : "416px");
    await page.getByRole("button", { name: "Hide assistant", exact: true }).click();
    expect(await native.evaluate((node, previous) => node === previous, original)).toBe(true);
  });
}

test("Mesh pane mode follows actual workspace width while preserving the native surface and history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const host = await meshCanvas(page);
  const native = host.locator("canvas.interactive");
  const original = await native.elementHandle();
  const trigger = page.getByRole("button", { name: "Board panel", exact: true });
  await expect(trigger).toHaveAttribute("aria-pressed", "true");
  const before = await drawMeshRectangle(page, host);
  await page.setViewportSize({ width: 1168, height: 1000 });
  await expect(trigger).toHaveAttribute("aria-pressed", "false");
  await page.setViewportSize({ width: 1169, height: 1000 });
  await expect(trigger).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await host.boundingBox())?.width).toBe(832);
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect(trigger).toHaveAttribute("aria-pressed", "false");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(trigger).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  await expect(trigger).toHaveAttribute("aria-pressed", "false");
  await expect.poll(async () => (await host.boundingBox())?.width).toBe(975);
  await page.setViewportSize({ width: 900, height: 1000 });
  await expect(
    page.getByRole("complementary", { name: "Mesh AI assistant", exact: true }),
  ).toHaveCSS("width", "378px");
  const more = page.getByRole("button", { name: "More tools", exact: true });
  await expect(more).toBeInViewport();
  await more.click();
  await expect(page.getByRole("menuitem", { name: "Web embed", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1920, height: 1000 });
  await expect(trigger).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await host.boundingBox())?.width).toBe(1167);
  expect(await native.evaluate((node, previous) => node === previous, original)).toBe(true);
  await expect.poll(() => activeMeshElements(page)).toBe(before + 1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.poll(() => activeMeshElements(page)).toBe(before);
});
