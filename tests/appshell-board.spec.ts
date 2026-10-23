import { test, expect } from "@playwright/test";
const route = "/#/preview/application/app-shell/app-shell-35";

test("board actions reproduce demo notifications and preserve the visible board", async ({
  page,
}) => {
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByText("Your team got the invite link.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect(page.getByText("The image lands in your downloads.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Board menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Duplicate", exact: true }).click();
  await expect(page.getByText("Launch Map copy is in Boards.", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveText("BoardsLaunch Map");
  await page.getByRole("button", { name: "Board menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete Board", exact: true }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("Launch Map and its history leave the workspace.");
  await confirm.getByRole("button", { name: "Delete Board", exact: true }).click();
  await expect(page.getByText("Launch Map left the workspace.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Workspace content placeholders")).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByText("Launch Map is back in Boards.", { exact: true })).toBeVisible();
  expect(downloads).toEqual([]);
});

test("desktop board tabs support arrows and keep the reference card grid", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);
  const board = page.getByRole("tab", { name: "Board", exact: true });
  await board.focus();
  await board.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Outline", exact: true })).toHaveAttribute(
    "data-state",
    "active",
  );
  const rail = await page.getByRole("complementary", { name: "Board navigation" }).boundingBox();
  expect(rail?.width).toBe(49);
  const cards = page.locator(".workspace-skeleton-card");
  await expect(cards).toHaveCount(8);
  expect((await cards.first().boundingBox())?.height).toBe(130);
  expect((await cards.nth(4).boundingBox())?.height).toBe(294);
  await page.getByRole("link", { name: "Templates", exact: true }).hover();
  await expect(page.getByRole("tooltip", { name: "Templates", exact: true })).toBeVisible();
});

test("mobile board views use a bottom drawer and navigation retains the fixed rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const trigger = page.getByRole("button", {
    name: "Board views: Board",
    exact: true,
  });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Board Views", exact: true });
  await expect(drawer).toHaveAttribute("data-vaul-drawer-direction", "bottom");
  await drawer.getByRole("link", { name: "Activity", exact: true }).click();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Activity", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Board views: Activity", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const nav = page.getByRole("dialog", { name: "Navigation", exact: true });
  await expect(nav.getByRole("link", { name: "Projects", exact: true })).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await nav.evaluate((e) => e.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(nav).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const first = await page.locator(".workspace-skeleton-card").first().boundingBox();
  expect(first?.width).toBe(366);
});
