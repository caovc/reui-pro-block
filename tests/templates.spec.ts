import { test, expect } from "@playwright/test";
import { templates } from "../src/templates/catalog";
import { unzipSync, strFromU8 } from "fflate";
import { readFile } from "node:fs/promises";

test("template catalog filters, searches, and opens a full workspace", async ({ page }) => {
  await page.goto("/#/templates");
  await expect(page.getByRole("heading", { name: "Full-page Templates" })).toBeVisible();
  await expect(page.locator(".template-list-row")).toHaveCount(18);
  await page.getByRole("tab", { name: "Landing 2" }).click();
  await expect(page.locator(".template-list-row")).toHaveCount(2);
  await page.getByRole("tab", { name: "All Templates 18" }).click();
  await page.getByRole("textbox", { name: "Search templates" }).fill("echo");
  await expect(page.locator(".template-list-row")).toHaveCount(1);
  await page.getByRole("link", { name: "Open template", exact: true }).click();
  await expect(page).toHaveURL(/#\/templates\/echo$/);
  await expect(page).toHaveTitle("Echo — REUI Templates");
  await page.getByRole("link", { name: "Templates", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Full-page Templates" })).toBeVisible();
  await page.getByRole("textbox", { name: "Search templates" }).fill("unfindable-template");
  await expect(page.getByRole("heading", { name: "No matching templates" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.locator(".template-list-row")).toHaveCount(18);
});

for (const template of templates) {
  test(`${template.name}: full page renders at desktop and mobile without runtime errors`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/#/templates/${template.id}`);
    await expect(page).toHaveTitle(`${template.name} — REUI Templates`);
    const content = page.locator(".template-workspace-content");
    await expect.poll(async () => (await content.innerText()).length).toBeGreaterThan(200);
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Unable to load this template" })).toHaveCount(
      0,
    );
    await page.evaluate(() => document.fonts.ready);
    const expectedFont =
      template.id === "limelight" ? "Archivo" : template.id === "overture" ? "Geist" : "Inter";
    await expect(page.locator(".template-surface > :first-child")).toHaveCSS(
      "font-family",
      new RegExp(expectedFont),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(391);
    await expect(page.getByRole("link", { name: "Templates", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("source dialog exports a runnable project with transitive template modules", async ({
  page,
}) => {
  await page.goto("/#/templates/echo");
  await page.getByRole("button", { name: "View template source" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".template-source-code")).toContainText("export default function Echo");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download project", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("echo-template.zip");
  const path = await download.path();
  const files = unzipSync(new Uint8Array(await readFile(path!)));
  expect(files["src/templates/workflow/index.tsx"]).toBeTruthy();
  expect(files["src/templates/workflow/echo.tsx"]).toBeTruthy();
  expect(files["src/main.tsx"]).toBeTruthy();
  expect(files["src/theme.css"]).toBeTruthy();
  expect(files["src/templates/surface.tsx"]).toBeTruthy();
  expect(files["src/templates/reference.css"]).toBeTruthy();
  expect(files["src/blocks/assets/inter-latin-variable.woff2"]).toBeTruthy();
  expect(files["src/blocks/assets/Inter-LICENSE.txt"]).toBeTruthy();
  expect(JSON.parse(strFromU8(files["package.json"])).scripts.dev).toBe("vite");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("standalone template previews use the whole viewport without the host toolbar offset", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/echo");
  await expect(page.getByRole("heading", { name: "How can I help you?" })).toBeVisible();
  const standalone = await page.locator(".template-surface").boundingBox();
  expect(standalone?.y).toBe(0);
  expect(standalone?.height).toBeGreaterThanOrEqual(1000);
  await page.goto("/#/templates/echo");
  await expect(page.getByRole("link", { name: "Templates", exact: true })).toBeVisible();
  const hosted = await page.locator(".template-surface").boundingBox();
  expect(hosted?.y).toBe(36);
  expect(hosted?.height).toBeGreaterThanOrEqual(964);
});

test("unknown template has a recovery link", async ({ page }) => {
  await page.goto("/#/templates/missing");
  await expect(page.getByRole("heading", { name: "Template not found" })).toBeVisible();
  await page.getByRole("link", { name: "Browse templates" }).click();
  await expect(page.getByRole("heading", { name: "Full-page Templates" })).toBeVisible();
});

test("template theme persists and reaches catalog thumbnails", async ({ page }) => {
  await page.goto("/#/templates/atlas");
  await page.getByRole("button", { name: "Toggle template theme" }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.getByRole("link", { name: "Templates", exact: true }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(page.frameLocator('iframe[title="Mesh thumbnail"]').locator("html")).toHaveClass(
    "dark",
  );
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.frameLocator('iframe[title="Mesh thumbnail"]').locator("html")).not.toHaveClass(
    "dark",
  );
});
