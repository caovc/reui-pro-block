import { expect, test } from "@playwright/test";
import { basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
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

// These four native cases belong to Activity2/3 only. The older five-entry
// activity suite remains a separate contract, without inherited PASS claims.
// Use the actual free ReUI CodeBlock/Select and existing export-closure helpers;
// do not manufacture a source response, clipboard result or replacement ZIP.
const feed = "src/blocks/data/agent-activity-feed.tsx";
const research = "src/blocks/data/agent-activity-research.tsx";
const sharedSources = [
  feed,
  research,
  "src/blocks/data/agent-activity-model.ts",
  "src/blocks/data/agent-activity-variants.tsx",
  "src/blocks/data/index.tsx",
  "src/components/reui/badge.tsx",
  "src/components/reui/code-block/code-block.tsx",
  "src/components/reui/REUI-LICENSE.txt",
  "src/components/ui/button.tsx",
  "src/components/ui/card.tsx",
  "src/components/ui/marker.tsx",
  "src/components/ui/tooltip.tsx",
  "src/blocks/reference.css",
  "src/blocks/assets/Inter-LICENSE.txt",
  "src/blocks/assets/README.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
];

const targets: readonly SourceTarget[] = [
  {
    id: "agent-activity-2",
    kind: "block",
    name: "Activity2 Marker feed",
    route: "./#/block/ai-agents/agent-activity/agent-activity-2",
    defaultPath: feed,
    selectedPath: feed,
    requiredFiles: [...sharedSources, "src/components/ui/dropdown-menu.tsx"],
  },
  {
    id: "agent-activity-3",
    kind: "block",
    name: "Activity3 research timeline",
    route: "./#/block/ai-agents/agent-activity/agent-activity-3",
    defaultPath: research,
    selectedPath: research,
    requiredFiles: [
      ...sharedSources,
      "src/components/reui/timeline.tsx",
      "src/components/ui/item.tsx",
    ],
  },
];

// Data-family downloadBundle currently distributes only the licensed local
// reference font as standalone media. Source links and free-registry references
// are allowed; this is an explicit asset contract, not a provenance inference.
const permittedStandaloneMedia = ["src/blocks/assets/inter-latin-variable.woff2"];
const standaloneMediaPattern =
  /\.(?:avif|gif|jpe?g|png|webp|svg|ico|bmp|mp4|webm|mp3|wav|woff2?|ttf|otf)$/i;
const vendorAssetURL =
  /(?:https?:)?\/\/(?:[a-z0-9-]+\.)*(?:reui\.io|keenthemes\.com)\/[^\s"'`<>]*(?:\.(?:avif|gif|jpe?g|png|webp|svg|ico|bmp|mp4|webm|mp3|wav)(?:[?#][^\s"'`<>]*)?)/gi;

for (const target of targets) {
  test(`${target.id} actual leaf: default, view, Copy and single-file bytes`, async ({
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
    const viewed = Buffer.from(await sourceText(code, target), "utf8");
    expect(viewed).toEqual(expected);

    // A stale clipboard from a previous run cannot satisfy this Copy contract.
    await page.evaluate(
      (id) => navigator.clipboard.writeText(`Before actual source Copy: ${id}`),
      target.id,
    );
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected.toString("utf8"));
    const copied = Buffer.from(await page.evaluate(() => navigator.clipboard.readText()), "utf8");
    expect(copied).toEqual(expected);

    const pending = page.waitForEvent("download");
    await code.getByRole("button", { name: "Download source file", exact: true }).click();
    const download = await pending;
    const artifact = info.outputPath(`${target.id}-${basename(target.selectedPath)}`);
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(target.selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(target.selectedPath)).toEqual(expected);

    await writeFile(
      info.outputPath(`${target.id}-source-file-proof.json`),
      JSON.stringify(
        {
          id: target.id,
          defaultPath: target.defaultPath,
          selectedPath: target.selectedPath,
          originalSHA256: hash(expected),
          viewSHA256: hash(viewed),
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

  test(`${target.id} actual project ZIP: dedicated leaves, free components, licenses and import closure`, async ({
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
      expect(Buffer.from(files[filename]!), filename).toEqual(expected);
      expect(await fileBytes(filename), filename).toEqual(expected);
    }
    // Existing helper parses actual TS/CSS imports, checks every original source
    // member, dependencies/overrides/strict config, and exact MIT/OFL notices.
    await verifyOriginalClosure(target, files, info);

    const catalog: { blocks: { id: string; index: number; [key: string]: unknown }[] }[] =
      JSON.parse((await fileBytes("src/data/catalog.json")).toString("utf8"));
    const catalogBlock = catalog
      .flatMap((category) => category.blocks)
      .find((block) => block.id === target.id);
    expect(catalogBlock).toBeDefined();
    expect(catalogBlock?.index).toBe(Number(target.id.split("-").at(-1)) - 1);
    const example = strFromU8(files["src/Example.tsx"]!);
    expect(example).toContain("import DataBlock from '@/blocks/data'");
    expect(example).toContain("<DataBlock block={block} />");
    const wrapperMatch = example.match(
      /const block = ([\s\S]*?)\n\nexport default function Example/,
    );
    expect(wrapperMatch, "Original generated wrapper keeps the real catalog entry").not.toBeNull();
    if (!wrapperMatch) throw new Error(`Original ${target.id} wrapper metadata missing`);
    const wrapperMetadata = JSON.parse(wrapperMatch[1]);
    expect(wrapperMetadata).toEqual(catalogBlock);

    const standaloneMedia = Object.keys(files).filter((filename) =>
      standaloneMediaPattern.test(filename),
    );
    expect(standaloneMedia.toSorted()).toEqual(permittedStandaloneMedia.toSorted());
    for (const filename of standaloneMedia) {
      expect(Buffer.from(files[filename]!), filename).toEqual(await fileBytes(filename));
    }
    const vendorAssetReferences = Object.entries(files)
      .filter(([filename]) => /\.(?:[cm]?[jt]sx?|css|html|json)$/i.test(filename))
      .flatMap(([filename, bytes]) =>
        [...strFromU8(bytes).matchAll(vendorAssetURL)].map((match) => ({
          filename,
          url: match[0],
        })),
      );
    expect(vendorAssetReferences, "No bundled source loads vendor preview media URLs").toEqual([]);
    expect(strFromU8(files["THIRD_PARTY_NOTICES.md"]!)).toContain(
      "those original media files are neither loaded nor bundled",
    );
    expect(strFromU8(files["src/main.tsx"]!).trimStart()).toMatch(
      /^import ["']\.\/theme\.css["'];/,
    );
    expect(await readFile(archivePath)).toEqual(archiveBytes);

    await writeFile(
      info.outputPath(`${target.id}-project-proof.json`),
      JSON.stringify(
        {
          id: target.id,
          defaultPath: target.defaultPath,
          wrapperMetadata,
          archivePath,
          archiveSHA256: hash(archiveBytes),
          exampleSHA256: hash(files["src/Example.tsx"]!),
          requiredSources: [...frozen].map(([path, bytes]) => ({
            path,
            bytes: bytes.length,
            sha256: hash(bytes),
          })),
          standaloneMedia,
          permittedStandaloneMedia,
          vendorAssetReferences,
          assetEvidenceBoundary:
            "Exact local font allowlist and original notices; vendor asset URL scan covers text source only. Embedded original-art provenance is not inferred from filenames or this scan.",
          originalEntryPackageOrConfigModified: false,
          originalStrictBuildOrRuntimeVerified: false,
        },
        null,
        2,
      ) + "\n",
    );
    expect(faults).toEqual([]);
  });
}
