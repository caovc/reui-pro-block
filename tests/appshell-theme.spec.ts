import { expect, test, type Page } from "@playwright/test";

const colors = { emerald: "rgb(4, 120, 87)", violet: "rgb(124, 58, 237)" };
const nav = [
  [1, "Overview"],
  [4, "Inbox"],
  [5, "Calendars"],
  [7, "Overview"],
  [8, "Inventory section"],
  [11, "Today"],
  [12, "Overview"],
  [13, "Public Profiles"],
  [18, "All Tasks"],
  [19, "Events"],
  [20, "Inbox"],
] as const;
async function open(page: Page, n: number, theme: Record<string, string>) {
  await page.goto("about:blank");
  await page.goto(
    `./#/preview/application/app-shell/app-shell-${n}?preset=${encodeURIComponent(JSON.stringify(theme))}`,
  );
  await expect(page.locator(`[data-shell-variant="${n}"]`)).toBeVisible();
}

for (const accent of ["emerald", "violet"] as const) {
  for (const mode of ["light", "dark"]) {
    test(`${accent} ${mode}: reference navigation, badges and brand ink follow the selected accent`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const [n, name] of nav) {
        await open(page, n, { accent, mode });
        const selected = page.getByRole("button", { name, exact: true }).first();
        await expect(selected).toHaveCSS("color", colors[accent]);
        await expect(selected).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        if (n === 1) {
          const mark = page
            .locator('[data-slot="sidebar-header"] svg[viewBox="0 0 32 32"]')
            .first();
          await expect(mark.locator("rect").nth(0)).toHaveCSS("fill", colors[accent]);
          await expect(mark.locator("rect").nth(1)).toHaveCSS("fill", "rgb(255, 255, 255)");
        }
        if (n === 18) {
          const badge = page.locator(
            '.todo-lists [data-active="true"] + [data-slot="sidebar-menu-badge"]',
          );
          await expect(badge).toHaveCSS("color", colors[accent]);
          await expect(page.locator(".todo-focus .bg-primary")).toHaveCSS(
            "background-color",
            colors[accent],
          );
        }
      }
      expect(errors).toEqual([]);
    });
  }
}

test("global Customize updates the actual iframe navigation without clearing task state", async ({
  page,
}) => {
  await page.goto("./#/block/application/app-shell/app-shell-18");
  const frame = page.frameLocator("iframe");
  await frame.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  const accent = page.getByRole("combobox", { name: "Accent color", exact: true });
  await accent.click();
  await page.getByRole("option", { name: "Violet", exact: true }).click();
  await expect(frame.getByRole("button", { name: "Today", exact: true })).toHaveCSS(
    "color",
    colors.violet,
  );
  await expect(frame.getByRole("button", { name: "Today", exact: true })).toHaveAttribute(
    "data-active",
    "true",
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(frame.getByRole("button", { name: "Today", exact: true })).not.toHaveCSS(
    "color",
    colors.violet,
  );
  await expect(frame.getByRole("button", { name: "Today", exact: true })).toHaveAttribute(
    "data-active",
    "true",
  );
});

test("phone navigation retains the same theme after desktop folding and restores focus", async ({
  page,
}) => {
  for (const n of [1, 18, 20]) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, n, { accent: "emerald", mode: "dark" });
    await page.keyboard.press("Control+b");
    await page.setViewportSize({ width: 390, height: 844 });
    if (n === 18) await page.getByRole("button", { name: "Close assistant", exact: true }).click();
    const opener = page.getByRole("button", { name: "Open navigation", exact: true });
    await opener.click();
    const sheet = page.getByRole("dialog", { name: "Navigation", exact: true });
    const selected = sheet.locator('[data-sidebar="menu-button"][data-active="true"]').first();
    await expect(selected).toHaveCSS("color", colors.emerald);
    await page.keyboard.press("Escape");
    await expect(sheet).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
});

test("solid application rail selections preserve contrast and actual selection behavior", async ({
  page,
}) => {
  for (const n of [25, 32]) {
    await open(page, n, { accent: "violet" });
    const rail = page.getByRole("complementary", { name: "Applications", exact: true });
    const selected = rail.locator('[data-active="true"]');
    await expect(selected).toHaveCSS("background-color", colors.violet);
    await expect(selected).toHaveCSS("color", "rgb(255, 255, 255)");
    await rail.getByRole("button", { name: "Reports", exact: true }).click();
    await expect(rail.getByRole("button", { name: "Reports", exact: true })).toHaveCSS(
      "background-color",
      colors.violet,
    );
  }
  await open(page, 35, { accent: "emerald" });
  await expect(page.getByRole("link", { name: "Boards", exact: true })).toHaveCSS(
    "background-color",
    colors.emerald,
  );
});

