import { test, expect } from "@playwright/test";

test("dispatch presets retain live header order, resize and reset inside the new grid frame", async ({
  page,
}) => {
  await page.goto("/#/preview/data-grid/drag-drop/data-grid-drag-drop-3");
  await expect(page.getByRole("heading", { name: "Dispatch Layout" })).toBeVisible();
  await page.getByRole("button", { name: "Risk", exact: true }).click();
  await expect(page.getByRole("columnheader").first()).toContainText("Status");
  const column = page.locator('th[data-col-id="wave"]');
  const originalWidth = (await column.boundingBox())!.width;
  const handle = column.locator('[data-slot="data-grid-table-resize-handle"]');
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await expect
    .poll(async () => (await column.boundingBox())!.width)
    .toBeGreaterThan(originalWidth + 20);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("columnheader").first()).toContainText("Wave");
  await expect.poll(async () => (await column.boundingBox())!.width).toBe(originalWidth);
  expect(
    await page
      .getByRole("region", { name: "Dispatch Layout" })
      .evaluate((e) => e.getBoundingClientRect().top),
  ).toBe(48);
});

test("inventory retains invalid-cell save protection and Escape restores the saved price", async ({
  page,
}) => {
  await page.goto("/#/preview/data-grid/editing/data-grid-editing-2");
  await page
    .getByRole("button", {
      name: "Edit price for Everyday Cotton Tee",
      exact: true,
    })
    .click();
  const field = page.getByRole("textbox", {
    name: "Edit price for Everyday Cotton Tee",
    exact: true,
  });
  await field.fill("-1");
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Price cannot be negative.");
  await field.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Edit price for Everyday Cotton Tee",
      exact: true,
    }),
  ).toContainText("$28.00");
  await expect(page.getByRole("status")).toContainText("All changes saved");
});

test("treasury actual transactions roll up while plan and variance remain independent", async ({
  page,
}) => {
  await page.goto("/#/preview/data-grid/expansion/data-grid-expansion-2");
  const cash = page.getByRole("row").filter({
    has: page.getByRole("button", {
      name: "Hide details for Cash",
      exact: true,
    }),
  });
  await expect(cash.getByRole("cell").nth(1)).toContainText("$243,000");
  await page.getByRole("button", { name: "New Transaction", exact: true }).click();
  await page.getByLabel("Description", { exact: true }).fill("QA income");
  await page.getByLabel("Amount (USD)", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "Add transaction", exact: true }).click();
  await expect(cash.getByRole("cell").nth(1)).toContainText("$244,000");
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await expect(cash.getByRole("cell").nth(1)).toContainText("$248,000");
  await page.getByRole("tab", { name: "Variance", exact: true }).click();
  await expect(cash.getByRole("cell").nth(1)).toContainText("($4,000)");
});
