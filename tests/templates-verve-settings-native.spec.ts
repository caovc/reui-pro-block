import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const query = "?native=verve-settings";
const mount = "/template-preview/verve";

async function open(page: Page, suffix: string) {
  await page.goto(`/#${mount}${suffix}${query}`);
  await expect(page.locator(".bt-main .bt-content")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function hashIs(page: Page, suffix: string) {
  await expect(page).toHaveURL((url) => url.hash === `#${mount}${suffix}${query}`);
}

async function sidebar(page: Page, phone: boolean, label: string) {
  if (phone) await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("button", { name: label, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function accountProfile(page: Page, phone: boolean) {
  if (phone) await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("button", { name: /^Open account menu for / }).click();
  await page.getByRole("menuitem", { name: "Profile", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Profile", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function checked(control: Locator, value: boolean) {
  if (value) await expect(control).toBeChecked();
  else await expect(control).not.toBeChecked();
}

async function capture(page: Page, info: TestInfo, label: string) {
  const path = info.outputPath(`${label}.png`);
  await page.screenshot({ path });
  await info.attach(label, { path, contentType: "image/png" });
}

async function noPageOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000, phone: false },
  { name: "phone", width: 390, height: 844, phone: true },
]) {
  test.describe(`Verve settings ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("routes, native history, General save and independent integration state", async ({
      page,
    }, info) => {
      await open(page, "/settings");
      const name = page.getByRole("textbox", { name: "Workspace name", exact: true });
      await expect(name).toBeVisible();
      await capture(page, info, "general-initial");
      await name.fill("");
      await page.getByRole("button", { name: "Save workspace", exact: true }).click();
      await expect(page.getByText("Enter a workspace name.", { exact: true })).toBeVisible();
      const savedName = `Native Workspace ${viewport.width}`;
      await name.fill(savedName);
      await page.getByRole("button", { name: "Save workspace", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Save workspace", exact: true }),
      ).toBeDisabled();

      await sidebar(page, viewport.phone, "Integrations");
      await hashIs(page, "/settings/integrations");
      const slack = page.getByRole("switch", { name: "Enable Slack", exact: true });
      const supabase = page.getByRole("switch", { name: "Enable Supabase", exact: true });
      await expect(slack).toBeChecked();
      await capture(page, info, "integrations-initial");
      await slack.click();
      await expect(slack).not.toBeChecked();
      await expect(supabase).toBeChecked();
      await sidebar(page, viewport.phone, "API Keys");
      await hashIs(page, "/settings/api-keys");
      await page.goBack();
      await hashIs(page, "/settings/integrations");
      await expect(slack).not.toBeChecked();
      await expect(supabase).toBeChecked();
      await page.goForward();
      await hashIs(page, "/settings/api-keys");
      await sidebar(page, viewport.phone, "Billing");
      await hashIs(page, "/settings/billing");
      await expect(page.getByRole("heading", { name: "Plan", exact: true })).toBeVisible();
      await sidebar(page, viewport.phone, "Team Members");
      await hashIs(page, "/settings/team");
      await expect(
        page.getByRole("textbox", { name: "Search members", exact: true }),
      ).toBeVisible();
      await sidebar(page, viewport.phone, "General");
      await expect(name).toHaveValue(savedName);
      await accountProfile(page, viewport.phone);
      await hashIs(page, "/account/profile");
      await noPageOverflow(page);
    });

    test("account validation, Cancel/Save, native tabs and independent notification state", async ({
      page,
    }, info) => {
      await open(page, "/account/profile");
      const profile = page.locator(".vs-profile-card");
      const name = page.getByRole("textbox", { name: "Full name", exact: true });
      // Email's accessible label includes its native Verified badge in the initial state.
      const email = page.getByRole("textbox", { name: /^Email address/ });
      await expect(name).toBeVisible();
      await capture(page, info, "profile-initial");
      const originalName = await name.inputValue();
      const originalEmail = await email.inputValue();
      await name.fill("");
      await email.fill("invalid");
      await profile.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(page.getByText("Enter your full name.", { exact: true })).toBeVisible();
      await expect(page.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
      await profile.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(name).toHaveValue(originalName);
      await expect(email).toHaveValue(originalEmail);
      const savedName = `Native Analyst ${viewport.width}`;
      await name.fill(savedName);
      await profile.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(
        page.getByRole("status").filter({ hasText: "Profile saved in this preview." }),
      ).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Phone number", exact: true })).toBeVisible();

      await page.getByRole("tab", { name: "Preferences", exact: true }).click();
      await hashIs(page, "/account/preferences");
      const receipts = page.getByRole("switch", { name: "Read receipts", exact: true });
      await expect(receipts).toBeVisible();
      await capture(page, info, "preferences-initial");
      const initialReceipts = await receipts.isChecked();
      await receipts.click();
      await checked(receipts, !initialReceipts);
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await checked(receipts, initialReceipts);
      await page.getByRole("tab", { name: "Notifications", exact: true }).click();
      await hashIs(page, "/account/notifications");
      const assigned = page.getByRole("checkbox", {
        name: "Deal assigned to you via Email",
        exact: true,
      });
      const approaching = page.getByRole("checkbox", {
        name: "Close date approaching via Email",
        exact: true,
      });
      await expect(assigned).toBeChecked();
      await capture(page, info, "notifications-initial");
      await assigned.click();
      await expect(assigned).not.toBeChecked();
      await expect(approaching).toBeChecked();
      await sidebar(page, viewport.phone, "General");
      await accountProfile(page, viewport.phone);
      await expect(name).toHaveValue(savedName);
      await page.getByRole("tab", { name: "Notifications", exact: true }).click();
      await expect(assigned).not.toBeChecked();
      await expect(approaching).toBeChecked();
      await noPageOverflow(page);
    });

    test("API native dialog focus, validation, options and record-scoped mutation", async ({
      page,
    }, info) => {
      await open(page, "/settings/api-keys");
      const create = page.getByRole("button", { name: "Create Key", exact: true });
      await expect(create).toBeVisible();
      await capture(page, info, "api-keys-initial");
      await create.click();
      const dialog = page.getByRole("dialog", { name: "Create API Key", exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("#vv-key-name")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(create).toBeFocused();

      const add = page.getByRole("button", { name: "Add Key", exact: true });
      await add.click();
      await dialog.getByRole("button", { name: "Create Key", exact: true }).click();
      await expect(dialog.getByText("Enter a key name.", { exact: true })).toBeVisible();
      const keyName = `Native worker ${viewport.width}`;
      await dialog.locator("#vv-key-name").fill(keyName);
      await dialog.locator("#vv-key-environment").click();
      await page
        .getByRole("option", { name: "StagingPre-release integration testing.", exact: true })
        .click();
      await expect(dialog.locator("#vv-key-environment")).toContainText("Staging");
      await dialog.locator("#vv-key-expiration").click();
      await page.keyboard.press("Home");
      await expect(page.getByRole("option", { name: "30 days", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(dialog.locator("#vv-key-expiration")).toContainText("30 days");
      await dialog.getByRole("checkbox", { name: "Write deals", exact: true }).click();
      await expect(
        dialog.getByRole("checkbox", { name: "Write deals", exact: true }),
      ).toBeChecked();
      await dialog.getByRole("button", { name: "Create Key", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(add).toBeFocused();
      const row = page
        .locator(".vv-key-row")
        .filter({ has: page.getByText(keyName, { exact: true }) });
      await expect(row).toContainText("Staging");
      const other = page.getByRole("textbox", { name: "Server default value", exact: true });
      const originalOtherValue = await other.inputValue();
      await row.getByRole("button", { name: `Reveal ${keyName}`, exact: true }).click();
      await expect(row.getByRole("textbox", { name: `${keyName} value`, exact: true })).toHaveValue(
        /bk_demo_secret_.*_v1/,
      );
      await row.getByRole("button", { name: `Rotate ${keyName}`, exact: true }).click();
      await row.getByRole("button", { name: `Reveal ${keyName}`, exact: true }).click();
      await expect(row.getByRole("textbox", { name: `${keyName} value`, exact: true })).toHaveValue(
        /_v2$/,
      );
      await expect(other).toHaveValue(originalOtherValue);
      await row.getByRole("button", { name: `Revoke ${keyName}`, exact: true }).click();
      await expect(row.getByRole("textbox", { name: `${keyName} value`, exact: true })).toHaveValue(
        "Revoked",
      );
      await expect(other).toHaveValue(originalOtherValue);
      await sidebar(page, viewport.phone, "General");
      await sidebar(page, viewport.phone, "API Keys");
      await expect(row.getByRole("textbox", { name: `${keyName} value`, exact: true })).toHaveValue(
        "Revoked",
      );
      await noPageOverflow(page);
    });

    test("Webhook native Sheet focus, event selection and cross-navigation state", async ({
      page,
    }, info) => {
      await open(page, "/settings/webhooks");
      const pipeline = page.getByRole("switch", {
        name: "Toggle https://studio.bricklane.test/webhooks/pipeline",
        exact: true,
      });
      const contacts = page.getByRole("switch", {
        name: "Toggle https://studio.bricklane.test/webhooks/contacts",
        exact: true,
      });
      await expect(pipeline).toBeVisible();
      await capture(page, info, "webhooks-initial");
      await pipeline.click();
      await expect(pipeline).not.toBeChecked();
      await expect(contacts).toBeChecked();
      const add = page.getByRole("button", { name: "Add Endpoint", exact: true });
      await add.click();
      const dialog = page.getByRole("dialog", { name: "Add endpoint", exact: true });
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(add).toBeFocused();
      await add.click();
      await dialog.getByRole("button", { name: "Add endpoint", exact: true }).click();
      await expect(dialog.getByText("Enter an endpoint name.", { exact: true })).toBeVisible();
      await expect(dialog.getByText("Select at least one event.", { exact: true })).toBeVisible();
      await dialog.locator("#vv-endpoint-name").fill(`Native endpoint ${viewport.width}`);
      const hostPath = `native.bricklane.test/webhooks/native-${viewport.width}`;
      await dialog.locator("#vv-endpoint-url").fill(hostPath);
      const all = dialog.getByRole("checkbox", { name: /^Select all / });
      await all.click();
      await expect(all).toBeChecked();
      const won = dialog.getByRole("checkbox", { name: "deal.won", exact: true });
      await won.click();
      await expect(all).toHaveAttribute("aria-checked", "mixed");
      await won.click();
      await expect(all).toBeChecked();
      await dialog.getByRole("switch", { name: "Enable immediately", exact: true }).click();
      await dialog.getByRole("button", { name: "Add endpoint", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(add).toBeFocused();
      const added = page.getByRole("switch", { name: `Toggle https://${hostPath}`, exact: true });
      await expect(added).not.toBeChecked();
      await expect(pipeline).not.toBeChecked();
      await expect(contacts).toBeChecked();
      await sidebar(page, viewport.phone, "API Keys");
      await sidebar(page, viewport.phone, "Webhooks");
      await expect(added).not.toBeChecked();
      await expect(pipeline).not.toBeChecked();
      await expect(contacts).toBeChecked();
      await noPageOverflow(page);
    });

    test("Team native filters, pagination, creatable email tokens and local invitation", async ({
      page,
    }, info) => {
      await open(page, "/settings/team");
      const rows = page.locator(".vp-members-table tbody tr");
      await expect(rows).toHaveCount(5);
      await capture(page, info, "team-initial");
      const filters = page.getByRole("button", { name: "Filter members", exact: true });
      await filters.click();
      const support = page.getByRole("menuitemcheckbox", { name: "Support", exact: true });
      await support.click();
      await expect(support).toHaveAttribute("aria-checked", "true");
      await page.keyboard.press("Escape");
      await expect(filters).toBeFocused();
      await expect(rows).toHaveCount(2);
      await expect(rows.filter({ hasText: "Emil Rao" })).toHaveCount(1);
      await expect(rows.filter({ hasText: "Ava Mercer" })).toHaveCount(0);
      await filters.click();
      await support.click();
      await page.keyboard.press("Escape");
      await expect(rows).toHaveCount(5);
      await page.getByRole("button", { name: "Go to next page", exact: true }).click();
      await expect(rows).toHaveCount(4);
      await expect(rows.filter({ hasText: "Malik Hughes" })).toHaveCount(1);
      await page.getByRole("button", { name: "Go to previous page", exact: true }).click();
      const add = page.getByRole("button", { name: "Add member", exact: true });
      await add.click();
      const dialog = page.getByRole("dialog", { name: "Add member", exact: true });
      const email = dialog.locator("#verve-invite-email");
      await email.fill("invalid");
      await page.keyboard.press("Enter");
      await expect(dialog.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
      const address = `native.member.${viewport.width}@bricklane.test`;
      await email.fill(address);
      await page.keyboard.press("Enter");
      await expect(
        dialog.locator('[data-slot="combobox-chip"]').filter({ hasText: address }),
      ).toBeVisible();
      await dialog.locator("#verve-invite-role").click();
      await page.getByRole("option", { name: "RevOps", exact: true }).click();
      await dialog.locator("#verve-invite-authentication").click();
      await page.getByRole("option", { name: "Passwordless", exact: true }).click();
      await dialog.getByRole("switch", { name: "Send invite email", exact: true }).click();
      await dialog.getByRole("button", { name: "Send invites", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(add).toBeFocused();
      const search = page.getByRole("textbox", { name: "Search members", exact: true });
      await search.fill(address);
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText("RevOps");
      await expect(rows).toContainText("Passwordless");
      await expect(rows).toContainText("Pending invoice");
      await sidebar(page, viewport.phone, "Billing");
      await sidebar(page, viewport.phone, "Team Members");
      await expect(search).toHaveValue(address);
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText(address);
      await search.fill("no-such-member");
      await expect(page.getByText("No members match your search.", { exact: true })).toBeVisible();
      await noPageOverflow(page);
    });

    test("Billing native Cancel/Save validation, local company card and persistent summary", async ({
      page,
    }, info) => {
      await open(page, "/settings/billing");
      const edit = page.getByRole("button", { name: "Edit details", exact: true });
      await expect(edit).toBeVisible();
      await capture(page, info, "billing-initial");
      await edit.click();
      const dialog = page.getByRole("dialog", { name: "Edit billing details", exact: true });
      const contact = dialog.getByRole("textbox", { name: "Billing contact", exact: true });
      const legal = dialog.getByRole("textbox", { name: "Legal entity", exact: true });
      const initialContact = await contact.inputValue();
      const initialLegal = await legal.inputValue();
      await contact.fill("invalid");
      await legal.fill("");
      await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(dialog.getByText("Enter a valid billing email.", { exact: true })).toBeVisible();
      await expect(dialog.getByText("Enter a legal entity.", { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(edit).toBeFocused();
      await edit.click();
      await expect(contact).toHaveValue(initialContact);
      await expect(legal).toHaveValue(initialLegal);
      const savedContact = `native.billing.${viewport.width}@bricklane.test`;
      const savedLegal = `Native Studio ${viewport.width}`;
      await contact.fill(savedContact);
      await legal.fill(savedLegal);
      await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(edit).toBeFocused();
      await expect(page.locator(".vp-billing-rows")).toContainText(savedContact);
      const add = page.getByRole("button", { name: "Add company card", exact: true });
      await add.click();
      const card = page.getByRole("dialog", { name: "Add company card", exact: true });
      await card.getByRole("button", { name: "Add card", exact: true }).click();
      await expect(card.getByText("Enter a cardholder name.", { exact: true })).toBeVisible();
      await card
        .getByRole("textbox", { name: "Cardholder name", exact: true })
        .fill("Native Demo Card");
      await card
        .getByRole("textbox", { name: "Card number", exact: true })
        .fill("4242424242424242");
      await card.getByRole("textbox", { name: "Expiry", exact: true }).fill("12/30");
      await card.getByRole("textbox", { name: "CVC", exact: true }).fill("123");
      await card.getByRole("textbox", { name: "Billing ZIP", exact: true }).fill("SW1A 1AA");
      await card.getByRole("button", { name: "Add card", exact: true }).click();
      await expect(card).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Update company card", exact: true }),
      ).toBeFocused();
      await expect(page.locator(".vp-billing-rows")).toContainText("Card ending 4242");
      await sidebar(page, viewport.phone, "Team Members");
      await sidebar(page, viewport.phone, "Billing");
      await expect(page.locator(".vp-billing-rows")).toContainText(savedContact);
      await expect(page.locator(".vp-billing-rows")).toContainText(savedLegal);
      await expect(page.locator(".vp-billing-rows")).toContainText("Card ending 4242");
      await noPageOverflow(page);
    });
  });
}
