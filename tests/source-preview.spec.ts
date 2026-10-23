import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const cases = [
  [
    "application/app-shell/app-shell-1",
    "src/blocks/application/shells/standard.tsx",
    "IconRailDashboard",
  ],
  ["chart/bar-chart/chart-42", "src/blocks/data/bar-slo-sync.tsx", "BudgetBurn"],
  ["application/auth/auth-20", "src/blocks/application/auth-centered.tsx", "CenteredAuth"],
] as const;

for (const [route, filename, component] of cases) {
  test(`${route}: default source, clipboard and file download contain the full implementation`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/${route}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const source = dialog.locator(".source-code");
    const selector = dialog.getByRole("combobox", { name: "Source file" });
    // Wait for the lazily loaded source panel before asserting its selected implementation.
    await selector.waitFor({ state: "visible" });
    await expect(selector).toHaveText(filename);
    await expect(source).toContainText(`function ${component}`);
    const expected = await readFile(filename, "utf8");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const pendingDownload = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    const downloaded = await pendingDownload;
    expect(downloaded.suggestedFilename()).toBe(filename.split("/").at(-1));
    expect(await readFile((await downloaded.path())!, "utf8")).toBe(expected);
  });
}

test("complete implementation in the code drawer matches the runnable starter ZIP", async ({
  page,
}) => {
  await page.goto("./#/block/application/app-shell/app-shell-1");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const pendingDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const downloaded = await pendingDownload;
  const files = unzipSync(new Uint8Array(await readFile((await downloaded.path())!)));
  const filename = "src/blocks/application/shells/standard.tsx";
  expect(strFromU8(files[filename])).toBe(await readFile(filename, "utf8"));
  expect(strFromU8(files["src/Example.tsx"])).toContain("ApplicationBlock");
  expect(files["src/components/ui/button.tsx"]).toBeTruthy();
});

test("template source opens the actual implementation and copies it without truncation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/templates/echo");
  await page.getByRole("button", { name: "View template source" }).click();
  const dialog = page.getByRole("dialog");
  const filename = "src/templates/workflow/echo.tsx";
  await expect(dialog.getByRole("combobox", { name: "Template source file" })).toHaveText(filename);
  await expect(dialog.locator(".template-source-code")).toContainText("function Echo");
  await dialog.getByRole("button", { name: "Copy", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(await readFile(filename, "utf8"));
});
