import { test, expect, type Page } from "@playwright/test";

async function openSidebar(page: Page, width: number) {
  if (width < 768) {
    await page.getByRole("button", { name: "Open chats", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Chats", exact: true })).toBeVisible();
  }
}
async function settings(page: Page, width: number, section = "General") {
  await openSidebar(page, width);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Account Settings", exact: true })).toBeVisible();
  if (width < 768) {
    await expect(page.getByRole("dialog", { name: "Chats", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Open chats", exact: true })).toBeFocused();
  }
  await tab(page, section);
}
async function tab(page: Page, name: string) {
  const trigger = page.getByRole("tab", { name, exact: true });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-selected", "true");
}
async function select(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("combobox", { name: label, exact: true })).toContainText(option);
}
async function healthy(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await expect(page.getByText("Unable to load this template", { exact: true })).toHaveCount(0);
}
for (const width of [1440, 390]) {
  test.describe(`Echo native Sidebar and inline settings ${width}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await page.goto("/#/template-preview/echo");
      await expect(
        page.getByRole("heading", { name: "How can I help you?", exact: true }),
      ).toBeVisible();
    });
    test("one provider owns rail, mobile focus, search routes and account navigation", async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
      if (width === 1440) {
        await expect(page.locator('[data-slot="sidebar-inset"]')).toHaveJSProperty(
          "offsetLeft",
          249,
        );
        await page.keyboard.press("Control+b");
        await expect(page.locator('[data-slot="sidebar"][data-state="collapsed"]')).toBeVisible();
        await expect
          .poll(async () =>
            Math.round((await page.locator('[data-slot="sidebar-inset"]').boundingBox())!.x),
          )
          .toBe(49);
        await page.getByRole("button", { name: "Pinned", exact: true }).click();
        await expect(page.getByRole("menu")).toBeVisible();
        await page.keyboard.press("Home");
        await expect(page.getByRole("menuitem", { name: /Stripe webhook/ })).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page.locator(".echo-message.user")).toContainText("Stripe webhook");
        await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
      } else {
        await openSidebar(page, width);
        expect(
          (await page.getByRole("dialog", { name: "Chats", exact: true }).boundingBox())!.width,
        ).toBeCloseTo(292.5, 0);
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog", { name: "Chats", exact: true })).toBeHidden();
        await expect(page.getByRole("button", { name: "Open chats", exact: true })).toBeFocused();
      }
      await page.getByRole("button", { name: "Search chats", exact: true }).click();
      await page
        .getByRole("combobox", { name: "Search workspace routes", exact: true })
        .fill("Debounce");
      await expect(page.getByRole("option", { name: /Debounce/ })).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(page.locator(".echo-message.user")).toContainText(
        "Debounce on the search input",
      );
      await openSidebar(page, width);
      await page.getByRole("button", { name: "Account menu", exact: true }).click();
      await page.getByRole("menuitem", { name: "Relay", exact: true }).click();
      await expect(page.getByRole("button", { name: "Account menu", exact: true })).toContainText(
        "Relay",
      );
      await page.getByRole("button", { name: "Account menu", exact: true }).click();
      await page.getByRole("menuitem", { name: /Profile/ }).click();
      await expect(page.getByRole("tab", { name: "My Profile", exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      if (width < 768)
        await expect(page.getByRole("button", { name: "Open chats", exact: true })).toBeFocused();
      await healthy(page);
      expect(errors).toEqual([]);
      await page.screenshot({ path: info.outputPath("native-sidebar-account.png") });
    });
    test("seven distinct sections retain real draft and saved profile identities", async ({
      page,
    }, info) => {
      await settings(page, width, "Personalization");
      const nickname = page.getByRole("textbox", { name: "What to call you", exact: true });
      await nickname.fill("Uncommitted nickname");
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(nickname).toHaveValue("");
      await nickname.fill("River");
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await tab(page, "My Profile");
      await page.getByRole("textbox", { name: "Full name", exact: true }).fill("River Vale");
      await page.getByRole("textbox", { name: "Email address", exact: false }).fill("broken");
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(page.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
      await page
        .getByRole("textbox", { name: "Email address", exact: false })
        .fill("river@bricklane.example");
      await select(page, "Role", "Designer");
      await select(page, "Time zone", "UTC+9 (Tokyo)");
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await tab(page, "Personalization");
      await expect(nickname).toHaveValue("River");
      await openSidebar(page, width);
      await expect(page.getByRole("button", { name: "Account menu", exact: true })).toContainText(
        "River Vale",
      );
      await page.getByRole("button", { name: "New Chat", exact: true }).click();
      await settings(page, width, "My Profile");
      await expect(page.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue(
        "River Vale",
      );
      await expect(page.getByRole("combobox", { name: "Role", exact: true })).toContainText(
        "Designer",
      );
      for (const name of [
        "General",
        "Personalization",
        "My Profile",
        "Notifications",
        "Data controls",
        "Security",
        "Billing",
      ]) {
        await tab(page, name);
        await healthy(page);
      }
      await page.screenshot({ path: info.outputPath("seven-sections-billing.png") });
    });
    test("immediate defaults drive new chats and notification Reset only changes the draft", async ({
      page,
    }, info) => {
      await settings(page, width);
      await select(page, "Default model", "Gemini 3 Pro");
      await page.getByRole("switch", { name: "Dictation", exact: true }).click();
      await tab(page, "Notifications");
      await page.getByRole("switch", { name: "Desktop notifications", exact: true }).click();
      await select(page, "Start", "10:00 PM");
      await select(page, "End", "6:00 AM");
      await page.getByRole("button", { name: "Save preferences", exact: true }).click();
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(
        page.getByRole("switch", { name: "Desktop notifications", exact: true }),
      ).toBeChecked();
      await expect(page.getByRole("combobox", { name: "Start", exact: true })).toContainText(
        "8:00 PM",
      );
      await tab(page, "General");
      await expect(page.getByRole("switch", { name: "Dictation", exact: true })).not.toBeChecked();
      await openSidebar(page, width);
      await page.getByRole("button", { name: "New Chat", exact: true }).click();
      await expect(
        page.getByRole("combobox", { name: "Select AI model", exact: true }),
      ).toContainText("Gemini 3 Pro");
      await settings(page, width, "Personalization");
      await page.getByRole("button", { name: "Manage", exact: true }).click();
      const memoryDialog = page.getByRole("dialog", { name: "Saved memories", exact: true });
      await expect(memoryDialog.getByRole("button", { name: "Delete", exact: true })).toHaveCount(
        5,
      );
      await memoryDialog.getByRole("button", { name: "Delete", exact: true }).first().click();
      await expect(memoryDialog.getByRole("button", { name: "Delete", exact: true })).toHaveCount(
        4,
      );
      await page.keyboard.press("Escape");
      await expect(memoryDialog).toBeHidden();
      await expect(page.getByText("4 things kept.", { exact: true })).toBeVisible();
      await page.screenshot({ path: info.outputPath("personalization-memory.png") });
    });
    test("data actions confirm, archive, restore and download actual local history", async ({
      page,
    }, info) => {
      await settings(page, width, "Data controls");
      await page.getByRole("button", { name: "Archive all", exact: true }).click();
      await expect(page.getByRole("alertdialog")).toContainText("Archive all 13 chats?");
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(page.getByRole("alertdialog")).toBeHidden();
      await page.getByRole("button", { name: "Archive all", exact: true }).click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Archive all", exact: true })
        .click();
      await expect(page.getByText("16 chats out of the sidebar.", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Manage", exact: true }).nth(1).click();
      const archive = page.getByRole("dialog", { name: "Archived chats", exact: true });
      await expect(archive.getByRole("button", { name: "Restore", exact: true })).toHaveCount(16);
      await archive.getByRole("button", { name: "Restore", exact: true }).first().click();
      await expect(archive.getByRole("button", { name: "Restore", exact: true })).toHaveCount(15);
      await page.keyboard.press("Escape");
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export", exact: true }).click();
      const file = await download;
      expect(file.suggestedFilename()).toBe("bricklane-chats.md");
      await file.saveAs(info.outputPath("bricklane-chats.md"));
      await page.getByRole("button", { name: "Delete all", exact: true }).click();
      await expect(page.getByRole("alertdialog")).toContainText("Delete all 16 chats?");
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await healthy(page);
      await page.screenshot({ path: info.outputPath("data-archived-restored.png") });
    });
    test("security validates independent actions and billing preserves its own saved fields", async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await settings(page, width, "Security");
      await page.getByRole("button", { name: "Update password", exact: true }).click();
      await expect(page.getByText("Enter your current password.", { exact: true })).toBeVisible();
      await page.getByLabel("Current password", { exact: true }).fill("current-local-password");
      await page.getByLabel("New password", { exact: true }).fill("new-local-password-123");
      await page.getByLabel("Confirm password", { exact: true }).fill("new-local-password-123");
      await page.getByRole("button", { name: "Update password", exact: true }).click();
      await expect(page.getByLabel("Current password", { exact: true })).toHaveValue("");
      await page.getByRole("button", { name: "Revoke", exact: true }).first().click();
      await expect(page.getByRole("button", { name: "Revoke", exact: true })).toHaveCount(1);
      await page.getByRole("button", { name: "Delete account", exact: true }).click();
      await expect(page.getByRole("alertdialog")).toContainText("Delete your local account?");
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await tab(page, "Billing");
      await page
        .getByRole("textbox", { name: "Billing email", exact: true })
        .fill("billing@river.example");
      await select(page, "Country", "Uzbekistan");
      await page.getByRole("button", { name: "Update billing", exact: true }).click();
      await page.getByRole("button", { name: "Update", exact: true }).click();
      await page.getByLabel("Card last four digits", { exact: true }).fill("1234");
      await page.getByRole("button", { name: "Update local card", exact: true }).click();
      await openSidebar(page, width);
      await page.getByRole("button", { name: "New Chat", exact: true }).click();
      await settings(page, width, "Billing");
      await expect(page.getByRole("textbox", { name: "Billing email", exact: true })).toHaveValue(
        "billing@river.example",
      );
      await expect(page.getByText("Visa ending in 1234", { exact: true })).toBeVisible();
      await healthy(page);
      expect(errors).toEqual([]);
      await page.screenshot({ path: info.outputPath("billing-saved-state.png") });
    });
  });
}

test("Echo menus use native keyboard groups, theme updates and scoped overflow", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/echo");
  await expect(page.getByRole("button", { name: "Account menu", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  const theme = page.getByRole("menuitem", { name: "Theme", exact: true });
  await theme.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("menuitemradio", { name: "Light", exact: true })).toBeVisible();
  await page.keyboard.press("Home");
  await expect(page.getByRole("menuitemradio", { name: "Light", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemradio", { name: "Dark", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await settings(page, 1440);
  await page.getByRole("radio", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  const desktopTabs = await page
    .getByRole("tablist", { name: "Account settings sections", exact: true })
    .evaluate((element) => ({
      client: element.clientWidth,
      scroll: element.scrollWidth,
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
  expect(desktopTabs.scroll).toBeLessThanOrEqual(desktopTabs.client);
  expect(desktopTabs.scrollHeight).toBeLessThanOrEqual(desktopTabs.height);
  await page.setViewportSize({ width: 390, height: 844 });
  const tabs = page.getByRole("tablist", { name: "Account settings sections", exact: true });
  await tabs.getByRole("tab", { name: "General", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(tabs.getByRole("tab", { name: "Billing", exact: true })).toBeFocused();
  await expect(tabs.getByRole("tab", { name: "Billing", exact: true })).toBeInViewport();
  const metrics = await tabs.evaluate((element) => {
    const wrapper = element.parentElement!;
    return {
      client: wrapper.clientWidth,
      scroll: wrapper.scrollWidth,
      height: wrapper.clientHeight,
      scrollHeight: wrapper.scrollHeight,
      overflow: getComputedStyle(wrapper).overflowX,
    };
  });
  expect(metrics.scroll).toBeGreaterThan(metrics.client);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.height);
  expect(metrics.overflow).toBe("auto");
  await healthy(page);
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath("mobile-tabs-keyboard-billing.png") });
});

for (const width of [1440, 390]) {
  test(`Echo ${width} row actions preserve stable chats, share snapshots and reuse the scheduled form`, async ({
    page,
    context,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto("/#/template-preview/echo");
    await expect(
      page.getByRole("heading", { name: "How can I help you?", exact: true }),
    ).toBeVisible();
    if (width < 768) {
      await expect(page.locator('[data-slot="sidebar-trigger"] svg')).toHaveClass(/lucide-menu/);
      await openSidebar(page, width);
      await page.getByRole("button", { name: "Close chats", exact: true }).click();
      await expect(page.getByRole("button", { name: "Open chats", exact: true })).toBeFocused();
      await openSidebar(page, width);
      await page.keyboard.press("Control+k");
      await expect(page.getByRole("dialog", { name: "Search", exact: true })).toHaveCount(1);
      await page
        .getByRole("combobox", { name: "Search workspace routes", exact: true })
        .fill("Admin guide refresh");
      await page.getByRole("option", { name: "Admin guide refresh", exact: true }).click();
      await expect(page.getByRole("button", { name: "Open chats", exact: true })).toBeFocused();
      await openSidebar(page, width);
      await page.getByRole("button", { name: "New Chat", exact: true }).click();
    }
    const composer = page.getByRole("textbox", { name: "Message Bricklane Chat", exact: true });
    await composer.fill("Keep the exact local transcript");
    await composer.press("Enter");
    await expect(page.locator(".echo-message.user")).toContainText(
      "Keep the exact local transcript",
    );
    await openSidebar(page, width);
    await page
      .getByRole("button", { name: "Actions for Keep the exact local transcript", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
    const rename = page.getByRole("dialog", { name: "Rename chat", exact: true });
    await rename.getByRole("textbox", { name: "Name", exact: true }).fill("Transcript review");
    await rename.getByRole("button", { name: "Rename", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Actions for Transcript review", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Actions for Transcript review", exact: true }).click();
    await page.getByRole("menuitem", { name: "Pin", exact: true }).click();
    const pinned = page
      .locator('[data-slot="collapsible"]')
      .filter({ has: page.getByRole("button", { name: "Pinned", exact: true }) });
    await expect(
      pinned.getByRole("button", { name: "Transcript review", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Pinned", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pinned", exact: true })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await page.getByRole("button", { name: "Pinned", exact: true }).click();
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(page.url()).origin,
    });
    await page.getByRole("button", { name: "Actions for Transcript review", exact: true }).click();
    await page.getByRole("menuitem", { name: "Share link", exact: true }).click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await tab(page, "Data controls");
    await page.getByRole("button", { name: "Manage", exact: true }).first().click();
    const links = page.getByRole("dialog", { name: "Shared links", exact: true });
    await expect(links).toContainText("Transcript review");
    const url = await links
      .getByRole("link", { name: "Open local shared chat", exact: true })
      .getAttribute("href");
    expect(url).toContain("shared=");
    const sharedPage = await context.newPage();
    await sharedPage.goto(url!);
    await expect(sharedPage.locator(".echo-message.user")).toContainText(
      "Keep the exact local transcript",
    );
    await expect(sharedPage.locator(".wf-header")).toContainText("Transcript review");
    await sharedPage.close();
    await page.keyboard.press("Escape");
    await openSidebar(page, width);
    await page.getByRole("button", { name: "Actions for Transcript review", exact: true }).click();
    await page.getByRole("menuitem", { name: "Schedule", exact: true }).click();
    const schedule = page.getByRole("dialog", { name: "New Task", exact: true });
    await expect(schedule).toBeVisible();
    await expect(schedule.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(
      "Transcript review",
    );
    await expect(schedule.getByRole("textbox", { name: "Prompt", exact: true })).toHaveValue(
      "Keep the exact local transcript",
    );
    await schedule.getByRole("button", { name: "Add Task", exact: true }).click();
    await expect(
      page.locator(".echo-schedule-row").filter({ hasText: "Transcript review" }),
    ).toContainText("Active");
    await page.getByRole("button", { name: "New Task", exact: true }).click();
    await expect(schedule.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("");
    await expect(schedule.getByRole("textbox", { name: "Prompt", exact: true })).toHaveValue("");
    await schedule.getByRole("button", { name: "Cancel", exact: true }).click();
    await openSidebar(page, width);
    await page.getByRole("button", { name: "Actions for Transcript review", exact: true }).click();
    await page.getByRole("menuitem", { name: "Archive", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Actions for Transcript review", exact: true }),
    ).toHaveCount(0);
    if (width < 768) await page.getByRole("button", { name: "Close chats", exact: true }).click();
    await settings(page, width, "Data controls");
    await page.getByRole("button", { name: "Manage", exact: true }).nth(1).click();
    await expect(page.getByRole("dialog", { name: "Archived chats", exact: true })).toContainText(
      "Transcript review",
    );
    await page.keyboard.press("Escape");
    await healthy(page);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath("row-actions-data-consistency.png") });
  });
}

for (const width of [1440, 390]) {
  test(`Echo ${width} actual free avatar upload survives Save and Cancel without Blob or render errors`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto("/#/template-preview/echo");
    await expect(
      page.getByRole("heading", { name: "How can I help you?", exact: true }),
    ).toBeVisible();
    await settings(page, width, "My Profile");
    await page.getByLabel("Upload profile image", { exact: true }).setInputFiles({
      name: "bricklane-avatar.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#e1ebff"/><circle cx="20" cy="18" r="10" fill="#3456a0"/></svg>',
      ),
    });
    const avatar = page.locator(".workspace-settings-avatar img");
    await expect(avatar).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(avatar).toHaveCount(0);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(avatar).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
    await openSidebar(page, width);
    await expect(
      page.getByRole("button", { name: "Account menu", exact: true }).locator("img"),
    ).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
    await page.getByRole("button", { name: "New Chat", exact: true }).click();
    await settings(page, width, "My Profile");
    await expect(avatar).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
    await healthy(page);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath("avatar-saved-and-restored.png") });
  });
}
