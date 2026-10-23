import { test, expect } from "@playwright/test";
const route = (n: number) =>
  process.env.APPSHELL_DIRECT
    ? `/?variant=${n}`
    : `/#/preview/application/app-shell/app-shell-${n}`;
test("Fleet Center uses a disclosure search, distinct view tiles and keyboard tree navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route(33));
  await expect(page.getByRole("textbox", { name: "Search scopes" })).toHaveCount(0);
  await page.getByRole("button", { name: "Search scopes", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Search scopes" });
  await expect(input).toBeFocused();
  await input.fill("Policies");
  await expect(
    page.locator('[data-scope-row="Policies"][data-scope-parent="Fleet"]'),
  ).toContainText("8");
  await expect(page.getByRole("treeitem", { name: "Robots", exact: true })).toHaveCount(0);
  await input.press("Escape");
  await expect(input).toHaveCount(0);
  await expect(page.getByRole("treeitem", { name: "Robots", exact: true })).toBeVisible();
  const depots = page.getByRole("treeitem", { name: "Depots", exact: true });
  await depots.focus();
  await depots.press("ArrowLeft");
  await expect(
    page.getByRole("treeitem", { name: "Suspicious Activity", exact: true }),
  ).toHaveCount(0);
  await depots.press("ArrowRight");
  await expect(
    page.getByRole("treeitem", { name: "Suspicious Activity", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pin a view", exact: true }).click();
  await page.getByRole("menuitem", { name: "Charging", exact: true }).click();
  await expect(page.getByRole("button", { name: "Charging", exact: true })).toHaveAttribute(
    "data-slot",
    "icon-tile",
  );
  await page.getByRole("button", { name: "Quick Add", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "New Robot", exact: true })).toBeVisible();
});
test("invoice queue preserves its orders between tabs and filters, and uses the reference upload action", async ({
  page,
}) => {
  await page.goto(route(34));
  await expect(page.getByText("31 orders", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Completed Matches", exact: true }).click();
  await expect(page.getByText("31 orders", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Filter orders", exact: true }).click();
  await page.getByRole("menuitem", { name: "Ready", exact: true }).click();
  await expect(page.getByRole("treeitem", { name: "PO-2026-10001", exact: true })).toBeVisible();
  await expect(page.getByRole("treeitem", { name: "PO-2026-10021", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Filter orders", exact: true }).click();
  await page.getByRole("menuitem", { name: "All Orders", exact: true }).click();
  await expect(page.getByRole("treeitem", { name: "PO-2026-10021", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search orders", exact: true }).fill("10001");
  await expect(page.getByText("1 orders", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search orders", exact: true }).fill("");
  await page.getByRole("button", { name: "Upload New", exact: true }).click();
  await expect(page.getByText("Upload started", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  await expect(page.getByText("3WIM Advisor", { exact: true })).toBeVisible();
  await expect(page.getByText(/Morning, Mira/)).toHaveCount(0);
  await expect(page.getByText(/Two checks failed on PO-2026-10021/)).toBeVisible();
});
test("mobile assistants contain focus, close with Escape and restore the trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const n of [18, 34]) {
    await page.goto(route(n));
    if (n === 18) {
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
    }
    const trigger = page.getByRole("button", {
      name: n === 18 ? "Assistant" : "Ask AI",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      391,
    );
  }
});
test("mobile order queue is a dismissible dialog and retains its search", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route(34));
  await page.getByRole("button", { name: "Open order queue", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Search orders", exact: true }).fill("10090");
  await expect(dialog.getByRole("treeitem", { name: "PO-2026-10090", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("chat sidebar groups, search and memory preserve the reference interaction model", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route(21));
  const pinnedGroup = page.getByRole("button", { name: /^Pinned/ });
  await pinnedGroup.click();
  await expect(
    page.getByRole("button", { name: "Q3 release notes draft", exact: true }),
  ).toHaveCount(0);
  await pinnedGroup.click();
  await expect(
    page.getByRole("button", { name: "Q3 release notes draft", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pin Stream chat responses", exact: true }).focus();
  await page.getByRole("button", { name: "Pin Stream chat responses", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Unpin Stream chat responses",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Thread actions for Stream chat responses",
      exact: true,
    })
    .click();
  await page.getByRole("menuitem", { name: "Archive", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Stream chat responses", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chat memory", exact: true }).click();
  await page.getByRole("button", { name: "Chat model", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Memory", exact: true })).not.toBeChecked();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+k");
  await page
    .getByRole("combobox", { name: "Search workspace routes", exact: true })
    .fill("Q3 release");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Q3 release notes draft", exact: true }),
  ).toBeVisible();
});
test("glass workspace uses keyboard tabs and keeps its account menu open when choosing a theme", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route(31));
  const operations = page.getByRole("tab", { name: "Operations", exact: true });
  await operations.focus();
  await operations.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Structure", exact: true })).toHaveAttribute(
    "data-state",
    "active",
  );
  await page.getByRole("button", { name: "Routes", exact: true }).click();
  await expect(page.getByRole("button", { name: "Routes", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Operator menu", exact: true }).click();
  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("radio", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open sections", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Robots", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Robots", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Robots", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
