import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { expect, test, type Page } from "@playwright/test";

const families = [
  { id: "flowly", width: 63, collapsedWidth: 63, entry: "Dashboard" },
  { id: "flux", width: 256, collapsedWidth: 64, entry: "Overview" },
  { id: "lucent", width: 256, collapsedWidth: 48, entry: "Overview" },
  { id: "tempo", width: 250, collapsedWidth: 48, entry: "Home" },
  { id: "mesh", width: 49, collapsedWidth: 49, entry: "Home" },
];

async function openTemplate(page: Page, id: string) {
  await page.goto(`/#/template-preview/${id}`, { waitUntil: "networkidle" });
  await expect(page.locator(".wf-native-layout")).toBeVisible();
  await expect(page.locator(".wf-header")).toBeVisible();
}

for (const family of families) {
  test(`${family.id}: real Sidebar slots resize the Inset and keyboard restores it`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openTemplate(page, family.id);
    const sidebar = page.locator('.wf-native-layout > [data-slot="sidebar"]');
    const inset = page.locator('.wf-native-layout > [data-slot="sidebar-inset"]');
    await expect(sidebar.locator('[data-slot="sidebar-header"]')).toHaveCount(1);
    await expect(sidebar.locator('[data-slot="sidebar-content"]')).toHaveCount(1);
    await expect(sidebar.locator('[data-slot="sidebar-footer"]')).toHaveCount(1);
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(family.width);
    const before = await inset.boundingBox();
    expect(before?.x).toBe(family.width);

    if (family.id === "flowly" || family.id === "mesh") {
      await page.keyboard.press("Control+b");
      await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(family.width);
      await expect(page.getByRole("button", { name: "Collapse sidebar", exact: true })).toHaveCount(
        0,
      );
    } else {
      await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
      await expect
        .poll(async () => (await sidebar.boundingBox())?.width)
        .toBe(family.collapsedWidth);
      await expect.poll(async () => (await inset.boundingBox())?.x).toBe(family.collapsedWidth);
      await page.keyboard.press("Control+b");
      await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(family.width);
      await expect(
        page.getByRole("button", { name: family.entry, exact: true }).first(),
      ).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  });

  test(`${family.id}: phone uses one Sidebar Sheet and Escape restores the real Trigger`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await openTemplate(page, family.id);
    const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
    await trigger.click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toHaveCount(1);
    await expect
      .poll(async () => (await drawer.boundingBox())?.width)
      .toBe(family.id === "flowly" || family.id === "mesh" ? 49 : 292.5);
    await expect(drawer.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);
    await expect(drawer.locator('[data-slot="sidebar-content"]')).toBeVisible();
    if (family.id === "mesh") {
      await expect
        .poll(
          async () => (await drawer.locator('[data-slot="sidebar-header"]').boundingBox())?.height,
        )
        .toBe(48);
    }
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await drawer.getByRole("button", { name: family.entry, exact: true }).click();
    if (family.id === "flux") {
      await expect(drawer).toBeVisible();
      await page.keyboard.press("Escape");
    }
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}

test("Flowly phone Invite remains visible and returns focus after cancelling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTemplate(page, "flowly");
  const invite = page.getByRole("button", { name: "Invite", exact: true });
  await expect(invite.locator("svg")).toBeVisible();
  await invite.click();
  const dialog = page.getByRole("dialog", { name: "Invite teammate" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(invite).toBeFocused();
});

test("Mesh phone project header preserves visible actions without document overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTemplate(page, "mesh");
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const name of ["Ask AI", "Share", "New task"]) {
    const button = page.locator(".wf-header").getByRole("button", { name, exact: true });
    await expect(button).toBeVisible();
    await expect(button.locator("svg")).toBeVisible();
    expect((await button.boundingBox())?.width).toBe(28);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "New task", exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Task title", { exact: true })).toBeVisible();
});

for (const primitive of ["radix", "base"] as const) {
  test(`${primitive} Mesh Projects fills the desktop and keeps narrow scrolling on the board`, async ({
    page,
  }) => {
    const prefix = primitive === "base" ? "./base/" : "./";
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto(`${prefix}#/template-preview/mesh`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await page.getByRole("button", { name: "Projects", exact: true }).click();

    const board = page.getByRole("region", { name: "Q4 Launch Board", exact: true });
    const columns = board.locator('[data-slot="kanban-column"]');
    await expect(columns).toHaveCount(5);
    const desktop = await board.evaluate((element) => ({
      right: element.getBoundingClientRect().right,
      width: element.clientWidth,
      columns: Array.from(element.children, (column) => ({
        width: column.getBoundingClientRect().width,
        right: column.getBoundingClientRect().right,
      })),
    }));
    expect(desktop.columns.every(({ width }) => width > 280)).toBe(true);
    expect(
      desktop.columns.every(({ width }) => Math.abs(width - desktop.columns[0].width) < 1),
    ).toBe(true);
    expect(Math.abs(desktop.right - desktop.columns[4].right)).toBeLessThan(1);
    expect(desktop.width).toBeGreaterThan(1800);

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() => columns.first().evaluate((column) => column.getBoundingClientRect().width))
        .toBe(280);
      await expect
        .poll(() => board.evaluate((element) => element.scrollWidth > element.clientWidth))
        .toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
    await columns.first().hover();
    await page.mouse.wheel(1800, 0);
    await expect.poll(() => board.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    const lastColumn = columns.last();
    await expect(lastColumn).toBeInViewport();
    await lastColumn.locator(".wf-board-card").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test(`${primitive} Mesh Projects drags full previews without scaling cards or lanes`, async ({
    page,
  }) => {
    const prefix = primitive === "base" ? "./base/" : "./";
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto(`${prefix}#/template-preview/mesh`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await page.getByRole("button", { name: "Projects", exact: true }).click();

    const board = page.getByRole("region", { name: "Q4 Launch Board", exact: true });
    const columns = board.locator('[data-slot="kanban-column"]');
    const todo = board.locator('[data-value="To Do"]');
    const progress = board.locator('[data-value="In Progress"]');
    const handle = todo.getByRole("button", { name: "Move To Do column", exact: true });
    const before = (await progress.boundingBox())!;
    const beforeColor = await progress
      .locator(".wf-board-column")
      .evaluate((panel) => getComputedStyle(panel).backgroundColor);
    const origin = (await handle.boundingBox())!;
    await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x + before.width * 0.7, origin.y + origin.height / 2, {
      steps: 18,
    });

    const lanePreview = page.locator('[data-drag-preview="column"]');
    await expect(lanePreview).toBeVisible();
    await expect(lanePreview).toHaveAttribute("inert", "");
    await expect(lanePreview).toContainText("2. To Do");
    await expect(lanePreview.locator(".wf-board-card")).toHaveCount(3);
    await expect(lanePreview).toContainText("Plan a beta diary study with 20 drivers");
    await expect.poll(async () => (await progress.boundingBox())!.x).toBeLessThan(before.x);
    const scales = await columns.evaluateAll((lanes) =>
      lanes.map((lane) => {
        const { a, d } = new DOMMatrix(getComputedStyle(lane).transform);
        return [a, d];
      }),
    );
    expect(scales).toEqual(Array.from({ length: 5 }, () => [1, 1]));
    await page.mouse.up();
    await expect(lanePreview).toHaveCount(0);
    await expect(columns.nth(1)).toHaveAttribute("data-value", "In Progress");
    await expect(progress.locator(".wf-board-column")).toHaveCSS("background-color", beforeColor);

    const taskName = "Test offline maps on older driver phones";
    const task = todo.locator(".wf-board-card").filter({ hasText: taskName });
    const target = progress.locator(".wf-board-card").first();
    const taskBox = (await task.boundingBox())!;
    const targetBox = (await target.boundingBox())!;
    await page.mouse.move(taskBox.x + 28, taskBox.y + 38);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + 28, targetBox.y + 38, { steps: 18 });
    const taskPreview = page.locator('[data-drag-preview="item"]');
    await expect(taskPreview).toContainText(taskName);
    await expect(taskPreview).toHaveAttribute("inert", "");
    expect(Math.abs((await taskPreview.boundingBox())!.width - taskBox.width)).toBeLessThan(1);
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect(taskPreview).toHaveCount(0);
    await expect(task).toHaveCount(1);

    await handle.focus();
    await handle.press("Space");
    await expect(lanePreview).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(lanePreview).toHaveCount(0);
    await expect(handle).toBeFocused();
  });
}

test("Flux phone keeps a navigation group open, closes only after selecting a route", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTemplate(page, "flux");
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("button", { name: "Providers", exact: true }).click();
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Connections", exact: true }).first().click();
  await expect(drawer).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Provider Connections", exact: true }),
  ).toBeVisible();
});

test("Lucent keeps the account visible while the document scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openTemplate(page, "lucent");
  const account = page.getByRole("button", { name: "Open user menu", exact: true });
  const initial = await account.boundingBox();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200);
  const scrolled = await account.boundingBox();
  expect(scrolled?.y).toBeCloseTo(initial?.y ?? -1, 0);
  await expect(account).toBeInViewport();
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeInViewport();
});

