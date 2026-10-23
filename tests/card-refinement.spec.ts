import { test, expect } from "@playwright/test";
const route = (id: number) => `./#/preview/application/card/card-${id}`;
for (const width of [1440, 390])
  test(`first 15 card variants render without browser errors or overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (let id = 1; id <= 15; id++) {
      await page.goto(route(id));
      await expect(page.locator(`[data-card-variant="${id}"]`)).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `card-${id} horizontal document overflow`,
      ).toBeLessThanOrEqual(width);
      await expect(page.locator('[data-slot="frame"]')).not.toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
test("investor proposal saves a local draft and can be reopened", async ({ page }) => {
  await page.goto(route(3));
  await page.getByRole("button", { name: "Send Funding Proposal", exact: true }).click();
  await page.getByLabel("Company name", { exact: true }).fill("Example Studio");
  await page.getByLabel("Funding requested", { exact: true }).fill("$250,000");
  await page
    .getByLabel("Proposal summary", { exact: true })
    .fill("Build accessible tools for small teams.");
  await page.getByRole("button", { name: "Save proposal locally", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Review Funding Proposal", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review Funding Proposal", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("does not send email");
  await expect(page.getByLabel("Company name", { exact: true })).toHaveValue("Example Studio");
  await expect(page.getByLabel("Proposal summary", { exact: true })).toHaveValue(
    "Build accessible tools for small teams.",
  );
});
test("KPI reports open their own figures and export a CSV", async ({ page }) => {
  await page.goto(route(4));
  await page.getByRole("button", { name: "Full Customer Report", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("2.3k");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export sample CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("sample-report.csv");
});
test("applicant contact copy writes the correct value", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(route(9));
  await page.getByRole("button", { name: "Copy email", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("jeroen.doe@reui.io");
  await page.getByRole("button", { name: "Copy mobile", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("+31 6 9876 54 32");
});
test("reports support independent editing and duplication", async ({ page }) => {
  await page.goto(route(10));
  const actions = page.getByRole("button", {
    name: "Monthly Revenue Insights and Market Performance actions",
    exact: true,
  });
  await actions.click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await page.getByLabel("Report title", { exact: true }).fill("Quarterly revenue review");
  await page.getByRole("button", { name: "Save report", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Quarterly revenue review", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Quarterly revenue review actions",
      exact: true,
    })
    .click();
  await page.getByRole("menuitem", { name: "Duplicate", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Quarterly revenue review (copy)",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "User Engagement and Retention Analysis Report",
      exact: true,
    }),
  ).toBeVisible();
});
test("delivery edit updates address and notes without changing identifier", async ({ page }) => {
  await page.goto(route(14));
  await page.getByRole("button", { name: "Delivery actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await page.getByLabel("Address", { exact: true }).fill("Keizersgracht 10, Amsterdam");
  await page.getByLabel("Delivery notes", { exact: true }).fill("Leave with the front desk.");
  await page.getByRole("button", { name: "Save delivery", exact: true }).click();
  await expect(page.getByText("Keizersgracht 10, Amsterdam", { exact: true })).toBeVisible();
  await expect(
    page.locator("[data-card-variant]").getByText("Leave with the front desk.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("#NL-54321-AMST", { exact: true })).toBeVisible();
});
test("meeting edit preserves the second meeting and opens a local joining preview", async ({
  page,
}) => {
  await page.goto(route(15));
  await page
    .getByRole("button", {
      name: "Apollo CRM - Sprint Planning actions",
      exact: true,
    })
    .click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await page.getByLabel("Meeting title", { exact: true }).fill("Sprint review");
  await page.getByLabel("Start time", { exact: true }).fill("10:00 AM CET");
  await page.getByRole("button", { name: "Save meeting", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: "Sprint review", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Delta Finance - Budget Alignment",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .locator('[data-slot="frame"]')
    .filter({
      has: page.getByRole("button", { name: "Sprint review", exact: true }),
    })
    .getByRole("button", { name: "Join Meeting", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Sprint review");
  await expect(page.getByRole("dialog")).toContainText("No camera, microphone");
  await page.getByRole("button", { name: "Leave preview", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("official REUI stacked Frame joins adjacent meeting panels", async ({ page }) => {
  await page.goto(route(15));
  const frame = page.locator('[data-slot="frame"]').first();
  const panels = frame.locator(':scope > [data-slot="frame-panel"]');
  await expect(panels).toHaveCount(2);
  await expect
    .poll(() => panels.nth(0).evaluate((el) => getComputedStyle(el).borderBottomLeftRadius))
    .toBe("0px");
  await expect
    .poll(() => panels.nth(1).evaluate((el) => getComputedStyle(el).borderTopLeftRadius))
    .toBe("0px");
  await expect
    .poll(() => panels.nth(1).evaluate((el) => getComputedStyle(el).borderTopWidth))
    .toBe("0px");
});
