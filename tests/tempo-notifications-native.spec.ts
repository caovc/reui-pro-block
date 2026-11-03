import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });

async function stable(root: Locator) {
  await expect
    .poll(() =>
      root.evaluate((element) => ({
        opacity: getComputedStyle(element).opacity,
        running: element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === "running" || animation.pending).length,
      })),
    )
    .toEqual({ opacity: "1", running: 0 });
}

async function openSidebar(page: Page, mobile: boolean) {
  if (!mobile) return;
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await stable(page.locator('[data-slot="sidebar"][data-mobile="true"]'));
}

async function openNotifications(page: Page, unread: number) {
  const trigger = page.getByRole("button", {
    name: `Notifications, ${unread} unread`,
    exact: true,
  });
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "Notifications", exact: true });
  await expect(panel).toBeVisible();
  await stable(panel);
  return { trigger, panel };
}

async function closeNotifications(page: Page, trigger: Locator, mobile: boolean) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Notifications", exact: true })).toHaveCount(0);
  await expect(trigger).toBeFocused();
  if (mobile) {
    await expect(page.locator('[data-slot="sidebar"][data-mobile="true"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
  }
}

for (const width of [1440, 390]) {
  test(`Tempo notifications ${width}: original Popover geometry, All/Unread and native layered Escape`, async ({
    page,
  }, info) => {
    const mobile = width === 390;
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await page.setViewportSize({ width, height: mobile ? 844 : 1000 });
    await page.goto("/#/template-preview/tempo");
    await page.evaluate(() => document.fonts.ready);
    await openSidebar(page, mobile);
    const { trigger, panel } = await openNotifications(page, 5);
    const geometry = await panel.boundingBox();
    await page.screenshot({ path: info.outputPath("notifications-initial.png") });
    await writeFile(
      info.outputPath("notifications-initial-geometry.json"),
      JSON.stringify(
        {
          geometry,
          viewport: width,
          clientWidth: await page.evaluate(() => document.documentElement.clientWidth),
        },
        null,
        2,
      ),
    );
    expect(geometry?.width).toBe(320);
    expect(geometry?.height).toBe(401);
    expect(geometry?.y).toBe(50);
    expect(geometry?.x).toBe(mobile ? 5 : 213);
    await expect(panel).toHaveCSS("font-size", "14px");
    await expect(panel).toHaveCSS("font-family", /^Inter,/);
    await expect(panel.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
    await expect(panel.getByRole("tab", { name: "All 19", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(panel.getByRole("listitem")).toHaveCount(19);
    await panel.getByRole("tab", { name: "Unread 5", exact: true }).click();
    await expect(panel.getByRole("listitem")).toHaveCount(5);
    for (const title of [
      "Pending approval",
      "Project Timeline",
      "Task assigned to you",
      "4 people joined your workspace",
      "Upcoming event reminder",
    ]) {
      await expect(panel.getByRole("listitem").filter({ hasText: title })).toHaveCount(1);
    }
    await panel.getByRole("tab", { name: "All 19", exact: true }).click();
    await expect(panel.getByRole("listitem")).toHaveCount(19);
    await closeNotifications(page, trigger, mobile);
    expect(faults).toEqual([]);
  });

  // These are explicit local demo contracts. Reference read/dismiss mutations
  // were not executed, and no remote notification or permission is changed.
  test(`Tempo notification state ${width}: local read/dismiss survives Popover, Sheet and breakpoint remounts`, async ({
    page,
  }) => {
    const mobile = width === 390;
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await page.setViewportSize({ width, height: mobile ? 844 : 1000 });
    await page.goto("/#/template-preview/tempo");
    await openSidebar(page, mobile);
    let { trigger, panel } = await openNotifications(page, 5);
    await panel.getByRole("tab", { name: "Unread 5", exact: true }).click();
    await panel
      .getByRole("button", { name: 'Mark "Pending approval" as read', exact: true })
      .click();
    await expect(panel.getByRole("tab", { name: "Unread 4", exact: true })).toBeVisible();
    await expect(panel.getByRole("listitem")).toHaveCount(4);
    await panel
      .getByRole("button", { name: 'Dismiss "Task assigned to you"', exact: true })
      .click();
    await expect(panel.getByRole("tab", { name: "Unread 3", exact: true })).toBeVisible();
    await expect(panel.getByRole("listitem")).toHaveCount(3);
    await panel.getByRole("tab", { name: "All 18", exact: true }).click();
    await expect(panel.getByRole("listitem")).toHaveCount(18);
    trigger = page.getByRole("button", { name: "Notifications, 3 unread", exact: true });
    await closeNotifications(page, trigger, mobile);
    await page.setViewportSize({ width: mobile ? 1440 : 390, height: mobile ? 1000 : 844 });
    await openSidebar(page, !mobile);
    ({ trigger, panel } = await openNotifications(page, 3));
    await expect(panel.getByRole("tab", { name: "All 18", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(panel.getByRole("listitem")).toHaveCount(18);
    await panel.getByRole("button", { name: "Mark all as read", exact: true }).click();
    await expect(
      panel.getByRole("button", { name: "Mark all as read", exact: true }),
    ).toBeDisabled();
    await panel.getByRole("tab", { name: "Unread 0", exact: true }).click();
    await expect(panel.getByRole("status")).toHaveText("No unread notifications.");
    await expect(panel.getByRole("listitem")).toHaveCount(0);
    trigger = page.getByRole("button", { name: "Notifications, 0 unread", exact: true });
    await closeNotifications(page, trigger, !mobile);
    expect(faults).toEqual([]);
  });
}

test("Tempo actual Dark surfaces and More Copy/Share/Export keep the local workspace", async ({
  page,
  context,
}, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/tempo?qa=chrome&raw=a%2Bb");
  await page.getByRole("button", { name: "Open workspace menu", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Dark theme", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  const cardBackground = await page
    .locator(".wf-panel")
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  for (const selector of [
    ".wf-summary",
    '.wf-wide > .wf-panel > [data-slot="card-header"]',
    '.wf-tempo-queue > [data-slot="card-header"]',
  ]) {
    for (const surface of await page.locator(selector).all())
      await expect(surface).toHaveCSS("background-color", cardBackground);
  }
  const foreground = await page
    .locator(".wf-root.wf-reui")
    .evaluate((element) => getComputedStyle(element).color);
  const columnHeaders = page.locator(".wf-tempo-queue .wf-official-grid th");
  await expect(columnHeaders).toHaveCount(7);
  for (const header of await columnHeaders.all()) {
    await expect(header).toHaveCSS("background-color", cardBackground);
    await expect(header).toHaveCSS("color", foreground);
  }
  await writeFile(
    info.outputPath("tempo-dark-table-header-colors.json"),
    JSON.stringify(
      await columnHeaders.evaluateAll((headers) =>
        headers.map((header) => ({
          text: header.textContent,
          background: getComputedStyle(header).backgroundColor,
          foreground: getComputedStyle(header).color,
          buttons: [...header.querySelectorAll("button")].map((button) => ({
            text: button.textContent,
            foreground: getComputedStyle(button).color,
          })),
        })),
      ),
      null,
      2,
    ),
  );
  await page.screenshot({ path: info.outputPath("tempo-dark-readable-surfaces.png") });
  const search = page.getByRole("textbox", { name: "Search tasks", exact: true });
  await search.fill("Audit");
  await expect(
    page.getByRole("button", { name: "Audit permission checks", exact: true }),
  ).toBeVisible();
  const more = page.getByRole("button", { name: "More options", exact: true });
  await more.click();
  await page.getByRole("menuitem", { name: "Copy link", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  await more.click();
  await page.getByRole("menuitem", { name: "Share schedule", exact: true }).click();
  await expect(page.getByText("Schedule shared", { exact: true })).toBeVisible();
  await expect(
    page.getByText("A view-only schedule link is ready to share.", { exact: true }),
  ).toBeVisible();
  await more.click();
  const pending = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("tempo-workspace-summary.csv");
  const artifact = info.outputPath("tempo-original-local-export.csv");
  await download.saveAs(artifact);
  expect(await download.failure()).toBeNull();
  const csv = await readFile(artifact, "utf8");
  expect(csv).toContain("Audit permission checks");
  expect(csv).not.toContain("Add usage analytics events");
  await expect(page.getByText("Export ready", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Your workspace summary is downloading.", { exact: true }),
  ).toBeVisible();
  await expect(search).toHaveValue("Audit");
});