test("Flowly scrolls its Inset content without scrolling the navigation rail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openTemplate(page, "flowly");
  const content = page.locator(".wf-main > .wf-content");
  await content.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(
    page.getByRole("button", { name: "Dashboard", exact: true }).first(),
  ).toBeInViewport();
});

test("Flux collapsed search uses the real command palette and keyboard navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openTemplate(page, "flux");
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search", exact: true });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("combobox", { name: "Search workspace routes", exact: true })
    .fill("Memory");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Memory Manager", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search workspace", exact: true })).toBeFocused();
});

test("Lucent header palette can reach a nested Infrastructure route", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openTemplate(page, "lucent");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search", exact: true });
  await dialog
    .getByRole("combobox", { name: "Search workspace routes", exact: true })
    .fill("Clusters");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".wf-header")).toContainText("Clusters");
  await expect(page.getByRole("button", { name: "Infrastructure", exact: true })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

test("Workflow source view, Copy and actual project download contain the native Sidebar", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/templates/flux", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "View template source", exact: true }).click();
  const module = "src/templates/workflow/workflow-shell.tsx";
  const expected = await readFile(join(process.cwd(), module), "utf8");
  await page.getByRole("combobox", { name: "Template source file", exact: true }).click();
  await page.getByRole("option", { name: module, exact: true }).click();
  expect(await page.locator(".template-source-code").textContent()).toBe(expected);
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download project", exact: true }).click();
  const download = await pending;
  const zip = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const path of [
    module,
    "src/templates/workflow/shared.tsx",
    "src/templates/workflow/workflow-layout.css",
    "src/components/reui/sidebar.tsx",
    "src/components/reui/layout.tsx",
    "src/components/ui/sidebar.tsx",
    "src/blocks/application/shells/chrome.tsx",
    "src/blocks/application/shells/shells.css",
    "src/blocks/application/shells/assets/ATTRIBUTION.md",
  ]) {
    expect(strFromU8(zip[path])).toBe(await readFile(join(process.cwd(), path), "utf8"));
  }
  expect(zip["src/components/reui/REUI-LICENSE.txt"]).toBeTruthy();
  expect(zip["src/blocks/assets/Inter-LICENSE.txt"]).toBeTruthy();
  await download.saveAs(testInfo.outputPath("flux-native-sidebar.zip"));
});

