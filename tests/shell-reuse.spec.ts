import { test, expect } from "@playwright/test";
const route = (id: number) =>
  `./#/preview/application/app-shell/app-shell-${id}`;
test("shell command palette uses native command filtering and keyboard selection", async ({
  page,
}) => {
  await page.goto(route(2));
  await page
    .getByRole("button", { name: "Search workspace", exact: true })
    .click();
  const input = page.getByRole("combobox", {
    name: "Search workspace routes",
    exact: true,
  });
  await input.fill("zzzz-no-matches");
  await expect(
    page.getByText("No matching pages.", { exact: true }),
  ).toBeVisible();
  await input.fill("Settings");
  await expect(
    page.getByRole("option", { name: "Settings", exact: true }),
  ).toBeVisible();
  await input.press("Enter");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb", exact: true }),
  ).toContainText("Settings");
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Search", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
test("official Frame usage meter keeps its local upgrade state", async ({
  page,
}) => {
  await page.goto(route(9));
  const card = page
    .locator('[data-slot="frame"]')
    .filter({ has: page.getByText("AI Credits", { exact: true }) });
  await expect(card.locator('[data-slot="frame-panel"]')).toBeVisible();
  await expect(card).toContainText("82%");
  await card.getByRole("button", { name: "Upgrade Plan", exact: true }).click();
  await expect(
    card.getByRole("button", { name: "Plan upgraded", exact: true }),
  ).toBeVisible();
  await expect(card).toContainText("25%");
  await expect(card.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "25",
  );
});
