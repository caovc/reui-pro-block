/** Native Miro notifications, unread state and settings navigation contracts. */
import { expect, test, type Page } from "@playwright/test";

async function rail(page: Page, width: number) {
  if (width === 390) {
    const drawer = page.locator(".bt-layout-mobile");
    if (!(await drawer.isVisible()))
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(drawer).toBeVisible();
    return drawer.locator(".bt-mobile-icon-rail");
  }
  return page.locator(".bt-icon-rail");
}
async function closeMobile(page: Page, width: number) {
  if (width === 390) {
    await page.keyboard.press("Escape");
    await expect(page.locator(".bt-layout-mobile")).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
}
async function select(page: Page, width: number, name: string) {
  await (await rail(page, width)).getByRole("button", { name, exact: true }).click();
  if (width === 390) await expect(page.locator(".bt-layout-mobile")).toBeHidden();
}
async function alertSettings(page: Page, width: number) {
  await select(page, width, "Settings");
  if (width === 390) await rail(page, width);
  await page.getByRole("tab", { name: "Notifications", exact: true }).click();
  await closeMobile(page, width);
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Booked", exact: true })).toBeVisible();
}
async function bell(page: Page, width: number, count: number) {
  const currentRail = await rail(page, width);
  const trigger = currentRail.getByRole("button", {
    name: `Notifications, ${count} ${count === 1 ? "activity" : "activities"}`,
    exact: true,
  });
  await expect(trigger).toBeVisible();
  await expect(
    page.locator(".bt-topbar").getByRole("button", { name: /^Notifications/ }),
  ).toHaveCount(0);
  await trigger.click();
  const menu = page.getByRole("menu", {
    name: `Notifications, ${count} ${count === 1 ? "activity" : "activities"}`,
    exact: true,
  });
  await expect(menu).toBeVisible();
  return { trigger, menu };
}
async function newBooking(page: Page, width: number, patient: string) {
  await select(page, width, "Appointments");
  await page
    .locator(".bt-content")
    .getByRole("button", { name: "New Appointment", exact: true })
    .click();
  const sheet = page.getByRole("dialog", { name: "New Booking", exact: true });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("combobox", { name: "Patient", exact: true }).click();
  await page.getByRole("option", { name: patient, exact: true }).click();
  await sheet.getByRole("button", { name: "Save", exact: true }).click();
  await expect(sheet).toBeHidden();
}
async function bookingRecords(page: Page, width: number) {
  if (width === 390) await rail(page, width);
  const group = page
    .locator(".bt-agenda-group")
    .filter({ has: page.getByRole("heading", { name: "NEW BOOKINGS", exact: true }) });
  await expect(group).toContainText("Lena Morris (General Checkup)");
  await expect(group).toContainText("Harriet Pemberton (General Checkup)");
  await closeMobile(page, width);
}

for (const width of [1440, 390]) {
  test(`Miro rail bell follows real booked activity filtering and restoration ${width}`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:/.test(request.url()) && !["GET", "HEAD"].includes(request.method()))
        errors.push(`Unexpected HTTP write ${request.method()} ${request.url()}`);
    });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/template-preview/miro", { waitUntil: "networkidle" });
    await expect(page.locator(".bt-miro")).toBeVisible();
    let popup = await bell(page, width, 0);
    await expect(popup.menu).toContainText("No matching activity yet.");
    await page.keyboard.press("Escape");
    await expect(popup.trigger).toBeFocused();
    await closeMobile(page, width);

    await alertSettings(page, width);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(
      await page.locator(".bt-topbar h1").evaluate((node) => node.closest("span") === null),
    ).toBe(true);
    const booked = page.getByRole("switch", { name: "Booked", exact: true });
    await expect(booked).toBeChecked();
    await booked.click();
    await expect(booked).not.toBeChecked();
    await newBooking(page, width, "Lena Morris");
    await newBooking(page, width, "Harriet Pemberton");
    await bookingRecords(page, width);

    popup = await bell(page, width, 0);
    await expect(popup.menu.getByRole("listitem")).toHaveCount(0);
    await expect(popup.menu).toContainText("No matching activity yet.");
    await popup.menu.getByRole("menuitem", { name: "Close", exact: true }).click();
    await expect(popup.trigger).toBeFocused();
    await closeMobile(page, width);

    await alertSettings(page, width);
    await expect(page.locator(".miro-alert-row").filter({ has: booked })).toContainText("2 so far");
    await expect(booked).not.toBeChecked();
    await booked.click();
    await expect(booked).toBeChecked();
    popup = await bell(page, width, 2);
    await expect(popup.menu.getByRole("listitem")).toHaveCount(2);
    await expect(popup.menu.getByRole("listitem").first()).toContainText("Booked");
    await expect(popup.menu.getByRole("listitem").first()).toContainText(
      "A chair was given to a patient.",
    );
    await expect(popup.menu).toHaveCSS("font-family", /Inter/);
    await info.attach("actual-bell-font", {
      body: JSON.stringify(
        await popup.menu.evaluate((node) => ({
          family: getComputedStyle(node).fontFamily,
          size: getComputedStyle(node).fontSize,
          lineHeight: getComputedStyle(node).lineHeight,
        })),
        null,
        2,
      ),
      contentType: "application/json",
    });
    await page.screenshot({ path: info.outputPath("booked-enabled-bell.png") });
    await page.keyboard.press("Escape");
    await expect(popup.trigger).toBeFocused();
    await closeMobile(page, width);

    await booked.click();
    popup = await bell(page, width, 0);
    await expect(popup.menu.getByRole("listitem")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(popup.menu).toBeHidden();
    await expect(popup.trigger).toBeFocused();
    await closeMobile(page, width);
    await select(page, width, "Appointments");
    await bookingRecords(page, width);
    await alertSettings(page, width);
    await expect(booked).not.toBeChecked();
    await expect(page.locator(".miro-alert-row").filter({ has: booked })).toContainText("2 so far");
    await booked.click();
    popup = await bell(page, width, 2);
    await expect(popup.menu.getByRole("listitem")).toHaveCount(2);
    await page.keyboard.press("Escape");
    await expect(popup.menu).toBeHidden();
    await expect(popup.trigger).toBeFocused();
    await closeMobile(page, width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect(errors).toEqual([]);
  });
}
