import { test, expect } from "@playwright/test";
const route = (id: number) => `./#/preview/application/app-shell/app-shell-${id}`;
test("shell command palette uses native command filtering and keyboard selection", async ({
  page,
}) => {
  await page.goto(route(3));
  await page.getByRole("button", { name: "Search workspace", exact: true }).click();
  const input = page.getByRole("combobox", {
    name: "Search workspace routes",
    exact: true,
  });
  await input.fill("zzzz-no-matches");
  await expect(page.getByText("No matching pages.", { exact: true })).toBeVisible();
  await input.fill("Settings");
  await expect(page.getByRole("option", { name: "Settings", exact: true })).toBeVisible();
  await input.press("Enter");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Breadcrumb", exact: true })).toContainText(
    "Settings",
  );
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

const commandStyles = [
  { style: "nova", corners: 14, itemCorners: 10, itemFont: 14, inputHeight: 32 },
  { style: "vega", corners: 14, itemCorners: 10, itemFont: 14, inputHeight: 32 },
  { style: "maia", corners: 26, itemCorners: 18, itemFont: 14, inputHeight: 36 },
  { style: "lyra", corners: 0, itemCorners: 0, itemFont: 12, inputHeight: 32 },
  { style: "mira", corners: 14, itemCorners: 8, itemFont: 12, inputHeight: 32 },
  { style: "luma", corners: 26, itemCorners: 22, itemFont: 14, inputHeight: 36 },
  { style: "sera", corners: 0, itemCorners: 0, itemFont: 14, inputHeight: 40 },
  { style: "rhea", corners: 22, itemCorners: 18, itemFont: 14, inputHeight: 32 },
];

for (const primitive of ["radix", "base"]) {
  test(`${primitive} command palette applies all eight styles and returns keyboard focus`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const [entry, hash] = route(3).split("#");
    const prefix = primitive === "base" ? "base/" : entry;
    for (const { style, corners, itemCorners, itemFont, inputHeight } of commandStyles) {
      const params = new URLSearchParams({ preset: JSON.stringify({ primitive, style }) });
      await page.goto(`${prefix}#${hash}?${params}`);
      const trigger = page.getByRole("button", { name: "Search workspace", exact: true });
      await trigger.press("Enter");
      const dialog = page.getByRole("dialog", { name: "Search", exact: true });
      const input = dialog.getByRole("combobox", { name: "Search workspace routes", exact: true });
      const row = dialog.getByRole("option", { name: "Settings", exact: true });
      await expect(input, style).toBeFocused();
      await input.fill("Settings");
      await expect(row, style).toBeVisible();
      await expect(dialog, style).toHaveCSS("border-top-left-radius", `${corners}px`);
      await expect(row, style).toHaveCSS("border-top-left-radius", `${itemCorners}px`);
      await expect(row, style).toHaveCSS("font-size", `${itemFont}px`);
      await expect(dialog.locator('[data-slot="input-group"]'), style).toHaveCSS(
        "height",
        `${inputHeight}px`,
      );
      await input.press("Escape");
      await expect(dialog, style).toBeHidden();
      await expect(trigger, style).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}

test("official Frame usage meter keeps its local upgrade state", async ({ page }) => {
  await page.goto(route(9));
  const card = page
    .locator('[data-slot="frame"]')
    .filter({ has: page.getByText("AI Credits", { exact: true }) });
  await expect(card.locator('[data-slot="frame-panel"]')).toBeVisible();
  await expect(card).toContainText("82%");
  await card.getByRole("button", { name: "Upgrade Plan", exact: true }).click();
  await expect(card.getByRole("button", { name: "Plan upgraded", exact: true })).toBeVisible();
  await expect(card).toContainText("25%");
  await expect(card.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
});
