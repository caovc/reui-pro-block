import { expect, test } from "@playwright/test";

const route = "#/preview/data-grid/advanced/data-grid-advanced-17";

test.use({ actionTimeout: 5000 });

for (const primitive of ["radix", "base"] as const) {
  test.describe(primitive, () => {
    const entry = primitive === "base" ? "./base/" : "./";

    test("Support Scorecard expands QA, filters agents and records coaching in the sheet", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(entry + route);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      const grid = page.getByRole("region", { name: "Support scorecard" });
      const firstAgent = grid.getByRole("row").filter({ hasText: "Adrian Serrano" });
      await expect(firstAgent.getByRole("img", { name: /QA .* Exceeds/ })).toBeVisible();
      await firstAgent.locator('[data-slot="data-grid-table-row-expand"] button').click();
      await expect(
        grid
          .getByRole("row")
          .filter({ hasText: "Critical fails" })
          .getByText("Rubric", { exact: true }),
      ).toBeVisible();
      await grid.getByRole("button", { name: "Columns", exact: true }).click();
      await page.getByRole("menuitemcheckbox", { name: "CSAT", exact: true }).click();
      await expect(grid.getByRole("columnheader", { name: "CSAT", exact: true })).toHaveCount(0);
      await page.keyboard.press("Escape");

      await grid.getByRole("button", { name: "Filter", exact: true }).click();
      const filters = page.getByRole("dialog", { name: "Advanced filter", exact: true });
      await filters.getByRole("button", { name: "Add filter", exact: true }).click();
      await page.getByRole("option", { name: "Queue", exact: true }).click();
      await page.getByRole("option", { name: "is", exact: true }).click();
      await page.getByRole("option", { name: "Billing", exact: true }).click();
      await expect(grid.getByText("1 - 5 of 5 agents")).toBeVisible();
      await expect(grid.getByRole("button", { name: "Open Caleb Mensah" })).toBeVisible();
      await expect(firstAgent).toHaveCount(0);
      await filters.getByRole("button", { name: "Clear all", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(filters).toHaveCount(0);

      await grid.getByRole("textbox", { name: "Search agents" }).fill("Adrian");
      await expect(grid.getByText("1 - 1 of 1 agents")).toBeVisible();
      const agent = grid.getByRole("button", { name: "Open Adrian Serrano" });
      await agent.press("Enter");
      const sheet = page.getByRole("dialog", { name: "Adrian Serrano" });
      await expect(sheet.getByText("QA by Channel", { exact: true })).toBeVisible();
      await sheet.getByRole("tab", { name: /Reviews/ }).click();
      await expect(
        sheet
          .getByRole("tabpanel", { name: /Reviews/ })
          .getByRole("listitem")
          .first(),
      ).toBeVisible();
      await sheet.getByRole("tab", { name: /Coaching/ }).click();
      await sheet.getByRole("button", { name: "Start Coaching", exact: true }).click();
      await expect(sheet.getByText("Coaching Plan", { exact: true })).toBeVisible();
      await sheet
        .getByRole("textbox", { name: "Session Note" })
        .fill("Review the escalation checklist together.");
      await sheet.getByRole("button", { name: "Add Note" }).click();
      await expect(sheet.getByText("Review the escalation checklist together.")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(agent).toBeFocused();
    });

    test("Support Scorecard mobile grid scrolls independently and creates and restores records", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(entry + route);
      const grid = page.getByRole("region", { name: "Support scorecard" });
      const table = grid.getByRole("table");
      await expect(table).toBeVisible();
      const viewport = grid.locator('[data-slot="scroll-area-viewport"]').first();
      await expect
        .poll(() => viewport.evaluate((node) => node.scrollWidth > node.clientWidth))
        .toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

      await grid.getByRole("button", { name: "Add Agent" }).click();
      const editor = page.getByRole("dialog", { name: "Add Agent" });
      await editor.getByRole("textbox", { name: "Full Name" }).fill("Robin Calder");
      await editor.getByRole("textbox", { name: "Work Email" }).fill("robin@support.example");
      await editor.getByRole("button", { name: "Add Agent" }).click();
      const row = grid.getByRole("row").filter({ hasText: "Robin Calder" });
      await expect(row).toHaveCount(1);
      await row.getByRole("checkbox", { name: "Select row" }).check();
      await grid.getByRole("button", { name: "Delete", exact: true }).click();
      const confirm = page.getByRole("alertdialog", { name: "Delete agent?" });
      await confirm.getByRole("button", { name: "Delete", exact: true }).click();
      await expect(row).toHaveCount(0);
      await grid.getByRole("button", { name: "Undo last agent change" }).click();
      await expect(row).toHaveCount(1);
    });
  });
}
