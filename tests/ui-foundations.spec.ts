import { expect, test, type Locator, type Page } from "@playwright/test";
import { strFromU8 } from "fflate";
import { readFile } from "node:fs/promises";
import { builtinModules, createRequire } from "node:module";
import { basename, posix } from "node:path";
import postcss from "postcss";
import ts from "typescript";
import {
  captureOriginalArchive,
  openSource,
  selectSource,
  sourceText,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const require = createRequire(import.meta.url);
const { cssImportTargets } = require("./fidelity-source-css.cjs") as {
  cssImportTargets: (source: string, filename: string, parser: typeof postcss) => string[];
};

const desktop = { width: 1440, height: 1000 };
test.describe.configure({ mode: "default" });
test.use({ viewport: desktop, reducedMotion: "no-preference" });

const blockRoute = "#/block/ai-agents/agent-activity/agent-activity-1";
const templateRoute = "#/templates/manifest";
const approvalMenu = "src/components/ui/dropdown-menu.tsx";
const rememberCheckbox = "src/components/ui/checkbox.tsx";
const libraries = ["Radix UI", "Base UI"] as const;
type Library = (typeof libraries)[number];
type Style = "Nova" | "Lyra";

const primitiveId = (library: Library) => (library === "Base UI" ? "base" : "radix");

async function expectFoundation(root: Locator, library: Library, style: Style) {
  await expect(root).toHaveAttribute("data-ui-primitive", primitiveId(library));
  await expect(root).toHaveAttribute("data-ui-style", style.toLowerCase());
}

async function customizer(page: Page) {
  const panel = page.getByRole("complementary", { name: "Preview customization", exact: true });
  const trigger = page.getByRole("button", { name: "Customize", exact: true });
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.click();
  }
  await expect(panel).toBeVisible();
  return panel;
}

const libraryControl = (panel: Locator) =>
  panel.getByRole("combobox", { name: /^component library$/i });
const styleControl = (panel: Locator) =>
  panel.getByRole("combobox", { name: "Style", exact: true });

async function choose(page: Page, control: Locator, name: string) {
  await control.click();
  await page.getByRole("option", { name, exact: true }).click();
}

function libraryEntry(root: URL, library: Library) {
  return new URL(library === "Base UI" ? "base/" : "./", root);
}

async function chooseLibrary(page: Page, root: URL, library: Library) {
  const current = new URL(page.url());
  const control = libraryControl(await customizer(page));
  if (current.pathname !== libraryEntry(root, library).pathname) {
    await choose(page, control, library);
  }
  await expect(page).toHaveURL((url) => {
    const [route, query] = url.hash.split("?");
    const [oldRoute, oldQuery] = current.hash.split("?");
    return (
      url.origin === root.origin &&
      url.pathname === libraryEntry(root, library).pathname &&
      route === oldRoute &&
      [...new URLSearchParams(oldQuery)].every(([key, value]) =>
        new URLSearchParams(query).getAll(key).includes(value),
      )
    );
  });
  await expect(libraryControl(await customizer(page))).toContainText(library);
}

async function chooseStyle(page: Page, name: Style) {
  const control = styleControl(await customizer(page));
  await choose(page, control, name);
  await expect(styleControl(await customizer(page))).toContainText(name);
}

const approvalPreview = (page: Page) =>
  page.frameLocator('iframe[title="Approval Run Console live preview"]');
const approvalTrigger = (page: Page) =>
  approvalPreview(page).getByRole("button", { name: "Approval run actions", exact: true });

async function controlAppearance(control: Locator) {
  await expect(control).toBeVisible();
  return control.evaluate(async (node) => {
    await Promise.allSettled(node.getAnimations().map((animation) => animation.finished));
    const style = getComputedStyle(node);
    return {
      height: style.height,
      radius: style.borderTopLeftRadius,
      padding: style.paddingInlineStart,
      font: style.fontFamily,
      border: style.borderTopWidth,
    };
  });
}

