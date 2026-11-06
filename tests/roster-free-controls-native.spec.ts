import { expect, test, type Locator, type Page } from "@playwright/test";

// Local consumer acceptance only. The original Roster page was not observed;
// these tests do not certify its visual geometry or period semantics.
test.use({ actionTimeout: 5000 });
test.describe.configure({ mode: "serial", retries: 0 });

const browserErrors = new WeakMap<Page, string[]>();
const settingsTabs = ["Organisation", "Policies", "Approval flows", "Profile", "Preferences"];

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? [], "native controls must not produce browser errors").toEqual(
    [],
  );
});

async function openRoster(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/roster");
  await expect(periodGroup(page)).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}

function periodGroup(page: Page) {
  return page.getByRole("group", { name: "Workforce overview period", exact: true });
}

async function expectPeriod(page: Page, selected: string, headcount: string) {
  const group = periodGroup(page);
  await expect(group.getByRole("button")).toHaveCount(3);
  await expect(group.locator('button[aria-pressed="true"]')).toHaveCount(1);
  for (const name of ["Week", "Month", "Year"]) {
    await expect(group.getByRole("button", { name, exact: true })).toHaveAttribute(
      "aria-pressed",
      String(name === selected),
    );
  }
  await expect(
    page.locator(".ct-roster-stats .ct-roster-stat").first().locator("strong"),
  ).toHaveText(headcount);
}

// Existing Roster round3/layout specs use the real provider drawer and native
// sidebar leaf buttons. Their helpers are file-local, so use this narrow adapter.
async function navigate(page: Page, label: string) {
  const mobile = (page.viewportSize()?.width ?? 1440) < 768;
  const drawer = page.getByRole("dialog", { name: "Roster", exact: true });
  if (mobile) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await expect(drawer).toBeVisible();
  }
  const navigation = mobile ? drawer : page.locator('.ct-layout-body > [data-slot="sidebar"]');
  const leaf = navigation.getByRole("button", { name: label, exact: true });
  if (settingsTabs.includes(label) && !(await leaf.isVisible())) {
    await navigation.getByRole("button", { name: "Settings", exact: true }).click();
  }
  await leaf.click();
  if (mobile) await expect(drawer).toBeHidden();
}

async function readProgressGeometry(progress: Locator) {
  return progress.evaluate((element) => {
    const track = element.querySelector('[data-slot="progress-track"]');
    const indicator = element.querySelector('[data-slot="progress-indicator"]');
    if (!track || !indicator)
      throw new Error("The actual free Progress track/indicator is missing");
    const rootBox = element.getBoundingClientRect();
    const trackBox = track.getBoundingClientRect();
    const indicatorBox = indicator.getBoundingClientRect();
    return {
      rootWidth: rootBox.width,
      trackWidth: trackBox.width,
      trackHeight: trackBox.height,
      indicatorWidth: indicatorBox.width,
      indicatorHeight: indicatorBox.height,
      startOffset: indicatorBox.left - trackBox.left,
      remaining: trackBox.right - indicatorBox.right,
      ratio: indicatorBox.width / trackBox.width,
    };
  });
}

