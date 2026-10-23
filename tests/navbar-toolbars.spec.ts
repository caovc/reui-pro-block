import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

async function open(page: Page, id: number) {
  await page.goto(`./#/preview/application/navbar/navbar-${id}`);
  await expect(page.locator(`[data-navbar-entry="${id}"]`)).toBeVisible();
}
for (const width of [1440, 390]) {
  for (const id of [4, 5, 6]) {
    test(`toolbar ${id} renders inside ${width}px without script or image errors`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      await open(page, id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await expect
        .poll(() =>
          page
            .locator("img")
            .evaluateAll((images) =>
              images.every((image) => image.complete && image.naturalWidth > 0),
            ),
        )
        .toBe(true);
      expect(errors).toEqual([]);
    });
  }
}
test("admin CtrlK and MetaK use the real free searchable command and restore focus", async ({
  page,
}) => {
  await open(page, 4);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search workspace", exact: true })).toBeVisible();
  await page.getByPlaceholder("Search files by name...").fill("missing-file");
  await expect(page.getByText("No files found.", { exact: true })).toBeVisible();
  await page.getByPlaceholder("Search files by name...").fill("utils");
  await page.getByPlaceholder("Search files by name...").press("Enter");
  await expect(page.locator('[data-slot="alert"]')).toContainText("src/lib/utils.ts");
  await expect(page.getByRole("button", { name: "Search workspace", exact: true })).toBeFocused();
  await page.keyboard.press("Meta+k");
  await expect(page.getByRole("dialog", { name: "Search workspace", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Search workspace", exact: true })).toBeFocused();
});
test("phone admin rich19 notifications retain local invitation/read/progress/rating behavior", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 4);
  await page.getByRole("button", { name: "Notifications, 8 unread", exact: true }).click();
  const popup = page.locator('[data-slot="popover-content"]');
  await expect(page.getByRole("listitem")).toHaveCount(19);
  const box = await popup.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await expect(
    page.getByRole("progressbar", { name: "Release assets upload", exact: true }),
  ).toHaveAttribute("aria-valuenow", "65");
  await expect(page.getByLabel("Four out of five stars", { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(popup.getByRole("status")).toContainText("Accepted locally");
  await page.getByRole("button", { name: "Mark all as read", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mark all as read", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Unread", { exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Notifications, 0 unread", exact: true }),
  ).toBeFocused();
});
test("admin New validates a local draft and actual free theme tabs affect preview", async ({
  page,
}) => {
  await open(page, 4);
  await page.getByRole("button", { name: "New", exact: true }).click();
  await expect(page.getByRole("button", { name: "Create draft", exact: true })).toBeDisabled();
  await page.getByLabel("Item name", { exact: true }).fill("QA admin draft");
  await page.getByRole("button", { name: "Create draft", exact: true }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText("Created QA admin draft locally");
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("tab", { name: "Dark", exact: true }).click();
  await expect(page.locator('[data-navbar-entry="4"]')).toHaveClass(/dark/);
});
test("workflow switch, actual local run, history and JSON export share real state", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 5);
  await page.getByRole("switch", { name: "Workflow enabled", exact: true }).click();
  await expect(page.getByText("Inactive", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Test Run", exact: true }).click();
  await expect(page.getByRole("button", { name: "Running…", exact: true })).toBeDisabled();
  await page.clock.fastForward(1200);
  await expect(page.locator('[data-slot="alert"]')).toContainText("local simulator");
  await page.getByRole("button", { name: "Run history", exact: true }).click();
  await expect(page.getByRole("row", { name: /run-103 Succeeded/ })).toBeVisible();
  await page.getByRole("button", { name: "Close history", exact: true }).click();
  await page.getByRole("button", { name: "Workflow options", exact: true }).click();
  await page.getByRole("menuitem", { name: /^Duplicate/ }).click();
  await page.getByRole("button", { name: "Workflow options", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: /^Export JSON/ }).click();
  const draft = JSON.parse(await readFile((await (await pending).path())!, "utf8"));
  expect(draft.active).toBe(false);
  expect(draft.duplicates).toBe(1);
  expect(draft.runs).toHaveLength(4);
  expect(draft.demo).toBe(true);
});
test("workflow local deletion can cancel, confirm and restore without losing the bar", async ({
  page,
}) => {
  await open(page, 5);
  for (const confirm of [false, true]) {
    await page.getByRole("button", { name: "Workflow options", exact: true }).click();
    await page.getByRole("menuitem", { name: /^Delete workflow/ }).click();
    await page
      .getByRole("button", { name: confirm ? "Delete local workflow" : "Cancel", exact: true })
      .click();
  }
  await expect(page.getByRole("button", { name: "Test Run", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Restore local workflow", exact: true }).click();
  await expect(page.getByRole("button", { name: "Test Run", exact: true })).toBeEnabled();
  await expect(page.locator('[data-slot="alert"]')).toContainText("restored locally");
});
test("analytics single calendar, compare, manual and real interval refresh update local state", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 6);
  await page.getByRole("button", { name: "Dashboard date", exact: true }).click();
  await expect(page.getByRole("grid")).toHaveCount(1);
  await page
    .locator('[data-slot="popover-content"] button[data-day]')
    .filter({ hasText: /^22$/ })
    .click();
  await expect(page.locator('button[data-selected-single="true"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("output")).toContainText(/Date: \d{4}-\d{2}-22/);
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.locator("output")).toContainText("Comparison enabled");
  await page.getByRole("button", { name: "Refresh dashboard", exact: true }).click();
  await expect(page.getByRole("button", { name: "Refresh dashboard", exact: true })).toBeDisabled();
  await page.clock.fastForward(1200);
  await expect(page.locator("output")).toContainText("Local refresh count: 1");
  await page.getByRole("combobox", { name: "Auto refresh", exact: true }).click();
  await page.getByRole("option", { name: "10s", exact: true }).click();
  await page.clock.fastForward(10000);
  await expect(page.locator("output")).toContainText("Local refresh count: 2");
  await page.getByRole("combobox", { name: "Auto refresh", exact: true }).click();
  await page.getByRole("option", { name: "Off", exact: true }).click();
  await page.clock.fastForward(10000);
  await expect(page.locator("output")).toContainText("Local refresh count: 2");
});
test("analytics export CSV/PNG are real files and share/embed dialogs show current URL", async ({
  page,
}) => {
  await open(page, 6);
  for (const format of ["CSV", "PNG"]) {
    await page.getByRole("button", { name: "Dashboard options", exact: true }).click();
    const pending = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: `Export ${format}`, exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    if (format === "CSV") expect(bytes.toString()).toContain("date,metric,value,comparison");
    else expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  }
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByLabel("Preview link", { exact: true })).toHaveValue(page.url());
  await page.getByRole("button", { name: "Close share", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Embed", exact: true }).click();
  await expect(page.getByLabel("Embed code", { exact: true })).toContainText("iframe");
});
for (const [id, module] of [
  [4, "admin"],
  [5, "workflow"],
  [6, "analytics"],
] as const) {
  test(`navbar ${id} source, clipboard and single file preserve the actual leaf`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/application/navbar/navbar-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      `src/blocks/application/navbar-variants/toolbars/${module}.tsx`,
    );
    const filename = `src/blocks/application/navbar-variants/toolbars/${module}.tsx`;
    const expected = await readFile(filename, "utf8");
    const source = page.getByRole("dialog").locator(".source-code");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const pending = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    expect(await readFile((await (await pending).path())!, "utf8")).toBe(expected);
  });
}
test("actual analytics ZIP retains real free adapters, dependent sources and attribution", async ({
  page,
}) => {
  await page.goto("./#/block/application/navbar/navbar-6");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const files = unzipSync(new Uint8Array(await readFile((await (await pending).path())!)));
  for (const file of [
    "src/blocks/application/navbar-variants/toolbars/analytics.tsx",
    "src/blocks/application/navbar-variants/toolbars/free/single-date.tsx",
    "src/blocks/application/navbar-variants/toolbars/free/search.tsx",
    "src/blocks/application/navbar-variants/toolbars/free/refresh-select.tsx",
    "src/blocks/application/navbar-variants/toolbars/toolbar.css",
    "src/blocks/application/navbar-variants/first-run/free/trail.tsx",
    "src/components/reui/REUI-LICENSE.txt",
    "src/lib/demo-artwork.ts",
  ])
    expect(files[file], file).toBeDefined();
  const calendar = strFromU8(
    files["src/blocks/application/navbar-variants/toolbars/free/single-date.tsx"],
  );
  expect(calendar).toContain("c-calendar-24");
  expect(calendar).toContain('mode="single"');
  for (const module of ["admin", "workflow", "analytics"]) {
    const filename = `src/blocks/application/navbar-variants/toolbars/${module}.tsx`;
    expect(strFromU8(files[filename])).toBe(await readFile(filename, "utf8"));
  }
});
