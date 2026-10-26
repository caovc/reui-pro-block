import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

for (const width of [1440, 390]) {
  test(`actual mega menu keeps eight/six described pages bounded at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./#/preview/application/navbar/navbar-12");
    await page.getByRole("button", { name: "Product", exact: true }).click();
    const products = page.getByLabel("Product pages", { exact: true });
    await expect(products).toBeVisible();
    await expect(products.getByRole("link")).toHaveCount(8);
    await expect(products.locator("svg")).toHaveCount(8);
    await expect
      .poll(async () =>
        products
          .locator("svg")
          .evaluateAll((icons) =>
            Math.min(...icons.map((icon) => icon.getBoundingClientRect().width)),
          ),
      )
      .toBeGreaterThanOrEqual(15.99);
    const box = await products.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await products.getByRole("link", { name: /^Corporate cards/ }).click();
    await expect(page.getByLabel("Selected marketing page", { exact: true })).toContainText(
      "Corporate cards",
    );
    await expect(products).toBeHidden();
    await page.getByRole("button", { name: "Company", exact: true }).click();
    const company = page.getByLabel("Company pages", { exact: true });
    await expect(company).toBeVisible();
    await expect(company.getByRole("link")).toHaveCount(6);
    const companyBox = await company.boundingBox();
    expect(companyBox!.x).toBeGreaterThanOrEqual(0);
    expect(companyBox!.x + companyBox!.width).toBeLessThanOrEqual(width);
    await company.getByRole("link", { name: /^Contact/ }).click();
    await expect(page.getByLabel("Selected marketing page", { exact: true })).toContainText(
      "Contact",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });

  test(`editor preview, captured review and close/reopen work at ${width}px`, async ({ page }) => {
    await page.clock.install();
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./#/preview/application/navbar/navbar-13");
    await expect(page.getByRole("heading", { name: "Invoice draft", exact: true })).toBeVisible();
    await expect(page.getByLabel("Invoice preview", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Collapse preview", exact: true }).click();
    await expect(page.getByLabel("Invoice preview", { exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Show preview", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Show preview", exact: true }).click();
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.getByRole("button", { name: "Submitting…", exact: true })).toBeDisabled();
    await page.clock.fastForward(900);
    await expect(page.getByRole("button", { name: "Sent for review", exact: true })).toBeVisible();
    await expect(page.getByLabel("Invoice preview", { exact: true })).toContainText(
      "Sent for review · Local demo",
    );
    await expect(page.locator('[data-slot="alert"]')).toContainText(
      "No invoice or message was transmitted",
    );
    await page.clock.fastForward(2500);
    await expect(page.getByRole("button", { name: "Sent for review", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close editor", exact: true }).click();
    await expect(page.getByLabel("Closed editor", { exact: true })).toContainText(
      "Sent for review locally",
    );
    await page.getByRole("button", { name: "Reopen draft", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sent for review", exact: true })).toBeVisible();
    await page.clock.runFor(50);
    await expect(page.getByRole("button", { name: "Close editor", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test("all fourteen mega-menu anchors select local content without breaking the preview route", async ({
  page,
}) => {
  await page.goto("./#/preview/application/navbar/navbar-12");
  const original = page.url();
  for (const [menu, names] of [
    [
      "Product",
      [
        "Business accounts",
        "Corporate cards",
        "Global payments",
        "Transfers",
        "Bill pay",
        "Invoicing",
        "Treasury",
        "Insights",
      ],
    ],
    ["Company", ["About us", "Careers", "Customer stories", "Journal", "Changelog", "Contact"]],
  ] as const) {
    for (const name of names) {
      await page.getByRole("button", { name: menu, exact: true }).click();
      await page
        .getByLabel(`${menu} pages`, { exact: true })
        .getByRole("link", { name: new RegExp(`^${name}`) })
        .click();
      await expect(
        page
          .getByLabel("Selected marketing page", { exact: true })
          .getByText(name, { exact: true }),
      ).toBeVisible();
      expect(page.url()).toBe(original);
    }
  }
});

test("free native NavigationMenu opens on hover and retains keyboard/Escape behavior", async ({
  page,
}) => {
  await page.goto("./#/preview/application/navbar/navbar-12");
  const product = page.getByRole("button", { name: "Product", exact: true });
  await product.hover();
  await expect(page.getByLabel("Product pages", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Company", exact: true }).hover();
  await expect(page.getByLabel("Company pages", { exact: true })).toBeVisible();
  await page.getByRole("heading", { name: "Navbar", exact: true }).hover();
  await expect(page.getByLabel("Company pages", { exact: true })).toBeHidden();
  await product.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Product pages", { exact: true })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("link", { name: /^Business accounts/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Product pages", { exact: true })).toBeHidden();
  await expect(product).toBeFocused();
});

test("actual sliding arrow animates on hover and pricing/get-started have real local destinations", async ({
  page,
}) => {
  await page.goto("./#/preview/application/navbar/navbar-12");
  const start = page.getByRole("button", { name: "Get Started", exact: true });
  const arrow = start.locator("svg");
  await expect(arrow).toHaveCSS("opacity", "0");
  await start.hover();
  await expect(arrow).toHaveCSS("opacity", "1");
  await start.click();
  await expect(page.getByLabel("Selected marketing page", { exact: true })).toContainText(
    "Get started with Bricklane",
  );
  await page.getByRole("button", { name: "Back to navigation", exact: true }).click();
  await expect(page.getByLabel("Selected marketing page", { exact: true })).toBeHidden();
  await page.getByRole("link", { name: "Pricing", exact: true }).click();
  await expect(page.getByLabel("Selected marketing page", { exact: true })).toContainText(
    "No purchase or subscription is created",
  );
});

test("closing a pending review cleans up the free async timer rather than submitting an unmounted action", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("./#/preview/application/navbar/navbar-13");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  await page.clock.fastForward(1200);
  await expect(page.getByLabel("Closed editor", { exact: true })).toContainText(
    "Invoice draft · Draft",
  );
  await page.getByRole("button", { name: "Reopen draft", exact: true }).click();
  await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeEnabled();
  await expect(page.locator("output")).toContainText("Review not submitted");
});

test("invoice summary copies the original local sample instead of an unrelated placeholder", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/preview/application/navbar/navbar-13");
  await page.getByRole("button", { name: "Copy invoice summary", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("BL-2026-014 · Cedar Studio · $1,550.00 · Due November 6, 2026");
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    "Original demo invoice summary copied",
  );
});

for (const [id, module] of [
  [12, "marketing"],
  [13, "editor"],
] as const) {
  test(`Navbar ${id} code, clipboard and source download resolve the actual leaf`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`./#/block/application/navbar/navbar-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const filename = `src/blocks/application/navbar-variants/final-bars/${module}.tsx`;
    await expect(page.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      filename,
    );
    const raw = await readFile(filename, "utf8");
    const source = page.getByRole("dialog").locator(".source-code");
    await source.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(raw);
    const pending = page.waitForEvent("download");
    await source.getByRole("button", { name: "Download source file", exact: true }).click();
    expect(await readFile((await (await pending).path())!, "utf8")).toBe(raw);
  });
}

test("starter export contains the actual free mega-menu, arrow, editor controls and new upstream UI", async ({
  page,
}) => {
  await page.goto("./#/block/application/navbar/navbar-12");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const files = unzipSync(new Uint8Array(await readFile((await (await pending).path())!)));
  for (const module of [
    "marketing",
    "editor",
    "free/mega-menu",
    "free/sliding-cta",
    "free/editor-actions",
    "free/content-card",
  ]) {
    const filename = `src/blocks/application/navbar-variants/final-bars/${module}.tsx`;
    expect(strFromU8(files[filename])).toBe(await readFile(filename, "utf8"));
  }
  const ui = "src/components/ui/navigation-menu.tsx";
  expect(strFromU8(files[ui])).toBe(await readFile(ui, "utf8"));
  expect(strFromU8(files[ui])).toContain("Raw upstream SHA256");
  expect(
    strFromU8(files["src/blocks/application/navbar-variants/final-bars/free/mega-menu.tsx"]),
  ).toContain("c-navigation-menu-4");
});
