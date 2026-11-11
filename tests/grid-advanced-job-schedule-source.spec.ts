import { expect, test } from "@playwright/test";
import { strFromU8 } from "fflate";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { getUiStyleCss, UI_STYLES } from "../src/foundations/styles/index";
import {
  captureOriginalArchive,
  fileBytes,
  selectSource,
  sourceText,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const group = "#/block/data-grid/advanced/";
const directory = "src/blocks/data/";
const sheetPath = "src/components/ui/sheet.tsx";
const target: SourceTarget = {
  id: "data-grid-advanced-22",
  name: "Job Schedule",
  kind: "block",
  route: `${group}data-grid-advanced-22`,
  defaultPath: `${directory}grid-advanced-job-schedule.tsx`,
  selectedPath: sheetPath,
  requiredFiles: [
    `${directory}grid-advanced-job-schedule.tsx`,
    `${directory}grid-advanced-job-schedule-grid.tsx`,
    `${directory}grid-advanced-job-schedule-details.tsx`,
    `${directory}grid-advanced-job-schedule-forms.tsx`,
    `${directory}grid-advanced-job-schedule-model.ts`,
    "src/components/reui/data-grid/data-grid-table.tsx",
    "src/components/reui/filters/filters.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/number-field.tsx",
    "src/lib/demo-artwork.ts",
  ],
};

const notices = [
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "src/components/reui/REUI-LICENSE.txt",
  "src/blocks/assets/Inter-LICENSE.txt",
];

function archiveText(files: Record<string, Uint8Array>, path: string) {
  expect(files[path], path).toBeDefined();
  return strFromU8(files[path]);
}

for (const primitive of ["radix", "base"] as const) {
  for (const style of UI_STYLES) {
    test(`${primitive}/${style} ${target.name} native preview, source, clipboard, file and ZIP`, async ({
      page,
      context,
      baseURL,
    }, info) => {
      const theme = { primitive, style, accent: "violet", mode: "light" };
      const params = new URLSearchParams({ preset: JSON.stringify(theme) });
      const href = new URL(
        `${primitive === "base" ? "base/" : "./"}${target.route}?${params}`,
        baseURL,
      ).href;
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      await page.goto(href);

      const preview = page.frameLocator(`iframe[title="${target.name} live preview"]`);
      const html = preview.locator("html");
      await expect(html).toHaveAttribute("data-ui-primitive", primitive);
      await expect(html).toHaveAttribute("data-ui-style", style);
      await expect(html).toHaveCSS("--primary", "#7c3aed");
      const add = preview.getByRole("button", {
        name: "Add Job",
        exact: true,
      });
      await add.press("Enter");
      const sheet = preview.getByRole("dialog");
      await expect(sheet).toBeVisible();
      await expect(sheet).toHaveAttribute(
        primitive === "base" ? "data-open" : "data-state",
        primitive === "base" ? "" : "open",
      );
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(add).toBeFocused();
      const appearance = await add.evaluate((button) => {
        const style = getComputedStyle(button);
        return {
          height: style.height,
          radius: style.borderStartStartRadius,
          padding: style.paddingInlineStart,
        };
      });
      expect(parseFloat(appearance.height)).toBeGreaterThan(20);
      await info.attach("preview-style.json", {
        body: JSON.stringify(appearance),
        contentType: "application/json",
      });

      const opener = page.getByRole("button", { name: "View code", exact: true });
      await opener.click();
      const dialog = page.getByRole("dialog");
      const choice = dialog.getByRole("combobox", { name: "Source file", exact: true });
      const { files } = await captureOriginalArchive(page, target, dialog, info);
      const defaultCode = dialog.locator(".source-code");
      const expectedDefault = (await fileBytes(target.defaultPath)).toString("utf8");
      await expect.poll(() => sourceText(defaultCode, target)).toBe(expectedDefault);

      const nativePath = primitive === "base" ? "src/foundations/base/ui/sheet.tsx" : sheetPath;
      const nativeBytes = await fileBytes(nativePath);
      const nativeCode = await selectSource(page, target, dialog, choice);
      await expect.poll(() => sourceText(nativeCode, target)).toBe(nativeBytes.toString("utf8"));
      await nativeCode.getByRole("button", { name: "Copy", exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(nativeBytes.toString("utf8"));
      const pending = page.waitForEvent("download");
      await nativeCode.getByRole("button", { name: "Download source file", exact: true }).click();
      const file = await pending;
      expect(file.suggestedFilename()).toBe(basename(sheetPath));
      const saved = info.outputPath(file.suggestedFilename());
      await file.saveAs(saved);
      expect(await readFile(saved)).toEqual(nativeBytes);
      expect(Buffer.from(files[sheetPath])).toEqual(nativeBytes);

      for (const filename of [...target.requiredFiles, ...notices]) {
        expect(Buffer.from(files[filename]), filename).toEqual(await fileBytes(filename));
      }
      const components = JSON.parse(archiveText(files, "components.json"));
      expect(components.style).toBe(`${primitive}-${style}`);
      const manifest = JSON.parse(archiveText(files, "package.json"));
      expect(
        manifest.dependencies[primitive === "base" ? "@base-ui/react" : "radix-ui"],
      ).toBeTruthy();
      const themeCss = archiveText(files, "src/theme.css");
      expect(themeCss).toContain(getUiStyleCss(style).trim());
      expect(themeCss).toContain("--primary: #7c3aed");
      expect(archiveText(files, "src/Example.tsx")).toContain(target.id);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
      expect(faults).toEqual([]);
    });
  }
}
