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

const defaultPath = "src/templates/workflow/flux.tsx";
const implementationPaths = [
  "src/templates/workflow/flux-sidebar-quick-links.tsx",
  "src/templates/workflow/flux-sidebar-quick-links.css",
  "src/components/reui/sidebar.tsx",
] as const;
const archiveTarget: SourceTarget = {
  id: "flux",
  kind: "template",
  name: "Flux",
  family: "workflow",
  route: "/#/templates/flux",
  defaultPath,
  selectedPath: defaultPath,
  requiredFiles: [
    defaultPath,
    ...implementationPaths,
    "src/templates/workflow/shared.tsx",
    "src/templates/workflow/controls.tsx",
    "src/templates/workflow/grid.tsx",
    "src/templates/workflow/workflow-shell.tsx",
    "src/templates/workflow/workflow.css",
    "src/components/reui/frame.tsx",
    "src/components/reui/icon-tile.tsx",
    "src/components/reui/timeline.tsx",
    "src/components/reui/badge.tsx",
    "src/components/ui/item.tsx",
    "src/components/ui/tooltip.tsx",
    "src/components/ui/button.tsx",
    "src/components/ui/avatar.tsx",
  ],
};

for (const selectedPath of implementationPaths) {
  const target: SourceTarget = { ...archiveTarget, selectedPath };
  test(`Flux sidebar quick links source ${basename(selectedPath)}: actual view, Copy and single-file bytes`, async ({
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
    const artifact = info.outputPath(`flux-${basename(selectedPath)}`);
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(defaultPath)).toEqual(originalDefault);
    expect(await fileBytes(selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("quick-links-source-proof.json"),
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
test("Flux sidebar quick links actual original ZIP preserves changed implementation and complete licensed closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const { dialog } = await openSource(page, target, "archive");
  const { files } = await captureOriginalArchive(page, target, dialog, info);
  await verifyOriginalClosure(target, files, info);
  expect(faults).toEqual([]);
});
