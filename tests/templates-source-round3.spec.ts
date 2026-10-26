import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";

for (const example of [
  { id: "flux", family: "workflow", modules: ["flux", "flux-evaluations", "flux-memory"] },
  { id: "pulse", family: "collaboration", modules: ["pulse", "pulse-knowledge", "pulse-reports"] },
  { id: "cohort", family: "business", modules: ["cohort", "cohort-people", "cohort-settings"] },
  {
    id: "roster",
    family: "collaboration",
    modules: ["roster", "roster-approvals", "roster-import"],
  },
  { id: "echo", family: "workflow", modules: ["echo", "echo-composer", "echo-projects"] },
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
    expect((await page.getByRole("option").allTextContents()).slice(0, 3)).toEqual(files);
    await page.getByRole("option", { name: files[1], exact: true }).click();
    const source = await readFile(join(process.cwd(), files[1]), "utf8");
    expect(await page.locator(".template-source-code").textContent()).toBe(source);
    await page.getByRole("button", { name: "Copy", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download project", exact: true }).click();
    const download = await pending;
    const zip = unzipSync(new Uint8Array(await readFile((await download.path())!)));
    expect(strFromU8(zip[files[1]])).toBe(source);
    for (const path of files) expect(zip[path]).toBeTruthy();
    await download.saveAs(`/tmp/bricklane-templates-round3/export-${example.id}-m2.zip`);
  });
}
