// Draft gate only. Requires the later, approved main host integration; never run on a leaf harness.
// No tests in this file were executed for the static milestone.
import { expect, test, type Locator, type Page } from "@playwright/test";

const entry = "/#/template-preview/filespace";
const faults = new WeakMap<Page, string[]>();
const writes = new WeakMap<Page, string[]>();
const features = [
  "Seats",
  "Storage",
  "Link sharing",
  "Version history",
  "Shared drives",
  "Approval controls",
  "Access reviews",
  "Priority support",
];
const headerWorkspace = (page: Page) => page.locator(".drive-workspace-trigger");
const settingsNav = (page: Page, label: string) =>
  page
    .getByRole("navigation", { name: "Account settings sections" })
    .getByRole("link", { name: label, exact: true });

async function openApplication(page: Page, label: string, width: number) {
  if (width === 390) {
    await page.getByRole("button", { name: "Open application navigation", exact: true }).click();
  }
  await page
    .getByRole("link", { name: label, exact: true })
    .or(page.getByRole("button", { name: label, exact: true }))
    .click();
}

async function load(page: Page, suffix = "/pricing") {
  await page.goto(`${entry}${suffix}`);
  await page.evaluate(() => document.fonts.ready);
  await expect(headerWorkspace(page)).toHaveAccessibleName("Bricklane");
}

async function nearBox(locator: Locator, width: number, height: number, tolerance = 1) {
  await expect
    .poll(() =>
      locator.evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter(
              (animation) =>
                animation.playState === "running" &&
                Number.isFinite(animation.effect?.getComputedTiming().iterations),
            ).length,
      ),
    )
    .toBe(0);
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs(box!.width - width)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(box!.height - height)).toBeLessThanOrEqual(tolerance);
}

async function font(locator: Locator, expected: RegExp) {
  await expect
    .poll(() => locator.evaluate((element) => getComputedStyle(element).fontFamily))
    .toMatch(expected);
}

async function customize(page: Page, value: "Default" | "Serif" | "Mono" | "Reset") {
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  if (value === "Reset") {
    await page.getByRole("button", { name: "Reset", exact: true }).click();
  } else {
    await page.getByRole("combobox", { name: "Body font", exact: true }).click();
    await page.getByRole("option", { name: value, exact: true }).click();
  }
  await page.getByRole("button", { name: "Close customizer", exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  faults.set(page, []);
  writes.set(page, []);
  page.on("pageerror", (error) => faults.get(page)?.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) faults.get(page)?.push(message.text());
  });
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      writes.get(page)?.push(`${request.method()} ${request.url()}`);
    }
  });
});

test.afterEach(async ({ page }, info) => {
  await info.attach("console-and-page-faults", {
    body: JSON.stringify(faults.get(page)),
    contentType: "application/json",
  });
  await info.attach("non-read-requests", {
    body: JSON.stringify(writes.get(page)),
    contentType: "application/json",
  });
  expect(faults.get(page)).toEqual([]);
  expect(writes.get(page)).toEqual([]);
});

test("1440 main Pricing matches the complete static matrix and all row densities", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await load(page);
  const panel = page.locator(".drive-pricing-desktop > [data-slot=frame-panel]");
  await nearBox(panel, 896, 637);
  const box = await panel.boundingBox();
  expect(Math.abs(box!.x - 292)).toBeLessThanOrEqual(1);
  expect(Math.abs(box!.y - 160.75)).toBeLessThanOrEqual(1);
  const table = page.getByRole("table", { name: "Plan comparison" });
  await expect(table.getByRole("row")).toHaveCount(9);
  await expect(table.getByRole("rowheader")).toHaveText(features);
  const rows = table.getByRole("row");
  for (let index = 1; index <= 8; index += 1) {
    const row = rows.nth(index);
    const height = index <= 2 ? 49 : index === 8 ? 44 : 45;
    const rect = await row.boundingBox();
    expect(Math.abs(rect!.height - height)).toBeLessThanOrEqual(1);
    await expect(row.getByRole("cell")).toHaveCount(3);
  }
  for (const [id, price] of [
    ["free", "$0"],
    ["team", "$49"],
    ["business", "$149"],
  ]) {
    const column = table.locator(`[role=columnheader][data-plan=${id}]`);
    await expect(column.locator(".drive-pricing-price strong")).toHaveText(price!);
    await nearBox(column.locator("button"), id === "business" ? 172.86 : 171.86, 36);
  }
  await expect(table.getByRole("button", { name: "Current plan", exact: true })).toBeDisabled();
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await font(table, /Inter/);
  await page.screenshot({ path: test.info().outputPath("pricing-1440.png"), fullPage: true });
});

