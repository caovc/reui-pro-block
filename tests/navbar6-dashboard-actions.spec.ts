import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

for (const width of [1440, 390]) {
  test(`whole official dashboard action group retains real refresh and bounded layout at ${width}px`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./#/preview/application/navbar/navbar-6");
    const group = page.getByRole("group", { name: "Dashboard actions", exact: true });
    await expect(group).toBeVisible();
    await expect(group.getByRole("button")).toHaveCount(3);
    await expect(group.locator('[data-slot="button-group-separator"]')).toHaveCount(1);
    const box = await group.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await group.getByRole("button", { name: "Refresh dashboard", exact: true }).click();
    await expect(
      group.getByRole("button", { name: "Refresh dashboard", exact: true }),
    ).toBeDisabled();
    await page.clock.fastForward(1200);
    await expect(page.locator("output")).toContainText("Local refresh count: 1");
    await expect(
      group.getByRole("button", { name: "Refresh dashboard", exact: true }),
    ).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}
test("native grouped keyboard actions retain date/compare state in actual CSV export", async ({
  page,
}) => {
  await page.goto("./#/preview/application/navbar/navbar-6");
  await page.getByRole("button", { name: "Dashboard date", exact: true }).click();
  await page
    .locator('[data-slot="popover-content"] button[data-day]')
    .filter({ hasText: /^22$/ })
    .click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Dashboard options", exact: true });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Edit dashboard", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Export CSV", exact: true })).toBeFocused();
  const pending = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  const csv = await readFile((await (await pending).path())!, "utf8");
  expect(csv).toMatch(/\d{4}-\d{2}-22,visitors,12480,true/);
  await expect(trigger).toBeFocused();
});
test("whole free strip keeps share, edit, PNG and retained Embed extension working", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/preview/application/navbar/navbar-6");
  const group = page.getByRole("group", { name: "Dashboard actions", exact: true });
  await group.getByRole("button", { name: "Share", exact: true }).click();
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  await page.getByRole("button", { name: "Close share", exact: true }).click();
  await group.getByRole("button", { name: "Dashboard options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit dashboard", exact: true }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    "Dashboard editing selected locally",
  );
  await group.getByRole("button", { name: "Dashboard options", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export PNG", exact: true }).click();
  expect([...(await readFile((await (await pending).path())!)).subarray(0, 8)]).toEqual([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  await group.getByRole("button", { name: "Dashboard options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Embed", exact: true }).click();
  await expect(page.getByLabel("Embed code", { exact: true })).toContainText(page.url());
});
test("actual source copy, single-file and ZIP resolve the complete official free52 consumer", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/block/application/navbar/navbar-6");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const filename = "src/blocks/application/navbar-variants/toolbars/analytics.tsx";
  await expect(page.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
    filename,
  );
  const raw = await readFile(filename, "utf8");
  const source = page.getByRole("dialog").locator(".source-code");
  await source.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(raw);
  const singlePending = page.waitForEvent("download");
  await source.getByRole("button", { name: "Download source file", exact: true }).click();
  expect(await readFile((await (await singlePending).path())!, "utf8")).toBe(raw);
  const zipPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const files = unzipSync(new Uint8Array(await readFile((await (await zipPending).path())!)));
  expect(strFromU8(files[filename])).toBe(raw);
  const adapter = "src/blocks/application/navbar-variants/toolbars/free/dashboard-actions.tsx";
  expect(strFromU8(files[adapter])).toBe(await readFile(adapter, "utf8"));
  expect(strFromU8(files[adapter])).toContain("c-button-group-52");
  expect(files["src/components/ui/button-group.tsx"]).toBeDefined();
});
