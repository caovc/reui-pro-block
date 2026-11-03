import { expect, test, type Locator } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light" });

async function stable(root: Locator) {
  await expect
    .poll(() =>
      root.evaluate((element) => {
        const css = getComputedStyle(element);
        return {
          opacity: css.opacity,
          identity: css.transform === "none" || css.transform === "matrix(1, 0, 0, 1, 0, 0)",
          running: element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === "running" || animation.pending).length,
        };
      }),
    )
    .toEqual({ opacity: "1", identity: true, running: 0 });
}

for (const width of [1440, 390]) {
  test(`Flux domain ${width}: independent time zones, support-email validation, five-section save and local avatar`, async ({
    page,
  }) => {
    const mobile = width === 390;
    await page.setViewportSize({ width, height: mobile ? 844 : 1000 });
    await page.goto("/#/template-preview/flux");
    if (mobile) {
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await stable(page.locator('[data-slot="sidebar"][data-mobile="true"]'));
    }
    const trigger = page.getByRole("button", { name: "Open workspace menu", exact: true });
    await trigger.click();
    await page.getByRole("menuitem", { name: /^Profile/ }).click();
    const panel = page.locator('[data-workflow-account="flux"]');
    await stable(panel);
    await panel.getByRole("combobox", { name: "Time zone", exact: true }).click();
    await page.getByRole("option", { name: /^\(GMT\+0\) London/ }).click();
    await panel.getByRole("tab", { name: "Preferences", exact: true }).click();
    await expect(panel.getByRole("combobox", { name: "Time zone", exact: true })).toHaveText(
      "(GMT-5) New York",
    );
    await panel.getByRole("combobox", { name: "First day of week", exact: true }).click();
    await page.getByRole("option", { name: /^Sunday/ }).click();
    await panel.getByRole("tab", { name: "Workspace", exact: true }).click();
    const support = panel.getByRole("textbox", { name: "Support email", exact: true });
    await support.fill("invalid");
    await expect(panel.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    await support.fill("ops.validation@bricklane.example");
    await panel.getByRole("switch", { name: "External sharing", exact: true }).uncheck();
    await panel.getByRole("tab", { name: "Team", exact: true }).click();
    await panel.getByRole("switch", { name: "Member invites", exact: true }).check();
    await panel.getByRole("tab", { name: "Billing", exact: true }).click();
    await panel.getByRole("textbox", { name: "Purchase order", exact: true }).fill(`BL-${width}`);
    await panel.getByRole("tab", { name: "Profile", exact: true }).click();
    await panel.getByLabel("Upload profile avatar", { exact: true }).setInputFiles({
      name: "original-brick.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="4" y="8" width="40" height="32" rx="6" fill="#0d9488"/></svg>',
      ),
    });
    await expect(panel.getByRole("button", { name: "Save changes", exact: true })).toBeEnabled();
    await panel.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger.locator("img")).toHaveAttribute("src", /^data:image\/svg\+xml;base64,/);
    await trigger.click();
    await page.getByRole("menuitem", { name: /^Profile/ }).click();
    await stable(panel);
    await expect(panel.getByRole("combobox", { name: "Time zone", exact: true })).toHaveText(
      "(GMT+0) London",
    );
    await panel.getByRole("tab", { name: "Workspace", exact: true }).click();
    await expect(support).toHaveValue("ops.validation@bricklane.example");
    await expect(
      panel.getByRole("switch", { name: "External sharing", exact: true }),
    ).not.toBeChecked();
    await panel.getByRole("tab", { name: "Team", exact: true }).click();
    await expect(panel.getByRole("switch", { name: "Member invites", exact: true })).toBeChecked();
    await panel.getByRole("tab", { name: "Billing", exact: true }).click();
    await expect(panel.getByRole("textbox", { name: "Purchase order", exact: true })).toHaveValue(
      `BL-${width}`,
    );
    await panel.getByRole("tab", { name: "Preferences", exact: true }).click();
    await expect(panel.getByRole("combobox", { name: "Time zone", exact: true })).toHaveText(
      "(GMT-5) New York",
    );
    await expect(
      panel.getByRole("combobox", { name: "First day of week", exact: true }),
    ).toHaveText("Sunday");
    await panel.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

for (const width of [1440, 390]) {
  test(`Flux account ${width}: real five-section Pro panel, preserved Workspace and native Sidebar focus`, async ({
    page,
  }, info) => {
    const mobile = width === 390;
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) faults.push(message.text());
    });
    await page.setViewportSize({ width, height: mobile ? 844 : 1000 });
    await page.goto("/#/template-preview/flux");
    await expect(page.locator(".wf-root.wf-agentops")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const opener = page.getByRole("button", { name: "Open navigation", exact: true });
    if (mobile) {
      await opener.click();
      await stable(page.locator('[data-slot="sidebar"][data-mobile="true"]'));
    }
    const sidebar = page.locator('[data-slot="sidebar-inner"]:visible');
    const mobileSidebar = page.locator('[data-slot="sidebar"][data-mobile="true"]');
    const scope = mobile ? mobileSidebar : sidebar;
    const trigger = page.getByRole("button", { name: "Open workspace menu", exact: true });
    await expect(trigger).toBeVisible();
    const headerBox = await scope.locator('[data-slot="sidebar-header"]').boundingBox();
    const footerBox = await scope.locator('[data-slot="sidebar-footer"]').boundingBox();
    expect(headerBox?.height).toBe(56);
    expect(footerBox?.height).toBe(52);
    expect(footerBox?.y).toBe(mobile ? 792 : 940);
    const limit = scope.locator('.wf-flux-spending-limit[data-slot="frame"]');
    await expect(limit).toBeVisible();
    await expect(limit.locator('[data-slot="frame-panel-header"]')).toHaveText("Spending Limit");
    const progress = limit.getByRole("progressbar", { name: "Workspace spending limit" });
    await expect(progress).toHaveAttribute("aria-valuenow", "66");
    await expect(progress.locator('[data-slot="progress-track"]')).toHaveCSS("height", "6px");
    await expect(progress.locator('[data-slot="progress-indicator"]')).toBeAttached();

    await scope.getByRole("button", { name: "Settings", exact: true }).click();
    await scope.getByRole("button", { name: "Workspace", exact: true }).click();
    await expect(page.locator(".flux-settings-page")).toBeVisible();
    await expect(page.locator('[data-workflow-account="flux"]')).toHaveCount(0);
    await expect(page.locator('.flux-settings-page [data-slot="frame-panel-header"]')).toHaveText([
      "Autonomy",
      "Run defaults",
      "Operators",
      "Trace retention",
    ]);
    if (mobile) await expect(mobileSidebar).toBeVisible();

    await trigger.click();
    await expect(page.getByRole("menuitem", { name: "Atlas", exact: true })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Relay", exact: true })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Orbit", exact: true })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Workspace", exact: true })).toHaveCount(0);
    await page.getByRole("menuitemradio", { name: "Dark theme", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    const background = await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await expect(page.locator(".wf-root.wf-agentops")).toHaveCSS("background-color", background);
    if (mobile) {
      await expect(mobileSidebar).toHaveCSS("background-color", background);
      await expect(mobileSidebar.locator(".wf-brand")).toHaveCSS("margin-bottom", "0px");
    }
    await page.getByRole("menu").press("Escape");
    await page.screenshot({ path: info.outputPath("flux-sidebar-dark.png") });
    await trigger.click();
    await page.getByRole("menuitem", { name: /^Profile/ }).click();
    const panel = page.locator('[data-workflow-account="flux"]');
    await stable(panel);
    await expect(panel.getByRole("tab")).toHaveText([
      "Profile",
      "Workspace",
      "Team",
      "Billing",
      "Preferences",
    ]);
    const panelBox = await panel.boundingBox();
    expect(panelBox?.width).toBe(mobile ? 366 : 960);
    expect(panelBox?.height).toBeCloseTo(mobile ? 742.71875 : 768, 1);
    if (mobile) await expect(mobileSidebar).toBeVisible();
    await expect(panel.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue(
      "Nick Bold",
    );
    const role = panel.getByRole("combobox", { name: "Role", exact: true });
    await role.click();
    await expect(page.getByRole("option")).toHaveText([
      "OwnerFull control, including billing",
      "OperatorRuns agents and clears approvals",
      "ViewerRead-only across the workspace",
    ]);
    await page.getByRole("listbox").press("Escape");
    await expect(role).toBeFocused();
    for (const [section, field, value] of [
      ["Workspace", "Workspace name", "Bricklane Agent Operations"],
      ["Team", "Invite domain", "agentops.bricklane.example"],
      ["Billing", "Legal name", "Bricklane Agent Operations Inc."],
    ]) {
      await panel.getByRole("tab", { name: section, exact: true }).click();
      await expect(panel.getByRole("textbox", { name: field, exact: true })).toHaveValue(value);
    }
    await panel.getByRole("tab", { name: "Preferences", exact: true }).click();
    await expect(panel.getByRole("combobox", { name: "Digest cadence", exact: true })).toHaveText(
      "Weekly summary",
    );
    await panel.getByRole("tab", { name: "Profile", exact: true }).click();
    await page.screenshot({ path: info.outputPath("flux-account-layout.png") });
    await writeFile(
      info.outputPath("layout.json"),
      JSON.stringify({ width, headerBox, footerBox, panelBox }, null, 2),
    );
    await panel.getByRole("textbox", { name: "Full name", exact: true }).fill("Cancelled draft");
    await panel.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    if (mobile) await expect(mobileSidebar).toBeVisible();
    await trigger.click();
    await page.getByRole("menuitem", { name: /^Profile/ }).click();
    await stable(panel);
    await expect(panel.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue(
      "Nick Bold",
    );
    const savedName = `Flux operator ${width}`;
    await panel.getByRole("textbox", { name: "Full name", exact: true }).fill(savedName);
    await panel.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText(savedName);
    await expect(page.locator("html")).toHaveClass(/dark/);
    await trigger.click();
    await page.getByRole("menuitem", { name: /^Profile/ }).click();
    await stable(panel);
    await expect(panel.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue(
      savedName,
    );
    await panel.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    if (mobile) {
      await scope.getByRole("button", { name: "Overview", exact: true }).click();
      await expect(mobileSidebar).toBeVisible();
      await mobileSidebar.press("Escape");
      await expect(mobileSidebar).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(faults).toEqual([]);
  });
}

for (const width of [1440, 390]) {
  test(`Flux preference theme ${width}: Cancel preserves appearance and Save uses the global theme API`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/template-preview/flux");
    if (width === 390) {
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await stable(page.locator('[data-slot="sidebar"][data-mobile="true"]'));
    }
    const trigger = page.getByRole("button", { name: "Open workspace menu", exact: true });
    const panel = page.locator('[data-workflow-account="flux"]');
    await trigger.click();
    await page.getByRole("menuitem", { name: "Preferences", exact: true }).click();
    await stable(panel);
    await panel.getByRole("combobox", { name: "Theme", exact: true }).click();
    await page.getByRole("option", { name: /^Dark/ }).click();
    await panel.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    for (const label of ["Dark", "Light", "System"]) {
      await trigger.click();
      await page.getByRole("menuitem", { name: "Preferences", exact: true }).click();
      await stable(panel);
      await panel.getByRole("combobox", { name: "Theme", exact: true }).click();
      await page.getByRole("option", { name: new RegExp(`^${label}`) }).click();
      await panel.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(panel).toHaveCount(0);
      await expect(trigger).toBeFocused();
      if (label === "Dark") await expect(page.locator("html")).toHaveClass(/dark/);
      else await expect(page.locator("html")).not.toHaveClass(/dark/);
      if (width === 390) {
        const sidebar = page.locator('[data-slot="sidebar"][data-mobile="true"]');
        const bodyBackground = await page
          .locator("body")
          .evaluate((element) => getComputedStyle(element).backgroundColor);
        await expect(sidebar).toHaveCSS("background-color", bodyBackground);
        const active = sidebar.getByRole("button", { name: "Overview", exact: true });
        const activeBackground = label === "Dark" ? "oklch(0.269 0 0)" : "oklch(0.97 0 0)";
        await expect(active).toHaveCSS("background-color", activeBackground);
        await expect(active).toHaveCSS(
          "color",
          label === "Dark" ? "oklch(0.985 0 0)" : "oklch(0.205 0 0)",
        );
        const hovered = sidebar.getByRole("button", { name: "Runs", exact: true });
        await hovered.hover();
        await expect(hovered).toHaveCSS("background-color", activeBackground);
      }
      await trigger.click();
      await expect(
        page.getByRole("menuitemradio", { name: `${label} theme`, exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await page.getByRole("menu").press("Escape");
    }
  });
}
