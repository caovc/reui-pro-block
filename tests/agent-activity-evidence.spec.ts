import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, id: number) {
  await page.goto(`./#/preview/ai-agents/agent-activity/agent-activity-${id}`);
  await expect(page.locator("[data-agent-activity]")).toBeVisible();
}

test("research reveals actual Timeline stages and copies the selected citation URL", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, 3);
  await expect(page.locator('[data-slot="timeline"]')).toBeVisible();
  await expect(page.getByText("Answer ready", { exact: true })).toBeVisible();
  await expect(page.getByText("High confidence", { exact: true })).toBeVisible();
  expect(await page.locator('[data-slot="timeline-item"][data-completed]').count()).toBe(4);
  await page.getByRole("button", { name: "Copy W3C WAI source URL", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "https://www.w3.org/WAI/tutorials/forms/labels/",
  );
  await page.getByRole("button", { name: "Open W3C WAI source", exact: true }).click();
  await expect(page.getByText("Labeling controls · W3C WAI", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open file", exact: true }).first().click();
  await expect(
    page.getByText("src/workspace/settings.tsx · local file preview", { exact: true }),
  ).toBeVisible();
});

test("audit streams calls, filters denied, grants only local requeue and preserves in-flight call", async ({
  page,
}) => {
  await open(page, 4);
  const grant = page.getByRole("button", { name: "Grant issues:create", exact: true });
  await expect(grant).toBeVisible();
  await page.getByRole("radio", { name: /Denied only/ }).click();
  await expect(page.getByText("create_issue", { exact: true })).toBeVisible();
  await expect(page.getByText("read_file", { exact: true })).not.toBeVisible();
  await grant.click();
  await expect(
    page.getByText("No denied calls remain in this local run.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "All calls", exact: true }).click();
  await expect(page.getByText("Re-queued", { exact: true })).toBeVisible();
  await expect(page.getByText("run_checks", { exact: true })).toBeVisible();
  await expect(page.getByText("In flight", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Documentation · Dropped", { exact: true })).toBeVisible();
  await expect(grant).not.toBeVisible();
});

test("outcome retry recovers one scoped item before enabling its dependent item", async ({
  page,
}) => {
  await open(page, 5);
  const issue = page.locator('[data-outcome-item="issue"]');
  const link = page.locator('[data-outcome-item="link"]');
  const linkRetry = link.getByRole("button", {
    name: "Retry Link the follow-up in the release note",
    exact: true,
  });
  await expect(linkRetry).toBeDisabled();
  await expect(page.getByRole("button", { name: "Retry remaining", exact: true })).toBeDisabled();
  await issue.getByRole("button", { name: "Grant issues:create", exact: true }).click();
  await expect(issue.getByText("Failed", { exact: true })).toBeVisible();
  await expect(linkRetry).toBeDisabled();
  await issue
    .getByRole("button", { name: "Retry Create the follow-up issue", exact: true })
    .click();
  await expect(issue.getByText("Retrying", { exact: true }).first()).toBeVisible();
  await expect(issue.getByText("Done", { exact: true })).toBeVisible();
  await expect(link.getByText("Skipped", { exact: true })).toBeVisible();
  await expect(linkRetry).toBeEnabled();
  await linkRetry.click();
  await expect(link.getByText("Done", { exact: true })).toBeVisible();
  await expect(page.getByText("All retryable items recovered", { exact: true })).toBeVisible();
  await expect(
    page.locator('[data-outcome-item="note"]').getByText("Unsupported", { exact: true }),
  ).toBeVisible();
});

test("outcome keep/undo and discard/restore preserve the local ledger on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 5);
  await page.getByRole("button", { name: "Keep what succeeded", exact: true }).click();
  await expect(page.getByRole("button", { name: "Successes kept", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Undo keep", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Keep what succeeded", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.getByText("Run discarded", { exact: true })).toBeVisible();
  await expect(page.locator('[data-outcome-item="label"]')).not.toBeVisible();
  await page.getByRole("button", { name: "Restore run", exact: true }).click();
  await expect(
    page.locator('[data-outcome-item="label"]').getByText("Done", { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("research and audit fit a narrow viewport with their actual controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of [3, 4]) {
    await open(page, id);
    if (id === 3) await expect(page.getByText("Answer ready", { exact: true })).toBeVisible();
    else await expect(page.getByText("run_checks", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
  }
});
