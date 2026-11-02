import { expect, test } from "@playwright/test";
import { basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import {
  fileBytes,
  hash,
  openSource,
  selectSource,
  sourceText,
  verifyOriginalClosure,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const standard = "src/blocks/application/shells/standard.tsx";
const chrome = "src/blocks/application/shells/chrome.tsx";
const freeSidebar = "src/components/reui/sidebar.tsx";
const shellTarget: SourceTarget = {
  id: "app-shell-1",
  kind: "block",
  name: "Icon Rail Dashboard",
  route: "/#/block/application/app-shell/app-shell-1",
  defaultPath: standard,
  selectedPath: standard,
  requiredFiles: [
    standard,
    chrome,
    freeSidebar,
    "src/components/ui/sidebar.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/brand-mark.tsx",
  ],
};

// Keep the two real file flows independent under the existing case budget.
for (const selectedPath of [standard, chrome]) {
  test(`AppShell1 ${basename(selectedPath)} source view, clipboard and single-file download agree`, async ({
    page,
    context,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const target = { ...shellTarget, selectedPath };
    const expected = await fileBytes(selectedPath);
    const { opener, dialog, choice } = await openSource(page, target, "file");
    const code = await selectSource(page, target, dialog, choice);
    await expect.poll(() => sourceText(code, target)).toBe(expected.toString("utf8"));
    const viewed = Buffer.from(await sourceText(code, target), "utf8");
    expect(viewed).toEqual(expected);
    await code.getByRole("button", { name: "Copy", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(expected.toString("utf8"));
    const copied = Buffer.from(await page.evaluate(() => navigator.clipboard.readText()), "utf8");
    expect(copied).toEqual(expected);
    const pending = page.waitForEvent("download");
    await code.getByRole("button", { name: "Download source file", exact: true }).click();
    const download = await pending;
    const artifact = info.outputPath(basename(selectedPath));
    await download.saveAs(artifact);
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(basename(selectedPath));
    const downloaded = await readFile(artifact);
    expect(downloaded).toEqual(expected);
    expect(await fileBytes(selectedPath)).toEqual(expected);
    await writeFile(
      info.outputPath("changed-source-proof.json"),
      JSON.stringify(
        {
          id: target.id,
          defaultPath: target.defaultPath,
          selectedPath,
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
}

test("AppShell1 actual original starter retains both menu consumers and the free ReUI sidebar", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const { dialog } = await openSource(page, shellTarget, "archive");
  const pending = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
  const download = await pending;
  const archivePath = info.outputPath("appshell1-original.zip");
  // Preserve the actual first download before any content or default-source oracle.
  await download.saveAs(archivePath);
  expect(await download.failure()).toBeNull();
  const archiveBytes = await readFile(archivePath);
  const files = unzipSync(new Uint8Array(archiveBytes));
  const members = Object.fromEntries(
    Object.entries(files).map(([path, bytes]) => [
      path,
      { bytes: bytes.length, sha256: hash(bytes) },
    ]),
  );
  await writeFile(
    info.outputPath("appshell1-original.zip.members.json"),
    JSON.stringify(members, null, 2) + "\n",
  );
  expect(download.suggestedFilename()).toBe("app-shell-1.zip");
  await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
    standard,
  );
  await verifyOriginalClosure(shellTarget, files, info);
  expect(strFromU8(files[chrome])).toContain("@/components/reui/sidebar");
  expect(strFromU8(files[freeSidebar])).toContain("export function SidebarNavigation");
  expect(strFromU8(files["src/Example.tsx"])).toContain("app-shell-1");
  const pkg = JSON.parse(strFromU8(files["package.json"]));
  expect(pkg.scripts.build).toBe("tsc --noEmit && vite build");
  expect(await readFile(archivePath)).toEqual(archiveBytes);
  expect(faults).toEqual([]);
});
