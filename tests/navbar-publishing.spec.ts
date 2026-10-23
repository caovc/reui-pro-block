import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

async function open(page: Page, id: number) {
  await page.goto(`./#/preview/application/navbar/navbar-${id}`);
  await expect(page.locator(`[data-navbar-entry="${id}"]`)).toBeVisible();
}
for (const width of [1440, 390]) {
  for (const id of [7, 8, 9]) {
    test(`publishing navbar ${id} renders within ${width}px with original portraits`, async ({
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
test("actual free publish split supports preview, publish, draft and recorded history", async ({
  page,
}) => {
  await open(page, 7);
  await expect(
    page.getByLabel("Three sample viewers", { exact: true }).locator('[data-slot="avatar"]'),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Preview post", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A quieter way to launch", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close preview", exact: true }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.locator("output")).toContainText("Post status: Published");
  await page.getByRole("button", { name: "More publish options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Save as draft", exact: true }).click();
  await expect(page.locator("output")).toContainText("Post status: Draft");
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "View history", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Post history", exact: true });
  await expect(dialog.getByRole("listitem")).toHaveCount(3);
  await expect(dialog).toContainText("Published the local post");
});
test("phone scheduler uses actual free single Calendar and inline TimePicker with clear gating", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 7);
  await page.getByRole("button", { name: "More publish options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Schedule for later", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Schedule post", exact: true });
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await expect(dialog.getByRole("grid")).toHaveCount(1);
  await dialog.getByRole("button", { name: /next month/i }).click();
  await dialog.locator("button[data-day]").filter({ hasText: /^22$/ }).click();
  await dialog.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Schedule local post", exact: true }),
  ).toBeDisabled();
  await dialog
    .getByRole("listbox", { name: "Hour", exact: true })
    .getByRole("option", { name: "09", exact: true })
    .click();
  await dialog
    .getByRole("listbox", { name: "Minute", exact: true })
    .getByRole("option", { name: "30", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Schedule local post", exact: true }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    /Scheduled for \d{4}-\d{2}-22 09:30/,
  );
  await expect(page.locator("output")).toContainText("Post status: Scheduled");
});
test("CMS archive and confirmed delete are reversible local states", async ({ page }) => {
  await open(page, 7);
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Archive", exact: true }).click();
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Restore local post", exact: true }).click();
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete local post", exact: true }).click();
  await expect(page.locator("output")).toContainText("Post status: Deleted");
  await page.getByRole("button", { name: "Restore local post", exact: true }).click();
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeEnabled();
});
test("phone marketplace filters deployment options and real local deployment updates account data", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 8);
  await page.getByRole("radio", { name: "Research", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Research", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Deploy", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Agent to deploy", exact: true })).toHaveText(
    "Research Brief",
  );
  await page.getByRole("combobox", { name: "Agent to deploy", exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.getByRole("option", { name: "Research Brief", exact: true }).click();
  await page.getByRole("button", { name: "Deploy demo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Deploying…", exact: true })).toBeDisabled();
  await page.clock.fastForward(1200);
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    "Research Brief deployed in the local simulator",
  );
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("tab", { name: "Dark", exact: true }).click();
  await expect(page.locator('[data-navbar-entry="8"]')).toHaveClass(/dark/);
  await page.getByRole("menuitem", { name: /^My Agents/ }).click();
  await expect(page.getByRole("dialog", { name: "My Agents", exact: true })).toContainText(
    "Research Brief",
  );
  await page.getByRole("button", { name: "Close account details", exact: true }).click();
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("menuitem", { name: /^Usage/ }).click();
  await expect(page.getByRole("dialog", { name: "Usage", exact: true })).toContainText(
    "125 sample credits",
  );
  await page.getByRole("button", { name: "Close account details", exact: true }).click();
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "API Keys", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "API Keys", exact: true })).toContainText(
    "No API keys are stored or issued",
  );
});
test("marketplace rich notifications compose avatar groups, actual rating/progress and read/review state", async ({
  page,
}) => {
  await open(page, 8);
  await page.getByRole("button", { name: "Agent notifications, 4 unread", exact: true }).click();
  const popup = page.locator('[data-slot="popover-content"]');
  await expect(popup.getByRole("listitem")).toHaveCount(4);
  await expect(
    popup.getByLabel("Three agent collaborators", { exact: true }).locator('[data-slot="avatar"]'),
  ).toHaveCount(3);
  await expect(
    page.getByRole("progressbar", { name: "Agent indexing progress", exact: true }),
  ).toHaveAttribute("aria-valuenow", "72");
  await expect(page.getByLabel("Four and a half out of five stars", { exact: true })).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await expect(popup.getByRole("status")).toContainText("Dismissed locally");
  await page.getByRole("button", { name: "Mark all as read", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Agent notifications, 0 unread", exact: true }),
  ).toBeFocused();
});
test("repo branch selection, default marker, targets and local run use actual selected values", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 9);
  await page.getByRole("button", { name: "Repository branch", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(6);
  await expect(page.getByRole("menuitem", { name: /^main Default/ })).toBeVisible();
  await page.getByRole("menuitem", { name: "feature/navigation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Repository branch", exact: true })).toContainText(
    "feature/navigation",
  );
  await page.getByRole("button", { name: "Repository branch", exact: true }).click();
  await page.getByRole("menuitem", { name: "Deploy with Remix", exact: true }).click();
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await page.clock.fastForward(1200);
  await expect(page.locator('[data-slot="alert"]')).toContainText("feature/navigation via Remix");
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    "No repository code was executed",
  );
});
test("repo branch menu supports keyboard selection and share copies current preview URL", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, 9);
  await page.getByRole("button", { name: "Repository branch", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: /^main Default/ })).toBeFocused();
  await page.keyboard.press("d");
  await expect(page.getByRole("menuitem", { name: "develop", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Repository branch", exact: true })).toContainText(
    "develop",
  );
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByLabel("Preview link", { exact: true })).toHaveValue(page.url());
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
});
for (const [id, module] of [
  [7, "cms"],
  [8, "marketplace"],
  [9, "repo"],
] as const) {
  test(`navbar ${id} source, copy and single-file bytes match actual ${module} leaf`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/application/navbar/navbar-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const filename = `src/blocks/application/navbar-variants/publishing/${module}.tsx`;
    await expect(page.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      filename,
    );
    const expected = await readFile(filename, "utf8");
    const source = page.getByRole("dialog").locator(".source-code");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    const pending = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    expect(await readFile((await (await pending).path())!, "utf8")).toBe(expected);
  });
}
test("actual publishing ZIP includes real free publish/branch/time-picker source and exact leaves", async ({
  page,
}) => {
  await page.goto("./#/block/application/navbar/navbar-7");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const files = unzipSync(new Uint8Array(await readFile((await (await pending).path())!)));
  for (const filename of [
    "src/blocks/application/navbar-variants/publishing/free/publish-controls.tsx",
    "src/blocks/application/navbar-variants/publishing/free/branch-picker.tsx",
    "src/blocks/application/navbar-variants/publishing/schedule.tsx",
    "src/blocks/application/navbar-variants/publishing/publishing.css",
    "src/components/reui/time-picker.tsx",
    "src/components/reui/REUI-LICENSE.txt",
    "src/components/brand-mark.tsx",
    "src/lib/demo-artwork.ts",
  ])
    expect(files[filename], filename).toBeDefined();
  expect(
    strFromU8(files["src/blocks/application/navbar-variants/publishing/free/publish-controls.tsx"]),
  ).toContain("c-button-group-53");
  for (const module of ["cms", "marketplace", "repo"]) {
    const filename = `src/blocks/application/navbar-variants/publishing/${module}.tsx`;
    expect(strFromU8(files[filename])).toBe(await readFile(filename, "utf8"));
  }
});
