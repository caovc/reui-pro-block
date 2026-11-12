import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe.configure({ retries: 0 });

const services = [
  { name: "api-gateway", status: "Degraded", version: "v3.14.0", owner: "Marcus Webb" },
  { name: "orders-db", status: "Down", version: "v2.13.0", owner: "Rafael Duarte" },
  { name: "edge-cache", status: "Healthy", version: "v1.12.0", owner: "Amelia Hart" },
  { name: "recommender", status: "Healthy", version: "v3.11.0", owner: "Adam Reyes" },
];

async function open(page: Page, width = 1440) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`${process.env.LUCENT_TEST_BASE_PATH || ""}/#/template-preview/lucent`);
  await expect(page.locator(".wf-devops")).toBeVisible();
  await expect(page).toHaveTitle("Bricklane — Blocks & Templates");
  await page.evaluate(() => document.fonts.ready);
}

async function navigation(page: Page, mobile: boolean) {
  if (mobile) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    return page.locator('[data-slot="sidebar"][data-mobile="true"]');
  }
  return page.locator('.wf-devops > [data-slot="sidebar"]');
}

function serviceButton(sidebar: Locator, name: string) {
  return sidebar
    .locator(".lucent-services-navigation")
    .getByRole("button", { name: new RegExp(`^${name}[ ,].*Open service details$`) });
}

async function checkDetails(page: Page, service: (typeof services)[number]) {
  const dialog = page.getByRole("dialog", { name: service.name, exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("data-slot", "sheet-content");
  for (const text of ["Local demo service", service.status, service.version, service.owner]) {
    await expect(dialog).toContainText(text);
  }
  await expect(dialog.getByRole("button", { name: "Approve change", exact: true })).toHaveCount(0);
  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox();
      return bounds && bounds.x >= 15 && bounds.x + bounds.width <= page.viewportSize()!.width - 15;
    })
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  return dialog;
}

