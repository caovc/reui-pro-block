// Private static candidate. Do not run until Root assigns an integrated browser slot.
// Inherit 30s testcase / 5s assertion / W1R0; no config or media overrides.
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const widths = [1440, 390] as const;
const company = (page: Page) => page.getByRole("region", { name: "Company", exact: true });
const working = (page: Page) => page.getByRole("region", { name: "Working week", exact: true });
const month = (page: Page) =>
  company(page).getByRole("combobox", { name: "Fiscal year start month", exact: true });
const day = (page: Page) =>
  company(page).getByRole("combobox", { name: "Fiscal year start day", exact: true });

async function openOrganisation(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  // Existing round3 openCohort: real prefilled Auth, no route/state injection.
  await page.goto("/#/template-preview/cohort");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".bt-cohort")).toBeVisible();
  if (width === 390) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "Cohort", exact: true });
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: "Settings", exact: true }).click();
    await menu.getByRole("button", { name: "Organisation", exact: true }).click();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("button", { name: "Organisation", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  } else {
    const navigation = page.locator(".bt-sidebar");
    const organisation = navigation.getByRole("button", { name: "Organisation", exact: true });
    if (!(await organisation.isVisible())) {
      await navigation.getByRole("button", { name: "Settings", exact: true }).first().click();
    }
    await organisation.click();
  }
  await expect(company(page)).toBeVisible();
  await expect(working(page)).toBeVisible();
}

async function chooseMonth(page: Page, value: string) {
  const trigger = month(page);
  await trigger.click();
  await page.getByRole("option", { name: value, exact: true }).click();
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(trigger).toContainText(value);
  await expect(trigger).toBeFocused();
}

async function chooseDay(page: Page, value: string) {
  const trigger = day(page);
  await expect(trigger).toHaveAttribute("data-slot", "select-trigger");
  await trigger.click();
  await page.getByRole("option", { name: value, exact: true }).click();
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveText(value);
  await expect(trigger).toBeFocused();
}

async function normalDayBoundary(page: Page, info: TestInfo) {
  const trigger = day(page);
  await trigger.click();
  const options = page.getByRole("option");
  await expect(options).toHaveCount(28);
  const labels = await options.allTextContents();
  await info.attach("normal-day-options", {
    body: JSON.stringify(labels, null, 2),
    contentType: "application/json",
  });
  expect(labels.map((label) => label.trim())).toEqual(
    Array.from({ length: 28 }, (_, index) => String(index + 1)),
  );
  for (const value of ["29", "30", "31"]) {
    await expect(page.getByRole("option", { name: value, exact: true })).toHaveCount(0);
  }
  await page.keyboard.press("End");
  const last = page.getByRole("option", { name: "28", exact: true });
  await expect(last).toBeFocused();
  await expect(last).toBeVisible();
  await expect(page.getByRole("option", { name: "6", exact: true })).toHaveAttribute(
    "data-state",
    "checked",
  );
  await last.click();
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveText("28");
  await expect(trigger).toBeFocused();
  await expect(company(page).getByRole("status")).toHaveText("Unsaved changes");
  await company(page).getByRole("button", { name: "Discard", exact: true }).click();
  await expect(month(page)).toContainText("April");
  await expect(trigger).toHaveText("6");
  await expect(company(page).getByRole("status")).toHaveText("All changes saved");
}

async function escapeDay(page: Page) {
  const trigger = day(page);
  await trigger.click();
  const selected = page.getByRole("option", { name: "6", exact: true });
  await expect(selected).toHaveAttribute("data-state", "checked");
  await expect(selected).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveText("6");
  await expect(trigger).toBeFocused();
}

