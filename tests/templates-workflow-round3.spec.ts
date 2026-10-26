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

test("Flux provider connection and enabled state survive returning from Overview", async ({
  page,
}) => {
  await page.goto("/#/template-preview/flux");
  await page.getByRole("button", { name: "Connections", exact: true }).first().click();
  await page
    .getByRole("switch", { name: "Enable provider OpenRoute Primary", exact: true })
    .click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByLabel("Provider", { exact: true }).fill("QA fallback endpoint");
  await page.getByLabel("Endpoint", { exact: true }).fill("https://provider.example/v1");
  await page.getByLabel("Credential", { exact: true }).fill("local-preview-fixture");
  await page.getByRole("button", { name: "Add connection", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Connections", exact: true }).first().click();
  await expect(
    page.getByRole("switch", { name: "Enable provider OpenRoute Primary", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Enable provider QA fallback endpoint", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Test QA fallback endpoint", exact: true }).click();
  await expect(page.getByText("Last test: Endpoint ready", { exact: true })).toBeVisible();
});

test("Flux routing respects locked policies and preserves a saved independent change", async ({
  page,
}) => {
  await page.goto("/#/template-preview/flux");
  await page.getByRole("button", { name: "Routing rules", exact: true }).first().click();
  await expect(
    page.getByRole("switch", { name: "Safety review Payment Action Drafts", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("switch", { name: "Long context Support Reply Drafts", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Fallback priority Payment Action Drafts", exact: true })
    .click();
  await page.getByRole("option", { name: "VectorEdge Small", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Routing rules", exact: true }).first().click();
  await expect(
    page.getByRole("switch", { name: "Long context Support Reply Drafts", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("combobox", { name: "Fallback priority Payment Action Drafts", exact: true }),
  ).toContainText("VectorEdge Small");
});

for (const template of ["flux", "tempo"]) {
  test(`${template} AI Operations saves its own routing rule across navigation`, async ({
    page,
  }) => {
    await page.goto(`/#/template-preview/${template}`);
    if (template === "flux") {
      await page.getByRole("button", { name: "Providers", exact: true }).click();
      await page.getByRole("button", { name: "Failover", exact: true }).click();
    } else {
      await page.getByRole("button", { name: "Reports", exact: true }).click();
      await page.getByRole("button", { name: "AI Ops", exact: true }).click();
    }
    await page
      .getByRole("button", { name: template === "flux" ? "Add Rule" : "New rule", exact: true })
      .click();
    await page.getByLabel("Rule", { exact: true }).fill(`${template} independent route`);
    await page.getByLabel("Reference", { exact: true }).fill("ROUTE-QA-831");
    await page.getByRole("button", { name: "Add rule", exact: true }).click();
    await expect(
      page.getByRole("button", { name: `${template} independent route`, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: template === "flux" ? "Overview" : "Home", exact: true })
      .click();
    if (template === "flux")
      await page.getByRole("button", { name: "Failover", exact: true }).click();
    else await page.getByRole("button", { name: "Reports", exact: true }).click();
    await page.getByLabel("Filter operation rules", { exact: true }).fill("ROUTE-QA-831");
    await expect(
      page.getByRole("button", { name: `${template} independent route`, exact: true }),
    ).toBeVisible();
  });
}

test("Flux costs track and edit one independent line across Overview navigation", async ({
  page,
}) => {
  await page.goto("/#/template-preview/flux");
  await page.getByRole("button", { name: "Spend overview", exact: true }).first().click();
  await page.getByRole("button", { name: "Track Cost", exact: true }).click();
  await page.getByLabel("Target", { exact: true }).fill("QA safety budget");
  await page.getByLabel("Spend", { exact: true }).fill("1700");
  await page.getByLabel("Cap", { exact: true }).fill("5000");
  await page.getByRole("button", { name: "Track cost", exact: true }).click();
  await page.getByRole("button", { name: "QA safety budget", exact: true }).click();
  await page.getByLabel("Spend", { exact: true }).fill("1900");
  await page.getByRole("button", { name: "Save cost", exact: true }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Spend overview", exact: true }).first().click();
  await page.getByLabel("Filter cost activity", { exact: true }).fill("QA safety budget");
  await page.getByRole("button", { name: "QA safety budget", exact: true }).click();
  await expect(page.getByLabel("Spend", { exact: true })).toHaveValue("1900");
});

test("Flux token ledger adds a row, reviews it independently and exports actual CSV", async ({
  page,
}) => {
  await page.goto("/#/template-preview/flux");
  await page.getByRole("button", { name: "Token audit", exact: true }).first().click();
  await page.getByRole("button", { name: "Add Entry", exact: true }).click();
  await page.getByLabel("Input Tokens", { exact: true }).fill("1234");
  await page.getByLabel("Output Tokens", { exact: true }).fill("234");
  await page.getByRole("dialog").getByRole("button", { name: "Add Entry", exact: true }).click();
  await page.getByRole("checkbox", { name: "Select usage TOK-7740-328", exact: true }).check();
  await page.getByRole("button", { name: "Mark reviewed", exact: true }).click();
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await csv).suggestedFilename()).toBe("token-ledger.csv");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Token audit", exact: true }).first().click();
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  await page.getByRole("button", { name: "TOK-7740-328", exact: true }).click();
  await expect(page.getByLabel("Input Tokens", { exact: true })).toHaveValue("1234");
  await expect(page.getByRole("combobox", { name: "Budget State", exact: true })).toContainText(
    "Within Budget",
  );
});

for (const section of [
  "Connections",
  "Routing rules",
  "Failover",
  "Spend overview",
  "Token audit",
]) {
  test(`Flux ${section} renders at 390px without app errors or page overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/template-preview/flux");
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    if (section === "Failover")
      await page.getByRole("button", { name: "Providers", exact: true }).click();
    await page.getByRole("button", { name: section, exact: true }).first().click();
    await expect(
      page.getByRole("heading", {
        name:
          section === "Connections"
            ? "Provider Connections"
            : section === "Routing rules"
              ? "Routing Rules Active"
              : section === "Failover"
                ? "AI Operations"
                : section === "Spend overview"
                  ? "Cost Dashboard 82% Cap"
                  : "Token Audit Oct 21 to Oct 23",
        exact: true,
      }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}

test("Tempo AI Ops also fits the mobile workspace", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/template-preview/tempo");
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("button", { name: "AI Ops", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AI Operations", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
