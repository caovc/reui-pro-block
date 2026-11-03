import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
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

const defaultPath = "src/templates/business/atlas.tsx";
const implementationPaths = [
  "src/templates/business/atlas.tsx",
  "src/templates/business/atlas-account-layout.css",
  "src/templates/business/atlas-account-settings.tsx",
  "src/templates/business/atlas-account-settings.css",
  "src/templates/business/shared.tsx",
  "src/templates/business/atlas-shell-chrome.tsx",
  "src/templates/business/atlas-shell-chrome.css",
] as const;
const archiveTarget: SourceTarget = {
  id: "atlas",
  kind: "template",
  name: "Atlas",
  family: "business",
  route: "/#/templates/atlas",
  defaultPath,
  selectedPath: defaultPath,
  requiredFiles: [
    ...implementationPaths,
    "src/templates/business/business-layout.css",
    "src/components/reui/sidebar.tsx",
    "src/components/ui/sidebar.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/field.tsx",
    "src/components/ui/separator.tsx",
    "src/components/ui/radio-group.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/breadcrumb.tsx",
    "src/templates/business/atlas-account-settings-model.ts",
    "src/templates/business/atlas-account-settings-data.ts",
    "src/templates/business/atlas-account-route.ts",
    "src/templates/business/atlas-account-route-model.ts",
    "src/blocks/application/dialog-variants/workspace/settings-panel.tsx",
    "src/blocks/application/dialog-variants/workspace/free/avatar-upload.tsx",
    "src/components/site/global-theme-store.ts",
  ],
};

for (const selectedPath of implementationPaths) {
  const target: SourceTarget = { ...archiveTarget, selectedPath };
  test(`Atlas viewport layout source ${basename(selectedPath)}: actual view, Copy and single-file bytes`, async ({
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
    const artifact = info.outputPath(`atlas-${basename(selectedPath)}`);
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(defaultPath)).toEqual(originalDefault);
    expect(await fileBytes(selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("atlas-sidebar-source-proof.json"),
      JSON.stringify(
        {
          id: target.id,
          defaultPath,
          selectedPath,
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

const target = archiveTarget;
test("Atlas viewport layout actual original ZIP preserves changed implementation and complete licensed closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const { dialog } = await openSource(page, target, "archive");
  const { files } = await captureOriginalArchive(page, target, dialog, info);
  await verifyOriginalClosure(target, files, info);
  expect(faults).toEqual([]);
});
