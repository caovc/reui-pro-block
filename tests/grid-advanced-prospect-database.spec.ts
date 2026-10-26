import { expect, test } from "@playwright/test";

const route = "./#/preview/data-grid/advanced/data-grid-advanced-22";
const companyRow = (page: import("@playwright/test").Page, name: string) =>
  page
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: `Open ${name}`, exact: true }) });

test("prospects use native pagination and numeric size sorting", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
  await expect(page.locator("tbody tr")).toHaveCount(10);
  const frame = await page.locator(".prospect-database-frame").boundingBox();
  expect(frame).toMatchObject({ x: 112, y: 48, width: 1216 });
  expect((await page.locator("thead tr").boundingBox())?.height).toBe(32);
  const initial = await page.locator("tbody tr").first().innerText();
  await page.getByRole("button", { name: "Go to page 2", exact: true }).click();
  await expect(page.locator("tbody tr").first()).not.toHaveText(initial);
  await page.getByRole("button", { name: "Size", exact: true }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page.locator('th[data-col-id="employees"]')).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect(page.locator("tbody tr").first()).toContainText("Harborline Studio");
  await page.getByRole("combobox", { name: "Rows per page", exact: true }).click();
  await page.getByRole("option", { name: "25", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(25);
});

test("intent cards keep the base-filter denominator and compose My Accounts and search", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("radio", { name: /^High intent, score 70/ }).click();
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await page.getByRole("button", { name: "My Accounts", exact: true }).click();
  await expect(
    page.getByRole("radio", {
      name: "High intent, score 70 and up: 5 of 7, 0 unassigned",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await page
    .getByRole("textbox", { name: "Search companies", exact: true })
    .fill("no-such-company");
  await expect(page.getByText("No Matching Companies", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear Filters", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(10);
  await expect(page.locator('[data-slot="data-grid-pagination"]')).toContainText("of 30 companies");
});

test("owner and status updates change the same record and Undo restores their prior values", async ({
  page,
}) => {
  await page.goto(route);
  const row = companyRow(page, "Alderline Works");
  await row
    .getByRole("button", { name: "Owner of Alderline Works: Kian Bell. Change", exact: true })
    .click();
  await page.getByRole("menuitemradio", { name: /Mara Quinn/ }).click();
  await expect(
    row.getByRole("button", { name: "Owner of Alderline Works: Mara Quinn. Change", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo last account change", exact: true }).click();
  await expect(
    row.getByRole("button", { name: "Owner of Alderline Works: Kian Bell. Change", exact: true }),
  ).toBeVisible();
  await row
    .getByRole("button", { name: "Status for Alderline Works: Contacted. Change", exact: true })
    .click();
  await page.getByRole("menuitemradio", { name: "Qualified", exact: true }).click();
  await expect(row).toContainText("Qualified");
  await page.getByRole("button", { name: "Undo last account change", exact: true }).click();
  await expect(row).toContainText("Contacted");
});

test("company creation validates identity and preserves a genuine zero employee count", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Add Company", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "Headquarters", exact: true }).click();
  const location = page.getByRole("option").filter({ hasText: "Germany" }).first();
  const headquarters = await location.innerText();
  await location.click();
  await expect(dialog.getByRole("combobox", { name: "Headquarters", exact: true })).toContainText(
    headquarters,
  );
  await dialog.getByRole("button", { name: "Increase employees", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Employees", exact: true })).toHaveValue("1");
  await dialog.getByRole("button", { name: "Decrease employees", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Employees", exact: true })).toHaveValue("0");
  await dialog
    .getByRole("textbox", { name: "Company Name", exact: true })
    .fill("Zinc Demo Company");
  await dialog.getByRole("textbox", { name: "Domain", exact: true }).fill("alder.example");
  await dialog.getByRole("button", { name: "Add Company", exact: true }).click();
  await expect(
    dialog.getByText("A company with this domain already exists.", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("textbox", { name: "Domain", exact: true }).fill("zinc-demo.example");
  await dialog.getByRole("button", { name: "Add Company", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add Company", exact: true })).toBeFocused();
  await page.getByRole("textbox", { name: "Search companies", exact: true }).fill("Zinc Demo");
  const sizeIndex = await page
    .locator('th[data-col-id="employees"]')
    .evaluate((cell: HTMLTableCellElement) => cell.cellIndex);
  await expect(companyRow(page, "Zinc Demo Company").getByRole("cell").nth(sizeIndex)).toHaveText(
    "0",
  );
  await page.getByRole("button", { name: "Undo last account change", exact: true }).click();
  await expect(page.getByText("No Matching Companies", { exact: true })).toBeVisible();
});

test("deletion requires confirmation and Undo restores the account's detail content", async ({
  page,
}) => {
  await page.goto(route);
  await companyRow(page, "Alderline Works")
    .getByRole("button", { name: "Actions for Alderline Works", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Delete Alderline Works?");
  await page.getByRole("button", { name: "Keep", exact: true }).click();
  await expect(companyRow(page, "Alderline Works")).toBeVisible();
  await companyRow(page, "Alderline Works")
    .getByRole("button", { name: "Actions for Alderline Works", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open Alderline Works", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Undo last account change", exact: true }).click();
  await page.getByRole("button", { name: "Open Alderline Works", exact: true }).click();
  await page.getByRole("tab", { name: /^Contacts/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Ada Rowan");
});

test("company tabs contain real contacts and signals and list creation changes the same book", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Open Alderline Works", exact: true }).click();
  await page.getByRole("tab", { name: /^Contacts/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /^Signals/ })).toHaveAttribute("data-state", "active");
  await expect(page.getByRole("tabpanel")).toContainText("Explored team pricing");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open Alderline Works", exact: true }),
  ).toBeFocused();
  await companyRow(page, "Alderline Works")
    .getByRole("button", { name: "Actions for Alderline Works", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Save to list", exact: true }).hover();
  await page.getByRole("menuitem", { name: "New list", exact: true }).click();
  await page.getByRole("textbox", { name: "List name", exact: true }).fill("Review next week");
  await page.getByRole("button", { name: "Create list", exact: true }).click();
  await page.getByRole("button", { name: "Open Alderline Works", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Review next week");
});

test("handover changes open account owners and retains closed accounts", async ({ page }) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Hand Over", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("2 closed accounts");
  await page.getByRole("button", { name: "Hand Over 5 Accounts", exact: true }).click();
  await page.getByRole("button", { name: "My Accounts", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(page.locator("tbody")).toContainText("Grove & Grain");
  await expect(page.locator("tbody")).toContainText("Oakstream Finance");
  await page.getByRole("button", { name: "Undo last account change", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(7);
});

test("detail Status is a real Select and its update shares row state and Undo", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Open Alderline Works", exact: true }).click();
  const sheet = page.getByRole("dialog");
  const status = sheet.getByRole("combobox", { name: "Status", exact: true });
  await expect(status).toHaveAttribute("data-slot", "select-trigger");
  await expect(status).toContainText("Contacted");
  await status.click();
  await page.getByRole("option", { name: "Qualified", exact: true }).click();
  await expect(status).toContainText("Qualified");
  await page.keyboard.press("Escape");
  await expect(companyRow(page, "Alderline Works")).toContainText("Qualified");
  await page.getByRole("button", { name: "Undo last account change", exact: true }).click();
  await page.getByRole("button", { name: "Open Alderline Works", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Status", exact: true })).toContainText(
    "Contacted",
  );
});

test("detail More actions assigns, exports, edits and confirms deletion against the same raw account", async ({
  page,
}) => {
  await page.goto(route);
  const open = () =>
    page.getByRole("button", { name: "Open Alderline Works", exact: true }).click();
  const more = () => page.getByRole("button", { name: "More actions", exact: true }).click();
  await open();
  await more();
  await page.getByRole("menuitem", { name: "Assign owner", exact: true }).hover();
  await page.getByRole("menuitemradio", { name: /Mara Quinn/ }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", {
      name: "Owner of Alderline Works: Mara Quinn. Change",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Undo last account change", exact: true }).click();
  await open();
  await expect(
    page.getByRole("dialog").getByRole("button", {
      name: "Owner of Alderline Works: Kian Bell. Change",
      exact: true,
    }),
  ).toBeVisible();
  await more();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export CSV", exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("prospect-alderline-works.csv");
  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();
  let csv = "";
  for await (const chunk of stream!) csv += chunk.toString();
  expect(csv).toContain('"Alderline Works"');
  expect(csv).toContain('"alder.example"');
  expect(csv.trim().split("\n")).toHaveLength(2);
  await more();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Company Name", exact: true })).toHaveValue(
    "Alderline Works",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open Alderline Works", exact: true }),
  ).toBeFocused();
  await open();
  await more();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open Alderline Works", exact: true }),
  ).toBeFocused();
  await open();
  await more();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  const confirmation = page.getByRole("alertdialog", {
    name: "Delete Alderline Works?",
    exact: true,
  });
  await confirmation.getByRole("button", { name: "Keep", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await more();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await confirmation.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open Alderline Works", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Undo last account change", exact: true }).click();
  await open();
  await page.getByRole("tab", { name: /^Contacts/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Ada Rowan");
});

test("detail contacts stay compact and signals read title then description then date", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Open Alderline Works", exact: true }).click();
  await page.getByRole("tab", { name: /^Contacts/ }).click();
  const contact = page.locator(".prospect-contact-row").first();
  expect((await contact.boundingBox())!.height).toBe(54);
  expect((await contact.locator('[data-slot="avatar"]').boundingBox())!.width).toBe(32);
  await expect(
    contact.getByRole("button", { name: "Copy Ada Rowan's email", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /^Signals/ }).click();
  const order = await page
    .locator('[data-slot="timeline-item"]')
    .first()
    .evaluate((element) => {
      const title = element.querySelector('[data-slot="timeline-title"]')!;
      const description = element.querySelector('[data-slot="timeline-content"] p')!;
      const date = element.querySelector('[data-slot="timeline-date"]')!;
      return {
        titleBeforeDescription: !!(
          title.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
        descriptionBeforeDate: !!(
          description.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
        validDate: /^\d{4}-\d{2}-\d{2}$/.test(date.getAttribute("datetime") ?? ""),
      };
    });
  expect(order).toEqual({
    titleBeforeDescription: true,
    descriptionBeforeDate: true,
    validDate: true,
  });
});

test("free Cascader updates actual native visibility and Settings reset restores it", async ({
  page,
}) => {
  await page.goto(route);
  await expect(page.locator('th[data-col-id="hq"]')).toHaveCount(0);
  await page.getByRole("combobox", { name: "Columns", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("option", { name: /^Firmographics/ }).click();
  await page.getByRole("option", { name: /^HQ(?:,|$)/ }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator('th[data-col-id="hq"]')).toHaveCount(1);
  expect(await page.locator('[data-slot="data-grid-table-resize-handle"]').count()).toBeGreaterThan(
    0,
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Resizable columns", { exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="data-grid-table-resize-handle"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Reset Columns", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator('th[data-col-id="hq"]')).toHaveCount(0);
});

test("phone search and independent summary/table scrollers retain native pinned company cells", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const frame = await page.locator(".prospect-database-frame").boundingBox();
  expect(frame).toMatchObject({ x: 16, y: 32, width: 358 });
  await expect(
    page.getByRole("textbox", { name: "Search companies", exact: true }),
  ).not.toBeVisible();
  const summary = page.locator(".prospect-intents-viewport");
  expect(await summary.evaluate((element) => element.clientWidth)).toBe(324);
  const viewport = page.locator('.prospect-database-panel [data-slot="scroll-area-viewport"]');
  await summary.evaluate((element) => {
    element.scrollLeft = 556;
  });
  await expect.poll(() => summary.evaluate((element) => element.scrollLeft)).toBeGreaterThan(300);
  expect(await viewport.evaluate((element) => element.scrollLeft)).toBe(0);
  await viewport.evaluate((element) => {
    element.scrollLeft = 450;
  });
  await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(300);
  const pinned = page.locator('thead th[data-col-id="company"]');
  await expect(pinned).toHaveAttribute("data-pinned", "start");
  expect((await pinned.boundingBox())!.x).toBeGreaterThanOrEqual(16);
  await page.getByRole("button", { name: "Search companies", exact: true }).click();
  await page.getByRole("textbox", { name: "Search companies", exact: true }).fill("Alderline");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  expect(errors).toEqual([]);
});