for (const width of [1440, 390]) {
  test(`${width}px native period is single-select, ignores empty selection and supports arrow-key focus`, async ({
    page,
  }) => {
    await openRoster(page, width);
    await expectPeriod(page, "Year", "198");
    for (const [selected, headcount] of [
      ["Week", "195"],
      ["Month", "196"],
      ["Year", "198"],
    ]) {
      const button = periodGroup(page).getByRole("button", { name: selected, exact: true });
      await button.click();
      await expectPeriod(page, selected, headcount);
      await button.click();
      await expectPeriod(page, selected, headcount);
    }
    await periodGroup(page).getByRole("button", { name: "Week", exact: true }).click();
    await page.keyboard.press("ArrowRight");
    await expect(
      periodGroup(page).getByRole("button", { name: "Month", exact: true }),
    ).toBeFocused();
    await expectPeriod(page, "Week", "195");
    await page.keyboard.press("Space");
    await expectPeriod(page, "Month", "196");
    await page.keyboard.press("ArrowLeft");
    await expect(
      periodGroup(page).getByRole("button", { name: "Week", exact: true }),
    ).toBeFocused();
    await expectPeriod(page, "Month", "196");
    await page.keyboard.press("Enter");
    await expectPeriod(page, "Week", "195");
  });

  test(`${width}px actual Progress retains 43 and 9/21 with its indicator inside the track`, async ({
    page,
  }) => {
    await openRoster(page, width);
    const progress = page.getByRole("progressbar", { name: "Reviews complete", exact: true });
    await progress.scrollIntoViewIfNeeded();
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute("aria-valuemin", "0");
    await expect(progress).toHaveAttribute("aria-valuemax", "100");
    await expect(progress).toHaveAttribute("aria-valuenow", "43");
    await expect(progress).toHaveAttribute("aria-valuetext", "9 of 21 reviews complete");
    await expect(
      page.locator(".ct-roster-side").getByText("9 / 21", { exact: true }),
    ).toBeVisible();
    await expect
      .poll(async () => (await readProgressGeometry(progress)).ratio)
      .toBeCloseTo(0.43, 2);
    const geometry = await readProgressGeometry(progress);
    expect(geometry.rootWidth).toBeGreaterThan(0);
    expect(geometry.trackWidth).toBeGreaterThan(0);
    expect(geometry.trackHeight).toBeGreaterThan(0);
    expect(geometry.indicatorHeight).toBeGreaterThan(0);
    expect(geometry.indicatorWidth).toBeLessThanOrEqual(geometry.trackWidth + 0.75);
    expect(Math.abs(geometry.startOffset)).toBeLessThanOrEqual(0.75);
    expect(geometry.remaining).toBeGreaterThanOrEqual(-0.75);
  });

  test(`${width}px original settings drafts and overview period survive existing tab/navigation boundaries`, async ({
    page,
  }) => {
    await openRoster(page, width);
    await periodGroup(page).getByRole("button", { name: "Month", exact: true }).click();
    await navigate(page, "Organisation");
    const company = page.locator('.ct-settings-section[aria-label="Company"]');
    await page
      .getByRole("textbox", { name: "Legal name", exact: true })
      .fill("Bricklane draft company");
    await expect(company.getByRole("button", { name: "Save changes", exact: true })).toBeEnabled();
    await page.getByRole("tab", { name: "Policies", exact: true }).click();
    await page.getByRole("tab", { name: "Profile", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Full Name", exact: true })
      .fill("Local controls draft");
    await navigate(page, "Dashboard");
    await expectPeriod(page, "Month", "196");
    await navigate(page, "Organisation");
    await expect(page.getByRole("textbox", { name: "Legal name", exact: true })).toHaveValue(
      "Bricklane draft company",
    );
    await page.getByRole("tab", { name: "Profile", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Full Name", exact: true })).toHaveValue(
      "Local controls draft",
    );
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Full Name", exact: true })).toHaveValue(
      "Bruno Duarte",
    );
    await page.getByRole("tab", { name: "Organisation", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Legal name", exact: true })).toHaveValue(
      "Bricklane draft company",
    );
    await company.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Legal name", exact: true })).toHaveValue(
      "Roster UK",
    );
  });

  test(`${width}px parent-owned approval filters survive overview round trips`, async ({
    page,
  }) => {
    await openRoster(page, width);
    await navigate(page, "Approvals");
    const search = page.getByRole("textbox", { name: "Search requests", exact: true });
    const status = page.getByRole("combobox", { name: "Filter request status", exact: true });
    const type = page.getByRole("combobox", { name: "Filter request type", exact: true });
    await search.fill("Campaign shoot");
    await status.click();
    await page.getByRole("option", { name: "Pending", exact: true }).click();
    await type.click();
    await page.getByRole("option", { name: "Expense", exact: true }).click();
    const request = page.getByRole("row").filter({ hasText: "Campaign shoot: £4,200" });
    await expect(request).toBeVisible();
    await navigate(page, "Dashboard");
    await expectPeriod(page, "Year", "198");
    await navigate(page, "Approvals");
    // Shared shell navigation clears the separate parent query. Approval search,
    // status and type belong to useRosterApprovalsState and intentionally persist.
    await expect(search).toHaveValue("Campaign shoot");
    await expect(status).toHaveText("Pending");
    await expect(type).toHaveText("Expense");
    await expect(request).toBeVisible();
    await expect(request.getByText("Pending", { exact: true })).toBeVisible();
  });
}
