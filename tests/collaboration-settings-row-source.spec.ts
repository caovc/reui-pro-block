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

const sharedPaths = [
  "src/templates/collaboration/settings-shared.tsx",
  "src/templates/collaboration/settings-row.css",
] as const;
const apiPath = "src/blocks/application/dialog-variants/workspace/settings-panel.tsx";

for (const id of ["pulse", "roster"] as const) {
  const defaultPath = `src/templates/collaboration/${id}.tsx`;
  const target: SourceTarget = {
    id,
    kind: "template",
    name: id === "pulse" ? "Pulse" : "Roster",
    family: "collaboration",
    route: `/#/templates/${id}`,
    defaultPath,
    selectedPath: defaultPath,
    requiredFiles: [
      defaultPath,
      `src/templates/collaboration/${id}-settings.tsx`,
      `src/templates/collaboration/${id}-settings.css`,
      "src/templates/collaboration/settings.css",
      ...sharedPaths,
      apiPath,
      "src/components/ui/field.tsx",
      "src/components/ui/select.tsx",
      "src/components/reui/frame.tsx",
      "src/components/reui/number-field.tsx",
    ],
  };
  const selectedPaths = [
    ...sharedPaths,
    ...(id === "pulse" ? [apiPath, "src/templates/collaboration/pulse-settings.tsx"] : []),
  ];
  for (const selectedPath of selectedPaths) {
    test(`${id} SettingRow source ${basename(selectedPath)}: actual view, Copy and single-file bytes`, async ({
      page,
      context,
    }, info) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const selected = { ...target, selectedPath };
      const originalDefault = await fileBytes(defaultPath);
      const expected = await fileBytes(selectedPath);
      const { opener, dialog, choice } = await openSource(page, selected);
      await expect.poll(() => sourceText(dialog, selected)).toBe(originalDefault.toString("utf8"));
      const code = await selectSource(page, selected, dialog, choice);
      await expect.poll(() => sourceText(code, selected)).toBe(expected.toString("utf8"));
      const view = Buffer.from(await sourceText(code, selected), "utf8");
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
      await code
        .getByRole("button", { name: "Download template source file", exact: true })
        .click();
      const download = await pending;
      const artifact = info.outputPath(`${id}-${basename(selectedPath)}`);
      await download.saveAs(artifact);
      expect(await download.failure()).toBeNull();
      expect(download.suggestedFilename()).toBe(basename(selectedPath));
      const downloaded = await readFile(artifact);
      expect(downloaded).toEqual(expected);
      expect(await fileBytes(defaultPath)).toEqual(originalDefault);
      expect(await fileBytes(selectedPath)).toEqual(expected);
      await writeFile(
        info.outputPath("setting-row-source-proof.json"),
        JSON.stringify(
          {
            id,
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

  test(`${id} actual original SettingRow ZIP preserves helper, CSS, API and complete licensed closure`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    const { dialog } = await openSource(page, target, "archive");
    const { files } = await captureOriginalArchive(page, target, dialog, info);
    // The unmodified shared oracle checks every actual source/member, imports,
    // package contract, original notice/font/media bytes, and this required list.
    await verifyOriginalClosure(target, files, info);
    expect(faults).toEqual([]);
  });
}
