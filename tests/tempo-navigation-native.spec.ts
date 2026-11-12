import { expect, test, type Locator, type Page } from "@playwright/test";

async function settled(root: Locator) {
  await expect
    .poll(() =>
      root.evaluate((element) => {
        const css = getComputedStyle(element);
        return {
          opacity: css.opacity,
          identity: css.transform === "none" || css.transform === "matrix(1, 0, 0, 1, 0, 0)",
          animations: element
            .getAnimations()
            .filter((animation) => animation.playState === "running" || animation.pending).length,
        };
      }),
    )
    .toEqual({ opacity: "1", identity: true, animations: 0 });
}

async function openNavigation(page: Page, width: number) {
  const sidebar =
    width === 390
      ? page.locator('[data-slot="sidebar"][data-mobile="true"]')
      : page.locator('.wf-root.wf-reui > [data-slot="sidebar"]');
  if (width === 390 && !(await sidebar.isVisible())) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  }
  await settled(sidebar);
  return sidebar;
}

async function selectNavigation(page: Page, width: number, name: string, keyboard = false) {
  const sidebar = await openNavigation(page, width);
  const button = sidebar.getByRole("button", { name, exact: true });
  if (keyboard) {
    await button.focus();
    await button.press("Space");
  } else {
    await button.click();
  }
  if (width === 390) {
    await expect(sidebar).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
  }
}

