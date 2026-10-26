import { test, expect } from "@playwright/test";

async function openPulse(page: import("@playwright/test").Page, view: string) {
  await page.goto("/#/template-preview/pulse");
  await page.getByRole("button", { name: view, exact: true }).click();
}

test("Pulse knowledge base has six categories and eighteen independent runbooks", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openPulse(page, "Knowledge Base");
  await expect(page.locator(".ct-kb-category")).toHaveCount(6);
  await expect(page.locator(".ct-kb-links button")).toHaveCount(18);
  await page.getByRole("button", { name: "How refunds are processed", exact: true }).click();
  const article = page.getByRole("dialog");
  await expect(article.getByRole("heading", { name: "How refunds are processed" })).toBeVisible();
  await expect(
    article.getByRole("heading", { name: "Refunds above your limit", exact: true }),
  ).toBeVisible();
  await article.getByRole("button", { name: "Copy link", exact: true }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("?article=kb-refund");
  await article.getByRole("button", { name: "Copy article text", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("original payment");
  const attachment = page.waitForEvent("download");
  await article.getByRole("button", { name: /Refund approval matrix/ }).click();
  expect((await attachment).suggestedFilename()).toBe("bricklane-refund-approval-matrix.csv");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Rotating an API key without downtime", exact: true })
    .click();
  await expect(
    article.getByRole("heading", { name: "Revoke the old key", exact: true }),
  ).toBeVisible();
  await expect(article).not.toContainText("Refunds above your limit");
  await page.goto(link);
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "How refunds are processed" }),
  ).toBeVisible();
});

test("Pulse reports paginate ten agents and preserve coaching and expansion across navigation", async ({
  page,
}) => {
  await openPulse(page, "Reports");
  await expect(page.locator(".ct-report-kpi")).toHaveCount(3);
  await expect(page.getByText("Best month since joining", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Collapse coaching note for Sarah Chen", exact: true })
    .click();
  await expect(page.getByText("Best month since joining", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(page.locator(".ct-report-grid")).toContainText("Nora Vale");
  await expect(page.locator(".ct-report-scorecard")).toContainText("6 - 10 of 10");
  await page.getByText("Needs coaching only", { exact: true }).click();
  await expect(page.locator(".ct-report-agent")).toHaveCount(3);
  await expect(page.locator(".ct-report-grid")).toContainText("Jamal Reid");
  await expect(page.locator(".ct-report-grid")).not.toContainText("David Kim");
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByRole("switch")).toBeChecked();
  await expect(page.locator(".ct-report-agent")).toHaveCount(3);
  await page.getByText("Needs coaching only", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Expand coaching note for Sarah Chen" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Download CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("bricklane-agent-scorecard.csv");
});

test("Pulse secondary pages fit a mobile viewport and keep the article controls usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/template-preview/pulse?article=kb-api-key-rotation");
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Rotating an API key without downtime" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".ct-kb-category")).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
