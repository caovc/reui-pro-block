// Private static candidate. Do not run until Root assigns an integrated browser slot.
// Inherit 30s testcase / 5s assertion / W1R0; no config or media overrides.
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const widths = [1440, 390] as const;
const company = (page: Page) => page.getByRole("region", { name: "Company", exact: true });
const working = (page: Page) => page.getByRole("region", { name: "Working week", exact: true });
const month = (page: Page) =>
  company(page).getByRole("combobox", { name: "Fiscal year start month", exact: true });
// The real ReUI NumberFieldInput owns this aria-label; do not guess its input role.
const day = (page: Page) => company(page).getByLabel("Fiscal year start day", { exact: true });

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

async function editDay(page: Page, value: string) {
  await expect(day(page)).toHaveAttribute("data-slot", "number-field-input");
  await day(page).fill(value);
  // Real blur commits the NumberField input without injecting any handler/focus.
  await page.keyboard.press("Tab");
  await expect(day(page)).toHaveValue(value);
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
    const numberGroup = element.querySelector('[data-slot="number-field-group"]');
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
      bounds: {
        row: box(element),
        fieldContent: box(content),
        control: box(control),
        month: box(monthInput),
        numberGroup: box(numberGroup),
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
  expect(actual.daySlot).toBe("number-field-input");
  for (const [name, bounds] of Object.entries(actual.bounds)) {
    expect(bounds, name).not.toBeNull();
    expect(bounds!.width, name).toBeGreaterThan(0);
    expect(bounds!.height, name).toBeGreaterThan(0);
  }
  const bounds = actual.bounds;
  // Only relative non-overlap and containment, no unknown official pixel widths.
  expect(bounds.month!.x + bounds.month!.width).toBeLessThanOrEqual(bounds.numberGroup!.x + 1);
  expect(bounds.day!.x).toBeGreaterThanOrEqual(bounds.numberGroup!.x - 1);
  expect(bounds.day!.x + bounds.day!.width).toBeLessThanOrEqual(
    bounds.numberGroup!.x + bounds.numberGroup!.width + 1,
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
    await expect(day(page)).toHaveValue("6");
    await fiscalEvidence(page, info, "initial");

    await chooseMonth(page, "May");
    await editDay(page, "12");
    await expect(company(page).getByRole("status")).toHaveText("Unsaved changes");
    await company(page).getByRole("button", { name: "Discard", exact: true }).click();
    await expect(month(page)).toContainText("April");
    await expect(day(page)).toHaveValue("6");
    await chooseMonth(page, "October");
    await editDay(page, "9");
    await company(page).getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(company(page).getByRole("status")).toHaveText("All changes saved");
    await expect(
      company(page).getByRole("button", { name: "Save changes", exact: true }),
    ).toBeDisabled();

    const sat = working(page).getByRole("button", { name: "Sat", exact: true });
    const mon = working(page).getByRole("button", { name: "Mon", exact: true });
    await expect(sat).toHaveAttribute("aria-pressed", "false");
    await sat.hover();
    expect(await sat.evaluate((button) => button.matches(":hover"))).toBe(true);
    await sat.click();
    await expect(sat).toHaveAttribute("aria-pressed", "true");
    await expect(sat).toBeFocused();
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
    await expect(day(page)).toHaveValue("9");
    await expect(company(page).getByRole("status")).toHaveText("All changes saved");

    const pages = page.locator(".bt-settings-tabs");
    await pages.getByRole("button", { name: "Policies", exact: true }).click();
    await expect(page.getByRole("region", { name: "Leave types", exact: true })).toBeVisible();
    await pages.getByRole("button", { name: "Organisation", exact: true }).click();
    await expect(company(page)).toBeVisible();
    await expect(month(page)).toContainText("October");
    await expect(day(page)).toHaveValue("9");
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
