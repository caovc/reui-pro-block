import { test, expect, type Page } from "@playwright/test";

async function openApproval(page: Page) {
  await page.goto("./#/preview/ai-agents/agent-activity/agent-activity-1");
  await expect(page.locator('[data-agent-activity="approval"]')).toBeVisible();
}

test("approval Revise requires a note and skips only its gated edit before an answer continues", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openApproval(page);
  await page.getByRole("button", { name: "Revise", exact: true }).click();
  const notes = page.getByRole("textbox", { name: "Revision notes", exact: true });
  await expect(notes).toBeFocused();
  const send = page.getByRole("button", { name: "Send revision", exact: true });
  await expect(send).toBeDisabled();
  await notes.fill("Keep the existing label; clarify the helper text instead.");
  await send.click();
  await expect(page.locator("footer [role=status]")).toBeFocused();
  await expect(page.locator("footer [role=status]")).toContainText("returned for revision");
  const answer = page.getByRole("textbox", { name: "Workspace slug", exact: true });
  await expect(answer).toBeVisible();
  await page.getByRole("button", { name: /4 finished steps/ }).click();
  await expect(page.getByText("Skipped: Update the limit label", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit answer", exact: true })).toBeDisabled();
  await answer.fill("bricklane-labs");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(
    page.getByText("Publish the billing preview?", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Deny", exact: true }).click();
  await expect(page.getByText("Run complete", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Skipped: Create the preview deployment", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Run progress", exact: true }),
  ).toHaveAttribute("aria-valuenow", "100");
  expect(errors).toEqual([]);
});

test("narrow approval executes approved edit, preserves recorded answer in summary and restarts", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 390, height: 844 });
  await openApproval(page);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("Update the limit label", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Workspace slug", exact: true })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Workspace slug", exact: true })
    .fill("bricklane-preview");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("Run complete", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Approval run actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Copy Summary", exact: true }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("answer: bricklane-preview");
  expect(copied).toContain("done: Create the preview deployment");
  expect(copied).not.toContain("skipped:");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole("button", { name: "Run again", exact: true }).click();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Run progress", exact: true }),
  ).toHaveAttribute("aria-valuenow", "25");
});
