import { expect, test, type Locator, type Page } from "@playwright/test";

const settingsSections = [
  "My Profile",
  "Hours",
  "Chairs",
  "Procedures",
  "Billing",
  "Notifications",
];

async function openMiro(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/miro");
  await expect(page.locator(".bt-miro.bt-layout")).toBeVisible();
}

async function navigation(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) >= 768) return page.locator(".bt-layout-rail");
  const drawer = page.locator(".bt-layout-mobile");
  if (!(await drawer.isVisible())) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
  }
  await expect(drawer).toBeVisible();
  return drawer;
}

async function navigate(page: Page, name: string) {
  const menu = await navigation(page);
  await menu.getByRole("button", { name, exact: true }).click();
  if ((page.viewportSize()?.width ?? 1440) < 768) {
    await expect(page.locator(".bt-layout-mobile")).toBeHidden();
  }
}

async function configuration(page: Page, name: string) {
  const phone = (page.viewportSize()?.width ?? 1440) < 768;
  const scope = phone ? await navigation(page) : page.locator(".bt-sidebar");
  const tabs = scope.getByRole("tablist", { name: "Configuration sections", exact: true });
  await expect(tabs.getByRole("tab")).toHaveText(settingsSections);
  const tab = tabs.getByRole("tab", { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  if (phone) {
    // Configuration tabs intentionally keep the native drawer open. The user closes it.
    await page.keyboard.press("Escape");
    await expect(page.locator(".bt-layout-mobile")).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
  const panel = page.locator('.miro-settings > [data-slot="tabs-content"][data-state="active"]');
  await expect(panel).toBeVisible();
  return panel;
}

async function select(page: Page, trigger: Locator, option: string) {
  await trigger.click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await list.getByRole("option", { name: option, exact: true }).click();
  await expect(list).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText(option);
}

async function accountIdentity(page: Page, name: string, hasPhoto: boolean) {
  const menu = await navigation(page);
  const account = menu.getByRole("button", { name: `Open account menu for ${name}`, exact: true });
  await expect(account).toBeVisible();
  await expect(account.locator(".bt-avatar img")).toHaveCount(hasPhoto ? 1 : 0);
  if (!hasPhoto) await expect(account.locator(".bt-avatar")).toHaveText("MS");
  if ((page.viewportSize()?.width ?? 1440) < 768) {
    await page.keyboard.press("Escape");
    await expect(page.locator(".bt-layout-mobile")).toBeHidden();
  }
}

for (const width of [1440, 390]) {
  test(`Miro ${width} profile Cancel/Save updates native account identity and avatar removal`, async ({
    page,
  }) => {
    await openMiro(page, width);
    await navigate(page, "Settings");
    let panel = await configuration(page, "My Profile");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toHaveCount(1);
    const form = panel.getByRole("form", { name: "Profile fields", exact: true });
    const fullName = form.getByLabel("Full name", { exact: true });
    await expect(fullName).toHaveValue("Mara Ellis");
    await expect(form.getByRole("img", { name: "Avatar", exact: true })).toBeVisible();
    await fullName.fill("Unsaved clinic name");
    await form.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(form.getByRole("img", { name: "Avatar", exact: true })).toHaveCount(0);
    await form.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(fullName).toHaveValue("Mara Ellis");
    await expect(form.getByRole("img", { name: "Avatar", exact: true })).toBeVisible();

    await fullName.fill("Mara Stone");
    await form
      .getByLabel("Email address", { exact: false })
      .fill("mara.stone@clinic.bricklane.example");
    await form.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(fullName).toHaveValue("Mara Stone");
    await accountIdentity(page, "Mara Stone", true);
    await form.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(form.getByRole("img", { name: "Avatar", exact: true })).toHaveCount(0);
    await form.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(form.getByRole("button", { name: "Remove", exact: true })).toBeDisabled();
    await accountIdentity(page, "Mara Stone", false);

    await navigate(page, "Dashboard");
    await navigate(page, "Settings");
    panel = await configuration(page, "My Profile");
    await expect(panel.getByLabel("Full name", { exact: true })).toHaveValue("Mara Stone");
    await expect(panel.getByLabel("Email address", { exact: false })).toHaveValue(
      "mara.stone@clinic.bricklane.example",
    );
    await expect(panel.getByRole("img", { name: "Avatar", exact: true })).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });

  test(`Miro ${width} Hours/Chairs drive native calendar and saved prices/terms share Payments state`, async ({
    page,
  }) => {
    await openMiro(page, width);
    await navigate(page, "Settings");
    let panel = await configuration(page, "Hours");
    await select(page, panel.getByLabel("Opens", { exact: true }), "9:00 am");
    await select(page, panel.getByLabel("Closes", { exact: true }), "5:00 pm");
    await panel.getByLabel("Closes", { exact: true }).click();
    const closes = page.getByRole("listbox");
    await expect(closes).toBeVisible();
    await expect(closes.getByRole("option", { name: "9:00 am", exact: true })).toHaveCount(0);
    await expect(closes.getByRole("option", { name: "10:00 am", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(closes).toBeHidden();
    await expect(panel.getByLabel("Closes", { exact: true })).toBeFocused();

    await navigate(page, "Appointments");
    const calendar = page.locator(".bt-miro-week");
    const gutter = calendar.locator('[data-slot="event-calendar-time-gutter"]');
    await expect(gutter).toBeVisible();
    // Native interval is 60 minutes; 09:00 through 17:00 is eight real slot rows.
    // ReUI intentionally omits the label at the first boundary.
    await expect(gutter.locator(":scope > div")).toHaveCount(8);
    await expect(gutter.locator("span")).toHaveText([
      "10 AM",
      "11 AM",
      "12 PM",
      "1 PM",
      "2 PM",
      "3 PM",
      "4 PM",
    ]);
    await page
      .locator(".bt-content")
      .getByRole("button", { name: "New Appointment", exact: true })
      .click();
    const booking = page.getByRole("dialog", { name: "New Booking", exact: true });
    await expect(booking).toBeVisible();
    await select(
      page,
      booking.getByRole("combobox", { name: "Patient", exact: true }),
      "Lena Morris",
    );
    await select(
      page,
      booking.getByRole("combobox", { name: "Practitioner", exact: true }),
      "Dr. Leila Hart",
    );
    await select(page, booking.getByRole("combobox", { name: "Start", exact: true }), "09:00 AM");
    await select(page, booking.getByRole("combobox", { name: "End", exact: true }), "09:30 AM");
    await booking.getByRole("button", { name: "Save", exact: true }).click();
    await expect(booking).toBeHidden();
    const event = calendar.getByRole("button", { name: /^Lena Morris \(General Checkup\),/ });
    await expect(event).toBeVisible();
    const otherEventLabels = await calendar
      .locator('[data-slot="event-calendar-event"]')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => node.getAttribute("aria-label"))
          .filter((label) => !label?.startsWith("Lena Morris (General Checkup),")),
      );

    await navigate(page, "Settings");
    panel = await configuration(page, "Chairs");
    const chair = panel.getByRole("switch", { name: "Dr. Leila Hart", exact: true });
    await expect(chair).toBeChecked();
    await chair.click();
    await expect(chair).not.toBeChecked();
    await navigate(page, "Appointments");
    await expect(event).toHaveCount(0);
    // Seed calendar events have no doctor metadata: disabling a known chair cannot delete them.
    await expect
      .poll(() =>
        calendar
          .locator('[data-slot="event-calendar-event"]')
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label"))),
      )
      .toEqual(otherEventLabels);
    await navigate(page, "Settings");
    panel = await configuration(page, "Chairs");
    await panel.getByRole("switch", { name: "Dr. Leila Hart", exact: true }).click();
    await navigate(page, "Appointments");
    await expect(event).toBeVisible();

    await navigate(page, "Settings");
    panel = await configuration(page, "Procedures");
    const price = panel.getByLabel("General Checkup", { exact: true });
    await price.fill("137");
    await price.press("Tab");
    await panel.getByRole("button", { name: "Save prices", exact: true }).click();
    await expect(price).toHaveValue("137");
    await configuration(page, "Billing");
    panel = await configuration(page, "Procedures");
    await expect(panel.getByLabel("General Checkup", { exact: true })).toHaveValue("137");
    await panel.getByRole("button", { name: "Reset to list price", exact: true }).click();
    await expect(panel.getByLabel("General Checkup", { exact: true })).toHaveValue("105");
    await panel.getByRole("button", { name: "Save prices", exact: true }).click();

    panel = await configuration(page, "Billing");
    await select(page, panel.getByLabel("Payment terms", { exact: true }), "Due on receipt");
    await expect(panel).toContainText("$1,880 over 3 invoices");
    await expect(panel).toContainText("$850 over 1 invoices");
    await navigate(page, "Payments");
    const summary = page.locator(".bt-treatment-billed");
    await expect(
      summary
        .locator("div")
        .filter({ has: page.locator("dt", { hasText: /^OVERDUE$/ }) })
        .locator("dd"),
    ).toHaveText("$850");
    await page
      .getByRole("textbox", { name: "Search clinic records", exact: true })
      .fill("INV-DEMO-3000");
    const invoice = page.getByRole("row").filter({ hasText: "INV-DEMO-3000" });
    await expect(invoice).toContainText("Overdue 1d");
    await navigate(page, "Settings");
    panel = await configuration(page, "Billing");
    await expect(panel.getByLabel("Payment terms", { exact: true })).toContainText(
      "Due on receipt",
    );
    const menu = await navigation(page);
    const configurationScope =
      (page.viewportSize()?.width ?? 1440) < 768 ? menu : page.locator(".bt-sidebar");
    await configurationScope
      .getByRole("button", { name: "Reset to shipped defaults", exact: true })
      .click();
    if ((page.viewportSize()?.width ?? 1440) < 768) {
      await page.keyboard.press("Escape");
      await expect(page.locator(".bt-layout-mobile")).toBeHidden();
    }
    panel = await configuration(page, "Billing");
    await expect(panel.getByLabel("Payment terms", { exact: true })).toContainText("Net 30");
    await expect(panel).toContainText("None");
    await navigate(page, "Appointments");
    await expect(calendar.locator('[data-slot="event-calendar-time-gutter"] > div')).toHaveCount(
      11,
    );
    await expect(event).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
