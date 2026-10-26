import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

const implementations = [
  [4, "pricing-customer-logos", "CustomerLogoPricing"],
  [5, "pricing-refined", "AnalyticsPricing"],
  [6, "pricing-refined", "AgencyPricing"],
  [7, "pricing-upgrade-dialog", "UpgradePlanPricing"],
  [8, "pricing-usage-limit", "UsageLimitPricing"],
] as const;

for (const [variant, module, component] of implementations) {
  test(`Pricing ${variant} exposes its actual implementation consistently in source, clipboard, file and starter`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/marketing/pricing/pricing-${variant}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const filename = `src/blocks/commerce/${module}.tsx`;
    const selector = dialog.getByRole("combobox", { name: "Source file" });
    await expect(selector).toHaveText(filename);
    const source = dialog.locator(".source-code");
    await expect(source).toContainText(`function ${component}`);
    const expected = await readFile(filename, "utf8");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);

    const pendingFile = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    const downloadedFile = await pendingFile;
    expect(downloadedFile.suggestedFilename()).toBe(`${module}.tsx`);
    expect(await readFile((await downloadedFile.path())!, "utf8")).toBe(expected);

    const pendingStarter = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
    const starter = await pendingStarter;
    const files = unzipSync(new Uint8Array(await readFile((await starter.path())!)));
    expect(strFromU8(files[filename])).toBe(expected);
    expect(strFromU8(files["src/Example.tsx"])).toContain(`"id": "pricing-${variant}"`);
    expect(strFromU8(files["src/blocks/commerce/pricing.tsx"])).toContain(component);
    expect(strFromU8(files["src/main.tsx"]).trimStart()).toMatch(/^import ["']\.\/theme\.css["'];/);
    for (const notice of [
      "LICENSE",
      "THIRD_PARTY_NOTICES.md",
      "src/components/reui/REUI-LICENSE.txt",
      "src/blocks/assets/Inter-LICENSE.txt",
      "src/blocks/assets/inter-latin-variable.woff2",
    ]) {
      expect(files[notice], notice).toBeDefined();
    }
  });
}
