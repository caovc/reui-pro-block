import { test, expect } from "@playwright/test";
const path = (category: string, n: number) =>
  `/#/preview/data-grid/${category}/data-grid-${category}-${n}`;
test("labels validate duplicates, save a custom label and support keyboard reordering", async ({
  page,
}) => {
  await page.goto(path("editing", 1));
  await page.getByRole("button", { name: "Add label", exact: true }).click();
  await page.getByLabel("Label name", { exact: true }).fill("Engineering");
  await page.getByRole("button", { name: "Create label", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("already exists");
  await page.getByLabel("Label name", { exact: true }).fill("Launch readiness");
  await page.getByRole("button", { name: "Create label", exact: true }).click();
  await expect(page.getByText("Launch readiness", { exact: true })).toBeVisible();
  const handle = page
    .locator('tr[data-row-id="2"]')
    .getByRole("button", { name: "Drag to reorder row", exact: true });
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(page.locator('tr[data-dragging="true"]')).toBeVisible();
  // dnd-kit installs its keyboard listener after activation and measures on
  // the next frame; wait for those frames before issuing the move gesture.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("status").filter({ hasText: "moved over droppable area 1" }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator("tbody tr[data-row-id]").first()).toHaveAttribute("data-row-id", "2");
});
test("project intake blocks invalid budgets and discards only unsaved edits", async ({ page }) => {
  await page.goto(path("editing", 3));
  await page
    .getByRole("button", {
      name: "Edit budget for Website Refresh",
      exact: true,
    })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Edit budget for Website Refresh",
    exact: true,
  });
  await editor.fill("-1");
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Budget");
  await editor.fill("20000");
  await editor.press("Enter");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("All changes saved");
  await page.getByRole("switch", { name: "Approve Website Refresh" }).uncheck();
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Approve Website Refresh" })).toBeChecked();
  await expect(page.getByText("$20,000.00", { exact: true })).toBeVisible();
});
test("plan editing locks other rows, validates seats and cancels a new row", async ({ page }) => {
  await page.goto(path("editing", 4));
  await page.getByRole("button", { name: "Edit Pro", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Starter", exact: true })).toBeDisabled();
  await page.getByRole("textbox", { name: "Plan seats", exact: true }).fill("0");
  await expect(page.getByRole("button", { name: "Save plan", exact: true })).toBeDisabled();
  await page.getByRole("textbox", { name: "Plan seats", exact: true }).fill("12");
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Starter", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Add plan", exact: true }).click();
  await page.getByRole("button", { name: "Cancel plan edit", exact: true }).click();
  await expect(page.getByText("5 plans · 4 public")).toBeVisible();
});
test("sprint reordering updates priority rank and reset restores original order", async ({
  page,
}) => {
  await page.goto(path("drag-drop", 1));
  await page
    .locator('tr[data-row-id="2"]')
    .getByRole("button", { name: "Drag to reorder row", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await expect(page.locator('tr[data-dragging="true"]')).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(80);
  await page.keyboard.press("Space");
  await expect(page.locator("tbody tr").first()).toContainText("SSO enforcement");
  await page.getByRole("button", { name: "Reset order", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Realtime presence");
});
test("routing disabled rules retain their rank and active count changes", async ({ page }) => {
  await page.goto(path("drag-drop", 2));
  await expect(page.getByText(/First match wins · 5 active/)).toBeVisible();
  await page.getByRole("switch", { name: "Enable Urgent escalation", exact: true }).uncheck();
  await expect(page.getByText(/First match wins · 4 active/)).toBeVisible();
  await expect(page.locator("tbody tr").first()).toContainText("Urgent escalation");
});
test("drive cascading selection and reparenting a file preserve hierarchy", async ({ page }) => {
  await page.goto(path("drag-drop", 4));
  await page.getByRole("checkbox", { name: "Select Product Design", exact: true }).check();
  await expect(
    page.getByRole("checkbox", {
      name: "Select Design Review.pdf",
      exact: true,
    }),
  ).toBeChecked();
  await page.getByRole("checkbox", { name: "Select Design Review.pdf", exact: true }).uncheck();
  await expect(
    page.getByRole("checkbox", { name: "Select Product Design", exact: true }),
  ).toHaveAttribute("aria-checked", "mixed");
  const source = page.locator('tr[data-row-id="9"]');
  const target = page.locator('tr[data-row-id="5"]');
  const handle = source.getByRole("button", {
    name: "Drag to reorder row",
    exact: true,
  });
  await handle.hover();
  const grip = await handle.boundingBox();
  const destination = await target.boundingBox();
  expect(grip).not.toBeNull();
  expect(destination).not.toBeNull();
  const pointerX = grip!.x + grip!.width / 2;
  await page.mouse.down();
  await page.mouse.move(pointerX, grip!.y + grip!.height / 2 - 4);
  // dnd-kit measures droppables after activation. Wait for the real drag
  // and its destination indicator before releasing the pointer.
  await expect(source).toHaveAttribute("data-dragging", "true");
  await page.mouse.move(pointerX, destination!.y + destination!.height / 2, { steps: 8 });
  await expect(target.locator('[data-slot="data-grid-table-row-drop-indicator"]')).toBeVisible();
  await page.mouse.up();
  await expect(source).toHaveAttribute("data-depth", "1");
  const collapse = target.getByRole("button", {
    name: "Collapse row",
    exact: true,
  });
  await expect(collapse).toBeVisible();
  await collapse.click();
  await expect(source).toHaveCount(0);
  await target.getByRole("button", { name: "Expand row", exact: true }).click();
  await expect(source).toHaveAttribute("data-depth", "1");
});
test("task spreadsheet commits a cell and undo restores the prior value", async ({ page }) => {
  await page.goto(path("editing", 5));
  const cell = page.locator('tr[data-row-id="2"] td[data-col-id="points"]');
  await cell.dblclick();
  const editor = page.getByRole("textbox", {
    name: "Edit Points",
    exact: true,
  });
  await editor.fill("21");
  await editor.press("Enter");
  await expect(cell).toContainText("21");
  await page.getByRole("button", { name: "Undo last edit", exact: true }).click();
  await expect(cell).toContainText("8");
  await page.getByRole("button", { name: "Redo last edit", exact: true }).click();
  await expect(cell).toContainText("21");
  await page.getByRole("button", { name: "Columns 6", exact: true }).click();
  await page.getByRole("textbox", { name: "New column name", exact: true }).fill("QA note");
  await page.getByRole("button", { name: "Add column", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: "QA note", exact: true })).toBeVisible();
});
test("stock sheet exposes filter row and real bulk status edits with undo", async ({ page }) => {
  await page.goto(path("editing", 6));
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByRole("textbox", { name: "Filter SKU", exact: true }).fill("LUB-CL-AE");
  await expect(page.locator("tbody tr").first()).toContainText("LUB-CL-AE");
  await page.getByRole("checkbox", { name: "Select stock line 1", exact: true }).check();
  await page.getByRole("combobox", { name: "Bulk stock status", exact: true }).click();
  await page.getByRole("option", { name: "Approved", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Approved");
  await page.getByRole("button", { name: "Undo last edit", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Covered");
});
test("subtasks keep parent pagination and complete parent after all child checks", async ({
  page,
}) => {
  await page.goto(path("expansion", 1));
  await expect(
    page.getByText("Lock the signed entitlement payload shape", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .locator('tr[data-row-id="1"]')
    .getByRole("button", { name: "Collapse row", exact: true })
    .click();
  await expect(
    page.getByText("Lock the signed entitlement payload shape", {
      exact: true,
    }),
  ).not.toBeVisible();
  await page
    .getByRole("checkbox", {
      name: "Complete Finalize licensed registry handshake for private installs",
      exact: true,
    })
    .click();
  await expect(page.locator("tbody tr").first()).toContainText("Done");
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(page.getByText("6–10 of 16", { exact: true })).toBeVisible();
});
test("release checklist rail can be hidden and approve updates row state", async ({ page }) => {
  await page.goto(path("expansion", 3));
  await expect(page.getByText("Replica lag watch", { exact: true })).toBeVisible();
  await page
    .getByRole("button", {
      name: "Actions for Split EU checkout traffic",
      exact: true,
    })
    .click();
  await page.getByRole("menuitem", { name: "Approve release", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("Approved");
  await expect(page.locator("tbody tr").first()).toContainText("100%");
  await page.getByRole("button", { name: "View Settings", exact: true }).click();
  await page.getByRole("checkbox", { name: "Show checklist cards", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Replica lag watch", { exact: true })).not.toBeVisible();
});
test("payments load further batches, virtualize rows, and refund changes real status", async ({
  page,
}) => {
  await page.goto(path("virtualization", 1));
  await expect(page.getByText("25 of 10,000 loaded", { exact: true })).toBeVisible();
  expect(await page.locator("tbody tr").count()).toBeLessThan(23);
  const scroller = page.locator('[data-slot="data-grid-table-viewport"]');
  await scroller.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    el.dispatchEvent(new Event("scroll"));
  });
  await expect(page.getByText("50 of 10,000 loaded", { exact: true })).toBeVisible();
  expect(await page.locator("tbody tr[data-row-id]").count()).toBeLessThan(28);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  const firstSettled = page.locator("tbody tr").filter({ hasText: "Settled" }).first();
  const selectionName = await firstSettled.getByRole("checkbox").getAttribute("aria-label");
  const settled = page.locator("tbody tr").filter({
    has: page.getByRole("checkbox", { name: selectionName!, exact: true }),
  });
  await settled.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Refund 1 settled", exact: true }).click();
  await expect(settled).not.toContainText("Settled");
});
test("shipment bulk assignment updates owners and release updates status", async ({ page }) => {
  await page.goto(path("virtualization", 2));
  const row = page.locator("tbody tr").first();
  await row.getByRole("checkbox").check();
  await page.getByRole("combobox", { name: "Assign selected shipments", exact: true }).click();
  await page.getByRole("option", { name: "Leo Grant", exact: true }).click();
  await expect(row).toContainText("Leo Grant");
  await row.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Release selected", exact: true }).click();
  await expect(row).toContainText("Released");
});
test("spreadsheet range paste, fill down and undo operate across cells", async ({ page }) => {
  await page.goto(path("editing", 5));
  const points = (row: number) =>
    page.locator(`tr[data-row-id="${row + 1}"] td[data-col-id="points"]`);
  await points(1).click();
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.setData("text/plain", "13\n21");
    document
      .querySelector('[data-slot="data-grid-table-viewport"] table')!
      .dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: dt }));
  });
  await expect(points(1)).toContainText("13");
  await expect(points(2)).toContainText("21");
  await page.getByRole("button", { name: "Undo last edit", exact: true }).click();
  await expect(points(1)).toContainText("8");
  await expect(points(2)).toContainText("5");
  await points(1).click();
  await points(3).click({ modifiers: ["Shift"] });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Fill selected range down", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(points(2)).toContainText("8");
  await expect(points(3)).toContainText("8");
});
test("dispatch official column model applies presets, pointer resizing and faceted status filtering", async ({
  page,
}) => {
  await page.goto(path("drag-drop", 3));
  await page.getByRole("button", { name: "Risk", exact: true }).click();
  await expect(page.locator("thead th[data-col-id]").first()).toHaveAttribute(
    "data-col-id",
    "status",
  );
  const wave = page.locator('th[data-col-id="wave"]');
  const before = (await wave.boundingBox())!.width;
  const handle = wave.locator('[data-slot="data-grid-table-resize-handle"]');
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await expect.poll(async () => (await wave.boundingBox())!.width).toBeGreaterThan(before + 20);
  const grownHandle = (await handle.boundingBox())!;
  await page.mouse.move(
    grownHandle.x + grownHandle.width / 2,
    grownHandle.y + grownHandle.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(grownHandle.x - 600, grownHandle.y + grownHandle.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await wave.boundingBox())!.width).toBe(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator("thead th[data-col-id]").first()).toHaveAttribute(
    "data-col-id",
    "wave",
  );
  await page
    .locator('th[data-col-id="status"]')
    .getByRole("button", { name: "Status", exact: true })
    .click();
  await page.getByRole("menu").getByRole("button", { name: "Status", exact: true }).click();
  await page.getByRole("button", { name: "Ready 4", exact: true }).click();
  await expect(page.locator("tbody tr[data-row-id]")).toHaveCount(4);
});
