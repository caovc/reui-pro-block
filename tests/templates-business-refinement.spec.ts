import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, id: string) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/#/template-preview/${id}`);
  await expect(page.locator(`.bt-${id}`)).toBeVisible({ timeout: 15000 });
}
async function atlasPage(page: Page, name: string) {
  await open(page, "atlas");
  await page.getByRole("button", { name: "Users", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
}

test("Atlas permissions retain scoped edits only after saving and support a custom role", async ({
  page,
}) => {
  await atlasPage(page, "Roles & Permissions");
  const permission = page.getByRole("switch", { name: "Member: Invite members", exact: true });
  await expect(permission).toBeChecked();
  await permission.click();
  await expect(page.getByRole("status")).toContainText("Unsaved changes");
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(permission).toBeChecked();
  await permission.click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Roles & Permissions", exact: true }).click();
  await expect(permission).not.toBeChecked();
  await page.getByRole("button", { name: "Create role", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New Role", exact: true });
  await dialog.getByLabel("Role name", { exact: true }).fill("Operations");
  await dialog.getByLabel("Description", { exact: true }).fill("Incident response access");
  await dialog.getByRole("button", { name: "Create role", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Operations" })).toBeVisible();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Roles & Permissions", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Operations" })).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Owner: Read members", exact: true }),
  ).toBeDisabled();
});

test("Atlas access decisions affect only the chosen requester and audit events resolve separately", async ({
  page,
}) => {
  await atlasPage(page, "Access Control");
  const sana = page.getByRole("row").filter({ hasText: "Sana Qureshi" });
  await sana.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(sana).toContainText("Approved");
  await expect(page.getByRole("row").filter({ hasText: "David Kim" })).toContainText("Pending");
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Access Control", exact: true }).click();
  await expect(sana).toContainText("Approved");
  await page.getByRole("button", { name: "Audit Log", exact: true }).click();
  await page.getByRole("button", { name: /Delete production API key/ }).click();
  await page.getByRole("button", { name: "Mark resolved", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "EVT-4822" })).toContainText("Resolved");
});

test("Verve quota plan supports inline drafts, discard, sign off and saved navigation", async ({
  page,
}) => {
  await open(page, "verve");
  await page.getByRole("button", { name: "Quota Plan", exact: true }).click();
  const quota = page.getByRole("spinbutton", { name: "Quota for Leo Grant", exact: true });
  await quota.fill("215000");
  await expect(page.getByRole("status")).toContainText("1 unsaved change");
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(quota).toHaveValue("190000");
  await quota.fill("215000");
  await page.getByRole("switch", { name: "Sign off Nora Vale", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Quota Plan", exact: true }).click();
  await expect(quota).toHaveValue("215000");
  await expect(page.getByRole("switch", { name: "Sign off Nora Vale", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Add rep", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("1 unsaved change");
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
});

test("Verve quick stats and attainment are distinct reports with working filters and expansion", async ({
  page,
}) => {
  await open(page, "verve");
  await page.getByRole("button", { name: "Quick Stats", exact: true }).click();
  await expect(page.getByText("Pipeline by Source", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Week", exact: true }).click();
  await expect(page.locator(".bt-source-totals")).toContainText("$842K");
  await page.getByRole("combobox", { name: "Stage metric", exact: true }).click();
  await page.getByRole("option", { name: "Value", exact: true }).click();
  await expect(page.locator(".bt-stage-list")).toContainText("$1250K");
  await page.getByRole("button", { name: "New log", exact: true }).click();
  const log = page.getByRole("dialog", { name: "New time log", exact: true });
  await log.getByLabel("Rep name", { exact: true }).fill("Record Rep");
  await log.getByLabel("Account", { exact: true }).fill("Harbor Labs");
  await log.getByLabel("Hours", { exact: true }).fill("1.5");
  await log.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Quick Stats", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Record Rep" })).toContainText("1.5h");
  await page.getByRole("button", { name: "Attainment", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Leo Grant", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Collapse All", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Leo Grant", exact: true })).toBeHidden();
  await page.getByRole("tab", { name: "Quota", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Enterprise" })).toContainText("$404,400");
  await page.getByRole("button", { name: "New Target", exact: true }).click();
  const target = page.getByRole("dialog", { name: "New Target", exact: true });
  await target.getByLabel("Segment name", { exact: true }).fill("Strategic");
  await target.getByLabel("Monthly quota", { exact: true }).fill("100000");
  await target.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Attainment", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Strategic" })).toContainText("$100,000");
});

test("Cohort hiring uses five actual Kanban columns and keeps a candidate's notes and stage", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/cohort");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: "Hiring", exact: true }).click();
  await expect(page.locator('[data-slot="kanban-column"]')).toHaveCount(5);
  await expect(page.locator('[data-slot="kanban-item"]')).toHaveCount(12);
  await page.getByRole("button", { name: "Yara Lindholm Senior Engineer", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Yara Lindholm", exact: true });
  await sheet.getByRole("combobox", { name: "Pipeline stage", exact: true }).click();
  await page.getByRole("option", { name: "Interview", exact: true }).click();
  await sheet.getByLabel("Hiring notes", { exact: true }).fill("Technical panel complete");
  await sheet.getByLabel("Interview date", { exact: true }).fill("2026-08-12");
  await sheet.getByRole("button", { name: "Save candidate", exact: true }).click();
  await expect(sheet).toBeHidden();
  const interview = page
    .locator('[data-slot="kanban-column"]')
    .filter({ has: page.locator("header").filter({ hasText: "Interview" }) });
  await expect(interview).toContainText("Yara Lindholm");
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Hiring", exact: true }).click();
  await page.getByRole("button", { name: "Yara Lindholm Senior Engineer", exact: true }).click();
  await expect(sheet.getByLabel("Hiring notes", { exact: true })).toHaveValue(
    "Technical panel complete",
  );
});

test("Miro patient directory creates and edits a record while sidebar search follows the same data", async ({
  page,
}) => {
  await open(page, "miro");
  await page.getByRole("button", { name: "Customers", exact: true }).first().click();
  await page.getByRole("button", { name: "+ Add Patient", exact: true }).click();
  const add = page.getByRole("dialog", { name: "Add patient", exact: true });
  await add.getByLabel("Full name", { exact: true }).fill("Harriet Wilson");
  await add.getByLabel("Email address", { exact: true }).fill("harriet@example.com");
  await add.getByLabel("Phone number", { exact: true }).fill("+44 123 4567");
  await add.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("textbox", { name: "Search clinic records", exact: true }).fill("Harriet");
  await page.locator(".bt-clinic-person").filter({ hasText: "Harriet Wilson" }).click();
  const sheet = page.getByRole("dialog", { name: "Harriet Wilson", exact: true });
  await sheet.getByRole("button", { name: "Edit patient", exact: true }).click();
  await sheet.getByLabel("Email address", { exact: true }).fill("harriet.updated@example.com");
  await sheet.getByRole("button", { name: "Save patient", exact: true }).click();
  await expect(sheet).toContainText("harriet.updated@example.com");
  await sheet.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search patient directory", exact: true })
    .fill("Harriet");
  await expect(
    page.locator(".bt-sidebar").getByRole("button", { name: /Harriet Wilson/ }),
  ).toBeVisible();
  await expect(
    page.locator(".bt-sidebar").getByRole("button", { name: /Elsa Lindqvist/ }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Customers", exact: true }).first().click();
  await expect(page.getByRole("row").filter({ hasText: "Harriet Wilson" })).toContainText(
    "harriet.updated@example.com",
  );
});

test("Miro treatment ledger records a payment and retains it when leaving and returning", async ({
  page,
}) => {
  await open(page, "miro");
  await page.getByRole("button", { name: "Payments", exact: true }).first().click();
  const gregory = page.getByRole("row").filter({ hasText: "INV-20261023-4" });
  await expect(gregory).toContainText("Open");
  await gregory.getByRole("button", { name: /Gregory Whitfield/ }).click();
  const sheet = page.getByRole("dialog", { name: "INV-20261023-4", exact: true });
  await sheet.getByRole("button", { name: "Record payment", exact: true }).click();
  await expect(sheet.getByRole("button", { name: "Record payment", exact: true })).toBeDisabled();
  await sheet.getByRole("button", { name: "Close", exact: true }).last().click();
  await expect(gregory).toContainText("Paid");
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Payments", exact: true }).first().click();
  await expect(gregory).toContainText("Paid");
  await expect(page.locator(".bt-treatment-billed")).toContainText("$1,030");
});

test("Miro staff uses five visit columns and saves a treatment status without changing the next visit", async ({
  page,
}) => {
  await open(page, "miro");
  await page.getByRole("button", { name: "Staff", exact: true }).first().click();
  await expect(page.locator('[data-slot="kanban-column"]')).toHaveCount(5);
  const visit = page
    .locator('[data-slot="kanban-item"]')
    .filter({ hasText: "Ifeoma Okafor" })
    .first();
  await visit.locator("button").filter({ hasText: "General Checkup" }).click();
  const sheet = page.getByRole("dialog", { name: "Ifeoma Okafor", exact: true });
  await sheet.getByRole("combobox", { name: "Visit status", exact: true }).click();
  await page.getByRole("option", { name: "Arrived", exact: true }).click();
  await sheet.getByRole("button", { name: "Save visit", exact: true }).click();
  await expect(visit).toContainText("Arrived");
  await expect(
    page.locator('[data-slot="kanban-item"]').filter({ hasText: "Samir Haddad" }).first(),
  ).toContainText("Done");
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await page.getByRole("button", { name: "Staff", exact: true }).first().click();
  await expect(visit).toContainText("Arrived");
});

for (const id of ["manifest", "surge"]) {
  test(`${id} saves the complete product editor, original media and variants then exposes orders and customers`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/#/template-preview/${id}`);
    if (id === "manifest") await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.getByRole("button", { name: "New product", exact: true }).click();
    await page.getByRole("textbox", { name: "Title", exact: true }).fill("Studio travel tote");
    await page.getByRole("textbox", { name: "Subtitle", exact: true }).fill("Everyday carry");
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("A durable tote for daily essentials.");
    await page.getByRole("textbox", { name: "Collections", exact: true }).fill("Studio collection");
    await page.getByRole("textbox", { name: "Tags", exact: true }).fill("travel, canvas");
    await page.getByRole("combobox", { name: "Type", exact: true }).click();
    await page.getByRole("option", { name: "Digital", exact: true }).click();
    await page.getByRole("button", { name: "Add variant", exact: true }).click();
    await page.getByRole("textbox", { name: "Variant 1 color", exact: true }).fill("Sand");
    await page.getByRole("textbox", { name: "Variant 1 size", exact: true }).fill("Large");
    await page.getByRole("textbox", { name: "Variant 1 sku", exact: true }).fill("ST-001");
    await page.getByRole("spinbutton", { name: "Variant 1 price", exact: true }).fill("149.50");
    await page.getByRole("spinbutton", { name: "Variant 1 inventory", exact: true }).fill("7");
    await page.locator('input[type="file"]').setInputFiles({
      name: "original-tote.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="#8c725d"/></svg>',
      ),
    });
    await page.getByRole("button", { name: "Create product", exact: true }).click();
    const row = page.getByRole("row").filter({ hasText: "Studio travel tote" });
    await expect(row).toContainText("7 in stock");
    await row.getByRole("button", { name: /Studio travel tote/ }).click();
    await expect(page.getByRole("textbox", { name: "Subtitle", exact: true })).toHaveValue(
      "Everyday carry",
    );
    await expect(page.getByRole("textbox", { name: "Description", exact: true })).toHaveValue(
      "A durable tote for daily essentials.",
    );
    await expect(page.getByRole("textbox", { name: "Collections", exact: true })).toHaveValue(
      "Studio collection",
    );
    await expect(page.getByRole("textbox", { name: "Tags", exact: true })).toHaveValue(
      "travel, canvas",
    );
    await expect(page.getByRole("combobox", { name: "Type", exact: true })).toContainText(
      "Digital",
    );
    await expect(page.getByRole("img", { name: "original-tote.svg", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Remove variant 1", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(row).toContainText("0 in stock");
    await page.getByRole("button", { name: "Orders", exact: true }).click();
    await expect(page.getByText("All orders", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "New order", exact: true }).click();
    await expect(page.getByRole("heading", { name: "New order", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Create order", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Choose the customer");
    await page.getByRole("combobox", { name: "Order customer", exact: true }).click();
    await page.getByRole("option", { name: "Maya Thompson", exact: true }).click();
    await page.getByRole("combobox", { name: "Item 1 product", exact: true }).click();
    await page.getByRole("option", { name: "Alpine Down Vest", exact: true }).click();
    await page.getByRole("combobox", { name: "Item 1 variant", exact: true }).click();
    await page.getByRole("option", { name: "Black / XS", exact: true }).click();
    await page.getByRole("textbox", { name: "Item 1 quantity", exact: true }).fill("2");
    await page.getByRole("textbox", { name: "Item 1 quantity", exact: true }).press("Tab");
    await expect(page.getByLabel("Order total", { exact: true })).toHaveText("$388.68");
    await page.getByRole("button", { name: "Add item", exact: true }).click();
    await page.getByRole("combobox", { name: "Item 2 product", exact: true }).click();
    await page.getByRole("option", { name: "Boxy Pocket Tee", exact: true }).click();
    await page.getByRole("combobox", { name: "Item 2 variant", exact: true }).click();
    await page.getByRole("option", { name: "Black / XS", exact: true }).click();
    await expect(page.getByLabel("Order total", { exact: true })).toHaveText("$424.32");
    await page.getByRole("button", { name: "Remove item 2", exact: true }).click();
    await expect(page.getByLabel("Order total", { exact: true })).toHaveText("$388.68");
    await page.getByRole("combobox", { name: "Shipping method", exact: true }).click();
    await page.getByRole("option", { name: /Standard Delivery/ }).click();
    await page.getByRole("combobox", { name: "Shipping location", exact: true }).click();
    await page.getByRole("option", { name: "London Store", exact: true }).click();
    await expect(page.getByLabel("Order total", { exact: true })).toHaveText("$378.68");
    await page.getByRole("button", { name: "Create order", exact: true }).click();
    await expect(
      page.getByRole("row").filter({ hasText: "Maya Thompson" }).filter({ hasText: "$378.68" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Customers", exact: true }).click();
    await page.getByRole("button", { name: "Add customer", exact: true }).click();
    const customer = page.getByRole("dialog", { name: "Add customer", exact: true });
    await customer.getByLabel("Customer name", { exact: true }).fill("Avery Review");
    await customer.getByLabel("Email address", { exact: true }).fill("avery.review@example.com");
    await customer.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("row").filter({ hasText: "Avery Review" })).toContainText(
      "avery.review@example.com",
    );
  });
}
