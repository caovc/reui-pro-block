import { test, expect, type Page } from "@playwright/test";

async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("combobox", { name: label, exact: true })).toBeFocused();
}

test("global appearance reaches the catalog, block previews and templates", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Preview customization" })).toBeVisible();
  await choose(page, "Accent color", "Emerald");
  await choose(page, "Corner radius", "Square");
  await expect(page.locator("html")).toHaveCSS("--primary", "#047857");
  await expect(page.locator(".miniature-inner").first()).toHaveCSS("--primary", "#047857");
  await page.goto("./#/block/application/auth/auth-20");
  await expect(page.frameLocator("iframe").locator("html")).toHaveCSS("--primary", "#047857");
  await expect(page.frameLocator("iframe").locator("html")).toHaveCSS("--radius", "0rem");
  await page.goto("./#/templates/atlas");
  await expect(page.locator(".template-surface")).toHaveCSS("--primary", "#047857");
  await expect(page.getByRole("complementary", { name: "Preview customization" })).toBeVisible();
  await choose(page, "Body font", "Serif");
  await expect(page.locator(".template-surface > :first-child")).toHaveCSS(
    "font-family",
    "Georgia, serif",
  );
  await choose(page, "Preview mode", "Dark");
  await expect(page.locator("html")).toHaveClass("dark");
  await page.goto("./#/templates");
  await expect(page.frameLocator('iframe[title="Mesh thumbnail"]').locator("html")).toHaveClass(
    "dark",
  );
  await expect(page.frameLocator('iframe[title="Mesh thumbnail"]').locator("html")).toHaveCSS(
    "--primary",
    "#047857",
  );
  await page.goto("./#/templates/limelight");
  await expect(page.locator(".ct-lime-cta").first()).toHaveCSS(
    "background-color",
    "rgb(4, 120, 87)",
  );
  expect(errors).toEqual([]);
});

test("open tabs synchronize without reloading an interactive preview", async ({
  page,
  context,
}) => {
  await page.goto("./");
  const isolated = await context.newPage();
  await isolated.goto("./#/preview/application/auth/auth-20");
  await isolated.getByRole("textbox").first().fill("shared@example.com");
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await choose(page, "Accent color", "Violet");
  await expect(isolated.locator("html")).toHaveCSS("--primary", "#7c3aed");
  await expect(isolated.getByRole("textbox").first()).toHaveValue("shared@example.com");
  await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
  await expect(isolated.locator("html")).toHaveClass("dark");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(isolated.locator("html")).not.toHaveCSS("--primary", "#7c3aed");
  await isolated.close();
});

test("open preset validates input and applies a global theme", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await page.getByRole("button", { name: "Open preset", exact: true }).click();
  await page.getByRole("textbox", { name: "Preset link or JSON" }).fill("not-a-preset");
  await page.getByRole("button", { name: "Apply preset", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Paste a Bricklane preset link or valid theme JSON.",
  );
  await page
    .getByRole("textbox", { name: "Preset link or JSON" })
    .fill(JSON.stringify({ accent: "teal", menu: "solid", menuAccent: "bold", chart: "colorful" }));
  await page.getByRole("button", { name: "Apply preset", exact: true }).click();
  await expect(page.locator("html")).toHaveCSS("--primary", "#0f766e");
  await expect(page.locator("html")).toHaveCSS("--chart-1", "#2563eb");
  await page.getByRole("button", { name: "Close customizer" }).click();
  await page.goto("./#/category/application/auth");
  await expect(page.locator(".sidebar-link.active")).toHaveCSS(
    "background-color",
    "rgb(15, 118, 110)",
  );
});

test("mobile global customizer traps focus, fits the screen and restores its trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/templates/echo");
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Customize global theme" });
  await expect(dialog).toBeVisible();
  await choose(page, "Accent color", "Rose");
  await expect(page.locator("html")).toHaveCSS("--primary", "#be123c");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Customize", exact: true })).toBeFocused();
});