test("Customize switches both libraries, preserves the route, and shares a real style", async ({
  page,
  context,
  browser,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`./${blockRoute}?theme=light`);
  const root = new URL("./", page.url());
  await expect(libraryControl(await customizer(page))).toContainText("Radix UI");
  await chooseLibrary(page, root, "Base UI");
  await chooseStyle(page, "Nova");
  await expectFoundation(approvalPreview(page).locator("html"), "Base UI", "Nova");
  const nova = await controlAppearance(approvalTrigger(page));
  await chooseStyle(page, "Lyra");
  await expectFoundation(page.locator("html"), "Base UI", "Lyra");
  await expectFoundation(approvalPreview(page).locator("html"), "Base UI", "Lyra");
  await expect.poll(() => controlAppearance(approvalTrigger(page))).not.toEqual(nova);
  const lyra = await controlAppearance(approvalTrigger(page));

  await page.reload();
  await expect(libraryControl(await customizer(page))).toContainText("Base UI");
  await expect(styleControl(await customizer(page))).toContainText("Lyra");
  await expectFoundation(approvalPreview(page).locator("html"), "Base UI", "Lyra");
  await expect.poll(() => controlAppearance(approvalTrigger(page))).toEqual(lyra);
  await page.getByRole("button", { name: "Copy preset link", exact: true }).click();
  await expect(page.getByText("Preset link copied", { exact: true })).toBeVisible();
  const readClipboard = () => page.evaluate(() => navigator.clipboard.readText());
  await expect.poll(readClipboard).toContain("preset=");
  const shared = new URL(await readClipboard());
  expect(shared.origin).toBe(root.origin);
  expect(shared.pathname).toBe(libraryEntry(root, "Base UI").pathname);
  expect(shared.hash.split("?")[0]).toBe(blockRoute);
  const preset = JSON.parse(new URLSearchParams(shared.hash.split("?")[1]).get("preset")!);
  expect(preset).toMatchObject({ primitive: "base", style: "lyra" });

  const recipient = await browser.newContext({ viewport: desktop, reducedMotion: "no-preference" });
  try {
    const received = await recipient.newPage();
    await received.goto(shared.href);
    await expect(libraryControl(await customizer(received))).toContainText("Base UI");
    await expect(styleControl(await customizer(received))).toContainText("Lyra");
    await expectFoundation(approvalPreview(received).locator("html"), "Base UI", "Lyra");
    await expect.poll(() => controlAppearance(approvalTrigger(received))).toEqual(lyra);
  } finally {
    await recipient.close();
  }
  await chooseLibrary(page, root, "Radix UI");
  await expect(styleControl(await customizer(page))).toContainText("Lyra");
  await expectFoundation(approvalPreview(page).locator("html"), "Radix UI", "Lyra");
  await expect(approvalTrigger(page)).toBeVisible();
});

const targets: SourceTarget[] = [
  {
    id: "agent-activity-1",
    name: "Approval Run Console",
    kind: "block",
    route: blockRoute,
    defaultPath: "src/blocks/data/agent-activity-approval.tsx",
    selectedPath: approvalMenu,
    requiredFiles: ["src/blocks/data/agent-activity-approval.tsx", approvalMenu],
  },
  {
    id: "manifest",
    name: "Manifest",
    kind: "template",
    family: "business",
    route: templateRoute,
    defaultPath: "src/templates/business/commerce.tsx",
    selectedPath: rememberCheckbox,
    requiredFiles: [
      "src/templates/business/manifest-auth.tsx",
      rememberCheckbox,
      "src/components/ui/tabs.tsx",
    ],
  },
];

function archiveText(files: Record<string, Uint8Array>, name: string) {
  expect(files[name], name).toBeDefined();
  return strFromU8(files[name]);
}

