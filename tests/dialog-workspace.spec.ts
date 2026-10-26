import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const entries = [
  { id: 6, launch: "Open app picker" },
  { id: 7, launch: "Open support hub" },
  { id: 8, launch: "Open collaborator invite" },
  { id: 9, launch: "Open project form" },
  { id: 10, launch: "Open account settings" },
];
const route = (id: number) => `./#/preview/application/dialog/dialog-${id}`;
async function open(page: import("@playwright/test").Page, id: number) {
  await page.goto(route(id));
  await page
    .getByRole("button", { name: entries.find((entry) => entry.id === id)!.launch, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
for (const width of [1440, 390]) {
  test(`five workspace dialogs fit ${width}px and restore launcher focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const entry of entries) {
      await page.goto(route(entry.id));
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.getByRole("button", { name: entry.launch, exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect
        .poll(async () => {
          const bounds = await dialog.boundingBox();
          return (
            !!bounds &&
            bounds.x >= 0 &&
            bounds.y >= 0 &&
            bounds.x + bounds.width <= width &&
            bounds.y + bounds.height <= 844
          );
        })
        .toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole("button", { name: entry.launch, exact: true })).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}
test("app search retains the one selected checkbox across empty results and saves locally", async ({
  page,
}) => {
  await open(page, 6);
  await expect(page.getByRole("textbox", { name: "Search integrations" })).toBeFocused();
  await expect(page.getByRole("checkbox")).toHaveCount(12);
  await expect(page.getByRole("button", { name: "Add app", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: "Claude", exact: true }).check();
  await page.getByRole("checkbox", { name: "OpenAI", exact: true }).check();
  await expect(page.getByRole("checkbox", { name: "Claude", exact: true })).not.toBeChecked();
  await page.getByRole("textbox", { name: "Search integrations" }).fill("not-a-provider");
  await expect(page.getByText("No apps match", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add app", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("OpenAI selected locally");
  await expect(page.getByRole("alert")).toContainText("no OAuth permission");
});
test("support routes expose guides, editable feedback and a local session draft", async ({
  page,
}) => {
  await open(page, 7);
  await page.getByRole("button", { name: "Open guides", exact: true }).click();
  await expect(page.getByRole("button", { name: "Back to support", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to support", exact: true }).click();
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await page.getByLabel("Subject", { exact: true }).fill("QA feedback");
  await page.locator("#support-draft-message").fill("Improve project onboarding.");
  await page.getByRole("button", { name: "Save local draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("QA feedback");
  await page.getByRole("button", { name: "Reserve a session", exact: true }).click();
  await page.getByRole("button", { name: "Save session draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("No appointment was booked");
});
test("per-person invitations validate, block duplicate roles and retain actual row roles", async ({
  page,
}) => {
  await open(page, 8);
  await page.getByLabel("Email address for invite 1", { exact: true }).fill("bad");
  await expect(page.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send invitations", exact: true })).toBeDisabled();
  await page.getByLabel("Email address for invite 1", { exact: true }).fill("qa@example.com");
  await page.getByRole("button", { name: "Add new member", exact: true }).click();
  await page.getByLabel("Email address for invite 2", { exact: true }).fill("QA@example.com");
  await expect(page.getByRole("button", { name: "Send invitations", exact: true })).toBeDisabled();
  await page.getByLabel("Email address for invite 2", { exact: true }).fill("review@example.com");
  await page.getByRole("combobox", { name: "Role for invite 2", exact: true }).click();
  await page
    .getByRole("option", { name: "Reviewer Comment and approve work.", exact: true })
    .click();
  await page.getByRole("button", { name: "Send invitations", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("review@example.com");
  await expect(page.getByRole("alert")).toContainText("Reviewer");
});
test("actual free project pickers change status, filter members and clear labels", async ({
  page,
}) => {
  await open(page, 9);
  await page.getByLabel("Project name", { exact: true }).fill("QA release");
  await page.locator("#workspace-project-status").click();
  await page.getByRole("option", { name: "Completed", exact: true }).click();
  await page.locator("#workspace-project-members").click();
  const memberSearch = page.getByPlaceholder("Select members");
  await expect(memberSearch).toHaveAttribute("aria-expanded", "true");
  await expect(memberSearch).toBeFocused();
  await memberSearch.fill("no assigned users");
  await page.getByRole("option", { name: "No assigned users", exact: true }).click();
  await page.locator("#workspace-project-members").click();
  // The native popup retains its closing input until its exit animation ends.
  // Wait for that input to unmount before opening the next search instance.
  await expect(memberSearch).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create project", exact: true })).toBeDisabled();
  await page.locator("#workspace-project-members").click();
  await expect(memberSearch).toHaveAttribute("aria-expanded", "true");
  await expect(memberSearch).toBeFocused();
  await memberSearch.fill("Maya");
  await expect(memberSearch).toHaveValue("Maya");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.getByRole("option", { name: /Maya Stone/ }).click();
  await page.locator("#workspace-project-members").click();
  await expect(memberSearch).toHaveCount(0);
  await page.locator("#workspace-project-labels").click();
  const labelSearch = page.getByPlaceholder("Select labels");
  await expect(labelSearch).toHaveAttribute("aria-expanded", "true");
  await expect(labelSearch).toBeFocused();
  await labelSearch.fill("No label");
  await page.getByRole("option", { name: "No label", exact: true }).click();
  await page.locator("#workspace-project-labels").click();
  await expect(labelSearch).toHaveCount(0);
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("No labels");
  await expect(page.getByRole("alert")).toContainText("QA release");
  await expect(page.getByRole("alert")).toContainText("completed");
  await expect(page.getByRole("alert")).toContainText("1 owners");
});
test("cover upload uses the official hook's real type validation and local File", async ({
  page,
}) => {
  await open(page, 9);
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("bad"),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  await input.setInputFiles({
    name: "qa-cover.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="teal"/></svg>',
    ),
  });
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("qa-cover.svg");
});
test("settings keep values across all five tabs and save actual local switches", async ({
  page,
}) => {
  await open(page, 10);
  await page.getByLabel("Full Name", { exact: true }).fill("QA reviewer");
  await page.locator("#workspace-settings-email").fill("invalid");
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
  await page.locator("#workspace-settings-email").fill("qa@example.com");
  await expect(page.getByText("Unverified draft", { exact: true })).toBeVisible();
  for (const name of ["Workspace", "Team", "Billing", "Preferences", "Profile"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    if (name === "Team")
      await page.getByRole("switch", { name: "Member Invites", exact: true }).check();
  }
  await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue("QA reviewer");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("QA reviewer");
  await expect(page.getByRole("alert")).toContainText("Member invites: On");
});
for (const [index, module] of ["apps", "support-hub", "invites", "project", "settings"].entries()) {
  test(`dialog ${index + 6} source defaults to actual workspace module`, async ({ page }) => {
    await page.goto(`./#/block/application/dialog/dialog-${index + 6}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      `src/blocks/application/dialog-variants/workspace/${module}.tsx`,
    );
  });
}
test("actual project ZIP includes upstream BaseUI combobox, free adapters and original artwork", async ({
  page,
}) => {
  await page.goto("./#/block/application/dialog/dialog-9");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const files = unzipSync(new Uint8Array(await readFile((await (await pending).path())!)));
  for (const path of [
    "src/components/ui/combobox.tsx",
    "src/components/ui/kbd.tsx",
    "src/hooks/use-file-upload.ts",
    "src/blocks/application/dialog-variants/workspace/free/members-picker.tsx",
    "src/lib/demo-artwork.ts",
    "src/components/reui/REUI-LICENSE.txt",
  ])
    expect(files[path], path).toBeDefined();
  expect(strFromU8(files["src/components/ui/combobox.tsx"])).toContain("@base-ui/react");
  expect(
    strFromU8(files["src/blocks/application/dialog-variants/workspace/free/members-picker.tsx"]),
  ).toContain("c-combobox-24");
});

test("mobile settings upload survives tab changes, remove clears it, and the fixed footer remains reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await open(page, 10);
  const file = {
    name: "qa-avatar.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="24" fill="teal"/></svg>',
    ),
  };
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await page.getByRole("tab", { name: "Team", exact: true }).click();
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("img")).toHaveAttribute("src", /^blob:/);
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("img")).toHaveCount(0);
  const footer = await page.locator(".workspace-settings-footer").boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(640);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Photo: None");
});
