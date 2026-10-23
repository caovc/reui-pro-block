import { test, expect } from "@playwright/test";
const route = (n: number) => `./#/preview/application/schedule/schedule-${n}`;

test("range picker changes its real range and confirms in the original footer", async ({
  page,
}) => {
  await page.goto(route(2));
  const frame = page.getByRole("region", { name: "Time range picker" });
  await expect(frame).toHaveAttribute("data-slot", "frame");
  await expect(frame.locator('[data-slot="frame-panel"]')).toHaveCount(1);
  await expect(frame.getByRole("img", { name: "Alex Johnson" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Start time" })).toHaveText(
    "09:00 AM",
  );
  await expect(page.getByRole("combobox", { name: "End time" })).toHaveText(
    "10:00 AM",
  );
  await page.getByRole("button", { name: "3 hours", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "End time" })).toHaveText(
    "12:00 PM",
  );
  await page.getByRole("combobox", { name: "Start time" }).click();
  await page.getByRole("option", { name: "11:15 AM", exact: true }).click();
  await expect(
    frame.locator('[data-slot="time-picker-field"][name="start-time"]'),
  ).toHaveValue("11:15");
  await expect(
    frame.locator('[data-slot="time-picker-field"][name="end-time"]'),
  ).toHaveValue("12:00");
  await expect(
    page.getByText("Selected duration:", { exact: false }),
  ).toContainText("45 min");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByText("Confirmed:", { exact: false })).toContainText(
    "11:15 AM to 12:00 PM",
  );
  await expect(frame.getByRole("combobox")).toHaveCount(2);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Start time" })).toHaveText(
    "09:00 AM",
  );
  await expect(page.getByRole("combobox", { name: "End time" })).toHaveText(
    "10:00 AM",
  );
  await expect(
    page.getByText("Selected duration:", { exact: false }),
  ).toContainText("1 hour");
});

test("meeting setup stays in place on submit and Cancel resets the actual fields", async ({
  page,
}) => {
  await page.goto(route(3));
  await expect(
    page.getByRole("button", { name: "10:00", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "12:00", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "12:30", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "09:30", exact: true }).click();
  await page.getByRole("combobox", { name: "Duration", exact: true }).click();
  await page.getByRole("option", { name: "1 hour", exact: true }).click();
  await page.getByRole("combobox", { name: "Recurrence", exact: true }).click();
  await page.getByRole("option", { name: "Every day", exact: true }).click();
  await page.getByPlaceholder("e.g. Weekly standup").fill("Design review");
  await page
    .getByPlaceholder("Add agenda or notes...")
    .fill("Discuss the updated screens.");
  await page
    .getByRole("switch", { name: "Waiting room", exact: true })
    .uncheck();
  await page.getByRole("switch", { name: "Auto-record", exact: true }).check();
  await expect(page.getByPlaceholder("e.g. Weekly standup")).toHaveValue(
    "Design review",
  );
  await expect(page.getByPlaceholder("Add agenda or notes...")).toHaveValue(
    "Discuss the updated screens.",
  );
  await page
    .getByRole("button", { name: "Schedule meeting", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Scheduled", exact: true }),
  ).toBeDisabled();
  await expect(page.getByPlaceholder("e.g. Weekly standup")).toHaveValue(
    "Design review",
  );
  await expect(
    page.getByRole("combobox", { name: "Duration", exact: true }),
  ).toHaveText("1 hour");
  await expect(
    page.getByRole("button", { name: "09:30", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByPlaceholder("e.g. Weekly standup")).toHaveValue("");
  await expect(page.getByPlaceholder("Add agenda or notes...")).toHaveValue("");
  await expect(
    page.getByRole("combobox", { name: "Duration", exact: true }),
  ).toHaveText("30 min");
  await expect(
    page.getByRole("combobox", { name: "Recurrence", exact: true }),
  ).toHaveText("Every week");
  await expect(
    page.getByRole("switch", { name: "Waiting room", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Auto-record", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "10:00", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("session duration rebuilds slots, Reset clears selection, booking retains the calendar", async ({
  page,
}) => {
  await page.goto(route(9));
  await expect(
    page.getByRole("button", { name: "Book session", exact: true }),
  ).toBeDisabled();
  await page.locator('[data-day="6/30/2026"]').click();
  await expect(
    page.getByRole("button", { name: "9:30 am", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "9:30 am", exact: true }).click();
  await page.getByRole("button", { name: "90m", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Book session", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "9:30 am", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Available session times").getByRole("button"),
  ).toHaveCount(5);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByText("Pick a date", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "90m", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-day="6/30/2026"]').click();
  await page.getByRole("button", { name: "10:30 am", exact: true }).click();
  await expect(
    page.getByText("Ready, confirm to book", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Book session", exact: true }).click();
  await expect(page.getByText("Booked:", { exact: false })).toContainText(
    "Tuesday, June 30 · 10:30 am (90m)",
  );
  await expect(
    page.getByRole("button", { name: "Booked", exact: true }),
  ).toBeDisabled();
  await expect(page.locator('[data-day="6/30/2026"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: "10:30 am", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Reset", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "15m", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Book session", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Available session times").getByRole("button"),
  ).toHaveCount(32);
});

test("calendar month and year controls navigate real dates and portals use Inter", async ({
  page,
}) => {
  await page.goto(route(9));
  await page.getByRole("combobox", { name: "Month", exact: true }).click();
  const menu = page.getByRole("listbox");
  await expect(menu).toBeVisible();
  expect(
    await menu.evaluate((element) => getComputedStyle(element).fontFamily),
  ).toContain("Inter");
  await page.getByRole("option", { name: "July", exact: true }).click();
  await expect(page.locator('[data-day="7/1/2026"]')).toBeVisible();
  await page.getByRole("combobox", { name: "Year", exact: true }).click();
  await page.getByRole("option", { name: "2027", exact: true }).click();
  await expect(page.locator('[data-day="7/1/2027"]')).toBeVisible();
  await page
    .getByRole("button", { name: "Previous month", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Month", exact: true }),
  ).toHaveText("June");
  await expect(page.locator('[data-day="6/30/2027"]')).toBeVisible();
});

test("booking surfaces render at reference desktop size and 390px without errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const n of [2, 3, 9]) {
      await page.goto(route(n));
      const frame = page.locator(".sr-frame");
      await expect(frame).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      if (width === 1280) {
        const bounds = await frame.boundingBox();
        expect(bounds!.width).toBe(n === 2 ? 448 : 512);
        expect(bounds!.y).toBe(80);
      }
      await page.screenshot({
        path: `/tmp/reui-fidelity-review/schedule-${n}-after-${width}.png`,
        fullPage: true,
      });
    }
  }
  expect(errors).toEqual([]);
});
