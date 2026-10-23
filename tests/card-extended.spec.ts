import { test, expect } from "@playwright/test";
const route = (id: number) => `./#/preview/application/card/card-${id}`;
for (const width of [1440, 390])
  test(`cards 16–29 render with actual REUI frames at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (let id = 16; id <= 29; id++) {
      await page.goto(route(id));
      await expect(page.locator(`[data-card-variant="${id}"]`)).toBeVisible();
      await expect(page.locator('[data-slot="frame"]')).not.toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `card-${id} document overflow`,
      ).toBeLessThanOrEqual(width);
      expect(await page.locator("vite-error-overlay").count()).toBe(0);
    }
    expect(errors).toEqual([]);
  });
test("integration edits and guide reflect the updated local details", async ({ page }) => {
  await page.goto(route(16));
  await page.getByRole("button", { name: "LeadForge CRM actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await page.getByLabel("App name", { exact: true }).fill("Customer Hub");
  await page.getByLabel("Description", { exact: true }).fill("Sync selected customer records.");
  await page.getByRole("switch", { name: "Live status" }).uncheck();
  await page.getByRole("button", { name: "Save integration", exact: true }).click();
  await expect(page.getByText("Customer Hub", { exact: true })).toBeVisible();
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Integration Guide", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Customer Hub integration guide");
  await expect(page.getByRole("dialog").locator("li")).toHaveCount(3);
});
test("quote follow and official NumberField practice trade update locally", async ({ page }) => {
  await page.goto(route(19));
  await page.getByRole("button", { name: "Follow", exact: true }).click();
  await expect(page.getByRole("button", { name: "Following", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Trade on Binance", exact: true }).click();
  await expect(page.getByLabel("Quantity", { exact: true })).toHaveValue("0.01");
  await page.getByRole("button", { name: "Increase quantity", exact: true }).click();
  await expect(page.getByLabel("Quantity", { exact: true })).toHaveValue("0.011");
  await expect(page.getByRole("dialog")).toContainText("$1,030.98");
  await page.getByRole("radio", { name: "Sell", exact: true }).click();
  await page.getByRole("button", { name: "Simulate sell order", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Simulated sell complete");
  await expect(page.getByRole("dialog")).toContainText("no exchange is connected");
});
test("guide article rows open their own content", async ({ page }) => {
  await page.goto(route(20));
  await page.getByRole("button", { name: "Place an order guide", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Choose the products and quantities");
  await expect(page.getByRole("dialog").locator("li")).toHaveCount(3);
  await page.getByRole("button", { name: "Back to guides", exact: true }).click();
  await page.getByRole("button", { name: "Create API keys securely", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Store the secret on your server");
});
test("project share copies a project-specific preview link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(route(21));
  await page
    .getByRole("button", {
      name: "Share Mobile Banking App Upgrade",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Copy project link", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("project=Mobile%20Banking%20App%20Upgrade");
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
});
test("promo thumbnails use upstream AspectRatio and launch practice mode", async ({ page }) => {
  await page.goto(route(22));
  await expect(page.locator('[data-slot="aspect-ratio"]')).toHaveCount(2);
  await page.getByRole("button", { name: "Try Demo Trading", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Practice mode");
});
test("monitor configuration retains endpoint and selected services", async ({ page }) => {
  await page.goto(route(23));
  await expect(
    page.locator(
      '[data-card-variant="23"] > div > [data-slot="frame"] > [data-slot="frame-panel"]',
    ),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Start Monitoring", exact: true }).click();
  await page.getByLabel("Monitor name", { exact: true }).fill("API health");
  await page.getByLabel("Endpoint URL", { exact: true }).fill("https://example.com/health");
  await page.getByRole("checkbox", { name: "Gemini", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Cursor", exact: true }).check();
  await page.getByRole("button", { name: "Save monitor locally", exact: true }).click();
  await expect(page.getByText("API health", { exact: true })).toBeVisible();
  await expect(page.getByText(/Local monitor configured for OpenAI, Cursor/)).toBeVisible();
  await expect(page.getByText(/No background polling is running/)).toBeVisible();
  await page.getByRole("button", { name: "Monitoring configured", exact: true }).click();
  await expect(page.getByLabel("Endpoint URL", { exact: true })).toHaveValue(
    "https://example.com/health",
  );
  await expect(page.getByRole("checkbox", { name: "Gemini", exact: true })).not.toBeChecked();
});
test("job details open and application draft can be reviewed", async ({ page }) => {
  await page.goto(route(24));
  await page.getByRole("button", { name: "View Details", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Experience building and testing backend services",
  );
  await page.getByRole("button", { name: "Prepare application", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("QA Engineer");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.com");
  await page.getByRole("button", { name: "Save local application", exact: true }).click();
  await expect(page.getByText("No application has been sent.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Draft saved", exact: true }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("QA Engineer");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("qa@example.com");
});
test("metrics preserve static figures and decorative wedges without invented chart controls", async ({
  page,
}) => {
  await page.goto(route(28));
  await expect(page.getByText("Cumulative Spend", { exact: true })).toBeVisible();
  await expect(page.getByText("0.39%", { exact: true })).toBeVisible();
  await page.goto(route(29));
  await expect(page.locator('svg.extended-area-art[aria-hidden="true"]')).toHaveCount(4);
  await expect(page.locator("svg.extended-area-art polygon")).toHaveCount(8);
  await expect(page.locator('[role="tooltip"]')).toHaveCount(0);
});
