// Static candidate only. Not executed or registered by a runner in this audit.
// Keep the repository's existing 30s test and 5s assertion budgets.
import { expect, test, type Page, type TestInfo } from "@playwright/test";

type Merchant = "surge" | "manifest";
type AccountSection = "Profile" | "Preferences" | "Security";
type DefaultView = "Dashboard" | "Orders" | "Products" | "Analytics";

const merchants = ["surge", "manifest"] as const;
const widths = [1440, 390] as const;
const views: DefaultView[] = ["Dashboard", "Orders", "Products", "Analytics"];
const plainQuery = "?qa=account-native&raw=a%20b&raw=a+b&flag";
const originalPreset = {
  base: "stone",
  accent: "teal",
  chart: "colorful",
  font: "inter",
  heading: "serif",
  radius: "0.375",
  mode: "light",
  custom: "#246abc",
  menu: "outline",
  menuAccent: "subtle",
};
const themeQuery =
  `${plainQuery}&` +
  new URLSearchParams({ preset: JSON.stringify(originalPreset) }).toString() +
  "&preset=%7B%22mode%22%3A%22light%22%7D&tail=%2f%2F";

const hash = (page: Page) => page.evaluate(() => window.location.hash);
const mount = (id: Merchant) => `#/template-preview/${id}`;
const sheet = (page: Page) => page.locator(".bt-layout-mobile");
const account = (page: Page) => page.locator(".commerce-account-settings");
const menu = (page: Page) =>
  page.getByRole("menu").filter({
    has: page.getByRole("menuitem", { name: "Sign Out", exact: true }),
  });

async function login(page: Page) {
  const auth = page.locator(".bt-auth");
  await expect(auth.getByRole("heading", { name: "Log in to your account" })).toBeVisible();
  await auth.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(auth).toBeHidden();
  await expect(page.locator(".bt-layout")).toBeVisible();
}