async function weekdayEvidence(page: Page, info: TestInfo) {
  const group = working(page).getByRole("group", { name: "Working days", exact: true });
  await expect(group).toHaveAttribute("data-slot", "toggle-group");
  await expect(group).toHaveAttribute("data-variant", "outline");
  await expect(group).toHaveAttribute("data-size", "sm");
  await expect(group).toHaveAttribute("data-spacing", "2");
  const actual = await group.getByRole("button").evaluateAll((buttons) =>
    buttons.map((button) => ({
      tag: button.tagName,
      type: button.getAttribute("type"),
      slot: button.getAttribute("data-slot"),
      variant: button.getAttribute("data-variant"),
      size: button.getAttribute("data-size"),
      spacing: button.getAttribute("data-spacing"),
      label: button.getAttribute("aria-label"),
      text: button.textContent?.trim(),
      pressed: button.getAttribute("aria-pressed"),
      tabIndex: button.getAttribute("tabindex"),
    })),
  );
  const scrollGeometry = await group.evaluate((element) => {
    const ancestors = [];
    let node: Element | null = element;
    while (node) {
      const bounds = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      ancestors.push({
        tag: node.tagName,
        className: node.getAttribute("class"),
        slot: node.getAttribute("data-slot"),
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        scrollLeft: node.scrollLeft,
        overflowX: style.overflowX,
      });
      node = node.parentElement;
    }
    return ancestors;
  });
  await info.attach("weekday-native-metadata", {
    body: JSON.stringify({ items: actual, scrollGeometry }, null, 2),
    contentType: "application/json",
  });
  expect(actual.map(({ tabIndex: _tabIndex, ...item }) => item)).toEqual(
    [
      ["Monday", "Mon", "true"],
      ["Tuesday", "Tue", "true"],
      ["Wednesday", "Wed", "true"],
      ["Thursday", "Thu", "true"],
      ["Friday", "Fri", "true"],
      ["Saturday", "Sat", "false"],
      ["Sunday", "Sun", "false"],
    ].map(([label, text, pressed]) => ({
      tag: "BUTTON",
      type: "button",
      slot: "toggle-group-item",
      variant: "outline",
      size: "sm",
      spacing: "2",
      label,
      text,
      pressed,
    })),
  );
}

async function roveWeekdays(page: Page) {
  const group = working(page).getByRole("group", { name: "Working days", exact: true });
  const items = group.getByRole("button");
  const selection = await items.evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("aria-pressed")),
  );
  // Saturday already received native focus from its real click, without focus injection.
  for (const [key, name] of [
    ["ArrowRight", "Sunday"],
    ["Home", "Monday"],
    ["End", "Sunday"],
    ["ArrowLeft", "Saturday"],
  ]) {
    await page.keyboard.press(key);
    const target = group.getByRole("button", { name, exact: true });
    await expect(target).toBeFocused();
    await expect(target).toHaveAttribute("tabindex", "0");
    const actual = await items.evaluateAll((buttons) =>
      buttons.map((button) => ({
        label: button.getAttribute("aria-label"),
        tabIndex: button.getAttribute("tabindex"),
        pressed: button.getAttribute("aria-pressed"),
      })),
    );
    expect(actual.map((item) => item.tabIndex)).toEqual(
      actual.map((item) => (item.label === name ? "0" : "-1")),
    );
    expect(actual.map((item) => item.pressed)).toEqual(selection);
  }
}

