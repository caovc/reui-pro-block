import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const route = (n: number) => `./#/preview/ecommerce/receipt/receipt-${n}`;
async function open(page: Page, n: number) {
  await page.goto(route(n));
  await expect(page.locator(`[data-receipt-variant="${n}"]`)).toBeVisible();
}

for (const n of [1, 2, 3]) {
  test(`receipt ${n} exports an actual PDF with correct totals and valid object offsets`, async ({
    page,
  }) => {
    await open(page, n);
    await expect(page.locator("[data-receipt-total]")).toHaveText("$631.92");
    const pending = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download receipt RCT-2026-018042 as PDF", exact: true })
      .click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe("RCT-2026-018042.pdf");
    const pdf = await readFile((await download.path())!, "ascii");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("TOTAL PAID: $631.92");
    expect(pdf).toContain("HLD-2026-18042");
    const xref = Number(pdf.match(/startxref\n(\d+)/)![1]);
    expect(pdf.slice(xref, xref + 4)).toBe("xref");
    for (const [index, match] of [...pdf.matchAll(/(\d{10}) 00000 n/g)].entries()) {
      expect(pdf.slice(Number(match[1]))).toMatch(new RegExp(`^${index + 1} 0 obj`));
    }
  });
  test(`receipt ${n} opens a real read-only official Timeline tracking dialog`, async ({
    page,
  }) => {
    await open(page, n);
    await page.getByRole("button", { name: "Track shipment", exact: true }).click();
    const timeline = page.getByRole("dialog").locator('[data-slot="timeline"]');
    await expect(timeline.locator('[data-slot="timeline-item"]')).toHaveCount(5);
    await expect(timeline.locator("[data-completed]")).toHaveCount(3);
    await timeline.getByText("Delivered", { exact: true }).click();
    await expect(timeline.locator("[data-completed]")).toHaveCount(3);
    await expect(page.getByRole("dialog")).toContainText("No live carrier tracking request");
  });
  test(`receipt ${n} fits 390px and retains all line items`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, n);
    for (const name of ["Field Shell Jacket", "Compass Down Vest", "Linen Field Shirt"]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });
}

test("email receipt validates recipient and downloads a usable local draft without claiming to send", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("button", { name: "Email receipt RCT-2026-018042", exact: true }).click();
  await page.getByLabel("Recipient email").fill("bad");
  await page.getByRole("button", { name: "Download email draft", exact: true }).click();
  await expect(page.getByLabel("Recipient email")).toBeVisible();
  await page.getByLabel("Recipient email").fill("receipt-qa@example.com");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download email draft", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("RCT-2026-018042.eml");
  const eml = await readFile((await download.path())!, "utf8");
  expect(eml).toContain("To: receipt-qa@example.com");
  expect(eml).toContain("Subject: Receipt RCT-2026-018042");
  expect(eml).toContain("TOTAL PAID: $631.92");
  await expect(page.getByRole("alert")).toContainText("Email draft downloaded");
});

test("receipt support validates and saves an actual local request", async ({ page }) => {
  await open(page, 2);
  await page.getByRole("button", { name: "Need help with this order?", exact: true }).click();
  await page.getByLabel("How can we help?").fill("Please check the delivery instructions.");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save support request", exact: true }).click();
  const download = await pending;
  const content = await readFile((await download.path())!, "utf8");
  expect(content).toContain("HLD-2026-18042");
  expect(content).toContain("Please check the delivery instructions.");
  await expect(page.getByRole("alert")).toContainText("Request saved locally");
});

test("print invokes the browser print API and print media removes receipt actions", async ({
  page,
}) => {
  await open(page, 3);
  await page.evaluate(() => {
    const target = window as Window & { receiptPrintCount?: number };
    target.receiptPrintCount = 0;
    target.print = () => {
      target.receiptPrintCount = (target.receiptPrintCount ?? 0) + 1;
    };
  });
  await page.getByRole("button", { name: "Print receipt RCT-2026-018042", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { receiptPrintCount?: number }).receiptPrintCount),
    )
    .toBe(1);
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("button", { name: "Download receipt RCT-2026-018042 as PDF", exact: true }),
  ).toBeHidden();
  await expect(page.locator("[data-receipt-total]")).toBeVisible();
});