async function open(page: Page, id: Merchant, width: number, path: string, query = plainQuery) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/${mount(id)}${path}${query}`);
  if (id === "manifest") await login(page);
  await expect(page.locator(".bt-layout")).toBeVisible();
  await expect.poll(() => hash(page)).toBe(`${mount(id)}${path}${query}`);
}

async function openAccountMenu(page: Page, width: number) {
  if (width < 768 && !(await sheet(page).isVisible())) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(sheet(page)).toBeVisible();
  }
  const navigation =
    width < 768 ? sheet(page) : page.locator('.bt-sidebar[data-slot="sidebar-container"]');
  await navigation
    .getByRole("button", { name: "Open account menu for Nora Bell", exact: true })
    .click();
  await expect(menu(page)).toBeVisible();
  await expect(menu(page)).toContainText("Nora Bell");
  await expect(menu(page)).toContainText("nora@bricklane.test");
  return menu(page);
}

async function phoneHeaderContract(page: Page, id: Merchant, width: number, info: TestInfo) {
  if (width >= 768) return;
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const drawer = sheet(page);
  await expect(drawer).toBeVisible();
  const header = drawer.locator('[data-slot="sidebar-header"]');
  await expect(header).toBeVisible();
  const bounds = { drawer: await drawer.boundingBox(), header: await header.boundingBox() };
  // Save real measurements before an assertion; retain mismatches without altering DOM.
  await info.attach("phone-sidebar-header-bounds", {
    body: JSON.stringify({ viewport: page.viewportSize(), ...bounds }, null, 2),
    contentType: "application/json",
  });
  expect(bounds.drawer).not.toBeNull();
  expect(bounds.header).not.toBeNull();
  const expectedWidth =
    id === "surge"
      ? await drawer.evaluate((node) => {
          const removedScrollbar =
            parseFloat(getComputedStyle(node).getPropertyValue("--removed-body-scroll-bar-size")) ||
            0;
          return (window.innerWidth - removedScrollbar) * 0.75;
        })
      : width * 0.75;
  expect(Math.abs(bounds.drawer!.width - expectedWidth)).toBeLessThanOrEqual(1);
  expect(Math.abs(bounds.header!.height - 56)).toBeLessThanOrEqual(1);
  await expect(drawer.locator(".bt-brand")).toBeHidden();
  await expect(drawer.locator('[data-slot="sheet-close"]')).toBeHidden();
  await expect(drawer.getByRole("button", { name: "Close", exact: true })).toBeHidden();
}

async function dismissPhoneSheet(page: Page, width: number) {
  if (width >= 768) return;
  await expect(menu(page)).toBeHidden();
  await expect(sheet(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
}

async function chooseAccount(page: Page, width: number, section: AccountSection) {
  const popup = await openAccountMenu(page, width);
  await popup.getByRole("menuitem", { name: section, exact: true }).click();
  await expect(popup).toBeHidden();
  // Account selection intentionally retains the mobile Sheet. One Escape closes it.
  await dismissPhoneSheet(page, width);
  await expect(account(page).getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  await expect(account(page).getByRole("tab", { name: section, exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
}

async function choice(page: Page, label: string, value: string) {
  const trigger = account(page).getByRole("combobox", { name: label, exact: true });
  await trigger.click();
  await page.getByRole("option", { name: value, exact: true }).click();
  await expect(trigger).toContainText(value);
  await expect(trigger).toBeFocused();
}

async function chooseStoreGeneral(page: Page, id: Merchant, width: number) {
  if (width < 768) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(sheet(page)).toBeVisible();
  }
  const navigation =
    width < 768 ? sheet(page) : page.locator('.bt-sidebar[data-slot="sidebar-container"]');
  const general = navigation.getByRole(id === "surge" ? "link" : "button", {
    name: "General",
    exact: true,
  });
  if (!(await general.isVisible())) {
    await navigation.getByRole("button", { name: "Settings", exact: true }).first().click();
  }
  if (id === "surge") {
    const current = await hash(page);
    await expect(general).toHaveAttribute(
      "href",
      `${mount(id)}/settings${current.slice(current.indexOf("?"))}`,
    );
  }
  await general.click();
  if (width < 768) {
    if (id === "surge") {
      await expect(sheet(page)).toBeVisible();
      await expect(general).toBeFocused();
      await page.keyboard.press("Escape");
    }
    await expect(sheet(page)).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
  await expect(
    page.locator(".bt-content").getByRole("heading", { name: "General", exact: true }),
  ).toBeVisible();
}

async function expectSection(page: Page, id: Merchant, section: AccountSection, query: string) {
  const tab = account(page).getByRole("tab", { name: section, exact: true });
  const panel = account(page).getByRole("tabpanel", { name: section, exact: true });
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(panel).toBeVisible();
  const panelId = await panel.getAttribute("id");
  expect(panelId).toBeTruthy();
  await expect(tab).toHaveAttribute("aria-controls", panelId!);
  const tabId = await tab.getAttribute("id");
  expect(tabId).toBeTruthy();
  await expect(panel).toHaveAttribute("aria-labelledby", tabId!);
  await expect.poll(() => hash(page)).toBe(`${mount(id)}/account/${section.toLowerCase()}${query}`);
}

async function expectActualView(page: Page, view: DefaultView) {
  const content = page.locator(".bt-content");
  if (view === "Dashboard") {
    await expect(
      content.getByRole("heading", { name: "Welcome to Bricklane Store", exact: true }),
    ).toBeVisible();
  } else if (view === "Products") {
    await expect(content.getByRole("heading", { name: "Products 8", exact: true })).toBeVisible();
    await expect(
      content.getByRole("textbox", { name: "Name or vendor", exact: true }),
    ).toBeVisible();
  } else {
    await expect(content.getByRole("heading", { name: view, exact: true })).toBeVisible();
    if (view === "Orders") {
      await expect(
        content.getByRole("textbox", { name: "Search orders", exact: true }),
      ).toBeVisible();
    }
  }
  await expect(account(page)).toHaveCount(0);
}

function untouchedRawEntries(value: string) {
  let removedFirstPreset = false;
  return value
    .slice(value.indexOf("?") + 1)
    .split("&")
    .filter((entry) => {
      if (!removedFirstPreset && new URLSearchParams(entry).has("preset")) {
        removedFirstPreset = true;
        return false;
      }
      return true;
    });
}

async function expectTheme(page: Page, mode: "light" | "dark") {
  await expect(page.locator("html")).toHaveClass(mode === "dark" ? /dark/ : /^(?!.*\bdark\b)/);
  const currentHash = await hash(page);
  expect(untouchedRawEntries(currentHash)).toEqual(untouchedRawEntries(themeQuery));
  const params = new URLSearchParams(currentHash.slice(currentHash.indexOf("?") + 1));
  expect(JSON.parse(params.get("preset")!)).toEqual({ ...originalPreset, mode });
}

for (const id of merchants) {
  for (const width of widths) {
    test(`${id} Account menu, native Tabs and mobile Escape ${width}`, async ({ page }, info) => {
      await open(page, id, width, "/settings");
      await phoneHeaderContract(page, id, width, info);
      await chooseAccount(page, width, "Profile");
      await expectSection(page, id, "Profile", plainQuery);
      const tabs = account(page).getByRole("tablist", { name: "Account sections", exact: true });
      await expect(tabs.getByRole("tab")).toHaveText(["Profile", "Preferences", "Security"]);
      const profile = tabs.getByRole("tab", { name: "Profile", exact: true });
      await profile.click();
      await profile.press("ArrowRight");
      await expectSection(page, id, "Preferences", plainQuery);
      await expect(tabs.getByRole("tab", { name: "Preferences", exact: true })).toBeFocused();
      await page.keyboard.press("End");
      await expectSection(page, id, "Security", plainQuery);
      await expect(tabs.getByRole("tab", { name: "Security", exact: true })).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expectSection(page, id, "Preferences", plainQuery);
      await expect(tabs.getByRole("tab", { name: "Preferences", exact: true })).toBeFocused();
      await page.keyboard.press("Home");
      await expectSection(page, id, "Profile", plainQuery);
      await expect(profile).toBeFocused();
      await chooseAccount(page, width, "Preferences");
      await expectSection(page, id, "Preferences", plainQuery);
      await chooseAccount(page, width, "Security");
      await expectSection(page, id, "Security", plainQuery);
    });

    test(`${id} old light preset follows menu Dark and Preferences Light ${width}`, async ({
      page,
    }) => {
      await open(page, id, width, "/account/preferences", themeQuery);
      await expectTheme(page, "light");
      const popup = await openAccountMenu(page, width);
      const themeRole = id === "surge" ? "radio" : "menuitemradio";
      if (id === "surge") {
        await expect(popup.getByRole("radiogroup", { name: "Theme", exact: true })).toBeVisible();
        await expect(popup.getByRole("radio")).toHaveCount(3);
        await expect(popup.getByRole("menuitemradio")).toHaveCount(0);
      }
      await expect(popup.getByRole(themeRole, { name: "Light", exact: true })).toBeChecked();
      await popup.getByRole(themeRole, { name: "Dark", exact: true }).click();
      if (id === "surge") {
        await expect(popup).toBeHidden();
        const navigation =
          width < 768 ? sheet(page) : page.locator('.bt-sidebar[data-slot="sidebar-container"]');
        await expect(
          navigation.getByRole("button", { name: "Open account menu for Nora Bell", exact: true }),
        ).toBeFocused();
      }
      await dismissPhoneSheet(page, width);
      await expectTheme(page, "dark");
      // Reopen through the real account trigger after the native selection.
      const reopened = await openAccountMenu(page, width);
      await expect(reopened.getByRole(themeRole, { name: "Dark", exact: true })).toBeChecked();
      await reopened.getByRole("menuitem", { name: "Security", exact: true }).click();
      await dismissPhoneSheet(page, width);
      await expect(
        account(page).getByRole("tab", { name: "Security", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expectTheme(page, "dark");
      await chooseStoreGeneral(page, id, width);
      await expectTheme(page, "dark");
      await chooseAccount(page, width, "Preferences");
      await expect(
        account(page).getByRole("combobox", { name: "Color theme", exact: true }),
      ).toContainText("Dark");
      await choice(page, "Color theme", "Light");
      await expectTheme(page, "light");
      const finalMenu = await openAccountMenu(page, width);
      await expect(finalMenu.getByRole(themeRole, { name: "Light", exact: true })).toBeChecked();
    });

    for (const view of views) {
      test(`${id} saved ${view} default survives Sign Out, Back and Log in ${width}`, async ({
        page,
      }) => {
        await open(page, id, width, "/account/preferences");
        await choice(page, "Default view", view);
        const popup = await openAccountMenu(page, width);
        await popup.getByRole("menuitem", { name: "Sign Out", exact: true }).click();
        await expect(page.locator(".bt-auth")).toBeVisible();
        await expect.poll(() => hash(page)).toBe(`${mount(id)}${plainQuery}`);
        await page.goBack();
        await expect.poll(() => hash(page)).toBe(`${mount(id)}/account/preferences${plainQuery}`);
        await expect(page.locator(".bt-auth")).toBeVisible();
        await expect(account(page)).toHaveCount(0);
        await login(page);
        const defaultPath = id === "surge" && view !== "Dashboard" ? `/${view.toLowerCase()}` : "";
        await expect.poll(() => hash(page)).toBe(`${mount(id)}${defaultPath}${plainQuery}`);
        await expectActualView(page, view);
        await chooseAccount(page, width, "Preferences");
        await expect(
          account(page).getByRole("combobox", { name: "Default view", exact: true }),
        ).toContainText(view);
      });
    }
  }
}

for (const width of widths) {
  test(`Manifest native Auth validation preserves first account deeplink ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(`/${mount("manifest")}/account/profile${plainQuery}`);
    const auth = page.locator(".bt-auth");
    const email = auth.getByRole("textbox", { name: "Email address", exact: true });
    const password = auth.locator('input[name="password"]');
    const submit = auth.getByRole("button", { name: "Log in", exact: true });
    await expect(email).toHaveValue("nick@bricklane.demo");
    await expect(password).toHaveValue("password");
    await email.fill("");
    await submit.click();
    expect(await email.evaluate((node: HTMLInputElement) => node.validity.valueMissing)).toBe(true);
    await email.fill("bad-email");
    await submit.click();
    expect(await email.evaluate((node: HTMLInputElement) => node.validity.typeMismatch)).toBe(true);
    await email.fill("native@bricklane.test");
    await password.fill("");
    await submit.click();
    expect(await password.evaluate((node: HTMLInputElement) => node.validity.valueMissing)).toBe(
      true,
    );
    await password.fill("   ");
    await submit.click();
    const passwordError = auth.locator(".bt-login-error");
    await expect(passwordError).toHaveAttribute("role", "alert");
    await expect(passwordError).toHaveText("Enter your password.");
    // Existing Auth has no six-character rule; a nonempty one-character demo value is valid.
    await password.fill("x");
    await submit.click();
    await expect(auth).toBeHidden();
    await expectSection(page, "manifest", "Profile", plainQuery);
  });
}
