import { expect, test, type Locator, type Page } from "@playwright/test";

async function navigate(page: Page, label: string) {
  if ((page.viewportSize()?.width || 1440) < 760) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  }
  await page.getByRole("button", { name: label, exact: true }).filter({ visible: true }).click();
}

async function createEvent(page: Page, title: string, notes: string) {
  await page.getByRole("gridcell", { name: "Friday, August 14th, 2026", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New event", exact: true });
  await expect(dialog.getByText("Friday, 14 August 2026", { exact: true })).toBeVisible();
  await dialog.getByRole("textbox", { name: "Event title", exact: true }).fill(title);
  await dialog.getByRole("textbox", { name: "Notes", exact: true }).fill(notes);
  await dialog.getByRole("button", { name: "Create event", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

async function expectAllDaySpan(
  calendar: Locator,
  title: string,
  firstDate: string,
  lastDate: string,
) {
  const event = calendar.locator('[data-slot="event-calendar-event"]').filter({ hasText: title });
  await expect(event).toBeVisible();
  const [bar, first, last] = await Promise.all([
    event.boundingBox(),
    calendar.getByRole("gridcell", { name: firstDate, exact: true }).boundingBox(),
    calendar.getByRole("gridcell", { name: lastDate, exact: true }).boundingBox(),
  ]);
  if (!bar || !first || !last) throw new Error(`${title}: calendar span is not rendered`);
  expect(Math.abs(bar.x - first.x), `${title}: first occupied day`).toBeLessThanOrEqual(8);
  expect(
    Math.abs(bar.x + bar.width - last.x - last.width),
    `${title}: last occupied day excludes the next midnight`,
  ).toBeLessThanOrEqual(8);
}

for (const width of [1440, 390]) {
  test(`Roster ${width}px calendar keeps the selected month, same-day events, notes and cancellation`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") faults.push(message.text());
    });
    await page.goto("/#/template-preview/roster");
    await expect(page).toHaveTitle("Bricklane — Blocks & Templates");
    await expect(page.getByText("Workforce overview", { exact: true })).toBeVisible();
    await navigate(page, "Time");
    await expect(page.getByRole("heading", { name: "Team calendar", exact: true })).toBeVisible();
    const calendar = page.locator(".ct-roster-calendar");
    const event = (title: string) =>
      calendar.locator('[data-slot="event-calendar-event"]').filter({ hasText: title });
    await expectAllDaySpan(
      calendar,
      "Abena Mensah: parental leave",
      "Monday, July 27th, 2026",
      "Thursday, July 30th, 2026",
    );
    // Priya's exclusive end is August 1: the July view must stop on July 31.
    await expectAllDaySpan(
      calendar,
      "Priya Nair: annual leave",
      "Wednesday, July 29th, 2026",
      "Friday, July 31st, 2026",
    );
    await page.screenshot({ path: info.outputPath(`samples-july-${width}.png`), fullPage: false });
    await calendar.locator('[data-slot="event-calendar-nav-next"]').click();
    await expect(calendar.locator('[data-slot="event-calendar-title"]')).toHaveText("August 2026");
    await expectAllDaySpan(
      calendar,
      "Marco Bianchi: annual leave",
      "Monday, August 3rd, 2026",
      "Thursday, August 6th, 2026",
    );
    await event("Marco Bianchi: annual leave").click();
    const sampleDetails = page.getByRole("dialog", {
      name: "Marco Bianchi: annual leave",
      exact: true,
    });
    await expect(
      sampleDetails.getByRole("heading", { name: "3 Aug 2026", exact: true }),
    ).toBeVisible();
    await expect(sampleDetails.getByText("All day – 6 Aug 2026", { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`sample-detail-${width}.png`), fullPage: false });
    await page.keyboard.press("Escape");
    await expect(sampleDetails).toHaveCount(0);
    await createEvent(page, "August planning workshop", "Bring the hiring forecast.");
    await createEvent(page, "New event", "A second event on the same date.");
    await expect(event("August planning workshop")).toBeVisible();
    await expect(event("New event")).toBeVisible();
    await page.screenshot({ path: info.outputPath(`calendar-${width}.png`), fullPage: false });

    await event("August planning workshop").click();
    const details = page.getByRole("dialog", { name: "August planning workshop", exact: true });
    await expect(details.getByRole("heading", { name: "14 Aug 2026", exact: true })).toBeVisible();
    await expect(details.getByText("Bring the hiring forecast.", { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`notes-${width}.png`), fullPage: false });
    await page.keyboard.press("Escape");
    await expect(details).toHaveCount(0);
    await event("New event").click();
    const secondDetails = page.getByRole("dialog", { name: "New event", exact: true });
    await expect(
      secondDetails.getByText("A second event on the same date.", { exact: true }),
    ).toBeVisible();
    await expect(
      secondDetails.getByRole("textbox", { name: "Event title", exact: true }),
    ).toHaveCount(0);
    await secondDetails
      .locator(".ct-sheet-footer")
      .getByRole("button", { name: "Close", exact: true })
      .click();

    await calendar.getByRole("button", { name: "Streams", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Team events", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(event("August planning workshop")).toHaveCount(0);
    await expect(event("New event")).toHaveCount(0);
    await expect(event("Marco Bianchi: annual leave")).toBeVisible();
    await calendar.getByRole("button", { name: "Streams", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Team events", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(event("August planning workshop")).toBeVisible();
    await expect(event("New event")).toBeVisible();

    await calendar.locator('[data-slot="event-calendar-nav-next"]').click();
    await page.getByRole("gridcell", { name: "Monday, September 14th, 2026", exact: true }).click();
    const cancelled = page.getByRole("dialog", { name: "New event", exact: true });
    await cancelled
      .getByRole("textbox", { name: "Event title", exact: true })
      .fill("Cancelled event");
    await page.keyboard.press("Escape");
    await expect(cancelled).toHaveCount(0);
    await expect(event("Cancelled event")).toHaveCount(0);
    await navigate(page, "Dashboard");
    await navigate(page, "Time");
    await expect(event("August planning workshop")).toHaveCount(0);
    await expect(event("Ingrid Larsen: annual leave")).toBeVisible();
    await calendar.locator('[data-slot="event-calendar-nav-next"]').click();
    await expect(event("August planning workshop")).toBeVisible();
    await expect(event("New event")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    expect(faults).toEqual([]);
  });
}
