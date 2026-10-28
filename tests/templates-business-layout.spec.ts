import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, id: string) {
  await page.goto(`/#/template-preview/${id}`, { waitUntil: "networkidle" });
  if (id === "cohort" || id === "manifest") {
    const entry = page.getByRole("button", {
      name: id === "cohort" ? "Sign in" : "Log in",
      exact: true,
    });
    await expect(entry).toBeVisible();
    await entry.click();
  }
  await expect(page.locator(".bt-layout")).toBeVisible();
}

for (const [id, expanded, compact] of [
  ["cohort", 256, 66],
  ["atlas", 256, 48],
  ["surge", 260, 62],
  ["manifest", 260, 62],
  ["verve", 200, 0],
  ["miro", 302, 0],
] as const) {
  test(`${id} uses the real sidebar slots, inset, collapse and keyboard state`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await open(page, id);
    const container = page.locator(".bt-sidebar[data-slot=sidebar-container]");
    const sidebar = page.locator(".bt-layout-columns > [data-slot=sidebar]");
    await expect(container.locator('[data-slot="sidebar-rail"]')).toHaveCount(
      id === "cohort" ? 0 : 1,
    );
    if (id === "surge" || id === "manifest") {
      await expect(container.locator('[data-slot="sidebar-group-label"]')).toHaveText([
        "Store",
        "System",
      ]);
    }
    await expect(container.locator('[data-slot="sidebar-header"]')).toHaveCount(1);
    await expect(container.locator('[data-slot="sidebar-content"]')).toHaveCount(1);
    await expect(container.locator('[data-slot="sidebar-footer"]')).toHaveCount(1);
    await expect(page.locator('[data-slot="sidebar-inset"]')).toHaveCSS("display", "flex");
    await expect
      .poll(() => container.evaluate((node) => node.getBoundingClientRect().width))
      .toBe(expanded);
    const initialMainWidth = await page
      .locator(".bt-main")
      .evaluate((node) => node.getBoundingClientRect().width);
    await container.getByRole("button", { name: "Collapse sidebar", exact: true }).first().click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await expect
      .poll(() => container.evaluate((node) => node.getBoundingClientRect().width))
      .toBe(compact);
    expect(
      await page.locator(".bt-main").evaluate((node) => node.getBoundingClientRect().width),
    ).toBeGreaterThan(initialMainWidth);
    await page.keyboard.press("Control+b");
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await expect
      .poll(() => container.evaluate((node) => node.getBoundingClientRect().width))
      .toBe(expanded);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      1440,
    );
    expect(errors).toEqual([]);
  });

  test(`${id} mobile sidebar keeps a scrollable body and closes after actual navigation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, id);
    const trigger = page.getByRole("button", { name: "Open menu", exact: true });
    await trigger.click();
    const drawer = page.locator(".bt-layout-mobile");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Close", exact: true })).toHaveCount(
      id === "miro" ? 0 : 1,
    );
    await expect(drawer.locator(':scope > div > [data-slot="sidebar-content"]')).toHaveCSS(
      "overflow-y",
      "auto",
    );
    await expect(drawer.locator(':scope > div > [data-slot="sidebar-header"]')).toHaveCount(1);
    await expect(drawer.locator(':scope > div > [data-slot="sidebar-footer"]')).toHaveCount(1);
    await expect
      .poll(() => drawer.evaluate((node) => node.getBoundingClientRect().width))
      .toBe(id === "cohort" ? 288 : 292.5);
    if (id === "verve" || id === "miro") {
      await expect(drawer.locator(".bt-mobile-icon-rail")).toHaveCount(1);
      await expect(drawer.locator(".bt-mobile-icon-rail")).toBeVisible();
      await expect
        .poll(() =>
          drawer
            .locator(".bt-mobile-icon-rail")
            .evaluate((node) => node.getBoundingClientRect().width),
        )
        .toBe(48);
    }
    expect(await drawer.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(293);
    if (id === "cohort") {
      await drawer.getByRole("button", { name: "Settings", exact: true }).click();
      await expect(drawer).toBeVisible();
      await drawer.getByRole("button", { name: "Preferences", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Preferences", exact: true })).toBeVisible();
    } else {
      await drawer.getByRole("button", { name: "Settings", exact: true }).first().click();
      await expect(page.locator(".bt-content")).toContainText("Settings");
    }
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  });
}

test("Cohort settings and Time remain navigable after collapsing and mobile resizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, "cohort");
  await page.getByRole("button", { name: "Time", exact: true }).click();
  await page.getByRole("button", { name: "Timesheets", exact: true }).click();
  await expect(page.locator(".bt-content")).toContainText("Timesheets");
  await page.keyboard.press("Control+b");
  await page.locator(".bt-sidebar").getByRole("button", { name: "Settings", exact: true }).click();
  await expect
    .poll(() => page.getByRole("menu").evaluate((node) => node.getBoundingClientRect().width))
    .toBe(192);
  await page.getByRole("menuitem", { name: "Preferences", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Preferences", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  const lists = await page
    .locator('.bt-content .bt-settings-tabs, .bt-content [data-slot="tabs-list"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        y: getComputedStyle(node).overflowY,
        client: node.clientHeight,
        scroll: node.scrollHeight,
      })),
    );
  expect(lists.length).toBeGreaterThan(0);
  expect(
    lists.filter((node) => ["auto", "scroll"].includes(node.y) && node.scroll > node.client),
  ).toEqual([]);
  const strip = page.locator(".bt-settings-tabs");
  await strip.getByRole("button").last().focus();
  await expect.poll(() => strip.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
});

test("Business navigation reuses the working AppShell command palette", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, "cohort");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search", exact: true });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("combobox", { name: "Search workspace routes", exact: true })
    .fill("Timesheets");
  await dialog.getByRole("option", { name: "Timesheets", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".bt-content")).toContainText("Timesheets");
});

for (const id of ["atlas", "miro"]) {
  test(`${id} mobile drawer and nested portal honor global Serif, Mono and Reset`, async ({
    page,
    context,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const controls = await context.newPage();
    await controls.setViewportSize({ width: 390, height: 844 });
    await controls.goto("/#/templates/atlas", { waitUntil: "networkidle" });
    await controls.getByRole("button", { name: "Customize", exact: true }).click();
    await open(page, id);
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const drawer = page.locator(".bt-layout-mobile");
    for (const [mode, expected] of [
      ["Default", /Inter/],
      ["Serif", /Georgia/],
      ["Mono", /ui-monospace/],
      ["Reset", /Inter/],
    ] as const) {
      if (mode === "Reset") {
        await controls.getByRole("button", { name: "Reset", exact: true }).click();
      } else if (mode !== "Default") {
        await controls.getByRole("combobox", { name: "Body font", exact: true }).click();
        await controls.getByRole("option", { name: mode, exact: true }).click();
      }
      await expect(drawer).toHaveCSS("font-family", expected);
      const trigger = drawer.getByRole("button", {
        name: id === "atlas" ? "Switch workspace" : "Search navigation",
        exact: true,
      });
      await trigger.click();
      const popup =
        id === "atlas"
          ? page.getByRole("menu")
          : page.getByRole("dialog", { name: "Search", exact: true });
      await expect(popup).toBeVisible();
      await expect(popup).toHaveCSS("font-family", expected);
      await page.screenshot({
        path: testInfo.outputPath(`${id}-${mode}-390.png`),
        animations: "disabled",
      });
      if (id === "atlas") {
        await expect(popup.getByRole("menuitem", { name: "Bricklane", exact: true })).toContainText(
          "Bricklane",
        );
      } else {
        await popup
          .getByRole("combobox", { name: "Search workspace routes", exact: true })
          .fill("Settings");
        await expect(popup.getByRole("option", { name: "Settings", exact: true })).toBeVisible();
      }
      await page.keyboard.press("Escape");
      await expect(popup).toBeHidden();
      await expect(drawer).toBeVisible();
      await expect(trigger).toBeFocused();
      const account = drawer.getByRole("button", {
        name: `Open account menu for ${id === "atlas" ? "Amara Ortiz" : "Nick Bold"}`,
        exact: true,
      });
      await account.click();
      const accountMenu = page.getByRole("menu");
      await expect(accountMenu).toHaveCSS("font-family", expected);
      await expect(
        accountMenu.getByRole("menuitem", { name: "Settings", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(accountMenu).toBeHidden();
      await expect(account).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
    }
    await controls.close();
  });
}
