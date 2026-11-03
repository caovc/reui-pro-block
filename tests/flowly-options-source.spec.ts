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

const defaultPath = "src/templates/workflow/flowly.tsx";
const implementationPaths = [
  "src/templates/workflow/flowly-settings-components.tsx",
  "src/templates/workflow/flowly-settings.css",
  "src/templates/workflow/flowly-settings-members.tsx",
] as const;
const archiveTarget: SourceTarget = {
  id: "flowly",
  kind: "template",
  name: "Flowly",
  family: "workflow",
  route: "/#/templates/flowly",
  defaultPath,
  selectedPath: defaultPath,
  requiredFiles: [
    defaultPath,
    ...implementationPaths,
    "src/templates/workflow/flowly-settings.tsx",
    "src/templates/workflow/flowly-settings-fields.tsx",
    "src/templates/workflow/flowly-settings-integrations.tsx",
    "src/templates/workflow/flowly-settings-webhooks.tsx",
    "src/templates/workflow/flowly-settings-model.ts",
    "src/templates/workflow/flowly-settings-data.ts",
    "src/blocks/application/dialog-variants/workspace/settings-panel.tsx",
    "src/blocks/application/dialog-variants/workspace/workspace.css",
    "src/components/ui/field.tsx",
    "src/components/ui/checkbox.tsx",
    "src/components/ui/label.tsx",
    "src/components/ui/switch.tsx",
    "src/components/reui/sidebar.tsx",
    "src/components/reui/frame.tsx",
  ],
};

for (const selectedPath of implementationPaths) {
  const target: SourceTarget = { ...archiveTarget, selectedPath };
  test(`Flowly settings options source ${basename(selectedPath)}: actual view, Copy and single-file bytes`, async ({
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
    const artifact = info.outputPath(`flowly-${basename(selectedPath)}`);
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(defaultPath)).toEqual(originalDefault);
    expect(await fileBytes(selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("flowly-options-source-proof.json"),
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
test("Flowly settings options actual original ZIP preserves changed implementation and complete licensed closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const { dialog } = await openSource(page, target, "archive");
  const { files } = await captureOriginalArchive(page, target, dialog, info);
  await verifyOriginalClosure(target, files, info);
  expect(faults).toEqual([]);
});
