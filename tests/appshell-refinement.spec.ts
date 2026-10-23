import { test, expect } from "@playwright/test";
const route = (n: number) => `./#/preview/application/app-shell/app-shell-${n}`;
for (const width of [1280, 390])
  test(`all 36 AppShell routes render at ${width}px`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (let n = 1; n <= 36; n++)
      await test.step(`app-shell-${n}`, async () => {
        await page.goto(route(n));
        await expect(page.locator("[data-shell-variant]")).toHaveAttribute(
          "data-shell-variant",
          String(n),
        );
        await expect(page.locator("vite-error-overlay")).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width + 1,
        );
      });
    expect(errors).toEqual([]);
  });
test("nested navigation remains usable after collapse", async ({ page }) => {
  await page.goto(route(1));
  await page.getByRole("button", { name: "Infrastructure", exact: true }).click();
  await expect(page.getByRole("button", { name: "Databases", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await page.getByRole("button", { name: "Infrastructure", exact: true }).click();
  await page.getByRole("menuitem", { name: "Databases", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Databases");
});
test("search supports command K and enter, notifications can be marked read", async ({ page }) => {
  await page.goto(route(3));
  await expect(page.getByRole("button", { name: "Search workspace", exact: true })).toBeVisible();
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Search workspace routes" }).fill("Reports");
  await page.getByRole("combobox", { name: "Search workspace routes" }).press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Reports");
  await page.getByRole("button", { name: "Notifications", exact: true }).click();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByText("0", { exact: true })).toBeVisible();
});
test("calendar context opens, closes and adds events", async ({ page }) => {
  await page.goto(route(6));
  await page.getByRole("button", { name: "Close context panel" }).click();
  await expect(page.getByRole("button", { name: "New Event", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Open context panel" }).click();
  await page.getByRole("button", { name: "New Event", exact: true }).click();
  await page.getByLabel("Event title", { exact: true }).fill("Shell QA review");
  await page.getByRole("button", { name: "Create event", exact: true }).click();
  await expect(page.getByRole("button", { name: /Shell QA review/ })).toBeVisible();
});
test("inventory sections have independent secondary navigation", async ({ page }) => {
  await page.goto(route(8));
  await expect(page.getByRole("button", { name: "Product Catalog", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Orders section", exact: true }).click();
  await expect(page.getByRole("button", { name: "All Orders", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Product Catalog", exact: true })).toHaveCount(0);
});
test("workbench regions toggle and splitter changes panel height", async ({ page }) => {
  await page.goto(route(11));
  const separator = page.locator("[role=separator][aria-orientation=horizontal]").first();
  const before = (await separator.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2, before.y - 100, {
    steps: 8,
  });
  await page.mouse.up();
  expect((await separator.boundingBox())!.y).toBeLessThan(before.y - 40);
  await page.getByRole("button", { name: "Collapse details sidebar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Hide detail sidebar" })).toHaveCount(0);
  await page.getByRole("button", { name: "Collapse details sidebar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Hide detail sidebar" })).toBeVisible();
  await page.getByRole("button", { name: "Hide workbench sheet" }).click();
  await expect(page.getByRole("tab", { name: "Webhooks", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Hide workbench bottom sheet" }).click();
  await expect(page.getByRole("tab", { name: "Webhooks", exact: true })).toBeVisible();
});
test("model grid and header selection synchronize; task assistant closes and reopens", async ({
  page,
}) => {
  await page.goto(route(17));
  await page.getByRole("button", { name: "Gemini", exact: true }).click();
  await expect(page.getByRole("button", { name: "Choose model", exact: true })).toHaveText(
    "Gemini",
  );
  await page.getByRole("button", { name: "Choose model", exact: true }).click();
  await page.getByRole("menuitem", { name: "Claude", exact: true }).click();
  await expect(page.getByRole("button", { name: "Claude", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Draft an email", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Message Bricklane AI" })).toHaveValue(
    "Draft an email",
  );
  await page.goto(route(18));
  await page.getByRole("button", { name: "Close assistant" }).click();
  await expect(page.getByRole("textbox", { name: "Ask assistant" })).toHaveCount(0);
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Ask assistant" })).toBeVisible();
  await page.getByRole("button", { name: "New Task", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Review shell interactions");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Review shell interactions", { exact: true })).toBeVisible();
});
test("thread width resizes, thread pins and memory toggles", async ({ page }) => {
  await page.goto(route(21));
  const nav = page.getByRole("complementary", { name: "Navigation" });
  const before = (await nav.boundingBox())!.width;
  const split = page.getByRole("separator").first();
  const rect = (await split.boundingBox())!;
  await page.mouse.move(rect.x, rect.y + 120);
  await page.mouse.down();
  await page.mouse.move(rect.x + 100, rect.y + 120, { steps: 8 });
  await page.mouse.up();
  expect((await nav.boundingBox())!.width).toBeGreaterThan(before + 50);
  await page.getByRole("button", { name: "Thread actions for Stream chat responses" }).focus();
  await page.getByRole("button", { name: "Thread actions for Stream chat responses" }).click();
  await page.getByRole("menuitem", { name: "Pin to top" }).click();
  await expect(
    page.getByRole("button", { name: "Stream chat responses", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chat model" }).click();
  await page.getByRole("switch", { name: "Memory", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Memory", exact: true })).not.toBeChecked();
});
test("scope adds, keyboard reorder, workspace tabs and route search", async ({ page }) => {
  await page.goto(route(27));
  await page.getByRole("textbox", { name: "Search navigation" }).fill("not a route");
  await expect(page.getByText("No matching routes.")).toBeVisible();
  await page.getByRole("textbox", { name: "Search navigation" }).fill("");
  await page.getByRole("button", { name: "Add to Devices", exact: true }).click();
  await expect(page.getByText("Draft 1", { exact: true })).toBeVisible();
  const parent = page.locator('[role=tree][aria-label="Security scope tree"]');
  const before = await parent
    .locator('[data-scope-parent="Endpoints"]')
    .evaluateAll((rows) => rows.map((e) => e.getAttribute("data-scope-row")));
  await page.getByRole("button", { name: "Reorder Threats", exact: true }).press("Alt+ArrowUp");
  const after = await parent
    .locator('[data-scope-parent="Endpoints"]')
    .evaluateAll((rows) => rows.map((e) => e.getAttribute("data-scope-row")));
  expect(after[0]).toBe("Threats");
  expect(after).not.toEqual(before);
  await page.getByRole("tab", { name: "Assets", exact: true }).click();
  await expect(page.getByRole("region", { name: "Assets scope tree" })).toBeVisible();
  await page.goto(route(29));
  await page.getByRole("tab", { name: "Team", exact: true }).click();
  await expect(page.getByRole("button", { name: "Members", exact: true })).toBeVisible();
});
test("mission search changes assignments, board delete requires confirmation and supports undo", async ({
  page,
}) => {
  await page.goto(route(25));
  await page.getByRole("textbox", { name: "Search robots" }).fill("Dock");
  await expect(page.getByRole("button", { name: /Dock C112/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Meow S025/ })).toHaveCount(0);
  await page.goto(route(35));
  await page.getByRole("button", { name: "Board menu" }).click();
  await page.getByRole("menuitem", { name: "Delete Board", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("Board deleted", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Board menu" }).click();
  await page.getByRole("menuitem", { name: "Delete Board", exact: true }).click();
  await page.getByRole("button", { name: "Delete Board", exact: true }).click();
  await expect(page.getByText("Board deleted", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).first().click();
  await expect(page.getByLabel("Workspace content placeholders")).toBeVisible();
});
test("phone navigation is a dismissible sheet and exposes real submenus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route(1));
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Navigation", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Infrastructure", exact: true }).click();
  await page.getByRole("button", { name: "Databases", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Databases");
});

test("scope counts update and edits survive switching tabs; drag moves a scope", async ({
  page,
}) => {
  await page.goto(route(32));
  await page.getByRole("button", { name: "Add to Devices", exact: true }).click();
  await expect(page.getByText("249 Endpoints", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Assets", exact: true }).click();
  await page.getByRole("tab", { name: "Security", exact: true }).click();
  await expect(page.getByText("Draft 1", { exact: true })).toBeVisible();
  const handle = page.getByRole("button", {
    name: "Reorder Risks",
    exact: true,
  });
  const target = page.locator('[data-scope-row="Policies"]').first();
  await handle.dragTo(target);
  const rows = await page
    .locator('[role=tree][aria-label="Security scope tree"] [data-scope-parent="Endpoints"]')
    .evaluateAll((elements) => elements.map((e) => e.getAttribute("data-scope-row")));
  expect(rows.indexOf("Risks")).toBeGreaterThan(rows.indexOf("Policies"));
});
test("mail folders do not repeat inbox messages and phone message selection can return to the list", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route(4));
  await expect(
    page.getByText("Design review · component library v2.0", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sent", exact: true }).click();
  await expect(page.getByText("No messages match your search.")).toBeVisible();
  await page.getByRole("button", { name: "Inbox", exact: true }).click();
  await page.getByRole("button", { name: /Sarah Chen.*Design review/ }).click();
  await expect(page.getByRole("button", { name: "Show message list", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show message list", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Search mail", exact: true })).toBeVisible();
});

test("AppShell download includes the ReUI Sidebar foundation, layout and original cover", async ({
  page,
}) => {
  await page.goto("/#/block/application/app-shell/app-shell-22");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("app-shell-22.zip");
  const { readFile } = await import("node:fs/promises");
  const { unzipSync, strFromU8 } = await import("fflate");
  const files = unzipSync(await readFile((await download.path())!));
  expect(strFromU8(files["src/blocks/application/shells/audited.tsx"])).toContain("case 36");
  expect(strFromU8(files["src/blocks/application/shells/shells.css"])).toContain(
    ".shell-reference",
  );
  expect(files["src/blocks/application/shells/assets/fleet-living-room.png"]).toBeTruthy();
  expect(files["src/components/reui/sidebar.tsx"]).toBeTruthy();
  expect(files["src/components/reui/layout.tsx"]).toBeTruthy();
  expect(files["src/components/ui/sidebar.tsx"]).toBeTruthy();
  expect(files["src/hooks/use-mobile.ts"]).toBeTruthy();
  expect(Object.keys(files).some((name) => name.includes("fleet-scenes"))).toBe(false);
  expect(strFromU8(files["src/blocks/application/shells/fleet-hero.tsx"])).toContain(
    "function FleetHeroShell",
  );
});

test("security console scope icons switch trees and enforce the seven scope limit", async ({
  page,
}) => {
  await page.goto(route(26));
  await expect(page.getByRole("tab", { name: "Endpoints", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add to Managed Devices", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("treeitem", { name: "Repositories", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add to Managed Devices", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Manage scopes" }).click();
  await page.getByRole("menuitem", { name: "Add scope", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Scope 7", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Manage scopes" }).click();
  await expect(page.getByRole("menuitem", { name: "Add scope", exact: true })).toBeDisabled();
  await expect(page.getByRole("menuitem", { name: "Duplicate scope", exact: true })).toBeDisabled();
});
