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
  "src/templates/workflow/flux-failures-workspace.tsx",
  "src/templates/workflow/flux-failures.tsx",
  "src/templates/workflow/flux-failure-detail.tsx",
  "src/templates/workflow/flux-failure-form.tsx",
  "src/templates/workflow/flux-failure-badge.tsx",
  "src/templates/workflow/flux-failures.css",
  "src/templates/workflow/flux-runs-model.ts",
  "src/templates/workflow/flux-runs-state.ts",
  "src/templates/workflow/flux-runs-route.ts",
  "src/templates/workflow/flux-runs-route-model.ts",
] as const;
const archiveTarget: SourceTarget = {
  id: "flux",
  kind: "template",
  name: "Flux",
  family: "workflow",
  route: "/#/templates/flux/runs/failures",
  defaultPath,
  selectedPath: defaultPath,
  requiredFiles: [
    defaultPath,
    ...implementationPaths,
    "src/templates/workflow/flux-sidebar-quick-links.tsx",
    "src/templates/workflow/flowly-settings-components.tsx",
    "src/templates/workflow/flowly-settings-fields.tsx",
    "src/components/reui/data-grid/data-grid.tsx",
    "src/components/reui/data-grid/data-grid-table.tsx",
    "src/components/reui/data-grid/data-grid-scroll-area.tsx",
    "src/components/reui/data-grid/data-grid-column-header.tsx",
    "src/components/reui/data-grid/data-grid-column-visibility.tsx",
    "src/components/reui/data-grid/data-grid-pagination.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/alert.tsx",
    "src/components/reui/timeline.tsx",
    "src/components/reui/number-field.tsx",
    "src/components/ui/sheet.tsx",
    "src/components/ui/select.tsx",
    "src/components/ui/field.tsx",
  ],
};

for (const selectedPath of implementationPaths) {
  const target: SourceTarget = { ...archiveTarget, selectedPath };
  test(`Flux failures source ${basename(selectedPath)}: actual view, Copy and single-file bytes`, async ({
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
    const artifact = info.outputPath(basename(selectedPath));
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    await writeFile(
      info.outputPath("failure-source-proof.json"),
      JSON.stringify(
        {
          defaultPath,
          selectedPath,
          sourceSHA256: hash(expected),
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

test("Flux failures actual original ZIP preserves the complete implementation and licensed closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const { dialog } = await openSource(page, archiveTarget, "archive");
  const { files } = await captureOriginalArchive(page, archiveTarget, dialog, info);
  const primitive = process.env.FLUX_SOURCE_PRIMITIVE === "base" ? "base" : "radix";
  await verifyOriginalClosure(archiveTarget, files, info, primitive);
  expect(faults).toEqual([]);
});
