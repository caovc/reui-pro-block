import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";
import { defaultTheme, themeCSS } from "../src/components/site/preview-theme";

for (const primitive of ["radix", "base"] as const) {
  test(`${primitive} AppShell 18: downloaded dark starter initializes its exported theme`, async ({
    page,
    baseURL,
    context,
  }, info) => {
    if (!baseURL) throw new Error("A configured preview URL is required");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const theme = {
      ...defaultTheme,
      primitive,
      style: "sera" as const,
      mode: "dark",
      accent: "violet",
    };
    const entry = new URL(primitive === "base" ? "base/" : "./", new URL("./", baseURL));
    entry.hash = `#/block/application/app-shell/app-shell-18?${new URLSearchParams({ preset: JSON.stringify(theme) })}`;
    await page.goto(entry.href);
    await expect(page).toHaveTitle("To-Do AI Assistant — Bricklane");
    const frame = page.frameLocator('iframe[title$=" live preview"]');
    await expect(frame.getByRole("heading", { name: "All Tasks", exact: true })).toBeVisible();
    await expect(frame.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await expect(frame.locator("html")).toHaveAttribute("data-ui-style", "sera");
    await expect(frame.locator("html")).toHaveClass(/dark/);

    await page.getByRole("tab", { name: "Code", exact: true }).click();
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download starter", exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe("app-shell-18.zip");
    const archivePath = info.outputPath(`app-shell-18-${primitive}-sera-dark.zip`);
    await download.saveAs(archivePath);
    const files = unzipSync(await readFile(archivePath));
    const source = (path: string) => {
      expect(files[path], path).toBeDefined();
      return strFromU8(files[path]!);
    };
    const example = source("src/Example.tsx");
    const snapshot = example.match(/const exportedTheme = ([\s\S]+?) as const;/);
    expect(snapshot, "the actual downloaded entry carries its selected snapshot").not.toBeNull();
    expect(JSON.parse(snapshot![1])).toEqual(theme);
    expect(example).toContain("setInheritedPreviewTheme(exportedTheme, true)");
    expect(example).toContain("useLayoutEffect(() => applyTheme(theme, dark), [theme, dark])");
    expect(source("index.html")).toContain('data-ui-primitive="' + primitive + '"');
    expect(source("index.html")).toContain('data-ui-style="sera"');
    expect(source("index.html")).toContain('class="dark"');
    expect(source("src/theme.css").endsWith(themeCSS(theme))).toBe(true);
    for (const path of [
      "src/components/site/global-theme-store.ts",
      "src/components/site/preview-theme.ts",
      "src/foundations/styles/index.ts",
    ]) {
      expect(Buffer.from(files[path]!)).toEqual(await readFile(path));
    }
    const buttonPath =
      primitive === "base" ? "src/foundations/base/ui/button.tsx" : "src/components/ui/button.tsx";
    expect(Buffer.from(files["src/components/ui/button.tsx"]!)).toEqual(await readFile(buttonPath));
    expect(JSON.parse(source("components.json")).style).toBe(`${primitive}-sera`);

    const viewer = page.locator(".source-code");
    const selector = viewer.getByRole("combobox", { name: "Source file", exact: true });
    await selector.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await listbox.getByRole("option", { name: "app-shell-18.tsx", exact: true }).click();
    await expect(listbox).toHaveCount(0);
    await expect(selector).toBeFocused();
    await expect
      .poll(async () =>
        (await viewer.locator('[data-slot="code-block-line-content"]').allTextContents()).join(
          "\n",
        ),
      )
      .toBe(example);
    await viewer.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(example);
    const singleDownloading = page.waitForEvent("download");
    await viewer.getByRole("button", { name: "Download source file", exact: true }).click();
    const singleDownload = await singleDownloading;
    expect(singleDownload.suggestedFilename()).toBe("app-shell-18.tsx");
    expect(await readFile((await singleDownload.path())!, "utf8")).toBe(example);
    await info.attach("starter-theme", {
      body: JSON.stringify({
        primitive,
        theme,
        archivePath,
        memberCount: Object.keys(files).length,
      }),
      contentType: "application/json",
    });
  });
}