test("inventory application menu reuses native selection and retains its section workflow", async ({
  page,
}) => {
  await open(page, 8, { accent: "emerald" });
  await page.getByRole("button", { name: "Orders section", exact: true }).click();
  const orders = page.getByRole("button", { name: "Orders section", exact: true });
  await expect(orders).toHaveAttribute("data-active", "true");
  await expect(orders).toHaveCSS("color", colors.emerald);
  await expect(
    page.getByRole("complementary", { name: "Orders navigation", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Product Catalog", exact: true }),
  ).not.toBeVisible();
});

test("reference-neutral menu families retain neutral selection when only accent changes", async ({
  page,
}) => {
  for (const n of [2, 3]) {
    await open(page, n, { accent: "emerald" });
    const selected = page.locator('[data-sidebar="menu-button"][data-active="true"]').first();
    const neutral = await selected.evaluate((e) => getComputedStyle(e).color);
    await open(page, n, { accent: "violet" });
    await expect(
      page.locator('[data-sidebar="menu-button"][data-active="true"]').first(),
    ).toHaveCSS("color", neutral);
  }
});

test("scope tabs and operational controls retain the reference ring color", async ({ page }) => {
  await open(page, 26, { accent: "violet" });
  const code = page.getByRole("tab", { name: "Code", exact: true });
  await expect(code).toHaveCSS("color", colors.violet);
  await code.click();
  await expect(code).toHaveAttribute("data-state", "active");
  await expect(code).toHaveCSS("border-color", "oklab(0.54132 0.0964073 -0.226955 / 0.5)");
  for (const [n, name] of [
    [33, "Live map"],
    [34, "Suppliers"],
  ] as const) {
    await open(page, n, { accent: "violet" });
    await expect(page.getByRole("button", { name, exact: true })).toHaveCSS("color", colors.violet);
  }
});

test("custom HEX reaches the dark header brand while its decorative gradient stays intact", async ({
  page,
}) => {
  await open(page, 15, { custom: "#e11d48" });
  const mark = page.locator('.shell-header svg[viewBox="0 0 32 32"]').first();
  await expect(mark.locator("rect").first()).toHaveCSS("fill", "rgb(225, 29, 72)");
  await expect(mark.locator("rect").nth(1)).toHaveCSS("fill", "rgb(255, 255, 255)");
  const upgrade = page.getByRole("button", { name: "Upgrade", exact: true });
  const gradient = await upgrade.evaluate((e) => getComputedStyle(e).backgroundImage);
  expect(gradient).toContain("linear-gradient");
  await upgrade.click();
  await expect(page.getByRole("menuitem", { name: "Pro workspace", exact: true })).toBeVisible();
});

test("semantic status colors and task tags remain separate from the accent", async ({ page }) => {
  await open(page, 18, { accent: "violet" });
  const readTags = () =>
    page
      .locator('.todo-tags [data-slot="button"] > span')
      .evaluateAll((elements) => elements.map((e) => getComputedStyle(e).backgroundColor));
  const violetTags = await readTags();
  expect(violetTags.length).toBeGreaterThan(0);
  await open(page, 18, { accent: "emerald" });
  expect(await readTags()).toEqual(violetTags);
  await open(page, 1, { accent: "violet" });
  const status = page.locator('[data-slot="sidebar-menu-badge"]').first();
  await expect(status).toHaveCSS("color", "rgb(0, 96, 69)");
});

test("dashboard badge, dark workspace rail and fleet tiles retain their distinct accent treatments", async ({
  page,
}) => {
  await open(page, 12, { accent: "violet" });
  await expect(page.getByText("Soon", { exact: true })).toHaveCSS(
    "background-color",
    colors.violet,
  );
  await open(page, 16, { accent: "violet" });
  const updates = page.getByRole("button", { name: "Updates application", exact: true });
  await expect(updates).toHaveCSS("background-color", "oklab(0.54132 0.0964073 -0.226955 / 0.05)");
  await open(page, 29, { accent: "violet" });
  const map = page.getByRole("button", { name: "Live Map", exact: true });
  await expect(map.locator("svg")).toHaveCSS("color", colors.violet);
});