for (const family of families) {
  test(`${family.id}: phone Sidebar respects live body fonts and Reset`, async ({
    page,
    context,
  }) => {
    await page.goto("/#/block/application/app-shell/app-shell-1", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Customize", exact: true }).click();
    const target = await context.newPage();
    await target.setViewportSize({ width: 390, height: 844 });
    await openTemplate(target, family.id);
    const trigger = target.getByRole("button", { name: "Open navigation", exact: true });
    await trigger.click();
    const drawer = target.getByRole("dialog");
    const row = drawer.getByRole("button", { name: family.entry, exact: true });
    await expect(row).toHaveCSS("font-family", /^Inter,/);
    await expect(row).toHaveCSS("font-size", "14px");
    const choose = async (font: string) => {
      await page.getByRole("combobox", { name: "Body font", exact: true }).click();
      await page.getByRole("option", { name: font, exact: true }).click();
    };
    await choose("Serif");
    await expect(row).toHaveCSS("font-family", "Georgia, serif");
    if (family.id === "flux") {
      await drawer.getByRole("button", { name: "Search workspace", exact: true }).click();
      const search = target.getByRole("dialog", { name: "Search", exact: true });
      const input = search.getByRole("combobox", { name: "Search workspace routes", exact: true });
      await input.fill("Memory");
      await expect(input).toHaveCSS("font-family", "Georgia, serif");
      await choose("Mono");
      await expect(input).toHaveCSS("font-family", "ui-monospace, monospace");
      await expect(input).toHaveValue("Memory");
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(input).toHaveCSS("font-family", /^Inter,/);
      await expect(input).toHaveValue("Memory");
      await target.keyboard.press("Escape");
      await expect(search).toHaveCount(0);
      await expect(drawer).toBeVisible();
    } else {
      await choose("Mono");
      await expect(row).toHaveCSS("font-family", "ui-monospace, monospace");
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(row).toHaveCSS("font-family", /^Inter,/);
    }
    await target.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await target.close();
  });
}

test("Lucent phone header opens the actual command palette", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTemplate(page, "lucent");
  await page.getByRole("button", { name: "Search or jump to…", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Search", exact: true });
  await dialog
    .getByRole("combobox", { name: "Search workspace routes", exact: true })
    .fill("Registry");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".wf-header")).toContainText("Registry");
});

for (const route of [
  { id: "flux", group: "Providers", child: "Connections" },
  { id: "lucent", group: "Infrastructure", child: "Clusters" },
]) {
  test(`${route.id}: collapsed nested navigation keeps the reference menu width and keyboard focus`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openTemplate(page, route.id);
    await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
    const trigger = page.getByRole("button", { name: route.group, exact: true });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect.poll(async () => (await menu.boundingBox())?.width).toBe(192);
    await expect(menu.getByRole("menuitem").first()).toHaveCSS("font-family", /^Inter,/);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await menu.getByRole("menuitem", { name: route.child, exact: true }).click();
    await expect(menu).toHaveCount(0);
    await expect(page.locator(".wf-header")).toContainText(route.child);
  });
}
