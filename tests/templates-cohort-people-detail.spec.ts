import { test, expect, type Page } from "@playwright/test";

async function openDirectory(page: Page) {
  await page.goto("/#/template-preview/cohort");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await directory(page);
}
async function directory(page: Page) {
  const link = page.locator(".bt-sidebar").getByRole("button", { name: "Directory", exact: true });
  if (!(await link.isVisible()))
    await page
      .locator(".bt-sidebar")
      .getByRole("button", { name: "People", exact: true })
      .first()
      .click();
  await link.click();
}
async function action(page: Page, name: string, action: string) {
  await page.getByRole("button", { name: `Actions for ${name}`, exact: true }).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

test("Cohort View has individual contract, leave, review and activity rather than the edit form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDirectory(page);
  await action(page, "Amara Okafor", "View profile");
  const amara = page.getByRole("dialog", { name: "Amara Okafor", exact: true });
  await expect(amara).toContainText("p-001");
  await expect(amara).toContainText("37.5h");
  await expect(amara).toContainText("25 days remaining");
  await expect(amara).toContainText("Complete: 100%");
  await expect(amara.getByRole("combobox")).toHaveCount(0);
  await expect(amara.getByRole("button", { name: "Save note", exact: true })).toBeDisabled();
  await amara.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  expect((await amara.boundingBox())?.width).toBe(480);
  await amara.getByText("Joined the company", { exact: true }).scrollIntoViewIfNeeded();
  await expect(amara.getByText("Joined the company", { exact: true })).toBeInViewport();
  await expect(amara.getByRole("button", { name: "Timesheet", exact: true })).toBeInViewport();
  await amara
    .locator(".cohort-profile-footer")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByRole("button", { name: "Set tree depth All", exact: true }).click();
  await action(page, "Lucas Moreau", "View profile");
  const lucas = page.getByRole("dialog", { name: "Lucas Moreau", exact: true });
  await expect(lucas).toContainText("p-013");
  await expect(lucas).toContainText("22.5h");
  await expect(lucas).toContainText("Part-time");
  await expect(lucas).toContainText("23 days remaining");
  await expect(lucas).toContainText("Away today");
  await expect(lucas).toContainText("Self review: 33%");
  await lucas.getByRole("button", { name: "Timesheet", exact: true }).click();
  await expect(page.locator(".bt-cohort-timesheets > h1")).toHaveText("Timesheets");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Cohort notes and external employee identity stay with the person across edits and navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDirectory(page);
  await action(page, "Amara Okafor", "View profile");
  let profile = page.getByRole("dialog", { name: "Amara Okafor", exact: true });
  await profile
    .getByRole("textbox", { name: "Internal note for Amara Okafor", exact: true })
    .fill("Quarterly development conversation");
  await profile.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(profile.getByRole("button", { name: "Save note", exact: true })).toBeDisabled();
  await profile
    .locator(".cohort-profile-footer")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await action(page, "Amara Okafor", "Edit person");
  const editor = page.getByRole("dialog", { name: "Edit Amara Okafor", exact: true });
  await expect(editor).toBeVisible();
  await editor.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  expect((await editor.boundingBox())?.width).toBe(512);
  await expect(editor.getByRole("textbox", { name: /note/i })).toHaveCount(0);
  await editor.getByRole("textbox", { name: "Full name", exact: true }).fill("Reset me");
  await editor.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(editor.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue(
    "Amara Okafor",
  );
  await editor.getByRole("combobox", { name: "Manager", exact: true }).click();
  await expect(editor.getByLabel("Search managers", { exact: true })).toBeVisible();
  await expect(editor.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "Daniel Reyes", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute("data-state", "open");
  await expect(editor.locator('[data-slot="combobox-content"]')).toBeHidden();
  await expect(editor.getByRole("combobox", { name: "Manager", exact: true })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await editor.getByRole("textbox", { name: "Full name", exact: true }).fill("Amara Okafor QA");
  await editor.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await directory(page);
  await action(page, "Amara Okafor QA", "View profile");
  profile = page.getByRole("dialog", { name: "Amara Okafor QA", exact: true });
  await expect(profile).toContainText("p-001");
  await expect(profile).toContainText("37.5h");
  await expect(
    profile.getByRole("textbox", { name: "Internal note for Amara Okafor QA", exact: true }),
  ).toHaveValue("Quarterly development conversation");
  await profile
    .locator(".cohort-profile-footer")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await action(page, "Hannah Weber", "View profile");
  await expect(
    page.getByRole("textbox", { name: "Internal note for Hannah Weber", exact: true }),
  ).toHaveValue("");
});

test("Cohort mobile View and Edit have independent scrolling, visible footer and no tab scrollbars", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/template-preview/cohort");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Cohort", exact: true });
  await menu.getByRole("button", { name: "People", exact: true }).first().click();
  await menu.getByRole("button", { name: "Directory", exact: true }).click();
  await action(page, "Amara Okafor", "View profile");
  const profile = page.getByRole("dialog", { name: "Amara Okafor", exact: true });
  expect((await profile.boundingBox())!.width).toBeCloseTo(358, 2);
  await expect(profile.getByRole("tablist")).toHaveCount(0);
  await profile.getByText("Joined the company", { exact: true }).scrollIntoViewIfNeeded();
  await expect(profile.getByText("Joined the company", { exact: true })).toBeInViewport();
  await expect(
    profile.locator(".cohort-profile-footer").getByRole("button", { name: "Close", exact: true }),
  ).toBeInViewport();
  await profile
    .locator(".cohort-profile-footer")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await action(page, "Amara Okafor", "Change manager");
  await expect(page.getByText("Move Amara Okafor and 4 reports.", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await action(page, "Amara Okafor", "Edit person");
  const editor = page.getByRole("dialog", { name: "Edit Amara Okafor", exact: true });
  expect((await editor.boundingBox())!.width).toBeCloseTo(358, 2);
  await editor.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(editor.locator(".bt-profile-photo img")).toHaveCount(0);
  await editor.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(editor.locator(".bt-profile-photo img")).toHaveCount(1);
  await expect(editor.getByRole("button", { name: "Save changes", exact: true })).toBeInViewport();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
});

test("Cohort photo upload, save and removal follow the selected employee", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openDirectory(page);
  await action(page, "Amara Okafor", "Edit person");
  let editor = page.getByRole("dialog", { name: "Edit Amara Okafor", exact: true });
  const originalPhoto = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#22736b"/><circle cx="20" cy="20" r="10" fill="#f5e6ce"/></svg>',
  );
  await editor.getByLabel("Upload person photo", { exact: true }).setInputFiles({
    name: "bricklane-person.svg",
    mimeType: "image/svg+xml",
    buffer: originalPhoto,
  });
  await expect(editor.locator(".bt-profile-photo img")).toHaveAttribute(
    "src",
    /^data:image\/svg\+xml/,
  );
  await editor.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).first().click();
  await directory(page);
  await action(page, "Amara Okafor", "View profile");
  const profile = page.getByRole("dialog", { name: "Amara Okafor", exact: true });
  await expect(profile.locator(".cohort-profile-person-since > img")).toHaveAttribute(
    "src",
    /^data:image\/svg\+xml/,
  );
  await profile
    .locator(".cohort-profile-footer")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await action(page, "Amara Okafor", "Edit person");
  editor = page.getByRole("dialog", { name: "Edit Amara Okafor", exact: true });
  await editor.getByRole("button", { name: "Remove", exact: true }).click();
  await editor.getByRole("button", { name: "Save changes", exact: true }).click();
  await action(page, "Amara Okafor", "View profile");
  await expect(page.getByRole("dialog").locator(".cohort-profile-person-since img")).toHaveCount(0);
});
