import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ colorScheme: "light", deviceScaleFactor: 1 });
const query = "?time=one+two&x=one%20two&x=one+two";
const faults = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  faults.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
});
test.afterEach(async ({ page }, info) => {
  await writeFile(info.outputPath("health.json"), JSON.stringify(faults.get(page), null, 2));
  expect(faults.get(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
async function open(page: Page, primitive: string, width: number, initialScreenshot?: string) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`${primitive === "base" ? "/base" : ""}/#/template-preview/atlas${query}`);
  await expect(page).toHaveTitle(/Bricklane/);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  const region = page.getByRole("region", { name: "Timesheets", exact: true });
  await expect(region.getByRole("heading", { name: "Timesheets", exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (initialScreenshot) await page.screenshot({ path: initialScreenshot });
  await region.scrollIntoViewIfNeeded();
  return region;
}
async function facet(page: Page, name: string, values: string[]) {
  const region = page.getByRole("region", { name: "Timesheets", exact: true });
  const trigger = region.getByRole("button", { name: new RegExp(`^${name}`) }).first();
  await trigger.click();
  for (const value of values) await page.getByRole("option", { name: value, exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(trigger).toBeFocused();
}
async function navigate(page: Page, width: number, name: string) {
  if (width === 390) await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const navigation =
    width === 390
      ? page.getByRole("dialog")
      : page.locator('.bt-sidebar > [data-slot="sidebar-inner"]');
  await navigation.getByRole("button", { name, exact: true }).click();
  if (width === 390) await expect(navigation).toHaveCount(0);
}
for (const primitive of ["radix", "base"])
  for (const width of [1440, 390]) {
    test(`Atlas timesheets ${primitive} ${width}: real facets, totals, sorting and pagination`, async ({
      page,
    }, info) => {
      const region = await open(page, primitive, width, info.outputPath("initial-viewport.png"));
      const rows = region.locator("tbody tr");
      await expect(rows).toHaveCount(5);
      await expect(region.getByRole("columnheader")).toHaveCount(9);
      await expect(
        region.getByRole("columnheader", { name: "Sun, Nov 22", exact: true }),
      ).toBeVisible();
      await expect(region).toContainText("1 - 5 of 9 people");
      await page.screenshot({ path: info.outputPath("default-timesheets.png") });
      await region.getByRole("button", { name: "Go to next page", exact: true }).click();
      await expect(rows).toHaveCount(4);
      await expect(rows.first()).toContainText("Noah Reed");
      await facet(page, "People", ["Amara Ortiz"]);
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText("Amara Ortiz");
      await expect(rows.first().getByRole("cell").last()).toContainText("30h");
      await facet(page, "Billable status", ["Non-billable"]);
      await expect(rows.first().getByRole("cell").last()).toContainText("4h 30m");
      await expect(rows.first().getByRole("cell").last()).toContainText("0h billable");
      await region.getByRole("button", { name: "Clear filters", exact: true }).click();
      await facet(page, "Tracked time", ["Less than 20 hours", "More than 40 hours"]);
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText("Eli Morgan");
      await region.getByRole("button", { name: "Clear filters", exact: true }).click();
      await region
        .getByRole("columnheader", { name: "Total", exact: true })
        .getByRole("button", { name: "Total", exact: true })
        .click();
      await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
      await expect(rows.first()).toContainText("Eli Morgan");
      const size = region.getByRole("combobox", { name: "Rows per page", exact: true });
      await size.click();
      await page.getByRole("option", { name: "10", exact: true }).click();
      await expect(size).toBeFocused();
      await expect(rows).toHaveCount(9);
      await expect(region).toContainText("1 - 9 of 9 people");
    });

    test(`Atlas timesheets ${primitive} ${width}: staged date range changes actual dated totals`, async ({
      page,
    }, info) => {
      const region = await open(page, primitive, width);
      await region.getByRole("button", { name: "Next time period", exact: true }).click();
      await expect(
        region.getByRole("columnheader", { name: "Mon, Nov 23", exact: true }),
      ).toBeVisible();
      await expect(region.locator("tbody tr").first().getByRole("cell").last()).toContainText("0h");
      await region.getByRole("button", { name: "Previous time period", exact: true }).click();
      const trigger = region.getByRole("button", { name: /^Choose timesheet dates:/ });
      await trigger.click();
      const picker = page.locator(".atlas-time-range-popover");
      await expect(picker.getByRole("grid")).toBeVisible();
      await picker.getByRole("button").filter({ hasText: /^18$/ }).click();
      await expect
        .poll(() =>
          picker
            .locator('input[type="date"]')
            .evaluateAll((inputs) =>
              inputs.some((input) => (input as HTMLInputElement).value === "2026-11-18"),
            ),
        )
        .toBe(true);
      await picker.getByLabel("Start date", { exact: true }).fill("2026-11-18");
      await picker.getByLabel("End date", { exact: true }).fill("2026-11-20");
      await picker.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(picker).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(region.getByRole("columnheader")).toHaveCount(9);
      await trigger.click();
      await picker.getByLabel("Start date", { exact: true }).fill("2026-11-18");
      await picker.getByLabel("End date", { exact: true }).fill("2026-11-20");
      await picker.getByRole("button", { name: "Apply dates", exact: true }).click();
      await expect(picker).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(region.getByRole("columnheader")).toHaveCount(5);
      await expect(
        region.getByRole("columnheader", { name: "Wed, Nov 18", exact: true }),
      ).toBeVisible();
      await expect(region.locator("tbody tr").first().getByRole("cell").last()).toContainText(
        "17h",
      );
      await trigger.click();
      await picker.getByLabel("End date", { exact: true }).fill("2027-01-01");
      await expect(picker.getByRole("button", { name: "Apply dates", exact: true })).toBeDisabled();
      await page.screenshot({ path: info.outputPath("range-validation.png") });
      await page.keyboard.press("Escape");
      await expect(picker).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(region.getByRole("columnheader")).toHaveCount(5);
    });

    test(`Atlas timesheets ${primitive} ${width}: create and edit time persists across dashboard and Reports`, async ({
      page,
    }, info) => {
      const region = await open(page, primitive, width);
      const opener = region.getByRole("button", { name: "New entry", exact: true });
      await opener.click();
      let dialog = page.getByRole("dialog", { name: "New time entry", exact: true });
      await dialog.getByLabel("Hours", { exact: true }).fill("23");
      await dialog.getByRole("button", { name: "Save entry", exact: true }).click();
      await expect(dialog.getByRole("alert")).toContainText("daily total over 24 hours");
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      await opener.click();
      dialog = page.getByRole("dialog", { name: "New time entry", exact: true });
      await dialog.getByLabel("Hours", { exact: true }).fill("1.5");
      await dialog.getByLabel("Note", { exact: true }).fill("Client planning session");
      await page.screenshot({ path: info.outputPath("new-entry.png") });
      await dialog.getByRole("button", { name: "Save entry", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      const day = region.getByRole("button", {
        name: "Time for Amara Ortiz, Nov 16, 2026: 7h 30m",
        exact: true,
      });
      await day.click();
      dialog = page.getByRole("dialog", { name: "Daily time entries", exact: true });
      await expect(dialog).toContainText("Client planning session");
      await dialog
        .getByRole("button", { name: "Edit 1h 30m entry for Amara Ortiz", exact: true })
        .click();
      dialog = page.getByRole("dialog", { name: "Edit time entry", exact: true });
      await expect(dialog.getByLabel("Hours", { exact: true })).toHaveValue("1.5");
      await dialog.getByLabel("Hours", { exact: true }).fill("2.25");
      await dialog.getByRole("combobox", { name: "Work type", exact: true }).click();
      await page.getByRole("option", { name: "Support", exact: true }).click();
      await dialog.getByRole("checkbox", { name: "Billable time", exact: true }).uncheck();
      await dialog.getByLabel("Note", { exact: true }).fill("Updated support follow-up");
      await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      const savedDay = region.getByRole("button", {
        name: "Time for Amara Ortiz, Nov 16, 2026: 8h 15m",
        exact: true,
      });
      await expect(savedDay).toBeFocused();
      await expect(region.locator("tbody tr").first().getByRole("cell").last()).toContainText(
        "32h 15m",
      );
      await navigate(page, width, "Deals");
      await expect(page.getByRole("main").getByText("Open deals", { exact: true })).toBeVisible();
      await navigate(page, width, "Reports");
      await expect(savedDay).toBeVisible();
      await savedDay.click();
      dialog = page.getByRole("dialog", { name: "Daily time entries", exact: true });
      await expect(dialog).toContainText("Updated support follow-up");
      await expect(dialog).toContainText("Support · Non-billable");
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(savedDay).toBeFocused();
      await expect(page).toHaveURL(new RegExp(`/atlas\\?time=one\\+two&x=one%20two&x=one\\+two$`));
    });

    test(`Atlas timesheets ${primitive} ${width}: View entry reveals a different person and week`, async ({
      page,
    }) => {
      const region = await open(page, primitive, width);
      await region.getByRole("button", { name: "New entry", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "New time entry", exact: true });
      await dialog.getByRole("combobox", { name: "Team member", exact: true }).click();
      await page.getByRole("option", { name: "Nina Patel", exact: true }).click();
      await dialog.getByLabel("Entry date", { exact: true }).fill("2026-11-24");
      await dialog.getByLabel("Hours", { exact: true }).fill("1");
      await dialog.getByRole("button", { name: "Save entry", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await navigate(page, width, "Deals");
      await expect(page.getByRole("main").getByText("Open deals", { exact: true })).toBeVisible();
      await page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "Time entry added" })
        .getByRole("button", { name: "View entry", exact: true })
        .click();
      await expect(region.locator("tbody tr")).toHaveCount(1);
      await expect(region.locator("tbody tr")).toContainText("Nina Patel");
      await expect(
        region.getByRole("columnheader", { name: "Tue, Nov 24", exact: true }),
      ).toBeVisible();
      await expect(
        region.getByRole("button", { name: "Time for Nina Patel, Nov 24, 2026: 1h", exact: true }),
      ).toBeVisible();
      await region.getByRole("button", { name: "Previous time period", exact: true }).click();
      await region.getByRole("button", { name: "Next time period", exact: true }).click();
      await expect(
        region.getByRole("button", { name: "Time for Nina Patel, Nov 24, 2026: 1h", exact: true }),
      ).toBeVisible();
    });
  }
