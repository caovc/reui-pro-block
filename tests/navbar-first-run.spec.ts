import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

async function open(page: Page, id: number) {
  await page.goto(`./#/preview/application/navbar/navbar-${id}`);
  await expect(page.locator(`[data-navbar-entry="${id}"]`)).toBeVisible();
}
for (const width of [1440, 390]) {
  for (const id of [1, 2, 3]) {
    test(`navbar ${id} stays within ${width}px and loads original demo portraits`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      await open(page, id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const scene = await page.locator(`[data-navbar-entry="${id}"]`).boundingBox();
      expect(scene!.x).toBeGreaterThanOrEqual(0);
      expect(scene!.x + scene!.width).toBeLessThanOrEqual(width);
      await expect
        .poll(() =>
          page
            .locator("img")
            .evaluateAll((images) =>
              images.every((image) => image.complete && image.naturalWidth > 0),
            ),
        )
        .toBe(true);
      expect(errors).toEqual([]);
    });
  }
}
test("project line tabs, star, 12-person popover and search retain meaningful state", async ({
  page,
}) => {
  await open(page, 1);
  await page.getByRole("tab", { name: "Overview", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Tasks 24", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("Tasks demo content")).toBeVisible();
  await page.getByRole("button", { name: "Star project", exact: true }).click();
  await expect(page.getByRole("button", { name: "Star project", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "View 12 collaborators", exact: true }).click();
  await expect(page.getByText("Theo Blake", { exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="popover-content"] [data-slot="avatar"]')).toHaveCount(12);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Search projects", exact: true }).click();
  await page.getByRole("textbox", { name: "Search projects", exact: true }).fill("does not exist");
  await expect(page.getByText("No projects found.", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search projects", exact: true }).fill("Mobile");
  await page.getByRole("button", { name: "Mobile application", exact: true }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    "Mobile application selected locally",
  );
});
test("phone project menu changes real selected panel and Create saves a local draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 1);
  await page.getByRole("button", { name: "Project sections", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Files", exact: true }).click();
  await expect(page.getByRole("button", { name: "Project sections", exact: true })).toContainText(
    "Files",
  );
  await expect(page.getByLabel("Files demo content")).toBeVisible();
  await page.getByRole("button", { name: "Create new", exact: true }).click();
  await expect(page.getByRole("button", { name: "Create draft", exact: true })).toBeDisabled();
  await page.getByLabel("Project name", { exact: true }).fill("QA navbar");
  await page.getByRole("button", { name: "Create draft", exact: true }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText(
    "Created QA navbar as a local draft",
  );
  await expect(page.getByRole("button", { name: "Create new", exact: true })).toBeFocused();
});
test("presence filter/sort radios and actual inline invite validate and preserve selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 2);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Archived", exact: true }).click();
  await expect(page.locator("output")).toContainText("Website refresh");
  await expect(page.locator("output")).not.toContainText("Mobile application");
  await page.getByRole("button", { name: "Sort", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Name", exact: true }).click();
  await expect(page.locator("output")).toContainText("sorted by Name");
  await page.getByRole("button", { name: "Invite team member", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send invite", exact: true })).toBeDisabled();
  await page.getByLabel("Email address", { exact: true }).fill("invalid");
  await expect(page.getByRole("button", { name: "Send invite", exact: true })).toBeDisabled();
  await page.getByLabel("Email address", { exact: true }).fill("qa@example.com");
  await page.getByRole("button", { name: "Send invite", exact: true }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText("No email was sent");
  await expect(page.getByRole("button", { name: "Invite team member", exact: true })).toBeFocused();
});
for (const width of [1440, 390]) {
  test(`platform context, free account theme/status and Upgrade work at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await open(page, 3);
    for (const [field, choice] of [
      ["Organization", "Research Labs"],
      ["Project", "API Service"],
      ["Environment", "Development"],
    ]) {
      await page.getByRole("button", { name: field, exact: true }).click();
      const menu = await page.locator('[data-slot="dropdown-menu-content"]').boundingBox();
      expect(menu!.x).toBeGreaterThanOrEqual(0);
      expect(menu!.x + menu!.width).toBeLessThanOrEqual(width);
      await page.getByRole("menuitem", { name: new RegExp(`^${choice}`) }).click();
    }
    await expect(page.locator("output")).toHaveText("labs / api / development");
    await page.getByRole("button", { name: "Account menu", exact: true }).click();
    await page.getByRole("tab", { name: "Dark", exact: true }).click();
    await expect(page.locator('[data-navbar-entry="3"]')).toHaveClass(/dark/);
    await expect(page.locator('[data-slot="dropdown-menu-content"]').first()).toHaveClass(/dark/);
    await page.getByRole("menuitem", { name: "Available", exact: true }).hover();
    await page.getByRole("menuitem", { name: "Busy", exact: true }).click();
    await page.getByRole("button", { name: "Account menu", exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "Busy", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Upgrade", exact: true }).click();
    await page.getByRole("button", { name: "Preview Pro", exact: true }).click();
    await expect(page.locator('[data-slot="alert"]')).toContainText("No billing changes were made");
    await expect(page.locator("output")).toHaveText("labs / api / development");
  });
}
for (const [id, module] of [
  [1, "project"],
  [2, "presence"],
  [3, "platform"],
] as const) {
  test(`navbar ${id} code viewer selects its actual leaf`, async ({ page }) => {
    await page.goto(`./#/block/application/navbar/navbar-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      `src/blocks/application/navbar-variants/first-run/${module}.tsx`,
    );
  });
}
test("navbar source ZIP includes real reused free sources, original artwork and MIT attribution", async ({
  page,
}) => {
  await page.goto("./#/block/application/navbar/navbar-3");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const files = unzipSync(new Uint8Array(await readFile((await (await pending).path())!)));
  for (const path of [
    "src/blocks/application/navbar-variants/first-run/platform.tsx",
    "src/blocks/application/navbar-variants/first-run/free/context-switcher.tsx",
    "src/blocks/application/navbar-variants/first-run/free/account-menu.tsx",
    "src/blocks/application/navbar-variants/first-run/navbar.css",
    "src/components/reui/REUI-LICENSE.txt",
    "src/lib/demo-artwork.ts",
    "src/components/brand-mark.tsx",
  ])
    expect(files[path], path).toBeDefined();
  expect(
    strFromU8(files["src/blocks/application/navbar-variants/first-run/free/account-menu.tsx"]),
  ).toContain("c-dropdown-menu-14");
  expect(
    strFromU8(files["src/blocks/application/navbar-variants/first-run/free/context-switcher.tsx"]),
  ).not.toContain("<svg");
});
