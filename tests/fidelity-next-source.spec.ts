import { expect, test } from "@playwright/test";
import { basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
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

// Exactly one real changed-file viewer flow and one independent real ZIP per target.
// No case traverses dozens of source choices, adds budgets, or synthesizes a ZIP.
const targets: SourceTarget[] = [
  {
    id: "app-shell-2",
    kind: "block",
    name: "AppShell 2",
    route: "./#/block/application/app-shell/app-shell-2",
    defaultPath: "src/blocks/application/shells/standard.tsx",
    selectedPath: "src/blocks/application/shells/standard.tsx",
    requiredFiles: [
      "src/blocks/application/shells/standard.tsx",
      "src/components/reui/sidebar.tsx",
    ],
  },
  {
    id: "app-shell-18",
    kind: "block",
    name: "AppShell 18",
    route: "./#/block/application/app-shell/app-shell-18",
    defaultPath: "src/blocks/application/shells/productivity.tsx",
    selectedPath: "src/blocks/application/shells/productivity.tsx",
    requiredFiles: [
      "src/blocks/application/shells/productivity.tsx",
      "src/components/ui/progress.tsx",
      "src/components/reui/sidebar.tsx",
    ],
  },
  ...[3, 4].map((variant): SourceTarget => ({
    id: `data-grid-advanced-${variant}`,
    kind: "block",
    name: `Advanced ${variant}`,
    route: `./#/block/data-grid/advanced/data-grid-advanced-${variant}`,
    defaultPath: "src/blocks/data/grid-advanced.tsx",
    selectedPath: "src/blocks/data/grid-advanced-shared.tsx",
    requiredFiles: [
      "src/blocks/data/grid-advanced.tsx",
      "src/blocks/data/grid-advanced-shared.tsx",
      "src/components/ui/tabs.tsx",
      "src/components/reui/badge.tsx",
      "src/components/reui/data-grid/data-grid.tsx",
    ],
  })),
  {
    id: "pricing-1",
    kind: "block",
    name: "Pricing 1",
    route: "./#/block/marketing/pricing/pricing-1",
    defaultPath: "src/blocks/commerce/pricing-seat-stepper.tsx",
    selectedPath: "src/blocks/commerce/pricing-seat-stepper.css",
    requiredFiles: [
      "src/blocks/commerce/pricing-seat-stepper.tsx",
      "src/blocks/commerce/pricing-seat-stepper.css",
      "src/components/reui/badge.tsx",
      "src/components/ui/tabs.tsx",
    ],
  },
  {
    id: "miro",
    kind: "template",
    name: "Miro",
    family: "business",
    route: "./#/templates/miro",
    defaultPath: "src/templates/business/miro.tsx",
    selectedPath: "src/components/ui/tabs.tsx",
    requiredFiles: ["src/templates/business/miro.tsx", "src/components/ui/tabs.tsx"],
  },
  {
    id: "mesh",
    kind: "template",
    name: "Mesh",
    family: "workflow",
    route: "./#/templates/mesh",
    defaultPath: "src/templates/workflow/mesh.tsx",
    selectedPath: "src/templates/workflow/mesh.tsx",
    requiredFiles: [
      "src/templates/workflow/mesh.tsx",
      "src/templates/workflow/mesh-canvas.tsx",
      "src/templates/workflow/workflow-shell.tsx",
      "src/components/ui/sidebar.tsx",
      "src/blocks/application/whiteboard.tsx",
      "src/blocks/application/whiteboard-engine.tsx",
      "src/blocks/application/whiteboard-fonts.ts",
      "scripts/copy-excalidraw-assets.mjs",
    ],
  },
];

for (const target of targets) {
  test(`${target.id} changed source: actual default, view, clipboard and single-file bytes`, async ({
    page,
    context,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const expected = await fileBytes(target.selectedPath);
    const { opener, dialog, choice } = await openSource(page, target);
    const code = await selectSource(page, target, dialog, choice);
    await expect.poll(() => sourceText(code, target)).toBe(expected.toString("utf8"));
    const viewBytes = Buffer.from(await sourceText(code, target), "utf8");
    expect(viewBytes).toEqual(expected);
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected.toString("utf8"));
    const copied = Buffer.from(await page.evaluate(() => navigator.clipboard.readText()), "utf8");
    expect(copied).toEqual(expected);
    const pending = page.waitForEvent("download");
    await code
      .getByRole("button", {
        name: target.kind === "block" ? "Download source file" : "Download template source file",
        exact: true,
      })
      .click();
    const download = await pending;
    const artifact = info.outputPath(`${target.id}-${basename(target.selectedPath)}`);
    await download.saveAs(artifact);
    expect(download.suggestedFilename()).toBe(basename(target.selectedPath));
    expect(await download.failure()).toBeNull();
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(target.selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("changed-source-proof.json"),
      JSON.stringify(
        {
          id: target.id,
          defaultPath: target.defaultPath,
          selectedPath: target.selectedPath,
          originalSHA256: hash(expected),
          viewSHA256: hash(viewBytes),
          clipboardSHA256: hash(copied),
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

  test(`${target.id} actual original ZIP: changed sources, free dependencies, local closure and licenses`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    const frozen = new Map(
      await Promise.all(
        target.requiredFiles.map(
          async (filename) => [filename, await fileBytes(filename)] as const,
        ),
      ),
    );
    const { dialog } = await openSource(page, target, "archive");
    const { files, archivePath, archiveBytes } = await captureOriginalArchive(
      page,
      target,
      dialog,
      info,
    );
    for (const [filename, expected] of frozen) {
      expect(files[filename], filename).toBeDefined();
      expect(Buffer.from(files[filename]!)).toEqual(expected);
      expect(await fileBytes(filename)).toEqual(expected);
    }
    await verifyOriginalClosure(target, files, info);
    expect(await readFile(archivePath)).toEqual(archiveBytes);
    expect(faults).toEqual([]);
  });
}