for (const foundation of ["Radix", "Base"]) {
  for (const width of [1440, 390]) {
    test(`Tempo navigation ${foundation} ${width}: native task scopes, saved filters and creation remain visible`, async ({
      page,
    }, info) => {
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) faults.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`${foundation === "Base" ? "/base/" : "/"}#/template-preview/tempo`);
      await expect(page).toHaveTitle(/Bricklane/);
      await expect(page.locator(".tempo-header")).toContainText("Home");
      await expect(page.getByText("Performance Overview", { exact: true })).toBeVisible();
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);

      const queue = page.locator(".wf-tempo-queue");
      const taskRows = queue.getByRole("row").filter({ hasText: /TASK-\d+/ });
      await selectNavigation(page, width, "Tasks");
      await expect(taskRows).toHaveCount(6);
      let sidebar = await openNavigation(page, width);
      await expect(
        sidebar.getByRole("button", { name: "Team tasks", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await selectNavigation(page, width, "My tasks", true);
      await expect(taskRows).toHaveCount(1);
      await expect(taskRows).toContainText("Alex Johnson");
      sidebar = await openNavigation(page, width);
      await expect(sidebar.getByRole("button", { name: "My tasks", exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(sidebar.locator(".tempo-task-navigation")).toHaveAttribute(
        "data-slot",
        "sidebar-group",
      );
      await expect(
        sidebar.locator('.tempo-task-navigation [data-slot="sidebar-menu"]'),
      ).toHaveCount(1);
      await selectNavigation(page, width, "Team tasks");
      await expect(taskRows).toHaveCount(6);

      await page.getByRole("textbox", { name: "Search tasks", exact: true }).fill("Fix");
      await queue.getByRole("button", { name: "Exceptions", exact: true }).click();
      await expect(taskRows).toHaveCount(1);
      await expect(taskRows).toContainText("Sana Qureshi");
      await selectNavigation(page, width, "Assigned to me", true);
      await expect(page.getByRole("textbox", { name: "Search tasks", exact: true })).toHaveValue(
        "",
      );
      await expect(taskRows).toHaveCount(1);
      await expect(taskRows).toContainText("Alex Johnson");
      sidebar = await openNavigation(page, width);
      await expect(sidebar.getByRole("button", { name: "Tasks", exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(
        sidebar.getByRole("button", { name: "Assigned to me", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await expect(sidebar.locator('.tempo-task-navigation [aria-current="page"]')).toHaveCount(0);
      await expect(
        sidebar.locator('.tempo-saved-views [data-slot="sidebar-menu-badge"]'),
      ).toHaveText(["12", "24", "8", "4"]);
      await page.screenshot({ path: info.outputPath(`tempo-assigned-${width}.png`) });
      if (width === 390) {
        await page.keyboard.press("Escape");
        await expect(sidebar).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Open navigation", exact: true }),
        ).toBeFocused();
      }

      await queue.getByRole("button", { name: "New task", exact: true }).click();
      const form = page.getByRole("dialog");
      await form
        .getByRole("textbox", { name: "Deliverable name", exact: true })
        .fill("Visible team handoff");
      await form.getByRole("textbox", { name: "Assignee", exact: true }).fill("Sana Qureshi");
      await form.getByRole("button", { name: "Create task", exact: true }).click();
      await expect(form).toHaveCount(0);
      await expect(taskRows).toHaveCount(6);
      await expect(taskRows.first()).toContainText("Visible team handoff");
      await expect(taskRows.first()).toContainText("TASK-2054");
      await expect(queue).toContainText("7 of 7 tasks");
      sidebar = await openNavigation(page, width);
      await expect(
        sidebar.getByRole("button", { name: "Team tasks", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await expect(sidebar.locator('.tempo-saved-views [aria-current="page"]')).toHaveCount(0);
      await selectNavigation(page, width, "Assigned to me");
      await expect(taskRows).toHaveCount(1);
      await expect(taskRows).not.toContainText("Visible team handoff");
      await selectNavigation(page, width, "Home");
      await expect(page.getByText("Performance Overview", { exact: true })).toBeVisible();
      sidebar = await openNavigation(page, width);
      await expect(sidebar.locator('.tempo-saved-views [aria-current="page"]')).toHaveCount(0);
      await selectNavigation(page, width, "Active sprint");
      await expect(page.locator('[data-slot="kanban-column"]')).toHaveCount(5);
      await expect(page.locator('[data-slot="kanban-item"]')).toHaveCount(24);
      sidebar = await openNavigation(page, width);
      await expect(
        sidebar.getByRole("button", { name: "Active sprint", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await selectNavigation(page, width, "Week ahead");
      await expect(page.locator('[data-slot="event-calendar"]')).toBeVisible();
      sidebar = await openNavigation(page, width);
      await expect(
        sidebar.getByRole("button", { name: "Week ahead", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await page.screenshot({ path: info.outputPath(`tempo-calendar-${width}.png`) });
      await selectNavigation(page, width, "Board");
      await expect(page.locator('[data-slot="kanban-item"]')).toHaveCount(24);
      sidebar = await openNavigation(page, width);
      await expect(sidebar.getByRole("button", { name: "Board", exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(sidebar.locator('.tempo-saved-views [aria-current="page"]')).toHaveCount(0);
      await selectNavigation(page, width, "Calendar");
      await expect(page.locator('[data-slot="event-calendar"]')).toBeVisible();
      sidebar = await openNavigation(page, width);
      await expect(sidebar.getByRole("button", { name: "Calendar", exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(sidebar.locator('.tempo-saved-views [aria-current="page"]')).toHaveCount(0);
      if (width === 390) {
        await page.keyboard.press("Escape");
        await expect(sidebar).toHaveCount(0);
        await page.screenshot({ path: info.outputPath("tempo-calendar-phone-content.png") });
      }
      await selectNavigation(page, width, "Recent activity");
      await expect(page.getByRole("heading", { name: "Tasks – List", exact: true })).toBeVisible();
      await expect(queue).toContainText("7 of 7 tasks");
      sidebar = await openNavigation(page, width);
      await expect(
        sidebar.getByRole("button", { name: "Recent activity", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await selectNavigation(page, width, "Reports");
      await expect(page.locator(".tempo-header")).toContainText("Reports");
      sidebar = await openNavigation(page, width);
      await expect(sidebar.locator('.tempo-saved-views [aria-current="page"]')).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      expect(faults).toEqual([]);
    });
  }
}
