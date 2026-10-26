import { expect, test } from "@playwright/test";

test("Roster uses the actual provider widths and a viewport-contained scrolling inset", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/roster");
  const side = page.locator('.ct-layout-body > [data-slot="sidebar"]');
  const inset = page.locator('[data-slot="sidebar-inset"]');
  await expect.poll(async () => (await side.boundingBox())?.width).toBe(256);
  expect(await inset.boundingBox()).toMatchObject({ x: 256, y: 8, width: 1176, height: 984 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(1000);
  await inset.evaluate((element) => {
    element.scrollTop = 200;
  });
  expect(await inset.evaluate((element) => element.scrollTop)).toBe(200);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press("Control+b");
  await expect.poll(async () => (await side.boundingBox())?.width).toBe(64);
  await expect.poll(async () => (await inset.boundingBox())?.x).toBe(64);
  await expect(page.getByRole("button", { name: "Toggle Sidebar", exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
  await expect.poll(async () => (await side.boundingBox())?.width).toBe(256);
});

test("Roster mobile closes the provider drawer back to its unique trigger and preserves saved identity", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/template-preview/roster");
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.click();
  let drawer = page.getByRole("dialog", { name: "Roster", exact: true });
  await expect.poll(async () => (await drawer.boundingBox())?.width).toBe(288);
  const notifications = await drawer
    .getByRole("button", { name: "Notifications", exact: true })
    .boundingBox();
  const close = await drawer.getByRole("button", { name: "Close", exact: true }).boundingBox();
  expect(notifications!.x + notifications!.width).toBeLessThanOrEqual(close!.x - 4);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  drawer = page.getByRole("dialog", { name: "Roster", exact: true });
  await drawer.getByRole("button", { name: "Settings", exact: true }).click();
  await drawer.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  const details = page.locator(".ct-settings-section[aria-label=Profile]");
  await details
    .getByRole("textbox", { name: "Full Name", exact: true })
    .fill("Bricklane Layout QA");
  await details.getByRole("button", { name: "Save changes", exact: true }).click();
  await trigger.click();
  await drawer.getByRole("button", { name: "Open account menu", exact: true }).click();
  await expect(page.getByRole("menu")).toContainText("Organizations");
  await page.keyboard.press("Escape");
  await expect(
    drawer.getByRole("button", { name: "Open account menu", exact: true }),
  ).toContainText("Bricklane Layout QA");
});

test("Pulse collapses its actual sidebar while retaining document scrolling and workspace controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/pulse");
  const side = page.locator('.ct-layout-body > [data-slot="sidebar"]');
  await expect.poll(async () => (await side.boundingBox())?.width).toBe(260);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(1000);
  await page.keyboard.press("Control+b");
  await expect.poll(async () => (await side.boundingBox())?.width).toBe(62);
  await expect(page.getByRole("button", { name: "Switch workspace", exact: true })).toContainText(
    "Help Desk",
  );
  await page.getByRole("button", { name: "Switch workspace", exact: true }).click();
  await page.getByRole("menuitem", { name: "Starter Kit", exact: true }).click();
  await expect(page.getByRole("button", { name: "Switch workspace", exact: true })).toContainText(
    "Starter Kit",
  );
  await page.getByRole("button", { name: "All products", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Web App", exact: true }).click();
  await expect(page.getByRole("button", { name: "Web App", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open user menu", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Billing", exact: true })).toBeDisabled();
  await page.getByRole("menuitemradio", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("Pulse mobile provider drawer returns focus after Escape and actual navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/template-preview/pulse");
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Help Desk", exact: true });
  await expect.poll(async () => (await drawer.boundingBox())?.width).toBeCloseTo(292.5, 1);
  await expect(page.locator('[data-slot="sidebar-trigger"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await drawer.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('.ct-settings-section[aria-label="General Settings"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("global command search preserves the controlled Hiring and Knowledge Base list filters", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/roster");
  await page.getByRole("button", { name: "Hiring", exact: true }).first().click();
  const candidates = page.getByLabel("Search candidates", { exact: true });
  await candidates.fill("No candidate matches this query");
  await expect(page.locator(".ct-candidate-card")).toHaveCount(0);
  await candidates.fill("");
  await expect(page.locator(".ct-candidate-card").first()).toBeVisible();
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await search
    .getByRole("combobox", { name: "Search workspace routes", exact: true })
    .fill("Policies");
  await search.getByRole("option", { name: "Policies", exact: true }).click();
  await expect(search).toBeHidden();
  await expect(page.locator('.ct-settings-section[aria-label="Leave types"]')).toBeVisible();
  await page.goto("/#/template-preview/pulse");
  await page.getByRole("button", { name: "Knowledge Base", exact: true }).first().click();
  const articles = page.getByLabel("Search knowledge articles", { exact: true });
  await articles.fill("No article matches this query");
  await expect(page.getByText("No articles match your search.", { exact: true })).toBeVisible();
  await articles.fill("");
  await expect(page.locator(".ct-kb-category").first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await articles.fill("No mobile article matches");
  await expect(page.getByText("No articles match your search.", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.goto("/#/template-preview/roster");
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Roster", exact: true })
    .getByRole("button", { name: "Hiring", exact: true })
    .click();
  await page.getByLabel("Search candidates", { exact: true }).fill("No mobile candidate matches");
  await expect(page.locator(".ct-candidate-card")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

for (const width of [1440, 390]) {
  test(`actual font customization updates Collaboration popup boundaries without dropping state at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/#/block/application/app-shell/app-shell-1");
    await page.getByRole("button", { name: "Customize", exact: true }).click();
    const target = await context.newPage();
    await target.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const errors: string[] = [];
    target.on("pageerror", (error) => errors.push(error.message));
    await target.goto("/#/template-preview/roster");
    if (width === 390)
      await target.getByRole("button", { name: "Open navigation", exact: true }).click();
    await target.getByRole("button", { name: "Search workspace", exact: true }).click();
    const search = target.getByRole("dialog", { name: "Search", exact: true });
    const query = search.getByRole("combobox", { name: "Search workspace routes", exact: true });
    await query.fill("Policies");
    const choose = async (name: string) => {
      await page.getByRole("combobox", { name: "Body font", exact: true }).click();
      await page.getByRole("option", { name, exact: true }).click();
    };
    await expect(query).toHaveCSS("font-family", /^Inter,/);
    await choose("Serif");
    if (width === 390)
      await expect(
        target.getByRole("dialog", { name: "Roster", exact: true, includeHidden: true }),
      ).toHaveCSS("font-family", "Georgia, serif");
    await expect(query).toHaveCSS("font-family", "Georgia, serif");
    await expect(query).toHaveValue("Policies");
    await choose("Mono");
    if (width === 390)
      await expect(
        target.getByRole("dialog", { name: "Roster", exact: true, includeHidden: true }),
      ).toHaveCSS("font-family", "ui-monospace, monospace");
    await expect(query).toHaveCSS("font-family", "ui-monospace, monospace");
    await expect(query).toHaveValue("Policies");
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(query).toHaveCSS("font-family", /^Inter,/);
    await target.keyboard.press("Escape");
    await expect(
      target.getByRole("button", { name: "Search workspace", exact: true }),
    ).toBeFocused();
    if (width === 390) {
      const drawer = target.getByRole("dialog", { name: "Roster", exact: true });
      await expect(drawer).toHaveCSS("font-family", /^Inter,/);
    }
    await target.getByRole("button", { name: "Open account menu", exact: true }).click();
    const account = target.getByRole("menu");
    await expect(account).toHaveCSS("font-family", /^Inter,/);
    await choose("Serif");
    await expect(account).toHaveCSS("font-family", "Georgia, serif");
    await choose("Mono");
    await expect(account).toHaveCSS("font-family", "ui-monospace, monospace");
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(account).toHaveCSS("font-family", /^Inter,/);
    await target.keyboard.press("Escape");
    await expect(account).toBeHidden();
    await expect(
      target.getByRole("button", { name: "Open account menu", exact: true }),
    ).toBeFocused();
    if (width === 390) {
      await target.keyboard.press("Escape");
      await expect(
        target.getByRole("button", { name: "Open navigation", exact: true }),
      ).toBeFocused();
    }
    if (width === 1440) {
      await target.keyboard.press("Control+b");
      await target.getByRole("button", { name: "Settings", exact: true }).click();
      const navigation = target.getByRole("menu");
      await expect.poll(async () => (await navigation.boundingBox())?.width).toBe(192);
      await expect(navigation).toHaveCSS("font-family", /^Inter,/);
      await choose("Serif");
      await expect(navigation).toHaveCSS("font-family", "Georgia, serif");
      await choose("Mono");
      await expect(navigation).toHaveCSS("font-family", "ui-monospace, monospace");
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(navigation).toHaveCSS("font-family", /^Inter,/);
      await navigation.getByRole("menuitem", { name: "Policies", exact: true }).click();
      await expect(navigation).toBeHidden();
      await expect(target.locator('.ct-settings-section[aria-label="Leave types"]')).toBeVisible();
    }
    expect(errors).toEqual([]);
    await target.close();
  });
}

test("Roster organization creation and account actions keep actual selected state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/roster");
  const account = page.getByRole("button", { name: "Open account menu", exact: true });
  await account.click();
  await page.getByRole("menuitem", { name: "New Organization", exact: true }).click();
  const form = page.getByRole("dialog", { name: "New Organization", exact: true });
  await form
    .getByRole("textbox", { name: "Organization name", exact: true })
    .fill("Bricklane Studio");
  await form.getByRole("button", { name: "Create organization", exact: true }).click();
  await expect(form).toBeHidden();
  await expect(account).toContainText("Bricklane Studio");
  await account.click();
  await expect(
    page.getByRole("menuitemradio", { name: "Bricklane Studio", exact: true }),
  ).toBeChecked();
  await page.getByRole("menuitemradio", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitemradio", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("menuitem", { name: "Sign Out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "You're signed out", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue demo", exact: true }).click();
  await expect(account).toContainText("Bricklane Studio");
});

test("Pulse availability uses free keyboard controls and promo dismissal persists across navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/pulse");
  const account = page.getByRole("button", { name: "Open user menu", exact: true });
  await account.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Home");
  await expect(page.getByRole("menuitemradio", { name: "Available", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: "Away", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("menuitemradio", { name: "Away", exact: true })).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(account.locator("i")).toHaveAttribute("data-availability", "Away");
  await page.getByRole("button", { name: "Read more", exact: true }).click();
  await expect(page.locator(".ct-kb-category")).toHaveCount(6);
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await expect(page.getByRole("button", { name: "Read more", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Read more", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  const invitation = page.getByRole("dialog", { name: "Invite a teammate", exact: true });
  await invitation.getByRole("textbox", { name: "Email", exact: true }).fill("qa@example.test");
  await invitation.getByRole("button", { name: "Invite teammate", exact: true }).click();
  await expect(
    invitation.getByRole("status", { name: "Pending invitations", exact: true }),
  ).toContainText("qa@example.test");
  await page.keyboard.press("Escape");
  await expect(invitation).toBeHidden();
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(
    invitation.getByRole("status", { name: "Pending invitations", exact: true }),
  ).toContainText("qa@example.test");
});
