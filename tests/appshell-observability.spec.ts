import { test, expect } from "@playwright/test";
const route = "/#/preview/application/app-shell/app-shell-36";

test("observability tree keeps branches separate from pages and preserves breadcrumb ancestry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);
  const explorer = page.getByRole("treeitem", {
    name: "Explorer",
    exact: true,
  });
  await explorer.click();
  await expect(page.getByRole("treeitem", { name: "Logs", exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveText("WorkspaceHome");
  await explorer.focus();
  await explorer.press("ArrowRight");
  await expect(page.getByRole("treeitem", { name: "Logs", exact: true })).toBeVisible();
  await page.getByRole("treeitem", { name: "Logs", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveText(
    "InvestigateExplorerLogs",
  );
  await page.getByRole("treeitem", { name: "Endpoints", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveText("ObserveEndpoints");
  const sidebar = await page
    .getByRole("complementary", { name: "Observability navigation" })
    .boundingBox();
  expect(sidebar?.width).toBe(240);
  const cards = page.locator(".workspace-skeleton-card");
  await expect(cards).toHaveCount(8);
  expect((await cards.nth(0).boundingBox())?.height).toBe(130);
  expect((await cards.nth(4).boundingBox())?.height).toBe(294);
});

test("navigation filter, empty state and collapsed keyboard shortcut work without stealing focus", async ({
  page,
}) => {
  await page.goto(route);
  const search = page.getByRole("textbox", { name: "Search navigation" });
  await expect(search).toBeVisible();
  await page.keyboard.press("Control+f");
  await expect(search).toBeFocused();
  await search.fill("log");
  await expect(page.getByRole("treeitem", { name: "Logs", exact: true })).toBeVisible();
  await expect(page.getByRole("treeitem", { name: "Hosts", exact: true })).toHaveCount(0);
  await search.fill("unmatched-page");
  await expect(page.getByText("No Matches", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Try another page name or clear the search.", {
      exact: true,
    }),
  ).toBeVisible();
  await search.fill("");
  await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
  await expect(search).toHaveCount(0);
  await page.keyboard.press("Control+f");
  await expect(page.getByRole("textbox", { name: "Search navigation" })).toBeFocused();
});

test("workspace switching and pin Undo retain the original row position", async ({ page }) => {
  await page.goto(route);
  await page.getByRole("button", { name: /Switch workspace, current Nimbus Core/ }).click();
  await page
    .getByRole("menuitem", {
      name: "Nimbus Labs Sandbox · EU West",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: /Switch workspace, current Nimbus Labs/ }),
  ).toContainText("Sandbox · EU West");
  await page.getByRole("button", { name: "Unpin Cache Hit Ratio", exact: true }).focus();
  await page.getByRole("button", { name: "Unpin Cache Hit Ratio", exact: true }).click();
  await expect(
    page.locator(".observe-pin-row").getByRole("button", { name: "Cache Hit Ratio", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".observe-pin-row>button:first-child")).toHaveText([
    "Checkout Latency",
    "Cache Hit Ratio",
    "Queue Backlog",
    "Billing Workers",
  ]);
  await page.getByRole("treeitem", { name: "Logs", exact: true }).click();
  await page.getByRole("button", { name: "Pin", exact: true }).click();
  await expect(page.locator(".observe-pin-row>button:first-child").last()).toHaveText("Logs");
  await expect(page.getByRole("button", { name: "Pin", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("mobile observability navigation traps focus, retains search and exposes theme choices", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const trigger = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const search = dialog.getByRole("textbox", { name: "Search navigation" });
  await search.fill("logs");
  await dialog.getByRole("treeitem", { name: "Logs", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog.getByRole("textbox", { name: "Search navigation" })).toHaveValue("logs");
  await dialog.getByRole("button", { name: "Open account menu for Shadcn", exact: true }).click();
  await page.getByRole("menuitem", { name: "Theme", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("copy link announces a completed clipboard write and reports rejected writes", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copiedLink: string }).copiedLink = text;
        },
      },
    }),
  );
  await page.goto(route);
  const copy = page.getByRole("button", { name: "Copy Link", exact: true });
  await copy.click();
  await expect(copy.locator('[aria-live="polite"]')).toHaveText("Link copied");
  expect(await page.evaluate(() => (window as unknown as { copiedLink: string }).copiedLink)).toBe(
    page.url(),
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: async () => {
        throw new Error("clipboard blocked");
      },
    }),
  );
  await copy.click();
  await expect(page.getByText("Copy failed", { exact: true })).toBeVisible();
  await expect(
    page.getByText("The browser blocked clipboard access.", { exact: true }),
  ).toBeVisible();
});
