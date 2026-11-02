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

const requestLogs = "src/blocks/data/grid-base-api-request-logs.tsx";
const trafficChart = "src/blocks/data/grid-base-api-request-logs-chart.tsx";
const base9Target: SourceTarget = {
  id: "data-grid-base-9",
  kind: "block",
  name: "API Request Logs",
  route: "/#/block/data-grid/base/data-grid-base-9",
  defaultPath: requestLogs,
  selectedPath: trafficChart,
  requiredFiles: [
    requestLogs,
    trafficChart,
    "src/blocks/data/grid-base-api-request-logs-data.ts",
    "src/blocks/data/grid-base-api-request-logs-model.ts",
    "src/blocks/data/grid-base-api-request-logs-types.ts",
    "src/blocks/data/reui-free-chart-primitives.tsx",
    "src/components/ui/chart.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/data-grid/data-grid.tsx",
    "src/components/reui/data-grid/data-grid-table.tsx",
  ],
};

test("Base9 chart source choice, clipboard and single-file download expose the actual implementation", async ({
  page,
  context,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const expected = await fileBytes(trafficChart);
  const { opener, dialog, choice } = await openSource(page, base9Target, "file");
  const code = await selectSource(page, base9Target, dialog, choice);
  await expect.poll(() => sourceText(code, base9Target)).toBe(expected.toString("utf8"));
  const viewed = Buffer.from(await sourceText(code, base9Target), "utf8");
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
  const artifact = info.outputPath(basename(trafficChart));
  await download.saveAs(artifact);
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe(basename(trafficChart));
  const downloaded = await readFile(artifact);
  expect(downloaded).toEqual(expected);
  expect(await fileBytes(trafficChart)).toEqual(expected);
  await writeFile(
    info.outputPath("changed-source-proof.json"),
    JSON.stringify(
      {
        id: base9Target.id,
        defaultPath: base9Target.defaultPath,
        selectedPath: trafficChart,
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

test("Base9 actual original starter retains the traffic chart, free ReUI composition and strict closure", async ({
  page,
}, info) => {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  const { dialog } = await openSource(page, base9Target, "archive");
  const pending = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
  const download = await pending;
  const archivePath = info.outputPath("base9-original.zip");
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
    info.outputPath("base9-original.zip.members.json"),
    JSON.stringify(members, null, 2) + "\n",
  );
  expect(download.suggestedFilename()).toBe("data-grid-base-9.zip");
  await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
    requestLogs,
  );
  await verifyOriginalClosure(base9Target, files, info);
  expect(strFromU8(files[trafficChart])).toContain("https://reui.io/r/radix-nova/c-chart-2.json");
  expect(strFromU8(files[trafficChart])).toContain("ReuiStripePattern");
  expect(strFromU8(files["src/Example.tsx"])).toContain("data-grid-base-9");
  const pkg = JSON.parse(strFromU8(files["package.json"]));
  expect(pkg.scripts.build).toBe("tsc --noEmit && vite build");
  expect(await readFile(archivePath)).toEqual(archiveBytes);
  expect(faults).toEqual([]);
});
