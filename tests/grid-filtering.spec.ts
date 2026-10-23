import { test, expect, type Locator, type Page } from "@playwright/test";
const route = (id: number) => `/#/preview/data-grid/filtering/data-grid-filtering-${id}`;
const rows = (page: Page) => page.locator('[data-slot="data-grid-table"] tbody tr');
async function addFilter(page: Page, field: string, value: string, operator = "is") {
  await page.getByRole("button", { name: "Add filter", exact: true }).click();
  await page.getByRole("option", { name: field, exact: true }).click();
  await page.getByRole("option", { name: operator, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
  if (await page.getByRole("button", { name: "Done", exact: true }).isVisible())
    await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.keyboard.press("Escape");
}
test("official filters combine rules, show loading and empty states, clear and paginate", async ({
  page,
}) => {
  await page.goto(route(1));
  await expect(page.locator('[data-slot="frame"]')).toBeVisible();
  await addFilter(page, "Merchant", "Stripe");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page)).toContainText("TXN-2025-000143");
  await addFilter(page, "Status", "Pending");
  await expect(page.getByText("No transactions match your filters.")).toBeVisible();
  await expect(page.getByText("0 - 0 of 0", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(rows(page)).toHaveCount(5);
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(rows(page)).toContainText([
    "TXN-2025-000138",
    "TXN-2025-000137",
    "TXN-2025-000136",
    "TXN-2025-000135",
    "TXN-2025-000134",
  ]);
  await page.getByRole("button", { name: "Amount", exact: true }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(rows(page).first()).toContainText("−$250.00");
});
test("native text editor, condition picker and dispute action update the underlying ledger", async ({
  page,
}) => {
  await page.goto(route(1));
  await page.getByRole("button", { name: "enter text...", exact: true }).click();
  await page.getByRole("textbox", { name: "Reference", exact: true }).fill("000143");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(rows(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Actions for TXN-2025-000143", exact: true }).click();
  await page.getByRole("menuitem", { name: "Dispute transaction" }).click();
  await page.getByRole("button", { name: "Confirm dispute" }).click();
  await expect(rows(page)).toContainText("Disputed");
  await page.getByRole("button", { name: "contains", exact: true }).click();
  await page.getByRole("option", { name: "does not contain", exact: true }).click();
  await expect(page.locator("tbody")).not.toContainText("TXN-2025-000143");
});
test("automation tab models combine with native filters and enable controls", async ({ page }) => {
  await page.goto(route(2));
  await page.getByRole("tab", { name: /^Paused/ }).click();
  await expect(rows(page)).toHaveCount(2);
  await page.getByRole("button", { name: "Actions for Lead enrichment pass" }).click();
  await page.getByRole("switch", { name: "Enable Lead enrichment pass" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tab", { name: /^Paused/ })).toContainText("1");
  await page.getByRole("tab", { name: /^Live/ }).click();
  await expect(page.getByRole("tab", { name: /^Live/ })).toContainText("8");
  await addFilter(page, "Last updated", "Today");
  await expect(page.getByRole("tab", { name: /^All/ })).toContainText("3");
  await expect(rows(page)).toHaveCount(1);
});
test("TanStack selection drives renewal bulk assignment and official column visibility", async ({
  page,
}) => {
  await page.goto(route(3));
  const first = rows(page).first();
  await first.getByRole("checkbox").check();
  await page.getByRole("combobox", { name: "Assign owner" }).click();
  await page.getByRole("option", { name: "Nina Santos", exact: true }).click();
  await page.getByRole("button", { name: "Apply to selected" }).click();
  await expect(first).toContainText("Nina Santos");
  await expect(first.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Display columns", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "ARR", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader").filter({ hasText: "ARR" })).toHaveCount(0);
  const viewport = page.locator('.renewal-scroll [data-slot="scroll-area-viewport"]');
  await viewport.evaluate((e) => (e.scrollTop = 350));
  await expect(page.getByRole("columnheader").filter({ hasText: "Account" })).toBeInViewport();
});
test("multiselect signal rules use any, all and none while row pin state survives", async ({
  page,
}) => {
  await page.goto(route(4));
  await addFilter(page, "Signals", "Security Review", "is any of");
  await expect(rows(page)).toHaveCount(3);
  await page.getByRole("button", { name: "is any of", exact: true }).click();
  await page.getByRole("option", { name: "is all of", exact: true }).click();
  await page.keyboard.press("Escape");
  // The native chip opens its multiselect value editor by its chosen label.
  await page.getByRole("button", { name: "Security Review", exact: true }).click();
  await page.getByRole("option", { name: "Usage Dip", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page)).toContainText("Mintlify");
  await page.getByRole("button", { name: "is all of", exact: true }).click();
  await page.getByRole("option", { name: "is none of", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("tbody")).not.toContainText("Mintlify");
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await page.getByRole("button", { name: "Unpin OpenAI", exact: true }).click();
  await expect(page.getByText("1 renewals stay on top", { exact: true })).toBeVisible();
});
for (const direction of ["operator to value", "value to operator"] as const) {
  test(`filter popovers keep the new editor focused after closing ${direction}`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-23T00:00:00Z") });
    await page.goto(route(4));
    await addFilter(page, "Signals", "Security Review", "is any of");
    const valueTrigger = page.getByRole("button", { name: "Security Review", exact: true });
    const operatorTrigger = page.getByRole("button", { name: "is any of", exact: true });
    const panels = page.locator('[data-slot="popover-content"]');
    await expect(panels).toHaveCount(0);
    await expect(valueTrigger).toBeFocused();
    // Reproduce a busy task queue: the old portal unmounts, but its deferred
    // focus restoration runs only after the next editor has opened.
    const pauseAt = await page.evaluate(() => Date.now() + 1000);
    await page.clock.pauseAt(pauseAt);

    let closingPanel: Locator;
    let nextOption: Locator;
    if (direction === "operator to value") {
      await operatorTrigger.click();
      await page.getByRole("option", { name: "is all of", exact: true }).click();
      closingPanel = panels.filter({ hasText: "is all of" });
      await expect(closingPanel).toHaveCount(0);
      await valueTrigger.click();
      nextOption = page.getByRole("option", { name: "Usage Dip", exact: true });
    } else {
      await valueTrigger.click();
      await page.keyboard.press("Escape");
      closingPanel = panels.filter({ hasText: "Usage Dip" });
      await expect(closingPanel).toHaveCount(0);
      await operatorTrigger.click();
      nextOption = page.getByRole("option", { name: "is all of", exact: true });
    }
    await expect(nextOption).toBeVisible();
    await page.clock.runFor(20);
    await expect(nextOption).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Signals", exact: true })).toBeFocused();
    await page.clock.resume();
    await nextOption.click();
    await page.keyboard.press("Escape");
    await expect(rows(page)).toHaveCount(direction === "operator to value" ? 1 : 3);
    await expect(panels).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: direction === "operator to value" ? "2 selected" : "is all of",
        exact: true,
      }),
    ).toBeFocused();
  });
}
test("recovery plan persists and changes the selected row stage", async ({ page }) => {
  await page.goto(route(4));
  await page.getByRole("button", { name: "Create save plan", exact: true }).click();
  await page
    .getByLabel("Recovery plan", { exact: true })
    .fill("Schedule buyer counsel review with Sarah");
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  await expect(rows(page).first()).toContainText("Save Plan");
  await page.getByRole("button", { name: "Create save plan", exact: true }).click();
  await expect(page.getByLabel("Recovery plan", { exact: true })).toHaveValue(
    "Schedule buyer counsel review with Sarah",
  );
});
test("all filtering pages retain official renderers and internal scrolling at 390px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const id of [1, 2, 3, 4]) {
    await page.goto(route(id));
    await expect(page.locator('[data-slot="data-grid-table"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await page.getByRole("button", { name: "Add filter", exact: true }).click();
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.keyboard.press("Escape");
  }
  expect(errors).toEqual([]);
});
test("native numeric range editor keeps signed values and both inclusive bounds", async ({
  page,
}) => {
  await page.goto(route(1));
  await page.getByRole("button", { name: "Add filter", exact: true }).click();
  await page.getByRole("option", { name: "Amount", exact: true }).click();
  await page.getByRole("option", { name: "between", exact: true }).click();
  await page.getByRole("spinbutton").nth(0).fill("-30");
  await page.getByRole("spinbutton").nth(1).fill("100");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(rows(page)).toHaveCount(5);
  await expect(page.locator("tbody")).toContainText("−$21.00");
  await expect(page.locator("tbody")).not.toContainText("+$240.00");
});
test("official resize and move operations share state with pinning and pagination", async ({
  page,
}) => {
  await page.goto(route(4));
  const head = page.getByRole("columnheader").filter({ hasText: "ARR" });
  const before = await head.evaluate((e) => e.getBoundingClientRect().width);
  const handle = head.locator('[data-slot="data-grid-table-resize-handle"]');
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 50, box!.y + box!.height / 2);
  await page.mouse.up();
  expect(await head.evaluate((e) => e.getBoundingClientRect().width)).toBeGreaterThan(before + 30);
  await page.getByRole("button", { name: "Owner", exact: true }).click();
  await page.getByRole("menuitem", { name: "Move to left", exact: true }).click();
  await expect(page.getByRole("columnheader").nth(2)).toContainText("Owner");
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(rows(page).nth(0)).toContainText("OpenAI");
  await expect(rows(page).nth(1)).toContainText("Anthropic");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("switch", { name: "Resizable columns", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="data-grid-table-resize-handle"]')).toHaveCount(0);
});

test("last-page mutations clamp pagination and cell-menu state keeps keyboard focus", async ({
  page,
}) => {
  await page.goto(route(2));
  await page
    .getByRole("button", {
      name: "Actions for Renewal touchpoint orchestration",
      exact: true,
    })
    .click();
  const enabled = page.getByRole("switch", {
    name: "Enable Renewal touchpoint orchestration",
    exact: true,
  });
  await enabled.focus();
  await page.keyboard.press("Space");
  await expect(enabled).toBeFocused();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: /^Live/ }).click();
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  for (const check of await rows(page).getByRole("checkbox").all()) await check.check();
  await page.getByRole("button", { name: "Pause selected", exact: true }).click();
  await expect(rows(page).first()).not.toContainText("No workflows");
  await expect(page.getByText(/1 - 5 of 5/)).toBeVisible();
});
test("native sorting can be cleared by selecting the active menu direction", async ({ page }) => {
  await page.goto(route(1));
  await page.getByRole("button", { name: "Amount", exact: true }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(rows(page).first()).toContainText("−$250.00");
  await page.getByRole("button", { name: "Amount", exact: true }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(rows(page).first()).toContainText("TXN-2025-000143");
});
