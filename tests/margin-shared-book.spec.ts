import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createMarginBook, monthSummary } from "../src/templates/workflow/margin-model";

test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ colorScheme: "light", actionTimeout: 5000, trace: "on" });

const initial = monthSummary(createMarginBook(), "2026-11");
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const money = (cents: number) => usd.format(cents / 100);

async function open(page: Page, primitive: "radix" | "base", route: string) {
  const entry = primitive === "base" ? "/base/" : "/";
  const preset = encodeURIComponent(JSON.stringify({ primitive, style: "nova", mode: "light" }));
  await page.goto(`${entry}#/template-preview/margin/${route}?preset=${preset}`);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.getByRole("navigation", { name: "Finance pages" })).toBeVisible();
}

async function navigate(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Finance pages" })
    .getByRole("link", {
      name,
      exact: true,
    })
    .click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

function metric(page: Page, name: string) {
  return page.locator(".margin-tiles [data-slot='frame']").filter({
    has: page.getByText(name, { exact: true }),
  });
}

async function download(page: Page, name: string) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name, exact: true }).click();
  const file = await pending;
  return readFile((await file.path())!, "utf8");
}

async function close(page: Page, dialog: Locator) {
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
}

async function journal(page: Page, memo: string) {
  await page.getByRole("button", { name: "New journal", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New balanced journal", exact: true });
  await dialog.getByLabel("Description", { exact: true }).fill(memo);
  await dialog.getByRole("button", { name: "Submit journal", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);
}

for (const primitive of ["radix", "base"] as const) {
  test(`Margin ${primitive}: payment survives finance navigation and resets only with a fresh page`, async ({
    page,
  }) => {
    await open(page, primitive, "cash/receivables");
    await page.getByRole("button", { name: "View BL-2010", exact: true }).click();
    const detail = page.getByRole("dialog", { name: "BL-2010 · Alder Workshop", exact: true });
    await detail.getByLabel("Amount", { exact: true }).fill("100");
    await detail.getByLabel("Activity note", { exact: true }).fill("Shared book receipt");
    await detail.getByRole("button", { name: "Record activity", exact: true }).click();
    await expect(detail).toContainText("$16,700.00 outstanding");
    await close(page, detail);

    await navigate(page, "Cash flow");
    await expect(metric(page, "Closing cash")).toContainText(
      money(initial.closingCashCents + 10000),
    );
    await expect(metric(page, "Net cash movement")).toContainText(
      money(initial.netCashCents + 10000),
    );
    await navigate(page, "Transactions");
    await page.getByLabel("Search transactions", { exact: true }).fill("Shared book receipt");
    const postings = JSON.parse(await download(page, "Export JSON"));
    expect(postings).toHaveLength(2);
    expect(postings.map((entry: { source: string }) => entry.source)).toEqual([
      "BL-2010",
      "BL-2010",
    ]);
    expect(
      postings.reduce((sum: number, entry: { debitCents: number }) => sum + entry.debitCents, 0),
    ).toBe(10000);

    await navigate(page, "Receivables");
    await page.getByRole("button", { name: "View BL-2010", exact: true }).click();
    await expect(detail).toContainText("$16,700.00 outstanding");
    await expect(detail).toContainText("Shared book receipt · $100.00");
    await close(page, detail);
    await page.reload();
    await page.getByRole("button", { name: "View BL-2010", exact: true }).click();
    await expect(detail).toContainText("$16,800.00 outstanding");
    await expect(detail).not.toContainText("Shared book receipt");
  });

  test(`Margin ${primitive}: new invoices feed dashboard, profit and loss, ledger and receivables exports`, async ({
    page,
  }) => {
    await open(page, primitive, "cash/receivables");
    await page.getByRole("button", { name: "New invoice", exact: true }).click();
    const create = page.getByRole("dialog", { name: "Create local invoice", exact: true });
    await create.getByLabel("Customer", { exact: true }).fill("Cross-page Assembly");
    await create.getByRole("button", { name: "Create invoice", exact: true }).click();
    await expect(create).toBeHidden();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCount(0);

    await navigate(page, "Dashboard");
    await expect(metric(page, "Net revenue")).toContainText(
      money(initial.netRevenueCents + 250000),
    );
    expect(await download(page, "Export invoices CSV")).toContain(
      '"BL-2013","Cross-page Assembly"',
    );
    await navigate(page, "Profit & loss");
    await expect(page.getByRole("row", { name: /^2026-11/ })).toContainText(
      money(initial.netRevenueCents + 250000),
    );
    expect(await download(page, "Export P&L CSV")).toContain(
      '"Actual","2026-11","9800000","2744000","3800000","3256000"',
    );
    await navigate(page, "Transactions");
    await page.getByLabel("Search transactions", { exact: true }).fill("BL-2013");
    const postings = JSON.parse(await download(page, "Export JSON"));
    expect(postings).toHaveLength(4);
    expect(
      postings.reduce((sum: number, entry: { debitCents: number }) => sum + entry.debitCents, 0),
    ).toBe(320000);
    await navigate(page, "Receivables");
    await page.getByLabel("Search invoices", { exact: true }).fill("Cross-page Assembly");
    await expect(page.getByRole("row", { name: /BL-2013 Cross-page Assembly/ })).toContainText(
      "$2,500.00",
    );
    expect(await download(page, "Export invoices")).toContain(
      '"BL-2013","Cross-page Assembly","Studio"',
    );
  });

  test(`Margin ${primitive}: pending reviews, approvals and period locks survive page navigation`, async ({
    page,
  }) => {
    await open(page, primitive, "ledger/transactions");
    await journal(page, "Cross-page capital");
    await expect(page.getByRole("button", { name: "Approve J-1001", exact: true })).toBeVisible();
    await navigate(page, "Cash flow");
    await expect(metric(page, "Closing cash")).toContainText(money(initial.closingCashCents));
    await navigate(page, "Transactions");
    await page.getByRole("button", { name: "Approve J-1001", exact: true }).click();
    await page.getByRole("button", { name: "Lock October", exact: true }).click();
    await navigate(page, "Cash flow");
    await expect(metric(page, "Closing cash")).toContainText(
      money(initial.closingCashCents + 2500000),
    );
    await navigate(page, "Transactions");
    await expect(page.getByRole("button", { name: "October locked", exact: true })).toBeDisabled();
    await page.getByLabel("Search transactions", { exact: true }).fill("Cross-page capital");
    const postings = JSON.parse(await download(page, "Export JSON"));
    expect(postings).toHaveLength(2);
    expect(
      postings.reduce((sum: number, entry: { debitCents: number }) => sum + entry.debitCents, 0),
    ).toBe(2500000);
    await page.getByRole("button", { name: "New journal", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "New balanced journal", exact: true });
    await dialog.getByLabel("Description", { exact: true }).fill("Locked after navigation");
    await dialog.getByLabel("Posting date", { exact: true }).fill("2026-10-20");
    await dialog.getByRole("button", { name: "Submit journal", exact: true }).click();
    await expect(dialog.getByRole("alert")).toHaveText("The books are locked through 2026-10.");
  });

  test(`Margin ${primitive}: configured controls govern actual journals and retain their state`, async ({
    page,
  }) => {
    await open(page, primitive, "ledger/controls");
    const review = page.getByRole("switch", {
      name: "Enable Review substantial journals",
      exact: true,
    });
    await review.click();
    await expect(review).not.toBeChecked();
    await navigate(page, "Transactions");
    await journal(page, "No review after policy change");
    await expect(page.getByRole("status")).toHaveText("J-1001 posted.");
    await expect(page.getByRole("button", { name: "Approve J-1001", exact: true })).toHaveCount(0);
    await navigate(page, "Controls");
    await expect(review).not.toBeChecked();
    await review.click();
    await navigate(page, "Transactions");
    await journal(page, "Review restored after policy change");
    await expect(page.getByRole("button", { name: "Approve J-1002", exact: true })).toBeVisible();
    await page
      .getByLabel("Search transactions", { exact: true })
      .fill("No review after policy change");
    expect(JSON.parse(await download(page, "Export JSON"))).toHaveLength(2);
  });
}
