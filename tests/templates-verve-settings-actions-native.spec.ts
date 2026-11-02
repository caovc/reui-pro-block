import { expect, test, type Page } from "@playwright/test";

const query = "?native=verve-settings-actions";
const mount = "/template-preview/verve";
async function open(page: Page, suffix: string) {
  await page.goto(`/#${mount}${suffix}${query}`);
  await expect(page.locator(".bt-main .bt-content")).toBeVisible();
}
async function sidebar(page: Page, phone: boolean, label: string) {
  if (phone) await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("button", { name: label, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function choose(page: Page, label: string, value: string) {
  const trigger = page.getByRole("combobox", { name: label, exact: true });
  await trigger.click();
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await list.getByRole("option", { name: value, exact: true }).click();
  await expect(list).toHaveCount(0);
  await expect(trigger).toBeFocused();
}
function observeWrites(page: Page) {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !["GET", "HEAD"].includes(request.method()))
      writes.push(`${request.method()} ${request.url()}`);
  });
  return writes;
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
}

for (const viewport of [
  { width: 1440, height: 1000, phone: false },
  { width: 390, height: 844, phone: true },
]) {
  test.describe(`Verve actual settings actions ${viewport.width}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("Member View and Edit retain draft cancellation, identity validation and last-admin protection", async ({
      page,
    }) => {
      const writes = observeWrites(page);
      await open(page, "/settings/team");
      const search = page.getByRole("textbox", { name: "Search members", exact: true });
      await search.fill("Ava Mercer");
      const view = page.getByRole("button", { name: "View Ava Mercer", exact: true });
      await view.press("Enter");
      const details = page.getByRole("dialog", { name: "Member details", exact: true });
      await expect(
        details.getByRole("definition").filter({ hasText: "ava.mercer@crm.bricklane.example" }),
      ).toHaveCount(1);
      await details.getByRole("button", { name: "Close", exact: true }).first().click();
      await expect(details).toHaveCount(0);
      await expect(view).toBeFocused();
      const edit = page.getByRole("button", { name: "Edit Ava Mercer", exact: true });
      await edit.press("Enter");
      const dialog = page.getByRole("dialog", { name: "Edit member", exact: true });
      const name = dialog.getByRole("textbox", { name: "Full name", exact: true });
      await expect(name).toBeFocused();
      await name.fill("");
      await dialog.getByRole("textbox", { name: "Email address", exact: true }).fill("invalid");
      await dialog.getByRole("button", { name: "Save member", exact: true }).click();
      await expect(
        dialog.getByText("Enter a name of 1 to 120 characters.", { exact: true }),
      ).toBeVisible();
      await expect(dialog.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(edit).toBeFocused();
      await edit.click();
      await expect(name).toHaveValue("Ava Mercer");
      const email = dialog.getByRole("textbox", { name: "Email address", exact: true });
      await email.fill("inez.wells@crm.bricklane.example");
      await choose(page, "Role", "Support");
      await dialog.getByRole("button", { name: "Save member", exact: true }).click();
      await expect(
        dialog.getByText("A member with this email already exists.", { exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByText("Keep at least one administrator in this local workspace.", {
          exact: true,
        }),
      ).toBeVisible();
      await choose(page, "Role", "Admin");
      await email.fill(`ava.changed.${viewport.width}@crm.bricklane.example`);
      await name.fill(`Ava Updated ${viewport.width}`);
      await dialog.getByRole("button", { name: "Save member", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      // The prior search no longer matches the renamed record, so native fallback focuses Search.
      await expect(search).toBeFocused();
      await search.fill(`Ava Updated ${viewport.width}`);
      await page
        .getByRole("button", { name: `View Ava Updated ${viewport.width}`, exact: true })
        .click();
      await expect(details).toContainText(`ava.changed.${viewport.width}@crm.bricklane.example`);
      await details.getByRole("button", { name: "Close", exact: true }).first().click();
      await noOverflow(page);
      expect(writes).toEqual([]);
    });

    test("Member Delete confirms the actual identity, Cancel preserves it and removal restores Search focus", async ({
      page,
    }) => {
      const writes = observeWrites(page);
      await open(page, "/settings/team");
      const search = page.getByRole("textbox", { name: "Search members", exact: true });
      await search.fill("Emil Rao");
      const remove = page.getByRole("button", { name: "Delete Emil Rao", exact: true });
      await remove.click();
      const confirm = page.getByRole("alertdialog", { name: "Remove Emil Rao?", exact: true });
      await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(confirm).toHaveCount(0);
      await expect(remove).toBeFocused();
      await remove.press("Enter");
      await confirm.getByRole("button", { name: "Remove member", exact: true }).click();
      await expect(
        confirm.getByText("Enter the member email to confirm removal.", { exact: true }),
      ).toBeVisible();
      await expect(
        page.locator(
          'button[data-member-id="crm-member-2"][data-member-action="delete"][aria-label="Delete Emil Rao"]',
        ),
      ).toHaveCount(1);
      await confirm
        .getByRole("textbox", { name: "Confirm member email", exact: true })
        .fill("emil.rao@crm.bricklane.example");
      await confirm.getByRole("button", { name: "Remove member", exact: true }).click();
      await expect(confirm).toHaveCount(0);
      await expect(search).toBeFocused();
      await expect(remove).toHaveCount(0);
      await expect(page.getByText("No members match your search.", { exact: true })).toBeVisible();
      await search.clear();
      await sidebar(page, viewport.phone, "Billing");
      await expect(page.locator(".vp-usage-panel")).toContainText("8 of 14");
      await noOverflow(page);
      expect(writes).toEqual([]);
    });

    test("CSV import previews quoted fields, rejects duplicates, cancels cleanly and adds actual member records", async ({
      page,
    }) => {
      const writes = observeWrites(page);
      await open(page, "/settings/team");
      const trigger = page.getByRole("button", { name: "Import", exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Import members", exact: true });
      const input = dialog.getByLabel("Upload members CSV", { exact: true });
      await input.setInputFiles({
        name: "duplicates.csv",
        mimeType: "text/csv",
        buffer: Buffer.from("name,email\nDuplicate,ava.mercer@crm.bricklane.example"),
      });
      await expect(
        dialog.getByRole("status", { name: "CSV import preview", exact: true }),
      ).toContainText("1 records, 1 invalid");
      await expect(
        dialog.getByRole("button", { name: "Import 1 members", exact: true }),
      ).toBeDisabled();
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.click();
      await input.setInputFiles({
        name: "malformed.csv",
        mimeType: "text/csv",
        buffer: Buffer.from('name,email\n"Unclosed,bad@example.com'),
      });
      await expect(
        dialog.getByText("A quoted CSV field is missing its closing quote.", { exact: true }),
      ).toBeVisible();
      const importedEmail = `harper.${viewport.width}@crm.bricklane.example`;
      await input.setInputFiles({
        name: "members.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(
          `name,username,email,role,billing,authentication\n"Harper, Lane",harper.${viewport.width},${importedEmail},RevOps,Active,SSO\nRowan Blake,rowan.${viewport.width},rowan.${viewport.width}@crm.bricklane.example,Support,Active,Passwordless`,
        ),
      });
      await expect(
        dialog.getByRole("status", { name: "CSV import preview", exact: true }),
      ).toContainText("2 records, 0 invalid");
      await expect(dialog.locator("tbody tr").filter({ hasText: "Harper, Lane" })).toHaveCount(1);
      await dialog.getByRole("button", { name: "Import 2 members", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await page.getByRole("textbox", { name: "Search members", exact: true }).fill(importedEmail);
      await expect(page.locator(".vp-members-table tbody tr")).toHaveCount(1);
      await expect(page.locator(".vp-members-table tbody tr")).toContainText("Harper, Lane");
      await sidebar(page, viewport.phone, "Billing");
      await expect(page.locator(".vp-usage-panel")).toContainText("11 of 14");
      await sidebar(page, viewport.phone, "Team Members");
      await expect(page.getByRole("textbox", { name: "Search members", exact: true })).toHaveValue(
        importedEmail,
      );
      await noOverflow(page);
      expect(writes).toEqual([]);
    });

    test("Manage plan validates seats, cancels drafts and updates live usage allowances", async ({
      page,
    }) => {
      const writes = observeWrites(page);
      await open(page, "/settings/billing");
      const trigger = page.getByRole("button", { name: "Manage plan", exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Manage demo plan", exact: true });
      await choose(page, "Plan", "Verve Starter");
      const seats = dialog.getByRole("textbox", { name: "Seats", exact: true });
      await seats.fill("5");
      await seats.press("Tab");
      await dialog.getByRole("button", { name: "Save demo plan", exact: true }).click();
      await expect(
        dialog.getByText("Choose 1 to 1000 seats, including at least 9 current members.", {
          exact: true,
        }),
      ).toBeVisible();
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page.locator(".vp-plan-copy")).toContainText("Verve Growth");
      await trigger.click();
      await expect(seats).toHaveValue("14");
      await choose(page, "Plan", "Verve Scale");
      await seats.fill("12");
      await seats.press("Tab");
      await dialog.getByRole("button", { name: "Save demo plan", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page.locator(".vp-plan-copy")).toContainText("Verve Scale");
      await expect(page.locator(".vp-usage-panel")).toContainText("9 of 12");
      const usageTrigger = page.getByRole("button", { name: "View usage", exact: true });
      await usageTrigger.click();
      const usage = page.getByRole("dialog", { name: "Workspace usage", exact: true });
      await expect(usage).toContainText("146,820 of 1,000,000");
      await expect(
        usage.getByRole("progressbar", { name: "Seats usage", exact: true }),
      ).toHaveAttribute("aria-valuenow", "75");
      await expect(usage).toContainText("$828");
      await usage.getByRole("button", { name: "Close", exact: true }).first().click();
      await expect(usage).toHaveCount(0);
      await expect(usageTrigger).toBeFocused();
      await noOverflow(page);
      expect(writes).toEqual([]);
    });

    test("Local subscription cancellation needs confirmation and can be resumed without changing members", async ({
      page,
    }) => {
      const writes = observeWrites(page);
      await open(page, "/settings/billing");
      await page.getByRole("button", { name: "Manage plan", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Manage demo plan", exact: true });
      const cancel = dialog.getByRole("button", { name: "Cancel demo subscription", exact: true });
      await cancel.click();
      const confirm = page.getByRole("alertdialog", {
        name: "Cancel local demo plan?",
        exact: true,
      });
      await confirm.getByRole("button", { name: "Keep plan", exact: true }).click();
      await expect(confirm).toHaveCount(0);
      await expect(cancel).toBeFocused();
      await cancel.click();
      await confirm
        .getByRole("button", { name: "Confirm local cancellation", exact: true })
        .click();
      await expect(confirm).toHaveCount(0);
      await expect(
        dialog.getByRole("button", { name: "Resume demo plan", exact: true }),
      ).toBeFocused();
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByText("Local demo plan is cancelled.", { exact: true })).toBeVisible();
      await sidebar(page, viewport.phone, "Team Members");
      await expect(page.locator(".vp-team-title [data-slot=badge]")).toHaveText("9");
      await sidebar(page, viewport.phone, "Billing");
      await expect(page.locator(".vp-plan-copy")).toContainText("Cancelled");
      await page.getByRole("button", { name: "Manage plan", exact: true }).click();
      await dialog.getByRole("button", { name: "Resume demo plan", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.locator(".vp-plan-copy")).toContainText("Active");
      expect(writes).toEqual([]);
    });

    test("Calendar demo provider and account validate, cancel, persist and disconnect with native focus", async ({
      page,
    }) => {
      const writes = observeWrites(page);
      await open(page, "/account/preferences");
      const trigger = page.getByRole("button", { name: "Connect demo calendar", exact: true });
      await trigger.press("Enter");
      const dialog = page.getByRole("dialog", { name: "Connect demo calendar", exact: true });
      const account = dialog.getByRole("textbox", { name: "Calendar account", exact: true });
      const originalAccount = await account.inputValue();
      await account.fill("bad");
      await dialog.getByRole("textbox", { name: "Calendar name", exact: true }).clear();
      await dialog.getByRole("button", { name: "Save local connection", exact: true }).click();
      await expect(
        dialog.getByText("Enter a valid calendar account email.", { exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByText("Enter a calendar name of 1 to 120 characters.", { exact: true }),
      ).toBeVisible();
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(account).toHaveValue(originalAccount);
      await choose(page, "Provider", "Microsoft Outlook");
      const email = `calendar.${viewport.width}@crm.bricklane.example`;
      await account.fill(email);
      await dialog
        .getByRole("textbox", { name: "Calendar name", exact: true })
        .fill("Sales follow-ups");
      await dialog.getByRole("button", { name: "Save local connection", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      const manage = page.getByRole("button", { name: "Manage demo calendar", exact: true });
      await expect(manage).toBeFocused();
      await expect(page.locator(".vs-preference-items")).toContainText(
        `Microsoft Outlook · ${email} · Sales follow-ups (local demo)`,
      );
      await page.getByRole("tab", { name: "Profile", exact: true }).click();
      await page.getByRole("tab", { name: "Preferences", exact: true }).click();
      await expect(manage).toBeVisible();
      const disconnect = page.getByRole("button", {
        name: "Disconnect demo calendar",
        exact: true,
      });
      await disconnect.click();
      const confirm = page.getByRole("alertdialog", {
        name: "Disconnect demo calendar?",
        exact: true,
      });
      await confirm.getByRole("button", { name: "Keep connected", exact: true }).click();
      await expect(confirm).toHaveCount(0);
      await expect(disconnect).toBeFocused();
      await disconnect.click();
      await confirm.getByRole("button", { name: "Disconnect locally", exact: true }).click();
      await expect(confirm).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(disconnect).toHaveCount(0);
      await expect(page.locator(".vs-preference-items")).toContainText(
        "Local calendar connection removed.",
      );
      await noOverflow(page);
      expect(writes).toEqual([]);
    });
  });
}
