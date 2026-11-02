import { expect, test, type Page } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { openSource as openNativeSource, type SourceTarget } from "./fidelity-next-source.helpers";

// Actual implementation, clipboard, single-file and original starter-byte contracts.
// Byte oracles belong to the same production build used by this test.
const leaf = "src/blocks/data/grid-advanced-retail-pnl-outlook.tsx";
const ownedSources = [
  leaf,
  "src/blocks/data/grid-advanced-retail-pnl-outlook.css",
  "src/blocks/data/grid-advanced-retail-pnl-outlook-data.ts",
  "src/blocks/data/grid-advanced-retail-pnl-outlook-model.ts",
  "src/blocks/data/grid-advanced-retail-pnl-outlook-cells.tsx",
  "src/blocks/data/grid-advanced-retail-pnl-outlook-panels.tsx",
];
const requiredSources = [
  ...ownedSources,
  "src/components/reui/data-grid/data-grid.tsx",
  "src/components/reui/data-grid/data-grid-table.tsx",
  "src/components/reui/data-grid/data-grid-cell-selection.tsx",
  "src/components/reui/data-grid/data-grid-scroll-area.tsx",
  "src/components/reui/filters/filters.tsx",
  "src/components/reui/filters/filters-types.tsx",
  "src/components/reui/filters/filters-query.tsx",
  "src/components/reui/filters/filters-advanced.tsx",
  "src/components/reui/filters/filters-builder.tsx",
  "src/components/reui/cascader/cascader.tsx",
  "src/components/reui/frame.tsx",
  "src/components/reui/REUI-LICENSE.txt",
  "src/components/ui/button-group.tsx",
  "src/components/ui/kbd.tsx",
  "src/components/ui/chart.tsx",
  "src/components/ui/dialog.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/ui/field.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/select.tsx",
  "src/blocks/reference.css",
  "src/blocks/assets/Inter-LICENSE.txt",
  "src/blocks/assets/README.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
];

// Actual bundle.ts includes only common reference-font assets for the data family.
// Advanced15 itself imports no image, flag, avatar or decorative media. This exact
// allowlist rejects unexpected distributed media; it is not a legal inference
// from a filename. The permitted font must also equal the OFL-licensed local bytes.
const permittedStandaloneMedia = ["src/blocks/assets/inter-latin-variable.woff2"];

const retailTarget: SourceTarget = {
  id: "data-grid-advanced-15",
  kind: "block",
  name: "Retail P&L Outlook",
  route: "./#/block/data-grid/advanced/data-grid-advanced-15",
  defaultPath: leaf,
  selectedPath: leaf,
  requiredFiles: requiredSources,
};

function currentFile(filename: string) {
  return readFile(resolve(process.cwd(), filename));
}

async function openSource(page: Page, purpose: "file" | "archive" = "file") {
  // Reuse the real native picker readiness for files. Archive readiness belongs
  // to the actual Download action; preserve original UI assertions after saving.
  const { dialog } = await openNativeSource(page, retailTarget, purpose);
  const sourceRegion = dialog.getByRole("region", { name: "Block source", exact: true });
  if (purpose === "file") {
    await expect(sourceRegion).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      leaf,
    );
  }
  return { dialog, sourceRegion, sourceCode: sourceRegion.locator(".source-code") };
}

// Each file keeps the original complete oracle in an independent30s case.
// The former six-file serial aggregate is no longer executed.
for (const filename of ownedSources) {
  test(`Advanced15 preserves viewer, Copy and single-file bytes: ${filename}`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const { dialog, sourceCode } = await openSource(page);
    const selector = dialog.getByRole("combobox", { name: "Source file", exact: true });
    const expected = await currentFile(filename);
    if (filename !== leaf) {
      await selector.click();
      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await listbox.getByRole("option", { name: filename, exact: true }).click();
      await expect(listbox).toBeHidden();
      await expect(selector).toHaveAttribute("aria-expanded", "false");
    }
    await expect(selector).toHaveText(filename);
    // Native CodeBlock renders one real line-content span per source line.
    // Reading those spans excludes chrome and preserves blank/trailing LF lines.
    await expect
      .poll(async () => {
        const lines = await sourceCode
          .locator('[data-slot="code-block-line-content"]')
          .allTextContents();
        return lines.join("\n");
      })
      .toBe(expected.toString("utf8"));

    await sourceCode.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected.toString("utf8"));

    const pending = page.waitForEvent("download");
    await sourceCode.getByRole("button", { name: "Download source file", exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(filename.split("/").at(-1));
    const downloadedPath = await download.path();
    expect(downloadedPath).not.toBeNull();
    expect(await readFile(downloadedPath!), filename).toEqual(expected);
  });
}

