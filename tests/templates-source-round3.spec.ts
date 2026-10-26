import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";

for (const example of [
  { id: "flux", family: "workflow", modules: ["flux", "flux-evaluations", "flux-memory"] },
  { id: "pulse", family: "collaboration", modules: ["pulse", "pulse-knowledge", "pulse-reports"] },
  {
    id: "cohort",
    family: "business",
    modules: [
      "cohort",
      "cohort-people",
      "cohort-person-detail",
      "cohort-person-editor-fields",
      "cohort-settings",
    ],
  },
  {
    id: "roster",
    family: "collaboration",
    modules: ["roster", "roster-approvals", "roster-import"],
  },
  { id: "echo", family: "workflow", modules: ["echo", "echo-sidebar", "echo-settings"] },
]) {
  test(`${example.id} promotes its actual secondary implementations and copies the exact ZIP source`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`/#/templates/${example.id}`);
    await page.getByRole("button", { name: "View template source", exact: true }).click();
    const files = example.modules.map((module) => `src/templates/${example.family}/${module}.tsx`);
    await page.getByRole("combobox", { name: "Template source file", exact: true }).click();
    expect((await page.getByRole("option").allTextContents()).slice(0, files.length)).toEqual(
      files,
    );
    await page.getByRole("option", { name: files[1], exact: true }).click();
    const source = await readFile(join(process.cwd(), files[1]), "utf8");
    expect(await page.locator(".template-source-code").textContent()).toBe(source);
    await page.getByRole("button", { name: "Copy", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    // Cohort promotes its actual People detail/editor leaves before Settings.
    // Verify every new secondary source without dropping the original People checks.
    const extraSources = new Map<string, string>();
    if (example.id === "cohort") {
      for (const path of files.slice(2)) {
        await page.getByRole("combobox", { name: "Template source file", exact: true }).click();
        await page.getByRole("option", { name: path, exact: true }).click();
        await expect(
          page.getByRole("combobox", { name: "Template source file", exact: true }),
        ).toHaveText(path);
        const expected = await readFile(join(process.cwd(), path), "utf8");
        expect(await page.locator(".template-source-code").textContent()).toBe(expected);
        await page.getByRole("button", { name: "Copy", exact: true }).click();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
        extraSources.set(path, expected);
      }
    }
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download project", exact: true }).click();
    const download = await pending;
    const zip = unzipSync(new Uint8Array(await readFile((await download.path())!)));
    expect(strFromU8(zip[files[1]])).toBe(source);
    for (const [path, expected] of extraSources) {
      expect(zip[path], path).toBeDefined();
      expect(strFromU8(zip[path]), path).toBe(expected);
    }
    for (const path of files) expect(zip[path]).toBeTruthy();
    await download.saveAs(`/tmp/bricklane-templates-round3/export-${example.id}-m2.zip`);
  });
}
