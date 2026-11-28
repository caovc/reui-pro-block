import { expect, test, type Page, type Locator } from "@playwright/test";

async function openTime(page: Page, leaf: string) {
  const mobile = (page.viewportSize()?.width || 1440) < 760;
  if (mobile) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const scope = mobile
    ? page.getByRole("dialog", { name: "Roster", exact: true })
    : page.locator('.ct-layout-body > [data-slot="sidebar"]');
  const child = scope.getByRole(["Time off", "Timesheets"].includes(leaf) ? "link" : "button", {
    name: leaf,
    exact: true,
  });
  const group = scope.getByRole("button", {
    name: leaf === "Preferences" ? "Settings" : "Time",
    exact: true,
  });
  await expect(group).toBeVisible();
  if ((await group.getAttribute("aria-expanded")) !== "true") await group.press("Enter");
  await expect(child).toBeVisible();
  await child.click();
  if (mobile) await expect(scope).toBeHidden();
}

async function showAgenda(page: Page) {
  const calendar = page.locator(".ct-roster-leave-calendar");
  await calendar.getByRole("button", { name: "Select view", exact: true }).click();
  await page.getByRole("menuitem", { name: /^Agenda/ }).click();
  await expect(calendar.locator('[data-slot="event-calendar-content"]')).toHaveAttribute(
    "data-view",
    "agenda",
  );
}

async function expectButtonCenter(button: Locator) {
  await expect(button).toBeVisible();
  const hit = await button.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const target = document.elementFromPoint(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
    return {
      buttonReceivesPointer: !!target && element.contains(target),
      hitTag: target?.tagName,
      hitText: target?.textContent?.trim(),
    };
  });
  expect(
    hit.buttonReceivesPointer,
    `The real button center hit ${hit.hitTag}: ${hit.hitText}`,
  ).toBe(true);
}

