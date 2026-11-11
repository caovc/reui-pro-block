import { expect, test } from "@playwright/test";
import { strFromU8 } from "fflate";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  verifyOriginalClosure,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

test.setTimeout(45_000);
test.use({ actionTimeout: 10_000 });

const leaf = "src/blocks/data/grid-advanced-support-scorecard.tsx";
const model = "src/blocks/data/grid-advanced-support-scorecard-model.ts";
const panels = "src/blocks/data/grid-advanced-support-scorecard-panels.tsx";
const sheet = "src/components/ui/sheet.tsx";
const target: SourceTarget = {
  id: "data-grid-advanced-17",
  kind: "block",
  name: "Support Scorecard",
  route: "./#/block/data-grid/advanced/data-grid-advanced-17",
  defaultPath: leaf,
  selectedPath: leaf,
  requiredFiles: [
    leaf,
    model,
    panels,
    "src/blocks/data/reui-free-chart-primitives.tsx",
    "src/components/reui/data-grid/data-grid.tsx",
    "src/components/reui/data-grid/data-grid-column-visibility.tsx",
    "src/components/reui/filters/filters.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/number-field.tsx",
    sheet,
    "src/components/ui/tabs.tsx",
    "src/lib/demo-artwork.ts",
    "src/components/reui/REUI-LICENSE.txt",
  ],
};

for (const { primitive, style } of [
  { primitive: "radix", style: "nova" },
  { primitive: "base", style: "maia" },
] as const) {
  test(`Support Scorecard uses the ${primitive}-${style} implementation in previews and downloads`, async ({
    page,
    context,
    baseURL,
  }, info) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const site = new URL(primitive === "base" ? "base/" : "./", baseURL);
    const url = new URL(target.route, site);
    url.hash += `?preset=${encodeURIComponent(JSON.stringify({ primitive, style }))}`;
    const resolved = { ...target, route: url.href };
    const { dialog, choice } = await openSource(page, resolved, "archive");
    const { files } = await captureOriginalArchive(page, resolved, dialog, info);
    await verifyOriginalClosure(resolved, files, info, primitive);
    const preview = page
      .frameLocator('iframe[title="Support Scorecard live preview"]')
      .locator("html");
    await expect(preview).toHaveAttribute("data-ui-primitive", primitive);
    await expect(preview).toHaveAttribute("data-ui-style", style);
    expect(JSON.parse(strFromU8(files["components.json"])).style).toBe(`${primitive}-${style}`);
    expect(strFromU8(files["src/theme.css"])).toContain(
      (await page.locator("#preview-preset").textContent())!.trim(),
    );

    const nativeSheet = primitive === "base" ? "src/foundations/base/ui/sheet.tsx" : sheet;
    for (const filename of [leaf, model, panels, sheet]) {
      const selected = { ...resolved, selectedPath: filename };
      const code = await selectSource(page, selected, dialog, choice);
      const expected = await fileBytes(filename === sheet ? nativeSheet : filename);
      await expect.poll(() => sourceText(code, selected)).toBe(expected.toString("utf8"));
      await code.getByRole("button", { name: "Copy", exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(expected.toString("utf8"));
      const pending = page.waitForEvent("download");
      await code.getByRole("button", { name: "Download source file", exact: true }).click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe(basename(filename));
      expect(await readFile((await download.path())!)).toEqual(expected);
      expect(Buffer.from(files[filename])).toEqual(expected);
    }
  });
}
