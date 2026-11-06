import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { strFromU8 } from "fflate";
import {
  captureOriginalArchive,
  fileBytes,
  hash,
  openSource,
  selectSource,
  sourceText,
  verifyOriginalClosure,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });

const defaultPath = "src/templates/business/miro.tsx";
const resourceViewPath = "src/components/reui/event-calendar/event-calendar-resource-view.tsx";
const legacySecondaryPaths = [
  "src/templates/business/miro-settings.tsx",
  "src/templates/business/miro-settings-profile.tsx",
  "src/templates/business/miro-settings-controls.tsx",
  "src/templates/business/miro-notifications.tsx",
  "src/templates/business/miro-calendar.tsx",
  "src/templates/business/miro-workspace.tsx",
  "src/templates/business/miro-detail.tsx",
] as const;
const newSecondaryPaths = [
  "src/templates/business/miro-chair-board.tsx",
  "src/templates/business/miro-shell-chrome.tsx",
] as const;
const implementationPaths = [
  defaultPath,
  "src/templates/business/shared.tsx",
  "src/templates/business/miro-detail.tsx",
  "src/templates/business/miro-settings.tsx",
  "src/templates/business/miro-settings-profile.tsx",
  "src/templates/business/miro-settings-controls.tsx",
  "src/templates/business/miro-settings-fields.tsx",
  "src/templates/business/miro-settings-layout.css",
  "src/templates/business/miro-shell-chrome.tsx",
  "src/templates/business/miro-shell-chrome.css",
  "src/templates/business/miro-chair-board.tsx",
  "src/templates/business/miro-chair-board.css",
  "src/templates/business/miro-chair-board-model.ts",
  "src/templates/business/miro-chair-calendar.ts",
  "src/templates/business/miro-route.ts",
  "src/templates/business/miro-route-model.ts",
  "src/templates/business/miro-layout.css",
] as const;
const pureTypeScriptPaths = implementationPaths.filter((filename) => filename.endsWith(".ts"));
const archiveTarget: SourceTarget = {
  id: "miro",
  kind: "template",
  name: "Miro",
  family: "business",
  route: "/#/templates/miro",
  defaultPath,
  selectedPath: defaultPath,
  requiredFiles: [
    ...implementationPaths,
    ...legacySecondaryPaths,
    "src/templates/business/miro-settings-data.ts",
    "src/templates/business/miro-settings-model.ts",
    "src/templates/business/miro-settings-integration.ts",
    "src/templates/business/miro-settings.css",
    "src/templates/business/miro-notifications.css",
    "src/components/reui/sidebar.tsx",
    "src/components/ui/sidebar.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/field.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/input-group.tsx",
    "src/components/ui/select.tsx",
    "src/components/ui/switch.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/radio-group.tsx",
    "src/components/ui/calendar.tsx",
    "src/components/ui/collapsible.tsx",
    "src/components/reui/number-field.tsx",
    "src/components/reui/event-calendar/event-calendar.tsx",
    "src/components/reui/event-calendar/event-calendar-content.tsx",
    "src/components/reui/event-calendar/event-calendar-nav.tsx",
    resourceViewPath,
    "src/components/reui/event-calendar/event-calendar-time-grid.tsx",
    "src/components/reui/event-calendar/event-calendar-event.tsx",
    "src/components/reui/event-calendar/event-calendar-dnd.tsx",
    "src/components/reui/event-calendar/event-calendar-lib.tsx",
    "src/components/reui/event-calendar/event-calendar-types.tsx",
    "src/blocks/application/dialog-variants/workspace/settings-panel.tsx",
    "src/blocks/application/dialog-variants/workspace/free/avatar-upload.tsx",
    "src/hooks/use-file-upload.ts",
    "src/lib/demo-artwork.ts",
    "src/components/brand-mark.tsx",
    "src/components/site/global-theme-store.ts",
    "src/templates/business/commerce-account-theme.ts",
    "src/templates/business/business.css",
    "src/templates/business/business-layout.css",
  ],
};

