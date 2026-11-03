import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });

type Rectangle = { x: number; y: number; width: number; height: number };

async function documentBox(locator: Locator): Promise<Rectangle> {
  await expect(locator).toBeAttached();
  return locator.evaluate((element) => {
    const rectangle = element.getBoundingClientRect();
    return {
      x: rectangle.x + window.scrollX,
      y: rectangle.y + window.scrollY,
      width: rectangle.width,
      height: rectangle.height,
    };
  });
}

function closeTo(actual: number, expected: number) {
  expect(actual).toBeCloseTo(expected, 1);
}

async function stable(locator: Locator) {
  await expect
    .poll(() =>
      locator.evaluate((element) => ({
        opacity: getComputedStyle(element).opacity,
        running: element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === "running" || animation.pending).length,
      })),
    )
    .toEqual({ opacity: "1", running: 0 });
}

async function openAccount(page: Page, width: number, section: string) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/#/template-preview/lucent/account/${section}`);
  const account = page.locator(".lucent-account-page");
  await expect(account).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const selectedTab = section[0].toUpperCase() + section.slice(1);
  await expect(account.getByRole("tab", { name: selectedTab, exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(account.locator('[data-slot="frame"]')).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  return account;
}

async function dimensions(page: Page, width: number) {
  const documentWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const x = width === 390 ? 16 : 272;
  return { documentWidth, x, cardWidth: documentWidth - x - 16 };
}

async function cardStructure(card: Locator, title: string, groupLabel: string, rows: number) {
  await expect(
    card.locator(':scope > [data-slot="card-header"] > [data-slot="card-title"]'),
  ).toHaveText(title);
  const fieldset = card.locator(':scope > [data-slot="card-content"] > fieldset');
  await expect(fieldset).toHaveCount(1);
  await expect(card.getByRole("group", { name: groupLabel, exact: true })).toHaveCount(1);
  await expect(fieldset.locator(":scope > legend")).toHaveText(groupLabel);
  const group = fieldset.locator(':scope > [data-slot="field-group"]');
  const fieldRows = group.locator(':scope > [data-slot="field"]');
  await expect(fieldRows).toHaveCount(rows);
  await expect(group.locator(':scope > [data-slot="field-separator"]')).toHaveCount(rows - 1);
  for (const row of await fieldRows.all()) {
    await expect(row).toHaveCSS("padding", "12px 20px");
    await expect(row).toHaveCSS("gap", "16px");
  }
  await expect(card.locator(':scope > [data-slot="card-header"]')).toHaveCSS(
    "padding",
    "12px 20px 16px",
  );
  for (const footer of await card.locator(':scope > [data-slot="card-footer"]').all()) {
    closeTo((await documentBox(footer)).height, 57);
    await expect(footer).toHaveCSS("padding", "12px 20px");
  }
}

async function optionList(page: Page, trigger: Locator, options: string[]) {
  await trigger.click();
  await expect(page.getByRole("option")).toHaveText(options);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

async function choose(page: Page, trigger: Locator, option: string) {
  await trigger.click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(trigger).toHaveText(option);
}

async function userMenu(page: Page, mobile: boolean) {
  if (mobile) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await stable(page.locator('[data-slot="sidebar"][data-mobile="true"]'));
  }
  await page.getByRole("button", { name: "Open user menu", exact: true }).click();
}

// Coordinates come from the original browser captures. The original phone has
// a 375px document inside its 390px viewport; use the runner's available width
// rather than treating its scrollbar policy as a layout regression.
for (const width of [1440, 390]) {
  test(`Lucent Profile ${width}: inline Card, native fields, Update focus and Dismiss`, async ({
    page,
  }, info) => {
    const account = await openAccount(page, width, "profile");
    const { documentWidth, x, cardWidth } = await dimensions(page, width);
    const tabs = await documentBox(account.getByRole("tablist"));
    closeTo(tabs.x, x);
    closeTo(tabs.y, 64);
    closeTo(tabs.height, 32);
    await expect(account.getByRole("tab")).toHaveText(["Profile", "Billing", "Preferences"]);
    const notice = account.getByRole("alert");
    const card = account.locator('[data-slot="card"]');
    await cardStructure(card, "My profile", "Profile fields", 6);
    const noticeBox = await documentBox(notice);
    const cardBox = await documentBox(card);
    closeTo(cardBox.x, x);
    closeTo(cardBox.width, cardWidth);
    closeTo(noticeBox.y, 116);
    closeTo(cardBox.y, noticeBox.y + noticeBox.height + 24);
    closeTo((await documentBox(card.locator('[data-slot="card-header"]'))).height, 71);
    if (width === 1440 || documentWidth === 375) {
      closeTo(cardBox.y, width === 1440 ? 204 : 286);
      closeTo(cardBox.height, width === 1440 ? 768.25 : 1106.5);
    }
    const name = account.getByRole("textbox", { name: "Full name", exact: true });
    await expect(name).toHaveValue("Jordan Blake");
    const nameBox = await documentBox(name);
    closeTo(nameBox.x, width === 390 ? x + 20 : 692);
    closeTo(nameBox.width, width === 390 ? cardWidth - 40 : cardWidth - 440);
    closeTo(nameBox.height, 32);
    const role = account.getByRole("combobox", { name: "Role", exact: true });
    await optionList(page, role, [
      "Platform Lead",
      "Site Reliability Engineer",
      "Release Manager",
      "Developer",
    ]);
    await optionList(page, account.getByRole("combobox", { name: "Time zone", exact: true }), [
      "UTC-8 (Pacific Time)",
      "UTC-5 (Eastern Time)",
      "UTC+0 (London)",
      "UTC+1 (Berlin)",
      "UTC+9 (Tokyo)",
    ]);
    await notice.getByRole("button", { name: "Update", exact: true }).click();
    await expect(role).toBeFocused();
    await expect(account.getByRole("tab", { name: "Profile", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await notice.getByRole("button", { name: "Dismiss", exact: true }).click();
    await expect(notice).toHaveCount(0);
    closeTo((await documentBox(card)).y, 116);
    await expect(name).toHaveValue("Jordan Blake");
    await page.screenshot({ path: info.outputPath("lucent-profile.png"), fullPage: true });
    await writeFile(
      info.outputPath("profile-layout.json"),
      JSON.stringify(
        {
          width,
          documentWidth,
          tabs,
          noticeBox,
          cardBox,
          nameBox,
        },
        null,
        2,
      ),
    );
  });

  test(`Lucent Billing ${width}: two Cards, invoice fields and native country options`, async ({
    page,
  }, info) => {
    const account = await openAccount(page, width, "billing");
    const { documentWidth, x, cardWidth } = await dimensions(page, width);
    const cards = account.locator('[data-slot="card"]');
    await expect(cards).toHaveCount(2);
    await cardStructure(cards.nth(0), "Plan and billing", "Plan and billing", 3);
    await cardStructure(cards.nth(1), "Billing details", "Billing details", 4);
    const planBox = await documentBox(cards.nth(0));
    const detailsBox = await documentBox(cards.nth(1));
    closeTo(planBox.x, x);
    closeTo(planBox.y, 116);
    closeTo(planBox.width, cardWidth);
    closeTo(detailsBox.x, x);
    closeTo(detailsBox.width, cardWidth);
    closeTo(detailsBox.y, planBox.y + planBox.height + 24);
    if (width === 1440 || documentWidth === 375) {
      closeTo(planBox.height, width === 1440 ? 343 : 487);
      closeTo(detailsBox.y, width === 1440 ? 483 : 627);
      closeTo(detailsBox.height, width === 1440 ? 498 : 743);
    }
    await expect(cards.nth(0).getByRole("button")).toHaveText(["Switch", "Manage", "Switch"]);
    await expect(cards.nth(0).getByText("Current", { exact: true })).toHaveCount(1);
    await expect(
      cards.nth(1).getByRole("group", { name: "Invoice profile", exact: true }),
    ).toHaveCount(1);
    const emailBox = await documentBox(
      account.getByRole("textbox", { name: "Billing email", exact: true }),
    );
    closeTo(emailBox.x, width === 390 ? x + 20 : 692);
    closeTo(emailBox.width, width === 390 ? cardWidth - 40 : cardWidth - 440);
    closeTo(emailBox.height, 32);
    await expect(account.getByText("Visa ending in 4242", { exact: true })).toBeVisible();
    await optionList(page, account.getByRole("combobox", { name: "Country", exact: true }), [
      "United States",
      "United Kingdom",
      "Germany",
      "Uzbekistan",
    ]);
    await page.screenshot({ path: info.outputPath("lucent-billing.png"), fullPage: true });
    await writeFile(
      info.outputPath("billing-layout.json"),
      JSON.stringify(
        {
          width,
          documentWidth,
          planBox,
          detailsBox,
          emailBox,
        },
        null,
        2,
      ),
    );
  });

  test(`Lucent Preferences ${width}: notification defaults, two-column hours and all options`, async ({
    page,
  }, info) => {
    const account = await openAccount(page, width, "preferences");
    const { documentWidth, x, cardWidth } = await dimensions(page, width);
    const cards = account.locator('[data-slot="card"]');
    await expect(cards).toHaveCount(2);
    await cardStructure(cards.nth(0), "Activity alerts", "Activity alerts", 4);
    await cardStructure(cards.nth(1), "Email updates", "Email updates", 4);
    const activityBox = await documentBox(cards.nth(0));
    const emailBox = await documentBox(cards.nth(1));
    closeTo(activityBox.x, x);
    closeTo(activityBox.y, 116);
    closeTo(activityBox.width, cardWidth);
    closeTo(emailBox.width, cardWidth);
    closeTo(emailBox.y, activityBox.y + activityBox.height + 24);
    if (width === 1440 || documentWidth === 375) {
      closeTo(activityBox.height, width === 1440 ? 369.75 : 674.046875);
      closeTo(emailBox.y, width === 1440 ? 509.75 : 814.046875);
      closeTo(emailBox.height, width === 1440 ? 405 : 619.1953125);
    }
    for (const label of [
      "Desktop notifications",
      "Unread badge",
      "Team communication",
      "Digest email",
    ]) {
      await expect(account.getByRole("switch", { name: label, exact: true })).toBeChecked();
    }
    await expect(
      account.getByRole("switch", { name: "Product announcements", exact: true }),
    ).not.toBeChecked();
    const start = account.getByRole("combobox", { name: "Start", exact: true });
    const end = account.getByRole("combobox", { name: "End", exact: true });
    const startBox = await documentBox(start);
    const endBox = await documentBox(end);
    closeTo(startBox.x, width === 390 ? x + 20 : 692);
    closeTo(startBox.height, 32);
    if (width === 390) {
      closeTo(startBox.width, cardWidth - 40);
      closeTo(endBox.x, startBox.x);
      closeTo(endBox.y, startBox.y + 71.25);
    } else {
      closeTo(startBox.width, 350);
      closeTo(endBox.x, startBox.x + startBox.width + 12);
      closeTo(endBox.y, startBox.y);
    }
    await expect(start).toHaveText("8:00 PM");
    await expect(end).toHaveText("8:00 AM");
    await optionList(page, start, ["6:00 PM", "8:00 PM", "10:00 PM", "11:00 PM"]);
    await optionList(page, end, ["6:00 AM", "8:00 AM", "9:00 AM", "10:00 AM"]);
    const autoDismiss = account.getByRole("combobox", { name: "Auto dismiss", exact: true });
    await expect(autoDismiss).toHaveText("10 minutes");
    await optionList(page, autoDismiss, ["5 minutes", "10 minutes", "15 minutes", "30 minutes"]);
    const cadence = account.getByRole("combobox", { name: "How often", exact: true });
    await expect(cadence).toHaveText("Every week");
    await optionList(page, cadence, ["Every day", "Every week", "Every month"]);
    await page.screenshot({ path: info.outputPath("lucent-preferences.png"), fullPage: true });
    await writeFile(
      info.outputPath("preferences-layout.json"),
      JSON.stringify(
        {
          width,
          documentWidth,
          activityBox,
          emailBox,
          startBox,
          endBox,
        },
        null,
        2,
      ),
    );
  });

  // Native history and local save/reset are preview contracts. The original
  // history capture was incomplete, and its financial/save actions were not run.
  test(`Lucent routes ${width}: menu Preferences differs from Account tab; native history preserves query`, async ({
    page,
  }) => {
    const mobile = width === 390;
    await page.setViewportSize({ width, height: mobile ? 844 : 1000 });
    const mount = mobile ? "templates" : "template-preview";
    const base = `/#/${mount}/lucent`;
    const query = "?source=account%2Bqa&empty=&source=second";
    const route = (section: string) => `${base}/${section}${query}`;
    await page.goto(route("account/billing"));
    const account = page.locator(".lucent-account-page");
    await expect(account.getByRole("tab", { name: "Billing", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userMenu(page, mobile);
    const preferences = page.getByRole("menuitem", { name: /^Preferences/ });
    await expect(preferences).toHaveAttribute("href", `#/${mount}/lucent/settings${query}`);
    await preferences.click();
    await expect(page).toHaveURL(route("settings"));
    await expect(account).toHaveCount(0);
    await expect(page.locator('.wf-lucent-general [data-slot="frame"]')).toBeVisible();
    if (mobile) {
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Open navigation", exact: true }),
      ).toBeFocused();
    }
    await userMenu(page, mobile);
    await page.getByRole("menuitem", { name: /^Profile/ }).click();
    await expect(page).toHaveURL(route("account/profile"));
    await account.getByRole("tab", { name: "Billing", exact: true }).click();
    await expect(page).toHaveURL(route("account/billing"));
    await account.getByRole("tab", { name: "Preferences", exact: true }).click();
    await expect(page).toHaveURL(route("account/preferences"));
    await expect(account.getByRole("region", { name: "Preferences", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(route("account/billing"));
    await expect(account.getByRole("tab", { name: "Billing", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.goForward();
    await expect(page).toHaveURL(route("account/preferences"));
    await expect(account.getByRole("tab", { name: "Preferences", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.reload();
    await expect(page).toHaveURL(route("account/preferences"));
    await expect(account.getByRole("region", { name: "Preferences", exact: true })).toBeVisible();
  });

  test(`Lucent local account ${width}: Profile save/cancel preserves independent Billing and Preferences`, async ({
    page,
  }) => {
    const account = await openAccount(page, width, "profile");
    const profileTab = account.getByRole("tab", { name: "Profile", exact: true });
    const billingTab = account.getByRole("tab", { name: "Billing", exact: true });
    const preferencesTab = account.getByRole("tab", { name: "Preferences", exact: true });
    const name = account.getByRole("textbox", { name: "Full name", exact: true });
    const savedName = `Jordan QA ${width}`;
    await name.fill(savedName);
    await account.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(profileTab).toHaveAttribute("aria-selected", "true");
    await name.fill("Unsaved profile draft");
    await billingTab.click();
    const billingEmail = account.getByRole("textbox", { name: "Billing email", exact: true });
    await billingEmail.fill("invalid");
    await expect(
      account.getByRole("button", { name: "Update billing", exact: true }),
    ).toBeDisabled();
    await expect(billingEmail).toHaveAttribute("aria-invalid", "true");
    await billingEmail.fill(`billing-${width}@bricklane.example`);
    await account.getByRole("button", { name: "Update billing", exact: true }).click();
    await expect(billingTab).toHaveAttribute("aria-selected", "true");
    await preferencesTab.click();
    const desktopAlerts = account.getByRole("switch", {
      name: "Desktop notifications",
      exact: true,
    });
    await desktopAlerts.uncheck();
    await choose(
      page,
      account.getByRole("combobox", { name: "How often", exact: true }),
      "Every day",
    );
    await account.getByRole("button", { name: "Save preferences", exact: true }).click();
    await expect(preferencesTab).toHaveAttribute("aria-selected", "true");
    await profileTab.click();
    await expect(name).toHaveValue("Unsaved profile draft");
    await account.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(name).toHaveValue(savedName);
    await expect(profileTab).toHaveAttribute("aria-selected", "true");
    // A real pointer over the bottom toast pauses its native lifetime. Leave
    // that hover and observe dismissal before repeating the same footer action.
    await page.mouse.move(2, 2);
    await expect(
      page.getByText("Your profile is back to its saved values.", { exact: true }),
    ).toBeHidden();
    const profileEmail = account.getByRole("textbox", { name: "Email address", exact: true });
    await profileEmail.fill("invalid");
    await expect(account.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    await account.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(profileEmail).toHaveValue("jordan.blake@bricklane.example");
    await billingTab.click();
    await expect(billingEmail).toHaveValue(`billing-${width}@bricklane.example`);
    await preferencesTab.click();
    await expect(desktopAlerts).not.toBeChecked();
    await expect(account.getByRole("combobox", { name: "How often", exact: true })).toHaveText(
      "Every day",
    );
    await account.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(desktopAlerts).toBeChecked();
    await expect(account.getByRole("combobox", { name: "How often", exact: true })).toHaveText(
      "Every week",
    );
    await billingTab.click();
    await expect(billingEmail).toHaveValue(`billing-${width}@bricklane.example`);
    await profileTab.click();
    await expect(name).toHaveValue(savedName);
  });
}
