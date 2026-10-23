import { test, expect } from "@playwright/test";
const url = (family: string, n: number) =>
  `./#/preview/data-grid/${family}/data-grid-${family}-${n}`;
test("campaigns support composed filters and a live ROAS target", async ({ page }) => {
  await page.goto(url("advanced", 1));
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("combobox", { name: "Campaign status", exact: true }).click();
  await page.getByRole("option", { name: "Limited", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("ROAS target", { exact: true }).fill("6");
  await page.keyboard.press("Escape");
  await expect(page.getByText("Target 6x", { exact: true })).toBeVisible();
});
test("campaign targets expose an actual per-column filter", async ({ page }) => {
  await page.goto(url("advanced", 3));
  await page.getByLabel("Filter campaign names", { exact: true }).fill("Glacier");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(page.locator("tbody")).not.toContainText("Ember Stove");
});
test("reliability chart selection and shared objective update the selected service", async ({
  page,
}) => {
  await page.goto(url("advanced", 4));
  await page
    .getByRole("button", {
      name: "Inspect Payout API availability",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Details", exact: true }).click();
  await expect(page.getByText("Team: Payments", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "7D", exact: true }).click();
  await expect(page.getByText(/over 7D/)).toBeVisible();
  await page.getByRole("combobox", { name: "Shared objective", exact: true }).click();
  await page.getByRole("option", { name: "99.5%", exact: true }).click();
  await expect(page.getByText(/99.5% over 7D/)).toBeVisible();
});
test("stock mix edits, stages and submits real order state", async ({ page }) => {
  await page.goto(url("advanced", 6));
  await page.getByLabel("Edit Drinks order", { exact: true }).click();
  const input = page.locator('[data-slot="data-grid-cell-editor"]');
  await input.fill("3");
  await input.press("Enter");
  await expect(page.getByLabel("Edit Drinks order", { exact: true })).toHaveText("3");
  await page.getByLabel("Edit Drinks order", { exact: true }).click();
  await expect(input).toHaveValue("3");
  await input.press("Escape");
  await page.getByRole("button", { name: /Stage Orders/ }).click();
  await expect(page.getByText("Drinks: +3k", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Submit Orders", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Orders submitted" }).first(),
  ).toBeVisible();
  await expect(page.getByText(/orders v13/)).toBeVisible();
});
test("pro forma recomputes annual cashflow from inline rent and financing inputs", async ({
  page,
}) => {
  await page.goto(url("advanced", 7));
  const heading = page.locator("header").first();
  const before = await heading.innerText();
  await page.getByLabel("Edit Rental Income", { exact: true }).click();
  const editor = page.locator('[data-slot="data-grid-cell-editor"]');
  await editor.fill("5000");
  await editor.press("Enter");
  await expect(heading).not.toHaveText(before);
  await expect(page.getByLabel("Edit Rental Income", { exact: true })).toHaveText("5,000");
  await page.getByRole("combobox", { name: "Forecast period", exact: true }).click();
  await page.getByRole("option", { name: "5 Years", exact: true }).click();
  await expect(page.getByRole("button", { name: "Year 6", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByLabel("Edit Rental Income", { exact: true })).toHaveText("3,950");
});
test("wholesale quick decision and readiness cells update independently", async ({ page }) => {
  await page.goto(url("advanced", 5));
  await page
    .getByRole("combobox", {
      name: "Decision for Hedgerow & Fell",
      exact: true,
    })
    .click();
  await page.getByRole("option", { name: "Approved", exact: true }).click();
  await expect(
    page.getByRole("combobox", {
      name: "Decision for Hedgerow & Fell",
      exact: true,
    }),
  ).toContainText("Approved");
  const check = page.getByRole("button", {
    name: "Resale checked for Hedgerow & Fell",
    exact: true,
  });
  await expect(check).toHaveAttribute("aria-pressed", "false");
  await check.click();
  await expect(check).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", {
      name: "Expand doors for Alpenrand Sport",
      exact: true,
    })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(15);
  await expect(page.getByText("Pearl Street", { exact: true }).first()).toBeVisible();
});
test("service visit matrix books a visit and advances a three-week window", async ({ page }) => {
  await page.goto(url("advanced", 9));
  await page
    .getByRole("button", {
      name: "Book visit for River North Grill on Oct 12",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Save visit", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Edit visit for River North Grill on Oct 12, Pest Booked",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next three weeks", exact: true }).click();
  await expect(page.getByText(/Nov 2 to Nov 22/)).toBeVisible();
});
test("roadmap collapse and task creation retain the correct stage", async ({ page }) => {
  await page.goto(url("grouping", 1));
  await page.getByRole("button", { name: "Collapse Backlog", exact: true }).click();
  await expect(page.getByText("Draft first-run board tips", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page.getByLabel("Task title", { exact: true }).fill("Test roadmap task");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByRole("button", { name: "Expand Backlog", exact: true }).click();
  await expect(page.getByText("Test roadmap task", { exact: true })).toBeVisible();
});
test("region groups retain children after search and show filtered subtotals", async ({ page }) => {
  await page.goto(url("grouping", 2));
  await page.getByLabel("Search accounts...", { exact: true }).fill("Northwind");
  await expect(page.locator("tbody")).toContainText("$920,000");
  await expect(page.getByText("Northwind Trading", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Collapse North America", exact: true }).click();
  await expect(page.getByText("Northwind Trading", { exact: true })).toHaveCount(0);
});
test("cohort grouping changes bands and notes visibility without changing totals", async ({
  page,
}) => {
  await page.goto(url("grouping", 3));
  await expect(page.getByText("Acute pain and mobility limits", { exact: true })).toBeVisible();
  await page.getByRole("switch").uncheck();
  await expect(page.getByText("Acute pain and mobility limits", { exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Booking strength", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Collapse Strong booking", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Collapse Clinical Fit", exact: true }),
  ).toHaveCount(0);
});
test("BOM search reveals matched descendants and a valid roll-up", async ({ page }) => {
  await page.goto(url("grouping", 4));
  await page.getByRole("button", { name: "Set tree depth Collapse", exact: true }).click();
  await expect(page.getByText("Copper Winding", { exact: true })).toHaveCount(0);
  await page.getByLabel("Search parts...", { exact: true }).fill("Copper");
  await expect(page.getByText("Copper Winding", { exact: true })).toBeVisible();
  await expect(page.getByText("Drive System", { exact: true })).toBeVisible();
  await expect(page.getByText("$22.20", { exact: true })).toBeVisible();
});
test("reporting selection cascades to every descendant, including collapsed people", async ({
  page,
}) => {
  await page.goto(url("grouping", 5));
  await page
    .getByRole("checkbox", {
      name: "Select Leo Grant and reports",
      exact: true,
    })
    .check();
  await expect(page.getByRole("status")).toContainText("8 people selected");
  await page.getByRole("button", { name: "Expand Leo Grant", exact: true }).click();
  await expect(
    page.getByRole("checkbox", {
      name: "Select Noah Chen and reports",
      exact: true,
    }),
  ).toBeChecked();
  await page
    .getByRole("checkbox", {
      name: "Select Noah Chen and reports",
      exact: true,
    })
    .uncheck();
  await expect(
    page.getByRole("checkbox", {
      name: "Select Leo Grant and reports",
      exact: true,
    }),
  ).toHaveAttribute("data-state", "indeterminate");
});
test("editorial desk regroups real rows and repeats the column header", async ({ page }) => {
  await page.goto(url("grouping", 6));
  await page.getByRole("button", { name: "Desk", exact: true }).click();
  await expect(page.getByRole("button", { name: "Collapse Culture", exact: true })).toBeVisible();
  await expect(
    page.getByRole("columnheader").filter({
      has: page.getByRole("button", { name: "Story", exact: true }),
    }),
  ).toHaveCount(3);
  await page.getByLabel("Search stories...", { exact: true }).fill("Last Dry");
  await expect(page.getByText("The Last Dry Winter", { exact: true })).toBeVisible();
  await expect(page.getByText("Cheap Money Ends", { exact: true })).toHaveCount(0);
});
test("delivery bulk action moves selected engagements between stage tables", async ({ page }) => {
  await page.goto(url("grouping", 7));
  await page.getByRole("checkbox", { name: "Select Stripe", exact: true }).check();
  await page.getByRole("button", { name: "Move to ready", exact: true }).click();
  const rows = page.locator("table").last();
  await expect(rows).toContainText("Stripe");
  await expect(rows).toContainText("100%");
});
for (const family of ["advanced", "grouping"]) {
  for (let n = 1; n <= (family === "advanced" ? 9 : 7); n++) {
    test(`${family} ${n} renders without errors or document overflow at 390px`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(url(family, n));
      await expect(page.locator("h2")).toBeVisible();
      await expect(page.locator("table").first()).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test("campaign official column controls resize, move and reset the actual model", async ({
  page,
}) => {
  await page.goto(url("advanced", 1));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("checkbox", { name: "Resizable columns", exact: true }).check();
  await page.getByRole("checkbox", { name: "Movable columns", exact: true }).check();
  await page.keyboard.press("Escape");
  const header = page.locator("thead th.reui-col-name");
  const handle = header.locator('[data-slot="data-grid-table-resize-handle"]');
  const before = (await header.boundingBox())!;
  const hit = (await handle.boundingBox())!;
  await page.mouse.move(hit.x + hit.width / 2, hit.y + hit.height / 2);
  await page.mouse.down();
  await page.mouse.move(hit.x + hit.width / 2 + 40, hit.y + hit.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => ((await header.boundingBox())?.width || 0) - before.width)
    .toBeGreaterThan(35);
  await header.getByRole("button", { name: "Campaign", exact: true }).click();
  await page.getByRole("menuitem", { name: "Move to right", exact: true }).click();
  await expect(page.locator("thead th").nth(2)).toHaveClass(/reui-col-name/);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Reset columns", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("thead th").nth(1)).toHaveClass(/reui-col-name/);
  await expect.poll(async () => Math.round((await header.boundingBox())?.width || 0)).toBe(300);
});

test("pro forma official clipboard edits a two-dimensional range and supports undo", async ({
  page,
}) => {
  await page.goto(url("advanced", 7));
  const rent = page.getByLabel("Edit Rental Income", { exact: true });
  await rent.click();
  await page.keyboard.press("Escape");
  await page.locator('[data-slot="data-grid-table-viewport"]').evaluate((element) => {
    const clipboard = new DataTransfer();
    clipboard.setData("text/plain", "5000\t60000\n5\t-3000");
    element.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: clipboard, bubbles: true, cancelable: true }),
    );
  });
  await expect(rent).toHaveText("5,000");
  await expect(page.getByLabel("Edit Rental Income Year 1", { exact: true })).toHaveText("60,000");
  await expect(page.getByLabel("Edit Vacancy", { exact: true })).toHaveText("5.0%");
  await expect(page.getByLabel("Edit Vacancy Year 1", { exact: true })).toHaveText("(3,000)");
  await expect(page.getByRole("status")).toHaveText("4 cells updated");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(rent).toHaveText("3,950");
  await expect(page.getByLabel("Edit Vacancy", { exact: true })).toHaveText("7.0%");
  await page.getByLabel("Edit Rental Income Year 2", { exact: true }).click();
  await page.keyboard.press("Escape");
  await page.locator('[data-slot="data-grid-table-viewport"]').evaluate((element) => {
    const clipboard = new DataTransfer();
    clipboard.setData("text/plain", "62000\t64000");
    element.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: clipboard, bubbles: true, cancelable: true }),
    );
  });
  await expect(page.getByLabel("Edit Rental Income Year 2", { exact: true })).toHaveText("62,000");
  await expect(page.getByLabel("Edit Rental Income Year 3", { exact: true })).toHaveText("64,000");
  await page.getByLabel("Edit Rental Income Year 2", { exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="data-grid-table"]')).toBeFocused();
  await page.keyboard.press("ControlOrMeta+z");
  await expect(page.getByLabel("Edit Rental Income Year 2", { exact: true })).toHaveText("49,059");
});

test("official pagination changes the campaign row model and page size", async ({ page }) => {
  await page.goto(url("advanced", 1));
  const first = await page.locator("tbody tr").first().innerText();
  await page.getByRole("button", { name: "Go to page 2", exact: true }).click();
  await expect(page.locator("tbody tr").first()).not.toHaveText(first);
  await expect(page.locator('[data-slot="data-grid-pagination"]')).toContainText(
    "11–20 of 30 campaigns",
  );
  await page.getByRole("combobox", { name: "Rows per page", exact: true }).click();
  await page.getByRole("option", { name: "25", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(25);
  await expect(page.locator('[data-slot="data-grid-pagination"]')).toContainText(
    "1–25 of 30 campaigns",
  );
});
