import { test, expect } from "@playwright/test";

const route = (n: number) => `./#/preview/application/app-shell/app-shell-${n}`;

for (const n of [14, 16]) {
  test(`AppShell ${n} has its own application rail and complete secondary navigation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route(n));
    const rail = page.getByRole("complementary", { name: "Workspace applications" });
    expect((await rail.boundingBox())!.width).toBe(n === 14 ? 60 : 76);
    expect((await page.locator('[data-slot="sidebar-inset"]').boundingBox())!.x).toBe(
      n === 14 ? 300 : 316,
    );
    await expect(page.getByRole("button", { name: "Fleet", exact: true })).toHaveCount(0);
    if (n === 16)
      await expect(page.getByRole("button", { name: "Careers", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Collapse secondary navigation", exact: true }).click();
    await expect(page.getByRole("button", { name: "Business Concepts", exact: true })).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "Expand secondary navigation", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Business Concepts", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Network application", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Network");
    await page.keyboard.press("Control+b");
    await expect
      .poll(async () => (await page.locator('[data-slot="sidebar-inset"]').boundingBox())!.x)
      .toBe(n === 14 ? 48 : 304);
    const compactBrand = rail.locator('[data-slot="sidebar-header"] svg').first();
    await expect(compactBrand).toBeVisible();
    const brandBox = (await compactBrand.boundingBox())!;
    expect(brandBox.width).toBe(24);
    if (n === 16) {
      await expect(page.getByRole("button", { name: "Careers", exact: true })).toBeVisible();
      await page.keyboard.press("Control+b");
    } else {
      await page.getByRole("button", { name: "Network application", exact: true }).click();
      await expect
        .poll(async () => (await page.locator('[data-slot="sidebar-inset"]').boundingBox())!.x)
        .toBe(300);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Open workspace navigation", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Workspace navigation", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Collapse secondary navigation", exact: true }),
    ).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Open workspace navigation", exact: true }),
    ).toBeFocused();
  });
}

test("planner header and sidebar stay in the same month across a year boundary", async ({
  page,
}) => {
  await page.goto(route(19));
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(page.getByRole("heading", { name: "February 2027", exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="calendar"] .rdp-caption_label')).toHaveText(
    "February 2027",
  );
  await page.getByRole("button", { name: "Previous month", exact: true }).click();
  await expect(page.getByRole("heading", { name: "January 2027", exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="calendar"] .rdp-caption_label')).toHaveText(
    "January 2027",
  );
  expect((await page.locator(".shell-planner-track").boundingBox())!.height).toBe(34);
});

test("chat model menu exposes descriptions, synchronizes selection and clears real history", async ({
  page,
}) => {
  await page.goto(route(17));
  await page.getByRole("button", { name: "Choose model", exact: true }).click();
  await expect(page.getByRole("menu")).toContainText("Thoughtful, great for long writing.");
  await page.getByRole("menuitem", { name: "Claude", exact: true }).click();
  await expect(page.getByRole("button", { name: "Claude", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Clear History", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Quarterly revenue summary", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Chat history cleared", { exact: true })).toBeVisible();
});

for (const n of [23, 24, 26, 27, 28, 29, 32]) {
  test(`AppShell ${n} uses its reference Frame summary and body grid`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route(n));
    const blank = n === 28 || n === 29;
    await expect(page.locator(".console-summary")).toHaveCount(n === 24 || n === 28 ? 4 : 3);
    await expect(page.locator(".console-summary.blank")).toHaveCount(
      blank ? (n === 28 ? 4 : 3) : 0,
    );
    const body = page.locator(".console-body-panel").first();
    const border = await body.evaluate((el) => ({
      width: getComputedStyle(el).borderTopWidth,
      radius: getComputedStyle(el).borderTopLeftRadius,
    }));
    expect(border).toEqual({ width: "1px", radius: "16px" });
    if ([26, 27, 32].includes(n))
      expect((await page.locator(".shell-scope-panel").boundingBox())!.width).toBe(
        n === 26 ? 288 : 256,
      );
    if (n === 28) {
      const top = (await page.locator(".console-summary").first().boundingBox())!;
      expect(top.y).toBe(76);
      expect(top.height).toBe(160);
    }
    if (n === 27)
      await expect(
        page.getByRole("button", { name: "Fleet Preferences", exact: true }),
      ).toHaveCount(0);
  });
}

test("operational section tabs support arrow and End navigation", async ({ page }) => {
  await page.goto(route(24));
  const tabs = page.getByRole("tablist", { name: "Sections", exact: true });
  await tabs.getByRole("tab", { name: "Fleet", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: "Missions", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("End");
  await expect(tabs.getByRole("tab", { name: "Reports", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("compact route search remains keyboard usable and upgrade changes local plan state", async ({
  page,
}) => {
  await page.goto(route(27));
  await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Search navigation", exact: true })).toBeVisible();
  await page.keyboard.press("Control+f");
  await page
    .getByRole("combobox", { name: "Search workspace routes", exact: true })
    .fill("Security Center");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Control+b");
  await expect(page.getByRole("button", { name: "Security Center", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("button", { name: "Upgrade", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Upgrade workspace", exact: true })
    .getByRole("button", { name: "Pro workspace", exact: true })
    .click();
  await expect(
    page.getByText("Pro workspace enabled in this demo.", { exact: true }),
  ).toBeVisible();
});

for (const n of [27, 29]) {
  test(`compact console ${n} keeps its header toggle inside the painted rail`, async ({ page }) => {
    await page.goto(route(n));
    const toggle = page.getByRole("button", { name: "Toggle Sidebar", exact: true });
    await toggle.click();
    const panel = page.locator('[data-slot="sidebar-container"]').first();
    await expect.poll(async () => (await panel.boundingBox())!.width).toBe(48);
    const rail = (await panel.boundingBox())!;
    const button = (await toggle.boundingBox())!;
    expect(button.x).toBeGreaterThanOrEqual(rail.x);
    expect(button.x + button.width).toBeLessThanOrEqual(rail.x + rail.width);
    await expect(page.locator(".shell-promo")).toHaveCount(0);
    await toggle.click();
    await expect.poll(async () => (await panel.boundingBox())!.width).toBe(n === 27 ? 224 : 256);
  });
}
