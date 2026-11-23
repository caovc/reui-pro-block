import { test, expect as baseExpect, type Page, type Locator } from "@playwright/test";
import { readFile } from "node:fs/promises";

type Primitive = "radix" | "base";
const expect = baseExpect.configure({ timeout: 5000 });
test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ colorScheme: "light", deviceScaleFactor: 1, actionTimeout: 5000, trace: "on" });
const faults = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  faults.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }, info) => {
  await info.attach("margin-runtime-faults", {
    body: JSON.stringify(faults.get(page)),
    contentType: "application/json",
  });
  expect(faults.get(page)).toEqual([]);
});

async function open(
  page: Page,
  baseURL: string | undefined,
  primitive: Primitive,
  route: string,
  heading: string,
  phone = false,
) {
  if (!baseURL) throw new Error("Bound combined artifact required");
  await page.setViewportSize(phone ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  const root = new URL("./", baseURL);
  if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -5);
  const entry = new URL(primitive === "base" ? "base/" : "./", root);
  const query = new URLSearchParams({
    preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
  });
  await page.goto(`${entry}#/template-preview/margin/${route}?${query}`);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", "nova");
  await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Finance pages", exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function choose(page: Page, trigger: Locator, option: string) {
  await trigger.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function download(page: Page, button: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: button, exact: true }).click();
  const result = await pending;
  return await readFile((await result.path())!, "utf8");
}

async function closeDialog(page: Page, dialog: Locator, opener: Locator) {
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
  await expect(opener).toBeFocused();
}