test("390 main Pricing renders every 341 by 576 Frame with all eight features", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page);
  const cards = page.locator(".drive-pricing-card");
  await expect(cards).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const card = cards.nth(index);
    await card.scrollIntoViewIfNeeded();
    await nearBox(card, 341, 576);
    await nearBox(card.locator(".drive-pricing-action"), 299, 36);
    await expect(card.locator("dt")).toHaveText(features);
    const rows = card.locator(".drive-pricing-mobile-feature");
    for (let rowIndex = 0; rowIndex < 8; rowIndex += 1) {
      const rect = await rows.nth(rowIndex).boundingBox();
      const height = rowIndex < 2 ? 46 : rowIndex === 7 ? 40 : 41;
      expect(Math.abs(rect!.height - height)).toBeLessThanOrEqual(1);
    }
    await card.screenshot({ path: test.info().outputPath(`pricing-card-${index}.png`) });
  }
  const dimensions = await page.evaluate(() => [
    document.documentElement.clientWidth,
    document.documentElement.scrollWidth,
  ]);
  expect(dimensions).toEqual([390, 390]);
});

for (const width of [1440, 390]) {
  test.describe(`Drive main state and native menu ${width}`, () => {
    test.use({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      deviceScaleFactor: 1,
      colorScheme: "light",
    });

    test("Saved capacity, plan changes and workspace badges follow distinct reference state", async ({
      page,
    }) => {
      await load(page, "/settings/billing");
      const setup = page
        .locator(".ds-card")
        .filter({ has: page.getByText("Billing Setup", { exact: true }) });
      await page.getByRole("checkbox", { name: "16 seats", exact: true }).check();
      await setup.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(setup).toContainText("Free. 16 seats.");
      await expect(page.getByText("12 of 16 seats", { exact: true })).toBeVisible();
      await page.getByRole("link", { name: "Manage plan", exact: true }).click();
      const pricing = page.locator(
        width === 390 ? ".drive-pricing-mobile" : ".drive-pricing-desktop",
      );
      for (const [id, name] of [
        ["team", "Team"],
        ["business", "Business"],
      ]) {
        const plan = pricing.locator(`[data-plan=${id}]`).first();
        await plan.getByRole("button", { name: "Switch", exact: true }).click();
        await expect(page.getByText(`Switched to ${name}`, { exact: true })).toBeVisible();
        await expect(
          plan.getByRole("button", { name: "Current plan", exact: true }),
        ).toBeDisabled();
        await openApplication(page, "Settings", width);
        await settingsNav(page, "Billing").click();
        await expect(setup).toContainText(`${name}. ${id === "team" ? 10 : 24} seats.`);
        if (id === "team")
          for (const seats of [16, 24, 40])
            await expect(
              page.getByRole("checkbox", { name: `${seats} seats`, exact: true }),
            ).not.toBeChecked();
        await page.getByRole("link", { name: "Manage plan", exact: true }).click();
      }
      await headerWorkspace(page).click();
      await expect(
        page.getByRole("menuitem", { name: "Bricklane Business", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Northwind Studio Team", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await openApplication(page, "Settings", width);
      await settingsNav(page, "Billing").click();

      await expect(setup).toContainText("Business. 24 seats.");
      await expect(setup.locator(".ds-plan-price strong")).toHaveText("$149 / workspace");
      await expect(page.getByText("12 of 24 seats", { exact: true })).toBeVisible();
      await page.getByRole("link", { name: "Manage plan", exact: true }).click();
      await expect(
        pricing.locator("[data-plan=business]").first().getByRole("button"),
      ).toBeDisabled();
      await headerWorkspace(page).click();
      await page.getByRole("menuitem", { name: "Northwind Studio Team", exact: true }).click();
      // Header workspace selection is independent of the saved global billing plan.
      await openApplication(page, "Settings", width);
      await settingsNav(page, "Billing").click();
      await expect(setup).toContainText("Business. 24 seats.");
      await headerWorkspace(page).click();
      await page.getByRole("menuitem", { name: "Personal Free", exact: true }).click();
      await expect(setup).toContainText("Business. 24 seats.");
      await page.getByRole("link", { name: "Manage plan", exact: true }).click();
      await headerWorkspace(page).click();
      await page.getByRole("menuitem", { name: "Bricklane Business", exact: true }).click();
      await expect(
        pricing.locator("[data-plan=business]").first().getByRole("button"),
      ).toBeDisabled();
      await page.reload();
      await expect(headerWorkspace(page)).toHaveAccessibleName("Bricklane");
      await expect(pricing.locator("[data-plan=free]").first().getByRole("button")).toBeDisabled();
    });

    test("selection, current-only rename, native Home/Enter and Create cancellation preserve exact boundaries", async ({
      page,
    }) => {
      await load(page, "/settings/workspace");
      await headerWorkspace(page).click();
      await nearBox(page.getByRole("menu"), 224, 177);
      await page.getByRole("menuitem", { name: "Northwind Studio Team", exact: true }).click();
      await expect(headerWorkspace(page)).toHaveAccessibleName("Northwind Studio");
      await expect(headerWorkspace(page)).toBeFocused();
      await expect(page).toHaveURL(/\/settings\/workspace$/);
      await expect(page.getByLabel("Workspace Name", { exact: true })).toHaveValue("Bricklane");
      await page.getByLabel("Workspace Name", { exact: true }).fill("Bricklane renamed studio");
      const details = page
        .locator(".ds-card")
        .filter({ has: page.getByText("Workspace Details", { exact: true }) });
      await details.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(headerWorkspace(page)).toHaveAccessibleName("Bricklane renamed studio");
      await headerWorkspace(page).click();
      await expect(
        page.getByRole("menuitem", { name: "Bricklane Free", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Bricklane renamed studio Team", exact: true }),
      ).toBeVisible();
      await page.getByRole("menuitem", { name: "Personal Free", exact: true }).click();
      await expect(page.getByLabel("Workspace Name", { exact: true })).toHaveValue(
        "Bricklane renamed studio",
      );
      await headerWorkspace(page).click();
      await page.keyboard.press("Home");
      await page.keyboard.press("Enter");
      await expect(headerWorkspace(page)).toHaveAccessibleName("Bricklane");
      await expect(headerWorkspace(page)).toBeFocused();
      await headerWorkspace(page).click();
      await page.getByRole("menuitem", { name: "Create workspace", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Create workspace", exact: true });
      await expect(dialog.getByRole("textbox", { name: "Name", exact: true })).toBeFocused();
      await nearBox(dialog, width === 390 ? 358 : 384, width === 390 ? 256.25 : 216.25);
      await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("Unsubmitted studio");
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(headerWorkspace(page)).toBeFocused();
      await headerWorkspace(page).click();
      await page.getByRole("menuitem", { name: "Create workspace", exact: true }).click();
      await expect(dialog.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("");
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(headerWorkspace(page)).toBeFocused();
    });

    test("local-only Create extension and real Customize fonts reach both portals", async ({
      page,
    }) => {
      await page.goto(`${entry.replace("/template-preview/", "/templates/")}/pricing`);
      await page.evaluate(() => document.fonts.ready);
      await expect(headerWorkspace(page)).toHaveAccessibleName("Bricklane");
      for (const [value, expected] of [
        ["Default", /Inter/],
        ["Serif", /Georgia/],
        ["Mono", /monospace/],
        ["Reset", /Inter/],
      ] as const) {
        await customize(page, value);
        await headerWorkspace(page).click();
        await font(page.getByRole("menu"), expected);
        await page.getByRole("menuitem", { name: "Create workspace", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Create workspace", exact: true });
        await font(dialog, expected);
        await font(dialog.getByRole("textbox", { name: "Name", exact: true }), expected);
        await dialog
          .getByRole("textbox", { name: "Name", exact: true })
          .fill("Unsubmitted local draft");
        await page.keyboard.press("Escape");
        await expect(headerWorkspace(page)).toBeFocused();
      }
      await headerWorkspace(page).click();
      await page.getByRole("menuitem", { name: "Create workspace", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Create workspace", exact: true });
      await dialog.getByRole("button", { name: "Create", exact: true }).click();
      await expect(dialog).toBeVisible();
      await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("Harbor local studio");
      await dialog.getByRole("button", { name: "Create", exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(headerWorkspace(page)).toHaveAccessibleName("Harbor local studio");
      await expect(headerWorkspace(page)).toBeFocused();
      await headerWorkspace(page).click();
      await expect(page.getByRole("menuitem")).toHaveCount(5);
      await expect(
        page.getByRole("menuitem", { name: "Harbor local studio Free", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await page.reload();
      await expect(headerWorkspace(page)).toHaveAccessibleName("Bricklane");
      await headerWorkspace(page).click();
      await expect(page.getByRole("menuitem")).toHaveCount(4);
    });
  });
}
