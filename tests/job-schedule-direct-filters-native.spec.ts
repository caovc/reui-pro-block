import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createJob,
  createScheduleSeed,
  isWorkday,
  jobAttentionFlags,
  jobName,
  jobProgress,
  jobTypes,
  plannedFinish,
  summarizeJobFilters,
  taskHours,
} from "../src/blocks/data/grid-advanced-job-schedule-model";

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });
test.use({
  actionTimeout: 5_000,
  trace: "retain-on-failure",
  viewport: { width: 1440, height: 1000 },
});

const route = "#/preview/data-grid/advanced/data-grid-advanced-22";
const schedule = (page: Page) => page.getByRole("region", { name: "Job schedule", exact: true });
const rows = (page: Page) => schedule(page).locator("table tbody tr[data-row-id]");
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function select(page: Page, control: Locator, option: string) {
  await control.click();
  await page.getByRole("option", { name: new RegExp(`^${escaped(option)}(?:\\s+\\d+)?$`) }).click();
  await expect(control).toHaveAttribute("aria-expanded", "false");
  await expect(control).toBeFocused();
}

test("model: expanding trades preserves the 22-job fixture and V01 workloads", () => {
  const jobs = createScheduleSeed();
  expect(jobs).toHaveLength(22);
  expect(jobs.map((job) => job.id)).toEqual(
    Array.from({ length: 22 }, (_, index) => `job-${index + 1}`),
  );
  expect(summarizeJobFilters(jobs).typeCounts).toEqual({
    "Kitchen Remodel": 8,
    "Bath Remodel": 5,
    "Exterior Paint": 7,
    "Basement Finish": 2,
    "Tile Floor": 0,
    "Deck Build": 0,
  });
  expect(jobProgress(jobs[4]).left).toBe(23);
  expect(jobProgress(jobs[13]).left).toBe(31);
  expect(taskHours(jobs[2].days.find((day) => day.state === "Lost")!)).toBe(8);
  expect(jobTypes).toEqual([
    "Kitchen Remodel",
    "Bath Remodel",
    "Exterior Paint",
    "Basement Finish",
    "Tile Floor",
    "Deck Build",
  ]);
  for (const type of ["Tile Floor", "Deck Build"] as const) {
    const job = createJob({
      client: "Casey Orchard",
      phone: "",
      street: "27 Juniper Walk",
      town: "North Haven",
      type,
      lead: "bruno",
      start: "2026-10-28",
      due: plannedFinish(type, "2026-10-28"),
    });
    expect(job.days.length).toBeGreaterThanOrEqual(5);
    expect(job.days.every((day) => isWorkday(day.date))).toBe(true);
    expect(job.materials).toHaveLength(1);
    expect(job.materials[0].name.length).toBeGreaterThan(10);
    expect(jobName(job)).toBe(type === "Tile Floor" ? "Orchard Floor" : "Orchard Deck");
  }
});

test("model: material risk includes future missing dates and clears on receipt", () => {
  const jobs = createScheduleSeed();
  const job = structuredClone(jobs[15]);
  const material = job.materials[0];
  expect(material.needed > "2026-10-27").toBe(true);
  expect(jobAttentionFlags(job, jobs)["late-materials"]).toBe(true);
  material.received = true;
  expect(jobAttentionFlags(job, jobs)["late-materials"]).toBe(false);
  material.received = false;
  material.arrives = "2026-11-30";
  expect(jobAttentionFlags(job, jobs)["late-materials"]).toBe(true);
  material.arrives = material.needed;
  expect(jobAttentionFlags(job, jobs)["late-materials"]).toBe(false);
  material.arrives = "2026-10-19";
  expect(jobAttentionFlags(job, jobs)["late-materials"]).toBe(false);
});

