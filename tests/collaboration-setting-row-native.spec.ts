import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const widths = [1440, 390] as const;

async function navigatePulse(page: Page, width: number, name: "Dashboard" | "Settings") {
  if (width === 390) {
    await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
    const sidebar = page.getByRole("dialog", { name: "Sidebar", exact: true });
    await sidebar.getByRole("button", { name, exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(sidebar).toBeHidden();
  } else {
    await page.getByRole("button", { name, exact: true }).filter({ visible: true }).first().click();
  }
}

async function openSettings(page: Page, id: "pulse" | "roster", width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/#/template-preview/${id}`);
  if (id === "pulse") {
    await navigatePulse(page, width, "Settings");
  } else {
    if (width === 390) {
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    }
    const visibleButton = (name: string) =>
      page.getByRole("button", { name, exact: true }).filter({ visible: true }).first();
    if (!(await visibleButton("Organisation").isVisible())) await visibleButton("Settings").click();
    await visibleButton("Organisation").click();
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(`.ct-${id}-settings`)).toBeVisible();
  expect(
    await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.status;
    }),
  ).toBe("loaded");
}

function rowByHeading(page: Page, root: Locator, title: string) {
  return root.locator(".ct-setting-row").filter({
    has: page.getByRole("heading", { name: title, exact: true, level: 3 }),
  });
}

async function rowEvidence(
  page: Page,
  row: Locator,
  info: TestInfo,
  name: string,
  width: number,
  description: boolean,
  profile = false,
  directControl = false,
) {
  await expect(row).toHaveCount(1);
  await expect(row).toBeVisible();
  await row.screenshot({ path: info.outputPath(`${name}-row.png`) });
  const actual = await row.evaluate((element) => {
    const label = element.querySelector(':scope > [data-slot="field-content"].ct-setting-label');
    const title = label?.querySelector(':scope > [data-slot="field-label"]') ?? null;
    const heading = title?.querySelector(":scope > h3") ?? null;
    const descriptionNode =
      label?.querySelector(':scope > p[data-slot="field-description"]') ?? null;
    const control = element.querySelector(
      ":scope > .workspace-settings-control.ct-setting-control",
    );
    const native =
      control?.querySelector(':scope > input, :scope > [data-slot="select-trigger"]') ?? null;
    const inspect = (node: Element | null) => {
      if (!node) return null;
      const bounds = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        tag: node.tagName,
        slot: node.getAttribute("data-slot"),
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        display: style.display,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        gap: style.gap,
        marginTop: style.marginTop,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        gridColumns: style.gridTemplateColumns,
      };
    };
    return {
      role: element.getAttribute("role"),
      slot: element.getAttribute("data-slot"),
      proClass: element.classList.contains("workspace-settings-row"),
      directChildren: element.children.length,
      directFieldContentCount: element.querySelectorAll(':scope > [data-slot="field-content"]')
        .length,
      directProControlCount: element.querySelectorAll(":scope > .workspace-settings-control")
        .length,
      directNativeControl: !!native && native.parentElement === control,
      fontReady: document.fonts.status,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      row: inspect(element),
      label: inspect(label),
      title: inspect(title),
      heading: inspect(heading),
      description: inspect(descriptionNode),
      control: inspect(control),
      native: inspect(native),
    };
  });
  await info.attach(`${name}-row-actual`, {
    body: JSON.stringify(actual, null, 2),
    contentType: "application/json",
  });
  expect(actual.role).toBe("group");
  expect(actual.slot).toBe("field");
  expect(actual.proClass).toBe(true);
  expect(actual.directChildren).toBe(2);
  expect(actual.directFieldContentCount).toBe(1);
  expect(actual.directProControlCount).toBe(1);
  expect(actual.fontReady).toBe("loaded");
  expect(actual.heading?.tag).toBe("H3");
  expect(actual.title?.slot).toBe("field-label");
  expect(actual.label?.gap).toBe("0px");
  expect(actual.control?.display).toBe("block");
  expect(actual.heading?.fontSize).toBe("14px");
  expect(actual.heading?.fontWeight).toBe("500");
  if (description) {
    expect(actual.description?.tag).toBe("P");
    expect(actual.description?.fontSize).toBe("12px");
    expect(actual.description?.lineHeight).toBe("17px");
    expect(actual.description?.marginTop).toBe("2px");
  } else {
    expect(actual.description).toBeNull();
  }
  if (directControl) expect(actual.directNativeControl).toBe(true);
  for (const [part, value] of Object.entries({
    row: actual.row,
    label: actual.label,
    title: actual.title,
    heading: actual.heading,
    control: actual.control,
    ...(description ? { description: actual.description } : {}),
    ...(directControl ? { native: actual.native } : {}),
  })) {
    expect(value, part).not.toBeNull();
    expect(value!.bounds.width, part).toBeGreaterThan(0);
    expect(value!.bounds.height, part).toBeGreaterThan(0);
  }
  const label = actual.label!.bounds;
  const control = actual.control!.bounds;
  expect(actual.row!.display).toBe("grid");
  const columns = actual.row!.gridColumns.trim().split(/\s+/);
  // These are compatibility targets from committed CSS, not official pixel parity.
  expect(columns).toHaveLength(width === 390 ? 1 : 2);
  expect(actual.row!.gap).toBe(width === 390 ? (profile ? "8px" : "12px") : "16px");
  if (width === 390) {
    expect(label.y + label.height).toBeLessThanOrEqual(control.y + 1);
  } else {
    expect(label.x + label.width).toBeLessThanOrEqual(control.x + 1);
    if (profile) expect(Math.abs(label.width - 254)).toBeLessThanOrEqual(1);
  }
  if (directControl) {
    expect(actual.native!.bounds.x).toBeGreaterThanOrEqual(control.x - 1);
    expect(actual.native!.bounds.x + actual.native!.bounds.width).toBeLessThanOrEqual(
      control.x + control.width + 1,
    );
    expect(Math.abs(actual.native!.bounds.width - control.width)).toBeLessThanOrEqual(1);
  }
  expect(actual.documentWidth).toBeLessThanOrEqual(actual.viewportWidth);
}

