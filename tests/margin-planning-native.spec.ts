import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import { createMarginBook, monthSummary } from "../src/templates/workflow/margin-model";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const money = (cents: number) => usd.format(cents / 100);
const templatesRoute = "#/templates/margin";
const libraries = ["radix", "base"] as const;

function margin(page: Page) {
  return page.locator('[data-template="margin"]');
}

async function open(page: Page, primitive: (typeof libraries)[number], route = "") {
  const mount = primitive === "base" ? "/base/" : "/";
  await page.goto(`${mount}${templatesRoute}${route}`);
  await expect(page).toHaveTitle("Margin — Bricklane Templates");
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(margin(page).getByRole("navigation", { name: "Finance pages" })).toBeVisible();
}

async function download(page: Page, name: string) {
  const pending = page.waitForEvent("download");
  await margin(page).getByRole("button", { name, exact: true }).click();
  return readFile((await (await pending).path())!);
}

for (const primitive of libraries) {
  test(`Margin ${primitive}: shared books feed dashboard, profit and cash figures`, async ({
    page,
  }) => {
    await open(page, primitive);
    const app = margin(page);
    const actual = monthSummary(createMarginBook(), "2026-11");
    await expect(
      app.getByText(money(actual.netRevenueCents), { exact: true }).first(),
    ).toBeVisible();
    const runway = app.locator('[data-slot="frame"]').filter({ hasText: "Cash runway" });
    const runwayLabel = `${actual.cashRunwayMonths?.toFixed(1)} months`;
    await expect(runway.getByText(runwayLabel, { exact: true })).toBeVisible();
    await app.getByRole("combobox", { name: "Invoice plan" }).click();
    await page.getByRole("option", { name: "Essential" }).click();
    await expect(runway.getByText(runwayLabel, { exact: true })).toBeVisible();
    await app.getByRole("combobox", { name: "Invoice plan" }).click();
    await page.getByRole("option", { name: "All plans" }).click();
    await app.getByRole("combobox", { name: "Activity month" }).click();
    await page.getByRole("option", { name: "Oct 2026" }).click();
    await expect(
      app
        .getByText(money(monthSummary(createMarginBook(), "2026-10").netRevenueCents), {
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await app.getByRole("link", { name: "Profit & loss" }).click();
    await expect(app.getByRole("row", { name: /2026-11/ }).first()).toContainText(
      money(actual.netRevenueCents),
    );
    const december = app.getByRole("spinbutton", { name: "Forecast revenue for 2026-12" });
    await december.fill("60000");
    await expect(app.getByRole("row", { name: /2026-12/ })).toContainText(
      money(6_000_000 - 2_640_000 - actual.operatingCents),
    );
    const profitLoss = (await download(page, "Export P&L CSV")).toString();
    expect(profitLoss).toContain('"Forecast","2026-12","6000000","2640000"');
    await app.getByRole("link", { name: "Cash flow" }).click();
    await expect(
      app.getByText(money(actual.closingCashCents), { exact: true }).first(),
    ).toBeVisible();
    await app.getByLabel("Target collections").fill("100.01");
    await app.getByRole("button", { name: "Share across plans" }).click();
    await expect(app.getByText("Total plan $100.01")).toBeVisible();
    await expect(app.getByRole("row", { name: /Essential/ })).toContainText("$46.01");
    const cash = (await download(page, "Export cash plan CSV")).toString();
    expect(cash).toContain('"Essential","46","4601"');
    expect(cash).toContain('"Studio","34","3400"');
    expect(cash).toContain('"Partner","20","2000"');
  });

  test(`Margin ${primitive}: budget choices and acquisition update real totals on phone`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, primitive, "/plan/budgets");
    const app = margin(page);
    await expect(app.getByText("Forecast overrun $7,000.00")).toBeVisible();
    await app.getByRole("button", { name: "Use contingency" }).click();
    await expect(app.getByRole("status")).toContainText("Covered from the existing contingency");
    await expect(app.getByText("Forecast overrun $0.00")).toBeVisible();
    await app.getByLabel("Remaining delivery commitment").fill("34000");
    await app.getByRole("button", { name: "Save new forecast" }).click();
    await expect(app.getByText("Forecast overrun $5,000.00")).toBeVisible();
    await app.getByRole("button", { name: "Hold vendor to plan" }).click();
    await expect(app.getByText("Forecast overrun $0.00")).toBeVisible();
    await app.getByRole("link", { name: "Acquisition scenarios" }).click();
    await app.getByLabel("Annual interest (%)").fill("0");
    await app.getByLabel("Hold (years)").fill("12");
    await app.getByRole("button", { name: "Recalculate scenario" }).click();
    await expect(app.getByText("12-year hold")).toBeVisible();
    const exportData = JSON.parse((await download(page, "Export JSON")).toString());
    expect(exportData.inputs.annualRateBps).toBe(0);
    expect(exportData.inputs.horizonYears).toBe(12);
    expect(exportData.result.monthlyPaymentCents).toBe(175000);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath("margin-scenario-phone.png") });
  });

  test(`Margin ${primitive}: direct standalone source and actual project archive match`, async ({
    page,
    context,
  }, info) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page, primitive);
    await page.getByRole("button", { name: "View template source" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const path = "src/templates/workflow/margin.tsx";
    const code = await readFile(path, "utf8");
    await expect.poll(() => dialog.locator(".template-source-code").textContent()).toBe(code);
    await dialog.getByRole("button", { name: "Copy", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
    const pending = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download project" }).click();
    const zip = await pending;
    await zip.saveAs(info.outputPath("margin-template.zip"));
    const files = unzipSync(await readFile((await zip.path())!));
    expect(strFromU8(files[path])).toBe(code);
    expect(strFromU8(files["src/Example.tsx"])).toContain("from '@/templates/workflow/margin'");
    expect(JSON.parse(strFromU8(files["components.json"])).style).toMatch(
      new RegExp(`^${primitive}-`),
    );
    expect(files["src/templates/workflow/margin-ledger.tsx"]).toBeTruthy();
    expect(files["src/components/reui/REUI-LICENSE.txt"]).toBeTruthy();
    expect(files["src/templates/workflow/signal.tsx"]).toBeUndefined();
  });
}
