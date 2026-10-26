import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`flat, seat and quote prices preserve the observed rules at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1100 : 844 });
    await page.goto("./#/preview/marketing/pricing/pricing-4");
    const section = page.locator(".customer-logo-pricing");
    const basic = section.getByRole("listitem", { name: "Basic plan", exact: true });
    const business = section.getByRole("listitem", { name: "Business plan", exact: true });
    const enterprise = section.getByRole("listitem", { name: "Enterprise plan", exact: true });
    const annual = section.getByRole("tab", { name: "Annual 20% Off", exact: true });
    await expect(annual).toHaveAttribute("aria-selected", "true");
    await expect(basic.getByText("$28", { exact: true })).toBeVisible();
    await expect(basic.getByText("$336 billed yearly", { exact: true })).toBeVisible();
    await expect(business.getByText("$20", { exact: true })).toBeVisible();
    await expect(business.getByText("per seat / month", { exact: true })).toBeVisible();
    await expect(enterprise.getByText("$750", { exact: true })).toBeVisible();
    await expect(enterprise.getByText("Starting price", { exact: true })).toBeVisible();
    await expect(
      basic.getByRole("list", { name: "Basic features" }).getByRole("listitem"),
    ).toHaveCount(6);
    await expect(basic.getByText("Not included:", { exact: true })).toHaveCount(2);
    await expect(business.getByText("Not included:", { exact: true })).toHaveCount(0);
    await section.getByRole("tab", { name: "Monthly", exact: true }).click();
    await expect(basic.getByText("$35", { exact: true })).toBeVisible();
    await expect(basic.getByText("Billed monthly", { exact: true })).toBeVisible();
    await expect(business.getByText("$25", { exact: true })).toBeVisible();
    await expect(business.getByText("Billed monthly", { exact: true })).toBeVisible();
    await expect(enterprise.getByText("$750", { exact: true })).toBeVisible();
    await expect(enterprise.getByText("Starting price", { exact: true })).toBeVisible();
    const route = page.url();
    for (const action of await section.locator('a[href="#"]').all()) {
      await action.click();
      await expect(page).toHaveURL(route);
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
      await expect(basic.getByText("$35", { exact: true })).toBeVisible();
    }
    await annual.click();
    await expect(basic.getByText("$28", { exact: true })).toBeVisible();
    await expect(business.getByText("$20", { exact: true })).toBeVisible();
    const marks = section
      .getByRole("list", { name: "Illustrative product team marks" })
      .getByRole("img");
    await expect(marks).toHaveCount(6);
    await expect(section.getByText("Illustrative product teams", { exact: true })).toBeVisible();
    for (const mark of await marks.all()) {
      await expect(mark).toHaveAttribute("src", /^data:image\/svg\+xml,/);
      await expect(mark).toHaveAttribute("alt", /^Team .+ original demo mark$/);
      expect(
        await mark.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      ).toBe(true);
    }
    await expect
      .poll(() => section.locator("canvas").evaluate((canvas: HTMLCanvasElement) => canvas.width))
      .toBe(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
