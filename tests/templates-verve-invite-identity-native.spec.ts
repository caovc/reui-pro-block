import { expect, test } from "@playwright/test";

test("Verve invites with the same email local-part receive distinct editable usernames", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !["GET", "HEAD"].includes(request.method()))
      writes.push(`${request.method()} ${request.url()}`);
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/verve/settings/team?native=invite-identity");
  const add = page.getByRole("button", { name: "Add member", exact: true });
  await add.click();
  const invite = page.getByRole("dialog", { name: "Add member", exact: true });
  const input = invite.locator("#verve-invite-email");
  const emails = ["shared.name@north.bricklane.example", "shared.name@south.bricklane.example"];
  for (const email of emails) {
    await input.fill(email);
    await input.press("Enter");
  }
  await invite.getByRole("button", { name: "Send invites", exact: true }).click();
  await expect(invite).toHaveCount(0);
  await expect(add).toBeFocused();
  const search = page.getByRole("textbox", { name: "Search members", exact: true });
  await search.fill("shared.name@");
  const rows = page.locator(".vp-members-table tbody tr");
  await expect(rows).toHaveCount(2);
  for (const [index, email] of emails.entries()) {
    const username = index === 0 ? "shared.name" : "shared.name-2";
    const row = rows.filter({ hasText: email });
    await expect(row).toHaveCount(1);
    await expect(row.locator(".vp-member-identity small")).toHaveText(username);
    const view = row.getByRole("button", { name: /^View / });
    await view.press("Enter");
    const details = page.getByRole("dialog", { name: "Member details", exact: true });
    await expect(details).toContainText(email);
    await expect(
      details
        .getByRole("definition")
        .filter({ hasText: new RegExp(`^${username.replaceAll(".", "\\.")}$`) }),
    ).toHaveCount(1);
    await details.getByRole("button", { name: "Close", exact: true }).first().click();
    await expect(details).toHaveCount(0);
    await expect(view).toBeFocused();
    const edit = row.getByRole("button", { name: /^Edit / });
    await edit.click();
    const dialog = page.getByRole("dialog", { name: "Edit member", exact: true });
    await expect(dialog.getByRole("textbox", { name: "Username", exact: true })).toHaveValue(
      username,
    );
    await dialog
      .getByRole("textbox", { name: "Full name", exact: true })
      .fill(index === 0 ? "Shared North" : "Shared South");
    await dialog.getByRole("button", { name: "Save member", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(row).toContainText(index === 0 ? "Shared North" : "Shared South");
    await expect(row.locator(".vp-member-identity small")).toHaveText(username);
  }
  // The unchanged exact-email duplicate guard still rejects a second invitation.
  await add.click();
  await input.fill(emails[0]);
  await input.press("Enter");
  await invite.getByRole("button", { name: "Send invites", exact: true }).click();
  await expect(
    invite.getByText("Remove duplicate or existing member addresses.", { exact: true }),
  ).toBeVisible();
  await invite.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(invite).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(rows).toHaveCount(2);
  expect(writes).toEqual([]);
});