for (const selectedPath of implementationPaths) {
  const target: SourceTarget = { ...archiveTarget, selectedPath };
  test(`Miro whole layout source ${basename(selectedPath)}: actual view, Copy and single-file bytes`, async ({
    page,
    context,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const originalDefault = await fileBytes(defaultPath);
    const expected = await fileBytes(selectedPath);
    const { opener, dialog, choice } = await openSource(page, target);
    await expect.poll(() => sourceText(dialog, target)).toBe(originalDefault.toString("utf8"));

    if (selectedPath === defaultPath) {
      await choice.click();
      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      const paths = await listbox.getByRole("option").allTextContents();
      const pinned = [defaultPath, ...legacySecondaryPaths, ...newSecondaryPaths];
      expect(paths.slice(0, pinned.length)).toEqual(pinned);
      for (const filename of implementationPaths) expect(paths).toContain(filename);
      for (const filename of pureTypeScriptPaths) {
        expect(paths, `${filename}: keep the actual .ts source extension`).not.toContain(
          filename.replace(/\.ts$/, ".tsx"),
        );
      }
      await page.keyboard.press("Escape");
      await expect(listbox).toHaveCount(0);
      await expect(choice).toBeFocused();
    }

    const code = await selectSource(page, target, dialog, choice);
    await expect.poll(() => sourceText(code, target)).toBe(expected.toString("utf8"));
    const view = Buffer.from(await sourceText(code, target), "utf8");
    expect(view).toEqual(expected);
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected.toString("utf8"));
    const clipboard = Buffer.from(
      await page.evaluate(() => navigator.clipboard.readText()),
      "utf8",
    );
    expect(clipboard).toEqual(expected);

    const pending = page.waitForEvent("download");
    await code.getByRole("button", { name: "Download template source file", exact: true }).click();
    const download = await pending;
    const artifact = info.outputPath(`miro-${basename(selectedPath)}`);
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(selectedPath));
    expect(extname(download.suggestedFilename())).toBe(extname(selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(defaultPath)).toEqual(originalDefault);
    expect(await fileBytes(selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("miro-whole-layout-source-proof.json"),
      JSON.stringify(
        {
          id: target.id,
          defaultPath,
          selectedPath,
          extension: extname(selectedPath),
          originalSHA256: hash(expected),
          viewSHA256: hash(view),
          clipboardSHA256: hash(clipboard),
          singleFileSHA256: hash(downloaded),
          artifact,
        },
        null,
        2,
      ) + "\n",
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(faults).toEqual([]);
  });
}

test("Miro whole layout actual original ZIP preserves models, free ResourceView, licensed media and complete closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const { dialog } = await openSource(page, archiveTarget, "archive");
  const { files } = await captureOriginalArchive(page, archiveTarget, dialog, info);
  await verifyOriginalClosure(archiveTarget, files, info);
  for (const filename of pureTypeScriptPaths) {
    expect(files[filename], `${filename}: genuine .ts member`).toBeDefined();
    expect(
      files[filename.replace(/\.ts$/, ".tsx")],
      `${filename}: no fabricated TSX alias`,
    ).toBeUndefined();
  }

  // Inspect the actual full free implementation in the received ZIP, not a local stub.
  const resourceView = strFromU8(files[resourceViewPath]!);
  for (const fragment of [
    "function EventCalendarResourceView(",
    "function EventCalendarResourceColumn(",
    "<EventCalendarResourceColumn",
    "packTimedSegments(mine)",
    "useEventCalendarGestures()",
    'data-slot="event-calendar-resource-view"',
    'data-slot="event-calendar-resource-header"',
    "<EventCalendarEvent",
    "<EventCalendarTimeGutter",
  ]) {
    expect(resourceView, `Full free ResourceView contains ${fragment}`).toContain(fragment);
  }
  const content = strFromU8(
    files["src/components/reui/event-calendar/event-calendar-content.tsx"]!,
  );
  expect(content).toContain("resource: EventCalendarResourceView");
  const chairCalendar = strFromU8(files["src/templates/business/miro-chair-calendar.ts"]!);
  expect(chairCalendar).toContain("useEventCalendarState");
  expect(chairCalendar).toContain('defaultView: "resource"');
  const sidebar = strFromU8(files["src/components/reui/sidebar.tsx"]!);
  expect(sidebar).toContain("https://reui.io/components/sidebar/c-sidebar-1");
  expect(sidebar).toContain("MIT");
  const reuiLicense = strFromU8(files["src/components/reui/REUI-LICENSE.txt"]!);
  expect(reuiLicense).toContain("MIT License");
  expect(reuiLicense).toContain("Copyright (c) 2025 Keenthemes Inc");

  for (const filename of [
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "index.html",
    "src/main.tsx",
  ]) {
    expect(
      files[filename],
      `${filename}: actual generated runnable-project configuration`,
    ).toBeDefined();
  }
  const manifest = JSON.parse(strFromU8(files["package.json"]!));
  expect(manifest.scripts.dev).toBe("vite");
  expect(manifest.scripts.preview).toBe("vite preview");
  // A setup script is checked only when the original exporter actually includes one.
  if (manifest.scripts.postinstall) {
    expect(manifest.scripts.postinstall).toBe("node scripts/copy-excalidraw-assets.mjs");
    const script = "scripts/copy-excalidraw-assets.mjs";
    expect(files[script]).toBeDefined();
    expect(Buffer.from(files[script]!)).toEqual(await fileBytes(script));
  }
  await writeFile(
    info.outputPath("miro-whole-layout-archive-policy.json"),
    JSON.stringify(
      {
        id: archiveTarget.id,
        implementationPaths,
        sourceAndModelBytes: "Checked against current fileBytes by verifyOriginalClosure",
        originalArchiveInventory: "original-archive-inventory.json",
        closureProof: "source-closure-proof.json",
        svgRawByteEqualityAsserted: false,
        svgPolicy:
          "The real exporter may serialize compiled SVG data URLs differently from Git XML; actual downloaded member hashes are inventoried without claiming raw SVG equality.",
        fontsAndOtherBinaryMedia:
          "Existing helper verifies actual binary bytes and retained notices, including Inter OFL.",
        originalEntryModified: false,
        downloadedProjectBuildOrRuntimeVerified: false,
      },
      null,
      2,
    ) + "\n",
  );
  expect(faults).toEqual([]);
});
