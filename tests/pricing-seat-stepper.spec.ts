import { expect, test } from "@playwright/test";

test("billing preserves Team seats and reprices the actual paid plans", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto("./#/preview/marketing/pricing/pricing-1");
  const section = page.locator(".seat-stepper-pricing");
  await expect(section.getByLabel("Pro price", { exact: true })).toHaveText("$28");
  await expect(section.getByLabel("Team price", { exact: true })).toHaveText("$100");
  await expect(section.getByLabel("Unlimited price", { exact: true })).toHaveText("From$750");
  const seats = section.getByRole("textbox", { name: "Seats", exact: true });
  await expect(seats).toHaveValue("5");
  await section.getByRole("tab", { name: "Monthly", exact: true }).click();
  await expect(section.getByLabel("Pro price", { exact: true })).toHaveText("$35");
  await expect(section.getByLabel("Team price", { exact: true })).toHaveText("$125");
  await section.getByRole("button", { name: "Increase", exact: true }).click();
  await expect(section.getByLabel("Team price", { exact: true })).toHaveText("$150");
  await expect(section.getByRole("button", { name: "6 team seats", exact: true })).toBeVisible();
  await section.getByRole("tab", { name: "Yearly Save 20%", exact: true }).click();
  await expect(seats).toHaveValue("6");
  await expect(section.getByLabel("Team price", { exact: true })).toHaveText("$120");
  await expect(section.getByLabel("Unlimited price", { exact: true })).toHaveText("From$750");
  await expect(section.getByText("a month, yearly contract", { exact: true })).toBeVisible();
});

test("NumberField enforces the observed seat bounds and keyboard changes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/preview/marketing/pricing/pricing-1");
  const section = page.locator(".seat-stepper-pricing");
  const seats = section.getByRole("textbox", { name: "Seats", exact: true });
  await seats.fill("1");
  await seats.press("Tab");
  await expect(seats).toHaveValue("2");
  await expect(section.getByRole("button", { name: "Decrease", exact: true })).toBeDisabled();
  await expect(section.getByLabel("Team price", { exact: true })).toHaveText("$40");
  await seats.fill("999");
  await seats.press("Tab");
  await expect(seats).toHaveValue("20");
  await expect(section.getByRole("button", { name: "Increase", exact: true })).toBeDisabled();
  await seats.fill("");
  await seats.press("Tab");
  await expect(seats).toHaveValue("20");
  await seats.fill("5");
  await seats.press("ArrowUp");
  await expect(seats).toHaveValue("6");
  await expect(section.getByLabel("Team price", { exact: true })).toHaveText("$120");
  const route = page.url();
  for (const action of await section.locator('a[href="#"]').all()) {
    await action.click();
    await expect(page).toHaveURL(route);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect(seats).toHaveValue("6");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("feature hints work on hover and focus with the reference font", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto("./#/preview/marketing/pricing/pricing-1");
  await page.getByRole("button", { name: "170 open primitives", exact: true }).hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toHaveText("Buttons, forms, overlays and data display.");
  await expect(page.locator(".ssp-tooltip")).toHaveCSS("font-family", "Inter, Arial, sans-serif");
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await page.getByRole("button", { name: "Seat management", exact: true }).focus();
  await expect(tooltip).toHaveText("Invite, remove and reassign seats in one place.");
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
});
