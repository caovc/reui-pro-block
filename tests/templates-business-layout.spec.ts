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

async function expectCohortInset(page: Page, width: number, containerWidth = width) {
  const sidebar = await page.locator(".bt-sidebar[data-slot=sidebar-container]").boundingBox();
  const inset = await page.locator('[data-slot="sidebar-inset"]').boundingBox();
  expect(sidebar).not.toBeNull();
  expect(inset).not.toBeNull();
  expect(Math.abs(sidebar!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(sidebar!.width - containerWidth)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(inset!.x - (sidebar!.x + sidebar!.width) - (width - containerWidth)),
  ).toBeLessThanOrEqual(1);
  expect(Math.abs(inset!.x - width)).toBeLessThanOrEqual(1);
}

for (const [id, expanded, compact] of [
  ["cohort", 256, 64],
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
    if (id === "cohort") await expectCohortInset(page, expanded);
    const initialMainWidth = await page
      .locator(".bt-main")
      .evaluate((node) => node.getBoundingClientRect().width);
    await container.getByRole("button", { name: "Collapse sidebar", exact: true }).first().click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await expect
      .poll(() => container.evaluate((node) => node.getBoundingClientRect().width))
      .toBe(id === "cohort" ? 66 : compact);
    if (id === "cohort") await expectCohortInset(page, compact, 66);
    expect(
      await page.locator(".bt-main").evaluate((node) => node.getBoundingClientRect().width),
    ).toBeGreaterThan(initialMainWidth);
    await page.keyboard.press("Control+b");
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await expect
      .poll(() => container.evaluate((node) => node.getBoundingClientRect().width))
      .toBe(expanded);
    if (id === "cohort") await expectCohortInset(page, expanded);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      1440,
    );
    expect(errors).toEqual([]);
  });

  test(`${id} mobile sidebar keeps a scrollable body and uses native navigation dismissal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, id);
    const trigger = page.getByRole("button", { name: "Open menu", exact: true });
    await trigger.click();
    const drawer = page.locator(".bt-layout-mobile");
    await expect(drawer).toBeVisible();
    const commerce = id === "surge" || id === "manifest";
    await expect(drawer.getByRole("button", { name: "Close", exact: true })).toHaveCount(
      id === "cohort" || id === "atlas" || id === "miro" || commerce ? 0 : 1,
    );
    if (commerce) {
      // The reference header is Search-only; the native Sidebar API omits its hidden Close.
      const header = drawer.locator('[data-slot="sidebar-header"]');
      await expect(header).toHaveCSS("height", "56px");
      await expect(
        header.getByRole("button", { name: "Search navigation", exact: true }),
      ).toBeVisible();
      await expect(drawer.locator(".bt-brand")).toHaveCount(0);
      await expect(drawer.locator('[data-slot="sheet-close"]')).toHaveCount(0);
    }
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
    if (id === "atlas") {
      // Atlas includes the observed outside collapse control. Verify the actual
      // navigation body stays bounded independently of the outer Sheet.
      const body = drawer.locator(':scope > div > [data-slot="sidebar-content"]');
      const contentWidth = await body.evaluate((node) => ({
        scroll: node.scrollWidth,
        client: node.clientWidth,
      }));
      expect(contentWidth.scroll).toBeLessThanOrEqual(contentWidth.client);
    } else {
      expect(await drawer.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(293);
    }
    if (id === "cohort") {
      await drawer.getByRole("button", { name: "Settings", exact: true }).click();
      await expect(drawer).toBeVisible();
      const preferences = drawer.getByRole("button", { name: "Preferences", exact: true });
      await preferences.click();
      await expect(drawer).toBeVisible();
      await expect(preferences).toBeFocused();
      await page.keyboard.press("Escape");
    } else if (id === "atlas") {
      // The observed Atlas Settings link navigates while retaining the native Sheet.
      const settings = drawer.getByRole("link", { name: "Settings", exact: true });
      await settings.click();
      await expect(page).toHaveURL(/\/atlas\/account\/profile$/);
      await expect(drawer).toBeVisible();
      await expect(settings).toBeFocused();
      await expect(page.locator(".atlas-account-settings")).toContainText("Profile");
      await page.keyboard.press("Escape");
    } else {
      await drawer.getByRole("button", { name: "Settings", exact: true }).first().click();
      if (id === "surge" || id === "manifest") {
        // Settings is the actual native group. Selecting its General child navigates.
        await expect(drawer).toBeVisible();
        await drawer.getByRole("button", { name: "General", exact: true }).click();
        await expect(page.getByRole("textbox", { name: "Store name", exact: true })).toBeVisible();
      } else if (id === "verve") {
        await expect(
          page.getByRole("textbox", { name: "Workspace name", exact: true }),
        ).toBeVisible();
      }
      if (id === "miro") {
        // The page title belongs to Shell's header; the native body opens My Profile.
        await expect(
          page.locator(".bt-topbar").getByRole("heading", { name: "Settings", exact: true }),
        ).toBeVisible();
        await expect(
          page.locator(".bt-content").getByRole("tabpanel", { name: "My Profile", exact: true }),
        ).toBeVisible();
      }
      await expect(page.locator(".bt-content")).toContainText(
        id === "surge" || id === "manifest" ? "General" : id === "miro" ? "My profile" : "Settings",
      );
    }
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    if (id === "cohort") {
      await expect(page.getByRole("tabpanel", { name: "Preferences", exact: true })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  });
}

test("Cohort mobile Policies, Profile and Dashboard keep the native drawer until Escape", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") faults.push(message.text());
  });
  await open(page, "cohort");
  const trigger = page.getByRole("button", { name: "Open menu", exact: true });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Cohort", exact: true });
  const content = page.locator(".bt-content");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Settings", exact: true }).click();
  const observed = [];
  for (const name of ["Policies", "Profile", "Dashboard"]) {
    const leaf = drawer.getByRole("button", { name, exact: true });
    await leaf.click();
    if (name === "Policies") {
      // Sheet makes its sibling page aria-hidden; read actual rendered content without clicking it.
      await expect(
        content.getByRole("region", { name: "Leave types", exact: true, includeHidden: true }),
      ).toBeVisible();
    } else if (name === "Profile") {
      await expect(content.getByLabel("Full Name", { exact: true })).toBeVisible();
    } else {
      await expect(content.getByText("Workforce overview", { exact: true })).toBeVisible();
    }
    await expect(leaf).toHaveAttribute("aria-current", "page");
    await expect(drawer).toBeVisible();
    await expect(leaf).toBeFocused();
    await expect.poll(async () => (await drawer.boundingBox())?.x).toBe(0);
    const bounds = await drawer.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBe(288);
    expect(bounds!.x).toBe(0);
    observed.push({ name, bounds });
  }
  await info.attach("cohort-mobile-leaf-navigation", {
    body: JSON.stringify(observed, null, 2),
    contentType: "application/json",
  });
  await drawer.screenshot({ path: info.outputPath("cohort-dashboard-drawer.png") });
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await info.attach("runtime-faults", {
    body: JSON.stringify(faults, null, 2),
    contentType: "application/json",
  });
  expect(faults).toEqual([]);
});

test("Cohort settings and Time remain navigable after collapsing and mobile resizing", async ({
  page,
}, info) => {
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
  await expect(page.getByRole("tabpanel", { name: "Preferences", exact: true })).toBeVisible();
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
  const tabs = strip.getByRole("tab");
  await expect(tabs).toHaveCount(6);
  const actualTabs = await tabs.evaluateAll((nodes) =>
    nodes.map((node) => ({
      tag: node.tagName,
      role: node.getAttribute("role"),
      tabIndex: (node as HTMLElement).tabIndex,
      text: node.textContent?.trim(),
    })),
  );
  await info.attach("cohort-settings-native-anchor-tabs", {
    body: JSON.stringify(actualTabs, null, 2),
    contentType: "application/json",
  });
  expect(actualTabs).toEqual(
    ["Organisation", "Policies", "Approval flows", "Profile", "Preferences", "Security"].map(
      (text) => ({ tag: "A", role: "tab", tabIndex: -1, text }),
    ),
  );
  // Native Radix enters the unfocused list through its selected tab.
  await expect(strip).toHaveAttribute("tabindex", "0");
  await expect(page.getByRole("link", { name: "People", exact: true })).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Settings", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(tabs.nth(4)).toBeFocused();
  await expect(tabs.nth(4)).toHaveAttribute("aria-selected", "true");
  await expect(tabs.nth(4)).toHaveAttribute("tabindex", "0");
  await tabs.first().click();
  await expect(tabs.first()).toBeFocused();
  for (let index = 1; index < 6; index++) {
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  }
  await expect(tabs.last()).toBeFocused();
  // The observed wide native tab list scrolls the containing main panel.
  await expect
    .poll(() => page.locator(".bt-main").evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(0);
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
        animations: id === "atlas" ? "allow" : "disabled",
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
        name: `Open account menu for ${id === "atlas" ? "Amara Ortiz" : id === "miro" ? "Mara Ellis" : "Nick Bold"}`,
        exact: true,
      });
      await account.click();
      const accountMenu = page.getByRole("menu");
      await expect(accountMenu).toHaveCSS("font-family", expected);
      await expect(
        accountMenu.getByRole("menuitem", {
          name: id === "atlas" ? "Account settings" : "Settings",
          exact: true,
        }),
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
