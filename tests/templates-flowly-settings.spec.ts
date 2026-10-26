import { expect, test, type Page } from "@playwright/test";

test.use({ deviceScaleFactor: 1, colorScheme: "light" });
const routes = [
  ["general", "#settings-workspace-name"],
  ["members", "input[aria-label='Search members']"],
  ["billing", "#settings-billing-email"],
  ["execution", "#settings-step-timeout"],
  ["ai-models", "#settings-model"],
  ["integrations", "button[aria-label='Open Slack actions']"],
  ["webhooks", "button[aria-label='Open api.brick.test/hooks/runs actions']"],
  ["audit-log", "#settings-audit-retention"],
  ["profile", "#settings-full-name"],
  ["security", "#settings-verification"],
] as const;
const titles: Record<string, string> = {
  general: "General",
  members: "Members",
  billing: "Billing",
  execution: "Execution",
  "ai-models": "AI Models",
  integrations: "Integrations",
  webhooks: "Webhooks",
  "audit-log": "Audit Log",
  profile: "Profile",
  security: "Security",
};
let errors: string[] = [];
let external: string[] = [];
test.beforeEach(async ({ page }) => {
  errors = [];
  external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.method() !== "HEAD" && request.method() !== "OPTIONS")
      external.push(`${request.method()} ${request.url()}`);
  });
});
test.afterEach(async ({ page }) => {
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
async function open(page: Page, section: string, width = 1440) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/flowly", { waitUntil: "networkidle" });
  if (width === 390)
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await route(page, titles[section]);
  await expect(page.locator(".fs-workspace")).toHaveAttribute("data-settings-section", section);
  await page.evaluate(() => document.fonts.ready);
}
async function route(page: Page, name: string) {
  if (page.viewportSize()?.width === 390) {
    if (!(await page.getByRole("dialog").count()))
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await page.keyboard.press("Escape");
  } else await page.locator(".fs-secondary").getByRole("button", { name, exact: true }).click();
}
async function undo(page: Page, title: string) {
  await page
    .locator("[data-sonner-toast]")
    .filter({ hasText: title })
    .getByRole("button", { name: "Undo", exact: true })
    .click();
}
for (const width of [1440, 390])
  for (const [section, ready] of routes)
    test(`${section}: ${width} distinct route renders without document overflow`, async ({
      page,
    }, info) => {
      await open(page, section, width);
      await expect(page.locator(ready)).toBeVisible();
      if (!["members", "integrations", "webhooks"].includes(section))
        await expect(
          page
            .locator(".fs-page")
            .getByRole("button", { name: /^(Save|Save Changes|Cancel|Discard)$/i }),
        ).toHaveCount(0);
      await page.screenshot({
        path: info.outputPath(`${section}-${width}.png`),
        animations: "disabled",
      });
    });
const states = [
  ["general", "settings-workspace-name", "Bricklane Labs", "Review workspace"],
  ["billing", "settings-billing-email", "billing@brick.test", "review@example.com"],
  ["ai-models", "settings-token-budget", "40", "75"],
  [
    "audit-log",
    "settings-audit-note",
    "Exports are reviewed by workspace owners before sharing externally.",
    "Review draft",
  ],
  ["profile", "settings-full-name", "Nick Bold", "Review Name"],
] as const;
for (const [section, id, initial, draft] of states)
  test(`${section}: transient form resets on route return and reload`, async ({ page }) => {
    await open(page, section);
    await page.locator(`#${id}`).fill(draft);
    await expect(page.locator(`#${id}`)).toHaveValue(draft);
    await route(page, "Members");
    await route(page, titles[section]);
    await expect(page.locator(`#${id}`)).toHaveValue(initial);
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await route(page, titles[section]);
    await expect(page.locator(`#${id}`)).toHaveValue(initial);
  });
test("Execution and Security controls reset without a Save fiction", async ({ page }) => {
  await open(page, "execution");
  await page.locator("#settings-step-timeout").click();
  await page.getByRole("option", { name: "30 Seconds", exact: true }).click();
  await route(page, "Members");
  await route(page, "Execution");
  await expect(page.locator("#settings-step-timeout")).toHaveText("5 Minutes");
  await route(page, "Security");
  await page.getByRole("switch", { name: "Trusted Devices" }).click();
  await expect(page.getByRole("switch", { name: "Trusted Devices" })).not.toBeChecked();
  await route(page, "Members");
  await route(page, "Security");
  await expect(page.getByRole("switch", { name: "Trusted Devices" })).toBeChecked();
});
test("General grouped timezone keyboard selection, rich choices and popup font", async ({
  page,
}) => {
  await open(page, "general");
  const timezone = page.locator("#settings-timezone");
  await timezone.fill("New");
  await expect(page.getByRole("option")).toHaveCount(1);
  await expect(page.getByRole("option")).toHaveText("(GMT-5) New York");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(timezone).toHaveValue("(GMT-5) New York");
  await page.locator("#settings-language").click();
  await expect(page.getByRole("option").filter({ hasText: "Shared UI language" })).toBeVisible();
  await page.keyboard.press("Escape");
  const inputFont = await page
    .locator("#settings-workspace-name")
    .evaluate((element) => getComputedStyle(element).fontFamily);
  await page.locator("#settings-date-format").click();
  const menuFont = await page
    .getByRole("option")
    .first()
    .evaluate((element) => getComputedStyle(element).fontFamily);
  expect(menuFont.split(",")[0]).toBe(inputFont.split(",")[0]);
  await page.keyboard.press("Escape");
});
test("Profile photo uses actual validated upload and remove", async ({ page }) => {
  await open(page, "profile");
  await page.locator("#settings-photo").setInputFiles({
    name: "original.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="teal"/></svg>',
    ),
  });
  await expect(page.locator(".fs-photo img")).toHaveAttribute("src", /^blob:/);
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.locator(".fs-photo img")).toHaveCount(0);
  await page.locator("#settings-landing-view").click();
  await expect(
    page.getByRole("option").filter({ hasText: "Runs, spend and what needs you" }),
  ).toBeVisible();
});
test("Desktop inner collapse remains separate from the main rail", async ({ page }) => {
  await open(page, "general");
  const primary = page.locator('.wf-native-layout > [data-slot="sidebar"]');
  const before = await primary.boundingBox();
  expect(before?.width).toBe(63);
  await page.getByRole("button", { name: "Collapse inner sidebar", exact: true }).click();
  await expect(page.locator(".fs-secondary")).toHaveAttribute("data-collapsed", "true");
  expect((await primary.boundingBox())?.width).toBe(63);
  await page.keyboard.press("Control+b");
  await expect(page.locator(".fs-secondary")).toHaveAttribute("data-collapsed", "true");
  await page.getByRole("button", { name: "Expand inner sidebar", exact: true }).click();
  await expect(page.locator(".fs-secondary")).toHaveAttribute("data-collapsed", "false");
});
test("Members filter, search and real invitation record with Undo", async ({ page }) => {
  await open(page, "members");
  await page.getByRole("button", { name: "Filter members by status" }).click();
  await page.getByLabel("Invited", { exact: true }).check();
  await page.keyboard.press("Escape");
  await expect(page.locator(".fs-member-grid")).toContainText("Lena Wade");
  await expect(page.locator(".fs-member-grid")).not.toContainText("Hanna Berg");
  await page.getByRole("button", { name: "Filter members by status" }).click();
  await page.getByLabel("Invited", { exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Invite member", exact: true }).click();
  await page.locator("#invite-name").fill("Ana Lopez");
  await page.locator("#invite-email").fill("ana@example.com");
  await page.locator("#invite-role").fill("Automation Engineer");
  await page.locator("#invite-message").fill("Welcome to the local demo.");
  await page.getByRole("button", { name: "Send Invite", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search members" }).fill("Ana");
  await expect(page.locator(".fs-member-grid")).toContainText("Ana Lopez");
  await undo(page, "Demo invitation added");
  await expect(page.locator(".fs-member-grid")).not.toContainText("Ana Lopez");
});
test("Member access changes the real row and preserves focus", async ({ page }) => {
  await open(page, "members");
  const trigger = page.getByRole("button", { name: "Open Hanna Berg actions" });
  await trigger.click();
  await page.getByRole("menuitem", { name: "Change access", exact: true }).click();
  await page.getByRole("radio", { name: /^Viewer/ }).check();
  await page.getByRole("button", { name: "Save Access", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Viewer");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator(".fs-member-identity").filter({ hasText: "Hanna Berg" })).toContainText(
    "Viewer",
  );
});
test("Integration real draft Discard, Save, Undo, reopen and reload", async ({ page }) => {
  await open(page, "integrations");
  const manage = page.getByRole("button", { name: "Manage", exact: true }).first();
  await manage.click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  const input = page.locator("#integration-edit-target");
  await expect(page.getByRole("button", { name: "Save Changes", exact: true })).toBeDisabled();
  await input.fill("#review");
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(input).toHaveValue("#ops-alerts");
  await input.fill("#review");
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save Changes", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(manage).toBeFocused();
  await expect(page.locator(".fs-record-card").first()).toContainText("#review");
  await undo(page, "Demo integration updated");
  await expect(page.locator(".fs-record-card").first()).toContainText("#ops-alerts");
});
test("Integration three-step wizard creates only a local record", async ({ page }) => {
  await open(page, "integrations");
  await page.getByRole("button", { name: "Add Integration", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Google Calendar/ }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("#integration-new-target").fill("Team calendar");
  await dialog.getByRole("button", { name: "Test Connection", exact: true }).click();
  await expect(dialog.getByText("Demo passed", { exact: true })).toHaveCount(3);
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByRole("button", { name: "Add Integration", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.locator(".fs-record-card").filter({ hasText: "Google Calendar" }),
  ).toContainText("Connected");
  await undo(page, "Demo integration added");
  await expect(
    page.locator(".fs-record-card").filter({ hasText: "Google Calendar" }),
  ).toContainText("Needs setup");
});
test("Webhook actual dirty/Discard/Save and local delivery record", async ({ page }) => {
  await open(page, "webhooks", 390);
  await page.getByRole("button", { name: "Manage", exact: true }).first().click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  const description = page.locator("#webhook-edit-description");
  await description.fill("Review draft");
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(description).toHaveValue("Run results for the ops dashboard.");
  await description.fill("Review saved");
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save Changes", exact: true })).toBeDisabled();
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Send Test", exact: true }).click();
  await expect(page.getByRole("dialog").getByText("Demo 200", { exact: true })).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator(".fs-record-card").first()).toContainText("Review saved");
});
test("Webhook validation, creation and destructive menu Undo affect records", async ({ page }) => {
  await open(page, "webhooks");
  await page.getByRole("button", { name: "Add Endpoint", exact: true }).click();
  await page.locator("#webhook-new-url").fill("bad-url");
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Add Endpoint", exact: true }),
  ).toBeDisabled();
  await page.locator("#webhook-new-url").fill("https://local.example/demo");
  await page.locator("#webhook-new-description").fill("New local endpoint");
  await page.getByRole("dialog").getByRole("button", { name: "Add Endpoint", exact: true }).click();
  await expect(
    page.locator(".fs-record-card").filter({ hasText: "New local endpoint" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open local.example/demo actions" }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete Endpoint", exact: true }).click();
  await expect(
    page.locator(".fs-record-card").filter({ hasText: "New local endpoint" }),
  ).toHaveCount(0);
  await undo(page, "Demo endpoint deleted");
  await expect(
    page.locator(".fs-record-card").filter({ hasText: "New local endpoint" }),
  ).toBeVisible();
});
test("Security confirmation changes demo sessions and restores the action focus", async ({
  page,
}) => {
  await open(page, "security");
  const trigger = page.getByRole("button", { name: "Sign Out Everywhere", exact: true });
  await trigger.click();
  await expect(page.getByRole("alertdialog")).toContainText("No real account session is changed");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.locator(".fs-summary")).toContainText("1 local demo session remains");
  await undo(page, "Other demo sessions signed out");
  await expect(page.locator(".fs-summary")).toContainText("All checks passed");
});
test("Phone249 primary+secondary Sheet keeps selected route open and Escape focus", async ({
  page,
}) => {
  await open(page, "general", 390);
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.click();
  await expect.poll(async () => (await page.getByRole("dialog").boundingBox())?.width).toBe(249);
  await page.getByRole("dialog").getByRole("button", { name: "Billing", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator("#settings-billing-email")).toBeVisible();
});

for (const width of [1440, 390]) {
  test(`Main ${width}: full header replacement and original Invite restore across Settings`, async ({
    page,
  }) => {
    await open(page, "general", width);
    const header = page.locator(".wf-header");
    await expect(
      header.getByRole("button", { name: "Share Workspace", exact: true }),
    ).toBeVisible();
    await expect(header.getByRole("button", { name: "Invite", exact: true })).toHaveCount(0);
    await expect(header.locator(".wf-header-avatars")).toHaveCount(0);
    expect((await header.boundingBox())?.height).toBe(50);
    if (width === 390)
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    const primary = width === 390 ? page.getByRole("dialog") : page.locator(".wf-native-sidebar");
    await primary.getByRole("button", { name: "Dashboard", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".fs-workspace")).toHaveCount(0);
    const invite = header.getByRole("button", { name: "Invite", exact: true });
    await expect(invite).toBeVisible();
    await invite.click();
    const dialog = page.getByRole("dialog", { name: "Invite teammate" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(invite).toBeFocused();
  });
}

test("Main phone: Dashboard49 to Settings249 retains the same native Sheet, keyboard and footer geometry", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/template-preview/flowly", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect.poll(async () => (await dialog.boundingBox())?.width).toBe(49);
  await dialog.evaluate((element) => element.setAttribute("data-entry-proof", "same-sheet"));
  const items = dialog.locator(
    ':scope > div.h-full > [data-slot="sidebar-content"] [data-slot="sidebar-menu-button"]',
  );
  await expect(items).toHaveCount(6);
  await expect(items.nth(5)).toHaveAttribute("aria-label", "Settings");
  expect(
    await items.evaluateAll((elements) =>
      elements.map((element) => ({
        name: element.getAttribute("aria-label"),
        icon: element.querySelector("svg")?.getAttribute("class"),
      })),
    ),
  ).toEqual([
    { name: "Dashboard", icon: "lucide lucide-layout-dashboard" },
    { name: "Workflow", icon: "lucide lucide-spline-pointer" },
    { name: "Agent Builder", icon: "lucide lucide-bot" },
    { name: "Workflows", icon: "lucide lucide-workflow" },
    { name: "Agents", icon: "lucide lucide-brain-circuit" },
    { name: "Settings", icon: "lucide lucide-settings" },
  ]);

  await items.nth(5).focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveAttribute("data-entry-proof", "same-sheet");
  await expect.poll(async () => (await dialog.boundingBox())?.width).toBe(249);
  await expect(page.locator(".fs-workspace")).toHaveAttribute("data-settings-section", "root");
  const slots = await dialog
    .locator(
      ':scope > div.h-full > [data-slot="sidebar-content"],:scope > div.h-full > [data-slot="sidebar-footer"]',
    )
    .evaluateAll((elements) =>
      elements.map((element) => ({
        width: element.getBoundingClientRect().width,
        y: element.getBoundingClientRect().y,
        height: element.getBoundingClientRect().height,
        scroll: element.scrollWidth,
        client: element.clientWidth,
      })),
    );
  expect(slots).toEqual([
    { width: 48, y: 0, height: 764, scroll: 48, client: 48 },
    { width: 48, y: 764, height: 80, scroll: 48, client: 48 },
  ]);
  const general = dialog.getByRole("button", { name: "General", exact: true });
  await expect.poll(async () => (await general.boundingBox())?.x).toBe(57);
  const box = await general.boundingBox();
  expect(box?.x).toBe(57);
  expect(box?.width).toBe(183);
  expect(box?.y).toBeCloseTo(31.703125, 2);
  for (const [name, y] of [
    ["General", 31.703125],
    ["Members", 61.703125],
    ["Billing", 91.703125],
    ["Execution", 164.40625],
    ["AI Models", 194.40625],
    ["Integrations", 224.40625],
    ["Webhooks", 297.109375],
    ["Audit Log", 327.109375],
    ["Profile", 399.8125],
    ["Security", 429.8125],
  ] as const) {
    const item = await dialog.getByRole("button", { name, exact: true }).boundingBox();
    expect(item?.y, `${name} reference cumulative offset`).toBeCloseTo(y, 2);
    expect(item?.height).toBe(28);
    expect(item?.width).toBe(183);
  }

  await general.click();
  await expect(general).toHaveAttribute("aria-current", "page");
  for (const name of Object.values(titles)) {
    await dialog.getByRole("button", { name, exact: true }).click();
    const footer = dialog.locator(".fs-navigation-footer");
    const rect = await footer.boundingBox();
    expect(rect?.y, `${name} natural summary top`).toBe(746);
    expect(rect?.height, `${name} natural summary height`).toBe(98);
    expect(
      await footer
        .locator(".fs-summary > p")
        .evaluate((element) => getComputedStyle(element).lineHeight),
    ).toBe("16.5px");
  }
  await general.click();
  const avatar = dialog.locator(".wf-native-account .wf-avatar");
  const avatarBox = await avatar.boundingBox();
  expect(avatarBox).toMatchObject({ x: 12, y: 810, width: 24, height: 24 });
  await page.screenshot({
    path: info.outputPath("same-general-secondary-footer-390.png"),
    animations: "disabled",
  });
  await general.focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Members", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(1);
  await expect(page.locator(".fs-workspace")).toHaveAttribute("data-settings-section", "members");
  await page.screenshot({
    path: info.outputPath("same-sheet-secondary-390.png"),
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator(".fs-member-grid")).toBeVisible();
});

test("Main phone: nested member choice Escape closes the popup before its real drawer", async ({
  page,
}) => {
  await open(page, "members", 390);
  const invite = page.getByRole("button", { name: "Invite member", exact: true });
  await invite.click();
  const team = page.locator("#invite-team");
  await team.click();
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(team).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(invite).toBeFocused();
});

test("Main header actions export actual member, invoice and audit records", async ({
  page,
}, info) => {
  await open(page, "members");
  for (const [section, label, file, contents] of [
    ["Members", "Export Members", "bricklane-members.csv", "Hanna Berg"],
    ["Billing", "Download Invoices", "bricklane-invoices.csv", "DEMO-2026-10"],
    ["Audit Log", "Export CSV", "bricklane-audit-log.csv", "Demo workspace settings reviewed"],
  ]) {
    await route(page, section);
    const download = page.waitForEvent("download");
    await page.locator(".wf-header").getByRole("button", { name: label, exact: true }).click();
    const result = await download;
    expect(result.suggestedFilename()).toBe(file);
    const path = info.outputPath(file);
    await result.saveAs(path);
    const { readFile } = await import("node:fs/promises");
    expect(await readFile(path, "utf8")).toContain(contents);
  }
});

test("Main header local pause, model sample and password request keep their own state", async ({
  page,
}) => {
  await open(page, "execution");
  await page
    .locator(".wf-header")
    .getByRole("button", { name: "Pause All Runs", exact: true })
    .click();
  await expect(page.locator(".fs-summary")).toContainText("Paused");
  await expect(
    page.locator(".wf-header").getByRole("button", { name: "Resume All Runs", exact: true }),
  ).toBeVisible();
  await undo(page, "Demo runs paused");
  await expect(
    page.locator(".wf-header").getByRole("button", { name: "Pause All Runs", exact: true }),
  ).toBeVisible();
  await route(page, "AI Models");
  await page.locator(".wf-header").getByRole("button", { name: "Test Model", exact: true }).click();
  await expect(page.getByRole("button", { name: "Testing", exact: true })).toBeDisabled();
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: "Sample 1: 412 ms" }),
  ).toBeVisible();
  await page.locator(".wf-header").getByRole("button", { name: "Test Model", exact: true }).click();
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: "Sample 2: 412 ms" }),
  ).toBeVisible();
  await route(page, "Profile");
  await page
    .locator(".wf-header")
    .getByRole("button", { name: "Reset Password", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Sending", exact: true })).toBeDisabled();
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: "No email was sent" }),
  ).toBeVisible();
  await undo(page, "Demo reset request recorded");
});

test("Main integration saved domain survives real section changes, reload restores fixtures", async ({
  page,
}) => {
  await open(page, "integrations");
  await page.getByRole("button", { name: "Manage", exact: true }).first().click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  await page.locator("#integration-edit-target").fill("#main-saved");
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await page.keyboard.press("Escape");
  await route(page, "Members");
  await route(page, "Integrations");
  await expect(page.locator(".fs-record-card").first()).toContainText("#main-saved");
  await page.getByRole("button", { name: "Manage", exact: true }).first().click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  await expect(page.locator("#integration-edit-target")).toHaveValue("#main-saved");
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await route(page, "Integrations");
  await expect(page.locator(".fs-record-card").first()).toContainText("#ops-alerts");
});

test("Main General header copies the actual current workspace link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "general");
  await page
    .locator(".wf-header")
    .getByRole("button", { name: "Share Workspace", exact: true })
    .click();
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: "Workspace link copied" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
});
