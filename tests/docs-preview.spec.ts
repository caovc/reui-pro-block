import { test, expect } from "@playwright/test";
const route = "./#/block/application/auth/auth-20";

test("customizer updates the live frame without losing input and persists settings", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);
  const frame = page.frameLocator("iframe");
  await frame.getByRole("textbox").first().fill("preview@example.com");
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  async function choose(label: string, option: string) {
    await page.getByRole("combobox", { name: label, exact: true }).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  }
  await choose("Accent color", "Emerald");
  await choose("Corner radius", "Square");
  await choose("Heading font", "Serif");
  await choose("Chart color", "Match theme");
  await choose("Base color", "Stone");
  await choose("Preview mode", "Dark");
  await expect(frame.locator("html")).toHaveClass("dark");
  await expect(frame.locator("html")).toHaveCSS("--radius", "0rem");
  await expect(frame.locator("html")).toHaveCSS("--primary", "#047857");
  await expect(frame.getByRole("textbox").first()).toHaveValue(
    "preview@example.com",
  );
  await page.reload();
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Accent color", exact: true }),
  ).toContainText("Emerald");
  await expect(frame.locator("html")).toHaveCSS("--primary", "#047857");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(frame.locator("html")).toHaveCSS("--radius", "0.625rem");
  expect(errors).toEqual([]);
});

test("preset link is portable and malformed values cannot inject CSS", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(route);
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Accent color", exact: true })
    .click();
  await page.getByRole("option", { name: "Violet", exact: true }).click();
  await page
    .getByRole("button", { name: "Copy preset link", exact: true })
    .click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  await page.evaluate(() => localStorage.clear());
  await page.goto(link);
  await expect(page.frameLocator("iframe").locator("html")).toHaveCSS(
    "--primary",
    "#7c3aed",
  );
  await page.goto(
    `./#/preview/application/auth/auth-20?preset=${encodeURIComponent(JSON.stringify({ radius: "0; background:red", custom: "red; } body { display:none }" }))}`,
  );
  await expect(page.locator("html")).toHaveCSS("--radius", "0.625rem");
  await expect(page.locator(".isolated-preview")).toBeVisible();
});

test("code drawer provides working package commands, file switching and starter download", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(route);
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const drawer = page.getByRole("dialog");
  await expect(
    drawer.getByText("Installation and source code", { exact: true }),
  ).toBeVisible();
  await drawer.getByRole("tab", { name: "npm", exact: true }).click();
  await expect(
    drawer.getByLabel("Installation commands", { exact: true }),
  ).toContainText("npm install");
  await drawer
    .getByRole("button", { name: "Copy installation commands", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("npm install\nnpm run dev");
  await drawer.getByRole("combobox", { name: "Source file" }).click();
  await page
    .getByRole("option", {
      name: "src/blocks/application/auth.tsx",
      exact: true,
    })
    .click();
  await expect(drawer.locator(".source-code")).toContainText("AuthBlock");
  const download = page.waitForEvent("download");
  await drawer.getByRole("button", { name: "Download starter" }).click();
  expect((await download).suggestedFilename()).toBe("auth-20.zip");
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "View code", exact: true }),
  ).toBeFocused();
});

test("phone customizer and code drawer fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Preview customization" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Close customizer" }).click();
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.locator(".source-code")).toBeVisible();
  expect(await drawer.evaluate((el) => el.scrollWidth <= innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "/tmp/reui-doc-preview-mobile.png" });
});

test("official color picker and system mode update real preview tokens", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(route);
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await page
    .getByRole("button", { name: "Custom accent", exact: true })
    .click();
  const hex = page.getByRole("textbox", { name: "Hex", exact: true });
  await hex.fill("#123456");
  await hex.press("Enter");
  await expect(page.frameLocator("iframe").locator("html")).toHaveCSS(
    "--primary",
    "#123456",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: "Preview mode" }).click();
  await page.getByRole("option", { name: "System", exact: true }).click();
  await expect(page.frameLocator("iframe").locator("html")).not.toHaveClass(
    "dark",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.frameLocator("iframe").locator("html")).toHaveClass("dark");
});