async function fiscalEvidence(page: Page, info: TestInfo, phase: string) {
  const row = company(page)
    .locator(".bt-setting-row")
    .filter({
      has: page.getByRole("combobox", { name: "Fiscal year start month", exact: true }),
    });
  await expect(row).toHaveCount(1);
  await expect(month(page)).toBeVisible();
  await expect(day(page)).toBeVisible();
  const actual = await row.evaluate((element) => {
    const content = element.querySelector(':scope > [data-slot="field-content"]');
    const control = element.querySelector(":scope > .workspace-settings-control");
    const monthInput = element.querySelector('[aria-label="Fiscal year start month"]');
    const dayInput = element.querySelector('[aria-label="Fiscal year start day"]');
    const box = (node: Element | null) => {
      if (!node) return null;
      const bounds = node.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
    };
    return {
      rowRole: element.getAttribute("role"),
      rowSlot: element.getAttribute("data-slot"),
      fieldContentCount: element.querySelectorAll(':scope > [data-slot="field-content"]').length,
      controlCount: element.querySelectorAll(":scope > .workspace-settings-control").length,
      title: content?.querySelector('[data-slot="field-label"]')?.textContent ?? null,
      controlsAreInsideControl: !!control?.contains(monthInput) && !!control?.contains(dayInput),
      monthRole: monthInput?.getAttribute("role") ?? null,
      monthLabel: monthInput?.getAttribute("aria-label") ?? null,
      dayRole: dayInput?.getAttribute("role") ?? null,
      dayLabel: dayInput?.getAttribute("aria-label") ?? null,
      daySlot: dayInput?.getAttribute("data-slot") ?? null,
      monthSlot: monthInput?.getAttribute("data-slot") ?? null,
      bounds: {
        row: box(element),
        fieldContent: box(content),
        control: box(control),
        month: box(monthInput),
        day: box(dayInput),
      },
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
  await info.attach(`fiscal-native-${phase}`, {
    body: JSON.stringify({ viewport: page.viewportSize(), ...actual }, null, 2),
    contentType: "application/json",
  });
  await row.screenshot({ path: info.outputPath(`fiscal-native-${phase}.png`) });
  // Record actual slots and geometry before asserting migration/layout targets.
  expect(actual.rowRole).toBe("group");
  expect(actual.rowSlot).toBe("field");
  expect(actual.fieldContentCount).toBe(1);
  expect(actual.controlCount).toBe(1);
  expect(actual.title).toBe("Fiscal year starts");
  expect(actual.controlsAreInsideControl).toBe(true);
  expect(actual.daySlot).toBe("select-trigger");
  expect(actual.monthSlot).toBe("select-trigger");
  expect(actual.dayRole).toBe("combobox");
  expect(actual.monthRole).toBe("combobox");
  for (const [name, bounds] of Object.entries(actual.bounds)) {
    expect(bounds, name).not.toBeNull();
    expect(bounds!.width, name).toBeGreaterThan(0);
    expect(bounds!.height, name).toBeGreaterThan(0);
  }
  const bounds = actual.bounds;
  // The Day reference is observed112×32; preserve local compound containment/non-overlap.
  expect(Math.abs(bounds.day!.width - 112)).toBeLessThanOrEqual(1);
  expect(Math.abs(bounds.day!.height - 32)).toBeLessThanOrEqual(1);
  expect(bounds.month!.x + bounds.month!.width).toBeLessThanOrEqual(bounds.day!.x + 1);
  expect(bounds.day!.x).toBeGreaterThanOrEqual(bounds.control!.x - 1);
  expect(bounds.day!.x + bounds.day!.width).toBeLessThanOrEqual(
    bounds.control!.x + bounds.control!.width + 1,
  );
  expect(actual.documentWidth).toBeLessThanOrEqual(actual.viewportWidth + 1);
}

for (const width of widths) {
  test(`Cohort compound Fiscal and Working week save independently through native controls ${width}`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "warning" || message.type() === "error") faults.push(message.text());
    });
    await openOrganisation(page, width);
    await expect(month(page)).toContainText("April");
    await expect(day(page)).toHaveText("6");
    await fiscalEvidence(page, info, "initial");
    await normalDayBoundary(page, info);
    await escapeDay(page);
    await expect(company(page).getByRole("status")).toHaveText("All changes saved");

    await chooseMonth(page, "May");
    await chooseDay(page, "12");
    await expect(company(page).getByRole("status")).toHaveText("Unsaved changes");
    await company(page).getByRole("button", { name: "Discard", exact: true }).click();
    await expect(month(page)).toContainText("April");
    await expect(day(page)).toHaveText("6");
    await chooseMonth(page, "October");
    await chooseDay(page, "9");
    await company(page).getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(company(page).getByRole("status")).toHaveText("All changes saved");
    await expect(
      company(page).getByRole("button", { name: "Save changes", exact: true }),
    ).toBeDisabled();

    await weekdayEvidence(page, info);
    const sat = working(page).getByRole("button", { name: "Saturday", exact: true });
    const mon = working(page).getByRole("button", { name: "Monday", exact: true });
    await expect(sat).toHaveAttribute("aria-pressed", "false");
    await sat.hover();
    expect(await sat.evaluate((button) => button.matches(":hover"))).toBe(true);
    await sat.click();
    await expect(sat).toHaveAttribute("aria-pressed", "true");
    await expect(sat).toBeFocused();
    await roveWeekdays(page);
    await page.keyboard.press("Space");
    await expect(sat).toHaveAttribute("aria-pressed", "false");
    await expect(sat).toBeFocused();
    await page.keyboard.press("Space");
    await expect(sat).toHaveAttribute("aria-pressed", "true");
    await working(page).getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(working(page).getByRole("status")).toHaveText("All changes saved");
    await mon.click();
    await expect(mon).toHaveAttribute("aria-pressed", "false");
    await working(page).getByRole("button", { name: "Discard", exact: true }).click();
    await expect(mon).toHaveAttribute("aria-pressed", "true");
    await expect(sat).toHaveAttribute("aria-pressed", "true");
    await expect(month(page)).toContainText("October");
    await expect(day(page)).toHaveText("9");
    await expect(company(page).getByRole("status")).toHaveText("All changes saved");

    const pages = page.locator(".bt-settings-tabs");
    await pages.getByRole("button", { name: "Policies", exact: true }).click();
    await expect(page.getByRole("region", { name: "Leave types", exact: true })).toBeVisible();
    await pages.getByRole("button", { name: "Organisation", exact: true }).click();
    await expect(company(page)).toBeVisible();
    await expect(month(page)).toContainText("October");
    await expect(day(page)).toHaveText("9");
    await expect(mon).toHaveAttribute("aria-pressed", "true");
    await expect(sat).toHaveAttribute("aria-pressed", "true");
    await expect(working(page).getByRole("status")).toHaveText("All changes saved");
    await fiscalEvidence(page, info, "after-navigation");
    await info.attach("runtime-faults", {
      body: JSON.stringify(faults, null, 2),
      contentType: "application/json",
    });
    expect(faults).toEqual([]);
  });
}