async function selectWithKeyboard(page: Page, trigger: Locator, initial: string, next: string) {
  await expect(trigger).toHaveText(initial);
  await trigger.click();
  await expect(page.getByRole("option", { name: initial, exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveText(initial);
  await trigger.click();
  await expect(page.getByRole("option", { name: initial, exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: next, exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveText(next);
}

async function controlLayoutEvidence(container: Locator, info: TestInfo, name: string) {
  const actual = await container.evaluate((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      display: style.display,
      gap: style.gap,
      wrap: style.flexWrap,
      justify: style.justifyContent,
      maxWidth: style.maxWidth,
      swatchSize: style.getPropertyValue("--color-picker-swatch-size").trim(),
      bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
    };
  });
  await info.attach(name, {
    body: JSON.stringify(actual, null, 2),
    contentType: "application/json",
  });
  expect(actual.display).toBe("flex");
  expect(actual.wrap).toBe("wrap");
  expect(actual.bounds.width).toBeGreaterThan(0);
  expect(actual.bounds.height).toBeGreaterThan(0);
  return actual;
}

async function pulseFlow(page: Page, info: TestInfo, width: number) {
  const root = page.locator(".ct-pulse-settings");
  const name = root.getByRole("textbox", { name: "Help desk name", exact: true });
  await expect(name).toHaveValue("Pulse Support");
  const week = root.getByRole("combobox", { name: "First day of week", exact: true });
  await rowEvidence(
    page,
    rowByHeading(page, root, "Help desk name"),
    info,
    "pulse-name",
    width,
    true,
    false,
    true,
  );
  await rowEvidence(
    page,
    rowByHeading(page, root, "First day of week"),
    info,
    "pulse-week",
    width,
    true,
    false,
    true,
  );
  const colorRow = rowByHeading(page, root, "Brand color");
  await rowEvidence(page, colorRow, info, "pulse-color", width, true);
  const colors = colorRow.locator('.ct-setting-control [data-slot="color-picker-swatches"]');
  const colorStyle = await controlLayoutEvidence(colors, info, "pulse-color-control");
  expect(colorStyle.gap).toBe("12px");
  expect(colorStyle.justify).toBe("flex-start");
  expect(colorStyle.maxWidth).toBe("100%");
  expect(colorStyle.swatchSize).toBe("28px");
  await week.click();
  const weekOptions = page.locator('[data-slot="select-content"]').getByRole("option");
  await expect(weekOptions).toHaveText([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]);
  await expect(weekOptions).toHaveCount(7);
  await expect(weekOptions.first()).toBeFocused();
  await page.keyboard.press("End");
  await expect(weekOptions.last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="select-content"]')).toHaveCount(0);
  await expect(week).toBeFocused();
  await expect(week).toHaveText("Monday");
  await selectWithKeyboard(page, week, "Monday", "Tuesday");
  const savedName = `Bricklane Help Desk ${width}`;
  await name.fill(savedName);
  await colorRow.getByRole("option", { name: "Violet", exact: true }).click();
  await root.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(root.getByText("All changes saved", { exact: true })).toBeVisible();
  await navigatePulse(page, width, "Dashboard");
  await expect(name).toHaveCount(0);
  await navigatePulse(page, width, "Settings");
  await expect(name).toHaveValue(savedName);
  await expect(week).toHaveText("Tuesday");
  await expect(colorRow.getByRole("option", { name: "Violet", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await name.fill("Unsaved Help Desk");
  await selectWithKeyboard(page, week, "Tuesday", "Wednesday");
  await root.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(name).toHaveValue(savedName);
  await expect(week).toHaveText("Tuesday");
  await expect(colorRow.getByRole("option", { name: "Violet", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
}

async function rosterFlow(page: Page, info: TestInfo, width: number) {
  const root = page.locator(".ct-roster-settings");
  const company = root
    .locator(".ct-settings-section")
    .filter({ has: page.getByText("Company", { exact: true }) });
  const legal = root.getByRole("textbox", { name: "Legal name", exact: true });
  const month = root.getByRole("combobox", { name: "Fiscal month", exact: true });
  await expect(legal).toHaveValue("Roster UK");
  await expect(root.getByRole("combobox", { name: "Fiscal day", exact: true })).toHaveText("6");
  await rowEvidence(
    page,
    rowByHeading(page, root, "Legal name"),
    info,
    "roster-name",
    width,
    true,
    false,
    true,
  );
  await rowEvidence(
    page,
    rowByHeading(page, root, "Fiscal year starts"),
    info,
    "roster-fiscal",
    width,
    true,
  );
  const workdays = rowByHeading(page, root, "Working days").locator(
    ".ct-setting-control .ct-workdays",
  );
  const workStyle = await controlLayoutEvidence(workdays, info, "roster-workdays-control");
  expect(workStyle.gap).toBe("5px");
  await expect(workdays.getByRole("button")).toHaveCount(7);
  await selectWithKeyboard(page, month, "April", "May");
  await legal.fill("Unsaved company");
  await company.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(legal).toHaveValue("Roster UK");
  await expect(month).toHaveText("April");
  await selectWithKeyboard(page, month, "April", "May");
  await legal.fill(`Bricklane People ${width}`);
  await company.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(company.getByText("All changes saved", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  await expect(root.getByRole("textbox", { name: "Location", exact: true })).toHaveValue("Lisbon");
  await rowEvidence(
    page,
    rowByHeading(page, root, "Full Name"),
    info,
    "roster-profile",
    width,
    false,
    true,
    true,
  );
  const first = root.locator(".ct-setting-row:first-child");
  const beforeFooter = root.locator(".ct-setting-row:nth-last-child(2)");
  await expect(first).toHaveCount(1);
  await expect(beforeFooter).toHaveCount(1);
  const profilePadding = await Promise.all(
    [first, beforeFooter].map((row) =>
      row.evaluate((element) => ({
        title: element.querySelector("h3")?.textContent?.trim(),
        top: getComputedStyle(element).paddingTop,
        bottom: getComputedStyle(element).paddingBottom,
      })),
    ),
  );
  await info.attach("roster-profile-padding", {
    body: JSON.stringify(profilePadding, null, 2),
    contentType: "application/json",
  });
  expect(profilePadding[0].title).toBe("Photo");
  expect(profilePadding[0].top).toBe("16px");
  expect(profilePadding[1].title).toBe("Location");
  expect(profilePadding[1].bottom).toBe("16px");
  await page.getByRole("tab", { name: "Organisation", exact: true }).click();
  await expect(legal).toHaveValue(`Bricklane People ${width}`);
  await expect(month).toHaveText("May");
}

for (const id of ["pulse", "roster"] as const) {
  for (const width of widths) {
    test(`${id} native Pro SettingsRow compatibility ${width}`, async ({ page }, info) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "warning" || message.type() === "error") faults.push(message.text());
      });
      await openSettings(page, id, width);
      if (id === "pulse") await pulseFlow(page, info, width);
      else await rosterFlow(page, info, width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await info.attach("runtime-faults", {
        body: JSON.stringify(faults, null, 2),
        contentType: "application/json",
      });
      expect(faults).toEqual([]);
    });
  }
}
