import { expect, test } from "@playwright/test";

test("Flux evaluation case creates, edits independently and survives Overview navigation", async ({
  page,
}) => {
  await page.goto("/#/template-preview/flux");
  await page.getByRole("button", { name: "Evals", exact: true }).click();
  await expect(page.getByText("Tone judge failing", { exact: true })).toBeVisible();
  await page.getByRole("switch", { name: "Regressions Only", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Order lookup retry path", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "New case", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Refund ownership acceptance");
  await page.getByLabel("Baseline", { exact: true }).fill("8.5");
  await page.getByLabel("Current", { exact: true }).fill("9.2");
  await page.getByRole("button", { name: "Add case", exact: true }).click();
  await page.getByRole("switch", { name: "Regressions Only", exact: true }).click();
  await page.getByRole("button", { name: "Refund ownership acceptance", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Refund ownership verified");
  await page.getByRole("button", { name: "Save case", exact: true }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Evals", exact: true }).click();
  await page
    .getByLabel("Filter evaluation cases", { exact: true })
    .fill("Refund ownership verified");
  await expect(
    page.getByRole("button", { name: "Refund ownership verified", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("button", { name: "Dunning email tone", exact: true })).toBeVisible();
});

test("Flux memory creates a scoped entry, pins it and retains data across pages", async ({
  page,
}) => {
  await page.goto("/#/template-preview/flux");
  await page.getByRole("button", { name: "Memory", exact: true }).click();
  await page.getByRole("button", { name: /^product-catalog/ }).click();
  await expect(page.getByText("No data available", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New Entry", exact: true }).click();
  await page.getByLabel("Fact", { exact: true }).fill("Account owner prefers a weekly digest");
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  await page
    .getByRole("button", { name: "Pin Account owner prefers a weekly digest", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Account owner prefers a weekly digest", exact: true })
    .click();
  await page.getByLabel("Fact", { exact: true }).fill("Account owner prefers a monthly digest");
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Memory", exact: true }).click();
  await page
    .getByLabel("Filter memory entries", { exact: true })
    .fill("Account owner prefers a monthly digest");
  await expect(
    page.getByRole("button", { name: "Unpin Account owner prefers a monthly digest", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Unpin all/ }).click();
  await expect(
    page.getByRole("button", { name: "Pin Account owner prefers a monthly digest", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

for (const section of ["Evals", "Memory"]) {
  test(`Flux ${section} fits mobile without runtime errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/template-preview/flux");
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page.getByRole("button", { name: section, exact: true }).click();
    await expect(
      page.getByText(section === "Evals" ? "Pass Rate Trend" : "Memory Manager", { exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}
