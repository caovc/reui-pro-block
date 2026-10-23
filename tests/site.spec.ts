import { test, expect } from "@playwright/test";

test("catalog search, deep link, code viewer and favorites", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Beautiful blocks");
  await page.getByLabel("Search blocks", { exact: true }).fill("Centered Password Login");
  await expect(page.locator(".block-tile")).toHaveCount(1);
  await page.getByRole("link").filter({ hasText: "Centered Password Login" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Centered Password Login");
  await page.getByRole("button", { name: "Favorite block", exact: true }).click();
  await expect(page.getByRole("button", { name: "Favorite block", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.locator(".source-code")).toContainText("export default function CenteredAuth");
  await page.getByRole("combobox", { name: "Source file" }).click();
  await expect(
    page.getByRole("option").filter({ hasText: "src/blocks/application/auth.tsx" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect
    .poll(async () => await page.frameLocator("iframe").locator(".isolated-preview").innerText())
    .toContain("Sign in");
  await expect
    .poll(
      async () =>
        await page
          .locator(".preview-frame-wrap")
          .evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeGreaterThan(100);
  await page.goto("./#/favorites");
  await expect(page.locator(".block-tile")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".block-tile")).toHaveCount(1);
});
test("viewport, theme, customizer and source download", async ({ page }) => {
  await page.goto("./#/block/application/auth/auth-20");
  const frame = page.locator("iframe");
  await expect(frame).toBeVisible();
  await page.getByRole("radio", { name: "Mobile viewport" }).click();
  await expect(frame).toHaveCSS("width", "390px");
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(page.frameLocator("iframe").locator("html")).toHaveClass("dark");
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await page.getByRole("combobox", { name: "Corner radius" }).click();
  await page.getByRole("option", { name: "Square", exact: true }).click();
  await expect(page.frameLocator("iframe").locator("html")).toHaveCSS("--radius", "0rem");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("auth-20.zip");
});
test("mobile category navigation and empty search", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.getByRole("button", { name: "Browse categories" }).click();
  const nav = page.getByRole("dialog");
  await nav.getByRole("link", { name: "Auth 20", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Auth blocks");
  await page.getByLabel("Search blocks", { exact: true }).fill("nothing-exists-xyz");
  await expect(page.getByText("No matching blocks")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBeFalsy();
});
test("command search navigates with a deep link", async ({ page }) => {
  await page.goto("./");
  await page.keyboard.press("ControlOrMeta+k");
  await page
    .getByRole("textbox", { name: "Search all blocks", exact: true })
    .fill("Centered Password Login");
  await page.locator(".search-result").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Centered Password Login");
});
