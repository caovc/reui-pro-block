import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function setView(page: Page, name: string) {
  await page.getByRole("button", { name: "Run options", exact: true }).click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
}

async function openFeed(page: Page) {
  await page.goto("./#/preview/ai-agents/agent-activity/agent-activity-2");
  await expect(page.locator('[data-agent-activity="live-feed"]')).toBeVisible();
}

test("feed pause freezes progress; stop preserves completed rows and downloads matching raw transcript", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openFeed(page);
  expect(
    await page
      .locator('[data-agent-activity="live-feed"] [data-slot="card"]')
      .evaluate((node) => node.getBoundingClientRect().width),
  ).toBe(576);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeVisible();
  await expect(page.locator("footer [role=status]")).toContainText("paused");
  await setView(page, "Detailed");
  const steps = page.locator('[aria-label="Run steps"] [data-slot="marker"]');
  await expect(steps).toHaveCount(3);
  await expect(steps.locator("[data-duration]")).toHaveCount(3);
  const pausedText = await steps.allTextContents();
  // Wait longer than the current 800ms step; pause must preserve the rows.
  await page.waitForTimeout(1000);
  expect(await steps.allTextContents()).toEqual(pausedText);
  await setView(page, "Summary");
  await expect(steps.locator("[data-duration]")).toHaveCount(0);
  await expect(steps).toHaveCount(3);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByRole("button", { name: "Rerun", exact: true })).toBeVisible();
  await expect(page.getByText("Update the settings label", { exact: true })).toBeVisible();
  await setView(page, "Raw");
  await expect(page.locator('[data-slot="code-block"]')).toContainText("[cancelled] edit_file");
  await page.getByRole("button", { name: "Run options", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download Log", exact: true }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe("run-log.txt");
  const transcript = await readFile((await file.path())!, "utf8");
  expect(transcript.match(/\[done\]/g)).toHaveLength(2);
  expect(transcript.match(/\[cancelled\]/g)).toHaveLength(6);
  await page.getByRole("button", { name: "Rerun", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="code-block"]')).toContainText("[running] search");
  expect(errors).toEqual([]);
});

test("feed streaming completes locally and narrow controls remain available without overflow", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 390, height: 844 });
  await openFeed(page);
  await expect(page.locator("footer [role=status]")).toHaveText("All steps completed", {
    timeout: 15000,
  });
  await expect(page.getByRole("button", { name: "Rerun", exact: true })).toBeVisible();
  await expect(page.getByText("Run complete", { exact: true })).toBeVisible();
  expect(await page.locator('[aria-label="Run steps"] [data-slot="marker"]').count()).toBe(8);
  const copies = page.getByRole("button", { name: /^Copy / }).filter({ visible: true });
  expect(await copies.count()).toBe(8);
  await page.evaluate(() => navigator.clipboard.writeText("Before read-file target Copy"));
  await page.getByRole("button", { name: "Copy Read the release checklist", exact: true }).hover();
  await page.getByRole("button", { name: "Copy Read the release checklist", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("docs/release.md");
  await page
    .getByRole("button", { name: "Open file: Read the release checklist", exact: true })
    .click();
  await expect(page.getByText("docs/release.md · local demo", { exact: true })).toBeVisible();
  await expect(page.locator("footer")).toContainText("2 files");
  await expect(page.locator("footer")).toContainText("4 tools");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole("button", { name: "Run options", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Copy Transcript", exact: true })).toBeVisible();
});

test("feed uses compact single-line reference rows at 393px", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await openFeed(page);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await setView(page, "Summary");
  const card = page.locator('[data-agent-activity="live-feed"] [data-slot="card"]');
  const box = await card.boundingBox();
  expect(box?.x).toBe(24);
  expect(box?.width).toBe(345);
  expect(
    await page
      .locator('[aria-label="Run steps"] [data-slot="marker"]')
      .first()
      .evaluate((node) => node.getBoundingClientRect().height),
  ).toBe(34);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
