import { expect, test, type Page } from "@playwright/test";

async function navigate(page: Page, leaf: string) {
  const mobile = (page.viewportSize()?.width || 1440) < 760;
  if (mobile) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const scope = mobile
    ? page.getByRole("dialog", { name: "Roster", exact: true })
    : page.locator('.ct-layout-body > [data-slot="sidebar"]');
  const target = scope.getByRole(["Time off", "Timesheets"].includes(leaf) ? "link" : "button", {
    name: leaf,
    exact: true,
  });
  const group = scope.getByRole("button", {
    name: leaf === "Preferences" ? "Settings" : "Time",
    exact: true,
  });
  await expect(group).toBeVisible();
  if ((await group.getAttribute("aria-expanded")) !== "true") await group.press("Enter");
  await expect(target).toBeVisible();
  await target.click();
  if (mobile) await expect(scope).toBeHidden();
}

async function select(page: Page, label: string, value: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}

for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390]) {
    test(`Roster ${primitive} ${width}px timesheet grid keeps real filters, pagination and horizontal containment`, async ({
      page,
    }) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto(
        `${primitive === "base" ? "./base/" : "./"}#/template-preview/roster/time/timesheets`,
      );
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.getByRole("heading", { name: "Timesheets", exact: true })).toBeVisible();
      await expect(
        page.getByText("Hours against each person’s contracted week.", { exact: true }),
      ).toBeVisible();
      const frame = page.locator(".ct-timesheets");
      const grid = frame.locator(".ct-timesheets-grid");
      const rows = grid.getByRole("rowgroup").last().getByRole("row");
      await expect(rows).toHaveCount(10);
      await expect(grid.getByRole("columnheader")).toHaveCount(11);
      await expect(grid.getByRole("columnheader", { name: "Status", exact: true })).toHaveCount(1);
      await expect(frame.getByText("1–10 of 21 people", { exact: true })).toBeVisible();
      await expect(
        frame.getByRole("button", { name: "Sign off 21", exact: true }).locator("svg"),
      ).toHaveCount(0);
      await expect(rows.first().locator('[data-slot="avatar-image"]')).toBeVisible();
      const table = await grid.locator("table").boundingBox();
      expect(table?.width).toBeGreaterThanOrEqual(1334);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const geometry = await frame.evaluate((node) => {
        const rect = (element: Element | null) => {
          if (!element) throw new Error("Missing Timesheets layout element");
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom };
        };
        const main = node.closest("main")!;
        const firstCell = node.querySelector("tbody td")!;
        const person = firstCell.querySelector(".ct-timesheet-person")!;
        const avatar = person.querySelector('[data-slot="avatar"]')!;
        const image = avatar.querySelector("img")!;
        const name = person.querySelector(".ct-timesheet-person-name")!;
        const role = person.querySelector("small")!;
        const typography = (element: Element) => {
          const style = getComputedStyle(element);
          return {
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            weight: style.fontWeight,
          };
        };
        return {
          frame: rect(node),
          header: rect(node.querySelector('[data-slot="frame-panel-header"]')),
          toolbar: rect(node.querySelector(".ct-timesheets-toolbar")),
          rows: Array.from(node.querySelectorAll("tbody tr"), rect),
          day: rect(node.querySelector("[data-timesheet-day]")),
          footer: rect(node.querySelector('[data-slot="data-grid-pagination"]')),
          main: { ...rect(main), clientHeight: main.clientHeight, scrollHeight: main.scrollHeight },
          columnBorder: {
            width: getComputedStyle(firstCell).borderInlineEndWidth,
            style: getComputedStyle(firstCell).borderInlineEndStyle,
          },
          person: {
            cell: rect(firstCell),
            padding: {
              left: getComputedStyle(firstCell).paddingLeft,
              right: getComputedStyle(firstCell).paddingRight,
              top: getComputedStyle(firstCell).paddingTop,
              bottom: getComputedStyle(firstCell).paddingBottom,
            },
            gap: getComputedStyle(person).gap,
            avatar: rect(avatar),
            image: rect(image),
            name: { ...rect(name), ...typography(name) },
            role: { ...typography(role), paddingTop: getComputedStyle(role).paddingTop },
            imageAlt: image.getAttribute("alt"),
          },
          weekdays: Array.from(node.querySelectorAll("th"))
            .slice(1, 8)
            .map((cell) => {
              const label = cell.firstElementChild!;
              return {
                text: cell.textContent,
                ...rect(cell),
                textAlign: getComputedStyle(cell).textAlign,
                justify: getComputedStyle(label).justifyContent,
                ...typography(label),
              };
            }),
        };
      });
      await test.info().attach("timesheets-layout", {
        body: JSON.stringify(geometry, null, 2),
        contentType: "application/json",
      });
      await page.screenshot({
        path: test.info().outputPath("timesheets-initial.png"),
        fullPage: true,
      });
      for (const row of geometry.rows) {
        expect(row.height).toBeGreaterThanOrEqual(65.5);
        expect(row.height).toBeLessThanOrEqual(66.5);
      }
      expect(geometry.columnBorder).toEqual({ width: "1px", style: "solid" });
      expect(geometry.person.cell.width).toBe(240);
      expect(geometry.person.padding).toEqual({
        left: "16px",
        right: "8px",
        top: "6px",
        bottom: "6px",
      });
      expect(geometry.person.gap).toBe("10px");
      expect(geometry.person.avatar.width).toBe(32);
      expect(geometry.person.avatar.height).toBe(32);
      expect(geometry.person.image.width).toBe(32);
      expect(geometry.person.image.height).toBe(32);
      expect(geometry.person.imageAlt).toBe("");
      expect(geometry.person.avatar.x - geometry.person.cell.x).toBe(16);
      expect(geometry.person.name.x - geometry.person.avatar.x - geometry.person.avatar.width).toBe(
        10,
      );
      expect(geometry.person.name.fontSize).toBe("14px");
      expect(geometry.person.name.lineHeight).toBe("20px");
      expect(geometry.person.name.weight).toBe("500");
      expect(geometry.person.role).toEqual({
        fontSize: "12px",
        lineHeight: "16px",
        weight: "400",
        paddingTop: "2px",
      });
      expect(geometry.weekdays.map((header) => header.text)).toEqual([
        "Mon, 20 Jul",
        "Tue, 21 Jul",
        "Wed, 22 Jul",
        "Thu, 23 Jul",
        "Fri, 24 Jul",
        "Sat, 25 Jul",
        "Sun, 26 Jul",
      ]);
      for (const header of geometry.weekdays) {
        expect(header.width).toBe(112);
        expect(header.height).toBe(32);
        expect(header.textAlign).toBe("center");
        expect(header.justify).toBe("center");
        expect(header.fontSize).toBe("12px");
        expect(header.lineHeight).toBe("16px");
        expect(header.weight).toBe("400");
      }
      expect(geometry.day.height).toBeGreaterThanOrEqual(44);
      expect(geometry.day.width).toBeGreaterThanOrEqual(44);
      expect(geometry.frame.y).toBeLessThanOrEqual(width === 1440 ? 114 : 105);
      if (width === 1440) {
        expect(geometry.footer.bottom).toBeLessThanOrEqual(geometry.main.bottom);
      } else {
        expect(geometry.rows.filter((row) => row.bottom <= 844)).toHaveLength(6);
        expect(geometry.rows[6].y).toBeLessThan(844);
        expect(geometry.rows[6].bottom).toBeGreaterThan(844);
      }
      await frame.getByRole("button", { name: "Go to page 3", exact: true }).click();
      await expect(rows).toHaveCount(1);
      await expect(frame.getByText("21–21 of 21 people", { exact: true })).toBeVisible();
      await frame.getByRole("button", { name: "Go to page 1", exact: true }).click();
      await select(page, "Rows per page", "20");
      await expect(rows).toHaveCount(20);
      await select(page, "Department", "Engineering");
      await expect(rows).toHaveCount(5);
      await expect(frame.getByText("1–5 of 5 people", { exact: true })).toBeVisible();
      const amara = grid.getByRole("row").filter({ hasText: "Amara Okafor" });
      await expect(amara).toHaveCount(1);
      await expect(amara.getByRole("cell").first()).toHaveText(/^Amara Okafor\s*VP Engineering$/);
      await expect(amara.getByRole("cell").first()).toBeVisible();
      await expect(grid.getByRole("row").filter({ hasText: "Hannah Weber" })).toHaveCount(0);
      await select(page, "Tracked time", "Under target");
      await expect(grid.getByText("No records match your filters.", { exact: true })).toBeVisible();
      await select(page, "Tracked time", "Tracked time");
      await select(page, "Work type", "Mostly project");
      await expect(rows).toHaveCount(3);
      const tomas = grid.getByRole("row").filter({ hasText: "Tomás Silva" });
      await expect(tomas).toHaveCount(1);
      await expect(tomas.getByRole("cell").first()).toHaveText(/^Tomás Silva\s*Engineer$/);
      await expect(tomas.getByRole("cell").first()).toBeVisible();
      await expect(grid.getByRole("row").filter({ hasText: "Amara Okafor" })).toHaveCount(0);
      await select(page, "Work type", "Internal only");
      await expect(grid.getByText("No records match your filters.", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(faults).toEqual([]);
    });

    test(`Roster ${primitive} ${width}px day details remain read-only and week selection restores native focus`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto(
        `${primitive === "base" ? "./base/" : "./"}#/template-preview/roster/time/timesheets`,
      );
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      const day = page.getByRole("button", { name: /^Amara Okafor, Monday 20 July:/ });
      await day.click();
      const sheet = page.getByRole("dialog", { name: "Amara Okafor", exact: true });
      await expect(sheet).toBeVisible();
      await expect(sheet.getByText("34h 30m", { exact: true })).toBeVisible();
      await expect(sheet.getByText("14h", { exact: true })).toBeVisible();
      await expect(sheet.getByText("20h 30m", { exact: true })).toBeVisible();
      await expect(sheet.getByText("5 of 7", { exact: true })).toBeVisible();
      await expect(sheet.locator('[data-slot="timeline-item"]')).toHaveCount(7);
      await expect(sheet.getByText("The cell you opened", { exact: true })).toHaveCount(1);
      await expect(sheet.locator("input, textarea, [contenteditable=true]")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
      await expect(day).toBeFocused();
      await page.getByRole("button", { name: "Next week", exact: true }).click();
      const week = page.getByRole("button", {
        name: "Choose timesheet week, 27 Jul–2 Aug",
        exact: true,
      });
      await expect(week).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^Amara Okafor, Monday 27 July:/ }),
      ).toHaveCount(1);
      await week.click();
      const calendar = page.locator('[data-slot="popover-content"].reui-reference');
      await expect(calendar).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(calendar).toHaveCount(0);
      await expect(week).toBeFocused();
      await week.click();
      await calendar.getByRole("button", { name: /Monday, July 20/ }).click();
      await expect(calendar).toHaveCount(0);
      const initial = page.getByRole("button", {
        name: "Choose timesheet week, 20–26 Jul",
        exact: true,
      });
      await expect(initial).toBeFocused();
      await day.click();
      await sheet.getByRole("button", { name: "Close timesheet detail", exact: true }).click();
      await expect(sheet).toHaveCount(0);
      await expect(day).toBeFocused();
    });

    test(`Roster ${primitive} ${width}px review decisions survive week and route changes and Preferences resets them`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto(
        `${primitive === "base" ? "./base/" : "./"}#/template-preview/roster/time/timesheets`,
      );
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      const row = page.locator(".ct-timesheets-grid tbody tr").filter({ hasText: "Amara Okafor" });
      const sendBack = row.getByRole("button", { name: "Send back: Amara Okafor", exact: true });
      const signOff = row.getByRole("button", { name: "Sign off: Amara Okafor", exact: true });
      await sendBack.click();
      const confirm = page.getByRole("dialog", { name: "Send this week back?", exact: true });
      await expect(
        confirm.getByText("Amara Okafor, 20–26 Jul. They will need to correct it and resubmit.", {
          exact: true,
        }),
      ).toBeVisible();
      await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(confirm).toHaveCount(0);
      await expect(sendBack).toBeFocused();
      await expect(row.getByText("Awaiting", { exact: true })).toBeVisible();
      await sendBack.click();
      await confirm.getByRole("button", { name: "Send back", exact: true }).click();
      await expect(confirm).toHaveCount(0);
      await expect(row.getByText("Sent back", { exact: true })).toBeVisible();
      await expect(sendBack).toBeDisabled();
      await expect(row.locator("[data-timesheet-day]").first()).toBeFocused();
      await signOff.click();
      await expect(row.getByText("Signed off", { exact: true })).toBeVisible();
      await expect(signOff).toBeDisabled();
      await page.getByRole("button", { name: "Sign off 20", exact: true }).click();
      await expect(page.getByRole("button", { name: "Sign off 0", exact: true })).toBeDisabled();
      await page.getByRole("button", { name: "Next week", exact: true }).click();
      await expect(page.getByRole("button", { name: "Sign off 21", exact: true })).toBeEnabled();
      await page.getByRole("button", { name: "Previous week", exact: true }).click();
      await expect(page.getByRole("button", { name: "Sign off 0", exact: true })).toBeDisabled();
      await navigate(page, "Time off");
      await expect(page.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
      await navigate(page, "Timesheets");
      await expect(page.getByRole("button", { name: "Sign off 0", exact: true })).toBeDisabled();
      await navigate(page, "Preferences");
      const clear = page.getByRole("button", { name: "Clear timesheet sign-offs", exact: true });
      await expect(clear).toBeEnabled();
      await clear.click();
      await expect(clear).toBeDisabled();
      await navigate(page, "Timesheets");
      await expect(page.getByRole("button", { name: "Sign off 21", exact: true })).toBeEnabled();
      await expect(row.getByText("Awaiting", { exact: true })).toBeVisible();
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    });
  }
}
