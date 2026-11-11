import { expect, test, type Page } from "@playwright/test";

async function openBase(page: Page, baseURL: string | undefined, route: string) {
  const base = process.env.BASE_UI_PREVIEW_URL ?? new URL("./base/", baseURL).href;
  await page.goto(new URL(`#/${route}`, base).href);
}

test("Base UI keeps standalone menu labels and closes checked items after selection", async ({
  page,
  baseURL,
}) => {
  await openBase(page, baseURL, "preview/chart/area-chart/chart-16");
  const display = page.getByRole("button", { name: "Display options", exact: true });
  await display.click();
  const menu = page.getByRole("menu");
  await expect(menu.getByText("Sources", { exact: true })).toBeVisible();
  await expect(menu.getByText("Layers", { exact: true })).toBeVisible();
  const gridlines = menu.getByRole("menuitemcheckbox", { name: "Gridlines", exact: true });
  const previous = await gridlines.getAttribute("aria-checked");
  await gridlines.click();
  await expect(menu).toHaveCount(0);
  await expect(display).toBeFocused();
  await display.click();
  await expect(gridlines).toHaveAttribute("aria-checked", previous === "true" ? "false" : "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);

  const compare = page.getByRole("button", { name: "Compare against", exact: true });
  await compare.click();
  const average = menu.getByRole("menuitemradio", { name: "30-Day Average", exact: true });
  await average.focus();
  await average.press("Enter");
  await expect(menu).toHaveCount(0);
  await expect(compare).toBeFocused();
  await compare.click();
  await expect(average).toHaveAttribute("aria-checked", "true");
});

test("Base UI context menu runs the action on the clicked flow node", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openBase(page, baseURL, "preview/application/flow/flow-1");
  const node = page.locator('[data-flow-node="condition"]');
  await node.click({ button: "right" });
  const menu = page.getByRole("menu");
  await menu.getByRole("menuitem", { name: "Edit step", exact: true }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Plan is Enterprise");
  await page.getByLabel("Title", { exact: true }).fill("Enterprise customer");
  await page.getByRole("button", { name: "Save step", exact: true }).click();
  await expect(node).toContainText("Enterprise customer");
});

test("Base UI workspace menu returns focus inside the mobile Sidebar on Escape", async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openBase(page, baseURL, "preview/application/app-shell/app-shell-1");
  const opener = page.getByRole("button", { name: "Open navigation", exact: true });
  await opener.click();
  const sheet = page.getByRole("dialog", { name: "Navigation", exact: true });
  const switcher = sheet.getByRole("button", { name: "Switch workspace", exact: true });
  await switcher.click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: "Acme Inc", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(sheet).toBeVisible();
  await expect(switcher).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(opener).toBeFocused();
});
