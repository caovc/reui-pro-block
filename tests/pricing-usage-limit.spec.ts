import { expect, test, type Page } from "@playwright/test";

const preview = "./#/preview/marketing/pricing/pricing-8";

async function openPricing(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto(preview);
  const dialog = page.getByRole("dialog", { name: "Pick Your Plan", exact: true });
  await expect(dialog).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await dialog.evaluate(async (element) => {
    const animations = element
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  });
  return dialog;
}

test("desktop shows three canonical plans in both billing periods and static feature groups", async ({
  page,
}) => {
  const dialog = await openPricing(page, 1440, 1100);
  await expect(dialog.locator(".pu8-plan-card:visible")).toHaveCount(3);
  await expect(dialog.locator("[data-plan-price]")).toHaveText(["$10", "$30", "$80"]);
  await expect(dialog.locator(".pu8-card-invoice")).toHaveText([
    "$120 billed yearly",
    "$360 billed yearly",
    "$960 billed yearly",
  ]);
  await expect(dialog.getByRole("radio")).toHaveCount(0);
  await expect(dialog.getByRole("row")).toHaveCount(16);
  await expect(dialog.locator('[data-feature="bookings"] td')).toHaveText([
    "500",
    "2,500",
    "Unlimited",
  ]);
  await expect(dialog.locator('[data-feature="support"] td')).toHaveText([
    "Email",
    "Priority chat",
    "Named success manager",
  ]);
  await dialog.getByRole("tab", { name: "Monthly", exact: true }).click();
  await expect(dialog.locator("[data-plan-price]")).toHaveText(["$12", "$36", "$96"]);
  await expect(dialog.locator(".pu8-card-invoice")).toHaveText([
    "Billed monthly",
    "Billed monthly",
    "Billed monthly",
  ]);
  for (const name of ["Limits", "Scheduling", "Security and Support"]) {
    await dialog.getByRole("rowheader", { name, exact: true }).click();
    await expect(dialog.getByRole("row")).toHaveCount(16);
  }
  await expect(dialog.locator("[aria-expanded], [role=progressbar]")).toHaveCount(0);
  expect(await dialog.evaluate((element) => getComputedStyle(element).fontFamily)).toContain(
    "Inter",
  );
});

test("mobile native radio selection keeps all six plan-period prices, columns and footer actions consistent", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const dialog = await openPricing(page, 390, 844);
  const viewport = dialog.locator('[data-slot="scroll-area-viewport"]');
  const options = [
    { name: "Basic", yearly: 10, monthly: 12, bookings: "500", seats: "1", action: "Start Trial" },
    {
      name: "Team",
      yearly: 30,
      monthly: 36,
      bookings: "2,500",
      seats: "10",
      action: "Start Trial",
    },
    {
      name: "Enterprise",
      yearly: 80,
      monthly: 96,
      bookings: "Unlimited",
      seats: "50",
      action: "Contact Sales",
    },
  ];
  for (const period of ["yearly", "monthly"] as const) {
    await viewport.evaluate((element) => element.scrollTo(0, 0));
    await dialog.getByRole("tab", { name: period === "yearly" ? /^Yearly/ : "Monthly" }).click();
    for (const plan of options) {
      await viewport.evaluate((element) => element.scrollTo(0, 0));
      await dialog.locator(".pu8-rail-item").filter({ hasText: plan.name }).click();
      await expect(dialog.getByRole("radio", { name: plan.name, exact: true })).toBeChecked();
      await expect(dialog.locator(".pu8-plan-card:visible")).toHaveCount(1);
      await expect(dialog.locator("[data-plan-price]:visible")).toHaveText(`$${plan[period]}`);
      await expect(dialog.locator(".pu8-summary-name")).toHaveText(plan.name);
      await expect(dialog.locator(".pu8-summary-invoice")).toHaveText(
        `$${plan[period] * (period === "yearly" ? 12 : 1)} billed ${period}`,
      );
      await expect(dialog.locator('[data-feature="bookings"] td:visible')).toHaveText(
        plan.bookings,
      );
      await expect(dialog.locator('[data-feature="seats"] td:visible')).toHaveText(plan.seats);
      await expect(dialog.locator(".pu8-mobile-footer a")).toHaveAccessibleName(
        `${plan.action} for ${plan.name}`,
      );
      await expect(dialog.locator("a:visible")).toHaveCount(1);
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );
    }
  }
  await viewport.evaluate((element) => element.scrollTo(0, 0));
  await dialog.getByRole("radio", { name: "Basic", exact: true }).focus();
  await expect(dialog.getByRole("radio", { name: "Basic", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(dialog.getByRole("radio", { name: "Team", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(dialog.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
  await expect(dialog.locator(".pu8-summary-invoice")).toHaveText("$36 billed monthly");
  expect(errors).toEqual([]);
});

test("native dialog close, Escape, reopen and placeholder CTAs retain selection without payment flows", async ({
  page,
}) => {
  const dialog = await openPricing(page, 390, 844);
  const route = page.url();
  await dialog.getByRole("tab", { name: "Monthly", exact: true }).click();
  await dialog.locator(".pu8-rail-item").filter({ hasText: "Enterprise" }).click();
  await dialog.getByRole("link", { name: "Contact Sales for Enterprise", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(route);
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Bookings Running Low", { exact: true })).toBeVisible();
  await expect(
    page.getByText("A paid plan lifts the monthly limit.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View Plans", exact: true }).click();
  await expect(dialog.locator(".pu8-summary-invoice")).toHaveText("$96 billed monthly");
  await expect(dialog.getByRole("radio", { name: "Enterprise", exact: true })).toBeChecked();
  await expect(dialog.getByRole("tab", { name: "Monthly", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "View Plans", exact: true })).toBeFocused();
});

test("only the native ScrollArea scrolls while header/footer stay fixed and billing Tabs add no scrollbar", async ({
  page,
}) => {
  for (const [width, height] of [
    [1440, 1100],
    [390, 844],
  ]) {
    const dialog = await openPricing(page, width, height);
    const header = dialog.locator(".pu8-dialog-header");
    const footer = dialog.locator(".pu8-mobile-footer");
    const viewport = dialog.locator('[data-slot="scroll-area-viewport"]');
    const headerBefore = await header.boundingBox();
    const footerBefore = await footer.boundingBox();
    const tabs = dialog.getByRole("tablist", { name: "Billing period" });
    const metrics = await tabs.evaluate((element) =>
      [element, element.parentElement!, element.parentElement!.parentElement!].map((node) => {
        const style = getComputedStyle(node);
        return {
          xOverflow: node.scrollWidth > node.clientWidth,
          yOverflow: node.scrollHeight > node.clientHeight,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
        };
      }),
    );
    for (const metric of metrics) {
      expect(metric.xOverflow).toBe(false);
      expect(metric.yOverflow).toBe(false);
      expect(metric.overflowX).not.toBe("scroll");
      expect(metric.overflowY).not.toBe("scroll");
    }
    await dialog.getByRole("tab", { name: "Monthly", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByRole("tab", { name: /^Yearly/ })).toBeFocused();
    await expect(dialog.getByRole("tab", { name: /^Yearly/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      await dialog
        .getByRole("tab", { name: /^Yearly/ })
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe("rgba(0, 0, 0, 0)");
    await viewport.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
    expect(await header.boundingBox()).toEqual(headerBefore);
    expect(await footer.boundingBox()).toEqual(footerBefore);
    await expect(dialog.locator('[data-feature="support"] td:visible').last()).toBeVisible();
    expect(await viewport.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
      true,
    );
    expect(await page.evaluate(() => scrollY)).toBe(0);
  }
});
