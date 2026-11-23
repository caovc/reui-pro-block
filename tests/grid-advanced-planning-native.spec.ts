import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const themes = ["radix", "base"] as const;
type Primitive = (typeof themes)[number];

async function openPlanning(page: Page, primitive: Primitive, id: number, mobile = false) {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  const preset = new URLSearchParams({
    preset: JSON.stringify({ primitive, style: primitive === "base" ? "sera" : "maia" }),
  });
  await page.goto(
    `${primitive === "base" ? "./base/" : "./"}#/preview/data-grid/advanced/data-grid-advanced-${id}?${preset}`,
  );
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
}

async function commit(input: Locator, value: string) {
  await input.fill(value);
  await input.press("Tab");
}

async function nativeOverlay(overlay: Locator, primitive: Primitive) {
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveAttribute(
    primitive === "base" ? "data-open" : "data-state",
    primitive === "base" ? "" : "open",
  );
}

async function selectMonth(page: Page, month: string) {
  const trigger = page.getByLabel("Planning month", { exact: true });
  await trigger.click();
  await page.getByRole("option", { name: `${month} 2026`, exact: true }).click();
  await expect(trigger).toBeFocused();
}

for (const primitive of themes) {
  test(`Family Budget commits zero, forecasts twelve months and undoes in ${primitive}`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await openPlanning(page, primitive, 29);
    const region = page.getByRole("region", { name: "Family budget", exact: true });
    const forecast = region
      .locator('[data-slot="card"]')
      .filter({ hasText: "Year cash forecast" })
      .locator('[data-slot="card-title"]');
    const initial = await forecast.innerText();
    const actual = region.getByLabel("Actual Groceries", { exact: true });
    await commit(actual, "0");
    await expect(actual).toHaveValue("$0.00");
    await expect(forecast).not.toHaveText(initial);
    await region.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(forecast).toHaveText(initial);
    await expect(actual).toHaveValue("$720.00");
    await selectMonth(page, "Dec");
    await expect(actual).toHaveValue("");
    await commit(actual, "0");
    await expect(actual).toHaveValue("$0.00");
    await region.getByRole("tab", { name: "Year forecast", exact: true }).click();
    const pending = page.waitForEvent("download");
    await region.getByRole("button", { name: "Export CSV", exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe("family-budget-year.csv");
    const csv = await readFile((await download.path())!, "utf8");
    expect(csv.split("\r\n")[0]).toContain('"Jan"');
    expect(csv.split("\r\n")[0]).toContain('"Dec"');
    expect(csv).toContain("Groceries");
    await region.getByRole("tab", { name: "Net worth", exact: true }).click();
    const balance = region.getByLabel("Balance Card balance", { exact: true });
    await commit(balance, "0");
    await expect(balance).toHaveValue("$0.00");
    await region.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(balance).toHaveValue("$2,150.00");
    await page.screenshot({ path: info.outputPath("family-desktop.png"), animations: "disabled" });
    expect(faults).toEqual([]);
  });

  test(`Family Budget adds and removes an original line with native focus on phone in ${primitive}`, async ({
    page,
  }, info) => {
    await openPlanning(page, primitive, 29, true);
    const region = page.getByRole("region", { name: "Family budget", exact: true });
    await expect(region).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    const add = region.getByRole("button", { name: "Add budget line", exact: true });
    await add.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Add budget line", exact: true });
    await nativeOverlay(dialog, primitive);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(add).toBeFocused();
    await add.press("Enter");
    await dialog.getByLabel("Line name", { exact: true }).fill("Community garden");
    const plan = dialog.getByLabel("Monthly plan", { exact: true });
    await plan.fill("50");
    await dialog.getByRole("button", { name: "Add line", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(add).toBeFocused();
    const search = region.getByLabel("Search budget lines", { exact: true });
    await search.fill("Community garden");
    await expect(region.getByLabel("Plan Community garden", { exact: true })).toHaveValue("$50.00");
    await region.getByRole("button", { name: "Remove Community garden", exact: true }).click();
    await expect(add).toBeFocused();
    await expect(region.getByRole("button", { name: "Export CSV", exact: true })).toBeDisabled();
    await region.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(region.getByLabel("Plan Community garden", { exact: true })).toHaveValue("$50.00");
    await page.screenshot({ path: info.outputPath("family-phone.png"), animations: "disabled" });
  });

  test(`Inventory Manager reserves budget and receives a real order once in ${primitive}`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await openPlanning(page, primitive, 30);
    const region = page.getByRole("region", { name: "Inventory manager", exact: true });
    const count = region.getByLabel("Count Refill bottle 500ml", { exact: true });
    await commit(count, "0");
    await expect(count).toHaveValue("0");
    await region.getByRole("tab", { name: "Reorder planner", exact: true }).click();
    const selected = region.getByRole("checkbox", {
      name: "Select Refill bottle 500ml",
      exact: true,
    });
    await selected.check();
    const budget = region.getByLabel("Purchase budget", { exact: true });
    await commit(budget, "0");
    const create = region.getByRole("button", {
      name: "Create purchase order drafts",
      exact: true,
    });
    await expect(create).toBeDisabled();
    await commit(budget, "4000");
    await expect(create).toBeEnabled();
    await create.click();
    const ordersTab = region.getByRole("tab", { name: "Purchase orders", exact: true });
    await expect(ordersTab).toBeFocused();
    const detail = region.getByRole("button", { name: "PO-2026-1-1", exact: true });
    await detail.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Purchase order PO-2026-1-1", exact: true });
    await nativeOverlay(sheet, primitive);
    await expect(
      sheet.getByRole("cell", { name: "Refill bottle 500ml", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(detail).toBeFocused();
    const actions = region.getByRole("button", { name: "Actions for PO-2026-1-1", exact: true });
    await actions.press("ArrowDown");
    const menu = page.getByRole("menu");
    await nativeOverlay(menu, primitive);
    await expect(menu.getByRole("menuitem", { name: "Receive stock", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(actions).toBeFocused();
    await actions.click();
    await menu.getByRole("menuitem", { name: "Mark as sent", exact: true }).click();
    await actions.click();
    await menu.getByRole("menuitem", { name: "Receive stock", exact: true }).click();
    await expect(
      region
        .getByRole("row")
        .filter({ has: page.getByRole("button", { name: "PO-2026-1-1", exact: true }) }),
    ).toContainText("received");
    await actions.click();
    await expect(menu.getByRole("menuitem", { name: "Receive stock", exact: true })).toBeDisabled();
    await expect(menu.getByRole("menuitem", { name: "Cancel order", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await region.getByRole("tab", { name: "Stock ledger", exact: true }).click();
    await expect(count).not.toHaveValue("0");
    await region.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(count).toHaveValue("0");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.screenshot({ path: info.outputPath("inventory-phone.png"), animations: "disabled" });
    expect(faults).toEqual([]);
  });

  test(`Vendor SLA snapshots changed measures and records a zero approval in ${primitive}`, async ({
    page,
  }) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await openPlanning(page, primitive, 31);
    const region = page.getByRole("region", { name: "Vendor SLA scorecard", exact: true });
    const draft = region.getByRole("button", { name: "Draft service claim", exact: true });
    await draft.press("Enter");
    const form = page.getByRole("dialog", { name: "Draft service claim", exact: true });
    await nativeOverlay(form, primitive);
    await form
      .getByLabel("Claim note", { exact: true })
      .fill("Review November contracted service shortfall.");
    await form.getByRole("button", { name: "Create draft", exact: true }).click();
    await expect(form).toBeHidden();
    await region.getByRole("tab", { name: "SLA review", exact: true }).click();
    await commit(region.getByLabel("Actual North Pier Orders on time", { exact: true }), "99.5");
    await region.getByRole("tab", { name: "Claims", exact: true }).click();
    const claimRow = region
      .getByRole("row")
      .filter({ has: page.getByRole("button", { name: "CLAIM-2026-1", exact: true }) });
    await claimRow.getByRole("button", { name: "Submit claim", exact: true }).click();
    await expect(region.getByText(/measures changed/i)).toBeVisible();
    await claimRow.getByRole("button", { name: "Refresh", exact: true }).click();
    await claimRow.getByRole("button", { name: "Submit claim", exact: true }).click();
    await expect(claimRow).toContainText("submitted");
    const open = claimRow.getByRole("button", { name: "CLAIM-2026-1", exact: true });
    await open.click();
    const review = page.getByRole("dialog", { name: "Service claim CLAIM-2026-1", exact: true });
    await nativeOverlay(review, primitive);
    await review.getByLabel("Approved credit", { exact: true }).fill("0");
    await review.getByRole("button", { name: "Approve credit", exact: true }).click();
    await expect(review).toBeHidden();
    await expect(open).toBeFocused();
    await expect(claimRow).toContainText("approved");
    await expect(claimRow).toContainText("$0.00");
    expect(faults).toEqual([]);
  });

  test(`Vendor SLA issues and resolves a cure notice after recovery on phone in ${primitive}`, async ({
    page,
  }, info) => {
    await openPlanning(page, primitive, 31, true);
    const region = page.getByRole("region", { name: "Vendor SLA scorecard", exact: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    const issue = region.getByRole("button", { name: "Record cure notice", exact: true });
    await issue.click();
    const form = page.getByRole("dialog", { name: "Record cure notice", exact: true });
    await form
      .getByLabel("Corrective action", { exact: true })
      .fill("Restore the dispatch cutoff checks and review daily.");
    await form.getByRole("button", { name: "Record notice", exact: true }).click();
    await expect(form).toBeHidden();
    await expect(issue).toBeFocused();
    await region.getByRole("tab", { name: "Cure notices", exact: true }).click();
    const resolve = region.getByRole("button", { name: "Resolve notice", exact: true });
    await expect(resolve).toBeDisabled();
    await region.getByRole("tab", { name: "SLA review", exact: true }).click();
    await commit(region.getByLabel("Actual North Pier Orders on time", { exact: true }), "99.5");
    await region.getByRole("tab", { name: "Cure notices", exact: true }).click();
    await expect(resolve).toBeEnabled();
    await resolve.click();
    await expect(region.getByRole("row").filter({ hasText: "CURE-2026-1" })).toContainText(
      "resolved",
    );
    await page.screenshot({ path: info.outputPath("sla-phone.png"), animations: "disabled" });
  });
}
