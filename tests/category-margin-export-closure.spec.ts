import { expect as baseExpect, test } from "@playwright/test";
import { strFromU8 } from "fflate";
import {
  captureOriginalArchive,
  expectRawBytes,
  fileBytes,
  hash,
  openSource,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const expect = baseExpect.configure({ timeout: 5000 });
test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 5000, trace: "on" });

const leaf = "src/blocks/data/grid-advanced-category-margin.tsx";
const adapter = "src/templates/workflow/free/flowly-toggle-group.tsx";
const group = "src/components/ui/toggle-group.tsx";
const toggle = "src/components/ui/toggle.tsx";
const license = "src/components/reui/REUI-LICENSE.txt";
const notices = "THIRD_PARTY_NOTICES.md";

for (const primitive of ["radix", "base"] as const) {
  test(`Category24 ${primitive}: real starter retains the original mode adapter and native toggle closure`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    const preset = new URLSearchParams({
      preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
    });
    const target: SourceTarget = {
      id: "data-grid-advanced-24",
      kind: "block",
      name: "Category Margin",
      route: `${primitive === "base" ? "./base/" : "./"}#/block/data-grid/advanced/data-grid-advanced-24?${preset}`,
      defaultPath: leaf,
      selectedPath: leaf,
      requiredFiles: [leaf, adapter, group, toggle, license, notices],
    };
    const { opener, dialog } = await openSource(page, target, "archive");
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    const { files } = await captureOriginalArchive(page, target, dialog, info);
    expect(files[leaf], leaf).toBeDefined();
    expect(strFromU8(files[leaf]!)).toContain(
      'import { ToggleGroup, ToggleGroupItem } from "@/templates/workflow/free/flowly-toggle-group";',
    );
    const verified = [];
    for (const filename of [adapter, group, toggle, license, notices]) {
      const original =
        primitive === "base" && [group, toggle].includes(filename)
          ? filename.replace("src/components/ui/", "src/foundations/base/ui/")
          : filename;
      const expected = await fileBytes(original);
      expect
        .soft(files[filename], `${filename}: actual targeted original ZIP member`)
        .toBeDefined();
      if (files[filename]) expectRawBytes(files[filename]!, expected, filename);
      verified.push({
        path: filename,
        original,
        expectedSha256: hash(expected),
        actualSha256: files[filename] ? hash(files[filename]!) : null,
      });
    }
    if (files[adapter]) {
      expect(strFromU8(files[adapter]!)).toContain('from "@/components/ui/toggle-group"');
    }
    if (files[group]) {
      expect(strFromU8(files[group]!)).toContain(
        primitive === "base" ? 'from "@base-ui/react/toggle-group"' : 'from "radix-ui"',
      );
    }
    expect(strFromU8(files[license]!)).toContain("MIT License");
    expect(strFromU8(files[license]!)).toContain("Copyright (c) 2025 Keenthemes Inc");
    expect(strFromU8(files[notices]!)).toContain("Copyright (c) 2023 shadcn");
    await info.attach("category-mode-export-closure", {
      body: JSON.stringify({ primitive, verified, faults }, null, 2),
      contentType: "application/json",
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    expect(faults).toEqual([]);
  });
}