for (const width of [1440, 390]) {
  test(`Lucent Services ${width}: reference navigation and local menu actions open read-only Sheets`, async ({
    page,
    context,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page, width);
    const initialURL = page.url();
    for (const service of services) {
      const sidebar = await navigation(page, width === 390);
      const menu = sidebar.locator(".lucent-services-navigation");
      await expect(menu.locator('[data-slot="sidebar-menu-item"]')).toHaveCount(4);
      const button = serviceButton(sidebar, service.name);
      await expect(button).toHaveAttribute("data-slot", "sidebar-menu-button");
      await button.focus();
      await page.keyboard.press(service.name === "orders-db" ? "Space" : "Enter");
      const details = await checkDetails(page, service);
      expect(page.url()).toBe(initialURL);
      await expect(page.locator(".wf-header")).toContainText("Overview");
      if (width === 390) await expect(sidebar).toHaveCount(0);
      if (service.name === "recommender") {
        await page.screenshot({ path: info.outputPath(`services-${width}.png`) });
      }
      await page.keyboard.press("Escape");
      await expect(details).toHaveCount(0);
      await expect(
        width === 390 ? page.getByRole("button", { name: "Open navigation", exact: true }) : button,
      ).toBeFocused();
    }
    let sidebar = await navigation(page, width === 390);
    const menu = sidebar.locator(".lucent-services-navigation");
    const buttons = menu.locator('[data-slot="sidebar-menu-button"]');
    for (const [index, name] of [
      "api-gateway",
      "recommender",
      "orders-db",
      "edge-cache",
    ].entries()) {
      await expect(buttons.nth(index)).toContainText(name);
    }
    const dots = menu.locator(".wf-service-dot");
    for (const [index, status] of ["Degraded", "Healthy", "Down", "Healthy"].entries()) {
      await expect(dots.nth(index)).toHaveAttribute("data-health", status);
    }
    const colors = await dots.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).backgroundColor),
    );
    expect(new Set(colors).size).toBe(3);
    expect(colors[1]).toBe(colors[3]);
    const group = menu.getByRole("button", { name: "Services", exact: true });
    await group.click();
    await expect(group).toHaveAttribute("aria-expanded", "false");
    await expect(buttons).toHaveCount(0);
    await group.focus();
    await page.keyboard.press("Space");
    await expect(group).toHaveAttribute("aria-expanded", "true");
    await expect(buttons).toHaveCount(4);
    await page.screenshot({ path: info.outputPath(`service-navigation-${width}.png`) });

    const actions = sidebar.getByRole("button", { name: "Actions for recommender", exact: true });
    await actions.click();
    const dropdown = page.getByRole("menu");
    await expect(dropdown.getByRole("menuitem")).toHaveText([
      "Details",
      "Copy name",
      "Pin to top",
      "Remove",
    ]);
    await expect(dropdown).toContainText("Local pinned services");
    await dropdown.getByRole("menuitem", { name: "Copy name", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("recommender");
    await expect(actions).toBeFocused();
    await actions.click();
    await dropdown.getByRole("menuitem", { name: "Pin to top", exact: true }).click();
    await expect(buttons.first()).toContainText("recommender");
    await expect(dropdown).toHaveCount(0);
    await expect(actions).toBeFocused();
    if (width === 390) {
      await page.keyboard.press("Escape");
      await expect(sidebar).toHaveCount(0);
      sidebar = await navigation(page, true);
      await expect(
        sidebar.locator('.lucent-services-navigation [data-slot="sidebar-menu-button"]').first(),
      ).toContainText("recommender");
    }
    await sidebar.getByRole("button", { name: "Actions for edge-cache", exact: true }).click();
    await dropdown.getByRole("menuitem", { name: "Remove", exact: true }).click();
    await expect(serviceButton(sidebar, "edge-cache")).toHaveCount(0);
    await expect(sidebar.getByRole("button", { name: "Services", exact: true })).toBeFocused();
    if (width === 390) {
      await page.keyboard.press("Escape");
      await expect(sidebar).toHaveCount(0);
    }
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    if (width === 390) sidebar = await navigation(page, true);
    await expect(serviceButton(sidebar, "edge-cache")).toBeVisible();
    await sidebar.getByRole("button", { name: "Actions for recommender", exact: true }).click();
    await dropdown.getByRole("menuitem", { name: "Details", exact: true }).click();
    const details = await checkDetails(page, services[3]);
    await details.getByRole("button", { name: "View deployments", exact: true }).click();
    await expect(details).toHaveCount(0);
    if (width === 390 && (await sidebar.count())) await page.keyboard.press("Escape");
    await expect(page.locator(".wf-header")).toContainText("Delivery");
    await expect(page.locator(".lucent-service-overview")).toHaveCount(0);
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("Lucent collapsed Services and utility navigation retain native current state and tooltips", async ({
  page,
}, info) => {
  await open(page);
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  const sidebar = page.locator('.wf-devops > [data-slot="sidebar"]');
  await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(48);
  const service = serviceButton(sidebar, "edge-cache");
  await expect(service).toBeVisible();
  await service.hover();
  await expect(page.getByRole("tooltip", { name: /^edge-cache, Healthy/ })).toBeVisible();
  await service.click();
  const details = await checkDetails(page, services[2]);
  await page.keyboard.press("Escape");
  await expect(details).toHaveCount(0);
  await expect(service).toBeFocused();
  const bounds = await sidebar.boundingBox();
  const serviceBounds = await service.boundingBox();
  expect(serviceBounds!.x).toBeGreaterThanOrEqual(bounds!.x);
  expect(serviceBounds!.x + serviceBounds!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const section of ["Integrations", "Security", "Settings"]) {
    const button = sidebar.getByRole("button", { name: section, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-current", "page");
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator(".wf-header")).toContainText(section);
  }
  await page.screenshot({ path: info.outputPath("services-collapsed.png") });
  await page.keyboard.press("Control+b");
  await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(256);
  await expect(sidebar.getByRole("button", { name: "Settings", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("Lucent filtered deployment metadata stays attached to its service and Inspect opens its details", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Observability", exact: true }).click();
  const search = page.getByRole("textbox", { name: "Search deployments", exact: true });
  for (const service of [services[1], services[3]]) {
    await search.fill(service.name);
    const row = page.getByRole("row").filter({ hasText: service.name });
    await expect(row.getByRole("cell")).toHaveText([
      service.name,
      service.version,
      service.name === "recommender" ? "Canary" : "Production",
      service.status,
      service.owner,
      "Inspect",
    ]);
  }
  const row = page.getByRole("row").filter({ hasText: "recommender" });
  await row.getByRole("button", { name: "Inspect", exact: true }).click();
  const details = page.getByRole("dialog", { name: "recommender", exact: true });
  await expect(details).toBeVisible();
  await expect(details).toContainText("Canary");
  await expect(details).toContainText("v3.11.0");
  await page.keyboard.press("Escape");
  await expect(details).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inspect", exact: true })).toBeFocused();
  await expect(search).toHaveValue("recommender");
  await page.getByRole("button", { name: "Inspect", exact: true }).click();
  await expect(details).toBeVisible();
  await details.getByRole("button", { name: "View deployments", exact: true }).click();
  await expect(details).toHaveCount(0);
  await expect(page.locator(".wf-header")).toContainText("Delivery");
  const delivery = page
    .locator('.wf-devops > [data-slot="sidebar"]')
    .getByRole("button", { name: "Delivery", exact: true });
  await expect(delivery).toHaveAttribute("aria-current", "page");
  await expect(delivery).toBeFocused();
});

test("Lucent service browsing preserves the separate local release approval flow", async ({
  page,
}) => {
  await open(page);
  const sidebar = await navigation(page, false);
  await serviceButton(sidebar, "orders-db").click();
  const details = await checkDetails(page, services[1]);
  await details.getByRole("button", { name: "Close", exact: true }).click();
  await expect(details).toHaveCount(0);
  await page.getByRole("button", { name: "Review", exact: true }).first().click();
  const approval = page.getByRole("dialog", { name: "Marcus Webb", exact: true });
  await expect(approval).toBeVisible();
  await approval.getByRole("button", { name: "Approve change", exact: true }).click();
  await expect(approval).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approved", exact: true })).toBeDisabled();
  await serviceButton(sidebar, "api-gateway").click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "api-gateway", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approved", exact: true })).toBeDisabled();
});

test("Lucent phone utility navigation closes natively and restores its selected item", async ({
  page,
}) => {
  await open(page, 390);
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  for (const section of ["Integrations", "Security", "Settings"]) {
    const sidebar = await navigation(page, true);
    const button = sidebar.getByRole("button", { name: section, exact: true });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(sidebar).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator(".wf-header")).toContainText(section);
    await trigger.click();
    await expect(button).toHaveAttribute("aria-current", "page");
    await expect(sidebar.locator('[aria-current="page"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(sidebar).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test("Lucent workspace navigation clears its current item when an account page opens", async ({
  page,
}) => {
  await open(page);
  const sidebar = await navigation(page, false);
  for (const section of ["Settings", "edge-cache"]) {
    if (section === "Settings") {
      await sidebar.getByRole("button", { name: section, exact: true }).click();
      await expect(sidebar.getByRole("button", { name: section, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
    } else {
      await serviceButton(sidebar, section).click();
      await expect(page.getByRole("dialog", { name: section, exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: section, exact: true })).toHaveCount(0);
    }
    await page.getByRole("button", { name: "Open user menu", exact: true }).click();
    await page.getByRole("menuitem", { name: /^Profile/ }).click();
    await expect(page.locator(".lucent-account-page")).toBeVisible();
    await expect(page.locator('[data-slot="sidebar"] [aria-current="page"]')).toHaveCount(0);
    await page
      .locator(".lucent-account-breadcrumb")
      .getByRole("link", { name: "Home", exact: true })
      .click();
  }
});