for (const foundation of ["radix", "base"] as const) {
  test.describe(`${foundation} Roster Time`, () => {
    async function openRoster(page: Page, suffix = "") {
      await page.goto(
        `${foundation === "base" ? "/base/" : "/"}#/template-preview/roster${suffix}`,
      );
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", foundation);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
    }
    for (const width of [1440, 390]) {
      test(`Roster ${width}px Time expands without navigating and opens genuine leave and timesheet destinations`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
        await openRoster(page);
        await expect(page.getByText("Workforce overview", { exact: true })).toBeVisible();
        const mobile = width < 760;
        if (mobile)
          await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        const scope = mobile
          ? page.getByRole("dialog", { name: "Roster", exact: true })
          : page.locator('.ct-layout-body > [data-slot="sidebar"]');
        const time = scope.getByRole("button", { name: "Time", exact: true });
        await time.press("Enter");
        await expect(time).toHaveAttribute("aria-expanded", "true");
        await expect(page.getByText("Workforce overview", { exact: true })).toBeVisible();
        await expect(scope.getByRole("link", { name: "Time off", exact: true })).toBeVisible();
        await expect(scope.getByRole("link", { name: "Timesheets", exact: true })).toBeVisible();
        await expect(scope.getByRole("link", { name: "Time off", exact: true })).toHaveAttribute(
          "href",
          /#\/template-preview\/roster\/time\/time-off$/,
        );
        await expect(scope.getByRole("link", { name: "Timesheets", exact: true })).toHaveAttribute(
          "href",
          /#\/template-preview\/roster\/time\/timesheets$/,
        );
        await scope.getByRole("link", { name: "Time off", exact: true }).click();
        if (mobile) await expect(scope).toBeHidden();
        await expect(page.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
        await expect(page.getByText("Workforce overview", { exact: true })).toHaveCount(0);
        const calendar = page.locator(".ct-roster-leave-calendar");
        await page.screenshot({
          path: test.info().outputPath(`time-off-${foundation}-${width}.png`),
        });
        await expect(calendar.locator('[data-slot="event-calendar-title"]')).toHaveText(
          "July 2026",
        );
        if (width === 1440) {
          const mini = page.getByRole("complementary", { name: "Leave calendars", exact: true });
          const previous = mini.getByRole("button", { name: "Previous month", exact: true });
          const next = mini.getByRole("button", { name: "Next month", exact: true });
          const [caption, left, right] = await Promise.all([
            mini.locator(".rdp-caption_label").boundingBox(),
            previous.boundingBox(),
            next.boundingBox(),
          ]);
          if (!caption || !left || !right)
            throw new Error("The mini-calendar caption and month controls must be rendered");
          expect(caption.x).toBeGreaterThanOrEqual(left.x + left.width);
          expect(caption.x + caption.width).toBeLessThanOrEqual(right.x);
          await previous.click();
          await expect(calendar.locator('[data-slot="event-calendar-title"]')).toHaveText(
            "June 2026",
          );
          await next.click();
          await expect(calendar.locator('[data-slot="event-calendar-title"]')).toHaveText(
            "July 2026",
          );
        }

        await expect(
          calendar
            .locator('[data-slot="event-calendar-event"]')
            .filter({ hasText: "Weekly leads sync" }),
        ).toHaveCount(0);
        if (width === 390) {
          const narrow = calendar
            .locator('[data-slot="event-calendar-event"]')
            .filter({ hasText: "Aisha Rahman: Annual" });
          await expect(narrow).toBeVisible();
          await expect(narrow.locator(".ct-avatar")).toBeHidden();
          const title = await narrow.locator("span.truncate").evaluate((element) => {
            const node = element.firstChild;
            if (!node || node.nodeType !== Node.TEXT_NODE)
              throw new Error("The visible title text is missing");
            const range = document.createRange();
            range.setStart(node, 0);
            range.setEnd(node, 1);
            const first = range.getBoundingClientRect();
            const clip = element.getBoundingClientRect();
            const probe = element.cloneNode(false) as HTMLElement;
            probe.textContent = "…";
            Object.assign(probe.style, {
              position: "absolute",
              visibility: "hidden",
              whiteSpace: "pre",
              width: "max-content",
              overflow: "visible",
              flex: "none",
            });
            element.parentElement!.append(probe);
            const ellipsis = probe.getBoundingClientRect().width;
            probe.remove();
            return {
              clip: { left: clip.left, right: clip.right, width: clip.width },
              first: { left: first.left, right: first.right, width: first.width },
              ellipsis,
              letterSpacing: getComputedStyle(element).letterSpacing,
            };
          });
          await test.info().attach("narrow-event-title", {
            body: JSON.stringify(title),
            contentType: "application/json",
          });
          expect(title.first.width, "the actual first glyph has a rendered box").toBeGreaterThan(0);
          expect(title.first.left).toBeGreaterThanOrEqual(title.clip.left);
          expect(
            title.first.right,
            "the actual first glyph lies inside the title clipping bounds",
          ).toBeLessThanOrEqual(title.clip.right);
          expect(title.ellipsis).toBeGreaterThan(0);
          expect(
            title.ellipsis,
            "the ellipsis in the inherited native text style fits the clip",
          ).toBeLessThanOrEqual(title.clip.width);
        }

        await openTime(page, "Timesheets");
        await expect(page.getByRole("heading", { name: "Timesheets", exact: true })).toBeVisible();
        await expect(
          page.getByText("Hours against each person’s contracted week.", { exact: true }),
        ).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await expect(page.locator("vite-error-overlay")).toHaveCount(0);
      });

      test(`Roster ${width}px leave types, inclusive booking, editing and deletion retain real local state`, async ({
        page,
      }) => {
        const faults: string[] = [];
        page.on("pageerror", (error) => faults.push(error.message));
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
        await openRoster(page);
        await openTime(page, "Time off");
        const calendar = page.locator(".ct-roster-leave-calendar");
        const event = (title: string) =>
          calendar.locator('[data-slot="event-calendar-event"]').filter({ hasText: title });
        if (width === 390) {
          await page.getByRole("button", { name: "Calendars", exact: true }).click();
          await page.getByRole("menuitemcheckbox", { name: "Annual", exact: true }).click();
          await page.keyboard.press("Escape");
        } else
          await page.getByRole("checkbox", { name: "Show Annual leave", exact: true }).uncheck();
        await expect(event("Aisha Rahman: Annual")).toHaveCount(0);
        await expect(event("Abena Mensah: Parental")).toBeVisible();
        if (width === 390) {
          await page.getByRole("button", { name: "Calendars", exact: true }).click();
          await page.getByRole("menuitem", { name: "New leave type", exact: true }).click();
        } else await page.getByRole("button", { name: "New leave type", exact: true }).click();
        const type = page.getByRole("dialog", { name: "New leave type", exact: true });
        await type.getByRole("textbox", { name: "Name", exact: true }).fill("Study leave");
        await type.getByRole("button", { name: "Blue", exact: true }).click();
        await expect(type.getByRole("button", { name: "Blue", exact: true })).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await type.getByRole("button", { name: "Create", exact: true }).click();
        await expect(type).toHaveCount(0);
        const trigger = page.getByRole("button", { name: "Book leave", exact: true });
        await trigger.click();
        const form = page.getByRole("dialog", { name: "Book leave", exact: true });
        await form.getByRole("textbox", { name: "Reason", exact: true }).fill("Research course");
        await form.getByRole("combobox", { name: "Leave type", exact: true }).click();
        await page.getByRole("option", { name: "Study leave", exact: true }).click();
        await form.getByRole("switch", { name: "All day", exact: true }).check();
        await form.getByRole("button", { name: "Leave end date", exact: true }).click();
        await page
          .locator('[data-slot="popover-content"]')
          .getByRole("button", { name: "Friday, July 31st, 2026", exact: true })
          .click();
        await form.getByRole("textbox", { name: "Cover", exact: true }).fill("Amara Okafor");
        await form
          .getByRole("textbox", { name: "Description", exact: true })
          .fill("Bring the workshop notes.");
        await form.getByRole("button", { name: "Book leave", exact: true }).click();
        await expect(form).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await showAgenda(page);
        await expect(event("Research course")).toHaveCount(2);
        await expect(event("Research course").first()).toBeVisible();
        await openTime(page, "Timesheets");
        await openTime(page, "Time off");
        await showAgenda(page);
        await expect(event("Research course")).toHaveCount(2);
        await event("Research course").first().click();
        const detail = page.getByRole("dialog", { name: "Research course", exact: true });
        await expect(detail.getByText("Jul 30 – Jul 31", { exact: true })).toBeVisible();
        await expect(detail.getByText("2 days", { exact: true })).toBeVisible();
        await expect(detail.getByText("Cover: Amara Okafor", { exact: true })).toBeVisible();
        await expect(detail.getByText("Bring the workshop notes.", { exact: true })).toBeVisible();
        await detail.getByRole("button", { name: "Edit", exact: true }).click();
        const editor = page.getByRole("dialog", { name: "Edit leave", exact: true });
        await editor.getByRole("textbox", { name: "Reason", exact: true }).fill("Research seminar");
        await editor.getByRole("button", { name: "Save changes", exact: true }).click();
        await expect(event("Research seminar")).toHaveCount(2);
        await expect(event("Research seminar").first()).toBeVisible();
        await event("Research seminar").first().click();
        const deleteButton = page
          .getByRole("dialog", { name: "Research seminar", exact: true })
          .getByRole("button", { name: "Delete", exact: true });
        await expectButtonCenter(deleteButton);
        await deleteButton.click();
        await expect(event("Research seminar")).toHaveCount(0);
        const feedback = page.getByRole("status").filter({ hasText: /^Leave deleted$/ });
        await expect(feedback).toBeVisible();
        await expect(feedback).toHaveAttribute("aria-live", "polite");
        await trigger.click();
        await page
          .getByRole("dialog", { name: "Book leave", exact: true })
          .getByRole("textbox", { name: "Reason", exact: true })
          .fill("Cancelled booking");
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog", { name: "Book leave", exact: true })).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(event("Cancelled booking")).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await openTime(page, "Preferences");
        const clear = page.getByRole("button", { name: "Clear booked leave", exact: true });
        await expect(clear).toBeEnabled();
        await clear.click();
        await expect(clear).toBeDisabled();
        await openTime(page, "Time off");
        await expect(event("Aisha Rahman: Annual")).toBeVisible();
        if (width === 390) {
          await page.getByRole("button", { name: "Calendars", exact: true }).click();
          await expect(
            page.getByRole("menuitemcheckbox", { name: "Study leave", exact: true }),
          ).toHaveCount(0);
          await page.keyboard.press("Escape");
        } else
          await expect(
            page.getByRole("checkbox", { name: "Show Study leave leave", exact: true }),
          ).toHaveCount(0);
        expect(faults).toEqual([]);
      });
    }

    test("Roster Time routes reload and go Back while legacy calendar remains searchable and the collapsed free group works", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await openRoster(page, "/time/time-off?routeProof=keep%2Bbytes");
      await expect(page.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
      await openTime(page, "Timesheets");
      await expect(page).toHaveURL(
        /#\/template-preview\/roster\/time\/timesheets\?routeProof=keep%2Bbytes$/,
      );
      await page.reload();
      await expect(page.getByRole("heading", { name: "Timesheets", exact: true })).toBeVisible();
      await page.goBack();
      await expect(page.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Dashboard", exact: true }).click();
      await page.getByRole("button", { name: "Jul 1, 2026 - Jul 30, 2026", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Team calendar", exact: true })).toBeVisible();
      const time = page.getByRole("button", { name: "Time", exact: true });
      await expect(time).toHaveAttribute("aria-current", "page");
      await page.keyboard.press("Control+b");
      await time.press("Enter");
      await page.getByRole("menuitem", { name: "Time off", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Search workspace", exact: true }).click();
      const search = page.getByRole("dialog", { name: "Search", exact: true });
      await search
        .getByRole("combobox", { name: "Search workspace routes", exact: true })
        .fill("Team calendar");
      await search.getByRole("option", { name: "Team calendar", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Team calendar", exact: true })).toBeVisible();
      await expect(time).toHaveAttribute("aria-current", "page");
      await expect(page).toHaveURL(
        /#\/template-preview\/roster\/time\/calendar\?routeProof=keep%2Bbytes$/,
      );
    });

    for (const width of [1440, 390]) {
      test(`Roster ${width}px the native People popup closes before the booking sheet and retains a timed booking`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
        await openRoster(page, "/time/time-off");
        const trigger = page.getByRole("button", { name: "Book leave", exact: true });
        await trigger.click();
        const sheet = page.getByRole("dialog", { name: "Book leave", exact: true });
        await sheet.getByRole("textbox", { name: "Reason", exact: true }).fill("Pairing cover");
        const people = sheet.getByRole("combobox", { name: "People", exact: true });
        await people.fill("Amara");
        await expect(page.locator('[data-slot="combobox-content"][data-open]')).toHaveCount(1);
        await page.keyboard.press("Escape");
        await expect(page.locator('[data-slot="combobox-content"][data-open]')).toHaveCount(0);
        await expect(sheet).toBeVisible();
        await expect(sheet).toHaveAttribute("data-state", "open");
        await expect(people).toBeFocused();
        await people.fill("Amara");
        await page.getByRole("option", { name: "Amara Okafor", exact: true }).click();
        await expect(
          sheet.locator('[data-slot="combobox-chip"]').filter({ hasText: "Amara Okafor" }),
        ).toBeVisible();
        await people.press("Tab");
        await expect(page.locator('[data-slot="combobox-content"][data-open]')).toHaveCount(0);
        await expect(sheet).toHaveAttribute("data-state", "open");
        await sheet.getByRole("button", { name: "Book leave", exact: true }).click();
        await expect(sheet).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await showAgenda(page);
        await page
          .locator('.ct-roster-leave-calendar [data-slot="event-calendar-event"]')
          .filter({ hasText: "Pairing cover" })
          .click();
        const detail = page.getByRole("dialog", { name: "Pairing cover", exact: true });
        await expect(detail.getByText("9:00 AM – 9:30 AM", { exact: true })).toBeVisible();
        await expect(detail.getByText("1 guest", { exact: true })).toBeVisible();
        await expect(detail.getByText("Amara Okafor", { exact: true })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(detail).toHaveCount(0);
        await trigger.click();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog", { name: "Book leave", exact: true })).toHaveCount(0);
        await expect(trigger).toBeFocused();
        const calendar = page.locator(".ct-roster-leave-calendar");
        await calendar.getByRole("button", { name: "Select view", exact: true }).click();
        await page.getByRole("menuitem", { name: /^Week/ }).click();
        const hourLabel = calendar
          .locator('[data-slot="event-calendar-time-gutter"]')
          .getByText("11 AM", { exact: true });
        await hourLabel.scrollIntoViewIfNeeded();
        const hour = await hourLabel.boundingBox();
        const day = await calendar
          .getByRole("group", { name: "Thursday, July 30th, 2026", exact: true })
          .boundingBox();
        if (!hour || !day)
          throw new Error("The real Thursday column and11AM label must be rendered");
        await page.mouse.click(day.x + day.width / 2, hour.y + hour.height / 2 + 3);
        const slot = page.getByRole("dialog", { name: "Book leave", exact: true });
        await expect(slot.getByRole("button", { name: "From time", exact: true })).toHaveText(
          "11:00 AM",
        );
        await expect(slot.getByRole("button", { name: "To time", exact: true })).toHaveText(
          "11:30 AM",
        );
        await slot.getByRole("button", { name: "Cancel", exact: true }).click();
        await expect(slot).toHaveCount(0);
        await expect(trigger).toBeFocused();
      });
    }
  });
}
