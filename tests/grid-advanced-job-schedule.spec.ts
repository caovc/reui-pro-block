import { expect, test, type Locator, type Page } from "@playwright/test";

const route = "#/preview/data-grid/advanced/data-grid-advanced-22";
const job = "Farrow Kitchen";
const frame = (page: Page) => page.getByRole("region", { name: "Job schedule", exact: true });
const jobButton = (page: Page, name = job) =>
  frame(page).getByRole("button", { name, exact: true });
const rowMenu = (page: Page, name = job) =>
  frame(page).getByRole("button", { name: `Actions for ${name}`, exact: true });

async function openJob(page: Page, name = job) {
  await jobButton(page, name).click();
  const dialog = page.getByRole("dialog", { name, exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function selectOption(page: Page, control: Locator, option: string) {
  await control.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

for (const library of ["radix", "base"] as const) {
  test.describe(library, () => {
    test.beforeEach(async ({ page, baseURL }) => {
      await page.goto(new URL(`${library === "base" ? "base/" : "./"}${route}`, baseURL).href);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", library);
      await expect(
        frame(page).getByRole("heading", { name: "Job Schedule", exact: true }),
      ).toBeVisible();
    });

    test("weekday grid supports paging, selection, search, expansion, settings and date navigation", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const schedule = frame(page);
      const table = schedule.getByRole("table");
      await expect(table.locator("thead th")).toHaveCount(24);
      await expect(table.locator("tbody tr")).toHaveCount(10);
      await expect(table.locator("tfoot")).toContainText("Crew Load");
      const today = schedule.getByRole("button", {
        name: "Crew load for Tue, Oct 27",
        exact: true,
      });
      await expect(today).toHaveAttribute("aria-current", "date");
      await today.press("Enter");
      await expect(page.getByRole("heading", { name: "Tue, Oct 27", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(today).toBeFocused();
      await schedule.getByRole("button", { name: "Next week", exact: true }).click();
      await expect(schedule).toContainText("Oct 26 – Nov 20");
      await schedule.getByRole("button", { name: "Today", exact: true }).click();
      await expect(schedule).toContainText("Oct 19 – Nov 13");
      await schedule.getByRole("button", { name: "Go to page 2", exact: true }).click();
      await expect(jobButton(page)).toHaveCount(0);
      await schedule.getByRole("textbox", { name: "Search jobs", exact: true }).fill("Farrow");
      await expect(table.locator("tbody tr")).toHaveCount(1);
      const row = table
        .getByRole("row")
        .filter({ has: page.getByRole("button", { name: job, exact: true }) });
      const checkbox = row.getByRole("checkbox");
      await checkbox.press("Space");
      await expect(checkbox).toBeChecked();
      const expander = row.getByRole("button", { name: "Expand row", exact: true });
      await expander.press("Enter");
      await expect(table.getByText("Rowan Bennett", { exact: true })).toHaveCount(0);
      await expect(table.getByText("Noel Farrow", { exact: true })).toBeVisible();
      await expect(row.getByRole("button", { name: "Collapse row", exact: true })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      const settings = schedule.getByRole("button", { name: "Schedule settings", exact: true });
      await settings.click();
      const compact = page.getByRole("switch", { name: "Compact rows", exact: true });
      await expect(compact).toBeChecked();
      await compact.press("Space");
      await expect(compact).not.toBeChecked();
      await page.keyboard.press("Escape");
      await expect(settings).toBeFocused();
      await schedule.getByRole("button", { name: "Clear job search", exact: true }).click();

      await schedule.getByRole("button", { name: "Filter", exact: true }).click();
      await page.getByRole("option", { name: "Status", exact: true }).click();
      await page.getByRole("option", { name: "is", exact: true }).click();
      const late = page.getByRole("option", { name: "Late", exact: true });
      await expect(late).toBeVisible();
      await late.click();
      await expect(table.locator("tbody tr[data-row-id]")).toHaveCount(2);
      await expect(jobButton(page, "Pike Kitchen")).toBeVisible();
    });

    test("keyboard menu and details return focus and edited notes reach history", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const name = jobButton(page);
      await name.press("Enter");
      const detail = page.getByRole("dialog", { name: job, exact: true });
      const overview = detail.getByRole("tab", { name: "Overview", exact: true });
      await expect(overview).toHaveAttribute("aria-selected", "true");
      await overview.press("ArrowRight");
      const crewTab = detail.getByRole("tab", { name: /^Crew Days/ });
      await expect(crewTab).toBeFocused();
      await expect(crewTab).toHaveAttribute("aria-selected", "true");
      await crewTab.press("ArrowLeft");
      await detail.getByRole("button", { name: /^(Edit|Add) Notes$/ }).click();
      await detail
        .getByRole("textbox", { name: "Notes", exact: true })
        .fill("Use the west entrance.");
      await detail.getByRole("button", { name: "Save Notes", exact: true }).click();
      await expect(detail.getByText("Use the west entrance.", { exact: true })).toBeVisible();
      await expect(detail.getByRole("button", { name: "Edit Notes", exact: true })).toBeFocused();
      await detail.getByRole("tab", { name: /^History/ }).click();
      await expect(detail.getByText("Job notes updated", { exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(detail).toBeHidden();
      await expect(name).toBeFocused();

      const actions = rowMenu(page);
      await actions.press("ArrowDown");
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("menuitem", { name: "Add Crew Day", exact: true })).toBeFocused();
      await menu.getByRole("menuitem", { name: "Slide Schedule", exact: true }).press("Enter");
      const editor = page.getByRole("dialog", { name: "Slide Schedule", exact: true });
      await expect(editor).toBeVisible();
      await expect(editor.getByRole("button", { name: "Slide", exact: true })).toBeDisabled();
      await selectOption(
        page,
        editor.getByRole("combobox", { name: "Reason", exact: true }),
        "Client request",
      );
      await expect(editor.getByText(/Finish Nov 3 to Nov 4/)).toBeVisible();
      await editor.getByRole("button", { name: "Slide", exact: true }).click();
      await expect(editor).toBeHidden();
      await expect(actions).toBeFocused();

      const changed = await openJob(page);
      await changed.getByRole("tab", { name: /^History/ }).click();
      await expect(changed.getByText("Schedule moved", { exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await frame(page)
        .getByRole("button", { name: "Undo last schedule change", exact: true })
        .click();
      const restored = await openJob(page);
      await restored.getByRole("tab", { name: /^History/ }).click();
      await expect(restored.getByText("Schedule moved", { exact: true })).toHaveCount(0);
      await expect(restored.getByText("Job notes updated", { exact: true })).toBeVisible();
    });

    test("rain make-up and material receipt update the schedule and history", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const schedule = frame(page);
      const makeUp = schedule.getByRole("button", { name: "Make Up Dawson Exterior", exact: true });
      await makeUp.click();
      const slide = page.getByRole("dialog", { name: "Slide Schedule", exact: true });
      await expect(slide.getByRole("combobox", { name: "Reason", exact: true })).toContainText(
        "Rain or weather",
      );
      await slide.getByRole("button", { name: "Slide", exact: true }).click();
      await expect(makeUp).toHaveCount(0);
      await expect(schedule.getByRole("button", { name: "Add Job", exact: true })).toBeFocused();
      const detail = await openJob(page, "Dawson Exterior");
      await detail.getByRole("tab", { name: /^History/ }).click();
      await expect(detail.getByText("Lost day made up", { exact: true })).toBeVisible();
      await detail.getByRole("tab", { name: /^Crew Days/ }).click();
      await detail.getByRole("button", { name: "Add Crew Day", exact: true }).click();
      const crew = page.getByRole("dialog", { name: "Add Crew Day", exact: true });
      await expect(crew).toBeVisible();
      await crew.getByRole("textbox", { name: "Task", exact: true }).fill("Restore window trim");
      await crew.getByRole("button", { name: "Add Crew Day", exact: true }).click();
      const crewTab = detail.getByRole("tab", { name: /^Crew Days/ });
      await expect(crewTab).toBeFocused();
      await expect(detail.getByText(/Restore window trim/)).toBeVisible();
      await page.keyboard.press("Escape");

      const missing = schedule.getByRole("button", { name: "Set Date Ramos Kitchen", exact: true });
      await missing.click();
      const materials = page.getByRole("dialog", { name: "Ramos Kitchen", exact: true });
      const date = materials.getByRole("button", {
        name: "Delivery date for Quartz countertop",
        exact: true,
      });
      await date.click();
      await page.getByRole("button", { name: /Thursday, October 29/ }).click();
      await expect(missing).toHaveCount(0);
      await materials
        .getByRole("button", { name: "Mark received: Quartz countertop", exact: true })
        .click();
      await materials.getByRole("tab", { name: /^History/ }).click();
      await expect(materials.getByText("Material received", { exact: true })).toBeVisible();
      await expect(materials.getByText("Material date set", { exact: true })).toBeVisible();
    });

    test("phone grid stays scrollable, keeps Job pinned and creates a scheduled job with weekday picker", async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const schedule = frame(page);
      const viewport = schedule.locator('[data-slot="scroll-area-viewport"]').first();
      const pinned = schedule.locator('thead th[data-col-id="job"]');
      const before = await pinned.boundingBox();
      const scroll = await viewport.evaluate((node) => {
        node.scrollLeft = 320;
        return {
          viewport: node.clientWidth,
          content: node.scrollWidth,
          scrollLeft: node.scrollLeft,
        };
      });
      expect(scroll.content).toBeGreaterThan(scroll.viewport);
      expect(scroll.scrollLeft).toBe(320);
      expect((await pinned.boundingBox())?.x).toBeCloseTo(before!.x, 0);
      expect(await page.locator("body").evaluate((body) => body.scrollWidth)).toBe(390);
      const attention = schedule.getByRole("region", { name: "Schedule attention", exact: true });
      expect(await attention.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
      await schedule.getByRole("button", { name: "Show job search", exact: true }).click();
      const search = schedule.getByRole("textbox", { name: "Search jobs", exact: true });
      await expect(search).toBeFocused();
      await search.press("Escape");
      await expect(
        schedule.getByRole("button", { name: "Show job search", exact: true }),
      ).toBeFocused();
      await page.screenshot({
        path: info.outputPath("mobile-grid.png"),
        fullPage: true,
        animations: "disabled",
      });

      const add = schedule.getByRole("button", { name: "Add Job", exact: true });
      await add.click();
      const editor = page.getByRole("dialog", { name: "Add Job", exact: true });
      await expect(editor).toBeVisible();
      expect((await editor.boundingBox())?.width).toBeCloseTo(390, 0);
      await editor.getByRole("textbox", { name: "Client", exact: true }).fill("Cleo Orchard");
      await editor.getByRole("textbox", { name: "Street", exact: true }).fill("27 Juniper Walk");
      await editor.getByRole("textbox", { name: "Town", exact: true }).fill("North Haven");
      await selectOption(
        page,
        editor.getByRole("combobox", { name: "Job Type", exact: true }),
        "Bath Remodel",
      );
      const lead = editor.getByRole("combobox", { name: "Lead", exact: true });
      await lead.click();
      await page.getByRole("option").first().click();
      const date = editor.getByRole("button", { name: "Start", exact: true });
      await date.press("Enter");
      const weekday = page.getByRole("button", { name: /Wednesday, October 28/ });
      await expect(page.getByRole("button", { name: /Saturday, October 31/ })).toBeDisabled();
      await weekday.press("Enter");
      await expect(date).toContainText("Wed, Oct 28");
      await editor.getByRole("button", { name: "Add Job", exact: true }).click();
      await expect(editor).toBeHidden();
      await expect(add).toBeFocused();
      const detail = await openJob(page, "Orchard Bath");
      await expect(detail.getByText("27 Juniper Walk, North Haven", { exact: true })).toBeVisible();
      await page.screenshot({ path: info.outputPath("mobile-detail.png"), animations: "disabled" });
    });
  });
}
