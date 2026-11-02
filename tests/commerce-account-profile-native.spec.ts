// Private static candidate. Not executed, discovered, or registered by a runner here.
// Inherit repository 30s/5s and W1R0. No timeout, retry, or worker overrides.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

type Merchant = "surge" | "manifest";
const merchants = ["surge", "manifest"] as const;
const widths = [1440, 390] as const;
const query = "?qa=account-profile&raw=a%20b&raw=a+b";
const portrait = "src/blocks/application/shells/assets/portrait-0.jpg";
const merchantRoles = [
  "Store owner",
  "Operations manager",
  "Fulfilment lead",
  "Merchandiser",
  "Support lead",
];

const account = (page: Page) => page.locator(".commerce-account-settings");
const profile = (page: Page) =>
  account(page).getByRole("region", { name: "Profile details", exact: true });
const save = (page: Page) =>
  profile(page).getByRole("button", { name: "Save changes", exact: true });
const cancel = (page: Page) => profile(page).getByRole("button", { name: "Cancel", exact: true });
const avatar = (page: Page) => profile(page).getByRole("img", { name: "Avatar", exact: true });
const popup = (page: Page) => page.locator('[data-slot="combobox-content"]');

async function open(page: Page, id: Merchant, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/#/template-preview/${id}/account/profile${query}`);
  if (id === "manifest") {
    const auth = page.locator(".bt-auth");
    await expect(auth).toBeVisible();
    await auth.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(auth).toBeHidden();
  }
  await expect(profile(page)).toBeVisible();
  await expect(account(page).getByRole("tab", { name: "Profile", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page).toHaveURL(
    new RegExp(
      `#/template-preview/${id}/account/profile\\?qa=account-profile&raw=a%20b&raw=a\\+b$`,
    ),
  );
  await expect(save(page)).toBeDisabled();
}

async function leaveAndReturn(page: Page) {
  await account(page).getByRole("tab", { name: "Preferences", exact: true }).click();
  await expect(
    account(page).getByRole("tab", { name: "Preferences", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await account(page).getByRole("tab", { name: "Profile", exact: true }).click();
  await expect(profile(page)).toBeVisible();
}

async function saved(page: Page) {
  await expect(save(page)).toBeEnabled();
  await save(page).click();
  await expect(save(page)).toBeDisabled();
  await expect(profile(page).locator(".aas-save-status")).toHaveText(
    "Profile saved in this preview.",
  );
}

async function identityButton(page: Page, width: number, name: string) {
  if (width === 390) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(page.locator(".bt-layout-mobile")).toBeVisible();
  }
  const navigation =
    width === 390
      ? page.locator(".bt-layout-mobile")
      : page.locator('.bt-sidebar[data-slot="sidebar-container"]');
  const button = navigation.getByRole("button", {
    name: `Open account menu for ${name}`,
    exact: true,
  });
  await expect(button).toBeVisible();
  return button;
}

async function closePhoneNavigation(page: Page, width: number) {
  if (width !== 390) return;
  await page.keyboard.press("Escape");
  await expect(page.locator(".bt-layout-mobile")).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
}

async function chooseCountry(page: Page, name: string) {
  const trigger = profile(page).locator(".commerce-account-phone [data-slot=combobox-trigger]");
  await trigger.click();
  await expect(popup(page)).toBeVisible();
  await popup(page).getByPlaceholder("e.g. United States").fill(name);
  await popup(page)
    .getByRole("option", { name: new RegExp(`^${name}\\b`) })
    .click();
  await expect(popup(page)).toHaveCount(0);
  await expect(trigger).toContainText(name);
  await expect(
    profile(page).getByRole("textbox", { name: "Phone number", exact: true }),
  ).toBeFocused();
}

async function chooseTimezone(page: Page, search: string, value: string) {
  const input = profile(page).getByRole("combobox", { name: "Time zone", exact: true });
  await input.fill(search);
  await expect(popup(page)).toBeVisible();
  const option = popup(page).getByRole("option", { name: value, exact: true });
  await expect(option).toBeVisible();
  await expect(popup(page).getByRole("option")).toHaveCount(1);
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(popup(page)).toHaveCount(0);
  await expect(input).toHaveValue(value);
  await expect(input).toBeFocused();
}

async function chooseRole(page: Page, value: string) {
  const trigger = profile(page).getByRole("combobox", { name: "Role", exact: true });
  await trigger.click();
  await page.getByRole("option", { name: value, exact: true }).click();
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(trigger).toContainText(value);
  await expect(trigger).toBeFocused();
}

async function changePortrait(page: Page) {
  const input = profile(page).getByLabel("Profile photo", { exact: true });
  await expect(input).toHaveAttribute("type", "file");
  await expect(input).toHaveAttribute("accept", "image/*");
  const pending = page.waitForEvent("filechooser");
  await profile(page).getByRole("button", { name: "Change", exact: true }).click();
  const chooser = await pending;
  expect(chooser.isMultiple()).toBe(false);
  await chooser.setFiles(resolve(process.cwd(), portrait));
  await expect(avatar(page)).toHaveAttribute("src", /^blob:/);
  await expect(save(page)).toBeEnabled();
}

for (const id of merchants) {
  for (const width of widths) {
    test(`${id} Profile validates email and saves or cancels actual identity ${width}`, async ({
      page,
    }) => {
      await open(page, id, width);
      const name = profile(page).getByRole("textbox", { name: "Full name", exact: true });
      const email = profile(page).getByRole("textbox", { name: /^Email address/ });
      await expect(name).toHaveValue("Nora Bell");
      await expect(email).toHaveValue("nora@bricklane.test");
      await email.fill("not-an-email");
      await save(page).click();
      await expect(
        profile(page).getByText("Enter a valid email address.", { exact: true }),
      ).toBeVisible();
      await expect(profile(page).locator(".aas-save-status")).toHaveText("");
      await cancel(page).click();
      await expect(email).toHaveValue("nora@bricklane.test");
      await expect(
        profile(page).getByText("Enter a valid email address.", { exact: true }),
      ).toHaveCount(0);
      await name.fill("Unsaved profile name");
      await cancel(page).click();
      await expect(name).toHaveValue("Nora Bell");
      const savedName = `Bricklane ${id} editor`;
      const savedEmail = `${id}.${width}@bricklane.test`;
      await name.fill(savedName);
      await email.fill(savedEmail);
      await saved(page);
      await leaveAndReturn(page);
      await expect(name).toHaveValue(savedName);
      await expect(email).toHaveValue(savedEmail);
      const button = await identityButton(page, width, savedName);
      await button.click();
      const menu = page.getByRole("menu").filter({ hasText: savedEmail });
      await expect(menu).toContainText(savedName);
      await expect(menu).toContainText(savedEmail);
    });

    test(`${id} Profile PhoneInput keeps native country and controlled saved number ${width}`, async ({
      page,
    }) => {
      await open(page, id, width);
      const number = profile(page).getByRole("textbox", { name: "Phone number", exact: true });
      const trigger = profile(page).locator(".commerce-account-phone [data-slot=combobox-trigger]");
      const initialNumber = await number.inputValue();
      await expect(trigger).toContainText("United States");
      await trigger.click();
      const selected = popup(page).getByRole("option", { name: /^United States\b/ });
      await expect(selected).toHaveAttribute("aria-selected", "true");
      await expect(selected).toHaveAttribute("data-highlighted", "");
      await page.keyboard.press("Escape");
      await expect(popup(page)).toHaveCount(0);
      await expect(trigger).toBeFocused();
      // Natural Escape returned focus. No trigger.focus() from the older Drive spec.
      await trigger.press("z");
      await expect(trigger).toContainText("Zambia");
      await chooseCountry(page, "China");
      await number.fill("+8613123456789");
      await expect
        .poll(async () => (await number.inputValue()).replace(/\D/g, ""))
        .toMatch(/(?:86)?13123456789$/);
      const chinaNumber = await number.inputValue();
      expect(chinaNumber).not.toBe(initialNumber);
      await saved(page);
      await leaveAndReturn(page);
      await expect(number).toHaveValue(chinaNumber);
      await expect(trigger).toContainText("China");
      await chooseCountry(page, "United States");
      await number.fill("+14155550199");
      await cancel(page).click();
      await expect(number).toHaveValue(chinaNumber);
      await expect(trigger).toContainText("China");
      await expect(save(page)).toBeDisabled();
    });

    test(`${id} Profile Timezone uses real search, keyboard, focus, Save and Cancel ${width}`, async ({
      page,
    }) => {
      await open(page, id, width);
      const zone = profile(page).getByRole("combobox", { name: "Time zone", exact: true });
      await expect(zone).toHaveValue("(GMT+9) Tokyo");
      await chooseTimezone(page, "New", "(GMT-5) New York");
      await saved(page);
      await leaveAndReturn(page);
      await expect(zone).toHaveValue("(GMT-5) New York");
      await zone.fill("zzzz-no-timezone-match");
      await expect(popup(page).getByText("No timezones found.", { exact: true })).toBeVisible();
      await expect(popup(page).getByRole("option")).toHaveCount(0);
      await zone.press("Escape");
      await expect(popup(page)).toHaveCount(0);
      await expect(zone).toBeFocused();
      await chooseTimezone(page, "London", "(GMT+0) London");
      await cancel(page).click();
      await expect(zone).toHaveValue("(GMT-5) New York");
      await expect(save(page)).toBeDisabled();
    });

    test(`${id} Profile merchant Role has five native options and a saved rollback ${width}`, async ({
      page,
    }) => {
      await open(page, id, width);
      const role = profile(page).getByRole("combobox", { name: "Role", exact: true });
      await expect(role).toContainText("Store owner");
      await role.click();
      await expect(page.getByRole("option")).toHaveText(merchantRoles);
      await expect(page.getByRole("option", { name: "Store owner", exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await page.keyboard.press("Escape");
      await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
      await expect(role).toBeFocused();
      await chooseRole(page, "Operations manager");
      await saved(page);
      await leaveAndReturn(page);
      await expect(role).toContainText("Operations manager");
      await chooseRole(page, "Merchandiser");
      await cancel(page).click();
      await expect(role).toContainText("Operations manager");
      await expect(save(page)).toBeDisabled();
    });

    test(`${id} Profile Change opens actual filechooser and avatar Save or Cancel ${width}`, async ({
      page,
    }) => {
      await open(page, id, width);
      const original = await avatar(page).getAttribute("src");
      expect(original).toBeTruthy();
      await changePortrait(page);
      await cancel(page).click();
      await expect(avatar(page)).toHaveAttribute("src", original!);
      await expect(save(page)).toBeDisabled();
      await changePortrait(page);
      await saved(page);
      const expected = `data:image/jpeg;base64,${(await readFile(resolve(process.cwd(), portrait))).toString("base64")}`;
      await expect(avatar(page)).toHaveAttribute("src", expected);
      await expect
        .poll(() => avatar(page).evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);
      const button = await identityButton(page, width, "Nora Bell");
      await expect(button.locator("img")).toHaveAttribute("src", expected);
      await closePhoneNavigation(page, width);
      await leaveAndReturn(page);
      await expect(avatar(page)).toHaveAttribute("src", expected);
      await profile(page).getByRole("button", { name: "Remove", exact: true }).click();
      await expect(avatar(page)).toHaveCount(0);
      await cancel(page).click();
      await expect(avatar(page)).toHaveAttribute("src", expected);
    });
  }
}