function verifyArchive(files: Record<string, Uint8Array>, target: SourceTarget, library: Library) {
  const manifest = JSON.parse(archiveText(files, "package.json"));
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ]);
  const nativePackage = library === "Base UI" ? "@base-ui/react" : "radix-ui";
  const source = archiveText(files, target.selectedPath);
  expect(declared.has(nativePackage), nativePackage).toBe(true);
  const selectedImports = ts
    .preProcessFile(source, true, true)
    .importedFiles.map((ref) => ref.fileName);
  expect(
    selectedImports.some((name) => name === nativePackage || name.startsWith(`${nativePackage}/`)),
  ).toBe(true);
  const entryImports = ts
    .preProcessFile(archiveText(files, "src/main.tsx"), true, true)
    .importedFiles.map((ref) => ref.fileName);
  expect(entryImports).toContain("./theme.css");
  expect(archiveText(files, "src/Example.tsx")).toContain(target.id);
  expect(archiveText(files, "src/components/reui/REUI-LICENSE.txt")).toContain("MIT License");
  expect(archiveText(files, "src/blocks/assets/Inter-LICENSE.txt")).toContain(
    "SIL OPEN FONT LICENSE",
  );
  for (const filename of target.requiredFiles) expect(files[filename], filename).toBeDefined();

  const unresolved: string[] = [];
  const builtins = new Set(builtinModules);
  for (const [filename, bytes] of Object.entries(files)) {
    if (!/\.(?:[cm]?[jt]sx?|css)$/.test(filename)) continue;
    const text = strFromU8(bytes);
    const imports = filename.endsWith(".css")
      ? cssImportTargets(text, filename, postcss)
      : ts.preProcessFile(text, true, true).importedFiles.map((ref) => ref.fileName);
    for (const imported of imports) {
      if (/^(?:https?:|data:|#)/.test(imported)) continue;
      if (!imported.startsWith("@/") && !imported.startsWith(".")) {
        const segments = imported.split("/");
        const name = segments.slice(0, imported.startsWith("@") ? 2 : 1).join("/");
        if (!declared.has(name) && !builtins.has(imported.replace(/^node:/, ""))) {
          unresolved.push(`${filename}: ${imported}`);
        }
        continue;
      }
      const clean = imported.split(/[?#]/, 1)[0];
      const path = clean.startsWith("@/")
        ? `src/${clean.slice(2)}`
        : posix.normalize(posix.join(posix.dirname(filename), clean));
      if (
        ![
          path,
          `${path}.ts`,
          `${path}.tsx`,
          `${path}.css`,
          `${path}.json`,
          `${path}/index.ts`,
          `${path}/index.tsx`,
        ].some((entry) => files[entry])
      ) {
        unresolved.push(`${filename}: ${imported}`);
      }
    }
  }
  expect(unresolved, "starter import and dependency closure").toEqual([]);
  return source;
}

async function nativeMenu(page: Page, library: Library) {
  const trigger = approvalTrigger(page);
  await trigger.press("ArrowDown");
  const menu = approvalPreview(page).getByRole("menu");
  await expect(menu).toBeVisible();
  if (library === "Base UI") await expect(menu).toHaveAttribute("data-open", "");
  else await expect(menu).toHaveAttribute("data-state", "open");
  const paths = menu.getByRole("menuitemcheckbox", { name: "File Paths", exact: true });
  await expect(paths).toBeFocused();
  await expect(paths).toBeChecked();
  await paths.press("Space");
  await expect(paths).not.toBeChecked();
  await expect(approvalPreview(page).locator("[data-step-path]")).toHaveCount(0);
  await expect(menu).toBeVisible();
  await paths.click();
  await expect(paths).toBeChecked();
  await expect(approvalPreview(page).locator("[data-step-path]").first()).toBeVisible();
  await paths.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
}

for (const library of libraries) {
  for (const target of targets) {
    test(`${library} ${target.kind} preview, source, Copy, file and starter agree`, async ({
      page,
      context,
    }, info) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      await page.goto(`./${target.route}`);
      const root = new URL("./", page.url());
      await chooseLibrary(page, root, library);
      const style = library === "Base UI" ? "Lyra" : "Nova";
      await chooseStyle(page, style);
      const panel = await customizer(page);
      await choose(
        page,
        panel.getByRole("combobox", { name: "Accent color", exact: true }),
        "Emerald",
      );
      const readClipboard = () => page.evaluate(() => navigator.clipboard.readText());
      await panel.getByRole("button", { name: "Copy theme CSS", exact: true }).click();
      await expect(page.getByText("Theme CSS copied", { exact: true })).toBeVisible();
      await expect.poll(readClipboard).toContain("--primary: #047857");
      const themeCss = await readClipboard();
      await page.getByRole("button", { name: "Close customizer", exact: true }).click();

      await expectFoundation(page.locator("html"), library, style);
      if (target.kind === "block") {
        const preview = approvalPreview(page).locator("html");
        await expectFoundation(preview, library, style);
        await expect(preview).toHaveCSS("--primary", "#047857");
        await nativeMenu(page, library);
      } else {
        await expect(page.locator(".template-surface")).toHaveCSS("--primary", "#047857");
        const remember = page.getByRole("checkbox", { name: "Remember me", exact: true });
        await expect(remember).not.toBeChecked();
        await remember.press("Space");
        await expect(remember).toBeChecked();
        await page.getByText("Remember me", { exact: true }).click();
        await expect(remember).not.toBeChecked();
      }

      const route = new URL(target.route, libraryEntry(root, library)).href;
      const resolved = { ...target, route };
      const { opener, dialog, choice } = await openSource(page, resolved, "archive");
      const { files } = await captureOriginalArchive(page, resolved, dialog, info);
      const expected = verifyArchive(files, resolved, library);
      const styleId = `${primitiveId(library)}-${style.toLowerCase()}`;
      expect(JSON.parse(archiveText(files, "components.json")).style).toBe(styleId);
      expect(archiveText(files, "src/theme.css")).toContain(themeCss.trim());
      const code = await selectSource(page, resolved, dialog, choice);
      await expect.poll(() => sourceText(code, resolved)).toBe(expected);
      await code.getByRole("button", { name: "Copy", exact: true }).click();
      await expect.poll(readClipboard).toBe(expected);
      const pending = page.waitForEvent("download");
      await code
        .getByRole("button", {
          name: target.kind === "block" ? "Download source file" : "Download template source file",
          exact: true,
        })
        .click();
      const file = await pending;
      expect(file.suggestedFilename()).toBe(basename(target.selectedPath));
      const path = info.outputPath(file.suggestedFilename());
      await file.saveAs(path);
      expect(await readFile(path)).toEqual(Buffer.from(files[target.selectedPath]));
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
      expect(faults).toEqual([]);
    });
  }
}

async function sheetTiming(page: Page) {
  const trigger = page.getByRole("button", { name: "Open menu", exact: true });
  await trigger.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  const durations = await sheet.evaluate((node) => {
    const style = getComputedStyle(node);
    return [style.animationDuration, style.transitionDuration].flatMap((value) =>
      value.split(",").map((part) => parseFloat(part) * (part.trim().endsWith("ms") ? 1 : 1000)),
    );
  });
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  return Math.max(...durations);
}

for (const library of libraries) {
  test(`${library} template tabs activate on keyboard focus and Sheet honors reduced motion`, async ({
    page,
  }) => {
    await page.goto("./");
    const root = new URL("./", page.url());
    if (library === "Base UI") await chooseLibrary(page, root, library);
    const entry = libraryEntry(root, library);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(new URL("#/template-preview/surge/account/profile", entry).href);
    const sections = page.getByRole("tablist", { name: "Account sections", exact: true });
    const profile = sections.getByRole("tab", { name: "Profile", exact: true });
    const preferences = sections.getByRole("tab", { name: "Preferences", exact: true });
    await expect(profile).toHaveAttribute("aria-selected", "true");
    await profile.press("ArrowRight");
    await expect(preferences).toBeFocused();
    await expect(preferences).toHaveAttribute("aria-selected", "true");
    const reduce = page.getByRole("switch", { name: /^Reduce animations/ });
    await expect(reduce).not.toBeChecked();
    const ordinary = await sheetTiming(page);
    expect(ordinary).toBeGreaterThan(1);
    await reduce.check();
    await expect(reduce).toBeChecked();
    expect(await sheetTiming(page)).toBeLessThanOrEqual(1);
    await reduce.uncheck();
    await expect(reduce).not.toBeChecked();
    expect(await sheetTiming(page)).toBe(ordinary);
  });
}
