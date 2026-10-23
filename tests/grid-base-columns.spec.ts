import { test, expect } from "@playwright/test";
const go = (family: string, n: number) => `/#/preview/data-grid/${family}/data-grid-${family}-${n}`;
test("customer search, selection, deletion and paging operate on customer rows", async ({
  page,
}) => {
  await page.goto(go("base", 1));
  await expect(page.getByRole("heading", { name: "Customers", exact: true })).toBeVisible();
  await page.getByLabel("Search customers", { exact: true }).fill("Alex");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Select Alex Johnson", { exact: true }).check();
  await page.getByRole("button", { name: "Delete selected", exact: true }).click();
  await expect(page.getByText("No customers match your filters.")).toBeVisible();
});
test("timesheet week and billable filters change matrix", async ({ page }) => {
  await page.goto(go("base", 4));
  await expect(page.getByText("Mon, Mar 23", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(page.getByText("Mon, Mar 30", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Billable status", exact: false }).click();
  await page.getByText("Internal", { exact: true }).last().click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
});
test("permissions tabs swap actual scopes and preserve toggles", async ({ page }) => {
  await page.goto(go("columns", 1));
  const toggle = page.getByLabel("Settings access for Leila Cole", { exact: true });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await page.getByRole("tab", { name: "Tags", exact: true }).click();
  await expect(page.getByLabel("Design access for Leila Cole", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Permissions", exact: true }).click();
  await expect(
    page.getByLabel("Settings access for Leila Cole", { exact: true }),
  ).not.toBeChecked();
});
test("course status, density and column visibility update actual table", async ({ page }) => {
  await page.goto(go("columns", 2));
  await page.getByRole("tab", { name: "Draft", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Compact", exact: true }).click();
  await page.getByText("Score", { exact: true }).last().click();
  await expect(page.getByRole("columnheader", { name: "Score", exact: true })).toHaveCount(0);
});
test("work queue switches between live table and card views", async ({ page }) => {
  await page.goto(go("columns", 3));
  await expect(page.locator("table")).toBeVisible();
  await page.getByRole("button", { name: "Card view", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(6);
  await expect(page.locator("table")).toHaveCount(0);
  await page.getByRole("tab", { name: "Following", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(3);
  await page.getByRole("button", { name: "Table view", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
});
test("company column cascader adds real data columns", async ({ page }) => {
  await page.goto(go("columns", 5));
  await page.getByRole("combobox", { name: "Columns", exact: true }).click();
  await page.getByRole("option", { name: /Company details/ }).click();
  await page.getByText("Employees", { exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: "Employees" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "1,700", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Remove Employees column", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Employees" })).toHaveCount(0);
});
for (const family of ["base", "columns"])
  for (let n = 1; n <= (family === "base" ? 8 : 5); n++)
    test(`${family} ${n} renders without errors at desktop and mobile`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(go(family, n));
      await expect(page.locator('[data-slot="data-grid-table"]')).toBeVisible();
      await expect(page.locator('[data-slot="frame"]')).toHaveCount(1);
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.locator("table")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        391,
      );
      expect(errors).toEqual([]);
    });
test("contacts numeric filter drives the native filtered row model", async ({ page }) => {
  await page.goto(go("base", 2));
  await page.getByRole("button", { name: "Add filter", exact: true }).click();
  await page.getByRole("option", { name: "Score", exact: true }).click();
  await page.getByRole("option", { name: "greater than", exact: true }).click();
  const value = page.getByRole("spinbutton", { name: "Score", exact: true });
  await value.fill("90");
  await value.press("Enter");
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await expect(page.getByText("1 - 5 of 8", { exact: true })).toBeVisible();
});
test("course columns can be moved and resized", async ({ page }) => {
  await page.goto(go("columns", 2));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Move Tags column right", exact: true }).click();
  await expect(page.getByRole("columnheader").nth(1)).toHaveText("Path");
  await page.getByText("Resizable columns", { exact: true }).click();
  await page.keyboard.press("Escape");
  const handle = page.locator('[data-slot="data-grid-table-resize-handle"]').nth(1);
  const before = await handle.locator("..").evaluate((e) => e.getBoundingClientRect().width);
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + 2, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 65, box.y + 10);
  await page.mouse.up();
  expect(
    await handle.locator("..").evaluate((e) => e.getBoundingClientRect().width),
  ).toBeGreaterThan(before + 30);
});

test("official header sort and pagination share the TanStack row order", async ({ page }) => {
  await page.goto(go("base", 1));
  await page.getByRole("button", { name: "Balance ($)", exact: true }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Noah Davis");
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("James Brown");
  await expect(page.getByText("6 - 10 of 12", { exact: true })).toBeVisible();
});
test("official column visibility and pin controls change the rendered grid", async ({ page }) => {
  await page.goto(go("columns", 4));
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Columns", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Last seen", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: "Last seen", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Team", exact: true }).click();
  await page.getByRole("menuitem", { name: "Pin to left", exact: true }).click();
  await expect(page.locator('thead th[data-pinned="start"]')).toContainText("Team");
});

test("pinned opportunities retain their top region across native pages", async ({ page }) => {
  await page.goto(go("base", 3));
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Annual Service Renewal");
  await expect(
    page.locator("tbody tr").first().getByRole("button", { name: "Unpin row", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Unpin all", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unpin row", exact: true })).toHaveCount(0);
});
