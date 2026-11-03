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

const defaultPath = "src/templates/workflow/lucent.tsx";
const implementationPaths = [
  "src/templates/workflow/lucent.tsx",
  "src/templates/workflow/workflow-shell.tsx",
  "src/templates/workflow/lucent-account.tsx",
  "src/templates/workflow/lucent-account-model.ts",
  "src/templates/workflow/lucent-account-sections.tsx",
  "src/templates/workflow/lucent-account-menu.tsx",
  "src/templates/workflow/lucent-account-routes.ts",
  "src/templates/workflow/lucent-account.css",
] as const;
const archiveTarget: SourceTarget = {
  id: "lucent",
  kind: "template",
  name: "Lucent",
  family: "workflow",
  route: "/#/templates/lucent",
  defaultPath,
  selectedPath: defaultPath,
  requiredFiles: [
    ...implementationPaths,
    "src/blocks/application/dialog-variants/workspace/settings-panel.tsx",
    "src/blocks/application/dialog-variants/workspace/free/avatar-upload.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/field.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/ui/radio-group.tsx",
    "src/components/site/global-theme-store.ts",
    "src/components/reui/sidebar.tsx",
    "src/components/reui/layout.tsx",
    "src/templates/workflow/lucent-general-settings.tsx",
  ],
};

for (const selectedPath of implementationPaths) {
  const target: SourceTarget = { ...archiveTarget, selectedPath };
  test(`Lucent viewport layout source ${basename(selectedPath)}: actual view, Copy and single-file bytes`, async ({
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
    const artifact = info.outputPath(`lucent-${basename(selectedPath)}`);
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(defaultPath)).toEqual(originalDefault);
    expect(await fileBytes(selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("lucent-sidebar-source-proof.json"),
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
test("Lucent viewport layout actual original ZIP preserves changed implementation and complete licensed closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const { dialog } = await openSource(page, target, "archive");
  const { files } = await captureOriginalArchive(page, target, dialog, info);
  await verifyOriginalClosure(target, files, info);
  expect(faults).toEqual([]);
});
