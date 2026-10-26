import { expect, test } from "@playwright/test";

const preview = "./#/preview/marketing/pricing/pricing-2";

test("comparison shows the four annual-billed prices, all feature bands and metered allowances", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto(preview);
  const surface = page.locator(".pc2-pricing");
  await expect(surface.getByRole("heading", { name: "Compare Plans", exact: true })).toBeVisible();
  await expect(surface.locator(".pc2-plan-picker")).toBeHidden();
  await expect(surface.getByRole("button", { name: "Monthly", exact: true })).toHaveCount(0);
  await expect(surface.locator("thead .pc2-price")).toHaveText(["$0", "$28", "$40+", "$750+"]);
  await expect(surface.locator("tbody")).toHaveCount(4);
  await expect(surface.locator(".pc2-section-name")).toHaveText([
    "Collection",
    "Retention",
    "Reporting",
    "Team and Access",
  ]);
  await expect(surface.getByRole("row")).toHaveCount(35);
  await expect(surface.locator('[data-feature="Monthly events"] td')).toHaveText([
    "50,000",
    "2 million$0.30 per 10,000",
    "10 million$0.22 per 10,000",
    "Custom volume",
  ]);
  await expect(surface.locator('[data-feature="Archive restore"] td')).toHaveText([
    "25,000",
    "2 million$5 per million",
    "20 million$3 per million",
    "Custom volume",
  ]);
  await expect(surface.locator('[data-feature="Team seats"] td')).toHaveText([
    "1",
    "1",
    "2 to 20$20 per seat",
    "Unlimited",
  ]);
});

test("feature labels open native dismissible Inter popovers, including indented and low rows", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto(preview);
  for (const [label, hint] of [
    ["Monthly events", "A tracked action counts once, however many properties it carries."],
    ["Per source caps", "Cap one noisy source so it cannot spend the whole allowance."],
    ["Archive restore", "Restored events rejoin the live window for the rest of the month."],
    [
      "Team seats",
      "The starting price covers 2 seats; each seat after that bills at the same rate.",
    ],
    ["Price lock", "Your rate cannot change while the lock runs."],
  ]) {
    const trigger = page.getByRole("button", { name: label, exact: true });
    await trigger.click();
    const popover = page.getByRole("dialog", { name: label, exact: true });
    await expect(popover).toHaveText(hint);
    expect(await popover.evaluate((element) => getComputedStyle(element).fontFamily)).toContain(
      "Inter",
    );
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
  }
  const first = page.getByRole("button", { name: "Monthly events", exact: true });
  await first.scrollIntoViewIfNeeded();
  await first.hover();
  expect(
    await page
      .locator('[data-feature="Monthly events"]')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe("rgba(0, 0, 0, 0)");
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Monthly events", exact: true })).toBeVisible();
  await page.getByRole("heading", { name: "Compare Plans" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the whole page scrolls under its sticky prices and placeholder CTAs retain the gallery route", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto(preview);
  const route = page.url();
  const head = page.locator(".pc2-plan-head");
  await expect(head).toBeVisible();
  await page.evaluate(() => scrollTo(0, 500));
  await expect.poll(async () => (await head.boundingBox())?.y).toBe(0);
  expect((await head.boundingBox())?.height).toBeCloseTo(96, 0);
  for (const name of ["Start Free", "Get Pro", "Get Team", "Contact us about Unlimited"]) {
    await page.evaluate(() => scrollTo(0, 500));
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(route);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  }
});

test("mobile native single-plan toggles update every allowance and support keyboard selection without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(preview);
  const picker = page.getByRole("radiogroup", { name: "Plan to show" });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole("radio", { name: "Pro", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  for (const [name, price, monthly, retention, action] of [
    ["Free", "$0", "50,000", "30 days", "Start Free"],
    ["Pro", "$28", "2 million$0.30 per 10,000", "12 months", "Get Pro"],
    ["Team", "$40+", "10 million$0.22 per 10,000", "36 months", "Get Team"],
    ["Unlimited", "$750+", "Custom volume", "Unlimited", "Contact us about Unlimited"],
  ]) {
    await picker.getByRole("radio", { name, exact: true }).click();
    await expect(page.locator(".pc2-price:visible")).toHaveText(price);
    await expect(page.locator('[data-feature="Monthly events"] td:visible')).toHaveText(monthly);
    await expect(page.locator('[data-feature="Event retention"] td:visible')).toHaveText(retention);
    await expect(page.locator(".pc2-plan-action:visible")).toHaveCount(1);
    await expect(page.getByRole("link", { name: action, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await picker.getByRole("radio", { name: "Unlimited", exact: true }).click();
  await expect(page.locator(".pc2-price:visible")).toHaveText("$750+");
  await picker.getByRole("radio", { name: "Free", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(picker.getByRole("radio", { name: "Pro", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.locator(".pc2-price:visible")).toHaveText("$28");
  await page.evaluate(() => scrollTo(0, 600));
  await expect.poll(async () => (await page.locator(".pc2-plan-head").boundingBox())?.y).toBe(0);
  await page.getByRole("button", { name: "Event retention", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Event retention" })).toHaveText(
    "Past this window raw events leave the charts and move to archive.",
  );
  expect(errors).toEqual([]);
});