test("model: risks count affected jobs and use actual makeup and crew conflicts", () => {
  const [first, second] = structuredClone(createScheduleSeed().slice(0, 2));
  first.materials = [
    { ...first.materials[0], arrives: null, received: false },
    { ...first.materials[1], arrives: null, received: false },
  ];
  second.materials = [];
  first.days = [
    {
      date: "2026-10-28",
      state: "Planned",
      tasks: [{ id: "a", crewId: "bruno", task: "Frame", hours: 8 }],
    },
    { date: "2026-10-29", state: "Lost", tasks: [], madeUp: false },
  ];
  second.days = [
    {
      date: "2026-10-28",
      state: "Planned",
      tasks: [{ id: "b", crewId: "bruno", task: "Fit", hours: 4 }],
    },
  ];
  expect(summarizeJobFilters([first, second]).attentionCounts).toEqual({
    "lost-days": 1,
    "late-materials": 1,
    "booked-twice": 2,
  });
  first.days[1].madeUp = true;
  expect(jobAttentionFlags(first, [first, second])["lost-days"]).toBe(false);
  second.days[0].state = "Lost";
  expect(jobAttentionFlags(first, [first, second])["booked-twice"]).toBe(false);
});

for (const primitive of ["radix", "base"] as const) {
  test.describe(primitive, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${primitive === "base" ? "./base/" : "./"}${route}`);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(
        schedule(page).getByRole("heading", { name: "Job Schedule", exact: true }),
      ).toBeVisible();
    });

    for (const width of [1440, 390]) {
      test.describe(`${width}px`, () => {
        test.use({
          viewport: { width, height: width === 390 ? 844 : 1000 },
          hasTouch: width === 390,
        });

        test("direct menus expose the complete grouped options and return focus", async ({
          page,
        }, info) => {
          const frame = schedule(page);
          const type = frame.getByRole("combobox", { name: "Job type", exact: true });
          const show = frame.getByRole("combobox", { name: "Show jobs", exact: true });
          await expect(type).toHaveText("All Types");
          await expect(show).toHaveText("All Jobs");
          await page.screenshot({
            path: info.outputPath(`default-${width}.png`),
            animations: "disabled",
          });
          await type.click();
          await expect(page.getByRole("option")).toHaveText([
            "All Types",
            /Bathroom Remodel\s*5/,
            /Kitchen Remodel\s*8/,
            /Basement Finish\s*2/,
            /Tile Floor\s*0/,
            /Deck Build\s*0/,
            /Exterior Paint\s*7/,
          ]);
          await expect(page.getByText("Job type", { exact: true })).toBeVisible();
          await page.screenshot({
            path: info.outputPath(`type-menu-${width}.png`),
            animations: "disabled",
          });
          await page.keyboard.press("Escape");
          await expect(type).toHaveAttribute("aria-expanded", "false");
          await expect(type).toBeFocused();
          await show.click();
          await expect(page.getByRole("option")).toHaveText([
            "All Jobs",
            "Not Started",
            "On Track",
            "Late",
            "On Hold",
            "Complete",
            /Lost Days\s*1/,
            /Late Materials\s*1/,
            /Booked Twice\s*21/,
          ]);
          await expect(page.getByText("Status", { exact: true })).toBeVisible();
          await expect(page.getByText("Needs attention", { exact: true })).toBeVisible();
          await page.screenshot({
            path: info.outputPath(`show-menu-${width}.png`),
            animations: "disabled",
          });
          await page.keyboard.press("Escape");
          await expect(show).toHaveAttribute("aria-expanded", "false");
          await expect(show).toBeFocused();
          await expect
            .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
            .toBe(width);
        });

        test("type and status combine, reset one dimension and return page two to page one", async ({
          page,
        }) => {
          const frame = schedule(page);
          const type = frame.getByRole("combobox", { name: "Job type", exact: true });
          const show = frame.getByRole("combobox", { name: "Show jobs", exact: true });
          await frame.getByRole("button", { name: "Go to page 2", exact: true }).click();
          await expect(frame.getByText("11 - 20 of 22 jobs", { exact: true })).toBeVisible();
          await select(page, type, "Kitchen Remodel");
          await expect(rows(page)).toHaveCount(8);
          await expect(frame.getByText("1 - 8 of 8 jobs", { exact: true })).toBeVisible();
          await select(page, show, "Late");
          await expect(rows(page)).toHaveCount(2);
          await expect(
            frame.getByRole("button", { name: "Farrow Kitchen", exact: true }),
          ).toBeVisible();
          await expect(
            frame.getByRole("button", { name: "Pike Kitchen", exact: true }),
          ).toBeVisible();
          await select(page, type, "All Types");
          await expect(show).toContainText("Late");
          await expect(rows(page)).toHaveCount(2);
          await select(page, show, "All Jobs");
          await expect(type).toHaveText("All Types");
          await expect(frame.getByText("1 - 10 of 22 jobs", { exact: true })).toBeVisible();
          await expect
            .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
            .toBe(width);
        });

        test("search survives each direct All reset until the search itself is cleared", async ({
          page,
        }) => {
          const frame = schedule(page);
          const type = frame.getByRole("combobox", { name: "Job type", exact: true });
          const show = frame.getByRole("combobox", { name: "Show jobs", exact: true });
          await select(page, type, "Kitchen Remodel");
          await select(page, show, "Late");
          if (width === 390)
            await frame.getByRole("button", { name: "Show job search", exact: true }).click();
          await frame.getByRole("textbox", { name: "Search jobs", exact: true }).fill("Pike");
          await expect(rows(page)).toHaveCount(1);
          await select(page, show, "All Jobs");
          await expect(type).toContainText("Kitchen Remodel");
          await expect(rows(page)).toHaveCount(1);
          await select(page, type, "All Types");
          await expect(rows(page)).toHaveCount(1);
          await frame.getByRole("button", { name: "Clear job search", exact: true }).click();
          await expect(frame.getByText("1 - 10 of 22 jobs", { exact: true })).toBeVisible();
          await expect
            .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
            .toBe(width);
        });

        test("generic query synchronizes direct selection and Clear preserves global summaries", async ({
          page,
        }, info) => {
          const frame = schedule(page);
          const type = frame.getByRole("combobox", { name: "Job type", exact: true });
          const show = frame.getByRole("combobox", { name: "Show jobs", exact: true });
          const attention = await frame
            .getByRole("region", { name: "Schedule attention", exact: true })
            .innerText();
          const crew = await frame.locator("tfoot").innerText();
          await frame.getByRole("button", { name: "Filter", exact: true }).click();
          await page.getByRole("option", { name: "Status", exact: true }).click();
          await page.getByRole("option", { name: "is", exact: true }).click();
          await page.getByRole("option", { name: "Late", exact: true }).click();
          await expect(show).toContainText("Late");
          await expect(rows(page)).toHaveCount(2);
          await select(page, show, "Lost Days");
          await expect(rows(page)).toHaveCount(1);
          await expect(
            frame.getByRole("button", { name: "Dawson Exterior", exact: true }),
          ).toBeVisible();
          await expect(
            frame.getByRole("region", { name: "Schedule attention", exact: true }),
          ).toHaveText(attention, { useInnerText: true });
          await expect(frame.locator("tfoot")).toHaveText(crew, { useInnerText: true });
          await frame.getByRole("button", { name: "Clear", exact: true }).click();
          await expect(show).toHaveText("All Jobs");
          await expect(type).toHaveText("All Types");
          await expect(frame.getByText("1 - 10 of 22 jobs", { exact: true })).toBeVisible();
          await expect(
            frame.getByRole("region", { name: "Schedule attention", exact: true }),
          ).toHaveText(attention, { useInnerText: true });
          await expect(frame.locator("tfoot")).toHaveText(crew, { useInnerText: true });
          await expect
            .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
            .toBe(width);
          await page.screenshot({
            path: info.outputPath(`generic-reset-${width}.png`),
            animations: "disabled",
          });
        });

        test("empty Clear Filters resets query and search, restores crew and returns focus", async ({
          page,
        }, info) => {
          const frame = schedule(page);
          const type = frame.getByRole("combobox", { name: "Job type", exact: true });
          const show = frame.getByRole("combobox", { name: "Show jobs", exact: true });
          await select(page, type, "Tile Floor");
          if (width === 390)
            await frame.getByRole("button", { name: "Show job search", exact: true }).click();
          await frame.getByRole("textbox", { name: "Search jobs", exact: true }).fill("Pike");
          await expect(frame.getByText("No Matching Jobs", { exact: true })).toBeVisible();
          await expect(frame.locator("tfoot")).toHaveCount(0);
          await page.screenshot({
            path: info.outputPath(`empty-${width}.png`),
            animations: "disabled",
          });
          await frame.getByRole("button", { name: "Clear Filters", exact: true }).click();
          await expect(type).toBeFocused();
          await expect(type).toHaveText("All Types");
          await expect(show).toHaveText("All Jobs");
          await expect(
            frame.getByRole("textbox", { name: "Search jobs", exact: true }),
          ).toHaveValue("");
          await expect(frame.getByText("1 - 10 of 22 jobs", { exact: true })).toBeVisible();
          await expect(frame.locator("tfoot")).toBeVisible();
          await expect
            .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
            .toBe(width);
          await page.screenshot({
            path: info.outputPath(`reset-${width}.png`),
            animations: "disabled",
          });
        });
      });
    }

    test("generic complex rules project as Custom and direct changes replace only that field", async ({
      page,
    }) => {
      const frame = schedule(page);
      await frame.getByRole("button", { name: "Filter", exact: true }).click();
      await page.getByRole("option", { name: "Job Type", exact: true }).click();
      await page.getByRole("option", { name: "is not", exact: true }).click();
      await page.getByRole("option", { name: "Exterior Paint", exact: true }).click();
      const type = frame.getByRole("combobox", { name: "Job type", exact: true });
      await expect(type).toContainText("Custom filters");
      await select(page, type, "Kitchen Remodel");
      await expect(rows(page)).toHaveCount(8);
      await expect(frame.getByText("Custom filters", { exact: true })).toHaveCount(0);
    });

    test("generic attention empty operators evaluate the entire risk set", async ({ page }) => {
      const frame = schedule(page);
      const show = frame.getByRole("combobox", { name: "Show jobs", exact: true });
      await frame.getByRole("button", { name: "Filter", exact: true }).click();
      await page.getByRole("option", { name: "Needs attention", exact: true }).click();
      await page.getByRole("option", { name: "is empty", exact: true }).click();
      await expect(show).toContainText("Custom filters");
      await expect(rows(page)).toHaveCount(1);
      await expect(
        frame.getByRole("button", { name: "Ivers Exterior", exact: true }),
      ).toBeVisible();
      await frame.getByRole("button", { name: "Clear", exact: true }).click();
      await frame.getByRole("button", { name: "Filter", exact: true }).click();
      await page.getByRole("option", { name: "Needs attention", exact: true }).click();
      await page.getByRole("option", { name: "is not empty", exact: true }).click();
      await expect(frame.getByText("1 - 10 of 21 jobs", { exact: true })).toBeVisible();
      await expect(show).toContainText("Custom filters");
      await select(page, show, "All Jobs");
      await expect(frame.getByText("1 - 10 of 22 jobs", { exact: true })).toBeVisible();
    });

    for (const type of ["Tile Floor", "Deck Build"] as const) {
      test(`creates a real ${type} plan with local materials`, async ({ page }) => {
        const frame = schedule(page);
        await frame.getByRole("button", { name: "Add Job", exact: true }).click();
        const editor = page.getByRole("dialog", { name: "Add Job", exact: true });
        await editor.getByRole("textbox", { name: "Client", exact: true }).fill("Casey Orchard");
        await editor.getByRole("textbox", { name: "Street", exact: true }).fill("27 Juniper Walk");
        await editor.getByRole("textbox", { name: "Town", exact: true }).fill("North Haven");
        const trade = editor.getByRole("combobox", { name: "Job Type", exact: true });
        await trade.click();
        await expect(page.getByRole("option")).toHaveCount(6);
        for (const original of [
          "Kitchen Remodel",
          "Bath Remodel",
          "Exterior Paint",
          "Basement Finish",
        ])
          await expect(page.getByRole("option", { name: original, exact: true })).toBeVisible();
        await page.getByRole("option", { name: type, exact: true }).click();
        await select(
          page,
          editor.getByRole("combobox", { name: "Lead", exact: true }),
          "Bruno Santos",
        );
        await editor.getByRole("button", { name: "Start", exact: true }).click();
        await page.getByRole("button", { name: /Wednesday, October 28/ }).click();
        await editor.getByRole("button", { name: "Add Job", exact: true }).click();
        await expect(editor).toBeHidden();
        await expect(frame).toContainText("23 jobs");
        const name = type === "Tile Floor" ? "Orchard Floor" : "Orchard Deck";
        await frame.getByRole("button", { name, exact: true }).click();
        const detail = page.getByRole("dialog", { name, exact: true });
        await detail.getByRole("tab", { name: /^Crew Days/ }).click();
        await expect(
          detail.getByRole("tab", {
            name: `Crew Days ${type === "Tile Floor" ? 5 : 6}`,
            exact: true,
          }),
        ).toHaveAttribute("aria-selected", "true");
        await detail.getByRole("tab", { name: /^Materials/ }).click();
        await expect(
          detail.getByText(
            type === "Tile Floor"
              ? "Porcelain floor tile and edge trims"
              : "Treated deck boards and exterior fixings",
            { exact: true },
          ),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await select(page, frame.getByRole("combobox", { name: "Job type", exact: true }), type);
        await expect(rows(page)).toHaveCount(1);
        await expect(frame.getByRole("button", { name, exact: true })).toBeVisible();
      });
    }

    test("receiving a missing material changes the risk result and Undo restores it", async ({
      page,
    }) => {
      const frame = schedule(page);
      const show = frame.getByRole("combobox", { name: "Show jobs", exact: true });
      await select(page, show, "Late Materials");
      await expect(rows(page)).toHaveCount(1);
      await frame.getByRole("button", { name: "Ramos Kitchen", exact: true }).click();
      const detail = page.getByRole("dialog", { name: "Ramos Kitchen", exact: true });
      await detail.getByRole("tab", { name: /^Materials/ }).click();
      await detail
        .getByRole("button", { name: "Mark received: Quartz countertop", exact: true })
        .click();
      await expect(detail.getByText(/1 of 3 delivered/)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(detail).toBeHidden();
      await expect(frame.getByRole("button", { name: "Add Job", exact: true })).toBeFocused();
      await expect(rows(page)).toHaveCount(0);
      await expect(show).toContainText("0");
      await show.click();
      await expect(page.getByRole("option", { name: /^Late Materials/ })).toBeDisabled();
      await expect(page.locator('[role="combobox"][aria-label="Show jobs"]')).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect
        .poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="listbox"]')))
        .toBe(true);
      await page.keyboard.press("Escape");
      await expect(show).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(show).toBeFocused();
      await frame.getByRole("button", { name: "Undo last schedule change", exact: true }).click();
      await expect(show).toContainText("1");
      await expect(rows(page)).toHaveCount(1);
      await expect(frame.getByRole("button", { name: "Ramos Kitchen", exact: true })).toBeVisible();
    });
  });
}
