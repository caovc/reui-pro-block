import { expect, test } from "@playwright/test";

test("analytics prices match the billing period and reference placeholder links stay in the preview", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/preview/marketing/pricing/pricing-5");
  await expect(page.getByLabel("Team price", { exact: true })).toHaveText("$9 USD");
  await expect(page.getByLabel("Growth price", { exact: true })).toHaveText("$18 USD");
  await page.getByRole("tab", { name: "Monthly", exact: true }).click();
  await expect(page.getByLabel("Team price", { exact: true })).toHaveText("$12 USD");
  await expect(page.getByLabel("Growth price", { exact: true })).toHaveText("$24 USD");
  await expect(page.getByLabel("Enterprise price", { exact: true })).toHaveText("$36 USD");
  const route = page.url();
  for (const link of await page.locator('.rp-analytics a[href="#"]').all()) {
    await link.click();
    await expect(page).toHaveURL(route);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
  await expect(page.getByLabel("Team price", { exact: true })).toHaveText("$12 USD");
  await page.getByRole("tab", { name: "Yearly Save 25%", exact: true }).click();
  await expect(page.getByLabel("Team price", { exact: true })).toHaveText("$9 USD");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("agency annual and monthly rates match reference and plan links introduce no new flow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/preview/marketing/pricing/pricing-6");
  await expect(page.getByLabel("Team price", { exact: true })).toHaveText("$70 per month");
  await expect(page.getByText("$840 billed yearly", { exact: true })).toBeVisible();
  await expect(page.getByText("+ $10 per extra seat / month", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Monthly", exact: true }).click();
  await expect(page.getByLabel("Team price", { exact: true })).toHaveText("$84 per month");
  await expect(page.getByText("+ $12 per extra seat / month", { exact: true })).toBeVisible();
  const route = page.url();
  for (const link of await page.locator('.rp-agency a[href="#"]').all()) {
    await link.click();
    await expect(page).toHaveURL(route);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
  await page.getByRole("tab", { name: "Yearly 2 Months Free", exact: true }).click();
  await expect(page.getByLabel("Team price", { exact: true })).toHaveText("$70 per month");
  await expect(page.getByText("Illustrative teams", { exact: true })).toBeVisible();
  const marks = page.getByRole("list", { name: "Illustrative team marks" }).getByRole("img");
  await expect(marks).toHaveCount(6);
  for (const mark of await marks.all()) {
    await expect(mark).toHaveAttribute("alt", /^Team .+ original demo mark$/);
    await expect(mark).toHaveAttribute("src", /^data:image\/svg\+xml,/);
    expect(
      await mark.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    ).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