test("Advanced15 actual starter contains all six implementation files, real free dependencies and notices", async ({
  page,
}, info) => {
  const expectedSources = await Promise.all(
    requiredSources.map(async (filename) => [filename, await currentFile(filename)] as const),
  );
  const expectedPackage = JSON.parse((await currentFile("package.json")).toString("utf8"));
  const { dialog, sourceRegion } = await openSource(page, "archive");
  const pending = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("data-grid-advanced-15.zip");
  const savedArchivePath = info.outputPath("advanced15-starter.zip");
  await download.saveAs(savedArchivePath);
  await expect(sourceRegion).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(leaf);
  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();

  // Inspect the archive actually emitted by the product; do not synthesize a test ZIP.
  const archiveBytes = await readFile(savedArchivePath);
  expect(archiveBytes).toEqual(await readFile(downloadedPath!));
  const archive = unzipSync(new Uint8Array(archiveBytes));
  const memberNames = Object.keys(archive);
  for (const filename of memberNames) {
    expect(filename.startsWith("/") || /^[A-Za-z]:/.test(filename), filename).toBe(false);
    expect(filename.includes("\\") || filename.includes("\0"), filename).toBe(false);
    expect(filename.split("/").includes(".."), filename).toBe(false);
  }
  for (const [filename, expected] of expectedSources) {
    expect(archive[filename], filename).toBeDefined();
    expect(Buffer.from(archive[filename]!), filename).toEqual(expected);
  }

  const standaloneMedia = memberNames.filter((filename) =>
    /\.(?:avif|gif|jpe?g|png|webp|svg|ico|bmp|mp4|webm|mp3|wav|woff2?|ttf|otf)$/i.test(filename),
  );
  expect(standaloneMedia.toSorted()).toEqual(permittedStandaloneMedia.toSorted());
  for (const filename of standaloneMedia) {
    expect(Buffer.from(archive[filename]!), filename).toEqual(await currentFile(filename));
  }
  expect(strFromU8(archive["THIRD_PARTY_NOTICES.md"]!)).toContain(
    "those original media files are neither loaded nor bundled",
  );
  expect(strFromU8(archive["src/blocks/data/grid-advanced-retail-pnl-outlook-data.ts"]!)).toContain(
    "Original Bricklane retail fixtures",
  );

  const exportedPackage = JSON.parse(strFromU8(archive["package.json"]!));
  // The supported starter is family-wide, not a fabricated minimal dependency set.
  expect(exportedPackage.dependencies).toEqual(expectedPackage.dependencies);
  expect(exportedPackage.overrides).toEqual(expectedPackage.overrides);
  expect(exportedPackage.devDependencies).toEqual(
    Object.fromEntries(
      [
        "vite",
        "@vitejs/plugin-react",
        "@types/node",
        "typescript",
        "@types/react",
        "@types/react-dom",
      ].map((name) => [name, expectedPackage.devDependencies[name]]),
    ),
  );
  expect(exportedPackage.scripts.build).toBe("tsc --noEmit && vite build");
  const exportedTsconfig = JSON.parse(strFromU8(archive["tsconfig.json"]!));
  expect(exportedTsconfig.compilerOptions.strict).toBe(true);
  expect(exportedTsconfig.compilerOptions.allowImportingTsExtensions).toBe(true);
  expect(exportedTsconfig.compilerOptions.noEmit).toBe(true);
  expect(exportedTsconfig.compilerOptions.moduleResolution).toBe("bundler");
  expect(exportedTsconfig.include).toEqual(["src"]);
  expect(archive["src/Example.tsx"]).toBeDefined();
  expect(strFromU8(archive["src/Example.tsx"]!)).toContain("data-grid-advanced-15");
  expect(strFromU8(archive["src/components/reui/REUI-LICENSE.txt"]!)).toContain("MIT License");
  expect(strFromU8(archive["src/blocks/assets/Inter-LICENSE.txt"]!)).toContain(
    "SIL OPEN FONT LICENSE",
  );
  expect(
    Object.keys(archive).some((filename) =>
      /(?:^|\/)(?:tests|node_modules)\/|playwright/i.test(filename),
    ),
  ).toBe(false);

  const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
  const proofPath = info.outputPath("advanced15-source-proof.json");
  const proof = {
    blockId: "data-grid-advanced-15",
    cwd: process.cwd(),
    savedArchivePath,
    browserDownloadPath: downloadedPath,
    suggestedFilename: download.suggestedFilename(),
    archiveBytes: archiveBytes.length,
    archiveSha256: sha256(archiveBytes),
    memberCount: memberNames.length,
    members: memberNames.toSorted().map((filename) => ({
      path: filename,
      bytes: archive[filename]!.length,
      sha256: sha256(archive[filename]!),
    })),
    requiredSources: expectedSources.map(([filename, expected]) => ({
      path: filename,
      bytes: expected.length,
      sha256: sha256(expected),
    })),
    sourceBytesVerified: true,
    familyDependenciesVerified: true,
    packageOverridesVerified: true,
    standaloneMedia,
    permittedStandaloneMedia,
    standaloneMediaAllowlistAndBytesVerified: true,
    assetEvidenceBoundary:
      "Only the licensed local Inter font is distributed as standalone media; original-domain declaration and repository notices are byte-verified. This test does not infer legal provenance from arbitrary code or filenames.",
    runtimeOrStarterBuildVerified: false,
  };
  await writeFile(proofPath, JSON.stringify(proof, null, 2) + "\n", "utf8");
  await info.attach("Advanced15 actual starter source proof", {
    path: proofPath,
    contentType: "application/json",
  });
});