for (const primitive of ["radix", "base"] as const) {
  test(`Margin ${primitive}: phone invoice payment, local creation and CSV retain exact balances`, async ({
    page,
    baseURL,
  }, info) => {
    await open(page, baseURL, primitive, "cash/receivables", "Receivables", true);
    const view = page.getByRole("button", { name: "View BL-2010", exact: true });
    await view.click();
    const detail = page.getByRole("dialog", { name: "BL-2010 · Alder Workshop", exact: true });
    await expect(detail).toHaveAttribute(
      primitive === "base" ? "data-open" : "data-state",
      primitive === "base" ? "" : "open",
    );
    await expect(detail).toContainText("$16,800.00 outstanding");
    await detail.getByLabel("Amount", { exact: true }).fill("100");
    await detail.getByLabel("Activity note", { exact: true }).fill("Bank transfer confirmed");
    await detail.getByRole("button", { name: "Record activity", exact: true }).click();
    await expect(detail).toContainText("$16,700.00 outstanding");
    await expect(
      detail.getByText("Bank transfer confirmed · $100.00", { exact: true }),
    ).toBeVisible();
    await choose(
      page,
      detail.getByRole("combobox", { name: "Collection action", exact: true }),
      "Log reminder",
    );
    await expect(detail.getByLabel("Amount", { exact: true })).toHaveCount(0);
    await detail
      .getByLabel("Activity note", { exact: true })
      .fill("Please confirm the remaining payment date");
    await detail.getByRole("button", { name: "Record activity", exact: true }).click();
    await expect(
      detail
        .locator('[data-slot="timeline-content"]')
        .filter({ hasText: "Please confirm the remaining payment date" }),
    ).toHaveText("Please confirm the remaining payment date");
    await expect(detail).toContainText("$16,700.00 outstanding");
    await detail.screenshot({ path: info.outputPath("invoice-payment-phone.png") });
    await closeDialog(page, detail, view);
    await page.getByRole("button", { name: "New invoice", exact: true }).click();
    const create = page.getByRole("dialog", { name: "Create local invoice", exact: true });
    await create.getByLabel("Customer", { exact: true }).fill("Cedar Assembly");
    await create.getByRole("button", { name: "Create invoice", exact: true }).click();
    await expect(create).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    await page.getByLabel("Search invoices", { exact: true }).fill("Cedar Assembly");
    await expect(page.getByRole("row", { name: /BL-2013 Cedar Assembly/ })).toContainText(
      "$2,500.00",
    );
    const csv = await download(page, "Export invoices");
    expect(csv).toContain('"BL-2013","Cedar Assembly","Studio","2026-12-04","2500","2500"');
    expect(csv).not.toContain('"BL-2010"');
    await page.getByLabel("Search invoices", { exact: true }).fill("");
    await choose(
      page,
      page.getByRole("combobox", { name: "Invoice period", exact: true }),
      "All periods",
    );
    await page.getByRole("tab", { name: "All invoices", exact: true }).click();
    await expect(page.getByRole("row")).toHaveCount(6);
    await choose(page, page.getByRole("combobox", { name: "Rows per page", exact: true }), "10");
    await expect(page.getByRole("row")).toHaveCount(11);
    await page.getByRole("button", { name: "Go to next page", exact: true }).click();
    await expect(page.getByRole("row")).toHaveCount(4);
    await expect(page.getByText("11–13 of 13 invoices", { exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.screenshot({ path: info.outputPath("invoice-created-phone.png") });
  });

  test(`Margin ${primitive}: journal review posts only after approval and the closed period rejects edits`, async ({
    page,
    baseURL,
  }, info) => {
    await open(page, baseURL, primitive, "ledger/transactions", "Transactions");
    await expect(page.getByRole("row")).toHaveCount(11);
    await choose(page, page.getByRole("combobox", { name: "Rows per page", exact: true }), "25");
    await expect(page.getByRole("row")).toHaveCount(25);
    await choose(page, page.getByRole("combobox", { name: "Rows per page", exact: true }), "10");
    await page.getByRole("button", { name: "Go to next page", exact: true }).click();
    await expect(page.getByText("11–20 of 24 postings", { exact: true })).toBeVisible();
    const newJournal = page.getByRole("button", { name: "New journal", exact: true });
    await newJournal.click();
    const dialog = page.getByRole("dialog", { name: "New balanced journal", exact: true });
    await dialog.getByLabel("Description", { exact: true }).fill("Capital top-up");
    await dialog.getByRole("button", { name: "Submit journal", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    await expect(newJournal).toBeFocused();
    await expect(page.getByText("J-1001 · Capital top-up", { exact: true })).toBeVisible();
    const held = JSON.parse(await download(page, "Export JSON"));
    expect(held.filter((entry: { source: string }) => entry.source === "J-1001")).toEqual([]);
    await page.getByRole("button", { name: "Approve J-1001", exact: true }).click();
    const posted = JSON.parse(await download(page, "Export JSON")) as {
      source: string;
      debitCents: number;
      creditCents: number;
    }[];
    const journal = posted.filter((entry) => entry.source === "J-1001");
    expect(journal).toHaveLength(2);
    expect(journal.reduce((sum, entry) => sum + entry.debitCents, 0)).toBe(2_500_000);
    expect(journal.reduce((sum, entry) => sum + entry.creditCents, 0)).toBe(2_500_000);
    await page.getByRole("button", { name: "Lock October", exact: true }).click();
    await expect(page.getByRole("button", { name: "October locked", exact: true })).toBeDisabled();
    await newJournal.click();
    await dialog.getByLabel("Description", { exact: true }).fill("Backdated adjustment");
    await dialog.getByLabel("Posting date", { exact: true }).fill("2026-10-20");
    await dialog.getByRole("button", { name: "Submit journal", exact: true }).click();
    await expect(dialog.getByRole("alert")).toHaveText("The books are locked through 2026-10.");
    await closeDialog(page, dialog, newJournal);
    await page.screenshot({ path: info.outputPath("journal-approved-period-locked.png") });
  });

  test(`Margin ${primitive}: native rule testing, toggles and priority change real decision traces`, async ({
    page,
    baseURL,
  }, info) => {
    await open(page, baseURL, primitive, "ledger/controls", "Controls");
    const run = page.getByRole("button", { name: "Test action", exact: true });
    await run.click();
    const row = (id: number) =>
      page.getByRole("row", { name: new RegExp(`Sample ${id} Manual journal`) });
    await expect(row(1)).toContainText("review");
    const inspect = page.getByRole("button", { name: "Inspect Sample 1", exact: true });
    await inspect.click();
    const trace = page.getByRole("dialog", { name: "Sample 1 decision trace", exact: true });
    await expect(trace).toContainText("Review substantial journals");
    await expect(trace).toContainText("Matched: review");
    await closeDialog(page, trace, inspect);
    const enable = page.getByRole("switch", {
      name: "Enable Review substantial journals",
      exact: true,
    });
    await enable.click();
    await expect(enable).not.toBeChecked();
    await run.click();
    await expect(row(2)).toContainText("allow");
    await page.getByRole("button", { name: "New rule", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "New approval rule", exact: true });
    await editor.getByLabel("Rule name", { exact: true }).fill("Block large demo journals");
    await choose(
      page,
      editor.getByRole("combobox", { name: "Verdict", exact: true }),
      "Block action",
    );
    await editor.getByRole("button", { name: "Save rule", exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
    await enable.click();
    await run.click();
    await expect(row(3)).toContainText("review");
    const moveUp = page.getByRole("button", {
      name: "Move Block large demo journals up",
      exact: true,
    });
    await moveUp.click();
    await moveUp.click();
    await expect(moveUp).toBeDisabled();
    await run.click();
    await expect(row(4)).toContainText("block");
    await page.getByRole("tab", { name: "Flagged actions", exact: true }).click();
    await expect(row(2)).toHaveCount(0);
    const exported = JSON.parse(await download(page, "Export JSON")) as {
      id: string;
      result: { verdict: string };
    }[];
    expect(exported).toHaveLength(3);
    expect(exported.find((entry) => entry.id === "Sample 4")?.result.verdict).toBe("block");
    await page.getByRole("tab", { name: "All actions", exact: true }).click();
    await run.click();
    await run.click();
    await expect(page.getByRole("row")).toHaveCount(6);
    await choose(page, page.getByRole("combobox", { name: "Rows per page", exact: true }), "10");
    await expect(page.getByRole("row")).toHaveCount(7);
    await choose(page, page.getByRole("combobox", { name: "Rows per page", exact: true }), "5");
    await page.getByRole("button", { name: "Go to next page", exact: true }).click();
    await expect(page.getByRole("row")).toHaveCount(2);
    await expect(page.getByText("6–6 of 6 actions", { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath("rules-and-native-pagination.png") });
  });
}
