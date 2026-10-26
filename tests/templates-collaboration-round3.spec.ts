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

test("Roster approvals retain twenty requests and distinguish repeated offer titles", async ({
  page,
}) => {
  await page.goto("/#/template-preview/roster");
  await page.getByRole("button", { name: "Approvals", exact: true }).click();
  const approvals = page.locator(".ct-approvals");
  await expect(approvals).toContainText("1 - 10 of 20");
  const first = approvals.getByRole("row").filter({ hasText: "Campaign shoot: £4,200" });
  await first.getByRole("button", { name: "Approve: Campaign shoot: £4,200", exact: true }).click();
  await expect(first.getByText("Approved", { exact: true })).toBeVisible();
  await expect(approvals).toContainText("1 - 10 of 20");
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  const secondOffer = approvals
    .getByRole("row")
    .filter({ hasText: "Second offer on this opening" });
  const relocatingOffer = approvals
    .getByRole("row")
    .filter({ hasText: "relocating from Rotterdam" });
  await secondOffer
    .getByRole("button", { name: "Reject: Offer sign-off: Senior Engineer", exact: true })
    .click();
  await expect(secondOffer.getByText("Rejected", { exact: true })).toBeVisible();
  await expect(relocatingOffer.getByText("Pending", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.getByText("18 waiting, oldest 13d", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Approvals", exact: true }).click();
  await expect(secondOffer.getByText("Rejected", { exact: true })).toBeVisible();
  await secondOffer.getByRole("button", { name: /Change decision/ }).click();
  await page.getByRole("menuitem", { name: "Pending", exact: true }).click();
  await expect(secondOffer.getByText("Pending", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Filter request status", exact: true }).click();
  await page.getByRole("option", { name: "Approved", exact: true }).click();
  await expect(approvals.getByRole("row").filter({ hasText: "Campaign shoot" })).toHaveCount(1);
  await expect(approvals).toContainText("1 - 1 of 1");
});

async function openRosterImport(page: import("@playwright/test").Page) {
  await page.goto("/#/template-preview/roster");
  await page.getByRole("button", { name: "People", exact: true }).first().click();
  await page.getByRole("button", { name: "Import", exact: true }).click();
}

async function nextImport(page: import("@playwright/test").Page, count: number) {
  for (let index = 0; index < count; index++) {
    await page.getByRole("button", { name: "Next Step", exact: true }).click();
  }
}

test("Roster CSV import validates the five steps and saves new people across navigation", async ({
  page,
}) => {
  await openRosterImport(page);
  await page.getByRole("button", { name: /roster-people-sample.csv/ }).click();
  await nextImport(page, 1);
  await expect(
    page.getByRole("combobox", { name: "Map Date of birth", exact: true }),
  ).toBeVisible();
  await nextImport(page, 1);
  await expect(page.getByText("3 valid", { exact: true })).toBeVisible();
  await nextImport(page, 1);
  await expect(
    page.getByText("1 row matches someone already on the roster by full name.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByText("Duplicate handling", { exact: true })).toBeVisible();
  await nextImport(page, 1);
  await page
    .locator(".ct-import-footer")
    .getByRole("button", { name: "Import", exact: true })
    .click();
  await expect(
    page.getByText("2 people added, 0 updated, 1 skipped.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View people", exact: true }).click();
  await page.getByPlaceholder("Search people…", { exact: true }).fill("Noor Haddad");
  await expect(page.locator(".ct-reporting-lines")).toContainText("VP Engineering");
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Directory", exact: true }).click();
  await page.getByPlaceholder("Search people…", { exact: true }).fill("Tomas Beaulieu");
  await expect(page.locator(".ct-reporting-lines")).toContainText("Tomas Beaulieu");
});

test("Roster CSV import parses quoted fields and updates only the matched person", async ({
  page,
}) => {
  await openRosterImport(page);
  const csv = [
    "Employee ID,Full name,Job title,Department,Location,Employment type,Start date,Manager,Date of birth",
    'p-003,Amara Okafor,"Chief, Platform",Engineering,Berlin,Full-time,2026-10-01,Isabel Ferreira,1990-06-12',
    "p-999,Invalid Date,Engineer,Engineering,London,Full-time,not-a-date,,",
  ].join("\r\n");
  await page.getByLabel("Upload people CSV", { exact: true }).setInputFiles({
    name: "team-update.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(
    page.getByText("team-update.csv is ready. 2 rows detected.", { exact: true }),
  ).toBeVisible();
  await nextImport(page, 2);
  await expect(page.getByText("1 valid", { exact: true })).toBeVisible();
  await expect(page.getByText("1 errors", { exact: true })).toBeVisible();
  await nextImport(page, 1);
  await page.getByRole("radio").nth(1).check();
  await nextImport(page, 1);
  await page
    .locator(".ct-import-footer")
    .getByRole("button", { name: "Import", exact: true })
    .click();
  await expect(
    page.getByText("0 people added, 1 updated, 0 skipped.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View people", exact: true }).click();
  await page.getByPlaceholder("Search people…", { exact: true }).fill("Amara Okafor");
  await expect(page.locator(".ct-reporting-lines")).toContainText("Chief, Platform");
  await expect(page.locator(".ct-reporting-lines")).toContainText("Berlin");
  await expect(page.locator(".ct-reporting-lines")).not.toContainText("Invalid Date");
});
