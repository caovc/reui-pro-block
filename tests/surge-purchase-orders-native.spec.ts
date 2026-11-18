import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light" });
const query = "?purchase=one+two&x=one%20two&x=one+two";
const faults = new WeakMap<Page, { errors: string[]; writes: string[] }>();

test.beforeEach(async ({ page }) => {
  const log = { errors: [] as string[], writes: [] as string[] };
  faults.set(page, log);
  page.on("pageerror", (error) => log.errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) log.errors.push(message.text());
  });
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) log.writes.push(request.method());
  });
});
test.afterEach(async ({ page }, info) => {
  await writeFile(info.outputPath("health.json"), JSON.stringify(faults.get(page), null, 2));
  expect(faults.get(page)).toEqual({ errors: [], writes: [] });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

async function navigate(page: Page, width: number, label: string, suffix: string) {
  const mobile = width === 390;
  if (mobile) await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const navigation = mobile
    ? page.getByRole("dialog")
    : page.locator('.bt-sidebar > [data-slot="sidebar-inner"]');
  const link = navigation.getByRole("link", { name: label, exact: true });
  if (!(await link.isVisible()))
    await navigation.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(link).toHaveAttribute("href", `#/template-preview/surge${suffix}${query}`);
  await link.click();
  await expect(page).toHaveURL(
    new RegExp(
      `/template-preview/surge${suffix.replaceAll("/", "\\/")}\\?purchase=one\\+two&x=one%20two&x=one\\+two$`,
    ),
  );
  if (mobile) {
    await expect(navigation).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(navigation).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
}
async function open(page: Page, primitive: string, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`${primitive === "base" ? "/base" : ""}/#/template-preview/surge${query}`);
  await expect(page.getByRole("heading", { name: /^Welcome to / })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await page.evaluate(() => document.fonts.ready);
  await navigate(page, width, "Purchase orders", "/inventory/purchase-orders");
  return page.getByRole("region", { name: "Purchase orders", exact: true });
}
async function undo(page: Page, message: string) {
  await page
    .locator("[data-sonner-toast]")
    .filter({ hasText: message })
    .getByRole("button", { name: "Undo", exact: true })
    .click();
}

for (const primitive of ["radix", "base"])
  for (const width of [1440, 390]) {
    test(`Surge purchase orders ${primitive} ${width}: navigation, filtering, sorting and paging`, async ({
      page,
    }, info) => {
      const region = await open(page, primitive, width);
      const rows = region.locator('[data-slot="data-grid-table-body"] > tr');
      await expect(rows).toHaveCount(8);
      await expect(region.getByText("6 open", { exact: true })).toBeVisible();
      await page.screenshot({ path: info.outputPath("purchase-orders-default.png") });
      const status = region.getByRole("combobox", { name: "Purchase order status", exact: true });
      await status.click();
      await expect(page.getByRole("option")).toHaveText([
        "All statuses",
        "Draft",
        "Received",
        "Cancelled",
      ]);
      await page.getByRole("option", { name: "Received", exact: true }).click();
      await expect(status).toBeFocused();
      await expect(rows).toHaveCount(3);
      const search = region.getByRole("textbox", { name: "Search purchase orders", exact: true });
      await search.fill("PO-LOCAL-1107");
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText("Aspen Goods");
      await search.fill("");
      await status.click();
      await page.getByRole("option", { name: "All statuses", exact: true }).click();
      await region.getByRole("button", { name: "Go to next page", exact: true }).click();
      await expect(rows).toHaveCount(3);
      await search.fill("Boreal");
      await expect(rows).toHaveCount(3);
      await search.fill("no-matching-order");
      await expect(region).toContainText("No records match your filters.");
      await search.fill("");
      await region
        .getByRole("columnheader", { name: "Total", exact: true })
        .getByRole("button", { name: "Total", exact: true })
        .click();
      const totals = await rows.locator("td:nth-child(3)").allTextContents();
      const values = totals.map((text) => Number(text.replace(/[^0-9.]/g, "")));
      expect(values).toEqual([...values].sort((a, b) => a - b));
      await page.goBack();
      await expect(page.getByRole("heading", { name: /^Welcome to / })).toBeVisible();
      await page.goForward();
      await expect(
        page.getByRole("heading", { name: "Purchase orders", exact: true }),
      ).toBeVisible();
    });

    test(`Surge purchase orders ${primitive} ${width}: Receive confirmation, real inventory and Undo`, async ({
      page,
    }, info) => {
      const region = await open(page, primitive, width);
      const search = region.getByRole("textbox", { name: "Search purchase orders", exact: true });
      await search.fill("PO-LOCAL-1101");
      const trigger = region.getByRole("button", {
        name: "Open actions for PO-LOCAL-1101",
        exact: true,
      });
      await trigger.click();
      await page.getByRole("menuitem", { name: "Receive", exact: true }).click();
      let dialog = page.getByRole("alertdialog", { name: "Receive PO-LOCAL-1101?", exact: true });
      await expect(dialog).toContainText("34 units to Main warehouse");
      await page.screenshot({ path: info.outputPath("receive-confirmation.png") });
      await dialog.getByRole("button", { name: "Keep as draft", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.click();
      await page.getByRole("menuitem", { name: "Receive", exact: true }).click();
      dialog = page.getByRole("alertdialog", { name: "Receive PO-LOCAL-1101?", exact: true });
      await dialog.getByRole("button", { name: "Receive stock", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(region.locator("tbody")).toContainText("Received");
      await expect(trigger).toHaveCount(0);
      await expect(search).toBeFocused();
      await navigate(page, width, "Stock ledger", "/inventory");
      const stock = page.locator("tbody tr").filter({ hasText: "AC-1240" }).locator("td").nth(3);
      await expect(stock).toHaveText("52");
      await undo(page, "Purchase order received locally");
      await expect(stock).toHaveText("28");
      await navigate(page, width, "Purchase orders", "/inventory/purchase-orders");
      await region
        .getByRole("textbox", { name: "Search purchase orders", exact: true })
        .fill("PO-LOCAL-1101");
      await expect(region.locator("tbody")).toContainText("Draft");
    });

    test(`Surge purchase orders ${primitive} ${width}: Cancel is immediate, keeps values and supports Undo`, async ({
      page,
    }, info) => {
      const region = await open(page, primitive, width);
      const search = region.getByRole("textbox", { name: "Search purchase orders", exact: true });
      await search.fill("PO-LOCAL-1101");
      const row = region.locator('[data-slot="data-grid-table-body"] > tr');
      const beforeTotal = await row.locator("td").nth(2).innerText();
      const beforeDate = await row.locator("td").nth(5).textContent();
      await region
        .getByRole("button", { name: "Open actions for PO-LOCAL-1101", exact: true })
        .click();
      await page.getByRole("menuitem", { name: "Cancel", exact: true }).click();
      await expect(page.getByRole("dialog").or(page.getByRole("alertdialog"))).toHaveCount(0);
      await expect(row).toContainText("Cancelled");
      await expect(row.locator("td").nth(2)).toHaveText(beforeTotal);
      await expect(row.locator("td").nth(5)).toHaveText(beforeDate);
      await expect(search).toBeFocused();
      await page.screenshot({ path: info.outputPath("cancelled-order.png") });
      await undo(page, "Purchase order cancelled locally");
      await expect(row).toContainText("Draft");
      await expect(
        region.getByRole("button", { name: "Open actions for PO-LOCAL-1101", exact: true }),
      ).toBeVisible();
    });

    test(`Surge purchase orders ${primitive} ${width}: filtered Cancel removes its row and keeps focus and Undo usable`, async ({
      page,
    }, info) => {
      const region = await open(page, primitive, width);
      const status = region.getByRole("combobox", { name: "Purchase order status", exact: true });
      await status.click();
      await page.getByRole("option", { name: "Draft", exact: true }).click();
      const search = region.getByRole("textbox", { name: "Search purchase orders", exact: true });
      await search.fill("PO-LOCAL-1101");
      const trigger = region.getByRole("button", {
        name: "Open actions for PO-LOCAL-1101",
        exact: true,
      });
      await trigger.click();
      await page.getByRole("menuitem", { name: "Cancel", exact: true }).click();
      await expect(page.getByRole("dialog").or(page.getByRole("alertdialog"))).toHaveCount(0);
      await expect(region).toContainText("No records match your filters.");
      await expect(region.getByText("5 open", { exact: true })).toBeVisible();
      await expect(trigger).toHaveCount(0);
      await expect(search).toBeFocused();
      await page.screenshot({ path: info.outputPath("filtered-cancel.png") });
      await undo(page, "Purchase order cancelled locally");
      await expect(region.locator("tbody > tr")).toContainText("Draft");
      await expect(trigger).toBeVisible();
      await expect(region.getByText("6 open", { exact: true })).toBeVisible();
    });
  }
